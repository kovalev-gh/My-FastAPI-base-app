from locust import HttpUser, task, between, LoadTestShape
from urllib.parse import quote
import random
import string

PRODUCT_DATA = [
    "iphone5pro,7", "macbook,9", "string11,8", "str12345,17",
    "iPhone 16e 128Gb,16", "iPhone 15 Pro 128Gb,14", "\"Apple iPhone 15, 128 ГБ\",13",
    "iphone5,6", "iPhone 15 Pro Max 256Gb,15", "string123,4",
    "iPhone 15 128 ГБ,12", "cat3,26", "cat2,27", "poduct3,28",
    "product3,29", "product4,30", "string8,20", "Телек1,31",
    "Телек1,32", "string8,21", "product22,24", "product23,25",
    "Телек2,33", "Телек3,34", "Телек4,35", "Телек5,36",
    "Телек6,37", "телек7,38", "телек8,39", "string,10"
]
PRODUCT_IDS = [pid for line in PRODUCT_DATA if (pid := line.split(",")[-1]).isdigit()]

def random_username():
    return "user_" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))

def random_email():
    return random_username() + "@test.com"

def random_phone():
    return "+7" + ''.join(random.choices("0123456789", k=10))

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.username = random_username()
        self.password = "testpass123"
        if not self.register_and_login():
            self.environment.runner.quit()
            print("❌ Could not authenticate. Stopping user.")

    def register_and_login(self):
        email = random_email()
        phone = random_phone()
        full_name = "Locust Tester"

        print(f"🔐 Registering: {self.username} / {self.password}")
        reg = self.client.post("/api/v1/auth/register", json={
            "username": self.username,
            "password": self.password,
            "email": email,
            "phone_number": phone,
            "full_name": full_name
        })

        if reg.status_code not in (200, 201):
            print(f"❌ Registration failed: {reg.status_code} {reg.text}")
            return False

        print(f"✅ Registered: {self.username}, trying login")
        res = self.client.post(
            "/api/v1/auth/token",
            data={"username": self.username, "password": self.password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if res.status_code == 200:
            token = res.json().get("access_token")
            if token:
                self.client.headers.update({"Authorization": f"Bearer {token}"})
                print(f"✅ Authenticated as {self.username}")
                return True

        print(f"❌ Login failed after register: {res.status_code} {res.text}")
        return False

    @task(3)
    def browse_products(self):
        page = random.randint(0, 4)
        limit = 10
        offset = page * limit
        self.client.get(f"/api/v1/products?limit={limit}&offset={offset}")

    @task(2)
    def view_random_product(self):
        product_id = random.choice(PRODUCT_IDS)
        self.client.get(f"/api/v1/products/{quote(str(product_id))}")

    @task(1)
    def add_to_cart(self):
        product_id = random.choice(PRODUCT_IDS)
        res = self.client.post("/api/v1/carts/add", json={
            "product_id": int(product_id),
            "quantity": random.randint(1, 2)
        })
        if res.status_code == 200:
            self.added_product = True
            print(f"🛒 Added product {product_id}")
        else:
            print(f"❌ Add to cart failed ({res.status_code}): {res.text}")
            self.added_product = False

    @task(1)
    def view_cart(self):
        self.client.get("/api/v1/carts")

    @task(1)
    def checkout(self):
        if getattr(self, "added_product", False):
            res = self.client.post("/api/v1/orders/from-cart")
            if res.status_code == 200:
                print("📦 Order created successfully")
            else:
                print(f"❌ Checkout failed: {res.status_code} {res.text}")
            self.added_product = False
        else:
            print("⚠️ Skipping checkout: cart is empty")

    @task(1)
    def view_orders(self):
        self.client.get("/api/v1/orders/my")

class StepLoadShape(LoadTestShape):
    stages = [
        {"duration": 20, "users": 20, "spawn_rate": 5},
        {"duration": 40, "users": 40, "spawn_rate": 10},
        {"duration": 60, "users": 60, "spawn_rate": 15},
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None
