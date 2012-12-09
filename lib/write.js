
var forEach = require("./for-each");
var URL = require("url2");
var Promise = require("q");
var FS = require("q-io/fs");
var Spinner = require("./spinner");

module.exports = write;
function write(appPackage, config) {
    var spinner = Spinner("Writing");
    return forEach(Object.values(config.files), function (file) {
        if (file.remove)
            return;
        var buildPath = URL.parse(file.buildLocation).pathname;
        spinner.write(buildPath);
        var buildDirectory = FS.directory(buildPath);
        return Promise.fcall(function () {
            return FS.makeTree(buildDirectory);
        })
        .then(function () {
            return file.write(buildPath)
            .catch(function (error) {
                console.log("Can't write " + buildPath, error.stack)
                throw error;
            })
        })
    })
    .then(function () {
        spinner.clear();
    })
}

