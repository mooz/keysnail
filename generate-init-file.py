#!/usr/bin/python
# -*- coding: utf-8 -*-

## DO *NOT* run the indent command in emacs, vim, etc!!!

import sys

argv = sys.argv
argc = len(argv)

ja = "ja"
en = "en"

if (argc != 2):
    print 'Usage: %s locale' % argv[0]
    print '    ja => japanese'
    print '    en => english'
    quit()

# set locale
l = {"ja": ja,
     "en": en}.get(argv[1]) or en

print """// ==================== KeySnail configuration file ==================== //

// -------------------- """ + {ja: "キーシーケンスへの関数割り当て方法",
                               en: "How to bind function to the key sequence"}[l] + """ -------------------- //
//
// """ + {ja: "以下に示す関数群を使って, キーシーケンスを関数へと割り当てることができる.",
          en: "You can bind the function to the key sequence, using the functions listed below."}[l] + """
//
// key.setGlobalKey(keys, func, ksDescription, ksNoRepeat);
// key.setEditKey(keys, func, ksDescription, ksNoRepeat);
// key.setViewKey(keys, func, ksDescription, ksNoRepeat);
// key.setCaretKey(keys, func, ksDescription, ksNoRepeat);
//
// """ + {ja: "各引数の説明は次の通り.",
          en: "Here are the descriptions of the each argument."}[l] + """
//
// keys          => """ + {ja: """キー (文字列) か キーシーケンス (文字列の配列) を指定する.
//                  一つの関数を複数のキーシーケンスへ割り当てたい場合は「文字列の配列の配列」を指定する.
//                  キーの表記は Emacs のそれを踏襲""",
                           en: """key (string) or key sequence (array)
//                  if you want to bind a function to mutliple key sequence use 'array of array'
//                  expression of the key follows the Emacs"""}[l] + """
//                  ex1) Ctrl + Alt + t : C-M-t
//                  ex2) Arrow Key      : <up>, <down>, <left>, <right>
//                  ex3) PgUp, PgDn     : <prior>, <next>
//                  ex4) F1, F2, F3     : <f1>, <f2>, <f3>
//
""" + {ja: """// func          => 無名関数を指定する. この関数は二つの引数を取ることが出来る
//                     * 第一引数 => キーイベント
//                     * 第二引数 => 前置引数 (無ければ null)
//                  のようになっている.
//                  必要な場合は function (aEvent, aArg) のようにして
//                  これら二つの引数を関数中から使うことが出来る.
""",
       en: """// func          => anonymous function.
//                  this function can take two arguments.
//                     * argument 1 => key event
//                     * argument 2 => prefix argument (or null)
//                  you can use these arguments through declaring the
//                  following expression.
//                        function (aEvent, aArg)
"""}[l] + """// ksDescription => """ + {ja: "関数の説明. 省略可能.",
                           en: """Description of the function.
//                  you can omit this argument."""}[l] + """
//
// ksNoRepeat    => """ + {ja: """func 内で独自に前置引数を扱いたい場合など,
//                  勝手にコマンドが繰り返されるのを防ぐ為に使用する.
//                  この値が true でなければコマンドが前置引数の数だけ繰り返される
//                  省略可能.""",
                           en: """when false, command (function) is executed
//                  prefix arguments times.
//                  if you want to use prefix argument in your
//                  function, and do not want to repeat it, set
//                  this value to true.
//                  you can omit this argument."""}[l] + """
//
// """ + {ja: "これらの関数は次に示す関数をラップしているだけ.",
          en: "Actually, these functions just wrap the function below."}[l] + """
//
// key.defineKey(keyMapName, keys, func, ksDescription, ksNoRepeat);
//
// keyMapName    => key.modes.GLOBAL, key.modes.VIEW, key.modes.EDIT, key.modes.CARET
//
// ==================== """ + {ja: "フックの説明",
                               en: "About hook"}[l] + """ ====================
""" + {ja: """// プログラムの各所には「フック」というものが設けられており, ユーザはここに任意の
// 関数を割り当てることが可能.
// 例えば key.quitKey が入力された時には KeyBoardQuit というフックに登録された
// 関数が呼ばれる.
// ユーザはここに「検索のキャンセル」, 「選択の解除」などの関数を登録することができる""",
       en: """// User can set the function to the hook.
// For example, when KeySnail the key press event of the key.quitKey,
// functions set to KeyBoardQuit are called.
// You can bind "Cancell isearch", "Deselect the text", and so forth."""}[l] + """

// ==================== load modules (example) ==================== //
// """ + {ja: "初期化ファイルを複数のファイルに分割し, 読み込むことが出来る.",
          en: "You can split the init file into mutliple files."}[l] + """
// userscript.addLoadPath("~/.keysnail.d");
// userscript.require("module1.js");
// userscript.require("module2.js");

// ==================== special keys ==================== //
""" + {ja: """// key.quitKey : キーシーケンス入力のキャンセルに用いられる.
//               KeyBoardQuit フックを呼ぶので, 検索バーを閉じる等の動作をそこに登録しておくことも出来る.

// key.helpKey : インタラクティヴヘルプの表示, 汎用のヘルプキーとして働く.
//               例えば C-c C-c <helpKey> と入力すると, C-c C-c から始まるキーバインド一覧が表示される.
//               またこの初期化ファイルの設定では <helpKey> b とすればキーバインド一覧が表示されるようになっている.""",
       en: """// key.quitKey : Cancel the current input.
//               This key event calls the KeyBoardQuit hook.
//               You can set the command like "close the find bar" to it.

// key.helpKey : Display the interactive help. General help key.
//               When you input C-c C-c <helpKey>, keybindings begin with C-c C-c are displayed.
//               And in this script settings, <helpKey> b lists the all keybindings."""}[l] + """
####REPLACE_WITH_SPECIAL_KEYS####
// key macro interval
// macro.setSleepTime(100);

// ----------------------------------------
// """ + {ja: "コントロールキー / メタキーとして解釈させたいキーを変更したい場合は\n// 次に示す二つの関数を変更する.",
          en: "If you want to change the Ctrl key and Meta key, uncomment two functions below and modify them."}[l] + """

/**
 * check if the key event is ctrl key (predicative)
 * @param {KeyboardEvent} aEvent
 * @return true when {aEvent} is control key
 */
// key.isControlKey = function (aEvent) {
//     return aEvent.ctrlKey || aEvent.commandKey;
// }

/**
 * check if the key event is meta key (predicative)
 * @param {KeyboardEvent} aEvent
 * @return true when <aEvent> is meta key
 */
// isMetaKey = function (aEvent) {
//     return aEvent.altKey;
// }

// ==================== original prefix ==================== //
// """ + {ja: "エディットモードで C-z を入力すると, ビューモードのキーバインドが使える",
          en: """You can use view-mode keybindings in edit-mode by adding
// the prefix key C-z."""}[l] + """
// key.keyMapHolder[key.modes.EDIT]["C-z"] = key.keyMapHolder[key.modes.VIEW];

// ==================== set about:config value ==================== //
// util.setPrefs(
//     {
//         "ui.key.generalAccessKey": 0, // kill access key (for Mac User)
//         "ui.caretWidth": 5,           // Make caret bolder
//         "ui.caretBlinkTime": 0,       // Stop caret blink
//         "accessibility.typeaheadfind": true, // Enable "Find As You Type"
//         "accessibility.typeaheadfind.linksonly": true // Only for links
//     }
// );

// ==================== set hooks ==================== //
hook.setHook("KeyBoardQuit",
            function (aEvent) {
                // """ + {ja: "検索バーが開いていたら閉じる",
                          en: "Close the find bar if opened"}[l] + """
                command.closeFindBar();
                if (util.isCaretEnabled()) {
                    // """ + {ja: "編集エリア / キャレットブラウジングモードならマークをリセット",
                              en: "in edit area or caret browsing mode, reset the mark"}[l] + """
                    command.resetMark(aEvent);
                } else {
                    // """ + {ja: "ビューモードなら選択を解除",
                              en: "in view mode, deselect all"}[l] + """
                    goDoCommand('cmd_selectNone');
                }
                // """ + {ja: "汎用的なキャンセルイベントを生成",
                          en: "generate general cancell event"}[l] + """
                key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_ESCAPE, true);
            });

// If user transit the page to "http://www.foo.com/bar/"
// from "http://www.hoge.com/huga/", aNsURI's property becomes ...
//
// aNsURI.spec      => "http://www.foo.com/bar/"
// aNsURI.scheme    => "http"
// aNsURI.host      => "www.foo.com"
// aNsURI.path      => "/bar/"
// aNsURI.prePath   => "http://www.hoge.com/huga/"

// hook.setHook("LocationChange",
//              function (aNsURI) {
//                  var URL = aNsURI ? aNsURI.spec : null;

//                  key.checkBlackList(URL);
//              });

// key.blackList = [
//     "http://mail\\.google\\.com/.*"
// ];

// ==================== set global keys ==================== //

key.setGlobalKey("C-M-r",
                 function () { userscript.reload(); },
                 """ + {ja: '"設定ファイルを再読み込み"',
                        en: '"Reload the initialization file"'}[l] + """);

// -------------------- help command -------------------- //

key.setGlobalKey([key.helpKey, "b"], function () {
                     key.listKeyBindings();
                 }, """ + {ja: '"キーバインド一覧を表示"',
                           en: '"List all keybindings"'}[l] + """);

key.setGlobalKey([key.helpKey, "F"], function () {
                     openHelpLink('firefox-help');
                 }, """ + {ja: '"Firefox のヘルプを表示"',
                           en: '"Display Firefox help"'}[l] + """);

// -------------------- misc -------------------- //

key.setGlobalKey("C-t", function () {
                     document.getElementById("cmd_newNavigatorTab").doCommand();
                 }, """ + {ja: '"タブを開く"',
                           en: '"Open the new tab"'}[l] + """);

key.setGlobalKey(["C-x", "j"], function (aEvent) {
                     hah.enterStartKey(aEvent);
                 }, """ + {ja: '"LoL を開始"',
                           en: '"Start LoL"'}[l] + """);

key.setGlobalKey("C-m", function (aEvent) {
                     key.generateKey(aEvent.originalTarget,
                                     KeyEvent.DOM_VK_RETURN, true);
                 },
                 """ + {ja: '"リターンコードを生成"',
                        en: '"Generate the return key code"'}[l] + """);

key.setGlobalKey("C-j",
                 function (aEvent, arg) {
                     command.bookMarkToolBarJumpTo(aEvent, arg);
                 },
                 """ + {ja: '"ブックマークツールバーのアイテムを開く"',
                        en: '"Open the bookmark toolbar item"'}[l] + """, true);

// -------------------- useful focus -------------------- //

key.setGlobalKey(["C-x", "l"],
                 function () {
                     command.focusToById('urlbar');
                 },
                 """ + {ja: '"ロケーションバーへフォーカス"',
                        en: '"Focus to the location bar"'}[l] + """, true);

key.setGlobalKey(["C-x", "g"],
                 function () {
                     command.focusToById('searchbar');
                 },
                 """ + {ja: '"検索バーへフォーカス"',
                        en: '"Focus to the search bar"'}[l] + """, true);

key.setGlobalKey(["C-x", "t"],
                 function () {
                     command.focusElement(command.elementsRetrieverTextarea, 0);
                 },
                 """ + {ja: '"最初のインプットエリアへフォーカス"',
                        en: '"Focus to the first textarea"'}[l] + """, true);

key.setGlobalKey(["C-x", "s"],
                 function () {
                     command.focusElement(command.elementsRetrieverButton, 0);
                 },
                 """ + {ja: '"最初のボタンへフォーカス"',
                        en: '"Focus to the first button"'}[l] + """, true);

// -------------------- copy -------------------- //

key.setGlobalKey("M-w",
                 function (aEvent) {
                     command.copyRegion(aEvent);
                 },
                 """ + {ja: '"選択中のテキストをコピー"',
                        en: '"Copy selected text"'}[l] + """);

// -------------------- search -------------------- //

key.setGlobalKey("C-s", function () {
                     command.iSearchForward();
                 },
                 """ + {ja: '"インクリメンタル検索"',
                        en: '"Incremental search forward"'}[l] + """);

key.setGlobalKey("C-r", function () {
                     command.iSearchBackward();
                 },
                 """ + {ja: '"逆方向インクリメンタル検索"',
                        en: '"Incremental search backward"'}[l] + """);

// -------------------- window --------------------
key.setGlobalKey(["C-x", "k"],
                 function () { BrowserCloseTabOrWindow(); },
                 """ + {ja: '"タブ / ウィンドウを閉じる"',
                        en: '"Close tab / window"'}[l] + """);

key.setGlobalKey(["C-x", "K"],
                 function () { closeWindow(true); },
                 """ + {ja: '"ウィンドウを閉じる"',
                        en: '"Close the window"'}[l] + """);

key.setGlobalKey(["C-x", "n"],
                 function () { OpenBrowserWindow(); },
                 """ + {ja: '"ウィンドウを開く"',
                        en: '"Open new window"'}[l] + """);

key.setGlobalKey(["C-x", "C-c"],
                 function () { goQuitApplication(); },
                 """ + {ja: '"Firefox を終了"',
                        en: '"Exit Firefox"'}[l] + """);
key.setGlobalKey(["C-x", "o"],
                 function (aEvent, aArg) {
                     rc.focusOtherFrame(aArg);
                 },
                 """ + {ja: '"次のフレームを選択"',
                        en: '"Select next frame"'}[l] + """, true);

// -------------------- tab --------------------
key.setGlobalKey(["C-c", "C-t", "l"],
                 function () { gBrowser.mTabContainer.advanceSelectedTab(1, true); },
                 """ + {ja: '"ひとつ右のタブへ"',
                        en: '"Select next tab"'}[l] + """);
key.setGlobalKey(["C-c", "C-t", "h"],
                 function () { gBrowser.mTabContainer.advanceSelectedTab(-1, true); },
                 """ + {ja: '"ひとつ左のタブへ"',
                        en: '"Select previous tab"'}[l] + """);
key.setGlobalKey(["C-c", "C-t", "u"],
                 function () { undoCloseTab(); },
                 """ + {ja: '"閉じたタブを元に戻す"',
                        en: '"Undo closed tab"'}[l] + """);

// -------------------- console --------------------
key.setGlobalKey(["C-c", "C-c", "C-v"],
                 function () { toJavaScriptConsole(); },
                 """ + {ja: '"Javascript コンソールを表示"',
                        en: '"Display JavaScript console"'}[l] + """);
key.setGlobalKey(["C-c", "C-c", "C-c"],
                 function () {
                     command.clearConsole();
                 },
                 """ + {ja: '"Javascript コンソールの表示をクリア"',
                        en: '"Clear Javascript console"'}[l] + """);

key.setGlobalKey(["C-c", "i"],
                 function () { BrowserPageInfo(); },
                 """ + {ja: '"ページ情報表示"',
                        en: '"Display page information"'}[l] + """);

// -------------------- file --------------------
key.setGlobalKey(["C-x", "C-w"],
                 function () { saveDocument(window.content.document); },
                 """ + {ja: '"ファイルを保存"',
                        en: '"Save current page to the file"'}[l] + """);
key.setGlobalKey(["C-x", "C-f"],
                 function () { BrowserOpenFileWindow(); },
                 """ + {ja: '"ファイルを開く"',
                        en: '"Open the local file"'}[l] + """);

// -------------------- frame -------------------- //
key.setGlobalKey(["C-x", "1"],
                 function (aEvent) { window.loadURI(aEvent.target.ownerDocument.location.href); },
                 """ + {ja: '"現在のフレームだけを表示"',
                        en: '"Show current frame only"'}[l] + """);

// ==================== set view mode keys ==================== //

// -------------------- scroll --------------------

key.setViewKey("C-n", function (aEvent) {
                   key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_DOWN, true);
               },
               """ + {ja: '"一行スクロールダウン"',
                      en: '"Scroll line down"'}[l] + """);
key.setViewKey("C-p", function (aEvent) {
                   key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_UP, true);
               },
               """ + {ja: '"一行スクロールアップ"',
                      en: '"Scroll line up"'}[l] + """);
key.setViewKey("C-f", function (aEvent) {
                   key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_RIGHT, true);
               },
               """ + {ja: '"右へスクロール"',
                      en: '"Scroll right"'}[l] + """);
key.setViewKey("C-b", function (aEvent) {
                   key.generateKey(aEvent.originalTarget, KeyEvent.DOM_VK_LEFT, true);
               },
               """ + {ja: '"左へスクロール"',
                      en: '"Scroll left"'}[l] + """);

key.setViewKey("j", function () { goDoCommand('cmd_scrollLineDown'); },
               """ + {ja: '"一行スクロールダウン"',
                      en: '"Scroll line down"'}[l] + """);
key.setViewKey("k", function () { goDoCommand('cmd_scrollLineUp'); },
               """ + {ja: '"一行スクロールアップ"',
                      en: '"Scroll line up"'}[l] + """);

key.setViewKey([[">"],
                ["."]],
               function () { goDoCommand('cmd_scrollRight'); },
               """ + {ja: '"右へスクロール"',
                      en: '"Scroll right"'}[l] + """);
key.setViewKey([["<"],
                [","]], function () { goDoCommand('cmd_scrollLeft'); },
               """ + {ja: '"左へスクロール"',
                      en: '"Scroll left"'}[l] + """);

key.setViewKey([["b"],
                ["M-v"]],
               function () { goDoCommand('cmd_scrollPageUp'); },
               """ + {ja: '"一画面分スクロールアップ"',
                      en: '"Scroll page up"'}[l] + """);
key.setViewKey("C-v",
               function () { goDoCommand('cmd_scrollPageDown'); },
               """ + {ja: '"一画面スクロールダウン"',
                      en: '"Scroll page down"'}[l] + """);

key.setViewKey([["g"],
                ["M-<"]],
               function () { goDoCommand('cmd_scrollTop'); },
               """ + {ja: '"ページ先頭へ移動"',
                      en: '"Scroll to the top of the page"'}[l] + """);
key.setViewKey([["G"],
                ["M->"]],
               function () { goDoCommand('cmd_scrollBottom'); },
               """ + {ja: '"ページ末尾へ移動"',
                      en: '"Scroll to the bottom of the page"'}[l] + """);

// -------------------- navigation --------------------
key.setViewKey("R", function (aEvent) { BrowserReload(); },
               """ + {ja: '"更新"',
                      en: '"Reload the page"'}[l] + """);
key.setViewKey("B", function (aEvent) { BrowserBack(); },
               """ + {ja: '"戻る"',
                      en: '"Back"'}[l] + """);
key.setViewKey("F", function (aEvent) { BrowserForward(); },
               """ + {ja: '"進む"',
                      en: '"Forward"'}[l] + """);

// -------------------- tab --------------------
key.setViewKey("l", function () { gBrowser.mTabContainer.advanceSelectedTab(1, true); },
               """ + {ja: '"ひとつ右のタブへ"',
                      en: '"Select the next tab"'}[l] + """);
key.setViewKey("h", function () { gBrowser.mTabContainer.advanceSelectedTab(-1, true); },
               """ + {ja: '"ひとつ左のタブへ"',
                      en: '"Select the previous tab"'}[l] + """);

// -------------------- text --------------------
key.setViewKey(["C-x", "h"],
               function () { goDoCommand('cmd_selectAll'); },
               """ + {ja: '"すべて選択"',
                      en: '"Select all"'}[l] + """);

// -------------------- walk through --------------------

key.setViewKey("M-n", function () {
                   command.walkInputElement(command.elementsRetrieverButton, true, true);
               }, """ + {ja: '"次のボタンへフォーカスを当てる"',
                         en: '"Focus to the next button"'}[l] + """);

key.setViewKey("M-p", function () {
                   command.walkInputElement(command.elementsRetrieverButton, false, true);
               }, """ + {ja: '"前のボタンへフォーカスを当てる"',
                         en: '"Focus to the previous button"'}[l] + """);

key.setViewKey("f", function () {
                   command.focusElement(command.elementsRetrieverTextarea, 0);
               },
               """ + {ja: '"最初のインプットエリアへフォーカス"',
                      en: '"Focus to the first textarea"'}[l] + """, true);

// ==================== set edit mode key ==================== //

key.setEditKey([["C-SPC"],
                ["C-@"]],
               function (aEvent) { command.setMark(aEvent); },
               """ + {ja: '"マークをセット"',
                      en: '"Set the mark"'}[l] + """);

key.setEditKey("C-o",
               function (aEvent) { command.openLine(aEvent); },
               """ + {ja: '"行を開く (open line)"',
                      en: '"Open line"'}[l] + """);

// -------------------- undo --------------------

key.setEditKey([["C-x", "u"],
                ["C-_"]],
               function () {
                   display.echoStatusBar("Undo!", 2000);
                   goDoCommand('cmd_undo');
               },
               """ + {ja: '"アンドゥ"',
                      en: '"Undo"'}[l] + """);
key.setEditKey(["C-\\\\"],
               function () {
                   display.echoStatusBar("Redo!", 2000);
                   goDoCommand('cmd_redo');
               },
               """ + {ja: '"リドゥ"',
                      en: '"Redo"'}[l] + """);

// -------------------- cursor navigation --------------------

// -------------------- intra-line --------------------

key.setEditKey("C-a",
               function (aEvent) { command.beginLine(aEvent); },
               """ + {ja: '"行頭へ移動"',
                      en: '"Beginning of the line"'}[l] + """);
key.setEditKey("C-e",
               function (aEvent) { command.endLine(aEvent); },
               """ + {ja: '"行末へ"',
                      en: '"End of the line"'}[l] + """);

key.setEditKey("C-f",
               function (aEvent) { command.nextChar(aEvent); },
               """ + {ja: '"一文字右へ移動"',
                      en: '"Forward char"'}[l] + """);
key.setEditKey("C-b",
               function (aEvent) { command.previousChar(aEvent); },
               """ + {ja: '"一文字左へ移動"',
                      en: '"Backward char"'}[l] + """);

key.setEditKey("M-f",
               function (aEvent) { command.nextWord(aEvent); },
               """ + {ja: '"一単語右へ移動"',
                      en: '"Next word"'}[l] + """);
key.setEditKey("M-b",
               function (aEvent) { command.previousWord(aEvent); },
               """ + {ja: '"一単語左へ移動"',
                      en: '"Previous word"'}[l] + """);

// -------------------- by line --------------------

key.setEditKey("C-n",
               function (aEvent) { command.nextLine(aEvent); },
               """ + {ja: '"一行下へ"',
                      en: '"Next line"'}[l] + """);
key.setEditKey("C-p",
               function (aEvent) { command.previousLine(aEvent); },
               """ + {ja: '"一行上へ"',
                      en: '"Previous line"'}[l] + """);

// -------------------- by page --------------------

key.setEditKey("C-v",
               function (aEvent) { command.pageDown(aEvent); },
               """ + {ja: '"一画面分下へ"',
                      en: '"Page down"'}[l] + """);
key.setEditKey("M-v",
               function (aEvent) { command.pageUp(aEvent); },
               """ + {ja: '"一画面分上へ"',
                      en: '"Page up"'}[l] + """);

// -------------------- absolute --------------------

key.setEditKey("M-<",
               function (aEvent) { command.moveTop(aEvent); },
               """ + {ja: '"テキストエリア先頭へ"',
                      en: '"Beginning of the text area"'}[l] + """);
key.setEditKey("M->",
               function (aEvent) { command.moveBottom(aEvent); },
               """ + {ja: '"テキストエリア末尾へ"',
                      en: '"End of the text area"'}[l] + """);

// -------------------- deletion --------------------

key.setEditKey("C-d",
               function () {
                   goDoCommand("cmd_deleteCharForward");
               },
               """ + {ja: '"次の一文字削除"',
                      en: '"Delete forward char"'}[l] + """);
key.setEditKey("C-h",
               function () {
                   goDoCommand("cmd_deleteCharBackward");
               },
               """ + {ja: '"前の一文字を削除"',
                      en: '"Delete backward char"'}[l] + """);
key.setEditKey("M-d",
               function () {
                   goDoCommand('cmd_deleteWordForward');
               },
               """ + {ja: '"次の一単語を削除"',
                      en: '"Delete forward word"'}[l] + """);
key.setEditKey([["C-<backspace>"],
                ["M-<delete>"]],
               function () {
                   goDoCommand('cmd_deleteWordBackward');
               },
               """ + {ja: '"前の一単語を削除"',
                      en: '"Delete backward word"'}[l] + """);

// -------------------- transformation -------------------- //

key.setEditKey("M-u", function (aEvent) {
                   command.processForwardWord(aEvent.originalTarget, function (aString) { return aString.toUpperCase(); });
               },
               """ + {ja: '"次の一単語を全て大文字に (Upper case)"',
                      en: '"Convert following word to upper case"'}[l] + """);

key.setEditKey("M-l", function (aEvent) {
                   command.processForwardWord(aEvent.originalTarget, function (aString) { return aString.toLowerCase(); });
               },
               """ + {ja: '"次の一単語を全て小文字に (Lower case)"',
                      en: '"Convert following word to lower case"'}[l] + """);

key.setEditKey("M-c", function (aEvent) {
                   command.processForwardWord(aEvent.originalTarget, command.capitalizeWord);
               },
               """ + {ja: '"次の一単語をキャピタライズ"',
                      en: '"Capitalize the following word"'}[l] + """);

// -------------------- cut / paste --------------------

key.setEditKey("C-k",
               function (aEvent) {
                   command.killLine(aEvent);
               },
               """ + {ja: '"カーソルから先を一行カット"',
                      en: '"Kill the rest of the line"'}[l] + """);
key.setEditKey("C-y",
               function () { goDoCommand("cmd_paste"); },
               """ + {ja: '"ペースト"',
                      en: '"Paste"'}[l] + """);
key.setEditKey("C-w",
               function (aEvent) {
                   goDoCommand('cmd_copy');
                   goDoCommand("cmd_delete");
                   command.resetMark(aEvent);
               },
               """ + {ja: '"リージョンをカット"',
                      en: '"Cut current region"'}[l] + """);

// -------------------- rectangle -------------------- //

key.setEditKey(["C-x", "r", "d"],
               function (aEvent) {
                   command.replaceRectangle(aEvent.originalTarget, "");
               }, """ + {ja: '"矩形削除"',
                         en: '"Delete text in the region-rectangle"'}[l] + """);

key.setEditKey(["C-x", "r", "t"],
               function (aEvent) {
                   var replacement = window.prompt("String rectangle", "");
                   command.replaceRectangle(aEvent.originalTarget, replacement);
               }, """ + {ja: '"矩形置換"',
                         en: '"Replace text in the region-rectangle with user inputted string"'}[l] + """);

key.setEditKey(["C-x", "r", "o"],
               function (aEvent) {
                   command.openRectangle(aEvent.originalTarget);
               }, """ + {ja: '"矩形行空け"',
                         en: '"Blank out the region-rectangle, shifting text right"'}[l] + """);

// -------------------- selection -------------------- //

key.setEditKey(["C-x", "h"],
                 function (aEvent) {
                     command.selectAll(aEvent);
                 },
                 """ + {ja: '"全て選択"',
                        en: '"Select whole text"'}[l] + """);

// -------------------- walk through elements -------------------- //

key.setEditKey("M-n", function () {
                   command.walkInputElement(command.elementsRetrieverTextarea, true, true);
               }, """ + {ja: '"次のテキストエリアへフォーカス"',
                         en: '"Focus to the next text area"'}[l] + """);

key.setEditKey("M-p", function () {
                   command.walkInputElement(command.elementsRetrieverTextarea, false, true);
               }, """ + {ja: '"前のテキストエリアへフォーカス"',
                         en: '"Focus to the previous text area"'}[l] + """);

// ==================== caret mode (press F7 to enter) ==================== //

// copy view mode keymap to caret mode keymap
key.copyKeyMap(key.modes.VIEW, key.modes.CARET);

key.setCaretKey([["C-SPC"],
                 ["C-@"]],
                function (aEvent) { command.setMark(aEvent); },
                """ + {ja: '"マークをセット"',
                       en: '"Set mark"'}[l] + """);

// -------------------- caret move -------------------- //

key.setCaretKey([["C-a"],
                 ["^"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectBeginLine') : goDoCommand('cmd_beginLine'); },
                """ + {ja: '"行頭へ移動"',
                       en: '"Move caret to the beginning of the line"'}[l] + """);
key.setCaretKey([["C-e"],
                 ["$"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectEndLine') : goDoCommand('cmd_endLine'); },
                """ + {ja: '"行末へ移動"',
                       en: '"Move caret to the end of the line"'}[l] + """);

key.setCaretKey([["C-f"],
                 ["l"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectCharNext') : goDoCommand('cmd_scrollRight'); },
                """ + {ja: '"一文字右へ移動"',
                       en: '"Move caret to the right"'}[l] + """);
key.setCaretKey([["C-b"],
                 ["h"],
                 ["C-h"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectCharPrevious') : goDoCommand('cmd_scrollLeft'); },
                """ + {ja: '"一文字左へ移動"',
                       en: '"Move caret to the left"'}[l] + """);

key.setCaretKey([["M-f"],
                 ["w"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectWordNext') : goDoCommand('cmd_wordNext'); },
               """ + {ja: '"一単語右へ移動"',
                      en: '"Move caret to the right by word"'}[l] + """);
key.setCaretKey([["M-b"],
                 ["W"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectWordPrevious') : goDoCommand('cmd_wordPrevious'); },
                """ + {ja: '"一単語左へ移動"',
                       en: '"Move caret to the left by word"'}[l] + """);

key.setCaretKey([["C-n"],
                ["j"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectLineNext') : goDoCommand('cmd_scrollLineDown'); },
               """ + {ja: '"一行下へ"',
                      en: '"Move caret to the next line"'}[l] + """);
key.setCaretKey([["C-p"],
                ["k"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectLinePrevious') : goDoCommand('cmd_scrollLineUp'); },
               """ + {ja: '"一行上へ"',
                      en: '"Move caret to the previous line"'}[l] + """);

key.setCaretKey([["C-v"],
                ["SPC"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectPageNext') : goDoCommand('cmd_movePageDown'); },
               """ + {ja: '"一画面分下へ"',
                      en: '"Move caret down by page"'}[l] + """);
key.setCaretKey([["M-v"],
                ["b"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectPagePrevious') : goDoCommand('cmd_movePageUp'); },
               """ + {ja: '"一画面分上へ"',
                      en: '"Move caret up by page"'}[l] + """);

key.setCaretKey([["g"],
                ["M-<"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectTop') : goDoCommand('cmd_scrollTop'); },
               """ + {ja: '"ページ先頭へ移動"',
                      en: '"Move caret to the top of the page"'}[l] + """);
key.setCaretKey([["G"],
                ["M->"]],
                function (aEvent) { aEvent.target.ksMarked ? goDoCommand('cmd_selectBottom') : goDoCommand('cmd_scrollBottom'); },
               """ + {ja: '"ページ末尾へ移動"',
                      en: '"Move caret to the bottom of the page"'}[l] + """);

// -------------------- scroll -------------------- //

key.setCaretKey("J", function () {
                    util.getSelectionController().scrollLine(true);
                }, """ + {ja: '"画面を一行分下へスクロール"',
                          en: '"Scroll line down"'}[l] + """);

key.setCaretKey("K", function () {
                    util.getSelectionController().scrollLine(false);
                }, """ + {ja: '"画面を一行分上へスクロール"',
                          en: '"Scroll line up"'}[l] + """);

key.setCaretKey(",", function () {
                    util.getSelectionController().scrollHorizontal(true);
                }, """ + {ja: '"ページを左へスクロール"',
                          en: '"Scroll left"'}[l] + """);

key.setCaretKey(".", function () {
                    util.getSelectionController().scrollHorizontal(false);
                }, """ + {ja: '"ページを右へスクロール"',
                          en: '"Scroll right"'}[l] + """);

key.setCaretKey("z", function (aEvent) {
                    command.recenter(aEvent);
                }, """ + {ja: '"カーソル位置へスクロール"',
                          en: '"Scroll to the cursor position"'}[l] + """);

// -------------------- tab navigation -------------------- //

key.setCaretKey("L", function () {
                    gBrowser.mTabContainer.advanceSelectedTab(1, true);
                }, """ + {ja: '"ひとつ右のタブへ"',
                          en: '"Select next tab"'}[l] + """);

key.setCaretKey("H", function () {
                    gBrowser.mTabContainer.advanceSelectedTab(-1, true);
                }, """ + {ja: '"ひとつ左のタブへ"',
                          en: '"Select previous tab"'}[l] + """);

// ==================== Define your function (if needed) ==================== //
""" + {ja: """// 以下のようにしてモジュールを作成して関数を定義することが出来ます.
// ここでは RC という名前になっていますが, 他のモジュールと被らない範囲であれば
// 自由につけてしまって構いません.
// あらかじめ予約された名前空間は現在のところ
// Command, Display, Hook, HTML, Key, Util, Prompt, UserScript
// となっています.
// モジュールへのアクセスは「小文字にしたモジュール名」で行います.
// RC なら rc.hoge といった具合です.""",
       en: """// You can create the module and define the funtions like below.
// Although in this example the module name is RC, you can choose it freely
// unless overlap the other modules.
// Modules already registered are currently,
//     Command, Display, Hook, HTML, Key, Util, Prompt, UserScript
// so you have to choose the other names.
// To access to the created module, use lower-cased module name.
// RC => rc.foo"""}[l] + """

KeySnail.RC = {
    init: function () {
    },

    // Very inspired from functions for keyconfig
    // http://www.pqrs.org/tekezo/firefox/extensions/functions_for_keyconfig/
    focusOtherFrame: function (aArg) {
        var focused = this.getFocusedWindow();
        var topFrameWindow = this.getTopFrameWindow();

        if (!focused) {
            focused = this.topFrameWindow();
        }

        // frame
        var currentframeindex = -1;
        var frameWindows = this.getListFrameWindow(topFrameWindow);
        for (var i = 0; i < frameWindows.length; ++i) {
            if (frameWindows[i] == focused) {
                currentframeindex = i;
                break;
            }
        }

        var focusTo = aArg ?
            currentframeindex - 1 : currentframeindex + 1;
        if (focusTo >= frameWindows.length) {
            focusTo = 0;
        } else if (focusTo < 0) {
            focusTo = frameWindows.length - 1;
        }

        // set focus
        var nextFrameWindow = frameWindows[focusTo];
        if (nextFrameWindow) {
            nextFrameWindow.focus();
            return;
        }
    },

    isFrameSetWindow: function (frameWindow) {
        if (!frameWindow) {
            return false;
        }

        var listElem = frameWindow.document.documentElement
            .getElementsByTagName('frameset');

        return (listElem && listElem.length > 0);
    },

    getListFrameWindow: function (baseWindow) {
        var listFrameWindow = [];

        if (this.isFrameSetWindow(baseWindow)) {
            var frameWindows = baseWindow.frames;

            for (var i = 0; i < frameWindows.length; ++i) {
                if (this.isFrameSetWindow(frameWindows[i])) {
                    var childWindows = this.getListFrameWindow(frameWindows[i]);
                    // """ + {ja: "子フレームをくっつける",
                              en: "Append the child frame"}[l] + """
                    listFrameWindow = listFrameWindow.concat(childWindows);
                } else {
                    listFrameWindow.push(frameWindows[i]);
                }
            }
        }

        return listFrameWindow;
    },

    getTopFrameWindow: function () {
        return gBrowser.contentWindow;
    },

    getFocusedWindow: function () {
        var focused = document.commandDispatcher.focusedWindow;
        if (!focused) {
            focused = null;
        }

        return focused;
    }
};

// """ + {ja: "モジュールを登録",
          en: "Register the module"}[l] + """
KeySnail.registerModule("RC");
// """ + {ja: "モジュールを初期化 (init メソッドが呼ばれる)",
          en: "Initialize the module (just call the init method)"}[l] + """
KeySnail.initModule("RC");"""
