var Promise = require("bluebird");

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
    .then(function (pkg) {
        // creates buildLocations for all packages and files
        return Promise.resolve(relocate(pkg, config))
        .then(function () {
            // needs the delimiter, buildLocation, and hashes
            return reconfigure(pkg, config);
            // rewrites and rebases package.jsons
        })
        .then(function () {
            // converts json, js, and html modules to script-injection format
            // minifies html, scripts, and html in general (not just modules).
            // package.json's must be reconfigured first
            return transform(pkg, config);
        })
        .then(function () {
            config.registry = pkg.registry;
            return bundle(pkg, config);
        })
        // TODO collects garbage
        .then(function () {
            // creates a manifest.appcache
            return appcache(pkg, config);
        })
        .then(function () {
            return write(pkg, config);
        })
        .then(function () {
            return link(pkg, config);
        })
        .then(function (result) {
            config.out.log("Build completed", pkg.buildLocation);
            return result;
        })
        .catch(function (error) {
            config.out.error("Build failed", error, error.stack);
            return Promise.reject(error);
        });
    });
}
