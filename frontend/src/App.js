import React, { useState, useEffect } from "react";
import Login from "./login";
import AdminPage from "./AdminPage";
import ManageProducts from "./ManageProducts";
import CategoryList from "./components/CategoryList";
import ProductList from "./components/ProductList";
import "./App.css";
import Toast from "./Toast";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [currentPage, setCurrentPage] = useState("home"); // 'home', 'admin', 'manageProducts'

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [season, setSeason] = useState(null);
  const [discountsBySeason, setDiscountsBySeason] = useState({});
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(true); 

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    if (role === "admin") setCurrentPage("admin");
    else setCurrentPage("home");
  };

  useEffect(() => {
    if (!isLoggedIn || userRole !== "user") return;

    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);

    fetch("http://localhost:5000/api/discounts")
      .then((res) => res.json())
      .then(setDiscountsBySeason)
      .catch(console.error);

    fetch("http://localhost:5000/api/currentSeason")
      .then((res) => res.json())
      .then((data) => setSeason(data.current_season))
      .catch(console.error);

    // NEW: Fetch toast message from backend
    fetch("http://localhost:5000/api/season-message")
      .then((res) => res.json())
      .then((data) => setToastMessage(data.message))
      .catch(console.error);
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    if (!isLoggedIn || userRole !== "user") return;
    if (!selectedCategory || !season) return;

    fetch(`http://localhost:5000/api/products?category=${selectedCategory}&season=${season}`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, [selectedCategory, season, isLoggedIn, userRole]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const handleCheckout = () => {
    fetch("http://localhost:5000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        items: cart,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        alert(response.message);
        setCart([]);
        setShowCart(false);
      })
      .catch(console.error);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} setUsername={setUsername} />;
  }

  if (userRole === "admin") {
    if (currentPage === "admin")
      return <AdminPage onNavigate={setCurrentPage} />;
    else if (currentPage === "manageProducts")
      return (
        <>
          <button
            onClick={() => setCurrentPage("admin")}
            style={{
              position: "fixed",
              top: 20,
              left: 20,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            &larr; Back to Admin
          </button>
          <ManageProducts />
        </>
      );
  }

  // User UI
  return (
    <div className="container">
      <button
        onClick={() => {
          localStorage.removeItem("username");
          setIsLoggedIn(false);
          setUserRole(null);
          setUsername("");
          setCurrentPage("home");
        }}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1001,
          backgroundColor: "white",
          border: "1px solid #ddd",
          padding: "8px 12px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      {toastMessage && showToast && (
    <Toast message={toastMessage} onClose={() => setShowToast(false)} />
  )}

      <div style={{ maxWidth: 700, margin: "auto", padding: 20, position: "relative" }}>
        <h1>Online Shop - Seasonal Discounts</h1>

        {season ? (
          <p>
            <strong>Current Season:</strong> {season}
          </p>
        ) : (
          <p>Loading season info...</p>
        )}

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
            cursor: "pointer",
          }}
        >
          🛒 Cart ({cart.length})
        </button>

        {showCart && (
          <div className="cart-submenu" style={{ backgroundColor: "white" }}>
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
