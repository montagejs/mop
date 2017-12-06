
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
            exclude: null,
            cache: null,
            fallback: null,
            network: null
        };
    }

    appcacheConfig.location = appcacheConfig.location || "manifest.appcache";
    appcacheConfig.exclude = appcacheConfig.exclude || [];

    var locations = Object.keys(config.files).sort();
    var exclude = ([]).concat(appcacheConfig.exclude);
    // Exclude manifest.appcache itself
    exclude.push(appcacheConfig.location);

    // Filter by relative to package 
    var cacheFilter = Glob.makeFilter(appPackage.buildLocation, exclude, config);

    var urls = locations.filter(function (file) {
        return cacheFilter(file, {
            isDirectory: function () {
                return false;
            }
        });
    }).map(function (location) {
        var file = config.files[location];
        return URL.relative(appPackage.buildLocation, file.buildLocation);
    });

    var lines = ["CACHE MANIFEST"];
    if (appPackage.packageDescription.version) {
        lines.push("#version " + appPackage.packageDescription.version);
    }
    lines.push("#hash " + appPackage.hash);
    
    // CACHE:
    var cache = appcacheConfig.cache || urls;
    lines.push("");
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

