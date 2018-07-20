
var Promise = require("bluebird");

require("collections/shim-object");

// stages
var read = require("./read");

var relocate = require("./relocate");
var reconfigure = require("./reconfigure");
var transform = require("./transform");
var bundle = require("./bundle");
var appcache = require("./appcache");
var write = require("./write");
var link = require("./link");

module.exports = build;
function build(location, config) {
    config.out.log("Build starting", location);    
    // needs seed and overlays
    return read(location, config)
    // produces files and hashes
    .then(function (package) {
        // creates buildLocations for all packages and files
        return Promise.resolve(relocate(package, config))
        .then(function () {
            // needs the delimiter, buildLocation, and hashes
            return reconfigure(package, config);
            // rewrites and rebases package.jsons
        })
        .then(function () {
            // converts json, js, and html modules to script-injection format
            // minifies html, scripts, and html in general (not just modules).
            // package.json's must be reconfigured first
            return transform(package, config);
        })
        .then(function () {
            config.registry = package.registry;
            return bundle(package, config);
        })
        // TODO collects garbage
        .then(function () {
            // creates a manifest.appcache
            return appcache(package, config);
        })
        .then(function () {
            return write(package, config);
        })
        .then(function () {
            return link(package, config);
        })
        .then(function (result) {
            config.out.log("Build completed", package.buildLocation);
            return result;
        })
        .catch(function (error) {
            config.out.error("Build failed", error, error.stack);
            return Promise.reject(error);
        });
    });
}
