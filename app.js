(function() {
  var app, async, express, filecache, hamlc, playlist, port, querystring, request;

  express = require('express');

  hamlc = require('haml-coffee');

  request = require('request');

  querystring = require('querystring');

  async = require('async');

  playlist = require('./playlist');

  filecache = require('./filecache');

  app = express.createServer();

  app.use(express.static(__dirname + '/public'));

  app.register('.hamlc', hamlc);

  app.configure(function() {
    app.set('view engine', 'hamlc');
    return app.set('view options', {
      layout: false
    });
  });

  app.get('/', function(req, res) {
    return res.render('index');
  });

  app.get('/playlist/:id/:genreId', function(req, res) {
    return filecache.getCached("tmp/playlist-" + req.params.id + "-" + req.params.genreId, 900, function(callback) {
      return playlist.getPlaylist(req.params.id, req.params.genreId, function(list) {
        return callback(JSON.stringify(list));
      });
    }, function(cached, result) {
      return res.send(result);
    });
  });

  app.get('/cover/:id', function(req, res) {
    return playlist.getCover(req.params.id, function(imageUrl) {
      return res.redirect(imageUrl || '/images/no-cover.gif');
    });
  });

  app.get('/cover_/:artist/:album/:title', function(req, res) {
    var imageUrl, queries;
    queries = [req.params.artist + ' ' + req.params.album, req.params.artist + ' ' + req.params.title, req.params.album];
    imageUrl = null;
    return async.whilst(function() {
      return queries.length > 0 && imageUrl === null;
    }, function(callback) {
      return playlist.getCover(queries.shift(), function(url) {
        imageUrl = url;
        return callback(url);
      });
    }, function(result) {
      if (result == null) result = '/images/no-cover.gif';
      return res.redirect(result);
    });
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("listening on port " + port);
  });

}).call(this);
