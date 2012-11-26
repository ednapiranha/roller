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
    var target = $(ev.target);

    switch (target[0].className) {
      // trigger action menu
      case 'actions':
        if (target.hasClass('on')) {
          target.removeClass('on');
        } else {
          target.addClass('on');
        }
        break;

      // delete post
      case 'delete':
        roller.delete(target.closest('.post-item'));
        break;

      // close form
      case 'close':
        form.removeClass('on').addClass('off');
        break;

      // like / unlike
      case 'heart':
        if (target.hasClass('on')) {
          roller.unlike(target.closest('.post-item'));
        } else {
          roller.like(target.closest('.post-item'));
        }
        break;
    }
  });

  body.on('click', function(ev) {
    var target = $(ev.target);

    switch (target[0].id) {
      // persona login
      case 'login':
        ev.preventDefault();
        persona.login();
        break;

      // persona logout
      case 'logout':
        ev.preventDefault();
        persona.logout();
        break;

      // trigger text post
      case 'add-text':
        form.find('input[name="message"]').get(0).type = 'text';
        form.find('select[name="type"]').val('text');
        form.addClass('on').removeClass('off');
        break;

      // trigger image post
      case 'add-image':
        form.find('input[name="message"]').get(0).type = 'file';
        form.find('select[name="type"]').val('image');
        form.addClass('on').removeClass('off');
        break;

      // feed
      case 'feed':
        document.location.hash = '/';
        break;

      // likes
      case 'liked':
        document.location.hash = '/likes';
        break;
    }
  });

  var checkUrl = function() {
    var hash = document.location.hash;

    roller.clear();

    if (hash.indexOf('likes') > -1) {
      roller.likes();
    } else if (hash.indexOf('roller') > -1) {
      var id = hash.split('#/')[1];
      roller.detail(parseInt(id, 10));
    } else {
      roller.recent();
    }
  };

  checkUrl();

  $(window).bind('hashchange', function() {
    checkUrl();
  });
});
