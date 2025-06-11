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

  useEffect(() => {
    getCategories().then(setCategories);
    getAllAttributes().then((res) => setAllAttributes(res.data));
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      getCategoryAttributes(selectedCategoryId).then((res) => setAttributes(res.data));
    }
  }, [selectedCategoryId]);

  const handleAddAttribute = async () => {
    if (!newAttrName.trim() || selectedCategoryId === null) return;

    let attr = allAttributes.find((a) => a.name === newAttrName);

    if (!attr) {
      const res = await createAttribute({
        name: newAttrName.trim(),
        unit: newAttrUnit.trim(),
      });
      attr = res.data;
      setAllAttributes([...allAttributes, attr]);
    }

    await bindAttributeToCategory(selectedCategoryId, attr.id);

    const updated = await getCategoryAttributes(selectedCategoryId);
    setAttributes(updated.data);

    setNewAttrName("");
    setNewAttrUnit("");
  };

  const handleRemoveAttribute = async (attrId: number) => {
    if (selectedCategoryId === null) return;
    await unbindAttributeFromCategory(selectedCategoryId, attrId);
    const updated = await getCategoryAttributes(selectedCategoryId);
    setAttributes(updated.data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧩 Управление атрибутами категорий</h2>

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
            {attributes.map((attr) => (
              <li key={attr.id} style={{ marginBottom: "0.4rem" }}>
                {attr.name} {attr.unit ? `(${attr.unit})` : ""}
                <button onClick={() => handleRemoveAttribute(attr.id)} style={{ marginLeft: "1rem" }}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>

          <h4>Добавить атрибут</h4>
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
