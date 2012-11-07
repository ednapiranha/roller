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

  roller.recent();

  body.on('click', function(ev) {
    ev.preventDefault();
    var self = $(ev.target);

    switch (true) {
      // persona login
      case self.is('#login'):
        persona.login();
        break;

      // persona logout
      case self.is('#logout'):
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

      // submit a post
      case self.is('button'):
        ev.preventDefault();
        roller.add(self.parent());
        break;
    }
  });
});
