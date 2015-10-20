/*global describe,beforeEach,it,expect */

var SandboxedModule = require('sandboxed-module');
var transformCss = SandboxedModule.require('../../lib/transform/css', {
    requires: {
        '../rebase': function () {
            return "pass";
        }
    }
});
var rebaseCss = transformCss.rebase;

describe("transform/css", function () {
    var fileMock;
    beforeEach(function () {
        fileMock = {
            path: "test.css"
        };
    });

    it("does nothing if config.noCss is true", function () {
        var input = "body {\n    background: #FFFFFF;\n}";
        var output = rebaseCss(input, {}, { noCss: true });
        expect(output).toBe(input);
    });

    it("handles an empty CSS file", function () {
        var input = "";
        var output = rebaseCss(input, {}, {});
        expect(output).toBe(input);
    });

    it("warns on invalid CSS", function () {
        var input = "}";
        var warnings = [];
        var config = {
            out: {
                warn: function () {
                    warnings.push(Array.prototype.join.call(arguments, " "));
                }
            }
        };

        var output = rebaseCss(input, fileMock, config);
        expect(output).toBe(input);
        expect(warnings[0]).toBe("CSS parse error: test.css");
    });

    it("warns on non-transformable css", function () {
        var input = "{}";
        var warnings = [];
        var config = {
            out: {
                warn: function () {
                    warnings.push(Array.prototype.join.call(arguments, " "));
                }
            }
        };

        var output = rebaseCss(input, fileMock, config);
        expect(output).toBe(input);
        expect(warnings[0]).toBe("CSS compression error: test.css");
        // This passes at time of writing but would be overspecifying. CSSO is
        // at liberty to change this, or even fix the problem in the future:
        //expect(warnings[1]).toBe("Cannot read property 'length' of undefined");
    });

    it("rebases unquoted URIs", function () {
        var input = "body{background: url(fail)}";
        var output = rebaseCss(input, fileMock, {});
        expect(output).toBe("body{background:url(pass)}");
    });

});
