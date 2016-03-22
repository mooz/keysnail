let PLUGIN_INFO =
        <KeySnailPlugin>
        <name>Color Theme Solarized</name>
        <description>A color scheme inspired by Solarized</description>
        <version>0.0.3</version>
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
            ["%FG%"              , $base1],
            ["%FG_SELECTED_ROW%" , $base3],
            ["%BG%"              , $base03],
            ["%BG_SELECTED_ROW%" , $base01],
            ["%BG_INPUT%"        , $base02],
            ["%BG_INPUT_FOCUS%"  , $base02],
            ["%FG_MESSAGE%"      , $green],
            ["%FG_HOVER%"        , $green],
            ["%FG_HEADER%"       , $magenta],
            ["%BORDER_HEADER%"   , $magenta],
            ["%BORDER_BOTTOM%"   , $magenta],
            ["%LINK_BASE%"       , $blue],
            ["%LINK_HOVER%"      , $cyan]
        ];

        colors.forEach(function ([k, v]) { seed = seed.replace(k, v, "g"); } );
        return seed;
    }

    function color(colorName) "color:" + colorName + ";";

    let ooo = {
        "twitter_client": {
            "unread_message_style"                  : "text-decoration:underline;",
            "normal_tweet_style"                    : "color:%FG%;",
            "my_tweet_style"                        : color($blue),
            "reply_to_me_style"                     : color($magenta),
            "retweeted_status_style"                : color($green),
            "selected_row_style"                    : "color:%FG_SELECTED_ROW%; background-color:%BG_SELECTED_ROW%;",
            "selected_user_style"                   : "color:%FG%; background-color:rgba(60,76,82,0.4);",
            "selected_user_reply_to_style"          : "color:%FG%; background-color:rgba(82,60,76,0.4);",
            "selected_user_reply_to_reply_to_style" : "color:%FG%; background-color:rgba(79,60,82,0.4);",
            "search_result_user_name_style"         : "color:%FG_MESSAGE%;"
        }
    };

    style.prompt["default"]     = color($base0);
    style.prompt["description"] = color($base1);
    style.prompt["url"]         = color($cyan) + "text-decoration:underline;";
    style.prompt["engine"]      = color($blue);
    style.prompt["bookmark"]    = color($orange);
    style.prompt["history"]     = color($green);

    style.js["function"]  = color($blue);
    style.js["object"]    = color($orange);
    style.js["string"]    = color($green);
    style.js["xml"]       = color($violet);
    style.js["number"]    = color($magenta);
    style.js["boolean"]   = color($yellow);
    style.js["undefined"] = color($red);
    style.js["null"]      = color($cyan);

    for (let [prefix, opts] of util.keyValues(ooo))
        for (let [k, v] of util.keyValues(opts))
            plugins.options[prefix + "." + k] = arrange(v);

    let colorThemeSolarized = arrange('\
    /* font size */                                                                                              \
    #keysnail-prompt,                                                                                            \
    #keysnail-prompt textbox,                                                                                    \
    listbox#keysnail-completion-list,                                                                            \
    listbox#keysnail-completion-list listheader,                                                                 \
    #keysnail-twitter-client-user-tweet                                                                          \
    {                                                                                                            \
        font-size : 110% !important;                                                                             \
    }                                                                                                            \
                                                                                                                 \
    /* charm */                                                                                                  \
    #keysnail-prompt,                                                                                            \
    #keysnail-prompt textbox,                                                                                    \
    listbox#keysnail-completion-list,                                                                            \
    listbox#keysnail-completion-list listitem,                                                                   \
    listbox#keysnail-completion-list listheader,                                                                 \
    #keysnail-twitter-client-user-tweet                                                                          \
    {                                                                                                            \
        -moz-appearance  : none !important;                                                                      \
        border           : none !important;                                                                      \
    }                                                                                                            \
                                                                                                                 \
    /* basic */                                                                                                  \
    #keysnail-prompt,                                                                                            \
    #keysnail-prompt textbox,                                                                                    \
    listbox#keysnail-completion-list,                                                                            \
    listbox#keysnail-completion-list listheader,                                                                 \
    #keysnail-twitter-client-user-tweet                                                                          \
    {                                                                                                            \
        font-family      : "Consolas", "Bitstream Vera Sans Mono", "Menlo", "Courier New", monospace !important; \
        background-color : %BG% !important;                                                                      \
        color            : %FG% !important;                                                                      \
    }                                                                                                            \
                                                                                                                 \
    listbox#keysnail-completion-list listitem                                                                    \
    {                                                                                                            \
        padding-left : 4px !important;                                                                           \
    }                                                                                                            \
                                                                                                                 \
    .ks-text-link       { color : %LINK_BASE% !important; }                                                      \
    .ks-text-link:hover { color : %LINK_HOVER% !important; }                                                     \
                                                                                                                 \
    /* selected row */                                                                                           \
    listbox#keysnail-completion-list listitem[selected="true"],                                                  \
    listbox#keysnail-completion-list:focus > listitem[selected="true"]                                           \
    {                                                                                                            \
        background-color : %BG_SELECTED_ROW% !important;                                                         \
        color            : %FG_SELECTED_ROW% !important;                                                         \
    }                                                                                                            \
                                                                                                                 \
    #keysnail-prompt textbox                                                                                     \
    {                                                                                                            \
        margin             : 5px 0px    !important;                                                              \
        -moz-border-radius : 3px        !important;                                                              \
        border-radius      : 3px        !important;                                                              \
        padding            : 2px        !important;                                                              \
    }                                                                                                            \
                                                                                                                 \
    #keysnail-prompt textbox                                                                                     \
    {                                                                                                            \
        padding-left       : 0.5em      !important;                                                              \
        background-color   : %BG_INPUT% !important;                                                              \
    }                                                                                                            \
                                                                                                                 \
    #keysnail-prompt textbox:focus                                                                               \
    {                                                                                                            \
        background-color   : %BG_INPUT_FOCUS% !important;                                                        \
    }                                                                                                            \
                                                                                                                 \
    /* Prompt message */                                                                                         \
    .keysnail-prompt-label                                                                                       \
    {                                                                                                            \
        color : %FG_MESSAGE% !important;                                                                         \
    }                                                                                                            \
                                                                                                                 \
    /* Bottom line */                                                                                            \
    listbox#keysnail-completion-list                                                                             \
    {                                                                                                            \
        border-bottom : 1px solid %FG_HEADER% !important;                                                        \
        margin        : 0px                   !important;                                                        \
    }                                                                                                            \
                                                                                                                 \
    /* Header */                                                                                                 \
    listbox#keysnail-completion-list listhead                                                                    \
    {                                                                                                            \
        padding                   : 2px 0px                   !important;                                        \
        margin                    : 2px 0px 4px 0px           !important;                                        \
        border-bottom             : 1px solid %BORDER_HEADER% !important;                                        \
        -moz-border-bottom-colors : %BORDER_HEADER%           !important;                                        \
    }                                                                                                            \
                                                                                                                 \
    /* Header Cell */                                                                                            \
    listbox#keysnail-completion-list listheader {                                                                \
        font-weight               : bold                      !important;                                        \
        color                     : %FG_HEADER%               !important;                                        \
    }                                                                                                            \
                                                                                                                 \
    /* Completion List */                                                                                        \
    listbox#keysnail-completion-list listcell                                                                    \
    {                                                                                                            \
        padding: 2px 0px !important;                                                                             \
    }');

    share.colorThemeSolarized = colorThemeSolarized;
    style.register(share.colorThemeSolarized);
})();
