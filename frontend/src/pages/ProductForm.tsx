import { useState } from "react";
import { createProduct } from "../api/products";

export default function ProductForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState(0);
  const [optPrice, setOptPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createProduct({
        title,
        description,
        retail_price: retailPrice,
        opt_price: optPrice,
        quantity,
      });
      setMessage("✅ Товар успешно добавлен!");
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при добавлении товара");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Добавить продукт</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Название</label><br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Описание</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Розничная цена</label><br />
          <input
            type="number"
            value={retailPrice}
            onChange={(e) => setRetailPrice(+e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Оптовая цена</label><br />
          <input
            type="number"
            value={optPrice}
            onChange={(e) => setOptPrice(+e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Количество</label><br />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(+e.target.value)}
          />
        </div>

        <button type="submit">Создать</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
