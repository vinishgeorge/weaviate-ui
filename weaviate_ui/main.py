import os

import weaviate
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from loguru import logger
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from weaviate.classes.init import Auth
from pydantic import BaseModel
from uuid import uuid4
from typing import Any, Dict

load_dotenv(override=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEAVIATE_HOST = os.getenv("WEAVIATE_HOST")
WEAVIATE_PORT = int(os.getenv("WEAVIATE_PORT"))
WEAVIATE_SECURE = bool(os.getenv("WEAVIATE_SECURE"))  # False if empty
WEAVIATE_GRPC_HOST = os.getenv("WEAVIATE_GRPC_HOST")
WEAVIATE_GRPC_PORT = int(os.getenv("WEAVIATE_GRPC_PORT"))
WEAVIATE_GRPC_SECURE = bool(os.getenv("WEAVIATE_GRPC_SECURE"))  # False if empty
WEAVIATE_USERNAME = os.getenv("WEAVIATE_USERNAME")
WEAVIATE_PASSWORD = os.getenv("WEAVIATE_PASSWORD")
WEAVIATE_AUTH_CREDENTIALS = os.getenv("WEAVIATE_AUTH_CREDENTIALS")
logger.info(
    f"Connecting to Weaviate at {WEAVIATE_HOST}:{WEAVIATE_PORT} with secure={WEAVIATE_SECURE}"
)
# client = weaviate.connect_to_custom(
#     http_host=WEAVIATE_HOST,
#     http_port=WEAVIATE_PORT,
#     http_secure=WEAVIATE_SECURE,
#     grpc_host=WEAVIATE_GRPC_HOST,
#     grpc_port=WEAVIATE_GRPC_PORT,
#     grpc_secure=WEAVIATE_GRPC_SECURE,
#     # auth_credentials=WEAVIATE_AUTH_CREDENTIALS,
#     auth_credentials=Auth.api_key(WEAVIATE_PASSWORD),
# )
client = weaviate.connect_to_custom(
    http_host=WEAVIATE_HOST,
    http_port=WEAVIATE_PORT,
    http_secure=WEAVIATE_SECURE,
    grpc_host=WEAVIATE_GRPC_HOST,
    grpc_port=WEAVIATE_GRPC_PORT,
    grpc_secure=WEAVIATE_GRPC_SECURE,
    auth_credentials=Auth.api_key(WEAVIATE_AUTH_CREDENTIALS),
)


@app.get("/schema")
def schema():
    return client.collections.list_all()


@app.get("/class/{class_name}/tenants")
def get_tenants(class_name: str):
    collection = client.collections.get(class_name)
    try:
        tenants = collection.tenants.get()
    except Exception:
        tenants = []
    return {"tenants": list(tenants) if tenants else []}


@app.post("/class/{class_name}")
def get_class_data(
    class_name: str,
    offset: int = 0,
    limit: int = 20,
    keyword: str = "",
    certainty: float = 0.65,
    properties: list[str] | None = None,
    tenant: str | None = None,
):
    logger.info(keyword)
    logger.info(
        f"Fetching data for class '{class_name}' with keyword '{keyword}' and tenant '{tenant}'"
    )
    collection = client.collections.get(class_name)
    tenant_collection = collection
    if tenant:
        try:
            conf = collection.config.get()
            is_enabled = conf.multi_tenancy_config.enabled
            print(f"Multi-tenancy enabled: {is_enabled}")
            if is_enabled:
                tenant_collection = collection.with_tenant(tenant)
            else:
                logger.warning(
                    f"Tenant '{tenant}' ignored for class '{class_name}' which does not enable multi-tenancy"
                )
        except Exception as e:
            logger.error(
                f"Error fetching multi-tenancy config for class '{class_name}': {e}"
            )
    paginate = {"limit": limit, "offset": offset}

    if keyword:
        query = {"query": keyword, "certainty": certainty}
        metadata = {"return_metadata": ["certainty", "distance"]}
        response = tenant_collection.query.near_text(**query, **metadata, **paginate)
        count_response = tenant_collection.aggregate.near_text(
            total_count=True, **query
        )
    else:
        response = tenant_collection.query.fetch_objects(**paginate)
        count_response = tenant_collection.aggregate.over_all(total_count=True)

    return {"data": response.objects, "count": count_response.total_count}


class ObjectPayload(BaseModel):
    uuid: str | None = None
    properties: Dict[str, Any]


def _collection_with_tenant(class_name: str, tenant: str | None):
    collection = client.collections.get(class_name)
    if tenant:
        collection = collection.with_tenant(tenant)
    return collection


@app.get("/class/{class_name}/object/{object_id}")
def get_object(class_name: str, object_id: str, tenant: str | None = None):
    collection = _collection_with_tenant(class_name, tenant)
    try:
        return collection.data.get(object_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/class/{class_name}/object")
def insert_object(class_name: str, payload: ObjectPayload, tenant: str | None = None):
    collection = _collection_with_tenant(class_name, tenant)
    uid = payload.uuid or str(uuid4())
    try:
        collection.data.insert(payload.properties, uuid=uid)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"uuid": uid}


@app.put("/class/{class_name}/object/{object_id}")
def update_object(
    class_name: str,
    object_id: str,
    properties: Dict[str, Any],
    tenant: str | None = None,
):
    collection = _collection_with_tenant(class_name, tenant)
    try:
        collection.data.update(object_id, properties)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"uuid": object_id}


@app.delete("/class/{class_name}/object/{object_id}")
def delete_object(class_name: str, object_id: str, tenant: str | None = None):
    collection = _collection_with_tenant(class_name, tenant)
    try:
        collection.data.delete(object_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"uuid": object_id}


@app.delete("/class/{class_name}")
def delete_class(class_name: str):
    try:
        client.collections.delete(class_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"class_name": class_name}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
