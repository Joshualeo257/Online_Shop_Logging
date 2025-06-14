import React, { useEffect, useState } from "react";

function AdminPage({ onNavigate }) {
  const [discounts, setDiscounts] = useState({});
  const [products, setProducts] = useState([]);
  const [originalPrices, setOriginalPrices] = useState({});
  const [currentSeason, setCurrentSeason] = useState("Spring");

  // Compute seasons excluding "current_season"
  const seasons = Object.keys(discounts).filter((key) => key !== "current_season");

  // Load discounts and products on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/discounts")
    .then((res) => res.json())
    .then((data) => {
      setDiscounts(data);
      if (data.current_season) {
        setCurrentSeason(data.current_season);
      }
    })
    .catch(console.error);

    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        const prices = {};
        data.forEach((p) => {
          prices[p.name] = p.original_price;
        });
        setOriginalPrices(prices);
      })
      .catch(console.error);
  }, []);

  const handleDiscountChange = (season, productName, value) => {
    setDiscounts((prev) => {
      const newDiscounts = { ...prev };
      if (!newDiscounts[season]) newDiscounts[season] = {};
      newDiscounts[season][productName] = Number(value);
      return newDiscounts;
    });
  };

  const handleOriginalPriceChange = (productName, value) => {
    setOriginalPrices((prev) => ({
      ...prev,
      [productName]: Number(value),
    }));
  };

  const handleConfirmChanges = () => {
    fetch("http://localhost:5000/api/discounts/update-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discounts }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update discounts");
        return res.json();
      })
      .then((data) => alert(data.message))
      .catch((err) => alert("Error: " + err.message));
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto", position: "relative" }}>
      <h2>Admin Page - Manage Discounts</h2>

      <button
        onClick={() => onNavigate("manageProducts")}
        style={{ position: "fixed", bottom: 20, left: 20, padding: "10px 15px", cursor: "pointer" }}
      >
        Manage Products
      </button>

      <table border="1" cellPadding="8" cellSpacing="0" style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        border: "1px solid #ddd",
      }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Original Price ($)</th>
            {seasons.map((season) => (
              <th key={season}>{season} Discount ($)</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(({ name }) => (
            <tr key={name}>
              <td>{name}</td>
              <td>
                <input
                  type="number"
                  value={originalPrices[name] || ""}
                  onChange={(e) => handleOriginalPriceChange(name, e.target.value)}
                  style={{ width: 80 }}
                />
              </td>
              {seasons.map((season) => (
                <td key={season}>
                  <input
                    type="number"
                    value={discounts[season]?.[name] ?? ""}
                    onChange={(e) => handleDiscountChange(season, name, e.target.value)}
                    style={{ width: 80 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
  <label>
    Current Season:{" "}
    <select
      value={currentSeason}
      onChange={(e) => setCurrentSeason(e.target.value)}
    >
      {["Spring", "Summer", "Fall", "Winter"].map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </label>
  <button
    onClick={() => {
      const updated = { ...discounts, current_season: currentSeason };
      fetch("http://localhost:5000/api/discounts/update-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discounts: updated }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update season");
          return res.json();
        })
        .then((data) => alert(data.message))
        .catch((err) => alert("Error: " + err.message));
    }}
    style={{
      marginLeft: 10,
      padding: "5px 10px",
      backgroundColor: "#007BFF",
      color: "white",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
    }}
  >
    Update Season
  </button>
</div>

      <button
        onClick={handleConfirmChanges}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          padding: "12px 20px",
          fontWeight: "bold",
          cursor: "pointer",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 5,
        }}
      >
        Confirm Changes
      </button>
    </div>
  );
}

export default AdminPage;
