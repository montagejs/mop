var MontageBootstrap = require("montage"); // perhaps make this montage/bootstrap in the future
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

module.exports = read;
function read(location, config) {
    
    return MontageBootstrap.loadPackage(location, config)
    .then(function (package) {
        config.rootPackage = package; // save rootPackage
        return loadDeepPackages(package)
        .then(verifyVersions)
        .then(function () {
            var packages = Object.values(package.packages);
            config.files = {}; // by location
            return Promise.each(packages, function (package) {
                package.files = {}; // by relativeLocation
                return readPackage(package, config);
            }).then(function () {
                return hashDependencies(package);
            }).then(function () {
                return package;
            });
        });
    });
}

function verifyVersions(package) {
    return new Promise(function (resolve, reject) {
           
        if (package.hasPackage({name: "montage"})) {
            var montage = package.getPackage({name: "montage"});
            var montagePredicate = mopDescription.dependencies.montage;
            if (!semver.satisfies(montage.packageDescription.version, montagePredicate)) {
                reject(new Error(
                    "Mop only supports Montage " + montagePredicate + ".  This app has " +
                    montage.packageDescription.version
                ));
                return;
            }
        }

        if (package.hasPackage({name: "mr"})) {
            var mr = package.getPackage({name: "mr"});
            var mrPredicate = mopDescription.dependencies.mr;
            if (!semver.satisfies(mr.packageDescription.version, mrPredicate)) {
                reject(new Error(
                    "Mop only supports Montage Require (mr) " + mrPredicate + ".  This app has " +
                    mr.packageDescription.version
                ));
                return;
            }
        } 

        return resolve(package);
    });
}

function loadDeepPackages(package, memo) {
    memo = memo || {};
    var mappings = package.mappings || {};
    return Promise.all(Object.keys(mappings).map(function (id) {
        var mapping = mappings[id];
        var location = mapping.location;
        if (!memo[location]) {
            var loading = package.loadPackage(location)
            .then(function (dependency) {
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
function readPackage(package, config, memo) {
    memo = memo || {};
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
    var packageFilter = Glob.makeFilter(_path, package.config.packageDescription.exclude || [], config);
    // Filter by relative to rootPackage 
    var rootFilter = Glob.makeFilter(Location.toPath(config.rootPackage.location), config.rootPackage.config.packageDescription.exclude || [], config);

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
            var fileLocation = URL.resolve(config.location, Location.fromPath(name));
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
        var dependencies = Object.keys(mappings).sort().map(function (name) {
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
