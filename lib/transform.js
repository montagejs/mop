"use strict";

var Promise = require("bluebird");
var pending = 0;

module.exports = transform;
function transform(appPackage, config) {
    var spinner = function() { config.out.status.apply(config.out, ["Processed"].concat(Array.prototype.slice.call(arguments))); };
    return new Promise(function (resolve/*, reject*/) {
        var files = Object.keys(config.files),
            file,
            i;

        pending += files.length;
        for (i = 0; i < files.length; i++) {
            file = config.files[files[i]];
            /*jshint loopfunc: true */
            transformFile(file, config, (function (file) {
                return function () {
                    spinner(file.path);
                    pending--;
                    if (!pending) {
                        resolve();
                    }
                };
            })(file));
            /*jshint loopfunc: false */
        }
    }).then(function () {
        config.out.status();
    });
}

transform.extensions = {
    ".html": require("./transform/html"),
    ".css": require("./transform/css"),
    ".json": require("./transform/json"),
    ".mjson": require("./transform/json"),
    ".js": require("./transform/javascript")
};

function transformFile(file, config, callback) {
    // Cannot simply replace with path.extname due to q-io extension behaving differently
    // var extension = path.extname(Location.toPath(file.location)).substring(1);
    var extension = config.fs.extension(file.location);
    //if (file.relativeLocation === "package.json") {
    if (transform.extensions[extension]) {
        transform.extensions[extension](file, config, callback);
    } else {
        if (callback) {
            callback();
        }
    }
}
