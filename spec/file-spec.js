
var File = require("../lib/file");

describe("File", function () {

    it("should inintialize", function () {
        var file = new File({
            utf8: "Hello, World!"
        });

        expect(file.buffer.toString("utf-8")).toBe("Hello, World!");
        expect(file.utf8).toBe("Hello, World!");

    });

    it("should retain an HTML document", function () {
        var file = new File({
            utf8: "<h1>Hello, World!</h1>"
        });
        expect(file.document).toBe(file.document);
    });

});

