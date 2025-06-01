import logging
from typing import Literal
from pydantic import AmqpDsn, BaseModel, PostgresDsn, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

LOG_DEFAULT_FORMAT = (
    "[%(asctime)s.%(msecs)03d] %(module)10s:%(lineno)-3d %(levelname)-7s - %(message)s"
)


class RunConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000


class GunicornConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    timeout: int = 900


class LoggingConfig(BaseModel):
    log_level: Literal["debug", "info", "warning", "error", "critical"] = "info"
    log_format: str = LOG_DEFAULT_FORMAT

    @property
    def log_level_value(self) -> int:
        return logging.getLevelNamesMapping()[self.log_level.upper()]


class ApiV1Prefix(BaseModel):
    prefix: str = "/v1"
    users: str = "/users"
    products: str = "/products"
    auth: str = "/auth"
    orders: str = "/orders"
    carts: str = "/carts"


class ApiPrefix(BaseModel):
    prefix: str = "/api"
    v1: ApiV1Prefix = ApiV1Prefix()


class TaskiqConfig(BaseModel):
    url: AmqpDsn = "amqp://guest:guest@localhost:5672//"


class DatabaseConfig(BaseModel):
    url: PostgresDsn
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10

    naming_convention: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_N_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }


class SmtpConfig(BaseModel):
    host: str
    port: int
    user: EmailStr
    password: str
    from_email: EmailStr | None = None

    def get_from(self) -> EmailStr:
        return self.from_email or self.user


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.template", ".env"),
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
        case_sensitive=False,
    )

    run: RunConfig = RunConfig()
    gunicorn: GunicornConfig = GunicornConfig()
    logging: LoggingConfig = LoggingConfig()
    api: ApiPrefix = ApiPrefix()
    taskiq: TaskiqConfig = TaskiqConfig()
    db: DatabaseConfig
    smtp: SmtpConfig  # 👈 вот теперь всё в отдельной вложенной модели


settings = Settings()
