import { useState } from "react";
import { createProduct, uploadProductImage, setMainImage } from "../api/products";

export default function ProductForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState(0);
  const [optPrice, setOptPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [subfolder, setSubfolder] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles(selectedFiles);
    setFilePreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
    setMainImageIndex(0); // По умолчанию первое изображение — главное
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const product = await createProduct({
        title,
        description,
        retail_price: retailPrice,
        opt_price: optPrice,
        quantity,
      });

      if (files.length > 0 && subfolder) {
        const uploadedImageIds: string[] = [];

        for (const file of files) {
          const result = await uploadProductImage(product.id, file, subfolder);
          uploadedImageIds.push(result.image_id);
        }

        if (mainImageIndex !== null && uploadedImageIds[mainImageIndex]) {
          await setMainImage(uploadedImageIds[mainImageIndex]);
        }
      }

      setMessage("✅ Товар успешно добавлен!");
      setTitle("");
      setDescription("");
      setRetailPrice(0);
      setOptPrice(0);
      setQuantity(0);
      setSubfolder("");
      setFiles([]);
      setFilePreviews([]);
      setMainImageIndex(null);
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при создании товара");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Добавить продукт</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Название:</label><br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Описание:</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Розничная цена:</label><br />
          <input
            type="number"
            min="0"
            value={retailPrice}
            onChange={(e) =>
              setRetailPrice(parseInt(e.target.value.replace(/^0+/, "") || "0", 10))
            }
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Оптовая цена:</label><br />
          <input
            type="number"
            min="0"
            value={optPrice}
            onChange={(e) =>
              setOptPrice(parseInt(e.target.value.replace(/^0+/, "") || "0", 10))
            }
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Количество:</label><br />
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) =>
              setQuantity(parseInt(e.target.value.replace(/^0+/, "") || "0", 10))
            }
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Путь к подпапке (например: phones/iphone5):</label><br />
          <input
            value={subfolder}
            onChange={(e) => setSubfolder(e.target.value)}
            placeholder="phones/iphone5"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Изображения товара:</label><br />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {filePreviews.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
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

        <button type="submit">Создать</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
