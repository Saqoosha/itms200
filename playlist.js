(function() {
  var async, ent, fs, querystring, request, _cache;

  fs = require('fs');

  request = require('request');

  querystring = require('querystring');

  ent = require('ent');

  async = require('async');

  exports.getPlaylist = function(id, genreId, callback) {
    var qs;
    qs = querystring.stringify({
      id: id,
      genreId: genreId,
      popId: 1
    });
    return request({
      url: "http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewTop?" + qs,
      headers: {
        'User-Agent': 'iTunes/10.5.2 (Macintosh; Intel Mac OS X 10.7.2) AppleWebKit/534.52.7',
        'Accept-Language': 'ja-jp',
        'X-Apple-Store-Front': '143462-9,12'
      }
    }, function(error, response, body) {
      var data, hit, key, list, pair, prop, tag, value;
      tag = /<[^>]+?audio-preview-url="[^"]+?("\s[a-z\-]+?=(.|[\r\n])+?)+">/g;
      pair = /([a-z\-]+)="([^"]+)"/g;
      list = (function() {
        var _ref, _results;
        _results = [];
        while (hit = tag.exec(body)) {
          prop = {};
          while (data = pair.exec(hit[0])) {
            prop[data[1]] = ent.decode(data[2]);
          }
          _ref = JSON.parse(prop['dnd-clipboard-data']);
          for (key in _ref) {
            value = _ref[key];
            prop[key] = unescape(value);
          }
          _results.push({
            artistName: prop['artistName'],
            playlistName: prop['playlistName'],
            playlistId: prop['playlistId'],
            itemName: prop['itemName'],
            itemId: prop['itemId'],
            audioUrl: prop['audio-preview-url']
          });
        }
        return _results;
      })();
      return async.forEachLimit(list, 5, function(item, callback) {
        return exports.getCover(item.playlistId, function(url) {
          item.imageUrl = url;
          return callback();
        });
      }, function(err) {
        return typeof callback === "function" ? callback(list) : void 0;
      });
    });
  };

  _cache = {};

  exports.getCover = function(id, callback) {
    if (_cache[id] != null) {
      return async.nextTick(function() {
        return typeof callback === "function" ? callback(_cache[id]) : void 0;
      });
    } else {
      return request.get("http://itunes.apple.com/jp/album/id" + id, function(err, res, body) {
        var match;
        match = body.match(/http:\/\/a\d.mzstatic.com\/.*?\.170x170-75\.jpg/g);
        if (match != null) {
          _cache[id] = match[0];
          return typeof callback === "function" ? callback(match[0]) : void 0;
        } else {
          return typeof callback === "function" ? callback(null) : void 0;
        }
      });
    }
  };

}).call(this);
