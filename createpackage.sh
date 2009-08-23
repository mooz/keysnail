#!/usr/bin/zsh

setopt extended_glob

# content/resources/*.*~(*~|.svn/*) \

./generate-init-file.py ja emacs > ./content/resources/.keysnail.js.emacs.ja
./generate-init-file.py en emacs > ./content/resources/.keysnail.js.emacs.en

./generate-init-file.py ja empty > ./content/resources/.keysnail.js.ja
./generate-init-file.py en empty > ./content/resources/.keysnail.js.en

rm -f chrome/keysnail.jar
jar cvf0 chrome/keysnail.jar \
    content/*.{js,xul}~(*~|.svn/*) \
    content/resources/{.*~*~,*~*~} \
    content/modules/*.js~(*~|.svn/*) \
    locale/**/*.*~(*~|.svn/*) \
    skin/**/*.*~(*~|*.svg|.svn/*)

rm -f keysnail.xpi
zip -r -9 keysnail.xpi \
    chrome/keysnail.jar \
    defaults/**/*.*~(*~|.svn/*) \
    install.rdf \
    components/*.js~*~
cp chrome.manifest.pack /tmp/chrome.manifest
zip -j -9 keysnail.xpi /tmp/chrome.manifest
