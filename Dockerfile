# ---- Install node ----
FROM node:18 as frontend
WORKDIR /app

# Accept Vite/MSAL envs at build time for the SPA
ARG VITE_AZURE_AD_CLIENT_ID
ARG VITE_AZURE_AD_TENANT_ID=common
ARG VITE_AUTH_REDIRECT_URI
ENV VITE_AZURE_AD_CLIENT_ID=XXX
ENV VITE_AZURE_AD_TENANT_ID=XXX
ENV VITE_AUTH_REDIRECT_URI=http://localhost:7777

COPY ./frontend .

RUN yarn
RUN yarn build

# ---- Install poetry ----
FROM python:3.11-slim as build

ENV POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app
COPY pyproject.toml  ./

RUN pip install poetry
RUN poetry install --no-interaction --no-ansi

COPY --from=frontend /app/dist /app/static
COPY . .

CMD ["uvicorn", "weaviate_ui.main:app", "--host", "0.0.0.0", "--port", "7777"]
