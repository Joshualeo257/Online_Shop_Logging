const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const promClient = require('prom-client');
const multer = require("multer");

const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors());

//multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, baseName + "-" + Date.now() + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      cb(new Error("Only JPG files are allowed"));
    }
  },
});

// Prometheus setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

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

// JSON Data
const BASE_DIR = __dirname;
const discountsPath = path.join(BASE_DIR, 'discounts.json');
const imagesDir = path.join(BASE_DIR, 'images');

let discountsData = {};
const currentSeason = "Winter";

function loadData() {
  discountsData = JSON.parse(fs.readFileSync(discountsPath));
}
loadData();
setInterval(loadData, 10 * 60 * 1000);

// MongoDB
const client = new MongoClient('mongodb://127.0.0.1:27017');
let productsCollection, checkoutCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("online_shop");
    productsCollection = db.collection("products");
    checkoutCollection = db.collection("checkout");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Express API server is running.');
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/discounts', (req, res) => {
  res.json(discountsData);
});

app.get('/api/currentSeason', (req, res) => {
  res.json({ current_season: currentSeason });
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await productsCollection.distinct("category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get('/api/season-message', (req, res) => {
  const filePath = path.join(__dirname, 'output.txt');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: "Error reading message file" });

    const lines = data.trim().split('\n');
    const message = lines.slice(-2).join('\n'); // Get last 2 lines
    res.json({ message });
  });
});
// Modified GET /api/products:
// - if query.category exists, filter by category (old behavior)
// - else return all products (for admin)
app.get('/api/products', async (req, res) => {
  const category = req.query.category;
  try {
    let query = {};
    if (category) {
      query.category = category;
    }
    const seasonalDiscounts = discountsData[currentSeason] || {};
    const products = await productsCollection.find(query).toArray();

    const enriched = products.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      original_price: p.original_price,
      discounted_price: seasonalDiscounts[p.name] || null,
      image_url: `http://localhost:${PORT}/images/${encodeURIComponent(p.image || p.name)}.jpg`
    }));

    res.json(enriched);
  } catch (error) {
    console.error("❌ Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// PATCH /api/products/:productId to update original price
app.patch('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;
  const { original_price } = req.body;

  if (typeof original_price !== 'number' || original_price < 0) {
    return res.status(400).json({ error: "Invalid original_price" });
  }

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { original_price } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Original price updated" });
  } catch (error) {
    console.error("❌ Failed to update product price:", error);
    res.status(500).json({ error: "Failed to update product price" });
  }
});

// PATCH /api/discounts/:season/:productName to update discounted price
app.patch('/api/discounts/:season/:productName', async (req, res) => {
  const { season, productName } = req.params;
  const { discounted_price } = req.body;

  if (!discountsData[season]) {
    return res.status(400).json({ error: "Invalid season" });
  }
  if (typeof discounted_price !== 'number' || discounted_price < 0) {
    return res.status(400).json({ error: "Invalid discounted_price" });
  }

  try {
    // discountsData is structured as:
    // { Winter: { "productName": discounted_price, ... }, Spring: {...}, ... }
    discountsData[season][productName] = discounted_price;

    // Save back to discounts.json file
    fs.writeFileSync(discountsPath, JSON.stringify(discountsData, null, 2));

    res.json({ message: "Discounted price updated" });
  } catch (error) {
    console.error("❌ Failed to update discounted price:", error);
    res.status(500).json({ error: "Failed to update discounted price" });
  }
});

app.post("/api/products/add", upload.single("image"), async (req, res) => {
  try {
    const { name, original_price, winter, summer, spring, fall, category } = req.body;

    if (!name || !original_price || !req.file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = {
      name,
      category,
      original_price: parseFloat(original_price),
      discounts: {
        winter: parseFloat(winter) || 0,
        summer: parseFloat(summer) || 0,
        spring: parseFloat(spring) || 0,
        fall: parseFloat(fall) || 0,
      },
      image_url: `http://localhost:${PORT}/images/${req.file.filename}`,
      image: req.file.filename.replace(".jpg", "") // for compatibility with display logic
    };

    // Insert into MongoDB
    const result = await productsCollection.insertOne(product);

    // Update discounts.json
    const discountsPath = path.join(__dirname, "discounts.json");
    let discountsJson = {};
    if (fs.existsSync(discountsPath)) {
      discountsJson = JSON.parse(fs.readFileSync(discountsPath, "utf-8"));
    }
    discountsJson[name] = {
      winter: product.discounts.winter,
      summer: product.discounts.summer,
      spring: product.discounts.spring,
      fall: product.discounts.fall,
    };
    fs.writeFileSync(discountsPath, JSON.stringify(discountsJson, null, 2));

    res.json({ _id: result.insertedId, ...product });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { username, items } = req.body;

    if (!username || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const checkoutRecord = {
      username,
      timestamp: new Date(),
      items,
    };

    const result = await checkoutCollection.insertOne(checkoutRecord);
    res.json({ message: "Checkout successful", insertedId: result.insertedId });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    res.status(500).json({ error: "Failed to save checkout" });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Missing credentials or role" });
  }
  try {
    const user = await client.db("online_shop").collection("users").findOne({ username, role });
    if (!user) {
      return res.status(401).json({ error: "User not found or role mismatch" });
    }
    // For now, compare plain text password (replace with hashing later)
    if (user.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    res.json({ message: "Login successful", role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/discounts/update-all", (req, res) => {
  const discounts = req.body.discounts;
  if (!discounts || typeof discounts !== "object") {
    return res.status(400).json({ message: "Invalid discounts data" });
  }

  const filePath = path.join(__dirname, "discounts.json");

  fs.writeFile(filePath, JSON.stringify(discounts, null, 2), (err) => {
    if (err) {
      console.error("Error saving discounts:", err);
      return res.status(500).json({ message: "Failed to save discounts" });
    }

    console.log("✅ Admin confirmed discount updates:", discounts);
    res.json({ message: "Discounts saved successfully" });
  });
});

app.delete("/api/products/name/:name", async (req, res) => {
  try {
    const name = req.params.name;

    const product = await productsCollection.findOne({ name });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete image file if it exists
    if (product.image_url) {
      const imagePath = path.join(__dirname, product.image_url);
      fs.unlink(imagePath, (err) => {
        if (err) console.warn("Image deletion failed:", err.message);
      });
    }

    await productsCollection.deleteOne({ name });

    // Remove from discounts.json
    const discountsPath = path.join(__dirname, "discounts.json");
    if (fs.existsSync(discountsPath)) {
      const discountsJson = JSON.parse(fs.readFileSync(discountsPath, "utf-8"));
      delete discountsJson[name];
      fs.writeFileSync(discountsPath, JSON.stringify(discountsJson, null, 2));
    }

    res.json({ message: `Product '${name}' deleted successfully` });
  } catch (err) {
    console.error("Delete product by name error:", err);
    res.status(500).json({ message: "Failed to delete product by name" });
  }
});

// Static images
app.use('/images', express.static(imagesDir));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
