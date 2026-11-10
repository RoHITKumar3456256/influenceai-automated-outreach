from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "InfluenceAI API"
    app_env: str = "development"
    outreach_mode: str = "simulation"
    
    # API Keys
    youtube_api_key: str = ""
    gemini_api_key: str = ""
    
    # Supabase / Database
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    database_url: str = "sqlite:///./influenceai.db"
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.cors_origins:
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
