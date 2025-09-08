# core/cache/keys.py
"""
Генерация ключей для Redis.
Нужна, чтобы все ключи были в одном неймспейсе и было удобно их инвалидировать.
"""

def product_ver(product_id: int) -> str:
    """Версия стабильной части товара."""
    return f"product:{product_id}:ver"

def product_card(product_id: int, version: int) -> str:
    """Карточка товара (контент). Версионируется по product_ver()."""
    return f"product:{product_id}:v{version}:card"

def product_price(product_id: int) -> str:
    """Динамика (цены и остатки) для товара."""
    return f"product:{product_id}:pricing_stock"

def lock_key(key: str) -> str:
    """Ключ для блокировки при обновлении."""
    return f"lock:{key}"
