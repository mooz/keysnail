#!/usr/bin/zsh

setopt extended_glob

## ================================ ##

# create jar file
rm -f chrome/keysnail.jar
zip -r -0 chrome/keysnail.jar \
    content/*.{js,xul,xhtml}~(*~|.svn/*) \
    content/resources/*~*~ \
    content/prettifier/*~*~ \
    content/modules/*.js~(*~|.svn/*) \
    locale/**/*.*~(*~|.svn/*) \
    skin/**/*.*~(*~|*.svg|.svn/*)

# create xpi file
rm -f keysnail.xpi
zip -r -9 keysnail.xpi \
    chrome/keysnail.jar \
    defaults/**/*.*~(*~|.svn/*) \
    install.rdf \
    share/*.js~(*~|.svn/*) \
    schemes/*.js~(*~|.svn/*) \
    components/*.js~*~
cp chrome.manifest.pack /tmp/chrome.manifest
zip -j -9 keysnail.xpi /tmp/chrome.manifest

## ================================ ##

# copy hash for creating update info
HASH=`shasum -a 1 keysnail.xpi | sed s'/[ ].*$//'`
echo sha1:$HASH | xsel -ib
mv update.rdf update.rdf.bak
sed -e "s/em:updateHash=\".*\"/em:updateHash=\"sha1:$HASH\"/" update.rdf.bak > update.rdf

