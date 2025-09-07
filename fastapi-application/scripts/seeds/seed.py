import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# === Загружаем окружение до импорта settings ===
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Сначала env.template
env_template = PROJECT_ROOT / ".env.template"
if env_template.exists():
    load_dotenv(dotenv_path=env_template, override=False)

# Потом .env (перекрывает template)
env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file, override=True)

# Теперь можно импортировать settings (он увидит переменные)
from core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from core.models.base import Base
from core.models.category import Category
from core.models.product import Product
from core.models.product_attribute import (
    ProductAttributeDefinition,
    ProductAttributeValue,
)
from scripts.seeds.seed_data import SEED_DATA


DATABASE_URL = settings.db.url
engine = create_async_engine(DATABASE_URL, echo=settings.db.echo)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        categories: dict[str, Category] = {}
        attributes: dict[str, ProductAttributeDefinition] = {}

        for item in SEED_DATA:
            if item["category"] not in categories:
                cat = Category(name=item["category"])
                session.add(cat)
                await session.flush()
                categories[item["category"]] = cat
            category = categories[item["category"]]

            product = Product(
                title=item["title"],
                retail_price=item["retail_price"],
                opt_price=item["opt_price"],
                quantity=item["quantity"],
                description=item.get("description"),
                category=category,
            )
            session.add(product)
            await session.flush()

            for attr in item.get("attributes", []):
                name, value, unit = attr["name"], attr["value"], attr.get("unit")

                if name not in attributes:
                    attr_def = ProductAttributeDefinition(name=name, unit=unit)
                    session.add(attr_def)
                    await session.flush()
                    attributes[name] = attr_def
                else:
                    attr_def = attributes[name]
                    if unit and not attr_def.unit:
                        attr_def.unit = unit

                pav = ProductAttributeValue(
                    product=product,
                    attribute=attr_def,
                    value=value,
                )
                session.add(pav)

        await session.commit()
        print(f"✅ База успешно засеяна ({len(SEED_DATA)} товаров)")


if __name__ == "__main__":
    asyncio.run(seed_database())
