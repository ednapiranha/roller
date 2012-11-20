'use strict';

var express = require('express');
var app = express();
var assert = require('should');
var nock = require('nock');
var should = require('should');
var nconf = require('nconf');
var redis = require('redis');
var client = redis.createClient();
var roller = require('../lib/roller');

var req = {
  session: {
    email: 'test@test.com'
  },
  params: {
    id: 1
  },
  body: {
    author: 'test@test.com',
    message: 'This is a post',
    type: 'text'
  }
}

nconf.argv().env().file({ file: 'test/local-test.json' });

client.select(app.set('roller'), function(err, res) {
  if (err) {
    console.log('TEST database connection failed.');
  }
});

describe('roller', function() {
  after(function() {
    client.flushdb();
  });

  describe('add post', function() {
    it('successfully adds a post', function(done) {
      roller.add(req, client, nconf, function(err, result) {
        if (err) {
          throw new Error('error adding post: ', err);
        } else {
          should.exist(result);
          result.message.should.equal(req.body.message);
        }
        done();
      });
    });
  });

  describe('add post with a link and an image', function() {
    it('successfully adds a post', function(done) {
      req.body.message = 'http://google.com test http://pics.org/cat.jpg';
      roller.add(req, client, nconf, function(err, result) {
        if (err) {
          throw new Error('error adding post: ', err);
        } else {
          var rendered = '<a href="http://google.com">http://google.com</a> ' +
            'test <img src="http://pics.org/cat.jpg">';
          result.message.should.equal(rendered);
        }
        done();
      });
    });
  });

  describe('like a post', function() {
    it('successfully likes a post', function(done) {
      roller.add(req, client, nconf, function(err, result) {
        if (err) {
          throw new Error('error adding post: ', err);
        } else {
          roller.like(req, client, function(err, resp) {
            if (err) {
              throw new Error('error liking post: ', err);
            } else {
              resp.should.be.true;
            }
            done();
          });
        }
      });
    });
  });

  describe('unlike a post', function() {
    it('successfully unlikes a post', function(done) {
      roller.add(req, client, nconf, function(err, result) {
        if (err) {
          throw new Error('error adding post: ', err);
        } else {
          roller.unlike(req, client, function(err, resp) {
            if (err) {
              throw new Error('error unliking post: ', err);
            } else {
              resp.should.be.true;
            }
            done();
          });
        }
      });
    });
  });

  it('successfully retrieves posts', function(done) {
    roller.add(req, client, nconf, function(err, result) {
      if (err) {
        throw new Error('error adding post: ', err);
      } else {
        roller.recent(req, client, function(err, results) {
          if (err) {
            throw new Error('error retrieving posts: ', err);
          } else {
            should.exist(results);
            results.length.should.equal(1);
          }
          done();
        });
      }
    });
  });

  it('successfully deletes a post', function(done) {
    req.body.id = 1;
    roller.delete(req, client, function(err, resp) {
      if (err) {
        throw new Error('error deleting post');
      } else {
        roller.recent(req, client, function(err, results) {
          if (err) {
            throw new Error('error retrieving posts: ', err);
          } else {
            results.length.should.equal(0);
          }
          done();
        });
      }
    });
  });
});
