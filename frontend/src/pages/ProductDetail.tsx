import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, getProductImages } from "../api/products";
import { getAllAttributes } from "../api/attributes";
import { getCategories } from "../api/categories";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributeDefs, setAttributeDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      try {
        const [productRes, imageRes, categoryRes, attrRes] = await Promise.all([
          getProductById(productId),
          getProductImages(productId),
          getCategories(),
          getAllAttributes(),
        ]);

        setProduct(productRes.data);
        setImages(imageRes);
        setCategories(categoryRes);
        setAttributeDefs(attrRes);
      } catch (err) {
        console.error("Ошибка загрузки данных", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const getCategoryName = (id: number) =>
    categories.find((cat) => cat.id === id)?.name || "—";

  const renderAttributes = () => {
    if (!product?.attributes?.length) return <p>Нет характеристик</p>;

    return (
      <ul>
        {product.attributes.map((attr: any, index: number) => {
          const def = attributeDefs.find((d) => d.id === attr.attribute_id);
          const name = def?.name?.replace(/^meta_/, "") || attr.name || "—";
          const unit = def?.unit ? ` ${def.unit}` : "";
          return (
            <li key={index}>
              {name}: {attr.value}
              {unit}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка...</p>;
  if (!product) return <p style={{ padding: "2rem" }}>Товар не найден</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{product.title}</h2>

      <p><strong>Описание:</strong> {product.description}</p>
      <p><strong>Розничная цена:</strong> {product.retail_price} ₽</p>
      {user?.is_superuser && (
        <p><strong>Оптовая цена:</strong> {product.opt_price} ₽</p>
      )}
      <p><strong>Количество:</strong> {product.quantity}</p>
      <p><strong>Категория:</strong> {getCategoryName(product.category_id)}</p>

      <p><strong>Характеристики:</strong></p>
      {renderAttributes()}

      {images.length > 0 && (
        <>
          <p><strong>Изображения:</strong></p>
          <div style={{ display: "flex", gap: "1rem" }}>
            {images.map((img) => (
              <img
                key={img.id}
                src={getImageUrl(img)}
                alt="Product"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: img.is_main ? "2px solid green" : "1px solid #ccc",
                }}
              />
            ))}
          </div>
        </>
      )}

      <br />
      {user?.is_superuser && (
        <button onClick={() => navigate(`/admin/edit-product/${productId}`)}>
          Редактировать
        </button>
      )}{" "}
      <button onClick={() => navigate(-1)}>Назад</button>
    </div>
  );
}
