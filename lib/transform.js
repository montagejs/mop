"use strict";

require("collections/shim");
var Map = require("collections/map");
var Promise = require("q");
var FS = require("q-io/fs");
var URL = require("url2");

module.exports = transform;
function transform(appPackage, config) {
    var spinner = function() { config.out.status.apply(config.out, ["Processing"].concat(Array.prototype.slice.call(arguments))); };
    return Promise.all(Object.map(config.files, function (file) {
        spinner(file.path);
        return transformFile(file, config, spinner);
    }))
    .then(function () {
        config.out.status();
    });
}

transform.extensions = new Map({
    ".html": require("./transform/html"),
    ".css": require("./transform/css"),
    ".json": require("./transform/json"),
    ".js": require("./transform/javascript")
});

function transformFile(file, config, spinner) {
    var extension = FS.extension(URL.parse(file.location).pathname);
    //if (file.relativeLocation === "package.json") {
    if (transform.extensions.has(extension)) {
        return transform.extensions.get(extension)(file, config, spinner);
    }
}

