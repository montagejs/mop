
var Dict = require("collections/dict");

var Converters = module.exports = {

    registry: Dict(),

    register: function (options) {
        this.registerOneWay(options.from, options.to, options.convert);
        this.registerOneWay(options.to, options.from, options.revert);
    },

    registerOneWay: function (from, to, convert) {
        if (!this.registry.has(to)) {
            this.registry.set(to, Dict());
        }
        var converters = this.registry.get(to);
        converters.set(from, convert);
    },

    convert: function (from, to, content) {
        if (from === to) {
            return content;
        }
        if (!this.registry.has(to)) {
            throw new Error("Can't convert to content type " + to);
        }
        var converters = this.registry.get(to);
        if (!converters.has(from)) {
            throw new Error("Can't convert from content type " + from + " to " + to);
        }
        var convert = converters.get(from);
        return convert.call(this, content);
    },

    from: function (content, contentType) {
        return Object.create(this.Converter).init(content, contentType, this);
    },

    Converter: {

        init: function (content, contentType, converters) {
            this.content = content;
            this.contentType = contentType;
            this.converters = converters;
            return this;
        },

        to: function (contentType) {
            return this.converters.from(
                this.converters.convert(this.contentType, contentType, this.content),
                contentType
            );
        }
    }

};

Converters.register({
    from: "buffer",
    to: "utf8",
    convert: function (buffer) {
        return buffer.toString("utf-8");
    },
    revert: function (string) {
        return new Buffer(string, "utf8");
    }
});

var jsdom = require("jsdom").jsdom;
var domToHtml = require("jsdom/lib/jsdom/browser/domtohtml").domToHtml;
var Node = require("jsdom").level(1).Node;

Converters.register({
    from: "utf8",
    to: "document",
    convert: function (string) {
        return jsdom(string, null, {
            "features": {
                "FetchExternalResources": false,
                "ProcessExternalResources": false
            }
        });
    },
    revert: function (document) {
        return document.doctype + document.outerHTML;
    }
});

Converters.register({
    from: "buffer",
    to: "document",
    convert: function (buffer) {
        return this.from(buffer, "buffer")
        .to("utf8")
        .to("document")
        .content;
    },
    revert: function (document) {
        return this.from(document, "document")
        .to("utf8")
        .to("buffer")
        .content;
    }
});

