# Weaviate-UI

![screenshot](screenshot.png)

Weaviate-UI is a web client for interacting with the Weaviate.

## Features

- Browse the schema and inspect classes
- Perform semantic or keyword data searches
- View and manage objects (create, update and delete)
- Multi-tenant aware with tenant selection

## Local Development

1. Install backend dependencies:

   ```bash
   poetry install
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   yarn
   cd ..
   ```

3. Start the backend server:

   ```bash
   uvicorn weaviate_ui.main:app --reload --host 0.0.0.0 --port 7777
   ```

4. In another terminal start the frontend development server:

   ```bash
   cd frontend
   yarn dev
   ```

5. Build the frontend for production:

   ```bash
   cd frontend
   yarn build
   ```

## Usage V4

See `compose.yml` and adjust environment variables as needed. By default it connects to a locally hosted Weaviate on port 8080. Set `WEAVIATE_AUTH_CREDENTIALS` if authentication is required.

```bash
$ docker-compose up
```

## Usage V3

```bash
$ docker run -e WEAVIATE_URL=http://localhost:8091 -e WEAVIATE_API_KEYS=secret naaive/weaviate-ui:latest
```

## Contribution

Any form of contribution is welcome, including but not limited to submitting bug reports, proposing new features, improving code, etc.
