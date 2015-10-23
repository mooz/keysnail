#!/bin/sh

# copy hash for creating update info
HASH=`shasum -a 1 keysnail.xpi | sed s'/[ ].*$//'`
echo sha1:$HASH | xsel -ib
mv update.rdf update.rdf.bak
sed -e "s/em:updateHash=\".*\"/em:updateHash=\"sha1:$HASH\"/" update.rdf.bak > update.rdf
