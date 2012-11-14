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
      roller.add(req, client, function(err, result) {
        if (err) {
          console.error('error adding post: ', err);
        } else {
          should.exist(result);
          result.message.should.equal(req.body.message);
        }
        done();
      });
    });
  });

  it('successfully retrieves posts', function(done) {
    roller.add(req, client, function(err, result) {
      if (err) {
        console.error('error adding post: ', err);
      } else {
        roller.recent(req, client, function(err, results) {
          if (err) {
            console.error('error retrieving posts: ', err);
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
    roller.delete(req, client);
    roller.recent(req, client, function(err, results) {
      if (err) {
        console.error('error retrieving posts: ', err);
      } else {
        results.length.should.equal(0);
      }
      done();
    });
  });
});
