var EXPORTED_SYMBOLS = ["kill"];

var kill = {
    // rectangle
    buffer: null,
    // kill-ring
    originalText: null,
    originalSelStart: 0,
    ring: [],
    index: 0,
    max: 10,
    // prevent yanking when repeating the M-y
    popFailed: false
};
