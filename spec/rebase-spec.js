
var rebase = require("../lib/rebase");

describe("rebase", function () {
    it("should rebase", function () {
        var files = {
            "file:///bar/baz": {
                "location": "file:///bar/baz",
                "buildLocation": "file:///builds/baz"
            },
            "file:///foo": {
                "location": "file:///foo",
                "buildLocation": "file:///builds/foo"
            }
        };
        var config = {
            files: files
        };
        expect(rebase("../foo", files["file:///bar/baz"], config)).toBe("foo");
    });
});

