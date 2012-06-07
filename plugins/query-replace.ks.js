let PLUGIN_INFO =
<KeySnailPlugin>
    <name>query-replace</name>
    <description>Emulate query-replace of Emacs</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/query-replace.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/query-replace.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MIT License</license>
    <minVersion>1.2.4</minVersion>
    <detail><![CDATA[
===Settings===

In your .keysnail.js,

>|javascript|
key.setEditKey([["M-%"], ["ESC", "%"]], function (ev) {
  ext.exec("query-replace", null, ev);
});

key.setEditKey([["C-M-%"], ["ESC", "C-%"]], function (ev) {
  ext.exec("query-replace-regexp", null, ev);
});
||<

===Usage===

Here is a list of commands supported by this plugin for now.

>||
Type Space or `y' to replace one match, Delete or `n' to skip to next,
RET or `q' to exit, Period to replace one match and exit,
Comma to replace but not move point immediately,
! to replace all remaining matches with no more questions,
E to edit the replacement string
||<

Other commands will be supported in future.'

]]></detail>
</KeySnailPlugin>;

plugins.withProvides(function (provide) {
  provide("query-replace", function (ev) {
    queryReplacer.start(ev.originalTarget);
  }, "Query replace");

  provide("query-replace-regexp", function (ev) {
    queryReplacer.startRegexp(ev.originalTarget);
  }, "Query replace (Regexp)");
}, PLUGIN_INFO);

function QueryReplacer() {
}

QueryReplacer.prototype = {
  initialize: function (input, fromText, toText) {
    this.input = input;
    this.fromText = fromText;
    this.toText = toText;
    // TODO: implement limiting feature
    this.limitFrom = 0;
    this.limitEnd = this.currentText.length;
  },

  get editor() {
    this.input.QueryInterface(Ci.nsIDOMNSEditableElement);
    this.input.editor.QueryInterface(Ci.nsIPlaintextEditor);
    return this.input.editor;
  },

  get replacingMessage() util.format("Query replacing %s with %s", this.fromText, this.toText),

  get regexpMode() this.fromText instanceof RegExp,

  get currentText() this.input.value,
  get caret() this.input.selectionStart,
  set caret(position) this.input.setSelectionRange(position, position),

  calculateNextFromTextPositions: function () {
    if (this.regexpMode) {
      var matchInfo = this.currentText.slice(this.caret).match(this.fromText);
      this.nextFromTextPositionBegin = matchInfo ? matchInfo.index + this.caret : -1;
      this.nextFromTextPositionEnd = matchInfo ? this.nextFromTextPositionBegin + matchInfo[0].length : -1;
    } else {
      this.nextFromTextPositionBegin = this.currentText.indexOf(this.fromText, this.caret);
      this.nextFromTextPositionEnd = this.nextFromTextPositionBegin + this.fromText.length;
    }
  },
  select: function (begin, end) {
    this.input.selectionStart = begin;
    this.input.selectionEnd = end;
  },
  selectNextFromText: function () {
    this.select(this.nextFromTextPositionBegin, this.nextFromTextPositionEnd);
  },

  repaintSelection: function (input) {
    var selectionController = this.editor.selectionController;
    try {
      selectionController.setDisplaySelection(selectionController.SELECTION_ATTENTION);
      selectionController.repaintSelection(selectionController.SELECTION_NORMAL);
    } catch (x) {}
  },

  interactiveKeyMap: {},

  askReplaceNext: function () {
    this.calculateNextFromTextPositions();

    if (this.nextFromTextPositionBegin < 0) {
      display.echoStatusBar("Completed");
      return;
    }

    var queryReplacer = this;
    prompt.reader({
      message: this.replacingMessage,
      callback: function () {},
      onChange: function (arg) {
        var pressedKeys = arg.textbox.value.split("");
        arg.textbox.value = "";
        var pressedKey = pressedKeys.length > 0 ? pressedKeys[0] : arg.key;

        if (queryReplacer.interactiveKeyMap[pressedKey])
          queryReplacer.interactiveKeyMap[pressedKey].call(queryReplacer, arg);
      }
    });

    this.selectNextFromText();
    this.repaintSelection(this.input);
  },

  getReplacingText: function () {
    var replacingText = this.regexpMode
          ? this.currentText.slice(this.nextFromTextPositionBegin,
                                   this.nextFromTextPositionEnd).replace(this.fromText, this.toText)
          : this.toText;

    return replacingText;
  },

  doReplace: function () {
    var replacingText = this.getReplacingText();
    this.selectNextFromText();
    this.editor.insertText(replacingText);
  },

  skipReplace: function () {
    /* Skip */
    this.caret = this.nextFromTextPositionEnd;
  },

  promptInput: function (next, isRegexp) {
    var modeName = isRegexp
          ? "Query Replace Regexp"
          : "Query Replace";
    var defaultString = (this.fromText && this.toText)
          ? util.format(" (default %s -> %s)", this.fromText, this.toText)
          : "";

    var self = this;
    function callNext(fromText, toText) {
      if (isRegexp && !(fromText instanceof RegExp))
        fromText = new RegExp(fromText, "m");
      next.call(self, fromText, toText);
    }

    prompt.read(util.format("%s%s: ", modeName, defaultString), function (fromText) {
      if (defaultString && fromText === "")
        return callNext(self.fromText, self.toText);
      else if (fromText === null)
        return;

      prompt.read(util.format("%s %s with: ", modeName, fromText), function (toText) {
        if (fromText === null)
          return;
        callNext(fromText, toText);
      });
    });
  },

  start: function (input, isRegexp) {
    this.promptInput(function (fromText, toText) {
      queryReplacer.initialize(input, fromText, toText);
      queryReplacer.askReplaceNext();
    }, isRegexp);
  },

  startRegexp: function (input) {
    this.start(input, true);
  }
};

QueryReplacer.prototype.interactiveKeyMap[" "] =
  QueryReplacer.prototype.interactiveKeyMap["y"] = function (arg) {
    arg.finish(true);
    this.doReplace();
    this.askReplaceNext();
  };

QueryReplacer.prototype.interactiveKeyMap["."] = function (arg) {
  arg.finish(true);
  this.doReplace();
};

QueryReplacer.prototype.interactiveKeyMap["<backspace>"] =
  QueryReplacer.prototype.interactiveKeyMap["n"] = function (arg) {
    arg.finish(true);
    this.skipReplace();
    this.askReplaceNext();
  };

QueryReplacer.prototype.interactiveKeyMap["q"] = function (arg) {
  arg.finish(true);
};

QueryReplacer.prototype.interactiveKeyMap["!"] = function (arg) {
  // do them all
  while (true) {
    this.calculateNextFromTextPositions();
    if (this.nextFromTextPositionBegin < 0)
      break;
    this.doReplace();
  }
  arg.finish(true);
};

QueryReplacer.prototype.interactiveKeyMap["^"] = function (arg) {
  // TODO: implement back track feature
  display.echoStatusBar("Not implemented yet");
};

QueryReplacer.prototype.interactiveKeyMap["E"] = function (arg) {
  var self = this;
  arg.finish(true);
  prompt.read(util.format("Edit replacement string (current %s): ", this.toText), function (newToText) {
    if (newToText !== null)
      self.toText = self.regexpMode ? new RegExp(newToText, "m") : newToText;
    self.askReplaceNext();
  });
};

QueryReplacer.prototype.interactiveKeyMap[","] = function (arg) {
  this.doReplace();
};

var queryReplacer = new QueryReplacer();
