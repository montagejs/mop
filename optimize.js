#!/usr/bin/env node
/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.
3-Clause BSD License
</copyright> */

Error.stackTraceLimit = 50;

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
    console.log("");
}

function version() {
    var config = require("./package.json")
    console.log(config.title + " version " + config.version);
}

var URL = require("url2");
var Options = require("optimist")
var build = require("./lib/build");

var argv = Options
    .boolean([
        //"f", "force",
        //"l", "lint",
        //"c", "copyright",
        //"s", "shared",
        //"m", "manifest",
        //"b", "bundle",
        "h", "help",
        "v", "version"
    ])
    .default("optimize", "1")
    .alias("o", "optimize")
    .default("delimiter", "@")
    .alias("d", "delimiter")
    .argv;

if (argv.h || argv.help)
    return usage();
if (argv.v || argv.version)
    return version();

var location = argv._.length ? argv._[0] : ".";
//var force = argv.f || argv.force;
var lint = argv.l || argv.lint;
//var shared = argv.s || argv.shared;
//var manifest = argv.m || argv.manifest;
var buildLocation = argv.t || argv.target || "builds";
//var copyright = argv.c || argv.copyright;
var optimize = +argv.optimize;
//var bundle = argv.b || argv.bundle;
var delimiter = argv.delimiter;

var currentLocation = URL.format({
    protocol: "file:",
    slashes: true,
    pathname: process.cwd() + "/"
});

// convert paths to locations
location = URL.resolve(currentLocation, directory(location));
buildLocation = URL.resolve(currentLocation, directory(buildLocation));

build(location, {
    buildLocation: buildLocation,
    //incremental: true,
    minify: optimize > 0,
    //bundle: !!bundle,
    lint: !!lint,
    //copyright: !!copyright,
    //shared: !!shared,
    //manifest: !!manifest,
    //force: !!force,
    delimiter: delimiter,
    overlays: ["browser"]
})
.done();

function directory(path) {
    if (path.length) {
        if (/\/$/.test(path)) {
            return path;
        } else {
            return path + "/";
        }
    } else {
        return "./";
    }
}

