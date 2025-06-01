from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_FOLDER = os.path.join(BASE_DIR, "images")

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["online_shop"]
checkout_collection = db["checkout"]

@app.route("/")
def home():
    return "Flask API server is running."

# Load discounts and original prices
with open(os.path.join(BASE_DIR, "discounts.json")) as f:
    discounts_data = json.load(f)

with open(os.path.join(BASE_DIR, "originalPrices.json")) as f:
    original_prices_data = json.load(f)

products_by_category = {
    "Electronics": ["Airpods", "Smartwatch", "Camera", "Laptop", "Speaker", "TV"],
    "Home Appliances": ["Blender", "Kettle", "Coffee maker", "Vacuum cleaner"],
    "Fitness": ["Treadmill", "Desk"]
}

@app.route('/api/discounts')
def get_discounts():
    return jsonify(discounts_data)

@app.route('/api/originalPrices')
def get_original_prices():
    return jsonify(original_prices_data)

@app.route("/api/categories")
def get_categories():
    return jsonify(list(products_by_category.keys()))

@app.route("/api/products")
def get_products():
    category = request.args.get("category")
    season = request.args.get("season", "Spring")

    if not category or category not in products_by_category:
        return jsonify({"error": "Invalid or missing category"}), 400

    products = []
    seasonal_discounts = discounts_data.get(season, {})

    for product in products_by_category[category]:
        original_price = original_prices_data.get(product)
        discounted_price = seasonal_discounts.get(product)

        image_filename = f"{product}.jpg"
        image_url = f"http://localhost:5000/images/{image_filename}"

        products.append({
            "name": product,
            "original_price": original_price,
            "discounted_price": discounted_price,
            "image_url": image_url
        })

    return jsonify(products)

@app.route("/api/checkout", methods=["POST"])
def checkout():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    result = checkout_collection.insert_many(data)
    return jsonify({"message": "Checkout successful", "inserted_ids": [str(_id) for _id in result.inserted_ids]})

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)