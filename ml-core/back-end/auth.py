import os
from datetime import datetime, timedelta
from typing import Optional

import redis
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

# Import models & DB session from your db module
from db import PatientdataModel, UserModel, get_db

load_dotenv(verbose=True)
SecretKey = os.getenv("secret_key") or os.getenv("SECRET_KEY") or "default_secret_key"
Algorithm = os.getenv("Algorithm") or "HS256"
Access_Time = int(os.getenv("access_time", "1440"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


class Token(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    user: Optional[UserModel] = None


class tokeData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    user: Optional[UserModel] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback for any legacy format
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return ctx.verify(plain_password[:72], hashed_password)
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def delete_user_account(user_id: int, db: Session, username: Optional[str] = None) -> bool:
    """
    Deletes user records from PostgreSQL (patient data + user account)
    and removes all associated cached keys from Redis.
    """
    try:
        # 1. Delete patient records first (to satisfy foreign key constraints)
        db.query(PatientdataModel).filter(PatientdataModel.user_id == user_id).delete()
        # 2. Delete user
        db.query(UserModel).filter(UserModel.id == user_id).delete()
        db.commit()

        # 3. Delete all user-specific data from Redis
        try:
            r_sync = redis.from_url(REDIS_URL, decode_responses=True)
            patterns = [
                f"user:{user_id}:*",
                f"pred:{user_id}:*",
                f"session:{user_id}:*",
                f"token:{user_id}:*",
            ]
            if username:
                patterns.extend([
                    f"user:{username}:*",
                    f"pred:{username}:*",
                    f"token:{username}:*",
                ])

            for pattern in patterns:
                keys = r_sync.keys(pattern)
                if keys:
                    r_sync.delete(*keys)
                    print(f"🗑️ Deleted {len(keys)} Redis keys for pattern: {pattern}")
        except Exception as redis_err:
            print(f"⚠️ Redis cleanup warning: {redis_err}")

        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting account: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=Access_Time))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SecretKey, algorithm=Algorithm)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SecretKey, algorithm=Algorithm)


def get_user_current(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SecretKey, algorithms=[Algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(
            status_code=401, detail="Could not validate credentials"
        )
    return user
