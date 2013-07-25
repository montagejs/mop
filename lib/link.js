
var URL = require("url2");

module.exports = link;
function link(package, config) {
    var linkLocation = URL.resolve(config.buildLocation, package.config.name + "/");
    var buildPath = URL.parse(package.buildLocation).pathname.replace(/\/$/, "");
    var linkPath = URL.parse(linkLocation).pathname.replace(/\/$/, "");

    return config.fs.remove(linkPath)
    .catch(function () {})
    .then(function () {
        return config.fs.symbolicCopy(buildPath, linkPath);
    })
    .then(function () {
        config.out.log(buildPath);
    });
}

