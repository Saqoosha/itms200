express = require 'express'
hamlc = require 'haml-coffee'
playlist = require './playlist'
filecache = require './filecache'

app = express.createServer()
app.use express.static __dirname + '/public'
app.register '.hamlc', hamlc
app.configure ->
    app.set 'view engine', 'hamlc'
    app.set 'view options', layout: false

app.get '/', (req, res) ->
    res.render 'index'

app.get '/:id/:genreId', (req, res) ->
    res.render 'index'

app.get '/playlist/:id/:genreId', (req, res) ->
    filecache.getCached "tmp/playlist-#{req.params.id}-#{req.params.genreId}", 3600
        , (callback) ->
            playlist.getPlaylist req.params.id, req.params.genreId, (list) ->
                callback JSON.stringify list
        , (cached, result) ->
            res.send result

port = process.env.PORT or 3000
app.listen port, ->
    console.log "listening on port #{port}"

