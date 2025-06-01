from pymongo import MongoClient

# Connection URI (adjust if using remote MongoDB or Atlas)
MONGO_URI = "mongodb://localhost:27017"

try:
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    print("✅ Connected to MongoDB!")

    # 1. Create or access a database
    db = client["online_shop_test"]

    # 2. Create or access a collection
    products_collection = db["cart_items"]

    # 3. Insert an item into the collection
    sample_product = {
        "name": "Coffee maker",
        "original_price": 100.0,
        "discounted_price": 75.0
    }

    insert_result = products_collection.insert_one(sample_product)
    print(f"📦 Inserted product with ID: {insert_result.inserted_id}")

    # 4. Display all items in the collection
    print("\n🛒 Current items in 'cart_items':")
    for item in products_collection.find():
        print(item)

except Exception as e:
    print("❌ MongoDB connection or operation failed:", e)
