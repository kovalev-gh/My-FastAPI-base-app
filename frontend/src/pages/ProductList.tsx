import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProducts,
  getProductImages,
} from "../api/products";
import { getCategories } from "../api/categories";
import { addToCart } from "../api/cart";
import { useAuth } from "../context/AuthContext";

export default function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        const all = Array.isArray(response) ? response : response.items || [];
        const filtered = selectedCategory
          ? all.filter((p) => p.category_id === selectedCategory)
          : all;
        setProducts(filtered);

        const imageMap: Record<number, string> = {};
        for (const product of filtered) {
          const imgs = await getProductImages(product.id);
          const main = imgs.find((i: any) => i.is_main);
          if (main) {
            const fixed = main.url.replace("/api/v1media", "/media");
            imageMap[product.id] = `${API_URL}${fixed}`;
          }
        }
        setImages(imageMap);
      } catch (err) {
        console.error("Ошибка загрузки продуктов:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory]);

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert("✅ Товар добавлен в корзину!");
    } catch {
      alert("❌ Не удалось добавить товар в корзину.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Список товаров</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Категория: </label>
        <select
          value={selectedCategory ?? ""}
          onChange={(e) =>
            setSelectedCategory(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Все</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {products.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "1px solid #ccc",
                paddingBottom: "1rem",
              }}
            >
              <Link
                to={`/products/${p.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  flexGrow: 1,
                }}
              >
                <img
                  src={images[p.id]}
                  alt={p.title}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    marginRight: 12,
                    border: "1px solid #ddd",
                  }}
                />
                <div>
                  <strong>{p.title}</strong>
                  <div>{p.retail_price ?? "-"} ₽</div>
                </div>
              </Link>

              <div>
                <button onClick={() => handleAddToCart(p.id)}>🛒 В корзину</button>
                {user?.is_superuser && (
                  <Link
                    to={`/admin/edit-product/${p.id}`}
                    style={{
                      marginLeft: "0.5rem",
                      padding: "0.2rem 0.5rem",
                      border: "1px solid #888",
                      borderRadius: 4,
                      textDecoration: "none",
                    }}
                    title="Редактировать"
                  >
                    ✏️
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
