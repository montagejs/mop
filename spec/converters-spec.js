
var Converters = require("../lib/converters");

describe("Converters", function () {

    it("converts a string to a buffer", function () {
        var utf8 = "Hello, World!";
        var converter = Converters.from(utf8, "utf8");
        var buffer = converter.to("buffer").content;
        expect(buffer.toString("utf8")).toEqual(utf8);
    });

    it("converts a buffer to a string", function () {
        var buffer = new Buffer("Hello, World!", "utf8");
        var string = Converters.from(buffer, "buffer").to("utf8").content;
        expect(string).toBe("Hello, World!");
    });

    it("converts a buffer to a document and back to a string", function () {
        var buffer = new Buffer("<!doctype html><h1>Hello</h1>", "utf8");
        var document = Converters.from(buffer, "buffer").to("document").content;
        var string = Converters.from(document, "document").to("utf8").content;
        expect(string.trim()).toBe("<!doctype html><h1>Hello</h1>");
    });

    it("round-trips an incomplete document correctly", function () {
        var original = "<h1>Hello</h1>";
        var document = Converters.from(original, "utf8").to("document").content;
        var string = Converters.from(document, "document").to("utf8").content;
        expect(string).toBe(original);
    });

});

