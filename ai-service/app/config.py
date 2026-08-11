import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "CPI AI Service"
    API_V1_STR: str = "/api/v1"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-lite-001:free"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "google/gemini-2.0-flash-lite-001:free"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Timeout & Retry configs
    REQUEST_TIMEOUT: float = 30.0
    MAX_RETRIES: int = 3
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
