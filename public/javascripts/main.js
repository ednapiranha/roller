'use strict';

requirejs.config({
  baseUrl: '/javascripts',
  enforceDefine: true,
  paths: {
    jquery: '/javascripts/jquery'
  }
});

define(['jquery', 'persona', 'roller'],
  function($, persona, roller) {

  var body = $('body');
  var form = $('form');

  body.on('click', function(ev) {
    var self = $(ev.target);

    switch (true) {
      // persona login
      case self.is('#login'):
        ev.preventDefault();
        persona.login();
        break;

      // persona logout
      case self.is('#logout'):
        ev.preventDefault();
        persona.logout();
        break;

      // trigger action menu
      case self.hasClass('actions'):
        if (self.hasClass('on')) {
          self.removeClass('on');
        } else {
          self.addClass('on');
        }
        break;

      // trigger text post
      case self.is('#add-text'):
        form.find('input[name="message"]').get(0).type = 'text';
        form.find('select[name="type"]').val('text');
        form.addClass('on').removeClass('off');
        break;

      // trigger image post
      case self.is('#add-image'):
        form.find('input[name="message"]').get(0).type = 'file';
        form.find('select[name="type"]').val('image');
        form.addClass('on').removeClass('off');
        break;

      // delete post
      case self.hasClass('delete'):
        roller.delete(self.closest('.post-item'));
        break;

      // close form
      case self.hasClass('close'):
        form.removeClass('on').addClass('off');
        break;

      // feed
      case self.is('#feed'):
        document.location.hash = '/';
        break;

      // likes
      case self.is('#liked'):
        document.location.hash = '/likes';
        break;

      // like / unlike
      case self.hasClass('heart'):
        if (self.hasClass('on')) {
          roller.unlike(self.closest('.post-item'));
        } else {
          roller.like(self.closest('.post-item'));
        }
        break;
    }
  });

  var checkUrl = function() {
    var hash = document.location.hash;

    roller.clear();

    if (hash.indexOf('likes') > -1) {
      roller.likes();
    } else {
      roller.recent();
    }
  };

  checkUrl();

  $(window).bind('hashchange', function() {
    checkUrl();
  });
});
