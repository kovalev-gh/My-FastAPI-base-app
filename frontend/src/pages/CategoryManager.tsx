import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from "../api/categories";

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editModeId, setEditModeId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadCategories = async () => {
    const result = await getCategories();
    setCategories(result);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    setErrorMessage("");
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName("");
      await loadCategories();
    } catch (err: any) {
      if (err.response?.status === 400) {
        setErrorMessage("Категория с таким именем уже существует.");
      } else {
        setErrorMessage("Ошибка при создании категории.");
        console.error("Ошибка создания категории:", err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    await deleteCategory(id);
    await loadCategories();
  };

  const handleRestore = async (name: string) => {
    await restoreCategory(name);
    await loadCategories();
  };

  const handleEdit = async (id: number) => {
    setErrorMessage("");
    if (!editedName.trim()) return;

    try {
      await updateCategory(id, editedName.trim());
      setEditModeId(null);
      setEditedName("");
      await loadCategories();
    } catch (err: any) {
      if (err.response?.status === 400) {
        setErrorMessage("Ошибка: имя уже используется.");
      } else {
        setErrorMessage("Ошибка при редактировании.");
        console.error("Ошибка редактирования категории:", err);
      }
    }
  };

  const activeCategories = categories.filter(cat => !cat.is_deleted);
  const deletedCategories = categories.filter(cat => cat.is_deleted);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📂 Управление категориями</h2>

      <h4>Добавить категорию</h4>
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Название категории"
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={handleCreate}>Добавить</button>
      </div>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{errorMessage}</div>
      )}

      <h4>Активные категории</h4>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {activeCategories.map((cat) => (
          <li key={cat.id} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
            {editModeId === cat.id ? (
              <>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{ marginRight: "0.5rem" }}
                />
                <button onClick={() => handleEdit(cat.id)} style={{ marginRight: "0.5rem" }}>Сохранить</button>
                <button onClick={() => setEditModeId(null)}>Отмена</button>
              </>
            ) : (
              <>
                <span style={{ minWidth: "150px" }}>{cat.name}</span>
                <div style={{ display: "flex", gap: "0.3rem", marginLeft: "1rem" }}>
                  <button onClick={() => {
                    setEditModeId(cat.id);
                    setEditedName(cat.name);
                  }}>✏️</button>
                  <button onClick={() => handleDelete(cat.id)}>🗑️</button>
                  <Link to={`/admin/category-attributes/${cat.id}`}>
                    <button title="Управление атрибутами">⚙️</button>
                  </Link>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {deletedCategories.length > 0 && (
        <>
          <h4>Удалённые категории</h4>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {deletedCategories.map((cat) => (
              <li key={cat.id} style={{ display: "flex", alignItems: "center", color: "#888", marginBottom: "0.5rem" }}>
                <span style={{ minWidth: "150px", textDecoration: "line-through" }}>{cat.name}</span>
                <button onClick={() => handleRestore(cat.name)} style={{ marginLeft: "1rem" }}>♻️</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default CategoryManager;
