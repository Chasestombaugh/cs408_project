var express = require('express');
var router = express.Router();

/* Landing page */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'RiftTracker' });
});

/* Match list page */
router.get('/matches', function(req, res, next) {
  res.render('matches', { title: 'Matches' });
});

/* Add match page */
router.get('/matches/new', function(req, res, next) {
  res.render('add-match', { title: 'Add Match' });
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

module.exports = router;
