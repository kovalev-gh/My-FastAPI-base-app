import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, getProductImages } from "../api/products";
import { getCategories } from "../api/categories";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;

      try {
        const [{ data: prod }, categories, imgs] = await Promise.all([
          getProductById(productId),
          getCategories(),
          getProductImages(productId),
        ]);

        setProduct(prod);
        setImages(imgs);
        const category = categories.find((cat) => cat.id === prod.category_id);
        setCategoryName(category?.name || "");
      } catch (err) {
        console.error("❌ Ошибка при загрузке данных:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const getImageUrl = (img: any): string => {
    if (!img) return "";
    let path = img.image_path || img.url || "";
    path = path.replace(/^\/?api\/v1\/?/, "");
    if (path.startsWith("media/") || path.startsWith("/media/")) {
      return path.startsWith("/") ? path : "/" + path;
    }
    return `/media/${path.replace(/^\/+/, "")}`;
  };

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка...</p>;
  if (!product) return <p style={{ padding: "2rem" }}>Продукт не найден.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{product.title}</h2>
      <p><strong>Описание:</strong> {product.description}</p>
      <p><strong>Розничная цена:</strong> {product.retail_price} ₽</p>
      <p><strong>Оптовая цена:</strong> {product.opt_price} ₽</p>
      <p><strong>Количество:</strong> {product.quantity}</p>
      <p><strong>Категория:</strong> {categoryName}</p>

      <p><strong>Характеристики:</strong></p>
      {product.attributes?.length > 0 ? (
        <ul>
          {product.attributes.map((attr: any, idx: number) => (
            <li key={idx}>
              {attr.name.replace(/^meta_/, "")}: {attr.value}
            </li>
          ))}
        </ul>
      ) : (
        <p>Нет характеристик</p>
      )}

      <p><strong>Изображения:</strong></p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {images.map((img) => (
          <div key={img.id} style={{
            border: img.is_main ? "2px solid green" : "1px solid #ccc",
            borderRadius: "8px",
            padding: "0.5rem",
            textAlign: "center"
          }}>
            <img
              src={getImageUrl(img)}
              alt=""
              style={{ width: "120px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
            />
            {img.is_main && <p style={{ fontSize: "0.75rem", color: "green" }}>Главное</p>}
          </div>
        ))}
      </div>

      <br />
      <button onClick={() => navigate(`/admin/edit-product/${product.id}`)}>Редактировать</button>{" "}
      <button onClick={() => navigate(-1)}>Назад</button>
    </div>
  );
}
