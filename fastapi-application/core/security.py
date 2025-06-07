from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


# -----------------------------
# Пароли
# -----------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# -----------------------------
# Access Token
# -----------------------------

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.security.access_token_expire_minutes))
    to_encode.update({
        "exp": expire,
        "scope": "access_token"
    })
    return jwt.encode(to_encode, settings.security.secret_key, algorithm=ALGORITHM)


# -----------------------------
# Refresh Token
# -----------------------------

def create_refresh_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.security.refresh_token_expire_days))
    to_encode.update({
        "exp": expire,
        "scope": "refresh_token"
    })
    return jwt.encode(to_encode, settings.security.secret_key, algorithm=ALGORITHM)


# -----------------------------
# Декодирование и проверка токенов
# -----------------------------

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.security.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None


# -----------------------------
# Токен сброса пароля
# -----------------------------

def create_password_reset_token(user_id: int, expires_minutes: int = 60) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "scope": "password_reset"
    }
    return jwt.encode(payload, settings.security.secret_key, algorithm=ALGORITHM)

def verify_password_reset_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.security.secret_key, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset":
            return None
        return int(payload.get("sub"))
    except JWTError:
        return None
