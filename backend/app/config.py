from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "change_me"
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_MIN: int = 720

    class Config:
        env_file = ".env"

settings = Settings()