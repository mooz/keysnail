KeySnail
========

KeySnail doesn't support Firefox57+
-----------------------------------

Since Firefox 57 dropped several important features required by KeySnail (or Vimperator), there is no chance to migrate KeySnail to Firefox 57+ for now.

The most important feature, which has been unfortunately dropped in Firefox 57+, is API for overriding browser-level shortcut keys. See https://bugzilla.mozilla.org/show_bug.cgi?id=1215061 for details. Since current API only allows content-level shortcut keys, KeySnail doesn't work in most of the places including location bars, search field, and so forth.

If you want to keep using KeySnail, I recommend using Waterfox https://www.waterfoxproject.org/ instead of Firefox. Several KeySnail users have already reported that they are enjoying Waterfox.

Another option is to switch to other add-ons that still work in Firefox 57+. I tried several add-ons and personally recommend Vimium-ff https://addons.mozilla.org/en-US/firefox/addon/vimium-ff/

Thanks for using KeySnail! Without your encouraging reactions, I couldn't enjoy such a long-time lasting development.

mooz

About
-----

KeySnail is an add-on for Mozilla Firefox that aims to be a competitor
and lightweight alternative to
[Vimperator](http://www.vimperator.org/vimperator). Unlike Vimperator,
*KeySnail provides comfortable browsing experience for Emacs users*,
but its target users are not limited to.

See https://github.com/mooz/keysnail/wiki for details.

How to release
--------------

1. Update the package version by `./set_version_info.rb X.Y.Z`
2. Rebuild the package by `./createpackage.sh`
3. Sign `keysnail.xpi` file in addons.mozilla.org
4. Replace `keysnail.xpi` with signed one, and update hash information in `update.rdf` by `./updatehash.sh`
5. Update signature information in `update.rdf` for auto-updating by `mccoy`
6. Push changes to GitHub

