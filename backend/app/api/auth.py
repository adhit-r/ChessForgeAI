from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import structlog

from app.database.database import get_db
from app.database.models import User
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user_from_token
from app.services.lichess_service import fetch_user_games_task

logger = structlog.get_logger()
router = APIRouter()
security = HTTPBearer()


# Pydantic models
class UserRegistration(BaseModel):
    email: EmailStr
    lichess_username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    message: Optional[str] = None


class UserProfile(BaseModel):
    id: int
    email: str
    lichess_username: Optional[str]
    subscription_tier: str
    created_at: str


# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    user_data = get_current_user_from_token(credentials.credentials)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """Register a new user and start game analysis"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            lichess_username=user_data.lichess_username,
            password_hash=hashed_password
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        token_data = {
            "user_id": new_user.id,
            "email": new_user.email,
            "lichess_username": new_user.lichess_username
        }
        access_token = create_access_token(data=token_data)
        
        # Start background game fetching
        fetch_user_games_task.delay(new_user.id, user_data.lichess_username)
        
        logger.info("User registered successfully", user_id=new_user.id, email=user_data.email)
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=new_user.id,
            message="Registration successful. Game analysis started."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Registration failed", error=str(e), email=user_data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return token"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "lichess_username": user.lichess_username
        }
        access_token = create_access_token(data=token_data)
        
        logger.info("User logged in successfully", user_id=user.id, email=user.email)
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e), email=user_data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        lichess_username=current_user.lichess_username,
        subscription_tier=current_user.subscription_tier,
        created_at=current_user.created_at.isoformat()
    )


@router.post("/refresh-games")
async def refresh_games(current_user: User = Depends(get_current_user)):
    """Trigger refresh of user's games from Lichess"""
    try:
        if not current_user.lichess_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Lichess username associated with account"
            )
        
        # Start background game fetching
        fetch_user_games_task.delay(current_user.id, current_user.lichess_username)
        
        logger.info("Game refresh triggered", user_id=current_user.id)
        
        return {"message": "Game refresh started successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Game refresh failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start game refresh. Please try again."
        )
