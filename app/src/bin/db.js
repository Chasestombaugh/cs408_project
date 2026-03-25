const Database = require('better-sqlite3');

const createMatchesTableSQL = `
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    played_at TEXT NOT NULL,
    mode TEXT NOT NULL,
    champion TEXT NOT NULL,
    role TEXT NOT NULL,
    result TEXT NOT NULL,
    kills INTEGER NOT NULL,
    deaths INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    game_duration_sec INTEGER,
    total_gold INTEGER,
    total_cs INTEGER,
    damage_dealt INTEGER,
    damage_taken INTEGER,
    vision_score INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

function createDatabaseManager(dbPath) {
  const database = new Database(dbPath);

  console.log('Database manager created for:', dbPath);

  // enable foreign keys
  database.pragma('foreign_keys = ON');

  // schema initialization
  database.exec(createMatchesTableSQL);

  function ensureConnected() {
    if (!database.open) {
      throw new Error('Database connection is not open');
    }
  }

  return {
    db: database,
    dbHelpers: {
      ensureConnected,
    },
  };
}

module.exports = {
  createDatabaseManager,
};