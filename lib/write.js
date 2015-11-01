
var forEach = require("./for-each");
var Location = require("./location");
var Promise = require("bluebird");

module.exports = write;
function write(appPackage, config) {
    return forEach(Object.values(config.files), function (file) {
        if (file.remove) {
            return;
        }
        var buildPath = Location.toPath(file.buildLocation);
        config.out.status("Writing", buildPath);
        var buildDirectory = config.fs.directory(buildPath);
        return Promise.try(function () {
            return config.fs.makeTree(buildDirectory);
        })
        .then(function () {
            return file.write(buildPath)
            .catch(function (error) {
                config.out.log("Can't write " + buildPath, error.stack);
                throw error;
            });
        });
    })
    .then(function () {
        config.out.status();
    });
}
