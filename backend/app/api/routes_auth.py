from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from core.database import get_db
from services.auth_service import (
    register_user, authenticate_user,
    create_token_for_user, get_user_by_email, get_user_by_username
)

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(db, request.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user = register_user(db, request.email, request.username, request.password)
    token = create_token_for_user(user)
    return AuthResponse(access_token=token, username=user.username, email=user.email)

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token_for_user(user)
    return AuthResponse(access_token=token, username=user.username, email=user.email)

@router.get("/me")
def me(db: Session = Depends(get_db)):
    pass