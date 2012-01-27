(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  $(function() {
    var AppView, Easing, MusicPlayer, Playlist, Track, TrackView;
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
          v = Easing.expoEaseOut(v);
        } else if (this.audio.duration - current < FADE_DURATION) {
          v = Math.max(0, (this.audio.duration - current) / FADE_DURATION);
          v = Easing.expoEaseOut(v);
        }
        return this.audio.volume = v;
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
        return this.player.play(this.get('url'));
      };

      return Track;

    })(Backbone.Model);
    TrackView = (function(_super) {

      __extends(TrackView, _super);

      function TrackView() {
        this.onStop = __bind(this.onStop, this);
        this.onStart = __bind(this.onStart, this);
        this.play = __bind(this.play, this);
        this.render = __bind(this.render, this);
        TrackView.__super__.constructor.apply(this, arguments);
      }

      TrackView.prototype.tagName = 'tr';

      TrackView.prototype.template = Haml("- var index = order + 1\n- var imgurl = '/cover/' + album.replace('/', '%2F') + ' ' + title\n%td %img(src=imgurl)\n%td &= title\n%td &= artist\n%td &= album");

      TrackView.prototype.events = {
        'click': 'play'
      };

      TrackView.prototype.initialize = function() {
        this.model.view = this;
        this.model.bind('start', this.onStart);
        return this.model.bind('stop', this.onStop);
      };

      TrackView.prototype.render = function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      };

      TrackView.prototype.play = function() {
        return this.model.play();
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

      Playlist.prototype.url = '/playlist/1000/34';

      return Playlist;

    })(Backbone.Collection);
    AppView = (function(_super) {

      __extends(AppView, _super);

      function AppView() {
        this.onPlayComplete = __bind(this.onPlayComplete, this);
        this.addAll = __bind(this.addAll, this);
        this.addOne = __bind(this.addOne, this);
        AppView.__super__.constructor.apply(this, arguments);
      }

      AppView.prototype.id = 'app';

      AppView.prototype.initialize = function() {
        this.playlist = new Playlist;
        this.playlist.bind('add', this.addOne);
        this.playlist.bind('reset', this.addAll);
        return this.playlist.fetch();
      };

      AppView.prototype.addOne = function(track, index) {
        var view;
        track.set({
          order: index
        });
        track.bind('complete', this.onPlayComplete);
        view = new TrackView({
          model: track
        });
        return $('#playlist').append(view.render().el);
      };

      AppView.prototype.addAll = function() {
        return this.playlist.each(this.addOne);
      };

      AppView.prototype.onPlayComplete = function(track) {
        var next, order;
        order = track.get('order');
        next = this.playlist.at(order + 1);
        return next != null ? next.play() : void 0;
      };

      return AppView;

    })(Backbone.View);
    return new AppView;
  });

}).call(this);
