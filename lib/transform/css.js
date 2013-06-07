
var rebase = require("../rebase");
var CSSO = require("csso");

module.exports = transformCss;
function transformCss(file, config) {
    file.utf8 = rebaseCss(file.utf8, file, config);
}

transformCss.rebase = rebaseCss;
function rebaseCss(css, file, config) {
    if (config.noCss)
        return css;
    var ast;
    try {
        ast = CSSO.parse(css);
    } catch (exception) {
        config.out.warn("CSS parse error in " + file.path + ": " + exception.message);
        return css;
    }

    var worklist = [ast];
    while (worklist.length) {
        var node = worklist.pop();
        if (node[0] === "uri") {
            var value = node[1], uri;
            if (value[0] === "raw") {
                uri = value[1];
            } else if (value[0] === "string") {
                // remove quotes (first and last character)
                uri = value[1].substring(1, value[1].length - 1);
                // turn quoted URIs into unquoted as special characters are
                // escaped by rebase
                node[1] = value = ["raw"];
            } else {
                config.out.warn("Unknown URI type in " + file.path + ": " + value);
                continue;
            }

            value[1] = rebase(uri, file, config);
        }

        for (var i = node.length - 1; i >= 0; i--) {
            if (Array.isArray(node[i])) {
                worklist.push(node[i]);
            }
        }
    }

    return CSSO.translate(CSSO.cleanInfo(CSSO.compress(ast)));
}

