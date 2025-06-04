// Toast.js
import React from "react";

function Toast({ message, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", // ✅ Use fixed to anchor to viewport
        top: "100px",
        right: "10px",
        backgroundColor: "#f0f8ff",
        border: "1px solid #ccc",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 9999,
        cursor: "pointer",
        maxWidth: "300px",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
