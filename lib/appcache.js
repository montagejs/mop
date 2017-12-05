
// require("collections/shim"); // Object.map, et al
var File = require("./file");
var Glob = require("./glob");
var URL = require("url2");

module.exports = appcache;
function appcache(appPackage, config) {
    var appcacheConfig = appPackage.packageDescription.appcache;

    // Ingore
    if (!appcacheConfig) {
        return;
    }
    
    // Coerce the appcache to {fallback, network}
    if (typeof appcacheConfig === "boolean") {
        appcacheConfig = {
            location: "manifest.appcache",
            exclude: null,
            cache: null,
            fallback: null,
            network: null
        };
    }

    var locations = Object.keys(config.files).sort();
    var exclude = appcacheConfig.exclude || [];
    // Exclude manifest.appcache itself
    exclude.push(appcacheConfig.location);

    var filter = Glob.makeFilter(config.location, exclude);

    var urls = locations.filter(function () {
        // TODO exclude filter
        filter
    }).map(function (location) {
        var file = config.files[location];
        return URL.relative(appPackage.buildLocation, file.buildLocation);
    });

    var lines = ["CACHE MANIFEST"];
    if (appPackage.packageDescription.version) {
        lines.push("#version " + appPackage.packageDescription.version);
    }
    lines.push("#hash " + appPackage.hash);
    lines.push("#created " + new Date());

    // CACHE:
    var cache = appcacheConfig.cache || urls;
    lines.push("CACHE:");
    lines.push.apply(lines, cache);

    // FALLBACK:
    var fallback = appcacheConfig.fallback || {};
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
    lines.push("");
    var network = appcacheConfig.network || '*';
    lines.push("NETWORK:");
    lines.push(network);

    // construct the file
    var content = lines.map(function (line) {
        return line + "\n";
    }).join("");
    var file = new File({
        fs: config.fs,
        utf8: content,
        buildLocation: URL.resolve(appPackage.buildLocation, appcacheConfig.location)
    });
    config.out.log("Appcache manifest: " + file.buildLocation);
    config.files[file.buildLocation] = file;
}

