# Weaviate-UI

![screenshot](screenshot.png)

Weaviate-UI is a web client for interacting with the Weaviate.

## Features

- Schema query
- Data search

## Usage V4

See `compose.yml` and adjust environment variables to your need. By default it will look for a locally hosted weaviate on the default 8080 port. Set `WEAVIATE_AUTH_CREDENTIALS` if authentication is required.

```bash
$ docker-compose up
```

## Usage V3

```bash
$ docker run -e WEAVIATE_URL=http://localhost:8091 -e WEAVIATE_API_KEYS=secret naaive/weaviate-ui:latest
```

## Contribution

Any form of contribution is welcome, including but not limited to submitting bug reports, proposing new features, improving code, etc.
