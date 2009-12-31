var EXPORTED_SYMBOLS = ["ksBuiltin"];

var ksBuiltin = {

    categoryTab: {
        __mode__: 0,

        open_the_new_tab: [
            function (ev) {
                ev.originalTarget.dispatchEvent(key.stringToKeyEvent("C-t", true));
            }, false],

        close_tab_window: [
            function (ev) {
                ev.originalTarget.dispatchEvent(key.stringToKeyEvent("C-w", true));
            }, false],

        undo_closed_tab: [
            function (ev) {
                ev.originalTarget.dispatchEvent(key.stringToKeyEvent("C-T", true));
            }, false],

        select_next_tab: [
            function () {
                getBrowser().mTabContainer.advanceSelectedTab(1, true);
            }, false],

        select_previous_tab: [
            function () {
                getBrowser().mTabContainer.advanceSelectedTab(-1, true);
            }, false],

        move_selected_tab_right: [
            function () {
                let browser = getBrowser();
                if (browser.mCurrentTab.previousSibling) {
                    browser.moveTabTo(browser.mCurrentTab, browser.mCurrentTab._tPos - 1);
                } else {
                    browser.moveTabTo(browser.mCurrentTab, browser.mTabContainer.childNodes.length - 1);
                }
            }, false],

        move_selected_tab_left: [
            function () {
                let browser = getBrowser();
                if (browser.mCurrentTab.nextSibling) {
                    browser.moveTabTo(browser.mCurrentTab, browser.mCurrentTab._tPos + 1);
                } else {
                    browser.moveTabTo(browser.mCurrentTab, 0);
                }
            }, false],

        // original code by gomita-san
        remove_all_tabs_but: [
            function () {
                var browser = getBrowser();
                browser.removeAllTabsBut(browser.mCurrentTab);
            }, true],

        close_all_tabs_on_right: [
            function () {
                let browser = getBrowser();
                let tabs    = browser.mTabContainer.childNodes;

                for (var i = tabs.length - 1; tabs[i] != browser.selectedTab; i--)
                    browser.removeTab(tabs[i]);
        }, true],

        close_all_tabs_on_left: [
        function () {
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
            function () {
                closeWindow(true);
            }, false],

        minimize_window: [
            function () {
                window.minimize();
            }, true],

        maximize_or_restore_window: [
            function () {
                (window.windowState == window.STATE_MAXIMIZED)
                    ? window.restore() : window.maximize();
            }, true],

        fullscreen: [
            function () {
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
            function () {
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
            function () {
                ZoomManager.reduce();
            }, false],

        text_zoom_enlarge: [
            function () {
                ZoomManager.enlarge();
            }, false],

        text_zoom_reset: [
            function () {
                ZoomManager.reset();
            }, false]
    },

    categoryFocus: {
        __mode__: 0,

        focus_to_the_location_bar: [
            function () {
                command.focusToById("urlbar");
            }, true],

        focus_to_the_search_bar: [
            function () {
                command.focusToById("searchbar");
            }, true],

        focus_to_the_first_textarea: [
            function () {
                command.focusElement(command.elementsRetrieverTextarea, 0);
            }, true],

        focus_to_the_first_button: [
            function () {
                command.focusElement(command.elementsRetrieverButton, 0);
            }, true],

        focus_to_the_next_button: [
            function () {
                command.walkInputElement(command.elementsRetrieverButton, true, true);
            }, false],

        focus_to_the_previous_button: [
            function () {
                command.walkInputElement(command.elementsRetrieverButton, false, true);
            }, false],

        focus_to_the_next_text_area: [
            function () {
                command.walkInputElement(command.elementsRetrieverTextarea, true, true);
            }, false],

        focus_to_the_previous_text_area: [
            function () {
                command.walkInputElement(command.elementsRetrieverTextarea, false, true);
            }, false]
    },

    categoryNavigation: {
        __mode__: 0,

        back: [
            function () {
                BrowserBack();
            }, false],

        forward: [
            function () {
                BrowserForward();
            }, false],

        reload_the_page: [
            function () {
                BrowserReload();
            }, false],

        reload_the_page_ignore_cache: [
            function () {
                BrowserReloadSkipCache();
            }, false],

        stop_content_loading: [
            function () {
                document.getElementById("Browser:Stop").doCommand();
            }
        ],

        upper_directory: [
            function () {
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
            function () {
                // original code by silog-san
                var uri = window._content.location.href;
                if (uri == null)
                    return;
                var root = uri.match(/^[a-z]+:\/\/[^/]+\//);
                if (root)
                    loadURI(root, null, null);
            }, true]
    },

    categoryFirefox: {
        __mode__: 0,

        display_firefox_help: [
            function (ev) {
                openHelpLink("firefox-help");
            }, false],

        exit_firefox: [
            function (ev) {
                ev.originalTarget.dispatchEvent(key.stringToKeyEvent("C-q", true));
            }, false],

        restart_firefox: [
            function () {
                var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
                appStartup.quit(appStartup.eRestart | appStartup.eAttemptQuit);
                Application.restart();
            }, false]
    },

    categoryMisc: {
        __mode__: 0,

        incremental_search_forward: [
            function () {
                command.iSearchForward();
            }, true],

        incremental_search_backward: [
            function () {
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
            function (aEvent, arg) {
                command.bookMarkToolBarJumpTo(aEvent, arg);
            }, true],

        copy_selected_text: [
            function (aEvent) {
                command.copyRegion(aEvent);
            }, false],

        select_next_frame: [
            function (aEvent, aArg) {
                command.focusOtherFrame(aArg);
            }, true],

        show_current_frame_only: [
            function (aEvent) {
                window.loadURI(aEvent.target.ownerDocument.location.href);
            }, false],

        open_the_local_file: [
            function () {
                BrowserOpenFileWindow();
            }, false],

        save_current_page_to_the_file: [
            function () {
                saveDocument(window.content.document);
            }, false],

        generate_the_return_key_code: [
            function (aEvent) {
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_RETURN, true);
            }, false],

        display_javascript_console: [
            function () {
                toJavaScriptConsole();
            }, false],

        clear_javascript_console: [
            function () {
                command.clearConsole();
            }, false],

        display_page_information: [
            function () {
                BrowserPageInfo();
            }, false],

        start_lol: [
            function (aEvent) {
                hah.enterStartKey(aEvent);
            }, false]
    },

    // =========================================================================== //

    categoryView: {
        __mode__: 1,

        scroll_line_down: [
            function (aEvent) {
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_DOWN, true);
            }, false],

        scroll_line_up: [
            function (aEvent) {
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_UP, true);
            }, false],

        scroll_right: [
            function (aEvent) {
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_RIGHT, true);
            }, false],

        scroll_left: [
            function (aEvent) {
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_LEFT, true);
            }, false],

        scroll_page_up: [
            function () {
                goDoCommand("cmd_scrollPageUp");
            }, false],

        scroll_page_down: [
            function () {
                goDoCommand("cmd_scrollPageDown");
            }, false],

        scroll_to_the_top_of_the_page: [
            function () {
                goDoCommand("cmd_scrollTop");
            }, false],

        scroll_to_the_bottom_of_the_page: [
            function () {
                goDoCommand("cmd_scrollBottom");
            }, false],

        select_all: [
            function () {
                goDoCommand("cmd_selectAll");
            }, false]
    },

    // =========================================================================== //

    categoryEdit: {
        __mode__: 2,

        copy_selected_text: [
            function (aEvent) {
                command.copyRegion(aEvent);
            }, false],

        cut_current_region: [
            function (aEvent) {
                goDoCommand("cmd_copy");
                goDoCommand("cmd_delete");
                command.resetMark(aEvent);
            }, false],

        kill_the_rest_of_the_line: [
            function (aEvent) {
                command.killLine(aEvent);
            }, false],

        paste: [
            "command.yank", false],

        paste_pop: [
            "command.yankPop", false],

        show_kill_ring_and_select_text_to_paste: [
            function (aEvent) {
                if (!command.kill.ring.length)
                    return;

                let (ct = command.getClipboardText())
                    (!command.kill.ring.length || ct != command.kill.ring[0]) && command.pushKillRing(ct);

                prompt.selector(
                    {
                        message: "Paste:",
                        collection: command.kill.ring,
                        callback: function (i) { if (i >= 0) key.insertText(command.kill.ring[i]); }
                    }
                );
            }, false],

        select_whole_text: [
            function (aEvent) {
                command.selectAll(aEvent);
            }, false],

        open_line: [
            function (aEvent) {
                command.openLine(aEvent);
            }, false],

        set_the_mark: [
            function (aEvent) {
                command.setMark(aEvent);
            }, false],

        undo: [
            function () {
                display.echoStatusBar("Undo!", 2000);
                goDoCommand("cmd_undo");
            }, false],

        redo: [
            function () {
                display.echoStatusBar("Redo!", 2000);
                goDoCommand("cmd_redo");
            }, false],

        delete_text_in_the_region_rectangle: [
            function (aEvent, aArg) {
                command.replaceRectangle(aEvent.originalTarget, "", false, !aArg);
            }, true],

        replace_text_in_the_region_rectangle_with_user_inputted_string: [
            function (aEvent) {
                prompt.read("String rectangle: ", function (aStr, aInput) {
                                command.replaceRectangle(aInput, aStr);
                            },
                            aEvent.originalTarget);
            }, true],

        blank_out_the_region_rectangle_shifting_text_right: [
            function (aEvent) {
                command.openRectangle(aEvent.originalTarget);
            }, true],

        delete_the_region_rectangle_and_save_it_as_the_last_killed_one: [
            function (aEvent, aArg) {
                command.kill.buffer = command.killRectangle(aEvent.originalTarget, !aArg);
            }, true],

        yank_the_last_killed_rectangle_with_upper_left_corner_at_point: [
            function (aEvent) {
                command.yankRectangle(aEvent.originalTarget, command.kill.buffer);
            }, true],

        beginning_of_the_line: [
            function (aEvent) {
                command.beginLine(aEvent);
            }, false],

        end_of_the_line: [
            function (aEvent) {
                command.endLine(aEvent);
            }, false],

        forward_char: [
            function (aEvent) {
                command.nextChar(aEvent);
            }, false],

        backward_char: [
            function (aEvent) {
                command.previousChar(aEvent);
            }, false],

        next_word: [
            function (aEvent) {
                command.forwardWord(aEvent);
            }, false],

        previous_word: [
            function (aEvent) {
                command.backwardWord(aEvent);
            }, false],

        next_line: [
            function (aEvent) {
                command.nextLine(aEvent);
            }, false],

        previous_line: [
            function (aEvent) {
                command.previousLine(aEvent);
            }, false],

        page_down: [
            function (aEvent) {
                command.pageDown(aEvent);
            }, false],

        page_up: [
            function (aEvent) {
                command.pageUp(aEvent);
            }, false],

        beginning_of_the_text_area: [
            function (aEvent) {
                command.moveTop(aEvent);
            }, false],

        end_of_the_text_area: [
            function (aEvent) {
                command.moveBottom(aEvent);
            }, false],

        delete_forward_char: [
            function () {
                goDoCommand("cmd_deleteCharForward");
            }, false],

        delete_backward_char: [
            function () {
                goDoCommand("cmd_deleteCharBackward");
            }, false],

        delete_forward_word: [
            function () {
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
            function (aEvent) {
                command.recenter(aEvent);
            }, true]
    },

    // =========================================================================== //

    categoryCaret: {
        __mode__: 3,

        move_caret_to_the_next_line: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectLineNext") : goDoCommand("cmd_scrollLineDown");
            }, false],

        move_caret_to_the_previous_line: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectLinePrevious") : goDoCommand("cmd_scrollLineUp");
            }, false],

        move_caret_to_the_right: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectCharNext") : goDoCommand("cmd_scrollRight");
            }, false],

        move_caret_to_the_left: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectCharPrevious") : goDoCommand("cmd_scrollLeft");
            }, false],

        move_caret_up_by_page: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectPagePrevious") : goDoCommand("cmd_movePageUp");
            }, false],

        move_caret_down_by_page: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectPageNext") : goDoCommand("cmd_movePageDown");
            }, false],

        move_caret_to_the_top_of_the_page: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectTop") : goDoCommand("cmd_scrollTop");
            }, false],

        move_caret_to_the_bottom_of_the_page: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectBottom") : goDoCommand("cmd_scrollBottom");
            }, false],

        move_caret_to_the_beginning_of_the_line: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectBeginLine") : goDoCommand("cmd_beginLine");
            }, false],

        move_caret_to_the_end_of_the_line: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectEndLine") : goDoCommand("cmd_endLine");
            }, false],

        move_caret_to_the_right_by_word: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectWordNext") : goDoCommand("cmd_wordNext");
            }, false],

        move_caret_to_the_left_by_word: [
            function (aEvent) {
                aEvent.target.ksMarked ? goDoCommand("cmd_selectWordPrevious") : goDoCommand("cmd_wordPrevious");
            }, false],

        scroll_line_down_caret: [
            function () {
                util.getSelectionController().scrollLine(true);
            }, false],

        scroll_line_up_caret: [
            function () {
                util.getSelectionController().scrollLine(false);
            }, false],

        scroll_right_caret: [
            function () {
                goDoCommand("cmd_scrollRight");
                    util.getSelectionController().scrollHorizontal(false);
            }, false],

        scroll_left_caret: [
            function () {
                util.getSelectionController().scrollHorizontal(true);
                goDoCommand("cmd_scrollLeft");
            }, false],

        scroll_to_the_cursor_position: [
            function (aEvent) {
                command.recenter(aEvent);
            }, false]
    },

    categoryKeySnail: {
        __mode__: 0,

        reload_the_initialization_file: [
            function () {
                userscript.reload();
            }, false],

        list_all_keybindings: [
            function () {
                key.listKeyBindings();
            }, false],

        command_interpreter: [
            function () {
                command.interpreter();
            }, false],

        ext_select: [
            function (aEvent, aArg) {
                ext.select(aArg, aEvent);
            }, true]
    }
};
