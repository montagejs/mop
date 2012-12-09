
var URL = require("url2");

module.exports = reconfigure;
function reconfigure(appPackage, config) {
    // reconfigure. build locations must be computed first
    Object.forEach(appPackage.packages, reconfigurePackage);
}


function reconfigurePackage(package) {
    var config = package.config;
    var description = package.packageDescription;
    var reconfig = {};
    reconfig.name = description.name;
    reconfig.version = description.version;
    reconfig.hash = package.hash;
    reconfig.main = description.main;
    reconfig.redirects = description.redirects;
    if (description.directories && description.directories.lib !== "lib") {
        reconfig.directories = reconfig.directories || {};
        reconfig.directories.lib = description.directories.lib;
    }
    var mappings = reconfig.mappings = {};
    Object.keys(config.mappings).forEach(function (name) {
        var mapping = package.packages[config.mappings[name].location];
        mappings[name] = {
            name: mapping.config.name,
            hash: mapping.hash.slice(0, 7),
            location: URL.relative(package.buildLocation, mapping.buildLocation)
        };
    });
    reconfig.useScriptInjection = true;

    if (!package.files["package.json"]) {
        throw new Error("Can't find package.json in " + JSON.stringify(package.location));
    }
    package.files["package.json"].utf8 = JSON.stringify(reconfig);
}

