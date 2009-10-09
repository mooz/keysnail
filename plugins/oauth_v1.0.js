/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is FireUploader
*
* The Initial Developer of the Original Code is Rahul Jonna.
*
* Portions created by the Initial Developer are Copyright (C) 2007-2009
* the Initial Developer. All Rights Reserved.
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

var SoundCloud = {};

(function()
{
    /**
    * USAGE:
    * 
    * @param {Object} loginUrl - The webpage url for login
    * @param {Object} apiUrl - The api end point
    * @param {Object} apiKey
    * @param {Object} secretKey
    * @param {Object} additionalParams - Additional parameters to send if any, like version number etc
    * @param {Object} afterAuthorizeCallback - callback function that is called after authentication
    *
    * var oAuth = new SoundCloud.OAuth("http://api.soundcloud.com/oauth/authorize", "http://api.soundcloud.com/", 
    *	"your_api_key", "your_api_secret", {"version": "1.0"}, function(oauthObj) {});
    * oAuth.startAuthentication(); 
    *	
    * At the end, oauthObj.accessToken and oauthObj.accessTokenSecret will have the access token and token secret respectively
    *
    */
    function x_OAuth(loginUrl, apiUrl, apiKey, secretKey, additionalParams, afterAuthorizeCallback)
    {
        this.loginUrl = loginUrl;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.secretKey = secretKey;

        this.requestToken;
        this.accessToken;

        this.requestTokenSecret;
        this.accessTokenSecret;

        this.afterAuthorizeCallback = afterAuthorizeCallback;
        this.userName;

        for (var key in additionalParams)
            this[key] = additionalParams[key];
    }

    x_OAuth.prototype = {

        //starts the authentication process	
        startAuthentication: function()
        {
            this.getRequestToken();
        },

        getParamString: function(params)
        {
            var arr = [], i = 0;
            for (var key in params)
            {
                arr[i++] = key + "=" + params[key];
            }
            return arr.join("&");
        },

        //encodes the special characters according to the RFC standard
        rfcEncoding: function(str)
        {
            var tmp = encodeURIComponent(str);
            tmp = tmp.replace('!', '%21');
            tmp = tmp.replace('*', '%2A');
            tmp = tmp.replace('(', '%28');
            tmp = tmp.replace(')', '%29');
            tmp = tmp.replace("'", '%27');
            return tmp;
        },

        //assigns the common parameters for all requests
        getCommonParams: function(params)
        {
            params = params || [];
            params["oauth_consumer_key"] = this.apiKey;
            params["oauth_timestamp"] = Math.ceil((new Date()).getTime() / 1000);
            params["oauth_nonce"] = (new Date()).getTime();
            params["oauth_version"] = this.version;
            if (this.format)
                params["format"] = this.format;
            params["oauth_signature_method"] = "HMAC-SHA1";

            return params;
        },

        getSecretKey: function(tokenType)
        {
            return this.secretKey +
			"&" +
			((tokenType == "beforeAuthentication") ? "" : ((tokenType == "request") ? this.requestTokenSecret : this.accessTokenSecret));
        },

        //makes the signature using SHA1 algorithm
        getSignature: function(method, url, paramString, tokenType)
        {
            var stringToSign = [this.rfcEncoding(method), this.rfcEncoding(url), this.rfcEncoding(paramString)].join("&");
            return Soundcloud.SHA1.b64_hmac_sha1(this.getSecretKey(tokenType), stringToSign);
        },

        //gets the request token
        getRequestToken: function()
        {
            var params = this.getCommonParams();

            var url = this.apiUrl + "oauth/request_token";
            var paramString = this.normalizeParams(params);
            var method = "POST";
            var signature = this.getSignature(method, url, paramString, "beforeAuthentication");
            paramString += "&oauth_signature=" + this.rfcEncoding(signature);

            Soundcloud.xhttp.doRequest(method, url, paramString, "", false, null, this, function(objResponse)
            {
                if (!objResponse.hasErrors)
                {
                    objResponse.responseText = Soundcloud.utils.trimWhitespace(objResponse.responseText) + "&";
                    var reg1 = /oauth_token=(.*?)&/gi;
                    var reg2 = /oauth_token_secret=(.*?)&/gi;
                    var arrToken = reg1.exec(objResponse.responseText);
                    if (arrToken)
                    {
                        this.requestToken = arrToken[1];
                        this.showLoginPage(arrToken[1]);
                    }
                    else
                        throw new Error("Failed to get request token");

                    var arrTokenSecret = reg2.exec(objResponse.responseText);
                    if (arrTokenSecret)
                        this.requestTokenSecret = arrTokenSecret[1];
                    else
                        throw new Error("Failed to get request token");
                }
                else
                    throw new Error("Failed to get request token");
            });
        },

        //get access token
        getAccessToken: function(token)
        {
            var params = this.getCommonParams();
            params["oauth_token"] = token;
            var url = this.apiUrl + "oauth/access_token";
            var paramString = this.normalizeParams(params);
            var method = "POST";
            var signature = this.getSignature(method, url, paramString, "request");
            paramString += "&oauth_signature=" + this.rfcEncoding(signature);

            Soundcloud.xhttp.doRequest(method, url, "", paramString, false, null, this, function(objResponse)
            {
                if (!objResponse.hasErrors)
                {
                    var tokenList = objResponse.responseText.split("&");

                    var reg1 = /oauth_token=(.*)/gi;
                    var reg2 = /oauth_token_secret=(.*)/gi;

                    var accessToken, tokenSecret;
                    var arrToken = reg1.exec(tokenList[0]);
                    if (arrToken)
                    {
                        this.accessToken = arrToken[1];
                    }
                    else
                    {
                        throw new Error("Failed to get access token. Check if your username and password is valid.");
                    }
                    var arrTokenSecret = reg2.exec(tokenList[1]);
                    if (arrTokenSecret)
                    {
                        this.accessTokenSecret = arrTokenSecret[1];
                    }
                    else
                    {
                        throw new Error("Failed to get access token. Check if your username and password is valid.");
                    }
                    if (this.afterAuthorizeCallback)
                    {
                        this.afterAuthorizeCallback.call(null, this);
                    }
                }
                else
                    throw new Error("Failed to get access token. Check if your username and password is valid.");
            });
        },

        //sorts the parameters and creats a GET string to be sent to the server
        normalizeParams: function(params)
        {
            for (var key in params)
                params[key] = this.rfcEncoding(params[key]);

            return Soundcloud.utils.join("&", "=", params, true);
        },

        //show the login page
        showLoginPage: function(token)
        {
            // var doneAuthorizing = false;

            // var callbackFunc = function(isDone)
            // {
            //     doneAuthorizing = isDone;
            // };

            var url = this.loginUrl + "?oauth_token=" + token;

            let self = this;
            prompt.read("Press Enter When Authorization is Done:", function (aStr) {
                            if (aStr != null)
                                self.getAccessToken(token);
                        });

            // window.openDialog("chrome://fireuploader/content/loginPanel.xul", "Login/Authorization Panel", "chrome,centerscreen,modal,width=350,height=400", url, callbackFunc);
        }
    };

    this.OAuth = x_OAuth;

    this.utils = {
        join: function(separator1, separator2, arr, sort)
        {
            var arrKeys = [];
            for (var key in arr)
            {
                arrKeys.push(key);
            }
            if (sort)
                arrKeys.sort();

            var newArr = [];
            for (var i = 0; i < arrKeys.length; i++)
            {
                if (separator2 != "")
                {
                    newArr.push(arrKeys[i] + separator2 + arr[arrKeys[i]]);
                }
                else
                {
                    newArr.push(arrKeys[i]);
                    newArr.push(arr[arrKeys[i]]);
                }
            }

            return newArr.join(separator1);
        },

        // Remove leading and trailing whitespace from a string
        trimWhitespace: function(str)
        {
            return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
        }
    }

    this.xhttp = {
        //a wrapper to XMLHttpRequest object

        /**
        * @param {string} verb - GET, POST, PUT, DELETE
        * @param {string} resLoc - Url of the resource
        * @param {string} getData - Data that's sent in the url
        * @param {string} objData - Data that's sent during POST, PUT
        * @param {bool} isSync - whether to make a syncronous or asynchronous request
        * @param {Object} arrHeaders - array of headers(name, value pairs) that's sent in the request 
        * @param {Object} callbackObject - scope of the callback function
        * @param {Object} callbackFunc - callback function that's called after asyncronous response
        */
        doRequest: function(verb, resLoc, getData, objData, isSync, arrHeaders, callbackObject, callbackFunc)
        {
            try
            {
                var xmlhttp = new XMLHttpRequest();
                if (getData != "")
                    getData = "?" + getData;

                resLoc = encodeURI(resLoc);
                var aUrl = (resLoc.indexOf("http") == -1) ? this.host + resLoc + getData : resLoc + getData;
                xmlhttp.open(verb, aUrl, !isSync);

                if (verb == "POST")
                    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');

                if (arrHeaders instanceof Array)
                {
                    for (var i = 0; i < arrHeaders.length; i++)
                    {
                        xmlhttp.setRequestHeader(arrHeaders[i].name, arrHeaders[i].value);
                    }
                }

                xmlhttp.send(objData);

                var domParser = new DOMParser(); //Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
                if (isSync)
                {
                    if (xmlhttp.status >= 200 && xmlhttp.status < 300)
                    {
                        try
                        {
                            var xmlDoc1 = domParser.parseFromString(xmlhttp.responseText, "text/xml");
                        }
                        catch (ex)
								{ }

                        var responseObject = {
                            responseText: xmlhttp.responseText,
                            xmlDoc: xmlDoc1,
                            strHeaders: xmlhttp.getAllResponseHeaders()
                        };
                        callbackFunc.call(callbackObject, responseObject);
                        return responseObject;
                    }
                    else
                    {

                        try
                        {
                            var xmlDoc1 = domParser.parseFromString(xmlhttp.responseText, "text/xml");
                        }
                        catch (ex2)
                        {
                            alert(ex2);
                        }
                        var errorMessage = "Error connecting! Try again - " + xmlhttp.status + " " + xmlhttp.statusText;

                        if (xmlDoc1 != null && xmlDoc1.getElementsByTagName("Message")[0])
                            errorMessage = xmlDoc1.getElementsByTagName("Message")[0].firstChild.nodeValue;

                        var responseObject = {
                            responseText: xmlhttp.responseText,
                            xmlDoc: xmlDoc1,
                            strHeaders: xmlhttp.getAllResponseHeaders(),
                            errorMessage: errorMessage,
                            hasErrors: true
                        };

                        callbackFunc.call(callbackObject, responseObject);

                        return false;
                    }
                }
                else
                {
                    xmlhttp.onreadystatechange = function()
                    {
                        if (xmlhttp.readyState != 4)
                            return;
                        else
                        {
                            if (xmlhttp.status >= 200 && xmlhttp.status < 300)
                            {
                                try
                                {
                                    var xmlDoc1 = domParser.parseFromString(xmlhttp.responseText, "text/xml");
                                }
                                catch (ex)
								{ }
                                var responseObject = {
                                    responseText: xmlhttp.responseText,
                                    xmlDoc: xmlDoc1,
                                    strHeaders: xmlhttp.getAllResponseHeaders()
                                };
                                callbackFunc.call(callbackObject, responseObject);
                            }
                            else
                            {
                                try
                                {
                                    var xmlDoc1 = domParser.parseFromString(xmlhttp.responseText, "text/xml");
                                }
                                catch (ex)
								{ }
                                var errorMessage = "Error connecting! Try again - " + xmlhttp.status + " " + xmlhttp.statusText;
                                if (xmlDoc1 != null && xmlDoc1.getElementsByTagName("Message")[0])
                                    errorMessage = xmlDoc1.getElementsByTagName("Message")[0].firstChild.nodeValue;

                                var responseObject = {
                                    responseText: xmlhttp.responseText,
                                    xmlDoc: xmlDoc1,
                                    strHeaders: xmlhttp.getAllResponseHeaders(),
                                    errorMessage: errorMessage,
                                    hasErrors: true
                                };
                                callbackFunc.call(callbackObject, responseObject);
                            }
                        }
                    }
                }
            }
            catch (ex)
            {
                alert(ex);
            }
        }
    }

    this.SHA1 =
    {
        /*
        * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
        * in FIPS PUB 180-1
        * Version 2.1a Copyright Paul Johnston 2000 - 2002.
        * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
        * Distributed under the BSD License
        * See http://pajhome.org.uk/crypt/md5 for details.  
        */

        /*
        * Configurable variables. You may need to tweak these to be compatible with
        * the server-side, but the defaults work in most cases.
        */
        hexcase: 0,  /* hex output format. 0 - lowercase; 1 - uppercase        */
        b64pad: "=", /* base-64 pad character. "=" for strict RFC compliance   */
        chrsz: 8,  /* bits per input character. 8 - ASCII; 16 - Unicode      */

        /*
        * These are the functions you'll usually want to call
        * They take string arguments and return either hex or base-64 encoded strings
        */
        hex_sha1: function(s) { return this.binb2hex(this.core_sha1(this.str2binb(s), s.length * this.chrsz)); },
        b64_sha1: function(s) { return this.binb2b64(this.core_sha1(this.str2binb(s), s.length * this.chrsz)); },
        str_sha1: function(s) { return this.binb2str(this.core_sha1(this.str2binb(s), s.length * this.chrsz)); },
        hex_hmac_sha1: function(key, data) { return this.binb2hex(this.core_hmac_sha1(key, data)); },
        b64_hmac_sha1: function(key, data) { return this.binb2b64(this.core_hmac_sha1(key, data)); },
        str_hmac_sha1: function(key, data) { return this.binb2str(this.core_hmac_sha1(key, data)); },

        /*
        * Perform a simple self-test to see if the VM is working
        */
        sha1_vm_test: function()
        {
            return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
        },

        /*
        * Calculate the SHA-1 of an array of big-endian words, and a bit length
        */
        core_sha1: function(x, len)
        {
            /* append padding */
            x[len >> 5] |= 0x80 << (24 - len % 32);
            x[((len + 64 >> 9) << 4) + 15] = len;

            var w = Array(80);
            var a = 1732584193;
            var b = -271733879;
            var c = -1732584194;
            var d = 271733878;
            var e = -1009589776;

            for (var i = 0; i < x.length; i += 16)
            {
                var olda = a;
                var oldb = b;
                var oldc = c;
                var oldd = d;
                var olde = e;

                for (var j = 0; j < 80; j++)
                {
                    if (j < 16) w[j] = x[i + j];
                    else w[j] = this.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                    var t = this.safe_add(this.safe_add(this.rol(a, 5), this.sha1_ft(j, b, c, d)),
						    this.safe_add(this.safe_add(e, w[j]), this.sha1_kt(j)));
                    e = d;
                    d = c;
                    c = this.rol(b, 30);
                    b = a;
                    a = t;
                }

                a = this.safe_add(a, olda);
                b = this.safe_add(b, oldb);
                c = this.safe_add(c, oldc);
                d = this.safe_add(d, oldd);
                e = this.safe_add(e, olde);
            }
            return Array(a, b, c, d, e);
        },

        /*
        * Perform the appropriate triplet combination function for the current
        * iteration
        */
        sha1_ft: function(t, b, c, d)
        {
            if (t < 20) return (b & c) | ((~b) & d);
            if (t < 40) return b ^ c ^ d;
            if (t < 60) return (b & c) | (b & d) | (c & d);
            return b ^ c ^ d;
        },

        /*
        * Determine the appropriate additive constant for the current iteration
        */
        sha1_kt: function(t)
        {
            return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 :
			    (t < 60) ? -1894007588 : -899497514;
        },

        /*
        * Calculate the HMAC-SHA1 of a key and some data
        */
        core_hmac_sha1: function(key, data)
        {
            var bkey = this.str2binb(key);
            if (bkey.length > 16) bkey = this.core_sha1(bkey, key.length * this.chrsz);

            var ipad = Array(16), opad = Array(16);
            for (var i = 0; i < 16; i++)
            {
                ipad[i] = bkey[i] ^ 0x36363636;
                opad[i] = bkey[i] ^ 0x5C5C5C5C;
            }

            var hash = this.core_sha1(ipad.concat(this.str2binb(data)), 512 + data.length * this.chrsz);
            return this.core_sha1(opad.concat(hash), 512 + 160);
        },

        /*
        * Add integers, wrapping at 2^32. This uses 16-bit operations internally
        * to work around bugs in some JS interpreters.
        */
        safe_add: function(x, y)
        {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        },

        /*
        * Bitwise rotate a 32-bit number to the left.
        */
        rol: function(num, cnt)
        {
            return (num << cnt) | (num >>> (32 - cnt));
        },

        /*
        * Convert an 8-bit or 16-bit string to an array of big-endian words
        * In 8-bit function, characters >255 have their hi-byte silently ignored.
        */
        str2binb: function(str)
        {
            var bin = Array();
            var mask = (1 << this.chrsz) - 1;
            for (var i = 0; i < str.length * this.chrsz; i += this.chrsz)
                bin[i >> 5] |= (str.charCodeAt(i / this.chrsz) & mask) << (32 - this.chrsz - i % 32);
            return bin;
        },

        /*
        * Convert an array of big-endian words to a string
        */
        binb2str: function(bin)
        {
            var str = "";
            var mask = (1 << this.chrsz) - 1;
            for (var i = 0; i < bin.length * 32; i += this.chrsz)
                str += String.fromCharCode((bin[i >> 5] >>> (32 - this.chrsz - i % 32)) & mask);
            return str;
        },

        /*
        * Convert an array of big-endian words to a hex string.
        */
        binb2hex: function(binarray)
        {
            var hex_tab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
            var str = "";
            for (var i = 0; i < binarray.length * 4; i++)
            {
                str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
			    hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
            }
            return str;
        },

        /*
        * Convert an array of big-endian words to a base-64 string
        */
        binb2b64: function(binarray)
        {
            var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var str = "";
            for (var i = 0; i < binarray.length * 4; i += 3)
            {
                var triplet = (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16)
					    | (((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8)
					    | ((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF);
                for (var j = 0; j < 4; j++)
                {
                    if (i * 8 + j * 6 > binarray.length * 32) str += this.b64pad;
                    else str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
                }
            }
            return str;
        }
    }
}).call(SoundCloud);

