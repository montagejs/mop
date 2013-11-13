/*global describe,before,it,expect,after */

var reconfigure = require("../lib/reconfigure");

describe("reconfigure", function() {
    var appPackage;
    beforeEach(function () {
        appPackage = {
            packages: {
                "a": {
                    buildLocation: "file:///build/a/",
                    config: {
                        mappings: {}
                    },
                    files: {
                        "package.json": {}
                    },
                    packageDescription: {
                        name: "a",
                        readme: "fail"
                    }
                }
            }
        };
    });

    it("keeps the name", function () {
        reconfigure(appPackage);
        expect(
            JSON.parse(appPackage.packages["a"].files["package.json"].utf8).name
        ).toBe("a");
    });

    it("removes the readme", function () {
        reconfigure(appPackage);
        expect(
            JSON.parse(appPackage.packages["a"].files["package.json"].utf8).readme
        ).toBeUndefined();
    });

    it("sets production to true", function () {
        reconfigure(appPackage);
        expect(
            JSON.parse(appPackage.packages["a"].files["package.json"].utf8).production
        ).toBe(true);
    });

    it("sets useScriptInjection to true", function () {
        reconfigure(appPackage);
        expect(
            JSON.parse(appPackage.packages["a"].files["package.json"].utf8).useScriptInjection
        ).toBe(true);
    });

    it("rebases mappings", function () {
        appPackage.packages["a"].config.mappings = {
            "b": {
                location: "file:///build/b/"
            }
        };
        appPackage.packages["a"].packages = {
            "file:///build/b/": {
                config: {
                    name: "bee"
                },
                hash: "xxx",
                buildLocation: "file:///build/b/"
            }
        };
        reconfigure(appPackage);
        var reconfiguredMapping = JSON.parse(appPackage.packages["a"].files["package.json"].utf8).mappings.b;
        expect(reconfiguredMapping.name).toEqual("bee");
        expect(reconfiguredMapping.hash).toEqual("xxx");
        expect(reconfiguredMapping.location).toEqual("../b/");
    });

    it("passes through properties it doesn't recognize", function () {
        appPackage.packages["a"].packageDescription.unknownABC = "pass";
        reconfigure(appPackage);
        expect(
            JSON.parse(appPackage.packages["a"].files["package.json"].utf8).unknownABC
        ).toBe("pass");
    });

});
