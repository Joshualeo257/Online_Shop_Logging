const { MongoClient } = require("mongodb");

// Replace with your MongoDB URI
const uri = "mongodb://127.0.0.1:27017"; // or your MongoDB Atlas URI

// DB and Collection name
const dbName = "myTestDB";
const collectionName = "testCollection";

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const sampleData = {
      message: "Hello, MongoDB!",
      timestamp: new Date()
    };

    const result = await collection.insertOne(sampleData);
    console.log("📝 Document inserted:", result.insertedId);
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

run();
