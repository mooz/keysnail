// ============================================================ //
// Tokenizer
// ============================================================ //

function Tokenizer(str) {
    this.str    = str;
    this.tokens = [];
}

Tokenizer.prototype = {
    PATTERNS: [
        // [name, /pattern/],
        ["Blank"             , /^[ \t\n\r]+/],
        ["MultiLineComment"  , /^\/\*[\s\S]*?\*\//],
        ["SingleLineComment" , /^\/\/.*\n/],
        ["Reserved"          , /^(?:break|case|catch|continue|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|this|throw|try|typeof|var|void|while|with|const|let)(?=[^a-z])/],
        ["RegExp"            , /^\/(?:\[(?:\\\]|[^\]])+\]|\\\/|[^/\n\r])+\/[gimy]*/],
        ["Identifier"        , /^[a-zA-Z_$][a-zA-Z0-9_$]*/],
        ["Float"             , /^[0-9]?\.[0-9]+(?:e[0-9]+)?/],
        ["Integer"           , /^[0-9]+/],
        ["String"            , /^("|')(?:\\\1|[^\1\n\r])*?\1/],
        ["Punctuator"        , /^(?:\{|\}|\(|\)|\[|\]|\.|;|,|<|>|<=|>=|==|!=|===|!==|\+|-|\*|%|\+\+|--|<<|>>|>>>|&|\||\^|!|~|&&|\|\||\?|:|=|\+=|-=|\*=|%=|<<=|>>=|>>>=|&=|\|=|^=|\/=|\/)/]
    ],

    // previoust "c"oncrete "t"oken
    previousCT:
    function previousCT() {
        var tokens = this.tokens;

        for (var i = tokens.length - 1; i >= 0; --i) {
            var token = tokens[i];
            if (token.type !== "Blank" && token.type !== "Unknown")
                return token;
        }
    },

    tokenize:
    function tokenize(str) {
        var PATTERNS = this.PATTERNS;
        var PAT_LEN  = PATTERNS.length;

        for (var i = 0; i < PAT_LEN; ++i) {
            var row = PATTERNS[i];

            var type = row[0];
            var pat  = row[1];

            var matched = str.match(pat);
            if (!matched)
                continue;

            if (type === "RegExp") {
                /* check for the pattern like x /= b / 2; */
                var prevToken = this.previousCT();

                if (prevToken && prevToken.type === "Identifier")
                    continue;   // assume that it's not a regular expression
            }

            var tokenStr = matched[0];

            if (type === "Identifier" &&
                (tokenStr === "true" || tokenStr === "false" ||
                 tokenStr === "null" || tokenStr === "undefined")) {
                    type = "IdentifierSpecial";
            }

            // console.log(type + ", " + tokenStr);
            return {
                next : str.slice(tokenStr.length),
                type : type,
                str  : tokenStr
            };
        }

        return {
            next : "",
            type : "Unknown",
            str  : str
        };
    },

    next:
    function next() {
        var token = this.tokenize(this.str);

        this.tokens.push(token);
        this.str = token.next;

        return token;
    },

    get hasNext() {
        return !!this.str.length;
    }
};
