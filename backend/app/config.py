from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    app_name: str = "ChessForgeAI Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/chessforge")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Lichess API
    lichess_api_base_url: str = "https://lichess.org/api"
    lichess_user_agent: str = "ChessForgeAI/1.0"
    
    # Stockfish
    stockfish_path: str = os.getenv("STOCKFISH_PATH", "/usr/local/bin/stockfish")
    stockfish_threads: int = 4
    stockfish_hash_size: int = 128
    
    # Celery
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    celery_result_backend: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "https://chessforgeai.vercel.app"]
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
