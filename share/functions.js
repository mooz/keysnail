var EXPORTED_SYMBOLS = ["ksBuiltin"];

var ksBuiltin = {

    categoryTab: {
        __mode__: 0,

        open_the_new_tab: [
            function (ev) {
                BrowserOpenTab();
            }, false],

        close_tab_window: [
            function (ev) {
                BrowserCloseTabOrWindow();
            }, false],

        undo_closed_tab: [
            function (ev) {
                undoCloseTab();
            }, false],

        select_next_tab: [
            function (ev) {
                getBrowser().mTabContainer.advanceSelectedTab(1, true);
            }, false],

        select_previous_tab: [
            function (ev) {
                getBrowser().mTabContainer.advanceSelectedTab(-1, true);
            }, false],

        move_selected_tab_left: [
            function (ev) {
                let browser = getBrowser();
                if (browser.mCurrentTab.previousSibling) {
                    browser.moveTabTo(browser.mCurrentTab, browser.mCurrentTab._tPos - 1);
                } else {
                    browser.moveTabTo(browser.mCurrentTab, browser.mTabContainer.childNodes.length - 1);
                }
            }, false],

        move_selected_tab_right: [
            function (ev) {
                let browser = getBrowser();
                if (browser.mCurrentTab.nextSibling) {
                    browser.moveTabTo(browser.mCurrentTab, browser.mCurrentTab._tPos + 1);
                } else {
                    browser.moveTabTo(browser.mCurrentTab, 0);
                }
            }, false],

        // original code by gomita-san
        remove_all_tabs_but: [
            function (ev) {
                var browser = getBrowser();
                browser.removeAllTabsBut(browser.mCurrentTab);
            }, true],

        close_all_tabs_on_right: [
            function (ev) {
                let browser = getBrowser();
                let tabs    = browser.mTabContainer.childNodes;

                for (var i = tabs.length - 1; tabs[i] != browser.selectedTab; i--)
                    browser.removeTab(tabs[i]);
        }, true],

        close_all_tabs_on_left: [
        function (ev) {
            let browser = getBrowser();
            let tabs    = browser.mTabContainer.childNodes;

            for (var i = tabs.length - 1; tabs[i] != browser.mCurrentTab; i--);

            for (i--; i >=0 ; i--)
                browser.removeTab(tabs[i]);
        }, true]
    },

    categoryWindow: {
        __mode__: 0,

        open_new_window: [
            function (ev) {
                OpenBrowserWindow();
            }, false],

        close_the_window: [
            function (ev) {
                closeWindow(true);
            }, false],

        minimize_window: [
            function (ev) {
                window.minimize();
            }, true],

        maximize_or_restore_window: [
            function (ev) {
                (window.windowState == window.STATE_MAXIMIZED)
                    ? window.restore() : window.maximize();
            }, true],

        fullscreen: [
            function (ev) {
                BrowserFullScreen();
            }, true]
    },

    categoryAppearance: {
        __mode__: 0,

        switch_pseudo_fullscreen: [
            function (ev, arg) {
                var toolbox = document.getElementById("navigator-toolbox");
                toolbox.hidden = !toolbox.hidden;
                if (arg || !toolbox.hidden) {
                    var statusbar = document.getElementById("status-bar");
                    statusbar.hidden = toolbox.hidden;
                }
            }, true],

        hide_titlebar: [
            function (ev) {
                var mainWindow = document.getElementById("main-window");
                var control = document.getElementById("window-controls");
                if (mainWindow.getAttribute("hidechrome") == "true") {
                    mainWindow.setAttribute("hidechrome", "false");
                    control.hidden = true;
                    window.resizeBy(0, 1);
                } else {
                    mainWindow.setAttribute("hidechrome", "true");
                    control.hidden = false;
                    window.resizeBy(0, -1);
                }
            }, true],

        text_zoom_reduce: [
            function (ev) {
                FullZoom.reduce();
            }, false],

        text_zoom_enlarge: [
            function (ev) {
                FullZoom.enlarge();
            }, false],

        text_zoom_reset: [
            function (ev) {
                FullZoom.reset();
            }, false]
    },

    categoryFocus: {
        __mode__: 0,

        focus_to_content: [
            function (ev, arg) {
                let elem = document.commandDispatcher.focusedElement;
                if (elem) { elem.blur(); }
                gBrowser.focus();
                content.focus();
            }, true],

        focus_to_the_location_bar: [
            function (ev) {
                command.focusToById("urlbar");
            }, true],

        focus_to_the_search_bar: [
            function (ev) {
                command.focusToById("searchbar");
            }, true],

        focus_to_the_first_textarea: [
            function (ev) {
                command.focusElement(command.elementsRetrieverTextarea, 0);
            }, true],

        focus_to_the_first_button: [
            function (ev) {
                command.focusElement(command.elementsRetrieverButton, 0);
            }, true],

        focus_to_the_next_button: [
            function (ev) {
                command.walkInputElement(command.elementsRetrieverButton, true, true);
            }, false],

        focus_to_the_previous_button: [
            function (ev) {
                command.walkInputElement(command.elementsRetrieverButton, false, true);
            }, false],

        focus_to_the_next_text_area: [
            function (ev) {
                command.walkInputElement(command.elementsRetrieverTextarea, true, true);
            }, false],

        focus_to_the_previous_text_area: [
            function (ev) {
                command.walkInputElement(command.elementsRetrieverTextarea, false, true);
            }, false]
    },

    categoryNavigation: {
        __mode__: 0,

        back: [
            function (ev) {
                BrowserBack();
            }, false],

        forward: [
            function (ev) {
                BrowserForward();
            }, false],

        reload_the_page: [
            function (ev) {
                BrowserReload();
            }, false],

        reload_the_page_ignore_cache: [
            function (ev) {
                BrowserReloadSkipCache();
            }, false],

        stop_content_loading: [
            function (ev) {
                document.getElementById("Browser:Stop").doCommand();
            }
        ],

        upper_directory: [
            function (ev) {
                // original code by gomita-san
                var uri = getBrowser().currentURI;
                if (uri.path == "/")
                    return;
                var pathList = uri.path.split("/");
                if (!pathList.pop())
                    pathList.pop();
                loadURI(uri.prePath + pathList.join("/") + "/");
            }, false],

        goto_root: [
            function (ev) {
                // original code by silog-san
                var uri = window._content.location.href;
                if (uri == null)
                    return;
                var root = uri.match(/^[a-z]+:\/\/[^/]+\//);
                if (root)
                    loadURI(root, null, null);
            }, true]
    },

    categoryCopyPaste: {
        __mode__: 0,

        copy_document_title: [
            function (ev, arg) {
                command.setClipboardText(content.document.title);
            }, false
        ],

        copy_document_title_to_selection_clipboard: [
            function (ev, arg) {
                command.setClipboardText(content.document.title, true);
            }, false
        ],

        copy_document_url: [
            function (ev, arg) {
                command.setClipboardText(content.location.href);
            }, false
        ],

        copy_document_url_to_selection_clipboard: [
            function (ev, arg) {
                command.setClipboardText(content.location.href, true);
            }, false
        ],

        open_url_from_clipboard: [
            function (ev, arg) {
                let url = command.getClipboardText();
                if (url.indexOf("://") === -1) {
                    url = util.format("http://www.google.com/search?q=%s&ie=utf-8&oe=utf-8", encodeURIComponent(url));
                }
                gBrowser.loadOneTab(url, null, null, null, false);
            }, false
        ],

        open_url_from_selection_clipboard: [
            function (ev, arg) {
                let url = command.getClipboardText(true);
                if (url.indexOf("://") === -1) {
                    url = util.format("http://www.google.com/search?q=%s&ie=utf-8&oe=utf-8", encodeURIComponent(url));
                }
                gBrowser.loadOneTab(url, null, null, null, false);
            }, false
        ]

    },

    categoryFirefox: {
        __mode__: 0,

        display_firefox_help: [
            function (ev) {
                openHelpLink("firefox-help");
            }, false],

        exit_firefox: [
            function (ev) {
                goQuitApplication();
            }, false],

        restart_firefox: [
            function (ev) {
                command.restartApp();
            }, false]
    },

    categoryMisc: {
        __mode__: 0,

        incremental_search_forward: [
            function (ev) {
                command.iSearchForward();
            }, true],

        incremental_search_backward: [
            function (ev) {
                command.iSearchBackward();
            }, true],

        incremental_search_forward_emacs: [
            function (ev) {
                command.iSearchForwardKs(ev);
            }, true],

        incremental_search_backward_emacs: [
            function (ev) {
                command.iSearchBackwardKs(ev);
            }, true],

        open_the_bookmark_toolbar_item: [
            function (ev, arg) {
                command.bookMarkToolBarJumpTo(ev, arg);
            }, true],

        copy_selected_text: [
            function (ev) {
                command.copyRegion(ev);
            }, false],

        select_next_frame: [
            function (ev, arg) {
                command.focusOtherFrame(arg);
            }, true],

        show_current_frame_only: [
            function (ev) {
                window.loadURI(ev.target.ownerDocument.location.href);
            }, false],

        open_the_local_file: [
            function (ev) {
                BrowserOpenFileWindow();
            }, false],

        save_current_page_to_the_file: [
            function (ev) {
                saveDocument(window.content.document);
            }, false],

        generate_the_return_key_code: [
            function (ev) {
                key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_RETURN, true);
            }, false],

        display_javascript_console: [
            function (ev) {
                toJavaScriptConsole();
            }, false],

        clear_javascript_console: [
            function (ev) {
                command.clearConsole();
            }, false],

        display_page_information: [
            function (ev) {
                BrowserPageInfo();
            }, false],

        start_lol: [
            function (ev) {
                hah.enterStartKey(ev);
            }, false]
    },

    // =========================================================================== //

    categoryView: {
        __mode__: 1,

        scroll_line_down: [
            function (ev) {
                key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_DOWN, true);
            }, false],

        scroll_line_up: [
            function (ev) {
                key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_UP, true);
            }, false],

        scroll_right: [
            function (ev) {
                key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_RIGHT, true);
            }, false],

        scroll_left: [
            function (ev) {
                key.generateKey(ev.originalTarget, KeyEvent.DOM_VK_LEFT, true);
            }, false],

        scroll_page_up: [
            function (ev) {
                goDoCommand("cmd_scrollPageUp");
            }, false],

        scroll_page_down: [
            function (ev) {
                goDoCommand("cmd_scrollPageDown");
            }, false],

        scroll_to_the_top_of_the_page: [
            function (ev) {
                goDoCommand("cmd_scrollTop");
            }, false],

        scroll_to_the_bottom_of_the_page: [
            function (ev) {
                goDoCommand("cmd_scrollBottom");
            }, false],

        select_all: [
            function (ev) {
                goDoCommand("cmd_selectAll");
            }, false]
    },

    // =========================================================================== //

    categoryEdit: {
        __mode__: 2,

        copy_selected_text: [
            function (ev) {
                command.copyRegion(ev);
            }, false],

        cut_current_region: [
            function (ev) {
                goDoCommand("cmd_copy");
                goDoCommand("cmd_delete");
                command.resetMark(ev);
            }, false],

        kill_the_rest_of_the_line: [
            function (ev) {
                command.killLine(ev);
            }, false],

        paste: [
            "command.yank", false],

        paste_pop: [
            "command.yankPop", false],

        show_kill_ring_and_select_text_to_paste: [
            function (ev) {
                if (!command.kill.ring.length)
                    return;

                let ct = command.getClipboardText();
                if (!command.kill.ring.length || ct != command.kill.ring[0]) {
                    command.pushKillRing(ct);
                }

                prompt.selector(
                    {
                        message: "Paste:",
                        collection: command.kill.ring,
                        callback: function (i) { if (i >= 0) key.insertText(command.kill.ring[i]); }
                    }
                );
            }, false],

        select_whole_text: [
            function (ev) {
                command.selectAll(ev);
            }, false],

        open_line: [
            function (ev) {
                command.openLine(ev);
            }, false],

        set_the_mark: [
            function (ev) {
                command.setMark(ev);
            }, false],

        undo: [
            function (ev) {
                display.echoStatusBar("Undo!", 2000);
                goDoCommand("cmd_undo");
            }, false],

        redo: [
            function (ev) {
                display.echoStatusBar("Redo!", 2000);
                goDoCommand("cmd_redo");
            }, false],

        delete_text_in_the_region_rectangle: [
            function (ev, arg) {
                command.replaceRectangle(ev.originalTarget, "", false, !arg);
            }, true],

        replace_text_in_the_region_rectangle_with_user_inputted_string: [
            function (ev) {
                prompt.read("String rectangle: ", function (aStr, aInput) {
                                command.replaceRectangle(aInput, aStr);
                            },
                            ev.originalTarget);
            }, true],

        blank_out_the_region_rectangle_shifting_text_right: [
            function (ev) {
                command.openRectangle(ev.originalTarget);
            }, true],

        delete_the_region_rectangle_and_save_it_as_the_last_killed_one: [
            function (ev, arg) {
                command.kill.buffer = command.killRectangle(ev.originalTarget, !arg);
            }, true],

        yank_the_last_killed_rectangle_with_upper_left_corner_at_point: [
            function (ev) {
                command.yankRectangle(ev.originalTarget, command.kill.buffer);
            }, true],

        beginning_of_the_line: [
            function (ev) {
                command.beginLine(ev);
            }, false],

        end_of_the_line: [
            function (ev) {
                command.endLine(ev);
            }, false],

        forward_char: [
            function (ev) {
                command.nextChar(ev);
            }, false],

        backward_char: [
            function (ev) {
                command.previousChar(ev);
            }, false],

        next_word: [
            function (ev) {
                command.forwardWord(ev);
            }, false],

        previous_word: [
            function (ev) {
                command.backwardWord(ev);
            }, false],

        next_line: [
            function (ev) {
                command.nextLine(ev);
            }, false],

        previous_line: [
            function (ev) {
                command.previousLine(ev);
            }, false],

        page_down: [
            function (ev) {
                command.pageDown(ev);
            }, false],

        page_up: [
            function (ev) {
                command.pageUp(ev);
            }, false],

        beginning_of_the_text_area: [
            function (ev) {
                command.moveTop(ev);
            }, false],

        end_of_the_text_area: [
            function (ev) {
                command.moveBottom(ev);
            }, false],

        delete_forward_char: [
            function (ev) {
                goDoCommand("cmd_deleteCharForward");
            }, false],

        delete_backward_char: [
            function (ev) {
                goDoCommand("cmd_deleteCharBackward");
            }, false],

        delete_forward_word: [
            function (ev) {
                command.deleteForwardWord(ev);
            }, false],

        delete_backward_word: [
            function (ev) {
                command.deleteBackwardWord(ev);
            }, false],

        convert_following_word_to_upper_case: [
            function (ev, arg) {
                command.wordCommand(ev, arg, command.upcaseForwardWord, command.upcaseBackwardWord);
            }, true],

        convert_following_word_to_lower_case: [
            function (ev, arg) {
                command.wordCommand(ev, arg, command.downcaseForwardWord, command.downcaseBackwardWord);
            }, true],

        capitalize_the_following_word: [
            function (ev, arg) {
                command.wordCommand(ev, arg, command.capitalizeForwardWord, command.capitalizeBackwardWord);
            }, true],

        recenter: [
            function (ev) {
                command.recenter(ev);
            }, true]
    },

    // =========================================================================== //

    categoryCaret: {
        __mode__: 3,

        move_caret_to_the_next_line: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectLineNext") : goDoCommand("cmd_scrollLineDown");
            }, false],

        move_caret_to_the_previous_line: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectLinePrevious") : goDoCommand("cmd_scrollLineUp");
            }, false],

        move_caret_to_the_right: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectCharNext") : goDoCommand("cmd_scrollRight");
            }, false],

        move_caret_to_the_left: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectCharPrevious") : goDoCommand("cmd_scrollLeft");
            }, false],

        move_caret_up_by_page: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectPagePrevious") : goDoCommand("cmd_movePageUp");
            }, false],

        move_caret_down_by_page: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectPageNext") : goDoCommand("cmd_movePageDown");
            }, false],

        move_caret_to_the_top_of_the_page: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectTop") : goDoCommand("cmd_scrollTop");
            }, false],

        move_caret_to_the_bottom_of_the_page: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectBottom") : goDoCommand("cmd_scrollBottom");
            }, false],

        move_caret_to_the_beginning_of_the_line: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectBeginLine") : goDoCommand("cmd_beginLine");
            }, false],

        move_caret_to_the_end_of_the_line: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectEndLine") : goDoCommand("cmd_endLine");
            }, false],

        move_caret_to_the_right_by_word: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectWordNext") : goDoCommand("cmd_wordNext");
            }, false],

        move_caret_to_the_left_by_word: [
            function (ev) {
                ev.target.ksMarked ? goDoCommand("cmd_selectWordPrevious") : goDoCommand("cmd_wordPrevious");
            }, false],

        scroll_line_down_caret: [
            function (ev) {
                util.getSelectionController().scrollLine(true);
            }, false],

        scroll_line_up_caret: [
            function (ev) {
                util.getSelectionController().scrollLine(false);
            }, false],

        scroll_right_caret: [
            function (ev) {
                goDoCommand("cmd_scrollRight");
                    util.getSelectionController().scrollHorizontal(false);
            }, false],

        scroll_left_caret: [
            function (ev) {
                util.getSelectionController().scrollHorizontal(true);
                goDoCommand("cmd_scrollLeft");
            }, false],

        scroll_to_the_cursor_position: [
            function (ev) {
                command.recenter(ev);
            }, false]
    },

    categoryKeySnail: {
        __mode__: 0,

        reload_the_initialization_file: [
            function (ev) {
                userscript.reload();
            }, false],

        list_all_keybindings: [
            function (ev) {
                key.listKeyBindings();
            }, false],

        command_interpreter: [
            function (ev) {
                command.interpreter();
            }, false],

        ext_select: [
            function (ev, arg) {
                ext.select(arg, ev);
            }, true],

        list_command: [
            function (ev, arg) {
                shell.input(null, arg);
            }, true],

        focus_to_prompt: [
            function (ev, arg) {
                return !document.getElementById("keysnail-prompt").hidden
                    && document.getElementById("keysnail-prompt-textbox").focus();
            }, true],

        open_plugin_manager: [
            function (ev, arg) {
                KeySnail.modules.userscript.openPluginManager();
            }, true],

        open_preference: [
            function (ev, arg) {
                KeySnail.openPreference();
            }, true
        ]
    }
};
