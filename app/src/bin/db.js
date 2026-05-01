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

      deleteMatchById: (id) => {
        ensureConnected();

        const info = database.prepare(`
          DELETE FROM matches
          WHERE id = ?
        `).run(id);

        return info.changes;
      },

      getMatchById: (id) => {
        ensureConnected();
        return database.prepare(`
              SELECT * FROM matches
              WHERE id = ?
            `).get(id);
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
      },

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
        return info.changes; // number of rows updated
      },

      getStatsByUsername: (username, limit = null, champion = '') => {
        ensureConnected();

        const whereClause = champion
          ? 'WHERE username = ? AND champion = ?'
          : 'WHERE username = ?';

        const baseQuery = `
          SELECT *
          FROM matches
          ${whereClause}
          ORDER BY played_at DESC, id DESC
        `;

        const queryParams = champion
          ? [username, champion]
          : [username];

        const matches = limit
          ? database.prepare(baseQuery + ' LIMIT ?').all(...queryParams, limit)
          : database.prepare(baseQuery).all(...queryParams);

        const totalMatches = matches.length;
        const wins = matches.filter(match => match.result === 'Win').length;
        const losses = matches.filter(match => match.result === 'Loss').length;

        const winRate = totalMatches > 0
          ? Math.round((wins / totalMatches) * 100)
          : 0;

        const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
        const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
        const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);

        const matchesWithDuration = matches.filter(match => match.game_duration_sec && match.game_duration_sec > 0);

        const totalGold = matchesWithDuration.reduce((sum, match) => sum + (match.total_gold || 0), 0);
        const totalCs = matchesWithDuration.reduce((sum, match) => sum + (match.total_cs || 0), 0);
        const totalMinutes = matchesWithDuration.reduce((sum, match) => sum + (match.game_duration_sec / 60), 0);
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

      getMatchesByUserAndChampion: (username, champion) => {
        ensureConnected();
        return database.prepare(`
          SELECT * FROM matches
          WHERE username = ? AND champion = ?
          ORDER BY played_at DESC, id DESC
        `).all(username, champion);
      },
    },
  };
}

module.exports = {
  createDatabaseManager,
};