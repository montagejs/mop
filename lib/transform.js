"use strict";

// require("collections/shim");
var Promise = require("bluebird");
var Location = require("./location");

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

transform.extensions = new Map();
transform.extensions.set(".html", require("./transform/html"));
transform.extensions.set(".css", require("./transform/css"));
transform.extensions.set(".json", require("./transform/json"));
transform.extensions.set(".mjson", require("./transform/json"));
transform.extensions.set(".js", require("./transform/javascript"));

function transformFile(file, config, spinner) {
    // Cannot simply replace with path.extname due to q-io extension behaving differently
    // var extension = path.extname(Location.toPath(file.location)).substring(1);
    var extension = config.fs.extension(Location.toPath(file.location));
    //if (file.relativeLocation === "package.json") {
    if (transform.extensions.has(extension)) {
        return transform.extensions.get(extension)(file, config, spinner);
    }
}
