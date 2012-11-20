'use strict';

define(['jquery'],
  function($) {

  var rollerList = $('#rollers');

  // Generates each roller post to the client after the ajax call returns the data
  var generateRoller = function(data) {
    var roller = $('<li class="post-item" data-id="">' +
      '<a href="javascript:;" data-url="" class="roller-link">' +
      '<p class="meta"></p><div class="content"></div>' +
      '<div class="actions"><ol><li class="heart"></li></ol></a></li>');

    roller.find('.mood').attr('style', 'background-image: url(' + data.mood + ')');
    roller.attr('data-id', data.id);
    roller.find('.roller-link').attr('data-url', '/#/roller/' + parseInt(data.id, 10));

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
      actionItem = null;
    }

    if (data.isLiked) {
      roller.find('.heart').addClass('on');
    }

    roller.find('.actions ol').append(actionItem);
    rollerList.prepend(roller);
  };

  var remoteAction = function(url, type, data, callback) {
    $.ajax({
      url: url,
      type: type,
      data: data,
      dataType: 'json',
      cache: false
    }).done(function(data) {
      if (callback) {
        callback(data);
      }
    });
  };

  var self = {
    recent: function() {
      remoteAction('/recent', 'GET', {}, function(data) {
        var rollers = data.rollers;
        for (var i = 0; i < rollers.length; i ++) {
          generateRoller(rollers[i]);
        }
      });
    },

    detail: function(id) {
      remoteAction('/detail/' + id, 'GET', {}, function(data) {
        var rollers = data.rollers;
        for (var i = 0; i < rollers.length; i ++) {
          generateRoller(rollers[i]);
        }
      });
    },

    likes: function() {
      remoteAction('/likes', 'GET', {}, function(data) {
        var rollers = data.rollers;
        for (var i = 0; i < rollers.length; i ++) {
          generateRoller(rollers[i]);
        }
      });
    },

    delete: function(self) {
      remoteAction('/roller', 'DELETE', { id: self.data('id') }, function(data) {
        self.remove();
      });
    },

    clear: function() {
      rollerList.empty();
    },

    like: function(post) {
      remoteAction('/like/' + parseInt(post.data('id'), 10), 'POST', {}, function(data) {
        post.find('.heart').addClass('on');
      });
    },

    unlike: function(post) {
      remoteAction('/like/' + parseInt(post.data('id'), 10), 'DELETE', {}, function(data) {
        post.find('.heart').removeClass('on');
      });
    }
  };

  return self;
});
