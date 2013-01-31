
var forEach = require("./for-each");
var URL = require("url2");
var Promise = require("q");
var FS = require("q-io/fs");

module.exports = write;
function write(appPackage, config) {
    return forEach(Object.values(config.files), function (file) {
        if (file.remove)
            return;
        var buildPath = URL.parse(file.buildLocation).pathname;
        config.out.status("Writing", buildPath);
        var buildDirectory = FS.directory(buildPath);
        return Promise.fcall(function () {
            return FS.makeTree(buildDirectory);
        })
        .then(function () {
            return file.write(buildPath)
            .catch(function (error) {
                config.out.log("Can't write " + buildPath, error.stack)
                throw error;
            })
        })
    })
    .then(function () {
        config.out.status();
    })
}

