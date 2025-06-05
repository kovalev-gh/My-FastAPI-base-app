import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { addToCart } from "../api/cart";

type Product = {
  id: number;
  title: string;
  retail_price: number | null;
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(data => {
        console.log("🧪 Получено от API:", data);
        setProducts(data);
      })
      .catch(err => {
        console.error("❌ Ошибка при загрузке товаров:", err?.message ?? err);

        // Безопасно логируем request, если он есть
        if (err && typeof err === "object" && "request" in err) {
          console.debug("📡 Ошибка запроса:", (err as any).request);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert("✅ Товар добавлен в корзину!");
    } catch (error) {
      console.error("❌ Ошибка при добавлении в корзину:", error);
      alert("⛔ Не удалось добавить товар. Возможно, вы не вошли в систему.");
    }
  };

  if (loading) return <p>Загрузка товаров...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Список товаров</h2>
      {products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id} style={{ marginBottom: "1rem" }}>
              <strong>{product.title}</strong> — {product.retail_price ?? "нет цены"} ₽
              <br />
              <button onClick={() => handleAddToCart(product.id)}>🛒 В корзину</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
