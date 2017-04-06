var Process = require("child_process"),
    path = require("path"),
    cpuLength = require("os").cpus().length,
    processes = [],
    callbacks = {},
    pending = 0,
    id = 0;

function initProcesses() {
    var i;

    for (i = 0; i < cpuLength; i++) {
        processes[i] = Process.fork(
            path.resolve(
                __dirname,
                "process"
            )
        );
        /*jshint loopfunc: true */
        processes[i].on("message", function (message) {
            callbacks[message.id](message.error, message.result);
            delete callbacks[message.id];
            pending--;
            if (!pending) {
                setTimeout(function () {
                    if (!pending) {
                        exports.kill();
                    }
                }, 1000);
            }
        });
        /*jshint loopfunc: false */
    }
}

exports.kill = function () {
    var i;

    for (i = 0; i < processes.length; i++) {
        processes[i].kill();
    }
    processes = [];
};

exports.execute = function (command, data, callback) {
    pending++;
    id++;
    callbacks[id] = callback;
    if (!processes.length) {
        initProcesses();
    }
    processes[id % processes.length].send({
        id: id,
        command: command,
        data: data
    });
};

