import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Category = { id: number; name: string };
type AttributeOption = { id: number; name: string };
type Attribute = { key: number | ""; value: string };

type ProductFormData = {
  title: string;
  description: string;
  sku: string;
  retailPrice: number | "";
  optPrice: number | "";
  quantity: number | "";
  subfolder: string;
  categoryId: number | "";
  attributes: Attribute[];
};

type ProductImage = {
  id: number;
  image_path: string;
  is_main: boolean;
};

const API_BASE = "http://localhost:8000/api"; // <=== Замени, если у тебя другой адрес бэка

export default function ProductForm() {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormData>({
    title: "",
    description: "",
    sku: "",
    retailPrice: "",
    optPrice: "",
    quantity: "",
    subfolder: "",
    categoryId: "",
    attributes: [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [mainExistingImageId, setMainExistingImageId] = useState<number | null>(null);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [mainNewFileIndex, setMainNewFileIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Загрузка категорий и характеристик
  useEffect(() => {
    async function fetchReferenceData() {
      try {
        const resCats = await fetch(`${API_BASE}/categories`);
        if (!resCats.ok) throw new Error("Ошибка загрузки категорий");
        const catsData = await resCats.json();
        if (!Array.isArray(catsData)) throw new Error("Некорректный формат категорий");
        setCategories(catsData);

        const resAttrs = await fetch(`${API_BASE}/attributes`);
        if (!resAttrs.ok) throw new Error("Ошибка загрузки характеристик");
        const attrsData = await resAttrs.json();
        if (!Array.isArray(attrsData)) throw new Error("Некорректный формат характеристик");
        setAttributeOptions(attrsData);
      } catch (err: any) {
        setMessage(err.message || "Ошибка при загрузке справочников");
      }
    }
    fetchReferenceData();
  }, []);

  // Загрузка продукта и фото при редактировании
  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) throw new Error("Продукт не найден");
        const data = await res.json();

        setForm({
          title: data.title || "",
          description: data.description || "",
          sku: data.sku || "",
          retailPrice: data.retailPrice ?? "",
          optPrice: data.optPrice ?? "",
          quantity: data.quantity ?? "",
          subfolder: data.subfolder || "",
          categoryId: data.categoryId || "",
          attributes:
            data.attributes?.map((a: any) => ({
              key: a.keyId,
              value: a.value,
            })) || [],
        });

        // Фото
        const resImgs = await fetch(`${API_BASE}/products/${productId}/images`);
        if (resImgs.ok) {
          const imgs: ProductImage[] = await resImgs.json();
          setExistingImages(imgs);
          const mainImg = imgs.find((i) => i.is_main);
          setMainExistingImageId(mainImg ? mainImg.id : null);
        }
      } catch (err: any) {
        setMessage(err.message || "Ошибка загрузки продукта");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const updateField = (field: keyof ProductFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const updateAttribute = (index: number, key: keyof Attribute, value: any) => {
    setForm((f) => {
      const attrs = [...f.attributes];
      attrs[index] = { ...attrs[index], [key]: value };
      return { ...f, attributes: attrs };
    });
  };

  const addAttribute = () => {
    setForm((f) => ({ ...f, attributes: [...f.attributes, { key: "", value: "" }] }));
  };

  const removeAttribute = (index: number) => {
    setForm((f) => {
      const attrs = [...f.attributes];
      attrs.splice(index, 1);
      return { ...f, attributes: attrs };
    });
  };

  const onNewFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setNewFiles(filesArray);

    const previews = filesArray.map((f) => URL.createObjectURL(f));
    setNewFilePreviews(previews);
    setMainNewFileIndex(filesArray.length ? 0 : null);
  };

  const setMainNewPhoto = (index: number) => {
    setMainNewFileIndex(index);
  };

  const setMainExistingPhoto = async (imageId: number) => {
    try {
      const res = await fetch(`${API_BASE}/products/images/${imageId}/set-main`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Не удалось установить главное фото");
      setMainExistingImageId(imageId);

      setExistingImages((imgs) =>
        imgs.map((img) => ({ ...img, is_main: img.id === imageId }))
      );
      setMessage("Главное изображение установлено");
    } catch (err: any) {
      setMessage(err.message || "Ошибка при установке главного фото");
    }
  };

  const deleteExistingPhoto = async (imageId: number) => {
    if (!window.confirm("Удалить фото?")) return;
    try {
      const res = await fetch(`${API_BASE}/products/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить фото");
      setExistingImages((imgs) => imgs.filter((img) => img.id !== imageId));
      if (mainExistingImageId === imageId) setMainExistingImageId(null);
      setMessage("Фото удалено");
    } catch (err: any) {
      setMessage(err.message || "Ошибка при удалении фото");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      title: form.title,
      description: form.description,
      sku: form.sku,
      retailPrice: Number(form.retailPrice),
      optPrice: Number(form.optPrice),
      quantity: Number(form.quantity),
      subfolder: form.subfolder,
      categoryId: Number(form.categoryId),
      attributes: form.attributes
        .filter((a) => a.key && a.value.trim() !== "")
        .map((a) => ({ keyId: Number(a.key), value: a.value })),
    };

    try {
      let res;
      if (productId) {
        res = await fetch(`${API_BASE}/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Ошибка сохранения продукта");
      const savedProduct = await res.json();

      // Загрузка новых файлов
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subfolder", form.subfolder);

        const uploadRes = await fetch(
          `${API_BASE}/products/${savedProduct.id}/upload-image`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          setMessage("Ошибка загрузки фото");
          break;
        }

        const uploadedImg = await uploadRes.json();

        if (i === mainNewFileIndex) {
          await fetch(`${API_BASE}/products/images/${uploadedImg.image_id}/set-main`, {
            method: "POST",
          });
          setMainExistingImageId(uploadedImg.image_id);
        }
      }

      setMessage("Продукт успешно сохранен");
      navigate(`/products/${savedProduct.id}`);
    } catch (err: any) {
      setMessage(err.message || "Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (!productId || !window.confirm("Удалить этот продукт?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка при удалении");
      setMessage("Продукт удален");
      navigate("/products");
    } catch (err: any) {
      setMessage(err.message || "Ошибка при удалении продукта");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto" }}>
      <h2>{productId ? "Редактирование продукта" : "Создание продукта"}</h2>

      {message && (
        <div style={{ padding: 10, backgroundColor: "#ffd", marginBottom: 20 }}>{message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Название *
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Описание
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            SKU *
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Розничная цена *
            <input
              type="number"
              min="0"
              value={form.retailPrice}
              onChange={(e) => updateField("retailPrice", e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Оптовая цена *
            <input
              type="number"
              min="0"
              value={form.optPrice}
              onChange={(e) => updateField("optPrice", e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Количество *
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Подпапка для фото *
            <input
              type="text"
              value={form.subfolder}
              onChange={(e) => updateField("subfolder", e.target.value)}
              placeholder="например phones/iphone5"
              required
            />
          </label>
        </div>

        <div>
          <label>
            Категория *
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", Number(e.target.value))}
              required
            >
              <option value="">-- Выберите категорию --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>Характеристики</h3>
          {form.attributes.map((attr, idx) => (
            <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <select
                value={attr.key}
                onChange={(e) => updateAttribute(idx, "key", Number(e.target.value))}
                required
              >
                <option value="">-- Выберите характеристику --</option>
                {attributeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(idx, "value", e.target.value)}
                required
              />
              <button type="button" onClick={() => removeAttribute(idx)}>
                Удалить
              </button>
            </div>
          ))}
          <button type="button" onClick={addAttribute}>
            Добавить характеристику
          </button>
        </div>

        <div style={{ marginTop: 30 }}>
          <h3>Новые фото (клик по фото — сделать главным)</h3>
          <input type="file" multiple accept="image/*" onChange={onNewFilesChange} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {newFilePreviews.map((src, idx) => (
              <div
                key={idx}
                style={{
                  border: idx === mainNewFileIndex ? "3px solid green" : "1px solid #ccc",
                  position: "relative",
                  padding: 2,
                  cursor: "pointer",
                }}
                onClick={() => setMainNewPhoto(idx)}
                title="Сделать главным фото"
              >
                <img src={src} alt={`new-photo-${idx}`} style={{ height: 100, display: "block" }} />
                {idx === mainNewFileIndex && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      backgroundColor: "green",
                      color: "white",
                      padding: "2px 6px",
                      fontSize: 12,
                      borderRadius: 3,
                      userSelect: "none",
                    }}
                  >
                    Главное
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>Загруженные фото (клик по фото — сделать главным)</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {existingImages.map((img) => (
              <div
                key={img.id}
                style={{
                  border: img.id === mainExistingImageId ? "3px solid blue" : "1px solid #ccc",
                  position: "relative",
                  padding: 2,
                  cursor: "pointer",
                }}
                onClick={() => setMainExistingPhoto(img.id)}
                title="Сделать главным фото"
              >
                <img
                  src={`/${img.image_path}`}
                  alt={`product-img-${img.id}`}
                  style={{ height: 100, display: "block" }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteExistingPhoto(img.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                  }}
                  title="Удалить фото"
                >
                  ×
                </button>
                {img.id === mainExistingImageId && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      backgroundColor: "blue",
                      color: "white",
                      padding: "2px 6px",
                      fontSize: 12,
                      borderRadius: 3,
                      userSelect: "none",
                    }}
                  >
                    Главное
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <button type="submit" disabled={loading}>
            Сохранить
          </button>
          {productId && (
            <button
              type="button"
              disabled={loading}
              onClick={deleteProduct}
              style={{ marginLeft: 10, backgroundColor: "red", color: "white" }}
            >
              Удалить продукт
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
