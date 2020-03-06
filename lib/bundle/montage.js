
var Bundle = require("../bundle");
var MontageBootstrap = require("montage"); // perhaps make this montage/bootstrap in the future
var URL = require("url2");
var Promise = require("bluebird");
var File = require("../file");

var fs = require("fs");

module.exports = bundleMontageHtml;
// returns new script location
function bundleMontageHtml(element, file, config) {
    Bundle.verifyPackageLocation(element, file, config);
    return loadMontageScript(element, file, config)
    .then(function (loader) {
        var bootstrapBundle = collectMontageBootstrapBundle(loader, file.package, config);
        return Bundle.collectPreloadBundles(loader, file.package, config)
        .then(function (preloadPhases) {
            var preloadBundles = Bundle.createPreloadBundles(preloadPhases, file, config);
            return bundleMontageScript(bootstrapBundle, preloadBundles, element, file, config);
        });
    });
}

function bundleMontageScript(bootstrapBundle, preloadFiles, element, file, config) {

    // inject the preloading plan into the bootstrapping bundle
    var plan = preloadFiles.map(function (phase) {
        return phase.map(function (shard) {
            config.out.log("Bundle:", shard.buildLocation, shard.utf8.length, "bytes");
            return URL.relative(file.buildLocation, shard.buildLocation);
        });
    });
    bootstrapBundle.unshift("BUNDLE=" + JSON.stringify(plan) + ";");

    // create and add the file to the build products
    var bundleFile = Bundle.createBundle(bootstrapBundle, file, config, 'bundle-0');

    config.out.log("Bundle:", bundleFile.buildLocation, bundleFile.utf8.length, "bytes (montage bootstrap)");

    // revise the HTML such that it loads the bundle script instead of the
    // montage bootstrapping script, and provide all the information it would
    // be able to infer in development mode using data attributes.
    var applicationPackage = file.package;
    var applicationPackageDescription = applicationPackage.packageDescription;
    var montagePackage = file.package.getPackage({name: "montage"});
    var promisePackage = file.package.getPackage({name: "bluebird"});
    var toBundle = URL.relative(file.buildLocation, bundleFile.buildLocation);
    var toMontage = URL.relative(file.buildLocation, montagePackage.buildLocation);
    var toPromise = URL.relative(file.buildLocation, promisePackage.buildLocation);

    element.setAttribute("src", toBundle);
    // data-montage is usually inferred by the montage.js script src
    element.setAttribute("data-montage-location", toMontage);
    // hashes are necessary in production to connect define() calls from the
    // package.json.load.js files with the corresponding package
    element.setAttribute("data-promise-location", toPromise);

    element.setAttribute("data-montage-hash", montagePackage.hash);
    element.setAttribute("data-promise-hash", promisePackage.hash);
    element.setAttribute("data-application-hash", applicationPackage.hash);

    // When dealing with very large bundles, loading the bundle synchronously
    // can cause a race condition at runtime where the application finishes
    // loading before the first serialization script on index.html is actually
    // part of the document.
    element.setAttribute("async", true);

    if (applicationPackageDescription.mainWorkerModule) {
        var bootstrapWorkerScriptLocation = applicationPackageDescription.bootstrapWorkerScript || "worker-bootstrap",
            bootstrapWorkerFile = applicationPackage.files[bootstrapWorkerScriptLocation + ".js"];


        if (bootstrapWorkerFile) {
            bootstrapWorkerFile.converter.content = prepareMontageWorkerContent(bootstrapWorkerFile, {
                montageLocation: toMontage,
                montageHash: montagePackage.hash,
                promiseHash: promisePackage.hash,
                applicationHash: applicationPackage.hash,
                toMontage: toMontage,
                toPromise: toPromise,
                bundleLocation: bundleFile.relativeLocation
            });
        }

    }
    return null;
}

var didPrepareMontageWorkerContent = false;
function prepareMontageWorkerContent(workerFile, workerParams) {
    var content = workerFile.converter.content,
        contentToPrepend = "var MontageParams = " + JSON.stringify(workerParams, null, 2) + ";\n",
        montageImportRegexp = /importScripts\(\s*("|')([/\.A-Za-z0-9_-]+)*montage\/montage\.js\1\s*\)\s*(;|,)?/,
        pathToMontageRegexp = /(var|const)\s*PATH\_TO\_MONTAGE\s*=\s*("|')([\/\.A-Za-z0-9_-]+)*montage\/\2\s*(;|,)?/;
    if (!didPrepareMontageWorkerContent) {
        didPrepareMontageWorkerContent = true;
        content = replaceOrPrependExpressionWith(content, montageImportRegexp, "importScripts(MontageParams.bundleLocation);");
        content = replaceOrPrependExpressionWith(content, pathToMontageRegexp, "PATH_TO_MONTAGE=MontageParams.montageLocation;");
        content = contentToPrepend + content;
    }
    return content;
}

function replaceOrPrependExpressionWith(content, regexp, replacement) {
    if (regexp.test(content)) {
        content = content.replace(regexp, replacement);
    } else {
        content = replacement + content;
    }
    return content;
}

function loadMontageScript(element, file, config) {
    // emulates bootstrapping in montage.js, to reveal which modules will be
    // needed in the primary bundle.

    // instantiate a new package loader so we can track which files would be
    // loaded at each stage of bundling
    var applicationLocation = file.package.location;
    var montageLocation = file.package.getPackage({name: "montage"}).location;
    return MontageBootstrap.loadPackage(applicationLocation, config)
    .then(function (applicationPackage) {
        return applicationPackage.loadPackage(montageLocation)
        .then(function (montagePackage) {

            // load the promise package so we can inject the bootstrapped
            // promise library back into it
            var promiseLocation = URL.resolve(montagePackage.location, "node_modules/bluebird");

            return [
                montagePackage,
                montagePackage.loadPackage({
                    location: promiseLocation
                })
            ];
        })
        .spread(function(montagePackage) {
            return Promise.all([
                "core/core",
                "core/event/event-manager",
                "core/serialization/deserializer/montage-reviver",
                "core/logger"
            ].map(montagePackage.deepLoad));
        })
        .then(function () {
            return applicationPackage.deepLoad(file.relativeLocation)
                .catch(function (error) {
                    error.message = "Can't find dependencies of HTML application " + JSON.stringify(file.location) + " because " + error.message;
                    throw error;
                })
                .then(function () {
                    if (element.hasAttribute("data-module")) {
                        return applicationPackage.deepLoad(element.getAttribute("data-module"))
                        .catch(function (error) {
                            error.message = "Can't find dependencies of HTML application data-module " + JSON.stringify(element.getAttribute("data-module")) + " because " + error.message;
                            throw error;
                        });
                    }
                })
                .return(applicationPackage);
        });
    });
}

function collectMontageBootstrapBundle(loader, bundler, config) {
    var montagePackage = bundler.getPackage({name: "montage"});
    var requirePackage = bundler.getPackage({name: "mr"});
    var promisePackage = bundler.getPackage({name: "bluebird"});

    var bundle = [
        montagePackage.files["montage.js"].utf8,
        requirePackage.files["require.js"].utf8,
        requirePackage.files["browser.js"].utf8,
        requirePackage.files["worker.js"].utf8,
        promisePackage.files["js/browser/bluebird.min.js"].utf8
    ];

    // some of the modules used in bootstrapping get injected into the run-time
    // during the same process.  to avoid including duplicates of these
    // "modules", mark them as already bundled.
    loader.getPackage({name: "montage"}).getModuleDescriptor("core/promise").bundled = true;
    loader.getPackage({name: "bluebird"}).getModuleDescriptor("bluebird").bundled = true;

    return Bundle.collectBundle(loader, bundler, config, bundle);
}

// returns the initial bundle location, suitable for embedding as a script in a
// page
// function bundleMontageSerialization(serialization, appPackage, config) {
//     // TODO
// }
