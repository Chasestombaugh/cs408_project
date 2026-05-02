const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const db = require('./bin/db');
const fs = require('fs');

const index = require('./routes/index');

const app = express();

/* =========================
   Database Initialization
   ========================= */

// Determine where the database file should live (supports environment overrides)
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbFileName = process.env.DB_NAME || 'rifttracker.db';
const dbPath = path.join(dataDir, dbFileName);

// Ensure the data directory exists before creating the database file
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database manager (handles all queries and helpers)
const databaseManager = db.createDatabaseManager(dbPath);

// Log database path for debugging / deployment visibility
console.log(`[DB] Initialized at: ${dbPath}`);

/* =========================
   View Engine Setup (EJS)
   ========================= */

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Register EJS as the template engine
app.engine('ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// Enable layout support for shared templates (header/footer)
app.use(expressLayouts);

/* =========================
   Middleware
   ========================= */

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded form data (from POST forms)
app.use(express.urlencoded({ extended: false }));

/* =========================
   Static File Serving
   ========================= */

// Serve static assets (CSS, JS, images) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve static HTML files from /static (non-EJS pages)
app.use(express.static(path.join(__dirname, 'static')));

/* =========================
   Custom Middleware
   ========================= */

// Attach database helper functions to every request
// This allows routes to access the database via req.db
app.use((request, response, next) => {
  request.db = databaseManager.dbHelpers;
  next();
});

/* =========================
   Routes
   ========================= */

// Main application routes
app.use('/', index);

module.exports = app;