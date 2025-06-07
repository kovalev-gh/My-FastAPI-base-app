import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById, getProductImages } from "../api/products";
import { addToCart } from "../api/cart";

type Product = {
  id: number;
  title: string;
  description: string;
  retail_price: number;
  opt_price: number;
  quantity: number;
};

type ProductImage = {
  id: number;
  url: string;
  is_main: boolean;
};

const API_URL = "http://localhost:8000";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data } = await getProductById(id);
        setProduct(data);

        const rawImages = await getProductImages(id);
        const normalized = rawImages
          .map((img: any) => ({
            ...img,
            url: `${API_URL}${img.url.replace("/api/v1media", "/media")}`,
          }))
          .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)); // Главная картинка первой
        setImages(normalized);
      } catch (err) {
        console.error("Ошибка при загрузке товара:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, 1);
      alert("✅ Товар добавлен в корзину!");
    } catch (error) {
      console.error("❌ Ошибка при добавлении в корзину:", error);
      alert("⛔ Не удалось добавить товар. Возможно, вы не авторизованы.");
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка...</p>;
  if (!product) return <p style={{ padding: "2rem" }}>Товар не найден</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{product.title}</h2>

      {images.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={`img-${img.id}`}
              width={200}
              height={200}
              style={{
                border: img.is_main ? "2px solid green" : "1px solid #ccc",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          ))}
        </div>
      )}

      <p><strong>Описание:</strong><br />{product.description}</p>
      <p><strong>Розничная цена:</strong> {product.retail_price} ₽</p>
      <p><strong>Оптовая цена:</strong> {product.opt_price} ₽</p>
      <p><strong>В наличии:</strong> {product.quantity} шт.</p>

      <button onClick={handleAddToCart} style={{ marginTop: "1rem" }}>
        🛒 Добавить в корзину
      </button>
    </div>
  );
}
