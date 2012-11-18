'use strict';

define(['jquery'],
  function($) {

  var rollerList = $('#rollers');

  var generateRoller = function(data) {
    var roller = $('<li class="post-item" data-id=""><p class="meta"></p>' +
      '<div class="content"></div>' +
      '<div class="actions"><ol><li class="heart"></li></ol></li>');

    roller.find('.mood').attr('style', 'background-image: url(' + data.mood + ')');
    roller.attr('data-id', data.id);

    if (data.type === 'image') {
      var img = $('<img src="">');
      img.attr('src', data.message);
      roller.find('.content').html(img);
    } else {
      var msg = $('<span></span>');
      msg.text(data.message);
      roller.find('.content').html(msg);
    }

    var posted = 'Posted by <img src="' + data.gravatar + '">';
    roller.find('.meta').html(posted);

    var actionItem = $('<li class=""></li>');

    if (data.isDeletable) {
      actionItem.addClass('delete');
    } else {
      actionItem.addClass('repost');
    }

    if (data.isLiked) {
      roller.find('.heart').addClass('on');
    }

    roller.find('.actions ol').append(actionItem);
    rollerList.prepend(roller);
  };

  var self = {
    recent: function() {
      $.ajax({
        url: '/recent',
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        var rollers = data.rollers;
        for (var i = 0; i < rollers.length; i ++) {
          generateRoller(rollers[i]);
        }
      });
    },

    likes: function() {
      $.ajax({
        url: '/likes',
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        var rollers = data.rollers;
        for (var i = 0; i < rollers.length; i ++) {
          generateRoller(rollers[i]);
        }
      });
    },

    delete: function(self) {
      $.ajax({
        url: '/roller',
        type: 'DELETE',
        data: { id: self.data('id') },
        dataType: 'json',
        cache: false
      }).done(function(data) {
        self.remove();
      });
    },

    clear: function() {
      rollerList.empty();
    },

    like: function(post) {
      $.ajax({
        url: '/like/' + parseInt(post.data('id'), 10),
        type: 'POST',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        post.find('.heart').addClass('on');
      });
    },

    unlike: function(post) {
      $.ajax({
        url: '/like/' + parseInt(post.data('id'), 10),
        type: 'DELETE',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        post.find('.heart').removeClass('on');
      });
    }
  };

  return self;
});
