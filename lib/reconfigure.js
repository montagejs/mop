
var URL = require("url2");
var keys = require('object-keys');
var entries = require('object-foreach');

// Properties not to include in the built package.json files
var BLACKLIST = [
    // `readme` is added to the package.json of npm published packages
    "readme"
];

module.exports = reconfigure;
function reconfigure(appPackage) {
    // reconfigure. build locations must be computed first
    entries(appPackage.packages, reconfigurePackage);
}

function reconfigurePackage(pkg) {
    var config = pkg.config;
    var description = pkg.packageDescription;
    var reconfig = Object.assign({}, description);

    BLACKLIST.forEach(function (property) {
        if (property in reconfig) {
            reconfig[property] = void 0;
        }
    });

    reconfig.hash = pkg.hash;

    var mappings = reconfig.mappings = {};
    keys(config.mappings).forEach(function (name) {
        var mapping = pkg.packages[config.mappings[name].location];
        mappings[name] = {
            name: mapping.config.name,
            hash: mapping.hash.slice(0, 7),
            location: URL.relative(pkg.buildLocation, mapping.buildLocation)
        };
    });
    reconfig.production = true;
    reconfig.useScriptInjection = true;

    if (!pkg.files["package.json"]) {
        throw new Error("Can't find package.json in " + JSON.stringify(pkg.location));
    }
    pkg.files["package.json"].utf8 = JSON.stringify(reconfig);
}

