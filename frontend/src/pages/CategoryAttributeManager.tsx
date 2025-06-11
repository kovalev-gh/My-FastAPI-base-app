import React, { useEffect, useState } from "react";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [allAttributes, setAllAttributes] = useState<any[]>([]);

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
      const res = await createAttribute(newAttrName);
      attr = res.data;
      setAllAttributes([...allAttributes, attr]);
    }

    await bindAttributeToCategory(selectedCategoryId, attr.id);
    const updated = await getCategoryAttributes(selectedCategoryId);
    setAttributes(updated.data);
    setNewAttrName("");
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
              <li key={attr.id}>
                {attr.name}{" "}
                <button onClick={() => handleRemoveAttribute(attr.id)}>Удалить</button>
              </li>
            ))}
          </ul>

          <h4>Добавить атрибут</h4>
          <input
            type="text"
            placeholder="Название атрибута"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
          />
          <button onClick={handleAddAttribute}>Добавить</button>
        </>
      )}
    </div>
  );
};

export default CategoryAttributeManager;
