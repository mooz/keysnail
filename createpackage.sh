#!/usr/bin/env zsh

setopt extended_glob

## ================================ ##

function remove() {
    echo "<$1>"
    if [ -e $1 ]; then
        rm -f $1
    fi
}

# create jar file

if ! [ -e chrome ]; then
    mkdir chrome
fi

echo "====================== Create jar file ========================="

remove chrome/keysnail.jar
zip -r -0 chrome/keysnail.jar \
    content/*.{js,xul,xhtml}~(*~) \
    content/resources/*~*~ \
    content/prettifier/*~*~ \
    content/modules/*.js~(*~) \
    content/images/*.png~(*~) \
    locale/**/*.*~(*~) \
    skin/**/*.*~(*~|*.svg) \
    skin/**/filter.svg

echo "====================== Create xpi file ========================="

# create xpi file
remove keysnail.xpi
zip -r -9 keysnail.xpi \
    chrome/keysnail.jar \
    defaults/**/*.*~(*~) \
    install.rdf \
    share/*.js~(*~) \
    schemes/*.js~(*~) \
    components/*.js~*~
cp chrome.manifest.pack /tmp/chrome.manifest
zip -j -9 keysnail.xpi /tmp/chrome.manifest

## ================================ ##

./updatehash.sh
