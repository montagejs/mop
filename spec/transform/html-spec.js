/*global describe,beforeEach,it,expect */

var transformHtml = require('../../lib/transform/html');
var minifyHtml = require("html-minifier").minify;

var File = require("../../lib/file");

describe("transform/html", function () {

    it("doesn't change incorrectly nested html", function () {
        var original = '<a href="#"><p>text</p></a>';
        expect(minifyHtml(original)).toEqual(original);
    });

    it("continues when inline JavaScript can't be minified", function () {
        var original = '<script>function</script><p>text</p>';

        var file = new File({
            utf8: original,
            package: {
                getPackage: function() {
                    return { buildLocation: "" };
                },
                files: {}
            }
        });

        var config = {
            minify: true,
            out: {
                warn: function() {}
            },
            files: {}
        };

        transformHtml(file, config);
        expect(file.utf8).toEqual(original);
    });
});
