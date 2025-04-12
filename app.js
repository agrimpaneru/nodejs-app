const express = require('express');
const { MongoClient } = require('mongodb');
const promClient = require('prom-client');
const app = express();

// Create a Registry to register the metrics
const register = new promClient.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'nodejs-mongodb-app'
});
// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 500]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// Middleware to track request duration and count
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    end({ method: req.method, route, status_code: res.statusCode });
    httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// MongoDB connection string with auth credentials
const mongoURI = process.env.MONGO_URI;

// Create a MongoDB client
const client = new MongoClient(mongoURI);

// Connect to MongoDB and insert sample data
async function connectAndSeedDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('items');
    
    // Check if collection has data
    const count = await collection.countDocuments();
    
    if (count === 0) {
      // Insert sample data
      const result = await collection.insertMany([
        { name: 'Item 1', description: 'This is item 1' },
        { name: 'Item 2', description: 'This is item 2' },
        { name: 'Item 3', description: 'This is item 3' }
      ]);
      
      console.log(`${result.insertedCount} sample items inserted`);
    } else {
      console.log('Sample data already exists');
    }
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
  }
}

// Connect to MongoDB when the app starts
connectAndSeedDB();

// Serve a simple HTML form at the root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MongoDB Demo</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        form { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        label { display: block; margin-bottom: 5px; }
        input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        #items { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>MongoDB Demo</h1>
      
      <form id="itemForm" action="/items" method="POST">
        <h2>Add New Item</h2>
        <div>
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div>
          <label for="description">Description:</label>
          <textarea id="description" name="description" rows="3" required></textarea>
        </div>
        <button type="submit">Add Item</button>
      </form>
      
      <h2>Existing Items</h2>
      <div id="items">Loading items...</div>
      
      <script>
        // Fetch and display items when the page loads
        fetch('/items')
          .then(response => response.json())
          .then(items => {
            const itemsContainer = document.getElementById('items');
            if (items.length === 0) {
              itemsContainer.innerHTML = '<p>No items found</p>';
            } else {
              itemsContainer.innerHTML = items.map(item => 
                \`<div class="item">
                  <h3>\${item.name}</h3>
                  <p>\${item.description}</p>
                </div>\`
              ).join('');
            }
          })
          .catch(error => {
            document.getElementById('items').innerHTML = '<p>Error loading items</p>';
            console.error('Error:', error);
          });
          
        // Handle form submission
        document.getElementById('itemForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          const itemData = {
            name: formData.get('name'),
            description: formData.get('description')
          };
          
          fetch('/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
          })
          .then(response => response.json())
          .then(result => {
            alert('Item added successfully!');
            window.location.reload(); // Reload to see the new item
          })
          .catch(error => {
            alert('Error adding item');
            console.error('Error:', error);
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Add a route to get data from MongoDB
app.get('/items', async (req, res) => {
  try {
    const db = client.db();
    const collection = db.collection('items');
    const items = await collection.find({}).toArray();
    res.json(items);
  } catch (err) {
    console.error('Error fetching items', err);
    res.status(500).send('Error fetching items from database');
  }
});

// Add a route to insert new data into MongoDB
app.post('/items', async (req, res) => {
  try {
    // Extract item data from request body
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    
    // Insert the new item into MongoDB
    const db = client.db();
    const collection = db.collection('items');
    const result = await collection.insertOne({ 
      name, 
      description,
      createdAt: new Date()
    });
    
    // Return success response
    res.status(201).json({ 
      success: true, 
      message: 'Item added successfully',
      itemId: result.insertedId 
    });
  } catch (err) {
    console.error('Error adding item', err);
    res.status(500).json({ error: 'Error adding item to database' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Handle application shutdown
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});