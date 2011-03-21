var EXPORTED_SYMBOLS = ["SCHEME"];

var SCHEME = {
    name: {
        ja: "Vimperator っぽい何か",
        en: "Little vimperator"
    },
    description: {
        ja: "Vimperator が忘れられないあなたへ (完成度低)",
        en: "You still want vimperator I know that"
    },
    icon: 'data:image/png;base64,' +
        "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz" +
        "AAAHaQAAB2kBsUmw0wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEVSURB" +
        "VDiN7ZO/SsRAEMZ/d8nlPAQThIgBRUgXRMQqcKVNLGxstLun8AH0FWysU4lwmNLK5lpLBS1MYSdb" +
        "H+HgXMdiEyGSHIqtHwzM7M5882d3APaBApBfSlHGUgC6ulgdICfbyM4a0vkW5C3VbA0UndIAYLQL" +
        "FwfQ6xr7bQo3z3D7AsMNOB3C5T2cT2D2bny+CPbW4W4EfYuFmLzC4RXoMq0FnAGIwJYHgx4cXcP4" +
        "CaZz2FyBZcc4Pyg4HpvzCrUWwJQ//zC6bduICKGn6VvwqJqrapxyFEWilJI8zyUIgtbX6Lb1miQJ" +
        "vu8ThiFxHLfOpJXgp/gnWEAgIo16E2rLVInrupJlmaRpKo7jNP0BXcb+bZ0/AR3xiOss0tIhAAAA" +
        "AElFTkSuQmCC",
    hooks: [],
    keybindings: {},
    prefs: {
        "keyhandler.use_prefix_argument"        : true,
        "keyhandler.digit_prefix_argument_type" : "Digit"
    },
    specialKeys: {
        'escape'  : 'C-v',
        'suspend' : 'C-z'
    },
    preserved: [

    ].join("\n")
};

// Key bindings {{ ========================================================== //

SCHEME.keybindings["global"] = [
    // KeySnail
    ["C-M-r", "reload_the_initialization_file", true]
    ["ESC", [function (ev, arg) {
                 if (key.suspend)
                 {
                     key.suspend = false;
                     key.updateStatusBar();
                 }

                 key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_ESCAPE, true);
             }, "Escape"],
     true]
];

SCHEME.keybindings["view"] = [
    // Scroll
    ["j", "scroll_line_down"],
    ["k", "scroll_line_up"],
    ["h", "scroll_left"],
    ["l", "scroll_right"],
    ["C-u", "scroll_page_up"],
    ["C-b", "scroll_page_up"],
    ["C-d", "scroll_page_down"],
    [["g", "g"], "scroll_to_the_top_of_the_page", true],
    ["G", "scroll_to_the_bottom_of_the_page", true]
];

SCHEME.keybindings["caret"] = [
    // move caret
    ["^", "move_caret_to_the_beginning_of_the_line"],
    ["$", "move_caret_to_the_end_of_the_line"],
    ["j", "move_caret_to_the_next_line"],
    ["k", "move_caret_to_the_previous_line"],
    ["l", "move_caret_to_the_right"],
    [[["C-h"], ["h"]], "move_caret_to_the_left"],
    // move caret by word
    ["w", "move_caret_to_the_right_by_word"],
    ["W", "move_caret_to_the_left_by_word"],
    ["SPC", "move_caret_down_by_page"],
    ["b", "move_caret_up_by_page"],
    [["g", "g"], "move_caret_to_the_top_of_the_page"],
    ["G", "move_caret_to_the_end_of_the_line"],
    // scroll page
    ["C-d", "scroll_line_down_caret"],
    ["C-u", "scroll_line_up_caret"],
    [",", "scroll_left_caret"],
    [".", "scroll_right_caret"]
];

var nonEditableCommon = [
    [":", "list_command", true],
    // Navigation
    ["r", "reload_the_page", true],
    ["H", "back"],
    ["L", "forward"],
    // Hint
    ["f", [function (ev, arg) { ext.exec("hok-start-foreground-mode", arg); }, "Start foreground hint mode"], true],
    ["F", [function (ev, arg) { ext.exec("hok-start-background-mode", arg); }, "Start background hint mode"], true],
    [";", [function (ev, arg) { ext.exec("hok-start-extended-mode", arg); }, "Start extended hint mode"], true],
    // Tab
    [[["g", "t"], ["C-n"]], "select_next_tab"],
    [[["g", "T"], ["C-p"]], "select_previous_tab"],
    [["g", "u"], "upper_directory"],
    [["g", "U"], "goto_root"],
    ["d", "close_tab_window"],
    ["u", "undo_closed_tab"],
    // Others
    ["i", [function (ev, arg) {
        util.setBoolPref(
            "accessibility.browsewithcaret",
            !util.getBoolPref("accessibility.browsewithcaret")
        );
    }, "Toggle caret mode"], true],
    ["t", [function (ev, arg) {
        shell.input("tabopen ");
    }, "Tab open"], true],
    ["T", [function (ev, arg) {
        shell.input("tabopen! ");
    }, "Tab open"], true],
    ["o", [function (ev, arg) {
        shell.input("open ");
    }, "Open"], true],
    ["O", [function (ev, arg) {
        shell.input("open! ");
    }, "Open"], true],
    ["y", [function (ev, arg) {
        command.setClipboardText(content.document.location.href);
        display.echoStatusBar("Yanked " + content.document.location.href);
    }, "Yank current page address"], true],
    ["p", [function (ev, arg) {
        let url = command.getClipboardText();
        if (url.match(/\s/) || url.indexOf("://") === -1) {
            url = "http://www.google.com/search?q=" + encodeURIComponent(url) + "&ie=utf-8&oe=utf-8&aq=t";
        }
        gBrowser.loadOneTab(url, null, null, null, false);
    }, "Open yanked address or google it"], true]
];

SCHEME.keybindings["view"]  = SCHEME.keybindings["view"].concat(nonEditableCommon);
SCHEME.keybindings["caret"] = SCHEME.keybindings["caret"].concat(nonEditableCommon);

// What can I do?
SCHEME.keybindings["edit"] = [
    ["C-h", "delete_backward_char"]
];

// }} ======================================================================= //
