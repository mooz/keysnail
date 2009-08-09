#!/usr/bin/zsh

setopt extended_glob

# content/resources/*.*~(*~|.svn/*) \

./generate-init-file.py ja > ./content/resources/.keysnail.js.ja
./generate-init-file.py en > ./content/resources/.keysnail.js.en

rm -f chrome/keysnail.jar
jar cvf0 chrome/keysnail.jar \
    content/*.*~(*~|.svn/*) \
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
