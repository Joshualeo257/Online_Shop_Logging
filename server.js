const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

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

// Routes

app.get('/', (req, res) => {
  res.send('Express API server is running.');
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

// Serve images statically
app.use('/images', express.static(imagesDir));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
