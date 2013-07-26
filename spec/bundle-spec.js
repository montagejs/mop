/*global describe,before,it,expect,after */
var bundle = require("../lib/bundle");
var MockFs = require("q-io/fs-mock");

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
});
