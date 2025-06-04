import React, { useState } from "react";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          localStorage.setItem("username", username);
          setError(null);
          onLoginSuccess(data.role);
        }
      })
      .catch(() => setError("Login request failed"));
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/images/your-background.jpg')", // Change this path accordingly
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 40,
          borderRadius: 10,
          width: 360,
          minHeight: 480,
          boxShadow: "0 0 15px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 30 }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Role:
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: 6, marginBottom: 20 }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: 6, marginBottom: 20 }}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: 6, marginBottom: 30 }}
            />
          </label>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#007bff",
              border: "none",
              color: "white",
              fontSize: "16px",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: 20, textAlign: "center" }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
