const Database = require('better-sqlite3');

// SQL used to create the matches table if it does not already exist.
// This table stores both basic match info and optional advanced stats.
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

  // Enables SQLite foreign key support.
  database.pragma('foreign_keys = ON');

  // Initializes the database schema when the app starts.
  database.exec(createMatchesTableSQL);

  // Guards database helper methods from running if the connection is closed.
  function ensureConnected() {
    if (!database.open) {
      throw new Error('Database connection is not open');
    }
  }

  return {
    db: database,
    dbHelpers: {
      ensureConnected,

      // Returns every match in newest-first order.
      getAllMatches: () => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          ORDER BY played_at DESC, id DESC
        `).all();
      },

      // Returns matches for one username in newest-first order.
      getMatchesByUsername: (username) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          WHERE username = ?
          ORDER BY played_at DESC, id DESC
        `).all(username);
      },

      // Counts all match records currently stored.
      getTotalMatches: () => {
        ensureConnected();
        return database.prepare(`
          SELECT COUNT(*) AS count
          FROM matches
        `).get().count;
      },

      // Deletes all matches for a specific username.
      deleteMatchesByUsername: (username) => {
        ensureConnected();
        return database.prepare(`
          DELETE FROM matches
          WHERE username = ?
        `).run(username).changes;
      },

      // Deletes a single match by id and returns the number of deleted rows.
      deleteMatchById: (id) => {
        ensureConnected();

        const info = database.prepare(`
          DELETE FROM matches
          WHERE id = ?
        `).run(id);

        return info.changes;
      },

      // Finds one match by its database id.
      getMatchById: (id) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          WHERE id = ?
        `).get(id);
      },

      // Inserts a new match and returns the generated match id.
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
      },

      // Updates an existing match and returns the number of changed rows.
      updateMatch: (id, match) => {
        ensureConnected();

        const stmt = database.prepare(`
          UPDATE matches SET
            username = @username,
            played_at = @played_at,
            mode = @mode,
            champion = @champion,
            role = @role,
            result = @result,
            kills = @kills,
            deaths = @deaths,
            assists = @assists,
            game_duration_sec = @game_duration_sec,
            total_gold = @total_gold,
            total_cs = @total_cs,
            damage_dealt = @damage_dealt,
            damage_taken = @damage_taken,
            vision_score = @vision_score,
            notes = @notes
          WHERE id = ?
        `);

        const info = stmt.run(match, id);
        return info.changes;
      },

      // Builds the data used on the stats page.
      // Optional filters allow stats to be narrowed by recent matches, champion, or mode.
      getStatsByUsername: (username, limit = null, champion = '', mode = '') => {
        ensureConnected();

        const conditions = ['username = ?'];
        const queryParams = [username];

        // Add optional champion filter.
        if (champion) {
          conditions.push('champion = ?');
          queryParams.push(champion);
        }

        // Add optional game mode filter.
        if (mode) {
          conditions.push('mode = ?');
          queryParams.push(mode);
        }

        const baseQuery = `
          SELECT *
          FROM matches
          WHERE ${conditions.join(' AND ')}
          ORDER BY played_at DESC, id DESC
        `;

        // If a limit is provided, only use that many recent matches for stats.
        const matches = limit
          ? database.prepare(baseQuery + ' LIMIT ?').all(...queryParams, limit)
          : database.prepare(baseQuery).all(...queryParams);

        const totalMatches = matches.length;
        const wins = matches.filter(match => match.result === 'Win').length;
        const losses = matches.filter(match => match.result === 'Loss').length;

        // Avoid dividing by zero when the user has no matches.
        const winRate = totalMatches > 0
          ? Math.round((wins / totalMatches) * 100)
          : 0;

        // Basic KDA totals used to calculate averages.
        const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
        const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
        const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);

        // GPM and CSM require game duration, so only matches with duration are included.
        const matchesWithDuration = matches.filter(match => match.game_duration_sec && match.game_duration_sec > 0);

        const totalGold = matchesWithDuration.reduce((sum, match) => sum + (match.total_gold || 0), 0);
        const totalCs = matchesWithDuration.reduce((sum, match) => sum + (match.total_cs || 0), 0);
        const totalMinutes = matchesWithDuration.reduce((sum, match) => sum + (match.game_duration_sec / 60), 0);

        // Damage averages can still use all matches, defaulting missing values to zero.
        const totalDamageDealt = matches.reduce((sum, match) => sum + (match.damage_dealt || 0), 0);
        const totalDamageTaken = matches.reduce((sum, match) => sum + (match.damage_taken || 0), 0);

        const averageGpm = totalMinutes > 0
          ? Math.round(totalGold / totalMinutes)
          : null;

        const averageCsm = totalMinutes > 0
          ? (totalCs / totalMinutes).toFixed(1)
          : null;

        const averageDamageDealt = totalMatches > 0
          ? Math.round(totalDamageDealt / totalMatches)
          : null;

        const averageDamageTaken = totalMatches > 0
          ? Math.round(totalDamageTaken / totalMatches)
          : null;

        const modeStats = {};
        const championCounts = {};

        // Builds grouped stats for mode win rates and most-played champions.
        matches.forEach(match => {
          if (!modeStats[match.mode]) {
            modeStats[match.mode] = {
              total: 0,
              wins: 0,
            };
          }

          modeStats[match.mode].total += 1;

          if (match.result === 'Win') {
            modeStats[match.mode].wins += 1;
          }

          championCounts[match.champion] = (championCounts[match.champion] || 0) + 1;
        });

        // Converts champion count data into a sorted list for display.
        const mostPlayedChampions = Object.entries(championCounts)
          .map(([champion, count]) => ({ champion, count }))
          .sort((a, b) => b.count - a.count);

        return {
          username,
          champion,
          totalMatches,
          wins,
          losses,
          winRate,
          mode,
          averageKills: totalMatches > 0 ? (totalKills / totalMatches).toFixed(1) : '0.0',
          averageDeaths: totalMatches > 0 ? (totalDeaths / totalMatches).toFixed(1) : '0.0',
          averageAssists: totalMatches > 0 ? (totalAssists / totalMatches).toFixed(1) : '0.0',
          averageGpm,
          averageCsm,
          averageDamageDealt,
          averageDamageTaken,
          modeStats,
          mostPlayedChampions,
          recentMatches: matches.slice(0, 20),
        };
      },

      // Returns matches for one user on one champion.
      getMatchesByUserAndChampion: (username, champion) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          WHERE username = ? AND champion = ?
          ORDER BY played_at DESC, id DESC
        `).all(username, champion);
      },

      // Returns matches for one user in one mode.
      getMatchesByUserAndMode: (username, mode) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          WHERE username = ? AND mode = ?
          ORDER BY played_at DESC, id DESC
        `).all(username, mode);
      },
    },
  };
}

module.exports = {
  createDatabaseManager,
};