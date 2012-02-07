(function() {
  var app, express, filecache, hamlc, playlist, port;

  express = require('express');

  hamlc = require('haml-coffee');

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

  app.get('/:id/:genreId', function(req, res) {
    return res.render('index');
  });

  app.get('/playlist/:id/:genreId', function(req, res) {
    return filecache.getCached("tmp/playlist-" + req.params.id + "-" + req.params.genreId, 3600, function(callback) {
      return playlist.getPlaylist(req.params.id, req.params.genreId, function(list) {
        return callback(JSON.stringify(list));
      });
    }, function(cached, result) {
      return res.send(result);
    });
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("listening on port " + port);
  });

}).call(this);
