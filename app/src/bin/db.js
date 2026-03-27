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

  getAllMatches: () => {
    ensureConnected();
    return database.prepare(`
      SELECT * FROM matches
      ORDER BY played_at DESC, id DESC
    `).all();
  },

  getMatchesByUsername: (username) => {
    ensureConnected();
    return database.prepare(`
      SELECT * FROM matches
      WHERE username = ?
      ORDER BY played_at DESC, id DESC
    `).all(username);
  },

  getTotalMatches: () => {
    ensureConnected();
    return database.prepare(`
      SELECT COUNT(*) AS count
      FROM matches
    `).get().count;
  },

  deleteMatchesByUsername: (username) => {
    ensureConnected();
    return database.prepare(`
      DELETE FROM matches
      WHERE username = ?
    `).run(username).changes;
  },

  createMatch: (match) => {
    ensureConnected();

    const stmt = database.prepare(`
      INSERT INTO matches (
        username, played_at, mode, champion, role, result,
        kills, deaths, assists,
        game_duration_sec, total_gold, total_cs,
        damage_dealt, damage_taken, vision_score, notes
      ) VALUES (
        @username, @played_at, @mode, @champion, @role, @result,
        @kills, @deaths, @assists,
        @game_duration_sec, @total_gold, @total_cs,
        @damage_dealt, @damage_taken, @vision_score, @notes
      )
    `);

    const info = stmt.run(match);
    return info.lastInsertRowid;
  }
},
};
}

module.exports = {
  createDatabaseManager,
};