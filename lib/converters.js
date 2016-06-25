
// var Dict = require("collections/dict");

var Converters = module.exports = {

    registry: {},

    register: function (options) {
        this.registerOneWay(options.from, options.to, options.convert);
        this.registerOneWay(options.to, options.from, options.revert);
    },

    registerOneWay: function (from, to, convert) {
        if (!this.registry[to]) {
            this.registry[to] = {};
        }
        var converters = this.registry[to];
        converters[from] = convert;
    },

    convert: function (from, to, content) {
        if (from === to) {
            return content;
        }
        if (!this.registry[to]) {
            throw new Error("Can't convert to content type " + to);
        }
        var converters = this.registry[to];
        if (!converters[from]) {
            throw new Error("Can't convert from content type " + from + " to " + to);
        }
        var convert = converters[from];
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

require("./shim-minidom"); // FIXME
var minidom = require("minidom");

Converters.register({
    from: "utf8",
    to: "document",
    convert: function (string) {
        return minidom(string);
    },
    revert: function (document) {
        // FIXME minidom returns the doctype in the outerHTML, but this isn't
        // what is implemented by browsers. At some point this we will have to
        // stringify and concatenate the doctype again ourselves.
        return document.outerHTML;
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

