var UGLIFY = require("uglify-js");
var commands = {
    uglify: function (source) {
        try {
            return UGLIFY.minify(source, {fromString: true, warnings: false}).code;
        } catch (e) {
            throw e;
        }
    }
};

process.on("message", function (message) {
    try {
        process.send({
            id: message.id,
            result: commands[message.command](message.data)
        });
    } catch (e) {
        process.send({
            id: message.id,
            error: e
        });
    }
});
