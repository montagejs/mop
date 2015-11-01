/*global describe,before,it,expect,after */
var bundle = require("../lib/bundle");
var MockFs = require("q-io/fs-mock");
var Q = require("bluebird");

describe("Bundle", function() {
    var content, file, config;
    beforeEach(function () {
        file = {
            relativeLocation: "name.html",
            package: {
                buildLocation: "/"
            }
        };
        config = {
            fs: MockFs(),
            files: {},
            out: {
                log: function () {}
            }
        };
        content = ["function one(){}", "function two(){}"];
    });

    describe("createBundle", function () {
        it("appends the label with a .", function () {
            var out = bundle.createBundle(content, file, config, "pass");
            expect(out.relativeLocation).toBe("name.html.pass.js");
        });

        it("works without a label", function () {
            var out = bundle.createBundle(content, file, config);
            expect(out.relativeLocation).toBe("name.html.js");
        });

        it("creates a bundle", function () {
            var out = bundle.createBundle(content, file, config);
            expect(out.utf8).toBe("function one(){}\n;\n//*/\nfunction two(){}");
        });

        it("minifies the bundle", function () {
            config.minify = true;
            var out = bundle.createBundle(content, file, config);
            expect(out.utf8).toBe("function one(){}function two(){}");
        });

        it("puts it in the files list", function () {
            var out = bundle.createBundle(content, file, config);
            expect(config.files["/name.html.js"]).toBe(out);
        });
    });

    describe("collectPreloadBundles", function() {
        it("should collect two modules that don't depend on each other into the same bundle", function(done) {
            var bundler = {
                packageDescription: {
                    bundle: [["foo", "bar"]]
                },
                getPackage: function(location) {
                    return {
                        location: location
                    };
                }
            };
            var loader = {
                deepLoad: function(id) {
                    this.packages["app/"].modules[id] = {
                        location: id,
                        type: "javascript",
                        bundled: false
                    };
                    return Q.resolve();
                },
                packageDescription: {},
                packages: {
                    "app/": {
                        bundled: true,
                        modules: {}
                    }
                }
            };
            var config = {
                files: {
                    "app/foo.load.js": {utf8: "app/foo.load.js"},
                    "app/bar.load.js": {utf8: "app/bar.load.js"}
                }
            };

            bundle.collectPreloadBundles(loader, bundler, config)
            .then(function(bundle) {
                expect(bundle).toEqual([[["app/foo.load.js", "app/bar.load.js"]]]);
            }).then(done, done);
        });
    });
});
