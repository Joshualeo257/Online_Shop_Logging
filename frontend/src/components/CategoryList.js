import React from "react";

export default function CategoryList({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div>
      <h3>Categories</h3>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          style={{
            margin: "0 10px 10px 0",
            padding: "8px 16px",
            backgroundColor: selectedCategory === cat ? "#007bff" : "#ccc",
            color: selectedCategory === cat ? "#fff" : "#000",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
