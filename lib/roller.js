'use strict';

var gravatar = require('gravatar');
var knox = require('knox');

var POST_MAX = 50;
var FILE_SIZE_MAX = 30000; // bytes

/* Creates a new post
 * Requires: web request, db connection, callback
 * Returns: post if successful
 * Notes: generates a unique id for the post and adds it to the post list
 */
var addPost = function(req, client, callback) {
  var self = this;
  // Add to the posts list
  client.incr('rollerposts:count', function(err, id) {
    if (err) {
      callback(err);
    } else {
      client.rpush('rollerposts', id);

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

/* Returns the most recent posts
 * Requires: web request, db connection, callback
 * Returns: posts if successful
 */
exports.recent = function(req, client, callback) {
  var self = this;

  client.lrange('rollerposts', 0, POST_MAX + 1, function(err, posts) {
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

/* Recent liked posts
 * Requires: web request, db connection, callback
 * Returns: liked posts if successful
 */
exports.likes = function(req, client, callback) {
  var self = this;

  client.lrange('rollerposts:likes:' + req.session.email, 0, POST_MAX + 1, function(err, posts) {
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

/* Gets a post
 * Requires: web request, post id, db connection, callback
 * Returns: post if successful
 */
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

      client.sismember('rollerposts:set:likes:' + req.session.email, id, function(err, resp) {
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

/* Likes a post
 * Requires: web request, db connection, callback
 * Returns: true if successful
 */
exports.like = function(req, client, callback) {
  client.sadd('rollerposts:set:likes:' + req.session.email, req.params.id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      client.rpush('rollerposts:likes:' + req.session.email, req.params.id, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          callback(null, true);
        }
      })
    }
  });
};

/* Unlikes a post
 * Requires: web request, db connection, callback
 * Returns: true if successful
 */
exports.unlike = function(req, client, callback) {
  client.srem('rollerposts:set:likes:' + req.session.email, req.params.id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      client.lrem('rollerposts:likes:' + req.session.email, 0, req.params.id, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          callback(null, true);
        }
      })
    }
  });
};

/* Process a new post
 * Requires: web request, db connection, callback
 * Returns: post if successful
 * Notes: If this is an image, it will attempt to upload to s3. If the image is
 * too large, it will return with an error.
 */
exports.add = function(req, res, client, nconf, callback) {
  if (req.body.type.indexOf('image') > -1) {
    if (req.files.message.size > FILE_SIZE_MAX) {
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

/* Delete a post
 * Requires: web request, db connection, callback
 * Returns: true if successful
 * Note: We need to sift through the likes to find matches and delete them, but we don't
 * want to wait around since it could take a while. So we assume it will most likely be
 * successful and just let it run in the background.
 */
exports.delete = function(req, client, callback) {
  var id = req.body.id;
  var attrs = ['id', 'author', 'gravatar', 'message', 'type', 'created'];

  // This may be a slow call and can be run in the background - we don't need to wait around for it
  client.keys('rollerposts:set:likes:*', function(err, like) {
    if (err) {
      console.error('Could not retrieve set likes');
    } else {
      var likeKey = like.toString();
      var likeArr = likeKey.split(':');

      client.srem(likeKey, id, function(err, resp) {
        if (err) {
          console.error('Could not delete from set likes');
        } else {
          client.lrem('rollerposts:likes:' + likeArr[likeArr - 1], 0, id, function(err, resp) {
            if (err) {
              console.error('Could not delete from list likes');
            }
          });
        }
      });
    }
  });

  client.lrem('rollerposts', 0, id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      client.hdel('rollerpost:' + id, attrs, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          callback(null, true);
        }
      });
    }
  });
};
