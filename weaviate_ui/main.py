import os

import weaviate
from dotenv import load_dotenv
from fastapi import FastAPI
from loguru import logger
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from weaviate.classes.init import Auth

load_dotenv(override=True)
print('../.env********************************************', os.getenv("WEAVIATE_HOST"))

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
print(
    f"Connecting to Weaviate at {WEAVIATE_HOST}:{WEAVIATE_PORT} with secure={WEAVIATE_SECURE}"
)
print(f"password: {WEAVIATE_PASSWORD}")
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
    auth_credentials=Auth.api_key(
                    WEAVIATE_AUTH_CREDENTIALS
                ),
)


@app.get("/schema")
def schema():
    return client.collections.list_all()


@app.get("/class/{class_name}/tenants")
def get_tenants(class_name: str):
    collection = client.collections.get(class_name)
    tenants = collection.tenants.get()
    return {"tenants": list(tenants) if tenants else []}


@app.post("/class/{class_name}")
def get_class_data(
    class_name: str,
    offset: int = 0,
    limit: int = 20,
    keyword: str = "",
    certainty: float = 0.65,
    properties: list[str] | None = None,
    tenant: str = "4",
):
    logger.info(keyword)

    collection = client.collections.get(class_name).with_tenant(tenant)
    # tenant = collection.with_tenant(tenant)
    paginate = {"limit": limit, "offset": offset}

    if keyword:
        query = {"query": keyword, "certainty": certainty}
        metadata = {"return_metadata": ["certainty", "distance"]}
        response = tenant.query.near_text(**query, **metadata, **paginate)
        count_response = collection.aggregate.near_text(total_count=True, **query)
    else:
        response = collection.query.fetch_objects(**paginate)
        count_response = collection.aggregate.over_all(total_count=True)

    return {"data": response.objects, "count": count_response.total_count}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
