import React, { useEffect, useState } from "react";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    original_price: "",
    winter: "",
    summer: "",
    spring: "",
    fall: "",
    category: "",
    image: null,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("http://localhost:5000/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.original_price || !form.image) {
      alert("Please fill name, original price and upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("original_price", form.original_price);
    formData.append("winter", form.winter || "0");
    formData.append("summer", form.summer || "0");
    formData.append("spring", form.spring || "0");
    formData.append("fall", form.fall || "0");
    formData.append("category", form.category || "");
    formData.append("image", form.image);

    const res = await fetch("http://localhost:5000/api/products/add", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const newProduct = await res.json();
      setProducts((prev) => [...prev, newProduct]);
      setForm({
        name: "",
        original_price: "",
        winter: "",
        summer: "",
        spring: "",
        fall: "",
        category: "",
        image: null,
      });
      alert("Product added!");
    } else {
      alert("Failed to add product");
    }
  }

  async function handleDelete(name) {
    if (!window.confirm(`Delete product "${name}"?`)) return;

    const res = await fetch(`http://localhost:5000/api/products/name/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.name !== name));
      alert("Product deleted");
    } else {
      alert("Failed to delete product");
    }
  }

  return (
    <div>
      <h2>Manage Products</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
        {products.map(({ _id, name, original_price, image_url }) => (
          <div
            key={_id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 6,
              width: 150,
              padding: 10,
              background: "white",
              boxShadow: "0 0 5px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={image_url}
              alt={name}
              style={{ width: 120, height: 100, objectFit: "cover", borderRadius: 4 }}
            />
            <h4 style={{ margin: "8px 0 4px" }}>{name}</h4>
            <p style={{ margin: "0 0 6px" }}>${parseFloat(original_price).toFixed(2)}</p>
            <button
              onClick={() => handleDelete(name)}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Category:
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Original Price:
          <input
            type="number"
            name="original_price"
            value={form.original_price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Winter Discount (%):
          <input
            type="number"
            name="winter"
            value={form.winter}
            onChange={handleChange}
            min="0"
            max="100"
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Summer Discount (%):
          <input
            type="number"
            name="summer"
            value={form.summer}
            onChange={handleChange}
            min="0"
            max="100"
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Spring Discount (%):
          <input
            type="number"
            name="spring"
            value={form.spring}
            onChange={handleChange}
            min="0"
            max="100"
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Fall Discount (%):
          <input
            type="number"
            name="fall"
            value={form.fall}
            onChange={handleChange}
            min="0"
            max="100"
            style={{ width: "100%", marginBottom: 8 }}
          />
        </label>

        <label>
          Upload Image (.jpg only):
          <input
            type="file"
            name="image"
            accept=".jpg,.jpeg"
            onChange={handleChange}
            required
            style={{ marginBottom: 12 }}
          />
        </label>

        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          Add Product
        </button>
      </form>
    </div>
  );
}
