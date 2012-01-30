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
                delete prop['dnd-clipboard-data']
                prop
            async.forEachLimit list, 3
                , (item, callback) ->
                    # console.log item.itemName, item.playlistId
                    exports.getCover item.playlistId, (url) ->
                        console.log url
                        item.imageUrl = url
                        callback()
                , (err) ->
                    callback?(list)


# getCover = (query, callback) ->
#     params = querystring.stringify
#         term: query
#         media: 'music'
#         country: 'JP'
#         limit: '1'
#         lang: 'ja_jp'
#     request.get "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?#{params}", (error, response, body) ->
#         if response.statusCode isnt 200 then callback null
#         data = JSON.parse body
#         if data.resultCount > 0 and data.results[0].artworkUrl100?
#             url100 = data.results[0].artworkUrl100
#             url170 = url100.replace '100x100', '170x170'
#             request.head url170, (error, response, body) ->
#                 if response.statusCode is 200
#                     callback url170
#                 else
#                     callback url100
#         else
#             callback null


document = jsdom.jsdom '<html><body>'
window = document.createWindow()
_cache = {}

exports.getCover = (id, callback) ->
    if _cache[id]?
        console.log 'hit:', id, _cache[id]
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


# exports.get = getPlaylist
# exports.getCover = getCover
# exports.getCover2 = getCover2





