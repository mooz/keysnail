(function () {
     function profile(aFunction) {
         var begin = new Date();
         for (var i = 0; i < 1000; ++i) {
             aFunction();
         }
         var end = new Date();

         return end - begin;
     }

     var bp = nsPreferences.getBoolPref;
     var isCe = util.isCaretEnabled;

     display.prettyPrint("short: " + profile(function () { nsPreferences.getBoolPref("accessibility.browsewithcaret"); }) +
                         "   isWritable: " + profile(function () { util.isWritable(); }));
     // display.prettyPrint("pref: " + profile(function () { nsPreferences.getBoolPref("accessibility.browsewithcaret"); })
     //                     + "   query: " + profile(function () { util.isCaretEnabled(); }));
 })();
