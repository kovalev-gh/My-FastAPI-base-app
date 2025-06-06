import { useState } from "react";
import { createProduct, uploadProductImage, setMainImage } from "../api/products";

export default function ProductForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState(0);
  const [optPrice, setOptPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [subfolder, setSubfolder] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

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

      if (file && subfolder) {
        const imageUpload = await uploadProductImage(product.id, file, subfolder);
        await setMainImage(imageUpload.image_id);
      }

      setMessage("✅ Товар успешно добавлен!");
      setTitle("");
      setDescription("");
      setRetailPrice(0);
      setOptPrice(0);
      setQuantity(0);
      setSubfolder("");
      setFile(null);
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
          <label>Изображение товара:</label><br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button type="submit">Создать</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
