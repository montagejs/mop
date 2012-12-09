
require("collections/shim");
var MontageBootstrap = require("montage"); // perhaps make this montage/bootstrap in the future
var Promise = require("q");
var URL = require("url2");
var semver = require("semver");

var Hash = require("./hash");
var File = require("./file");
var Glob = require("./glob");
var FS = require("q-io/fs");
var forEach = require("./for-each");
var transform = require("./transform");
var Spinner = require("./spinner");

var mopDescription = require("../package.json");

module.exports = read;
function read(location, config) {
    return MontageBootstrap.loadPackage(location, config)
    .then(function (package) {
        return loadDeepPackages(package)
        .then(function () {
            var packages = Object.values(package.packages);
            config.files = {}; // location
            return forEach(packages, function (package) {
                package.files = {}; // relativeLocation
                return readPackage(package, config);
            })
            .then(function () {
                return hashDependencies(package);
            })
        })
        .then(function () {
            verifyVersions(package);
            return package;
        })
    })
}

function verifyVersions(package) {
    if (package.hasPackage({name: "montage"})) {
        var montage = package.getPackage({name: "montage"});
        var montagePredicate = mopDescription.dependencies.montage;
        if (!semver.satisfies(montage.packageDescription.version, montagePredicate)) {
            throw new Error(
                "Mop only supports Montage " + montagePredicate + ".  This app has " +
                montage.packageDescription.version
            );
        }
    }
    if (package.hasPackage({name: "mr"})) {
        var mr = package.getPackage({name: "mr"});
        var mrPredicate = mopDescription.dependencies.mr;
        if (!semver.satisfies(mr.packageDescription.version, mrPredicate)) {
            throw new Error(
                "Mop only supports Montage Require (mr) " + mrPredicate + ".  This app has " +
                mr.packageDescription.version
            );
        }
    }
}

function loadDeepPackages(package, memo) {
    memo = memo || {};
    var mappings = package.mappings || {};
    return Promise.all(Object.keys(mappings).map(function (id) {
        var mapping = mappings[id];
        location = mapping.location;
        if (!memo[location]) {
            var loading = package.loadPackage(location)
            .then(function (dependency) {
                return loadDeepPackages(dependency, memo);
            });
            memo[location] = loading;
            return loading;
        }
    }));
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
        config.manifest,
        config.shared
    ].map(function (option) {
        return option ? "1" : "0";
    }).join(''));

    hashBuilder.update(config.delimiter || "@");

    var path = URL.parse(location).pathname;
    var filter = Glob.makeFilter(package.config);
    var spinner = Spinner("Reading package");
    return FS.listTree(path, function (name, stat) {
        spinner.write(name);
        // do not traverse into packages
        if (name !== path && stat.isDirectory()) {
            return FS.isFile(FS.join(name, "package.json"))
            .then(function (isFile) {
                if (isFile) {
                    return null;
                } else {
                    return filter(name, stat);
                }
            });
        } else {
            return filter(name, stat);
        }
    })
    .then(function (names) {
        spinner.clear();
        spinner = Spinner("Reading files");
        return forEach(names, function (name) {
            spinner.write(name);
            var fileLocation = URL.resolve("file://", name);
            var relativeLocation = URL.relative(location, fileLocation);
            return FS.read(name, "b")
            .then(function (content) {
                hashBuilder.update(relativeLocation);
                hashBuilder.update(content);
                var file = new File({
                    location: fileLocation,
                    relativeLocation: relativeLocation,
                    package: package,
                    path: name
                });
                package.files[relativeLocation] = file;
                config.files[fileLocation] = file;
                if (transform.extensions.has(FS.extension(fileLocation))) {
                    file.buffer = content;
                }
            });
        });
    })
    .then(function () {
        spinner.clear();
    })
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

