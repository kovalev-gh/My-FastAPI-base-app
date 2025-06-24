// ProductForm.tsx
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
import { getAllAttributes } from "../api/attributes";

export default function ProductForm() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState("0");
  const [optPrice, setOptPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [subfolder, setSubfolder] = useState("products/phones/iphone15");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<any[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(0);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCategories().then(setCategories);
    getAllAttributes().then((res) => setAttributes(res?.data || res));
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const { data } = await getProductById(productId);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setRetailPrice(data.retail_price?.toString() ?? "0");
        setOptPrice(data.opt_price?.toString() ?? "0");
        setQuantity(data.quantity?.toString() ?? "0");
        setSubfolder(data.path ?? "products/phones/iphone15");
        setCategoryId(data.category_id ?? null);
        setSelectedAttributes(data.attributes || []);

        const images = await getProductImages(productId);
        console.log("📷 Полученные изображения:", images);
        setExistingImages(images);
        const mainIdx = images.findIndex((img: any) => img.is_main);
        setMainImageIndex(mainIdx >= 0 ? mainIdx : null);
      } catch (err) {
        console.error("❌ Ошибка загрузки товара", err);
        setMessage("❌ Не удалось загрузить товар.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const normalizeNumberInput = (value: string) =>
    value.replace(/^0+(?!$)/, "").replace(/\D/g, "") || "0";

  const getImageUrl = (img: any): string => {
    if (!img) return "";

    let path = img.image_path || img.url || "";

    // Убираем префикс /api/v1 если он есть
    path = path.replace(/^\/?api\/v1\/?/, "");

    // Если путь уже начинается с /media, возвращаем как есть
    if (path.startsWith("media/") || path.startsWith("/media/")) {
      return path.startsWith("/") ? path : "/" + path;
    }

    // Добавляем /media вручную
    return `/media/${path.replace(/^\/+/, "")}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setFilePreviews(selected.map((file) => URL.createObjectURL(file)));
    setMainImageIndex(0);
    console.log("🖼️ Новые файлы выбраны:", selected.map(f => f.name));
  };

  const handleAddAttribute = () => {
    setSelectedAttributes([...selectedAttributes, { attribute_id: "", value: "" }]);
  };

  const handleAttrChange = (index: number, field: string, value: string) => {
    const updated = [...selectedAttributes];
    updated[index][field] = value;
    setSelectedAttributes(updated);
  };

  const handleRemoveAttr = (index: number) => {
    const updated = [...selectedAttributes];
    updated.splice(index, 1);
    setSelectedAttributes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = {
        title,
        description,
        retail_price: parseInt(retailPrice, 10),
        opt_price: parseInt(optPrice, 10),
        quantity: parseInt(quantity, 10),
        path: subfolder,
        category_id: categoryId!,
        attributes: selectedAttributes,
      };

      const product = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      console.log("✅ Продукт сохранён:", product);

      if (files.length > 0 && subfolder) {
        const uploadedImageIds: string[] = [];

        for (const file of files) {
          const result = await uploadProductImage(product.id, file, subfolder);
          uploadedImageIds.push(result.image_id);
          console.log("📤 Изображение загружено:", result.image_path || result.url);
        }

        if (mainImageIndex !== null && uploadedImageIds[mainImageIndex]) {
          await setMainImageApi(uploadedImageIds[mainImageIndex]);
          console.log("⭐ Главное изображение установлено:", uploadedImageIds[mainImageIndex]);
        }
      }

      const updatedImages = await getProductImages(product.id);
      setExistingImages(updatedImages);
      setMessage("✅ Изменения сохранены!");
    } catch (error) {
      console.error("❌ Ошибка при сохранении товара", error);
      setMessage("❌ Ошибка при сохранении товара");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    console.log("🗑️ Изображение удалено:", imageId);
  };

  const handleSetMainImage = async (imageId: string) => {
    await setMainImageApi(imageId);
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, is_main: img.id === imageId }))
    );
    console.log("⭐ Установлено как главное:", imageId);
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    if (!confirm("Удалить товар?")) return;
    await deleteProduct(productId);
    navigate("/products");
  };

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit}>
        <label>Название:</label><br />
        <input value={title} onChange={(e) => setTitle(e.target.value)} /><br />

        <label>Описание:</label><br />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} /><br />

        <label>Розничная цена:</label><br />
        <input value={retailPrice} onChange={(e) => setRetailPrice(normalizeNumberInput(e.target.value))} /><br />

        <label>Оптовая цена:</label><br />
        <input value={optPrice} onChange={(e) => setOptPrice(normalizeNumberInput(e.target.value))} /><br />

        <label>Количество:</label><br />
        <input value={quantity} onChange={(e) => setQuantity(normalizeNumberInput(e.target.value))} /><br />

        <label>Категория:</label><br />
        <select value={categoryId ?? ""} onChange={(e) => setCategoryId(Number(e.target.value))}>
          <option value="">-- выберите категорию --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select><br />

        <label>Подпапка (сохранение):</label><br />
        <input value={subfolder} onChange={(e) => setSubfolder(e.target.value)} /><br />

        <label>Атрибуты:</label><br />
        {selectedAttributes.map((attr, index) => (
          <div key={index}>
            <select value={attr.attribute_id} onChange={(e) => handleAttrChange(index, "attribute_id", e.target.value)}>
              <option value="">-- выбрать --</option>
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>{a.name.replace(/^meta_/, "")}</option>
              ))}
            </select>
            <input value={attr.value} onChange={(e) => handleAttrChange(index, "value", e.target.value)} />
            <button type="button" onClick={() => handleRemoveAttr(index)}>Удалить</button>
          </div>
        ))}
        <button type="button" onClick={handleAddAttribute}>Добавить характеристику</button><br />

        <label>Загрузить изображения:</label><br />
        <input type="file" accept="image/*" multiple onChange={handleFileChange} /><br />

        {filePreviews.length > 0 && (
          <div>
            <p>Новые изображения:</p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {filePreviews.map((src, index) => (
                <div key={index}>
                  <img src={src} width={100} height={100} />
                  <input
                    type="radio"
                    checked={mainImageIndex === index}
                    onChange={() => setMainImageIndex(index)}
                  />
                  <label>Главное</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingImages.length > 0 && (
          <div>
            <p>Загруженные изображения:</p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {existingImages.map((img) => (
                <div key={img.id}>
                  <img src={getImageUrl(img)} width={100} height={100} />
                  {img.is_main && <p><strong>Главное</strong></p>}
                  <button type="button" onClick={() => handleSetMainImage(img.id)}>Сделать главным</button>
                  <button type="button" onClick={() => handleDeleteImage(img.id)}>Удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <br />
        <button type="submit">{productId ? "Сохранить" : "Создать"}</button>{" "}
        {productId && (
          <button type="button" onClick={handleDeleteProduct} style={{ backgroundColor: "red", color: "white" }}>
            Удалить товар
          </button>
        )}
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
