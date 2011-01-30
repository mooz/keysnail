#!/usr/bin/zsh

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
    locale/**/*.*~(*~) \
    skin/**/*.*~(*~|*.svg)

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

# copy hash for creating update info
HASH=`shasum -a 1 keysnail.xpi | sed s'/[ ].*$//'`
echo sha1:$HASH | xsel -ib
mv update.rdf update.rdf.bak
sed -e "s/em:updateHash=\".*\"/em:updateHash=\"sha1:$HASH\"/" update.rdf.bak > update.rdf

