import { useEffect, useState } from "react";
import { getProducts } from "../api/products";

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
      .catch(err => console.error("❌ Ошибка при загрузке товаров:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка товаров...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Список товаров</h2>
      {products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              <strong>{product.title}</strong> — {product.retail_price ?? "нет цены"} ₽
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
