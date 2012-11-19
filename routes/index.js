'use strict';

module.exports = function(app, client, nconf, isLoggedIn) {
  var roller = require('../lib/roller');

  app.get('/', function(req, res) {
    res.render('index', {
      pageType: 'index',
      session: req.session,
      isLoggedIn: !!req.session.email
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

  app.get('/detail/:id', function(req, res) {
    roller.detail(req, client, function(err, rollers) {
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

  app.get('/likes', function(req, res) {
    roller.likes(req, client, function(err, rollers) {
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

  app.post('/like/:id', function(req, res) {
    roller.like(req, client, function(err, roller) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          message: 'successfully liked'
        });
      }
    });
  });

  app.delete('/like/:id', function(req, res) {
    roller.unlike(req, client, function(err, roller) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          message: 'successfully unliked'
        });
      }
    });
  });

  app.post('/repost/:id', function(req, res) {
    roller.repost(req, client, function(err, roller) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          message: 'successfully reposted'
        });
      }
    });
  });

  app.delete('/repost/:id', function(req, res) {
    roller.unrepost(req, client, function(err, roller) {
      if (err) {
        res.status(500);
        res.json({
          message: err.message
        });
      } else {
        res.json({
          message: 'successfully unreposted'
        });
      }
    });
  });

  app.post('/roller', function(req, res) {
    roller.add(req, client, false, nconf, function(err, roller) {
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
