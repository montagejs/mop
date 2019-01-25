
var rebase = require("../rebase");
var minifyJavaScript = require("../minify-javascript");
var jshint = require("jshint").JSHINT;
var File = require("../file");
var transformCss = require("./css");
require("../shim-minidom"); // FIXME
var Node = require("minidom/dom").Node;
var URL = require("url2");
var minifyHtml = require("html-minifier").minify;

module.exports = transformHtml;
function transformHtml(file, config, callback) {

    // visits the DOM, updating relative URL's that cross package boundaries
    transformDocument(file, config);

    try {
        file.utf8 = minifyHtml(file.utf8, {
            removeComments: true,
            collapseBooleanLiterals: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true
        });
    } catch (exception) {
        config.out.warn("Could not minify " + file.path);
        config.out.warn(exception.message);
    }

    var definedContent = (
        'montageDefine(' +
            JSON.stringify(file.package.hash) + ',' +
            JSON.stringify(file.relativeLocation) + ',' +
            JSON.stringify({ text: file.utf8 }) +
        ')'
    );

    var definedFile = new File({
        fs: config.fs,
        utf8: definedContent,
        location: file.location + ".load.js",
        buildLocation: file.buildLocation + ".load.js",
        relativeLocation: file.relativeLocation + ".load.js",
        package: file.package
    });

    config.files[definedFile.location] = definedFile;
    file.package.files[definedFile.relativeLocation] = definedFile;
    if (callback) {
        callback();
    }
}

function transformDocument(file, config) {
    var appPackage = file.package.getPackage({main: true}),
        appcacheLocation = URL.resolve(appPackage.buildLocation, "manifest.appcache"),
        cssFile,
        styleElement,
        href;

    visit(file.document, function (element) {
        if (element.nodeType === Node.ELEMENT_NODE) {
            switch (element.tagName) {
            case "HTML":
                if (appPackage.packageDescription.appcache) {
                    var relativeLocation = URL.relative(file.buildLocation, appcacheLocation);
                    element.setAttribute("manifest", relativeLocation);
                }
                break;
            case "STYLE":
                rebaseStyleTag(element, file, config);
                break;
            case "SCRIPT":
                rebaseAttribute(element, "src", file, config);
                rebaseScriptTag(element, file, config);
                break;
            case "LINK":
                if (config.cssEmbedding && element.getAttribute("rel") === "stylesheet") {
                    href = element.getAttribute("href");
                    if (href.indexOf(":") === -1) {
                        cssFile = config.files[URL.resolve(file.location, href)];
                        if (cssFile === undefined) {
                            config.out.warn("Stylesheet file not found: " + URL.resolve(file.location, href));
                        }
                        cssFile = cssFile ? cssFile.utf8 : "";
                        styleElement = file.document.createElement("style");
                        rebaseAttribute(element, "href", file, config);
                        var appPackageRelativePath = URL.resolve(
                                element.getAttribute("href"),
                                URL.relative(
                                    appPackage.buildLocation,
                                    file.buildLocation
                                )
                            ),
                            cssText;

                        cssText = transformCss.resolve(appPackageRelativePath, cssFile, config).trim();
                        if (cssText.length) {
                            styleElement.appendChild(
                                file.document.createTextNode(cssText)
                            );
                            element.parentNode.replaceChild(styleElement, element);
                        } else {
                            element.parentNode.removeChild(element);
                        }
                    }
                }
                break;
            default:
                rebaseAttribute(element, "href", file, config);
                rebaseAttribute(element, "src", file, config);
                break;
            }
        }
    });
}

function rebaseStyleTag(element, file, config) {
    var input = getText(element);
    var output = transformCss.rebase(input, file, config);
    setText(element, output, file.document);
}

function rebaseScriptTag(element, file, config) {
    var type;
    if (element.hasAttribute("type")) {
        type = element.getAttribute("type");
    } else {
        type = "application/javascript";
    }
    if (type === "application/javascript" || type === "text/javascript") {
        if (config.lint && file.package.isMainPackage()) {

            // content vs src
            if (element.hasAttribute("src") && getText(element).trim() !== "") {
                config.out.warn("A script tag must only have either a src or content in " + file.path);
            }

            // mime type
            if (type === "text/javascript") {
                config.out.warn("Proper MIME type for JavaScript is application/javascript and should be omitted in " + file.path);
            } else if (element.hasAttribute("type")) {
                config.out.warn("Script MIME type should be omitted if application/javascript in " + file.path);
            }

            // content
            if (!jshint(getText(element))) {
                config.out.warn("JSHints for <script>: " + file.path);
            }

        }
        if (element.hasAttribute("type")) {
            element.removeAttribute("type");
        }
        if (config.minify) {
            try {
                setText(element, minifyJavaScript(getText(element), file.path), file.document);
            } catch (exception) {
                config.out.warn("JavaScript parse error in " + file.path + ": " + exception.message);
            }
        }
    } else if (type === "text/m-objects") {
        config.out.warn("Deprecated text/m-objects block in " + file.path + ". Use text/montage-serialization.");
    } else if (type === "text/montage-serialization") {
        try {
            if (config.minify) {
                setText(element, JSON.stringify(JSON.parse(getText(element))), file.document);
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                config.out.warn("Syntax Error in Montage Serialization in " + file.path);
            } else {
                throw error;
            }
        }
    /*jshint -W035 */
    } else if (type === "x-shader/x-fragment") {
    } else if (type === "x-shader/x-vertex") {
    } else {
        config.out.warn("Unrecognized script type " + JSON.stringify(type) + " in " + file.path);
    }
    /*jshint +W035 */
}

function visit(element, visitor) {
    var next;

    visitor(element);
    element = element.firstChild;
    while (element) {
        next = element.nextSibling;
        visit(element, visitor);
        element = next;
    }
}

function rebaseAttribute(element, attribute, file, config) {
    if (element.hasAttribute(attribute)) {
        var value = element.getAttribute(attribute);
        var rebasedValue = rebase(value, file, config);
        element.setAttribute(attribute, rebasedValue);
    }
}

function getText(element) {
    return element.textContent;
}

function setText(element, text, document) {
    // FIXME minidom setter is not currently implemented
    // element.innerHTML = "";
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    element.appendChild(document.createTextNode(text));
}

