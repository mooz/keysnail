/**
 * original code from pluginManager.js
 * http://bulkya.blogdb.jp/share/browser/lang/javascript/vimperator-plugins/trunk/pluginManager.js
 */

const EXPORTED_SYMBOLS = ["WikiParser"];
const { classes: Cc, interfaces: Ci } = Components;

function WikiParser(text){
    this.mode = '';
    this.lines = text.split(/\n\r|[\r\n]/);
    this.preCount = 0;
    this.pendingMode = '';
    var domParser = Cc["@mozilla.org/xmlextras/domparser;1"]
            .createInstance(Ci.nsIDOMParser);
    this.doc = domParser.parseFromString('<html xmlns="http://www.w3.org/1999/xhtml"></html>', 'application/xml');
    this.container = this.doc.createElement('div');
}

WikiParser.prototype = {
    inlineParse: function(str){
        function replacer(str){
            switch(str){
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            default:
                return '<a href="' + str + '" target="_blank">' + str + '</a>';
            }
        }
        var elem = this.doc.createElement('span');
        elem.innerHTML = str.replace(/>|<|&|(?:https?:\/\/|mailto:)\S+/g, replacer);
        return elem;
    },
    wikiReg: { // {{{
        hn: /^(={2,4})\s*(.*?)\s*(\1)$/,
        dt: /^(.*)\s*:$/,
        ul: /^\-\s+(.*)$/,
        ol: /^\+\s+(.*)$/,
        preStart: /^>\|([0-9a-zA-Z_]+)?\|$/,
        preEnd: /^\|\|<$/
    }, // }}}
    blockParse: function(line, prevMode){ // {{{
        if (prevMode == 'pre'){
            if (this.wikiReg.preEnd.test(line)){
                if (this.preCount > 0){
                    this.preCount--;
                } else {
                    this.mode = '';
                    return this.doc.createTextNode('');
                }
            } else if (this.wikiReg.preStart.test(line)){
                this.preCount++;
            }
            var pre = this.doc.createElement('pre');
            pre.appendChild(this.doc.createTextNode(line));
            return pre;
        } else if (this.wikiReg.preStart.test(line)){
            this.mode = 'pre';
            this.pendingMode = prevMode;
            var lang = RegExp.$1;
            var pre = this.doc.createElement('pre');
            if (lang)
                pre.setAttribute('data-lang', lang);
            return pre;
        } else if (this.wikiReg.hn.test(line)){
            var hn = RegExp.$1.length - 1;
            this.mode = '';
            var h = this.doc.createElement('h' + hn);
            h.appendChild(this.inlineParse(RegExp.$2));
            return h;
        } else if (this.wikiReg.ul.test(line)){
            this.mode = 'ul';
            var ul = this.doc.createElement('ul');
            var li = this.doc.createElement('li');
            li.appendChild(this.inlineParse(RegExp.$1));
            ul.appendChild(li);
            return ul;
        } else if (this.wikiReg.ol.test(line)){
            this.mode = 'ol';
            var ol = this.doc.createElement('ol');
            var li = this.doc.createElement('li');
            li.appendChild(this.inlineParse(RegExp.$1));
            ol.appendChild(li);
            return ol;
        } else if (this.wikiReg.dt.test(line)){
            this.mode = 'dl';
            var dl = this.doc.createElement('dl');
            var dt = this.doc.createElement('dt');
            dt.appendChild(this.inlineParse(RegExp.$1));
            dl.appendChild(dt);
            dl.appendChild(this.doc.createElement('dd'));
            return dl;
        } else if (prevMode == 'dl'){
            return this.inlineParse(line);
        }
        this.mode = '';
        return this.inlineParse(line);
    }, // }}}
    append: function(target, node) {
        if (target.lastChild && target.lastChild.nodeName == node.nodeName) {
            if (node.nodeName == 'span')
                target.lastChild.appendChild(this.doc.createElement('br'));
            Array.slice(node.childNodes).forEach(function(n) target.lastChild.appendChild(n));
            return target.lastChild;
        } else {
            target.appendChild(node);
            return node;
        }
    },
    parse: function(){
        var num, line, indent;
        var currentIndent = 0, indentList = [0], nest=0;
        var prevMode = "";
        var target = this.container;
        var stack = [];
        var prevNode;
        //try {
        for ([num, line] of util.keyValues(this.lines)){
            [,indent, line] = line.match(/^(\s*)(.*)\s*$/);
            currentIndent = indent.length;
            var prevIndent = indentList[indentList.length -1];
            var buf = this.blockParse(line, prevMode);
            if (prevMode == 'pre'){
                if (this.mode){
                    target.lastChild.appendChild(this.doc.createTextNode(indent.substr(prevIndent) + line + "\n"));
                } else {
                    this.mode = this.pendingMode;
                    indentList.pop();
                    if (stack.length > 1) target = stack.pop();
                    if (indentList.length == 0) indentList = [0];
                }
                prevMode = this.mode;
                continue;
            }
            if (!line) {
                if (!prevMode) target.appendChild(this.doc.createElement('p'));
                continue;
            }

            if (currentIndent > prevIndent){
                if (prevNode.lastChild && prevNode.lastChild.nodeType == 1) {
                    indentList.push(currentIndent);
                    stack.push(target);
                    target = prevNode.lastChild;
                }
                if (this.mode){
                    buf = this.append(target, buf);
                } else {
                    if (prevMode && target != this.container && buf.nodeName == 'span')
                        this.append(target, this.doc.createElement('br'));
                    buf = this.append(target, buf);
                    this.mode = prevMode;
                }
            } else if (currentIndent < prevIndent){
                for (var i in indentList) {
                    indentList.pop();
                    target = stack.pop();
                    if (currentIndent == indentList[i] || currentIndent < indentList[i+1])
                        break;
                }
                indentList.push(currentIndent);
                stack.push(target);
                buf = this.append(target, buf);
            } else {
                buf = this.append(target, buf);
            }
            prevMode = this.mode;
            prevNode = buf;
        }
        //} catch (e){ alert(num + ":"+ e); }
        return this.container.innerHTML;
    }
};
