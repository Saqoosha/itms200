(function() {
  var fs, getCached, isExpired;

  fs = require('fs');

  isExpired = function(path, expireInSecs) {
    var mtime, now, stat;
    if (expireInSecs == null) expireInSecs = 0;
    stat = null;
    try {
      stat = fs.statSync(path);
      console.log(stat);
    } catch (error) {
      console.log(error);
      return true;
    }
    mtime = new Date(stat.mtime).getTime();
    now = new Date().getTime();
    console.log(mtime, now, now - mtime);
    return now - mtime > expireInSecs * 1000;
  };

  getCached = function(path, expireInSecs, contentCallback, resultCallback) {
    if (isExpired(path, expireInSecs)) {
      return contentCallback(function(result) {
        return fs.writeFile(path, result, 'utf-8', function(err) {
          return resultCallback(false, result);
        });
      });
    } else {
      return fs.readFile(path, 'utf-8', function(err, data) {
        return resultCallback(true, data);
      });
    }
  };

  exports.isExpired = isExpired;

  exports.getCached = getCached;

}).call(this);
