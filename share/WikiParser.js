/**
 * original code from pluginManager.js
 * http://bulkya.blogdb.jp/share/browser/lang/javascript/vimperator-plugins/trunk/pluginManager.js
 */

var EXPORTED_SYMBOLS = ["WikiParser", "HTMLStack"];

function WikiParser(text){
    this.mode = '';
    this.lines = text.split(/\n\r|[\r\n]/);
    this.preCount = 0;
    this.pendingMode = '';
    this.xmlstack = new HTMLStack();
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
        return XMLList(str.replace(/>|<|&|(?:https?:\/\/|mailto:)\S+/g, replacer));
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
                            return <>{line}</>;
                        } else {
                            this.mode = '';
                            return <></>;
                        }
                        return <>{line}</>;
                    } else if (this.wikiReg.preStart.test(line)){
                        this.preCount++;
                    }
                    return <>{line}</>;
                } else if (this.wikiReg.preStart.test(line)){
                    this.mode = 'pre';
                    this.pendingMode = prevMode;
                    let lang = RegExp.$1;
                    return lang ? <pre data-lang={lang} /> : <pre />;
                } else if (this.wikiReg.hn.test(line)){
                    var hn = RegExp.$1.length - 1;
                    this.mode = '';
                    return <h{hn}>{this.inlineParse(RegExp.$2)}</h{hn}>;
                } else if (this.wikiReg.ul.test(line)){
                    this.mode = 'ul';
                    return <ul><li>{this.inlineParse(RegExp.$1)}</li></ul>;
                } else if (this.wikiReg.ol.test(line)){
                    this.mode = 'ol';
                    return <ol><li>{this.inlineParse(RegExp.$1)}</li></ol>;
                } else if (this.wikiReg.dt.test(line)){
                    this.mode = 'dl';
                    return <dl><dt>{this.inlineParse(RegExp.$1)}</dt></dl>;
                } else if (prevMode == 'dl'){
                    return <>{this.inlineParse(line)}</>;
                }
            this.mode = '';
            return <>{this.inlineParse(line)}</>;
        }, // }}}
    parse: function(){
        var ite = Iterator(this.lines);
        var num, line, indent;
        var currentIndent = 0, indentList = [0], nest=0;
        var prevMode = "";
        var stack = [];
        var isNest = false;
        var bufXML;
        //try {
        for ([num, line] in ite){
            [,indent, line] = line.match(/^(\s*)(.*)\s*$/);
            currentIndent = indent.length;
            var prevIndent = indentList[indentList.length -1];
            bufXML = this.blockParse(line, prevMode);
            if (prevMode == 'pre'){
                if (this.mode){
                    this.xmlstack.appendLastChild(indent.substr(prevIndent) + line + "\n");
                } else {
                    this.xmlstack.reorg(-2);
                    this.mode = this.pendingMode;
                    indentList.pop();
                    if (indentList.length == 0) indentList = [0];
                }
                prevMode = this.mode;
                continue;
            }
            if (!line) {
                // this.xmlstack.append(<p>{bufXML}</p>);
                this.xmlstack.append(<p>{bufXML}</p>);
                //this.xmlstack.append(<>{"\n"}</>);
                continue;
            }

            if (currentIndent > prevIndent){
                if (this.mode){
                    if (prevMode == 'dl'){
                        this.xmlstack.appendChild(<dd/>);
                    }
                    this.xmlstack.push(bufXML);
                    indentList.push(currentIndent);
                } else {
                    if (prevMode && this.xmlstack.length > 0){
                        this.xmlstack.appendLastChild(bufXML);
                    } else {
                        this.xmlstack.append(bufXML);
                    }
                    this.mode = prevMode;
                }
            } else if (currentIndent < prevIndent){
                for (var i in indentList){
                    if (currentIndent == indentList[i] || currentIndent < indentList[i+1]){ nest = i; break; }
                }
                indentList.splice(nest);
                indentList.push(currentIndent);
                this.xmlstack.reorg(nest);
                this.xmlstack.append(bufXML);
            } else {
                this.xmlstack.append(bufXML);
            }
            prevMode = this.mode;
        }
        //} catch (e){ alert(num + ":"+ e); }
        this.xmlstack.reorg();
        return this.xmlstack.last.toString();
    }
};

function HTMLStack(){
    this.stack = [];
}

HTMLStack.prototype = {
    get length() { return this.stack.length; },
    get last() { return this.stack[this.length-1]; },
    get lastLocalName() { return this.last[this.last.length()-1].localName(); },
    get inlineElements() { return ['a','b','i','code','samp','dfn','kbd','br','em','strong','sub','sup','img','span']; },
    isInline: function(xml){
        return (xml.length() > 1 || xml.nodeKind() == 'text' || this.inlineElements.indexOf(xml.localName()) >= 0) ?  true : false;
    },
    push: function(xml) {return this.stack.push(xml); },
    append: function(xml){
        if (this.length == 0){
            this.push(xml);
            return xml;
        }
        var buf = this.last[this.last.length()-1];
        if (buf && buf.nodeKind() == 'text'){
            this.last[this.last.length()-1] += this.isInline(xml) ? <><br/>{xml}</> : xml;
        } else {
            if(this.isInline(xml)){
                this.stack[this.length-1] += xml;
            } else if (buf && buf.localName() == xml.localName()){
                buf.* += xml.*;
            } else {
                this.stack[this.length-1] += xml;
            }
        }
        return this.last;
    },
    appendChild: function(xml) {
        var buf = this.stack[this.length-1];
        buf[buf.length()-1].* += xml;
        return this.last;
    },
    appendLastChild: function(xml){
        var buf = this.last[this.last.length()-1].*;
        if (buf.length() > 0 && buf[buf.length()-1].nodeKind() == 'element'){
            var tmp = buf[buf.length()-1].*;
            if (tmp[tmp.length()-1].nodeKind() == 'element'){
                buf[buf.length()-1].* += xml;
            } else {
                buf[buf.length()-1].* += <><br/>{xml}</>;
            }
        } else {
            this.last[this.last.length()-1].* += xml;
        }
        return this.last;
    },
    reorg: function(from){
        if (this.length == 0) return;
        if (!from) from = 0;
        var xmllist = this.stack.splice(from);
        var xml;
        if (xmllist.length > 1){
            xml = xmllist.reduceRight(
                function(p, c){
                    var buf = c[c.length()-1].*;
                    if (buf.length() > 0){
                        if (buf[buf.length()-1].nodeKind() == 'text'){
                            c += p;
                        } else {
                            buf[buf.length()-1].* += p;
                        }
                    } else {
                        c += p;
                    }
                    return c;
                });
        } else if (xmllist.length > 0){
            xml = xmllist[0];
        }
        this.push(xml);
        return this.last;
    }
};
