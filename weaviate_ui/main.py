import os

import weaviate
from dotenv import load_dotenv
from fastapi import FastAPI
from loguru import logger
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from weaviate.classes.init import Auth

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

    collection = client.collections.get(class_name)
    tenant_collection = collection
    if tenant:
        try:
            conf = collection.config.get(simple=True)
            if getattr(conf.multi_tenancy_config, "enabled", False):
                tenant_collection = collection.with_tenant(tenant)
            else:
                logger.warning(
                    f"Tenant '{tenant}' ignored for class '{class_name}' which does not enable multi-tenancy"
                )
        except Exception:
            logger.warning(f"Tenant '{tenant}' ignored for class '{class_name}'")
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


app.mount("/", StaticFiles(directory="static", html=True), name="static")
