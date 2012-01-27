express = require 'express'
hamlc = require 'haml-coffee'
request = require 'request'
querystring = require 'querystring'
playlist = require './playlist'


app = express.createServer()
app.use express.static __dirname + '/public'
app.register '.hamlc', hamlc
app.configure ->
    app.set 'view engine', 'hamlc'
    app.set 'view options', layout: false

app.get '/', (req, res) ->
    res.render 'index'

app.get '/playlist/:id/:genreId', (req, res) ->
    playlist.get req.params.id, req.params.genreId, (list) ->
        res.json list


app.get '/cover/:search', (req, res) ->
    params = querystring.stringify
        term: req.params.search
        media: 'music'
        country: 'JP'
        limit: '1'
        lang: 'ja_jp'
    request.get "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?#{params}", (error, response, body) ->
        if response.statusCode is 200
            data = JSON.parse body
            if data?.results?[0]?.artworkUrl100?
                res.redirect data.results[0].artworkUrl100
    

port = process.env.PORT or 3000
app.listen port, ->
    console.log "listening on port #{port}"

