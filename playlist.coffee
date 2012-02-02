fs = require 'fs'
request = require 'request'
querystring = require 'querystring'
ent = require 'ent'
jsdom = require 'jsdom'
async = require 'async'


exports.getPlaylist = (id, genreId, callback) ->
    qs = querystring.stringify id: id, genreId: genreId, popId: 1
    request
        url: "http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewTop?#{qs}"
        headers:
            'User-Agent': 'iTunes/10.5.2 (Macintosh; Intel Mac OS X 10.7.2) AppleWebKit/534.52.7'
            'Accept-Language': 'ja-jp'
            'X-Apple-Store-Front': '143462-9,12'
        , (error, response, body) ->
            tag = /<[^>]+?audio-preview-url="[^"]+?("\s[a-z\-]+?=.+)+">/g
            pair = /([a-z\-]+)="([^"]+)"/g
            list = while hit = tag.exec body
                prop = {}
                while data = pair.exec hit[0]
                    prop[data[1]] = ent.decode data[2]
                for key, value of JSON.parse prop['dnd-clipboard-data']
                    prop[key] = unescape value
                {
                    artistName: prop['artistName']
                    playlistName: prop['playlistName']
                    playlistId: prop['playlistId']
                    itemName: prop['itemName']
                    itemId: prop['itemId']
                    audioUrl: prop['audio-preview-url']
                }
            async.forEachLimit list, 3
                , (item, callback) ->
                    exports.getCover item.playlistId, (url) ->
                        item.imageUrl = url
                        callback()
                , (err) ->
                    callback?(list)


document = jsdom.jsdom '<html><body>'
window = document.createWindow()
_cache = {}

exports.getCover = (id, callback) ->
    if _cache[id]?
        async.nextTick ->
            callback? _cache[id]
    else
        request.get "http://itunes.apple.com/jp/album/id#{id}", (err, res, body) ->
            jsdom.env
                html: body
                scripts: ['public/js/jquery-1.7.1.min.js']
                , (err, window) ->
                    src = window.jQuery('#left-stack .artwork').html().match(/src="(http[^"]+?)"/)?[1]
                    _cache[id] = src
                    callback? src
                    async.nextTick ->
                        window.close()
