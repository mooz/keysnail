let PLUGIN_INFO =
<KeySnailPlugin>
    <name>Dark Theme</name>
    <description>Dark Theme for KeySnail</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/_dark-theme.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/dark-theme.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <minVersion>1.4.7</minVersion>
    <detail><![CDATA[]]></detail>
    <detail lang="ja"><![CDATA[]]></detail>
</KeySnailPlugin>;

(function () {
     if (share.darkTheme)
         style.unregister(share.darkTheme);

     const WHITE            = "#e2e2e2";
     const GLAY_TRANSPARENT = "rgba(60,76,82,0.7)";
     const BLUE             = "#61b5d4";

     const BLACK            = "#252525";
     const BLACK_LIGHT      = "#2b2b2b";
     const BLACK_DARK       = "#151515";

     function arrange(seed) {
         let colors = [
             ["%FG%"              , WHITE],
             ["%FG_SELECTED_ROW%" , WHITE],
             //
             ["%BG%"              , BLACK_DARK],
             ["%BG_SELECTED_ROW%" , GLAY_TRANSPARENT],
             ["%BG_INPUT%"        , BLACK],
             ["%BG_INPUT_FOCUS%"  , BLACK_LIGHT],
             //
             ["%FG_MESSAGE%"      , BLUE],
             ["%FG_HOVER%"        , BLUE],
             ["%FG_HEADER%"       , BLUE],
             //
             ["%BORDER_HEADER%"   , BLUE],
             ["%BORDER_BOTTOM%"   , BLUE]
             //
         ];

         colors.forEach(function ([k, v]) { seed = seed.replace(k, v, "g"); } );
         return seed;
     }

     let ooo = {
         "twitter_client": {
             "unread_message_style"                  : "text-decoration:underline;",
             "normal_tweet_style"                    : "color:%FG%;",
             "my_tweet_style"                        : "color:#7ad3f2;",
             "reply_to_me_style"                     : "color:#f279d2;",
             "retweeted_status_style"                : "color:#d2f279;",
             "selected_row_style"                    : "color:%FG%; background-color:%BG_SELECTED_ROW%;",
             "selected_user_style"                   : "color:%FG%; background-color:rgba(60,76,82,0.4);",
             "selected_user_reply_to_style"          : "color:%FG%; background-color:rgba(82,60,76,0.4);",
             "selected_user_reply_to_reply_to_style" : "color:%FG%; background-color:rgba(79,60,82,0.4);",
             "search_result_user_name_style"         : "color:%FG_MESSAGE%;"
         }
     };

     style.prompt["default"]     = "color:#e2e2e2;";
     style.prompt["description"] = "color:#abbac0;";
     style.prompt["url"]         = "color:#98d3e7;text-decoration:underline;";
     style.prompt["engine"]      = "color:#1782de;";
     style.prompt["bookmark"]    = "color:#f14b0d;";
     style.prompt["history"]     = "color:#62e500;";

     style.js["function"]  = "color:#1782de;";
     style.js["object"]    = "color:#f14b0d;";
     style.js["string"]    = "color:#62e500;";
     style.js["xml"]       = "color:#6621dd;";
     style.js["number"]    = "color:#b616e7;";
     style.js["boolean"]   = "color:#e63535;";
     style.js["undefined"] = "color:#e000a5;";
     style.js["null"]      = "color:#07d8a8;";

     for (let [prefix, opts] of util.keyValues(ooo))
         for (let [k, v] of util.keyValues(opts))
             plugins.options[prefix + "." + k] = arrange(v);

     let darkTheme = arrange(<><![CDATA[
                                     /* charm */
                                     #keysnail-prompt,
                                     #keysnail-prompt textbox,
                                     listbox#keysnail-completion-list,
                                     listbox#keysnail-completion-list listitem,
                                     listbox#keysnail-completion-list listheader,
                                     #keysnail-twitter-client-user-tweet
                                     {
                                         -moz-appearance  : none !important;
                                         border           : none !important;
                                     }

                                     /* basic */
                                     #keysnail-prompt,
                                     #keysnail-prompt textbox,
                                     listbox#keysnail-completion-list,
                                     listbox#keysnail-completion-list listheader,
                                     #keysnail-twitter-client-user-tweet
                                     {
                                         font-family      : Monaco, Consolas, "Bitstream Vera Sans Mono", monospace !important;
                                         background-color : %BG% !important;
                                         color            : %FG% !important;
                                     }

                                     listbox#keysnail-completion-list listitem
                                     {
                                         padding-left : 4px !important;
                                     }

                                     .ks-text-link       { color : #98d3e7 !important; }
                                     .ks-text-link:hover { color : #248baf !important; }

                                     /* selected row */
                                     listbox#keysnail-completion-list listitem[selected="true"],
                                     listbox#keysnail-completion-list:focus > listitem[selected="true"]
                                     {
                                         background-color : %BG_SELECTED_ROW% !important;
                                         color            : %FG_SELECTED_ROW% !important;
                                     }

                                     #keysnail-prompt textbox
                                     {
                                         margin             : 5px 0px    !important;
                                         -moz-border-radius : 3px        !important;
                                         border-radius      : 3px        !important;
                                         padding            : 2px        !important;
                                     }

                                     #keysnail-prompt textbox
                                     {
                                         padding-left       : 0.5em      !important;
                                         background-color   : %BG_INPUT% !important;
                                     }

                                     #keysnail-prompt textbox:focus
                                     {
                                         background-color   : %BG_INPUT_FOCUS% !important;
                                     }

                                     /* Prompt message */
                                     .keysnail-prompt-label
                                     {
                                         color : %FG_MESSAGE% !important;
                                     }

                                     /* Bottom line */
                                     listbox#keysnail-completion-list
                                     {
                                         border-bottom : 1px solid %FG_HOVER% !important;
                                         margin        : 0px                  !important;
                                     }

                                     /* Header */
                                     listbox#keysnail-completion-list listheader
                                     {
                                         font-weight               : bold                      !important;
                                         padding                   : 2px                       !important;
                                         color                     : %FG_HEADER%               !important;
                                         border-bottom             : 1px solid %BORDER_HEADER% !important;
                                         -moz-border-bottom-colors : %BORDER_HEADER%           !important;
                                         margin-bottom             : 4px                       !important;
                                     }
                                 ]]></>.toString());

     share.darkTheme = darkTheme;
     style.register(share.darkTheme);
 })();
