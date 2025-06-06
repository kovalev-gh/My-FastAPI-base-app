import { useEffect, useState } from "react";
import { getProducts, getProductImages } from "../api/products";
import { addToCart } from "../api/cart";

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

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsAndImages = async () => {
      try {
        const productList = await getProducts();
        setProducts(productList);

        const imageMap: Record<number, string> = {};

        for (const product of productList) {
          const productImages: ProductImage[] = await getProductImages(product.id);
          const mainImage = productImages.find((img) => Boolean(img.is_main));

          if (mainImage && mainImage.url) {
            // 🔧 Исправляем путь
            const correctedPath = mainImage.url.replace("/api/v1media", "/media");
            imageMap[product.id] = `${API_URL}${correctedPath}`;
          }
        }

        setImages(imageMap);
      } catch (err) {
        console.error("❌ Ошибка загрузки товаров или изображений:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndImages();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert("✅ Товар добавлен в корзину!");
    } catch (error) {
      console.error("❌ Ошибка при добавлении в корзину:", error);
      alert("⛔ Не удалось добавить товар. Возможно, вы не авторизованы.");
    }
  };

  if (loading) return <p>Загрузка товаров...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Список товаров</h2>
      {products.length === 0 ? (
        <p>Нет доступных товаров</p>
      ) : (
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
                <strong>{product.title}</strong>
                <div style={{ fontSize: "0.9rem", color: "#555" }}>
                  {product.retail_price ?? "нет цены"} ₽
                </div>
              </div>

              <div>
                <button onClick={() => handleAddToCart(product.id)}>🛒 В корзину</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
