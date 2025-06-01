import React, { useState, useEffect } from "react";
import CategoryList from "./components/CategoryList";
import ProductList from "./components/ProductList";
import './App.css';

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [season, setSeason] = useState("Spring");
  const [originalPrices, setOriginalPrices] = useState({});
  const [discountsBySeason, setDiscountsBySeason] = useState({});
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);

    fetch("http://localhost:5000/api/originalPrices")
      .then((res) => res.json())
      .then(setOriginalPrices)
      .catch(console.error);

    fetch("http://localhost:5000/api/discounts")
      .then((res) => res.json())
      .then(setDiscountsBySeason)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    fetch(`http://localhost:5000/api/products?category=${selectedCategory}&season=${season}`)
      .then((res) => res.json())
      .then((fetchedProducts) => {
        const seasonalDiscounts = discountsBySeason[season] || {};

        const merged = fetchedProducts.map((p) => {
          const original_price = originalPrices[p.name] ?? null;
          const discounted_price = seasonalDiscounts[p.name] ?? null;
          return { ...p, original_price, discounted_price };
        });

        setProducts(merged);
      })
      .catch(console.error);
  }, [selectedCategory, season, originalPrices, discountsBySeason]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const handleCheckout = () => {
    fetch("http://localhost:5000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cart)
    })
      .then((res) => res.json())
      .then((response) => {
        alert(response.message);
        setCart([]);
        setShowCart(false);
      })
      .catch(console.error);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
        <h1>Online Shop - Seasonal Discounts</h1>

        <label>
          Select Season:{" "}
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            style={{ marginBottom: 20 }}
          >
            <option>Spring</option>
            <option>Summer</option>
            <option>Fall</option>
            <option>Winter</option>
          </select>
        </label>

        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <ProductList products={products} addToCart={addToCart} />

        <button
          onClick={() => setShowCart(!showCart)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 1001,
            backgroundColor: "white",
            border: "1px solid #ddd",
            padding: "8px 12px",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          🛒 Cart ({cart.length})
        </button>

        {showCart && (
          <div className="cart-submenu">
            <h3>Cart</h3>
            <ul>
              {cart.map((item, idx) => (
                <li key={idx}>
                  {item.name} - ${item.discounted_price || item.original_price}
                </li>
              ))}
            </ul>
            <button onClick={handleCheckout}>Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
