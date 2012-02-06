(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  $(function() {
    var Easing, MusicPlayer, Playlist, PlaylistView, Track, TrackView, VolumeSlider, p;
    Easing = (function() {

      function Easing() {}

      Easing.expoEaseOut = function(t, b, c, d) {
        if (b == null) b = 0;
        if (c == null) c = 1;
        if (d == null) d = 1;
        if (t === 0) {
          return b;
        } else {
          return c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001;
        }
      };

      return Easing;

    })();
    VolumeSlider = (function() {

      function VolumeSlider() {}

      VolumeSlider.volume = 0;

      VolumeSlider.init = function(el) {
        var v;
        v = $.cookie('volume') || 0.8;
        VolumeSlider.volume = v;
        el.val(v * 100);
        return el.on('change', function() {
          VolumeSlider.volume = el.val() / 100;
          return $.cookie('volume', VolumeSlider.volume);
        });
      };

      return VolumeSlider;

    })();
    MusicPlayer = (function() {
      var FADE_DURATION;

      FADE_DURATION = 3;

      MusicPlayer.current = null;

      function MusicPlayer(src) {
        this.onEnded = __bind(this.onEnded, this);
        this.onInterval = __bind(this.onInterval, this);
        this.onLoadedMetaData = __bind(this.onLoadedMetaData, this);
        this.stop = __bind(this.stop, this);
        this.play = __bind(this.play, this);        _.extend(this, Backbone.Events);
        this.audio = new Audio;
        this.audio.volume = 0;
        this.audio.autoPlay = false;
        this.audio.loop = false;
        this.audio.addEventListener('loadedmetadata', this.onLoadedMetaData);
        this.audio.addEventListener('ended', this.onEnded);
        this.stopped = false;
      }

      MusicPlayer.prototype.play = function(url) {
        var _ref;
        if ((_ref = MusicPlayer.current) != null) _ref.stop();
        this.audio.src = url;
        MusicPlayer.current = this;
        return this.trigger('start');
      };

      MusicPlayer.prototype.stop = function() {
        this.stopped = true;
        this.audio.pause();
        clearInterval(this.id);
        return this.trigger('stop');
      };

      MusicPlayer.prototype.onLoadedMetaData = function() {
        if (this.stopped) return;
        this.audio.play();
        return this.id = setInterval(this.onInterval, 50);
      };

      MusicPlayer.prototype.onInterval = function() {
        var current, v;
        v = 1;
        current = this.audio.currentTime;
        if (current < FADE_DURATION) {
          v = Math.max(0, current / FADE_DURATION);
        } else if (this.audio.duration - current < FADE_DURATION) {
          v = Math.max(0, (this.audio.duration - current) / FADE_DURATION);
        }
        return this.audio.volume = Easing.expoEaseOut(v * VolumeSlider.volume);
      };

      MusicPlayer.prototype.onEnded = function() {
        this.stop();
        return this.trigger('complete');
      };

      return MusicPlayer;

    })();
    Track = (function(_super) {

      __extends(Track, _super);

      function Track() {
        this.play = __bind(this.play, this);
        Track.__super__.constructor.apply(this, arguments);
      }

      Track.prototype.play = function() {
        var _this = this;
        this.player = new MusicPlayer;
        this.player.bind('all', function(e) {
          return _this.trigger.apply(_this, [e, _this]);
        });
        return this.player.play(this.get('audioUrl'));
      };

      return Track;

    })(Backbone.Model);
    TrackView = (function(_super) {

      __extends(TrackView, _super);

      function TrackView() {
        this.onStop = __bind(this.onStop, this);
        this.onStart = __bind(this.onStart, this);
        this.onClick = __bind(this.onClick, this);
        this.onMouseLeave = __bind(this.onMouseLeave, this);
        this.onMouseEnter = __bind(this.onMouseEnter, this);
        this.onImageLoaded = __bind(this.onImageLoaded, this);
        this.render = __bind(this.render, this);
        TrackView.__super__.constructor.apply(this, arguments);
      }

      TrackView.prototype.tagName = 'div';

      TrackView.prototype.className = 'cover';

      TrackView.prototype.template = Haml("%img(src=imageUrl)\n.black\n    .info\n        .title &= itemName\n        .artist &= artistName\n        %a.itunes(href=storeUrl target=\"_blank\")\n            %img.badge(src=\"/images/badge_itunes-sm.gif\")\n    .rank = rank");

      TrackView.prototype.events = {
        'mouseenter': 'onMouseEnter',
        'mouseleave': 'onMouseLeave'
      };

      TrackView.prototype.initialize = function() {
        this.model.view = this;
        this.model.bind('start', this.onStart);
        this.model.bind('stop', this.onStop);
        return this.el = $(this.el);
      };

      TrackView.prototype.render = function() {
        var data;
        data = this.model.toJSON();
        if (data.imageUrl == null) data.imageUrl = '/images/no-cover.png';
        data.storeUrl = "http://itunes.apple.com/jp/album/id" + data.playlistId + "?i=" + data.itemId;
        data.rank = data.order + 1;
        this.el.html(this.template(data));
        this.image = $('>img', this.el);
        this.image.load(this.onImageLoaded);
        this.black = $('.black', this.el);
        this.black.click(this.onClick);
        this.black.hide();
        return this;
      };

      TrackView.prototype.onImageLoaded = function(e) {
        var h, img, s, w;
        img = e.target;
        w = img.width;
        h = img.height;
        s = 150 / Math.min(w, h);
        w *= s;
        h *= s;
        return $(img).css({
          width: w,
          height: h,
          left: (150 - w) / 2 + 'px',
          top: (150 - h) / 2 + 'px'
        });
      };

      TrackView.prototype.onMouseEnter = function(e) {
        return this.black.fadeIn(300);
      };

      TrackView.prototype.onMouseLeave = function(e) {
        return this.black.fadeOut(300);
      };

      TrackView.prototype.onClick = function(e) {
        if (e.target.className !== 'badge') return this.model.play();
      };

      TrackView.prototype.onStart = function() {
        return $(this.el).addClass('playing');
      };

      TrackView.prototype.onStop = function() {
        return $(this.el).removeClass('playing');
      };

      return TrackView;

    })(Backbone.View);
    Playlist = (function(_super) {

      __extends(Playlist, _super);

      function Playlist() {
        Playlist.__super__.constructor.apply(this, arguments);
      }

      Playlist.prototype.model = Track;

      return Playlist;

    })(Backbone.Collection);
    PlaylistView = (function(_super) {

      __extends(PlaylistView, _super);

      function PlaylistView() {
        this.onPlayComplete = __bind(this.onPlayComplete, this);
        this.addAll = __bind(this.addAll, this);
        this.addOne = __bind(this.addOne, this);
        PlaylistView.__super__.constructor.apply(this, arguments);
      }

      PlaylistView.prototype.tagName = 'div';

      PlaylistView.prototype.className = 'playlist';

      PlaylistView.prototype.initialize = function(id, genreId) {
        this.playlist = new Playlist;
        this.playlist.url = "/playlist/" + id + "/" + genreId;
        this.playlist.bind('add', this.addOne);
        this.playlist.bind('reset', this.addAll);
        return this.playlist.fetch();
      };

      PlaylistView.prototype.addOne = function(track, index) {
        var view;
        track.set({
          order: index
        });
        track.bind('complete', this.onPlayComplete);
        view = new TrackView({
          model: track
        });
        return $(this.el).append(view.render().el);
      };

      PlaylistView.prototype.addAll = function() {
        this.playlist.each(this.addOne);
        return console.log(this.playlist.length);
      };

      PlaylistView.prototype.onPlayComplete = function(track) {
        var next, order;
        order = track.get('order');
        next = this.playlist.at(order + 1);
        return next != null ? next.play() : void 0;
      };

      return PlaylistView;

    })(Backbone.View);
    VolumeSlider.init($('#volume'));
    p = new PlaylistView(1000, 34);
    return $('body').append(p.el);
  });

}).call(this);
