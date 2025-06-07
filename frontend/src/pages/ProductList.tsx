import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProducts,
  getProductImages,
} from "../api/products";
import { getCategories } from "../api/categories";
import { addToCart } from "../api/cart";

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        if (Array.isArray(cats)) setCategories(cats);
        else console.error("Ожидался массив категорий, получено:", cats);
      } catch (err) {
        console.error("Ошибка загрузки категорий:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const all = await getProducts();
        if (!Array.isArray(all)) {
          console.error("Ошибка: продукты не являются массивом:", all);
          setProducts([]);
          return;
        }

        const filtered = selectedCategory
          ? all.filter((p) => p.category_id === selectedCategory)
          : all;

        setProducts(filtered);

        const imageMap: Record<number, string> = {};
        for (const product of filtered) {
          try {
            const imgs = await getProductImages(product.id);
            const main = imgs?.find((i: any) => i.is_main);
            if (main?.url) {
              const fixed = main.url.replace("/api/v1media", "/media");
              imageMap[product.id] = `${API_URL}${fixed}`;
            }
          } catch (imgErr) {
            console.warn(`Ошибка загрузки изображений для товара ID ${product.id}:`, imgErr);
          }
        }

        setImages(imageMap);
      } catch (err) {
        console.error("Ошибка загрузки продуктов:", err);
        setProducts([]);
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
                }}
              >
                <img
                  src={images[p.id] || "/placeholder.png"}
                  alt={p.title}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    marginRight: 12,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                />
                <div style={{ flexGrow: 1 }}>
                  <strong>{p.title}</strong>
                  <div>{p.retail_price ?? "-"} ₽</div>
                </div>
              </Link>
              <button onClick={() => handleAddToCart(p.id)}>🛒 В корзину</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
