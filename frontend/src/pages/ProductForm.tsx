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
    sku: "",
    retailPrice: "0",
    optPrice: "0",
    quantity: "0",
    subfolder: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState([]);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCategoryName = categories.length
    ? categories.find(c => String(c.id) === String(form.categoryId))?.name || ""
    : "";

  const updateField = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    getCategories()
      .then((data) => {
        console.log("📁 Категории:", data);
        setCategories(data || []);
      })
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

  const normalizeNumberInput = v =>
    v.replace(/^0+(?!$)/, "").replace(/\D/g, "") || "0";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return setMessage("❌ Укажите название товара.");
    if (!form.sku?.trim()) return setMessage("❌ Укажите артикул (SKU).");
    if (Number.isNaN(+form.retailPrice)) return setMessage("❌ Розничная цена должна быть числом.");
    if (Number.isNaN(+form.optPrice)) return setMessage("❌ Оптовая цена должна быть числом.");
    if (Number.isNaN(+form.quantity)) return setMessage("❌ Количество должно быть числом.");
    if (!form.categoryId || Number.isNaN(+form.categoryId)) return setMessage("❌ Выберите категорию.");

    const attributesList = attributes
      .filter((a) => a.key && a.value)
      .map((a) => ({ key: a.key, value: a.value }));

    try {
      const payload = {
        title: form.title,
        description: form.description,
        sku: form.sku,
        retail_price: +form.retailPrice,
        opt_price: +form.optPrice,
        quantity: +form.quantity,
        category_id: +form.categoryId,
        attributes: attributesList,
      };

      const res = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      const product = res.data;

      if (files.length && form.subfolder) {
        const ids = [];
        for (const file of files) {
          const r = await uploadProductImage(product.id, file, form.subfolder);
          if (r?.data?.image_id) {
            ids.push(r.data.image_id);
          }
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

  if (loading) return <p className="p-8">Загрузка...</p>;

  return (
    <div className="container">
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit}>
        <label>Название</label>
        <input type="text" value={form.title} onChange={e => updateField("title", e.target.value)} required />

        <label>Описание</label>
        <textarea value={form.description} onChange={e => updateField("description", e.target.value)} />

        <label>Артикул (SKU)</label>
        <input type="text" value={form.sku} onChange={e => updateField("sku", e.target.value)} required />

        <label>Розничная цена</label>
        <input type="text" value={form.retailPrice} onChange={e => updateField("retailPrice", normalizeNumberInput(e.target.value))} />

        <label>Оптовая цена</label>
        <input type="text" value={form.optPrice} onChange={e => updateField("optPrice", normalizeNumberInput(e.target.value))} />

        <label>Количество</label>
        <input type="text" value={form.quantity} onChange={e => updateField("quantity", normalizeNumberInput(e.target.value))} />

        <label>Папка</label>
        <input type="text" value={form.subfolder} onChange={e => updateField("subfolder", e.target.value)} />

        <label>Категория</label>
        <div style={{ position: 'relative', marginBottom: '1rem' }} tabIndex={0} onBlur={() => setShowCategoryList(false)}>
          <div
            onClick={() => setShowCategoryList(prev => !prev)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              color: selectedCategoryName ? '#000' : '#888',
            }}
          >
            {selectedCategoryName || "— выбрать категорию —"}
          </div>
          {showCategoryList && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              zIndex: 10,
              listStyle: 'none',
              padding: '0',
              margin: '4px 0 0',
              borderRadius: '4px',
            }}>
              {categories.map(cat => (
                <li key={cat.id} onClick={() => {
                  updateField("categoryId", String(cat.id));
                  setShowCategoryList(false);
                }} style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: cat.id === Number(form.categoryId) ? '#f0f0f0' : 'white',
                }}>
                  {cat.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <label>Характеристики</label>
        {attributes.map((attr, i) => (
          <div className="attribute-row" key={i}>
            <input value={attr.key} onChange={e => handleAttributeChange(i, "key", e.target.value)} placeholder="Ключ" />
            <input value={attr.value} onChange={e => handleAttributeChange(i, "value", e.target.value)} placeholder="Значение" />
            {attributes.length > 1 && (
              <button type="button" onClick={() => setAttributes(attributes.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setAttributes([...attributes, { key: "", value: "" }])}>+ Добавить</button>

        <label>Загрузить изображения</label>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />

        {filePreviews.length > 0 && (
          <div className="image-preview">
            {filePreviews.map((src, i) => (
              <div key={i}>
                <img src={src} alt="" className={mainImageIndex === i ? "selected" : ""} onClick={() => setMainImageIndex(i)} />
                <button type="button" onClick={() => setMainImageIndex(i)}>
                  {mainImageIndex === i ? "Главное" : "Сделать главной"}
                </button>
              </div>
            ))}
          </div>
        )}

        {existingImages.length > 0 && (
          <div className="image-preview">
            {existingImages.map(img => (
              <div key={img.id}>
                <img src={img.image_path.startsWith("http") ? img.image_path : `/media/${img.image_path}`} alt="" className={img.is_main ? "selected" : ""} />
                <button type="button" onClick={() => handleSetMainImage(img.id)}>Сделать главной</button>
                <button type="button" onClick={() => handleDeleteImage(img.id)}>Удалить</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button type="submit">{productId ? "Сохранить" : "Создать"}</button>
          {productId && (
            <button type="button" onClick={handleDeleteProduct} style={{ backgroundColor: "#c9302c", marginLeft: "10px" }}>
              Удалить
            </button>
          )}
        </div>

        {message && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{message}</p>}
      </form>
    </div>
  );
}
