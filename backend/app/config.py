from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ChessForgeAI Backend"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins: list = ["*"]

settings = Settings()
