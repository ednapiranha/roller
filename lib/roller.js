'use strict';

var gravatar = require('gravatar');

var POST_MAX = 30;

exports.recent = function(req, client, callback) {
  var self = this;

  client.smembers('rollerposts', function(err, posts) {
    if (err) {
      callback(err);
    } else {
      var postList = [];

      if (posts.length > 0) {
        posts.forEach(function(post) {
          self.get(req, post, client, function(err, post) {
            if (err) {
              callback(err);
            } else {
              if (post) {
                postList.push(post);
              }
            }

            if (postList.length === posts.length) {
              callback(null, postList);
            }
          });
        });
      } else {
        callback(null, postList);
      }
    }
  });
};

exports.get = function(req, id, client, callback) {
  client.hgetall('rollerpost:' + id, function(err, post) {
    if (err) {
      callback(err);
    } else {
      var isDeletable = false;

      // Only authors can delete
      if (req.session.email === post.author) {
        isDeletable = true;
      }

      post.isDeletable = isDeletable;

      callback(null, post);
    }
  });
};

exports.add = function(req, client, callback) {
  var self = this;

  // Add to the posts list
  client.incr('rollerposts:count', function(err, id) {
    if (err) {
      callback(err);
    } else {
      client.sadd('rollerposts', id);

      // Create the post hash
      var post = {
        id: id.toString(),
        author: req.session.email,
        gravatar: gravatar.url(req.session.email),
        message: req.body.message,
        type: req.body.type,
        mood: req.body.mood,
        created: new Date().getTime().toString()
      };

      client.hmset('rollerpost:' + id, post);

      self.get(req, id, client, function(err, post) {
        if (err) {
          callback(err);
        } else {
          callback(null, post);
        }
      });
    }
  });
};

exports.delete = function(req, client) {
  var id = req.body.id;
  var attrs = ['id', 'author', 'gravatar', 'message', 'type', 'mood', 'created'];

  client.srem('rollerposts', id);
  client.hdel('rollerpost:' + id, attrs);

  return true;
};
