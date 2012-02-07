(function() {
  var App, Easing, GenreMenu, HSV, MusicPlayer, Playlist, PlaylistView, Track, TrackView, VolumeSlider, genreData,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  genreData = [
    {
      name: 'Top 200',
      id: 1000,
      genreId: 34
    }, {
      name: 'J-Pop',
      id: 1024,
      genreId: 27
    }, {
      name: 'Alternative',
      id: 1015,
      genreId: 20
    }, {
      name: 'Anime',
      id: 27743,
      genreId: 29
    }, {
      name: 'Blues',
      id: 1001,
      genreId: 2
    }, {
      name: 'Classical',
      id: 1002,
      genreId: 5
    }, {
      name: 'Dance',
      id: 1012,
      genreId: 17
    }, {
      name: 'Electronic',
      id: 1004,
      genreId: 7
    }, {
      name: 'Fitness & Workout',
      id: 27800,
      genreId: 50
    }, {
      name: 'Hip Hop/Rap',
      id: 1013,
      genreId: 18
    }, {
      name: 'Jazz',
      id: 1006,
      genreId: 11
    }, {
      name: 'Kayokyoku',
      id: 1025,
      genreId: 30
    }, {
      name: 'Pop',
      id: 1009,
      genreId: 14
    }, {
      name: 'R&B/Soul',
      id: 1010,
      genreId: 15
    }, {
      name: 'Reggae',
      id: 1031,
      genreId: 24
    }, {
      name: 'Rock',
      id: 1017,
      genreId: 21
    }, {
      name: 'Soundtrack',
      id: 1011,
      genreId: 16
    }, {
      name: 'Vocal',
      id: 1016,
      genreId: 23
    }, {
      name: 'World',
      id: 1014,
      genreId: 19
    }
  ];

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

  HSV = (function() {

    function HSV() {}

    HSV.toRGBA = function(h, s, v, a) {
      var b, f, g, i, k, m, p, q, r;
      if (a == null) a = 1;
      f = h / 60;
      i = f ^ 0;
      m = v - v * s;
      k = v * s * (f - i);
      p = v - k;
      q = k + m;
      r = [v, p, m, m, q, v][i] * 255 ^ 0;
      g = [q, v, v, p, m, m][i] * 255 ^ 0;
      b = [m, m, q, v, v, p][i] * 255 ^ 0;
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    };

    return HSV;

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
        return $.cookie('volume', VolumeSlider.volume, {
          path: '/'
        });
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
      this.play = __bind(this.play, this);      _.extend(this, Backbone.Events);
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

    TrackView.prototype.template = Haml("%img(src=imageUrl)\n.black\n    .info\n        .title &= itemName\n        .artist &= artistName\n        %a.itunes(href=storeUrl target=\"_blank\")\n            %img.badge(src=\"/images/badge_itunes-sm.gif\")\n.rank(style=color) = rank");

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
      data.color = "background-color: " + (HSV.toRGBA(data.rank, 1, 0.95, 0.7));
      this.el.html(this.template(data));
      this.image = $('>img', this.el);
      this.image.hide();
      this.image.load(this.onImageLoaded);
      this.black = $('.black', this.el);
      this.black.click(this.onClick);
      this.black.hide();
      this.rank = $('.rank', this.el);
      this.rank.hide();
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
      $(img).css({
        width: w,
        height: h,
        left: (150 - w) / 2 + 'px',
        top: (150 - h) / 2 + 'px'
      });
      return this.image.fadeIn(300);
    };

    TrackView.prototype.onMouseEnter = function(e) {
      this.black.fadeIn(300);
      return this.rank.fadeIn(300);
    };

    TrackView.prototype.onMouseLeave = function(e) {
      this.black.fadeOut(300);
      if (!this.el.hasClass('playing')) return this.rank.fadeOut(300);
    };

    TrackView.prototype.onClick = function(e) {
      if (e.target.className !== 'badge') return this.model.play();
    };

    TrackView.prototype.onStart = function() {
      this.el.addClass('playing');
      return this.rank.fadeIn(300);
    };

    TrackView.prototype.onStop = function() {
      this.el.removeClass('playing');
      return this.rank.fadeOut(300);
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
      return this.playlist.each(this.addOne);
    };

    PlaylistView.prototype.onPlayComplete = function(track) {
      var next, order;
      order = track.get('order');
      next = this.playlist.at(order + 1);
      return next != null ? next.play() : void 0;
    };

    return PlaylistView;

  })(Backbone.View);

  GenreMenu = (function() {

    function GenreMenu(el, list) {
      this.onClick = __bind(this.onClick, this);
      var a, data, li, _i, _len;
      _.extend(this, Backbone.Events);
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        data = list[_i];
        li = $("<li><a href='/" + data.id + "/" + data.genreId + "'>" + data.name + "</a></li>");
        a = $('a', li);
        a.data('ids', data);
        a.click(this.onClick);
        el.append(li);
      }
    }

    GenreMenu.prototype.onClick = function(e) {
      var ids;
      e.preventDefault();
      ids = $(e.delegateTarget).data('ids');
      history.pushState(ids, ids.name, "/" + ids.id + "/" + ids.genreId);
      return this.trigger('select', ids);
    };

    return GenreMenu;

  })();

  App = (function() {

    function App() {
      this.onResize = __bind(this.onResize, this);
      this.onPopState = __bind(this.onPopState, this);
      this.onGenreSelect = __bind(this.onGenreSelect, this);
      this.changeGenre = __bind(this.changeGenre, this);      VolumeSlider.init($('#volume'));
      window.addEventListener('popstate', this.onPopState);
      window.addEventListener('resize', this.onResize);
      this.onResize();
      this.genreMenu = new GenreMenu($('#genreMenu'), genreData);
      this.genreMenu.bind('select', this.onGenreSelect);
      this.changeGenre(this.find() || genreData[0]);
    }

    App.prototype.find = function() {
      var data, genreId, id, match, _i, _len;
      console.log(location.pathname);
      match = location.pathname.match(/^\/(\d+)\/(\d+)$/);
      if ((match != null ? match.length : void 0) === 3) {
        console.log(match);
        id = parseInt(match[1]);
        genreId = parseInt(match[2]);
        for (_i = 0, _len = genreData.length; _i < _len; _i++) {
          data = genreData[_i];
          if (data.id === id && data.genreId === genreId) return data;
        }
      } else if (location.pathname === '/') {
        return genreData[0];
      }
      return null;
    };

    App.prototype.changeGenre = function(data) {
      var _ref, _ref2;
      if ((_ref = MusicPlayer.current) != null) _ref.stop();
      if ((_ref2 = this.current) != null) _ref2.remove();
      this.current = new PlaylistView(data.id, data.genreId);
      document.title = "itms200 - " + data.name;
      $('#genreName').text(data.name);
      return $('#playlist').append(this.current.el);
    };

    App.prototype.onGenreSelect = function(data) {
      return this.changeGenre(data);
    };

    App.prototype.onPopState = function(e) {
      if (e.state != null) return this.changeGenre(e.state);
    };

    App.prototype.onResize = function(e) {
      var m, n, w;
      w = $('body').width();
      n = ~~((w - 30) / 150);
      m = (w - n * 150) >> 1;
      $('#playlist').css({
        'width': (150 * n) + 'px',
        'margin-left': m + 'px'
      });
      $('.navbar-inner').css({
        'width': (150 * n) + 'px',
        'padding-left': m + 'px',
        'padding-right': m + 'px'
      });
      return $('body').css({
        'background-position': m + 'px 65px'
      });
    };

    return App;

  })();

  $(function() {
    return new App;
  });

}).call(this);
