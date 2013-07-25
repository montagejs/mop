
var URL = require("url2");
var FS = require("q-io/fs");

module.exports = link;
function link(package, config) {
    var linkLocation = URL.resolve(config.buildLocation, package.config.name + "/");
    var buildPath = URL.parse(package.buildLocation).pathname.replace(/\/$/, "");
    var linkPath = URL.parse(linkLocation).pathname.replace(/\/$/, "");

    return FS.remove(linkPath)
    .catch(function () {})
    .then(function () {
        return FS.symbolicCopy(buildPath, linkPath);
    })
    .then(function () {
        config.out.log(buildPath);
    });
}

