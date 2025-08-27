import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProducts,
  getProductImages,
  searchProducts,
} from "../api/products";
import { getCategories } from "../api/categories";
import { addToCart } from "../api/cart";
import { useAuth } from "../context/AuthContext";

// маленький хук для дебаунса
function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [query, setQuery] = useState(""); // ← поисковая строка
  const debouncedQuery = useDebouncedValue(query, 400);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:8000";

  // грузим категории
  useEffect(() => {
    (async () => {
      const cats = await getCategories();
      setCategories(cats);
    })();
  }, []);

  // грузим товары (обычная выдача или поиск по ES)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data: { items: any[]; total: number };

        // Если есть запрос или установлен фильтр по категории — используем поиск ES.
        // Иначе — дефолтная выдача (как раньше).
        if (debouncedQuery.trim() !== "" || selectedCategory !== null) {
          data = await searchProducts({
            q: debouncedQuery.trim(),
            category_id: selectedCategory ?? undefined,
            limit: 50, // можно крутить
            offset: 0,
          });
        } else {
          data = await getProducts(50, 0);
        }

        const all = Array.isArray(data) ? data : data.items || [];
        setProducts(all);

        // грузим главные картинки (параллельно и без пустых src)
        const imageEntries = await Promise.all(
          all.map(async (product: any) => {
            try {
              const imgs = await getProductImages(product.id);
              const main = imgs.find((i: any) => i.is_main);
              if (!main) return null; // ← НЕ возвращаем пустые строки
              const fixed = main.url.replace("/api/v1media", "/media");
              return { id: product.id, url: `${API_URL}${fixed}` };
            } catch {
              return null;
            }
          })
        );

        const imageMap: Record<number, string> = {};
        for (const entry of imageEntries) {
          if (entry) imageMap[entry.id] = entry.url; // ← только если есть URL
        }
        setImages(imageMap);
      } catch (err) {
        console.error("Ошибка загрузки продуктов:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedQuery, selectedCategory]);

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

      <div style={{ display: "flex", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
        {/* Поисковая строка */}
        <input
          type="search"
          placeholder="Поиск…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            minWidth: 260,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />

        {/* Фильтр по категории */}
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Категория:</span>
          <select
            value={selectedCategory ?? ""}
            onChange={(e) =>
              setSelectedCategory(e.target.value ? Number(e.target.value) : null)
            }
            style={{ padding: "0.35rem 0.5rem", borderRadius: 6 }}
          >
            <option value="">Все</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {products.map((p) => {
            const url = images[p.id]; // ← если нет ключа — undefined
            return (
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
                  {url ? (
                    <img
                      src={url}
                      alt={p.title}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        marginRight: 12,
                        border: "1px solid #ddd",
                        background: "#f7f7f7",
                      }}
                    />
                  ) : (
                    // Плейсхолдер без src — чтобы не было предупреждения
                    <div
                      aria-hidden="true"
                      style={{
                        width: 64,
                        height: 64,
                        marginRight: 12,
                        border: "1px solid #ddd",
                        background: "#f7f7f7",
                      }}
                    />
                  )}

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
            );
          })}
        </ul>
      )}
    </div>
  );
}
