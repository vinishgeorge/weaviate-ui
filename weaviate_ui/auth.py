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
        # Audience can be the same as the SPA Client ID, or an API App's
        # Application ID URI (e.g. api://<GUID>) or API client ID.
        raw_aud = os.getenv("AZURE_AD_AUDIENCE", "").strip()
        # If AZURE_AD_AUDIENCE is unset, default to the SPA client id to
        # allow using ID tokens for simple setups.
        self.audience = raw_aud or self.client_id
        # Issuer format for v2.0 endpoint
        self.issuer = f"https://login.microsoftonline.com/{tenant}/v2.0"
        self.openid_config = (
            f"https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration"
        )
        self.jwks_uri = (
            f"https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"
        )


_cfg = AzureADConfig()
_jwks_cache: Dict[str, Any] | None = None
_jwks_cache_ts: float = 0.0
_jwks_ttl_secs = 24 * 3600


async def _get_jwks(jwks_uri: Optional[str] = None) -> Dict[str, Any]:
    global _jwks_cache, _jwks_cache_ts
    now = time.time()
    if jwks_uri is None and _jwks_cache and (now - _jwks_cache_ts) < _jwks_ttl_secs:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(jwks_uri or _cfg.jwks_uri)
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
        # Unverified header and claims to discover issuer and kid
        header = jwt.get_unverified_header(token)
        unverified_claims = jwt.get_unverified_claims(token)
        kid = header.get("kid") or header.get("x5t")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header")

        # Resolve JWKS from token issuer when available
        jwks_uri = _cfg.jwks_uri
        issuer = unverified_claims.get("iss")
        try:
            if isinstance(issuer, str) and issuer.startswith("https://"):
                async with httpx.AsyncClient(timeout=10) as client:
                    oc = await client.get(
                        issuer.rstrip("/") + "/.well-known/openid-configuration"
                    )
                    if oc.status_code == 200:
                        jwks_uri = oc.json().get("jwks_uri", jwks_uri)
        except Exception:
            # Fall back silently to default jwks
            pass

        logger.debug(
            "JWT header alg={}, kid/x5t={}, iss={}, aud={}, using jwks_uri={}",
            header.get("alg"),
            kid,
            issuer,
            unverified_claims.get("aud"),
            jwks_uri,
        )

        jwks = await _get_jwks(jwks_uri)
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid or k.get("x5t") == kid), None)
        if not key:
            # Cache miss or rotated keys; force refresh once
            _jwks_cache_ts = 0  # type: ignore
            jwks = await _get_jwks(jwks_uri)
            keys = jwks.get("keys", [])
            key = next((k for k in keys if k.get("kid") == kid or k.get("x5t") == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Signing key not found")

        alg = header.get("alg") or "RS256"
        audience_param: Optional[str] = _cfg.audience or _cfg.client_id or None
        # if _cfg.audience:
        #     acceptable_audiences.append(_cfg.audience)
        # if _cfg.client_id and _cfg.client_id not in acceptable_audiences:
        #     acceptable_audiences.append(_cfg.client_id)

        # Prefer the token issuer for claim verification
        verify_issuer = issuer or _cfg.issuer

        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=[alg],
                audience=audience_param,
                issuer=verify_issuer,
                options={"verify_at_hash": False},
            )
        except Exception as sig_err:
            # If signature verification fails with the selected key, try all JWKS keys
            # from the same issuer (handles rare kid/x5t mismatches or rotations).
            for idx, k in enumerate(keys):
                try:
                    claims = jwt.decode(
                        token,
                        key,
                        algorithms=[alg],
                        audience=audience_param,
                        issuer=verify_issuer,
                        options={"verify_at_hash": False},
                    )
                    logger.warning(
                        "JWT verified using fallback JWKS key index={} kid={} x5t={}",
                        idx,
                        k.get("kid"),
                        k.get("x5t"),
                    )
                    break
                except Exception:
                    continue
            else:
                raise sig_err
        return claims
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("JWT validation failed: {}", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")
