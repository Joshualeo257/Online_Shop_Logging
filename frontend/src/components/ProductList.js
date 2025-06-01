import React from "react";

function ProductList({ products, addToCart }) {
  return (
    <div>
      {products.map((product) => (
        <div key={product.name} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px", borderRadius: "8px" }}>
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: "100%", maxWidth: "300px", height: "auto", marginBottom: "10px" }}
          />
          <h3>{product.name}</h3>

          {product.discounted_price != null ? (
            <div>
              <span style={{ textDecoration: "line-through", color: "gray", marginRight: "10px" }}>
                ${product.original_price}
              </span>
              <span style={{ fontWeight: "bold", color: "green" }}>
                ${product.discounted_price}
              </span>
            </div>
          ) : (
            <div>
              <span style={{ fontWeight: "bold" }}>${product.original_price}</span>
            </div>
          )}

          <button
            onClick={() => addToCart(product)}
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
