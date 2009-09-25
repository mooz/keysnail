var EXPORTED_SYMBOLS = ["kill"];

var kill = {
    // rectangle
    buffer: null,
    // kill-ring
    originalText: null,
    originalSelStart: 0,
    originalSelEnd: 0,
    ring: [],
    index: 0,
    killRingMax: 10,
    textLengthMax: 10240,
    // prevent yanking when repeating the M-y
    popFailed: false
};
