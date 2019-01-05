#!/usr/bin/env node
/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.
3-Clause BSD License
</copyright> */
var URL = require("url2");
var Path = require("path");
var chokidar = require('chokidar');
var fs = require('fs');
var Path = require('path');
var EventEmitter = require('events');
var build = require("./lib/build");
var spinner = require("./lib/spinner");
var Location = require("./lib/location");

/**
 * Optimize the package at the given location.
 * @function
 * @param {string} location An absolute path to a directory containing an app
 * to optimize.
 * @param {Object}  [config] Configuration for optimization.
 * @param {string}  [config.buildLocation="builds"] An absolute or relative path for a
 * directory to generate the optimized files in.
 * @param {boolean} [config.minify=true] Whether to minify the files.
 * @param {boolean} [config.lint=false] Whether to lint the files and output
 * warnings.
 * @param {boolean} [config.noCss=true] Whether to optimize CSS. Cannot handle
 * some modern CSS, and so disabled by default.
 * @param {string}  [config.delimiter="@"] Symbol to use between the package
 * name and the package hash, e.g. my-app@f7e7db2
 * @param {Object}  [config.out=spinner] An object to use for logging.
 * @param {Function} [config.out.log] Variadic function that outputs a normal message.
 * @param {Function} [config.out.warn] Variadic function that outputs a warning.
 * @param {Function} [config.out.status] Variadic function that outputs a status
 * message. These messages are temporary, high volume and should not be
 * permanently displayed. If called with no arguments it should clear the
 * displayed status.
 * @return {Promise.<string>} A promise for the absolute path to the directory
 * containing the built app.
 */
module.exports = optimize;
function optimize(location, config) {
    config = config || {};

    location =  Location.fromPath(location, true);

    if (config.out) {
        // Fill in any missing output functions
        if (!config.out.log) {
            config.out.log = noop;
        }
        if (!config.out.warn) {
            config.out.warn = noop;
        }
        if (!config.out.status) {
            config.out.status = noop;
        }
        if (!config.out.error) {
            config.out.error = noop;
        }
    }

    // mainly here so that fs can be mocked out for testing
    if (!config.fs) {
        config.fs = require("q-io/fs");
    }
    function read(location) {
        var path = Location.toPath(location);
        return config.fs.read(path);
    }

    return build(location, {
        // configurable
        buildLocation: URL.resolve(location, (config.buildLocation || "builds") + "/"),
        minify:       config.minify !== void 0 ? !!config.minify             : true,
        lint:         config.lint !== void 0 ? !!config.lint                 : false,
        noCss:        config.noCss !== void 0 ? !!config.noCss               : false,
        cssEmbedding: config.cssEmbedding !== void 0 ? !!config.cssEmbedding : true,
        delimiter:    config.delimiter !== void 0 ? config.delimiter         : "@",
        out:          config.out                                      || spinner,

        fs:         config.fs,
        read:       read,

        // non-configurable
        overlays: ["browser"],
        production: true
    });

    // Once implemented but currently disabled options:
    //incremental: true,
    //bundle: !!bundle,
    //copyright: !!copyright,
    //shared: !!shared,
    //manifest: !!manifest,
    //force: !!force,
}

/**
 * Watch the package at the given location, recompiling every time any non-ignored
 * files are changed.
 *
 * The following files will not trigger a recompilation:
 * - The .git/ directory
 * - The config.buildLocation directory (default ./builds)
 * - Any other paths listed in `location`/.gitignore, if the file exists
 *
 * @param {string} location An absolute path to a directory containing an app
 * to optimize.
 * @param {Object}  [config] Configuration for optimization.
 * @return {EventEmitter} An emitter that emits a "willCompile" event when
 * compilation starts, and a "didCompile" event when compilation ends.
 */
function watch(location, config) {
    var buildLocation = config.buildLocation || "builds",
        ignored = readGitIgnoredPaths(location),
        emitter = new EventEmitter(),
        watcher;

    // Prevent recompiling due to compilation
    if (ignored.indexOf(buildLocation) === -1) {
        ignored.push(buildLocation);
    }

    function optimizeOnce() {
        emitter.emit('willCompile');
        optimize(location, config).then(function (result) {
            emitter.emit('didCompile', result);
        }, function (error) {
            emitter.emit('error', error);
        });
    }

    watcher = chokidar.watch(location, {
        persistent: true, // keep the process going after 'ready' event
        ignoreInitial: true, // only dispatch events for new changes
        ignored: ignored,
        cwd: location
    });

    watcher.on('all', optimizeOnce);
    optimizeOnce();

    return emitter;
}

function readGitIgnoredPaths(location) {
    var ignored = [".git"]; // .git is always ignored by git
    var gitIgnorePath = Path.join(location, ".gitignore");
    var gitIgnoreFile;
    if (fs.existsSync(gitIgnorePath)) {
        gitIgnoreFile = fs.readFileSync(Path.join(location, ".gitignore"));
        ignored = ignored.concat(
            gitIgnoreFile
                .toString("utf-8")
                .split("\n")
                .filter(function (path) {
                    return !!path;
                })
        );
    }
    return ignored;
}

function usage() {
    console.log("Usage: mop [options] [<application> ...]");
    console.log("");
    //console.log("    -f --force");
    //console.log("    -t --target ./builds/");
    //console.log("    -s --shared for overlapping dependencies to be shared");
    console.log("    -o --optimize 0 to disable optimizations");
    console.log("    -l --lint to enable linter warnings");
    //console.log("    -c --copyright to enable copyright message check");
    //console.log("    -m --manifest to force an application cache to be made");
    console.log("    -d --delimiter @ to use a different symbol");
    console.log("       --no-css to disable CSS compression");
    console.log("       --no-css-embedding to disable embedding of CSS in HTML");
    console.log("    -w --watch to automatically recompile when you save a file");
    console.log("");
}

function version() {
    var config = require("./package.json");
    console.log(config.title + " version " + config.version);
}

function main() {
    var Options = require("optimist");

    var argv = Options
    .boolean([
        //"f", "force",
        "l", "lint",
        //"c", "copyright",
        //"s", "shared",
        //"m", "manifest",
        //"b", "bundle",
        "h", "help",
        "v", "version",
        "css",
        "css-embedding",
        "w", "watch"
    ])
    .default("optimize", "1")
    .alias("o", "optimize")
    .default("lint", false)
    .alias("l", "lint")
    .default("delimiter", "@")
    .alias("d", "delimiter")
    .default("css", true)
    .default("css-embedding", true)
    .default("watch", false)
    .alias("w", "watch")
    .argv;

    if (argv.h || argv.help) {
        return usage();
    }
    if (argv.v || argv.version) {
        return version();
    }

    //var force = argv.f || argv.force;
    //var shared = argv.s || argv.shared;
    //var manifest = argv.m || argv.manifest;
    //var copyright = argv.c || argv.copyright;
    //var bundle = argv.b || argv.bundle;

    var location = argv._.length ? argv._[0] : ".";
    // convert path to locations
    location = Path.resolve(process.cwd(), location);

    // Exit code
    var exitCode = 0;

    var config = {
        buildLocation: argv.t || argv.target,
        minify: argv.optimize > 0,
        lint: argv.l || argv.lint,
        noCss: !argv.css,
        cssEmbedding: argv["css-embedding"],
        delimiter: argv.delimiter
    };

    if (argv.w || argv.watch) {
        watch(location, config);
    } else {
        return optimize(location, config)
        .catch(function () {
            exitCode = 1;
        }).then(function () {
            process.exit(exitCode);
        });
    }
}

function noop() {}

if (module === require.main) {
    main();
}
