
// temporary. this should be subsumed by Q

var Promise = require("bluebird");

module.exports = forEach;
function forEach(values, callback) {
    function next(i) {
        if (i >= values.length) {
            return;
        } else {
            return Promise.try(callback, values[i], i, values)
            .then(function () {
                return next(i + 1);
            });
        }
    }
    return Promise.try(next, 0);
}
