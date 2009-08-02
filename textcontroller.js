key.setCaretKey([["C-a"],
                 ["^"]],
                function (aEvent) { util.getSelectionController().intraLineMove(false, !!aEvent.target.ksMarked); },
                "行頭へ移動");
key.setCaretKey([["C-e"],
                 ["$"]],
                function (aEvent) { util.getSelectionController().intraLineMove(true, !!aEvent.target.ksMarked); },
                "行末へ移動");

key.setCaretKey([["C-f"],
                 ["l"]],
                function (aEvent) { util.getSelectionController().characterMove(true, !!aEvent.target.ksMarked); },
                "一文字右へ移動");
key.setCaretKey([["C-b"],
                 ["h"],
                 ["C-h"]],
                function (aEvent) { util.getSelectionController().characterMove(false, !!aEvent.target.ksMarked); },
                "一文字左へ移動");

key.setCaretKey([["M-f"],
                 ["w"]],
                function (aEvent) { util.getSelectionController().wordMove(true, !!aEvent.target.ksMarked); },
               "一単語右へ移動");
key.setCaretKey([["M-b"],
                 ["W"]],
               function (aEvent) { util.getSelectionController().wordMove(false, !!aEvent.target.ksMarked); },
               "一単語左へ移動");

key.setCaretKey([["C-n"],
                ["j"]],
               function (aEvent) { util.getSelectionController().lineMove(true, !!aEvent.target.ksMarked); },
               "一行下へ");
key.setCaretKey([["C-p"],
                ["k"]],
               function (aEvent) { util.getSelectionController().lineMove(false, !!aEvent.target.ksMarked); },
               "一行上へ");

key.setCaretKey([["C-v"],
                ["SPC"]],
               function (aEvent) { util.getSelectionController().pageMove(true, !!aEvent.target.ksMarked); },
               "一画面分下へ");
key.setCaretKey([["M-v"],
                ["b"]],
               function (aEvent) { util.getSelectionController().pageMove(false, !!aEvent.target.ksMarked); },
               "一画面分上へ");

key.setCaretKey([["g"],
                ["M-<"],
                ["ESC", "<"]],
               function (aEvent) { util.getSelectionController().completeMove(false, !!aEvent.target.ksMarked); },
               "ページ先頭へ移動");
key.setCaretKey([["G"],
                ["M->"],
                ["ESC", ">"]],
               function (aEvent) { util.getSelectionController().completeMove(true, !!aEvent.target.ksMarked); },
               "ページ末尾へ移動");