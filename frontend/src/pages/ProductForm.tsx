import { useEffect, useState } from "react";
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
import { getAttributesByCategory } from "../api/attributes";

export default function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    sku: "",
    retailPrice: "0",
    optPrice: "0",
    quantity: "0",
    subfolder: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState([]);
  const [attributesOptions, setAttributesOptions] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Загрузка категорий
  useEffect(() => {
    getCategories()
      .then(data => setCategories(data || []))
      .catch(() => setMessage("❌ Не удалось загрузить категории"));
  }, []);

  // Загрузка атрибутов при смене категории
  useEffect(() => {
    if (!form.categoryId) {
      setAttributesOptions([]);
      setAttributes([{ key: "", value: "" }]);
      return;
    }
    getAttributesByCategory(Number(form.categoryId))
      .then(response => {
        // Берём именно response.data
        setAttributesOptions(response.data || []);
        setAttributes([{ key: "", value: "" }]);
      })
      .catch(() => setMessage("❌ Не удалось загрузить характеристики категории"));
  }, [form.categoryId]);

  // Загрузка продукта при редактировании
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const { data } = await getProductById(productId);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          sku: data.sku ?? "",
          retailPrice: String(data.retail_price ?? "0"),
          optPrice: String(data.opt_price ?? "0"),
          quantity: String(data.quantity ?? "0"),
          subfolder: "",
          categoryId: String(data.category_id ?? ""),
        });

        const attrArray = Array.isArray(data.attributes)
          ? data.attributes
          : Object.entries(data.attributes || {}).map(([k, v]) => ({ key: k, value: String(v) }));
        setAttributes(attrArray.length ? attrArray : [{ key: "", value: "" }]);

        const imagesRes = await getProductImages(productId);
        const imgs = imagesRes.data || [];
        setExistingImages(imgs);
        setMainImageIndex(imgs.findIndex(img => img.is_main));
      } catch {
        setMessage("❌ Не удалось загрузить товар");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const handleFileChange = e => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setFilePreviews(selected.map(f => URL.createObjectURL(f)));
    setMainImageIndex(0);
  };

  const handleAttributeChange = (i, field, val) => {
    const newAttrs = [...attributes];
    newAttrs[i][field] = val;
    setAttributes(newAttrs);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.title.trim()) return setMessage("❌ Укажите название товара.");
    if (!form.sku.trim()) return setMessage("❌ Укажите артикул (SKU).");
    if (isNaN(+form.retailPrice)) return setMessage("❌ Розничная цена должна быть числом.");
    if (isNaN(+form.optPrice)) return setMessage("❌ Оптовая цена должна быть числом.");
    if (isNaN(+form.quantity)) return setMessage("❌ Количество должно быть числом.");
    if (!form.categoryId || isNaN(+form.categoryId)) return setMessage("❌ Выберите категорию.");

    const attributesList = attributes
      .filter(a => a.key && a.value)
      .map(a => ({ attribute_id: Number(a.key), value: a.value }));

    const payload = {
      title: form.title,
      description: form.description,
      sku: form.sku,
      retail_price: +form.retailPrice,
      opt_price: +form.optPrice,
      quantity: +form.quantity,
      category_id: +form.categoryId,
      ...(attributesList.length > 0 && { attributes: attributesList }),
    };

    try {
      const res = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      const product = res?.data ?? res;
      if (!product?.id) {
        setMessage("❌ Ошибка: не получен ID продукта.");
        return;
      }

      if (files.length && form.subfolder) {
        const ids = [];
        for (const file of files) {
          const r = await uploadProductImage(product.id, file, form.subfolder);
          if (r?.data?.image_id) ids.push(r.data.image_id);
        }
        if (mainImageIndex !== null && ids[mainImageIndex]) {
          await setMainImageApi(ids[mainImageIndex]);
        }
      }

      setMessage("✅ Продукт успешно сохранён!");

      if (!productId) {
        setForm({
          title: "",
          description: "",
          sku: "",
          retailPrice: "0",
          optPrice: "0",
          quantity: "0",
          subfolder: "",
          categoryId: "",
        });
        setFiles([]);
        setFilePreviews([]);
        setAttributes([{ key: "", value: "" }]);
        setMainImageIndex(null);
      }
    } catch (err) {
      console.error("Ошибка:", err);
      if (err.response?.data?.detail) {
        setMessage(`❌ ${err.response.data.detail}`);
      } else {
        setMessage("❌ Ошибка при сохранении");
      }
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

  const handleDeleteImage = async id => {
    try {
      await deleteImage(id);
      setExistingImages(prev => prev.filter(i => i.id !== id));
    } catch {
      setMessage("❌ Не удалось удалить изображение");
    }
  };

  const handleSetMainImage = async id => {
    try {
      await setMainImageApi(id);
      setExistingImages(prev =>
        prev.map(img => ({ ...img, is_main: img.id === id }))
      );
      setMessage("✅ Главное изображение обновлено");
    } catch {
      setMessage("❌ Не удалось установить главное изображение");
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div>
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "600px" }}>
        <label>Название</label>
        <input type="text" value={form.title} onChange={e => updateField("title", e.target.value)} required />

        <label>Описание</label>
        <textarea value={form.description} onChange={e => updateField("description", e.target.value)} />

        <label>Артикул (SKU)</label>
        <input type="text" value={form.sku} onChange={e => updateField("sku", e.target.value)} required />

        <label>Розничная цена</label>
        <input type="text" value={form.retailPrice} onChange={e => updateField("retailPrice", e.target.value.replace(/\D/g, ''))} />

        <label>Оптовая цена</label>
        <input type="text" value={form.optPrice} onChange={e => updateField("optPrice", e.target.value.replace(/\D/g, ''))} />

        <label>Количество</label>
        <input type="text" value={form.quantity} onChange={e => updateField("quantity", e.target.value.replace(/\D/g, ''))} />

        <label>Путь к папке фото</label>
        <input
          type="text"
          placeholder="например: phones/iphone5"
          value={form.subfolder}
          onChange={e => updateField("subfolder", e.target.value)}
        />

        <label>Категория</label>
        <select value={form.categoryId} onChange={e => updateField("categoryId", e.target.value)} required>
          <option value="">— выбрать категорию —</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <label>Характеристики</label>
        {attributes.map((attr, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
            <select
              value={attr.key}
              onChange={e => handleAttributeChange(i, "key", e.target.value)}
              required
            >
              <option value="">— выбрать характеристику —</option>
              {attributesOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={attr.value}
              onChange={e => handleAttributeChange(i, "value", e.target.value)}
              placeholder="Значение"
              required
            />
            {attributes.length > 1 && (
              <button type="button" onClick={() => setAttributes(attributes.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setAttributes([...attributes, { key: "", value: "" }])}>+ Добавить</button>

        <label>Загрузить изображения</label>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />

        {filePreviews.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
            {filePreviews.map((src, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img src={src} alt="" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }} />
                <button type="button" onClick={() => setMainImageIndex(i)}>
                  {mainImageIndex === i ? "Главное" : "Сделать главной"}
                </button>
              </div>
            ))}
          </div>
        )}

        {existingImages.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
            {existingImages.map(img => (
              <div key={img.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img src={img.image_path.startsWith("http") ? img.image_path : `/media/${img.image_path}`} alt="" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }} />
                <button type="button" onClick={() => handleSetMainImage(img.id)}>Сделать главной</button>
                <button type="button" onClick={() => handleDeleteImage(img.id)}>Удалить</button>
              </div>
            ))}
          </div>
        )}

        <div>
          <button type="submit">{productId ? "Сохранить" : "Создать"}</button>
          {productId && (
            <button type="button" onClick={handleDeleteProduct}>Удалить</button>
          )}
        </div>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}
