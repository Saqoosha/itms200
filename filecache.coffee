fs = require 'fs'

isExpired = (path, expireInSecs = 0) ->
    stat = null
    try
        stat = fs.statSync path
    catch error
        return true
    mtime = new Date(stat.mtime).getTime()
    now = new Date().getTime()
    now - mtime > expireInSecs * 1000
    
getCached = (path, expireInSecs, contentCallback, resultCallback) ->
    if isExpired path, expireInSecs
        contentCallback (result) ->
            fs.writeFile path, result, 'utf-8', (err) ->
                resultCallback false, result
    else
        fs.readFile path, 'utf-8', (err, data) ->
            resultCallback true, data


exports.isExpired = isExpired
exports.getCached = getCached
