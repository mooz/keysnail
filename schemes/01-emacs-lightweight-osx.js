var EXPORTED_SYMBOLS = ["SCHEME"];

var SCHEME = {
    name: {
        ja: "適度に Emacs (For Mac OS X)",
        en: "Lightweight Emacs for Mac OS X"
    },
    description: {
        ja: "Mac OSX のショートカットキーをつぶされたくない人用のスキームです",
        en: "Lightweight Emacs keybindings avoids conflict over Mac OSX shortcut"
    },
    icon: "chrome://keysnail/skin/icon/emacs.png",
    hooks: [],
    keybindings: {},
    prefs: {
        "keyhandler.use_prefix_argument" : true
    },
    specialKeys: {
        'quit'              : 'C-g',
        'help'              : '<f1>',
        'escape'            : 'C-q',
        'suspend'           : '<f2>',
        'universalArgument' : 'C-u',
        'negativeArgument1' : 'C--',
        'negativeArgument2' : 'C-M--',
        'negativeArgument3' : 'M--'
    },
    preserved: null
};

// Key bindings {{ ========================================================== //

SCHEME.keybindings["global"] = [
    // KeySnail
    ["C-M-r", "reload_the_initialization_file", true],
    ["M-x", "ext_select", true],
    [[SCHEME.specialKeys.help, "b"], "list_all_keybindings"],
    // Misc
    ["C-m", "generate_the_return_key_code"],
    [[SCHEME.specialKeys.help, "F"], "display_firefox_help"],
    // Focus
    [["C-x", "l"], "focus_to_the_location_bar", true],
    [["C-x", "g"], "focus_to_the_search_bar", true],
    [["C-x", "t"], "focus_to_the_first_textarea", true],
    [["C-x", "s"], "focus_to_the_first_button", true],
    // For Mac users, this will affect
    // ["M-w", "copy_selected_text", true],
    ["C-s", "incremental_search_forward_emacs", true],
    ["C-r", "incremental_search_backward_emacs", true],
    // Tab / Window
    [["C-x", "k"], "close_tab_window"],
    [["C-x", "K"], "close_the_window"],
    [["C-c", "u"], "undo_closed_tab"],
    [["C-x", "n"], "open_new_window"],
    ["C-M-l", "select_next_tab"],
    ["C-M-h", "select_previous_tab"],
    // Misc
    [["C-x", "C-c"], "exit_firefox", true],
    [["C-x", "o"], "select_next_frame"],
    [["C-x", "1"], "show_current_frame_only", true],
    [["C-x", "C-f"], "open_the_local_file", true],
    [["C-x", "C-s"], "save_current_page_to_the_file", true],
    [["C-c", "C-c", "C-v"], "display_javascript_console", true],
    [["C-c", "C-c", "C-c"], "clear_javascript_console", true]
];

SCHEME.keybindings["edit"] = [
    // selection
    [["C-x", "h"], "select_whole_text", true],
    // Scroll
    [[["C-`"], ["C-@"]], "set_the_mark", true],
    ["C-o", "open_line"],
    [[["C-x", "u"], ["C-_"]], "undo"],
    ["C-\\", "redo"],
    // intra line
    ["C-a", "beginning_of_the_line"],
    ["C-e", "end_of_the_line"],
    ["C-f", "forward_char"],
    ["C-b", "backward_char"],
    // ["M-f", "next_word"],
    // ["M-b", "previous_word"],
    // by line
    ["C-n", "next_line"],
    ["C-p", "previous_line"],
    ["C-v", "page_down"],
    // ["M-v", "page_up"],
    ["M-<", "beginning_of_the_text_area"],
    ["M->", "end_of_the_text_area"],
    // deletion
    ["C-d", "delete_forward_char"],
    ["C-h", "delete_backward_char"],
    // ["M-d", "delete_forward_word"],
    [[["C-<backspace>"], ["M-<delete>"]], "delete_backward_word"],
    // transformation
    // ["M-u", "convert_following_word_to_upper_case"],
    // ["M-l", "convert_following_word_to_lower_case"],
    // ["M-c", "capitalize_the_following_word"],
    // cut / passte
    ["C-k", "kill_the_rest_of_the_line"],
    ["C-y", "paste"],
    ["M-y", "paste_pop", true],
    ["C-M-y", "show_kill_ring_and_select_text_to_paste", true],
    ["C-w", "cut_current_region", true],
    // string rectangle
    [["C-x", "r", "d"], "delete_text_in_the_region_rectangle", true],
    [["C-x", "r", "t"], "replace_text_in_the_region_rectangle_with_user_inputted_string", true],
    [["C-x", "r", "o"], "blank_out_the_region_rectangle_shifting_text_right", true],
    [["C-x", "r", "k"], "delete_the_region_rectangle_and_save_it_as_the_last_killed_one", true],
    [["C-x", "r", "y"], "yank_the_last_killed_rectangle_with_upper_left_corner_at_point", true]
    // focus
    // ["M-n", "focus_to_the_next_text_area"],
    // ["M-p", "focus_to_the_previous_text_area"]
];

SCHEME.keybindings["view"] = [
    // Scroll
    [[["C-n"], ["j"]], "scroll_line_down"],
    [[["C-p"], ["k"]], "scroll_line_up"],
    [[["C-f"], ["."]], "scroll_right"],
    [[["C-b"], [","]], "scroll_left"],
    [[["M-v"], ["b"]], "scroll_page_up"],
    ["C-v", "scroll_page_down"],
    [[["M-<"], ["g"]], "scroll_to_the_top_of_the_page", true],
    [[["M->"], ["G"]], "scroll_to_the_bottom_of_the_page", true],
    // tab
    ["l", "select_next_tab"],
    ["h", "select_previous_tab"]
];

SCHEME.keybindings["caret"] = [
    // move caret
    [[["C-a"], ["^"]], "move_caret_to_the_beginning_of_the_line"],
    [[["C-e"], ["$"]], "move_caret_to_the_end_of_the_line"],
    // move caret jklh
    [[["C-n"], ["j"]], "move_caret_to_the_next_line"],
    [[["C-p"], ["k"]], "move_caret_to_the_previous_line"],
    [[["C-f"], ["l"]], "move_caret_to_the_right"],
    [[["C-b"], ["h"], ["C-h"]], "move_caret_to_the_left"],
    // move caret by word
    [[["M-f"], ["w"]], "move_caret_to_the_right_by_word"],
    [[["M-b"], ["W"]], "move_caret_to_the_left_by_word"],
    [[["C-v"], ["SPC"]], "move_caret_down_by_page"],
    [[["M-v"], ["b"]], "move_caret_up_by_page"],
    [[["M-<"], ["g"]], "move_caret_to_the_top_of_the_page"],
    [[["M->"], ["G"]], "move_caret_to_the_end_of_the_line"],
    // scroll page
    ["J", "scroll_line_down_caret"],
    ["K", "scroll_line_up_caret"],
    [",", "scroll_left_caret"],
    [".", "scroll_right_caret"],
    ["z", "scroll_to_the_cursor_position"],
    // selection
    [[["C-`"], ["C-@"]], "set_the_mark", true]
];

var nonEditableCommon = [
    [":", "list_command", true],
    // Navigation
    ["R", "reload_the_page", true],
    ["B", "back"],
    ["F", "forward"],
    // text handling
    [["C-x", "h"], "select_all", true],
    // focus
    ["f", "focus_to_the_first_textarea", true],
    ["M-p", "focus_to_the_next_button"],
    ["M-n", "focus_to_the_previous_button"]
];

SCHEME.keybindings["view"]  = SCHEME.keybindings["view"].concat(nonEditableCommon);
SCHEME.keybindings["caret"] = SCHEME.keybindings["caret"].concat(nonEditableCommon);

// }} ======================================================================= //

// Hooks {{ ================================================================= //

SCHEME.hooks.push(
    ["KeyBoardQuit",
     function (aEvent) {
         if (key.currentKeySequence.length)
             return;

         command.closeFindBar();

         let marked = command.marked(aEvent);

         if (util.isCaretEnabled())
         {
             if (marked)
             {
                 command.resetMark(aEvent);
             }
             else
             {
                 if ("blur" in aEvent.target) aEvent.target.blur();

                 gBrowser.focus();
                 _content.focus();
             }
         }
         else
         {
             goDoCommand("cmd_selectNone");
         }

         if (KeySnail.windowType === "navigator:browser" && !marked)
         {
             key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_ESCAPE, true);
         }
     }]
);

// }} ======================================================================= //
