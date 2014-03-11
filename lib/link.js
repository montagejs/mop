var URL = require("url2");
var Location = require("./location");

module.exports = link;
function link(package, config) {
    var linkLocation = URL.resolve(config.buildLocation, package.config.name + "/");
    var buildPath = Location.toPath(package.buildLocation).replace(/\/$/, "");
    var linkPath = Location.toPath(linkLocation).replace(/\/$/, "");

    return config.fs.remove(linkPath)
    .catch(function () {})
    .then(function () {
        return config.fs.symbolicCopy(buildPath, linkPath);
    })
    .then(function () {
        config.out.log(buildPath);
        return buildPath;
    });
}

