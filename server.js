const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
const PORT = 5000;

const promClient = require('prom-client');

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const register = new promClient.Registry();

//HTTP request counter metric
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestCounter);

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

app.use(cors());

// Load discounts and original prices JSON once at startup
const BASE_DIR = __dirname;
const discountsPath = path.join(BASE_DIR, 'discounts.json');
const originalPricesPath = path.join(BASE_DIR, 'originalPrices.json');
const imagesDir = path.join(BASE_DIR, 'images');

let discountsData = {};
let originalPricesData = {};

const currentSeason = "Winter";

// Load JSON files function
function loadData() {
  discountsData = JSON.parse(fs.readFileSync(discountsPath));
  originalPricesData = JSON.parse(fs.readFileSync(originalPricesPath));
}

// Initial load
loadData();

// Optional: Reload data every 10 minutes (or on demand)
setInterval(loadData, 10 * 60 * 1000);

const productsByCategory = {
  "Electronics": ["Airpods", "Smartwatch", "Camera", "Laptop", "Speaker", "TV"],
  "Home Appliances": ["Blender", "Kettle", "Coffee maker", "Vacuum cleaner"],
  "Fitness": ["Treadmill", "Desk"]
};


// MongoDB config
const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'onlineShop';
const COLLECTION_NAME = 'purchases';

const uri = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(uri);

let checkoutCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("online_shop");
    checkoutCollection = db.collection("checkout");
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

// Call this once on server startup
connectDB();


// Routes

app.get('/', (req, res) => {
  res.send('Express API server is running.');
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.get('/api/discounts', (req, res) => {
  res.json(discountsData);
});

app.get('/api/currentSeason', (req, res) => {
  res.json({ current_season: currentSeason });
});

app.get('/api/discounts', (req, res) => {
  res.json(discountsData);
});

app.get('/api/originalPrices', (req, res) => {
  res.json(originalPricesData);
});

app.get('/api/categories', (req, res) => {
  res.json(Object.keys(productsByCategory));
});

app.get('/api/products', (req, res) => {
  const category = req.query.category;
  if (!category || !productsByCategory[category]) {
    return res.status(400).json({ error: 'Invalid or missing category' });
  }

  const seasonalDiscounts = discountsData[currentSeason] || [];

  const products = productsByCategory[category].map(product => {
    const original_price = originalPricesData[product] || null;
    const discounted_price = (discountsData[currentSeason] && discountsData[currentSeason][product]) || null;
    const image_url = `http://localhost:${PORT}/images/${encodeURIComponent(product)}.jpg`;

    return {
      name: product,
      original_price,
      discounted_price,
      image_url
    };
  });

  res.json(products);
});

app.post('/api/checkout', async (req, res) => {
  try {
    const items = req.body.items;  
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid data format, expected array" });
    }

    const checkoutRecord = {
      timestamp: new Date(),
      items: items
    };

    const result = await checkoutCollection.insertOne(checkoutRecord);;
    res.json({ message: "Checkout successful", insertedIds: result.insertedIds });
  } catch (error) {
    console.error("❌ Error saving to MongoDB:", error);
    res.status(500).json({ error: "Failed to save purchase" });
  }
});

// Serve images statically
app.use('/images', express.static(imagesDir));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
