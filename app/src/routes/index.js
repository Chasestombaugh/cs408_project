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
  res.render('add-match', { title: 'Add Match', errors: [], formData: {}, });
});

/* Match detail page */
router.get('/matches/:id', function(req, res, next) {
  res.render('match-detail', {
    title: 'Match Details',
    matchId: req.params.id
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

module.exports = router;
