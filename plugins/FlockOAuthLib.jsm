// BEGIN FLOCK GPL
//
// Copyright Flock Inc. 2005-2009
// http://flock.com
//
// This file may be used under the terms of the
// GNU General Public License Version 2 or later (the "GPL"),
// http://www.gnu.org/licenses/gpl.html
//
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
//
// END FLOCK GPL

var EXPORTED_SYMBOLS = ["OAuthSignatureMethod_HMAC_SHA1",
                        "OAuthToken",
                        "OAuthConsumer",
                        "OAuthRequest"];

/** Constructor */
function OAuthSignatureMethod_HMAC_SHA1() {
}

OAuthSignatureMethod_HMAC_SHA1.prototype = {
    get name() {
        return "HMAC-SHA1";
    },

    buildSignature: function osig_BS(aRequest, aConsumer, aToken) {
        signature = [
            OAuthRequest.encode(aRequest.httpMethod),
            OAuthRequest.encode(aRequest.normalizedHttpUrl),
            OAuthRequest.encode(aRequest.signableParameters)
        ];

        key = OAuthRequest.encode(aConsumer.secret) + "&";

        if (aToken) {
            key += OAuthRequest.encode(aToken.secret);
        }

        raw = signature.join("&");

        var finalSig = this._hmacSHA1(raw, key);

        return finalSig;
    },

    _hmacSHA1: function osig_hmacSHA1(aData, aSecret) {
        const CC = Components.classes;
        const CI = Components.interfaces;

        var uconv = CC["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(CI.nsIScriptableUnicodeConverter);
        uconv.charset = "utf-8";
        
        var dataarray = uconv.convertToByteArray(aData, []);
        
        var keyObject = CC["@mozilla.org/security/keyobjectfactory;1"]
            .getService(CI.nsIKeyObjectFactory)
            .keyFromString(CI.nsIKeyObject.HMAC, aSecret);
        
        var cryptoHMAC = CC["@mozilla.org/security/hmac;1"]
            .createInstance(CI.nsICryptoHMAC);
        cryptoHMAC.init(CI.nsICryptoHMAC.SHA1, keyObject);
        cryptoHMAC.update(dataarray, dataarray.length);
        return cryptoHMAC.finish(true);
    }
};


/** Constructor */
function OAuthToken(aKey, aSecret) {
    this.key = aKey;
    this.secret = aSecret;
}

OAuthToken.prototype = {
    toString: function otokTS() {
        return "oauth_token=" + OAuthRequest.encode(this.key)
            + "&oauth_token_secret=" + OAuthRequest.encode(this.secret);
    }
};


/** Constructor */
function OAuthConsumer(aKey, aSecret, aCallbackUrl) {
    this.key = aKey;
    this.secret = aSecret;
    this.callbackUrl = aCallbackUrl;
}


/** Constructor */
function OAuthRequest(aHttpMethod, aUrl, aParams) {
    this.httpMethod = aHttpMethod.toUpperCase();
    this.url = aUrl;
    this.params = (aParams) ? aParams : {};
}

OAuthRequest.prototype = {
    get normalizedHttpUrl() {
        return (this.url);
    },

    get signableParameters() {
        var sorted = this.params;

        var total = [];
        for (k in sorted) {
            if (k == "oauth_signature" || k == "realm") {
                continue;
            }
            // JMC - Workaround for bug in C# class
            // if (k == "oauth_token" && !sorted[k]) continue;
            total.push(k + "=" + OAuthRequest.encode(sorted[k]));
        }
        total.sort();
        return total.join("&");
    },

    get version() {
        return "1.0";
    },

    toUrl: function toUrl() {
        return (this.normalizedHttpUrl + "?" + this.toPostdata());
    },

    getPostData: function getPostData() {
        var postData = [];
        for (k in this.params) {
            postData[OAuthRequest.encode(k)] = OAuthRequest.encode(this.params[k]);
        }
        return postData.sort();
    },

    toPostdata: function toPostdata() {
        var postdata = [];
        for (k in this.params) {
            var encodedPair = OAuthRequest.encode(k) + "="
                + OAuthRequest.encode(this.params[k]);
            postdata.push(encodedPair);
        }
        postdata.sort();
        return postdata.join("&");
    },

    sign: function sign(aSignMethod, aConsumer, aToken) {
        this._setParameter("oauth_signature_method", aSignMethod.name);
        signature = this._buildSignature(aSignMethod, aConsumer, aToken);
        this._setParameter("oauth_signature", signature);
    },

    _buildSignature: function buildSignature(aSignMethod, aConsumer, aToken) {
        return aSignMethod.buildSignature(this, aConsumer, aToken);
    },

    _setParameter: function setParamter(aKey, aValue) {
        this.params[aKey] = aValue;
    }
};

OAuthRequest.fromConsumerAndToken =
    function oreqFCAT(aConsumer, aToken, aHttpMethod, aHttpUrl, aParams) {
        var outParams = (aParams) ? aParams : {};

        defaults = {
            //"oauth_version" : OAuthRequest.version,
            "oauth_nonce": OAuthRequest.generateNonce(),
            "oauth_timestamp": OAuthRequest.generateTimestamp(),
            "oauth_consumer_key": aConsumer.key
        };

        for (x in defaults) {
            if (!outParams[x]) {
                outParams[x] = defaults[x];
            }
        }

        if (aToken) {
            outParams["oauth_token"] = aToken.key;
        }

        return new OAuthRequest(aHttpMethod, aHttpUrl, outParams);
    };

OAuthRequest.generateNonce =
    function oreqGN() {
        var mt = parseInt(new Date().getTime());
        var rand = "foo" + Math.random();
        return mt + "-" + rand;
    };

OAuthRequest.generateTimestamp =
    function oreqGT() {
        return parseInt(new Date().getTime() / 1000);
    };

/**
 * Helper function to percent encode according to the OAuth specification.
 *
 * encodeURIComponent() does not escape these characters: - _ . ! ~ * ' ( )
 * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Functions:encodeURIComponent
 *
 * OAuth requires escaping all non-alpha-numeric characters except: - _ . ~
 * http://oauth.net/core/1.0/#encoding_parameters
 */
OAuthRequest.encode =
    function oreqE(aParam) {
        var param = encodeURIComponent(aParam);
        param = param.replace("!", "%21", "g")
            .replace("*", "%2A", "g")
            .replace("'", "%27", "g")
            .replace("(", "%28", "g")
            .replace(")", "%29", "g");

        return param;
    };
