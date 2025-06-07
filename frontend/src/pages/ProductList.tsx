import { useEffect, useState } from "react";
import { getProductImages, getProducts } from "../api/products";
import { addToCart } from "../api/cart";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Product = {
  id: number;
  title: string;
  retail_price: number | null;
};

type ProductImage = {
  id: number;
  url: string;
  is_main: boolean | string;
};

const API_URL = "http://localhost:8000";
const PAGE_SIZE = 10;

export default function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchProductsAndImages = async () => {
    setLoading(true);
    try {
      const response = await getProducts(PAGE_SIZE, page * PAGE_SIZE);

      if (!response || !Array.isArray(response.items)) {
        throw new Error("❌ Ожидался объект с полем items: Product[]");
      }

      setProducts(response.items);
      setTotal(response.total);

      const imageMap: Record<number, string> = {};

      for (const product of response.items) {
        const productImages: ProductImage[] = await getProductImages(product.id);
        const mainImage = productImages.find((img) => Boolean(img.is_main));
        if (mainImage && mainImage.url) {
          const correctedPath = mainImage.url.replace("/api/v1media", "/media");
          imageMap[product.id] = `${API_URL}${correctedPath}`;
        }
      }

      setImages(imageMap);
    } catch (err) {
      console.error("❌ Ошибка загрузки товаров или изображений:", err);
      setProducts([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndImages();
  }, [page]);

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert("✅ Товар добавлен в корзину!");
    } catch (error) {
      console.error("❌ Ошибка при добавлении в корзину:", error);
      alert("⛔ Не удалось добавить товар. Возможно, вы не авторизованы.");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) return <p>Загрузка товаров...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Список товаров</h2>

      {products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {products.map((product) => (
              <li
                key={product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  borderBottom: "1px solid #ccc",
                  padding: "1rem 0",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    flexShrink: 0,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {images[product.id] ? (
                    <img
                      src={images[product.id]}
                      alt={product.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "1.5rem", color: "#aaa" }}>📷</span>
                  )}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <Link to={`/products/${product.id}`} style={{ textDecoration: "none", color: "black" }}>
                    <strong>{product.title}</strong>
                  </Link>
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>
                    {product.retail_price ?? "нет цены"} ₽
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button onClick={() => handleAddToCart(product.id)}>🛒 В корзину</button>
                  {user?.is_superuser && (
                    <Link to={`/admin/edit-product/${product.id}`} style={{ fontSize: "0.85rem" }}>
                      ✏️ Редактировать
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Пагинация */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              style={{ marginRight: "1rem" }}
            >
              ⬅️ Назад
            </button>
            <span>
              Страница {page + 1} из {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
              disabled={page + 1 >= totalPages}
              style={{ marginLeft: "1rem" }}
            >
              Вперёд ➡️
            </button>
          </div>
        </>
      )}
    </div>
  );
}
