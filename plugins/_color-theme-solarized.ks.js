let PLUGIN_INFO =
        <KeySnailPlugin>
        <name>Color Theme Solarized</name>
        <description>A color scheme inspired by Solarized</description>
        <version>0.0.1</version>
        <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/_color-theme-solarized.ks.js</updateURL>
        <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/_color-theme-solarized.icon.png</iconURL>
        <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
        <license>The MIT License</license>
        <minVersion>1.4.7</minVersion>
        </KeySnailPlugin>;

(function () {
    if (share.colorThemeSolarized)
        style.unregister(share.colorThemeSolarized);

    // http://ethanschoonover.com/solarized
    const $base03   = "#002b36";
    const $base02   = "#073642";
    const $base01   = "#586e75";
    const $base00   = "#657b83";
    const $base0    = "#839496";
    const $base1    = "#93a1a1";
    const $base2    = "#eee8d5";
    const $base3    = "#fdf6e3";
    const $yellow   = "#b58900";
    const $orange   = "#cb4b16";
    const $red      = "#dc322f";
    const $magenta  = "#d33682";
    const $violet   = "#6c71c4";
    const $blue     = "#268bd2";
    const $cyan     = "#2aa198";
    const $green    = "#859900";

    function arrange(seed) {
        let colors = [
            ["%FG%"              , $base0],
            ["%FG_SELECTED_ROW%" , $base0],
            ["%BG%"              , $base03],
            ["%BG_SELECTED_ROW%" , $base02],
            ["%BG_INPUT%"        , $base02],
            ["%BG_INPUT_FOCUS%"  , $base02],
            ["%FG_MESSAGE%"      , $orange],
            ["%FG_HOVER%"        , $orange],
            ["%FG_HEADER%"       , $magenta],
            ["%BORDER_HEADER%"   , $magenta],
            ["%BORDER_BOTTOM%"   , $magenta],
            ["%LINK_BASE%"       , $blue],
            ["%LINK_HOVER%"      , $blue]
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

    function color(colorName) "color:" + colorName + ";";

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

    for (let [prefix, opts] in Iterator(ooo))
        for (let [k, v] in Iterator(opts))
            plugins.options[prefix + "." + k] = arrange(v);

    let colorThemeSolarized = arrange(<><![CDATA[
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

    .ks-text-link       { color : %LINK_BASE% !important; }
    .ks-text-link:hover { color : %LINK_HOVER% !important; }

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
        font-size                 : 110% !important;
        font-weight               : bold                      !important;
        padding                   : 2px                       !important;
        color                     : %FG_HEADER%               !important;
        border-bottom             : 1px solid %BORDER_HEADER% !important;
        -moz-border-bottom-colors : %BORDER_HEADER%           !important;
        margin-bottom             : 4px                       !important;
    }
    ]]></>.toString());

    share.colorThemeSolarized = colorThemeSolarized;
    style.register(share.colorThemeSolarized);
})();
