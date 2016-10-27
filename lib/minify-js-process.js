var UGLIFY = require("uglify-js");

process.on("message", function (message) {
    try {
        process.send({
            id: message.id,
            code: UGLIFY.minify(message.source, {
                fromString: true,
                warnings: false
            }).code
        });
    } catch (e) {
        process.send({
            id: message.id,
            code: message.source
        });
    }
});
