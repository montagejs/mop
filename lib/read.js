var MontageBootstrap = require("montage/montage");
var Promise = require("bluebird");
var URL = require("url2");
var semver = require("semver");

var Hash = require("./hash");
var File = require("./file");
var Glob = require("./glob");
var transform = require("./transform");
var Location = require("./location");

var mopDescription = require("../package.json");

var path = require("path");

var values = require('object.values');
var keys = require('object-keys');

module.exports = read;
function read(location, config) {

    return MontageBootstrap.loadPackage(location, config)
    .then(function (appPackage) {
        return loadDeepPackages(appPackage)
        .then(function (pkg) {
            return verifyVersions(pkg, config);
        })
        .then(function () {
            var packages = values(appPackage.packages);
            config.files = {}; // by location
            return Promise.each(packages, function (pkg) {
                pkg.files = {}; // by relativeLocation
                return readPackage(pkg, config, appPackage);
            }).then(function () {
                return hashDependencies(appPackage);
            }).then(function () {
                return appPackage;
            });
        });
    });
}

function verifyVersions(package, config) {
    return new Promise(function (resolve, reject) {

        if (package.hasPackage({name: "montage"})) {
            var montage = package.getPackage({name: "montage"});
            var montagePredicate = mopDescription.dependencies.montage;
            if (
                montagePredicate.indexOf('github:') === 0 ?
                    montage.packageDescription._from !== montagePredicate :
                        !semver.satisfies(montage.packageDescription.version, montagePredicate)
            ) {
                var montageErr = "Mop only supports Montage " + montagePredicate + ".  This app has " +
                        montage.packageDescription.version;

                if (config.checkVersion) {
                    reject(new Error(montageErr));
                    return;
                } else {
                    console.warn(montageErr);
                }
            }
        }

        if (package.hasPackage({name: "mr"})) {
            var mr = package.getPackage({name: "mr"});
            var mrPredicate = mopDescription.dependencies.mr;
            if (
                mrPredicate.indexOf('github:') === 0 ?
                    mr.packageDescription._from !== mrPredicate :
                        !semver.satisfies(mr.packageDescription.version, mrPredicate)
            ) {
                var mrErr = "Mop only supports Montage Require (mr) " + mrPredicate + ".  This app has " +
                    mr.packageDescription.version;

                if (config.checkVersion) {
                    reject(new Error(mrErr));
                    return;
                } else {
                    console.warn(mrErr);
                }
            }
        }

        return resolve(package);
    });
}

function loadDeepPackages(package, memo) {
    memo = memo || {};
    var mappings = package.mappings || {};
    return Promise.all(keys(mappings).map(function (id) {
        var mapping = mappings[id];
        var location = mapping.location;
        if (!memo[location]) {
            var loading = package.loadPackage(location)
            .then(function (dependency) {
                // mr may have had to retry the package at a different location,
                // make sure the mapping location is updated too
                if (location !== dependency.location) {
                    location = mapping.location = dependency.location;
                    memo[location] = loading;
                }
                return loadDeepPackages(dependency, memo);
            });
            memo[location] = loading;
            return loading;
        }
    })).then(function () {
        return package;
    });
}

// this serializes the work
function readPackage(package, config, appPackage) {
    var location = package.location;
    var hashBuilder = Hash("sha256");
    package.hashBuilder = hashBuilder;
    hashBuilder.update(mopDescription.version);
    hashBuilder.update(config.seed || "");

    // option variations
    hashBuilder.update([
        config.minify,
        config.appcache,
        config.shared
    ].map(function (option) {
        return option ? "1" : "0";
    }).join(''));

    hashBuilder.update(config.delimiter || "@");

    var _path = Location.toPath(location);
    // Filter by relative to package
    var packageFilter = Glob.makeFilter(_path, package.config.packageDescription.exclude || []);
    // Filter by relative to appPackage
    var rootFilter = Glob.makeFilter(Location.toPath(appPackage.location), appPackage.config.packageDescription.exclude || []);

    function filter(name, _stat) {
        return packageFilter(name, _stat) && rootFilter(name, _stat);
    }

    return config.fs.listTree(_path, function (name, _stat) {
        config.out.status("Reading package", name);
        // do not traverse into packages
        if (name !== _path) {
            // do not traverse into directory with no package
            if (_stat.isDirectory()) {
                // cannot replace with fs.stats.isFile
                return config.fs.isFile(path.join(name, "package.json"))
                .then(function (isFile) {
                    if (isFile) {
                        return null;
                    } else {
                        return filter(name, _stat);
                    }
                });
            } else {
                return filter(name, _stat);
            }
        }
    })
    .then(function (names) {
        config.out.status();
        return Promise.each(names, function (name) {
            config.out.status("Reading files", name);
            var fileLocation = URL.resolve(config.location || '', Location.fromPath(name));
            var relativeLocation = URL.relative(location, fileLocation);
            return config.fs.read(name)
            .then(function (content) {
                hashBuilder.update(relativeLocation);
                hashBuilder.update(content);
                var file = new File({
                    fs: config.fs,
                    location: fileLocation,
                    relativeLocation: relativeLocation,
                    package: package,
                    path: name
                });
                package.files[relativeLocation] = file;
                config.files[fileLocation] = file;
                if (transform.extensions[config.fs.extension(fileLocation)]) {
                    file.buffer = content;
                }
            });
        });
    })
    .then(function () {
        config.out.status();
    });
}

function hashDependencies(package, memo) {
    memo = memo || {};
    if (!memo[package.location]) {
        memo[package.location] = true;
        var mappings = package.mappings;
        var dependencies = keys(mappings).sort().map(function (name) {
            var location = mappings[name].location;
            return package.packages[location];
        });
        return Promise.all(dependencies.map(function (dependency) {
            return hashDependencies(dependency, memo);
        }))
        .then(function () {
            dependencies.forEach(function (dependency) {
                package.hashBuilder.update(dependency.hash || "");
            });
            package.hash = package.hashBuilder.digest().slice(0, 7);
        });
    }
}
