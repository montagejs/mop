
var URL = require("url2");
var entries = require('object.entries');

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
    entries(packages, function (package) {
        if (package.config.name !== appPackage.config.name) {
            package.buildLocation = URL.resolve(
                appPackage.buildLocation,
                "packages/" +
                    package.config.name +
                    config.delimiter +
                    package.hash + "/"
            );
        }

        // files
        entries(package.files, function (file, relativeLocation) {
            file.buildLocation = URL.resolve(package.buildLocation, relativeLocation);
        });
    });

}

