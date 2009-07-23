#!/usr/bin/zsh

setopt extended_glob

# content/resources/*.*~(*~|.svn/*) \

rm -f chrome/keysnail.jar
jar cvf0 chrome/keysnail.jar \
    content/**/*.*~(*~|.svn/*) \
    locale/**/*.*~(*~|.svn/*) \
    skin/**/*.*~(*~|*.svg|.svn/*)

rm -f keysnail.xpi
zip -r -9 keysnail.xpi chrome/keysnail.jar defaults/**/*.*~(*~|.svn/*) install.rdf
cp chrome.manifest.pack /tmp/chrome.manifest
zip -j -9 keysnail.xpi /tmp/chrome.manifest
