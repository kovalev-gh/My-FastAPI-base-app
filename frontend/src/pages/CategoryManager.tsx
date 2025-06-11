import React, { useEffect, useState } from "react";
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

  const loadCategories = async () => {
    const result = await getCategories();
    setCategories(result);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory(newCategoryName.trim());
    setNewCategoryName("");
    loadCategories();
  };

  const handleDelete = async (id: number) => {
    await deleteCategory(id);
    loadCategories();
  };

  const handleRestore = async (name: string) => {
    await restoreCategory(name);
    loadCategories();
  };

  const handleEdit = async (id: number) => {
    if (!editedName.trim()) return;
    await updateCategory(id, editedName.trim());
    setEditModeId(null);
    setEditedName("");
    loadCategories();
  };

  const activeCategories = categories.filter(cat => !cat.is_deleted);
  const deletedCategories = categories.filter(cat => cat.is_deleted);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📂 Управление категориями</h2>

      <h4>Добавить категорию</h4>
      <input
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        placeholder="Название категории"
      />
      <button onClick={handleCreate}>Добавить</button>

      <h4>Активные категории</h4>
      <ul>
        {activeCategories.map((cat) => (
          <li key={cat.id}>
            {editModeId === cat.id ? (
              <>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
                <button onClick={() => handleEdit(cat.id)}>Сохранить</button>
                <button onClick={() => setEditModeId(null)}>Отмена</button>
              </>
            ) : (
              <>
                {cat.name}
                <button
                  onClick={() => {
                    setEditModeId(cat.id);
                    setEditedName(cat.name);
                  }}
                >
                  ✏️
                </button>
                <button onClick={() => handleDelete(cat.id)}>🗑️</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {deletedCategories.length > 0 && (
        <>
          <h4>Удалённые категории</h4>
          <ul>
            {deletedCategories.map((cat) => (
              <li key={cat.id} style={{ color: "#888" }}>
                {cat.name}
                <button onClick={() => handleRestore(cat.name)}>♻️</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default CategoryManager;
