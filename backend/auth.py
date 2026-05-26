from fastapi import Header, HTTPException
from firebase_admin import auth


async def verify_token(authorization: str = Header(...)) -> str:
    """Extract and verify Firebase ID token, return user_id."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header.")
    token = authorization.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(401, "Invalid or expired token.")