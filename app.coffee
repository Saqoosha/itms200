express = require 'express'
hamlc = require 'haml-coffee'
request = require 'request'
querystring = require 'querystring'
async = require 'async'
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

app.get '/playlist/:id/:genreId', (req, res) ->
    filecache.getCached "tmp/playlist-#{req.params.id}-#{req.params.genreId}", 900
        , (callback) ->
            playlist.getPlaylist req.params.id, req.params.genreId, (list) ->
                callback JSON.stringify list
        , (cached, result) ->
            res.send result

app.get '/cover/:id', (req, res) ->
    playlist.getCover req.params.id, (imageUrl) ->
        res.redirect (imageUrl or '/images/no-cover.gif')
    
app.get '/cover_/:artist/:album/:title', (req, res) ->
    queries = [
        req.params.artist + ' ' + req.params.album
        req.params.artist + ' ' + req.params.title
        req.params.album
        ]

    imageUrl = null
    async.whilst ->
            queries.length > 0 and imageUrl is null
        , (callback) ->
            playlist.getCover queries.shift(), (url) ->
                imageUrl = url
                callback url
        , (result) ->
            result ?= '/images/no-cover.gif'
            res.redirect result

port = process.env.PORT or 3000
app.listen port, ->
    console.log "listening on port #{port}"

