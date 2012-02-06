fs = require 'fs'
request = require 'request'
querystring = require 'querystring'
ent = require 'ent'
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
            tag = /<[^>]+?audio-preview-url="[^"]+?("\s[a-z\-]+?=(.|[\r\n])+?)+">/g
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
            async.forEachLimit list, 5
                , (item, callback) ->
                    exports.getCover item.playlistId, (url) ->
                        item.imageUrl = url
                        callback()
                , (err) ->
                    callback?(list)


_cache = {}

exports.getCover = (id, callback) ->
    if _cache[id]?
        async.nextTick -> callback? _cache[id]
    else
        request.get "http://itunes.apple.com/jp/album/id#{id}", (err, res, body) ->
            match = body.match /http:\/\/a\d.mzstatic.com\/.*?\.170x170-75\.jpg/g
            if match?
                _cache[id] = match[0]
                callback? match[0]
            else
                callback? null







