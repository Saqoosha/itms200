(function() {
  var app, express, hamlc, playlist, port, querystring, request;

  express = require('express');

  hamlc = require('haml-coffee');

  request = require('request');

  querystring = require('querystring');

  playlist = require('./playlist');

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
    return playlist.get(req.params.id, req.params.genreId, function(list) {
      return res.send(JSON.stringify(list));
    });
  });

  app.get('/cover/:query', function(req, res) {
    var params;
    params = querystring.stringify({
      term: req.params.query,
      media: 'music',
      country: 'JP',
      limit: '1',
      lang: 'ja_jp'
    });
    return request.get("http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?" + params, function(error, response, body) {
      var data, imageUrl, _ref, _ref2;
      imageUrl = '/images/no-cover.gif';
      if (response.statusCode === 200) {
        data = JSON.parse(body);
        if ((data != null ? (_ref = data.results) != null ? (_ref2 = _ref[0]) != null ? _ref2.artworkUrl100 : void 0 : void 0 : void 0) != null) {
          imageUrl = data.results[0].artworkUrl100;
        }
      }
      return res.redirect(imageUrl);
    });
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("listening on port " + port);
  });

}).call(this);
