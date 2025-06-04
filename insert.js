const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017/';
const client = new MongoClient(uri);

const BASE_URL = 'http://localhost:5000/images';

const products = [
  // Electronics
  { name: "Airpods", category: "Electronics", original_price: 150, image_url: `${BASE_URL}/Airpods.jpg` },
  { name: "Smartwatch", category: "Electronics", original_price: 200, image_url: `${BASE_URL}/Smartwatch.jpg` },
  { name: "Camera", category: "Electronics", original_price: 400, image_url: `${BASE_URL}/Camera.jpg` },
  { name: "Laptop", category: "Electronics", original_price: 1000, image_url: `${BASE_URL}/Laptop.jpg` },
  { name: "Speaker", category: "Electronics", original_price: 120, image_url: `${BASE_URL}/Speaker.jpg` },
  { name: "TV", category: "Electronics", original_price: 800, image_url: `${BASE_URL}/TV.jpg` },

  // Home Appliances
  { name: "Blender", category: "Home Appliances", original_price: 60, image_url: `${BASE_URL}/Blender.jpg` },
  { name: "Kettle", category: "Home Appliances", original_price: 40, image_url: `${BASE_URL}/Kettle.jpg` },
  { name: "Coffee maker", category: "Home Appliances", original_price: 120, image_url: `${BASE_URL}/Coffee%20maker.jpg` },
  { name: "Vacuum cleaner", category: "Home Appliances", original_price: 150, image_url: `${BASE_URL}/Vacuum%20cleaner.jpg` },

  // Fitness
  { name: "Treadmill", category: "Fitness", original_price: 900, image_url: `${BASE_URL}/Treadmill.jpg` },
  { name: "Desk", category: "Fitness", original_price: 300, image_url: `${BASE_URL}/Desk.jpg` },
];

async function insertProducts() {
  try {
    await client.connect();
    const db = client.db("online_shop");
    const collection = db.collection("products");

    const result = await collection.insertMany(products);
    console.log("✅ Inserted products:", result.insertedCount);
  } catch (error) {
    console.error("❌ Error inserting products:", error);
  } finally {
    await client.close();
  }
}

insertProducts();