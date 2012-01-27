fs = require 'fs'
request = require 'request'
querystring = require 'querystring'

decodeEntity = (text) ->
    arr = text.match /&#[0-9]{1,5};/g
    if arr
        for m in arr
            c = parseInt m.substr 2
            if c >= -32768 and c <= 65535
                text = text.replace m, String.fromCharCode(c)
            else
                text = text.replace m, ''
    return text
    fs.close fd, callback


getPlaylist = (id, genreId, callback) ->
    qs = querystring.stringify id: id, genreId: genreId, popId: 1
    request
        url: "http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewTop?#{qs}"
        headers:
            'User-Agent': 'iTunes/10.5.2 (Macintosh; Intel Mac OS X 10.7.2) AppleWebKit/534.52.7'
            'Accept-Language': 'ja-jp'
            'X-Apple-Store-Front': '143462-9,12'
        , (error, response, body) ->
            rx = /audio-preview-url="([^"]+)".*?preview-album="([^"]+)".*?preview-artist="([^"]+)".*?preview-title="([^"]+)".*?preview-duration="(\d+)"/g
            list = while hit = rx.exec body
                duration = Math.floor(parseInt(hit[5]) / 1000)
                {url: hit[1], album: hit[2], artist: hit[3], title: decodeEntity(hit[4]), duration: Math.floor(parseInt(hit[5]) / 1000)}
            callback?(list)


exports.get = getPlaylist
