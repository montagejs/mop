
require("collections/shim"); // Object.map, et al
var File = require("./file");
var URL = require("url2");

module.exports = manifest;
function manifest(appPackage, config) {
    var manifestConfig = appPackage.packageDescription.manifest;
    if (!manifestConfig)
        return;
    // coerce the manifest to {fallback, network}
    if (typeof manifestConfig === "boolean")
        manifestConfig = {};

    var locations = Object.keys(config.files).sort();
    var manifest = locations.map(function (location) {
        var file = config.files[location];
        return URL.relative(appPackage.buildLocation, file.buildLocation);
    });

    var lines = ["CACHE MANIFEST"];
    if (appPackage.packageDescription.version) {
        lines.push("#version " + appPackage.packageDescription.version);
    }
    lines.push("#hash " + appPackage.hash);

    // MANIFEST:
    lines.push.apply(lines, manifest);

    // FALLBACK:
    var fallback = manifestConfig.fallback || {};
    if (Object.keys(fallback).length) {
        lines.push("");
        lines.push("FALLBACK:");
        lines.push.apply(
            lines,
            Object.keys(fallback).map(function (from) {
                return from + " " + fallback[from];
            })
        );
    }

    // NETWORK:
    // ignore provided network lines
    lines.push("");
    lines.push("NETWORK:");
    lines.push("*");

    // construct the file
    var content = lines.map(function (line) {
        return line + "\n";
    }).join("");
    var file = new File({
        utf8: content,
        buildLocation: URL.resolve(appPackage.buildLocation, "manifest.appcache")
    });
    console.log("Manifest: " + file.buildLocation);
    config.files[file.buildLocation] = file;
}

