import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCategories,
  getCategoryAttributes,
  bindAttributeToCategory,
  unbindAttributeFromCategory,
} from "../api/categories";
import {
  getAllAttributes,
  createAttribute,
} from "../api/attributes";

const CategoryAttributeManager: React.FC = () => {
  const { categoryId } = useParams();
  const initialCategoryId = categoryId ? Number(categoryId) : null;

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [allAttributes, setAllAttributes] = useState<any[]>([]);

  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrUnit, setNewAttrUnit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then(setCategories);

    getAllAttributes().then((res) => {
      console.log("Получены все атрибуты:", res);
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        setAllAttributes(data);
      } else {
        console.error("Неверный формат ответа getAllAttributes:", res);
        setAllAttributes([]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      getCategoryAttributes(selectedCategoryId).then((res) => {
        console.log("Атрибуты категории:", res.data);
        setAttributes(res.data);
      });
    }
  }, [selectedCategoryId]);

  const handleAddAttribute = async () => {
    setError("");
    if (!newAttrName.trim() || selectedCategoryId === null) return;

    try {
      if (!Array.isArray(allAttributes)) {
        setError("Атрибуты не загружены.");
        return;
      }

      const trimmedName = newAttrName.trim();
      let attr = allAttributes.find((a) => {
        const displayName = a.name.startsWith("meta_") ? a.name.slice(5) : a.name;
        return displayName === trimmedName;
      });

      if (!attr) {
        console.log("Атрибут не найден, создаём новый...");

        const res = await createAttribute({
          name: "meta_" + trimmedName,
          unit: newAttrUnit.trim() || undefined,
        });

        console.log("Ответ от createAttribute:", res);

        attr = res?.data ?? res;

        if (!attr || !attr.id) {
          console.error("Ошибка: createAttribute не вернул объект с id:", attr);
          setError("Ошибка при создании атрибута.");
          return;
        }

        setAllAttributes((prev) => [...prev, attr]);
      } else {
        console.log("Найден существующий атрибут:", attr);
      }

      console.log(`Привязываем атрибут ID=${attr.id} к категории ID=${selectedCategoryId}`);

      await bindAttributeToCategory(selectedCategoryId, attr.id);

      const updated = await getCategoryAttributes(selectedCategoryId);
      setAttributes(updated.data);
      setNewAttrName("");
      setNewAttrUnit("");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "";
      console.error("Ошибка при добавлении атрибута:", err);

      if (detail === "ATTRIBUTE_NAME_CONFLICT") {
        setError("Атрибут с таким именем уже существует.");
      } else if (detail.includes("конфликтует с системным полем модели Product")) {
        setError("Нельзя создать атрибут с именем поля продукта.");
      } else if (detail === "ATTRIBUTE_ALREADY_LINKED" || detail.includes("уже существует в этой категории")) {
        setError("Атрибут уже привязан к этой категории.");
      } else {
        setError("Произошла неизвестная ошибка.");
      }
    }
  };

  const handleRemoveAttribute = async (attrId: number) => {
    if (selectedCategoryId === null) return;
    await unbindAttributeFromCategory(selectedCategoryId, attrId);
    const updated = await getCategoryAttributes(selectedCategoryId);
    setAttributes(updated.data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧹 Управление атрибутами категорий</h2>

      <label>Выберите категорию:</label>
      <select
        value={selectedCategoryId ?? ""}
        onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
        style={{ marginBottom: "1rem", marginLeft: "0.5rem" }}
      >
        <option value="">-- выберите --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {selectedCategoryId && (
        <>
          <h3>Атрибуты категории</h3>
          <ul>
            {attributes.map((attr) => {
              const displayName = attr.name.startsWith("meta_") ? attr.name.slice(5) : attr.name;
              return (
                <li key={attr.id} style={{ marginBottom: "0.4rem" }}>
                  {displayName} {attr.unit ? `(${attr.unit})` : ""}
                  <button onClick={() => handleRemoveAttribute(attr.id)} style={{ marginLeft: "1rem" }}>
                    Удалить
                  </button>
                </li>
              );
            })}
          </ul>

          <h4>Добавить атрибут</h4>
          {error && <div style={{ color: "red", marginBottom: "0.5rem" }}>{error}</div>}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Название"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Единицы (например: см, кг)"
              value={newAttrUnit}
              onChange={(e) => setNewAttrUnit(e.target.value)}
            />
            <button onClick={handleAddAttribute}>Добавить</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryAttributeManager;
