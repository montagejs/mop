/*global describe,before,it,expect,after */

var Glob = require("../lib/glob");

var directoryStat = {
    isDirectory: function() {
        return true;
    }
};
var fileStat = {
    isDirectory: function() {
        return false;
    }
};

describe("Glob", function() {

    describe("*", function() {
        var filter = Glob.makeFilter("/", ["*"]);

        it("rejects direct child file", function() {
            expect(filter("/test", fileStat)).toBe(false);
        });

        it("rejects direct child directory", function() {
            expect(filter("/test", directoryStat)).toBe(null);
        });

        xit("rejects subdirectory file", function() {
            expect(filter("/test/child", fileStat)).toBe(false);
        });

        it("rejects subdirectory directory", function() {
            expect(filter("/test/child", directoryStat)).toBe(false);
        });

    });

    describe("file name", function() {
        var filter = Glob.makeFilter("/", ["test"]);

        it("rejects file", function() {
            expect(filter("/test", fileStat)).toBe(false);
        });

        it("rejects directory", function() {
            expect(filter("/test", directoryStat)).toBe(null);
        });

        it("accepts child file", function() {
            expect(filter("/test/child", fileStat)).toBe(true);
        });

        it("accepts child directory", function() {
            expect(filter("/test/child", directoryStat)).toBe(false);
        });
    });

});
