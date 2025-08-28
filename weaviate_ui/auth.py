import os
import time
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, Header
from jose import jwt
from jose.utils import base64url_decode
from loguru import logger


class AzureADConfig:
    def __init__(self) -> None:
        tenant = os.getenv("AZURE_AD_TENANT_ID", "common").strip()
        self.client_id = os.getenv("AZURE_AD_CLIENT_ID", "").strip()
        # If you use a separate backend App Registration, set AZURE_AD_AUDIENCE to that app id or application ID URI.
        self.audience = os.getenv("AZURE_AD_AUDIENCE", self.client_id).strip()
        # Issuer format for v2.0 endpoint
        self.issuer = f"https://login.microsoftonline.com/{tenant}/v2.0"
        self.jwks_uri = (
            f"https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"
        )


_cfg = AzureADConfig()
_jwks_cache: Dict[str, Any] | None = None
_jwks_cache_ts: float = 0.0
_jwks_ttl_secs = 24 * 3600


async def _get_jwks() -> Dict[str, Any]:
    global _jwks_cache, _jwks_cache_ts
    now = time.time()
    if _jwks_cache and (now - _jwks_cache_ts) < _jwks_ttl_secs:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(_cfg.jwks_uri)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cache_ts = now
        return _jwks_cache


def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return parts[1]


async def validate_jwt(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates an Azure AD (v2.0) JWT (ID token or access token) and returns claims.
    Audience defaults to AZURE_AD_AUDIENCE (or AZURE_AD_CLIENT_ID if not set).
    """
    token = _extract_bearer(authorization)
    try:
        # Decode header to get kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header")

        jwks = await _get_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            # Cache miss or rotated keys; force refresh once
            _jwks_cache_ts = 0  # type: ignore
            jwks = await _get_jwks()
            keys = jwks.get("keys", [])
            key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Signing key not found")

        # Verify signature, audience, issuer; accepts RS256 (default)
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=_cfg.audience or None,
            issuer=_cfg.issuer,
            options={
                # Accept both access tokens and ID tokens (aud differs by setup).
                # Time validation kept default.
            },
        )
        return claims
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("JWT validation failed: {}", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")

