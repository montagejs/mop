
var lastTime = Date.now();
var frames = ["⡿⣾", "⢿⣷", "⣻⣯", "⣽⣟", "⣾⡿", "⣷⢿"];
var i = 0;
var period = 50;
var active = false;

function clear() {
    if (active) {
        // up one, clear line
        process.stdout.write("\u001b[A\u001b[2K");
        active = false;
    }
}

function write(before, after) {
    if (!active) {
        process.stdout.write("\n");
        active = true;
    }
    var message = before + " " + frames[i] + (after ? " " + after : "");
    message = message.slice(0, process.stdout.columns - 1);
    var now = Date.now();
    if (now > lastTime + period) {
        i = (i + 1) % frames.length;
        lastTime = Date.now();
    }
    // up one, clear line, write message, next line
    process.stdout.write("\u001b[A\u001b[2K" + message + "\n");
}

function wrap(log) {
    return function () {
        clear();
        log.apply(console, arguments);
    }
}

console.log = wrap(console.log);
console.warn = wrap(console.warn);
console.error = wrap(console.error);
console.spin = function (before, after) {
    write(before, after);
};
console.stopSpinner = clear;

module.exports = spinner;
function spinner(before) {
    if (!process.stdout.isTTY) {
        return {
            write: function () {},
            clear: function () {}
        };
    } else {
        return {
            write: function (after) {
                write(before, after);
            },
            clear: clear,
        };
    }
}

