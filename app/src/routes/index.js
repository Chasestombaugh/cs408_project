var express = require('express');
var router = express.Router();

/* Landing page */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'RiftTracker' });
});

/* Match list page */
router.get('/matches', function (req, res, next) {
  // Read optional query filters from the URL.
  const username = req.query.user ? req.query.user.trim() : '';
  const champion = req.query.champion ? req.query.champion.trim() : '';
  const mode = req.query.mode ? req.query.mode.trim() : '';

  let matches;

  // Filter matches based on the search options the user provided.
  if (username && champion) {
    matches = req.db.getMatchesByUserAndChampion(username, champion);
  } else if (username && mode) {
    matches = req.db.getMatchesByUserAndMode(username, mode);
  } else if (username) {
    matches = req.db.getMatchesByUsername(username);
  } else {
    matches = req.db.getAllMatches();
  }

  res.render('matches', {
    title: 'Matches',
    matches,
    username,
    champion,
    mode,
  });
});

/* Add match page */
router.get('/matches/new', function (req, res, next) {
  // Start with an empty form and no validation errors.
  res.render('add-match', {
    title: 'Add Match',
    errors: [],
    formData: {},
  });
});

/* Create match */
router.post('/matches', function (req, res, next) {
  // Validate the submitted form before inserting into the database.
  const errors = validateMatch(req.body);

  if (errors.length > 0) {
    return res.status(400).render('add-match', {
      title: 'Add Match',
      errors,
      formData: req.body,
    });
  }

  // Convert form values into database-ready values.
  const matchData = normalizeMatchData(req.body);
  req.db.createMatch(matchData);

  // Redirect back to the match list filtered to the user who added the match.
  return res.redirect(`/matches?user=${encodeURIComponent(matchData.username)}`);
});

/* Match detail page */
router.get('/matches/:id', function (req, res, next) {
  const id = parseInt(req.params.id, 10);

  // Reject invalid ID formats before querying the database.
  if (isNaN(id)) {
    return res.status(400).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Invalid match ID.',
    });
  }

  const match = req.db.getMatchById(id);

  // Show a friendly error if the match id does not exist.
  if (!match) {
    return res.status(404).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Match not found.',
    });
  }

  res.render('match-detail', {
    title: 'Match Details',
    match,
    error: null,
  });
});

/* Edit match page */
router.get('/matches/:id/edit', function (req, res, next) {
  const id = parseInt(req.params.id, 10);

  // Validate the ID before loading the edit form.
  if (isNaN(id)) {
    return res.status(400).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Invalid match ID.',
    });
  }

  const match = req.db.getMatchById(id);

  // Prevent editing a match that does not exist.
  if (!match) {
    return res.status(404).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Match not found.',
    });
  }

  // Pre-fill the edit form with the current match data.
  res.render('edit-match', {
    title: 'Edit Match',
    match,
    errors: [],
    formData: match,
  });
});

/* Update match */
router.post('/matches/:id/edit', function (req, res, next) {
  const id = parseInt(req.params.id, 10);

  // Reject invalid ID formats.
  if (isNaN(id)) {
    return res.status(400).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Invalid match ID.',
    });
  }

  // Reuse the same validation rules used when creating a match.
  const errors = validateMatch(req.body);

  if (errors.length > 0) {
    return res.status(400).render('edit-match', {
      title: 'Edit Match',
      errors,
      formData: req.body,
      match: { id },
    });
  }

  const matchData = normalizeMatchData(req.body);
  const updated = req.db.updateMatch(id, matchData);

  // If no rows changed, the match id was not found.
  if (updated === 0) {
    return res.status(404).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Match not found.',
    });
  }

  return res.redirect(`/matches/${id}`);
});

/* Delete match */
router.post('/matches/:id/delete', function (req, res, next) {
  const id = parseInt(req.params.id, 10);

  // Validate the ID before attempting deletion.
  if (isNaN(id)) {
    return res.status(400).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Invalid match ID.',
    });
  }

  const match = req.db.getMatchById(id);

  // Prevent deleting a match that does not exist.
  if (!match) {
    return res.status(404).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Match not found.',
    });
  }

  req.db.deleteMatchById(id);

  // Return to that user’s filtered match list after deletion.
  return res.redirect(`/matches?user=${encodeURIComponent(match.username)}`);
});

/* Stats page */
router.get('/stats', function (req, res, next) {
  // Read optional filters from the stats form/query string.
  const username = req.query.user ? req.query.user.trim() : '';
  const champion = req.query.champion ? req.query.champion.trim() : '';
  const range = req.query.range || 'all';
  const mode = req.query.mode ? req.query.mode.trim() : '';

  // A range of "all" uses every match; otherwise it limits to recent matches.
  const limit = range === 'all' ? null : parseInt(range, 10);

  const stats = username
    ? req.db.getStatsByUsername(username, limit, champion, mode)
    : null;

  res.render('stats', {
    title: 'Statistics',
    username,
    champion,
    stats,
    range,
    mode,
  });
});

/* Debug: seed sample data */
router.get('/debug/seed', function (req, res, next) {
  const sampleUsername = 'TravisSqrt';

  // Remove existing sample rows so duplicates do not build up.
  req.db.deleteMatchesByUsername(sampleUsername);

  // Sample Summoner's Rift match.
  req.db.createMatch({
    username: sampleUsername,
    played_at: '2026-03-19',
    mode: 'SR',
    champion: 'Twitch',
    role: 'ADC',
    result: 'Loss',
    kills: 10,
    deaths: 7,
    assists: 13,
    game_duration_sec: 869,
    total_gold: 13117,
    total_cs: 57,
    damage_dealt: 20611,
    damage_taken: 16362,
    vision_score: 0,
    notes: ''
  });

  // Sample ARAM match.
  req.db.createMatch({
    username: sampleUsername,
    played_at: '2026-03-19',
    mode: 'ARAM',
    champion: 'Twitch',
    role: 'N/A',
    result: 'Loss',
    kills: 10,
    deaths: 7,
    assists: 13,
    game_duration_sec: 869,
    total_gold: 20611,
    total_cs: 57,
    damage_dealt: 21000,
    damage_taken: 16362,
    vision_score: 0,
    notes: 'ARAM mayhem'
  });

  res.redirect(`/matches?user=${sampleUsername}`);
});

// Validates required match fields before create/update operations.
function validateMatch(data) {
  const errors = [];

  if (!data.played_at || data.played_at.trim() === '') {
    errors.push('Date played is required.');
  }

  if (!data.username || data.username.trim() === '') {
    errors.push('Username is required.');
  }

  if (!data.champion || data.champion.trim() === '') {
    errors.push('Champion is required.');
  }

  if (!data.mode || data.mode.trim() === '') {
    errors.push('Game mode is required.');
  }

  if (!data.result || !['Win', 'Loss'].includes(data.result)) {
    errors.push('Result must be Win or Loss.');
  }

  // ARAM does not use traditional roles, but Summoner's Rift does.
  if (data.mode !== 'ARAM' && (!data.role || data.role.trim() === '')) {
    errors.push('Role is required for Summoner\'s Rift matches.');
  }

  // K/D/A values must be provided and cannot be negative.
  if (data.kills === undefined || data.kills === '' || isNaN(data.kills) || Number(data.kills) < 0) {
    errors.push('Kills must be a non-negative number.');
  }

  if (data.deaths === undefined || data.deaths === '' || isNaN(data.deaths) || Number(data.deaths) < 0) {
    errors.push('Deaths must be a non-negative number.');
  }

  if (data.assists === undefined || data.assists === '' || isNaN(data.assists) || Number(data.assists) < 0) {
    errors.push('Assists must be a non-negative number.');
  }

  // Optional duration must use mm:ss format when provided.
  if (data.game_duration && data.game_duration.trim() !== '') {
    if (!/^\d+:\d{2}$/.test(data.game_duration.trim())) {
      errors.push('Game duration must be in mm:ss format.');
    }
  }

  return errors;
}

// Converts a duration string like "14:29" into total seconds for storage.
function parseDurationToSeconds(durationStr) {
  if (!durationStr || durationStr.trim() === '') {
    return null;
  }

  const [minutes, seconds] = durationStr.trim().split(':').map(Number);
  return (minutes * 60) + seconds;
}

// Converts optional numeric form fields into integers or null.
function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// Cleans form input and converts it into the shape expected by the database.
function normalizeMatchData(data) {
  return {
    username: data.username.trim(),
    played_at: data.played_at.trim(),
    mode: data.mode,
    champion: data.champion.trim(),

    // ARAM has no role, so it is stored as N/A.
    role: data.mode === 'ARAM' ? 'N/A' : data.role.trim(),

    result: data.result,

    // Required stat fields.
    kills: parseInt(data.kills, 10),
    deaths: parseInt(data.deaths, 10),
    assists: parseInt(data.assists, 10),

    // Optional advanced stats.
    game_duration_sec: parseDurationToSeconds(data.game_duration),
    total_gold: parseOptionalInt(data.total_gold),
    total_cs: parseOptionalInt(data.total_cs),
    damage_dealt: parseOptionalInt(data.damage_dealt),
    damage_taken: parseOptionalInt(data.damage_taken),
    vision_score: parseOptionalInt(data.vision_score),

    notes: data.notes && data.notes.trim() !== '' ? data.notes.trim() : null,
  };
}

module.exports = router;