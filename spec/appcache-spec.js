/*global describe,before,it,expect,after */
var appcache = require("../lib/appcache");
var MockFs = require("q-io/fs-mock");

describe("Appcache", function() {
    var appPackage, config, mockFs;
    beforeEach(function () {
        appPackage = {
            hash: "xxx",
            buildLocation: "file:///build/",
            packageDescription: {
                appcache: true
            }
        };
        config = {
            fs: MockFs(),
            files: {
                "index.html": {
                    buildLocation: "file:///build/index.html"
                }
            },
            out: {
                log: function () {}
            }
        };
    });

    it("does nothing when no 'appcache' property", function () {
        delete appPackage.packageDescription.appcache;
        appcache(appPackage, config);

        expect(config.files["file:///build/manifest.appcache"]).toBeUndefined();
    });

    describe("package has 'appcache' property", function () {
        it("creates a manifest", function () {
            appcache(appPackage, config);

            expect(config.files["file:///build/manifest.appcache"].utf8).toEqual(
                'CACHE MANIFEST\n#hash xxx\n\nCACHE:\nindex.html\n\nNETWORK:\n*\n'
            );
        });

        it("outputs version", function () {
            appPackage.packageDescription.version = "123";
            appcache(appPackage, config);

            expect(config.files["file:///build/manifest.appcache"].utf8).toEqual(
                'CACHE MANIFEST\n#version 123\n#hash xxx\n\nCACHE:\nindex.html\n\nNETWORK:\n*\n'
            );
        });

        it("uses 'fallback' property", function () {
            appPackage.packageDescription.appcache = {
                fallback: {
                    "index.html": "offline.html"
                }
            };

            appcache(appPackage, config);

            expect(config.files["file:///build/manifest.appcache"].utf8).toEqual(
                'CACHE MANIFEST\n#hash xxx\n\nCACHE:\nindex.html\n\nFALLBACK:\nindex.html offline.html\n\nNETWORK:\n*\n'
            );
        });
    });
});
