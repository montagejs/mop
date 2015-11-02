
// temporary. this should be subsumed by Q

var Promise = require("bluebird");

module.exports = forEach;
function forEach(values, callback) {
    function next(i) {
        if (i >= values.length) {
            return;
        } else {
            return new Promise(function(resolve,reject) {
                resolve(callback.call(undefined, values[i], i, values));
            })
            .then(function () {
                return next(i + 1);
            });
        }
    }
    return new Promise(function(resolve,reject) {
        resolve(next.call(undefined, 0));
    });

}
