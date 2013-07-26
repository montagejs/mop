var File = require("../lib/file");
var MockFs = require("q-io/fs-mock");

describe("File", function () {

    var mockFs;
    beforeEach(function () {
        mockFs = MockFs();
    });

    it("should inintialize", function () {
        var file = new File({
            fs: mockFs,
            utf8: "Hello, World!"
        });

        expect(file.buffer.toString("utf-8")).toBe("Hello, World!");
        expect(file.utf8).toBe("Hello, World!");

    });

    it("should retain an HTML document", function () {
        var file = new File({
            fs: mockFs,
            utf8: "<h1>Hello, World!</h1>"
        });
        expect(file.document).toBe(file.document);
    });

    it("should write the content", function (done) {
        var file = new File({
            fs: mockFs,
            utf8: "pass"
        });

        file.write("name.txt")
        .then(function () {
            return mockFs.read("name.txt");
        })
        .then(function (content) {
            expect(content).toBe("pass");
        })
        .then(done, done);
    });

});

