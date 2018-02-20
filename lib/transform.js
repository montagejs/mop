"use strict";

var Promise = require("bluebird");

function transform(appPackage, config) {
    return Promise.each(Object.values(config.files), function (file) {
        if (file.remove) {
            return;
        }
        config.out.status("Processing", file.path);
        return transformFile(file, config);   
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

function transformFile(file, config) {
    return new Promise(function (resolve/*, reject*/) {
        // Cannot simply replace with path.extname due to q-io extension behaving differently
        // var extension = path.extname(Location.toPath(file.location)).substring(1);
        var extension = config.fs.extension(file.location);
        //if (file.relativeLocation === "package.json") {
        if (transform.extensions[extension]) {
            transform.extensions[extension](file, config, resolve);
        } else {
            resolve();
        }
    });
}

module.exports = transform;