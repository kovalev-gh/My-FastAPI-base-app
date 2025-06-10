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

// ВСТРОЕННЫЕ СТИЛИ CSS
const style = `
  body {
    font-family: sans-serif;
    background: #f7f7f7;
    margin: 0;
    padding: 2rem;
  }
  .container {
    max-width: 700px;
    margin: auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.05);
  }
  h2 {
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }
  label {
    display: block;
    margin-bottom: 4px;
    font-weight: bold;
  }
  input[type="text"],
  input[type="file"],
  textarea,
  select {
    width: 100%;
    padding: 10px;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
  }
  button {
    padding: 10px 20px;
    border: none;
    background-color: #4a90e2;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
  }
  button:hover {
    background-color: #357ab8;
  }
  .attribute-row {
    display: flex;
    gap: 10px;
    margin-bottom: 0.5rem;
  }
  .attribute-row input {
    flex: 1;
  }
  .attribute-row button {
    background: #d9534f;
  }
  .attribute-row button:hover {
    background: #c9302c;
  }
  .image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 1rem;
  }
  .image-preview img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 5px;
    border: 2px solid transparent;
  }
  .image-preview img.selected {
    border-color: #28a745;
  }
`;

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
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);
  }, []);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    const load = async () => {
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

        const images = (await getProductImages(productId)).data || [];
        setExistingImages(images);
        setMainImageIndex(images.findIndex((img) => img.is_main));
      } catch {
        setMessage("❌ Ошибка при загрузке товара");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const normalizeNumber = (val) =>
    val.replace(/^0+(?!$)/, "").replace(/\D/g, "") || "0";

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setFilePreviews(selected.map((f) => URL.createObjectURL(f)));
    setMainImageIndex(0);
  };

  const handleAttributeChange = (i, field, value) => {
    const updated = [...attributes];
    updated[i][field] = value;
    setAttributes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) return setMessage("❌ Укажите категорию");

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
        const imageIds = [];
        for (const file of files) {
          const result = await uploadProductImage(product.id, file, form.subfolder);
          imageIds.push(result.data.image_id);
        }
        if (mainImageIndex !== null && imageIds[mainImageIndex]) {
          await setMainImageApi(imageIds[mainImageIndex]);
        }
      }

      setMessage("✅ Сохранено!");
      if (!productId) {
        setForm({ title: "", description: "", retailPrice: "0", optPrice: "0", quantity: "0", subfolder: "", categoryId: "" });
        setFiles([]);
        setFilePreviews([]);
        setAttributes([{ key: "", value: "" }]);
      }
    } catch {
      setMessage("❌ Ошибка при сохранении");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId || !window.confirm("Удалить товар?")) return;
    try {
      await deleteProduct(productId);
      navigate("/products");
    } catch {
      setMessage("❌ Не удалось удалить");
    }
  };

  const handleDeleteImage = async (id) => {
    await deleteImage(id);
    setExistingImages((imgs) => imgs.filter((i) => i.id !== id));
  };

  const handleSetMainImage = async (id) => {
    await setMainImageApi(id);
    setExistingImages((imgs) =>
      imgs.map((img) => ({ ...img, is_main: img.id === id }))
    );
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="container">
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit}>
        <label>Название</label>
        <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />

        <label>Описание</label>
        <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} />

        <label>Розничная цена</label>
        <input type="text" value={form.retailPrice} onChange={(e) => updateField("retailPrice", normalizeNumber(e.target.value))} />

        <label>Оптовая цена</label>
        <input type="text" value={form.optPrice} onChange={(e) => updateField("optPrice", normalizeNumber(e.target.value))} />

        <label>Количество</label>
        <input type="text" value={form.quantity} onChange={(e) => updateField("quantity", normalizeNumber(e.target.value))} />

        <label>Папка</label>
        <input type="text" value={form.subfolder} onChange={(e) => updateField("subfolder", e.target.value)} />

        <label>Категория</label>
        <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} required>
          <option value="">-- выберите --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <label>Характеристики</label>
        {attributes.map((attr, i) => (
          <div className="attribute-row" key={i}>
            <input value={attr.key} onChange={(e) => handleAttributeChange(i, "key", e.target.value)} placeholder="Ключ" />
            <input value={attr.value} onChange={(e) => handleAttributeChange(i, "value", e.target.value)} placeholder="Значение" />
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
              <img
                key={i}
                src={src}
                className={mainImageIndex === i ? "selected" : ""}
                onClick={() => setMainImageIndex(i)}
                alt=""
              />
            ))}
          </div>
        )}

        {existingImages.length > 0 && (
          <div className="image-preview">
            {existingImages.map((img) => (
              <div key={img.id}>
                <img
                  src={img.image_path.startsWith("http") ? img.image_path : `/media/${img.image_path}`}
                  className={img.is_main ? "selected" : ""}
                  alt=""
                />
                <button type="button" onClick={() => handleSetMainImage(img.id)}>Главное</button>
                <button type="button" onClick={() => handleDeleteImage(img.id)}>Удалить</button>
              </div>
            ))}
          </div>
        )}

        <button type="submit">{productId ? "Сохранить" : "Создать"}</button>
        {productId && (
          <button type="button" onClick={handleDeleteProduct} style={{ backgroundColor: "#c9302c", marginLeft: "10px" }}>
            Удалить
          </button>
        )}
      </form>
      {message && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}
