'use strict';

var gravatar = require('gravatar');
var knox = require('knox');

var POST_MAX = 50;

var addPost = function(req, client, callback) {
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
        created: new Date().getTime().toString()
      };

      client.hmset('rollerpost:' + id, post);

      exports.get(req, id, client, function(err, post) {
        if (err) {
          callback(err);
        } else {
          callback(null, post);
        }
      });
    }
  });
};

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

exports.likes = function(req, client, callback) {
  var self = this;

  client.smembers('rollerposts:likes:' + req.session.email, function(err, posts) {
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
      var isLiked = false;

      // Only authors can delete
      if (req.session.email === post.author) {
        isDeletable = true;
      }

      client.sismember('rollerposts:likes:' + req.session.email, id, function(err, resp) {
        if (resp) {
          isLiked = true;
        }

        post.isDeletable = isDeletable;
        post.isLiked = isLiked;

        callback(null, post);
      });
    }
  });
};

exports.like = function(req, client, callback) {
  client.sadd('rollerposts:likes:' + req.session.email, req.params.id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      callback(null, true);
    }
  });
};

exports.unlike = function(req, client, callback) {
  client.srem('rollerposts:likes:' + req.session.email, req.params.id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      callback(null, true);
    }
  });
};

exports.add = function(req, res, client, nconf, callback) {
  if (req.body.type.indexOf('image') > -1) {
    if (req.files.message.size > 30000) {
      callback(new Error('file is too large'));
    } else {
      var s3 = knox.createClient({
        key: nconf.get('s3_key'),
        secret: nconf.get('s3_secret'),
        bucket: nconf.get('s3_bucket')
      });

      var headers = {
        'Content-Length': req.files.message.size,
        'Content-Type': req.files.message.type
      };

      var filename = (new Date().getTime().toString()) + req.files.message.name;

      s3.putFile(req.files.message.path, filename, headers, function(err, res) {
        req.body.message = nconf.get('s3_url') + filename;

        addPost(req, client, function(err, post) {
          if (err) {
            callback(err);
          } else {
            callback(null, post);
          }
        });
      });
    }
  } else {
    addPost(req, client, function(err, post) {
      if (err) {
        callback(err);
      } else {
        callback(null, post);
      }
    });
  }
};

exports.delete = function(req, client) {
  var id = req.body.id;
  var attrs = ['id', 'author', 'gravatar', 'message', 'type', 'created'];

  client.srem('rollerposts', id);
  client.hdel('rollerpost:' + id, attrs);

  return true;
};
