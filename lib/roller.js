'use strict';

var gravatar = require('gravatar');

var POST_MAX = 50;

/* Amazon s3 configuration
 * If you plan on replacing this with a different service,
 * just change the content in this section :)
 */
var knox = require('knox');
var MultiPartUpload = require('knox-mpu');
var upload = null;

/* Upload a file to s3
 * Requires: web request, filename, configuration, db connection, callback
 * Returns: a post object if successful
 */
var uploadFile = function(req, filename, nconf, client, callback) {
  var s3 = knox.createClient({
    key: nconf.get('s3_key'),
    secret: nconf.get('s3_secret'),
    bucket: nconf.get('s3_bucket')
  });

  upload = new MultiPartUpload({
    client: s3,
    objectName: filename,
    file: req.files.message.path

  }, function(err, res) {
    if (err) {
      callback(err);

    } else {
      req.body.message = nconf.get('s3_url') + filename;

      addPost(req, client, function(err, post) {
        if (err) {
          callback(err);
        } else {
          callback(null, post);
        }
      });
    }
  });
};


/* Tokenize and return any images and/or links
 * Requires: message text
 * Returns: message text with embedded media if available
 */
var SERVICE_IMAGE = /((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/gi;
var SERVICE_URL = /^(http|https|ftp|scp|sftp)/i;

var escapeHtml = function(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

var tokenize = function(message) {
  var messageArr = escapeHtml(message.trim()).split(/\s/);
  var newMessage = [];

  messageArr.forEach(function(msg) {
    if (msg.match(SERVICE_IMAGE)) {
      msg = '<img src="' + msg + '">';
    } else if (msg.match(SERVICE_URL)) {
      msg = '<a href="' + msg + '">' + msg + '</a>';
    }

    newMessage.push(msg);
  });

  return newMessage.join(' ');
};

/* Get all posts
 * Requires: web request, posts object
 * Returns: posts if successful
 */
var getPostList = function(req, posts, client, callback) {
  var postList = [];

  posts.forEach(function(post) {
    exports.get(req, post, client, function(err, post) {
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
};

/* Creates a new post
 * Requires: web request, db connection, boolean repost, callback
 * Returns: post if successful
 * Notes: generates a unique id for the post and adds it to the post list
 */
var addPost = function(req, client, callback) {
  // Add to the posts list
  client.incr('rollerposts:count', function(err, id) {
    if (err) {
      callback(err);
    } else {
      client.rpush('rollerposts', id);

      // Create the post object
      var post = {
        id: id.toString(),
        author: req.session.email,
        gravatar: gravatar.url(req.session.email),
        message: req.body.message,
        type: req.body.type,
        created: new Date().getTime().toString()
      };

      client.hmset('rollerpost:' + id, post, function(err, resp) {
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
      if (posts.length > 0) {
        getPostList(req, posts, client, callback);
      } else {
        callback(null, []);
      }
    }
  });
};

/* Returns a single post
 * Requires: web request, db connection, callback
 * Returns: post if successful
 */
exports.detail = function(req, client, callback) {
  client.hgetall('rollerpost:' + req.params.id, function(err, post) {
    if (err) {
      callback(err);

    } else {
      if (post) {
        callback(null, [post]);
      } else {
        callback(null, []);
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
      if (posts.length > 0) {
        getPostList(req, posts, client, callback);
      } else {
        callback(null, []);
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
        if (err) {
          callback(err);
        } else {
          if (resp) {
            isLiked = true;
          }

          post.isDeletable = isDeletable;
          post.isLiked = isLiked;

          callback(null, post);
        }
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
      });
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
      });
    }
  });
};

/* Process a new post
 * Requires: web request, db connection, boolean repost, configuration, callback
 * Returns: post if successful
 * Notes: If this is an image, it will attempt to upload to s3. If the image is
 * too large, it will return with an error.
 */
exports.add = function(req, client, nconf, callback) {

  if (req.body.type.indexOf('image') > -1) {
    var filename = (new Date().getTime().toString()) + req.files.message.name;

    uploadFile(req, filename, nconf, client, callback);
  } else {
    req.body.message = tokenize(req.body.message);
    addPost(req, client, callback);
  }
};

/* Delete a post
 * Requires: web request, db connection, callback
 * Returns: true if successful
 * Note: We need to sift through the likes to find matches and delete them, but we don't
 * want to wait around since it could take a while. So we assume it will most likely be
 * successful and just let it run in the background.
 */
var deletePost = function(req, client, callback) {
  var id = req.params.id;

  // This may be a slow call and can be run in the background - we don't need to wait around for it
  client.keys('rollerposts:set:likes:*', function(err, like) {
    if (err) {
      throw new Error('Could not retrieve set likes');
    } else {
      like.forEach(function(likeItem) {
        var likeKey = likeItem.toString();
        var likeArr = likeKey.split(':');

        client.srem(likeKey, id, function(err, resp) {
          if (err) {
            throw new Error('Could not delete from set likes');
          } else {
            // likeArr is the key split up like so:  [ 'rollerposts', 'set', 'likes', 'some@email.com' ]
            // We want the email address to delete the likes from this user's list
            client.lrem('rollerposts:likes:' + likeArr[3], 0, id, function(err, resp) {
              if (err) {
                throw new Error('Could not delete from list likes');
              }
            });
          }
        });
      });
    }
  });

  client.lrem('rollerposts', 0, id, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      client.del('rollerpost:' + id, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          callback(null, true);
        }
      });
    }
  });
};

/* If the user matches the post author, delete the post
 * Requires: web request, db connection, callback
 * Returns: true if successful
 */
exports.delete = function(req, client, callback) {
  var id = parseInt(req.body.id, 10);
  req.params.id = id;
  var attrs = ['id', 'author', 'gravatar', 'message', 'type', 'created'];

  this.detail(req, client, function(err, post) {
    if (err) {
      callback(err);
    } else {
      if (post[0].author === req.session.email) {
        deletePost(req, client, callback);
      } else {
        callback(new Error('You do not have permission to delete this'));
      }
    }
  });
};
