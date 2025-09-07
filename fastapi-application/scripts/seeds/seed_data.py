SEED_DATA = [
    # Смартфоны
    {
        "title": "iPhone 15 Pro",
        "category": "Смартфоны",
        "retail_price": 129999,
        "opt_price": 119999,
        "quantity": 10,
        "description": "Флагман Apple с экраном 6.1 дюйма и камерой 48 Мп",
        "attributes": [
            {"name": "meta_color", "value": "Серый", "unit": None},
            {"name": "meta_memory", "value": "256", "unit": "ГБ"},
            {"name": "meta_screen", "value": "6.1", "unit": "дюйм"},
            {"name": "meta_weight", "value": "187", "unit": "грамм"},
        ],
    },
    {
        "title": "Samsung Galaxy S24 Ultra",
        "category": "Смартфоны",
        "retail_price": 119999,
        "opt_price": 109999,
        "quantity": 15,
        "description": "Флагман Samsung с камерой 200 Мп и поддержкой S Pen",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_memory", "value": "512", "unit": "ГБ"},
            {"name": "meta_screen", "value": "6.8", "unit": "дюйм"},
            {"name": "meta_weight", "value": "233", "unit": "грамм"},
        ],
    },

    # Ноутбуки
    {
        "title": "MacBook Air M2",
        "category": "Ноутбуки",
        "retail_price": 189999,
        "opt_price": 175000,
        "quantity": 5,
        "description": "Ультрабук Apple 13.6 дюйма с чипом M2",
        "attributes": [
            {"name": "meta_color", "value": "Серебристый", "unit": None},
            {"name": "meta_screen", "value": "13.6", "unit": "дюйм"},
            {"name": "meta_memory", "value": "512", "unit": "ГБ"},
            {"name": "meta_weight", "value": "1240", "unit": "грамм"},
        ],
    },
    {
        "title": "ASUS ROG Zephyrus G14",
        "category": "Ноутбуки",
        "retail_price": 159999,
        "opt_price": 145000,
        "quantity": 8,
        "description": "Игровой ноутбук с Ryzen 9 и RTX 4070",
        "attributes": [
            {"name": "meta_color", "value": "Белый", "unit": None},
            {"name": "meta_screen", "value": "14", "unit": "дюйм"},
            {"name": "meta_memory", "value": "1", "unit": "ТБ"},
            {"name": "meta_weight", "value": "1650", "unit": "грамм"},
        ],
    },

    # Планшеты
    {
        "title": "iPad Pro 12.9",
        "category": "Планшеты",
        "retail_price": 149999,
        "opt_price": 135000,
        "quantity": 12,
        "description": "Планшет Apple iPad Pro с дисплеем Liquid Retina XDR",
        "attributes": [
            {"name": "meta_color", "value": "Серый космос", "unit": None},
            {"name": "meta_screen", "value": "12.9", "unit": "дюйм"},
            {"name": "meta_memory", "value": "512", "unit": "ГБ"},
            {"name": "meta_weight", "value": "682", "unit": "грамм"},
        ],
    },
    {
        "title": "Samsung Galaxy Tab S9",
        "category": "Планшеты",
        "retail_price": 99999,
        "opt_price": 89999,
        "quantity": 20,
        "description": "Флагманский планшет Samsung с AMOLED-дисплеем и S Pen",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_screen", "value": "11", "unit": "дюйм"},
            {"name": "meta_memory", "value": "256", "unit": "ГБ"},
            {"name": "meta_weight", "value": "498", "unit": "грамм"},
        ],
    },

    # Фотоаппараты
    {
        "title": "Canon EOS R6 Mark II",
        "category": "Фотоаппараты",
        "retail_price": 249999,
        "opt_price": 229999,
        "quantity": 6,
        "description": "Полнокадровая беззеркальная камера Canon с 24 Мп сенсором",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_sensor", "value": "24", "unit": "Мп"},
            {"name": "meta_weight", "value": "680", "unit": "грамм"},
        ],
    },
    {
        "title": "Sony Alpha 7 IV",
        "category": "Фотоаппараты",
        "retail_price": 279999,
        "opt_price": 259999,
        "quantity": 5,
        "description": "Беззеркальная камера Sony с 33 Мп матрицей",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_sensor", "value": "33", "unit": "Мп"},
            {"name": "meta_weight", "value": "659", "unit": "грамм"},
        ],
    },

    # Камеры
    {
        "title": "GoPro HERO12 Black",
        "category": "Камеры",
        "retail_price": 49999,
        "opt_price": 46000,
        "quantity": 25,
        "description": "Экшн-камера GoPro с поддержкой 5.3K видео",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_resolution", "value": "5312x2988", "unit": None},
            {"name": "meta_weight", "value": "154", "unit": "грамм"},
        ],
    },
    {
        "title": "DJI Osmo Pocket 3",
        "category": "Камеры",
        "retail_price": 69999,
        "opt_price": 64000,
        "quantity": 10,
        "description": "Компактная камера с 3-осевым стабилизатором и 4K-видео",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_resolution", "value": "3840x2160", "unit": None},
            {"name": "meta_weight", "value": "179", "unit": "грамм"},
        ],
    },

    # Телевизоры
    {
        "title": "Samsung QLED TV 55\"",
        "category": "Телевизоры",
        "retail_price": 79999,
        "opt_price": 72000,
        "quantity": 7,
        "description": "55-дюймовый 4K QLED телевизор с HDR и Smart TV",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_screen", "value": "55", "unit": "дюйм"},
            {"name": "meta_resolution", "value": "3840x2160", "unit": None},
            {"name": "meta_weight", "value": "14400", "unit": "грамм"},
        ],
    },
    {
        "title": "LG OLED C3 65\"",
        "category": "Телевизоры",
        "retail_price": 179999,
        "opt_price": 165000,
        "quantity": 4,
        "description": "OLED телевизор с идеальным черным и Dolby Vision",
        "attributes": [
            {"name": "meta_color", "value": "Серый", "unit": None},
            {"name": "meta_screen", "value": "65", "unit": "дюйм"},
            {"name": "meta_resolution", "value": "3840x2160", "unit": None},
            {"name": "meta_weight", "value": "18000", "unit": "грамм"},
        ],
    },

    # Наушники
    {
        "title": "AirPods Pro 2",
        "category": "Наушники",
        "retail_price": 24999,
        "opt_price": 22000,
        "quantity": 30,
        "description": "Беспроводные наушники с шумоподавлением от Apple",
        "attributes": [
            {"name": "meta_color", "value": "Белый", "unit": None},
            {"name": "meta_weight", "value": "5.3", "unit": "грамм"},
            {"name": "meta_battery", "value": "6", "unit": "час"},
        ],
    },
    {
        "title": "Sony WH-1000XM5",
        "category": "Наушники",
        "retail_price": 39999,
        "opt_price": 36000,
        "quantity": 20,
        "description": "Флагманские накладные наушники Sony с ANC",
        "attributes": [
            {"name": "meta_color", "value": "Черный", "unit": None},
            {"name": "meta_weight", "value": "250", "unit": "грамм"},
            {"name": "meta_battery", "value": "30", "unit": "час"},
        ],
    },
]
