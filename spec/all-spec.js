var FS = require("q-io/fs");
var PATH = require("path");

var RELATIVE_LIB = PATH.join("..", "lib");
var ABSOLUTE_LIB = PATH.join(__dirname, RELATIVE_LIB);


FS.listTree(ABSOLUTE_LIB, function (path, stat) {
    return !!path.match(/.js$/);
})
.then(function (tree) {
    tree.forEach(function (path) {
        require(path.replace(ABSOLUTE_LIB, RELATIVE_LIB));
    });
});
