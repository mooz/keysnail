KeySnail
========

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

