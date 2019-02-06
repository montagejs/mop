
var URL = require("url2");
var entries = require('object-foreach');

// assigns a build location to each package and file
module.exports = relocate;
function relocate(appPackage, config) {

    if (appPackage === undefined) {
        throw new Error('Missing appPackage argument');
    }

    var packages = appPackage.packages;

    // app package
    appPackage.buildLocation = URL.resolve(
        config.buildLocation,
        appPackage.config.name + config.delimiter + appPackage.hash + "/"
    );
    // all other packages
    entries(packages, function (pkg) {
        if (pkg.config.name !== appPackage.config.name) {
            pkg.buildLocation = URL.resolve(
                appPackage.buildLocation,
                "packages/" +
                    pkg.config.name +
                    config.delimiter +
                    pkg.hash + "/"
            );
        }

        // files
        entries(pkg.files, function (file, relativeLocation) {
            file.buildLocation = URL.resolve(pkg.buildLocation, relativeLocation);
        });
    });

}

