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
  is_main: boolean;
};

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
          const mainImage = productImages.find((img) => img.is_main);
          if (mainImage) {
            imageMap[product.id] = mainImage.url;
          }
        }

        setImages(imageMap);
      } catch (err) {
        console.error("Ошибка при загрузке товаров или изображений:", err);
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
          {products.map((product) => (
            <li key={product.id} style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Фото товара или заглушка */}
              <div style={{ width: "80px", height: "80px", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {images[product.id] ? (
                  <img
                    src={images[product.id]}
                    alt={product.title}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: "2rem", color: "#aaa" }}>📷</span>
                )}
              </div>

              {/* Название и кнопка */}
              <div>
                <strong>{product.title}</strong> — {product.retail_price ?? "нет цены"} ₽
                <br />
                <button onClick={() => handleAddToCart(product.id)}>🛒 В корзину</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
