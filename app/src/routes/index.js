var express = require('express');
var router = express.Router();

/* Landing page */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'RiftTracker' });
});

/* Match list page */
router.get('/matches', function(req, res, next) {
  const username = req.query.user ? req.query.user.trim() : '';

  const matches = username
    ? req.db.getMatchesByUsername(username)
    : req.db.getAllMatches();

  res.render('matches', {
    title: 'Matches',
    matches,
    username,
  });
});

/* Add match page */
router.get('/matches/new', function(req, res, next) {
  res.render('add-match', { 
    title: 'Add Match',
    errors: [], 
    formData: {}, 
  });
});

/* Create match */
router.post('/matches', function(req, res, next) {
  const errors = validateMatch(req.body);

  if (errors.length > 0) {
    return res.status(400).render('add-match', {
      title: 'Add Match',
      errors,
      formData: req.body,
    });
  }

  const matchData = normalizeMatchData(req.body);
  req.db.createMatch(matchData);

  return res.redirect(`/matches?user=${encodeURIComponent(matchData.username)}`);
});

/* Match detail page */
router.get('/matches/:id', function(req, res, next) {
  const id = parseInt(req.params.id, 10);

  // handles an invalid ID format
  if (isNaN(id)) {
    return res.status(400).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Invalid match ID.',
    });
  }

  const match = req.db.getMatchById(id);

  // handles match not found
  if (!match) {
    return res.status(404).render('match-detail', {
      title: 'Match Details',
      match: null,
      error: 'Match not found.',
    });
  }

  // Valid match
  res.render('match-detail', {
    title: 'Match Details',
    match,
    error: null,
  });
});

/* Stats page */
router.get('/stats', function(req, res, next) {
  res.render('stats', { title: 'Statistics' });
});

/* Debug: seed sample data */
router.get('/debug/seed', function(req, res, next) {
  const sampleUsername = 'TravisSqrt';

  // removes previous rows so dupes don't build up like before
  req.db.deleteMatchesByUsername(sampleUsername);

  // SR example
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
    game_duration_sec: 869, // 14:29 -> stored via seconds, show as minutes:seconds in frontend
    total_gold: 13117,
    total_cs: 57,
    damage_dealt: 20611,
    damage_taken: 16362,
    vision_score: 0,
    notes: ''
  });

  // ARAM example
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
    game_duration_sec: 869, // 14:29 -> stored via seconds, show as minutes:seconds in frontend
    total_gold: 20611,
    total_cs: 57,
    damage_dealt: 21000,
    damage_taken: 16362,
    vision_score: 0,
    notes: 'ARAM mayhem'
  });

  res.redirect(`/matches?user=${sampleUsername}`);
});

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

  if (data.mode !== 'ARAM' && (!data.role || data.role.trim() === '')) {
    errors.push('Role is required for Summoner\'s Rift matches.');
  }

  // K/D/A validation (must be numbers >= 0)
  if (data.kills === undefined || data.kills === '' || isNaN(data.kills) || Number(data.kills) < 0) {
    errors.push('Kills must be a non-negative number.');
  }

  if (data.deaths === undefined || data.deaths === '' || isNaN(data.deaths) || Number(data.deaths) < 0) {
    errors.push('Deaths must be a non-negative number.');
  }

  if (data.assists === undefined || data.assists === '' || isNaN(data.assists) || Number(data.assists) < 0) {
    errors.push('Assists must be a non-negative number.');
  }

  if (data.game_duration && data.game_duration.trim() !== '') {
    if (!/^\d+:\d{2}$/.test(data.game_duration.trim())) {
      errors.push('Game duration must be in mm:ss format.');
    }
  }

  return errors;
}

function parseDurationToSeconds(durationStr) {
  if (!durationStr || durationStr.trim() === '') {
    return null;
  }

  const [minutes, seconds] = durationStr.trim().split(':').map(Number);
  return (minutes * 60) + seconds;
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeMatchData(data) {
  return {
    username: data.username.trim(),
    played_at: data.played_at.trim(),
    mode: data.mode,
    champion: data.champion.trim(),
    role: data.mode === 'ARAM' ? 'N/A' : data.role.trim(),
    result: data.result,

    kills: parseInt(data.kills, 10),
    deaths: parseInt(data.deaths, 10),
    assists: parseInt(data.assists, 10),

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