KeySnail.Shell = function () {
    let modules;

    let completer = modules.completer;
    let ext       = modules.ext;

    let commands = {
        foo: {
            
        }
    };

    let self = {
        init: function () {
            if (KeySnail.windowType !== "navigator:browser")
                return;

            modules = self.modules;
        },

        show: function () {
            prompt.reader(
                {
                    message    : "shell :",
                    completer  : function (left, whole) {
                        let [args, state] = completer.utils.lex(left, [" ", "\t"], []);
                        let inputting = (state !== completer.states.NEUTRAL) ? args[args.length - 1] : null;

                        let cc = {
                            origin     : left.length
                        };

                        if (!inputting)
                        {
                            return cc;                                
                        }

                        if (inputting)
                            args.pop();

                        return cc;
                    },
                    callback : function (query) {
                        if (query)
                        {
                            window.alert("hogehoge");
                        }
                    }
                }
            );

        },
    };

    return self;
}();