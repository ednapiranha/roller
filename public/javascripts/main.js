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

  roller.recent();

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
        form.slideDown();
        break;

      // trigger image post
      case self.is('#add-image'):
        form.find('input[name="message"]').get(0).type = 'file';
        form.find('select[name="type"]').val('image');
        form.slideDown();
        break;

      // delete post
      case self.hasClass('delete'):
        roller.delete(self.closest('.post-item'));
        break;
    }
  });
});
