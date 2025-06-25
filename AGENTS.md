# Guidelines for Codex

This repository contains a Python backend (FastAPI) and a React + TypeScript frontend. The
following conventions help ensure consistent contributions.

## Environment Setup
- Use **Python 3.11** with [Poetry](https://python-poetry.org/) for dependency management.
  Install dependencies via:
  ```bash
  poetry install
  ```
- The frontend resides in `frontend/` and uses Node 18. Install dependencies with:
  ```bash
  cd frontend && yarn && cd ..
  ```

## Development Commands
- Start the backend server during development with:
  ```bash
  uvicorn weaviate_ui.main:app --reload --host 0.0.0.0 --port 7777
  ```
- Build the frontend for production with:
  ```bash
  cd frontend && yarn build && cd ..
  ```
  The build output will be placed in `frontend/dist` and copied into the Docker image as
  `static/` when building the container.

## Style
- Format Python code using `black` with default settings before committing:
  ```bash
  black .
  ```
- Format TypeScript/JavaScript files with [Prettier](https://prettier.io/) (no
  configuration file is provided; default options are fine):
  ```bash
  npx prettier -w frontend/src
  ```

## Testing
- This project currently has **no automated tests**. If you add tests in the
  future, place them in the `tests/` directory and run them with `pytest`:
  ```bash
  pytest
  ```

## Commit Messages
- Keep commit messages concise. Start with a short summary on the first line,
  followed by a blank line and additional details if necessary.

