
var File = require("../file");
var rebase = require("../rebase");
var minifyJavaScript = require("../minify-javascript");

module.exports = transformJson;
function transformJson(file, config) {

    var definedContent = (
        'montageDefine(' +
            JSON.stringify(file.package.hash) + "," +
            JSON.stringify(file.relativeLocation) + "," +
            "{exports: " + file.utf8 + "}" +
        ')'
    );

    var definedFile = new File({
        utf8: definedContent,
        location: file.location + ".load.js",
        relativeLocation: file.relativeLocation + ".load.js",
        buildLocation: file.buildLocation + ".load.js",
        package: file.package
    });
    config.files[definedFile.location] = definedFile;
    file.package.files[definedFile.relativeLocation] = definedFile;

    if (config.minify) {

        // minify original json
        try {
            file.utf8 = JSON.stringify(JSON.parse(file.utf8));
        } catch (exception) {
            if (exception instanceof SyntaxError) {
                config.out.warn("JSON parse error: " + file.location);
            } else {
                throw exception;
            }
        }

        // minify created json.load.js
        try {
            definedFile.utf8 = minifyJavaScript(definedFile.utf8, definedFile.location);
        } catch (exception) {
            if (exception instanceof SyntaxError) {
                config.out.warn("JSON parse error: " + definedFile.location);
            } else {
                throw exception;
            }
        }

    }
}

