/*global describe,beforeEach,it,expect */

var transformHtml = require('../../lib/transform/html');
var minifyHtml = require("html-minifier").minify;

describe("transform/html", function () {

    it("doesn't change incorrectly nested html", function () {
        var original = '<a href="#"><p>text</p></a>';
        expect(minifyHtml(original)).toEqual(original);
    });

});
