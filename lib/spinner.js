
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

exports.log = log;
function log() {
    clear();
    console.log.apply(console, arguments);
}

exports.warn = warn;
function warn() {
    clear();
    console.log.apply(console, ["(warn) "].concat(arguments));
}

exports.status = status;
function status() {
    if (!arguments.length) return clear();

    if (!active) {
        process.stdout.write("\n");
        active = true;
    }

    var args = Array.prototype.slice.call(arguments);
    var before = args.shift();
    var after = args.join(" ");

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
