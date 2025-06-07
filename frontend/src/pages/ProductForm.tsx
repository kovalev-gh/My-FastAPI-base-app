import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  getProductById,
  getProductImages,
  uploadProductImage,
  deleteImage,
  setMainImage as setMainImageApi,
} from "../api/products";
import { getCategories } from "../api/categories";

export default function ProductForm() {
  const { productId } = useParams<{ productId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState("0");
  const [optPrice, setOptPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [subfolder, setSubfolder] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(0);
  const [message, setMessage] = useState("");
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const { data } = await getProductById(productId);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setRetailPrice(data.retail_price?.toString() ?? "0");
        setOptPrice(data.opt_price?.toString() ?? "0");
        setQuantity(data.quantity?.toString() ?? "0");
        setSubfolder(data.path ?? "");
        setCategoryId(data.category_id ?? null);

        const images = await getProductImages(productId);
        if (Array.isArray(images)) {
          setExistingImages(images);
          const mainIndex = images.findIndex((img: any) => img.is_main);
          setMainImageIndex(mainIndex >= 0 ? mainIndex : null);
        } else {
          setExistingImages([]);
        }
      } catch (err) {
        console.error("❌ Ошибка при загрузке товара:", err);
        setMessage("❌ Не удалось загрузить товар.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles(selectedFiles);
    setFilePreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
    setMainImageIndex(0);
  };

  const normalizeNumberInput = (value: string) => {
    return value.replace(/^0+(?!$)/, "").replace(/\D/g, "") || "0";
  };

  const getAbsoluteImageUrl = (url: string): string => {
    if (url.startsWith("http")) return url;
    const mediaIndex = url.indexOf("media/");
    if (mediaIndex !== -1) {
      return "/" + url.slice(mediaIndex);
    }
    return `/media/${url.replace(/^\/+/, "")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      let product;

      if (productId) {
        product = await updateProduct(productId, {
          title,
          description,
          retail_price: parseInt(retailPrice, 10),
          opt_price: parseInt(optPrice, 10),
          quantity: parseInt(quantity, 10),
          path: subfolder,
          category_id: categoryId,
        });
      } else {
        product = await createProduct({
          title,
          description,
          retail_price: parseInt(retailPrice, 10),
          opt_price: parseInt(optPrice, 10),
          quantity: parseInt(quantity, 10),
          category_id: categoryId!,
        });
      }

      if (files.length > 0 && subfolder) {
        const uploadedImageIds: string[] = [];

        for (const file of files) {
          const result = await uploadProductImage(product.id, file, subfolder);
          uploadedImageIds.push(result.image_id);
        }

        if (mainImageIndex !== null && uploadedImageIds[mainImageIndex]) {
          await setMainImageApi(uploadedImageIds[mainImageIndex]);
        }
      }

      setMessage("✅ Изменения успешно сохранены!");
      if (!productId) {
        setTitle("");
        setDescription("");
        setRetailPrice("0");
        setOptPrice("0");
        setQuantity("0");
        setSubfolder("");
        setFiles([]);
        setFilePreviews([]);
        setMainImageIndex(null);
        setCategoryId(null);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при сохранении товара");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSetMainImage = async (imageId: string) => {
    await setMainImageApi(imageId);
    const updatedImages = existingImages.map((img) => ({
      ...img,
      is_main: img.id === imageId,
    }));
    setExistingImages(updatedImages);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка товара...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{productId ? "Редактировать продукт" : "Добавить продукт"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название:</label><br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label>Описание:</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label>Розничная цена:</label><br />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={retailPrice}
            onChange={(e) => setRetailPrice(normalizeNumberInput(e.target.value))}
          />
        </div>

        <div>
          <label>Оптовая цена:</label><br />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={optPrice}
            onChange={(e) => setOptPrice(normalizeNumberInput(e.target.value))}
          />
        </div>

        <div>
          <label>Количество:</label><br />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={(e) => setQuantity(normalizeNumberInput(e.target.value))}
          />
        </div>

        <div>
          <label>Категория:</label><br />
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
          >
            <option value="" disabled>-- выберите категорию --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Путь к подпапке:</label><br />
          <input value={subfolder} onChange={(e) => setSubfolder(e.target.value)} />
        </div>

        <div>
          <label>Новые изображения:</label><br />
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        </div>

        {filePreviews.length > 0 && (
          <div>
            <label>Выберите главное изображение:</label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {filePreviews.map((preview, index) => (
                <div key={index} style={{ textAlign: "center" }}>
                  <img
                    src={preview}
                    alt={`preview-${index}`}
                    width={100}
                    height={100}
                    style={{
                      border: mainImageIndex === index ? "2px solid green" : "1px solid #ccc",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  /><br />
                  <input
                    type="radio"
                    name="mainImage"
                    checked={mainImageIndex === index}
                    onChange={() => setMainImageIndex(index)}
                  />
                  <div style={{ fontSize: "0.8rem" }}>{files[index]?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingImages.length > 0 && (
          <div>
            <label>Текущие изображения:</label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {existingImages.map((img, index) => (
                <div key={img.id} style={{ textAlign: "center" }}>
                  <img
                    src={getAbsoluteImageUrl(img.url)}
                    alt={`img-${index}`}
                    width={100}
                    height={100}
                    style={{
                      border: img.is_main ? "2px solid green" : "1px solid #ccc",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  /><br />
                  <button type="button" onClick={() => handleSetMainImage(img.id)}>Сделать главным</button><br />
                  <button type="button" onClick={() => handleDeleteImage(img.id)}>Удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit">{productId ? "Сохранить изменения" : "Создать"}</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
