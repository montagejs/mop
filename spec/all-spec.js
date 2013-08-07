var FS = require("q-io/fs");
var Path = require("path");

var RELATIVE_LIB = Path.join("..", "lib");
var ABSOLUTE_LIB = Path.join(__dirname, RELATIVE_LIB);

FS.listTree(ABSOLUTE_LIB, function (path, stat) {
    return !!path.match(/.js$/);
})
.then(function (tree) {
    tree.forEach(function (path) {
        var id = path.replace(ABSOLUTE_LIB, RELATIVE_LIB)
        require(id);
    });
});
