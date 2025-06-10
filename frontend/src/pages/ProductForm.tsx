import { useEffect, useState } from "react";
import './App.css';
import { useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductImages,
  uploadProductImage,
  deleteImage,
  setMainImage as setMainImageApi,
} from "../api/products";
import { getCategories } from "../api/categories";

export default function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    retailPrice: "0",
    optPrice: "0",
    quantity: "0",
    subfolder: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setMessage("❌ Не удалось загрузить категории"));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const { data } = await getProductById(productId);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          retailPrice: String(data.retail_price ?? "0"),
          optPrice: String(data.opt_price ?? "0"),
          quantity: String(data.quantity ?? "0"),
          subfolder: "",
          categoryId: data.category_id ?? "",
        });

        const attrArray = Object.entries(data.attributes || {}).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));
        setAttributes(attrArray.length ? attrArray : [{ key: "", value: "" }]);

        const imagesRes = await getProductImages(productId);
        const imgs = imagesRes.data || [];
        setExistingImages(imgs);
        setMainImageIndex(imgs.findIndex((img) => img.is_main));
      } catch (e) {
        setMessage("❌ Не удалось загрузить товар");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const normalizeNumberInput = (v) =>
    v.replace(/^0+(?!$)/, "").replace(/\D/g, "") || "0";

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setFilePreviews(selected.map((f) => URL.createObjectURL(f)));
    setMainImageIndex(0);
  };

  const handleAttributeChange = (i, field, val) => {
    const newAttrs = [...attributes];
    newAttrs[i][field] = val;
    setAttributes(newAttrs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) return setMessage("❌ Выберите категорию");

    const attributesObj = Object.fromEntries(
      attributes.filter((a) => a.key && a.value).map((a) => [a.key, a.value])
    );

    try {
      const payload = {
        title: form.title,
        description: form.description,
        retail_price: +form.retailPrice,
        opt_price: +form.optPrice,
        quantity: +form.quantity,
        category_id: +form.categoryId,
        attributes: attributesObj,
      };

      const res = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      const product = res.data;
      if (files.length && form.subfolder) {
        const ids = [];
        for (const file of files) {
          const r = await uploadProductImage(product.id, file, form.subfolder);
          ids.push(r.data.image_id);
        }
        if (mainImageIndex !== null && ids[mainImageIndex]) {
          await setMainImageApi(ids[mainImageIndex]);
        }
      }

      setMessage("✅ Сохранено!");
      if (!productId) {
        setForm({
          title: "", description: "", retailPrice: "0", optPrice: "0",
          quantity: "0", subfolder: "", categoryId: ""
        });
        setFiles([]);
        setFilePreviews([]);
        setAttributes([{ key: "", value: "" }]);
      }
    } catch (err) {
      setMessage("❌ Ошибка при сохранении");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId || !window.confirm("Удалить товар?")) return;
    try {
      await deleteProduct(productId);
      navigate("/products");
    } catch {
      setMessage("❌ Не удалось удалить товар");
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await deleteImage(id);
      setExistingImages((imgs) => imgs.filter((i) => i.id !== id));
    } catch {
      setMessage("❌ Не удалось удалить изображение");
    }
  };

  const handleSetMainImage = async (id) => {
    try {
      await setMainImageApi(id);
      setExistingImages((imgs) =>
        imgs.map((img) => ({ ...img, is_main: img.id === id }))
      );
    } catch {
      setMessage("❌ Не удалось установить главное изображение");
    }
  };

  if (loading) return <p className="p-8">Загрузка...</p>;

  return (
    <div className="container">
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit}>
        <label>Название</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          required
        />

        <label>Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <label>Розничная цена</label>
        <input
          type="text"
          value={form.retailPrice}
          onChange={(e) =>
            updateField("retailPrice", normalizeNumberInput(e.target.value))
          }
        />

        <label>Оптовая цена</label>
        <input
          type="text"
          value={form.optPrice}
          onChange={(e) =>
            updateField("optPrice", normalizeNumberInput(e.target.value))
          }
        />

        <label>Количество</label>
        <input
          type="text"
          value={form.quantity}
          onChange={(e) =>
            updateField("quantity", normalizeNumberInput(e.target.value))
          }
        />

        <label>Папка</label>
        <input
          type="text"
          value={form.subfolder}
          onChange={(e) => updateField("subfolder", e.target.value)}
        />

        <label>Категория</label>
        <select
          value={form.categoryId}
          onChange={(e) => updateField("categoryId", e.target.value)}
          required
        >
          <option value="">-- выберите --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <label>Характеристики</label>
        {attributes.map((attr, i) => (
          <div className="attribute-row" key={i}>
            <input
              value={attr.key}
              onChange={(e) => handleAttributeChange(i, "key", e.target.value)}
              placeholder="Ключ"
            />
            <input
              value={attr.value}
              onChange={(e) => handleAttributeChange(i, "value", e.target.value)}
              placeholder="Значение"
            />
            {attributes.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setAttributes(attributes.filter((_, j) => j !== i))
                }
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAttributes([...attributes, { key: "", value: "" }])}
        >
          + Добавить
        </button>

        <label>Загрузить изображения</label>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />

        {filePreviews.length > 0 && (
          <div className="image-preview">
            {filePreviews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className={mainImageIndex === i ? "selected" : ""}
                onClick={() => setMainImageIndex(i)}
              />
            ))}
          </div>
        )}

        {existingImages.length > 0 && (
          <div className="image-preview">
            {existingImages.map((img) => (
              <div key={img.id}>
                <img
                  src={
                    img.image_path.startsWith("http")
                      ? img.image_path
                      : `/media/${img.image_path}`
                  }
                  alt=""
                  className={img.is_main ? "selected" : ""}
                />
                <button type="button" onClick={() => handleSetMainImage(img.id)}>
                  Главная
                </button>
                <button type="button" onClick={() => handleDeleteImage(img.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button type="submit">{productId ? "Сохранить" : "Создать"}</button>
          {productId && (
            <button
              type="button"
              onClick={handleDeleteProduct}
              style={{ backgroundColor: "#c9302c", marginLeft: "10px" }}
            >
              Удалить
            </button>
          )}
        </div>

        {message && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{message}</p>}
      </form>
    </div>
  );
}
