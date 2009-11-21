#!/usr/bin/zsh

setopt extended_glob

## ================================ ##

# generate documentaion
# ./generate-init-file.py ja doc > ./content/resources/.keysnail.js.doc.ja
# ./generate-init-file.py en doc > ./content/resources/.keysnail.js.doc.en

# # generate emacs key scheme
# ./generate-init-file.py ja emacs > ./content/resources/.keysnail.js.emacs.ja
# ./generate-init-file.py en emacs > ./content/resources/.keysnail.js.emacs.en

# # generate empty init file
# ./generate-init-file.py ja empty > ./content/resources/.keysnail.js.ja
# ./generate-init-file.py en empty > ./content/resources/.keysnail.js.en

## ================================ ##

# create jar file
rm -f chrome/keysnail.jar
jar cvf0 chrome/keysnail.jar \
    content/*.{js,xul,xhtml}~(*~|.svn/*) \
    content/resources/*~*~ \
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
