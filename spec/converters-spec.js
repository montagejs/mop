
var Converters = require("../lib/converters");

describe("Converters", function () {

    it("should convert a string to a buffer", function () {
        var utf8 = "Hello, World!";
        var converter = Converters.from(utf8, "utf8");
        var buffer = converter.to("buffer").content;
        expect(buffer.toString("utf8")).toEqual(utf8);
    });

    it("should convert a buffer to a string", function () {
        var buffer = new Buffer("Hello, World!", "utf8");
        var string = Converters.from(buffer, "buffer").to("utf8").content;
        expect(string).toBe("Hello, World!");
    });

    it("should convert a buffer to a document and back to a string", function () {
        var buffer = new Buffer("<!doctype html><h1>Hello</h1>", "utf8");
        var document = Converters.from(buffer, "buffer").to("document").content;
        var string = Converters.from(document, "document").to("utf8").content;
        expect(string).toBe("<!doctype html><h1>Hello</h1>");
    });

});

