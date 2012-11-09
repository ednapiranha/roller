'use strict';

module.exports = function(app, client, nconf, isLoggedIn) {
  var roller = require('../lib/roller');

  app.get('/', function(req, res) {
    res.render('index', {
      pageType: 'index',
      session: req.session
    });
  });

  app.get('/recent', function(req, res) {
    roller.recent(req, client, function(err, rollers) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          rollers: rollers
        });
      }
    });
  });

  app.post('/roller', function(req, res) {
    roller.add(req, res, client, nconf, function(err, roller) {
      res.redirect('/');
    });
  });

  app.delete('/roller', function(req, res) {
    roller.delete(req, client, function(err, roller) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          message: 'deleted'
        })
      }
    });
  });
};
