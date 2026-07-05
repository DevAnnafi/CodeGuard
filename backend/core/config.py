from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    environment: str = "development"
    max_tokens: int = 4096
    database_url: str = "postgresql://localhost/codeguard"
    jwt_secret_key: str = "changeme-use-a-real-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

settings = Settings()