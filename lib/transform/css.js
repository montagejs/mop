
var rebase = require("../rebase");
var CSSOM = require("cssom");

module.exports = transformCss;
function transformCss(file, config) {
    file.utf8 = rebaseCss(file.utf8, file, config);
}

transformCss.rebase = rebaseCss;
function rebaseCss(css, file, config) {
    if (config.noCss)
        return css;
    var cssom;
    try {
        cssom = CSSOM.parse(css);
    } catch (exception) {
        config.out.warn("CSS parse error: " + file.path);
        config.out.warn(exception.message);
        return css;
    }
    cssom.cssRules.forEach(function (rule) {
        var style = rule.style;
        if (!style)
            return;
        var todo = [];
        var rebased = {};
        // lookup
        for (var i = 0, ii = style.length; i < ii; i++) {
            var key = style[i];
            var value = style[key];
            // potential but unlikely pattern matching hazard here
            value.replace(/url\(['"]?([^\)'"]+)['"]?\)/g, function (_, url) {
                rebased[url] = rebase(url, file, config);
            });
        }
        for (var i = 0, ii = style.length; i < ii; i++) {
            var key = style[i];
            var value = style[key];
            style[key] = value.replace(/url\(['"]?([^\)'"]+)['"]?\)/g, function (_, url) {
                return "url(" + rebased[url] + ")";
            });
        }
    })
    return "" + cssom;
}

