(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["account-account-module"],{

/***/ "./node_modules/adal-angular/lib/adal.js":
/*!***********************************************!*\
  !*** ./node_modules/adal-angular/lib/adal.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

//----------------------------------------------------------------------
// AdalJS v1.0.17
// @preserve Copyright (c) Microsoft Open Technologies, Inc.
// All Rights Reserved
// Apache License 2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//id
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//----------------------------------------------------------------------

var AuthenticationContext = (function () {

    'use strict';

    /**
     * Configuration options for Authentication Context.
     * @class config
     *  @property {string} tenant - Your target tenant.
     *  @property {string} clientId - Client ID assigned to your app by Azure Active Directory.
     *  @property {string} redirectUri - Endpoint at which you expect to receive tokens.Defaults to `window.location.href`.
     *  @property {string} instance - Azure Active Directory Instance.Defaults to `https://login.microsoftonline.com/`.
     *  @property {Array} endpoints - Collection of {Endpoint-ResourceId} used for automatically attaching tokens in webApi calls.
     *  @property {Boolean} popUp - Set this to true to enable login in a popup winodow instead of a full redirect.Defaults to `false`.
     *  @property {string} localLoginUrl - Set this to redirect the user to a custom login page.
     *  @property {function} displayCall - User defined function of handling the navigation to Azure AD authorization endpoint in case of login. Defaults to 'null'.
     *  @property {string} postLogoutRedirectUri - Redirects the user to postLogoutRedirectUri after logout. Defaults is 'redirectUri'.
     *  @property {string} cacheLocation - Sets browser storage to either 'localStorage' or sessionStorage'. Defaults to 'sessionStorage'.
     *  @property {Array.<string>} anonymousEndpoints Array of keywords or URI's. Adal will not attach a token to outgoing requests that have these keywords or uri. Defaults to 'null'.
     *  @property {number} expireOffsetSeconds If the cached token is about to be expired in the expireOffsetSeconds (in seconds), Adal will renew the token instead of using the cached token. Defaults to 300 seconds.
     *  @property {string} correlationId Unique identifier used to map the request with the response. Defaults to RFC4122 version 4 guid (128 bits).
     *  @property {number} loadFrameTimeout The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out.
     */

    /**
     * Creates a new AuthenticationContext object.
     * @constructor
     * @param {config}  config               Configuration options for AuthenticationContext
     */

    AuthenticationContext = function (config) {
        /**
         * Enum for request type
         * @enum {string}
         */
        this.REQUEST_TYPE = {
            LOGIN: 'LOGIN',
            RENEW_TOKEN: 'RENEW_TOKEN',
            UNKNOWN: 'UNKNOWN'
        };

        this.RESPONSE_TYPE = {
            ID_TOKEN_TOKEN: 'id_token token',
            TOKEN: 'token'
        };

        /**
         * Enum for storage constants
         * @enum {string}
         */
        this.CONSTANTS = {
            ACCESS_TOKEN: 'access_token',
            EXPIRES_IN: 'expires_in',
            ID_TOKEN: 'id_token',
            ERROR_DESCRIPTION: 'error_description',
            SESSION_STATE: 'session_state',
            ERROR: 'error',
            STORAGE: {
                TOKEN_KEYS: 'adal.token.keys',
                ACCESS_TOKEN_KEY: 'adal.access.token.key',
                EXPIRATION_KEY: 'adal.expiration.key',
                STATE_LOGIN: 'adal.state.login',
                STATE_RENEW: 'adal.state.renew',
                NONCE_IDTOKEN: 'adal.nonce.idtoken',
                SESSION_STATE: 'adal.session.state',
                USERNAME: 'adal.username',
                IDTOKEN: 'adal.idtoken',
                ERROR: 'adal.error',
                ERROR_DESCRIPTION: 'adal.error.description',
                LOGIN_REQUEST: 'adal.login.request',
                LOGIN_ERROR: 'adal.login.error',
                RENEW_STATUS: 'adal.token.renew.status',
                ANGULAR_LOGIN_REQUEST: 'adal.angular.login.request'
            },
            RESOURCE_DELIMETER: '|',
            CACHE_DELIMETER: '||',
            LOADFRAME_TIMEOUT: 6000,
            TOKEN_RENEW_STATUS_CANCELED: 'Canceled',
            TOKEN_RENEW_STATUS_COMPLETED: 'Completed',
            TOKEN_RENEW_STATUS_IN_PROGRESS: 'In Progress',
            LOGGING_LEVEL: {
                ERROR: 0,
                WARN: 1,
                INFO: 2,
                VERBOSE: 3
            },
            LEVEL_STRING_MAP: {
                0: 'ERROR:',
                1: 'WARNING:',
                2: 'INFO:',
                3: 'VERBOSE:'
            },
            POPUP_WIDTH: 483,
            POPUP_HEIGHT: 600
        };

        if (AuthenticationContext.prototype._singletonInstance) {
            return AuthenticationContext.prototype._singletonInstance;
        }
        AuthenticationContext.prototype._singletonInstance = this;

        // public
        this.instance = 'https://login.microsoftonline.com/';
        this.config = {};
        this.callback = null;
        this.popUp = false;
        this.isAngular = false;

        // private
        this._user = null;
        this._activeRenewals = {};
        this._loginInProgress = false;
        this._acquireTokenInProgress = false;
        this._renewStates = [];
        this._callBackMappedToRenewStates = {};
        this._callBacksMappedToRenewStates = {};
        this._openedWindows = [];
        this._requestType = this.REQUEST_TYPE.LOGIN;
        window._adalInstance = this;

        // validate before constructor assignments
        if (config.displayCall && typeof config.displayCall !== 'function') {
            throw new Error('displayCall is not a function');
        }

        if (!config.clientId) {
            throw new Error('clientId is required');
        }

        this.config = this._cloneConfig(config);

        if (this.config.navigateToLoginRequestUrl === undefined)
            this.config.navigateToLoginRequestUrl = true;

        if (this.config.popUp)
            this.popUp = true;

        if (this.config.callback && typeof this.config.callback === 'function')
            this.callback = this.config.callback;

        if (this.config.instance) {
            this.instance = this.config.instance;
        }

        // App can request idtoken for itself using clientid as resource
        if (!this.config.loginResource) {
            this.config.loginResource = this.config.clientId;
        }

        // redirect and logout_redirect are set to current location by default
        if (!this.config.redirectUri) {
            // strip off query parameters or hashes from the redirect uri as AAD does not allow those.
            this.config.redirectUri = window.location.href.split("?")[0].split("#")[0];
        }

        if (!this.config.postLogoutRedirectUri) {
            // strip off query parameters or hashes from the post logout redirect uri as AAD does not allow those.
            this.config.postLogoutRedirectUri = window.location.href.split("?")[0].split("#")[0];
        }

        if (!this.config.anonymousEndpoints) {
            this.config.anonymousEndpoints = [];
        }

        if (this.config.isAngular) {
            this.isAngular = this.config.isAngular;
        }

        if (this.config.loadFrameTimeout) {
            this.CONSTANTS.LOADFRAME_TIMEOUT = this.config.loadFrameTimeout;
        }
    };

    if (typeof window !== 'undefined') {
        window.Logging = {
            piiLoggingEnabled: false,
            level: 0,
            log: function (message) { }
        };
    }

    /**
     * Initiates the login process by redirecting the user to Azure AD authorization endpoint.
     */
    AuthenticationContext.prototype.login = function () {
        if (this._loginInProgress) {
            this.info("Login in progress");
            return;
        }

        this._loginInProgress = true;

        // Token is not present and user needs to login
        var expectedState = this._guid();
        this.config.state = expectedState;
        this._idTokenNonce = this._guid();
        var loginStartPage = this._getItem(this.CONSTANTS.STORAGE.ANGULAR_LOGIN_REQUEST);

        if (!loginStartPage || loginStartPage === "") {
            loginStartPage = window.location.href;
        }
        else {
            this._saveItem(this.CONSTANTS.STORAGE.ANGULAR_LOGIN_REQUEST, "")
        }

        this.verbose('Expected state: ' + expectedState + ' startPage:' + loginStartPage);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, loginStartPage);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, expectedState, true);
        this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce, true);
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, '');
        var urlNavigate = this._getNavigateUrl('id_token', null) + '&nonce=' + encodeURIComponent(this._idTokenNonce);

        if (this.config.displayCall) {
            // User defined way of handling the navigation
            this.config.displayCall(urlNavigate);
        }
        else if (this.popUp) {
            this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, '');// so requestInfo does not match redirect case
            this._renewStates.push(expectedState);
            this.registerCallback(expectedState, this.config.clientId, this.callback);
            this._loginPopup(urlNavigate);
        }
        else {
            this.promptUser(urlNavigate);
        }
    };

    /**
     * Configures popup window for login.
     * @ignore
     */
    AuthenticationContext.prototype._openPopup = function (urlNavigate, title, popUpWidth, popUpHeight) {
        try {
            /**
            * adding winLeft and winTop to account for dual monitor
            * using screenLeft and screenTop for IE8 and earlier
            */
            var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var winTop = window.screenTop ? window.screenTop : window.screenY;
            /**
            * window.innerWidth displays browser window's height and width excluding toolbars
            * using document.documentElement.clientWidth for IE8 and earlier
            */
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
            var top = ((height / 2) - (popUpHeight / 2)) + winTop;

            var popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top + ', left=' + left);

            if (popupWindow.focus) {
                popupWindow.focus();
            }

            return popupWindow;
        } catch (e) {
            this.warn('Error opening popup, ' + e.message);
            this._loginInProgress = false;
            this._acquireTokenInProgress = false;
            return null;
        }
    }

    AuthenticationContext.prototype._handlePopupError = function (loginCallback, resource, error, errorDesc, loginError) {
        this.warn(errorDesc);
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, error);
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, errorDesc);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, loginError);

        if (resource && this._activeRenewals[resource]) {
            this._activeRenewals[resource] = null;
        }

        this._loginInProgress = false;
        this._acquireTokenInProgress = false;

        if (loginCallback) {
            loginCallback(errorDesc, null, error);
        }
    }

    /**
     * After authorization, the user will be sent to your specified redirect_uri with the user's bearer token
     * attached to the URI fragment as an id_token field. It closes popup window after redirection.
     * @ignore
     */
    AuthenticationContext.prototype._loginPopup = function (urlNavigate, resource, callback) {
        var popupWindow = this._openPopup(urlNavigate, "login", this.CONSTANTS.POPUP_WIDTH, this.CONSTANTS.POPUP_HEIGHT);
        var loginCallback = callback || this.callback;

        if (popupWindow == null) {
            var error = 'Error opening popup';
            var errorDesc = 'Popup Window is null. This can happen if you are using IE';
            this._handlePopupError(loginCallback, resource, error, errorDesc, errorDesc);
            return;
        }

        this._openedWindows.push(popupWindow);

        if (this.config.redirectUri.indexOf('#') != -1) {
            var registeredRedirectUri = this.config.redirectUri.split("#")[0];
        }

        else {
            var registeredRedirectUri = this.config.redirectUri;
        }

        var that = this;

        var pollTimer = window.setInterval(function () {
            if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                var error = 'Popup Window closed';
                var errorDesc = 'Popup Window closed by UI action/ Popup Window handle destroyed due to cross zone navigation in IE/Edge'

                if (that.isAngular) {
                    that._broadcast('adal:popUpClosed', errorDesc + that.CONSTANTS.RESOURCE_DELIMETER + error);
                }

                that._handlePopupError(loginCallback, resource, error, errorDesc, errorDesc);
                window.clearInterval(pollTimer);
                return;
            }
            try {
                var popUpWindowLocation = popupWindow.location;
                if (encodeURI(popUpWindowLocation.href).indexOf(encodeURI(registeredRedirectUri)) != -1) {
                    if (that.isAngular) {
                        that._broadcast('adal:popUpHashChanged', popUpWindowLocation.hash);
                    }
                    else {
                        that.handleWindowCallback(popUpWindowLocation.hash);
                    }

                    window.clearInterval(pollTimer);
                    that._loginInProgress = false;
                    that._acquireTokenInProgress = false;
                    that.info("Closing popup window");
                    that._openedWindows = [];
                    popupWindow.close();
                    return;
                }
            } catch (e) {
            }
        }, 1);
    };

    AuthenticationContext.prototype._broadcast = function (eventName, data) {
        // Custom Event is not supported in IE, below IIFE will polyfill the CustomEvent() constructor functionality in Internet Explorer 9 and higher
        (function () {

            if (typeof window.CustomEvent === "function") {
                return false;
            }

            function CustomEvent(event, params) {
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            }

            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        })();

        var evt = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(evt);
    };

    AuthenticationContext.prototype.loginInProgress = function () {
        return this._loginInProgress;
    };

    /**
     * Checks for the resource in the cache. By default, cache location is Session Storage
     * @ignore
     * @returns {Boolean} 'true' if login is in progress, else returns 'false'.
     */
    AuthenticationContext.prototype._hasResource = function (key) {
        var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);
        return keys && !this._isEmpty(keys) && (keys.indexOf(key + this.CONSTANTS.RESOURCE_DELIMETER) > -1);
    };

    /**
     * Gets token for the specified resource from the cache.
     * @param {string}   resource A URI that identifies the resource for which the token is requested.
     * @returns {string} token if if it exists and not expired, otherwise null.
     */
    AuthenticationContext.prototype.getCachedToken = function (resource) {
        if (!this._hasResource(resource)) {
            return null;
        }

        var token = this._getItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource);
        var expiry = this._getItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource);

        // If expiration is within offset, it will force renew
        var offset = this.config.expireOffsetSeconds || 300;

        if (expiry && (expiry > this._now() + offset)) {
            return token;
        } else {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, '');
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
            return null;
        }
    };

    /**
    * User information from idtoken.
    *  @class User
    *  @property {string} userName - username assigned from upn or email.
    *  @property {object} profile - properties parsed from idtoken.
    */

    /**
     * If user object exists, returns it. Else creates a new user object by decoding id_token from the cache.
     * @returns {User} user object
     */
    AuthenticationContext.prototype.getCachedUser = function () {
        if (this._user) {
            return this._user;
        }

        var idtoken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
        this._user = this._createUser(idtoken);
        return this._user;
    };

    /**
     * Adds the passed callback to the array of callbacks for the specified resource and puts the array on the window object. 
     * @param {string}   resource A URI that identifies the resource for which the token is requested.
     * @param {string}   expectedState A unique identifier (guid).
     * @param {tokenCallback} callback - The callback provided by the caller. It will be called with token or error.
     */
    AuthenticationContext.prototype.registerCallback = function (expectedState, resource, callback) {
        this._activeRenewals[resource] = expectedState;

        if (!this._callBacksMappedToRenewStates[expectedState]) {
            this._callBacksMappedToRenewStates[expectedState] = [];
        }

        var self = this;
        this._callBacksMappedToRenewStates[expectedState].push(callback);

        if (!this._callBackMappedToRenewStates[expectedState]) {
            this._callBackMappedToRenewStates[expectedState] = function (errorDesc, token, error, tokenType) {
                self._activeRenewals[resource] = null;

                for (var i = 0; i < self._callBacksMappedToRenewStates[expectedState].length; ++i) {
                    try {
                        self._callBacksMappedToRenewStates[expectedState][i](errorDesc, token, error, tokenType);
                    }
                    catch (error) {
                        self.warn(error);
                    }
                }

                self._callBacksMappedToRenewStates[expectedState] = null;
                self._callBackMappedToRenewStates[expectedState] = null;
            };
        }
    };

    // var errorResponse = {error:'', error_description:''};
    // var token = 'string token';
    // callback(errorResponse, token)
    // with callback
    /**
     * Acquires access token with hidden iframe
     * @ignore
     */
    AuthenticationContext.prototype._renewToken = function (resource, callback, responseType) {
        // use iframe to try to renew token
        // use given resource to create new authz url
        this.info('renewToken is called for resource:' + resource);
        var frameHandle = this._addAdalFrame('adalRenewFrame' + resource);
        var expectedState = this._guid() + '|' + resource;
        this.config.state = expectedState;
        // renew happens in iframe, so it keeps javascript context
        this._renewStates.push(expectedState);
        this.verbose('Renew token Expected state: ' + expectedState);
        // remove the existing prompt=... query parameter and add prompt=none
        responseType = responseType || 'token';
        var urlNavigate = this._urlRemoveQueryStringParameter(this._getNavigateUrl(responseType, resource), 'prompt');

        if (responseType === this.RESPONSE_TYPE.ID_TOKEN_TOKEN) {
            this._idTokenNonce = this._guid();
            this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce, true);
            urlNavigate += '&nonce=' + encodeURIComponent(this._idTokenNonce);
        }

        urlNavigate = urlNavigate + '&prompt=none';
        urlNavigate = this._addHintParameters(urlNavigate);
        this.registerCallback(expectedState, resource, callback);
        this.verbosePii('Navigate to:' + urlNavigate);
        frameHandle.src = 'about:blank';
        this._loadFrameTimeout(urlNavigate, 'adalRenewFrame' + resource, resource);

    };

    /**
     * Renews idtoken for app's own backend when resource is clientId and calls the callback with token/error
     * @ignore
     */
    AuthenticationContext.prototype._renewIdToken = function (callback, responseType) {
        // use iframe to try to renew token
        this.info('renewIdToken is called');
        var frameHandle = this._addAdalFrame('adalIdTokenFrame');
        var expectedState = this._guid() + '|' + this.config.clientId;
        this._idTokenNonce = this._guid();
        this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce, true);
        this.config.state = expectedState;
        // renew happens in iframe, so it keeps javascript context
        this._renewStates.push(expectedState);
        this.verbose('Renew Idtoken Expected state: ' + expectedState);
        // remove the existing prompt=... query parameter and add prompt=none
        var resource = responseType === null || typeof (responseType) === "undefined" ? null : this.config.clientId;
        var responseType = responseType || 'id_token';
        var urlNavigate = this._urlRemoveQueryStringParameter(this._getNavigateUrl(responseType, resource), 'prompt');
        urlNavigate = urlNavigate + '&prompt=none';
        urlNavigate = this._addHintParameters(urlNavigate);
        urlNavigate += '&nonce=' + encodeURIComponent(this._idTokenNonce);
        this.registerCallback(expectedState, this.config.clientId, callback);
        this.verbosePii('Navigate to:' + urlNavigate);
        frameHandle.src = 'about:blank';
        this._loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.config.clientId);
    };

    /**
     * Checks if the authorization endpoint URL contains query string parameters
     * @ignore
     */
    AuthenticationContext.prototype._urlContainsQueryStringParameter = function (name, url) {
        // regex to detect pattern of a ? or & followed by the name parameter and an equals character
        var regex = new RegExp("[\\?&]" + name + "=");
        return regex.test(url);
    }

    /**
     * Removes the query string parameter from the authorization endpoint URL if it exists
     * @ignore
     */
    AuthenticationContext.prototype._urlRemoveQueryStringParameter = function (url, name) {
        // we remove &name=value, name=value& and name=value
        // &name=value
        var regex = new RegExp('(\\&' + name + '=)[^\&]+');
        url = url.replace(regex, '');
        // name=value&
        regex = new RegExp('(' + name + '=)[^\&]+&');
        url = url.replace(regex, '');
        // name=value
        regex = new RegExp('(' + name + '=)[^\&]+');
        url = url.replace(regex, '');
        return url;
    }

    // Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left
    // registered when network errors occur and subsequent token requests for same resource are registered to the pending request
    /**
     * @ignore
     */
    AuthenticationContext.prototype._loadFrameTimeout = function (urlNavigation, frameName, resource) {
        //set iframe session to pending
        this.verbose('Set loading state to pending for: ' + resource);
        this._saveItem(this.CONSTANTS.STORAGE.RENEW_STATUS + resource, this.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS);
        this._loadFrame(urlNavigation, frameName);
        var self = this;

        setTimeout(function () {
            if (self._getItem(self.CONSTANTS.STORAGE.RENEW_STATUS + resource) === self.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS) {
                // fail the iframe session if it's in pending state
                self.verbose('Loading frame has timed out after: ' + (self.CONSTANTS.LOADFRAME_TIMEOUT / 1000) + ' seconds for resource ' + resource);
                var expectedState = self._activeRenewals[resource];

                if (expectedState && self._callBackMappedToRenewStates[expectedState]) {
                    self._callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null, 'Token Renewal Failed');
                }

                self._saveItem(self.CONSTANTS.STORAGE.RENEW_STATUS + resource, self.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED);
            }
        }, self.CONSTANTS.LOADFRAME_TIMEOUT);
    }

    /**
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    AuthenticationContext.prototype._loadFrame = function (urlNavigate, frameName) {
        // This trick overcomes iframe navigation in IE
        // IE does not load the page consistently in iframe
        var self = this;
        self.info('LoadFrame: ' + frameName);
        var frameCheck = frameName;
        setTimeout(function () {
            var frameHandle = self._addAdalFrame(frameCheck);

            if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                frameHandle.src = urlNavigate;
                self._loadFrame(urlNavigate, frameCheck);
            }

        }, 500);
    };

    /**
     * @callback tokenCallback
     * @param {string} error_description error description returned from AAD if token request fails.
     * @param {string} token token returned from AAD if token request is successful.
     * @param {string} error error message returned from AAD if token request fails.
     */

    /**
     * Acquires token from the cache if it is not expired. Otherwise sends request to AAD to obtain a new token.
     * @param {string}   resource  ResourceUri identifying the target resource
     * @param {tokenCallback} callback -  The callback provided by the caller. It will be called with token or error.
     */
    AuthenticationContext.prototype.acquireToken = function (resource, callback) {
        if (this._isEmpty(resource)) {
            this.warn('resource is required');
            callback('resource is required', null, 'resource is required');
            return;
        }

        var token = this.getCachedToken(resource);

        if (token) {
            this.info('Token is already in cache for resource:' + resource);
            callback(null, token, null);
            return;
        }

        if (!this._user && !(this.config.extraQueryParameter && this.config.extraQueryParameter.indexOf('login_hint') !== -1)) {
            this.warn('User login is required');
            callback('User login is required', null, 'login required');
            return;
        }

        // renew attempt with iframe
        // Already renewing for this resource, callback when we get the token.
        if (this._activeRenewals[resource]) {
            // Active renewals contains the state for each renewal.
            this.registerCallback(this._activeRenewals[resource], resource, callback);
        }
        else {
            this._requestType = this.REQUEST_TYPE.RENEW_TOKEN;
            if (resource === this.config.clientId) {
                // App uses idtoken to send to api endpoints
                // Default resource is tracked as clientid to store this token
                if (this._user) {
                    this.verbose('renewing idtoken');
                    this._renewIdToken(callback);
                }
                else {
                    this.verbose('renewing idtoken and access_token');
                    this._renewIdToken(callback, this.RESPONSE_TYPE.ID_TOKEN_TOKEN);
                }
            } else {
                if (this._user) {
                    this.verbose('renewing access_token');
                    this._renewToken(resource, callback);
                }
                else {
                    this.verbose('renewing idtoken and access_token');
                    this._renewToken(resource, callback, this.RESPONSE_TYPE.ID_TOKEN_TOKEN);
                }
            }
        }
    };

    /**
  * Acquires token (interactive flow using a popUp window) by sending request to AAD to obtain a new token.
  * @param {string}   resource  ResourceUri identifying the target resource
  * @param {string}   extraQueryParameters  extraQueryParameters to add to the authentication request
  * @param {tokenCallback} callback -  The callback provided by the caller. It will be called with token or error.
  */
    AuthenticationContext.prototype.acquireTokenPopup = function (resource, extraQueryParameters, claims, callback) {
        if (this._isEmpty(resource)) {
            this.warn('resource is required');
            callback('resource is required', null, 'resource is required');
            return;
        }

        if (!this._user) {
            this.warn('User login is required');
            callback('User login is required', null, 'login required');
            return;
        }

        if (this._acquireTokenInProgress) {
            this.warn("Acquire token interactive is already in progress")
            callback("Acquire token interactive is already in progress", null, "Acquire token interactive is already in progress");
            return;
        }

        var expectedState = this._guid() + '|' + resource;
        this.config.state = expectedState;
        this._renewStates.push(expectedState);
        this._requestType = this.REQUEST_TYPE.RENEW_TOKEN;
        this.verbose('Renew token Expected state: ' + expectedState);
        // remove the existing prompt=... query parameter and add prompt=select_account
        var urlNavigate = this._urlRemoveQueryStringParameter(this._getNavigateUrl('token', resource), 'prompt');
        urlNavigate = urlNavigate + '&prompt=select_account';

        if (extraQueryParameters) {
            urlNavigate += extraQueryParameters;
        }

        if (claims && (urlNavigate.indexOf("&claims") === -1)) {
            urlNavigate += '&claims=' + encodeURIComponent(claims);
        }
        else if (claims && (urlNavigate.indexOf("&claims") !== -1)) {
            throw new Error('Claims cannot be passed as an extraQueryParameter');
        }

        urlNavigate = this._addHintParameters(urlNavigate);
        this._acquireTokenInProgress = true;
        this.info('acquireToken interactive is called for the resource ' + resource);
        this.registerCallback(expectedState, resource, callback);
        this._loginPopup(urlNavigate, resource, callback);

    };

    /**
      * Acquires token (interactive flow using a redirect) by sending request to AAD to obtain a new token. In this case the callback passed in the Authentication
      * request constructor will be called.
      * @param {string}   resource  ResourceUri identifying the target resource
      * @param {string}   extraQueryParameters  extraQueryParameters to add to the authentication request
      */
    AuthenticationContext.prototype.acquireTokenRedirect = function (resource, extraQueryParameters, claims) {
        if (this._isEmpty(resource)) {
            this.warn('resource is required');
            callback('resource is required', null, 'resource is required');
            return;
        }

        var callback = this.callback;

        if (!this._user) {
            this.warn('User login is required');
            callback('User login is required', null, 'login required');
            return;
        }

        if (this._acquireTokenInProgress) {
            this.warn("Acquire token interactive is already in progress")
            callback("Acquire token interactive is already in progress", null, "Acquire token interactive is already in progress");
            return;
        }

        var expectedState = this._guid() + '|' + resource;
        this.config.state = expectedState;
        this.verbose('Renew token Expected state: ' + expectedState);

        // remove the existing prompt=... query parameter and add prompt=select_account
        var urlNavigate = this._urlRemoveQueryStringParameter(this._getNavigateUrl('token', resource), 'prompt');
        urlNavigate = urlNavigate + '&prompt=select_account';
        if (extraQueryParameters) {
            urlNavigate += extraQueryParameters;
        }

        if (claims && (urlNavigate.indexOf("&claims") === -1)) {
            urlNavigate += '&claims=' + encodeURIComponent(claims);
        }
        else if (claims && (urlNavigate.indexOf("&claims") !== -1)) {
            throw new Error('Claims cannot be passed as an extraQueryParameter');
        }

        urlNavigate = this._addHintParameters(urlNavigate);
        this._acquireTokenInProgress = true;
        this.info('acquireToken interactive is called for the resource ' + resource);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, window.location.href);
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, expectedState, true);
        this.promptUser(urlNavigate);
    };
    /**
     * Redirects the browser to Azure AD authorization endpoint.
     * @param {string}   urlNavigate  Url of the authorization endpoint.
     */
    AuthenticationContext.prototype.promptUser = function (urlNavigate) {
        if (urlNavigate) {
            this.infoPii('Navigate to:' + urlNavigate);
            window.location.replace(urlNavigate);
        } else {
            this.info('Navigate url is empty');
        }
    };

    /**
     * Clears cache items.
     */
    AuthenticationContext.prototype.clearCache = function () {
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, '');
        this._saveItem(this.CONSTANTS.STORAGE.ANGULAR_LOGIN_REQUEST, '');
        this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE, '');
        this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, '');
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, '');
        this._renewStates = [];
        this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, '');
        this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, '');
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, '');
        var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);

        if (!this._isEmpty(keys)) {
            keys = keys.split(this.CONSTANTS.RESOURCE_DELIMETER);
            for (var i = 0; i < keys.length && keys[i] !== ""; i++) {
                this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + keys[i], '');
                this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + keys[i], 0);
            }
        }

        this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, '');
    };

    /**
     * Clears cache items for a given resource.
     * @param {string}  resource a URI that identifies the resource.
     */
    AuthenticationContext.prototype.clearCacheForResource = function (resource) {
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, '');

        if (this._hasResource(resource)) {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, '');
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
        }
    };

    /**
     * Redirects user to logout endpoint.
     * After logout, it will redirect to postLogoutRedirectUri if added as a property on the config object.
     */
    AuthenticationContext.prototype.logOut = function () {
        this.clearCache();
        this._user = null;
        var urlNavigate;

        if (this.config.logOutUri) {
            urlNavigate = this.config.logOutUri;
        } else {
            var tenant = 'common';
            var logout = '';

            if (this.config.tenant) {
                tenant = this.config.tenant;
            }

            if (this.config.postLogoutRedirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.config.postLogoutRedirectUri);
            }

            urlNavigate = this.instance + tenant + '/oauth2/logout?' + logout;
        }

        this.infoPii('Logout navigate to: ' + urlNavigate);
        this.promptUser(urlNavigate);
    };

    AuthenticationContext.prototype._isEmpty = function (str) {
        return (typeof str === 'undefined' || !str || 0 === str.length);
    };

    /**
     * @callback userCallback
     * @param {string} error error message if user info is not available.
     * @param {User} user user object retrieved from the cache.
     */

    /**
     * Calls the passed in callback with the user object or error message related to the user.
     * @param {userCallback} callback - The callback provided by the caller. It will be called with user or error.
     */
    AuthenticationContext.prototype.getUser = function (callback) {
        // IDToken is first call
        if (typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        // user in memory
        if (this._user) {
            callback(null, this._user);
            return;
        }

        // frame is used to get idtoken
        var idtoken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);

        if (!this._isEmpty(idtoken)) {
            this.info('User exists in cache: ');
            this._user = this._createUser(idtoken);
            callback(null, this._user);
        } else {
            this.warn('User information is not available');
            callback('User information is not available', null);
        }
    };

    /**
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time.
     * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user.
     * @ignore
     */
    AuthenticationContext.prototype._addHintParameters = function (urlNavigate) {
        //If you don�t use prompt=none, then if the session does not exist, there will be a failure.
        //If sid is sent alongside domain or login hints, there will be a failure since request is ambiguous.
        //If sid is sent with a prompt value other than none or attempt_none, there will be a failure since the request is ambiguous.

        if (this._user && this._user.profile) {
            if (this._user.profile.sid && urlNavigate.indexOf('&prompt=none') !== -1) {
                // don't add sid twice if user provided it in the extraQueryParameter value
                if (!this._urlContainsQueryStringParameter("sid", urlNavigate)) {
                    // add sid
                    urlNavigate += '&sid=' + encodeURIComponent(this._user.profile.sid);
                }
            }
            else if (this._user.profile.upn) {
                // don't add login_hint twice if user provided it in the extraQueryParameter value
                if (!this._urlContainsQueryStringParameter("login_hint", urlNavigate)) {
                    // add login_hint
                    urlNavigate += '&login_hint=' + encodeURIComponent(this._user.profile.upn);
                }
                // don't add domain_hint twice if user provided it in the extraQueryParameter value
                if (!this._urlContainsQueryStringParameter("domain_hint", urlNavigate) && this._user.profile.upn.indexOf('@') > -1) {
                    var parts = this._user.profile.upn.split('@');
                    // local part can include @ in quotes. Sending last part handles that.
                    urlNavigate += '&domain_hint=' + encodeURIComponent(parts[parts.length - 1]);
                }
            }

        }

        return urlNavigate;
    }

    /**
     * Creates a user object by decoding the id_token
     * @ignore
     */
    AuthenticationContext.prototype._createUser = function (idToken) {
        var user = null;
        var parsedJson = this._extractIdToken(idToken);
        if (parsedJson && parsedJson.hasOwnProperty('aud')) {
            if (parsedJson.aud.toLowerCase() === this.config.clientId.toLowerCase()) {

                user = {
                    userName: '',
                    profile: parsedJson
                };

                if (parsedJson.hasOwnProperty('upn')) {
                    user.userName = parsedJson.upn;
                } else if (parsedJson.hasOwnProperty('email')) {
                    user.userName = parsedJson.email;
                }
            } else {
                this.warn('IdToken has invalid aud field');
            }

        }

        return user;
    };

    /**
     * Returns the anchor part(#) of the URL
     * @ignore
     */
    AuthenticationContext.prototype._getHash = function (hash) {
        if (hash.indexOf('#/') > -1) {
            hash = hash.substring(hash.indexOf('#/') + 2);
        } else if (hash.indexOf('#') > -1) {
            hash = hash.substring(1);
        }

        return hash;
    };

    /**
     * Checks if the URL fragment contains access token, id token or error_description.
     * @param {string} hash  -  Hash passed from redirect page
     * @returns {Boolean} true if response contains id_token, access_token or error, false otherwise.
     */
    AuthenticationContext.prototype.isCallback = function (hash) {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        return (
            parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
            parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)
        );
    };

    /**
     * Gets login error
     * @returns {string} error message related to login.
     */
    AuthenticationContext.prototype.getLoginError = function () {
        return this._getItem(this.CONSTANTS.STORAGE.LOGIN_ERROR);
    };

    /**
     * Request info object created from the response received from AAD.
     *  @class RequestInfo
     *  @property {object} parameters - object comprising of fields such as id_token/error, session_state, state, e.t.c.
     *  @property {REQUEST_TYPE} requestType - either LOGIN, RENEW_TOKEN or UNKNOWN.
     *  @property {boolean} stateMatch - true if state is valid, false otherwise.
     *  @property {string} stateResponse - unique guid used to match the response with the request.
     *  @property {boolean} valid - true if requestType contains id_token, access_token or error, false otherwise.
     */

    /**
     * Creates a requestInfo object from the URL fragment and returns it.
     * @returns {RequestInfo} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     */
    AuthenticationContext.prototype.getRequestInfo = function (hash) {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        var requestInfo = {
            valid: false,
            parameters: {},
            stateMatch: false,
            stateResponse: '',
            requestType: this.REQUEST_TYPE.UNKNOWN,
        };

        if (parameters) {
            requestInfo.parameters = parameters;
            if (parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
                parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
                parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)) {

                requestInfo.valid = true;

                // which call
                var stateResponse = '';
                if (parameters.hasOwnProperty('state')) {
                    this.verbose('State: ' + parameters.state);
                    stateResponse = parameters.state;
                } else {
                    this.warn('No state returned');
                    return requestInfo;
                }

                requestInfo.stateResponse = stateResponse;

                // async calls can fire iframe and login request at the same time if developer does not use the API as expected
                // incoming callback needs to be looked up to find the request type
                if (this._matchState(requestInfo)) { // loginRedirect or acquireTokenRedirect
                    return requestInfo;
                }

                // external api requests may have many renewtoken requests for different resource
                if (!requestInfo.stateMatch && window.parent) {
                    requestInfo.requestType = this._requestType;
                    var statesInParentContext = this._renewStates;
                    for (var i = 0; i < statesInParentContext.length; i++) {
                        if (statesInParentContext[i] === requestInfo.stateResponse) {
                            requestInfo.stateMatch = true;
                            break;
                        }
                    }
                }
            }
        }
        return requestInfo;
    };

    /**
    * Matches nonce from the request with the response.
    * @ignore
    */
    AuthenticationContext.prototype._matchNonce = function (user) {
        var requestNonce = this._getItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN);

        if (requestNonce) {
            requestNonce = requestNonce.split(this.CONSTANTS.CACHE_DELIMETER);
            for (var i = 0; i < requestNonce.length; i++) {
                if (requestNonce[i] === user.profile.nonce) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
    * Matches state from the request with the response.
    * @ignore
    */
    AuthenticationContext.prototype._matchState = function (requestInfo) {
        var loginStates = this._getItem(this.CONSTANTS.STORAGE.STATE_LOGIN);

        if (loginStates) {
            loginStates = loginStates.split(this.CONSTANTS.CACHE_DELIMETER);
            for (var i = 0; i < loginStates.length; i++) {
                if (loginStates[i] === requestInfo.stateResponse) {
                    requestInfo.requestType = this.REQUEST_TYPE.LOGIN;
                    requestInfo.stateMatch = true;
                    return true;
                }
            }
        }

        var acquireTokenStates = this._getItem(this.CONSTANTS.STORAGE.STATE_RENEW);

        if (acquireTokenStates) {
            acquireTokenStates = acquireTokenStates.split(this.CONSTANTS.CACHE_DELIMETER);
            for (var i = 0; i < acquireTokenStates.length; i++) {
                if (acquireTokenStates[i] === requestInfo.stateResponse) {
                    requestInfo.requestType = this.REQUEST_TYPE.RENEW_TOKEN;
                    requestInfo.stateMatch = true;
                    return true;
                }
            }
        }

        return false;

    };

    /**
     * Extracts resource value from state.
     * @ignore
     */
    AuthenticationContext.prototype._getResourceFromState = function (state) {
        if (state) {
            var splitIndex = state.indexOf('|');

            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }

        return '';
    };

    /**
     * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
     */
    AuthenticationContext.prototype.saveTokenFromHash = function (requestInfo) {
        this.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, '');
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, '');

        var resource = this._getResourceFromState(requestInfo.stateResponse);

        // Record error
        if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION)) {
            this.infoPii('Error :' + requestInfo.parameters.error + '; Error description:' + requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);
            this._saveItem(this.CONSTANTS.STORAGE.ERROR, requestInfo.parameters.error);
            this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);

            if (requestInfo.requestType === this.REQUEST_TYPE.LOGIN) {
                this._loginInProgress = false;
                this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, requestInfo.parameters.error_description);
            }
        } else {
            // It must verify the state from redirect
            if (requestInfo.stateMatch) {
                // record tokens to storage if exists
                this.info('State is right');
                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.SESSION_STATE)) {
                    this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE, requestInfo.parameters[this.CONSTANTS.SESSION_STATE]);
                }

                var keys;

                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)) {
                    this.info('Fragment has access token');

                    if (!this._hasResource(resource)) {
                        keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || '';
                        this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
                    }

                    // save token with related resource
                    this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN]);
                    this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, this._expiresIn(requestInfo.parameters[this.CONSTANTS.EXPIRES_IN]));
                }

                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)) {
                    this.info('Fragment has id token');
                    this._loginInProgress = false;
                    this._user = this._createUser(requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                    if (this._user && this._user.profile) {
                        if (!this._matchNonce(this._user)) {
                            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, 'Nonce received: ' + this._user.profile.nonce + ' is not same as requested: ' +
                                this._getItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN));
                            this._user = null;
                        } else {
                            this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN, requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);

                            // Save idtoken as access token for app itself
                            resource = this.config.loginResource ? this.config.loginResource : this.config.clientId;

                            if (!this._hasResource(resource)) {
                                keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || '';
                                this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
                            }

                            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, this._user.profile.exp);
                        }
                    }
                    else {
                        requestInfo.parameters['error'] = 'invalid id_token';
                        requestInfo.parameters['error_description'] = 'Invalid id_token. id_token: ' + requestInfo.parameters[this.CONSTANTS.ID_TOKEN];
                        this._saveItem(this.CONSTANTS.STORAGE.ERROR, 'invalid id_token');
                        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, 'Invalid id_token. id_token: ' + requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                    }
                }
            } else {
                requestInfo.parameters['error'] = 'Invalid_state';
                requestInfo.parameters['error_description'] = 'Invalid_state. state: ' + requestInfo.stateResponse;
                this._saveItem(this.CONSTANTS.STORAGE.ERROR, 'Invalid_state');
                this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, 'Invalid_state. state: ' + requestInfo.stateResponse);
            }
        }

        this._saveItem(this.CONSTANTS.STORAGE.RENEW_STATUS + resource, this.CONSTANTS.TOKEN_RENEW_STATUS_COMPLETED);
    };

    /**
     * Gets resource for given endpoint if mapping is provided with config.
     * @param {string} endpoint  -  The URI for which the resource Id is requested.
     * @returns {string} resource for this API endpoint.
     */
    AuthenticationContext.prototype.getResourceForEndpoint = function (endpoint) {

        // if user specified list of anonymous endpoints, no need to send token to these endpoints, return null.
        if (this.config && this.config.anonymousEndpoints) {
            for (var i = 0; i < this.config.anonymousEndpoints.length; i++) {
                if (endpoint.indexOf(this.config.anonymousEndpoints[i]) > -1) {
                    return null;
                }
            }
        }

        if (this.config && this.config.endpoints) {
            for (var configEndpoint in this.config.endpoints) {
                // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
                if (endpoint.indexOf(configEndpoint) > -1) {
                    return this.config.endpoints[configEndpoint];
                }
            }
        }

        // default resource will be clientid if nothing specified
        // App will use idtoken for calls to itself
        // check if it's staring from http or https, needs to match with app host
        if (endpoint.indexOf('http://') > -1 || endpoint.indexOf('https://') > -1) {
            if (this._getHostFromUri(endpoint) === this._getHostFromUri(this.config.redirectUri)) {
                return this.config.loginResource;
            }
        }
        else {
            // in angular level, the url for $http interceptor call could be relative url,
            // if it's relative call, we'll treat it as app backend call.            
            return this.config.loginResource;
        }

        // if not the app's own backend or not a domain listed in the endpoints structure
        return null;
    };

    /**
     * Strips the protocol part of the URL and returns it.
     * @ignore
     */
    AuthenticationContext.prototype._getHostFromUri = function (uri) {
        // remove http:// or https:// from uri
        var extractedUri = String(uri).replace(/^(https?:)\/\//, '');
        extractedUri = extractedUri.split('/')[0];
        return extractedUri;
    };

    /**
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     */
    AuthenticationContext.prototype.handleWindowCallback = function (hash) {
        // This is for regular javascript usage for redirect handling
        // need to make sure this is for callback
        if (hash == null) {
            hash = window.location.hash;
        }

        if (this.isCallback(hash)) {
            var self = null;
            var isPopup = false;

            if (this._openedWindows.length > 0 && this._openedWindows[this._openedWindows.length - 1].opener
                && this._openedWindows[this._openedWindows.length - 1].opener._adalInstance) {
                self = this._openedWindows[this._openedWindows.length - 1].opener._adalInstance;
                isPopup = true;
            }
            else if (window.parent && window.parent._adalInstance) {
                self = window.parent._adalInstance;
            }

            var requestInfo = self.getRequestInfo(hash);
            var token, tokenReceivedCallback, tokenType = null;

            if (isPopup || window.parent !== window) {
                tokenReceivedCallback = self._callBackMappedToRenewStates[requestInfo.stateResponse];
            }
            else {
                tokenReceivedCallback = self.callback;
            }

            self.info("Returned from redirect url");
            self.saveTokenFromHash(requestInfo);

            if ((requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) && window.parent) {
                if (window.parent !== window) {
                    self.verbose("Window is in iframe, acquiring token silently");
                } else {
                    self.verbose("acquiring token interactive in progress");
                }

                token = requestInfo.parameters[self.CONSTANTS.ACCESS_TOKEN] || requestInfo.parameters[self.CONSTANTS.ID_TOKEN];
                tokenType = self.CONSTANTS.ACCESS_TOKEN;
            } else if (requestInfo.requestType === this.REQUEST_TYPE.LOGIN) {
                token = requestInfo.parameters[self.CONSTANTS.ID_TOKEN];
                tokenType = self.CONSTANTS.ID_TOKEN;
            }

            var errorDesc = requestInfo.parameters[self.CONSTANTS.ERROR_DESCRIPTION];
            var error = requestInfo.parameters[self.CONSTANTS.ERROR];
            try {
                if (tokenReceivedCallback) {
                    tokenReceivedCallback(errorDesc, token, error, tokenType);
                }

            } catch (err) {
                self.error("Error occurred in user defined callback function: " + err);
            }

            if (window.parent === window && !isPopup) {
                if (self.config.navigateToLoginRequestUrl) {
                    window.location.href = self._getItem(self.CONSTANTS.STORAGE.LOGIN_REQUEST);
                } else window.location.hash = '';
            }
        }
    };

    /**
     * Constructs the authorization endpoint URL and returns it.
     * @ignore
     */
    AuthenticationContext.prototype._getNavigateUrl = function (responseType, resource) {
        var tenant = 'common';
        if (this.config.tenant) {
            tenant = this.config.tenant;
        }

        var urlNavigate = this.instance + tenant + '/oauth2/authorize' + this._serialize(responseType, this.config, resource) + this._addLibMetadata();
        this.info('Navigate url:' + urlNavigate);
        return urlNavigate;
    };

    /**
     * Returns the decoded id_token.
     * @ignore
     */
    AuthenticationContext.prototype._extractIdToken = function (encodedIdToken) {
        // id token will be decoded to get the username
        var decodedToken = this._decodeJwt(encodedIdToken);

        if (!decodedToken) {
            return null;
        }

        try {
            var base64IdToken = decodedToken.JWSPayload;
            var base64Decoded = this._base64DecodeStringUrlSafe(base64IdToken);

            if (!base64Decoded) {
                this.info('The returned id_token could not be base64 url safe decoded.');
                return null;
            }

            // ECMA script has JSON built-in support
            return JSON.parse(base64Decoded);
        } catch (err) {
            this.error('The returned id_token could not be decoded', err);
        }

        return null;
    };

    /**
     * Decodes a string of data which has been encoded using base-64 encoding.
     * @ignore
     */
    AuthenticationContext.prototype._base64DecodeStringUrlSafe = function (base64IdToken) {
        // html5 should support atob function for decoding
        base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');

        if (window.atob) {
            return decodeURIComponent(escape(window.atob(base64IdToken))); // jshint ignore:line
        }
        else {
            return decodeURIComponent(escape(this._decode(base64IdToken)));
        }
    };

    //Take https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.js and https://en.wikipedia.org/wiki/Base64 as reference. 
    AuthenticationContext.prototype._decode = function (base64IdToken) {
        var codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        base64IdToken = String(base64IdToken).replace(/=+$/, '');

        var length = base64IdToken.length;

        if (length % 4 === 1) {
            throw new Error('The token to be decoded is not correctly encoded.');
        }

        var h1, h2, h3, h4, bits, c1, c2, c3, decoded = '';

        for (var i = 0; i < length; i += 4) {
            //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
            // then 6 bits per base64 encoded character
            h1 = codes.indexOf(base64IdToken.charAt(i));
            h2 = codes.indexOf(base64IdToken.charAt(i + 1));
            h3 = codes.indexOf(base64IdToken.charAt(i + 2));
            h4 = codes.indexOf(base64IdToken.charAt(i + 3));

            // For padding, if last two are '='
            if (i + 2 === length - 1) {
                bits = h1 << 18 | h2 << 12 | h3 << 6;
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                decoded += String.fromCharCode(c1, c2);
                break;
            }
            // if last one is '='
            else if (i + 1 === length - 1) {
                bits = h1 << 18 | h2 << 12
                c1 = bits >> 16 & 255;
                decoded += String.fromCharCode(c1);
                break;
            }

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            // then convert to 3 byte chars
            c1 = bits >> 16 & 255;
            c2 = bits >> 8 & 255;
            c3 = bits & 255;

            decoded += String.fromCharCode(c1, c2, c3);
        }

        return decoded;
    };

    /**
     * Decodes an id token into an object with header, payload and signature fields.
     * @ignore
     */
    // Adal.node js crack function
    AuthenticationContext.prototype._decodeJwt = function (jwtToken) {
        if (this._isEmpty(jwtToken)) {
            return null;
        };

        var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;

        var matches = idTokenPartsRegex.exec(jwtToken);

        if (!matches || matches.length < 4) {
            this.warn('The returned id_token is not parseable.');
            return null;
        }

        var crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };

        return crackedToken;
    };

    /**
     * Converts string to represent binary data in ASCII string format by translating it into a radix-64 representation and returns it
     * @ignore
     */
    AuthenticationContext.prototype._convertUrlSafeToRegularBase64EncodedString = function (str) {
        return str.replace('-', '+').replace('_', '/');
    };

    /**
     * Serializes the parameters for the authorization endpoint URL and returns the serialized uri string.
     * @ignore
     */
    AuthenticationContext.prototype._serialize = function (responseType, obj, resource) {
        var str = [];

        if (obj !== null) {
            str.push('?response_type=' + responseType);
            str.push('client_id=' + encodeURIComponent(obj.clientId));
            if (resource) {
                str.push('resource=' + encodeURIComponent(resource));
            }

            str.push('redirect_uri=' + encodeURIComponent(obj.redirectUri));
            str.push('state=' + encodeURIComponent(obj.state));

            if (obj.hasOwnProperty('slice')) {
                str.push('slice=' + encodeURIComponent(obj.slice));
            }

            if (obj.hasOwnProperty('extraQueryParameter')) {
                str.push(obj.extraQueryParameter);
            }

            var correlationId = obj.correlationId ? obj.correlationId : this._guid();
            str.push('client-request-id=' + encodeURIComponent(correlationId));
        }

        return str.join('&');
    };

    /**
     * Parses the query string parameters into a key-value pair object.
     * @ignore
     */
    AuthenticationContext.prototype._deserialize = function (query) {
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, ' '));
            },
            obj = {};
        match = search.exec(query);

        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }

        return obj;
    };

    /**
     * Converts decimal value to hex equivalent
     * @ignore
     */
    AuthenticationContext.prototype._decimalToHex = function (number) {
        var hex = number.toString(16);

        while (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }

    /**
     * Generates RFC4122 version 4 guid (128 bits)
     * @ignore
     */
    /* jshint ignore:start */
    AuthenticationContext.prototype._guid = function () {
        // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
        // pseudo-random numbers.
        // The algorithm is as follows:
        //     Set the two most significant bits (bits 6 and 7) of the
        //        clock_seq_hi_and_reserved to zero and one, respectively.
        //     Set the four most significant bits (bits 12 through 15) of the
        //        time_hi_and_version field to the 4-bit version number from
        //        Section 4.1.3. Version4
        //     Set all the other bits to randomly (or pseudo-randomly) chosen
        //     values.
        // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
        // time-low               = 4hexOctet
        // time-mid               = 2hexOctet
        // time-high-and-version  = 2hexOctet
        // clock-seq-and-reserved = hexOctet:
        // clock-seq-low          = hexOctet
        // node                   = 6hexOctet
        // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
        // y values are 8, 9, A, B
        var cryptoObj = window.crypto || window.msCrypto; // for IE 11
        if (cryptoObj && cryptoObj.getRandomValues) {
            var buffer = new Uint8Array(16);
            cryptoObj.getRandomValues(buffer);
            //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".
            //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.
            return this._decimalToHex(buffer[0]) + this._decimalToHex(buffer[1]) + this._decimalToHex(buffer[2]) + this._decimalToHex(buffer[3]) + '-' + this._decimalToHex(buffer[4]) + this._decimalToHex(buffer[5]) + '-' + this._decimalToHex(buffer[6]) + this._decimalToHex(buffer[7]) + '-' +
                this._decimalToHex(buffer[8]) + this._decimalToHex(buffer[9]) + '-' + this._decimalToHex(buffer[10]) + this._decimalToHex(buffer[11]) + this._decimalToHex(buffer[12]) + this._decimalToHex(buffer[13]) + this._decimalToHex(buffer[14]) + this._decimalToHex(buffer[15]);
        }
        else {
            var guidHolder = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
            var hex = '0123456789abcdef';
            var r = 0;
            var guidResponse = "";
            for (var i = 0; i < 36; i++) {
                if (guidHolder[i] !== '-' && guidHolder[i] !== '4') {
                    // each x and y needs to be random
                    r = Math.random() * 16 | 0;
                }
                if (guidHolder[i] === 'x') {
                    guidResponse += hex[r];
                } else if (guidHolder[i] === 'y') {
                    // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                    r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                    r |= 0x8; // set pos 3 to 1 as 1???
                    guidResponse += hex[r];
                } else {
                    guidResponse += guidHolder[i];
                }
            }
            return guidResponse;
        }
    };
    /* jshint ignore:end */

    /**
     * Calculates the expires in value in milliseconds for the acquired token
     * @ignore
     */
    AuthenticationContext.prototype._expiresIn = function (expires) {
        // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
        if (!expires) expires = 3599;
        return this._now() + parseInt(expires, 10);
    };

    /**
     * Return the number of milliseconds since 1970/01/01
     * @ignore
     */
    AuthenticationContext.prototype._now = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };

    /**
     * Adds the hidden iframe for silent token renewal
     * @ignore
     */
    AuthenticationContext.prototype._addAdalFrame = function (iframeId) {
        if (typeof iframeId === 'undefined') {
            return;
        }

        this.info('Add adal frame to document:' + iframeId);
        var adalFrame = document.getElementById(iframeId);

        if (!adalFrame) {
            if (document.createElement && document.documentElement &&
                (window.opera || window.navigator.userAgent.indexOf('MSIE 5.0') === -1)) {
                var ifr = document.createElement('iframe');
                ifr.setAttribute('id', iframeId);
                ifr.setAttribute('aria-hidden', 'true');
                ifr.style.visibility = 'hidden';
                ifr.style.position = 'absolute';
                ifr.style.width = ifr.style.height = ifr.borderWidth = '0px';

                adalFrame = document.getElementsByTagName('body')[0].appendChild(ifr);
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML('beforeEnd', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
            }
            if (window.frames && window.frames[iframeId]) {
                adalFrame = window.frames[iframeId];
            }
        }

        return adalFrame;
    };

    /**
     * Saves the key-value pair in the cache
     * @ignore
     */
    AuthenticationContext.prototype._saveItem = function (key, obj, preserve) {

        if (this.config && this.config.cacheLocation && this.config.cacheLocation === 'localStorage') {

            if (!this._supportsLocalStorage()) {
                this.info('Local storage is not supported');
                return false;
            }

            if (preserve) {
                var value = this._getItem(key) || '';
                localStorage.setItem(key, value + obj + this.CONSTANTS.CACHE_DELIMETER);
            }
            else {
                localStorage.setItem(key, obj);
            }

            return true;
        }

        // Default as session storage
        if (!this._supportsSessionStorage()) {
            this.info('Session storage is not supported');
            return false;
        }

        sessionStorage.setItem(key, obj);
        return true;
    };

    /**
     * Searches the value for the given key in the cache
     * @ignore
     */
    AuthenticationContext.prototype._getItem = function (key) {

        if (this.config && this.config.cacheLocation && this.config.cacheLocation === 'localStorage') {

            if (!this._supportsLocalStorage()) {
                this.info('Local storage is not supported');
                return null;
            }

            return localStorage.getItem(key);
        }

        // Default as session storage
        if (!this._supportsSessionStorage()) {
            this.info('Session storage is not supported');
            return null;
        }

        return sessionStorage.getItem(key);
    };

    /**
     * Returns true if browser supports localStorage, false otherwise.
     * @ignore
     */
    AuthenticationContext.prototype._supportsLocalStorage = function () {
        try {
            if (!window.localStorage) return false; // Test availability
            window.localStorage.setItem('storageTest', 'A'); // Try write
            if (window.localStorage.getItem('storageTest') != 'A') return false; // Test read/write
            window.localStorage.removeItem('storageTest'); // Try delete
            if (window.localStorage.getItem('storageTest')) return false; // Test delete
            return true; // Success
        } catch (e) {
            return false;
        }
    };

    /**
     * Returns true if browser supports sessionStorage, false otherwise.
     * @ignore
     */
    AuthenticationContext.prototype._supportsSessionStorage = function () {
        try {
            if (!window.sessionStorage) return false; // Test availability
            window.sessionStorage.setItem('storageTest', 'A'); // Try write
            if (window.sessionStorage.getItem('storageTest') != 'A') return false; // Test read/write
            window.sessionStorage.removeItem('storageTest'); // Try delete
            if (window.sessionStorage.getItem('storageTest')) return false; // Test delete
            return true; // Success
        } catch (e) {
            return false;
        }
    };

    /**
     * Returns a cloned copy of the passed object.
     * @ignore
     */
    AuthenticationContext.prototype._cloneConfig = function (obj) {
        if (null === obj || 'object' !== typeof obj) {
            return obj;
        }

        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = obj[attr];
            }
        }
        return copy;
    };

    /**
     * Adds the library version and returns it.
     * @ignore
     */
    AuthenticationContext.prototype._addLibMetadata = function () {
        // x-client-SKU
        // x-client-Ver
        return '&x-client-SKU=Js&x-client-Ver=' + this._libVersion();
    };

    /**
     * Checks the Logging Level, constructs the Log message and logs it. Users need to implement/override this method to turn on Logging. 
     * @param {number} level  -  Level can be set 0,1,2 and 3 which turns on 'error', 'warning', 'info' or 'verbose' level logging respectively.
     * @param {string} message  -  Message to log.
     * @param {string} error  -  Error to log.
     */
    AuthenticationContext.prototype.log = function (level, message, error, containsPii) {

        if (level <= Logging.level) {

            if (!Logging.piiLoggingEnabled && containsPii)
                return;

            var timestamp = new Date().toUTCString();
            var formattedMessage = '';

            if (this.config.correlationId)
                formattedMessage = timestamp + ':' + this.config.correlationId + '-' + this._libVersion() + '-' + this.CONSTANTS.LEVEL_STRING_MAP[level] + ' ' + message;
            else
                formattedMessage = timestamp + ':' + this._libVersion() + '-' + this.CONSTANTS.LEVEL_STRING_MAP[level] + ' ' + message;

            if (error) {
                formattedMessage += '\nstack:\n' + error.stack;
            }

            Logging.log(formattedMessage);
        }
    };

    /**
     * Logs messages when Logging Level is set to 0.
     * @param {string} message  -  Message to log.
     * @param {string} error  -  Error to log.
     */
    AuthenticationContext.prototype.error = function (message, error) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR, message, error);
    };

    /**
     * Logs messages when Logging Level is set to 1.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.warn = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.WARN, message, null);
    };

    /**
     * Logs messages when Logging Level is set to 2.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.info = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.INFO, message, null);
    };

    /**
     * Logs messages when Logging Level is set to 3.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.verbose = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE, message, null);
    };

    /**
    * Logs Pii messages when Logging Level is set to 0 and window.piiLoggingEnabled is set to true.
    * @param {string} message  -  Message to log.
    * @param {string} error  -  Error to log.
    */
    AuthenticationContext.prototype.errorPii = function (message, error) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR, message, error, true);
    };

    /**
     * Logs  Pii messages when Logging Level is set to 1 and window.piiLoggingEnabled is set to true.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.warnPii = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.WARN, message, null, true);
    };

    /**
     * Logs messages when Logging Level is set to 2 and window.piiLoggingEnabled is set to true.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.infoPii = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.INFO, message, null, true);
    };

    /**
     * Logs messages when Logging Level is set to 3 and window.piiLoggingEnabled is set to true.
     * @param {string} message  -  Message to log.
     */
    AuthenticationContext.prototype.verbosePii = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE, message, null, true);
    };
    /**
     * Returns the library version.
     * @ignore
     */
    AuthenticationContext.prototype._libVersion = function () {
        return '1.0.17';
    };

    /**
     * Returns a reference of Authentication Context as a result of a require call.
     * @ignore
     */
    if ( true && module.exports) {
        module.exports = AuthenticationContext;
        module.exports.inject = function (conf) {
            return new AuthenticationContext(conf);
        };
    }

    return AuthenticationContext;

}());


/***/ }),

/***/ "./node_modules/angular-oauth2-oidc/esm5/angular-oauth2-oidc.js":
/*!**********************************************************************!*\
  !*** ./node_modules/angular-oauth2-oidc/esm5/angular-oauth2-oidc.js ***!
  \**********************************************************************/
/*! exports provided: OAuthModule, OAuthService, JwksValidationHandler, NullValidationHandler, ValidationHandler, AbstractValidationHandler, UrlHelperService, AuthConfig, LoginOptions, OAuthLogger, OAuthStorage, ReceivedTokens, AUTH_CONFIG, OAuthEvent, OAuthSuccessEvent, OAuthInfoEvent, OAuthErrorEvent, DefaultOAuthInterceptor, OAuthResourceServerErrorHandler, OAuthNoopResourceServerErrorHandler, OAuthModuleConfig, OAuthResourceServerConfig, ɵa, ɵb */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthModule", function() { return OAuthModule; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthService", function() { return OAuthService; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "JwksValidationHandler", function() { return JwksValidationHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NullValidationHandler", function() { return NullValidationHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ValidationHandler", function() { return ValidationHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AbstractValidationHandler", function() { return AbstractValidationHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "UrlHelperService", function() { return UrlHelperService; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AuthConfig", function() { return AuthConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LoginOptions", function() { return LoginOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthLogger", function() { return OAuthLogger; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthStorage", function() { return OAuthStorage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ReceivedTokens", function() { return ReceivedTokens; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AUTH_CONFIG", function() { return AUTH_CONFIG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthEvent", function() { return OAuthEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthSuccessEvent", function() { return OAuthSuccessEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthInfoEvent", function() { return OAuthInfoEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthErrorEvent", function() { return OAuthErrorEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DefaultOAuthInterceptor", function() { return DefaultOAuthInterceptor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthResourceServerErrorHandler", function() { return OAuthResourceServerErrorHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthNoopResourceServerErrorHandler", function() { return OAuthNoopResourceServerErrorHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthModuleConfig", function() { return OAuthModuleConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthResourceServerConfig", function() { return OAuthResourceServerConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ɵa", function() { return createDefaultLogger; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ɵb", function() { return createDefaultStorage; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var jsrsasign__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! jsrsasign */ "./node_modules/jsrsasign/lib/jsrsasign.js");
/* harmony import */ var jsrsasign__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(jsrsasign__WEBPACK_IMPORTED_MODULE_6__);








var LoginOptions = /** @class */ (function () {
    function LoginOptions() {
        this.preventClearHashAfterLogin = false;
    }
    return LoginOptions;
}());
var OAuthLogger = /** @class */ (function () {
    function OAuthLogger() {
    }
    return OAuthLogger;
}());
var OAuthStorage = /** @class */ (function () {
    function OAuthStorage() {
    }
    return OAuthStorage;
}());
var ReceivedTokens = /** @class */ (function () {
    function ReceivedTokens() {
    }
    return ReceivedTokens;
}());
var ValidationHandler = /** @class */ (function () {
    function ValidationHandler() {
    }
    return ValidationHandler;
}());
var AbstractValidationHandler = /** @class */ (function () {
    function AbstractValidationHandler() {
    }
    AbstractValidationHandler.prototype.validateAtHash = function (params) {
        return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__awaiter"])(this, void 0, void 0, function () {
            var hashAlg, tokenHash, leftMostHalf, tokenHashBase64, atHash, claimsAtHash;
            return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__generator"])(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hashAlg = this.inferHashAlgorithm(params.idTokenHeader);
                        return [4 /*yield*/, this.calcHash(params.accessToken, hashAlg)];
                    case 1:
                        tokenHash = _a.sent();
                        leftMostHalf = tokenHash.substr(0, tokenHash.length / 2);
                        tokenHashBase64 = btoa(leftMostHalf);
                        atHash = tokenHashBase64
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')
                            .replace(/=/g, '');
                        claimsAtHash = params.idTokenClaims['at_hash'].replace(/=/g, '');
                        if (atHash !== claimsAtHash) {
                            console.error('exptected at_hash: ' + atHash);
                            console.error('actual at_hash: ' + claimsAtHash);
                        }
                        return [2 /*return*/, atHash === claimsAtHash];
                }
            });
        });
    };
    AbstractValidationHandler.prototype.inferHashAlgorithm = function (jwtHeader) {
        var alg = jwtHeader['alg'];
        if (!alg.match(/^.S[0-9]{3}$/)) {
            throw new Error('Algorithm not supported: ' + alg);
        }
        return 'sha-' + alg.substr(2);
    };
    return AbstractValidationHandler;
}());
var UrlHelperService = /** @class */ (function () {
    function UrlHelperService() {
    }
    UrlHelperService.prototype.getHashFragmentParams = function (customHashFragment) {
        var hash = customHashFragment || window.location.hash;
        hash = decodeURIComponent(hash);
        if (hash.indexOf('#') !== 0) {
            return {};
        }
        var questionMarkPosition = hash.indexOf('?');
        if (questionMarkPosition > -1) {
            hash = hash.substr(questionMarkPosition + 1);
        }
        else {
            hash = hash.substr(1);
        }
        return this.parseQueryString(hash);
    };
    UrlHelperService.prototype.parseQueryString = function (queryString) {
        var data = {};
        var pairs;
        var pair;
        var separatorIndex;
        var escapedKey;
        var escapedValue;
        var key;
        var value;
        if (queryString === null) {
            return data;
        }
        pairs = queryString.split('&');
        for (var i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            separatorIndex = pair.indexOf('=');
            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            }
            else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }
            key = decodeURIComponent(escapedKey);
            value = decodeURIComponent(escapedValue);
            if (key.substr(0, 1) === '/') {
                key = key.substr(1);
            }
            data[key] = value;
        }
        return data;
    };
    return UrlHelperService;
}());
UrlHelperService.decorators = [
    { type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"] },
];
var OAuthEvent = /** @class */ (function () {
    function OAuthEvent(type) {
        this.type = type;
    }
    return OAuthEvent;
}());
var OAuthSuccessEvent = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(OAuthSuccessEvent, _super);
    function OAuthSuccessEvent(type, info) {
        if (info === void 0) { info = null; }
        var _this = _super.call(this, type) || this;
        _this.info = info;
        return _this;
    }
    return OAuthSuccessEvent;
}(OAuthEvent));
var OAuthInfoEvent = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(OAuthInfoEvent, _super);
    function OAuthInfoEvent(type, info) {
        if (info === void 0) { info = null; }
        var _this = _super.call(this, type) || this;
        _this.info = info;
        return _this;
    }
    return OAuthInfoEvent;
}(OAuthEvent));
var OAuthErrorEvent = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(OAuthErrorEvent, _super);
    function OAuthErrorEvent(type, reason, params) {
        if (params === void 0) { params = null; }
        var _this = _super.call(this, type) || this;
        _this.reason = reason;
        _this.params = params;
        return _this;
    }
    return OAuthErrorEvent;
}(OAuthEvent));
function b64DecodeUnicode(str) {
    var base64 = str.replace(/\-/g, '+').replace(/\_/g, '/');
    return decodeURIComponent(atob(base64)
        .split('')
        .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    })
        .join(''));
}
var AuthConfig = /** @class */ (function () {
    function AuthConfig(json) {
        this.clientId = '';
        this.redirectUri = '';
        this.postLogoutRedirectUri = '';
        this.loginUrl = '';
        this.scope = 'openid profile';
        this.resource = '';
        this.rngUrl = '';
        this.oidc = true;
        this.requestAccessToken = true;
        this.options = null;
        this.issuer = '';
        this.logoutUrl = '';
        this.clearHashAfterLogin = true;
        this.tokenEndpoint = null;
        this.userinfoEndpoint = null;
        this.responseType = '';
        this.showDebugInformation = false;
        this.silentRefreshRedirectUri = '';
        this.silentRefreshMessagePrefix = '';
        this.silentRefreshShowIFrame = false;
        this.siletRefreshTimeout = 1000 * 20;
        this.silentRefreshTimeout = 1000 * 20;
        this.dummyClientSecret = null;
        this.requireHttps = 'remoteOnly';
        this.strictDiscoveryDocumentValidation = true;
        this.jwks = null;
        this.customQueryParams = null;
        this.silentRefreshIFrameName = 'angular-oauth-oidc-silent-refresh-iframe';
        this.timeoutFactor = 0.75;
        this.sessionChecksEnabled = false;
        this.sessionCheckIntervall = 3 * 1000;
        this.sessionCheckIFrameUrl = null;
        this.sessionCheckIFrameName = 'angular-oauth-oidc-check-session-iframe';
        this.disableAtHashCheck = false;
        this.skipSubjectCheck = false;
        this.useIdTokenHintForSilentRefresh = false;
        this.skipIssuerCheck = false;
        this.nonceStateSeparator = ';';
        this.useHttpBasicAuthForPasswordFlow = false;
        this.openUri = function (uri) {
            location.href = uri;
        };
        if (json) {
            Object.assign(this, json);
        }
    }
    return AuthConfig;
}());
var WebHttpUrlEncodingCodec = /** @class */ (function () {
    function WebHttpUrlEncodingCodec() {
    }
    WebHttpUrlEncodingCodec.prototype.encodeKey = function (k) {
        return encodeURIComponent(k);
    };
    WebHttpUrlEncodingCodec.prototype.encodeValue = function (v) {
        return encodeURIComponent(v);
    };
    WebHttpUrlEncodingCodec.prototype.decodeKey = function (k) {
        return decodeURIComponent(k);
    };
    WebHttpUrlEncodingCodec.prototype.decodeValue = function (v) {
        return decodeURIComponent(v);
    };
    return WebHttpUrlEncodingCodec;
}());
var OAuthService = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(OAuthService, _super);
    function OAuthService(ngZone, http, storage, tokenValidationHandler, config, urlHelper, logger) {
        var _this = _super.call(this) || this;
        _this.ngZone = ngZone;
        _this.http = http;
        _this.config = config;
        _this.urlHelper = urlHelper;
        _this.logger = logger;
        _this.discoveryDocumentLoaded = false;
        _this.state = '';
        _this.eventsSubject = new rxjs__WEBPACK_IMPORTED_MODULE_3__["Subject"]();
        _this.discoveryDocumentLoadedSubject = new rxjs__WEBPACK_IMPORTED_MODULE_3__["Subject"]();
        _this.grantTypesSupported = [];
        _this.inImplicitFlow = false;
        _this.discoveryDocumentLoaded$ = _this.discoveryDocumentLoadedSubject.asObservable();
        _this.events = _this.eventsSubject.asObservable();
        if (tokenValidationHandler) {
            _this.tokenValidationHandler = tokenValidationHandler;
        }
        if (config) {
            _this.configure(config);
        }
        try {
            if (storage) {
                _this.setStorage(storage);
            }
            else if (typeof sessionStorage !== 'undefined') {
                _this.setStorage(sessionStorage);
            }
        }
        catch (e) {
            console.error('No OAuthStorage provided and cannot access default (sessionStorage).'
                + 'Consider providing a custom OAuthStorage implementation in your module.', e);
        }
        _this.setupRefreshTimer();
        return _this;
    }
    OAuthService.prototype.configure = function (config) {
        Object.assign(this, new AuthConfig(), config);
        this.config = Object.assign((({})), new AuthConfig(), config);
        if (this.sessionChecksEnabled) {
            this.setupSessionCheck();
        }
        this.configChanged();
    };
    OAuthService.prototype.configChanged = function () { };
    OAuthService.prototype.restartSessionChecksIfStillLoggedIn = function () {
        if (this.hasValidIdToken()) {
            this.initSessionCheck();
        }
    };
    OAuthService.prototype.restartRefreshTimerIfStillLoggedIn = function () {
        this.setupExpirationTimers();
    };
    OAuthService.prototype.setupSessionCheck = function () {
        var _this = this;
        this.events.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'token_received'; })).subscribe(function (e) {
            _this.initSessionCheck();
        });
    };
    OAuthService.prototype.setupAutomaticSilentRefresh = function (params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        this.events.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'token_expires'; })).subscribe(function (e) {
            _this.silentRefresh(params).catch(function (_) {
                _this.debug('Automatic silent refresh did not work');
            });
        });
        this.restartRefreshTimerIfStillLoggedIn();
    };
    OAuthService.prototype.loadDiscoveryDocumentAndTryLogin = function (options) {
        var _this = this;
        if (options === void 0) { options = null; }
        return this.loadDiscoveryDocument().then(function (doc) {
            return _this.tryLogin(options);
        });
    };
    OAuthService.prototype.loadDiscoveryDocumentAndLogin = function (options) {
        var _this = this;
        if (options === void 0) { options = null; }
        return this.loadDiscoveryDocumentAndTryLogin(options).then(function (_) {
            if (!_this.hasValidIdToken() || !_this.hasValidAccessToken()) {
                _this.initImplicitFlow();
                return false;
            }
            else {
                return true;
            }
        });
    };
    OAuthService.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.showDebugInformation) {
            this.logger.debug.apply(console, args);
        }
    };
    OAuthService.prototype.validateUrlFromDiscoveryDocument = function (url) {
        var errors = [];
        var httpsCheck = this.validateUrlForHttps(url);
        var issuerCheck = this.validateUrlAgainstIssuer(url);
        if (!httpsCheck) {
            errors.push('https for all urls required. Also for urls received by discovery.');
        }
        if (!issuerCheck) {
            errors.push('Every url in discovery document has to start with the issuer url.' +
                'Also see property strictDiscoveryDocumentValidation.');
        }
        return errors;
    };
    OAuthService.prototype.validateUrlForHttps = function (url) {
        if (!url) {
            return true;
        }
        var lcUrl = url.toLowerCase();
        if (this.requireHttps === false) {
            return true;
        }
        if ((lcUrl.match(/^http:\/\/localhost($|[:\/])/) ||
            lcUrl.match(/^http:\/\/localhost($|[:\/])/)) &&
            this.requireHttps === 'remoteOnly') {
            return true;
        }
        return lcUrl.startsWith('https://');
    };
    OAuthService.prototype.validateUrlAgainstIssuer = function (url) {
        if (!this.strictDiscoveryDocumentValidation) {
            return true;
        }
        if (!url) {
            return true;
        }
        return url.toLowerCase().startsWith(this.issuer.toLowerCase());
    };
    OAuthService.prototype.setupRefreshTimer = function () {
        var _this = this;
        if (typeof window === 'undefined') {
            this.debug('timer not supported on this plattform');
            return;
        }
        if (this.hasValidIdToken()) {
            this.clearAccessTokenTimer();
            this.clearIdTokenTimer();
            this.setupExpirationTimers();
        }
        this.events.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'token_received'; })).subscribe(function (_) {
            _this.clearAccessTokenTimer();
            _this.clearIdTokenTimer();
            _this.setupExpirationTimers();
        });
    };
    OAuthService.prototype.setupExpirationTimers = function () {
        var idTokenExp = this.getIdTokenExpiration() || Number.MAX_VALUE;
        var accessTokenExp = this.getAccessTokenExpiration() || Number.MAX_VALUE;
        var useAccessTokenExp = accessTokenExp <= idTokenExp;
        if (this.hasValidAccessToken() && useAccessTokenExp) {
            this.setupAccessTokenTimer();
        }
        if (this.hasValidIdToken() && !useAccessTokenExp) {
            this.setupIdTokenTimer();
        }
    };
    OAuthService.prototype.setupAccessTokenTimer = function () {
        var _this = this;
        var expiration = this.getAccessTokenExpiration();
        var storedAt = this.getAccessTokenStoredAt();
        var timeout = this.calcTimeout(storedAt, expiration);
        this.ngZone.runOutsideAngular(function () {
            _this.accessTokenTimeoutSubscription = Object(rxjs__WEBPACK_IMPORTED_MODULE_3__["of"])(new OAuthInfoEvent('token_expires', 'access_token'))
                .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["delay"])(timeout))
                .subscribe(function (e) {
                _this.ngZone.run(function () {
                    _this.eventsSubject.next(e);
                });
            });
        });
    };
    OAuthService.prototype.setupIdTokenTimer = function () {
        var _this = this;
        var expiration = this.getIdTokenExpiration();
        var storedAt = this.getIdTokenStoredAt();
        var timeout = this.calcTimeout(storedAt, expiration);
        this.ngZone.runOutsideAngular(function () {
            _this.idTokenTimeoutSubscription = Object(rxjs__WEBPACK_IMPORTED_MODULE_3__["of"])(new OAuthInfoEvent('token_expires', 'id_token'))
                .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["delay"])(timeout))
                .subscribe(function (e) {
                _this.ngZone.run(function () {
                    _this.eventsSubject.next(e);
                });
            });
        });
    };
    OAuthService.prototype.clearAccessTokenTimer = function () {
        if (this.accessTokenTimeoutSubscription) {
            this.accessTokenTimeoutSubscription.unsubscribe();
        }
    };
    OAuthService.prototype.clearIdTokenTimer = function () {
        if (this.idTokenTimeoutSubscription) {
            this.idTokenTimeoutSubscription.unsubscribe();
        }
    };
    OAuthService.prototype.calcTimeout = function (storedAt, expiration) {
        var delta = (expiration - storedAt) * this.timeoutFactor;
        return delta;
    };
    OAuthService.prototype.setStorage = function (storage) {
        this._storage = storage;
        this.configChanged();
    };
    OAuthService.prototype.loadDiscoveryDocument = function (fullUrl) {
        var _this = this;
        if (fullUrl === void 0) { fullUrl = null; }
        return new Promise(function (resolve, reject) {
            if (!fullUrl) {
                fullUrl = _this.issuer || '';
                if (!fullUrl.endsWith('/')) {
                    fullUrl += '/';
                }
                fullUrl += '.well-known/openid-configuration';
            }
            if (!_this.validateUrlForHttps(fullUrl)) {
                reject('issuer must use https, or config value for property requireHttps must allow http');
                return;
            }
            _this.http.get(fullUrl).subscribe(function (doc) {
                if (!_this.validateDiscoveryDocument(doc)) {
                    _this.eventsSubject.next(new OAuthErrorEvent('discovery_document_validation_error', null));
                    reject('discovery_document_validation_error');
                    return;
                }
                _this.loginUrl = doc.authorization_endpoint;
                _this.logoutUrl = doc.end_session_endpoint || _this.logoutUrl;
                _this.grantTypesSupported = doc.grant_types_supported;
                _this.issuer = doc.issuer;
                _this.tokenEndpoint = doc.token_endpoint;
                _this.userinfoEndpoint = doc.userinfo_endpoint;
                _this.jwksUri = doc.jwks_uri;
                _this.sessionCheckIFrameUrl = doc.check_session_iframe || _this.sessionCheckIFrameUrl;
                _this.discoveryDocumentLoaded = true;
                _this.discoveryDocumentLoadedSubject.next(doc);
                if (_this.sessionChecksEnabled) {
                    _this.restartSessionChecksIfStillLoggedIn();
                }
                _this.loadJwks()
                    .then(function (jwks) {
                    var result = {
                        discoveryDocument: doc,
                        jwks: jwks
                    };
                    var event = new OAuthSuccessEvent('discovery_document_loaded', result);
                    _this.eventsSubject.next(event);
                    resolve(event);
                    return;
                })
                    .catch(function (err) {
                    _this.eventsSubject.next(new OAuthErrorEvent('discovery_document_load_error', err));
                    reject(err);
                    return;
                });
            }, function (err) {
                _this.logger.error('error loading discovery document', err);
                _this.eventsSubject.next(new OAuthErrorEvent('discovery_document_load_error', err));
                reject(err);
            });
        });
    };
    OAuthService.prototype.loadJwks = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.jwksUri) {
                _this.http.get(_this.jwksUri).subscribe(function (jwks) {
                    _this.jwks = jwks;
                    _this.eventsSubject.next(new OAuthSuccessEvent('discovery_document_loaded'));
                    resolve(jwks);
                }, function (err) {
                    _this.logger.error('error loading jwks', err);
                    _this.eventsSubject.next(new OAuthErrorEvent('jwks_load_error', err));
                    reject(err);
                });
            }
            else {
                resolve(null);
            }
        });
    };
    OAuthService.prototype.validateDiscoveryDocument = function (doc) {
        var errors;
        if (!this.skipIssuerCheck && doc.issuer !== this.issuer) {
            this.logger.error('invalid issuer in discovery document', 'expected: ' + this.issuer, 'current: ' + doc.issuer);
            return false;
        }
        errors = this.validateUrlFromDiscoveryDocument(doc.authorization_endpoint);
        if (errors.length > 0) {
            this.logger.error('error validating authorization_endpoint in discovery document', errors);
            return false;
        }
        errors = this.validateUrlFromDiscoveryDocument(doc.end_session_endpoint);
        if (errors.length > 0) {
            this.logger.error('error validating end_session_endpoint in discovery document', errors);
            return false;
        }
        errors = this.validateUrlFromDiscoveryDocument(doc.token_endpoint);
        if (errors.length > 0) {
            this.logger.error('error validating token_endpoint in discovery document', errors);
        }
        errors = this.validateUrlFromDiscoveryDocument(doc.userinfo_endpoint);
        if (errors.length > 0) {
            this.logger.error('error validating userinfo_endpoint in discovery document', errors);
            return false;
        }
        errors = this.validateUrlFromDiscoveryDocument(doc.jwks_uri);
        if (errors.length > 0) {
            this.logger.error('error validating jwks_uri in discovery document', errors);
            return false;
        }
        if (this.sessionChecksEnabled && !doc.check_session_iframe) {
            this.logger.warn('sessionChecksEnabled is activated but discovery document' +
                ' does not contain a check_session_iframe field');
        }
        return true;
    };
    OAuthService.prototype.fetchTokenUsingPasswordFlowAndLoadUserProfile = function (userName, password, headers) {
        var _this = this;
        if (headers === void 0) { headers = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpHeaders"](); }
        return this.fetchTokenUsingPasswordFlow(userName, password, headers).then(function () { return _this.loadUserProfile(); });
    };
    OAuthService.prototype.loadUserProfile = function () {
        var _this = this;
        if (!this.hasValidAccessToken()) {
            throw new Error('Can not load User Profile without access_token');
        }
        if (!this.validateUrlForHttps(this.userinfoEndpoint)) {
            throw new Error('userinfoEndpoint must use http, or config value for property requireHttps must allow http');
        }
        return new Promise(function (resolve, reject) {
            var headers = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpHeaders"]().set('Authorization', 'Bearer ' + _this.getAccessToken());
            _this.http.get(_this.userinfoEndpoint, { headers: headers }).subscribe(function (info) {
                _this.debug('userinfo received', info);
                var existingClaims = _this.getIdentityClaims() || {};
                if (!_this.skipSubjectCheck) {
                    if (_this.oidc &&
                        (!existingClaims['sub'] || info.sub !== existingClaims['sub'])) {
                        var err = 'if property oidc is true, the received user-id (sub) has to be the user-id ' +
                            'of the user that has logged in with oidc.\n' +
                            'if you are not using oidc but just oauth2 password flow set oidc to false';
                        reject(err);
                        return;
                    }
                }
                info = Object.assign({}, existingClaims, info);
                _this._storage.setItem('id_token_claims_obj', JSON.stringify(info));
                _this.eventsSubject.next(new OAuthSuccessEvent('user_profile_loaded'));
                resolve(info);
            }, function (err) {
                _this.logger.error('error loading user info', err);
                _this.eventsSubject.next(new OAuthErrorEvent('user_profile_load_error', err));
                reject(err);
            });
        });
    };
    OAuthService.prototype.fetchTokenUsingPasswordFlow = function (userName, password, headers) {
        var _this = this;
        if (headers === void 0) { headers = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpHeaders"](); }
        if (!this.validateUrlForHttps(this.tokenEndpoint)) {
            throw new Error('tokenEndpoint must use http, or config value for property requireHttps must allow http');
        }
        return new Promise(function (resolve, reject) {
            var e_1, _a;
            var params = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpParams"]({ encoder: new WebHttpUrlEncodingCodec() })
                .set('grant_type', 'password')
                .set('scope', _this.scope)
                .set('username', userName)
                .set('password', password);
            if (_this.useHttpBasicAuthForPasswordFlow) {
                var header = btoa(_this.clientId + ":" + _this.dummyClientSecret);
                headers = headers.set('Authorization', 'Basic ' + header);
            }
            if (!_this.useHttpBasicAuthForPasswordFlow) {
                params = params.set('client_id', _this.clientId);
            }
            if (!_this.useHttpBasicAuthForPasswordFlow && _this.dummyClientSecret) {
                params = params.set('client_secret', _this.dummyClientSecret);
            }
            if (_this.customQueryParams) {
                try {
                    for (var _b = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__values"])(Object.getOwnPropertyNames(_this.customQueryParams)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var key = _c.value;
                        params = params.set(key, _this.customQueryParams[key]);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
            _this.http
                .post(_this.tokenEndpoint, params, { headers: headers })
                .subscribe(function (tokenResponse) {
                _this.debug('tokenResponse', tokenResponse);
                _this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in, tokenResponse.scope);
                _this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                resolve(tokenResponse);
            }, function (err) {
                _this.logger.error('Error performing password flow', err);
                _this.eventsSubject.next(new OAuthErrorEvent('token_error', err));
                reject(err);
            });
        });
    };
    OAuthService.prototype.refreshToken = function () {
        var _this = this;
        if (!this.validateUrlForHttps(this.tokenEndpoint)) {
            throw new Error('tokenEndpoint must use http, or config value for property requireHttps must allow http');
        }
        return new Promise(function (resolve, reject) {
            var e_2, _a;
            var params = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpParams"]()
                .set('grant_type', 'refresh_token')
                .set('client_id', _this.clientId)
                .set('scope', _this.scope)
                .set('refresh_token', _this._storage.getItem('refresh_token'));
            if (_this.dummyClientSecret) {
                params = params.set('client_secret', _this.dummyClientSecret);
            }
            if (_this.customQueryParams) {
                try {
                    for (var _b = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__values"])(Object.getOwnPropertyNames(_this.customQueryParams)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var key = _c.value;
                        params = params.set(key, _this.customQueryParams[key]);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            var headers = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpHeaders"]().set('Content-Type', 'application/x-www-form-urlencoded');
            _this.http
                .post(_this.tokenEndpoint, params, { headers: headers })
                .subscribe(function (tokenResponse) {
                _this.debug('refresh tokenResponse', tokenResponse);
                _this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in, tokenResponse.scope);
                _this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                _this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
                resolve(tokenResponse);
            }, function (err) {
                _this.logger.error('Error performing password flow', err);
                _this.eventsSubject.next(new OAuthErrorEvent('token_refresh_error', err));
                reject(err);
            });
        });
    };
    OAuthService.prototype.removeSilentRefreshEventListener = function () {
        if (this.silentRefreshPostMessageEventListener) {
            window.removeEventListener('message', this.silentRefreshPostMessageEventListener);
            this.silentRefreshPostMessageEventListener = null;
        }
    };
    OAuthService.prototype.setupSilentRefreshEventListener = function () {
        var _this = this;
        this.removeSilentRefreshEventListener();
        this.silentRefreshPostMessageEventListener = function (e) {
            var expectedPrefix = '#';
            if (_this.silentRefreshMessagePrefix) {
                expectedPrefix += _this.silentRefreshMessagePrefix;
            }
            if (!e || !e.data || typeof e.data !== 'string') {
                return;
            }
            var prefixedMessage = e.data;
            if (!prefixedMessage.startsWith(expectedPrefix)) {
                return;
            }
            var message = '#' + prefixedMessage.substr(expectedPrefix.length);
            _this.tryLogin({
                customHashFragment: message,
                preventClearHashAfterLogin: true,
                onLoginError: function (err) {
                    _this.eventsSubject.next(new OAuthErrorEvent('silent_refresh_error', err));
                },
                onTokenReceived: function () {
                    _this.eventsSubject.next(new OAuthSuccessEvent('silently_refreshed'));
                }
            }).catch(function (err) { return _this.debug('tryLogin during silent refresh failed', err); });
        };
        window.addEventListener('message', this.silentRefreshPostMessageEventListener);
    };
    OAuthService.prototype.silentRefresh = function (params, noPrompt) {
        var _this = this;
        if (params === void 0) { params = {}; }
        if (noPrompt === void 0) { noPrompt = true; }
        var claims = this.getIdentityClaims() || {};
        if (this.useIdTokenHintForSilentRefresh && this.hasValidIdToken()) {
            params['id_token_hint'] = this.getIdToken();
        }
        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error('tokenEndpoint must use https, or config value for property requireHttps must allow http');
        }
        if (typeof document === 'undefined') {
            throw new Error('silent refresh is not supported on this platform');
        }
        var existingIframe = document.getElementById(this.silentRefreshIFrameName);
        if (existingIframe) {
            document.body.removeChild(existingIframe);
        }
        this.silentRefreshSubject = claims['sub'];
        var iframe = document.createElement('iframe');
        iframe.id = this.silentRefreshIFrameName;
        this.setupSilentRefreshEventListener();
        var redirectUri = this.silentRefreshRedirectUri || this.redirectUri;
        this.createLoginUrl(null, null, redirectUri, noPrompt, params).then(function (url) {
            iframe.setAttribute('src', url);
            if (!_this.silentRefreshShowIFrame) {
                iframe.style['display'] = 'none';
            }
            document.body.appendChild(iframe);
        });
        var errors = this.events.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e instanceof OAuthErrorEvent; }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["first"])());
        var success = this.events.pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'silently_refreshed'; }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["first"])());
        var timeout = Object(rxjs__WEBPACK_IMPORTED_MODULE_3__["of"])(new OAuthErrorEvent('silent_refresh_timeout', null)).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["delay"])(this.silentRefreshTimeout));
        return Object(rxjs__WEBPACK_IMPORTED_MODULE_3__["race"])([errors, success, timeout])
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["tap"])(function (e) {
            if (e.type === 'silent_refresh_timeout') {
                _this.eventsSubject.next(e);
            }
        }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["map"])(function (e) {
            if (e instanceof OAuthErrorEvent) {
                throw e;
            }
            return e;
        }))
            .toPromise();
    };
    OAuthService.prototype.canPerformSessionCheck = function () {
        if (!this.sessionChecksEnabled) {
            return false;
        }
        if (!this.sessionCheckIFrameUrl) {
            console.warn('sessionChecksEnabled is activated but there is no sessionCheckIFrameUrl');
            return false;
        }
        var sessionState = this.getSessionState();
        if (!sessionState) {
            console.warn('sessionChecksEnabled is activated but there is no session_state');
            return false;
        }
        if (typeof document === 'undefined') {
            return false;
        }
        return true;
    };
    OAuthService.prototype.setupSessionCheckEventListener = function () {
        var _this = this;
        this.removeSessionCheckEventListener();
        this.sessionCheckEventListener = function (e) {
            var origin = e.origin.toLowerCase();
            var issuer = _this.issuer.toLowerCase();
            _this.debug('sessionCheckEventListener');
            if (!issuer.startsWith(origin)) {
                _this.debug('sessionCheckEventListener', 'wrong origin', origin, 'expected', issuer);
            }
            switch (e.data) {
                case 'unchanged':
                    _this.handleSessionUnchanged();
                    break;
                case 'changed':
                    _this.ngZone.run(function () {
                        _this.handleSessionChange();
                    });
                    break;
                case 'error':
                    _this.ngZone.run(function () {
                        _this.handleSessionError();
                    });
                    break;
            }
            _this.debug('got info from session check inframe', e);
        };
        this.ngZone.runOutsideAngular(function () {
            window.addEventListener('message', _this.sessionCheckEventListener);
        });
    };
    OAuthService.prototype.handleSessionUnchanged = function () {
        this.debug('session check', 'session unchanged');
    };
    OAuthService.prototype.handleSessionChange = function () {
        var _this = this;
        this.eventsSubject.next(new OAuthInfoEvent('session_changed'));
        this.stopSessionCheckTimer();
        if (this.silentRefreshRedirectUri) {
            this.silentRefresh().catch(function (_) { return _this.debug('silent refresh failed after session changed'); });
            this.waitForSilentRefreshAfterSessionChange();
        }
        else {
            this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
            this.logOut(true);
        }
    };
    OAuthService.prototype.waitForSilentRefreshAfterSessionChange = function () {
        var _this = this;
        this.events
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'silently_refreshed' ||
            e.type === 'silent_refresh_timeout' ||
            e.type === 'silent_refresh_error'; }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["first"])())
            .subscribe(function (e) {
            if (e.type !== 'silently_refreshed') {
                _this.debug('silent refresh did not work after session changed');
                _this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
                _this.logOut(true);
            }
        });
    };
    OAuthService.prototype.handleSessionError = function () {
        this.stopSessionCheckTimer();
        this.eventsSubject.next(new OAuthInfoEvent('session_error'));
    };
    OAuthService.prototype.removeSessionCheckEventListener = function () {
        if (this.sessionCheckEventListener) {
            window.removeEventListener('message', this.sessionCheckEventListener);
            this.sessionCheckEventListener = null;
        }
    };
    OAuthService.prototype.initSessionCheck = function () {
        if (!this.canPerformSessionCheck()) {
            return;
        }
        var existingIframe = document.getElementById(this.sessionCheckIFrameName);
        if (existingIframe) {
            document.body.removeChild(existingIframe);
        }
        var iframe = document.createElement('iframe');
        iframe.id = this.sessionCheckIFrameName;
        this.setupSessionCheckEventListener();
        var url = this.sessionCheckIFrameUrl;
        iframe.setAttribute('src', url);
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        this.startSessionCheckTimer();
    };
    OAuthService.prototype.startSessionCheckTimer = function () {
        var _this = this;
        this.stopSessionCheckTimer();
        this.ngZone.runOutsideAngular(function () {
            _this.sessionCheckTimer = setInterval(_this.checkSession.bind(_this), _this.sessionCheckIntervall);
        });
    };
    OAuthService.prototype.stopSessionCheckTimer = function () {
        if (this.sessionCheckTimer) {
            clearInterval(this.sessionCheckTimer);
            this.sessionCheckTimer = null;
        }
    };
    OAuthService.prototype.checkSession = function () {
        var iframe = document.getElementById(this.sessionCheckIFrameName);
        if (!iframe) {
            this.logger.warn('checkSession did not find iframe', this.sessionCheckIFrameName);
        }
        var sessionState = this.getSessionState();
        if (!sessionState) {
            this.stopSessionCheckTimer();
        }
        var message = this.clientId + ' ' + sessionState;
        iframe.contentWindow.postMessage(message, this.issuer);
    };
    OAuthService.prototype.createLoginUrl = function (state, loginHint, customRedirectUri, noPrompt, params) {
        var _this = this;
        if (state === void 0) { state = ''; }
        if (loginHint === void 0) { loginHint = ''; }
        if (customRedirectUri === void 0) { customRedirectUri = ''; }
        if (noPrompt === void 0) { noPrompt = false; }
        if (params === void 0) { params = {}; }
        var that = this;
        var redirectUri;
        if (customRedirectUri) {
            redirectUri = customRedirectUri;
        }
        else {
            redirectUri = this.redirectUri;
        }
        return this.createAndSaveNonce().then(function (nonce) {
            var e_3, _a, e_4, _b;
            if (state) {
                state = nonce + _this.config.nonceStateSeparator + state;
            }
            else {
                state = nonce;
            }
            if (!_this.requestAccessToken && !_this.oidc) {
                throw new Error('Either requestAccessToken or oidc or both must be true');
            }
            if (_this.config.responseType) {
                _this.responseType = _this.config.responseType;
            }
            else {
                if (_this.oidc && _this.requestAccessToken) {
                    _this.responseType = 'id_token token';
                }
                else if (_this.oidc && !_this.requestAccessToken) {
                    _this.responseType = 'id_token';
                }
                else {
                    _this.responseType = 'token';
                }
            }
            var seperationChar = that.loginUrl.indexOf('?') > -1 ? '&' : '?';
            var scope = that.scope;
            if (_this.oidc && !scope.match(/(^|\s)openid($|\s)/)) {
                scope = 'openid ' + scope;
            }
            var url = that.loginUrl +
                seperationChar +
                'response_type=' +
                encodeURIComponent(that.responseType) +
                '&client_id=' +
                encodeURIComponent(that.clientId) +
                '&state=' +
                encodeURIComponent(state) +
                '&redirect_uri=' +
                encodeURIComponent(redirectUri) +
                '&scope=' +
                encodeURIComponent(scope);
            if (loginHint) {
                url += '&login_hint=' + encodeURIComponent(loginHint);
            }
            if (that.resource) {
                url += '&resource=' + encodeURIComponent(that.resource);
            }
            if (that.oidc) {
                url += '&nonce=' + encodeURIComponent(nonce);
            }
            if (noPrompt) {
                url += '&prompt=none';
            }
            try {
                for (var _c = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__values"])(Object.keys(params)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var key = _d.value;
                    url +=
                        '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_3) throw e_3.error; }
            }
            if (_this.customQueryParams) {
                try {
                    for (var _e = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__values"])(Object.getOwnPropertyNames(_this.customQueryParams)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var key = _f.value;
                        url +=
                            '&' + key + '=' + encodeURIComponent(_this.customQueryParams[key]);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            return url;
        });
    };
    OAuthService.prototype.initImplicitFlowInternal = function (additionalState, params) {
        var _this = this;
        if (additionalState === void 0) { additionalState = ''; }
        if (params === void 0) { params = ''; }
        if (this.inImplicitFlow) {
            return;
        }
        this.inImplicitFlow = true;
        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error('loginUrl must use http, or config value for property requireHttps must allow http');
        }
        var addParams = {};
        var loginHint = null;
        if (typeof params === 'string') {
            loginHint = params;
        }
        else if (typeof params === 'object') {
            addParams = params;
        }
        this.createLoginUrl(additionalState, loginHint, null, false, addParams)
            .then(function (url) {
            location.href = url;
        })
            .catch(function (error) {
            console.error('Error in initImplicitFlow', error);
            _this.inImplicitFlow = false;
        });
    };
    OAuthService.prototype.initImplicitFlow = function (additionalState, params) {
        var _this = this;
        if (additionalState === void 0) { additionalState = ''; }
        if (params === void 0) { params = ''; }
        if (this.loginUrl !== '') {
            this.initImplicitFlowInternal(additionalState, params);
        }
        else {
            this.events
                .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["filter"])(function (e) { return e.type === 'discovery_document_loaded'; }))
                .subscribe(function (_) { return _this.initImplicitFlowInternal(additionalState, params); });
        }
    };
    OAuthService.prototype.callOnTokenReceivedIfExists = function (options) {
        var that = this;
        if (options.onTokenReceived) {
            var tokenParams = {
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state
            };
            options.onTokenReceived(tokenParams);
        }
    };
    OAuthService.prototype.storeAccessTokenResponse = function (accessToken, refreshToken, expiresIn, grantedScopes) {
        this._storage.setItem('access_token', accessToken);
        if (grantedScopes) {
            this._storage.setItem('granted_scopes', JSON.stringify(grantedScopes.split('+')));
        }
        this._storage.setItem('access_token_stored_at', '' + Date.now());
        if (expiresIn) {
            var expiresInMilliSeconds = expiresIn * 1000;
            var now = new Date();
            var expiresAt = now.getTime() + expiresInMilliSeconds;
            this._storage.setItem('expires_at', '' + expiresAt);
        }
        if (refreshToken) {
            this._storage.setItem('refresh_token', refreshToken);
        }
    };
    OAuthService.prototype.tryLogin = function (options) {
        var _this = this;
        if (options === void 0) { options = null; }
        options = options || {};
        var parts;
        if (options.customHashFragment) {
            parts = this.urlHelper.getHashFragmentParams(options.customHashFragment);
        }
        else {
            parts = this.urlHelper.getHashFragmentParams();
        }
        this.debug('parsed url', parts);
        var state = parts['state'];
        var nonceInState = state;
        if (state) {
            var idx = state.indexOf(this.config.nonceStateSeparator);
            if (idx > -1) {
                nonceInState = state.substr(0, idx);
                this.state = state.substr(idx + this.config.nonceStateSeparator.length);
            }
        }
        if (parts['error']) {
            this.debug('error trying to login');
            this.handleLoginError(options, parts);
            var err = new OAuthErrorEvent('token_error', {}, parts);
            this.eventsSubject.next(err);
            return Promise.reject(err);
        }
        var accessToken = parts['access_token'];
        var idToken = parts['id_token'];
        var sessionState = parts['session_state'];
        var grantedScopes = parts['scope'];
        if (!this.requestAccessToken && !this.oidc) {
            return Promise.reject('Either requestAccessToken or oidc (or both) must be true.');
        }
        if (this.requestAccessToken && !accessToken) {
            return Promise.resolve(false);
        }
        if (this.requestAccessToken && !options.disableOAuth2StateCheck && !state) {
            return Promise.resolve(false);
        }
        if (this.oidc && !idToken) {
            return Promise.resolve(false);
        }
        if (this.sessionChecksEnabled && !sessionState) {
            this.logger.warn('session checks (Session Status Change Notification) ' +
                'were activated in the configuration but the id_token ' +
                'does not contain a session_state claim');
        }
        if (this.requestAccessToken && !options.disableOAuth2StateCheck) {
            var success = this.validateNonceForAccessToken(accessToken, nonceInState);
            if (!success) {
                var event = new OAuthErrorEvent('invalid_nonce_in_state', null);
                this.eventsSubject.next(event);
                return Promise.reject(event);
            }
        }
        if (this.requestAccessToken) {
            this.storeAccessTokenResponse(accessToken, null, parts['expires_in'] || this.fallbackAccessTokenExpirationTimeInSec, grantedScopes);
        }
        if (!this.oidc) {
            this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
            if (this.clearHashAfterLogin && !options.preventClearHashAfterLogin) {
                location.hash = '';
            }
            this.callOnTokenReceivedIfExists(options);
            return Promise.resolve(true);
        }
        return this.processIdToken(idToken, accessToken)
            .then(function (result) {
            if (options.validationHandler) {
                return options
                    .validationHandler({
                    accessToken: accessToken,
                    idClaims: result.idTokenClaims,
                    idToken: result.idToken,
                    state: state
                })
                    .then(function (_) { return result; });
            }
            return result;
        })
            .then(function (result) {
            _this.storeIdToken(result);
            _this.storeSessionState(sessionState);
            if (_this.clearHashAfterLogin) {
                location.hash = '';
            }
            _this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
            _this.callOnTokenReceivedIfExists(options);
            _this.inImplicitFlow = false;
            return true;
        })
            .catch(function (reason) {
            _this.eventsSubject.next(new OAuthErrorEvent('token_validation_error', reason));
            _this.logger.error('Error validating tokens');
            _this.logger.error(reason);
            return Promise.reject(reason);
        });
    };
    OAuthService.prototype.validateNonceForAccessToken = function (accessToken, nonceInState) {
        var savedNonce = this._storage.getItem('nonce');
        if (savedNonce !== nonceInState) {
            var err = 'Validating access_token failed, wrong state/nonce.';
            console.error(err, savedNonce, nonceInState);
            return false;
        }
        return true;
    };
    OAuthService.prototype.storeIdToken = function (idToken) {
        this._storage.setItem('id_token', idToken.idToken);
        this._storage.setItem('id_token_claims_obj', idToken.idTokenClaimsJson);
        this._storage.setItem('id_token_expires_at', '' + idToken.idTokenExpiresAt);
        this._storage.setItem('id_token_stored_at', '' + Date.now());
    };
    OAuthService.prototype.storeSessionState = function (sessionState) {
        this._storage.setItem('session_state', sessionState);
    };
    OAuthService.prototype.getSessionState = function () {
        return this._storage.getItem('session_state');
    };
    OAuthService.prototype.handleLoginError = function (options, parts) {
        if (options.onLoginError) {
            options.onLoginError(parts);
        }
        if (this.clearHashAfterLogin) {
            location.hash = '';
        }
    };
    OAuthService.prototype.processIdToken = function (idToken, accessToken) {
        var _this = this;
        var tokenParts = idToken.split('.');
        var headerBase64 = this.padBase64(tokenParts[0]);
        var headerJson = b64DecodeUnicode(headerBase64);
        var header = JSON.parse(headerJson);
        var claimsBase64 = this.padBase64(tokenParts[1]);
        var claimsJson = b64DecodeUnicode(claimsBase64);
        var claims = JSON.parse(claimsJson);
        var savedNonce = this._storage.getItem('nonce');
        if (Array.isArray(claims.aud)) {
            if (claims.aud.every(function (v) { return v !== _this.clientId; })) {
                var err = 'Wrong audience: ' + claims.aud.join(',');
                this.logger.warn(err);
                return Promise.reject(err);
            }
        }
        else {
            if (claims.aud !== this.clientId) {
                var err = 'Wrong audience: ' + claims.aud;
                this.logger.warn(err);
                return Promise.reject(err);
            }
        }
        if (!claims.sub) {
            var err = 'No sub claim in id_token';
            this.logger.warn(err);
            return Promise.reject(err);
        }
        if (this.sessionChecksEnabled &&
            this.silentRefreshSubject &&
            this.silentRefreshSubject !== claims['sub']) {
            var err = 'After refreshing, we got an id_token for another user (sub). ' +
                ("Expected sub: " + this.silentRefreshSubject + ", received sub: " + claims['sub']);
            this.logger.warn(err);
            return Promise.reject(err);
        }
        if (!claims.iat) {
            var err = 'No iat claim in id_token';
            this.logger.warn(err);
            return Promise.reject(err);
        }
        if (claims.iss !== this.issuer) {
            var err = 'Wrong issuer: ' + claims.iss;
            this.logger.warn(err);
            return Promise.reject(err);
        }
        if (claims.nonce !== savedNonce) {
            var err = 'Wrong nonce: ' + claims.nonce;
            this.logger.warn(err);
            return Promise.reject(err);
        }
        if (!this.disableAtHashCheck &&
            this.requestAccessToken &&
            !claims['at_hash']) {
            var err = 'An at_hash is needed!';
            this.logger.warn(err);
            return Promise.reject(err);
        }
        var now = Date.now();
        var issuedAtMSec = claims.iat * 1000;
        var expiresAtMSec = claims.exp * 1000;
        var tenMinutesInMsec = 1000 * 60 * 10;
        if (issuedAtMSec - tenMinutesInMsec >= now ||
            expiresAtMSec + tenMinutesInMsec <= now) {
            var err = 'Token has expired';
            console.error(err);
            console.error({
                now: now,
                issuedAtMSec: issuedAtMSec,
                expiresAtMSec: expiresAtMSec
            });
            return Promise.reject(err);
        }
        var validationParams = {
            accessToken: accessToken,
            idToken: idToken,
            jwks: this.jwks,
            idTokenClaims: claims,
            idTokenHeader: header,
            loadKeys: function () { return _this.loadJwks(); }
        };
        return this.checkAtHash(validationParams)
            .then(function (atHashValid) {
            if (!_this.disableAtHashCheck &&
                _this.requestAccessToken &&
                !atHashValid) {
                var err = 'Wrong at_hash';
                _this.logger.warn(err);
                return Promise.reject(err);
            }
            return _this.checkSignature(validationParams).then(function (_) {
                var result = {
                    idToken: idToken,
                    idTokenClaims: claims,
                    idTokenClaimsJson: claimsJson,
                    idTokenHeader: header,
                    idTokenHeaderJson: headerJson,
                    idTokenExpiresAt: expiresAtMSec
                };
                return result;
            });
        });
    };
    OAuthService.prototype.getIdentityClaims = function () {
        var claims = this._storage.getItem('id_token_claims_obj');
        if (!claims) {
            return null;
        }
        return JSON.parse(claims);
    };
    OAuthService.prototype.getGrantedScopes = function () {
        var scopes = this._storage.getItem('granted_scopes');
        if (!scopes) {
            return null;
        }
        return JSON.parse(scopes);
    };
    OAuthService.prototype.getIdToken = function () {
        return this._storage
            ? this._storage.getItem('id_token')
            : null;
    };
    OAuthService.prototype.padBase64 = function (base64data) {
        while (base64data.length % 4 !== 0) {
            base64data += '=';
        }
        return base64data;
    };
    OAuthService.prototype.getAccessToken = function () {
        return this._storage.getItem('access_token');
    };
    OAuthService.prototype.getRefreshToken = function () {
        return this._storage.getItem('refresh_token');
    };
    OAuthService.prototype.getAccessTokenExpiration = function () {
        if (!this._storage.getItem('expires_at')) {
            return null;
        }
        return parseInt(this._storage.getItem('expires_at'), 10);
    };
    OAuthService.prototype.getAccessTokenStoredAt = function () {
        return parseInt(this._storage.getItem('access_token_stored_at'), 10);
    };
    OAuthService.prototype.getIdTokenStoredAt = function () {
        return parseInt(this._storage.getItem('id_token_stored_at'), 10);
    };
    OAuthService.prototype.getIdTokenExpiration = function () {
        if (!this._storage.getItem('id_token_expires_at')) {
            return null;
        }
        return parseInt(this._storage.getItem('id_token_expires_at'), 10);
    };
    OAuthService.prototype.hasValidAccessToken = function () {
        if (this.getAccessToken()) {
            var expiresAt = this._storage.getItem('expires_at');
            var now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                return false;
            }
            return true;
        }
        return false;
    };
    OAuthService.prototype.hasValidIdToken = function () {
        if (this.getIdToken()) {
            var expiresAt = this._storage.getItem('id_token_expires_at');
            var now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                return false;
            }
            return true;
        }
        return false;
    };
    OAuthService.prototype.authorizationHeader = function () {
        return 'Bearer ' + this.getAccessToken();
    };
    OAuthService.prototype.logOut = function (noRedirectToLogoutUrl) {
        if (noRedirectToLogoutUrl === void 0) { noRedirectToLogoutUrl = false; }
        var id_token = this.getIdToken();
        this._storage.removeItem('access_token');
        this._storage.removeItem('id_token');
        this._storage.removeItem('refresh_token');
        this._storage.removeItem('nonce');
        this._storage.removeItem('expires_at');
        this._storage.removeItem('id_token_claims_obj');
        this._storage.removeItem('id_token_expires_at');
        this._storage.removeItem('id_token_stored_at');
        this._storage.removeItem('access_token_stored_at');
        this._storage.removeItem('granted_scopes');
        this._storage.removeItem('session_state');
        this.silentRefreshSubject = null;
        this.eventsSubject.next(new OAuthInfoEvent('logout'));
        if (!this.logoutUrl) {
            return;
        }
        if (noRedirectToLogoutUrl) {
            return;
        }
        if (!id_token && !this.postLogoutRedirectUri) {
            return;
        }
        var logoutUrl;
        if (!this.validateUrlForHttps(this.logoutUrl)) {
            throw new Error('logoutUrl must use http, or config value for property requireHttps must allow http');
        }
        if (this.logoutUrl.indexOf('{{') > -1) {
            logoutUrl = this.logoutUrl
                .replace(/\{\{id_token\}\}/, id_token)
                .replace(/\{\{client_id\}\}/, this.clientId);
        }
        else {
            var params = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpParams"]();
            if (id_token) {
                params = params.set('id_token_hint', id_token);
            }
            var postLogoutUrl = this.postLogoutRedirectUri || this.redirectUri;
            if (postLogoutUrl) {
                params = params.set('post_logout_redirect_uri', postLogoutUrl);
            }
            logoutUrl =
                this.logoutUrl +
                    (this.logoutUrl.indexOf('?') > -1 ? '&' : '?') +
                    params.toString();
        }
        location.href = logoutUrl;
    };
    OAuthService.prototype.createAndSaveNonce = function () {
        var that = this;
        return this.createNonce().then(function (nonce) {
            that._storage.setItem('nonce', nonce);
            return nonce;
        });
    };
    OAuthService.prototype.createNonce = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.rngUrl) {
                throw new Error('createNonce with rng-web-api has not been implemented so far');
            }
            else {
                var text = '';
                var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                for (var i = 0; i < 40; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                resolve(text);
            }
        });
    };
    OAuthService.prototype.checkAtHash = function (params) {
        return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__awaiter"])(this, void 0, void 0, function () {
            return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__generator"])(this, function (_a) {
                if (!this.tokenValidationHandler) {
                    this.logger.warn('No tokenValidationHandler configured. Cannot check at_hash.');
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, this.tokenValidationHandler.validateAtHash(params)];
            });
        });
    };
    OAuthService.prototype.checkSignature = function (params) {
        if (!this.tokenValidationHandler) {
            this.logger.warn('No tokenValidationHandler configured. Cannot check signature.');
            return Promise.resolve(null);
        }
        return this.tokenValidationHandler.validateSignature(params);
    };
    return OAuthService;
}(AuthConfig));
OAuthService.decorators = [
    { type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"] },
];
OAuthService.ctorParameters = function () { return [
    { type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["NgZone"] },
    { type: _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpClient"] },
    { type: OAuthStorage, decorators: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Optional"] }] },
    { type: ValidationHandler, decorators: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Optional"] }] },
    { type: AuthConfig, decorators: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Optional"] }] },
    { type: UrlHelperService },
    { type: OAuthLogger }
]; };
var OAuthModuleConfig = /** @class */ (function () {
    function OAuthModuleConfig() {
    }
    return OAuthModuleConfig;
}());
var OAuthResourceServerConfig = /** @class */ (function () {
    function OAuthResourceServerConfig() {
    }
    return OAuthResourceServerConfig;
}());
var OAuthResourceServerErrorHandler = /** @class */ (function () {
    function OAuthResourceServerErrorHandler() {
    }
    return OAuthResourceServerErrorHandler;
}());
var OAuthNoopResourceServerErrorHandler = /** @class */ (function () {
    function OAuthNoopResourceServerErrorHandler() {
    }
    OAuthNoopResourceServerErrorHandler.prototype.handleError = function (err) {
        return Object(rxjs__WEBPACK_IMPORTED_MODULE_3__["throwError"])(err);
    };
    return OAuthNoopResourceServerErrorHandler;
}());
var DefaultOAuthInterceptor = /** @class */ (function () {
    function DefaultOAuthInterceptor(authStorage, errorHandler, moduleConfig) {
        this.authStorage = authStorage;
        this.errorHandler = errorHandler;
        this.moduleConfig = moduleConfig;
    }
    DefaultOAuthInterceptor.prototype.checkUrl = function (url) {
        var found = this.moduleConfig.resourceServer.allowedUrls.find(function (u) { return url.startsWith(u); });
        return !!found;
    };
    DefaultOAuthInterceptor.prototype.intercept = function (req, next) {
        var _this = this;
        var url = req.url.toLowerCase();
        if (!this.moduleConfig) {
            return next.handle(req);
        }
        if (!this.moduleConfig.resourceServer) {
            return next.handle(req);
        }
        if (this.moduleConfig.resourceServer.allowedUrls && !this.checkUrl(url)) {
            return next.handle(req);
        }
        var sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;
        if (sendAccessToken && this.authStorage.getItem('access_token')) {
            var token = this.authStorage.getItem('access_token');
            var header = 'Bearer ' + token;
            var headers = req.headers.set('Authorization', header);
            req = req.clone({ headers: headers });
        }
        return next
            .handle(req)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["catchError"])(function (err) { return _this.errorHandler.handleError(err); }));
    };
    return DefaultOAuthInterceptor;
}());
DefaultOAuthInterceptor.decorators = [
    { type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"] },
];
DefaultOAuthInterceptor.ctorParameters = function () { return [
    { type: OAuthStorage },
    { type: OAuthResourceServerErrorHandler },
    { type: OAuthModuleConfig, decorators: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Optional"] }] }
]; };
var NullValidationHandler = /** @class */ (function () {
    function NullValidationHandler() {
    }
    NullValidationHandler.prototype.validateSignature = function (validationParams) {
        return Promise.resolve(null);
    };
    NullValidationHandler.prototype.validateAtHash = function (validationParams) {
        return Promise.resolve(true);
    };
    return NullValidationHandler;
}());
function createDefaultLogger() {
    return console;
}
function createDefaultStorage() {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
}
var OAuthModule = /** @class */ (function () {
    function OAuthModule() {
    }
    OAuthModule.forRoot = function (config, validationHandlerClass) {
        if (config === void 0) { config = null; }
        if (validationHandlerClass === void 0) { validationHandlerClass = NullValidationHandler; }
        return {
            ngModule: OAuthModule,
            providers: [
                OAuthService,
                UrlHelperService,
                { provide: OAuthLogger, useFactory: createDefaultLogger },
                { provide: OAuthStorage, useFactory: createDefaultStorage },
                { provide: ValidationHandler, useClass: validationHandlerClass },
                {
                    provide: OAuthResourceServerErrorHandler,
                    useClass: OAuthNoopResourceServerErrorHandler
                },
                { provide: OAuthModuleConfig, useValue: config },
                {
                    provide: _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HTTP_INTERCEPTORS"],
                    useClass: DefaultOAuthInterceptor,
                    multi: true
                }
            ]
        };
    };
    return OAuthModule;
}());
OAuthModule.decorators = [
    { type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"], args: [{
                imports: [_angular_common__WEBPACK_IMPORTED_MODULE_5__["CommonModule"]],
                declarations: [],
                exports: []
            },] },
];
var JwksValidationHandler = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(JwksValidationHandler, _super);
    function JwksValidationHandler() {
        var _this = _super.apply(this, Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__spread"])(arguments)) || this;
        _this.allowedAlgorithms = [
            'HS256',
            'HS384',
            'HS512',
            'RS256',
            'RS384',
            'RS512',
            'ES256',
            'ES384',
            'PS256',
            'PS384',
            'PS512'
        ];
        _this.gracePeriodInSec = 600;
        return _this;
    }
    JwksValidationHandler.prototype.validateSignature = function (params, retry) {
        var _this = this;
        if (retry === void 0) { retry = false; }
        if (!params.idToken)
            throw new Error('Parameter idToken expected!');
        if (!params.idTokenHeader)
            throw new Error('Parameter idTokenHandler expected.');
        if (!params.jwks)
            throw new Error('Parameter jwks expected!');
        if (!params.jwks['keys'] ||
            !Array.isArray(params.jwks['keys']) ||
            params.jwks['keys'].length === 0) {
            throw new Error('Array keys in jwks missing!');
        }
        var kid = params.idTokenHeader['kid'];
        var keys = params.jwks['keys'];
        var key;
        var alg = params.idTokenHeader['alg'];
        if (kid) {
            key = keys.find(function (k) { return k['kid'] === kid; });
        }
        else {
            var kty_1 = this.alg2kty(alg);
            var matchingKeys = keys.filter(function (k) { return k['kty'] === kty_1 && k['use'] === 'sig'; });
            if (matchingKeys.length > 1) {
                var error = 'More than one matching key found. Please specify a kid in the id_token header.';
                console.error(error);
                return Promise.reject(error);
            }
            else if (matchingKeys.length === 1) {
                key = matchingKeys[0];
            }
        }
        if (!key && !retry && params.loadKeys) {
            return params
                .loadKeys()
                .then(function (loadedKeys) { return (params.jwks = loadedKeys); })
                .then(function (_) { return _this.validateSignature(params, true); });
        }
        if (!key && retry && !kid) {
            var error = 'No matching key found.';
            console.error(error);
            return Promise.reject(error);
        }
        if (!key && retry && kid) {
            var error = 'expected key not found in property jwks. ' +
                'This property is most likely loaded with the ' +
                'discovery document. ' +
                'Expected key id (kid): ' +
                kid;
            console.error(error);
            return Promise.reject(error);
        }
        var keyObj = jsrsasign__WEBPACK_IMPORTED_MODULE_6__["KEYUTIL"].getKey(key);
        var validationOptions = {
            alg: this.allowedAlgorithms,
            gracePeriod: this.gracePeriodInSec
        };
        var isValid = jsrsasign__WEBPACK_IMPORTED_MODULE_6__["KJUR"].jws.JWS.verifyJWT(params.idToken, keyObj, validationOptions);
        if (isValid) {
            return Promise.resolve();
        }
        else {
            return Promise.reject('Signature not valid');
        }
    };
    JwksValidationHandler.prototype.alg2kty = function (alg) {
        switch (alg.charAt(0)) {
            case 'R':
                return 'RSA';
            case 'E':
                return 'EC';
            default:
                throw new Error('Cannot infer kty from alg: ' + alg);
        }
    };
    JwksValidationHandler.prototype.calcHash = function (valueToHash, algorithm) {
        var hashAlg = new jsrsasign__WEBPACK_IMPORTED_MODULE_6__["KJUR"].crypto.MessageDigest({ alg: algorithm });
        var result = hashAlg.digestString(valueToHash);
        var byteArrayAsString = this.toByteArrayAsString(result);
        return Promise.resolve(byteArrayAsString);
    };
    JwksValidationHandler.prototype.toByteArrayAsString = function (hexString) {
        var result = '';
        for (var i = 0; i < hexString.length; i += 2) {
            var hexDigit = hexString.charAt(i) + hexString.charAt(i + 1);
            var num = parseInt(hexDigit, 16);
            result += String.fromCharCode(num);
        }
        return result;
    };
    return JwksValidationHandler;
}(AbstractValidationHandler));
var AUTH_CONFIG = new _angular_core__WEBPACK_IMPORTED_MODULE_1__["InjectionToken"]('AUTH_CONFIG');


//# sourceMappingURL=angular-oauth2-oidc.js.map


/***/ }),

/***/ "./node_modules/jsrsasign/lib/jsrsasign.js":
/*!*************************************************!*\
  !*** ./node_modules/jsrsasign/lib/jsrsasign.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {


var navigator = {};
navigator.userAgent = false;

var window = {};
/*
 * jsrsasign(all) 8.0.15 (2020-04-13) (c) 2010-2020 Kenji Urushima | kjur.github.com/jsrsasign/license
 */

/*!
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
if(YAHOO===undefined){var YAHOO={}}YAHOO.lang={extend:function(g,h,f){if(!h||!g){throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.")}var d=function(){};d.prototype=h.prototype;g.prototype=new d();g.prototype.constructor=g;g.superclass=h.prototype;if(h.prototype.constructor==Object.prototype.constructor){h.prototype.constructor=h}if(f){var b;for(b in f){g.prototype[b]=f[b]}var e=function(){},c=["toString","valueOf"];try{if(/MSIE/.test(navigator.userAgent)){e=function(j,i){for(b=0;b<c.length;b=b+1){var l=c[b],k=i[l];if(typeof k==="function"&&k!=Object.prototype[l]){j[l]=k}}}}}catch(a){}e(g.prototype,f)}}};

/*! CryptoJS v3.1.2 core-fix.js
 * code.google.com/p/crypto-js
 * (c) 2009-2013 by Jeff Mott. All rights reserved.
 * code.google.com/p/crypto-js/wiki/License
 * THIS IS FIX of 'core.js' to fix Hmac issue.
 * https://code.google.com/p/crypto-js/issues/detail?id=84
 * https://crypto-js.googlecode.com/svn-history/r667/branches/3.x/src/core.js
 */
var CryptoJS=CryptoJS||(function(e,g){var a={};var b=a.lib={};var j=b.Base=(function(){function n(){}return{extend:function(p){n.prototype=this;var o=new n();if(p){o.mixIn(p)}if(!o.hasOwnProperty("init")){o.init=function(){o.$super.init.apply(this,arguments)}}o.init.prototype=o;o.$super=this;return o},create:function(){var o=this.extend();o.init.apply(o,arguments);return o},init:function(){},mixIn:function(p){for(var o in p){if(p.hasOwnProperty(o)){this[o]=p[o]}}if(p.hasOwnProperty("toString")){this.toString=p.toString}},clone:function(){return this.init.prototype.extend(this)}}}());var l=b.WordArray=j.extend({init:function(o,n){o=this.words=o||[];if(n!=g){this.sigBytes=n}else{this.sigBytes=o.length*4}},toString:function(n){return(n||h).stringify(this)},concat:function(t){var q=this.words;var p=t.words;var n=this.sigBytes;var s=t.sigBytes;this.clamp();if(n%4){for(var r=0;r<s;r++){var o=(p[r>>>2]>>>(24-(r%4)*8))&255;q[(n+r)>>>2]|=o<<(24-((n+r)%4)*8)}}else{for(var r=0;r<s;r+=4){q[(n+r)>>>2]=p[r>>>2]}}this.sigBytes+=s;return this},clamp:function(){var o=this.words;var n=this.sigBytes;o[n>>>2]&=4294967295<<(32-(n%4)*8);o.length=e.ceil(n/4)},clone:function(){var n=j.clone.call(this);n.words=this.words.slice(0);return n},random:function(p){var o=[];for(var n=0;n<p;n+=4){o.push((e.random()*4294967296)|0)}return new l.init(o,p)}});var m=a.enc={};var h=m.Hex={stringify:function(p){var r=p.words;var o=p.sigBytes;var q=[];for(var n=0;n<o;n++){var s=(r[n>>>2]>>>(24-(n%4)*8))&255;q.push((s>>>4).toString(16));q.push((s&15).toString(16))}return q.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o+=2){q[o>>>3]|=parseInt(p.substr(o,2),16)<<(24-(o%8)*4)}return new l.init(q,n/2)}};var d=m.Latin1={stringify:function(q){var r=q.words;var p=q.sigBytes;var n=[];for(var o=0;o<p;o++){var s=(r[o>>>2]>>>(24-(o%4)*8))&255;n.push(String.fromCharCode(s))}return n.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o++){q[o>>>2]|=(p.charCodeAt(o)&255)<<(24-(o%4)*8)}return new l.init(q,n)}};var c=m.Utf8={stringify:function(n){try{return decodeURIComponent(escape(d.stringify(n)))}catch(o){throw new Error("Malformed UTF-8 data")}},parse:function(n){return d.parse(unescape(encodeURIComponent(n)))}};var i=b.BufferedBlockAlgorithm=j.extend({reset:function(){this._data=new l.init();this._nDataBytes=0},_append:function(n){if(typeof n=="string"){n=c.parse(n)}this._data.concat(n);this._nDataBytes+=n.sigBytes},_process:function(w){var q=this._data;var x=q.words;var n=q.sigBytes;var t=this.blockSize;var v=t*4;var u=n/v;if(w){u=e.ceil(u)}else{u=e.max((u|0)-this._minBufferSize,0)}var s=u*t;var r=e.min(s*4,n);if(s){for(var p=0;p<s;p+=t){this._doProcessBlock(x,p)}var o=x.splice(0,s);q.sigBytes-=r}return new l.init(o,r)},clone:function(){var n=j.clone.call(this);n._data=this._data.clone();return n},_minBufferSize:0});var f=b.Hasher=i.extend({cfg:j.extend(),init:function(n){this.cfg=this.cfg.extend(n);this.reset()},reset:function(){i.reset.call(this);this._doReset()},update:function(n){this._append(n);this._process();return this},finalize:function(n){if(n){this._append(n)}var o=this._doFinalize();return o},blockSize:512/32,_createHelper:function(n){return function(p,o){return new n.init(o).finalize(p)}},_createHmacHelper:function(n){return function(p,o){return new k.HMAC.init(n,o).finalize(p)}}});var k=a.algo={};return a}(Math));
/*
CryptoJS v3.1.2 x64-core-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(g){var a=CryptoJS,f=a.lib,e=f.Base,h=f.WordArray,a=a.x64={};a.Word=e.extend({init:function(b,c){this.high=b;this.low=c}});a.WordArray=e.extend({init:function(b,c){b=this.words=b||[];this.sigBytes=c!=g?c:8*b.length},toX32:function(){for(var b=this.words,c=b.length,a=[],d=0;d<c;d++){var e=b[d];a.push(e.high);a.push(e.low)}return h.create(a,this.sigBytes)},clone:function(){for(var b=e.clone.call(this),c=b.words=this.words.slice(0),a=c.length,d=0;d<a;d++)c[d]=c[d].clone();return b}})})();

/*
CryptoJS v3.1.2 cipher-core.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
CryptoJS.lib.Cipher||function(u){var g=CryptoJS,f=g.lib,k=f.Base,l=f.WordArray,q=f.BufferedBlockAlgorithm,r=g.enc.Base64,v=g.algo.EvpKDF,n=f.Cipher=q.extend({cfg:k.extend(),createEncryptor:function(a,b){return this.create(this._ENC_XFORM_MODE,a,b)},createDecryptor:function(a,b){return this.create(this._DEC_XFORM_MODE,a,b)},init:function(a,b,c){this.cfg=this.cfg.extend(c);this._xformMode=a;this._key=b;this.reset()},reset:function(){q.reset.call(this);this._doReset()},process:function(a){this._append(a);
return this._process()},finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(a){return{encrypt:function(b,c,d){return("string"==typeof c?s:j).encrypt(a,b,c,d)},decrypt:function(b,c,d){return("string"==typeof c?s:j).decrypt(a,b,c,d)}}}});f.StreamCipher=n.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var m=g.mode={},t=function(a,b,c){var d=this._iv;d?this._iv=u:d=this._prevBlock;for(var e=
0;e<c;e++)a[b+e]^=d[e]},h=(f.BlockCipherMode=k.extend({createEncryptor:function(a,b){return this.Encryptor.create(a,b)},createDecryptor:function(a,b){return this.Decryptor.create(a,b)},init:function(a,b){this._cipher=a;this._iv=b}})).extend();h.Encryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize;t.call(this,a,b,d);c.encryptBlock(a,b);this._prevBlock=a.slice(b,b+d)}});h.Decryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize,e=a.slice(b,b+d);c.decryptBlock(a,
b);t.call(this,a,b,d);this._prevBlock=e}});m=m.CBC=h;h=(g.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,e=[],f=0;f<c;f+=4)e.push(d);c=l.create(e,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};f.BlockCipher=n.extend({cfg:n.cfg.extend({mode:m,padding:h}),reset:function(){n.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;
this._mode=c.call(a,this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var p=f.CipherParams=k.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),m=(g.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;
return(a?l.create([1398893684,1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=l.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return p.create({ciphertext:a,salt:c})}},j=f.SerializableCipher=k.extend({cfg:k.extend({format:m}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var e=a.createEncryptor(c,d);b=e.finalize(b);e=e.cfg;return p.create({ciphertext:b,key:c,iv:e.iv,algorithm:a,mode:e.mode,padding:e.padding,
blockSize:a.blockSize,formatter:d.format})},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),g=(g.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=l.random(8));a=v.create({keySize:b+c}).compute(a,d);c=l.create(a.words.slice(b),4*c);a.sigBytes=4*b;return p.create({key:a,iv:c,salt:d})}},s=f.PasswordBasedCipher=j.extend({cfg:j.cfg.extend({kdf:g}),encrypt:function(a,
b,c,d){d=this.cfg.extend(d);c=d.kdf.execute(c,a.keySize,a.ivSize);d.iv=c.iv;a=j.encrypt.call(this,a,b,c.key,d);a.mixIn(c);return a},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);c=d.kdf.execute(c,a.keySize,a.ivSize,b.salt);d.iv=c.iv;return j.decrypt.call(this,a,b,c.key,d)}})}();

/*
CryptoJS v3.1.2 aes.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){for(var q=CryptoJS,x=q.lib.BlockCipher,r=q.algo,j=[],y=[],z=[],A=[],B=[],C=[],s=[],u=[],v=[],w=[],g=[],k=0;256>k;k++)g[k]=128>k?k<<1:k<<1^283;for(var n=0,l=0,k=0;256>k;k++){var f=l^l<<1^l<<2^l<<3^l<<4,f=f>>>8^f&255^99;j[n]=f;y[f]=n;var t=g[n],D=g[t],E=g[D],b=257*g[f]^16843008*f;z[n]=b<<24|b>>>8;A[n]=b<<16|b>>>16;B[n]=b<<8|b>>>24;C[n]=b;b=16843009*E^65537*D^257*t^16843008*n;s[f]=b<<24|b>>>8;u[f]=b<<16|b>>>16;v[f]=b<<8|b>>>24;w[f]=b;n?(n=t^g[g[g[E^t]]],l^=g[g[l]]):n=l=1}var F=[0,1,2,4,8,
16,32,64,128,27,54],r=r.AES=x.extend({_doReset:function(){for(var c=this._key,e=c.words,a=c.sigBytes/4,c=4*((this._nRounds=a+6)+1),b=this._keySchedule=[],h=0;h<c;h++)if(h<a)b[h]=e[h];else{var d=b[h-1];h%a?6<a&&4==h%a&&(d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255]):(d=d<<8|d>>>24,d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255],d^=F[h/a|0]<<24);b[h]=b[h-a]^d}e=this._invKeySchedule=[];for(a=0;a<c;a++)h=c-a,d=a%4?b[h]:b[h-4],e[a]=4>a||4>=h?d:s[j[d>>>24]]^u[j[d>>>16&255]]^v[j[d>>>
8&255]]^w[j[d&255]]},encryptBlock:function(c,e){this._doCryptBlock(c,e,this._keySchedule,z,A,B,C,j)},decryptBlock:function(c,e){var a=c[e+1];c[e+1]=c[e+3];c[e+3]=a;this._doCryptBlock(c,e,this._invKeySchedule,s,u,v,w,y);a=c[e+1];c[e+1]=c[e+3];c[e+3]=a},_doCryptBlock:function(c,e,a,b,h,d,j,m){for(var n=this._nRounds,f=c[e]^a[0],g=c[e+1]^a[1],k=c[e+2]^a[2],p=c[e+3]^a[3],l=4,t=1;t<n;t++)var q=b[f>>>24]^h[g>>>16&255]^d[k>>>8&255]^j[p&255]^a[l++],r=b[g>>>24]^h[k>>>16&255]^d[p>>>8&255]^j[f&255]^a[l++],s=
b[k>>>24]^h[p>>>16&255]^d[f>>>8&255]^j[g&255]^a[l++],p=b[p>>>24]^h[f>>>16&255]^d[g>>>8&255]^j[k&255]^a[l++],f=q,g=r,k=s;q=(m[f>>>24]<<24|m[g>>>16&255]<<16|m[k>>>8&255]<<8|m[p&255])^a[l++];r=(m[g>>>24]<<24|m[k>>>16&255]<<16|m[p>>>8&255]<<8|m[f&255])^a[l++];s=(m[k>>>24]<<24|m[p>>>16&255]<<16|m[f>>>8&255]<<8|m[g&255])^a[l++];p=(m[p>>>24]<<24|m[f>>>16&255]<<16|m[g>>>8&255]<<8|m[k&255])^a[l++];c[e]=q;c[e+1]=r;c[e+2]=s;c[e+3]=p},keySize:8});q.AES=x._createHelper(r)})();

/*
CryptoJS v3.1.2 tripledes-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){function j(b,c){var a=(this._lBlock>>>b^this._rBlock)&c;this._rBlock^=a;this._lBlock^=a<<b}function l(b,c){var a=(this._rBlock>>>b^this._lBlock)&c;this._lBlock^=a;this._rBlock^=a<<b}var h=CryptoJS,e=h.lib,n=e.WordArray,e=e.BlockCipher,g=h.algo,q=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],p=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,
55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],r=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],s=[{"0":8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,
2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,
1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{"0":1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,
75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,
276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{"0":260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,
14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,
17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{"0":2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,
98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,
1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{"0":128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,
10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,
83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{"0":268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,
2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{"0":1048576,
16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,
496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{"0":134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,
2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,
2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],t=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],m=g.DES=e.extend({_doReset:function(){for(var b=this._key.words,c=[],a=0;56>a;a++){var f=q[a]-1;c[a]=b[f>>>5]>>>31-f%32&1}b=this._subKeys=[];for(f=0;16>f;f++){for(var d=b[f]=[],e=r[f],a=0;24>a;a++)d[a/6|0]|=c[(p[a]-1+e)%28]<<31-a%6,d[4+(a/6|0)]|=c[28+(p[a+24]-1+e)%28]<<31-a%6;d[0]=d[0]<<1|d[0]>>>31;for(a=1;7>a;a++)d[a]>>>=
4*(a-1)+3;d[7]=d[7]<<5|d[7]>>>27}c=this._invSubKeys=[];for(a=0;16>a;a++)c[a]=b[15-a]},encryptBlock:function(b,c){this._doCryptBlock(b,c,this._subKeys)},decryptBlock:function(b,c){this._doCryptBlock(b,c,this._invSubKeys)},_doCryptBlock:function(b,c,a){this._lBlock=b[c];this._rBlock=b[c+1];j.call(this,4,252645135);j.call(this,16,65535);l.call(this,2,858993459);l.call(this,8,16711935);j.call(this,1,1431655765);for(var f=0;16>f;f++){for(var d=a[f],e=this._lBlock,h=this._rBlock,g=0,k=0;8>k;k++)g|=s[k][((h^
d[k])&t[k])>>>0];this._lBlock=h;this._rBlock=e^g}a=this._lBlock;this._lBlock=this._rBlock;this._rBlock=a;j.call(this,1,1431655765);l.call(this,8,16711935);l.call(this,2,858993459);j.call(this,16,65535);j.call(this,4,252645135);b[c]=this._lBlock;b[c+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});h.DES=e._createHelper(m);g=g.TripleDES=e.extend({_doReset:function(){var b=this._key.words;this._des1=m.createEncryptor(n.create(b.slice(0,2)));this._des2=m.createEncryptor(n.create(b.slice(2,4)));this._des3=
m.createEncryptor(n.create(b.slice(4,6)))},encryptBlock:function(b,c){this._des1.encryptBlock(b,c);this._des2.decryptBlock(b,c);this._des3.encryptBlock(b,c)},decryptBlock:function(b,c){this._des3.decryptBlock(b,c);this._des2.encryptBlock(b,c);this._des1.decryptBlock(b,c)},keySize:6,ivSize:2,blockSize:2});h.TripleDES=e._createHelper(g)})();

/*
CryptoJS v3.1.2 enc-base64.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();

/*
CryptoJS v3.1.2 md5.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(E){function h(a,f,g,j,p,h,k){a=a+(f&g|~f&j)+p+k;return(a<<h|a>>>32-h)+f}function k(a,f,g,j,p,h,k){a=a+(f&j|g&~j)+p+k;return(a<<h|a>>>32-h)+f}function l(a,f,g,j,h,k,l){a=a+(f^g^j)+h+l;return(a<<k|a>>>32-k)+f}function n(a,f,g,j,h,k,l){a=a+(g^(f|~j))+h+l;return(a<<k|a>>>32-k)+f}for(var r=CryptoJS,q=r.lib,F=q.WordArray,s=q.Hasher,q=r.algo,a=[],t=0;64>t;t++)a[t]=4294967296*E.abs(E.sin(t+1))|0;q=q.MD5=s.extend({_doReset:function(){this._hash=new F.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(m,f){for(var g=0;16>g;g++){var j=f+g,p=m[j];m[j]=(p<<8|p>>>24)&16711935|(p<<24|p>>>8)&4278255360}var g=this._hash.words,j=m[f+0],p=m[f+1],q=m[f+2],r=m[f+3],s=m[f+4],t=m[f+5],u=m[f+6],v=m[f+7],w=m[f+8],x=m[f+9],y=m[f+10],z=m[f+11],A=m[f+12],B=m[f+13],C=m[f+14],D=m[f+15],b=g[0],c=g[1],d=g[2],e=g[3],b=h(b,c,d,e,j,7,a[0]),e=h(e,b,c,d,p,12,a[1]),d=h(d,e,b,c,q,17,a[2]),c=h(c,d,e,b,r,22,a[3]),b=h(b,c,d,e,s,7,a[4]),e=h(e,b,c,d,t,12,a[5]),d=h(d,e,b,c,u,17,a[6]),c=h(c,d,e,b,v,22,a[7]),
b=h(b,c,d,e,w,7,a[8]),e=h(e,b,c,d,x,12,a[9]),d=h(d,e,b,c,y,17,a[10]),c=h(c,d,e,b,z,22,a[11]),b=h(b,c,d,e,A,7,a[12]),e=h(e,b,c,d,B,12,a[13]),d=h(d,e,b,c,C,17,a[14]),c=h(c,d,e,b,D,22,a[15]),b=k(b,c,d,e,p,5,a[16]),e=k(e,b,c,d,u,9,a[17]),d=k(d,e,b,c,z,14,a[18]),c=k(c,d,e,b,j,20,a[19]),b=k(b,c,d,e,t,5,a[20]),e=k(e,b,c,d,y,9,a[21]),d=k(d,e,b,c,D,14,a[22]),c=k(c,d,e,b,s,20,a[23]),b=k(b,c,d,e,x,5,a[24]),e=k(e,b,c,d,C,9,a[25]),d=k(d,e,b,c,r,14,a[26]),c=k(c,d,e,b,w,20,a[27]),b=k(b,c,d,e,B,5,a[28]),e=k(e,b,
c,d,q,9,a[29]),d=k(d,e,b,c,v,14,a[30]),c=k(c,d,e,b,A,20,a[31]),b=l(b,c,d,e,t,4,a[32]),e=l(e,b,c,d,w,11,a[33]),d=l(d,e,b,c,z,16,a[34]),c=l(c,d,e,b,C,23,a[35]),b=l(b,c,d,e,p,4,a[36]),e=l(e,b,c,d,s,11,a[37]),d=l(d,e,b,c,v,16,a[38]),c=l(c,d,e,b,y,23,a[39]),b=l(b,c,d,e,B,4,a[40]),e=l(e,b,c,d,j,11,a[41]),d=l(d,e,b,c,r,16,a[42]),c=l(c,d,e,b,u,23,a[43]),b=l(b,c,d,e,x,4,a[44]),e=l(e,b,c,d,A,11,a[45]),d=l(d,e,b,c,D,16,a[46]),c=l(c,d,e,b,q,23,a[47]),b=n(b,c,d,e,j,6,a[48]),e=n(e,b,c,d,v,10,a[49]),d=n(d,e,b,c,
C,15,a[50]),c=n(c,d,e,b,t,21,a[51]),b=n(b,c,d,e,A,6,a[52]),e=n(e,b,c,d,r,10,a[53]),d=n(d,e,b,c,y,15,a[54]),c=n(c,d,e,b,p,21,a[55]),b=n(b,c,d,e,w,6,a[56]),e=n(e,b,c,d,D,10,a[57]),d=n(d,e,b,c,u,15,a[58]),c=n(c,d,e,b,B,21,a[59]),b=n(b,c,d,e,s,6,a[60]),e=n(e,b,c,d,z,10,a[61]),d=n(d,e,b,c,q,15,a[62]),c=n(c,d,e,b,x,21,a[63]);g[0]=g[0]+b|0;g[1]=g[1]+c|0;g[2]=g[2]+d|0;g[3]=g[3]+e|0},_doFinalize:function(){var a=this._data,f=a.words,g=8*this._nDataBytes,j=8*a.sigBytes;f[j>>>5]|=128<<24-j%32;var h=E.floor(g/
4294967296);f[(j+64>>>9<<4)+15]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;f[(j+64>>>9<<4)+14]=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;a.sigBytes=4*(f.length+1);this._process();a=this._hash;f=a.words;for(g=0;4>g;g++)j=f[g],f[g]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=s.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=s._createHelper(q);r.HmacMD5=s._createHmacHelper(q)})(Math);

/*
CryptoJS v3.1.2 sha1-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var k=CryptoJS,b=k.lib,m=b.WordArray,l=b.Hasher,d=[],b=k.algo.SHA1=l.extend({_doReset:function(){this._hash=new m.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(n,p){for(var a=this._hash.words,e=a[0],f=a[1],h=a[2],j=a[3],b=a[4],c=0;80>c;c++){if(16>c)d[c]=n[p+c]|0;else{var g=d[c-3]^d[c-8]^d[c-14]^d[c-16];d[c]=g<<1|g>>>31}g=(e<<5|e>>>27)+b+d[c];g=20>c?g+((f&h|~f&j)+1518500249):40>c?g+((f^h^j)+1859775393):60>c?g+((f&h|f&j|h&j)-1894007588):g+((f^h^
j)-899497514);b=j;j=h;h=f<<30|f>>>2;f=e;e=g}a[0]=a[0]+e|0;a[1]=a[1]+f|0;a[2]=a[2]+h|0;a[3]=a[3]+j|0;a[4]=a[4]+b|0},_doFinalize:function(){var b=this._data,d=b.words,a=8*this._nDataBytes,e=8*b.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+14]=Math.floor(a/4294967296);d[(e+64>>>9<<4)+15]=a;b.sigBytes=4*d.length;this._process();return this._hash},clone:function(){var b=l.clone.call(this);b._hash=this._hash.clone();return b}});k.SHA1=l._createHelper(b);k.HmacSHA1=l._createHmacHelper(b)})();

/*
CryptoJS v3.1.2 sha256-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(k){for(var g=CryptoJS,h=g.lib,v=h.WordArray,j=h.Hasher,h=g.algo,s=[],t=[],u=function(q){return 4294967296*(q-(q|0))|0},l=2,b=0;64>b;){var d;a:{d=l;for(var w=k.sqrt(d),r=2;r<=w;r++)if(!(d%r)){d=!1;break a}d=!0}d&&(8>b&&(s[b]=u(k.pow(l,0.5))),t[b]=u(k.pow(l,1/3)),b++);l++}var n=[],h=h.SHA256=j.extend({_doReset:function(){this._hash=new v.init(s.slice(0))},_doProcessBlock:function(q,h){for(var a=this._hash.words,c=a[0],d=a[1],b=a[2],k=a[3],f=a[4],g=a[5],j=a[6],l=a[7],e=0;64>e;e++){if(16>e)n[e]=
q[h+e]|0;else{var m=n[e-15],p=n[e-2];n[e]=((m<<25|m>>>7)^(m<<14|m>>>18)^m>>>3)+n[e-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+n[e-16]}m=l+((f<<26|f>>>6)^(f<<21|f>>>11)^(f<<7|f>>>25))+(f&g^~f&j)+t[e]+n[e];p=((c<<30|c>>>2)^(c<<19|c>>>13)^(c<<10|c>>>22))+(c&d^c&b^d&b);l=j;j=g;g=f;f=k+m|0;k=b;b=d;d=c;c=m+p|0}a[0]=a[0]+c|0;a[1]=a[1]+d|0;a[2]=a[2]+b|0;a[3]=a[3]+k|0;a[4]=a[4]+f|0;a[5]=a[5]+g|0;a[6]=a[6]+j|0;a[7]=a[7]+l|0},_doFinalize:function(){var d=this._data,b=d.words,a=8*this._nDataBytes,c=8*d.sigBytes;
b[c>>>5]|=128<<24-c%32;b[(c+64>>>9<<4)+14]=k.floor(a/4294967296);b[(c+64>>>9<<4)+15]=a;d.sigBytes=4*b.length;this._process();return this._hash},clone:function(){var b=j.clone.call(this);b._hash=this._hash.clone();return b}});g.SHA256=j._createHelper(h);g.HmacSHA256=j._createHmacHelper(h)})(Math);

/*
CryptoJS v3.1.2 sha224-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var b=CryptoJS,d=b.lib.WordArray,a=b.algo,c=a.SHA256,a=a.SHA224=c.extend({_doReset:function(){this._hash=new d.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var a=c._doFinalize.call(this);a.sigBytes-=4;return a}});b.SHA224=c._createHelper(a);b.HmacSHA224=c._createHmacHelper(a)})();

/*
CryptoJS v3.1.2 sha512-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){function a(){return d.create.apply(d,arguments)}for(var n=CryptoJS,r=n.lib.Hasher,e=n.x64,d=e.Word,T=e.WordArray,e=n.algo,ea=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),
a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,
2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),
a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,
3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],v=[],w=0;80>w;w++)v[w]=a();e=e.SHA512=r.extend({_doReset:function(){this._hash=new T.init([new d.init(1779033703,4089235720),new d.init(3144134277,2227873595),new d.init(1013904242,4271175723),new d.init(2773480762,1595750129),new d.init(1359893119,2917565137),new d.init(2600822924,725511199),new d.init(528734635,4215389547),new d.init(1541459225,327033209)])},_doProcessBlock:function(a,d){for(var f=this._hash.words,
F=f[0],e=f[1],n=f[2],r=f[3],G=f[4],H=f[5],I=f[6],f=f[7],w=F.high,J=F.low,X=e.high,K=e.low,Y=n.high,L=n.low,Z=r.high,M=r.low,$=G.high,N=G.low,aa=H.high,O=H.low,ba=I.high,P=I.low,ca=f.high,Q=f.low,k=w,g=J,z=X,x=K,A=Y,y=L,U=Z,B=M,l=$,h=N,R=aa,C=O,S=ba,D=P,V=ca,E=Q,m=0;80>m;m++){var s=v[m];if(16>m)var j=s.high=a[d+2*m]|0,b=s.low=a[d+2*m+1]|0;else{var j=v[m-15],b=j.high,p=j.low,j=(b>>>1|p<<31)^(b>>>8|p<<24)^b>>>7,p=(p>>>1|b<<31)^(p>>>8|b<<24)^(p>>>7|b<<25),u=v[m-2],b=u.high,c=u.low,u=(b>>>19|c<<13)^(b<<
3|c>>>29)^b>>>6,c=(c>>>19|b<<13)^(c<<3|b>>>29)^(c>>>6|b<<26),b=v[m-7],W=b.high,t=v[m-16],q=t.high,t=t.low,b=p+b.low,j=j+W+(b>>>0<p>>>0?1:0),b=b+c,j=j+u+(b>>>0<c>>>0?1:0),b=b+t,j=j+q+(b>>>0<t>>>0?1:0);s.high=j;s.low=b}var W=l&R^~l&S,t=h&C^~h&D,s=k&z^k&A^z&A,T=g&x^g&y^x&y,p=(k>>>28|g<<4)^(k<<30|g>>>2)^(k<<25|g>>>7),u=(g>>>28|k<<4)^(g<<30|k>>>2)^(g<<25|k>>>7),c=ea[m],fa=c.high,da=c.low,c=E+((h>>>14|l<<18)^(h>>>18|l<<14)^(h<<23|l>>>9)),q=V+((l>>>14|h<<18)^(l>>>18|h<<14)^(l<<23|h>>>9))+(c>>>0<E>>>0?1:
0),c=c+t,q=q+W+(c>>>0<t>>>0?1:0),c=c+da,q=q+fa+(c>>>0<da>>>0?1:0),c=c+b,q=q+j+(c>>>0<b>>>0?1:0),b=u+T,s=p+s+(b>>>0<u>>>0?1:0),V=S,E=D,S=R,D=C,R=l,C=h,h=B+c|0,l=U+q+(h>>>0<B>>>0?1:0)|0,U=A,B=y,A=z,y=x,z=k,x=g,g=c+b|0,k=q+s+(g>>>0<c>>>0?1:0)|0}J=F.low=J+g;F.high=w+k+(J>>>0<g>>>0?1:0);K=e.low=K+x;e.high=X+z+(K>>>0<x>>>0?1:0);L=n.low=L+y;n.high=Y+A+(L>>>0<y>>>0?1:0);M=r.low=M+B;r.high=Z+U+(M>>>0<B>>>0?1:0);N=G.low=N+h;G.high=$+l+(N>>>0<h>>>0?1:0);O=H.low=O+C;H.high=aa+R+(O>>>0<C>>>0?1:0);P=I.low=P+D;
I.high=ba+S+(P>>>0<D>>>0?1:0);Q=f.low=Q+E;f.high=ca+V+(Q>>>0<E>>>0?1:0)},_doFinalize:function(){var a=this._data,d=a.words,f=8*this._nDataBytes,e=8*a.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+128>>>10<<5)+30]=Math.floor(f/4294967296);d[(e+128>>>10<<5)+31]=f;a.sigBytes=4*d.length;this._process();return this._hash.toX32()},clone:function(){var a=r.clone.call(this);a._hash=this._hash.clone();return a},blockSize:32});n.SHA512=r._createHelper(e);n.HmacSHA512=r._createHmacHelper(e)})();

/*
CryptoJS v3.1.2 sha384-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var c=CryptoJS,a=c.x64,b=a.Word,e=a.WordArray,a=c.algo,d=a.SHA512,a=a.SHA384=d.extend({_doReset:function(){this._hash=new e.init([new b.init(3418070365,3238371032),new b.init(1654270250,914150663),new b.init(2438529370,812702999),new b.init(355462360,4144912697),new b.init(1731405415,4290775857),new b.init(2394180231,1750603025),new b.init(3675008525,1694076839),new b.init(1203062813,3204075428)])},_doFinalize:function(){var a=d._doFinalize.call(this);a.sigBytes-=16;return a}});c.SHA384=
d._createHelper(a);c.HmacSHA384=d._createHmacHelper(a)})();

/*
CryptoJS v3.1.2 ripemd160-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/*

(c) 2012 by Cedric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function(){var q=CryptoJS,d=q.lib,n=d.WordArray,p=d.Hasher,d=q.algo,x=n.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),y=n.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),z=n.create([11,14,15,12,
5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),A=n.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),B=n.create([0,1518500249,1859775393,2400959708,2840853838]),C=n.create([1352829926,1548603684,1836072691,
2053994217,0]),d=d.RIPEMD160=p.extend({_doReset:function(){this._hash=n.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,v){for(var b=0;16>b;b++){var c=v+b,f=e[c];e[c]=(f<<8|f>>>24)&16711935|(f<<24|f>>>8)&4278255360}var c=this._hash.words,f=B.words,d=C.words,n=x.words,q=y.words,p=z.words,w=A.words,t,g,h,j,r,u,k,l,m,s;u=t=c[0];k=g=c[1];l=h=c[2];m=j=c[3];s=r=c[4];for(var a,b=0;80>b;b+=1)a=t+e[v+n[b]]|0,a=16>b?a+((g^h^j)+f[0]):32>b?a+((g&h|~g&j)+f[1]):48>b?
a+(((g|~h)^j)+f[2]):64>b?a+((g&j|h&~j)+f[3]):a+((g^(h|~j))+f[4]),a|=0,a=a<<p[b]|a>>>32-p[b],a=a+r|0,t=r,r=j,j=h<<10|h>>>22,h=g,g=a,a=u+e[v+q[b]]|0,a=16>b?a+((k^(l|~m))+d[0]):32>b?a+((k&m|l&~m)+d[1]):48>b?a+(((k|~l)^m)+d[2]):64>b?a+((k&l|~k&m)+d[3]):a+((k^l^m)+d[4]),a|=0,a=a<<w[b]|a>>>32-w[b],a=a+s|0,u=s,s=m,m=l<<10|l>>>22,l=k,k=a;a=c[1]+h+m|0;c[1]=c[2]+j+s|0;c[2]=c[3]+r+u|0;c[3]=c[4]+t+k|0;c[4]=c[0]+g+l|0;c[0]=a},_doFinalize:function(){var e=this._data,d=e.words,b=8*this._nDataBytes,c=8*e.sigBytes;
d[c>>>5]|=128<<24-c%32;d[(c+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;e.sigBytes=4*(d.length+1);this._process();e=this._hash;d=e.words;for(b=0;5>b;b++)c=d[b],d[b]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return e},clone:function(){var d=p.clone.call(this);d._hash=this._hash.clone();return d}});q.RIPEMD160=p._createHelper(d);q.HmacRIPEMD160=p._createHmacHelper(d)})(Math);

/*
CryptoJS v3.1.2 hmac.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var c=CryptoJS,k=c.enc.Utf8;c.algo.HMAC=c.lib.Base.extend({init:function(a,b){a=this._hasher=new a.init;"string"==typeof b&&(b=k.parse(b));var c=a.blockSize,e=4*c;b.sigBytes>e&&(b=a.finalize(b));b.clamp();for(var f=this._oKey=b.clone(),g=this._iKey=b.clone(),h=f.words,j=g.words,d=0;d<c;d++)h[d]^=1549556828,j[d]^=909522486;f.sigBytes=g.sigBytes=e;this.reset()},reset:function(){var a=this._hasher;a.reset();a.update(this._iKey)},update:function(a){this._hasher.update(a);return this},finalize:function(a){var b=
this._hasher;a=b.finalize(a);b.reset();return b.finalize(this._oKey.clone().concat(a))}})})();

/*
CryptoJS v3.1.2 pbkdf2-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var b=CryptoJS,a=b.lib,d=a.Base,m=a.WordArray,a=b.algo,q=a.HMAC,l=a.PBKDF2=d.extend({cfg:d.extend({keySize:4,hasher:a.SHA1,iterations:1}),init:function(a){this.cfg=this.cfg.extend(a)},compute:function(a,b){for(var c=this.cfg,f=q.create(c.hasher,a),g=m.create(),d=m.create([1]),l=g.words,r=d.words,n=c.keySize,c=c.iterations;l.length<n;){var h=f.update(b).finalize(d);f.reset();for(var j=h.words,s=j.length,k=h,p=1;p<c;p++){k=f.finalize(k);f.reset();for(var t=k.words,e=0;e<s;e++)j[e]^=t[e]}g.concat(h);
r[0]++}g.sigBytes=4*n;return g}});b.PBKDF2=function(a,b,c){return l.create(c).compute(a,b)}})();

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b64pad="=";function hex2b64(d){var b;var e;var a="";for(b=0;b+3<=d.length;b+=3){e=parseInt(d.substring(b,b+3),16);a+=b64map.charAt(e>>6)+b64map.charAt(e&63)}if(b+1==d.length){e=parseInt(d.substring(b,b+1),16);a+=b64map.charAt(e<<2)}else{if(b+2==d.length){e=parseInt(d.substring(b,b+2),16);a+=b64map.charAt(e>>2)+b64map.charAt((e&3)<<4)}}if(b64pad){while((a.length&3)>0){a+=b64pad}}return a}function b64tohex(f){var d="";var e;var b=0;var c;var a;for(e=0;e<f.length;++e){if(f.charAt(e)==b64pad){break}a=b64map.indexOf(f.charAt(e));if(a<0){continue}if(b==0){d+=int2char(a>>2);c=a&3;b=1}else{if(b==1){d+=int2char((c<<2)|(a>>4));c=a&15;b=2}else{if(b==2){d+=int2char(c);d+=int2char(a>>2);c=a&3;b=3}else{d+=int2char((c<<2)|(a>>4));d+=int2char(a&15);b=0}}}}if(b==1){d+=int2char(c<<2)}return d}function b64toBA(e){var d=b64tohex(e);var c;var b=new Array();for(c=0;2*c<d.length;++c){b[c]=parseInt(d.substring(2*c,2*c+2),16)}return b};
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var dbits;var canary=244837814094590;var j_lm=((canary&16777215)==15715070);function BigInteger(e,d,f){if(e!=null){if("number"==typeof e){this.fromNumber(e,d,f)}else{if(d==null&&"string"!=typeof e){this.fromString(e,256)}else{this.fromString(e,d)}}}}function nbi(){return new BigInteger(null)}function am1(f,a,b,e,h,g){while(--g>=0){var d=a*this[f++]+b[e]+h;h=Math.floor(d/67108864);b[e++]=d&67108863}return h}function am2(f,q,r,e,o,a){var k=q&32767,p=q>>15;while(--a>=0){var d=this[f]&32767;var g=this[f++]>>15;var b=p*d+g*k;d=k*d+((b&32767)<<15)+r[e]+(o&1073741823);o=(d>>>30)+(b>>>15)+p*g+(o>>>30);r[e++]=d&1073741823}return o}function am3(f,q,r,e,o,a){var k=q&16383,p=q>>14;while(--a>=0){var d=this[f]&16383;var g=this[f++]>>14;var b=p*d+g*k;d=k*d+((b&16383)<<14)+r[e]+o;o=(d>>28)+(b>>14)+p*g;r[e++]=d&268435455}return o}if(j_lm&&(navigator.appName=="Microsoft Internet Explorer")){BigInteger.prototype.am=am2;dbits=30}else{if(j_lm&&(navigator.appName!="Netscape")){BigInteger.prototype.am=am1;dbits=26}else{BigInteger.prototype.am=am3;dbits=28}}BigInteger.prototype.DB=dbits;BigInteger.prototype.DM=((1<<dbits)-1);BigInteger.prototype.DV=(1<<dbits);var BI_FP=52;BigInteger.prototype.FV=Math.pow(2,BI_FP);BigInteger.prototype.F1=BI_FP-dbits;BigInteger.prototype.F2=2*dbits-BI_FP;var BI_RM="0123456789abcdefghijklmnopqrstuvwxyz";var BI_RC=new Array();var rr,vv;rr="0".charCodeAt(0);for(vv=0;vv<=9;++vv){BI_RC[rr++]=vv}rr="a".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}rr="A".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}function int2char(a){return BI_RM.charAt(a)}function intAt(b,a){var d=BI_RC[b.charCodeAt(a)];return(d==null)?-1:d}function bnpCopyTo(b){for(var a=this.t-1;a>=0;--a){b[a]=this[a]}b.t=this.t;b.s=this.s}function bnpFromInt(a){this.t=1;this.s=(a<0)?-1:0;if(a>0){this[0]=a}else{if(a<-1){this[0]=a+this.DV}else{this.t=0}}}function nbv(a){var b=nbi();b.fromInt(a);return b}function bnpFromString(h,c){var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==256){e=8}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{this.fromRadix(h,c);return}}}}}}this.t=0;this.s=0;var g=h.length,d=false,f=0;while(--g>=0){var a=(e==8)?h[g]&255:intAt(h,g);if(a<0){if(h.charAt(g)=="-"){d=true}continue}d=false;if(f==0){this[this.t++]=a}else{if(f+e>this.DB){this[this.t-1]|=(a&((1<<(this.DB-f))-1))<<f;this[this.t++]=(a>>(this.DB-f))}else{this[this.t-1]|=a<<f}}f+=e;if(f>=this.DB){f-=this.DB}}if(e==8&&(h[0]&128)!=0){this.s=-1;if(f>0){this[this.t-1]|=((1<<(this.DB-f))-1)<<f}}this.clamp();if(d){BigInteger.ZERO.subTo(this,this)}}function bnpClamp(){var a=this.s&this.DM;while(this.t>0&&this[this.t-1]==a){--this.t}}function bnToString(c){if(this.s<0){return"-"+this.negate().toString(c)}var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{return this.toRadix(c)}}}}}var g=(1<<e)-1,l,a=false,h="",f=this.t;var j=this.DB-(f*this.DB)%e;if(f-->0){if(j<this.DB&&(l=this[f]>>j)>0){a=true;h=int2char(l)}while(f>=0){if(j<e){l=(this[f]&((1<<j)-1))<<(e-j);l|=this[--f]>>(j+=this.DB-e)}else{l=(this[f]>>(j-=e))&g;if(j<=0){j+=this.DB;--f}}if(l>0){a=true}if(a){h+=int2char(l)}}}return a?h:"0"}function bnNegate(){var a=nbi();BigInteger.ZERO.subTo(this,a);return a}function bnAbs(){return(this.s<0)?this.negate():this}function bnCompareTo(b){var d=this.s-b.s;if(d!=0){return d}var c=this.t;d=c-b.t;if(d!=0){return(this.s<0)?-d:d}while(--c>=0){if((d=this[c]-b[c])!=0){return d}}return 0}function nbits(a){var c=1,b;if((b=a>>>16)!=0){a=b;c+=16}if((b=a>>8)!=0){a=b;c+=8}if((b=a>>4)!=0){a=b;c+=4}if((b=a>>2)!=0){a=b;c+=2}if((b=a>>1)!=0){a=b;c+=1}return c}function bnBitLength(){if(this.t<=0){return 0}return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM))}function bnpDLShiftTo(c,b){var a;for(a=this.t-1;a>=0;--a){b[a+c]=this[a]}for(a=c-1;a>=0;--a){b[a]=0}b.t=this.t+c;b.s=this.s}function bnpDRShiftTo(c,b){for(var a=c;a<this.t;++a){b[a-c]=this[a]}b.t=Math.max(this.t-c,0);b.s=this.s}function bnpLShiftTo(j,e){var b=j%this.DB;var a=this.DB-b;var g=(1<<a)-1;var f=Math.floor(j/this.DB),h=(this.s<<b)&this.DM,d;for(d=this.t-1;d>=0;--d){e[d+f+1]=(this[d]>>a)|h;h=(this[d]&g)<<b}for(d=f-1;d>=0;--d){e[d]=0}e[f]=h;e.t=this.t+f+1;e.s=this.s;e.clamp()}function bnpRShiftTo(g,d){d.s=this.s;var e=Math.floor(g/this.DB);if(e>=this.t){d.t=0;return}var b=g%this.DB;var a=this.DB-b;var f=(1<<b)-1;d[0]=this[e]>>b;for(var c=e+1;c<this.t;++c){d[c-e-1]|=(this[c]&f)<<a;d[c-e]=this[c]>>b}if(b>0){d[this.t-e-1]|=(this.s&f)<<a}d.t=this.t-e;d.clamp()}function bnpSubTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]-d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g-=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g-=d[e];f[e++]=g&this.DM;g>>=this.DB}g-=d.s}f.s=(g<0)?-1:0;if(g<-1){f[e++]=this.DV+g}else{if(g>0){f[e++]=g}}f.t=e;f.clamp()}function bnpMultiplyTo(c,e){var b=this.abs(),f=c.abs();var d=b.t;e.t=d+f.t;while(--d>=0){e[d]=0}for(d=0;d<f.t;++d){e[d+b.t]=b.am(0,f[d],e,d,0,b.t)}e.s=0;e.clamp();if(this.s!=c.s){BigInteger.ZERO.subTo(e,e)}}function bnpSquareTo(d){var a=this.abs();var b=d.t=2*a.t;while(--b>=0){d[b]=0}for(b=0;b<a.t-1;++b){var e=a.am(b,a[b],d,2*b,0,1);if((d[b+a.t]+=a.am(b+1,2*a[b],d,2*b+1,e,a.t-b-1))>=a.DV){d[b+a.t]-=a.DV;d[b+a.t+1]=1}}if(d.t>0){d[d.t-1]+=a.am(b,a[b],d,2*b,0,1)}d.s=0;d.clamp()}function bnpDivRemTo(n,h,g){var w=n.abs();if(w.t<=0){return}var k=this.abs();if(k.t<w.t){if(h!=null){h.fromInt(0)}if(g!=null){this.copyTo(g)}return}if(g==null){g=nbi()}var d=nbi(),a=this.s,l=n.s;var v=this.DB-nbits(w[w.t-1]);if(v>0){w.lShiftTo(v,d);k.lShiftTo(v,g)}else{w.copyTo(d);k.copyTo(g)}var p=d.t;var b=d[p-1];if(b==0){return}var o=b*(1<<this.F1)+((p>1)?d[p-2]>>this.F2:0);var A=this.FV/o,z=(1<<this.F1)/o,x=1<<this.F2;var u=g.t,s=u-p,f=(h==null)?nbi():h;d.dlShiftTo(s,f);if(g.compareTo(f)>=0){g[g.t++]=1;g.subTo(f,g)}BigInteger.ONE.dlShiftTo(p,f);f.subTo(d,d);while(d.t<p){d[d.t++]=0}while(--s>=0){var c=(g[--u]==b)?this.DM:Math.floor(g[u]*A+(g[u-1]+x)*z);if((g[u]+=d.am(0,c,g,s,0,p))<c){d.dlShiftTo(s,f);g.subTo(f,g);while(g[u]<--c){g.subTo(f,g)}}}if(h!=null){g.drShiftTo(p,h);if(a!=l){BigInteger.ZERO.subTo(h,h)}}g.t=p;g.clamp();if(v>0){g.rShiftTo(v,g)}if(a<0){BigInteger.ZERO.subTo(g,g)}}function bnMod(b){var c=nbi();this.abs().divRemTo(b,null,c);if(this.s<0&&c.compareTo(BigInteger.ZERO)>0){b.subTo(c,c)}return c}function Classic(a){this.m=a}function cConvert(a){if(a.s<0||a.compareTo(this.m)>=0){return a.mod(this.m)}else{return a}}function cRevert(a){return a}function cReduce(a){a.divRemTo(this.m,null,a)}function cMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}function cSqrTo(a,b){a.squareTo(b);this.reduce(b)}Classic.prototype.convert=cConvert;Classic.prototype.revert=cRevert;Classic.prototype.reduce=cReduce;Classic.prototype.mulTo=cMulTo;Classic.prototype.sqrTo=cSqrTo;function bnpInvDigit(){if(this.t<1){return 0}var a=this[0];if((a&1)==0){return 0}var b=a&3;b=(b*(2-(a&15)*b))&15;b=(b*(2-(a&255)*b))&255;b=(b*(2-(((a&65535)*b)&65535)))&65535;b=(b*(2-a*b%this.DV))%this.DV;return(b>0)?this.DV-b:-b}function Montgomery(a){this.m=a;this.mp=a.invDigit();this.mpl=this.mp&32767;this.mph=this.mp>>15;this.um=(1<<(a.DB-15))-1;this.mt2=2*a.t}function montConvert(a){var b=nbi();a.abs().dlShiftTo(this.m.t,b);b.divRemTo(this.m,null,b);if(a.s<0&&b.compareTo(BigInteger.ZERO)>0){this.m.subTo(b,b)}return b}function montRevert(a){var b=nbi();a.copyTo(b);this.reduce(b);return b}function montReduce(a){while(a.t<=this.mt2){a[a.t++]=0}for(var c=0;c<this.m.t;++c){var b=a[c]&32767;var d=(b*this.mpl+(((b*this.mph+(a[c]>>15)*this.mpl)&this.um)<<15))&a.DM;b=c+this.m.t;a[b]+=this.m.am(0,d,a,c,0,this.m.t);while(a[b]>=a.DV){a[b]-=a.DV;a[++b]++}}a.clamp();a.drShiftTo(this.m.t,a);if(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function montSqrTo(a,b){a.squareTo(b);this.reduce(b)}function montMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Montgomery.prototype.convert=montConvert;Montgomery.prototype.revert=montRevert;Montgomery.prototype.reduce=montReduce;Montgomery.prototype.mulTo=montMulTo;Montgomery.prototype.sqrTo=montSqrTo;function bnpIsEven(){return((this.t>0)?(this[0]&1):this.s)==0}function bnpExp(h,j){if(h>4294967295||h<1){return BigInteger.ONE}var f=nbi(),a=nbi(),d=j.convert(this),c=nbits(h)-1;d.copyTo(f);while(--c>=0){j.sqrTo(f,a);if((h&(1<<c))>0){j.mulTo(a,d,f)}else{var b=f;f=a;a=b}}return j.revert(f)}function bnModPowInt(b,a){var c;if(b<256||a.isEven()){c=new Classic(a)}else{c=new Montgomery(a)}return this.exp(b,c)}BigInteger.prototype.copyTo=bnpCopyTo;BigInteger.prototype.fromInt=bnpFromInt;BigInteger.prototype.fromString=bnpFromString;BigInteger.prototype.clamp=bnpClamp;BigInteger.prototype.dlShiftTo=bnpDLShiftTo;BigInteger.prototype.drShiftTo=bnpDRShiftTo;BigInteger.prototype.lShiftTo=bnpLShiftTo;BigInteger.prototype.rShiftTo=bnpRShiftTo;BigInteger.prototype.subTo=bnpSubTo;BigInteger.prototype.multiplyTo=bnpMultiplyTo;BigInteger.prototype.squareTo=bnpSquareTo;BigInteger.prototype.divRemTo=bnpDivRemTo;BigInteger.prototype.invDigit=bnpInvDigit;BigInteger.prototype.isEven=bnpIsEven;BigInteger.prototype.exp=bnpExp;BigInteger.prototype.toString=bnToString;BigInteger.prototype.negate=bnNegate;BigInteger.prototype.abs=bnAbs;BigInteger.prototype.compareTo=bnCompareTo;BigInteger.prototype.bitLength=bnBitLength;BigInteger.prototype.mod=bnMod;BigInteger.prototype.modPowInt=bnModPowInt;BigInteger.ZERO=nbv(0);BigInteger.ONE=nbv(1);
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function bnClone(){var a=nbi();this.copyTo(a);return a}function bnIntValue(){if(this.s<0){if(this.t==1){return this[0]-this.DV}else{if(this.t==0){return -1}}}else{if(this.t==1){return this[0]}else{if(this.t==0){return 0}}}return((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0]}function bnByteValue(){return(this.t==0)?this.s:(this[0]<<24)>>24}function bnShortValue(){return(this.t==0)?this.s:(this[0]<<16)>>16}function bnpChunkSize(a){return Math.floor(Math.LN2*this.DB/Math.log(a))}function bnSigNum(){if(this.s<0){return -1}else{if(this.t<=0||(this.t==1&&this[0]<=0)){return 0}else{return 1}}}function bnpToRadix(c){if(c==null){c=10}if(this.signum()==0||c<2||c>36){return"0"}var f=this.chunkSize(c);var e=Math.pow(c,f);var i=nbv(e),j=nbi(),h=nbi(),g="";this.divRemTo(i,j,h);while(j.signum()>0){g=(e+h.intValue()).toString(c).substr(1)+g;j.divRemTo(i,j,h)}return h.intValue().toString(c)+g}function bnpFromRadix(m,h){this.fromInt(0);if(h==null){h=10}var f=this.chunkSize(h);var g=Math.pow(h,f),e=false,a=0,l=0;for(var c=0;c<m.length;++c){var k=intAt(m,c);if(k<0){if(m.charAt(c)=="-"&&this.signum()==0){e=true}continue}l=h*l+k;if(++a>=f){this.dMultiply(g);this.dAddOffset(l,0);a=0;l=0}}if(a>0){this.dMultiply(Math.pow(h,a));this.dAddOffset(l,0)}if(e){BigInteger.ZERO.subTo(this,this)}}function bnpFromNumber(f,e,h){if("number"==typeof e){if(f<2){this.fromInt(1)}else{this.fromNumber(f,h);if(!this.testBit(f-1)){this.bitwiseTo(BigInteger.ONE.shiftLeft(f-1),op_or,this)}if(this.isEven()){this.dAddOffset(1,0)}while(!this.isProbablePrime(e)){this.dAddOffset(2,0);if(this.bitLength()>f){this.subTo(BigInteger.ONE.shiftLeft(f-1),this)}}}}else{var d=new Array(),g=f&7;d.length=(f>>3)+1;e.nextBytes(d);if(g>0){d[0]&=((1<<g)-1)}else{d[0]=0}this.fromString(d,256)}}function bnToByteArray(){var b=this.t,c=new Array();c[0]=this.s;var e=this.DB-(b*this.DB)%8,f,a=0;if(b-->0){if(e<this.DB&&(f=this[b]>>e)!=(this.s&this.DM)>>e){c[a++]=f|(this.s<<(this.DB-e))}while(b>=0){if(e<8){f=(this[b]&((1<<e)-1))<<(8-e);f|=this[--b]>>(e+=this.DB-8)}else{f=(this[b]>>(e-=8))&255;if(e<=0){e+=this.DB;--b}}if((f&128)!=0){f|=-256}if(a==0&&(this.s&128)!=(f&128)){++a}if(a>0||f!=this.s){c[a++]=f}}}return c}function bnEquals(b){return(this.compareTo(b)==0)}function bnMin(b){return(this.compareTo(b)<0)?this:b}function bnMax(b){return(this.compareTo(b)>0)?this:b}function bnpBitwiseTo(c,h,e){var d,g,b=Math.min(c.t,this.t);for(d=0;d<b;++d){e[d]=h(this[d],c[d])}if(c.t<this.t){g=c.s&this.DM;for(d=b;d<this.t;++d){e[d]=h(this[d],g)}e.t=this.t}else{g=this.s&this.DM;for(d=b;d<c.t;++d){e[d]=h(g,c[d])}e.t=c.t}e.s=h(this.s,c.s);e.clamp()}function op_and(a,b){return a&b}function bnAnd(b){var c=nbi();this.bitwiseTo(b,op_and,c);return c}function op_or(a,b){return a|b}function bnOr(b){var c=nbi();this.bitwiseTo(b,op_or,c);return c}function op_xor(a,b){return a^b}function bnXor(b){var c=nbi();this.bitwiseTo(b,op_xor,c);return c}function op_andnot(a,b){return a&~b}function bnAndNot(b){var c=nbi();this.bitwiseTo(b,op_andnot,c);return c}function bnNot(){var b=nbi();for(var a=0;a<this.t;++a){b[a]=this.DM&~this[a]}b.t=this.t;b.s=~this.s;return b}function bnShiftLeft(b){var a=nbi();if(b<0){this.rShiftTo(-b,a)}else{this.lShiftTo(b,a)}return a}function bnShiftRight(b){var a=nbi();if(b<0){this.lShiftTo(-b,a)}else{this.rShiftTo(b,a)}return a}function lbit(a){if(a==0){return -1}var b=0;if((a&65535)==0){a>>=16;b+=16}if((a&255)==0){a>>=8;b+=8}if((a&15)==0){a>>=4;b+=4}if((a&3)==0){a>>=2;b+=2}if((a&1)==0){++b}return b}function bnGetLowestSetBit(){for(var a=0;a<this.t;++a){if(this[a]!=0){return a*this.DB+lbit(this[a])}}if(this.s<0){return this.t*this.DB}return -1}function cbit(a){var b=0;while(a!=0){a&=a-1;++b}return b}function bnBitCount(){var c=0,a=this.s&this.DM;for(var b=0;b<this.t;++b){c+=cbit(this[b]^a)}return c}function bnTestBit(b){var a=Math.floor(b/this.DB);if(a>=this.t){return(this.s!=0)}return((this[a]&(1<<(b%this.DB)))!=0)}function bnpChangeBit(c,b){var a=BigInteger.ONE.shiftLeft(c);this.bitwiseTo(a,b,a);return a}function bnSetBit(a){return this.changeBit(a,op_or)}function bnClearBit(a){return this.changeBit(a,op_andnot)}function bnFlipBit(a){return this.changeBit(a,op_xor)}function bnpAddTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]+d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g+=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g+=d[e];f[e++]=g&this.DM;g>>=this.DB}g+=d.s}f.s=(g<0)?-1:0;if(g>0){f[e++]=g}else{if(g<-1){f[e++]=this.DV+g}}f.t=e;f.clamp()}function bnAdd(b){var c=nbi();this.addTo(b,c);return c}function bnSubtract(b){var c=nbi();this.subTo(b,c);return c}function bnMultiply(b){var c=nbi();this.multiplyTo(b,c);return c}function bnSquare(){var a=nbi();this.squareTo(a);return a}function bnDivide(b){var c=nbi();this.divRemTo(b,c,null);return c}function bnRemainder(b){var c=nbi();this.divRemTo(b,null,c);return c}function bnDivideAndRemainder(b){var d=nbi(),c=nbi();this.divRemTo(b,d,c);return new Array(d,c)}function bnpDMultiply(a){this[this.t]=this.am(0,a-1,this,0,0,this.t);++this.t;this.clamp()}function bnpDAddOffset(b,a){if(b==0){return}while(this.t<=a){this[this.t++]=0}this[a]+=b;while(this[a]>=this.DV){this[a]-=this.DV;if(++a>=this.t){this[this.t++]=0}++this[a]}}function NullExp(){}function nNop(a){return a}function nMulTo(a,c,b){a.multiplyTo(c,b)}function nSqrTo(a,b){a.squareTo(b)}NullExp.prototype.convert=nNop;NullExp.prototype.revert=nNop;NullExp.prototype.mulTo=nMulTo;NullExp.prototype.sqrTo=nSqrTo;function bnPow(a){return this.exp(a,new NullExp())}function bnpMultiplyLowerTo(b,f,e){var d=Math.min(this.t+b.t,f);e.s=0;e.t=d;while(d>0){e[--d]=0}var c;for(c=e.t-this.t;d<c;++d){e[d+this.t]=this.am(0,b[d],e,d,0,this.t)}for(c=Math.min(b.t,f);d<c;++d){this.am(0,b[d],e,d,0,f-d)}e.clamp()}function bnpMultiplyUpperTo(b,e,d){--e;var c=d.t=this.t+b.t-e;d.s=0;while(--c>=0){d[c]=0}for(c=Math.max(e-this.t,0);c<b.t;++c){d[this.t+c-e]=this.am(e-c,b[c],d,0,0,this.t+c-e)}d.clamp();d.drShiftTo(1,d)}function Barrett(a){this.r2=nbi();this.q3=nbi();BigInteger.ONE.dlShiftTo(2*a.t,this.r2);this.mu=this.r2.divide(a);this.m=a}function barrettConvert(a){if(a.s<0||a.t>2*this.m.t){return a.mod(this.m)}else{if(a.compareTo(this.m)<0){return a}else{var b=nbi();a.copyTo(b);this.reduce(b);return b}}}function barrettRevert(a){return a}function barrettReduce(a){a.drShiftTo(this.m.t-1,this.r2);if(a.t>this.m.t+1){a.t=this.m.t+1;a.clamp()}this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);while(a.compareTo(this.r2)<0){a.dAddOffset(1,this.m.t+1)}a.subTo(this.r2,a);while(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function barrettSqrTo(a,b){a.squareTo(b);this.reduce(b)}function barrettMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Barrett.prototype.convert=barrettConvert;Barrett.prototype.revert=barrettRevert;Barrett.prototype.reduce=barrettReduce;Barrett.prototype.mulTo=barrettMulTo;Barrett.prototype.sqrTo=barrettSqrTo;function bnModPow(q,f){var o=q.bitLength(),h,b=nbv(1),v;if(o<=0){return b}else{if(o<18){h=1}else{if(o<48){h=3}else{if(o<144){h=4}else{if(o<768){h=5}else{h=6}}}}}if(o<8){v=new Classic(f)}else{if(f.isEven()){v=new Barrett(f)}else{v=new Montgomery(f)}}var p=new Array(),d=3,s=h-1,a=(1<<h)-1;p[1]=v.convert(this);if(h>1){var A=nbi();v.sqrTo(p[1],A);while(d<=a){p[d]=nbi();v.mulTo(A,p[d-2],p[d]);d+=2}}var l=q.t-1,x,u=true,c=nbi(),y;o=nbits(q[l])-1;while(l>=0){if(o>=s){x=(q[l]>>(o-s))&a}else{x=(q[l]&((1<<(o+1))-1))<<(s-o);if(l>0){x|=q[l-1]>>(this.DB+o-s)}}d=h;while((x&1)==0){x>>=1;--d}if((o-=d)<0){o+=this.DB;--l}if(u){p[x].copyTo(b);u=false}else{while(d>1){v.sqrTo(b,c);v.sqrTo(c,b);d-=2}if(d>0){v.sqrTo(b,c)}else{y=b;b=c;c=y}v.mulTo(c,p[x],b)}while(l>=0&&(q[l]&(1<<o))==0){v.sqrTo(b,c);y=b;b=c;c=y;if(--o<0){o=this.DB-1;--l}}}return v.revert(b)}function bnGCD(c){var b=(this.s<0)?this.negate():this.clone();var h=(c.s<0)?c.negate():c.clone();if(b.compareTo(h)<0){var e=b;b=h;h=e}var d=b.getLowestSetBit(),f=h.getLowestSetBit();if(f<0){return b}if(d<f){f=d}if(f>0){b.rShiftTo(f,b);h.rShiftTo(f,h)}while(b.signum()>0){if((d=b.getLowestSetBit())>0){b.rShiftTo(d,b)}if((d=h.getLowestSetBit())>0){h.rShiftTo(d,h)}if(b.compareTo(h)>=0){b.subTo(h,b);b.rShiftTo(1,b)}else{h.subTo(b,h);h.rShiftTo(1,h)}}if(f>0){h.lShiftTo(f,h)}return h}function bnpModInt(e){if(e<=0){return 0}var c=this.DV%e,b=(this.s<0)?e-1:0;if(this.t>0){if(c==0){b=this[0]%e}else{for(var a=this.t-1;a>=0;--a){b=(c*b+this[a])%e}}}return b}function bnModInverse(f){var j=f.isEven();if((this.isEven()&&j)||f.signum()==0){return BigInteger.ZERO}var i=f.clone(),h=this.clone();var g=nbv(1),e=nbv(0),l=nbv(0),k=nbv(1);while(i.signum()!=0){while(i.isEven()){i.rShiftTo(1,i);if(j){if(!g.isEven()||!e.isEven()){g.addTo(this,g);e.subTo(f,e)}g.rShiftTo(1,g)}else{if(!e.isEven()){e.subTo(f,e)}}e.rShiftTo(1,e)}while(h.isEven()){h.rShiftTo(1,h);if(j){if(!l.isEven()||!k.isEven()){l.addTo(this,l);k.subTo(f,k)}l.rShiftTo(1,l)}else{if(!k.isEven()){k.subTo(f,k)}}k.rShiftTo(1,k)}if(i.compareTo(h)>=0){i.subTo(h,i);if(j){g.subTo(l,g)}e.subTo(k,e)}else{h.subTo(i,h);if(j){l.subTo(g,l)}k.subTo(e,k)}}if(h.compareTo(BigInteger.ONE)!=0){return BigInteger.ZERO}if(k.compareTo(f)>=0){return k.subtract(f)}if(k.signum()<0){k.addTo(f,k)}else{return k}if(k.signum()<0){return k.add(f)}else{return k}}var lowprimes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];var lplim=(1<<26)/lowprimes[lowprimes.length-1];function bnIsProbablePrime(e){var d,b=this.abs();if(b.t==1&&b[0]<=lowprimes[lowprimes.length-1]){for(d=0;d<lowprimes.length;++d){if(b[0]==lowprimes[d]){return true}}return false}if(b.isEven()){return false}d=1;while(d<lowprimes.length){var a=lowprimes[d],c=d+1;while(c<lowprimes.length&&a<lplim){a*=lowprimes[c++]}a=b.modInt(a);while(d<c){if(a%lowprimes[d++]==0){return false}}}return b.millerRabin(e)}function bnpMillerRabin(f){var g=this.subtract(BigInteger.ONE);var c=g.getLowestSetBit();if(c<=0){return false}var h=g.shiftRight(c);f=(f+1)>>1;if(f>lowprimes.length){f=lowprimes.length}var b=nbi();for(var e=0;e<f;++e){b.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);var l=b.modPow(h,this);if(l.compareTo(BigInteger.ONE)!=0&&l.compareTo(g)!=0){var d=1;while(d++<c&&l.compareTo(g)!=0){l=l.modPowInt(2,this);if(l.compareTo(BigInteger.ONE)==0){return false}}if(l.compareTo(g)!=0){return false}}}return true}BigInteger.prototype.chunkSize=bnpChunkSize;BigInteger.prototype.toRadix=bnpToRadix;BigInteger.prototype.fromRadix=bnpFromRadix;BigInteger.prototype.fromNumber=bnpFromNumber;BigInteger.prototype.bitwiseTo=bnpBitwiseTo;BigInteger.prototype.changeBit=bnpChangeBit;BigInteger.prototype.addTo=bnpAddTo;BigInteger.prototype.dMultiply=bnpDMultiply;BigInteger.prototype.dAddOffset=bnpDAddOffset;BigInteger.prototype.multiplyLowerTo=bnpMultiplyLowerTo;BigInteger.prototype.multiplyUpperTo=bnpMultiplyUpperTo;BigInteger.prototype.modInt=bnpModInt;BigInteger.prototype.millerRabin=bnpMillerRabin;BigInteger.prototype.clone=bnClone;BigInteger.prototype.intValue=bnIntValue;BigInteger.prototype.byteValue=bnByteValue;BigInteger.prototype.shortValue=bnShortValue;BigInteger.prototype.signum=bnSigNum;BigInteger.prototype.toByteArray=bnToByteArray;BigInteger.prototype.equals=bnEquals;BigInteger.prototype.min=bnMin;BigInteger.prototype.max=bnMax;BigInteger.prototype.and=bnAnd;BigInteger.prototype.or=bnOr;BigInteger.prototype.xor=bnXor;BigInteger.prototype.andNot=bnAndNot;BigInteger.prototype.not=bnNot;BigInteger.prototype.shiftLeft=bnShiftLeft;BigInteger.prototype.shiftRight=bnShiftRight;BigInteger.prototype.getLowestSetBit=bnGetLowestSetBit;BigInteger.prototype.bitCount=bnBitCount;BigInteger.prototype.testBit=bnTestBit;BigInteger.prototype.setBit=bnSetBit;BigInteger.prototype.clearBit=bnClearBit;BigInteger.prototype.flipBit=bnFlipBit;BigInteger.prototype.add=bnAdd;BigInteger.prototype.subtract=bnSubtract;BigInteger.prototype.multiply=bnMultiply;BigInteger.prototype.divide=bnDivide;BigInteger.prototype.remainder=bnRemainder;BigInteger.prototype.divideAndRemainder=bnDivideAndRemainder;BigInteger.prototype.modPow=bnModPow;BigInteger.prototype.modInverse=bnModInverse;BigInteger.prototype.pow=bnPow;BigInteger.prototype.gcd=bnGCD;BigInteger.prototype.isProbablePrime=bnIsProbablePrime;BigInteger.prototype.square=bnSquare;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function Arcfour(){this.i=0;this.j=0;this.S=new Array()}function ARC4init(d){var c,a,b;for(c=0;c<256;++c){this.S[c]=c}a=0;for(c=0;c<256;++c){a=(a+this.S[c]+d[c%d.length])&255;b=this.S[c];this.S[c]=this.S[a];this.S[a]=b}this.i=0;this.j=0}function ARC4next(){var a;this.i=(this.i+1)&255;this.j=(this.j+this.S[this.i])&255;a=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=a;return this.S[(a+this.S[this.i])&255]}Arcfour.prototype.init=ARC4init;Arcfour.prototype.next=ARC4next;function prng_newstate(){return new Arcfour()}var rng_psize=256;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var rng_state;var rng_pool;var rng_pptr;function rng_seed_int(a){rng_pool[rng_pptr++]^=a&255;rng_pool[rng_pptr++]^=(a>>8)&255;rng_pool[rng_pptr++]^=(a>>16)&255;rng_pool[rng_pptr++]^=(a>>24)&255;if(rng_pptr>=rng_psize){rng_pptr-=rng_psize}}function rng_seed_time(){rng_seed_int(new Date().getTime())}if(rng_pool==null){rng_pool=new Array();rng_pptr=0;var t;if(window!==undefined&&(window.crypto!==undefined||window.msCrypto!==undefined)){var crypto=window.crypto||window.msCrypto;if(crypto.getRandomValues){var ua=new Uint8Array(32);crypto.getRandomValues(ua);for(t=0;t<32;++t){rng_pool[rng_pptr++]=ua[t]}}else{if(navigator.appName=="Netscape"&&navigator.appVersion<"5"){var z=window.crypto.random(32);for(t=0;t<z.length;++t){rng_pool[rng_pptr++]=z.charCodeAt(t)&255}}}}while(rng_pptr<rng_psize){t=Math.floor(65536*Math.random());rng_pool[rng_pptr++]=t>>>8;rng_pool[rng_pptr++]=t&255}rng_pptr=0;rng_seed_time()}function rng_get_byte(){if(rng_state==null){rng_seed_time();rng_state=prng_newstate();rng_state.init(rng_pool);for(rng_pptr=0;rng_pptr<rng_pool.length;++rng_pptr){rng_pool[rng_pptr]=0}rng_pptr=0}return rng_state.next()}function rng_get_bytes(b){var a;for(a=0;a<b.length;++a){b[a]=rng_get_byte()}}function SecureRandom(){}SecureRandom.prototype.nextBytes=rng_get_bytes;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function parseBigInt(b,a){return new BigInteger(b,a)}function linebrk(c,d){var a="";var b=0;while(b+d<c.length){a+=c.substring(b,b+d)+"\n";b+=d}return a+c.substring(b,c.length)}function byte2Hex(a){if(a<16){return"0"+a.toString(16)}else{return a.toString(16)}}function pkcs1pad2(e,h){if(h<e.length+11){throw"Message too long for RSA";return null}var g=new Array();var d=e.length-1;while(d>=0&&h>0){var f=e.charCodeAt(d--);if(f<128){g[--h]=f}else{if((f>127)&&(f<2048)){g[--h]=(f&63)|128;g[--h]=(f>>6)|192}else{g[--h]=(f&63)|128;g[--h]=((f>>6)&63)|128;g[--h]=(f>>12)|224}}}g[--h]=0;var b=new SecureRandom();var a=new Array();while(h>2){a[0]=0;while(a[0]==0){b.nextBytes(a)}g[--h]=a[0]}g[--h]=2;g[--h]=0;return new BigInteger(g)}function oaep_mgf1_arr(c,a,e){var b="",d=0;while(b.length<a){b+=e(String.fromCharCode.apply(String,c.concat([(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255])));d+=1}return b}function oaep_pad(q,a,f,l){var c=KJUR.crypto.MessageDigest;var o=KJUR.crypto.Util;var b=null;if(!f){f="sha1"}if(typeof f==="string"){b=c.getCanonicalAlgName(f);l=c.getHashLength(b);f=function(i){return hextorstr(o.hashHex(rstrtohex(i),b))}}if(q.length+2*l+2>a){throw"Message too long for RSA"}var k="",e;for(e=0;e<a-q.length-2*l-2;e+=1){k+="\x00"}var h=f("")+k+"\x01"+q;var g=new Array(l);new SecureRandom().nextBytes(g);var j=oaep_mgf1_arr(g,h.length,f);var p=[];for(e=0;e<h.length;e+=1){p[e]=h.charCodeAt(e)^j.charCodeAt(e)}var m=oaep_mgf1_arr(p,g.length,f);var d=[0];for(e=0;e<g.length;e+=1){d[e+1]=g[e]^m.charCodeAt(e)}return new BigInteger(d.concat(p))}function RSAKey(){this.n=null;this.e=0;this.d=null;this.p=null;this.q=null;this.dmp1=null;this.dmq1=null;this.coeff=null}function RSASetPublic(b,a){this.isPublic=true;this.isPrivate=false;if(typeof b!=="string"){this.n=b;this.e=a}else{if(b!=null&&a!=null&&b.length>0&&a.length>0){this.n=parseBigInt(b,16);this.e=parseInt(a,16)}else{throw"Invalid RSA public key"}}}function RSADoPublic(a){return a.modPowInt(this.e,this.n)}function RSAEncrypt(d){var a=pkcs1pad2(d,(this.n.bitLength()+7)>>3);if(a==null){return null}var e=this.doPublic(a);if(e==null){return null}var b=e.toString(16);if((b.length&1)==0){return b}else{return"0"+b}}function RSAEncryptOAEP(f,e,b){var a=oaep_pad(f,(this.n.bitLength()+7)>>3,e,b);if(a==null){return null}var g=this.doPublic(a);if(g==null){return null}var d=g.toString(16);if((d.length&1)==0){return d}else{return"0"+d}}RSAKey.prototype.doPublic=RSADoPublic;RSAKey.prototype.setPublic=RSASetPublic;RSAKey.prototype.encrypt=RSAEncrypt;RSAKey.prototype.encryptOAEP=RSAEncryptOAEP;RSAKey.prototype.type="RSA";
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function pkcs1unpad2(g,j){var a=g.toByteArray();var f=0;while(f<a.length&&a[f]==0){++f}if(a.length-f!=j-1||a[f]!=2){return null}++f;while(a[f]!=0){if(++f>=a.length){return null}}var e="";while(++f<a.length){var h=a[f]&255;if(h<128){e+=String.fromCharCode(h)}else{if((h>191)&&(h<224)){e+=String.fromCharCode(((h&31)<<6)|(a[f+1]&63));++f}else{e+=String.fromCharCode(((h&15)<<12)|((a[f+1]&63)<<6)|(a[f+2]&63));f+=2}}}return e}function oaep_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=e(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]));d+=1}return b}function oaep_unpad(o,b,g,p){var e=KJUR.crypto.MessageDigest;var r=KJUR.crypto.Util;var c=null;if(!g){g="sha1"}if(typeof g==="string"){c=e.getCanonicalAlgName(g);p=e.getHashLength(c);g=function(d){return hextorstr(r.hashHex(rstrtohex(d),c))}}o=o.toByteArray();var h;for(h=0;h<o.length;h+=1){o[h]&=255}while(o.length<b){o.unshift(0)}o=String.fromCharCode.apply(String,o);if(o.length<2*p+2){throw"Cipher too short"}var f=o.substr(1,p);var s=o.substr(p+1);var q=oaep_mgf1_str(s,p,g);var k=[],h;for(h=0;h<f.length;h+=1){k[h]=f.charCodeAt(h)^q.charCodeAt(h)}var l=oaep_mgf1_str(String.fromCharCode.apply(String,k),o.length-p,g);var j=[];for(h=0;h<s.length;h+=1){j[h]=s.charCodeAt(h)^l.charCodeAt(h)}j=String.fromCharCode.apply(String,j);if(j.substr(0,p)!==g("")){throw"Hash mismatch"}j=j.substr(p);var a=j.indexOf("\x01");var m=(a!=-1)?j.substr(0,a).lastIndexOf("\x00"):-1;if(m+1!=a){throw"Malformed data"}return j.substr(a+1)}function RSASetPrivate(c,a,b){this.isPrivate=true;if(typeof c!=="string"){this.n=c;this.e=a;this.d=b}else{if(c!=null&&a!=null&&c.length>0&&a.length>0){this.n=parseBigInt(c,16);this.e=parseInt(a,16);this.d=parseBigInt(b,16)}else{throw"Invalid RSA private key"}}}function RSASetPrivateEx(g,d,e,c,b,a,h,f){this.isPrivate=true;this.isPublic=false;if(g==null){throw"RSASetPrivateEx N == null"}if(d==null){throw"RSASetPrivateEx E == null"}if(g.length==0){throw"RSASetPrivateEx N.length == 0"}if(d.length==0){throw"RSASetPrivateEx E.length == 0"}if(g!=null&&d!=null&&g.length>0&&d.length>0){this.n=parseBigInt(g,16);this.e=parseInt(d,16);this.d=parseBigInt(e,16);this.p=parseBigInt(c,16);this.q=parseBigInt(b,16);this.dmp1=parseBigInt(a,16);this.dmq1=parseBigInt(h,16);this.coeff=parseBigInt(f,16)}else{throw"Invalid RSA private key in RSASetPrivateEx"}}function RSAGenerate(b,i){var a=new SecureRandom();var f=b>>1;this.e=parseInt(i,16);var c=new BigInteger(i,16);for(;;){for(;;){this.p=new BigInteger(b-f,1,a);if(this.p.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.p.isProbablePrime(10)){break}}for(;;){this.q=new BigInteger(f,1,a);if(this.q.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.q.isProbablePrime(10)){break}}if(this.p.compareTo(this.q)<=0){var h=this.p;this.p=this.q;this.q=h}var g=this.p.subtract(BigInteger.ONE);var d=this.q.subtract(BigInteger.ONE);var e=g.multiply(d);if(e.gcd(c).compareTo(BigInteger.ONE)==0){this.n=this.p.multiply(this.q);this.d=c.modInverse(e);this.dmp1=this.d.mod(g);this.dmq1=this.d.mod(d);this.coeff=this.q.modInverse(this.p);break}}this.isPrivate=true}function RSADoPrivate(a){if(this.p==null||this.q==null){return a.modPow(this.d,this.n)}var c=a.mod(this.p).modPow(this.dmp1,this.p);var b=a.mod(this.q).modPow(this.dmq1,this.q);while(c.compareTo(b)<0){c=c.add(this.p)}return c.subtract(b).multiply(this.coeff).mod(this.p).multiply(this.q).add(b)}function RSADecrypt(b){var d=parseBigInt(b,16);var a=this.doPrivate(d);if(a==null){return null}return pkcs1unpad2(a,(this.n.bitLength()+7)>>3)}function RSADecryptOAEP(e,d,b){var f=parseBigInt(e,16);var a=this.doPrivate(f);if(a==null){return null}return oaep_unpad(a,(this.n.bitLength()+7)>>3,d,b)}RSAKey.prototype.doPrivate=RSADoPrivate;RSAKey.prototype.setPrivate=RSASetPrivate;RSAKey.prototype.setPrivateEx=RSASetPrivateEx;RSAKey.prototype.generate=RSAGenerate;RSAKey.prototype.decrypt=RSADecrypt;RSAKey.prototype.decryptOAEP=RSADecryptOAEP;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function ECFieldElementFp(b,a){this.x=a;this.q=b}function feFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.x.equals(a.x))}function feFpToBigInteger(){return this.x}function feFpNegate(){return new ECFieldElementFp(this.q,this.x.negate().mod(this.q))}function feFpAdd(a){return new ECFieldElementFp(this.q,this.x.add(a.toBigInteger()).mod(this.q))}function feFpSubtract(a){return new ECFieldElementFp(this.q,this.x.subtract(a.toBigInteger()).mod(this.q))}function feFpMultiply(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger()).mod(this.q))}function feFpSquare(){return new ECFieldElementFp(this.q,this.x.square().mod(this.q))}function feFpDivide(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger().modInverse(this.q)).mod(this.q))}ECFieldElementFp.prototype.equals=feFpEquals;ECFieldElementFp.prototype.toBigInteger=feFpToBigInteger;ECFieldElementFp.prototype.negate=feFpNegate;ECFieldElementFp.prototype.add=feFpAdd;ECFieldElementFp.prototype.subtract=feFpSubtract;ECFieldElementFp.prototype.multiply=feFpMultiply;ECFieldElementFp.prototype.square=feFpSquare;ECFieldElementFp.prototype.divide=feFpDivide;function ECPointFp(c,a,d,b){this.curve=c;this.x=a;this.y=d;if(b==null){this.z=BigInteger.ONE}else{this.z=b}this.zinv=null}function pointFpGetX(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpGetY(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpEquals(a){if(a==this){return true}if(this.isInfinity()){return a.isInfinity()}if(a.isInfinity()){return this.isInfinity()}var c,b;c=a.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(a.z)).mod(this.curve.q);if(!c.equals(BigInteger.ZERO)){return false}b=a.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(a.z)).mod(this.curve.q);return b.equals(BigInteger.ZERO)}function pointFpIsInfinity(){if((this.x==null)&&(this.y==null)){return true}return this.z.equals(BigInteger.ZERO)&&!this.y.toBigInteger().equals(BigInteger.ZERO)}function pointFpNegate(){return new ECPointFp(this.curve,this.x,this.y.negate(),this.z)}function pointFpAdd(l){if(this.isInfinity()){return l}if(l.isInfinity()){return this}var p=l.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(l.z)).mod(this.curve.q);var o=l.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(l.z)).mod(this.curve.q);if(BigInteger.ZERO.equals(o)){if(BigInteger.ZERO.equals(p)){return this.twice()}return this.curve.getInfinity()}var j=new BigInteger("3");var e=this.x.toBigInteger();var n=this.y.toBigInteger();var c=l.x.toBigInteger();var k=l.y.toBigInteger();var m=o.square();var i=m.multiply(o);var d=e.multiply(m);var g=p.square().multiply(this.z);var a=g.subtract(d.shiftLeft(1)).multiply(l.z).subtract(i).multiply(o).mod(this.curve.q);var h=d.multiply(j).multiply(p).subtract(n.multiply(i)).subtract(g.multiply(p)).multiply(l.z).add(p.multiply(i)).mod(this.curve.q);var f=i.multiply(this.z).multiply(l.z).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(a),this.curve.fromBigInteger(h),f)}function pointFpTwice(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var g=new BigInteger("3");var c=this.x.toBigInteger();var h=this.y.toBigInteger();var e=h.multiply(this.z);var j=e.multiply(h).mod(this.curve.q);var i=this.curve.a.toBigInteger();var k=c.square().multiply(g);if(!BigInteger.ZERO.equals(i)){k=k.add(this.z.square().multiply(i))}k=k.mod(this.curve.q);var b=k.square().subtract(c.shiftLeft(3).multiply(j)).shiftLeft(1).multiply(e).mod(this.curve.q);var f=k.multiply(g).multiply(c).subtract(j.shiftLeft(1)).shiftLeft(2).multiply(j).subtract(k.square().multiply(k)).mod(this.curve.q);var d=e.square().multiply(e).shiftLeft(3).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(b),this.curve.fromBigInteger(f),d)}function pointFpMultiply(d){if(this.isInfinity()){return this}if(d.signum()==0){return this.curve.getInfinity()}var m=d;var l=m.multiply(new BigInteger("3"));var b=this.negate();var j=this;var q=this.curve.q.subtract(d);var o=q.multiply(new BigInteger("3"));var c=new ECPointFp(this.curve,this.x,this.y);var a=c.negate();var g;for(g=l.bitLength()-2;g>0;--g){j=j.twice();var n=l.testBit(g);var f=m.testBit(g);if(n!=f){j=j.add(n?this:b)}}for(g=o.bitLength()-2;g>0;--g){c=c.twice();var p=o.testBit(g);var r=q.testBit(g);if(p!=r){c=c.add(p?c:a)}}return j}function pointFpMultiplyTwo(c,a,b){var d;if(c.bitLength()>b.bitLength()){d=c.bitLength()-1}else{d=b.bitLength()-1}var f=this.curve.getInfinity();var e=this.add(a);while(d>=0){f=f.twice();if(c.testBit(d)){if(b.testBit(d)){f=f.add(e)}else{f=f.add(this)}}else{if(b.testBit(d)){f=f.add(a)}}--d}return f}ECPointFp.prototype.getX=pointFpGetX;ECPointFp.prototype.getY=pointFpGetY;ECPointFp.prototype.equals=pointFpEquals;ECPointFp.prototype.isInfinity=pointFpIsInfinity;ECPointFp.prototype.negate=pointFpNegate;ECPointFp.prototype.add=pointFpAdd;ECPointFp.prototype.twice=pointFpTwice;ECPointFp.prototype.multiply=pointFpMultiply;ECPointFp.prototype.multiplyTwo=pointFpMultiplyTwo;function ECCurveFp(e,d,c){this.q=e;this.a=this.fromBigInteger(d);this.b=this.fromBigInteger(c);this.infinity=new ECPointFp(this,null,null)}function curveFpGetQ(){return this.q}function curveFpGetA(){return this.a}function curveFpGetB(){return this.b}function curveFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.a.equals(a.a)&&this.b.equals(a.b))}function curveFpGetInfinity(){return this.infinity}function curveFpFromBigInteger(a){return new ECFieldElementFp(this.q,a)}function curveFpDecodePointHex(d){switch(parseInt(d.substr(0,2),16)){case 0:return this.infinity;case 2:case 3:return null;case 4:case 6:case 7:var a=(d.length-2)/2;var c=d.substr(2,a);var b=d.substr(a+2,a);return new ECPointFp(this,this.fromBigInteger(new BigInteger(c,16)),this.fromBigInteger(new BigInteger(b,16)));default:return null}}ECCurveFp.prototype.getQ=curveFpGetQ;ECCurveFp.prototype.getA=curveFpGetA;ECCurveFp.prototype.getB=curveFpGetB;ECCurveFp.prototype.equals=curveFpEquals;ECCurveFp.prototype.getInfinity=curveFpGetInfinity;ECCurveFp.prototype.fromBigInteger=curveFpFromBigInteger;ECCurveFp.prototype.decodePointHex=curveFpDecodePointHex;
/*! (c) Stefan Thomas | https://github.com/bitcoinjs/bitcoinjs-lib
 */
ECFieldElementFp.prototype.getByteLength=function(){return Math.floor((this.toBigInteger().bitLength()+7)/8)};ECPointFp.prototype.getEncoded=function(c){var d=function(h,f){var g=h.toByteArrayUnsigned();if(f<g.length){g=g.slice(g.length-f)}else{while(f>g.length){g.unshift(0)}}return g};var a=this.getX().toBigInteger();var e=this.getY().toBigInteger();var b=d(a,32);if(c){if(e.isEven()){b.unshift(2)}else{b.unshift(3)}}else{b.unshift(4);b=b.concat(d(e,32))}return b};ECPointFp.decodeFrom=function(g,c){var f=c[0];var e=c.length-1;var d=c.slice(1,1+e/2);var b=c.slice(1+e/2,1+e);d.unshift(0);b.unshift(0);var a=new BigInteger(d);var h=new BigInteger(b);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.decodeFromHex=function(g,c){var f=c.substr(0,2);var e=c.length-2;var d=c.substr(2,e/2);var b=c.substr(2+e/2,e/2);var a=new BigInteger(d,16);var h=new BigInteger(b,16);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.prototype.add2D=function(c){if(this.isInfinity()){return c}if(c.isInfinity()){return this}if(this.x.equals(c.x)){if(this.y.equals(c.y)){return this.twice()}return this.curve.getInfinity()}var g=c.x.subtract(this.x);var e=c.y.subtract(this.y);var a=e.divide(g);var d=a.square().subtract(this.x).subtract(c.x);var f=a.multiply(this.x.subtract(d)).subtract(this.y);return new ECPointFp(this.curve,d,f)};ECPointFp.prototype.twice2D=function(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var b=this.curve.fromBigInteger(BigInteger.valueOf(2));var e=this.curve.fromBigInteger(BigInteger.valueOf(3));var a=this.x.square().multiply(e).add(this.curve.a).divide(this.y.multiply(b));var c=a.square().subtract(this.x.multiply(b));var d=a.multiply(this.x.subtract(c)).subtract(this.y);return new ECPointFp(this.curve,c,d)};ECPointFp.prototype.multiply2D=function(b){if(this.isInfinity()){return this}if(b.signum()==0){return this.curve.getInfinity()}var g=b;var f=g.multiply(new BigInteger("3"));var l=this.negate();var d=this;var c;for(c=f.bitLength()-2;c>0;--c){d=d.twice();var a=f.testBit(c);var j=g.testBit(c);if(a!=j){d=d.add2D(a?this:l)}}return d};ECPointFp.prototype.isOnCurve=function(){var d=this.getX().toBigInteger();var i=this.getY().toBigInteger();var f=this.curve.getA().toBigInteger();var c=this.curve.getB().toBigInteger();var h=this.curve.getQ();var e=i.multiply(i).mod(h);var g=d.multiply(d).multiply(d).add(f.multiply(d)).add(c).mod(h);return e.equals(g)};ECPointFp.prototype.toString=function(){return"("+this.getX().toBigInteger().toString()+","+this.getY().toBigInteger().toString()+")"};ECPointFp.prototype.validate=function(){var c=this.curve.getQ();if(this.isInfinity()){throw new Error("Point is at infinity.")}var a=this.getX().toBigInteger();var b=this.getY().toBigInteger();if(a.compareTo(BigInteger.ONE)<0||a.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("x coordinate out of bounds")}if(b.compareTo(BigInteger.ONE)<0||b.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("y coordinate out of bounds")}if(!this.isOnCurve()){throw new Error("Point is not on the curve.")}if(this.multiply(c).isInfinity()){throw new Error("Point is not a scalar multiple of G.")}return true};
/*! Mike Samuel (c) 2009 | code.google.com/p/json-sans-eval
 */
var jsonParse=(function(){var e="(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)";var j='(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';var i='(?:"'+j+'*")';var d=new RegExp("(?:false|true|null|[\\{\\}\\[\\]]|"+e+"|"+i+")","g");var k=new RegExp("\\\\(?:([^u])|u(.{4}))","g");var g={'"':'"',"/":"/","\\":"\\",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"};function h(l,m,n){return m?g[m]:String.fromCharCode(parseInt(n,16))}var c=new String("");var a="\\";var f={"{":Object,"[":Array};var b=Object.hasOwnProperty;return function(u,q){var p=u.match(d);var x;var v=p[0];var l=false;if("{"===v){x={}}else{if("["===v){x=[]}else{x=[];l=true}}var t;var r=[x];for(var o=1-l,m=p.length;o<m;++o){v=p[o];var w;switch(v.charCodeAt(0)){default:w=r[0];w[t||w.length]=+(v);t=void 0;break;case 34:v=v.substring(1,v.length-1);if(v.indexOf(a)!==-1){v=v.replace(k,h)}w=r[0];if(!t){if(w instanceof Array){t=w.length}else{t=v||c;break}}w[t]=v;t=void 0;break;case 91:w=r[0];r.unshift(w[t||w.length]=[]);t=void 0;break;case 93:r.shift();break;case 102:w=r[0];w[t||w.length]=false;t=void 0;break;case 110:w=r[0];w[t||w.length]=null;t=void 0;break;case 116:w=r[0];w[t||w.length]=true;t=void 0;break;case 123:w=r[0];r.unshift(w[t||w.length]={});t=void 0;break;case 125:r.shift();break}}if(l){if(r.length!==1){throw new Error()}x=x[0]}else{if(r.length){throw new Error()}}if(q){var s=function(C,B){var D=C[B];if(D&&typeof D==="object"){var n=null;for(var z in D){if(b.call(D,z)&&D!==C){var y=s(D,z);if(y!==void 0){D[z]=y}else{if(!n){n=[]}n.push(z)}}}if(n){for(var A=n.length;--A>=0;){delete D[n[A]]}}}return q.call(C,B,D)};x=s({"":x},"")}return x}})();
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}KJUR.asn1.ASN1Util=new function(){this.integerToByteHex=function(a){var b=a.toString(16);if((b.length%2)==1){b="0"+b}return b};this.bigIntToMinTwosComplementsHex=function(j){var f=j.toString(16);if(f.substr(0,1)!="-"){if(f.length%2==1){f="0"+f}else{if(!f.match(/^[0-7]/)){f="00"+f}}}else{var a=f.substr(1);var e=a.length;if(e%2==1){e+=1}else{if(!f.match(/^[0-7]/)){e+=2}}var g="";for(var d=0;d<e;d++){g+="f"}var c=new BigInteger(g,16);var b=c.xor(j).add(BigInteger.ONE);f=b.toString(16).replace(/^-/,"")}return f};this.getPEMStringFromHex=function(a,b){return hextopem(a,b)};this.newObject=function(k){var D=KJUR,n=D.asn1,z=n.DERBoolean,e=n.DERInteger,s=n.DERBitString,h=n.DEROctetString,v=n.DERNull,w=n.DERObjectIdentifier,l=n.DEREnumerated,g=n.DERUTF8String,f=n.DERNumericString,y=n.DERPrintableString,u=n.DERTeletexString,p=n.DERIA5String,C=n.DERUTCTime,j=n.DERGeneralizedTime,m=n.DERSequence,c=n.DERSet,r=n.DERTaggedObject,o=n.ASN1Util.newObject;var t=Object.keys(k);if(t.length!=1){throw"key of param shall be only one."}var F=t[0];if(":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":"+F+":")==-1){throw"undefined key: "+F}if(F=="bool"){return new z(k[F])}if(F=="int"){return new e(k[F])}if(F=="bitstr"){return new s(k[F])}if(F=="octstr"){return new h(k[F])}if(F=="null"){return new v(k[F])}if(F=="oid"){return new w(k[F])}if(F=="enum"){return new l(k[F])}if(F=="utf8str"){return new g(k[F])}if(F=="numstr"){return new f(k[F])}if(F=="prnstr"){return new y(k[F])}if(F=="telstr"){return new u(k[F])}if(F=="ia5str"){return new p(k[F])}if(F=="utctime"){return new C(k[F])}if(F=="gentime"){return new j(k[F])}if(F=="seq"){var d=k[F];var E=[];for(var x=0;x<d.length;x++){var B=o(d[x]);E.push(B)}return new m({array:E})}if(F=="set"){var d=k[F];var E=[];for(var x=0;x<d.length;x++){var B=o(d[x]);E.push(B)}return new c({array:E})}if(F=="tag"){var A=k[F];if(Object.prototype.toString.call(A)==="[object Array]"&&A.length==3){var q=o(A[2]);return new r({tag:A[0],explicit:A[1],obj:q})}else{var b={};if(A.explicit!==undefined){b.explicit=A.explicit}if(A.tag!==undefined){b.tag=A.tag}if(A.obj===undefined){throw"obj shall be specified for 'tag'."}b.obj=o(A.obj);return new r(b)}}};this.jsonToASN1HEX=function(b){var a=this.newObject(b);return a.getEncodedHex()}};KJUR.asn1.ASN1Util.oidHexToInt=function(a){var j="";var k=parseInt(a.substr(0,2),16);var d=Math.floor(k/40);var c=k%40;var j=d+"."+c;var e="";for(var f=2;f<a.length;f+=2){var g=parseInt(a.substr(f,2),16);var h=("00000000"+g.toString(2)).slice(-8);e=e+h.substr(1,7);if(h.substr(0,1)=="0"){var b=new BigInteger(e,2);j=j+"."+b.toString(10);e=""}}return j};KJUR.asn1.ASN1Util.oidIntToHex=function(f){var e=function(a){var k=a.toString(16);if(k.length==1){k="0"+k}return k};var d=function(o){var n="";var k=new BigInteger(o,10);var a=k.toString(2);var l=7-a.length%7;if(l==7){l=0}var q="";for(var m=0;m<l;m++){q+="0"}a=q+a;for(var m=0;m<a.length-1;m+=7){var p=a.substr(m,7);if(m!=a.length-7){p="1"+p}n+=e(parseInt(p,2))}return n};if(!f.match(/^[0-9.]+$/)){throw"malformed oid string: "+f}var g="";var b=f.split(".");var j=parseInt(b[0])*40+parseInt(b[1]);g+=e(j);b.splice(0,2);for(var c=0;c<b.length;c++){g+=d(b[c])}return g};KJUR.asn1.ASN1Object=function(){var c=true;var b=null;var d="00";var e="00";var a="";this.getLengthHexFromValue=function(){if(typeof this.hV=="undefined"||this.hV==null){throw"this.hV is null or undefined."}if(this.hV.length%2==1){throw"value hex must be even length: n="+a.length+",v="+this.hV}var i=this.hV.length/2;var h=i.toString(16);if(h.length%2==1){h="0"+h}if(i<128){return h}else{var g=h.length/2;if(g>15){throw"ASN.1 length too long to represent by 8x: n = "+i.toString(16)}var f=128+g;return f.toString(16)+h}};this.getEncodedHex=function(){if(this.hTLV==null||this.isModified){this.hV=this.getFreshValueHex();this.hL=this.getLengthHexFromValue();this.hTLV=this.hT+this.hL+this.hV;this.isModified=false}return this.hTLV};this.getValueHex=function(){this.getEncodedHex();return this.hV};this.getFreshValueHex=function(){return""}};KJUR.asn1.DERAbstractString=function(c){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var b=null;var a=null;this.getString=function(){return this.s};this.setString=function(d){this.hTLV=null;this.isModified=true;this.s=d;this.hV=utf8tohex(this.s).toLowerCase()};this.setStringHex=function(d){this.hTLV=null;this.isModified=true;this.s=null;this.hV=d};this.getFreshValueHex=function(){return this.hV};if(typeof c!="undefined"){if(typeof c=="string"){this.setString(c)}else{if(typeof c.str!="undefined"){this.setString(c.str)}else{if(typeof c.hex!="undefined"){this.setStringHex(c.hex)}}}}};YAHOO.lang.extend(KJUR.asn1.DERAbstractString,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractTime=function(c){KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);var b=null;var a=null;this.localDateToUTC=function(g){var e=g.getTime()+(g.getTimezoneOffset()*60000);var f=new Date(e);return f};this.formatDate=function(m,o,e){var g=this.zeroPadding;var n=this.localDateToUTC(m);var p=String(n.getFullYear());if(o=="utc"){p=p.substr(2,2)}var l=g(String(n.getMonth()+1),2);var q=g(String(n.getDate()),2);var h=g(String(n.getHours()),2);var i=g(String(n.getMinutes()),2);var j=g(String(n.getSeconds()),2);var r=p+l+q+h+i+j;if(e===true){var f=n.getMilliseconds();if(f!=0){var k=g(String(f),3);k=k.replace(/[0]+$/,"");r=r+"."+k}}return r+"Z"};this.zeroPadding=function(e,d){if(e.length>=d){return e}return new Array(d-e.length+1).join("0")+e};this.getString=function(){return this.s};this.setString=function(d){this.hTLV=null;this.isModified=true;this.s=d;this.hV=stohex(d)};this.setByDateValue=function(h,j,e,d,f,g){var i=new Date(Date.UTC(h,j-1,e,d,f,g,0));this.setByDate(i)};this.getFreshValueHex=function(){return this.hV}};YAHOO.lang.extend(KJUR.asn1.DERAbstractTime,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractStructured=function(b){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var a=null;this.setByASN1ObjectArray=function(c){this.hTLV=null;this.isModified=true;this.asn1Array=c};this.appendASN1Object=function(c){this.hTLV=null;this.isModified=true;this.asn1Array.push(c)};this.asn1Array=new Array();if(typeof b!="undefined"){if(typeof b.array!="undefined"){this.asn1Array=b.array}}};YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured,KJUR.asn1.ASN1Object);KJUR.asn1.DERBoolean=function(){KJUR.asn1.DERBoolean.superclass.constructor.call(this);this.hT="01";this.hTLV="0101ff"};YAHOO.lang.extend(KJUR.asn1.DERBoolean,KJUR.asn1.ASN1Object);KJUR.asn1.DERInteger=function(a){KJUR.asn1.DERInteger.superclass.constructor.call(this);this.hT="02";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a.bigint!="undefined"){this.setByBigInteger(a.bigint)}else{if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERInteger,KJUR.asn1.ASN1Object);KJUR.asn1.DERBitString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex="00"+a.getEncodedHex()}KJUR.asn1.DERBitString.superclass.constructor.call(this);this.hT="03";this.setHexValueIncludingUnusedBits=function(c){this.hTLV=null;this.isModified=true;this.hV=c};this.setUnusedBitsAndHexValue=function(c,e){if(c<0||7<c){throw"unused bits shall be from 0 to 7: u = "+c}var d="0"+c;this.hTLV=null;this.isModified=true;this.hV=d+e};this.setByBinaryString=function(e){e=e.replace(/0+$/,"");var f=8-e.length%8;if(f==8){f=0}for(var g=0;g<=f;g++){e+="0"}var j="";for(var g=0;g<e.length-1;g+=8){var d=e.substr(g,8);var c=parseInt(d,2).toString(16);if(c.length==1){c="0"+c}j+=c}this.hTLV=null;this.isModified=true;this.hV="0"+f+j};this.setByBooleanArray=function(e){var d="";for(var c=0;c<e.length;c++){if(e[c]==true){d+="1"}else{d+="0"}}this.setByBinaryString(d)};this.newFalseArray=function(e){var c=new Array(e);for(var d=0;d<e;d++){c[d]=false}return c};this.getFreshValueHex=function(){return this.hV};if(typeof b!="undefined"){if(typeof b=="string"&&b.toLowerCase().match(/^[0-9a-f]+$/)){this.setHexValueIncludingUnusedBits(b)}else{if(typeof b.hex!="undefined"){this.setHexValueIncludingUnusedBits(b.hex)}else{if(typeof b.bin!="undefined"){this.setByBinaryString(b.bin)}else{if(typeof b.array!="undefined"){this.setByBooleanArray(b.array)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERBitString,KJUR.asn1.ASN1Object);KJUR.asn1.DEROctetString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex=a.getEncodedHex()}KJUR.asn1.DEROctetString.superclass.constructor.call(this,b);this.hT="04"};YAHOO.lang.extend(KJUR.asn1.DEROctetString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNull=function(){KJUR.asn1.DERNull.superclass.constructor.call(this);this.hT="05";this.hTLV="0500"};YAHOO.lang.extend(KJUR.asn1.DERNull,KJUR.asn1.ASN1Object);KJUR.asn1.DERObjectIdentifier=function(c){var b=function(d){var e=d.toString(16);if(e.length==1){e="0"+e}return e};var a=function(k){var j="";var e=new BigInteger(k,10);var d=e.toString(2);var f=7-d.length%7;if(f==7){f=0}var m="";for(var g=0;g<f;g++){m+="0"}d=m+d;for(var g=0;g<d.length-1;g+=7){var l=d.substr(g,7);if(g!=d.length-7){l="1"+l}j+=b(parseInt(l,2))}return j};KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);this.hT="06";this.setValueHex=function(d){this.hTLV=null;this.isModified=true;this.s=null;this.hV=d};this.setValueOidString=function(f){if(!f.match(/^[0-9.]+$/)){throw"malformed oid string: "+f}var g="";var d=f.split(".");var j=parseInt(d[0])*40+parseInt(d[1]);g+=b(j);d.splice(0,2);for(var e=0;e<d.length;e++){g+=a(d[e])}this.hTLV=null;this.isModified=true;this.s=null;this.hV=g};this.setValueName=function(e){var d=KJUR.asn1.x509.OID.name2oid(e);if(d!==""){this.setValueOidString(d)}else{throw"DERObjectIdentifier oidName undefined: "+e}};this.getFreshValueHex=function(){return this.hV};if(c!==undefined){if(typeof c==="string"){if(c.match(/^[0-2].[0-9.]+$/)){this.setValueOidString(c)}else{this.setValueName(c)}}else{if(c.oid!==undefined){this.setValueOidString(c.oid)}else{if(c.hex!==undefined){this.setValueHex(c.hex)}else{if(c.name!==undefined){this.setValueName(c.name)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.DEREnumerated=function(a){KJUR.asn1.DEREnumerated.superclass.constructor.call(this);this.hT="0a";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}};YAHOO.lang.extend(KJUR.asn1.DEREnumerated,KJUR.asn1.ASN1Object);KJUR.asn1.DERUTF8String=function(a){KJUR.asn1.DERUTF8String.superclass.constructor.call(this,a);this.hT="0c"};YAHOO.lang.extend(KJUR.asn1.DERUTF8String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNumericString=function(a){KJUR.asn1.DERNumericString.superclass.constructor.call(this,a);this.hT="12"};YAHOO.lang.extend(KJUR.asn1.DERNumericString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERPrintableString=function(a){KJUR.asn1.DERPrintableString.superclass.constructor.call(this,a);this.hT="13"};YAHOO.lang.extend(KJUR.asn1.DERPrintableString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERTeletexString=function(a){KJUR.asn1.DERTeletexString.superclass.constructor.call(this,a);this.hT="14"};YAHOO.lang.extend(KJUR.asn1.DERTeletexString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERIA5String=function(a){KJUR.asn1.DERIA5String.superclass.constructor.call(this,a);this.hT="16"};YAHOO.lang.extend(KJUR.asn1.DERIA5String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERUTCTime=function(a){KJUR.asn1.DERUTCTime.superclass.constructor.call(this,a);this.hT="17";this.setByDate=function(b){this.hTLV=null;this.isModified=true;this.date=b;this.s=this.formatDate(this.date,"utc");this.hV=stohex(this.s)};this.getFreshValueHex=function(){if(typeof this.date=="undefined"&&typeof this.s=="undefined"){this.date=new Date();this.s=this.formatDate(this.date,"utc");this.hV=stohex(this.s)}return this.hV};if(a!==undefined){if(a.str!==undefined){this.setString(a.str)}else{if(typeof a=="string"&&a.match(/^[0-9]{12}Z$/)){this.setString(a)}else{if(a.hex!==undefined){this.setStringHex(a.hex)}else{if(a.date!==undefined){this.setByDate(a.date)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERUTCTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERGeneralizedTime=function(a){KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this,a);this.hT="18";this.withMillis=false;this.setByDate=function(b){this.hTLV=null;this.isModified=true;this.date=b;this.s=this.formatDate(this.date,"gen",this.withMillis);this.hV=stohex(this.s)};this.getFreshValueHex=function(){if(this.date===undefined&&this.s===undefined){this.date=new Date();this.s=this.formatDate(this.date,"gen",this.withMillis);this.hV=stohex(this.s)}return this.hV};if(a!==undefined){if(a.str!==undefined){this.setString(a.str)}else{if(typeof a=="string"&&a.match(/^[0-9]{14}Z$/)){this.setString(a)}else{if(a.hex!==undefined){this.setStringHex(a.hex)}else{if(a.date!==undefined){this.setByDate(a.date)}}}}if(a.millis===true){this.withMillis=true}}};YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERSequence=function(a){KJUR.asn1.DERSequence.superclass.constructor.call(this,a);this.hT="30";this.getFreshValueHex=function(){var c="";for(var b=0;b<this.asn1Array.length;b++){var d=this.asn1Array[b];c+=d.getEncodedHex()}this.hV=c;return this.hV}};YAHOO.lang.extend(KJUR.asn1.DERSequence,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERSet=function(a){KJUR.asn1.DERSet.superclass.constructor.call(this,a);this.hT="31";this.sortFlag=true;this.getFreshValueHex=function(){var b=new Array();for(var c=0;c<this.asn1Array.length;c++){var d=this.asn1Array[c];b.push(d.getEncodedHex())}if(this.sortFlag==true){b.sort()}this.hV=b.join("");return this.hV};if(typeof a!="undefined"){if(typeof a.sortflag!="undefined"&&a.sortflag==false){this.sortFlag=false}}};YAHOO.lang.extend(KJUR.asn1.DERSet,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERTaggedObject=function(a){KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);this.hT="a0";this.hV="";this.isExplicit=true;this.asn1Object=null;this.setASN1Object=function(b,c,d){this.hT=c;this.isExplicit=b;this.asn1Object=d;if(this.isExplicit){this.hV=this.asn1Object.getEncodedHex();this.hTLV=null;this.isModified=true}else{this.hV=null;this.hTLV=d.getEncodedHex();this.hTLV=this.hTLV.replace(/^../,c);this.isModified=false}};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a.tag!="undefined"){this.hT=a.tag}if(typeof a.explicit!="undefined"){this.isExplicit=a.explicit}if(typeof a.obj!="undefined"){this.asn1Object=a.obj;this.setASN1Object(this.isExplicit,this.hT,this.asn1Object)}}};YAHOO.lang.extend(KJUR.asn1.DERTaggedObject,KJUR.asn1.ASN1Object);
var ASN1HEX=new function(){};ASN1HEX.getLblen=function(c,a){if(c.substr(a+2,1)!="8"){return 1}var b=parseInt(c.substr(a+3,1));if(b==0){return -1}if(0<b&&b<10){return b+1}return -2};ASN1HEX.getL=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<1){return""}return c.substr(b+2,a*2)};ASN1HEX.getVblen=function(d,a){var c,b;c=ASN1HEX.getL(d,a);if(c==""){return -1}if(c.substr(0,1)==="8"){b=new BigInteger(c.substr(2),16)}else{b=new BigInteger(c,16)}return b.intValue()};ASN1HEX.getVidx=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<0){return a}return b+(a+1)*2};ASN1HEX.getV=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return d.substr(c,b*2)};ASN1HEX.getTLV=function(b,a){return b.substr(a,2)+ASN1HEX.getL(b,a)+ASN1HEX.getV(b,a)};ASN1HEX.getNextSiblingIdx=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return c+b*2};ASN1HEX.getChildIdx=function(e,f){var j=ASN1HEX;var g=new Array();var i=j.getVidx(e,f);if(e.substr(f,2)=="03"){g.push(i+2)}else{g.push(i)}var l=j.getVblen(e,f);var c=i;var d=0;while(1){var b=j.getNextSiblingIdx(e,c);if(b==null||(b-i>=(l*2))){break}if(d>=200){break}g.push(b);c=b;d++}return g};ASN1HEX.getNthChildIdx=function(d,b,e){var c=ASN1HEX.getChildIdx(d,b);return c[e]};ASN1HEX.getIdxbyList=function(e,d,c,i){var g=ASN1HEX;var f,b;if(c.length==0){if(i!==undefined){if(e.substr(d,2)!==i){throw"checking tag doesn't match: "+e.substr(d,2)+"!="+i}}return d}f=c.shift();b=g.getChildIdx(e,d);return g.getIdxbyList(e,b[f],c,i)};ASN1HEX.getTLVbyList=function(d,c,b,f){var e=ASN1HEX;var a=e.getIdxbyList(d,c,b);if(a===undefined){throw"can't find nthList object"}if(f!==undefined){if(d.substr(a,2)!=f){throw"checking tag doesn't match: "+d.substr(a,2)+"!="+f}}return e.getTLV(d,a)};ASN1HEX.getVbyList=function(e,c,b,g,i){var f=ASN1HEX;var a,d;a=f.getIdxbyList(e,c,b,g);if(a===undefined){throw"can't find nthList object"}d=f.getV(e,a);if(i===true){d=d.substr(2)}return d};ASN1HEX.hextooidstr=function(e){var h=function(b,a){if(b.length>=a){return b}return new Array(a-b.length+1).join("0")+b};var l=[];var o=e.substr(0,2);var f=parseInt(o,16);l[0]=new String(Math.floor(f/40));l[1]=new String(f%40);var m=e.substr(2);var k=[];for(var g=0;g<m.length/2;g++){k.push(parseInt(m.substr(g*2,2),16))}var j=[];var d="";for(var g=0;g<k.length;g++){if(k[g]&128){d=d+h((k[g]&127).toString(2),7)}else{d=d+h((k[g]&127).toString(2),7);j.push(new String(parseInt(d,2)));d=""}}var n=l.join(".");if(j.length>0){n=n+"."+j.join(".")}return n};ASN1HEX.dump=function(t,c,l,g){var p=ASN1HEX;var j=p.getV;var y=p.dump;var w=p.getChildIdx;var e=t;if(t instanceof KJUR.asn1.ASN1Object){e=t.getEncodedHex()}var q=function(A,i){if(A.length<=i*2){return A}else{var v=A.substr(0,i)+"..(total "+A.length/2+"bytes).."+A.substr(A.length-i,i);return v}};if(c===undefined){c={ommit_long_octet:32}}if(l===undefined){l=0}if(g===undefined){g=""}var x=c.ommit_long_octet;if(e.substr(l,2)=="01"){var h=j(e,l);if(h=="00"){return g+"BOOLEAN FALSE\n"}else{return g+"BOOLEAN TRUE\n"}}if(e.substr(l,2)=="02"){var h=j(e,l);return g+"INTEGER "+q(h,x)+"\n"}if(e.substr(l,2)=="03"){var h=j(e,l);return g+"BITSTRING "+q(h,x)+"\n"}if(e.substr(l,2)=="04"){var h=j(e,l);if(p.isASN1HEX(h)){var k=g+"OCTETSTRING, encapsulates\n";k=k+y(h,c,0,g+"  ");return k}else{return g+"OCTETSTRING "+q(h,x)+"\n"}}if(e.substr(l,2)=="05"){return g+"NULL\n"}if(e.substr(l,2)=="06"){var m=j(e,l);var a=KJUR.asn1.ASN1Util.oidHexToInt(m);var o=KJUR.asn1.x509.OID.oid2name(a);var b=a.replace(/\./g," ");if(o!=""){return g+"ObjectIdentifier "+o+" ("+b+")\n"}else{return g+"ObjectIdentifier ("+b+")\n"}}if(e.substr(l,2)=="0c"){return g+"UTF8String '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="13"){return g+"PrintableString '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="14"){return g+"TeletexString '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="16"){return g+"IA5String '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="17"){return g+"UTCTime "+hextoutf8(j(e,l))+"\n"}if(e.substr(l,2)=="18"){return g+"GeneralizedTime "+hextoutf8(j(e,l))+"\n"}if(e.substr(l,2)=="30"){if(e.substr(l,4)=="3000"){return g+"SEQUENCE {}\n"}var k=g+"SEQUENCE\n";var d=w(e,l);var f=c;if((d.length==2||d.length==3)&&e.substr(d[0],2)=="06"&&e.substr(d[d.length-1],2)=="04"){var o=p.oidname(j(e,d[0]));var r=JSON.parse(JSON.stringify(c));r.x509ExtName=o;f=r}for(var u=0;u<d.length;u++){k=k+y(e,f,d[u],g+"  ")}return k}if(e.substr(l,2)=="31"){var k=g+"SET\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}var z=parseInt(e.substr(l,2),16);if((z&128)!=0){var n=z&31;if((z&32)!=0){var k=g+"["+n+"]\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}else{var h=j(e,l);if(h.substr(0,8)=="68747470"){h=hextoutf8(h)}if(c.x509ExtName==="subjectAltName"&&n==2){h=hextoutf8(h)}var k=g+"["+n+"] "+h+"\n";return k}}return g+"UNKNOWN("+e.substr(l,2)+") "+j(e,l)+"\n"};ASN1HEX.isASN1HEX=function(e){var d=ASN1HEX;if(e.length%2==1){return false}var c=d.getVblen(e,0);var b=e.substr(0,2);var f=d.getL(e,0);var a=e.length-b.length-f.length;if(a==c*2){return true}return false};ASN1HEX.oidname=function(a){var c=KJUR.asn1;if(KJUR.lang.String.isHex(a)){a=c.ASN1Util.oidHexToInt(a)}var b=c.x509.OID.oid2name(a);if(b===""){b=a}return b};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.x509=="undefined"||!KJUR.asn1.x509){KJUR.asn1.x509={}}KJUR.asn1.x509.Certificate=function(e){KJUR.asn1.x509.Certificate.superclass.constructor.call(this);var a=null,j=null,h=null,k=null,i=null,b=KJUR,f=b.crypto,g=b.asn1,d=g.DERSequence,c=g.DERBitString;this.sign=function(){this.asn1SignatureAlg=this.asn1TBSCert.asn1SignatureAlg;var m=new KJUR.crypto.Signature({alg:this.asn1SignatureAlg.nameAlg});m.init(this.prvKey);m.updateHex(this.asn1TBSCert.getEncodedHex());this.hexSig=m.sign();this.asn1Sig=new c({hex:"00"+this.hexSig});var l=new d({array:[this.asn1TBSCert,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=l.getEncodedHex();this.isModified=false};this.setSignatureHex=function(l){this.asn1SignatureAlg=this.asn1TBSCert.asn1SignatureAlg;this.hexSig=l;this.asn1Sig=new c({hex:"00"+this.hexSig});var m=new d({array:[this.asn1TBSCert,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=m.getEncodedHex();this.isModified=false};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};this.getPEMString=function(){var l=hextob64nl(this.getEncodedHex());return"-----BEGIN CERTIFICATE-----\r\n"+l+"\r\n-----END CERTIFICATE-----\r\n"};if(e!==undefined){if(e.tbscertobj!==undefined){this.asn1TBSCert=e.tbscertobj}if(e.prvkeyobj!==undefined){this.prvKey=e.prvkeyobj}}};YAHOO.lang.extend(KJUR.asn1.x509.Certificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertificate=function(e){KJUR.asn1.x509.TBSCertificate.superclass.constructor.call(this);var b=KJUR,i=b.asn1,f=i.DERSequence,h=i.DERInteger,c=i.DERTaggedObject,d=i.x509,g=d.Time,a=d.X500Name,j=d.SubjectPublicKeyInfo;this._initialize=function(){this.asn1Array=new Array();this.asn1Version=new c({obj:new h({"int":2})});this.asn1SerialNumber=null;this.asn1SignatureAlg=null;this.asn1Issuer=null;this.asn1NotBefore=null;this.asn1NotAfter=null;this.asn1Subject=null;this.asn1SubjPKey=null;this.extensionsArray=new Array()};this.setSerialNumberByParam=function(k){this.asn1SerialNumber=new h(k)};this.setSignatureAlgByParam=function(k){this.asn1SignatureAlg=new d.AlgorithmIdentifier(k)};this.setIssuerByParam=function(k){this.asn1Issuer=new a(k)};this.setNotBeforeByParam=function(k){this.asn1NotBefore=new g(k)};this.setNotAfterByParam=function(k){this.asn1NotAfter=new g(k)};this.setSubjectByParam=function(k){this.asn1Subject=new a(k)};this.setSubjectPublicKey=function(k){this.asn1SubjPKey=new j(k)};this.setSubjectPublicKeyByGetKey=function(l){var k=KEYUTIL.getKey(l);this.asn1SubjPKey=new j(k)};this.appendExtension=function(k){this.extensionsArray.push(k)};this.appendExtensionByName=function(l,k){KJUR.asn1.x509.Extension.appendByNameToArray(l,k,this.extensionsArray)};this.getEncodedHex=function(){if(this.asn1NotBefore==null||this.asn1NotAfter==null){throw"notBefore and/or notAfter not set"}var l=new f({array:[this.asn1NotBefore,this.asn1NotAfter]});this.asn1Array=new Array();this.asn1Array.push(this.asn1Version);this.asn1Array.push(this.asn1SerialNumber);this.asn1Array.push(this.asn1SignatureAlg);this.asn1Array.push(this.asn1Issuer);this.asn1Array.push(l);this.asn1Array.push(this.asn1Subject);this.asn1Array.push(this.asn1SubjPKey);if(this.extensionsArray.length>0){var m=new f({array:this.extensionsArray});var k=new c({explicit:true,tag:"a3",obj:m});this.asn1Array.push(k)}var n=new f({array:this.asn1Array});this.hTLV=n.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize()};YAHOO.lang.extend(KJUR.asn1.x509.TBSCertificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extension=function(d){KJUR.asn1.x509.Extension.superclass.constructor.call(this);var f=null,a=KJUR,e=a.asn1,h=e.DERObjectIdentifier,i=e.DEROctetString,b=e.DERBitString,g=e.DERBoolean,c=e.DERSequence;this.getEncodedHex=function(){var m=new h({oid:this.oid});var l=new i({hex:this.getExtnValueHex()});var k=new Array();k.push(m);if(this.critical){k.push(new g())}k.push(l);var j=new c({array:k});return j.getEncodedHex()};this.critical=false;if(d!==undefined){if(d.critical!==undefined){this.critical=d.critical}}};YAHOO.lang.extend(KJUR.asn1.x509.Extension,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extension.appendByNameToArray=function(e,c,b){var g=e.toLowerCase(),f=KJUR.asn1.x509;if(g=="basicconstraints"){var d=new f.BasicConstraints(c);b.push(d)}else{if(g=="keyusage"){var d=new f.KeyUsage(c);b.push(d)}else{if(g=="crldistributionpoints"){var d=new f.CRLDistributionPoints(c);b.push(d)}else{if(g=="extkeyusage"){var d=new f.ExtKeyUsage(c);b.push(d)}else{if(g=="authoritykeyidentifier"){var d=new f.AuthorityKeyIdentifier(c);b.push(d)}else{if(g=="subjectkeyidentifier"){var d=new f.SubjectKeyIdentifier(c);b.push(d)}else{if(g=="authorityinfoaccess"){var d=new f.AuthorityInfoAccess(c);b.push(d)}else{if(g=="subjectaltname"){var d=new f.SubjectAltName(c);b.push(d)}else{if(g=="issueraltname"){var d=new f.IssuerAltName(c);b.push(d)}else{throw"unsupported extension name: "+e}}}}}}}}}};KJUR.asn1.x509.KeyUsage=function(f){KJUR.asn1.x509.KeyUsage.superclass.constructor.call(this,f);var a=X509.KEYUSAGE_NAME;this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.15";if(f!==undefined){if(f.bin!==undefined){this.asn1ExtnValue=new KJUR.asn1.DERBitString(f)}if(f.names!==undefined&&f.names.length!==undefined){var e=f.names;var d="000000000";for(var c=0;c<e.length;c++){for(var b=0;b<a.length;b++){if(e[c]===a[b]){d=d.substring(0,b)+"1"+d.substring(b+1,d.length)}}}this.asn1ExtnValue=new KJUR.asn1.DERBitString({bin:d})}}};YAHOO.lang.extend(KJUR.asn1.x509.KeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.BasicConstraints=function(c){KJUR.asn1.x509.BasicConstraints.superclass.constructor.call(this,c);var a=false;var b=-1;this.getExtnValueHex=function(){var e=new Array();if(this.cA){e.push(new KJUR.asn1.DERBoolean())}if(this.pathLen>-1){e.push(new KJUR.asn1.DERInteger({"int":this.pathLen}))}var d=new KJUR.asn1.DERSequence({array:e});this.asn1ExtnValue=d;return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.19";this.cA=false;this.pathLen=-1;if(c!==undefined){if(c.cA!==undefined){this.cA=c.cA}if(c.pathLen!==undefined){this.pathLen=c.pathLen}}};YAHOO.lang.extend(KJUR.asn1.x509.BasicConstraints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRLDistributionPoints=function(d){KJUR.asn1.x509.CRLDistributionPoints.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.x509;this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.setByDPArray=function(e){this.asn1ExtnValue=new a.DERSequence({array:e})};this.setByOneURI=function(h){var e=new c.GeneralNames([{uri:h}]);var g=new c.DistributionPointName(e);var f=new c.DistributionPoint({dpobj:g});this.setByDPArray([f])};this.oid="2.5.29.31";if(d!==undefined){if(d.array!==undefined){this.setByDPArray(d.array)}else{if(d.uri!==undefined){this.setByOneURI(d.uri)}}}};YAHOO.lang.extend(KJUR.asn1.x509.CRLDistributionPoints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.ExtKeyUsage=function(c){KJUR.asn1.x509.ExtKeyUsage.superclass.constructor.call(this,c);var b=KJUR,a=b.asn1;this.setPurposeArray=function(d){this.asn1ExtnValue=new a.DERSequence();for(var e=0;e<d.length;e++){var f=new a.DERObjectIdentifier(d[e]);this.asn1ExtnValue.appendASN1Object(f)}};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.37";if(c!==undefined){if(c.array!==undefined){this.setPurposeArray(c.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.ExtKeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityKeyIdentifier=function(d){KJUR.asn1.x509.AuthorityKeyIdentifier.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.DERTaggedObject;this.asn1KID=null;this.asn1CertIssuer=null;this.asn1CertSN=null;this.getExtnValueHex=function(){var f=new Array();if(this.asn1KID){f.push(new c({explicit:false,tag:"80",obj:this.asn1KID}))}if(this.asn1CertIssuer){f.push(new c({explicit:false,tag:"a1",obj:this.asn1CertIssuer}))}if(this.asn1CertSN){f.push(new c({explicit:false,tag:"82",obj:this.asn1CertSN}))}var e=new a.DERSequence({array:f});this.asn1ExtnValue=e;return this.asn1ExtnValue.getEncodedHex()};this.setKIDByParam=function(e){this.asn1KID=new KJUR.asn1.DEROctetString(e)};this.setCertIssuerByParam=function(e){this.asn1CertIssuer=new KJUR.asn1.x509.X500Name(e)};this.setCertSNByParam=function(e){this.asn1CertSN=new KJUR.asn1.DERInteger(e)};this.oid="2.5.29.35";if(d!==undefined){if(d.kid!==undefined){this.setKIDByParam(d.kid)}if(d.issuer!==undefined){this.setCertIssuerByParam(d.issuer)}if(d.sn!==undefined){this.setCertSNByParam(d.sn)}}};YAHOO.lang.extend(KJUR.asn1.x509.AuthorityKeyIdentifier,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectKeyIdentifier=function(d){KJUR.asn1.x509.SubjectKeyIdentifier.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.DEROctetString;this.asn1KID=null;this.getExtnValueHex=function(){this.asn1ExtnValue=this.asn1KID;return this.asn1ExtnValue.getEncodedHex()};this.setKIDByParam=function(e){this.asn1KID=new c(e)};this.oid="2.5.29.14";if(d!==undefined){if(d.kid!==undefined){this.setKIDByParam(d.kid)}}};YAHOO.lang.extend(KJUR.asn1.x509.SubjectKeyIdentifier,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityInfoAccess=function(a){KJUR.asn1.x509.AuthorityInfoAccess.superclass.constructor.call(this,a);this.setAccessDescriptionArray=function(k){var j=new Array(),b=KJUR,g=b.asn1,d=g.DERSequence;for(var f=0;f<k.length;f++){var c=new g.DERObjectIdentifier(k[f].accessMethod);var e=new g.x509.GeneralName(k[f].accessLocation);var h=new d({array:[c,e]});j.push(h)}this.asn1ExtnValue=new d({array:j})};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="1.3.6.1.5.5.7.1.1";if(a!==undefined){if(a.array!==undefined){this.setAccessDescriptionArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.AuthorityInfoAccess,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectAltName=function(a){KJUR.asn1.x509.SubjectAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.17";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.SubjectAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.IssuerAltName=function(a){KJUR.asn1.x509.IssuerAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.18";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.IssuerAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRL=function(f){KJUR.asn1.x509.CRL.superclass.constructor.call(this);var b=null,d=null,e=null,c=null,a=null;this.sign=function(){this.asn1SignatureAlg=this.asn1TBSCertList.asn1SignatureAlg;sig=new KJUR.crypto.Signature({alg:"SHA1withRSA",prov:"cryptojs/jsrsa"});sig.init(this.prvKey);sig.updateHex(this.asn1TBSCertList.getEncodedHex());this.hexSig=sig.sign();this.asn1Sig=new KJUR.asn1.DERBitString({hex:"00"+this.hexSig});var g=new KJUR.asn1.DERSequence({array:[this.asn1TBSCertList,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=g.getEncodedHex();this.isModified=false};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};this.getPEMString=function(){var g=hextob64nl(this.getEncodedHex());return"-----BEGIN X509 CRL-----\r\n"+g+"\r\n-----END X509 CRL-----\r\n"};if(f!==undefined){if(f.tbsobj!==undefined){this.asn1TBSCertList=f.tbsobj}if(f.prvkeyobj!==undefined){this.prvKey=f.prvkeyobj}}};YAHOO.lang.extend(KJUR.asn1.x509.CRL,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertList=function(g){KJUR.asn1.x509.TBSCertList.superclass.constructor.call(this);var e=null,d=KJUR,c=d.asn1,b=c.DERSequence,f=c.x509,a=f.Time;this.setSignatureAlgByParam=function(h){this.asn1SignatureAlg=new f.AlgorithmIdentifier(h)};this.setIssuerByParam=function(h){this.asn1Issuer=new f.X500Name(h)};this.setThisUpdateByParam=function(h){this.asn1ThisUpdate=new a(h)};this.setNextUpdateByParam=function(h){this.asn1NextUpdate=new a(h)};this.addRevokedCert=function(h,i){var k={};if(h!=undefined&&h!=null){k.sn=h}if(i!=undefined&&i!=null){k.time=i}var j=new f.CRLEntry(k);this.aRevokedCert.push(j)};this.getEncodedHex=function(){this.asn1Array=new Array();if(this.asn1Version!=null){this.asn1Array.push(this.asn1Version)}this.asn1Array.push(this.asn1SignatureAlg);this.asn1Array.push(this.asn1Issuer);this.asn1Array.push(this.asn1ThisUpdate);if(this.asn1NextUpdate!=null){this.asn1Array.push(this.asn1NextUpdate)}if(this.aRevokedCert.length>0){var h=new b({array:this.aRevokedCert});this.asn1Array.push(h)}var i=new b({array:this.asn1Array});this.hTLV=i.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize=function(){this.asn1Version=null;this.asn1SignatureAlg=null;this.asn1Issuer=null;this.asn1ThisUpdate=null;this.asn1NextUpdate=null;this.aRevokedCert=new Array()};this._initialize()};YAHOO.lang.extend(KJUR.asn1.x509.TBSCertList,KJUR.asn1.ASN1Object);KJUR.asn1.x509.CRLEntry=function(e){KJUR.asn1.x509.CRLEntry.superclass.constructor.call(this);var d=null,c=null,b=KJUR,a=b.asn1;this.setCertSerial=function(f){this.sn=new a.DERInteger(f)};this.setRevocationDate=function(f){this.time=new a.x509.Time(f)};this.getEncodedHex=function(){var f=new a.DERSequence({array:[this.sn,this.time]});this.TLV=f.getEncodedHex();return this.TLV};if(e!==undefined){if(e.time!==undefined){this.setRevocationDate(e.time)}if(e.sn!==undefined){this.setCertSerial(e.sn)}}};YAHOO.lang.extend(KJUR.asn1.x509.CRLEntry,KJUR.asn1.ASN1Object);KJUR.asn1.x509.X500Name=function(f){KJUR.asn1.x509.X500Name.superclass.constructor.call(this);this.asn1Array=new Array();var d=KJUR,c=d.asn1,e=c.x509,b=pemtohex;this.setByString=function(g){var k=g.split("/");k.shift();var j=[];for(var l=0;l<k.length;l++){if(k[l].match(/^[^=]+=.+$/)){j.push(k[l])}else{var h=j.length-1;j[h]=j[h]+"/"+k[l]}}for(var l=0;l<j.length;l++){this.asn1Array.push(new e.RDN({str:j[l]}))}};this.setByLdapString=function(g){var h=e.X500Name.ldapToOneline(g);this.setByString(h)};this.setByObject=function(i){for(var g in i){if(i.hasOwnProperty(g)){var h=new KJUR.asn1.x509.RDN({str:g+"="+i[g]});this.asn1Array?this.asn1Array.push(h):this.asn1Array=[h]}}};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var g=new c.DERSequence({array:this.asn1Array});this.hTLV=g.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.str!==undefined){this.setByString(f.str)}else{if(f.ldapstr!==undefined){this.setByLdapString(f.ldapstr)}else{if(typeof f==="object"){this.setByObject(f)}}}if(f.certissuer!==undefined){var a=new X509();a.hex=b(f.certissuer);this.hTLV=a.getIssuerHex()}if(f.certsubject!==undefined){var a=new X509();a.hex=b(f.certsubject);this.hTLV=a.getSubjectHex()}}};YAHOO.lang.extend(KJUR.asn1.x509.X500Name,KJUR.asn1.ASN1Object);KJUR.asn1.x509.X500Name.onelineToLDAP=function(d){if(d.substr(0,1)!=="/"){throw"malformed input"}var b="";d=d.substr(1);var c=d.split("/");c.reverse();c=c.map(function(a){return a.replace(/,/,"\\,")});return c.join(",")};KJUR.asn1.x509.X500Name.ldapToOneline=function(g){var c=g.split(",");var e=false;var b=[];for(var f=0;c.length>0;f++){var h=c.shift();if(e===true){var d=b.pop();var j=(d+","+h).replace(/\\,/g,",");b.push(j);e=false}else{b.push(h)}if(h.substr(-1,1)==="\\"){e=true}}b=b.map(function(a){return a.replace("/","\\/")});b.reverse();return"/"+b.join("/")};KJUR.asn1.x509.RDN=function(a){KJUR.asn1.x509.RDN.superclass.constructor.call(this);this.asn1Array=new Array();this.addByString=function(b){this.asn1Array.push(new KJUR.asn1.x509.AttributeTypeAndValue({str:b}))};this.addByMultiValuedString=function(d){var b=KJUR.asn1.x509.RDN.parseString(d);for(var c=0;c<b.length;c++){this.addByString(b[c])}};this.getEncodedHex=function(){var b=new KJUR.asn1.DERSet({array:this.asn1Array});this.TLV=b.getEncodedHex();return this.TLV};if(a!==undefined){if(a.str!==undefined){this.addByMultiValuedString(a.str)}}};YAHOO.lang.extend(KJUR.asn1.x509.RDN,KJUR.asn1.ASN1Object);KJUR.asn1.x509.RDN.parseString=function(m){var j=m.split(/\+/);var h=false;var c=[];for(var g=0;j.length>0;g++){var k=j.shift();if(h===true){var f=c.pop();var d=(f+"+"+k).replace(/\\\+/g,"+");c.push(d);h=false}else{c.push(k)}if(k.substr(-1,1)==="\\"){h=true}}var l=false;var b=[];for(var g=0;c.length>0;g++){var k=c.shift();if(l===true){var e=b.pop();if(k.match(/"$/)){var d=(e+"+"+k).replace(/^([^=]+)="(.*)"$/,"$1=$2");b.push(d);l=false}else{b.push(e+"+"+k)}}else{b.push(k)}if(k.match(/^[^=]+="/)){l=true}}return b};KJUR.asn1.x509.AttributeTypeAndValue=function(d){KJUR.asn1.x509.AttributeTypeAndValue.superclass.constructor.call(this);var f=null,e=null,a="utf8",c=KJUR,b=c.asn1;this.setByString=function(h){var g=h.match(/^([^=]+)=(.+)$/);if(g){this.setByAttrTypeAndValueStr(g[1],g[2])}else{throw"malformed attrTypeAndValueStr: "+h}};this.setByAttrTypeAndValueStr=function(i,h){this.typeObj=KJUR.asn1.x509.OID.atype2obj(i);var g=a;if(i=="C"){g="prn"}this.valueObj=this.getValueObj(g,h)};this.getValueObj=function(h,g){if(h=="utf8"){return new b.DERUTF8String({str:g})}if(h=="prn"){return new b.DERPrintableString({str:g})}if(h=="tel"){return new b.DERTeletexString({str:g})}if(h=="ia5"){return new b.DERIA5String({str:g})}throw"unsupported directory string type: type="+h+" value="+g};this.getEncodedHex=function(){var g=new b.DERSequence({array:[this.typeObj,this.valueObj]});this.TLV=g.getEncodedHex();return this.TLV};if(d!==undefined){if(d.str!==undefined){this.setByString(d.str)}}};YAHOO.lang.extend(KJUR.asn1.x509.AttributeTypeAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.x509.SubjectPublicKeyInfo=function(f){KJUR.asn1.x509.SubjectPublicKeyInfo.superclass.constructor.call(this);var l=null,k=null,a=KJUR,j=a.asn1,i=j.DERInteger,b=j.DERBitString,m=j.DERObjectIdentifier,e=j.DERSequence,h=j.ASN1Util.newObject,d=j.x509,o=d.AlgorithmIdentifier,g=a.crypto,n=g.ECDSA,c=g.DSA;this.getASN1Object=function(){if(this.asn1AlgId==null||this.asn1SubjPKey==null){throw"algId and/or subjPubKey not set"}var p=new e({array:[this.asn1AlgId,this.asn1SubjPKey]});return p};this.getEncodedHex=function(){var p=this.getASN1Object();this.hTLV=p.getEncodedHex();return this.hTLV};this.setPubKey=function(q){try{if(q instanceof RSAKey){var u=h({seq:[{"int":{bigint:q.n}},{"int":{"int":q.e}}]});var s=u.getEncodedHex();this.asn1AlgId=new o({name:"rsaEncryption"});this.asn1SubjPKey=new b({hex:"00"+s})}}catch(p){}try{if(q instanceof KJUR.crypto.ECDSA){var r=new m({name:q.curveName});this.asn1AlgId=new o({name:"ecPublicKey",asn1params:r});this.asn1SubjPKey=new b({hex:"00"+q.pubKeyHex})}}catch(p){}try{if(q instanceof KJUR.crypto.DSA){var r=new h({seq:[{"int":{bigint:q.p}},{"int":{bigint:q.q}},{"int":{bigint:q.g}}]});this.asn1AlgId=new o({name:"dsa",asn1params:r});var t=new i({bigint:q.y});this.asn1SubjPKey=new b({hex:"00"+t.getEncodedHex()})}}catch(p){}};if(f!==undefined){this.setPubKey(f)}};YAHOO.lang.extend(KJUR.asn1.x509.SubjectPublicKeyInfo,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Time=function(f){KJUR.asn1.x509.Time.superclass.constructor.call(this);var e=null,a=null,d=KJUR,c=d.asn1,b=c.DERUTCTime,g=c.DERGeneralizedTime;this.setTimeParams=function(h){this.timeParams=h};this.getEncodedHex=function(){var h=null;if(this.timeParams!=null){if(this.type=="utc"){h=new b(this.timeParams)}else{h=new g(this.timeParams)}}else{if(this.type=="utc"){h=new b()}else{h=new g()}}this.TLV=h.getEncodedHex();return this.TLV};this.type="utc";if(f!==undefined){if(f.type!==undefined){this.type=f.type}else{if(f.str!==undefined){if(f.str.match(/^[0-9]{12}Z$/)){this.type="utc"}if(f.str.match(/^[0-9]{14}Z$/)){this.type="gen"}}}this.timeParams=f}};YAHOO.lang.extend(KJUR.asn1.x509.Time,KJUR.asn1.ASN1Object);KJUR.asn1.x509.AlgorithmIdentifier=function(d){KJUR.asn1.x509.AlgorithmIdentifier.superclass.constructor.call(this);this.nameAlg=null;this.asn1Alg=null;this.asn1Params=null;this.paramEmpty=false;var b=KJUR,a=b.asn1;this.getEncodedHex=function(){if(this.nameAlg===null&&this.asn1Alg===null){throw"algorithm not specified"}if(this.nameAlg!==null&&this.asn1Alg===null){this.asn1Alg=a.x509.OID.name2obj(this.nameAlg)}var e=[this.asn1Alg];if(this.asn1Params!==null){e.push(this.asn1Params)}var f=new a.DERSequence({array:e});this.hTLV=f.getEncodedHex();return this.hTLV};if(d!==undefined){if(d.name!==undefined){this.nameAlg=d.name}if(d.asn1params!==undefined){this.asn1Params=d.asn1params}if(d.paramempty!==undefined){this.paramEmpty=d.paramempty}}if(this.asn1Params===null&&this.paramEmpty===false&&this.nameAlg!==null){var c=this.nameAlg.toLowerCase();if(c.substr(-7,7)!=="withdsa"&&c.substr(-9,9)!=="withecdsa"){this.asn1Params=new a.DERNull()}}};YAHOO.lang.extend(KJUR.asn1.x509.AlgorithmIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.x509.GeneralName=function(e){KJUR.asn1.x509.GeneralName.superclass.constructor.call(this);var m=null,i=null,k={rfc822:"81",dns:"82",dn:"a4",uri:"86",ip:"87"},b=KJUR,g=b.asn1,f=g.DERSequence,j=g.DEROctetString,d=g.DERIA5String,c=g.DERTaggedObject,l=g.ASN1Object,a=g.x509.X500Name,h=pemtohex;this.explicit=false;this.setByParam=function(p){var r=null;var u=null;if(p===undefined){return}if(p.rfc822!==undefined){this.type="rfc822";u=new d({str:p[this.type]})}if(p.dns!==undefined){this.type="dns";u=new d({str:p[this.type]})}if(p.uri!==undefined){this.type="uri";u=new d({str:p[this.type]})}if(p.dn!==undefined){this.type="dn";this.explicit=true;u=new a({str:p.dn})}if(p.ldapdn!==undefined){this.type="dn";this.explicit=true;u=new a({ldapstr:p.ldapdn})}if(p.certissuer!==undefined){this.type="dn";this.explicit=true;var o=p.certissuer;var w=null;if(o.match(/^[0-9A-Fa-f]+$/)){w==o}if(o.indexOf("-----BEGIN ")!=-1){w=h(o)}if(w==null){throw"certissuer param not cert"}var t=new X509();t.hex=w;var y=t.getIssuerHex();u=new l();u.hTLV=y}if(p.certsubj!==undefined){this.type="dn";this.explicit=true;var o=p.certsubj;var w=null;if(o.match(/^[0-9A-Fa-f]+$/)){w==o}if(o.indexOf("-----BEGIN ")!=-1){w=h(o)}if(w==null){throw"certsubj param not cert"}var t=new X509();t.hex=w;var y=t.getSubjectHex();u=new l();u.hTLV=y}if(p.ip!==undefined){this.type="ip";this.explicit=false;var q=p.ip;var s;var n="malformed IP address";if(q.match(/^[0-9.]+[.][0-9.]+$/)){s=intarystrtohex("["+q.split(".").join(",")+"]");if(s.length!==8){throw n}}else{if(q.match(/^[0-9A-Fa-f:]+:[0-9A-Fa-f:]+$/)){s=ipv6tohex(q)}else{if(q.match(/^([0-9A-Fa-f][0-9A-Fa-f]){1,}$/)){s=q}else{throw n}}}u=new j({hex:s})}if(this.type==null){throw"unsupported type in params="+p}this.asn1Obj=new c({explicit:this.explicit,tag:k[this.type],obj:u})};this.getEncodedHex=function(){return this.asn1Obj.getEncodedHex()};if(e!==undefined){this.setByParam(e)}};YAHOO.lang.extend(KJUR.asn1.x509.GeneralName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.GeneralNames=function(d){KJUR.asn1.x509.GeneralNames.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1;this.setByParamArray=function(g){for(var e=0;e<g.length;e++){var f=new b.x509.GeneralName(g[e]);this.asn1Array.push(f)}};this.getEncodedHex=function(){var e=new b.DERSequence({array:this.asn1Array});return e.getEncodedHex()};this.asn1Array=new Array();if(typeof d!="undefined"){this.setByParamArray(d)}};YAHOO.lang.extend(KJUR.asn1.x509.GeneralNames,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DistributionPointName=function(b){KJUR.asn1.x509.DistributionPointName.superclass.constructor.call(this);var h=null,e=null,a=null,g=null,d=KJUR,c=d.asn1,f=c.DERTaggedObject;this.getEncodedHex=function(){if(this.type!="full"){throw"currently type shall be 'full': "+this.type}this.asn1Obj=new f({explicit:false,tag:this.tag,obj:this.asn1V});this.hTLV=this.asn1Obj.getEncodedHex();return this.hTLV};if(b!==undefined){if(c.x509.GeneralNames.prototype.isPrototypeOf(b)){this.type="full";this.tag="a0";this.asn1V=b}else{throw"This class supports GeneralNames only as argument"}}};YAHOO.lang.extend(KJUR.asn1.x509.DistributionPointName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DistributionPoint=function(d){KJUR.asn1.x509.DistributionPoint.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1;this.getEncodedHex=function(){var e=new b.DERSequence();if(this.asn1DP!=null){var f=new b.DERTaggedObject({explicit:true,tag:"a0",obj:this.asn1DP});e.appendASN1Object(f)}this.hTLV=e.getEncodedHex();return this.hTLV};if(d!==undefined){if(d.dpobj!==undefined){this.asn1DP=d.dpobj}}};YAHOO.lang.extend(KJUR.asn1.x509.DistributionPoint,KJUR.asn1.ASN1Object);KJUR.asn1.x509.OID=new function(a){this.atype2oidList={CN:"2.5.4.3",L:"2.5.4.7",ST:"2.5.4.8",O:"2.5.4.10",OU:"2.5.4.11",C:"2.5.4.6",STREET:"2.5.4.9",DC:"0.9.2342.19200300.100.1.25",UID:"0.9.2342.19200300.100.1.1",SN:"2.5.4.4",T:"2.5.4.12",DN:"2.5.4.49",E:"1.2.840.113549.1.9.1",description:"2.5.4.13",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",serialNumber:"2.5.4.5",uniqueIdentifier:"2.5.4.45",organizationIdentifier:"2.5.4.97",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3"};this.name2oidList={sha1:"1.3.14.3.2.26",sha256:"2.16.840.1.101.3.4.2.1",sha384:"2.16.840.1.101.3.4.2.2",sha512:"2.16.840.1.101.3.4.2.3",sha224:"2.16.840.1.101.3.4.2.4",md5:"1.2.840.113549.2.5",md2:"1.3.14.7.2.2.1",ripemd160:"1.3.36.3.2.1",MD2withRSA:"1.2.840.113549.1.1.2",MD4withRSA:"1.2.840.113549.1.1.3",MD5withRSA:"1.2.840.113549.1.1.4",SHA1withRSA:"1.2.840.113549.1.1.5",SHA224withRSA:"1.2.840.113549.1.1.14",SHA256withRSA:"1.2.840.113549.1.1.11",SHA384withRSA:"1.2.840.113549.1.1.12",SHA512withRSA:"1.2.840.113549.1.1.13",SHA1withECDSA:"1.2.840.10045.4.1",SHA224withECDSA:"1.2.840.10045.4.3.1",SHA256withECDSA:"1.2.840.10045.4.3.2",SHA384withECDSA:"1.2.840.10045.4.3.3",SHA512withECDSA:"1.2.840.10045.4.3.4",dsa:"1.2.840.10040.4.1",SHA1withDSA:"1.2.840.10040.4.3",SHA224withDSA:"2.16.840.1.101.3.4.3.1",SHA256withDSA:"2.16.840.1.101.3.4.3.2",rsaEncryption:"1.2.840.113549.1.1.1",commonName:"2.5.4.3",countryName:"2.5.4.6",localityName:"2.5.4.7",stateOrProvinceName:"2.5.4.8",streetAddress:"2.5.4.9",organizationName:"2.5.4.10",organizationalUnitName:"2.5.4.11",domainComponent:"0.9.2342.19200300.100.1.25",userId:"0.9.2342.19200300.100.1.1",surname:"2.5.4.4",title:"2.5.4.12",distinguishedName:"2.5.4.49",emailAddress:"1.2.840.113549.1.9.1",description:"2.5.4.13",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",uniqueIdentifier:"2.5.4.45",organizationIdentifier:"2.5.4.97",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3",subjectKeyIdentifier:"2.5.29.14",keyUsage:"2.5.29.15",subjectAltName:"2.5.29.17",issuerAltName:"2.5.29.18",basicConstraints:"2.5.29.19",nameConstraints:"2.5.29.30",cRLDistributionPoints:"2.5.29.31",certificatePolicies:"2.5.29.32",authorityKeyIdentifier:"2.5.29.35",policyConstraints:"2.5.29.36",extKeyUsage:"2.5.29.37",authorityInfoAccess:"1.3.6.1.5.5.7.1.1",ocsp:"1.3.6.1.5.5.7.48.1",caIssuers:"1.3.6.1.5.5.7.48.2",anyExtendedKeyUsage:"2.5.29.37.0",serverAuth:"1.3.6.1.5.5.7.3.1",clientAuth:"1.3.6.1.5.5.7.3.2",codeSigning:"1.3.6.1.5.5.7.3.3",emailProtection:"1.3.6.1.5.5.7.3.4",timeStamping:"1.3.6.1.5.5.7.3.8",ocspSigning:"1.3.6.1.5.5.7.3.9",ecPublicKey:"1.2.840.10045.2.1",secp256r1:"1.2.840.10045.3.1.7",secp256k1:"1.3.132.0.10",secp384r1:"1.3.132.0.34",pkcs5PBES2:"1.2.840.113549.1.5.13",pkcs5PBKDF2:"1.2.840.113549.1.5.12","des-EDE3-CBC":"1.2.840.113549.3.7",data:"1.2.840.113549.1.7.1","signed-data":"1.2.840.113549.1.7.2","enveloped-data":"1.2.840.113549.1.7.3","digested-data":"1.2.840.113549.1.7.5","encrypted-data":"1.2.840.113549.1.7.6","authenticated-data":"1.2.840.113549.1.9.16.1.2",tstinfo:"1.2.840.113549.1.9.16.1.4",extensionRequest:"1.2.840.113549.1.9.14",};this.objCache={};this.name2obj=function(b){if(typeof this.objCache[b]!="undefined"){return this.objCache[b]}if(typeof this.name2oidList[b]=="undefined"){throw"Name of ObjectIdentifier not defined: "+b}var c=this.name2oidList[b];var d=new KJUR.asn1.DERObjectIdentifier({oid:c});this.objCache[b]=d;return d};this.atype2obj=function(b){if(typeof this.objCache[b]!="undefined"){return this.objCache[b]}if(typeof this.atype2oidList[b]=="undefined"){throw"AttributeType name undefined: "+b}var c=this.atype2oidList[b];var d=new KJUR.asn1.DERObjectIdentifier({oid:c});this.objCache[b]=d;return d}};KJUR.asn1.x509.OID.oid2name=function(b){var c=KJUR.asn1.x509.OID.name2oidList;for(var a in c){if(c[a]==b){return a}}return""};KJUR.asn1.x509.OID.oid2atype=function(b){var c=KJUR.asn1.x509.OID.atype2oidList;for(var a in c){if(c[a]==b){return a}}return b};KJUR.asn1.x509.OID.name2oid=function(a){var b=KJUR.asn1.x509.OID.name2oidList;if(b[a]===undefined){return""}return b[a]};KJUR.asn1.x509.X509Util={};KJUR.asn1.x509.X509Util.newCertPEM=function(h){var g=KJUR.asn1.x509,b=g.TBSCertificate,a=g.Certificate;var f=new b();if(h.serial!==undefined){f.setSerialNumberByParam(h.serial)}else{throw"serial number undefined."}if(typeof h.sigalg.name==="string"){f.setSignatureAlgByParam(h.sigalg)}else{throw"unproper signature algorithm name"}if(h.issuer!==undefined){f.setIssuerByParam(h.issuer)}else{throw"issuer name undefined."}if(h.notbefore!==undefined){f.setNotBeforeByParam(h.notbefore)}else{throw"notbefore undefined."}if(h.notafter!==undefined){f.setNotAfterByParam(h.notafter)}else{throw"notafter undefined."}if(h.subject!==undefined){f.setSubjectByParam(h.subject)}else{throw"subject name undefined."}if(h.sbjpubkey!==undefined){f.setSubjectPublicKeyByGetKey(h.sbjpubkey)}else{throw"subject public key undefined."}if(h.ext!==undefined&&h.ext.length!==undefined){for(var d=0;d<h.ext.length;d++){for(key in h.ext[d]){f.appendExtensionByName(key,h.ext[d][key])}}}if(h.cakey===undefined&&h.sighex===undefined){throw"param cakey and sighex undefined."}var e=null;var c=null;if(h.cakey){if(h.cakey.isPrivate===true){e=h.cakey}else{e=KEYUTIL.getKey.apply(null,h.cakey)}c=new a({tbscertobj:f,prvkeyobj:e});c.sign()}if(h.sighex){c=new a({tbscertobj:f});c.setSignatureHex(h.sighex)}return c.getPEMString()};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cms=="undefined"||!KJUR.asn1.cms){KJUR.asn1.cms={}}KJUR.asn1.cms.Attribute=function(d){var a=[],c=KJUR,b=c.asn1;b.cms.Attribute.superclass.constructor.call(this);this.getEncodedHex=function(){var h,g,e;h=new b.DERObjectIdentifier({oid:this.attrTypeOid});g=new b.DERSet({array:this.valueList});try{g.getEncodedHex()}catch(f){throw"fail valueSet.getEncodedHex in Attribute(1)/"+f}e=new b.DERSequence({array:[h,g]});try{this.hTLV=e.getEncodedHex()}catch(f){throw"failed seq.getEncodedHex in Attribute(2)/"+f}return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.Attribute,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentType=function(d){var c=KJUR,b=c.asn1;b.cms.ContentType.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.3";var a=null;if(typeof d!="undefined"){var a=new b.DERObjectIdentifier(d);this.valueList=[a]}};YAHOO.lang.extend(KJUR.asn1.cms.ContentType,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.MessageDigest=function(d){var b=KJUR,e=b.asn1,g=e.DEROctetString,i=e.cms;i.MessageDigest.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.4";if(d!==undefined){if(d.eciObj instanceof i.EncapsulatedContentInfo&&typeof d.hashAlg==="string"){var h=d.eciObj.eContentValueHex;var c=d.hashAlg;var a=b.crypto.Util.hashHex(h,c);var f=new g({hex:a});f.getEncodedHex();this.valueList=[f]}else{var f=new g(d);f.getEncodedHex();this.valueList=[f]}}};YAHOO.lang.extend(KJUR.asn1.cms.MessageDigest,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningTime=function(e){var d=KJUR,c=d.asn1;c.cms.SigningTime.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.5";if(e!==undefined){var a=new c.x509.Time(e);try{a.getEncodedHex()}catch(b){throw"SigningTime.getEncodedHex() failed/"+b}this.valueList=[a]}};YAHOO.lang.extend(KJUR.asn1.cms.SigningTime,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningCertificate=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,e=b.cms,d=c.crypto;e.SigningCertificate.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.12";this.setCerts=function(n){var l=[];for(var k=0;k<n.length;k++){var h=pemtohex(n[k]);var g=c.crypto.Util.hashHex(h,"sha1");var o=new b.DEROctetString({hex:g});o.getEncodedHex();var m=new e.IssuerAndSerialNumber({cert:n[k]});m.getEncodedHex();var p=new a({array:[o,m]});p.getEncodedHex();l.push(p)}var j=new a({array:l});j.getEncodedHex();this.valueList=[j]};if(f!==undefined){if(typeof f.array=="object"){this.setCerts(f.array)}}};YAHOO.lang.extend(KJUR.asn1.cms.SigningCertificate,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningCertificateV2=function(h){var d=KJUR,c=d.asn1,b=c.DERSequence,g=c.x509,f=c.cms,e=d.crypto;f.SigningCertificateV2.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.47";this.setCerts=function(r,k){var p=[];for(var n=0;n<r.length;n++){var l=pemtohex(r[n]);var t=[];if(k!=="sha256"){t.push(new g.AlgorithmIdentifier({name:k}))}var j=e.Util.hashHex(l,k);var s=new c.DEROctetString({hex:j});s.getEncodedHex();t.push(s);var o=new f.IssuerAndSerialNumber({cert:r[n]});o.getEncodedHex();t.push(o);var q=new b({array:t});q.getEncodedHex();p.push(q)}var m=new b({array:p});m.getEncodedHex();this.valueList=[m]};if(h!==undefined){if(typeof h.array=="object"){var a="sha256";if(typeof h.hashAlg=="string"){a=h.hashAlg}this.setCerts(h.array,a)}}};YAHOO.lang.extend(KJUR.asn1.cms.SigningCertificateV2,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.IssuerAndSerialNumber=function(e){var b=KJUR,g=b.asn1,f=g.DERInteger,i=g.cms,d=g.x509,a=d.X500Name,c=X509;i.IssuerAndSerialNumber.superclass.constructor.call(this);var j=null;var h=null;this.setByCertPEM=function(n){var l=pemtohex(n);var k=new c();k.hex=l;var o=k.getIssuerHex();this.dIssuer=new a();this.dIssuer.hTLV=o;var m=k.getSerialNumberHex();this.dSerial=new f({hex:m})};this.getEncodedHex=function(){var k=new g.DERSequence({array:[this.dIssuer,this.dSerial]});this.hTLV=k.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e=="string"&&e.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(e)}if(e.issuer&&e.serial){if(e.issuer instanceof a){this.dIssuer=e.issuer}else{this.dIssuer=new a(e.issuer)}if(e.serial instanceof f){this.dSerial=e.serial}else{this.dSerial=new f(e.serial)}}if(typeof e.cert=="string"){this.setByCertPEM(e.cert)}}};YAHOO.lang.extend(KJUR.asn1.cms.IssuerAndSerialNumber,KJUR.asn1.ASN1Object);KJUR.asn1.cms.AttributeList=function(d){var b=KJUR,a=b.asn1,c=a.cms;c.AttributeList.superclass.constructor.call(this);this.list=new Array();this.sortFlag=true;this.add=function(e){if(e instanceof c.Attribute){this.list.push(e)}};this.length=function(){return this.list.length};this.clear=function(){this.list=new Array();this.hTLV=null;this.hV=null};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var e=new a.DERSet({array:this.list,sortflag:this.sortFlag});this.hTLV=e.getEncodedHex();return this.hTLV};if(d!==undefined){if(typeof d.sortflag!="undefined"&&d.sortflag==false){this.sortFlag=false}}};YAHOO.lang.extend(KJUR.asn1.cms.AttributeList,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignerInfo=function(e){var a=KJUR,h=a.asn1,b=h.DERTaggedObject,n=h.cms,j=n.AttributeList,g=n.ContentType,k=n.EncapsulatedContentInfo,c=n.MessageDigest,l=n.SignedData,d=h.x509,m=d.AlgorithmIdentifier,f=a.crypto,i=KEYUTIL;n.SignerInfo.superclass.constructor.call(this);this.dCMSVersion=new h.DERInteger({"int":1});this.dSignerIdentifier=null;this.dDigestAlgorithm=null;this.dSignedAttrs=new j();this.dSigAlg=null;this.dSig=null;this.dUnsignedAttrs=new j();this.setSignerIdentifier=function(p){if(typeof p=="string"&&p.indexOf("CERTIFICATE")!=-1&&p.indexOf("BEGIN")!=-1&&p.indexOf("END")!=-1){var o=p;this.dSignerIdentifier=new n.IssuerAndSerialNumber({cert:p})}};this.setForContentAndHash=function(o){if(o!==undefined){if(o.eciObj instanceof k){this.dSignedAttrs.add(new g({oid:"1.2.840.113549.1.7.1"}));this.dSignedAttrs.add(new c({eciObj:o.eciObj,hashAlg:o.hashAlg}))}if(o.sdObj!==undefined&&o.sdObj instanceof l){if(o.sdObj.digestAlgNameList.join(":").indexOf(o.hashAlg)==-1){o.sdObj.digestAlgNameList.push(o.hashAlg)}}if(typeof o.hashAlg=="string"){this.dDigestAlgorithm=new m({name:o.hashAlg})}}};this.sign=function(t,p){this.dSigAlg=new m({name:p});var q=this.dSignedAttrs.getEncodedHex();var o=i.getKey(t);var s=new f.Signature({alg:p});s.init(o);s.updateHex(q);var r=s.sign();this.dSig=new h.DEROctetString({hex:r})};this.addUnsigned=function(o){this.hTLV=null;this.dUnsignedAttrs.hTLV=null;this.dUnsignedAttrs.add(o)};this.getEncodedHex=function(){if(this.dSignedAttrs instanceof j&&this.dSignedAttrs.length()==0){throw"SignedAttrs length = 0 (empty)"}var o=new b({obj:this.dSignedAttrs,tag:"a0",explicit:false});var r=null;if(this.dUnsignedAttrs.length()>0){r=new b({obj:this.dUnsignedAttrs,tag:"a1",explicit:false})}var q=[this.dCMSVersion,this.dSignerIdentifier,this.dDigestAlgorithm,o,this.dSigAlg,this.dSig,];if(r!=null){q.push(r)}var p=new h.DERSequence({array:q});this.hTLV=p.getEncodedHex();return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.SignerInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.EncapsulatedContentInfo=function(g){var c=KJUR,b=c.asn1,e=b.DERTaggedObject,a=b.DERSequence,h=b.DERObjectIdentifier,d=b.DEROctetString,f=b.cms;f.EncapsulatedContentInfo.superclass.constructor.call(this);this.dEContentType=new h({name:"data"});this.dEContent=null;this.isDetached=false;this.eContentValueHex=null;this.setContentType=function(i){if(i.match(/^[0-2][.][0-9.]+$/)){this.dEContentType=new h({oid:i})}else{this.dEContentType=new h({name:i})}};this.setContentValue=function(i){if(i!==undefined){if(typeof i.hex=="string"){this.eContentValueHex=i.hex}else{if(typeof i.str=="string"){this.eContentValueHex=utf8tohex(i.str)}}}};this.setContentValueHex=function(i){this.eContentValueHex=i};this.setContentValueStr=function(i){this.eContentValueHex=utf8tohex(i)};this.getEncodedHex=function(){if(typeof this.eContentValueHex!="string"){throw"eContentValue not yet set"}var k=new d({hex:this.eContentValueHex});this.dEContent=new e({obj:k,tag:"a0",explicit:true});var i=[this.dEContentType];if(!this.isDetached){i.push(this.dEContent)}var j=new a({array:i});this.hTLV=j.getEncodedHex();return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.EncapsulatedContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentInfo=function(f){var c=KJUR,b=c.asn1,d=b.DERTaggedObject,a=b.DERSequence,e=b.x509;KJUR.asn1.cms.ContentInfo.superclass.constructor.call(this);this.dContentType=null;this.dContent=null;this.setContentType=function(g){if(typeof g=="string"){this.dContentType=e.OID.name2obj(g)}};this.getEncodedHex=function(){var h=new d({obj:this.dContent,tag:"a0",explicit:true});var g=new a({array:[this.dContentType,h]});this.hTLV=g.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.type){this.setContentType(f.type)}if(f.obj&&f.obj instanceof b.ASN1Object){this.dContent=f.obj}}};YAHOO.lang.extend(KJUR.asn1.cms.ContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignedData=function(e){var a=KJUR,h=a.asn1,j=h.ASN1Object,g=h.DERInteger,m=h.DERSet,f=h.DERSequence,b=h.DERTaggedObject,l=h.cms,i=l.EncapsulatedContentInfo,d=l.SignerInfo,n=l.ContentInfo,c=h.x509,k=c.AlgorithmIdentifier;KJUR.asn1.cms.SignedData.superclass.constructor.call(this);this.dCMSVersion=new g({"int":1});this.dDigestAlgs=null;this.digestAlgNameList=[];this.dEncapContentInfo=new i();this.dCerts=null;this.certificateList=[];this.crlList=[];this.signerInfoList=[new d()];this.addCertificatesByPEM=function(p){var q=pemtohex(p);var r=new j();r.hTLV=q;this.certificateList.push(r)};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}if(this.dDigestAlgs==null){var u=[];for(var t=0;t<this.digestAlgNameList.length;t++){var s=this.digestAlgNameList[t];var w=new k({name:s});u.push(w)}this.dDigestAlgs=new m({array:u})}var p=[this.dCMSVersion,this.dDigestAlgs,this.dEncapContentInfo];if(this.dCerts==null){if(this.certificateList.length>0){var v=new m({array:this.certificateList});this.dCerts=new b({obj:v,tag:"a0",explicit:false})}}if(this.dCerts!=null){p.push(this.dCerts)}var r=new m({array:this.signerInfoList});p.push(r);var q=new f({array:p});this.hTLV=q.getEncodedHex();return this.hTLV};this.getContentInfo=function(){this.getEncodedHex();var o=new n({type:"signed-data",obj:this});return o};this.getContentInfoEncodedHex=function(){var o=this.getContentInfo();var p=o.getEncodedHex();return p};this.getPEM=function(){return hextopem(this.getContentInfoEncodedHex(),"CMS")}};YAHOO.lang.extend(KJUR.asn1.cms.SignedData,KJUR.asn1.ASN1Object);KJUR.asn1.cms.CMSUtil=new function(){};KJUR.asn1.cms.CMSUtil.newSignedData=function(d){var b=KJUR,j=b.asn1,q=j.cms,f=q.SignerInfo,n=q.SignedData,o=q.SigningTime,a=q.SigningCertificate,p=q.SigningCertificateV2,c=j.cades,e=c.SignaturePolicyIdentifier;var m=new n();m.dEncapContentInfo.setContentValue(d.content);if(typeof d.certs=="object"){for(var h=0;h<d.certs.length;h++){m.addCertificatesByPEM(d.certs[h])}}m.signerInfoList=[];for(var h=0;h<d.signerInfos.length;h++){var k=d.signerInfos[h];var g=new f();g.setSignerIdentifier(k.signerCert);g.setForContentAndHash({sdObj:m,eciObj:m.dEncapContentInfo,hashAlg:k.hashAlg});for(attrName in k.sAttr){var r=k.sAttr[attrName];if(attrName=="SigningTime"){var l=new o(r);g.dSignedAttrs.add(l)}if(attrName=="SigningCertificate"){var l=new a(r);g.dSignedAttrs.add(l)}if(attrName=="SigningCertificateV2"){var l=new p(r);g.dSignedAttrs.add(l)}if(attrName=="SignaturePolicyIdentifier"){var l=new e(r);g.dSignedAttrs.add(l)}}g.sign(k.signerPrvKey,k.sigAlg);m.signerInfoList.push(g)}return m};KJUR.asn1.cms.CMSUtil.verifySignedData=function(n){var C=KJUR,p=C.asn1,s=p.cms,D=s.SignerInfo,q=s.SignedData,y=s.SigningTime,b=s.SigningCertificate,d=s.SigningCertificateV2,A=p.cades,u=A.SignaturePolicyIdentifier,i=C.lang.String.isHex,v=ASN1HEX,h=v.getVbyList,a=v.getTLVbyList,t=v.getIdxbyList,z=v.getChildIdx,c=v.getTLV,B=v.oidname,j=C.crypto.Util.hashHex;if(n.cms===undefined&&!i(n.cms)){}var E=n.cms;var g=function(J,H){var G;for(var I=3;I<6;I++){G=t(J,0,[1,0,I]);if(G!==undefined){var F=J.substr(G,2);if(F==="a0"){H.certsIdx=G}if(F==="a1"){H.revinfosIdx=G}if(F==="31"){H.signerinfosIdx=G}}}};var l=function(I,F){var H=F.signerinfosIdx;if(H===undefined){return}var L=z(I,H);F.signerInfoIdxList=L;for(var G=0;G<L.length;G++){var K=L[G];var J={idx:K};k(I,J);F.signerInfos.push(J)}};var k=function(I,J){var F=J.idx;J.signerid_issuer1=a(I,F,[1,0],"30");J.signerid_serial1=h(I,F,[1,1],"02");J.hashalg=B(h(I,F,[2,0],"06"));var H=t(I,F,[3],"a0");J.idxSignedAttrs=H;f(I,J,H);var G=z(I,F);var K=G.length;if(K<6){throw"malformed SignerInfo"}J.sigalg=B(h(I,F,[K-2,0],"06"));J.sigval=h(I,F,[K-1],"04")};var f=function(L,M,F){var J=z(L,F);M.signedAttrIdxList=J;for(var K=0;K<J.length;K++){var I=J[K];var G=h(L,I,[0],"06");var H;if(G==="2a864886f70d010905"){H=hextoutf8(h(L,I,[1,0]));M.saSigningTime=H}else{if(G==="2a864886f70d010904"){H=h(L,I,[1,0],"04");M.saMessageDigest=H}}}};var w=function(G,F){if(h(G,0,[0],"06")!=="2a864886f70d010702"){return F}F.cmsType="signedData";F.econtent=h(G,0,[1,0,2,1,0]);g(G,F);F.signerInfos=[];l(G,F)};var o=function(J,F){var G=F.parse.signerInfos;var L=G.length;var K=true;for(var I=0;I<L;I++){var H=G[I];e(J,F,H,I);if(!H.isValid){K=false}}F.isValid=K};var x=function(F,Q,J,P){var N=Q.parse.certsIdx;var H;if(Q.certs===undefined){H=[];Q.certkeys=[];var K=z(F,N);for(var I=0;I<K.length;I++){var M=c(F,K[I]);var O=new X509();O.readCertHex(M);H[I]=O;Q.certkeys[I]=O.getPublicKey()}Q.certs=H}else{H=Q.certs}Q.cccc=H.length;Q.cccci=K.length;for(var I=0;I<H.length;I++){var L=O.getIssuerHex();var G=O.getSerialNumberHex();if(J.signerid_issuer1===L&&J.signerid_serial1===G){J.certkey_idx=I}}};var e=function(F,R,I,N){I.verifyDetail={};var Q=I.verifyDetail;var K=R.parse.econtent;var G=I.hashalg;var L=I.saMessageDigest;Q.validMessageDigest=false;if(j(K,G)===L){Q.validMessageDigest=true}x(F,R,I,N);Q.validSignatureValue=false;var H=I.sigalg;var M="31"+c(F,I.idxSignedAttrs).substr(2);I.signedattrshex=M;var J=R.certs[I.certkey_idx].getPublicKey();var P=new KJUR.crypto.Signature({alg:H});P.init(J);P.updateHex(M);var O=P.verify(I.sigval);Q.validSignatureValue_isValid=O;if(O===true){Q.validSignatureValue=true}I.isValid=false;if(Q.validMessageDigest&&Q.validSignatureValue){I.isValid=true}};var m=function(){};var r={isValid:false,parse:{}};w(E,r.parse);o(E,r);return r};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.tsp=="undefined"||!KJUR.asn1.tsp){KJUR.asn1.tsp={}}KJUR.asn1.tsp.Accuracy=function(f){var c=KJUR,b=c.asn1,e=b.DERInteger,a=b.DERSequence,d=b.DERTaggedObject;b.tsp.Accuracy.superclass.constructor.call(this);this.seconds=null;this.millis=null;this.micros=null;this.getEncodedHex=function(){var i=null;var k=null;var m=null;var g=[];if(this.seconds!=null){i=new e({"int":this.seconds});g.push(i)}if(this.millis!=null){var l=new e({"int":this.millis});k=new d({obj:l,tag:"80",explicit:false});g.push(k)}if(this.micros!=null){var j=new e({"int":this.micros});m=new d({obj:j,tag:"81",explicit:false});g.push(m)}var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(typeof f.seconds=="number"){this.seconds=f.seconds}if(typeof f.millis=="number"){this.millis=f.millis}if(typeof f.micros=="number"){this.micros=f.micros}}};YAHOO.lang.extend(KJUR.asn1.tsp.Accuracy,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.MessageImprint=function(g){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.DEROctetString,f=b.x509,e=f.AlgorithmIdentifier;b.tsp.MessageImprint.superclass.constructor.call(this);this.dHashAlg=null;this.dHashValue=null;this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var h=new a({array:[this.dHashAlg,this.dHashValue]});return h.getEncodedHex()};if(g!==undefined){if(typeof g.hashAlg=="string"){this.dHashAlg=new e({name:g.hashAlg})}if(typeof g.hashValue=="string"){this.dHashValue=new d({hex:g.hashValue})}}};YAHOO.lang.extend(KJUR.asn1.tsp.MessageImprint,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampReq=function(c){var a=KJUR,f=a.asn1,d=f.DERSequence,e=f.DERInteger,g=f.DERBoolean,i=f.DERObjectIdentifier,h=f.tsp,b=h.MessageImprint;h.TimeStampReq.superclass.constructor.call(this);this.dVersion=new e({"int":1});this.dMessageImprint=null;this.dPolicy=null;this.dNonce=null;this.certReq=true;this.setMessageImprint=function(j){if(j instanceof b){this.dMessageImprint=j;return}if(typeof j=="object"){this.dMessageImprint=new b(j)}};this.getEncodedHex=function(){if(this.dMessageImprint==null){throw"messageImprint shall be specified"}var j=[this.dVersion,this.dMessageImprint];if(this.dPolicy!=null){j.push(this.dPolicy)}if(this.dNonce!=null){j.push(this.dNonce)}if(this.certReq){j.push(new g())}var k=new d({array:j});this.hTLV=k.getEncodedHex();return this.hTLV};if(c!==undefined){if(typeof c.mi=="object"){this.setMessageImprint(c.mi)}if(typeof c.policy=="object"){this.dPolicy=new i(c.policy)}if(typeof c.nonce=="object"){this.dNonce=new e(c.nonce)}if(typeof c.certreq=="boolean"){this.certReq=c.certreq}}};YAHOO.lang.extend(KJUR.asn1.tsp.TimeStampReq,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TSTInfo=function(e){var c=KJUR,i=c.asn1,f=i.DERSequence,h=i.DERInteger,k=i.DERBoolean,g=i.DERGeneralizedTime,l=i.DERObjectIdentifier,j=i.tsp,d=j.MessageImprint,b=j.Accuracy,a=i.x509.X500Name;j.TSTInfo.superclass.constructor.call(this);this.dVersion=new h({"int":1});this.dPolicy=null;this.dMessageImprint=null;this.dSerialNumber=null;this.dGenTime=null;this.dAccuracy=null;this.dOrdering=null;this.dNonce=null;this.dTsa=null;this.getEncodedHex=function(){var m=[this.dVersion];if(this.dPolicy==null){throw"policy shall be specified."}m.push(this.dPolicy);if(this.dMessageImprint==null){throw"messageImprint shall be specified."}m.push(this.dMessageImprint);if(this.dSerialNumber==null){throw"serialNumber shall be specified."}m.push(this.dSerialNumber);if(this.dGenTime==null){throw"genTime shall be specified."}m.push(this.dGenTime);if(this.dAccuracy!=null){m.push(this.dAccuracy)}if(this.dOrdering!=null){m.push(this.dOrdering)}if(this.dNonce!=null){m.push(this.dNonce)}if(this.dTsa!=null){m.push(this.dTsa)}var n=new f({array:m});this.hTLV=n.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e.policy=="string"){if(!e.policy.match(/^[0-9.]+$/)){throw"policy shall be oid like 0.1.4.134"}this.dPolicy=new l({oid:e.policy})}if(e.messageImprint!==undefined){this.dMessageImprint=new d(e.messageImprint)}if(e.serialNumber!==undefined){this.dSerialNumber=new h(e.serialNumber)}if(e.genTime!==undefined){this.dGenTime=new g(e.genTime)}if(e.accuracy!==undefined){this.dAccuracy=new b(e.accuracy)}if(e.ordering!==undefined&&e.ordering==true){this.dOrdering=new k()}if(e.nonce!==undefined){this.dNonce=new h(e.nonce)}if(e.tsa!==undefined){this.dTsa=new a(e.tsa)}}};YAHOO.lang.extend(KJUR.asn1.tsp.TSTInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampResp=function(g){var e=KJUR,d=e.asn1,c=d.DERSequence,f=d.ASN1Object,a=d.tsp,b=a.PKIStatusInfo;a.TimeStampResp.superclass.constructor.call(this);this.dStatus=null;this.dTST=null;this.getEncodedHex=function(){if(this.dStatus==null){throw"status shall be specified"}var h=[this.dStatus];if(this.dTST!=null){h.push(this.dTST)}var i=new c({array:h});this.hTLV=i.getEncodedHex();return this.hTLV};if(g!==undefined){if(typeof g.status=="object"){this.dStatus=new b(g.status)}if(g.tst!==undefined&&g.tst instanceof f){this.dTST=g.tst.getContentInfo()}}};YAHOO.lang.extend(KJUR.asn1.tsp.TimeStampResp,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatusInfo=function(h){var g=KJUR,f=g.asn1,e=f.DERSequence,a=f.tsp,d=a.PKIStatus,c=a.PKIFreeText,b=a.PKIFailureInfo;a.PKIStatusInfo.superclass.constructor.call(this);this.dStatus=null;this.dStatusString=null;this.dFailureInfo=null;this.getEncodedHex=function(){if(this.dStatus==null){throw"status shall be specified"}var i=[this.dStatus];if(this.dStatusString!=null){i.push(this.dStatusString)}if(this.dFailureInfo!=null){i.push(this.dFailureInfo)}var j=new e({array:i});this.hTLV=j.getEncodedHex();return this.hTLV};if(h!==undefined){if(typeof h.status=="object"){this.dStatus=new d(h.status)}if(typeof h.statstr=="object"){this.dStatusString=new c({array:h.statstr})}if(typeof h.failinfo=="object"){this.dFailureInfo=new b(h.failinfo)}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIStatusInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatus=function(h){var d=KJUR,c=d.asn1,g=c.DERInteger,a=c.tsp,b=a.PKIStatus;a.PKIStatus.superclass.constructor.call(this);var f=null;this.getEncodedHex=function(){this.hTLV=this.dStatus.getEncodedHex();return this.hTLV};if(h!==undefined){if(h.name!==undefined){var e=b.valueList;if(e[h.name]===undefined){throw"name undefined: "+h.name}this.dStatus=new g({"int":e[h.name]})}else{this.dStatus=new g(h)}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIStatus,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatus.valueList={granted:0,grantedWithMods:1,rejection:2,waiting:3,revocationWarning:4,revocationNotification:5};KJUR.asn1.tsp.PKIFreeText=function(f){var e=KJUR,d=e.asn1,b=d.DERSequence,c=d.DERUTF8String,a=d.tsp;a.PKIFreeText.superclass.constructor.call(this);this.textList=[];this.getEncodedHex=function(){var g=[];for(var j=0;j<this.textList.length;j++){g.push(new c({str:this.textList[j]}))}var h=new b({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(typeof f.array=="object"){this.textList=f.array}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIFreeText,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFailureInfo=function(g){var d=KJUR,c=d.asn1,f=c.DERBitString,a=c.tsp,b=a.PKIFailureInfo;b.superclass.constructor.call(this);this.value=null;this.getEncodedHex=function(){if(this.value==null){throw"value shall be specified"}var h=new Number(this.value).toString(2);var i=new f();i.setByBinaryString(h);this.hTLV=i.getEncodedHex();return this.hTLV};if(g!==undefined){if(typeof g.name=="string"){var e=b.valueList;if(e[g.name]===undefined){throw"name undefined: "+g.name}this.value=e[g.name]}else{if(typeof g["int"]=="number"){this.value=g["int"]}}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIFailureInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFailureInfo.valueList={badAlg:0,badRequest:2,badDataFormat:5,timeNotAvailable:14,unacceptedPolicy:15,unacceptedExtension:16,addInfoNotAvailable:17,systemFailure:25};KJUR.asn1.tsp.AbstractTSAAdapter=function(a){this.getTSTHex=function(c,b){throw"not implemented yet"}};KJUR.asn1.tsp.SimpleTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.SimpleTSAAdapter.superclass.constructor.call(this);this.params=null;this.serial=0;this.getTSTHex=function(g,f){var i=b(g,f);this.params.tstInfo.messageImprint={hashAlg:f,hashValue:i};this.params.tstInfo.serialNumber={"int":this.serial++};var h=Math.floor(Math.random()*1000000000);this.params.tstInfo.nonce={"int":h};var j=a.TSPUtil.newTimeStampToken(this.params);return j.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};YAHOO.lang.extend(KJUR.asn1.tsp.SimpleTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.FixedTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.FixedTSAAdapter.superclass.constructor.call(this);this.params=null;this.getTSTHex=function(g,f){var h=b(g,f);this.params.tstInfo.messageImprint={hashAlg:f,hashValue:h};var i=a.TSPUtil.newTimeStampToken(this.params);return i.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};YAHOO.lang.extend(KJUR.asn1.tsp.FixedTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.TSPUtil=new function(){};KJUR.asn1.tsp.TSPUtil.newTimeStampToken=function(c){var b=KJUR,h=b.asn1,m=h.cms,k=h.tsp,a=h.tsp.TSTInfo;var j=new m.SignedData();var g=new a(c.tstInfo);var f=g.getEncodedHex();j.dEncapContentInfo.setContentValue({hex:f});j.dEncapContentInfo.setContentType("tstinfo");if(typeof c.certs=="object"){for(var e=0;e<c.certs.length;e++){j.addCertificatesByPEM(c.certs[e])}}var d=j.signerInfoList[0];d.setSignerIdentifier(c.signerCert);d.setForContentAndHash({sdObj:j,eciObj:j.dEncapContentInfo,hashAlg:c.hashAlg});var l=new m.SigningCertificate({array:[c.signerCert]});d.dSignedAttrs.add(l);d.sign(c.signerPrvKey,c.sigAlg);return j};KJUR.asn1.tsp.TSPUtil.parseTimeStampReq=function(m){var l=ASN1HEX;var h=l.getChildIdx;var f=l.getV;var b=l.getTLV;var j={};j.certreq=false;var a=h(m,0);if(a.length<2){throw"TimeStampReq must have at least 2 items"}var e=b(m,a[1]);j.mi=KJUR.asn1.tsp.TSPUtil.parseMessageImprint(e);for(var d=2;d<a.length;d++){var g=a[d];var k=m.substr(g,2);if(k=="06"){var c=f(m,g);j.policy=l.hextooidstr(c)}if(k=="02"){j.nonce=f(m,g)}if(k=="01"){j.certreq=true}}return j};KJUR.asn1.tsp.TSPUtil.parseMessageImprint=function(c){var m=ASN1HEX;var j=m.getChildIdx;var i=m.getV;var g=m.getIdxbyList;var k={};if(c.substr(0,2)!="30"){throw"head of messageImprint hex shall be '30'"}var a=j(c,0);var l=g(c,0,[0,0]);var e=i(c,l);var d=m.hextooidstr(e);var h=KJUR.asn1.x509.OID.oid2name(d);if(h==""){throw"hashAlg name undefined: "+d}var b=h;var f=g(c,0,[1]);k.hashAlg=b;k.hashValue=i(c,f);return k};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cades=="undefined"||!KJUR.asn1.cades){KJUR.asn1.cades={}}KJUR.asn1.cades.SignaturePolicyIdentifier=function(f){var b=KJUR,h=b.asn1,i=h.DERObjectIdentifier,g=h.DERSequence,e=h.cades,c=e.OtherHashAlgAndValue;e.SignaturePolicyIdentifier.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.15";if(f!==undefined){if(typeof f.oid=="string"&&typeof f.hash=="object"){var d=new i({oid:f.oid});var a=new c(f.hash);var j=new g({array:[d,a]});this.valueList=[j]}}};YAHOO.lang.extend(KJUR.asn1.cades.SignaturePolicyIdentifier,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.OtherHashAlgAndValue=function(e){var a=KJUR,g=a.asn1,f=g.DERSequence,h=g.DEROctetString,d=g.x509,i=d.AlgorithmIdentifier,c=g.cades,b=c.OtherHashAlgAndValue;b.superclass.constructor.call(this);this.dAlg=null;this.dHash=null;this.getEncodedHex=function(){var j=new f({array:[this.dAlg,this.dHash]});this.hTLV=j.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e.alg=="string"&&typeof e.hash=="string"){this.dAlg=new i({name:e.alg});this.dHash=new h({hex:e.hash})}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherHashAlgAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.cades.SignatureTimeStamp=function(h){var c=KJUR,b=c.asn1,e=b.ASN1Object,g=b.x509,a=b.cades;a.SignatureTimeStamp.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.14";this.tstHex=null;if(h!==undefined){if(h.res!==undefined){if(typeof h.res=="string"&&h.res.match(/^[0-9A-Fa-f]+$/)){}else{if(h.res instanceof e){}else{throw"res param shall be ASN1Object or hex string"}}}if(h.tst!==undefined){if(typeof h.tst=="string"&&h.tst.match(/^[0-9A-Fa-f]+$/)){var f=new e();this.tstHex=h.tst;f.hTLV=this.tstHex;f.getEncodedHex();this.valueList=[f]}else{if(h.tst instanceof e){}else{throw"tst param shall be ASN1Object or hex string"}}}}};YAHOO.lang.extend(KJUR.asn1.cades.SignatureTimeStamp,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.CompleteCertificateRefs=function(d){var c=KJUR,b=c.asn1,a=b.cades;a.CompleteCertificateRefs.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.21";this.setByArray=function(e){this.valueList=[];for(var f=0;f<e.length;f++){var g=new a.OtherCertID(e[f]);this.valueList.push(g)}};if(d!==undefined){if(typeof d=="object"&&typeof d.length=="number"){this.setByArray(d)}}};YAHOO.lang.extend(KJUR.asn1.cades.CompleteCertificateRefs,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.OtherCertID=function(e){var c=KJUR,b=c.asn1,d=b.cms,a=b.cades;a.OtherCertID.superclass.constructor.call(this);this.hasIssuerSerial=true;this.dOtherCertHash=null;this.dIssuerSerial=null;this.setByCertPEM=function(f){this.dOtherCertHash=new a.OtherHash(f);if(this.hasIssuerSerial){this.dIssuerSerial=new d.IssuerAndSerialNumber(f)}};this.getEncodedHex=function(){if(this.hTLV!=null){return this.hTLV}if(this.dOtherCertHash==null){throw"otherCertHash not set"}var f=[this.dOtherCertHash];if(this.dIssuerSerial!=null){f.push(this.dIssuerSerial)}var g=new b.DERSequence({array:f});this.hTLV=g.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e=="string"&&e.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(e)}if(typeof e=="object"){if(e.hasis===false){this.hasIssuerSerial=false}if(typeof e.cert=="string"){this.setByCertPEM(e.cert)}}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherCertID,KJUR.asn1.ASN1Object);KJUR.asn1.cades.OtherHash=function(f){var d=KJUR,c=d.asn1,e=c.cms,b=c.cades,g=b.OtherHashAlgAndValue,a=d.crypto.Util.hashHex;b.OtherHash.superclass.constructor.call(this);this.alg="sha256";this.dOtherHash=null;this.setByCertPEM=function(h){if(h.indexOf("-----BEGIN ")==-1){throw"certPEM not to seem PEM format"}var i=pemtohex(h);var j=a(i,this.alg);this.dOtherHash=new g({alg:this.alg,hash:j})};this.getEncodedHex=function(){if(this.dOtherHash==null){throw"OtherHash not set"}return this.dOtherHash.getEncodedHex()};if(f!==undefined){if(typeof f=="string"){if(f.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(f)}else{if(f.match(/^[0-9A-Fa-f]+$/)){this.dOtherHash=new c.DEROctetString({hex:f})}else{throw"unsupported string value for params"}}}else{if(typeof f=="object"){if(typeof f.cert=="string"){if(typeof f.alg=="string"){this.alg=f.alg}this.setByCertPEM(f.cert)}else{this.dOtherHash=new g(f)}}}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherHash,KJUR.asn1.ASN1Object);KJUR.asn1.cades.CAdESUtil=new function(){};KJUR.asn1.cades.CAdESUtil.addSigTS=function(c,b,a){};KJUR.asn1.cades.CAdESUtil.parseSignedDataForAddingUnsigned=function(e){var p=ASN1HEX,u=p.getChildIdx,b=p.getTLV,a=p.getTLVbyList,k=p.getIdxbyList,A=KJUR,g=A.asn1,l=g.ASN1Object,j=g.cms,h=j.SignedData,v=g.cades,z=v.CAdESUtil;var m={};if(a(e,0,[0])!="06092a864886f70d010702"){throw"hex is not CMS SignedData"}var y=k(e,0,[1,0]);var B=u(e,y);if(B.length<4){throw"num of SignedData elem shall be 4 at least"}var d=B.shift();m.version=b(e,d);var w=B.shift();m.algs=b(e,w);var c=B.shift();m.encapcontent=b(e,c);m.certs=null;m.revs=null;m.si=[];var o=B.shift();if(e.substr(o,2)=="a0"){m.certs=b(e,o);o=B.shift()}if(e.substr(o,2)=="a1"){m.revs=b(e,o);o=B.shift()}var t=o;if(e.substr(t,2)!="31"){throw"Can't find signerInfos"}var f=u(e,t);for(var q=0;q<f.length;q++){var s=f[q];var n=z.parseSignerInfoForAddingUnsigned(e,s,q);m.si[q]=n}var x=null;m.obj=new h();x=new l();x.hTLV=m.version;m.obj.dCMSVersion=x;x=new l();x.hTLV=m.algs;m.obj.dDigestAlgs=x;x=new l();x.hTLV=m.encapcontent;m.obj.dEncapContentInfo=x;x=new l();x.hTLV=m.certs;m.obj.dCerts=x;m.obj.signerInfoList=[];for(var q=0;q<m.si.length;q++){m.obj.signerInfoList.push(m.si[q].obj)}return m};KJUR.asn1.cades.CAdESUtil.parseSignerInfoForAddingUnsigned=function(g,q,c){var p=ASN1HEX,s=p.getChildIdx,a=p.getTLV,l=p.getV,v=KJUR,h=v.asn1,n=h.ASN1Object,j=h.cms,k=j.AttributeList,w=j.SignerInfo;var o={};var t=s(g,q);if(t.length!=6){throw"not supported items for SignerInfo (!=6)"}var d=t.shift();o.version=a(g,d);var e=t.shift();o.si=a(g,e);var m=t.shift();o.digalg=a(g,m);var f=t.shift();o.sattrs=a(g,f);var i=t.shift();o.sigalg=a(g,i);var b=t.shift();o.sig=a(g,b);o.sigval=l(g,b);var u=null;o.obj=new w();u=new n();u.hTLV=o.version;o.obj.dCMSVersion=u;u=new n();u.hTLV=o.si;o.obj.dSignerIdentifier=u;u=new n();u.hTLV=o.digalg;o.obj.dDigestAlgorithm=u;u=new n();u.hTLV=o.sattrs;o.obj.dSignedAttrs=u;u=new n();u.hTLV=o.sigalg;o.obj.dSigAlg=u;u=new n();u.hTLV=o.sig;o.obj.dSig=u;o.obj.dUnsignedAttrs=new k();return o};
if(typeof KJUR.asn1.csr=="undefined"||!KJUR.asn1.csr){KJUR.asn1.csr={}}KJUR.asn1.csr.CertificationRequest=function(d){var a=KJUR,f=a.asn1,b=f.DERBitString,e=f.DERSequence,k=f.csr,c=f.x509;k.CertificationRequest.superclass.constructor.call(this);var l=null;var j=null;var h=null;var i=null;var g=null;this.sign=function(o,n){if(this.prvKey==null){this.prvKey=n}this.asn1SignatureAlg=new c.AlgorithmIdentifier({name:o});sig=new a.crypto.Signature({alg:o});sig.init(this.prvKey);sig.updateHex(this.asn1CSRInfo.getEncodedHex());this.hexSig=sig.sign();this.asn1Sig=new b({hex:"00"+this.hexSig});var m=new e({array:[this.asn1CSRInfo,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=m.getEncodedHex();this.isModified=false};this.getPEMString=function(){return hextopem(this.getEncodedHex(),"CERTIFICATE REQUEST")};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};if(d!==undefined&&d.csrinfo!==undefined){this.asn1CSRInfo=d.csrinfo}};YAHOO.lang.extend(KJUR.asn1.csr.CertificationRequest,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CertificationRequestInfo=function(e){var b=KJUR,h=b.asn1,g=h.DERInteger,f=h.DERSequence,m=h.DERSet,j=h.DERNull,c=h.DERTaggedObject,k=h.DERObjectIdentifier,l=h.csr,d=h.x509,a=d.X500Name,n=d.Extension,i=KEYUTIL;l.CertificationRequestInfo.superclass.constructor.call(this);this._initialize=function(){this.asn1Array=new Array();this.asn1Version=new g({"int":0});this.asn1Subject=null;this.asn1SubjPKey=null;this.extensionsArray=new Array()};this.setSubjectByParam=function(o){this.asn1Subject=new a(o)};this.setSubjectPublicKeyByGetKey=function(p){var o=i.getKey(p);this.asn1SubjPKey=new d.SubjectPublicKeyInfo(o)};this.appendExtensionByName=function(p,o){n.appendByNameToArray(p,o,this.extensionsArray)};this.getEncodedHex=function(){this.asn1Array=new Array();this.asn1Array.push(this.asn1Version);this.asn1Array.push(this.asn1Subject);this.asn1Array.push(this.asn1SubjPKey);if(this.extensionsArray.length>0){var s=new f({array:this.extensionsArray});var r=new m({array:[s]});var q=new f({array:[new k({oid:"1.2.840.113549.1.9.14"}),r]});var p=new c({explicit:true,tag:"a0",obj:q});this.asn1Array.push(p)}else{var p=new c({explicit:false,tag:"a0",obj:new j()});this.asn1Array.push(p)}var t=new f({array:this.asn1Array});this.hTLV=t.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize()};YAHOO.lang.extend(KJUR.asn1.csr.CertificationRequestInfo,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CSRUtil=new function(){};KJUR.asn1.csr.CSRUtil.newCSRPEM=function(h){var c=KEYUTIL,b=KJUR.asn1.csr;if(h.subject===undefined){throw"parameter subject undefined"}if(h.sbjpubkey===undefined){throw"parameter sbjpubkey undefined"}if(h.sigalg===undefined){throw"parameter sigalg undefined"}if(h.sbjprvkey===undefined){throw"parameter sbjpubkey undefined"}var d=new b.CertificationRequestInfo();d.setSubjectByParam(h.subject);d.setSubjectPublicKeyByGetKey(h.sbjpubkey);if(h.ext!==undefined&&h.ext.length!==undefined){for(var e=0;e<h.ext.length;e++){for(key in h.ext[e]){d.appendExtensionByName(key,h.ext[e][key])}}}var f=new b.CertificationRequest({csrinfo:d});var a=c.getKey(h.sbjprvkey);f.sign(h.sigalg,a);var g=f.getPEMString();return g};KJUR.asn1.csr.CSRUtil.getInfo=function(b){var d=ASN1HEX;var e=d.getTLVbyList;var a={};a.subject={};a.pubkey={};if(b.indexOf("-----BEGIN CERTIFICATE REQUEST")==-1){throw"argument is not PEM file"}var c=pemtohex(b,"CERTIFICATE REQUEST");a.subject.hex=e(c,0,[0,1]);a.subject.name=X509.hex2dn(a.subject.hex);a.pubkey.hex=e(c,0,[0,2]);a.pubkey.obj=KEYUTIL.getKey(a.pubkey.hex,null,"pkcs8pub");return a};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.ocsp=="undefined"||!KJUR.asn1.ocsp){KJUR.asn1.ocsp={}}KJUR.asn1.ocsp.DEFAULT_HASH="sha1";KJUR.asn1.ocsp.CertID=function(g){var d=KJUR,k=d.asn1,m=k.DEROctetString,j=k.DERInteger,h=k.DERSequence,f=k.x509,n=f.AlgorithmIdentifier,o=k.ocsp,l=o.DEFAULT_HASH,i=d.crypto,e=i.Util.hashHex,c=X509,q=ASN1HEX;o.CertID.superclass.constructor.call(this);this.dHashAlg=null;this.dIssuerNameHash=null;this.dIssuerKeyHash=null;this.dSerialNumber=null;this.setByValue=function(t,s,p,r){if(r===undefined){r=l}this.dHashAlg=new n({name:r});this.dIssuerNameHash=new m({hex:t});this.dIssuerKeyHash=new m({hex:s});this.dSerialNumber=new j({hex:p})};this.setByCert=function(x,t,v){if(v===undefined){v=l}var p=new c();p.readCertPEM(t);var y=new c();y.readCertPEM(x);var z=y.getPublicKeyHex();var w=q.getTLVbyList(z,0,[1,0],"30");var r=p.getSerialNumberHex();var s=e(y.getSubjectHex(),v);var u=e(w,v);this.setByValue(s,u,r,v);this.hoge=p.getSerialNumberHex()};this.getEncodedHex=function(){if(this.dHashAlg===null&&this.dIssuerNameHash===null&&this.dIssuerKeyHash===null&&this.dSerialNumber===null){throw"not yet set values"}var p=[this.dHashAlg,this.dIssuerNameHash,this.dIssuerKeyHash,this.dSerialNumber];var r=new h({array:p});this.hTLV=r.getEncodedHex();return this.hTLV};if(g!==undefined){var b=g;if(b.issuerCert!==undefined&&b.subjectCert!==undefined){var a=l;if(b.alg===undefined){a=undefined}this.setByCert(b.issuerCert,b.subjectCert,a)}else{if(b.namehash!==undefined&&b.keyhash!==undefined&&b.serial!==undefined){var a=l;if(b.alg===undefined){a=undefined}this.setByValue(b.namehash,b.keyhash,b.serial,a)}else{throw"invalid constructor arguments"}}}};YAHOO.lang.extend(KJUR.asn1.ocsp.CertID,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.Request=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.Request.superclass.constructor.call(this);this.dReqCert=null;this.dExt=null;this.getEncodedHex=function(){var g=[];if(this.dReqCert===null){throw"reqCert not set"}g.push(this.dReqCert);var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(typeof f!=="undefined"){var e=new d.CertID(f);this.dReqCert=e}};YAHOO.lang.extend(KJUR.asn1.ocsp.Request,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.TBSRequest=function(e){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.TBSRequest.superclass.constructor.call(this);this.version=0;this.dRequestorName=null;this.dRequestList=[];this.dRequestExt=null;this.setRequestListByParam=function(h){var f=[];for(var g=0;g<h.length;g++){var j=new d.Request(h[0]);f.push(j)}this.dRequestList=f};this.getEncodedHex=function(){var f=[];if(this.version!==0){throw"not supported version: "+this.version}if(this.dRequestorName!==null){throw"requestorName not supported"}var h=new a({array:this.dRequestList});f.push(h);if(this.dRequestExt!==null){throw"requestExtensions not supported"}var g=new a({array:f});this.hTLV=g.getEncodedHex();return this.hTLV};if(e!==undefined){if(e.reqList!==undefined){this.setRequestListByParam(e.reqList)}}};YAHOO.lang.extend(KJUR.asn1.ocsp.TBSRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPRequest=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.OCSPRequest.superclass.constructor.call(this);this.dTbsRequest=null;this.dOptionalSignature=null;this.getEncodedHex=function(){var g=[];if(this.dTbsRequest!==null){g.push(this.dTbsRequest)}else{throw"tbsRequest not set"}if(this.dOptionalSignature!==null){throw"optionalSignature not supported"}var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.reqList!==undefined){var e=new d.TBSRequest(f);this.dTbsRequest=e}}};YAHOO.lang.extend(KJUR.asn1.ocsp.OCSPRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPUtil={};KJUR.asn1.ocsp.OCSPUtil.getRequestHex=function(a,b,h){var d=KJUR,c=d.asn1,e=c.ocsp;if(h===undefined){h=e.DEFAULT_HASH}var g={alg:h,issuerCert:a,subjectCert:b};var f=new e.OCSPRequest({reqList:[g]});return f.getEncodedHex()};KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo=function(b){var k=ASN1HEX;var c=k.getVbyList;var d=k.getIdxbyList;var c=k.getVbyList;var f=k.getV;var l={};try{var i=c(b,0,[0],"0a");l.responseStatus=parseInt(i,16)}catch(e){}if(l.responseStatus!==0){return l}try{var g=d(b,0,[1,0,1,0,0,2,0,1]);if(b.substr(g,2)==="80"){l.certStatus="good"}else{if(b.substr(g,2)==="a1"){l.certStatus="revoked";l.revocationTime=hextoutf8(c(b,g,[0]))}else{if(b.substr(g,2)==="82"){l.certStatus="unknown"}}}}catch(e){}try{var a=d(b,0,[1,0,1,0,0,2,0,2]);l.thisUpdate=hextoutf8(f(b,a))}catch(e){}try{var j=d(b,0,[1,0,1,0,0,2,0,3]);if(b.substr(j,2)==="a0"){l.nextUpdate=hextoutf8(c(b,j,[0]))}}catch(e){}return l};
var KJUR;if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.lang=="undefined"||!KJUR.lang){KJUR.lang={}}KJUR.lang.String=function(){};function Base64x(){}function stoBA(d){var b=new Array();for(var c=0;c<d.length;c++){b[c]=d.charCodeAt(c)}return b}function BAtos(b){var d="";for(var c=0;c<b.length;c++){d=d+String.fromCharCode(b[c])}return d}function BAtohex(b){var e="";for(var d=0;d<b.length;d++){var c=b[d].toString(16);if(c.length==1){c="0"+c}e=e+c}return e}function stohex(a){return BAtohex(stoBA(a))}function stob64(a){return hex2b64(stohex(a))}function stob64u(a){return b64tob64u(hex2b64(stohex(a)))}function b64utos(a){return BAtos(b64toBA(b64utob64(a)))}function b64tob64u(a){a=a.replace(/\=/g,"");a=a.replace(/\+/g,"-");a=a.replace(/\//g,"_");return a}function b64utob64(a){if(a.length%4==2){a=a+"=="}else{if(a.length%4==3){a=a+"="}}a=a.replace(/-/g,"+");a=a.replace(/_/g,"/");return a}function hextob64u(a){if(a.length%2==1){a="0"+a}return b64tob64u(hex2b64(a))}function b64utohex(a){return b64tohex(b64utob64(a))}var utf8tob64u,b64utoutf8;if(typeof Buffer==="function"){utf8tob64u=function(a){return b64tob64u(new Buffer(a,"utf8").toString("base64"))};b64utoutf8=function(a){return new Buffer(b64utob64(a),"base64").toString("utf8")}}else{utf8tob64u=function(a){return hextob64u(uricmptohex(encodeURIComponentAll(a)))};b64utoutf8=function(a){return decodeURIComponent(hextouricmp(b64utohex(a)))}}function utf8tob64(a){return hex2b64(uricmptohex(encodeURIComponentAll(a)))}function b64toutf8(a){return decodeURIComponent(hextouricmp(b64tohex(a)))}function utf8tohex(a){return uricmptohex(encodeURIComponentAll(a))}function hextoutf8(a){return decodeURIComponent(hextouricmp(a))}function hextorstr(c){var b="";for(var a=0;a<c.length-1;a+=2){b+=String.fromCharCode(parseInt(c.substr(a,2),16))}return b}function rstrtohex(c){var a="";for(var b=0;b<c.length;b++){a+=("0"+c.charCodeAt(b).toString(16)).slice(-2)}return a}function hextob64(a){return hex2b64(a)}function hextob64nl(b){var a=hextob64(b);var c=a.replace(/(.{64})/g,"$1\r\n");c=c.replace(/\r\n$/,"");return c}function b64nltohex(b){var a=b.replace(/[^0-9A-Za-z\/+=]*/g,"");var c=b64tohex(a);return c}function hextopem(a,b){var c=hextob64nl(a);return"-----BEGIN "+b+"-----\r\n"+c+"\r\n-----END "+b+"-----\r\n"}function pemtohex(a,b){if(a.indexOf("-----BEGIN ")==-1){throw"can't find PEM header: "+b}if(b!==undefined){a=a.replace(new RegExp("^[^]*-----BEGIN "+b+"-----"),"");a=a.replace(new RegExp("-----END "+b+"-----[^]*$"),"")}else{a=a.replace(/^[^]*-----BEGIN [^-]+-----/,"");a=a.replace(/-----END [^-]+-----[^]*$/,"")}return b64nltohex(a)}function hextoArrayBuffer(d){if(d.length%2!=0){throw"input is not even length"}if(d.match(/^[0-9A-Fa-f]+$/)==null){throw"input is not hexadecimal"}var b=new ArrayBuffer(d.length/2);var a=new DataView(b);for(var c=0;c<d.length/2;c++){a.setUint8(c,parseInt(d.substr(c*2,2),16))}return b}function ArrayBuffertohex(b){var d="";var a=new DataView(b);for(var c=0;c<b.byteLength;c++){d+=("00"+a.getUint8(c).toString(16)).slice(-2)}return d}function zulutomsec(n){var l,j,m,e,f,i,b,k;var a,h,g,c;c=n.match(/^(\d{2}|\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(|\.\d+)Z$/);if(c){a=c[1];l=parseInt(a);if(a.length===2){if(50<=l&&l<100){l=1900+l}else{if(0<=l&&l<50){l=2000+l}}}j=parseInt(c[2])-1;m=parseInt(c[3]);e=parseInt(c[4]);f=parseInt(c[5]);i=parseInt(c[6]);b=0;h=c[7];if(h!==""){g=(h.substr(1)+"00").substr(0,3);b=parseInt(g)}return Date.UTC(l,j,m,e,f,i,b)}throw"unsupported zulu format: "+n}function zulutosec(a){var b=zulutomsec(a);return ~~(b/1000)}function zulutodate(a){return new Date(zulutomsec(a))}function datetozulu(g,e,f){var b;var a=g.getUTCFullYear();if(e){if(a<1950||2049<a){throw"not proper year for UTCTime: "+a}b=(""+a).slice(-2)}else{b=("000"+a).slice(-4)}b+=("0"+(g.getUTCMonth()+1)).slice(-2);b+=("0"+g.getUTCDate()).slice(-2);b+=("0"+g.getUTCHours()).slice(-2);b+=("0"+g.getUTCMinutes()).slice(-2);b+=("0"+g.getUTCSeconds()).slice(-2);if(f){var c=g.getUTCMilliseconds();if(c!==0){c=("00"+c).slice(-3);c=c.replace(/0+$/g,"");b+="."+c}}b+="Z";return b}function uricmptohex(a){return a.replace(/%/g,"")}function hextouricmp(a){return a.replace(/(..)/g,"%$1")}function ipv6tohex(g){var b="malformed IPv6 address";if(!g.match(/^[0-9A-Fa-f:]+$/)){throw b}g=g.toLowerCase();var d=g.split(":").length-1;if(d<2){throw b}var e=":".repeat(7-d+2);g=g.replace("::",e);var c=g.split(":");if(c.length!=8){throw b}for(var f=0;f<8;f++){c[f]=("0000"+c[f]).slice(-4)}return c.join("")}function hextoipv6(e){if(!e.match(/^[0-9A-Fa-f]{32}$/)){throw"malformed IPv6 address octet"}e=e.toLowerCase();var b=e.match(/.{1,4}/g);for(var d=0;d<8;d++){b[d]=b[d].replace(/^0+/,"");if(b[d]==""){b[d]="0"}}e=":"+b.join(":")+":";var c=e.match(/:(0:){2,}/g);if(c===null){return e.slice(1,-1)}var f="";for(var d=0;d<c.length;d++){if(c[d].length>f.length){f=c[d]}}e=e.replace(f,"::");return e.slice(1,-1)}function hextoip(b){var d="malformed hex value";if(!b.match(/^([0-9A-Fa-f][0-9A-Fa-f]){1,}$/)){throw d}if(b.length==8){var c;try{c=parseInt(b.substr(0,2),16)+"."+parseInt(b.substr(2,2),16)+"."+parseInt(b.substr(4,2),16)+"."+parseInt(b.substr(6,2),16);return c}catch(a){throw d}}else{if(b.length==32){return hextoipv6(b)}else{return b}}}function iptohex(f){var j="malformed IP address";f=f.toLowerCase(f);if(f.match(/^[0-9.]+$/)){var b=f.split(".");if(b.length!==4){throw j}var g="";try{for(var e=0;e<4;e++){var h=parseInt(b[e]);g+=("0"+h.toString(16)).slice(-2)}return g}catch(c){throw j}}else{if(f.match(/^[0-9a-f:]+$/)&&f.indexOf(":")!==-1){return ipv6tohex(f)}else{throw j}}}function encodeURIComponentAll(a){var d=encodeURIComponent(a);var b="";for(var c=0;c<d.length;c++){if(d[c]=="%"){b=b+d.substr(c,3);c=c+2}else{b=b+"%"+stohex(d[c])}}return b}function newline_toUnix(a){a=a.replace(/\r\n/mg,"\n");return a}function newline_toDos(a){a=a.replace(/\r\n/mg,"\n");a=a.replace(/\n/mg,"\r\n");return a}KJUR.lang.String.isInteger=function(a){if(a.match(/^[0-9]+$/)){return true}else{if(a.match(/^-[0-9]+$/)){return true}else{return false}}};KJUR.lang.String.isHex=function(a){if(a.length%2==0&&(a.match(/^[0-9a-f]+$/)||a.match(/^[0-9A-F]+$/))){return true}else{return false}};KJUR.lang.String.isBase64=function(a){a=a.replace(/\s+/g,"");if(a.match(/^[0-9A-Za-z+\/]+={0,3}$/)&&a.length%4==0){return true}else{return false}};KJUR.lang.String.isBase64URL=function(a){if(a.match(/[+/=]/)){return false}a=b64utob64(a);return KJUR.lang.String.isBase64(a)};KJUR.lang.String.isIntegerArray=function(a){a=a.replace(/\s+/g,"");if(a.match(/^\[[0-9,]+\]$/)){return true}else{return false}};function hextoposhex(a){if(a.length%2==1){return"0"+a}if(a.substr(0,1)>"7"){return"00"+a}return a}function intarystrtohex(b){b=b.replace(/^\s*\[\s*/,"");b=b.replace(/\s*\]\s*$/,"");b=b.replace(/\s*/g,"");try{var c=b.split(/,/).map(function(g,e,h){var f=parseInt(g);if(f<0||255<f){throw"integer not in range 0-255"}var d=("00"+f.toString(16)).slice(-2);return d}).join("");return c}catch(a){throw"malformed integer array string: "+a}}var strdiffidx=function(c,a){var d=c.length;if(c.length>a.length){d=a.length}for(var b=0;b<d;b++){if(c.charCodeAt(b)!=a.charCodeAt(b)){return b}}if(c.length!=a.length){return d}return -1};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.Util=new function(){this.DIGESTINFOHEAD={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414",};this.DEFAULTPROVIDER={md5:"cryptojs",sha1:"cryptojs",sha224:"cryptojs",sha256:"cryptojs",sha384:"cryptojs",sha512:"cryptojs",ripemd160:"cryptojs",hmacmd5:"cryptojs",hmacsha1:"cryptojs",hmacsha224:"cryptojs",hmacsha256:"cryptojs",hmacsha384:"cryptojs",hmacsha512:"cryptojs",hmacripemd160:"cryptojs",MD5withRSA:"cryptojs/jsrsa",SHA1withRSA:"cryptojs/jsrsa",SHA224withRSA:"cryptojs/jsrsa",SHA256withRSA:"cryptojs/jsrsa",SHA384withRSA:"cryptojs/jsrsa",SHA512withRSA:"cryptojs/jsrsa",RIPEMD160withRSA:"cryptojs/jsrsa",MD5withECDSA:"cryptojs/jsrsa",SHA1withECDSA:"cryptojs/jsrsa",SHA224withECDSA:"cryptojs/jsrsa",SHA256withECDSA:"cryptojs/jsrsa",SHA384withECDSA:"cryptojs/jsrsa",SHA512withECDSA:"cryptojs/jsrsa",RIPEMD160withECDSA:"cryptojs/jsrsa",SHA1withDSA:"cryptojs/jsrsa",SHA224withDSA:"cryptojs/jsrsa",SHA256withDSA:"cryptojs/jsrsa",MD5withRSAandMGF1:"cryptojs/jsrsa",SHA1withRSAandMGF1:"cryptojs/jsrsa",SHA224withRSAandMGF1:"cryptojs/jsrsa",SHA256withRSAandMGF1:"cryptojs/jsrsa",SHA384withRSAandMGF1:"cryptojs/jsrsa",SHA512withRSAandMGF1:"cryptojs/jsrsa",RIPEMD160withRSAandMGF1:"cryptojs/jsrsa",};this.CRYPTOJSMESSAGEDIGESTNAME={md5:CryptoJS.algo.MD5,sha1:CryptoJS.algo.SHA1,sha224:CryptoJS.algo.SHA224,sha256:CryptoJS.algo.SHA256,sha384:CryptoJS.algo.SHA384,sha512:CryptoJS.algo.SHA512,ripemd160:CryptoJS.algo.RIPEMD160};this.getDigestInfoHex=function(a,b){if(typeof this.DIGESTINFOHEAD[b]=="undefined"){throw"alg not supported in Util.DIGESTINFOHEAD: "+b}return this.DIGESTINFOHEAD[b]+a};this.getPaddedDigestInfoHex=function(h,a,j){var c=this.getDigestInfoHex(h,a);var d=j/4;if(c.length+22>d){throw"key is too short for SigAlg: keylen="+j+","+a}var b="0001";var k="00"+c;var g="";var l=d-b.length-k.length;for(var f=0;f<l;f+=2){g+="ff"}var e=b+g+k;return e};this.hashString=function(a,c){var b=new KJUR.crypto.MessageDigest({alg:c});return b.digestString(a)};this.hashHex=function(b,c){var a=new KJUR.crypto.MessageDigest({alg:c});return a.digestHex(b)};this.sha1=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha1",prov:"cryptojs"});return b.digestString(a)};this.sha256=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"});return b.digestString(a)};this.sha256Hex=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"});return b.digestHex(a)};this.sha512=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"});return b.digestString(a)};this.sha512Hex=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"});return b.digestHex(a)}};KJUR.crypto.Util.md5=function(a){var b=new KJUR.crypto.MessageDigest({alg:"md5",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.ripemd160=function(a){var b=new KJUR.crypto.MessageDigest({alg:"ripemd160",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.SECURERANDOMGEN=new SecureRandom();KJUR.crypto.Util.getRandomHexOfNbytes=function(b){var a=new Array(b);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(a);return BAtohex(a)};KJUR.crypto.Util.getRandomBigIntegerOfNbytes=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbytes(a),16)};KJUR.crypto.Util.getRandomHexOfNbits=function(d){var c=d%8;var a=(d-c)/8;var b=new Array(a+1);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(b);b[0]=(((255<<c)&255)^255)&b[0];return BAtohex(b)};KJUR.crypto.Util.getRandomBigIntegerOfNbits=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbits(a),16)};KJUR.crypto.Util.getRandomBigIntegerZeroToMax=function(b){var a=b.bitLength();while(1){var c=KJUR.crypto.Util.getRandomBigIntegerOfNbits(a);if(b.compareTo(c)!=-1){return c}}};KJUR.crypto.Util.getRandomBigIntegerMinToMax=function(e,b){var c=e.compareTo(b);if(c==1){throw"biMin is greater than biMax"}if(c==0){return e}var a=b.subtract(e);var d=KJUR.crypto.Util.getRandomBigIntegerZeroToMax(a);return d.add(e)};KJUR.crypto.MessageDigest=function(c){var b=null;var a=null;var d=null;this.setAlgAndProvider=function(g,f){g=KJUR.crypto.MessageDigest.getCanonicalAlgName(g);if(g!==null&&f===undefined){f=KJUR.crypto.Util.DEFAULTPROVIDER[g]}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&f=="cryptojs"){try{this.md=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g].create()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(h){var i=CryptoJS.enc.Hex.parse(h);this.md.update(i)};this.digest=function(){var h=this.md.finalize();return h.toString(CryptoJS.enc.Hex)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}if(":sha256:".indexOf(g)!=-1&&f=="sjcl"){try{this.md=new sjcl.hash.sha256()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(i){var h=sjcl.codec.hex.toBits(i);this.md.update(h)};this.digest=function(){var h=this.md.finalize();return sjcl.codec.hex.fromBits(h)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}};this.updateString=function(e){throw"updateString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.updateHex=function(e){throw"updateHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digest=function(){throw"digest() not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestString=function(e){throw"digestString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestHex=function(e){throw"digestHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};if(c!==undefined){if(c.alg!==undefined){this.algName=c.alg;if(c.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.MessageDigest.getCanonicalAlgName=function(a){if(typeof a==="string"){a=a.toLowerCase();a=a.replace(/-/,"")}return a};KJUR.crypto.MessageDigest.getHashLength=function(c){var b=KJUR.crypto.MessageDigest;var a=b.getCanonicalAlgName(c);if(b.HASHLENGTH[a]===undefined){throw"not supported algorithm: "+c}return b.HASHLENGTH[a]};KJUR.crypto.MessageDigest.HASHLENGTH={md5:16,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64,ripemd160:20};KJUR.crypto.Mac=function(d){var f=null;var c=null;var a=null;var e=null;var b=null;this.setAlgAndProvider=function(k,i){k=k.toLowerCase();if(k==null){k="hmacsha1"}k=k.toLowerCase();if(k.substr(0,4)!="hmac"){throw"setAlgAndProvider unsupported HMAC alg: "+k}if(i===undefined){i=KJUR.crypto.Util.DEFAULTPROVIDER[k]}this.algProv=k+"/"+i;var g=k.substr(4);if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&i=="cryptojs"){try{var j=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g];this.mac=CryptoJS.algo.HMAC.create(j,this.pass)}catch(h){throw"setAlgAndProvider hash alg set fail hashAlg="+g+"/"+h}this.updateString=function(l){this.mac.update(l)};this.updateHex=function(l){var m=CryptoJS.enc.Hex.parse(l);this.mac.update(m)};this.doFinal=function(){var l=this.mac.finalize();return l.toString(CryptoJS.enc.Hex)};this.doFinalString=function(l){this.updateString(l);return this.doFinal()};this.doFinalHex=function(l){this.updateHex(l);return this.doFinal()}}};this.updateString=function(g){throw"updateString(str) not supported for this alg/prov: "+this.algProv};this.updateHex=function(g){throw"updateHex(hex) not supported for this alg/prov: "+this.algProv};this.doFinal=function(){throw"digest() not supported for this alg/prov: "+this.algProv};this.doFinalString=function(g){throw"digestString(str) not supported for this alg/prov: "+this.algProv};this.doFinalHex=function(g){throw"digestHex(hex) not supported for this alg/prov: "+this.algProv};this.setPassword=function(h){if(typeof h=="string"){var g=h;if(h.length%2==1||!h.match(/^[0-9A-Fa-f]+$/)){g=rstrtohex(h)}this.pass=CryptoJS.enc.Hex.parse(g);return}if(typeof h!="object"){throw"KJUR.crypto.Mac unsupported password type: "+h}var g=null;if(h.hex!==undefined){if(h.hex.length%2!=0||!h.hex.match(/^[0-9A-Fa-f]+$/)){throw"Mac: wrong hex password: "+h.hex}g=h.hex}if(h.utf8!==undefined){g=utf8tohex(h.utf8)}if(h.rstr!==undefined){g=rstrtohex(h.rstr)}if(h.b64!==undefined){g=b64tohex(h.b64)}if(h.b64u!==undefined){g=b64utohex(h.b64u)}if(g==null){throw"KJUR.crypto.Mac unsupported password type: "+h}this.pass=CryptoJS.enc.Hex.parse(g)};if(d!==undefined){if(d.pass!==undefined){this.setPassword(d.pass)}if(d.alg!==undefined){this.algName=d.alg;if(d.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.Signature=function(o){var q=null;var n=null;var r=null;var c=null;var l=null;var d=null;var k=null;var h=null;var p=null;var e=null;var b=-1;var g=null;var j=null;var a=null;var i=null;var f=null;this._setAlgNames=function(){var s=this.algName.match(/^(.+)with(.+)$/);if(s){this.mdAlgName=s[1].toLowerCase();this.pubkeyAlgName=s[2].toLowerCase()}};this._zeroPaddingOfSignature=function(x,w){var v="";var t=w/4-x.length;for(var u=0;u<t;u++){v=v+"0"}return v+x};this.setAlgAndProvider=function(u,t){this._setAlgNames();if(t!="cryptojs/jsrsa"){throw"provider not supported: "+t}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(this.mdAlgName)!=-1){try{this.md=new KJUR.crypto.MessageDigest({alg:this.mdAlgName})}catch(s){throw"setAlgAndProvider hash alg set fail alg="+this.mdAlgName+"/"+s}this.init=function(w,x){var y=null;try{if(x===undefined){y=KEYUTIL.getKey(w)}else{y=KEYUTIL.getKey(w,x)}}catch(v){throw"init failed:"+v}if(y.isPrivate===true){this.prvKey=y;this.state="SIGN"}else{if(y.isPublic===true){this.pubKey=y;this.state="VERIFY"}else{throw"init failed.:"+y}}};this.updateString=function(v){this.md.updateString(v)};this.updateHex=function(v){this.md.updateHex(v)};this.sign=function(){this.sHashHex=this.md.digest();if(typeof this.ecprvhex!="undefined"&&typeof this.eccurvename!="undefined"){var v=new KJUR.crypto.ECDSA({curve:this.eccurvename});this.hSign=v.signHex(this.sHashHex,this.ecprvhex)}else{if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){this.hSign=this.prvKey.signWithMessageHashPSS(this.sHashHex,this.mdAlgName,this.pssSaltLen)}else{if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex,this.mdAlgName)}else{if(this.prvKey instanceof KJUR.crypto.ECDSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{if(this.prvKey instanceof KJUR.crypto.DSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{throw"Signature: unsupported private key alg: "+this.pubkeyAlgName}}}}}return this.hSign};this.signString=function(v){this.updateString(v);return this.sign()};this.signHex=function(v){this.updateHex(v);return this.sign()};this.verify=function(v){this.sHashHex=this.md.digest();if(typeof this.ecpubhex!="undefined"&&typeof this.eccurvename!="undefined"){var w=new KJUR.crypto.ECDSA({curve:this.eccurvename});return w.verifyHex(this.sHashHex,v,this.ecpubhex)}else{if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){return this.pubKey.verifyWithMessageHashPSS(this.sHashHex,v,this.mdAlgName,this.pssSaltLen)}else{if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.ECDSA!==undefined&&this.pubKey instanceof KJUR.crypto.ECDSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.DSA!==undefined&&this.pubKey instanceof KJUR.crypto.DSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{throw"Signature: unsupported public key alg: "+this.pubkeyAlgName}}}}}}}};this.init=function(s,t){throw"init(key, pass) not supported for this alg:prov="+this.algProvName};this.updateString=function(s){throw"updateString(str) not supported for this alg:prov="+this.algProvName};this.updateHex=function(s){throw"updateHex(hex) not supported for this alg:prov="+this.algProvName};this.sign=function(){throw"sign() not supported for this alg:prov="+this.algProvName};this.signString=function(s){throw"digestString(str) not supported for this alg:prov="+this.algProvName};this.signHex=function(s){throw"digestHex(hex) not supported for this alg:prov="+this.algProvName};this.verify=function(s){throw"verify(hSigVal) not supported for this alg:prov="+this.algProvName};this.initParams=o;if(o!==undefined){if(o.alg!==undefined){this.algName=o.alg;if(o.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}else{this.provName=o.prov}this.algProvName=this.algName+":"+this.provName;this.setAlgAndProvider(this.algName,this.provName);this._setAlgNames()}if(o.psssaltlen!==undefined){this.pssSaltLen=o.psssaltlen}if(o.prvkeypem!==undefined){if(o.prvkeypas!==undefined){throw"both prvkeypem and prvkeypas parameters not supported"}else{try{var q=KEYUTIL.getKey(o.prvkeypem);this.init(q)}catch(m){throw"fatal error to load pem private key: "+m}}}}};KJUR.crypto.Cipher=function(a){};KJUR.crypto.Cipher.encrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPublic){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.encrypt(e)}if(c==="RSAOAEP"){return f.encryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.encryptOAEP(e,"sha"+b[1])}throw"Cipher.encrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.encrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.decrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPrivate){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.decrypt(e)}if(c==="RSAOAEP"){return f.decryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.decryptOAEP(e,"sha"+b[1])}throw"Cipher.decrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.decrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.getAlgByKeyAndName=function(b,a){if(b instanceof RSAKey){if(":RSA:RSAOAEP:RSAOAEP224:RSAOAEP256:RSAOAEP384:RSAOAEP512:".indexOf(a)!=-1){return a}if(a===null||a===undefined){return"RSA"}throw"getAlgByKeyAndName: not supported algorithm name for RSAKey: "+a}throw"getAlgByKeyAndName: not supported algorithm name: "+a};KJUR.crypto.OID=new function(){this.oidhex2name={"2a864886f70d010101":"rsaEncryption","2a8648ce3d0201":"ecPublicKey","2a8648ce380401":"dsa","2a8648ce3d030107":"secp256r1","2b8104001f":"secp192k1","2b81040021":"secp224r1","2b8104000a":"secp256k1","2b81040023":"secp521r1","2b81040022":"secp384r1","2a8648ce380403":"SHA1withDSA","608648016503040301":"SHA224withDSA","608648016503040302":"SHA256withDSA",}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECDSA=function(d){var f="secp256r1";var l=null;var b=null;var h=null;var e=BigInteger,g=ECPointFp,j=KJUR.crypto.ECDSA,c=KJUR.crypto.ECParameterDB;var a=new SecureRandom();var k=null;this.type="EC";this.isPrivate=false;this.isPublic=false;function i(t,p,s,o){var n=Math.max(p.bitLength(),o.bitLength());var u=t.add2D(s);var r=t.curve.getInfinity();for(var q=n-1;q>=0;--q){r=r.twice2D();r.z=e.ONE;if(p.testBit(q)){if(o.testBit(q)){r=r.add2D(u)}else{r=r.add2D(t)}}else{if(o.testBit(q)){r=r.add2D(s)}}}return r}this.getBigRandom=function(m){return new e(m.bitLength(),a).mod(m.subtract(e.ONE)).add(e.ONE)};this.setNamedCurve=function(m){this.ecparams=c.getByName(m);this.prvKeyHex=null;this.pubKeyHex=null;this.curveName=m};this.setPrivateKeyHex=function(m){this.isPrivate=true;this.prvKeyHex=m};this.setPublicKeyHex=function(m){this.isPublic=true;this.pubKeyHex=m};this.getPublicKeyXYHex=function(){var o=this.pubKeyHex;if(o.substr(0,2)!=="04"){throw"this method supports uncompressed format(04) only"}var n=this.ecparams.keylen/4;if(o.length!==2+n*2){throw"malformed public key hex length"}var m={};m.x=o.substr(2,n);m.y=o.substr(2+n);return m};this.getShortNISTPCurveName=function(){var m=this.curveName;if(m==="secp256r1"||m==="NIST P-256"||m==="P-256"||m==="prime256v1"){return"P-256"}if(m==="secp384r1"||m==="NIST P-384"||m==="P-384"){return"P-384"}return null};this.generateKeyPairHex=function(){var o=this.ecparams.n;var r=this.getBigRandom(o);var p=this.ecparams.G.multiply(r);var u=p.getX().toBigInteger();var s=p.getY().toBigInteger();var m=this.ecparams.keylen/4;var q=("0000000000"+r.toString(16)).slice(-m);var v=("0000000000"+u.toString(16)).slice(-m);var t=("0000000000"+s.toString(16)).slice(-m);var n="04"+v+t;this.setPrivateKeyHex(q);this.setPublicKeyHex(n);return{ecprvhex:q,ecpubhex:n}};this.signWithMessageHash=function(m){return this.signHex(m,this.prvKeyHex)};this.signHex=function(t,o){var w=new e(o,16);var p=this.ecparams.n;var v=new e(t.substring(0,this.ecparams.keylen/4),16);do{var q=this.getBigRandom(p);var x=this.ecparams.G;var u=x.multiply(q);var m=u.getX().toBigInteger().mod(p)}while(m.compareTo(e.ZERO)<=0);var y=q.modInverse(p).multiply(v.add(w.multiply(m))).mod(p);return j.biRSSigToASN1Sig(m,y)};this.sign=function(q,x){var v=x;var o=this.ecparams.n;var u=e.fromByteArrayUnsigned(q);do{var p=this.getBigRandom(o);var w=this.ecparams.G;var t=w.multiply(p);var m=t.getX().toBigInteger().mod(o)}while(m.compareTo(BigInteger.ZERO)<=0);var y=p.modInverse(o).multiply(u.add(v.multiply(m))).mod(o);return this.serializeSig(m,y)};this.verifyWithMessageHash=function(n,m){return this.verifyHex(n,m,this.pubKeyHex)};this.verifyHex=function(q,m,v){var p,n;var u=j.parseSigHex(m);p=u.r;n=u.s;var o=g.decodeFromHex(this.ecparams.curve,v);var t=new e(q.substring(0,this.ecparams.keylen/4),16);return this.verifyRaw(t,p,n,o)};this.verify=function(u,v,n){var p,m;if(Bitcoin.Util.isArray(v)){var t=this.parseSig(v);p=t.r;m=t.s}else{if("object"===typeof v&&v.r&&v.s){p=v.r;m=v.s}else{throw"Invalid value for signature"}}var o;if(n instanceof ECPointFp){o=n}else{if(Bitcoin.Util.isArray(n)){o=g.decodeFrom(this.ecparams.curve,n)}else{throw"Invalid format for pubkey value, must be byte array or ECPointFp"}}var q=e.fromByteArrayUnsigned(u);return this.verifyRaw(q,p,m,o)};this.verifyRaw=function(u,m,A,t){var q=this.ecparams.n;var z=this.ecparams.G;if(m.compareTo(e.ONE)<0||m.compareTo(q)>=0){return false}if(A.compareTo(e.ONE)<0||A.compareTo(q)>=0){return false}var w=A.modInverse(q);var p=u.multiply(w).mod(q);var o=m.multiply(w).mod(q);var x=z.multiply(p).add(t.multiply(o));var y=x.getX().toBigInteger().mod(q);return y.equals(m)};this.serializeSig=function(o,n){var p=o.toByteArraySigned();var m=n.toByteArraySigned();var q=[];q.push(2);q.push(p.length);q=q.concat(p);q.push(2);q.push(m.length);q=q.concat(m);q.unshift(q.length);q.unshift(48);return q};this.parseSig=function(t){var q;if(t[0]!=48){throw new Error("Signature not a valid DERSequence")}q=2;if(t[q]!=2){throw new Error("First element in signature must be a DERInteger")}var p=t.slice(q+2,q+2+t[q+1]);q+=2+t[q+1];if(t[q]!=2){throw new Error("Second element in signature must be a DERInteger")}var m=t.slice(q+2,q+2+t[q+1]);q+=2+t[q+1];var o=e.fromByteArrayUnsigned(p);var n=e.fromByteArrayUnsigned(m);return{r:o,s:n}};this.parseSigCompact=function(q){if(q.length!==65){throw"Signature has the wrong length"}var m=q[0]-27;if(m<0||m>7){throw"Invalid signature type"}var t=this.ecparams.n;var p=e.fromByteArrayUnsigned(q.slice(1,33)).mod(t);var o=e.fromByteArrayUnsigned(q.slice(33,65)).mod(t);return{r:p,s:o,i:m}};this.readPKCS5PrvKeyHex=function(p){var r=ASN1HEX,q=j.getName,t=r.getVbyList;if(r.isASN1HEX(p)===false){throw"not ASN.1 hex string"}var m,o,s;try{m=t(p,0,[2,0],"06");o=t(p,0,[1],"04");try{s=t(p,0,[3,0],"03").substr(2)}catch(n){}}catch(n){throw"malformed PKCS#1/5 plain ECC private key"}this.curveName=q(m);if(this.curveName===undefined){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(s);this.setPrivateKeyHex(o);this.isPublic=false};this.readPKCS8PrvKeyHex=function(p){var u=ASN1HEX;var m=KJUR.crypto.ECDSA.getName;var r=u.getVbyList;if(u.isASN1HEX(p)===false){throw"not ASN.1 hex string"}var n,t,q,o;try{n=r(p,0,[1,0],"06");t=r(p,0,[1,1],"06");q=r(p,0,[2,0,1],"04");try{o=r(p,0,[2,0,2,0],"03").substr(2)}catch(s){}}catch(s){throw"malformed PKCS#8 plain ECC private key"}this.curveName=m(t);if(this.curveName===undefined){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(o);this.setPrivateKeyHex(q);this.isPublic=false};this.readPKCS8PubKeyHex=function(p){var r=ASN1HEX;var q=KJUR.crypto.ECDSA.getName;var t=r.getVbyList;if(r.isASN1HEX(p)===false){throw"not ASN.1 hex string"}var o,m,s;try{o=t(p,0,[0,0],"06");m=t(p,0,[0,1],"06");s=t(p,0,[1],"03").substr(2)}catch(n){throw"malformed PKCS#8 ECC public key"}this.curveName=q(m);if(this.curveName===null){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(s)};this.readCertPubKeyHex=function(o,t){if(t!==5){t=6}var q=ASN1HEX;var p=j.getName;var s=q.getVbyList;if(q.isASN1HEX(o)===false){throw"not ASN.1 hex string"}var m,r;try{m=s(o,0,[0,t,0,1],"06");r=s(o,0,[0,t,1],"03").substr(2)}catch(n){throw"malformed X.509 certificate ECC public key"}this.curveName=p(m);if(this.curveName===null){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(r)};if(d!==undefined){if(d.curve!==undefined){this.curveName=d.curve}}if(this.curveName===undefined){this.curveName=f}this.setNamedCurve(this.curveName);if(d!==undefined){if(d.prv!==undefined){this.setPrivateKeyHex(d.prv)}if(d.pub!==undefined){this.setPublicKeyHex(d.pub)}}};KJUR.crypto.ECDSA.parseSigHex=function(a){var b=KJUR.crypto.ECDSA.parseSigHexInHexRS(a);var d=new BigInteger(b.r,16);var c=new BigInteger(b.s,16);return{r:d,s:c}};KJUR.crypto.ECDSA.parseSigHexInHexRS=function(f){var j=ASN1HEX,i=j.getChildIdx,g=j.getV;if(f.substr(0,2)!="30"){throw"signature is not a ASN.1 sequence"}var h=i(f,0);if(h.length!=2){throw"number of signature ASN.1 sequence elements seem wrong"}var e=h[0];var d=h[1];if(f.substr(e,2)!="02"){throw"1st item of sequene of signature is not ASN.1 integer"}if(f.substr(d,2)!="02"){throw"2nd item of sequene of signature is not ASN.1 integer"}var c=g(f,e);var b=g(f,d);return{r:c,s:b}};KJUR.crypto.ECDSA.asn1SigToConcatSig=function(c){var d=KJUR.crypto.ECDSA.parseSigHexInHexRS(c);var b=d.r;var a=d.s;if(b.substr(0,2)=="00"&&(b.length%32)==2){b=b.substr(2)}if(a.substr(0,2)=="00"&&(a.length%32)==2){a=a.substr(2)}if((b.length%32)==30){b="00"+b}if((a.length%32)==30){a="00"+a}if(b.length%32!=0){throw"unknown ECDSA sig r length error"}if(a.length%32!=0){throw"unknown ECDSA sig s length error"}return b+a};KJUR.crypto.ECDSA.concatSigToASN1Sig=function(a){if((((a.length/2)*8)%(16*8))!=0){throw"unknown ECDSA concatinated r-s sig  length error"}var c=a.substr(0,a.length/2);var b=a.substr(a.length/2);return KJUR.crypto.ECDSA.hexRSSigToASN1Sig(c,b)};KJUR.crypto.ECDSA.hexRSSigToASN1Sig=function(b,a){var d=new BigInteger(b,16);var c=new BigInteger(a,16);return KJUR.crypto.ECDSA.biRSSigToASN1Sig(d,c)};KJUR.crypto.ECDSA.biRSSigToASN1Sig=function(f,d){var c=KJUR.asn1;var b=new c.DERInteger({bigint:f});var a=new c.DERInteger({bigint:d});var e=new c.DERSequence({array:[b,a]});return e.getEncodedHex()};KJUR.crypto.ECDSA.getName=function(a){if(a==="2b8104001f"){return"secp192k1"}if(a==="2a8648ce3d030107"){return"secp256r1"}if(a==="2b8104000a"){return"secp256k1"}if(a==="2b81040021"){return"secp224r1"}if(a==="2b81040022"){return"secp384r1"}if("|secp256r1|NIST P-256|P-256|prime256v1|".indexOf(a)!==-1){return"secp256r1"}if("|secp256k1|".indexOf(a)!==-1){return"secp256k1"}if("|secp224r1|NIST P-224|P-224|".indexOf(a)!==-1){return"secp224r1"}if("|secp384r1|NIST P-384|P-384|".indexOf(a)!==-1){return"secp384r1"}return null};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECParameterDB=new function(){var b={};var c={};function a(d){return new BigInteger(d,16)}this.getByName=function(e){var d=e;if(typeof c[d]!="undefined"){d=c[e]}if(typeof b[d]!="undefined"){return b[d]}throw"unregistered EC curve name: "+d};this.regist=function(A,l,o,g,m,e,j,f,k,u,d,x){b[A]={};var s=a(o);var z=a(g);var y=a(m);var t=a(e);var w=a(j);var r=new ECCurveFp(s,z,y);var q=r.decodePointHex("04"+f+k);b[A]["name"]=A;b[A]["keylen"]=l;b[A]["curve"]=r;b[A]["G"]=q;b[A]["n"]=t;b[A]["h"]=w;b[A]["oid"]=d;b[A]["info"]=x;for(var v=0;v<u.length;v++){c[u[v]]=A}}};KJUR.crypto.ECParameterDB.regist("secp128r1",128,"FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC","E87579C11079F43DD824993C2CEE5ED3","FFFFFFFE0000000075A30D1B9038A115","1","161FF7528B899B2D0C28607CA52C5B86","CF5AC8395BAFEB13C02DA292DDED7A83",[],"","secp128r1 : SECG curve over a 128 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160k1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73","0","7","0100000000000000000001B8FA16DFAB9ACA16B6B3","1","3B4C382CE37AA192A4019E763036F4F5DD4D7EBB","938CF935318FDCED6BC28286531733C3F03C4FEE",[],"","secp160k1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160r1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC","1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45","0100000000000000000001F4C8F927AED3CA752257","1","4A96B5688EF573284664698968C38BB913CBFC82","23A628553168947D59DCC912042351377AC5FB32",[],"","secp160r1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp192k1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37","0","3","FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D","1","DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D","9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D",[]);KJUR.crypto.ECParameterDB.regist("secp192r1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC","64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1","FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831","1","188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012","07192B95FFC8DA78631011ED6B24CDD573F977A11E794811",[]);KJUR.crypto.ECParameterDB.regist("secp224r1",224,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE","B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4","FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D","1","B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21","BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34",[]);KJUR.crypto.ECParameterDB.regist("secp256k1",256,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F","0","7","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141","1","79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798","483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",[]);KJUR.crypto.ECParameterDB.regist("secp256r1",256,"FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC","5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B","FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551","1","6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296","4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",["NIST P-256","P-256","prime256v1"]);KJUR.crypto.ECParameterDB.regist("secp384r1",384,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC","B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973","1","AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7","3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",["NIST P-384","P-384"]);KJUR.crypto.ECParameterDB.regist("secp521r1",521,"1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC","051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409","1","C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66","011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",["NIST P-521","P-521"]);
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.DSA=function(){this.p=null;this.q=null;this.g=null;this.y=null;this.x=null;this.type="DSA";this.isPrivate=false;this.isPublic=false;this.setPrivate=function(d,c,b,e,a){this.isPrivate=true;this.p=d;this.q=c;this.g=b;this.y=e;this.x=a};this.setPrivateHex=function(d,b,f,i,j){var c,a,e,g,h;c=new BigInteger(d,16);a=new BigInteger(b,16);e=new BigInteger(f,16);if(typeof i==="string"&&i.length>1){g=new BigInteger(i,16)}else{g=null}h=new BigInteger(j,16);this.setPrivate(c,a,e,g,h)};this.setPublic=function(c,b,a,d){this.isPublic=true;this.p=c;this.q=b;this.g=a;this.y=d;this.x=null};this.setPublicHex=function(f,e,d,g){var b,a,h,c;b=new BigInteger(f,16);a=new BigInteger(e,16);h=new BigInteger(d,16);c=new BigInteger(g,16);this.setPublic(b,a,h,c)};this.signWithMessageHash=function(d){var c=this.p;var b=this.q;var f=this.g;var i=this.y;var j=this.x;var e=KJUR.crypto.Util.getRandomBigIntegerMinToMax(BigInteger.ONE.add(BigInteger.ONE),b.subtract(BigInteger.ONE));var l=d.substr(0,b.bitLength()/4);var h=new BigInteger(l,16);var a=(f.modPow(e,c)).mod(b);var n=(e.modInverse(b).multiply(h.add(j.multiply(a)))).mod(b);var m=KJUR.asn1.ASN1Util.jsonToASN1HEX({seq:[{"int":{bigint:a}},{"int":{bigint:n}}]});return m};this.verifyWithMessageHash=function(h,f){var d=this.p;var b=this.q;var j=this.g;var l=this.y;var i=this.parseASN1Signature(f);var a=i[0];var t=i[1];var o=h.substr(0,b.bitLength()/4);var k=new BigInteger(o,16);if(BigInteger.ZERO.compareTo(a)>0||a.compareTo(b)>0){throw"invalid DSA signature"}if(BigInteger.ZERO.compareTo(t)>=0||t.compareTo(b)>0){throw"invalid DSA signature"}var m=t.modInverse(b);var e=k.multiply(m).mod(b);var c=a.multiply(m).mod(b);var n=j.modPow(e,d).multiply(l.modPow(c,d)).mod(d).mod(b);return n.compareTo(a)==0};this.parseASN1Signature=function(a){try{var d=new BigInteger(ASN1HEX.getVbyList(a,0,[0],"02"),16);var c=new BigInteger(ASN1HEX.getVbyList(a,0,[1],"02"),16);return[d,c]}catch(b){throw"malformed ASN.1 DSA signature"}};this.readPKCS5PrvKeyHex=function(c){var b,a,f,g,i;var j=ASN1HEX;var d=j.getVbyList;if(j.isASN1HEX(c)===false){throw"not ASN.1 hex string"}try{b=d(c,0,[1],"02");a=d(c,0,[2],"02");f=d(c,0,[3],"02");g=d(c,0,[4],"02");i=d(c,0,[5],"02")}catch(e){console.log("EXCEPTION:"+e);throw"malformed PKCS#1/5 plain DSA private key"}this.setPrivateHex(b,a,f,g,i)};this.readPKCS8PrvKeyHex=function(d){var f,c,b,g;var e=ASN1HEX;var i=e.getVbyList;if(e.isASN1HEX(d)===false){throw"not ASN.1 hex string"}try{f=i(d,0,[1,1,0],"02");c=i(d,0,[1,1,1],"02");b=i(d,0,[1,1,2],"02");g=i(d,0,[2,0],"02")}catch(a){console.log("EXCEPTION:"+a);throw"malformed PKCS#8 plain DSA private key"}this.setPrivateHex(f,c,b,null,g)};this.readPKCS8PubKeyHex=function(d){var f,c,b,g;var e=ASN1HEX;var i=e.getVbyList;if(e.isASN1HEX(d)===false){throw"not ASN.1 hex string"}try{f=i(d,0,[0,1,0],"02");c=i(d,0,[0,1,1],"02");b=i(d,0,[0,1,2],"02");g=i(d,0,[1,0],"02")}catch(a){console.log("EXCEPTION:"+a);throw"malformed PKCS#8 DSA public key"}this.setPublicHex(f,c,b,g)};this.readCertPubKeyHex=function(c,f){if(f!==5){f=6}var b,a,g,i;var j=ASN1HEX;var d=j.getVbyList;if(j.isASN1HEX(c)===false){throw"not ASN.1 hex string"}try{b=d(c,0,[0,f,0,1,0],"02");a=d(c,0,[0,f,0,1,1],"02");g=d(c,0,[0,f,0,1,2],"02");i=d(c,0,[0,f,1,0],"02")}catch(e){console.log("EXCEPTION:"+e);throw"malformed X.509 certificate DSA public key"}this.setPublicHex(b,a,g,i)}};
var KEYUTIL=function(){var d=function(p,r,q){return k(CryptoJS.AES,p,r,q)};var e=function(p,r,q){return k(CryptoJS.TripleDES,p,r,q)};var a=function(p,r,q){return k(CryptoJS.DES,p,r,q)};var k=function(s,x,u,q){var r=CryptoJS.enc.Hex.parse(x);var w=CryptoJS.enc.Hex.parse(u);var p=CryptoJS.enc.Hex.parse(q);var t={};t.key=w;t.iv=p;t.ciphertext=r;var v=s.decrypt(t,w,{iv:p});return CryptoJS.enc.Hex.stringify(v)};var l=function(p,r,q){return g(CryptoJS.AES,p,r,q)};var o=function(p,r,q){return g(CryptoJS.TripleDES,p,r,q)};var f=function(p,r,q){return g(CryptoJS.DES,p,r,q)};var g=function(t,y,v,q){var s=CryptoJS.enc.Hex.parse(y);var x=CryptoJS.enc.Hex.parse(v);var p=CryptoJS.enc.Hex.parse(q);var w=t.encrypt(s,x,{iv:p});var r=CryptoJS.enc.Hex.parse(w.toString());var u=CryptoJS.enc.Base64.stringify(r);return u};var i={"AES-256-CBC":{proc:d,eproc:l,keylen:32,ivlen:16},"AES-192-CBC":{proc:d,eproc:l,keylen:24,ivlen:16},"AES-128-CBC":{proc:d,eproc:l,keylen:16,ivlen:16},"DES-EDE3-CBC":{proc:e,eproc:o,keylen:24,ivlen:8},"DES-CBC":{proc:a,eproc:f,keylen:8,ivlen:8}};var c=function(p){return i[p]["proc"]};var m=function(p){var r=CryptoJS.lib.WordArray.random(p);var q=CryptoJS.enc.Hex.stringify(r);return q};var n=function(v){var w={};var q=v.match(new RegExp("DEK-Info: ([^,]+),([0-9A-Fa-f]+)","m"));if(q){w.cipher=q[1];w.ivsalt=q[2]}var p=v.match(new RegExp("-----BEGIN ([A-Z]+) PRIVATE KEY-----"));if(p){w.type=p[1]}var u=-1;var x=0;if(v.indexOf("\r\n\r\n")!=-1){u=v.indexOf("\r\n\r\n");x=2}if(v.indexOf("\n\n")!=-1){u=v.indexOf("\n\n");x=1}var t=v.indexOf("-----END");if(u!=-1&&t!=-1){var r=v.substring(u+x*2,t-x);r=r.replace(/\s+/g,"");w.data=r}return w};var j=function(q,y,p){var v=p.substring(0,16);var t=CryptoJS.enc.Hex.parse(v);var r=CryptoJS.enc.Utf8.parse(y);var u=i[q]["keylen"]+i[q]["ivlen"];var x="";var w=null;for(;;){var s=CryptoJS.algo.MD5.create();if(w!=null){s.update(w)}s.update(r);s.update(t);w=s.finalize();x=x+CryptoJS.enc.Hex.stringify(w);if(x.length>=u*2){break}}var z={};z.keyhex=x.substr(0,i[q]["keylen"]*2);z.ivhex=x.substr(i[q]["keylen"]*2,i[q]["ivlen"]*2);return z};var b=function(p,v,r,w){var s=CryptoJS.enc.Base64.parse(p);var q=CryptoJS.enc.Hex.stringify(s);var u=i[v]["proc"];var t=u(q,r,w);return t};var h=function(p,s,q,u){var r=i[s]["eproc"];var t=r(p,q,u);return t};return{version:"1.0.0",parsePKCS5PEM:function(p){return n(p)},getKeyAndUnusedIvByPasscodeAndIvsalt:function(q,p,r){return j(q,p,r)},decryptKeyB64:function(p,r,q,s){return b(p,r,q,s)},getDecryptedKeyHex:function(y,x){var q=n(y);var t=q.type;var r=q.cipher;var p=q.ivsalt;var s=q.data;var w=j(r,x,p);var v=w.keyhex;var u=b(s,r,v,p);return u},getEncryptedPKCS5PEMFromPrvKeyHex:function(x,s,A,t,r){var p="";if(typeof t=="undefined"||t==null){t="AES-256-CBC"}if(typeof i[t]=="undefined"){throw"KEYUTIL unsupported algorithm: "+t}if(typeof r=="undefined"||r==null){var v=i[t]["ivlen"];var u=m(v);r=u.toUpperCase()}var z=j(t,A,r);var y=z.keyhex;var w=h(s,t,y,r);var q=w.replace(/(.{64})/g,"$1\r\n");var p="-----BEGIN "+x+" PRIVATE KEY-----\r\n";p+="Proc-Type: 4,ENCRYPTED\r\n";p+="DEK-Info: "+t+","+r+"\r\n";p+="\r\n";p+=q;p+="\r\n-----END "+x+" PRIVATE KEY-----\r\n";return p},parseHexOfEncryptedPKCS8:function(y){var B=ASN1HEX;var z=B.getChildIdx;var w=B.getV;var t={};var r=z(y,0);if(r.length!=2){throw"malformed format: SEQUENCE(0).items != 2: "+r.length}t.ciphertext=w(y,r[1]);var A=z(y,r[0]);if(A.length!=2){throw"malformed format: SEQUENCE(0.0).items != 2: "+A.length}if(w(y,A[0])!="2a864886f70d01050d"){throw"this only supports pkcs5PBES2"}var p=z(y,A[1]);if(A.length!=2){throw"malformed format: SEQUENCE(0.0.1).items != 2: "+p.length}var q=z(y,p[1]);if(q.length!=2){throw"malformed format: SEQUENCE(0.0.1.1).items != 2: "+q.length}if(w(y,q[0])!="2a864886f70d0307"){throw"this only supports TripleDES"}t.encryptionSchemeAlg="TripleDES";t.encryptionSchemeIV=w(y,q[1]);var s=z(y,p[0]);if(s.length!=2){throw"malformed format: SEQUENCE(0.0.1.0).items != 2: "+s.length}if(w(y,s[0])!="2a864886f70d01050c"){throw"this only supports pkcs5PBKDF2"}var x=z(y,s[1]);if(x.length<2){throw"malformed format: SEQUENCE(0.0.1.0.1).items < 2: "+x.length}t.pbkdf2Salt=w(y,x[0]);var u=w(y,x[1]);try{t.pbkdf2Iter=parseInt(u,16)}catch(v){throw"malformed format pbkdf2Iter: "+u}return t},getPBKDF2KeyHexFromParam:function(u,p){var t=CryptoJS.enc.Hex.parse(u.pbkdf2Salt);var q=u.pbkdf2Iter;var s=CryptoJS.PBKDF2(p,t,{keySize:192/32,iterations:q});var r=CryptoJS.enc.Hex.stringify(s);return r},_getPlainPKCS8HexFromEncryptedPKCS8PEM:function(x,y){var r=pemtohex(x,"ENCRYPTED PRIVATE KEY");var p=this.parseHexOfEncryptedPKCS8(r);var u=KEYUTIL.getPBKDF2KeyHexFromParam(p,y);var v={};v.ciphertext=CryptoJS.enc.Hex.parse(p.ciphertext);var t=CryptoJS.enc.Hex.parse(u);var s=CryptoJS.enc.Hex.parse(p.encryptionSchemeIV);var w=CryptoJS.TripleDES.decrypt(v,t,{iv:s});var q=CryptoJS.enc.Hex.stringify(w);return q},getKeyFromEncryptedPKCS8PEM:function(s,q){var p=this._getPlainPKCS8HexFromEncryptedPKCS8PEM(s,q);var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},parsePlainPrivatePKCS8Hex:function(s){var v=ASN1HEX;var u=v.getChildIdx;var t=v.getV;var q={};q.algparam=null;if(s.substr(0,2)!="30"){throw"malformed plain PKCS8 private key(code:001)"}var r=u(s,0);if(r.length!=3){throw"malformed plain PKCS8 private key(code:002)"}if(s.substr(r[1],2)!="30"){throw"malformed PKCS8 private key(code:003)"}var p=u(s,r[1]);if(p.length!=2){throw"malformed PKCS8 private key(code:004)"}if(s.substr(p[0],2)!="06"){throw"malformed PKCS8 private key(code:005)"}q.algoid=t(s,p[0]);if(s.substr(p[1],2)=="06"){q.algparam=t(s,p[1])}if(s.substr(r[2],2)!="04"){throw"malformed PKCS8 private key(code:006)"}q.keyidx=v.getVidx(s,r[2]);return q},getKeyFromPlainPrivatePKCS8PEM:function(q){var p=pemtohex(q,"PRIVATE KEY");var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},getKeyFromPlainPrivatePKCS8Hex:function(p){var q=this.parsePlainPrivatePKCS8Hex(p);var r;if(q.algoid=="2a864886f70d010101"){r=new RSAKey()}else{if(q.algoid=="2a8648ce380401"){r=new KJUR.crypto.DSA()}else{if(q.algoid=="2a8648ce3d0201"){r=new KJUR.crypto.ECDSA()}else{throw"unsupported private key algorithm"}}}r.readPKCS8PrvKeyHex(p);return r},_getKeyFromPublicPKCS8Hex:function(q){var p;var r=ASN1HEX.getVbyList(q,0,[0,0],"06");if(r==="2a864886f70d010101"){p=new RSAKey()}else{if(r==="2a8648ce380401"){p=new KJUR.crypto.DSA()}else{if(r==="2a8648ce3d0201"){p=new KJUR.crypto.ECDSA()}else{throw"unsupported PKCS#8 public key hex"}}}p.readPKCS8PubKeyHex(q);return p},parsePublicRawRSAKeyHex:function(r){var u=ASN1HEX;var t=u.getChildIdx;var s=u.getV;var p={};if(r.substr(0,2)!="30"){throw"malformed RSA key(code:001)"}var q=t(r,0);if(q.length!=2){throw"malformed RSA key(code:002)"}if(r.substr(q[0],2)!="02"){throw"malformed RSA key(code:003)"}p.n=s(r,q[0]);if(r.substr(q[1],2)!="02"){throw"malformed RSA key(code:004)"}p.e=s(r,q[1]);return p},parsePublicPKCS8Hex:function(t){var v=ASN1HEX;var u=v.getChildIdx;var s=v.getV;var q={};q.algparam=null;var r=u(t,0);if(r.length!=2){throw"outer DERSequence shall have 2 elements: "+r.length}var w=r[0];if(t.substr(w,2)!="30"){throw"malformed PKCS8 public key(code:001)"}var p=u(t,w);if(p.length!=2){throw"malformed PKCS8 public key(code:002)"}if(t.substr(p[0],2)!="06"){throw"malformed PKCS8 public key(code:003)"}q.algoid=s(t,p[0]);if(t.substr(p[1],2)=="06"){q.algparam=s(t,p[1])}else{if(t.substr(p[1],2)=="30"){q.algparam={};q.algparam.p=v.getVbyList(t,p[1],[0],"02");q.algparam.q=v.getVbyList(t,p[1],[1],"02");q.algparam.g=v.getVbyList(t,p[1],[2],"02")}}if(t.substr(r[1],2)!="03"){throw"malformed PKCS8 public key(code:004)"}q.key=s(t,r[1]).substr(2);return q},}}();KEYUTIL.getKey=function(l,k,n){var G=ASN1HEX,L=G.getChildIdx,v=G.getV,d=G.getVbyList,c=KJUR.crypto,i=c.ECDSA,C=c.DSA,w=RSAKey,M=pemtohex,F=KEYUTIL;if(typeof w!="undefined"&&l instanceof w){return l}if(typeof i!="undefined"&&l instanceof i){return l}if(typeof C!="undefined"&&l instanceof C){return l}if(l.curve!==undefined&&l.xy!==undefined&&l.d===undefined){return new i({pub:l.xy,curve:l.curve})}if(l.curve!==undefined&&l.d!==undefined){return new i({prv:l.d,curve:l.curve})}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(l.n,l.e);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.co!==undefined&&l.qi===undefined){var P=new w();P.setPrivateEx(l.n,l.e,l.d,l.p,l.q,l.dp,l.dq,l.co);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p===undefined){var P=new w();P.setPrivate(l.n,l.e,l.d);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x===undefined){var P=new C();P.setPublic(l.p,l.q,l.g,l.y);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x!==undefined){var P=new C();P.setPrivate(l.p,l.q,l.g,l.y,l.x);return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(b64utohex(l.n),b64utohex(l.e));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.qi!==undefined){var P=new w();P.setPrivateEx(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d),b64utohex(l.p),b64utohex(l.q),b64utohex(l.dp),b64utohex(l.dq),b64utohex(l.qi));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined){var P=new w();P.setPrivate(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d));return P}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d===undefined){var j=new i({curve:l.crv});var t=j.ecparams.keylen/4;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;j.setPublicKeyHex(u);return j}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d!==undefined){var j=new i({curve:l.crv});var t=j.ecparams.keylen/4;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;var b=("0000000000"+b64utohex(l.d)).slice(-t);j.setPublicKeyHex(u);j.setPrivateKeyHex(b);return j}if(n==="pkcs5prv"){var J=l,G=ASN1HEX,N,P;N=L(J,0);if(N.length===9){P=new w();P.readPKCS5PrvKeyHex(J)}else{if(N.length===6){P=new C();P.readPKCS5PrvKeyHex(J)}else{if(N.length>2&&J.substr(N[1],2)==="04"){P=new i();P.readPKCS5PrvKeyHex(J)}else{throw"unsupported PKCS#1/5 hexadecimal key"}}}return P}if(n==="pkcs8prv"){var P=F.getKeyFromPlainPrivatePKCS8Hex(l);return P}if(n==="pkcs8pub"){return F._getKeyFromPublicPKCS8Hex(l)}if(n==="x509pub"){return X509.getPublicKeyFromCertHex(l)}if(l.indexOf("-END CERTIFICATE-",0)!=-1||l.indexOf("-END X509 CERTIFICATE-",0)!=-1||l.indexOf("-END TRUSTED CERTIFICATE-",0)!=-1){return X509.getPublicKeyFromCertPEM(l)}if(l.indexOf("-END PUBLIC KEY-")!=-1){var O=pemtohex(l,"PUBLIC KEY");return F._getKeyFromPublicPKCS8Hex(O)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var m=M(l,"RSA PRIVATE KEY");return F.getKey(m,null,"pkcs5prv")}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var I=M(l,"DSA PRIVATE KEY");var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END EC PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var m=M(l,"EC PRIVATE KEY");return F.getKey(m,null,"pkcs5prv")}if(l.indexOf("-END PRIVATE KEY-")!=-1){return F.getKeyFromPlainPrivatePKCS8PEM(l)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var o=F.getDecryptedKeyHex(l,k);var H=new RSAKey();H.readPKCS5PrvKeyHex(o);return H}if(l.indexOf("-END EC PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var P=d(I,0,[1],"04");var f=d(I,0,[2,0],"06");var A=d(I,0,[3,0],"03").substr(2);var e="";if(KJUR.crypto.OID.oidhex2name[f]!==undefined){e=KJUR.crypto.OID.oidhex2name[f]}else{throw"undefined OID(hex) in KJUR.crypto.OID: "+f}var j=new i({curve:e});j.setPublicKeyHex(A);j.setPrivateKeyHex(P);j.isPublic=false;return j}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END ENCRYPTED PRIVATE KEY-")!=-1){return F.getKeyFromEncryptedPKCS8PEM(l,k)}throw"not supported argument"};KEYUTIL.generateKeypair=function(a,c){if(a=="RSA"){var b=c;var h=new RSAKey();h.generate(b,"10001");h.isPrivate=true;h.isPublic=true;var f=new RSAKey();var e=h.n.toString(16);var i=h.e.toString(16);f.setPublic(e,i);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{if(a=="EC"){var d=c;var g=new KJUR.crypto.ECDSA({curve:d});var j=g.generateKeyPairHex();var h=new KJUR.crypto.ECDSA({curve:d});h.setPublicKeyHex(j.ecpubhex);h.setPrivateKeyHex(j.ecprvhex);h.isPrivate=true;h.isPublic=false;var f=new KJUR.crypto.ECDSA({curve:d});f.setPublicKeyHex(j.ecpubhex);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{throw"unknown algorithm: "+a}}};KEYUTIL.getPEM=function(b,D,y,m,q,j){var F=KJUR,k=F.asn1,z=k.DERObjectIdentifier,f=k.DERInteger,l=k.ASN1Util.newObject,a=k.x509,C=a.SubjectPublicKeyInfo,e=F.crypto,u=e.DSA,r=e.ECDSA,n=RSAKey;function A(s){var G=l({seq:[{"int":0},{"int":{bigint:s.n}},{"int":s.e},{"int":{bigint:s.d}},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.dmp1}},{"int":{bigint:s.dmq1}},{"int":{bigint:s.coeff}}]});return G}function B(G){var s=l({seq:[{"int":1},{octstr:{hex:G.prvKeyHex}},{tag:["a0",true,{oid:{name:G.curveName}}]},{tag:["a1",true,{bitstr:{hex:"00"+G.pubKeyHex}}]}]});return s}function x(s){var G=l({seq:[{"int":0},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.g}},{"int":{bigint:s.y}},{"int":{bigint:s.x}}]});return G}if(((n!==undefined&&b instanceof n)||(u!==undefined&&b instanceof u)||(r!==undefined&&b instanceof r))&&b.isPublic==true&&(D===undefined||D=="PKCS8PUB")){var E=new C(b);var w=E.getEncodedHex();return hextopem(w,"PUBLIC KEY")}if(D=="PKCS1PRV"&&n!==undefined&&b instanceof n&&(y===undefined||y==null)&&b.isPrivate==true){var E=A(b);var w=E.getEncodedHex();return hextopem(w,"RSA PRIVATE KEY")}if(D=="PKCS1PRV"&&r!==undefined&&b instanceof r&&(y===undefined||y==null)&&b.isPrivate==true){var i=new z({name:b.curveName});var v=i.getEncodedHex();var h=B(b);var t=h.getEncodedHex();var p="";p+=hextopem(v,"EC PARAMETERS");p+=hextopem(t,"EC PRIVATE KEY");return p}if(D=="PKCS1PRV"&&u!==undefined&&b instanceof u&&(y===undefined||y==null)&&b.isPrivate==true){var E=x(b);var w=E.getEncodedHex();return hextopem(w,"DSA PRIVATE KEY")}if(D=="PKCS5PRV"&&n!==undefined&&b instanceof n&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=A(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("RSA",w,y,m,j)}if(D=="PKCS5PRV"&&r!==undefined&&b instanceof r&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=B(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("EC",w,y,m,j)}if(D=="PKCS5PRV"&&u!==undefined&&b instanceof u&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=x(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("DSA",w,y,m,j)}var o=function(G,s){var I=c(G,s);var H=new l({seq:[{seq:[{oid:{name:"pkcs5PBES2"}},{seq:[{seq:[{oid:{name:"pkcs5PBKDF2"}},{seq:[{octstr:{hex:I.pbkdf2Salt}},{"int":I.pbkdf2Iter}]}]},{seq:[{oid:{name:"des-EDE3-CBC"}},{octstr:{hex:I.encryptionSchemeIV}}]}]}]},{octstr:{hex:I.ciphertext}}]});return H.getEncodedHex()};var c=function(N,O){var H=100;var M=CryptoJS.lib.WordArray.random(8);var L="DES-EDE3-CBC";var s=CryptoJS.lib.WordArray.random(8);var I=CryptoJS.PBKDF2(O,M,{keySize:192/32,iterations:H});var J=CryptoJS.enc.Hex.parse(N);var K=CryptoJS.TripleDES.encrypt(J,I,{iv:s})+"";var G={};G.ciphertext=K;G.pbkdf2Salt=CryptoJS.enc.Hex.stringify(M);G.pbkdf2Iter=H;G.encryptionSchemeAlg=L;G.encryptionSchemeIV=CryptoJS.enc.Hex.stringify(s);return G};if(D=="PKCS8PRV"&&n!=undefined&&b instanceof n&&b.isPrivate==true){var g=A(b);var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"rsaEncryption"}},{"null":true}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&r!==undefined&&b instanceof r&&b.isPrivate==true){var g=new l({seq:[{"int":1},{octstr:{hex:b.prvKeyHex}},{tag:["a1",true,{bitstr:{hex:"00"+b.pubKeyHex}}]}]});var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"ecPublicKey"}},{oid:{name:b.curveName}}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&u!==undefined&&b instanceof u&&b.isPrivate==true){var g=new f({bigint:b.x});var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"dsa"}},{seq:[{"int":{bigint:b.p}},{"int":{bigint:b.q}},{"int":{bigint:b.g}}]}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}throw"unsupported object nor format"};KEYUTIL.getKeyFromCSRPEM=function(b){var a=pemtohex(b,"CERTIFICATE REQUEST");var c=KEYUTIL.getKeyFromCSRHex(a);return c};KEYUTIL.getKeyFromCSRHex=function(a){var c=KEYUTIL.parseCSRHex(a);var b=KEYUTIL.getKey(c.p8pubkeyhex,null,"pkcs8pub");return b};KEYUTIL.parseCSRHex=function(d){var i=ASN1HEX;var f=i.getChildIdx;var c=i.getTLV;var b={};var g=d;if(g.substr(0,2)!="30"){throw"malformed CSR(code:001)"}var e=f(g,0);if(e.length<1){throw"malformed CSR(code:002)"}if(g.substr(e[0],2)!="30"){throw"malformed CSR(code:003)"}var a=f(g,e[0]);if(a.length<3){throw"malformed CSR(code:004)"}b.p8pubkeyhex=c(g,a[2]);return b};KEYUTIL.getJWKFromKey=function(d){var b={};if(d instanceof RSAKey&&d.isPrivate){b.kty="RSA";b.n=hextob64u(d.n.toString(16));b.e=hextob64u(d.e.toString(16));b.d=hextob64u(d.d.toString(16));b.p=hextob64u(d.p.toString(16));b.q=hextob64u(d.q.toString(16));b.dp=hextob64u(d.dmp1.toString(16));b.dq=hextob64u(d.dmq1.toString(16));b.qi=hextob64u(d.coeff.toString(16));return b}else{if(d instanceof RSAKey&&d.isPublic){b.kty="RSA";b.n=hextob64u(d.n.toString(16));b.e=hextob64u(d.e.toString(16));return b}else{if(d instanceof KJUR.crypto.ECDSA&&d.isPrivate){var a=d.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"){throw"unsupported curve name for JWT: "+a}var c=d.getPublicKeyXYHex();b.kty="EC";b.crv=a;b.x=hextob64u(c.x);b.y=hextob64u(c.y);b.d=hextob64u(d.prvKeyHex);return b}else{if(d instanceof KJUR.crypto.ECDSA&&d.isPublic){var a=d.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"){throw"unsupported curve name for JWT: "+a}var c=d.getPublicKeyXYHex();b.kty="EC";b.crv=a;b.x=hextob64u(c.x);b.y=hextob64u(c.y);return b}}}}throw"not supported key object"};
RSAKey.getPosArrayOfChildrenFromHex=function(a){return ASN1HEX.getChildIdx(a,0)};RSAKey.getHexValueArrayOfChildrenFromHex=function(f){var n=ASN1HEX;var i=n.getV;var k=RSAKey.getPosArrayOfChildrenFromHex(f);var e=i(f,k[0]);var j=i(f,k[1]);var b=i(f,k[2]);var c=i(f,k[3]);var h=i(f,k[4]);var g=i(f,k[5]);var m=i(f,k[6]);var l=i(f,k[7]);var d=i(f,k[8]);var k=new Array();k.push(e,j,b,c,h,g,m,l,d);return k};RSAKey.prototype.readPrivateKeyFromPEMString=function(d){var c=pemtohex(d);var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS5PrvKeyHex=function(c){var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS8PrvKeyHex=function(e){var c,j,l,b,a,f,d,k;var m=ASN1HEX;var g=m.getVbyList;if(m.isASN1HEX(e)===false){throw"not ASN.1 hex string"}try{c=g(e,0,[2,0,1],"02");j=g(e,0,[2,0,2],"02");l=g(e,0,[2,0,3],"02");b=g(e,0,[2,0,4],"02");a=g(e,0,[2,0,5],"02");f=g(e,0,[2,0,6],"02");d=g(e,0,[2,0,7],"02");k=g(e,0,[2,0,8],"02")}catch(i){throw"malformed PKCS#8 plain RSA private key"}this.setPrivateEx(c,j,l,b,a,f,d,k)};RSAKey.prototype.readPKCS5PubKeyHex=function(c){var e=ASN1HEX;var b=e.getV;if(e.isASN1HEX(c)===false){throw"keyHex is not ASN.1 hex string"}var a=e.getChildIdx(c,0);if(a.length!==2||c.substr(a[0],2)!=="02"||c.substr(a[1],2)!=="02"){throw"wrong hex for PKCS#5 public key"}var f=b(c,a[0]);var d=b(c,a[1]);this.setPublic(f,d)};RSAKey.prototype.readPKCS8PubKeyHex=function(b){var c=ASN1HEX;if(c.isASN1HEX(b)===false){throw"not ASN.1 hex string"}if(c.getTLVbyList(b,0,[0,0])!=="06092a864886f70d010101"){throw"not PKCS8 RSA public key"}var a=c.getTLVbyList(b,0,[1,0]);this.readPKCS5PubKeyHex(a)};RSAKey.prototype.readCertPubKeyHex=function(b,d){var a,c;a=new X509();a.readCertHex(b);c=a.getPublicKeyHex();this.readPKCS8PubKeyHex(c)};
var _RE_HEXDECONLY=new RegExp("[^0-9a-f]","gi");function _rsasign_getHexPaddedDigestInfoForString(d,e,a){var b=function(f){return KJUR.crypto.Util.hashString(f,a)};var c=b(d);return KJUR.crypto.Util.getPaddedDigestInfoHex(c,a,e)}function _zeroPaddingOfSignature(e,d){var c="";var a=d/4-e.length;for(var b=0;b<a;b++){c=c+"0"}return c+e}RSAKey.prototype.sign=function(d,a){var b=function(e){return KJUR.crypto.Util.hashString(e,a)};var c=b(d);return this.signWithMessageHash(c,a)};RSAKey.prototype.signWithMessageHash=function(e,c){var f=KJUR.crypto.Util.getPaddedDigestInfoHex(e,c,this.n.bitLength());var b=parseBigInt(f,16);var d=this.doPrivate(b);var a=d.toString(16);return _zeroPaddingOfSignature(a,this.n.bitLength())};function pss_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=hextorstr(e(rstrtohex(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]))));d+=1}return b}RSAKey.prototype.signPSS=function(e,a,d){var c=function(f){return KJUR.crypto.Util.hashHex(f,a)};var b=c(rstrtohex(e));if(d===undefined){d=-1}return this.signWithMessageHashPSS(b,a,d)};RSAKey.prototype.signWithMessageHashPSS=function(l,a,k){var b=hextorstr(l);var g=b.length;var m=this.n.bitLength()-1;var c=Math.ceil(m/8);var d;var o=function(i){return KJUR.crypto.Util.hashHex(i,a)};if(k===-1||k===undefined){k=g}else{if(k===-2){k=c-g-2}else{if(k<-2){throw"invalid salt length"}}}if(c<(g+k+2)){throw"data too long"}var f="";if(k>0){f=new Array(k);new SecureRandom().nextBytes(f);f=String.fromCharCode.apply(String,f)}var n=hextorstr(o(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+b+f)));var j=[];for(d=0;d<c-k-g-2;d+=1){j[d]=0}var e=String.fromCharCode.apply(String,j)+"\x01"+f;var h=pss_mgf1_str(n,e.length,o);var q=[];for(d=0;d<e.length;d+=1){q[d]=e.charCodeAt(d)^h.charCodeAt(d)}var p=(65280>>(8*c-m))&255;q[0]&=~p;for(d=0;d<g;d++){q.push(n.charCodeAt(d))}q.push(188);return _zeroPaddingOfSignature(this.doPrivate(new BigInteger(q)).toString(16),this.n.bitLength())};function _rsasign_getDecryptSignatureBI(a,d,c){var b=new RSAKey();b.setPublic(d,c);var e=b.doPublic(a);return e}function _rsasign_getHexDigestInfoFromSig(a,c,b){var e=_rsasign_getDecryptSignatureBI(a,c,b);var d=e.toString(16).replace(/^1f+00/,"");return d}function _rsasign_getAlgNameAndHashFromHexDisgestInfo(f){for(var e in KJUR.crypto.Util.DIGESTINFOHEAD){var d=KJUR.crypto.Util.DIGESTINFOHEAD[e];var b=d.length;if(f.substring(0,b)==d){var c=[e,f.substring(b)];return c}}return[]}RSAKey.prototype.verify=function(f,j){j=j.replace(_RE_HEXDECONLY,"");j=j.replace(/[ \n]+/g,"");var b=parseBigInt(j,16);if(b.bitLength()>this.n.bitLength()){return 0}var i=this.doPublic(b);var e=i.toString(16).replace(/^1f+00/,"");var g=_rsasign_getAlgNameAndHashFromHexDisgestInfo(e);if(g.length==0){return false}var d=g[0];var h=g[1];var a=function(k){return KJUR.crypto.Util.hashString(k,d)};var c=a(f);return(h==c)};RSAKey.prototype.verifyWithMessageHash=function(e,a){a=a.replace(_RE_HEXDECONLY,"");a=a.replace(/[ \n]+/g,"");var b=parseBigInt(a,16);if(b.bitLength()>this.n.bitLength()){return 0}var h=this.doPublic(b);var g=h.toString(16).replace(/^1f+00/,"");var c=_rsasign_getAlgNameAndHashFromHexDisgestInfo(g);if(c.length==0){return false}var d=c[0];var f=c[1];return(f==e)};RSAKey.prototype.verifyPSS=function(c,b,a,f){var e=function(g){return KJUR.crypto.Util.hashHex(g,a)};var d=e(rstrtohex(c));if(f===undefined){f=-1}return this.verifyWithMessageHashPSS(d,b,a,f)};RSAKey.prototype.verifyWithMessageHashPSS=function(f,s,l,c){var k=new BigInteger(s,16);if(k.bitLength()>this.n.bitLength()){return false}var r=function(i){return KJUR.crypto.Util.hashHex(i,l)};var j=hextorstr(f);var h=j.length;var g=this.n.bitLength()-1;var m=Math.ceil(g/8);var q;if(c===-1||c===undefined){c=h}else{if(c===-2){c=m-h-2}else{if(c<-2){throw"invalid salt length"}}}if(m<(h+c+2)){throw"data too long"}var a=this.doPublic(k).toByteArray();for(q=0;q<a.length;q+=1){a[q]&=255}while(a.length<m){a.unshift(0)}if(a[m-1]!==188){throw"encoded message does not end in 0xbc"}a=String.fromCharCode.apply(String,a);var d=a.substr(0,m-h-1);var e=a.substr(d.length,h);var p=(65280>>(8*m-g))&255;if((d.charCodeAt(0)&p)!==0){throw"bits beyond keysize not zero"}var n=pss_mgf1_str(e,d.length,r);var o=[];for(q=0;q<d.length;q+=1){o[q]=d.charCodeAt(q)^n.charCodeAt(q)}o[0]&=~p;var b=m-h-c-2;for(q=0;q<b;q+=1){if(o[q]!==0){throw"leftmost octets not zero"}}if(o[b]!==1){throw"0x01 marker not found"}return e===hextorstr(r(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+j+String.fromCharCode.apply(String,o.slice(-c)))))};RSAKey.SALT_LEN_HLEN=-1;RSAKey.SALT_LEN_MAX=-2;RSAKey.SALT_LEN_RECOVER=-2;
function X509(){var k=ASN1HEX,j=k.getChildIdx,h=k.getV,b=k.getTLV,f=k.getVbyList,c=k.getTLVbyList,g=k.getIdxbyList,d=k.getVidx,i=k.oidname,a=X509,e=pemtohex;this.hex=null;this.version=0;this.foffset=0;this.aExtInfo=null;this.getVersion=function(){if(this.hex===null||this.version!==0){return this.version}if(c(this.hex,0,[0,0])!=="a003020102"){this.version=1;this.foffset=-1;return 1}this.version=3;return 3};this.getSerialNumberHex=function(){return f(this.hex,0,[0,1+this.foffset],"02")};this.getSignatureAlgorithmField=function(){return i(f(this.hex,0,[0,2+this.foffset,0],"06"))};this.getIssuerHex=function(){return c(this.hex,0,[0,3+this.foffset],"30")};this.getIssuerString=function(){return a.hex2dn(this.getIssuerHex())};this.getSubjectHex=function(){return c(this.hex,0,[0,5+this.foffset],"30")};this.getSubjectString=function(){return a.hex2dn(this.getSubjectHex())};this.getNotBefore=function(){var l=f(this.hex,0,[0,4+this.foffset,0]);l=l.replace(/(..)/g,"%$1");l=decodeURIComponent(l);return l};this.getNotAfter=function(){var l=f(this.hex,0,[0,4+this.foffset,1]);l=l.replace(/(..)/g,"%$1");l=decodeURIComponent(l);return l};this.getPublicKeyHex=function(){return k.getTLVbyList(this.hex,0,[0,6+this.foffset],"30")};this.getPublicKeyIdx=function(){return g(this.hex,0,[0,6+this.foffset],"30")};this.getPublicKeyContentIdx=function(){var l=this.getPublicKeyIdx();return g(this.hex,l,[1,0],"30")};this.getPublicKey=function(){return KEYUTIL.getKey(this.getPublicKeyHex(),null,"pkcs8pub")};this.getSignatureAlgorithmName=function(){return i(f(this.hex,0,[1,0],"06"))};this.getSignatureValueHex=function(){return f(this.hex,0,[2],"03",true)};this.verifySignature=function(n){var o=this.getSignatureAlgorithmName();var l=this.getSignatureValueHex();var m=c(this.hex,0,[0],"30");var p=new KJUR.crypto.Signature({alg:o});p.init(n);p.updateHex(m);return p.verify(l)};this.parseExt=function(){if(this.version!==3){return -1}var p=g(this.hex,0,[0,7,0],"30");var m=j(this.hex,p);this.aExtInfo=new Array();for(var n=0;n<m.length;n++){var q={};q.critical=false;var l=j(this.hex,m[n]);var r=0;if(l.length===3){q.critical=true;r=1}q.oid=k.hextooidstr(f(this.hex,m[n],[0],"06"));var o=g(this.hex,m[n],[1+r]);q.vidx=d(this.hex,o);this.aExtInfo.push(q)}};this.getExtInfo=function(n){var l=this.aExtInfo;var o=n;if(!n.match(/^[0-9.]+$/)){o=KJUR.asn1.x509.OID.name2oid(n)}if(o===""){return undefined}for(var m=0;m<l.length;m++){if(l[m].oid===o){return l[m]}}return undefined};this.getExtBasicConstraints=function(){var n=this.getExtInfo("basicConstraints");if(n===undefined){return n}var l=h(this.hex,n.vidx);if(l===""){return{}}if(l==="0101ff"){return{cA:true}}if(l.substr(0,8)==="0101ff02"){var o=h(l,6);var m=parseInt(o,16);return{cA:true,pathLen:m}}throw"basicConstraints parse error"};this.getExtKeyUsageBin=function(){var o=this.getExtInfo("keyUsage");if(o===undefined){return""}var m=h(this.hex,o.vidx);if(m.length%2!=0||m.length<=2){throw"malformed key usage value"}var l=parseInt(m.substr(0,2));var n=parseInt(m.substr(2),16).toString(2);return n.substr(0,n.length-l)};this.getExtKeyUsageString=function(){var n=this.getExtKeyUsageBin();var l=new Array();for(var m=0;m<n.length;m++){if(n.substr(m,1)=="1"){l.push(X509.KEYUSAGE_NAME[m])}}return l.join(",")};this.getExtSubjectKeyIdentifier=function(){var l=this.getExtInfo("subjectKeyIdentifier");if(l===undefined){return l}return h(this.hex,l.vidx)};this.getExtAuthorityKeyIdentifier=function(){var p=this.getExtInfo("authorityKeyIdentifier");if(p===undefined){return p}var l={};var o=b(this.hex,p.vidx);var m=j(o,0);for(var n=0;n<m.length;n++){if(o.substr(m[n],2)==="80"){l.kid=h(o,m[n])}}return l};this.getExtExtKeyUsageName=function(){var p=this.getExtInfo("extKeyUsage");if(p===undefined){return p}var l=new Array();var o=b(this.hex,p.vidx);if(o===""){return l}var m=j(o,0);for(var n=0;n<m.length;n++){l.push(i(h(o,m[n])))}return l};this.getExtSubjectAltName=function(){var m=this.getExtSubjectAltName2();var l=new Array();for(var n=0;n<m.length;n++){if(m[n][0]==="DNS"){l.push(m[n][1])}}return l};this.getExtSubjectAltName2=function(){var p,s,r;var q=this.getExtInfo("subjectAltName");if(q===undefined){return q}var l=new Array();var o=b(this.hex,q.vidx);var m=j(o,0);for(var n=0;n<m.length;n++){r=o.substr(m[n],2);p=h(o,m[n]);if(r==="81"){s=hextoutf8(p);l.push(["MAIL",s])}if(r==="82"){s=hextoutf8(p);l.push(["DNS",s])}if(r==="84"){s=X509.hex2dn(p,0);l.push(["DN",s])}if(r==="86"){s=hextoutf8(p);l.push(["URI",s])}if(r==="87"){s=hextoip(p);l.push(["IP",s])}}return l};this.getExtCRLDistributionPointsURI=function(){var q=this.getExtInfo("cRLDistributionPoints");if(q===undefined){return q}var l=new Array();var m=j(this.hex,q.vidx);for(var o=0;o<m.length;o++){try{var r=f(this.hex,m[o],[0,0,0],"86");var p=hextoutf8(r);l.push(p)}catch(n){}}return l};this.getExtAIAInfo=function(){var p=this.getExtInfo("authorityInfoAccess");if(p===undefined){return p}var l={ocsp:[],caissuer:[]};var m=j(this.hex,p.vidx);for(var n=0;n<m.length;n++){var q=f(this.hex,m[n],[0],"06");var o=f(this.hex,m[n],[1],"86");if(q==="2b06010505073001"){l.ocsp.push(hextoutf8(o))}if(q==="2b06010505073002"){l.caissuer.push(hextoutf8(o))}}return l};this.getExtCertificatePolicies=function(){var o=this.getExtInfo("certificatePolicies");if(o===undefined){return o}var l=b(this.hex,o.vidx);var u=[];var s=j(l,0);for(var r=0;r<s.length;r++){var t={};var n=j(l,s[r]);t.id=i(h(l,n[0]));if(n.length===2){var m=j(l,n[1]);for(var q=0;q<m.length;q++){var p=f(l,m[q],[0],"06");if(p==="2b06010505070201"){t.cps=hextoutf8(f(l,m[q],[1]))}else{if(p==="2b06010505070202"){t.unotice=hextoutf8(f(l,m[q],[1,0]))}}}}u.push(t)}return u};this.readCertPEM=function(l){this.readCertHex(e(l))};this.readCertHex=function(l){this.hex=l;this.getVersion();try{g(this.hex,0,[0,7],"a3");this.parseExt()}catch(m){}};this.getInfo=function(){var m=X509;var B,u,z;B="Basic Fields\n";B+="  serial number: "+this.getSerialNumberHex()+"\n";B+="  signature algorithm: "+this.getSignatureAlgorithmField()+"\n";B+="  issuer: "+this.getIssuerString()+"\n";B+="  notBefore: "+this.getNotBefore()+"\n";B+="  notAfter: "+this.getNotAfter()+"\n";B+="  subject: "+this.getSubjectString()+"\n";B+="  subject public key info: \n";u=this.getPublicKey();B+="    key algorithm: "+u.type+"\n";if(u.type==="RSA"){B+="    n="+hextoposhex(u.n.toString(16)).substr(0,16)+"...\n";B+="    e="+hextoposhex(u.e.toString(16))+"\n"}z=this.aExtInfo;if(z!==undefined&&z!==null){B+="X509v3 Extensions:\n";for(var r=0;r<z.length;r++){var n=z[r];var A=KJUR.asn1.x509.OID.oid2name(n.oid);if(A===""){A=n.oid}var x="";if(n.critical===true){x="CRITICAL"}B+="  "+A+" "+x+":\n";if(A==="basicConstraints"){var v=this.getExtBasicConstraints();if(v.cA===undefined){B+="    {}\n"}else{B+="    cA=true";if(v.pathLen!==undefined){B+=", pathLen="+v.pathLen}B+="\n"}}else{if(A==="keyUsage"){B+="    "+this.getExtKeyUsageString()+"\n"}else{if(A==="subjectKeyIdentifier"){B+="    "+this.getExtSubjectKeyIdentifier()+"\n"}else{if(A==="authorityKeyIdentifier"){var l=this.getExtAuthorityKeyIdentifier();if(l.kid!==undefined){B+="    kid="+l.kid+"\n"}}else{if(A==="extKeyUsage"){var w=this.getExtExtKeyUsageName();B+="    "+w.join(", ")+"\n"}else{if(A==="subjectAltName"){var t=this.getExtSubjectAltName2();B+="    "+t+"\n"}else{if(A==="cRLDistributionPoints"){var y=this.getExtCRLDistributionPointsURI();B+="    "+y+"\n"}else{if(A==="authorityInfoAccess"){var p=this.getExtAIAInfo();if(p.ocsp!==undefined){B+="    ocsp: "+p.ocsp.join(",")+"\n"}if(p.caissuer!==undefined){B+="    caissuer: "+p.caissuer.join(",")+"\n"}}else{if(A==="certificatePolicies"){var o=this.getExtCertificatePolicies();for(var q=0;q<o.length;q++){if(o[q].id!==undefined){B+="    policy oid: "+o[q].id+"\n"}if(o[q].cps!==undefined){B+="    cps: "+o[q].cps+"\n"}}}}}}}}}}}}}B+="signature algorithm: "+this.getSignatureAlgorithmName()+"\n";B+="signature: "+this.getSignatureValueHex().substr(0,16)+"...\n";return B}}X509.hex2dn=function(f,b){if(b===undefined){b=0}if(f.substr(b,2)!=="30"){throw"malformed DN"}var c=new Array();var d=ASN1HEX.getChildIdx(f,b);for(var e=0;e<d.length;e++){c.push(X509.hex2rdn(f,d[e]))}c=c.map(function(a){return a.replace("/","\\/")});return"/"+c.join("/")};X509.hex2rdn=function(f,b){if(b===undefined){b=0}if(f.substr(b,2)!=="31"){throw"malformed RDN"}var c=new Array();var d=ASN1HEX.getChildIdx(f,b);for(var e=0;e<d.length;e++){c.push(X509.hex2attrTypeValue(f,d[e]))}c=c.map(function(a){return a.replace("+","\\+")});return c.join("+")};X509.hex2attrTypeValue=function(d,i){var j=ASN1HEX;var h=j.getV;if(i===undefined){i=0}if(d.substr(i,2)!=="30"){throw"malformed attribute type and value"}var g=j.getChildIdx(d,i);if(g.length!==2||d.substr(g[0],2)!=="06"){"malformed attribute type and value"}var b=h(d,g[0]);var f=KJUR.asn1.ASN1Util.oidHexToInt(b);var e=KJUR.asn1.x509.OID.oid2atype(f);var a=h(d,g[1]);var c=hextorstr(a);return e+"="+c};X509.getPublicKeyFromCertHex=function(b){var a=new X509();a.readCertHex(b);return a.getPublicKey()};X509.getPublicKeyFromCertPEM=function(b){var a=new X509();a.readCertPEM(b);return a.getPublicKey()};X509.getPublicKeyInfoPropOfCertPEM=function(c){var e=ASN1HEX;var g=e.getVbyList;var b={};var a,f,d;b.algparam=null;a=new X509();a.readCertPEM(c);f=a.getPublicKeyHex();b.keyhex=g(f,0,[1],"03").substr(2);b.algoid=g(f,0,[0,0],"06");if(b.algoid==="2a8648ce3d0201"){b.algparam=g(f,0,[0,1],"06")}return b};X509.KEYUSAGE_NAME=["digitalSignature","nonRepudiation","keyEncipherment","dataEncipherment","keyAgreement","keyCertSign","cRLSign","encipherOnly","decipherOnly"];
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWS=function(){var b=KJUR,a=b.jws.JWS,c=a.isSafeJSONString;this.parseJWS=function(g,j){if((this.parsedJWS!==undefined)&&(j||(this.parsedJWS.sigvalH!==undefined))){return}var i=g.match(/^([^.]+)\.([^.]+)\.([^.]+)$/);if(i==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}var k=i[1];var e=i[2];var l=i[3];var n=k+"."+e;this.parsedJWS={};this.parsedJWS.headB64U=k;this.parsedJWS.payloadB64U=e;this.parsedJWS.sigvalB64U=l;this.parsedJWS.si=n;if(!j){var h=b64utohex(l);var f=parseBigInt(h,16);this.parsedJWS.sigvalH=h;this.parsedJWS.sigvalBI=f}var d=b64utoutf8(k);var m=b64utoutf8(e);this.parsedJWS.headS=d;this.parsedJWS.payloadS=m;if(!c(d,this.parsedJWS,"headP")){throw"malformed JSON string for JWS Head: "+d}}};KJUR.jws.JWS.sign=function(i,v,y,z,a){var w=KJUR,m=w.jws,q=m.JWS,g=q.readSafeJSONString,p=q.isSafeJSONString,d=w.crypto,k=d.ECDSA,o=d.Mac,c=d.Signature,t=JSON;var s,j,n;if(typeof v!="string"&&typeof v!="object"){throw"spHeader must be JSON string or object: "+v}if(typeof v=="object"){j=v;s=t.stringify(j)}if(typeof v=="string"){s=v;if(!p(s)){throw"JWS Head is not safe JSON string: "+s}j=g(s)}n=y;if(typeof y=="object"){n=t.stringify(y)}if((i==""||i==null)&&j.alg!==undefined){i=j.alg}if((i!=""&&i!=null)&&j.alg===undefined){j.alg=i;s=t.stringify(j)}if(i!==j.alg){throw"alg and sHeader.alg doesn't match: "+i+"!="+j.alg}var r=null;if(q.jwsalg2sigalg[i]===undefined){throw"unsupported alg name: "+i}else{r=q.jwsalg2sigalg[i]}var e=utf8tob64u(s);var l=utf8tob64u(n);var b=e+"."+l;var x="";if(r.substr(0,4)=="Hmac"){if(z===undefined){throw"mac key shall be specified for HS* alg"}var h=new o({alg:r,prov:"cryptojs",pass:z});h.updateString(b);x=h.doFinal()}else{if(r.indexOf("withECDSA")!=-1){var f=new c({alg:r});f.init(z,a);f.updateString(b);hASN1Sig=f.sign();x=KJUR.crypto.ECDSA.asn1SigToConcatSig(hASN1Sig)}else{if(r!="none"){var f=new c({alg:r});f.init(z,a);f.updateString(b);x=f.sign()}}}var u=hextob64u(x);return b+"."+u};KJUR.jws.JWS.verify=function(w,B,n){var x=KJUR,q=x.jws,t=q.JWS,i=t.readSafeJSONString,e=x.crypto,p=e.ECDSA,s=e.Mac,d=e.Signature,m;if(typeof RSAKey!==undefined){m=RSAKey}var y=w.split(".");if(y.length!==3){return false}var f=y[0];var r=y[1];var c=f+"."+r;var A=b64utohex(y[2]);var l=i(b64utoutf8(y[0]));var k=null;var z=null;if(l.alg===undefined){throw"algorithm not specified in header"}else{k=l.alg;z=k.substr(0,2)}if(n!=null&&Object.prototype.toString.call(n)==="[object Array]"&&n.length>0){var b=":"+n.join(":")+":";if(b.indexOf(":"+k+":")==-1){throw"algorithm '"+k+"' not accepted in the list"}}if(k!="none"&&B===null){throw"key shall be specified to verify."}if(typeof B=="string"&&B.indexOf("-----BEGIN ")!=-1){B=KEYUTIL.getKey(B)}if(z=="RS"||z=="PS"){if(!(B instanceof m)){throw"key shall be a RSAKey obj for RS* and PS* algs"}}if(z=="ES"){if(!(B instanceof p)){throw"key shall be a ECDSA obj for ES* algs"}}if(k=="none"){}var u=null;if(t.jwsalg2sigalg[l.alg]===undefined){throw"unsupported alg name: "+k}else{u=t.jwsalg2sigalg[k]}if(u=="none"){throw"not supported"}else{if(u.substr(0,4)=="Hmac"){var o=null;if(B===undefined){throw"hexadecimal key shall be specified for HMAC"}var j=new s({alg:u,pass:B});j.updateString(c);o=j.doFinal();return A==o}else{if(u.indexOf("withECDSA")!=-1){var h=null;try{h=p.concatSigToASN1Sig(A)}catch(v){return false}var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(h)}else{var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(A)}}}};KJUR.jws.JWS.parse=function(g){var c=g.split(".");var b={};var f,e,d;if(c.length!=2&&c.length!=3){throw"malformed sJWS: wrong number of '.' splitted elements"}f=c[0];e=c[1];if(c.length==3){d=c[2]}b.headerObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(f));b.payloadObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(e));b.headerPP=JSON.stringify(b.headerObj,null,"  ");if(b.payloadObj==null){b.payloadPP=b64utoutf8(e)}else{b.payloadPP=JSON.stringify(b.payloadObj,null,"  ")}if(d!==undefined){b.sigHex=b64utohex(d)}return b};KJUR.jws.JWS.verifyJWT=function(e,l,r){var d=KJUR,j=d.jws,o=j.JWS,n=o.readSafeJSONString,p=o.inArray,f=o.includedArray;var k=e.split(".");var c=k[0];var i=k[1];var q=c+"."+i;var m=b64utohex(k[2]);var h=n(b64utoutf8(c));var g=n(b64utoutf8(i));if(h.alg===undefined){return false}if(r.alg===undefined){throw"acceptField.alg shall be specified"}if(!p(h.alg,r.alg)){return false}if(g.iss!==undefined&&typeof r.iss==="object"){if(!p(g.iss,r.iss)){return false}}if(g.sub!==undefined&&typeof r.sub==="object"){if(!p(g.sub,r.sub)){return false}}if(g.aud!==undefined&&typeof r.aud==="object"){if(typeof g.aud=="string"){if(!p(g.aud,r.aud)){return false}}else{if(typeof g.aud=="object"){if(!f(g.aud,r.aud)){return false}}}}var b=j.IntDate.getNow();if(r.verifyAt!==undefined&&typeof r.verifyAt==="number"){b=r.verifyAt}if(r.gracePeriod===undefined||typeof r.gracePeriod!=="number"){r.gracePeriod=0}if(g.exp!==undefined&&typeof g.exp=="number"){if(g.exp+r.gracePeriod<b){return false}}if(g.nbf!==undefined&&typeof g.nbf=="number"){if(b<g.nbf-r.gracePeriod){return false}}if(g.iat!==undefined&&typeof g.iat=="number"){if(b<g.iat-r.gracePeriod){return false}}if(g.jti!==undefined&&r.jti!==undefined){if(g.jti!==r.jti){return false}}if(!o.verify(e,l,r.alg)){return false}return true};KJUR.jws.JWS.includedArray=function(b,a){var c=KJUR.jws.JWS.inArray;if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var d=0;d<b.length;d++){if(!c(b[d],a)){return false}}return true};KJUR.jws.JWS.inArray=function(d,b){if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var c=0;c<b.length;c++){if(b[c]==d){return true}}return false};KJUR.jws.JWS.jwsalg2sigalg={HS256:"HmacSHA256",HS384:"HmacSHA384",HS512:"HmacSHA512",RS256:"SHA256withRSA",RS384:"SHA384withRSA",RS512:"SHA512withRSA",ES256:"SHA256withECDSA",ES384:"SHA384withECDSA",PS256:"SHA256withRSAandMGF1",PS384:"SHA384withRSAandMGF1",PS512:"SHA512withRSAandMGF1",none:"none",};KJUR.jws.JWS.isSafeJSONString=function(c,b,d){var e=null;try{e=jsonParse(c);if(typeof e!="object"){return 0}if(e.constructor===Array){return 0}if(b){b[d]=e}return 1}catch(a){return 0}};KJUR.jws.JWS.readSafeJSONString=function(b){var c=null;try{c=jsonParse(b);if(typeof c!="object"){return null}if(c.constructor===Array){return null}return c}catch(a){return null}};KJUR.jws.JWS.getEncodedSignatureValueFromJWS=function(b){var a=b.match(/^[^.]+\.[^.]+\.([^.]+)$/);if(a==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}return a[1]};KJUR.jws.JWS.getJWKthumbprint=function(d){if(d.kty!=="RSA"&&d.kty!=="EC"&&d.kty!=="oct"){throw"unsupported algorithm for JWK Thumprint"}var a="{";if(d.kty==="RSA"){if(typeof d.n!="string"||typeof d.e!="string"){throw"wrong n and e value for RSA key"}a+='"e":"'+d.e+'",';a+='"kty":"'+d.kty+'",';a+='"n":"'+d.n+'"}'}else{if(d.kty==="EC"){if(typeof d.crv!="string"||typeof d.x!="string"||typeof d.y!="string"){throw"wrong crv, x and y value for EC key"}a+='"crv":"'+d.crv+'",';a+='"kty":"'+d.kty+'",';a+='"x":"'+d.x+'",';a+='"y":"'+d.y+'"}'}else{if(d.kty==="oct"){if(typeof d.k!="string"){throw"wrong k value for oct(symmetric) key"}a+='"kty":"'+d.kty+'",';a+='"k":"'+d.k+'"}'}}}var b=rstrtohex(a);var c=KJUR.crypto.Util.hashHex(b,"sha256");var e=hextob64u(c);return e};KJUR.jws.IntDate={};KJUR.jws.IntDate.get=function(c){var b=KJUR.jws.IntDate,d=b.getNow,a=b.getZulu;if(c=="now"){return d()}else{if(c=="now + 1hour"){return d()+60*60}else{if(c=="now + 1day"){return d()+60*60*24}else{if(c=="now + 1month"){return d()+60*60*24*30}else{if(c=="now + 1year"){return d()+60*60*24*365}else{if(c.match(/Z$/)){return a(c)}else{if(c.match(/^[0-9]+$/)){return parseInt(c)}}}}}}}throw"unsupported format: "+c};KJUR.jws.IntDate.getZulu=function(a){return zulutosec(a)};KJUR.jws.IntDate.getNow=function(){var a=~~(new Date()/1000);return a};KJUR.jws.IntDate.intDate2UTCString=function(a){var b=new Date(a*1000);return b.toUTCString()};KJUR.jws.IntDate.intDate2Zulu=function(e){var i=new Date(e*1000),h=("0000"+i.getUTCFullYear()).slice(-4),g=("00"+(i.getUTCMonth()+1)).slice(-2),b=("00"+i.getUTCDate()).slice(-2),a=("00"+i.getUTCHours()).slice(-2),c=("00"+i.getUTCMinutes()).slice(-2),f=("00"+i.getUTCSeconds()).slice(-2);return h+g+b+a+c+f+"Z"};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWSJS=function(){var c=KJUR,b=c.jws,a=b.JWS,d=a.readSafeJSONString;this.aHeader=[];this.sPayload="";this.aSignature=[];this.init=function(){this.aHeader=[];this.sPayload=undefined;this.aSignature=[]};this.initWithJWS=function(f){this.init();var e=f.split(".");if(e.length!=3){throw"malformed input JWS"}this.aHeader.push(e[0]);this.sPayload=e[1];this.aSignature.push(e[2])};this.addSignature=function(e,h,m,k){if(this.sPayload===undefined||this.sPayload===null){throw"there's no JSON-JS signature to add."}var l=this.aHeader.length;if(this.aHeader.length!=this.aSignature.length){throw"aHeader.length != aSignature.length"}try{var f=KJUR.jws.JWS.sign(e,h,this.sPayload,m,k);var j=f.split(".");var n=j[0];var g=j[2];this.aHeader.push(j[0]);this.aSignature.push(j[2])}catch(i){if(this.aHeader.length>l){this.aHeader.pop()}if(this.aSignature.length>l){this.aSignature.pop()}throw"addSignature failed: "+i}};this.verifyAll=function(h){if(this.aHeader.length!==h.length||this.aSignature.length!==h.length){return false}for(var g=0;g<h.length;g++){var f=h[g];if(f.length!==2){return false}var e=this.verifyNth(g,f[0],f[1]);if(e===false){return false}}return true};this.verifyNth=function(f,j,g){if(this.aHeader.length<=f||this.aSignature.length<=f){return false}var h=this.aHeader[f];var k=this.aSignature[f];var l=h+"."+this.sPayload+"."+k;var e=false;try{e=a.verify(l,j,g)}catch(i){return false}return e};this.readJWSJS=function(g){if(typeof g==="string"){var f=d(g);if(f==null){throw"argument is not safe JSON object string"}this.aHeader=f.headers;this.sPayload=f.payload;this.aSignature=f.signatures}else{try{if(g.headers.length>0){this.aHeader=g.headers}else{throw"malformed header"}if(typeof g.payload==="string"){this.sPayload=g.payload}else{throw"malformed signatures"}if(g.signatures.length>0){this.aSignatures=g.signatures}else{throw"malformed signatures"}}catch(e){throw"malformed JWS-JS JSON object: "+e}}};this.getJSON=function(){return{headers:this.aHeader,payload:this.sPayload,signatures:this.aSignature}};this.isEmpty=function(){if(this.aHeader.length==0){return 1}return 0}};
exports.SecureRandom = SecureRandom;
exports.rng_seed_time = rng_seed_time;

exports.BigInteger = BigInteger;
exports.RSAKey = RSAKey;
exports.ECDSA = KJUR.crypto.ECDSA;
exports.DSA = KJUR.crypto.DSA;
exports.Signature = KJUR.crypto.Signature;
exports.MessageDigest = KJUR.crypto.MessageDigest;
exports.Mac = KJUR.crypto.Mac;
exports.Cipher = KJUR.crypto.Cipher;
exports.KEYUTIL = KEYUTIL;
exports.ASN1HEX = ASN1HEX;
exports.X509 = X509;
exports.CryptoJS = CryptoJS;

// ext/base64.js
exports.b64tohex = b64tohex;
exports.b64toBA = b64toBA;

// ext/ec*.js
exports.ECFieldElementFp = ECFieldElementFp;
exports.ECPointFp = ECPointFp;
exports.ECCurveFp = ECCurveFp;

// base64x.js
exports.stoBA = stoBA;
exports.BAtos = BAtos;
exports.BAtohex = BAtohex;
exports.stohex = stohex;
exports.stob64 = stob64;
exports.stob64u = stob64u;
exports.b64utos = b64utos;
exports.b64tob64u = b64tob64u;
exports.b64utob64 = b64utob64;
exports.hex2b64 = hex2b64;
exports.hextob64u = hextob64u;
exports.b64utohex = b64utohex;
exports.utf8tob64u = utf8tob64u;
exports.b64utoutf8 = b64utoutf8;
exports.utf8tob64 = utf8tob64;
exports.b64toutf8 = b64toutf8;
exports.utf8tohex = utf8tohex;
exports.hextoutf8 = hextoutf8;
exports.hextorstr = hextorstr;
exports.rstrtohex = rstrtohex;
exports.hextob64 = hextob64;
exports.hextob64nl = hextob64nl;
exports.b64nltohex = b64nltohex;
exports.hextopem = hextopem;
exports.pemtohex = pemtohex;
exports.hextoArrayBuffer = hextoArrayBuffer;
exports.ArrayBuffertohex = ArrayBuffertohex;
exports.zulutomsec = zulutomsec;
exports.zulutosec = zulutosec;
exports.zulutodate = zulutodate;
exports.datetozulu = datetozulu;
exports.uricmptohex = uricmptohex;
exports.hextouricmp = hextouricmp;
exports.ipv6tohex = ipv6tohex;
exports.hextoipv6 = hextoipv6;
exports.hextoip = hextoip;
exports.iptohex = iptohex;
exports.encodeURIComponentAll = encodeURIComponentAll;
exports.newline_toUnix = newline_toUnix;
exports.newline_toDos = newline_toDos;
exports.hextoposhex = hextoposhex;
exports.intarystrtohex = intarystrtohex;
exports.strdiffidx = strdiffidx;

// name spaces
exports.KJUR = KJUR;
exports.crypto = KJUR.crypto;
exports.asn1 = KJUR.asn1;
exports.jws = KJUR.jws;
exports.lang = KJUR.lang;




/***/ }),

/***/ "./node_modules/ng-recaptcha/index.js":
/*!********************************************!*\
  !*** ./node_modules/ng-recaptcha/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var recaptcha_component_1 = __webpack_require__(/*! ./recaptcha/recaptcha.component */ "./node_modules/ng-recaptcha/recaptcha/recaptcha.component.js");
exports.RecaptchaComponent = recaptcha_component_1.RecaptchaComponent;
var recaptcha_loader_service_1 = __webpack_require__(/*! ./recaptcha/recaptcha-loader.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js");
exports.RecaptchaLoaderService = recaptcha_loader_service_1.RecaptchaLoaderService;
exports.RECAPTCHA_LANGUAGE = recaptcha_loader_service_1.RECAPTCHA_LANGUAGE;
exports.RECAPTCHA_BASE_URL = recaptcha_loader_service_1.RECAPTCHA_BASE_URL;
exports.RECAPTCHA_NONCE = recaptcha_loader_service_1.RECAPTCHA_NONCE;
var recaptcha_module_1 = __webpack_require__(/*! ./recaptcha/recaptcha.module */ "./node_modules/ng-recaptcha/recaptcha/recaptcha.module.js");
exports.RecaptchaModule = recaptcha_module_1.RecaptchaModule;
var recaptcha_settings_1 = __webpack_require__(/*! ./recaptcha/recaptcha-settings */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-settings.js");
exports.RECAPTCHA_SETTINGS = recaptcha_settings_1.RECAPTCHA_SETTINGS;
var recaptcha_v3_module_1 = __webpack_require__(/*! ./recaptcha/recaptcha-v3.module */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.module.js");
exports.RecaptchaV3Module = recaptcha_v3_module_1.RecaptchaV3Module;
var recaptcha_v3_service_1 = __webpack_require__(/*! ./recaptcha/recaptcha-v3.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.service.js");
exports.ReCaptchaV3Service = recaptcha_v3_service_1.ReCaptchaV3Service;
exports.RECAPTCHA_V3_SITE_KEY = recaptcha_v3_service_1.RECAPTCHA_V3_SITE_KEY;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha-common.module.js":
/*!************************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha-common.module.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var recaptcha_component_1 = __webpack_require__(/*! ./recaptcha.component */ "./node_modules/ng-recaptcha/recaptcha/recaptcha.component.js");
var RecaptchaCommonModule = /** @class */ (function () {
    function RecaptchaCommonModule() {
    }
    RecaptchaCommonModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [
                        recaptcha_component_1.RecaptchaComponent,
                    ],
                    exports: [
                        recaptcha_component_1.RecaptchaComponent,
                    ],
                },] },
    ];
    return RecaptchaCommonModule;
}());
exports.RecaptchaCommonModule = RecaptchaCommonModule;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js":
/*!*************************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
exports.RECAPTCHA_LANGUAGE = new core_1.InjectionToken('recaptcha-language');
exports.RECAPTCHA_BASE_URL = new core_1.InjectionToken('recaptcha-base-url');
exports.RECAPTCHA_NONCE = new core_1.InjectionToken('recaptcha-nonce-tag');
function loadScript(renderMode, onLoaded, urlParams, url, nonce) {
    window.ng2recaptchaloaded = function () {
        onLoaded(grecaptcha);
    };
    var script = document.createElement('script');
    script.innerHTML = '';
    var baseUrl = url || 'https://www.google.com/recaptcha/api.js';
    script.src = baseUrl + "?render=" + renderMode + "&onload=ng2recaptchaloaded" + urlParams;
    if (nonce) {
        // tslint:disable-next-line:no-any Remove "any" cast once we upgrade Angular to 7 and TypeScript along with it
        // tslint:disable-next-line:no-any Remove "any" cast once we upgrade Angular to 7 and TypeScript along with it
        script.nonce = nonce;
    }
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}
exports.loadScript = loadScript;
var RecaptchaLoaderService = /** @class */ (function () {
    function RecaptchaLoaderService(
    // tslint:disable-next-line:no-any
    platformId, language, baseUrl, nonce) {
        this.platformId = platformId;
        this.language = language;
        this.baseUrl = baseUrl;
        this.nonce = nonce;
        this.init();
        this.ready = common_1.isPlatformBrowser(this.platformId) ? RecaptchaLoaderService.ready.asObservable() : rxjs_1.of();
    }
    /** @internal */
    /** @internal */
    RecaptchaLoaderService.prototype.init = /** @internal */
    function () {
        if (RecaptchaLoaderService.ready) {
            return;
        }
        if (common_1.isPlatformBrowser(this.platformId)) {
            var subject_1 = new rxjs_1.BehaviorSubject(null);
            RecaptchaLoaderService.ready = subject_1;
            var langParam = this.language ? '&hl=' + this.language : '';
            loadScript('explicit', function (grecaptcha) { return subject_1.next(grecaptcha); }, langParam, this.baseUrl, this.nonce);
        }
    };
    /**
       * @internal
       * @nocollapse
       */
    RecaptchaLoaderService.ready = null;
    RecaptchaLoaderService.decorators = [
        { type: core_1.Injectable },
    ];
    /** @nocollapse */
    RecaptchaLoaderService.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: core_1.Inject, args: [core_1.PLATFORM_ID,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [exports.RECAPTCHA_LANGUAGE,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [exports.RECAPTCHA_BASE_URL,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [exports.RECAPTCHA_NONCE,] },] },
    ]; };
    return RecaptchaLoaderService;
}());
exports.RecaptchaLoaderService = RecaptchaLoaderService;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha-settings.js":
/*!*******************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha-settings.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
exports.RECAPTCHA_SETTINGS = new core_1.InjectionToken('recaptcha-settings');


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.module.js":
/*!********************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.module.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var recaptcha_v3_service_1 = __webpack_require__(/*! ./recaptcha-v3.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.service.js");
var RecaptchaV3Module = /** @class */ (function () {
    function RecaptchaV3Module() {
    }
    RecaptchaV3Module.decorators = [
        { type: core_1.NgModule, args: [{
                    providers: [
                        recaptcha_v3_service_1.ReCaptchaV3Service,
                    ],
                },] },
    ];
    return RecaptchaV3Module;
}());
exports.RecaptchaV3Module = RecaptchaV3Module;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.service.js":
/*!*********************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha-v3.service.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
var recaptcha_loader_service_1 = __webpack_require__(/*! ./recaptcha-loader.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js");
exports.RECAPTCHA_V3_SITE_KEY = new core_1.InjectionToken('recaptcha-v3-site-key');
/**
 * The main service for working with reCAPTCHA v3 APIs.
 *
 * Use the `execute` method for executing a single action, and
 * `onExecute` observable for listening to all actions at once.
 */
var ReCaptchaV3Service = /** @class */ (function () {
    function ReCaptchaV3Service(zone, siteKey, 
    // tslint:disable-next-line:no-any
    platformId, baseUrl, nonce) {
        var _this = this;
        /** @internal */
        this.onLoadComplete = function (grecaptcha) {
            _this.grecaptcha = grecaptcha;
            if (_this.actionBacklog && _this.actionBacklog.length > 0) {
                _this.actionBacklog.forEach(function (_a) {
                    var action = _a[0], subject = _a[1];
                    return _this.executeActionWithSubject(action, subject);
                });
                _this.actionBacklog = undefined;
            }
        };
        this.zone = zone;
        this.isBrowser = common_1.isPlatformBrowser(platformId);
        this.siteKey = siteKey;
        this.nonce = nonce;
        this.baseUrl = baseUrl;
        this.init();
    }
    Object.defineProperty(ReCaptchaV3Service.prototype, "onExecute", {
        get: function () {
            if (!this.onExecuteSubject) {
                this.onExecuteSubject = new rxjs_1.Subject();
                this.onExecuteObservable = this.onExecuteSubject.asObservable();
            }
            return this.onExecuteObservable;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Executes the provided `action` with reCAPTCHA v3 API.
     * Use the emitted token value for verification purposes on the backend.
     *
     * For more information about reCAPTCHA v3 actions and tokens refer to the official documentation at
     * https://developers.google.com/recaptcha/docs/v3.
     *
     * @param {string} action the action to execute
     * @returns {Observable<string>} an `Observable` that will emit the reCAPTCHA v3 string `token` value whenever ready.
     * The returned `Observable` completes immediately after emitting a value.
     */
    /**
       * Executes the provided `action` with reCAPTCHA v3 API.
       * Use the emitted token value for verification purposes on the backend.
       *
       * For more information about reCAPTCHA v3 actions and tokens refer to the official documentation at
       * https://developers.google.com/recaptcha/docs/v3.
       *
       * @param {string} action the action to execute
       * @returns {Observable<string>} an `Observable` that will emit the reCAPTCHA v3 string `token` value whenever ready.
       * The returned `Observable` completes immediately after emitting a value.
       */
    ReCaptchaV3Service.prototype.execute = /**
       * Executes the provided `action` with reCAPTCHA v3 API.
       * Use the emitted token value for verification purposes on the backend.
       *
       * For more information about reCAPTCHA v3 actions and tokens refer to the official documentation at
       * https://developers.google.com/recaptcha/docs/v3.
       *
       * @param {string} action the action to execute
       * @returns {Observable<string>} an `Observable` that will emit the reCAPTCHA v3 string `token` value whenever ready.
       * The returned `Observable` completes immediately after emitting a value.
       */
    function (action) {
        var subject = new rxjs_1.Subject();
        if (this.isBrowser) {
            if (!this.grecaptcha) {
                // todo: add to array of later executions
                if (!this.actionBacklog) {
                    this.actionBacklog = [];
                }
                this.actionBacklog.push([action, subject]);
            }
            else {
                this.executeActionWithSubject(action, subject);
            }
        }
        return subject.asObservable();
    };
    /** @internal */
    /** @internal */
    ReCaptchaV3Service.prototype.executeActionWithSubject = /** @internal */
    function (action, subject) {
        var _this = this;
        this.zone.runOutsideAngular(function () {
            // tslint:disable-next-line:no-any
            // tslint:disable-next-line:no-any
            _this.grecaptcha.execute(_this.siteKey, { action: action }).then(function (token) {
                _this.zone.run(function () {
                    subject.next(token);
                    subject.complete();
                    if (_this.onExecuteSubject) {
                        _this.onExecuteSubject.next({ action: action, token: token });
                    }
                });
            });
        });
    };
    /** @internal */
    /** @internal */
    ReCaptchaV3Service.prototype.init = /** @internal */
    function () {
        if (this.isBrowser) {
            if ('grecaptcha' in window) {
                this.grecaptcha = grecaptcha;
            }
            else {
                recaptcha_loader_service_1.loadScript(this.siteKey, this.onLoadComplete, '', this.baseUrl, this.nonce);
            }
        }
    };
    ReCaptchaV3Service.decorators = [
        { type: core_1.Injectable },
    ];
    /** @nocollapse */
    ReCaptchaV3Service.ctorParameters = function () { return [
        { type: core_1.NgZone, },
        { type: undefined, decorators: [{ type: core_1.Inject, args: [exports.RECAPTCHA_V3_SITE_KEY,] },] },
        { type: undefined, decorators: [{ type: core_1.Inject, args: [core_1.PLATFORM_ID,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [recaptcha_loader_service_1.RECAPTCHA_BASE_URL,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [recaptcha_loader_service_1.RECAPTCHA_NONCE,] },] },
    ]; };
    return ReCaptchaV3Service;
}());
exports.ReCaptchaV3Service = ReCaptchaV3Service;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha.component.js":
/*!********************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha.component.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var recaptcha_loader_service_1 = __webpack_require__(/*! ./recaptcha-loader.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js");
var recaptcha_settings_1 = __webpack_require__(/*! ./recaptcha-settings */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-settings.js");
var nextId = 0;
var RecaptchaComponent = /** @class */ (function () {
    function RecaptchaComponent(elementRef, loader, zone, settings) {
        this.elementRef = elementRef;
        this.loader = loader;
        this.zone = zone;
        this.id = "ngrecaptcha-" + nextId++;
        this.resolved = new core_1.EventEmitter();
        if (settings) {
            this.siteKey = settings.siteKey;
            this.theme = settings.theme;
            this.type = settings.type;
            this.size = settings.size;
            this.badge = settings.badge;
        }
    }
    RecaptchaComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.subscription = this.loader.ready.subscribe(function (grecaptcha) {
            if (grecaptcha != null && grecaptcha.render instanceof Function) {
                _this.grecaptcha = grecaptcha;
                _this.renderRecaptcha();
            }
        });
    };
    RecaptchaComponent.prototype.ngOnDestroy = function () {
        // reset the captcha to ensure it does not leave anything behind
        // after the component is no longer needed
        this.grecaptchaReset();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    };
    /**
     * Executes the invisible recaptcha.
     * Does nothing if component's size is not set to "invisible".
     */
    /**
       * Executes the invisible recaptcha.
       * Does nothing if component's size is not set to "invisible".
       */
    RecaptchaComponent.prototype.execute = /**
       * Executes the invisible recaptcha.
       * Does nothing if component's size is not set to "invisible".
       */
    function () {
        if (this.size !== 'invisible') {
            return;
        }
        if (this.widget != null) {
            this.grecaptcha.execute(this.widget);
        }
        else {
            // delay execution of recaptcha until it actually renders
            this.executeRequested = true;
        }
    };
    RecaptchaComponent.prototype.reset = function () {
        if (this.widget != null) {
            if (this.grecaptcha.getResponse(this.widget)) {
                // Only emit an event in case if something would actually change.
                // That way we do not trigger "touching" of the control if someone does a "reset"
                // on a non-resolved captcha.
                this.resolved.emit(null);
            }
            this.grecaptchaReset();
        }
    };
    /** @internal */
    /** @internal */
    RecaptchaComponent.prototype.expired = /** @internal */
    function () {
        this.resolved.emit(null);
    };
    /** @internal */
    /** @internal */
    RecaptchaComponent.prototype.captchaResponseCallback = /** @internal */
    function (response) {
        this.resolved.emit(response);
    };
    /** @internal */
    /** @internal */
    RecaptchaComponent.prototype.grecaptchaReset = /** @internal */
    function () {
        var _this = this;
        if (this.widget != null) {
            this.zone.runOutsideAngular(function () { return _this.grecaptcha.reset(_this.widget); });
        }
    };
    /** @internal */
    /** @internal */
    RecaptchaComponent.prototype.renderRecaptcha = /** @internal */
    function () {
        var _this = this;
        this.widget = this.grecaptcha.render(this.elementRef.nativeElement, {
            badge: this.badge,
            callback: function (response) {
                _this.zone.run(function () { return _this.captchaResponseCallback(response); });
            },
            'expired-callback': function () {
                _this.zone.run(function () { return _this.expired(); });
            },
            sitekey: this.siteKey,
            size: this.size,
            tabindex: this.tabIndex,
            theme: this.theme,
            type: this.type,
        });
        if (this.executeRequested === true) {
            this.executeRequested = false;
            this.execute();
        }
    };
    RecaptchaComponent.decorators = [
        { type: core_1.Component, args: [{
                    exportAs: 'reCaptcha',
                    selector: 're-captcha',
                    template: "",
                },] },
    ];
    /** @nocollapse */
    RecaptchaComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: recaptcha_loader_service_1.RecaptchaLoaderService, },
        { type: core_1.NgZone, },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [recaptcha_settings_1.RECAPTCHA_SETTINGS,] },] },
    ]; };
    RecaptchaComponent.propDecorators = {
        "id": [{ type: core_1.Input }, { type: core_1.HostBinding, args: ['attr.id',] },],
        "siteKey": [{ type: core_1.Input },],
        "theme": [{ type: core_1.Input },],
        "type": [{ type: core_1.Input },],
        "size": [{ type: core_1.Input },],
        "tabIndex": [{ type: core_1.Input },],
        "badge": [{ type: core_1.Input },],
        "resolved": [{ type: core_1.Output },],
    };
    return RecaptchaComponent;
}());
exports.RecaptchaComponent = RecaptchaComponent;


/***/ }),

/***/ "./node_modules/ng-recaptcha/recaptcha/recaptcha.module.js":
/*!*****************************************************************!*\
  !*** ./node_modules/ng-recaptcha/recaptcha/recaptcha.module.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var recaptcha_common_module_1 = __webpack_require__(/*! ./recaptcha-common.module */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-common.module.js");
var recaptcha_loader_service_1 = __webpack_require__(/*! ./recaptcha-loader.service */ "./node_modules/ng-recaptcha/recaptcha/recaptcha-loader.service.js");
var recaptcha_component_1 = __webpack_require__(/*! ./recaptcha.component */ "./node_modules/ng-recaptcha/recaptcha/recaptcha.component.js");
var RecaptchaModule = /** @class */ (function () {
    function RecaptchaModule() {
    }
    // We need this to maintain backwards-compatibility with v4. Removing this will be a breaking change
    // We need this to maintain backwards-compatibility with v4. Removing this will be a breaking change
    RecaptchaModule.forRoot = 
    // We need this to maintain backwards-compatibility with v4. Removing this will be a breaking change
    function () {
        return RecaptchaModule;
    };
    RecaptchaModule.decorators = [
        { type: core_1.NgModule, args: [{
                    exports: [
                        recaptcha_component_1.RecaptchaComponent,
                    ],
                    imports: [
                        recaptcha_common_module_1.RecaptchaCommonModule,
                    ],
                    providers: [
                        recaptcha_loader_service_1.RecaptchaLoaderService,
                    ],
                },] },
    ];
    return RecaptchaModule;
}());
exports.RecaptchaModule = RecaptchaModule;


/***/ }),

/***/ "./src/account/account-routing.module.ts":
/*!***********************************************!*\
  !*** ./src/account/account-routing.module.ts ***!
  \***********************************************/
/*! exports provided: AccountRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AccountRoutingModule", function() { return AccountRoutingModule; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_ui_app_ui_customization_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/ui/app-ui-customization.service */ "./src/shared/common/ui/app-ui-customization.service.ts");
/* harmony import */ var _account_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./account.component */ "./src/account/account.component.ts");
/* harmony import */ var _auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./auth/account-route-guard */ "./src/account/auth/account-route-guard.ts");
/* harmony import */ var _email_activation_confirm_email_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./email-activation/confirm-email.component */ "./src/account/email-activation/confirm-email.component.ts");
/* harmony import */ var _email_activation_email_activation_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./email-activation/email-activation.component */ "./src/account/email-activation/email-activation.component.ts");
/* harmony import */ var _login_login_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./login/login.component */ "./src/account/login/login.component.ts");
/* harmony import */ var _login_send_two_factor_code_component__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./login/send-two-factor-code.component */ "./src/account/login/send-two-factor-code.component.ts");
/* harmony import */ var _login_validate_two_factor_code_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./login/validate-two-factor-code.component */ "./src/account/login/validate-two-factor-code.component.ts");
/* harmony import */ var _password_forgot_password_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./password/forgot-password.component */ "./src/account/password/forgot-password.component.ts");
/* harmony import */ var _password_reset_password_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./password/reset-password.component */ "./src/account/password/reset-password.component.ts");
/* harmony import */ var _payment_buy_component__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./payment/buy.component */ "./src/account/payment/buy.component.ts");
/* harmony import */ var _payment_upgrade_component__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./payment/upgrade.component */ "./src/account/payment/upgrade.component.ts");
/* harmony import */ var _payment_extend_component__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./payment/extend.component */ "./src/account/payment/extend.component.ts");
/* harmony import */ var _register_register_tenant_result_component__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./register/register-tenant-result.component */ "./src/account/register/register-tenant-result.component.ts");
/* harmony import */ var _register_register_tenant_component__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./register/register-tenant.component */ "./src/account/register/register-tenant.component.ts");
/* harmony import */ var _register_register_component__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./register/register.component */ "./src/account/register/register.component.ts");
/* harmony import */ var _register_select_edition_component__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./register/select-edition.component */ "./src/account/register/select-edition.component.ts");
/* harmony import */ var _payment_paypal_paypal_purchase_component__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./payment/paypal/paypal-purchase.component */ "./src/account/payment/paypal/paypal-purchase.component.ts");
/* harmony import */ var _payment_stripe_stripe_purchase_component__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./payment/stripe/stripe-purchase.component */ "./src/account/payment/stripe/stripe-purchase.component.ts");
/* harmony import */ var _payment_stripe_stripe_subscribe_component__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./payment/stripe/stripe-subscribe.component */ "./src/account/payment/stripe/stripe-subscribe.component.ts");
/* harmony import */ var _payment_stripe_stripe_update_subscription_component__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./payment/stripe/stripe-update-subscription.component */ "./src/account/payment/stripe/stripe-update-subscription.component.ts");
/* harmony import */ var _enrollment_enrollment_component__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./enrollment/enrollment.component */ "./src/account/enrollment/enrollment.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
























var AccountRoutingModule = /** @class */ (function () {
    function AccountRoutingModule(router, _uiCustomizationService) {
        var _this = this;
        this.router = router;
        this._uiCustomizationService = _uiCustomizationService;
        router.events.subscribe(function (event) {
            setTimeout(function () {
                _this.toggleBodyCssClass(event.url);
            }, 0);
        });
    }
    AccountRoutingModule.prototype.toggleBodyCssClass = function (url) {
        if (!url) {
            this.setAccountModuleBodyClassInternal();
            return;
        }
        if (url.indexOf('/account/') >= 0) {
            this.setAccountModuleBodyClassInternal();
        }
        else {
            document.body.className = this._uiCustomizationService.getAppModuleBodyClass();
        }
    };
    AccountRoutingModule.prototype.setAccountModuleBodyClassInternal = function () {
        var currentBodyClass = document.body.className;
        var classesToRemember = '';
        if (currentBodyClass.indexOf('swal2-toast-shown') >= 0) {
            classesToRemember += ' swal2-toast-shown';
        }
        document.body.className = this._uiCustomizationService.getAccountModuleBodyClass() + ' ' + classesToRemember;
    };
    AccountRoutingModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["NgModule"])({
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"].forChild([
                    {
                        path: '',
                        component: _account_component__WEBPACK_IMPORTED_MODULE_3__["AccountComponent"],
                        children: [
                            { path: '', redirectTo: 'login' },
                            { path: 'login', component: _login_login_component__WEBPACK_IMPORTED_MODULE_7__["LoginComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'register', component: _register_register_component__WEBPACK_IMPORTED_MODULE_17__["RegisterComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'register-tenant', component: _register_register_tenant_component__WEBPACK_IMPORTED_MODULE_16__["RegisterTenantComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'register-tenant-result', component: _register_register_tenant_result_component__WEBPACK_IMPORTED_MODULE_15__["RegisterTenantResultComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'forgot-password', component: _password_forgot_password_component__WEBPACK_IMPORTED_MODULE_10__["ForgotPasswordComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'reset-password', component: _password_reset_password_component__WEBPACK_IMPORTED_MODULE_11__["ResetPasswordComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'email-activation', component: _email_activation_email_activation_component__WEBPACK_IMPORTED_MODULE_6__["EmailActivationComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'confirm-email', component: _email_activation_confirm_email_component__WEBPACK_IMPORTED_MODULE_5__["ConfirmEmailComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'send-code', component: _login_send_two_factor_code_component__WEBPACK_IMPORTED_MODULE_8__["SendTwoFactorCodeComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'verify-code', component: _login_validate_two_factor_code_component__WEBPACK_IMPORTED_MODULE_9__["ValidateTwoFactorCodeComponent"], canActivate: [_auth_account_route_guard__WEBPACK_IMPORTED_MODULE_4__["AccountRouteGuard"]] },
                            { path: 'buy', component: _payment_buy_component__WEBPACK_IMPORTED_MODULE_12__["BuyEditionComponent"] },
                            { path: 'extend', component: _payment_extend_component__WEBPACK_IMPORTED_MODULE_14__["ExtendEditionComponent"] },
                            { path: 'upgrade', component: _payment_upgrade_component__WEBPACK_IMPORTED_MODULE_13__["UpgradeEditionComponent"] },
                            { path: 'select-edition', component: _register_select_edition_component__WEBPACK_IMPORTED_MODULE_18__["SelectEditionComponent"] },
                            { path: 'paypal-purchase', component: _payment_paypal_paypal_purchase_component__WEBPACK_IMPORTED_MODULE_19__["PayPalPurchaseComponent"] },
                            { path: 'stripe-purchase', component: _payment_stripe_stripe_purchase_component__WEBPACK_IMPORTED_MODULE_20__["StripePurchaseComponent"] },
                            { path: 'stripe-subscribe', component: _payment_stripe_stripe_subscribe_component__WEBPACK_IMPORTED_MODULE_21__["StripeSubscribeComponent"] },
                            { path: 'stripe-update-subscription', component: _payment_stripe_stripe_update_subscription_component__WEBPACK_IMPORTED_MODULE_22__["StripeUpdateSubscriptionComponent"] },
                            { path: 'enrollment', component: _enrollment_enrollment_component__WEBPACK_IMPORTED_MODULE_23__["EnrollmentComponent"] },
                        ]
                    }
                ])
            ],
            exports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_1__["RouterModule"]
            ]
        }),
        __metadata("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _shared_common_ui_app_ui_customization_service__WEBPACK_IMPORTED_MODULE_2__["AppUiCustomizationService"]])
    ], AccountRoutingModule);
    return AccountRoutingModule;
}());



/***/ }),

/***/ "./src/account/account.component.html":
/*!********************************************!*\
  !*** ./src/account/account.component.html ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [ngClass]=\"{'m-grid m-grid--hor m-grid--root m-page': !useFullWidthLayout(), 'm-content': useFullWidthLayout() }\" [style.text-align]=\"useFullWidthLayout() ? 'center' : 'left'\">\r\n    <div [ngClass]=\"{'m-grid__item m-grid__item--fluid m-grid m-grid--ver-desktop m-grid--desktop m-grid--tablet-and-mobile m-grid--hor-tablet-and-mobile m-login m-login--1 m-login--singin': !useFullWidthLayout(), 'row':useFullWidthLayout()}\" id=\"m_login\">\r\n        <div [ngClass]=\"{'m-grid__item m-grid__item--order-tablet-and-mobile-2 m-login__aside': !useFullWidthLayout(), 'col-md-12': useFullWidthLayout()}\">\r\n            <div [ngClass]=\"{'m-stack m-stack--hor m-stack--desktop': !useFullWidthLayout()}\">\r\n                <div [ngClass]=\"{'m-stack__item m-stack__item--fluid': !useFullWidthLayout()}\">\r\n                    <div class=\"m-login__wrapper\">\r\n                        <div class=\"m-login__logo\">\r\n                            <a (click)=\"goToHome()\">\r\n                                <img *ngIf=\"!appSession.tenant || !appSession.tenant.logoId\" [src]=\"appRootUrl() + 'assets/common/images/logo.svg'\" alt=\"logo\" height=\"38\" />\r\n                                <img *ngIf=\"appSession.tenant && appSession.tenant.logoId\" [src]=\"remoteServiceBaseUrl + '/TenantCustomization/GetTenantLogo?skin=light&tenantId=' + appSession.tenant.id + '&id=' + appSession.tenant.logoId\" alt=\"logo\" height=\"38\" />\r\n                            </a>\r\n                        </div>\r\n                        <div *ngIf=\"showTenantChange()\" class=\"content tenant-change-box\">\r\n                            <tenant-change></tenant-change>\r\n                        </div>\r\n                        <router-outlet></router-outlet>\r\n                    </div>\r\n                    <div>\r\n                        <language-switch></language-switch>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div *ngIf=\"!useFullWidthLayout()\" class=\"m-grid__item m-grid__item--fluid m-grid m-grid--center m-grid--hor m-grid__item--order-tablet-and-mobile-1 m-login__content m-grid-item--center\" [style.background-image]=\"getBgUrl()\">\r\n            <div class=\"m-grid__item m-grid__item--middle\">\r\n                <!-- <enrollment></enrollment> -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/account.component.less":
/*!********************************************!*\
  !*** ./src/account/account.component.less ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/***\nLogin page\n***/\n/* bg color */\n.login {\n  background-color: #364150 !important;\n}\n.login .logo {\n  margin: 0 auto;\n  margin-top: 60px;\n  padding: 15px;\n  text-align: center;\n}\n.login .content {\n  background-color: #eceef1;\n  border-radius: 7px;\n  width: 400px;\n  margin: 40px auto 10px auto;\n  padding: 30px;\n  padding-top: 10px;\n  overflow: hidden;\n  position: relative;\n}\n.login .content h3 {\n  color: #4db3a5;\n  text-align: center;\n  font-size: 28px;\n  font-weight: 400 !important;\n}\n.login .content h4 {\n  color: #555;\n}\n.login .content .hint {\n  color: #999;\n  padding: 0;\n  margin: 15px 0 7px 0;\n}\n.login .content .login-form,\n.login .content .forget-form {\n  padding: 0px;\n  margin: 0px;\n}\n.login .content .form-control {\n  border: none;\n  background-color: #dde3ec;\n  height: 43px;\n  color: #8290a3;\n  border: 1px solid #dde3ec;\n}\n.login .content .form-control:focus,\n.login .content .form-control:active {\n  border: 1px solid #c3ccda;\n}\n.login .content .form-control::-moz-placeholder {\n  color: #8290a3;\n  opacity: 1;\n}\n.login .content .form-control:-ms-input-placeholder {\n  color: #8290a3;\n}\n.login .content .form-control::-webkit-input-placeholder {\n  color: #8290a3;\n}\n.login .content select.form-control {\n  padding-left: 9px;\n  padding-right: 9px;\n}\n.login .content .form-title {\n  font-weight: 300;\n  margin-bottom: 25px;\n}\n.login .content .form-actions {\n  clear: both;\n  border: 0px;\n  border-bottom: 1px solid #eee;\n  padding: 0px 30px 25px 30px;\n  margin-left: -30px;\n  margin-right: -30px;\n}\n.login-options {\n  margin-bottom: 30px;\n  overflow: hidden;\n}\n.login-options h4 {\n  float: left;\n  font-weight: 600;\n  font-size: 15px;\n  color: #7d91aa !important;\n}\n.login-options .social-icons {\n  float: right;\n  padding-top: 3px;\n}\n.social-icons {\n  padding: 0;\n  margin: 0;\n}\n.social-icons li {\n  float: left;\n  display: inline;\n  list-style: none;\n  margin-right: 5px;\n  margin-bottom: 5px;\n  text-indent: -9999px;\n}\n.social-icons li > a {\n  cursor: pointer;\n  border-radius: 2px;\n  width: 28px;\n  height: 28px;\n  display: block;\n  background-position: 0 0;\n  background-repeat: no-repeat;\n  transition: all 0.3s ease-in-out;\n  -o-transition: all 0.3s ease-in-out;\n  -ms-transition: all 0.3s ease-in-out;\n  -moz-transition: all 0.3s ease-in-out;\n  -webkit-transition: all 0.3s ease-in-out;\n}\n.social-icons li:hover > a {\n  background-position: 0 -38px;\n}\n.social-icons li .twitter {\n  background: url(/assets/common/images/social/twitter.png) no-repeat;\n}\n.social-icons li .facebook {\n  background: url(/assets/common/images/social/facebook.png) no-repeat;\n}\n.social-icons li .googleplus {\n  background: url(/assets/common/images/social/google.png) no-repeat;\n}\n.social-icons li .microsoft {\n  background: url(/assets/common/images/social/microsoft.png) no-repeat;\n}\n.social-icons li .openidconnect {\n  background: url(/assets/common/images/social/open-id-connect.png) no-repeat;\n}\n.social-icons li .wsfederation {\n  background: url(/assets/common/images/social/ws-federation.png) no-repeat;\n}\n.login-options .social-icons li a {\n  border-radius: 15px 15px 15px 15px !important;\n  -moz-border-radius: 15px 15px 15px 15px !important;\n  -webkit-border-radius: 15px 15px 15px 15px !important;\n}\n.login .content .form-actions .checkbox {\n  margin-left: 0;\n  padding-left: 0;\n}\n.login .content .forget-form .form-actions {\n  border: 0;\n  margin-bottom: 0;\n  padding-bottom: 20px;\n}\n.login .content .register-form .form-actions {\n  border: 0;\n  margin-bottom: 0;\n  padding-bottom: 0px;\n}\n.login .content .form-actions .btn {\n  margin-top: 1px;\n}\n.login .content .form-actions .btn-success {\n  font-weight: 600;\n  padding: 10px 20px !important;\n}\n.login .content .form-actions .btn-default {\n  font-weight: 600;\n  padding: 10px 25px !important;\n  color: #6c7a8d;\n  background-color: #ffffff;\n  border: none;\n}\n.login .content .form-actions .btn-default:hover {\n  background-color: #fafaff;\n  color: #45b6af;\n}\n.login .content .forget-password {\n  font-size: 14px;\n  float: right;\n  display: inline-block;\n  margin-top: 10px;\n}\n.login .content .check {\n  color: #8290a3;\n}\n.login .content .rememberme {\n  margin-left: 8px;\n  margin-top: 10px;\n}\n.login .content .create-account {\n  margin: 0 -40px -40px -40px;\n  padding: 15px 0 17px 0;\n  text-align: center;\n  background-color: #6c7a8d;\n  border-radius: 0 0 7px 7px;\n}\n.login .content .create-account p a {\n  font-weight: 600;\n  font-size: 14px;\n  color: #c3cedd;\n}\n.login .content .create-account .pipe-divider {\n  color: #c3cedd;\n}\n.login .content .create-account a {\n  display: inline-block;\n  margin-top: 5px;\n}\n.login .content .alert {\n  margin-bottom: 10px;\n}\n.login .content .alert:last-child {\n  margin-bottom: 0;\n}\n/* footer copyright */\n.login .copyright {\n  text-align: center;\n  margin: 0 auto 30px 0;\n  padding: 10px;\n  color: #7a8ca5;\n  font-size: 13px;\n}\n.language-switch-area {\n  text-align: center;\n  padding: 10px;\n}\n.language-switch-area a {\n  cursor: pointer;\n  margin-right: 5px;\n}\n.language-switch-area a span {\n  -ms-opacity: 0.5;\n  opacity: 0.5;\n}\n.language-switch-area a span.language-icon-current {\n  -ms-opacity: 1;\n  opacity: 1;\n}\n@media (max-width: 440px) {\n  /***\n  Login page\n  ***/\n  .login .logo {\n    margin-top: 10px;\n  }\n  .login .content {\n    width: 280px;\n    margin-top: 10px;\n  }\n  .login .content h3 {\n    font-size: 22px;\n  }\n  .forget-password {\n    display: inline-block;\n    margin-top: 20px;\n  }\n  .login-options .social-icons {\n    float: left;\n    padding-top: 3px;\n  }\n  .login .checkbox {\n    font-size: 13px;\n  }\n}\n.content.account-forms {\n  margin-top: 10px;\n}\n.content.tenant-change-box {\n  padding: 16px;\n  text-align: center;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L2FjY291bnQuY29tcG9uZW50Lmxlc3MiLCJzcmMvYWNjb3VudC9EOi9EcmltYSBBc3BOZXRaZXJvL2FuZ3VsYXIvc3JjL2FjY291bnQvYWNjb3VudC5jb21wb25lbnQubGVzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUNILGFBQWE7QUNDYjtFQUNJLG9DQUFBO0FEQ0o7QUNFQTtFQUNJLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGFBQUE7RUFDQSxrQkFBQTtBREFKO0FDR0E7RUFDSSx5QkFBQTtFQUtBLGtCQUFBO0VBQ0EsWUFBQTtFQUNBLDJCQUFBO0VBQ0EsYUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxrQkFBQTtBRERKO0FDSUE7RUFDSSxjQUFBO0VBQ0Esa0JBQUE7RUFDQSxlQUFBO0VBQ0EsMkJBQUE7QURGSjtBQ0tBO0VBQ0ksV0FBQTtBREhKO0FDTUE7RUFDSSxXQUFBO0VBQ0EsVUFBQTtFQUNBLG9CQUFBO0FESko7QUNPQTs7RUFFSSxZQUFBO0VBQ0EsV0FBQTtBRExKO0FDUUE7RUFDSSxZQUFBO0VBQ0EseUJBQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTtFQUNBLHlCQUFBO0FETko7QUNTQTs7RUFDSSx5QkFBQTtBRE5KO0FDU0E7RUFDSSxjQUFBO0VBQ0EsVUFBQTtBRFBKO0FDVUE7RUFDSSxjQUFBO0FEUko7QUNXQTtFQUNJLGNBQUE7QURUSjtBQ1lBO0VBQ0ksaUJBQUE7RUFDQSxrQkFBQTtBRFZKO0FDYUE7RUFDSSxnQkFBQTtFQUNBLG1CQUFBO0FEWEo7QUNjQTtFQUNJLFdBQUE7RUFDQSxXQUFBO0VBQ0EsNkJBQUE7RUFDQSwyQkFBQTtFQUNBLGtCQUFBO0VBQ0EsbUJBQUE7QURaSjtBQ2VBO0VBQ0ksbUJBQUE7RUFDQSxnQkFBQTtBRGJKO0FDZ0JBO0VBQ0ksV0FBQTtFQUNBLGdCQUFBO0VBQ0EsZUFBQTtFQUNBLHlCQUFBO0FEZEo7QUNpQkE7RUFDSSxZQUFBO0VBQ0EsZ0JBQUE7QURmSjtBQ2tCQTtFQUNJLFVBQUE7RUFDQSxTQUFBO0FEaEJKO0FDbUJBO0VBQ0ksV0FBQTtFQUNBLGVBQUE7RUFDQSxnQkFBQTtFQUNBLGlCQUFBO0VBQ0Esa0JBQUE7RUFDQSxvQkFBQTtBRGpCSjtBQ29CQTtFQUNJLGVBQUE7RUFLQSxrQkFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTtFQUNBLHdCQUFBO0VBQ0EsNEJBQUE7RUFDQSxnQ0FBQTtFQUNBLG1DQUFBO0VBQ0Esb0NBQUE7RUFDQSxxQ0FBQTtFQUNBLHdDQUFBO0FEbEJKO0FDcUJBO0VBQ0ksNEJBQUE7QURuQko7QUNzQkE7RUFDSSxtRUFBQTtBRHBCSjtBQ3VCQTtFQUNJLG9FQUFBO0FEckJKO0FDd0JBO0VBQ0ksa0VBQUE7QUR0Qko7QUN5QkE7RUFDSSxxRUFBQTtBRHZCSjtBQzBCQTtFQUNJLDJFQUFBO0FEeEJKO0FDMkJBO0VBQ0kseUVBQUE7QUR6Qko7QUM0QkE7RUFDSSw2Q0FBQTtFQUNBLGtEQUFBO0VBQ0EscURBQUE7QUQxQko7QUM2QkE7RUFDSSxjQUFBO0VBQ0EsZUFBQTtBRDNCSjtBQzhCQTtFQUNJLFNBQUE7RUFDQSxnQkFBQTtFQUNBLG9CQUFBO0FENUJKO0FDK0JBO0VBQ0ksU0FBQTtFQUNBLGdCQUFBO0VBQ0EsbUJBQUE7QUQ3Qko7QUNnQ0E7RUFDSSxlQUFBO0FEOUJKO0FDaUNBO0VBQ0ksZ0JBQUE7RUFDQSw2QkFBQTtBRC9CSjtBQ2tDQTtFQUNJLGdCQUFBO0VBQ0EsNkJBQUE7RUFDQSxjQUFBO0VBQ0EseUJBQUE7RUFDQSxZQUFBO0FEaENKO0FDbUNBO0VBQ0kseUJBQUE7RUFDQSxjQUFBO0FEakNKO0FDb0NBO0VBQ0ksZUFBQTtFQUNBLFlBQUE7RUFDQSxxQkFBQTtFQUNBLGdCQUFBO0FEbENKO0FDcUNBO0VBQ0ksY0FBQTtBRG5DSjtBQ3NDQTtFQUNJLGdCQUFBO0VBQ0EsZ0JBQUE7QURwQ0o7QUN1Q0E7RUFDSSwyQkFBQTtFQUNBLHNCQUFBO0VBQ0Esa0JBQUE7RUFDQSx5QkFBQTtFQUtBLDBCQUFBO0FEckNKO0FDd0NBO0VBQ0ksZ0JBQUE7RUFDQSxlQUFBO0VBQ0EsY0FBQTtBRHRDSjtBQ3lDQTtFQUNJLGNBQUE7QUR2Q0o7QUMwQ0E7RUFDSSxxQkFBQTtFQUNBLGVBQUE7QUR4Q0o7QUMyQ0E7RUFDSSxtQkFBQTtBRHpDSjtBQzRDQTtFQUNJLGdCQUFBO0FEMUNKO0FBQ0EscUJBQXFCO0FDK0NyQjtFQUNJLGtCQUFBO0VBQ0EscUJBQUE7RUFDQSxhQUFBO0VBQ0EsY0FBQTtFQUNBLGVBQUE7QUQ3Q0o7QUNnREE7RUFDSSxrQkFBQTtFQUNBLGFBQUE7QUQ5Q0o7QUM0Q0E7RUFLUSxlQUFBO0VBQ0EsaUJBQUE7QUQ5Q1I7QUN3Q0E7RUFTWSxnQkFBQTtFQUNBLFlBQUE7QUQ5Q1o7QUNnRFk7RUFDSSxjQUFBO0VBQ0EsVUFBQTtBRDlDaEI7QUNvREE7RURsREU7O0tBRUc7RUNvREQ7SUFDSSxnQkFBQTtFRGxETjtFQ3FERTtJQUNJLFlBQUE7SUFDQSxnQkFBQTtFRG5ETjtFQ3NERTtJQUNJLGVBQUE7RURwRE47RUN1REU7SUFDSSxxQkFBQTtJQUNBLGdCQUFBO0VEckROO0VDd0RFO0lBQ0ksV0FBQTtJQUNBLGdCQUFBO0VEdEROO0VDeURFO0lBQ0ksZUFBQTtFRHZETjtBQUNGO0FDMERBO0VBQ0ksZ0JBQUE7QUR4REo7QUMyREE7RUFDSSxhQUFBO0VBQ0Esa0JBQUE7QUR6REoiLCJmaWxlIjoic3JjL2FjY291bnQvYWNjb3VudC5jb21wb25lbnQubGVzcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKipcbkxvZ2luIHBhZ2VcbioqKi9cbi8qIGJnIGNvbG9yICovXG4ubG9naW4ge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzY0MTUwICFpbXBvcnRhbnQ7XG59XG4ubG9naW4gLmxvZ28ge1xuICBtYXJnaW46IDAgYXV0bztcbiAgbWFyZ2luLXRvcDogNjBweDtcbiAgcGFkZGluZzogMTVweDtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuLmxvZ2luIC5jb250ZW50IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2VjZWVmMTtcbiAgLXdlYmtpdC1ib3JkZXItcmFkaXVzOiA3cHg7XG4gIC1tb3otYm9yZGVyLXJhZGl1czogN3B4O1xuICAtbXMtYm9yZGVyLXJhZGl1czogN3B4O1xuICAtby1ib3JkZXItcmFkaXVzOiA3cHg7XG4gIGJvcmRlci1yYWRpdXM6IDdweDtcbiAgd2lkdGg6IDQwMHB4O1xuICBtYXJnaW46IDQwcHggYXV0byAxMHB4IGF1dG87XG4gIHBhZGRpbmc6IDMwcHg7XG4gIHBhZGRpbmctdG9wOiAxMHB4O1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG4ubG9naW4gLmNvbnRlbnQgaDMge1xuICBjb2xvcjogIzRkYjNhNTtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBmb250LXNpemU6IDI4cHg7XG4gIGZvbnQtd2VpZ2h0OiA0MDAgIWltcG9ydGFudDtcbn1cbi5sb2dpbiAuY29udGVudCBoNCB7XG4gIGNvbG9yOiAjNTU1O1xufVxuLmxvZ2luIC5jb250ZW50IC5oaW50IHtcbiAgY29sb3I6ICM5OTk7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMTVweCAwIDdweCAwO1xufVxuLmxvZ2luIC5jb250ZW50IC5sb2dpbi1mb3JtLFxuLmxvZ2luIC5jb250ZW50IC5mb3JnZXQtZm9ybSB7XG4gIHBhZGRpbmc6IDBweDtcbiAgbWFyZ2luOiAwcHg7XG59XG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tY29udHJvbCB7XG4gIGJvcmRlcjogbm9uZTtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2RkZTNlYztcbiAgaGVpZ2h0OiA0M3B4O1xuICBjb2xvcjogIzgyOTBhMztcbiAgYm9yZGVyOiAxcHggc29saWQgI2RkZTNlYztcbn1cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOmZvY3VzLFxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWNvbnRyb2w6YWN0aXZlIHtcbiAgYm9yZGVyOiAxcHggc29saWQgI2MzY2NkYTtcbn1cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOjotbW96LXBsYWNlaG9sZGVyIHtcbiAgY29sb3I6ICM4MjkwYTM7XG4gIG9wYWNpdHk6IDE7XG59XG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tY29udHJvbDotbXMtaW5wdXQtcGxhY2Vob2xkZXIge1xuICBjb2xvcjogIzgyOTBhMztcbn1cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyIHtcbiAgY29sb3I6ICM4MjkwYTM7XG59XG4ubG9naW4gLmNvbnRlbnQgc2VsZWN0LmZvcm0tY29udHJvbCB7XG4gIHBhZGRpbmctbGVmdDogOXB4O1xuICBwYWRkaW5nLXJpZ2h0OiA5cHg7XG59XG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tdGl0bGUge1xuICBmb250LXdlaWdodDogMzAwO1xuICBtYXJnaW4tYm90dG9tOiAyNXB4O1xufVxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWFjdGlvbnMge1xuICBjbGVhcjogYm90aDtcbiAgYm9yZGVyOiAwcHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZWVlO1xuICBwYWRkaW5nOiAwcHggMzBweCAyNXB4IDMwcHg7XG4gIG1hcmdpbi1sZWZ0OiAtMzBweDtcbiAgbWFyZ2luLXJpZ2h0OiAtMzBweDtcbn1cbi5sb2dpbi1vcHRpb25zIHtcbiAgbWFyZ2luLWJvdHRvbTogMzBweDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cbi5sb2dpbi1vcHRpb25zIGg0IHtcbiAgZmxvYXQ6IGxlZnQ7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGZvbnQtc2l6ZTogMTVweDtcbiAgY29sb3I6ICM3ZDkxYWEgIWltcG9ydGFudDtcbn1cbi5sb2dpbi1vcHRpb25zIC5zb2NpYWwtaWNvbnMge1xuICBmbG9hdDogcmlnaHQ7XG4gIHBhZGRpbmctdG9wOiAzcHg7XG59XG4uc29jaWFsLWljb25zIHtcbiAgcGFkZGluZzogMDtcbiAgbWFyZ2luOiAwO1xufVxuLnNvY2lhbC1pY29ucyBsaSB7XG4gIGZsb2F0OiBsZWZ0O1xuICBkaXNwbGF5OiBpbmxpbmU7XG4gIGxpc3Qtc3R5bGU6IG5vbmU7XG4gIG1hcmdpbi1yaWdodDogNXB4O1xuICBtYXJnaW4tYm90dG9tOiA1cHg7XG4gIHRleHQtaW5kZW50OiAtOTk5OXB4O1xufVxuLnNvY2lhbC1pY29ucyBsaSA+IGEge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIC13ZWJraXQtYm9yZGVyLXJhZGl1czogMnB4O1xuICAtbW96LWJvcmRlci1yYWRpdXM6IDJweDtcbiAgLW1zLWJvcmRlci1yYWRpdXM6IDJweDtcbiAgLW8tYm9yZGVyLXJhZGl1czogMnB4O1xuICBib3JkZXItcmFkaXVzOiAycHg7XG4gIHdpZHRoOiAyOHB4O1xuICBoZWlnaHQ6IDI4cHg7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwIDA7XG4gIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAtby10cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlLWluLW91dDtcbiAgLW1zLXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAtbW96LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xufVxuLnNvY2lhbC1pY29ucyBsaTpob3ZlciA+IGEge1xuICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwIC0zOHB4O1xufVxuLnNvY2lhbC1pY29ucyBsaSAudHdpdHRlciB7XG4gIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL3R3aXR0ZXIucG5nKSBuby1yZXBlYXQ7XG59XG4uc29jaWFsLWljb25zIGxpIC5mYWNlYm9vayB7XG4gIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL2ZhY2Vib29rLnBuZykgbm8tcmVwZWF0O1xufVxuLnNvY2lhbC1pY29ucyBsaSAuZ29vZ2xlcGx1cyB7XG4gIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL2dvb2dsZS5wbmcpIG5vLXJlcGVhdDtcbn1cbi5zb2NpYWwtaWNvbnMgbGkgLm1pY3Jvc29mdCB7XG4gIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL21pY3Jvc29mdC5wbmcpIG5vLXJlcGVhdDtcbn1cbi5zb2NpYWwtaWNvbnMgbGkgLm9wZW5pZGNvbm5lY3Qge1xuICBiYWNrZ3JvdW5kOiB1cmwoL2Fzc2V0cy9jb21tb24vaW1hZ2VzL3NvY2lhbC9vcGVuLWlkLWNvbm5lY3QucG5nKSBuby1yZXBlYXQ7XG59XG4uc29jaWFsLWljb25zIGxpIC53c2ZlZGVyYXRpb24ge1xuICBiYWNrZ3JvdW5kOiB1cmwoL2Fzc2V0cy9jb21tb24vaW1hZ2VzL3NvY2lhbC93cy1mZWRlcmF0aW9uLnBuZykgbm8tcmVwZWF0O1xufVxuLmxvZ2luLW9wdGlvbnMgLnNvY2lhbC1pY29ucyBsaSBhIHtcbiAgYm9yZGVyLXJhZGl1czogMTVweCAxNXB4IDE1cHggMTVweCAhaW1wb3J0YW50O1xuICAtbW96LWJvcmRlci1yYWRpdXM6IDE1cHggMTVweCAxNXB4IDE1cHggIWltcG9ydGFudDtcbiAgLXdlYmtpdC1ib3JkZXItcmFkaXVzOiAxNXB4IDE1cHggMTVweCAxNXB4ICFpbXBvcnRhbnQ7XG59XG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tYWN0aW9ucyAuY2hlY2tib3gge1xuICBtYXJnaW4tbGVmdDogMDtcbiAgcGFkZGluZy1sZWZ0OiAwO1xufVxuLmxvZ2luIC5jb250ZW50IC5mb3JnZXQtZm9ybSAuZm9ybS1hY3Rpb25zIHtcbiAgYm9yZGVyOiAwO1xuICBtYXJnaW4tYm90dG9tOiAwO1xuICBwYWRkaW5nLWJvdHRvbTogMjBweDtcbn1cbi5sb2dpbiAuY29udGVudCAucmVnaXN0ZXItZm9ybSAuZm9ybS1hY3Rpb25zIHtcbiAgYm9yZGVyOiAwO1xuICBtYXJnaW4tYm90dG9tOiAwO1xuICBwYWRkaW5nLWJvdHRvbTogMHB4O1xufVxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWFjdGlvbnMgLmJ0biB7XG4gIG1hcmdpbi10b3A6IDFweDtcbn1cbi5sb2dpbiAuY29udGVudCAuZm9ybS1hY3Rpb25zIC5idG4tc3VjY2VzcyB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHBhZGRpbmc6IDEwcHggMjBweCAhaW1wb3J0YW50O1xufVxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWFjdGlvbnMgLmJ0bi1kZWZhdWx0IHtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgcGFkZGluZzogMTBweCAyNXB4ICFpbXBvcnRhbnQ7XG4gIGNvbG9yOiAjNmM3YThkO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXI6IG5vbmU7XG59XG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tYWN0aW9ucyAuYnRuLWRlZmF1bHQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmFmYWZmO1xuICBjb2xvcjogIzQ1YjZhZjtcbn1cbi5sb2dpbiAuY29udGVudCAuZm9yZ2V0LXBhc3N3b3JkIHtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBmbG9hdDogcmlnaHQ7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgbWFyZ2luLXRvcDogMTBweDtcbn1cbi5sb2dpbiAuY29udGVudCAuY2hlY2sge1xuICBjb2xvcjogIzgyOTBhMztcbn1cbi5sb2dpbiAuY29udGVudCAucmVtZW1iZXJtZSB7XG4gIG1hcmdpbi1sZWZ0OiA4cHg7XG4gIG1hcmdpbi10b3A6IDEwcHg7XG59XG4ubG9naW4gLmNvbnRlbnQgLmNyZWF0ZS1hY2NvdW50IHtcbiAgbWFyZ2luOiAwIC00MHB4IC00MHB4IC00MHB4O1xuICBwYWRkaW5nOiAxNXB4IDAgMTdweCAwO1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIGJhY2tncm91bmQtY29sb3I6ICM2YzdhOGQ7XG4gIC13ZWJraXQtYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gIC1tb3otYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gIC1tcy1ib3JkZXItcmFkaXVzOiAwIDAgN3B4IDdweDtcbiAgLW8tYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gIGJvcmRlci1yYWRpdXM6IDAgMCA3cHggN3B4O1xufVxuLmxvZ2luIC5jb250ZW50IC5jcmVhdGUtYWNjb3VudCBwIGEge1xuICBmb250LXdlaWdodDogNjAwO1xuICBmb250LXNpemU6IDE0cHg7XG4gIGNvbG9yOiAjYzNjZWRkO1xufVxuLmxvZ2luIC5jb250ZW50IC5jcmVhdGUtYWNjb3VudCAucGlwZS1kaXZpZGVyIHtcbiAgY29sb3I6ICNjM2NlZGQ7XG59XG4ubG9naW4gLmNvbnRlbnQgLmNyZWF0ZS1hY2NvdW50IGEge1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIG1hcmdpbi10b3A6IDVweDtcbn1cbi5sb2dpbiAuY29udGVudCAuYWxlcnQge1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuLmxvZ2luIC5jb250ZW50IC5hbGVydDpsYXN0LWNoaWxkIHtcbiAgbWFyZ2luLWJvdHRvbTogMDtcbn1cbi8qIGZvb3RlciBjb3B5cmlnaHQgKi9cbi5sb2dpbiAuY29weXJpZ2h0IHtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBtYXJnaW46IDAgYXV0byAzMHB4IDA7XG4gIHBhZGRpbmc6IDEwcHg7XG4gIGNvbG9yOiAjN2E4Y2E1O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ubGFuZ3VhZ2Utc3dpdGNoLWFyZWEge1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDEwcHg7XG59XG4ubGFuZ3VhZ2Utc3dpdGNoLWFyZWEgYSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgbWFyZ2luLXJpZ2h0OiA1cHg7XG59XG4ubGFuZ3VhZ2Utc3dpdGNoLWFyZWEgYSBzcGFuIHtcbiAgLW1zLW9wYWNpdHk6IDAuNTtcbiAgb3BhY2l0eTogMC41O1xufVxuLmxhbmd1YWdlLXN3aXRjaC1hcmVhIGEgc3Bhbi5sYW5ndWFnZS1pY29uLWN1cnJlbnQge1xuICAtbXMtb3BhY2l0eTogMTtcbiAgb3BhY2l0eTogMTtcbn1cbkBtZWRpYSAobWF4LXdpZHRoOiA0NDBweCkge1xuICAvKioqXG4gIExvZ2luIHBhZ2VcbiAgKioqL1xuICAubG9naW4gLmxvZ28ge1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gIH1cbiAgLmxvZ2luIC5jb250ZW50IHtcbiAgICB3aWR0aDogMjgwcHg7XG4gICAgbWFyZ2luLXRvcDogMTBweDtcbiAgfVxuICAubG9naW4gLmNvbnRlbnQgaDMge1xuICAgIGZvbnQtc2l6ZTogMjJweDtcbiAgfVxuICAuZm9yZ2V0LXBhc3N3b3JkIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgbWFyZ2luLXRvcDogMjBweDtcbiAgfVxuICAubG9naW4tb3B0aW9ucyAuc29jaWFsLWljb25zIHtcbiAgICBmbG9hdDogbGVmdDtcbiAgICBwYWRkaW5nLXRvcDogM3B4O1xuICB9XG4gIC5sb2dpbiAuY2hlY2tib3gge1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgfVxufVxuLmNvbnRlbnQuYWNjb3VudC1mb3JtcyB7XG4gIG1hcmdpbi10b3A6IDEwcHg7XG59XG4uY29udGVudC50ZW5hbnQtY2hhbmdlLWJveCB7XG4gIHBhZGRpbmc6IDE2cHg7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cbiIsIi8qKipcbkxvZ2luIHBhZ2VcbioqKi9cbi8qIGJnIGNvbG9yICovXG4ubG9naW4ge1xuICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjQxNTAgIWltcG9ydGFudDtcbn1cblxuLmxvZ2luIC5sb2dvIHtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBtYXJnaW4tdG9wOiA2MHB4O1xuICAgIHBhZGRpbmc6IDE1cHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4ubG9naW4gLmNvbnRlbnQge1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNlY2VlZjE7XG4gICAgLXdlYmtpdC1ib3JkZXItcmFkaXVzOiA3cHg7XG4gICAgLW1vei1ib3JkZXItcmFkaXVzOiA3cHg7XG4gICAgLW1zLWJvcmRlci1yYWRpdXM6IDdweDtcbiAgICAtby1ib3JkZXItcmFkaXVzOiA3cHg7XG4gICAgYm9yZGVyLXJhZGl1czogN3B4O1xuICAgIHdpZHRoOiA0MDBweDtcbiAgICBtYXJnaW46IDQwcHggYXV0byAxMHB4IGF1dG87XG4gICAgcGFkZGluZzogMzBweDtcbiAgICBwYWRkaW5nLXRvcDogMTBweDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmxvZ2luIC5jb250ZW50IGgzIHtcbiAgICBjb2xvcjogIzRkYjNhNTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgZm9udC1zaXplOiAyOHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA0MDAgIWltcG9ydGFudDtcbn1cblxuLmxvZ2luIC5jb250ZW50IGg0IHtcbiAgICBjb2xvcjogIzU1NTtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5oaW50IHtcbiAgICBjb2xvcjogIzk5OTtcbiAgICBwYWRkaW5nOiAwO1xuICAgIG1hcmdpbjogMTVweCAwIDdweCAwO1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmxvZ2luLWZvcm0sXG4ubG9naW4gLmNvbnRlbnQgLmZvcmdldC1mb3JtIHtcbiAgICBwYWRkaW5nOiAwcHg7XG4gICAgbWFyZ2luOiAwcHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sIHtcbiAgICBib3JkZXI6IG5vbmU7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2RkZTNlYztcbiAgICBoZWlnaHQ6IDQzcHg7XG4gICAgY29sb3I6ICM4MjkwYTM7XG4gICAgYm9yZGVyOiAxcHggc29saWQgI2RkZTNlYztcbn1cblxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWNvbnRyb2w6Zm9jdXMsIC5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOmFjdGl2ZSB7XG4gICAgYm9yZGVyOiAxcHggc29saWQgI2MzY2NkYTtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWNvbnRyb2w6Oi1tb3otcGxhY2Vob2xkZXIge1xuICAgIGNvbG9yOiAjODI5MGEzO1xuICAgIG9wYWNpdHk6IDE7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOi1tcy1pbnB1dC1wbGFjZWhvbGRlciB7XG4gICAgY29sb3I6ICM4MjkwYTM7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9ybS1jb250cm9sOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyIHtcbiAgICBjb2xvcjogIzgyOTBhMztcbn1cblxuLmxvZ2luIC5jb250ZW50IHNlbGVjdC5mb3JtLWNvbnRyb2wge1xuICAgIHBhZGRpbmctbGVmdDogOXB4O1xuICAgIHBhZGRpbmctcmlnaHQ6IDlweDtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5mb3JtLXRpdGxlIHtcbiAgICBmb250LXdlaWdodDogMzAwO1xuICAgIG1hcmdpbi1ib3R0b206IDI1cHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9ybS1hY3Rpb25zIHtcbiAgICBjbGVhcjogYm90aDtcbiAgICBib3JkZXI6IDBweDtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2VlZTtcbiAgICBwYWRkaW5nOiAwcHggMzBweCAyNXB4IDMwcHg7XG4gICAgbWFyZ2luLWxlZnQ6IC0zMHB4O1xuICAgIG1hcmdpbi1yaWdodDogLTMwcHg7XG59XG5cbi5sb2dpbi1vcHRpb25zIHtcbiAgICBtYXJnaW4tYm90dG9tOiAzMHB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG59XG5cbi5sb2dpbi1vcHRpb25zIGg0IHtcbiAgICBmbG9hdDogbGVmdDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICBjb2xvcjogIzdkOTFhYSAhaW1wb3J0YW50O1xufVxuXG4ubG9naW4tb3B0aW9ucyAuc29jaWFsLWljb25zIHtcbiAgICBmbG9hdDogcmlnaHQ7XG4gICAgcGFkZGluZy10b3A6IDNweDtcbn1cblxuLnNvY2lhbC1pY29ucyB7XG4gICAgcGFkZGluZzogMDtcbiAgICBtYXJnaW46IDA7XG59XG5cbi5zb2NpYWwtaWNvbnMgbGkge1xuICAgIGZsb2F0OiBsZWZ0O1xuICAgIGRpc3BsYXk6IGlubGluZTtcbiAgICBsaXN0LXN0eWxlOiBub25lO1xuICAgIG1hcmdpbi1yaWdodDogNXB4O1xuICAgIG1hcmdpbi1ib3R0b206IDVweDtcbiAgICB0ZXh0LWluZGVudDogLTk5OTlweDtcbn1cblxuLnNvY2lhbC1pY29ucyBsaSA+IGEge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAtd2Via2l0LWJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAtbXMtYm9yZGVyLXJhZGl1czogMnB4O1xuICAgIC1vLWJvcmRlci1yYWRpdXM6IDJweDtcbiAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgd2lkdGg6IDI4cHg7XG4gICAgaGVpZ2h0OiAyOHB4O1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIGJhY2tncm91bmQtcG9zaXRpb246IDAgMDtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIC1vLXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIC1tcy10cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlLWluLW91dDtcbiAgICAtbW96LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0O1xuICAgIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZS1pbi1vdXQ7XG59XG5cbi5zb2NpYWwtaWNvbnMgbGk6aG92ZXIgPiBhIHtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwIC0zOHB4O1xufVxuXG4uc29jaWFsLWljb25zIGxpIC50d2l0dGVyIHtcbiAgICBiYWNrZ3JvdW5kOiB1cmwoL2Fzc2V0cy9jb21tb24vaW1hZ2VzL3NvY2lhbC90d2l0dGVyLnBuZykgbm8tcmVwZWF0O1xufVxuXG4uc29jaWFsLWljb25zIGxpIC5mYWNlYm9vayB7XG4gICAgYmFja2dyb3VuZDogdXJsKC9hc3NldHMvY29tbW9uL2ltYWdlcy9zb2NpYWwvZmFjZWJvb2sucG5nKSBuby1yZXBlYXQ7XG59XG5cbi5zb2NpYWwtaWNvbnMgbGkgLmdvb2dsZXBsdXMge1xuICAgIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL2dvb2dsZS5wbmcpIG5vLXJlcGVhdDtcbn1cblxuLnNvY2lhbC1pY29ucyBsaSAubWljcm9zb2Z0IHtcbiAgICBiYWNrZ3JvdW5kOiB1cmwoL2Fzc2V0cy9jb21tb24vaW1hZ2VzL3NvY2lhbC9taWNyb3NvZnQucG5nKSBuby1yZXBlYXQ7XG59XG5cbi5zb2NpYWwtaWNvbnMgbGkgLm9wZW5pZGNvbm5lY3Qge1xuICAgIGJhY2tncm91bmQ6IHVybCgvYXNzZXRzL2NvbW1vbi9pbWFnZXMvc29jaWFsL29wZW4taWQtY29ubmVjdC5wbmcpIG5vLXJlcGVhdDtcbn1cblxuLnNvY2lhbC1pY29ucyBsaSAud3NmZWRlcmF0aW9uIHtcbiAgICBiYWNrZ3JvdW5kOiB1cmwoL2Fzc2V0cy9jb21tb24vaW1hZ2VzL3NvY2lhbC93cy1mZWRlcmF0aW9uLnBuZykgbm8tcmVwZWF0O1xufVxuXG4ubG9naW4tb3B0aW9ucyAuc29jaWFsLWljb25zIGxpIGEge1xuICAgIGJvcmRlci1yYWRpdXM6IDE1cHggMTVweCAxNXB4IDE1cHggIWltcG9ydGFudDtcbiAgICAtbW96LWJvcmRlci1yYWRpdXM6IDE1cHggMTVweCAxNXB4IDE1cHggIWltcG9ydGFudDtcbiAgICAtd2Via2l0LWJvcmRlci1yYWRpdXM6IDE1cHggMTVweCAxNXB4IDE1cHggIWltcG9ydGFudDtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWFjdGlvbnMgLmNoZWNrYm94IHtcbiAgICBtYXJnaW4tbGVmdDogMDtcbiAgICBwYWRkaW5nLWxlZnQ6IDA7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9yZ2V0LWZvcm0gLmZvcm0tYWN0aW9ucyB7XG4gICAgYm9yZGVyOiAwO1xuICAgIG1hcmdpbi1ib3R0b206IDA7XG4gICAgcGFkZGluZy1ib3R0b206IDIwcHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAucmVnaXN0ZXItZm9ybSAuZm9ybS1hY3Rpb25zIHtcbiAgICBib3JkZXI6IDA7XG4gICAgbWFyZ2luLWJvdHRvbTogMDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMHB4O1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tYWN0aW9ucyAuYnRuIHtcbiAgICBtYXJnaW4tdG9wOiAxcHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9ybS1hY3Rpb25zIC5idG4tc3VjY2VzcyB7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICBwYWRkaW5nOiAxMHB4IDIwcHggIWltcG9ydGFudDtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5mb3JtLWFjdGlvbnMgLmJ0bi1kZWZhdWx0IHtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIHBhZGRpbmc6IDEwcHggMjVweCAhaW1wb3J0YW50O1xuICAgIGNvbG9yOiAjNmM3YThkO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7XG4gICAgYm9yZGVyOiBub25lO1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmZvcm0tYWN0aW9ucyAuYnRuLWRlZmF1bHQ6aG92ZXIge1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmYWZhZmY7XG4gICAgY29sb3I6ICM0NWI2YWY7XG59XG5cbi5sb2dpbiAuY29udGVudCAuZm9yZ2V0LXBhc3N3b3JkIHtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZmxvYXQ6IHJpZ2h0O1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICBtYXJnaW4tdG9wOiAxMHB4O1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmNoZWNrIHtcbiAgICBjb2xvcjogIzgyOTBhMztcbn1cblxuLmxvZ2luIC5jb250ZW50IC5yZW1lbWJlcm1lIHtcbiAgICBtYXJnaW4tbGVmdDogOHB4O1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAuY3JlYXRlLWFjY291bnQge1xuICAgIG1hcmdpbjogMCAtNDBweCAtNDBweCAtNDBweDtcbiAgICBwYWRkaW5nOiAxNXB4IDAgMTdweCAwO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNmM3YThkO1xuICAgIC13ZWJraXQtYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gICAgLW1vei1ib3JkZXItcmFkaXVzOiAwIDAgN3B4IDdweDtcbiAgICAtbXMtYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gICAgLW8tYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMCAwIDdweCA3cHg7XG59XG5cbi5sb2dpbiAuY29udGVudCAuY3JlYXRlLWFjY291bnQgcCBhIHtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBjb2xvcjogI2MzY2VkZDtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5jcmVhdGUtYWNjb3VudCAucGlwZS1kaXZpZGVyIHtcbiAgICBjb2xvcjogI2MzY2VkZDtcbn1cblxuLmxvZ2luIC5jb250ZW50IC5jcmVhdGUtYWNjb3VudCBhIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgbWFyZ2luLXRvcDogNXB4O1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmFsZXJ0IHtcbiAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4ubG9naW4gLmNvbnRlbnQgLmFsZXJ0Omxhc3QtY2hpbGQge1xuICAgIG1hcmdpbi1ib3R0b206IDA7XG59XG5cblxuXG4vKiBmb290ZXIgY29weXJpZ2h0ICovXG4ubG9naW4gLmNvcHlyaWdodCB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIG1hcmdpbjogMCBhdXRvIDMwcHggMDtcbiAgICBwYWRkaW5nOiAxMHB4O1xuICAgIGNvbG9yOiAjN2E4Y2E1O1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbn1cblxuLmxhbmd1YWdlLXN3aXRjaC1hcmVhIHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgcGFkZGluZzogMTBweDtcblxuICAgIGEge1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIG1hcmdpbi1yaWdodDogNXB4O1xuXG4gICAgICAgIHNwYW4ge1xuICAgICAgICAgICAgLW1zLW9wYWNpdHk6IDAuNTtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuNTtcblxuICAgICAgICAgICAgJi5sYW5ndWFnZS1pY29uLWN1cnJlbnQge1xuICAgICAgICAgICAgICAgIC1tcy1vcGFjaXR5OiAxO1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkBtZWRpYSAobWF4LXdpZHRoOiA0NDBweCkge1xuICAgIC8qKipcbiAgTG9naW4gcGFnZVxuICAqKiovXG4gICAgLmxvZ2luIC5sb2dvIHtcbiAgICAgICAgbWFyZ2luLXRvcDogMTBweDtcbiAgICB9XG5cbiAgICAubG9naW4gLmNvbnRlbnQge1xuICAgICAgICB3aWR0aDogMjgwcHg7XG4gICAgICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgfVxuXG4gICAgLmxvZ2luIC5jb250ZW50IGgzIHtcbiAgICAgICAgZm9udC1zaXplOiAyMnB4O1xuICAgIH1cblxuICAgIC5mb3JnZXQtcGFzc3dvcmQge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgIG1hcmdpbi10b3A6IDIwcHg7XG4gICAgfVxuXG4gICAgLmxvZ2luLW9wdGlvbnMgLnNvY2lhbC1pY29ucyB7XG4gICAgICAgIGZsb2F0OiBsZWZ0O1xuICAgICAgICBwYWRkaW5nLXRvcDogM3B4O1xuICAgIH1cblxuICAgIC5sb2dpbiAuY2hlY2tib3gge1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgfVxufVxuXG4uY29udGVudC5hY2NvdW50LWZvcm1zIHtcbiAgICBtYXJnaW4tdG9wOiAxMHB4O1xufVxuXG4uY29udGVudC50ZW5hbnQtY2hhbmdlLWJveCB7XG4gICAgcGFkZGluZzogMTZweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG4iXX0= */"

/***/ }),

/***/ "./src/account/account.component.ts":
/*!******************************************!*\
  !*** ./src/account/account.component.ts ***!
  \******************************************/
/*! exports provided: AccountComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AccountComponent", function() { return AccountComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_common_ui_app_ui_customization_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/ui/app-ui-customization.service */ "./src/shared/common/ui/app-ui-customization.service.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! moment */ "./node_modules/moment/moment.js");
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(moment__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _login_login_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./login/login.service */ "./src/account/login/login.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var AccountComponent = /** @class */ (function (_super) {
    __extends(AccountComponent, _super);
    function AccountComponent(injector, _router, _loginService, _uiCustomizationService, viewContainerRef) {
        var _this = _super.call(this, injector) || this;
        _this._router = _router;
        _this._loginService = _loginService;
        _this._uiCustomizationService = _uiCustomizationService;
        _this.currentYear = moment__WEBPACK_IMPORTED_MODULE_6__().year();
        _this.remoteServiceBaseUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].remoteServiceBaseUrl;
        _this.tenantChangeDisabledRoutes = [
            'select-edition',
            'buy',
            'upgrade',
            'extend',
            'register-tenant',
            'stripe-purchase',
            'stripe-subscribe',
            'stripe-update-subscription',
            'paypal-purchase',
            'enrollment'
        ];
        // We need this small hack in order to catch application root view container ref for modals
        _this.viewContainerRef = viewContainerRef;
        return _this;
    }
    AccountComponent.prototype.showTenantChange = function () {
        var _this = this;
        if (!this._router.url) {
            return false;
        }
        if (lodash__WEBPACK_IMPORTED_MODULE_5__["filter"](this.tenantChangeDisabledRoutes, function (route) { return _this._router.url.indexOf('/account/' + route) >= 0; }).length) {
            return false;
        }
        return abp.multiTenancy.isEnabled && !this.supportsTenancyNameInUrl();
    };
    AccountComponent.prototype.useFullWidthLayout = function () {
        return this._router.url.indexOf('/account/select-edition') >= 0 || this._router.url.indexOf('/account/enrollment') >= 0;
    };
    AccountComponent.prototype.ngOnInit = function () {
        this._loginService.init();
        document.body.className = this._uiCustomizationService.getAccountModuleBodyClass();
    };
    AccountComponent.prototype.goToHome = function () {
        window.location.href = '/';
    };
    AccountComponent.prototype.getBgUrl = function () {
        return 'url(./assets/metronic/assets/demo/' + this.currentTheme.baseSettings.layout.themeColor + '/media/img/bg/bg-4.jpg)';
    };
    AccountComponent.prototype.supportsTenancyNameInUrl = function () {
        return (_shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].appBaseUrlFormat && _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].appBaseUrlFormat.indexOf(_shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].tenancyNamePlaceHolderInUrl) >= 0);
    };
    AccountComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./account.component.html */ "./src/account/account.component.html"),
            encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewEncapsulation"].None,
            styles: [__webpack_require__(/*! ./account.component.less */ "./src/account/account.component.less")]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _login_login_service__WEBPACK_IMPORTED_MODULE_7__["LoginService"],
            _shared_common_ui_app_ui_customization_service__WEBPACK_IMPORTED_MODULE_4__["AppUiCustomizationService"],
            _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewContainerRef"]])
    ], AccountComponent);
    return AccountComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/account.module.ts":
/*!***************************************!*\
  !*** ./src/account/account.module.ts ***!
  \***************************************/
/*! exports provided: AccountModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AccountModule", function() { return AccountModule; });
/* harmony import */ var _abp_abp_module__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @abp/abp.module */ "./node_modules/abp-ng2-module/dist/src/abp.module.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var _shared_common_common_module__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/common/common.module */ "./src/shared/common/common.module.ts");
/* harmony import */ var _shared_service_proxies_service_proxy_module__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @shared/service-proxies/service-proxy.module */ "./src/shared/service-proxies/service-proxy.module.ts");
/* harmony import */ var _shared_utils_utils_module__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @shared/utils/utils.module */ "./src/shared/utils/utils.module.ts");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ng-recaptcha */ "./node_modules/ng-recaptcha/index.js");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(ng_recaptcha__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var ngx_bootstrap_modal__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ngx-bootstrap/modal */ "./node_modules/ngx-bootstrap/modal/fesm5/ngx-bootstrap-modal.js");
/* harmony import */ var _account_routing_module__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./account-routing.module */ "./src/account/account-routing.module.ts");
/* harmony import */ var _account_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./account.component */ "./src/account/account.component.ts");
/* harmony import */ var _auth_account_route_guard__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./auth/account-route-guard */ "./src/account/auth/account-route-guard.ts");
/* harmony import */ var _email_activation_confirm_email_component__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./email-activation/confirm-email.component */ "./src/account/email-activation/confirm-email.component.ts");
/* harmony import */ var _email_activation_email_activation_component__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./email-activation/email-activation.component */ "./src/account/email-activation/email-activation.component.ts");
/* harmony import */ var _language_switch_component__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./language-switch.component */ "./src/account/language-switch.component.ts");
/* harmony import */ var _login_login_component__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./login/login.component */ "./src/account/login/login.component.ts");
/* harmony import */ var _login_login_service__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./login/login.service */ "./src/account/login/login.service.ts");
/* harmony import */ var _login_send_two_factor_code_component__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./login/send-two-factor-code.component */ "./src/account/login/send-two-factor-code.component.ts");
/* harmony import */ var _login_validate_two_factor_code_component__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./login/validate-two-factor-code.component */ "./src/account/login/validate-two-factor-code.component.ts");
/* harmony import */ var _password_forgot_password_component__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./password/forgot-password.component */ "./src/account/password/forgot-password.component.ts");
/* harmony import */ var _password_reset_password_component__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./password/reset-password.component */ "./src/account/password/reset-password.component.ts");
/* harmony import */ var _payment_paypal_paypal_purchase_component__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./payment/paypal/paypal-purchase.component */ "./src/account/payment/paypal/paypal-purchase.component.ts");
/* harmony import */ var _payment_stripe_stripe_purchase_component__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./payment/stripe/stripe-purchase.component */ "./src/account/payment/stripe/stripe-purchase.component.ts");
/* harmony import */ var _payment_stripe_stripe_subscribe_component__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./payment/stripe/stripe-subscribe.component */ "./src/account/payment/stripe/stripe-subscribe.component.ts");
/* harmony import */ var _payment_stripe_stripe_update_subscription_component__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./payment/stripe/stripe-update-subscription.component */ "./src/account/payment/stripe/stripe-update-subscription.component.ts");
/* harmony import */ var _payment_buy_component__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./payment/buy.component */ "./src/account/payment/buy.component.ts");
/* harmony import */ var _payment_upgrade_component__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./payment/upgrade.component */ "./src/account/payment/upgrade.component.ts");
/* harmony import */ var _payment_extend_component__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./payment/extend.component */ "./src/account/payment/extend.component.ts");
/* harmony import */ var _register_register_tenant_result_component__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./register/register-tenant-result.component */ "./src/account/register/register-tenant-result.component.ts");
/* harmony import */ var _register_register_tenant_component__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./register/register-tenant.component */ "./src/account/register/register-tenant.component.ts");
/* harmony import */ var _register_register_component__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./register/register.component */ "./src/account/register/register.component.ts");
/* harmony import */ var _register_select_edition_component__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./register/select-edition.component */ "./src/account/register/select-edition.component.ts");
/* harmony import */ var _register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./register/tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
/* harmony import */ var _shared_tenant_change_modal_component__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./shared/tenant-change-modal.component */ "./src/account/shared/tenant-change-modal.component.ts");
/* harmony import */ var _shared_tenant_change_component__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./shared/tenant-change.component */ "./src/account/shared/tenant-change.component.ts");
/* harmony import */ var angular_oauth2_oidc__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! angular-oauth2-oidc */ "./node_modules/angular-oauth2-oidc/esm5/angular-oauth2-oidc.js");
/* harmony import */ var _payment_payment_helper_service__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./payment/payment-helper.service */ "./src/account/payment/payment-helper.service.ts");
/* harmony import */ var _enrollment_enrollment_component__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./enrollment/enrollment.component */ "./src/account/enrollment/enrollment.component.ts");
/* harmony import */ var ngx_bootstrap_tabs__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ngx-bootstrap/tabs */ "./node_modules/ngx-bootstrap/tabs/fesm5/ngx-bootstrap-tabs.js");
/* harmony import */ var ngx_bootstrap_datepicker__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(/*! ngx-bootstrap/datepicker */ "./node_modules/ngx-bootstrap/datepicker/fesm5/ngx-bootstrap-datepicker.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









































var AccountModule = /** @class */ (function () {
    function AccountModule() {
    }
    AccountModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_1__["CommonModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_3__["FormsModule"],
                _angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpClientModule"],
                _angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpClientJsonpModule"],
                ng_recaptcha__WEBPACK_IMPORTED_MODULE_8__["RecaptchaModule"].forRoot(),
                ngx_bootstrap_modal__WEBPACK_IMPORTED_MODULE_9__["ModalModule"].forRoot(),
                _abp_abp_module__WEBPACK_IMPORTED_MODULE_0__["AbpModule"],
                _shared_common_common_module__WEBPACK_IMPORTED_MODULE_5__["CommonModule"],
                _shared_utils_utils_module__WEBPACK_IMPORTED_MODULE_7__["UtilsModule"],
                _shared_service_proxies_service_proxy_module__WEBPACK_IMPORTED_MODULE_6__["ServiceProxyModule"],
                _account_routing_module__WEBPACK_IMPORTED_MODULE_10__["AccountRoutingModule"],
                angular_oauth2_oidc__WEBPACK_IMPORTED_MODULE_36__["OAuthModule"].forRoot(),
                ngx_bootstrap_tabs__WEBPACK_IMPORTED_MODULE_39__["TabsModule"].forRoot(),
                ngx_bootstrap_datepicker__WEBPACK_IMPORTED_MODULE_40__["BsDatepickerModule"].forRoot()
            ],
            declarations: [
                _account_component__WEBPACK_IMPORTED_MODULE_11__["AccountComponent"],
                _shared_tenant_change_component__WEBPACK_IMPORTED_MODULE_35__["TenantChangeComponent"],
                _shared_tenant_change_modal_component__WEBPACK_IMPORTED_MODULE_34__["TenantChangeModalComponent"],
                _login_login_component__WEBPACK_IMPORTED_MODULE_16__["LoginComponent"],
                _register_register_component__WEBPACK_IMPORTED_MODULE_31__["RegisterComponent"],
                _register_register_tenant_component__WEBPACK_IMPORTED_MODULE_30__["RegisterTenantComponent"],
                _register_register_tenant_result_component__WEBPACK_IMPORTED_MODULE_29__["RegisterTenantResultComponent"],
                _register_select_edition_component__WEBPACK_IMPORTED_MODULE_32__["SelectEditionComponent"],
                _password_forgot_password_component__WEBPACK_IMPORTED_MODULE_20__["ForgotPasswordComponent"],
                _password_reset_password_component__WEBPACK_IMPORTED_MODULE_21__["ResetPasswordComponent"],
                _email_activation_email_activation_component__WEBPACK_IMPORTED_MODULE_14__["EmailActivationComponent"],
                _email_activation_confirm_email_component__WEBPACK_IMPORTED_MODULE_13__["ConfirmEmailComponent"],
                _login_send_two_factor_code_component__WEBPACK_IMPORTED_MODULE_18__["SendTwoFactorCodeComponent"],
                _login_validate_two_factor_code_component__WEBPACK_IMPORTED_MODULE_19__["ValidateTwoFactorCodeComponent"],
                _language_switch_component__WEBPACK_IMPORTED_MODULE_15__["LanguageSwitchComponent"],
                _payment_buy_component__WEBPACK_IMPORTED_MODULE_26__["BuyEditionComponent"],
                _payment_upgrade_component__WEBPACK_IMPORTED_MODULE_27__["UpgradeEditionComponent"],
                _payment_extend_component__WEBPACK_IMPORTED_MODULE_28__["ExtendEditionComponent"],
                _payment_paypal_paypal_purchase_component__WEBPACK_IMPORTED_MODULE_22__["PayPalPurchaseComponent"],
                _payment_stripe_stripe_purchase_component__WEBPACK_IMPORTED_MODULE_23__["StripePurchaseComponent"],
                _payment_stripe_stripe_subscribe_component__WEBPACK_IMPORTED_MODULE_24__["StripeSubscribeComponent"],
                _payment_stripe_stripe_update_subscription_component__WEBPACK_IMPORTED_MODULE_25__["StripeUpdateSubscriptionComponent"],
                _enrollment_enrollment_component__WEBPACK_IMPORTED_MODULE_38__["EnrollmentComponent"]
            ],
            providers: [
                _login_login_service__WEBPACK_IMPORTED_MODULE_17__["LoginService"],
                _register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_33__["TenantRegistrationHelperService"],
                _payment_payment_helper_service__WEBPACK_IMPORTED_MODULE_37__["PaymentHelperService"],
                _auth_account_route_guard__WEBPACK_IMPORTED_MODULE_12__["AccountRouteGuard"]
            ]
        })
    ], AccountModule);
    return AccountModule;
}());



/***/ }),

/***/ "./src/account/auth/account-route-guard.ts":
/*!*************************************************!*\
  !*** ./src/account/auth/account-route-guard.ts ***!
  \*************************************************/
/*! exports provided: AccountRouteGuard */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AccountRouteGuard", function() { return AccountRouteGuard; });
/* harmony import */ var _abp_auth_permission_checker_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @abp/auth/permission-checker.service */ "./node_modules/abp-ng2-module/dist/src/auth/permission-checker.service.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_session_app_session_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/session/app-session.service */ "./src/shared/common/session/app-session.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var AccountRouteGuard = /** @class */ (function () {
    function AccountRouteGuard(_permissionChecker, _router, _sessionService) {
        this._permissionChecker = _permissionChecker;
        this._router = _router;
        this._sessionService = _sessionService;
    }
    AccountRouteGuard.prototype.canActivate = function (route, state) {
        if (route.queryParams['ss'] && route.queryParams['ss'] === 'true') {
            return true;
        }
        if (this._sessionService.user) {
            this._router.navigate([this.selectBestRoute()]);
            return false;
        }
        return true;
    };
    AccountRouteGuard.prototype.selectBestRoute = function () {
        if (this._permissionChecker.isGranted('Pages.Administration.Host.Dashboard')) {
            return '/app/admin/hostDashboard';
        }
        if (this._permissionChecker.isGranted('Pages.Tenant.Dashboard')) {
            return '/app/main/dashboard';
        }
        return '/app/notifications';
    };
    AccountRouteGuard = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])(),
        __metadata("design:paramtypes", [_abp_auth_permission_checker_service__WEBPACK_IMPORTED_MODULE_0__["PermissionCheckerService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"],
            _shared_common_session_app_session_service__WEBPACK_IMPORTED_MODULE_3__["AppSessionService"]])
    ], AccountRouteGuard);
    return AccountRouteGuard;
}());



/***/ }),

/***/ "./src/account/email-activation/confirm-email.component.ts":
/*!*****************************************************************!*\
  !*** ./src/account/email-activation/confirm-email.component.ts ***!
  \*****************************************************************/
/*! exports provided: ConfirmEmailComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ConfirmEmailComponent", function() { return ConfirmEmailComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ConfirmEmailComponent = /** @class */ (function (_super) {
    __extends(ConfirmEmailComponent, _super);
    function ConfirmEmailComponent(injector, _accountService, _router, _activatedRoute) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this._router = _router;
        _this._activatedRoute = _activatedRoute;
        _this.model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_3__["ActivateEmailInput"]();
        return _this;
    }
    ConfirmEmailComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.waitMessage = this.l('PleaseWaitToConfirmYourEmailMessage');
        this.model.c = this._activatedRoute.snapshot.queryParams['c'];
        this._accountService.resolveTenantId(new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_3__["ResolveTenantIdInput"]({ c: this.model.c })).subscribe(function (tenantId) {
            var reloadNeeded = _this.appSession.changeTenantIfNeeded(tenantId);
            if (reloadNeeded) {
                return;
            }
            _this._accountService.activateEmail(_this.model)
                .subscribe(function () {
                _this.notify.success(_this.l('YourEmailIsConfirmedMessage'), '', {
                    onClose: function () {
                        _this._router.navigate(['account/login']);
                    }
                });
            });
        });
    };
    ConfirmEmailComponent.prototype.parseTenantId = function (tenantIdAsStr) {
        var tenantId = !tenantIdAsStr ? undefined : parseInt(tenantIdAsStr, 10);
        if (tenantId === NaN) {
            tenantId = undefined;
        }
        return tenantId;
    };
    ConfirmEmailComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: "<p>{{waitMessage}}</p>"
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_3__["AccountServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"]])
    ], ConfirmEmailComponent);
    return ConfirmEmailComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/email-activation/email-activation.component.html":
/*!**********************************************************************!*\
  !*** ./src/account/email-activation/email-activation.component.html ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{\"EmailActivation\" | localize}}\r\n            </h3>\r\n        </div>\r\n        <form class=\"m-login__form m-form email-activation-form\" #emailActivationForm=\"ngForm\" method=\"post\" novalidate (ngSubmit)=\"save()\">\r\n            <p>\r\n                {{\"SendEmailActivationLink_Information\" | localize}}\r\n            </p>\r\n            <div class=\"form-group m-form__group\">\r\n                <input #emailAddressInput=\"ngModel\" [(ngModel)]=\"model.emailAddress\" class=\"form-control form-control-solid placeholder-no-fix input-ltr\" type=\"email\" autocomplete=\"off\" placeholder=\"{{'EmailAddress' | localize}} *\" name=\"emailAddress\" required maxlength=\"256\" email />\r\n                <validation-messages [formCtrl]=\"emailAddressInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"m-login__form-action\">\r\n\r\n                <button [disabled]=\"saving\" routerLink=\"/account/login\" type=\"button\" class=\"btn btn-outline-primary  m-btn m-btn--pill m-btn--custom\"><i class=\"fa fa-arrow-left\"></i> {{\"Back\" | localize}}</button>\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!emailActivationForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-check\"></i> {{\"Submit\" | localize}}</button>\r\n            </div>\r\n        </form>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/email-activation/email-activation.component.ts":
/*!********************************************************************!*\
  !*** ./src/account/email-activation/email-activation.component.ts ***!
  \********************************************************************/
/*! exports provided: EmailActivationComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EmailActivationComponent", function() { return EmailActivationComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var EmailActivationComponent = /** @class */ (function (_super) {
    __extends(EmailActivationComponent, _super);
    function EmailActivationComponent(injector, _accountService, _router) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this._router = _router;
        _this.model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SendEmailActivationLinkInput"]();
        _this.saving = false;
        return _this;
    }
    EmailActivationComponent.prototype.save = function () {
        var _this = this;
        this.saving = true;
        this._accountService.sendEmailActivationLink(this.model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_5__["finalize"])(function () { _this.saving = false; }))
            .subscribe(function () {
            _this.message.success(_this.l('ActivationMailSentMessage'), _this.l('MailSent')).then(function () {
                _this._router.navigate(['account/login']);
            });
        });
    };
    EmailActivationComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./email-activation.component.html */ "./src/account/email-activation/email-activation.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["AccountServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], EmailActivationComponent);
    return EmailActivationComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/enrollment/enrollment.component.html":
/*!**********************************************************!*\
  !*** ./src/account/enrollment/enrollment.component.html ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"container\">\r\n        <div class=\"row mb-4\">\r\n            <div class=\"col-2\">\r\n                <div class=\"{{licenseClassDivClass}}\">\r\n                    <h6>1</h6><label class=\"d-none d-md-block\">License Class</label>\r\n                </div>\r\n            </div>\r\n            <div class=\"col-2\">\r\n                <div class=\"{{licenseClassOwnedDivClass}}\">\r\n                    <h6>2</h6><label class=\"d-none d-md-block\">Previous Licenses</label>\r\n                </div>\r\n            </div>\r\n            <div class=\"col-2\">\r\n                <div class=\"{{locationDivClass}}\">\r\n                    <h6>3</h6><label class=\"d-none d-md-block\">Location</label>\r\n                </div>\r\n            </div>\r\n            <div class=\"col-2\">\r\n                <div class=\"{{coursesDivClass}}\">\r\n                    <h6>4</h6><label class=\"d-none d-md-block\">Courses</label>\r\n                </div>\r\n            </div>\r\n            <div class=\"col-2\">\r\n                <div class=\"{{pricePackageDivClass}}\">\r\n                    <h6>5</h6><label class=\"d-none d-md-block\">Price Packages</label>\r\n                </div>\r\n            </div>\r\n            <div class=\"col-2\">\r\n                <div class=\"{{yourDataDivClass}}\">\r\n                    <h6>6</h6><label class=\"d-none d-md-block\">Your data</label>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <div class=\"m-pricing-table-1 m-pricing-table-1--fixed\">\r\n        <div class=\"m-portlet\">\r\n            <div class=\"m-portlet__body\">\r\n\r\n                <div *ngIf=\"currentPageNumber == 0 && licenseClasses != undefined\">\r\n                    <h3 class=\"mb-5\">What license do you want to acquire?</h3>\r\n\r\n                    <div class=\"container\">\r\n                        <div class=\"row justify-content-center\">\r\n                            <div *ngFor=\"let licenseClass of licenseClasses.licenseClasses;  let i = index\">\r\n                                <div class=\"col\">\r\n                                    <div class=\"card my-3\">\r\n                                        <img class=\"card-img-top\" src=\"assets/enrollment/icons/ProxyLicenseClass.PNG\"\r\n                                            alt=\"Card image cap\">\r\n                                        <div class=\"card-body\">\r\n                                            <h5 class=\"card-title\">{{l('Class')}} {{licenseClass.licenseClass}}</h5>\r\n                                            <p class=\"card-text\"> {{licenseClass.description}}</p>\r\n                                            <button\r\n                                                class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                                (click)=\"classToAcquireSelected(licenseClass.licenseClass)\">\r\n                                                Select\r\n                                            </button>\r\n                                        </div>\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div *ngIf=\"currentPageNumber == 1 && licenseClassesOwned != undefined\">\r\n                    <h3 class=\"mb-5\">Do you have any licenses completed before?</h3>\r\n\r\n                    <button\r\n                        class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                        (click)=\"classesAlreadyOwnedSelected()\">\r\n                        I don't have any license yet\r\n                    </button>\r\n\r\n                    <div class=\"container my-3\">\r\n                        <div class=\"row justify-content-center\">\r\n                            <div *ngFor=\"let licenseClassOwned of licenseClassesOwned.licenseClasses;  let i = index\">\r\n                                <div class=\"col\">\r\n                                    <div class=\"card my-3\">\r\n                                        <img class=\"card-img-top\" src=\"assets/enrollment/icons/ProxyLicenseClass.PNG\"\r\n                                            alt=\"Card image cap\">\r\n                                        <div class=\"card-body\">\r\n                                            <h5 class=\"card-title\">{{l('Class')}} {{licenseClassOwned.licenseClass}}\r\n                                            </h5>\r\n                                            <p class=\"card-text\"> {{licenseClassOwned.description}}</p>\r\n                                            <label class=\"m-checkbox mt-3\">\r\n                                                <input type=\"checkbox\" name=\"licenseClassOwned\"\r\n                                                    (change)=\"previousClassChecked(licenseClassOwned.licenseClass, $event)\">\r\n                                                I have this license\r\n                                                <span></span>\r\n                                            </label>\r\n                                        </div>\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <button\r\n                        class=\"btn btn-secondary m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                        (click)=\"goToPreviousPage()\">\r\n                        Back\r\n                    </button>\r\n\r\n                    <button\r\n                        class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                        (click)=\"classesAlreadyOwnedSelected()\">\r\n                        Next\r\n                    </button>\r\n                </div>\r\n\r\n                <div *ngIf=\"currentPageNumber == 2 && offices != undefined\">\r\n                    <h3 class=\"mb-5\">What office do you want to go to?</h3>\r\n\r\n                    <div class=\"container\">\r\n                        <div class=\"row justify-content-center\">\r\n                            <div *ngFor=\"let location of offices.offices;  let i = index\">\r\n                                <div class=\"col\">\r\n                                    <div class=\"card my-3\">\r\n                                        <img class=\"card-img-top\" src=\"assets/enrollment/icons/ProxyLicenseClass.PNG\"\r\n                                            alt=\"Card image cap\">\r\n                                        <div class=\"card-body\">\r\n                                            <h5 class=\"card-title\"> {{location.officeName}}</h5>\r\n                                            <p class=\"card-text\"> {{location.address}}</p>\r\n                                            <button\r\n                                                class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                                (click)=\"officeSelected(location.officeId)\">\r\n                                                Select\r\n                                            </button>\r\n                                        </div>\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <button\r\n                        class=\"btn btn-secondary m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                        (click)=\"goToPreviousPage()\">\r\n                        Back\r\n                    </button>\r\n                </div>\r\n\r\n                <div *ngIf=\"currentPageNumber == 3 && courses != undefined\">\r\n                    <h3 class=\"mb-5\">What course do you want to enroll in?</h3>\r\n\r\n                    <div class=\"container\">\r\n                        <div class=\"row justify-content-center\">\r\n                            <div *ngFor=\"let course of courses.courses;  let i = index\">\r\n                                <div class=\"col\">\r\n                                    <div class=\"card my-3\">\r\n                                        <img class=\"card-img-top\" src=\"assets/enrollment/icons/ProxyLicenseClass.PNG\"\r\n                                            alt=\"Card image cap\">\r\n                                        <div class=\"card-body\">\r\n                                            <h5 class=\"card-title\"> {{course.CourseName}}</h5>\r\n                                            <p class=\"card-text\" style=\"max-width: 18rem;\"> {{course.class}}</p>\r\n                                            <p class=\"card-text\" style=\"max-width: 18rem;\"> Saat käyttäjätunnukset\r\n                                                ja\r\n                                                ohjeet kurssin\r\n                                                suorittamiseen sähköpostitse, jonka jälkeen voit aloittaa kurssin.\r\n                                                Luovumme infotunneista 17.3 alkaen toistaiseksi koronan takia. </p>\r\n                                            <p class=\"card-text\" style=\"max-width: 18rem;\">\r\n                                                Jos sinulla on aikaisempi ajokortti tai todistus suoritetusta\r\n                                                turvallisuukoulutuksesta (EAS), turvallisuuskoulutuksen\r\n                                                teoriatunteja ei\r\n                                                tarvitse käydä uudelleen. </p>\r\n                                            <p class=\"card-text\" style=\"max-width: 18rem;\">\r\n                                                Kurssimaksun lisäksi suoritettavat viranomaismaksut:\r\n                                                Ajokorttilupamaksu 35€\r\n                                                Teoriakoe 35€\r\n                                                Ajokoe 90€\r\n                                            </p>\r\n                                            <button\r\n                                                class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                                (click)=\"courseSelected(course.courseId)\">\r\n                                                Select\r\n                                            </button>\r\n                                        </div>\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <button\r\n                        class=\"btn btn-secondary m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                        (click)=\"goToPreviousPage()\">\r\n                        Back\r\n                    </button>\r\n                </div>\r\n\r\n                <div *ngIf=\"currentPageNumber == 4 && pricePackages != undefined\">\r\n                    <h3 class=\"mb-5\">What price package do you prefer?</h3>\r\n\r\n                    <div class=\"container\">\r\n                        <div class=\"row justify-content-center\">\r\n                            <div *ngFor=\"let pp of pricePackages.pricePackages;  let i = index\">\r\n                                <div class=\"col\">\r\n                                    <div class=\"card my-3\">\r\n                                        <img class=\"card-img-top\" src=\"assets/enrollment/icons/ProxyLicenseClass.PNG\"\r\n                                            alt=\"Card image cap\">\r\n                                        <div class=\"card-body\">\r\n                                            <h5 class=\"card-title\"> {{pp.packageName}}</h5>\r\n                                            <p class=\"card-text\"> 5x Basic Lesson 50 EUR / Lesson</p>\r\n                                            <p class=\"card-text\"> 5x Basic Lesson 50 EUR / Lesson</p>\r\n                                            <p class=\"card-text\"> 5x Basic Lesson 50 EUR / Lesson</p>\r\n                                            <p class=\"card-text\"> 5x Basic Lesson 50 EUR / Lesson</p>\r\n                                            <p class=\"card-text\"> 5x Basic Lesson 50 EUR / Lesson</p>\r\n                                            <button\r\n                                                class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                                (click)=\"pricePackageSelected(pp.pricePackageId)\">\r\n                                                Select\r\n                                            </button>\r\n                                        </div>\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <button\r\n                    class=\"btn btn-secondary m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                    (click)=\"goToPreviousPage()\">\r\n                    Back\r\n                </button>\r\n                </div>\r\n\r\n                <div *ngIf=\"currentPageNumber == 5\">\r\n                    <h3 class=\"mb-5\">Please enter your data to finish enrollment!</h3>\r\n\r\n                    <form (ngSubmit)=\"onSubmit()\" #userDataForm=\"ngForm\">\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"personId\" class=\"col-sm-2 col-form-label\">Person ID *</label>\r\n                            <div class=\"col-sm-10\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"personId\" placeholder=\"PPKKVV-XXXX\"\r\n                                    [(ngModel)]=\"userData.socialSecurityNo\" name=\"ssn\" required #ssc=\"ngModel\">\r\n                                <div *ngIf=\"ssc.invalid && (ssc.dirty || ssc.touched)\" class=\"alert alert-danger\">\r\n                                    <div *ngIf=\"ssc.errors.required\">\r\n                                        Person ID is required.\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"firstNameInput\" class=\"col-sm-2 col-form-label\">First Name *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"firstNameInput\"\r\n                                    placeholder=\"Enter your first name\" [(ngModel)]=\"userData.firstName\"\r\n                                    name=\"firstName\" required #firstName=\"ngModel\">\r\n                                <div *ngIf=\"firstName.invalid && (firstName.dirty || firstName.touched)\"\r\n                                    class=\"alert alert-danger\">\r\n                                    <div *ngIf=\"firstName.errors.required\">\r\n                                        First name is required.\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                            <label for=\"lastNameInput\" class=\"col-sm-2 col-form-label\">Last Name *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"lastNameInput\"\r\n                                    placeholder=\"Enter your last name\" [(ngModel)]=\"userData.lastName\" name=\"lastName\"\r\n                                    required>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"streetInput\" class=\"col-sm-2 col-form-label\">Street *</label>\r\n                            <div class=\"col-sm-10\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"streetInput\" placeholder=\"Enter your street\"\r\n                                    [(ngModel)]=\"userData.street\" name=\"street\" required>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"zipCodeInput\" class=\"col-sm-2 col-form-label\">ZIP code *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"zipCodeInput\"\r\n                                    placeholder=\"Enter your ZIP code\" [(ngModel)]=\"userData.zipCode\" name=\"zipCode\"\r\n                                    required>\r\n                            </div>\r\n                            <label for=\"cityInput\" class=\"col-sm-2 col-form-label\">City *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"cityInput\" placeholder=\"Enter your city\"\r\n                                    [(ngModel)]=\"userData.city\" name=\"city\" required>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"phoneInput\" class=\"col-sm-2 col-form-label\">Phone *</label>\r\n                            <div class=\"col-sm-10\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"phoneInput\"\r\n                                    placeholder=\"Enter your phone number\" [(ngModel)]=\"userData.phone\" name=\"phone\"\r\n                                    required>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"emailInput\" class=\"col-sm-2 col-form-label\">E-mail *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"email\" class=\"form-control\" id=\"emailInput\" placeholder=\"Enter your email\"\r\n                                    [(ngModel)]=\"userData.email\" name=\"email\" required email #email=\"ngModel\">\r\n                                <div *ngIf=\"email.invalid && (email.dirty || email.touched)\" class=\"alert alert-danger\">\r\n                                    <div *ngIf=\"email.errors?.email\">\r\n                                        Email not valid.\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n\r\n                            <label for=\"confirmEmailInput\" class=\"col-sm-2 col-form-label\">Confirm e-mail *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"email\" class=\"form-control\" id=\"confirmEmailInput\"\r\n                                    placeholder=\"Enter your email again\" [(ngModel)]=\"userData.confirmEmail\"\r\n                                    name=\"confirmEmail\" required email #confirmationEmail=\"ngModel\">\r\n                                <div *ngIf=\"(confirmationEmail.invalid && (confirmationEmail.dirty || confirmationEmail.touched))\r\n                            || confirmationEmail.value !== email.value\" class=\"alert alert-danger\">\r\n                                    <div *ngIf=\"confirmationEmail.errors?.email\">\r\n                                        Email not valid.\r\n                                    </div>\r\n                                    <div *ngIf=\"confirmationEmail.value !== email.value\">\r\n                                        Emails do not match each other.\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"dateOfBirthInput\" class=\"col-sm-2 col-form-label\">Date of birth *</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input class=\"form-control m-input\" type=\"datetime\" bsDatepicker [(ngModel)]=\"dateOfBirth\" name=\"dateOfBirth\"\r\n                                    required>\r\n                            </div>\r\n                            <label for=\"Student_Country\"\r\n                                class=\"col-sm-2 col-form-label\">{{l(\"Country\")}}</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <select class=\"form-control\" name=\"Student_Country\"\r\n                                    [(ngModel)]=\"currentCountry\">\r\n                                    <option *ngFor=\"let option of countries\" [ngValue]=\"option.name\">\r\n                                        {{l(option.name)}}\r\n                                    </option>\r\n                                </select>\r\n                            </div>\r\n\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n\r\n                            <label for=\"Student_BirthCountry\"\r\n                                class=\"col-sm-2 col-form-label\">{{l(\"BirthCountry\")}}</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <select class=\"form-control\" name=\"Student_BirthCountry\"\r\n                                    [(ngModel)]=\"currentBirthCountry\">\r\n                                    <option *ngFor=\"let option of countries\" [ngValue]=\"option.name\">\r\n                                        {{l(option.name)}}\r\n                                    </option>\r\n                                </select>\r\n                            </div>\r\n                            <label for=\"Student_NativeLanguage\"\r\n                                class=\"col-sm-2 col-form-label\">{{l(\"NativeLanguage\")}}</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <select class=\"form-control\" name=\"Student_NativeLanguage\"\r\n                                    [(ngModel)]=\"currentNativeLanguage\">\r\n                                    <option *ngFor=\"let option of languages\" [ngValue]=\"option.name\">\r\n                                        {{l(option.name)}}\r\n                                    </option>\r\n                                </select>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"exampleFormControlTextarea1\" class=\"col-sm-2 col-form-label\">Additional\r\n                                information</label>\r\n                            <div class=\"col-sm-10\"><textarea class=\"form-control\" id=\"exampleFormControlTextarea1\"\r\n                                    rows=\"3\" [(ngModel)]=\"userData.additionalInformation\"\r\n                                    name=\"additionalInformation\"></textarea>\r\n                            </div>\r\n                        </div>\r\n\r\n\r\n                        <h3 class=\"my-5\">If you don't pay yourself, please add payer's data below!</h3>\r\n\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"payersPersonId\" class=\"col-sm-2 col-form-label\">Payers Person ID</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersPersonId\" placeholder=\"PPKKVV-XXXX\"\r\n                                    [(ngModel)]=\"userData.payersSocialSecurityNo\" name=\"payersSocialSecurityNo\">\r\n                            </div>\r\n                            <label for=\"payersNameInput\" class=\"col-sm-2 col-form-label\">Payers Name</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersNameInput\"\r\n                                    placeholder=\"Enter the payers name\" [(ngModel)]=\"userData.payersName\"\r\n                                    name=\"payersName\">\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"payersStreetInput\" class=\"col-sm-2 col-form-label\">Payers Street</label>\r\n                            <div class=\"col-sm-10\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersStreetInput\"\r\n                                    placeholder=\"Enter the payers street\" [(ngModel)]=\"userData.payersStreet\"\r\n                                    name=\"payersStreet\">\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"payersZipCodeInput\" class=\"col-sm-2 col-form-label\">Payers ZIP code</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersZipCodeInput\"\r\n                                    placeholder=\"Enter the payers ZIP code\" [(ngModel)]=\"userData.payersZipCode\"\r\n                                    name=\"payersZipCode\">\r\n                            </div>\r\n                            <label for=\"payersCityInput\" class=\"col-sm-2 col-form-label\">Payers City</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersCityInput\"\r\n                                    placeholder=\"Enter the payers city\" [(ngModel)]=\"userData.payersCity\"\r\n                                    name=\"payersCity\">\r\n                            </div>\r\n                        </div>\r\n\r\n\r\n                        <div class=\"form-group row\">\r\n                            <label for=\"payersPhoneInput\" class=\"col-sm-2 col-form-label\">Payers Phone</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"text\" class=\"form-control\" id=\"payersPhoneInput\"\r\n                                    placeholder=\"Enter the payers phone number\" [(ngModel)]=\"userData.payersPhone\"\r\n                                    name=\"payersPhone\">\r\n                            </div>\r\n                            <label for=\"payersEmailInput\" class=\"col-sm-2 col-form-label\">Payers E-mail</label>\r\n                            <div class=\"col-sm-4\">\r\n                                <input type=\"email\" class=\"form-control\" id=\"payersEmailInput\"\r\n                                    placeholder=\"Enter the payers email\" [(ngModel)]=\"userData.payersEmail\"\r\n                                    name=\"payersEmail\">\r\n                            </div>\r\n\r\n                        </div>\r\n\r\n                        <div class=\"mt-5\">\r\n                            <div class=\"form-check\">\r\n                                <input class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"defaultCheck1\"\r\n                                    [(ngModel)]=\"confirmTerms\" name=\"confirm\" required #confirm=\"ngModel\">\r\n                                <label class=\"form-check-label\" for=\"defaultCheck1\">\r\n                                    I have read the terms and conditions and agree with them.\r\n                                </label>\r\n                                <div *ngIf=\"confirm.invalid && (confirm.dirty || confirm.touched)\"\r\n                                    class=\"alert alert-danger\">\r\n                                    <div *ngIf=\"!confirmTerms\">\r\n                                        You have to agree with terms and conditions.\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\"mt-3\">\r\n                            <button type=\"submit\" class=\"btn btn-primary\" [disabled]=\"!userDataForm.form.valid\"\r\n                                [buttonBusy]=\"submitting\" [busyText]=\"l('PleaseWait')\">Submit</button>\r\n                        </div>\r\n                    </form>\r\n\r\n\r\n\r\n                </div>\r\n\r\n\r\n            </div>\r\n        </div>\r\n    </div>"

/***/ }),

/***/ "./src/account/enrollment/enrollment.component.less":
/*!**********************************************************!*\
  !*** ./src/account/enrollment/enrollment.component.less ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/* centered columns styles */\n.row-centered {\n  text-align: center;\n  display: block !important;\n}\n.col-centered {\n  display: inline-table;\n  float: none;\n  /* reset the text-align */\n  text-align: left;\n  /* inline-block space fix */\n  margin-right: -4px;\n}\n.m-pricing-table-1__price,\n.m-pricing-table-1__subtitle,\n.m-pricing-table-1__btn {\n  text-align: center;\n}\nbody {\n  background-color: #f2f3f8;\n}\ndiv.m-content div.m-login__logo {\n  margin-bottom: 50px !important;\n}\n.m-pricing-table-1__item:nth-child(4n) {\n  border-right: none !important;\n}\n.m-pricing-table-1 .m-pricing-table-1__items .m-pricing-table-1__item .m-pricing-table-1__price {\n  font-size: 2rem !important;\n}\nbutton:disabled,\nbutton[disabled] {\n  cursor: not-allowed !important;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L2Vucm9sbG1lbnQvZW5yb2xsbWVudC5jb21wb25lbnQubGVzcyIsInNyYy9hY2NvdW50L2Vucm9sbG1lbnQvRDovRHJpbWEgQXNwTmV0WmVyby9hbmd1bGFyL3NyYy9hY2NvdW50L2Vucm9sbG1lbnQvZW5yb2xsbWVudC5jb21wb25lbnQubGVzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0QkFBNEI7QUNDNUI7RUFDSSxrQkFBQTtFQUNBLHlCQUFBO0FEQ0o7QUNFQTtFQUNJLHFCQUFBO0VBQ0EsV0FBQTtFREFGLHlCQUF5QjtFQ0V2QixnQkFBQTtFREFGLDJCQUEyQjtFQ0V6QixrQkFBQTtBREFKO0FDR0E7OztFQUNJLGtCQUFBO0FEQ0o7QUNFQTtFQUNJLHlCQUFBO0FEQUo7QUNHQTtFQUNJLDhCQUFBO0FEREo7QUNJQTtFQUNJLDZCQUFBO0FERko7QUNLQTtFQUNJLDBCQUFBO0FESEo7QUNNQTs7RUFFSSw4QkFBQTtBREpKIiwiZmlsZSI6InNyYy9hY2NvdW50L2Vucm9sbG1lbnQvZW5yb2xsbWVudC5jb21wb25lbnQubGVzcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGNlbnRlcmVkIGNvbHVtbnMgc3R5bGVzICovXG4ucm93LWNlbnRlcmVkIHtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBkaXNwbGF5OiBibG9jayAhaW1wb3J0YW50O1xufVxuLmNvbC1jZW50ZXJlZCB7XG4gIGRpc3BsYXk6IGlubGluZS10YWJsZTtcbiAgZmxvYXQ6IG5vbmU7XG4gIC8qIHJlc2V0IHRoZSB0ZXh0LWFsaWduICovXG4gIHRleHQtYWxpZ246IGxlZnQ7XG4gIC8qIGlubGluZS1ibG9jayBzcGFjZSBmaXggKi9cbiAgbWFyZ2luLXJpZ2h0OiAtNHB4O1xufVxuLm0tcHJpY2luZy10YWJsZS0xX19wcmljZSxcbi5tLXByaWNpbmctdGFibGUtMV9fc3VidGl0bGUsXG4ubS1wcmljaW5nLXRhYmxlLTFfX2J0biB7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cbmJvZHkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmM2Y4O1xufVxuZGl2Lm0tY29udGVudCBkaXYubS1sb2dpbl9fbG9nbyB7XG4gIG1hcmdpbi1ib3R0b206IDUwcHggIWltcG9ydGFudDtcbn1cbi5tLXByaWNpbmctdGFibGUtMV9faXRlbTpudGgtY2hpbGQoNG4pIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lICFpbXBvcnRhbnQ7XG59XG4ubS1wcmljaW5nLXRhYmxlLTEgLm0tcHJpY2luZy10YWJsZS0xX19pdGVtcyAubS1wcmljaW5nLXRhYmxlLTFfX2l0ZW0gLm0tcHJpY2luZy10YWJsZS0xX19wcmljZSB7XG4gIGZvbnQtc2l6ZTogMnJlbSAhaW1wb3J0YW50O1xufVxuYnV0dG9uOmRpc2FibGVkLFxuYnV0dG9uW2Rpc2FibGVkXSB7XG4gIGN1cnNvcjogbm90LWFsbG93ZWQgIWltcG9ydGFudDtcbn1cbiIsIi8qIGNlbnRlcmVkIGNvbHVtbnMgc3R5bGVzICovXG4ucm93LWNlbnRlcmVkIHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDtcbn1cblxuLmNvbC1jZW50ZXJlZCB7XG4gICAgZGlzcGxheTogaW5saW5lLXRhYmxlO1xuICAgIGZsb2F0OiBub25lO1xuICAgIC8qIHJlc2V0IHRoZSB0ZXh0LWFsaWduICovXG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICAvKiBpbmxpbmUtYmxvY2sgc3BhY2UgZml4ICovXG4gICAgbWFyZ2luLXJpZ2h0OiAtNHB4O1xufVxuXG4ubS1wcmljaW5nLXRhYmxlLTFfX3ByaWNlLCAubS1wcmljaW5nLXRhYmxlLTFfX3N1YnRpdGxlLCAubS1wcmljaW5nLXRhYmxlLTFfX2J0biB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG5ib2R5IHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmM2Y4O1xufVxuXG5kaXYubS1jb250ZW50IGRpdi5tLWxvZ2luX19sb2dvIHtcbiAgICBtYXJnaW4tYm90dG9tOiA1MHB4ICFpbXBvcnRhbnQ7XG59XG5cbi5tLXByaWNpbmctdGFibGUtMV9faXRlbTpudGgtY2hpbGQoNG4pIHtcbiAgICBib3JkZXItcmlnaHQ6IG5vbmUgIWltcG9ydGFudDtcbn1cblxuLm0tcHJpY2luZy10YWJsZS0xIC5tLXByaWNpbmctdGFibGUtMV9faXRlbXMgLm0tcHJpY2luZy10YWJsZS0xX19pdGVtIC5tLXByaWNpbmctdGFibGUtMV9fcHJpY2Uge1xuICAgIGZvbnQtc2l6ZTogMnJlbSAhaW1wb3J0YW50O1xufVxuXG5idXR0b246ZGlzYWJsZWQsXG5idXR0b25bZGlzYWJsZWRdIHtcbiAgICBjdXJzb3I6IG5vdC1hbGxvd2VkICFpbXBvcnRhbnQ7XG59XG4iXX0= */"

/***/ }),

/***/ "./src/account/enrollment/enrollment.component.ts":
/*!********************************************************!*\
  !*** ./src/account/enrollment/enrollment.component.ts ***!
  \********************************************************/
/*! exports provided: EnrollmentComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EnrollmentComponent", function() { return EnrollmentComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! moment */ "./node_modules/moment/moment.js");
/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(moment__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _app_shared_common_services_languages_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @app/shared/common/services/languages.service */ "./src/app/shared/common/services/languages.service.ts");
/* harmony import */ var _app_shared_common_services_countries_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @app/shared/common/services/countries.service */ "./src/app/shared/common/services/countries.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var EnrollmentComponent = /** @class */ (function (_super) {
    __extends(EnrollmentComponent, _super);
    function EnrollmentComponent(injector, _tenantRegistrationService, _subscriptionService, _languagesService, _countriesService, _enrollmentService, _router) {
        var _this = _super.call(this, injector) || this;
        _this._tenantRegistrationService = _tenantRegistrationService;
        _this._subscriptionService = _subscriptionService;
        _this._languagesService = _languagesService;
        _this._countriesService = _countriesService;
        _this._enrollmentService = _enrollmentService;
        _this._router = _router;
        _this.activeDivClass = "p-3 mb-2 bg-primary text-white";
        _this.inactiveDivClass = "p-3 mb-2 bg-light text-dark";
        _this.licenseClassDivClass = _this.activeDivClass;
        _this.licenseClassOwnedDivClass = _this.inactiveDivClass;
        _this.locationDivClass = _this.inactiveDivClass;
        _this.coursesDivClass = _this.inactiveDivClass;
        _this.pricePackageDivClass = _this.inactiveDivClass;
        _this.yourDataDivClass = _this.inactiveDivClass;
        _this.currentPageNumber = 0;
        _this.maxPageNumber = 6;
        // Selected values
        _this.selectedClass = "";
        _this.previousClasses = [];
        _this.isUserLoggedIn = false;
        _this.submitting = false;
        _this.confirmTerms = false;
        _this.userData = {
            firstName: "",
            lastName: "",
            socialSecurityNo: "",
            street: "",
            zipCode: "",
            city: "",
            phone: "",
            email: "",
            confirmEmail: "",
            additionalInformation: "",
            payersSocialSecurityNo: "",
            payersName: "",
            payersStreet: "",
            payersZipCode: "",
            payersCity: "",
            payersPhone: "",
            payersEmail: "",
        };
        _this.editionIcons = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-cogwheel-2', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];
        return _this;
    }
    EnrollmentComponent.prototype.ngOnInit = function () {
        var _this = this;
        this._countriesService.loadData().subscribe(function (result) {
            _this.countries = result;
            for (var i = 0; i < _this.countries.length; i++) {
                if (_this.countries[i].name == 'Finland')
                    _this.currentBirthCountry = _this.countries[i].name;
            }
            for (var i = 0; i < _this.countries.length; i++) {
                if (_this.countries[i].name == 'Finland')
                    _this.currentCountry = _this.countries[i].name;
            }
        });
        this._languagesService.loadData().subscribe(function (result) {
            _this.languages = result;
            for (var i = 0; i < _this.languages.length; i++) {
                if (_this.languages[i].name == 'Finnish')
                    _this.currentNativeLanguage = _this.languages[i].name;
            }
        });
        this._enrollmentService.getAvailableLicenseClassesForEnrollment().subscribe(function (result) {
            _this.licenseClasses = result;
        });
        this.isUserLoggedIn = abp.session.userId > 0;
    };
    EnrollmentComponent.prototype.goToNextPage = function () {
        return;
        if (this.currentPageNumber + 1 == this.maxPageNumber)
            return;
        this.currentPageNumber++;
        this.switchActivePageIndicator(this.currentPageNumber);
    };
    EnrollmentComponent.prototype.goToPage = function (pageNumber) {
        this.currentPageNumber = pageNumber;
        this.switchActivePageIndicator(pageNumber);
    };
    EnrollmentComponent.prototype.goToPreviousPage = function () {
        if (this.currentPageNumber == 0)
            return;
        this.currentPageNumber--;
        this.switchActivePageIndicator(this.currentPageNumber);
    };
    EnrollmentComponent.prototype.switchActivePageIndicator = function (pageNumber) {
        this.licenseClassDivClass = this.inactiveDivClass;
        this.licenseClassOwnedDivClass = this.inactiveDivClass;
        this.locationDivClass = this.inactiveDivClass;
        this.coursesDivClass = this.inactiveDivClass;
        this.pricePackageDivClass = this.inactiveDivClass;
        this.yourDataDivClass = this.inactiveDivClass;
        switch (pageNumber) {
            case 0: {
                this.licenseClassDivClass = this.activeDivClass;
                break;
            }
            case 1: {
                this.licenseClassOwnedDivClass = this.activeDivClass;
                break;
            }
            case 2: {
                this.locationDivClass = this.activeDivClass;
                break;
            }
            case 3: {
                this.coursesDivClass = this.activeDivClass;
                break;
            }
            case 4: {
                this.pricePackageDivClass = this.activeDivClass;
                break;
            }
            case 5: {
                this.yourDataDivClass = this.activeDivClass;
                break;
            }
        }
    };
    EnrollmentComponent.prototype.classToAcquireSelected = function (selectedClass) {
        var _this = this;
        this.selectedClass = selectedClass;
        this._enrollmentService.getPossibleAlreadyOwnedLicenseClasses(this.selectedClass).subscribe(function (result) {
            _this.licenseClassesOwned = result;
        });
        this.goToPage(1);
    };
    EnrollmentComponent.prototype.classesAlreadyOwnedSelected = function () {
        var _this = this;
        console.log(this.licenseClassesOwned);
        this._enrollmentService.getOffices(this.selectedClass).subscribe(function (result) {
            _this.offices = result;
            console.log(_this.offices);
        });
        this.goToPage(2);
    };
    EnrollmentComponent.prototype.officeSelected = function (officeId) {
        var _this = this;
        console.log(officeId);
        this.officeId = officeId;
        this._enrollmentService.getCoursesFromOffice(this.selectedClass, officeId).subscribe(function (result) {
            _this.courses = result;
        });
        this.goToPage(3);
    };
    EnrollmentComponent.prototype.courseSelected = function (courseId) {
        var _this = this;
        console.log(courseId);
        this.courseId = courseId;
        this._enrollmentService.getPricePackagesFromCourse(courseId).subscribe(function (result) {
            _this.pricePackages = result;
        });
        this.goToPage(4);
    };
    EnrollmentComponent.prototype.pricePackageSelected = function (pricePackageId) {
        console.log(pricePackageId);
        this.pricePackageId = pricePackageId;
        this.goToPage(5);
    };
    EnrollmentComponent.prototype.previousClassChecked = function (lc, checked) {
        if (this.previousClasses.some(function (e) { return e === lc; }) && !checked.currentTarget.checked)
            this.previousClasses = this.previousClasses.filter(function (item) { return item != lc; });
        if (!this.previousClasses.some(function (e) { return e === lc; }) && checked.currentTarget.checked)
            this.previousClasses.push(lc);
    };
    EnrollmentComponent.prototype.onSubmit = function () {
        var _this = this;
        var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubmitEnrollmentInput"]();
        input.firstName = this.userData.firstName,
            input.lastName = this.userData.lastName,
            input.socialSecurityNo = this.userData.socialSecurityNo,
            input.street = this.userData.street,
            input.zipCode = this.userData.zipCode,
            input.city = this.userData.city,
            input.phone = this.userData.phone,
            input.email = this.userData.email,
            input.birthCountry = this._countriesService.getCode(this.currentBirthCountry),
            input.nativeLanguage = this._languagesService.getCode(this.currentNativeLanguage),
            input.country = this._countriesService.getCode(this.currentCountry),
            input.dateOfBirth = moment__WEBPACK_IMPORTED_MODULE_5__(this.dateOfBirth);
        input.additionalInformation = this.userData.additionalInformation,
            input.payersSocialSecurityNo = this.userData.payersSocialSecurityNo,
            input.payersName = this.userData.payersName,
            input.payersStreet = this.userData.payersStreet,
            input.payersZipCode = this.userData.payersZipCode,
            input.payersCity = this.userData.payersCity,
            input.payersPhone = this.userData.payersPhone,
            input.payersEmail = this.userData.payersEmail,
            input.previousClasses = this.previousClasses.toString(),
            input.licenseClass = this.selectedClass,
            input.userExists = false,
            input.officeId = this.officeId,
            input.courseId = this.courseId,
            input.pricePackageId = this.pricePackageId;
        console.log(input);
        this.submitting = true;
        this._enrollmentService.submitEnrollment(input).subscribe(function (result) {
            //this.submitting = false;
            _this._router.navigate(['account']);
            abp.message.success('Success', 'You just enrolled in a new course. Please read the confirmation email for further information!');
        });
    };
    EnrollmentComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'enrollment',
            template: __webpack_require__(/*! ./enrollment.component.html */ "./src/account/enrollment/enrollment.component.html"),
            encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewEncapsulation"].None,
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()],
            styles: [__webpack_require__(/*! ./enrollment.component.less */ "./src/account/enrollment/enrollment.component.less"), __webpack_require__(/*! ./enrollment.min.css */ "./src/account/enrollment/enrollment.min.css")]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["TenantRegistrationServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionServiceProxy"],
            _app_shared_common_services_languages_service__WEBPACK_IMPORTED_MODULE_6__["LanguagesService"],
            _app_shared_common_services_countries_service__WEBPACK_IMPORTED_MODULE_7__["CountriesService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EnrollmentsServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], EnrollmentComponent);
    return EnrollmentComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/enrollment/enrollment.min.css":
/*!***************************************************!*\
  !*** ./src/account/enrollment/enrollment.min.css ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/* Cubic Bezier Transition */\r\n/***\r\nPricing Table 1\r\n***/\r\n.pricing-content-1 {\r\n    background-color: #fff;\r\n}\r\n.pricing-content-1:before, .pricing-content-1:after {\r\n        content: \" \";\r\n        display: table;\r\n    }\r\n.pricing-content-1:after {\r\n        clear: both;\r\n    }\r\n.pricing-content-1 .arrow-down {\r\n        width: 0;\r\n        height: 0;\r\n        border-left: 15px solid transparent;\r\n        border-right: 15px solid transparent;\r\n        border-top: 15px solid;\r\n        margin: auto;\r\n    }\r\n.pricing-content-1 .arrow-down.arrow-blue {\r\n            border-top-color: #3598DC;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-green {\r\n            border-top-color: #32C5D2;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-dark {\r\n            border-top-color: #2F353B;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-grey {\r\n            border-top-color: #f7f9fb;\r\n        }\r\n.pricing-content-1 .price-ribbon {\r\n        position: absolute;\r\n        top: 75px;\r\n        right: -4px;\r\n        width: 90px;\r\n        font-size: 14px;\r\n        text-transform: uppercase;\r\n        font-weight: 300;\r\n        padding: 6px 20px 6px 15px;\r\n        color: #fff;\r\n        background-color: #D91E18;\r\n        text-shadow: 0px 1px 2px #bbb;\r\n        box-shadow: 0px 2px 4px #888;\r\n    }\r\n.pricing-content-1 .price-ribbon:after {\r\n            content: ' ';\r\n            position: absolute;\r\n            width: 0;\r\n            height: 0;\r\n            right: 0px;\r\n            top: 100%;\r\n            border-width: 5px 10px;\r\n            border-style: solid;\r\n            border-color: #64120f transparent transparent #64120f;\r\n        }\r\n.pricing-content-1 .pricing-title {\r\n        border-bottom: 1px solid;\r\n        border-color: #fff;\r\n    }\r\n.pricing-content-1 .pricing-title > h1 {\r\n            margin: 20px 0;\r\n        }\r\n.pricing-content-1 .price-column-container {\r\n        text-align: center;\r\n        margin: 0;\r\n        background-color: #fff;\r\n    }\r\n.pricing-content-1 .price-column-container.border-active {\r\n            border: 1px solid #e5e9ee;\r\n        }\r\n.pricing-content-1 .price-column-container:first-child {\r\n            margin-left: 0;\r\n        }\r\n.pricing-content-1 .price-column-container:last-child {\r\n            margin-right: 0;\r\n        }\r\n.pricing-content-1 .price-table-head {\r\n        color: #fff;\r\n        padding: 20px 0;\r\n    }\r\n.pricing-content-1 .price-table-head h2 {\r\n            font-size: 26px;\r\n        }\r\n.pricing-content-1 .price-table-head.price-1 {\r\n            background-color: #3598DC;\r\n        }\r\n.pricing-content-1 .price-table-head.price-2 {\r\n            background-color: #32C5D2;\r\n        }\r\n.pricing-content-1 .price-table-head.price-3 {\r\n            background-color: #2F353B;\r\n        }\r\n.pricing-content-1 .price-table-pricing > h3 {\r\n        font-size: 60px;\r\n        position: relative;\r\n    }\r\n.pricing-content-1 .price-table-pricing > h3 > .price-sign {\r\n            font-size: 24px;\r\n            position: absolute;\r\n            margin-left: -15px;\r\n        }\r\n.pricing-content-1 .price-table-pricing > p {\r\n        margin-top: 0;\r\n    }\r\n.pricing-content-1 .price-table-content {\r\n        background-color: #f7f9fb;\r\n        color: #5c6d7e;\r\n        font-weight: 600;\r\n        font-size: 16px;\r\n    }\r\n.pricing-content-1 .price-table-content .row {\r\n            padding-top: 10px;\r\n            padding-bottom: 10px;\r\n        }\r\n.pricing-content-1 .price-table-content .row i {\r\n                color: #6cade6;\r\n            }\r\n.pricing-content-1 .price-table-content .row:first-child {\r\n                padding-top: 20px;\r\n            }\r\n.pricing-content-1 .price-table-content .row:last-child {\r\n                padding-bottom: 20px;\r\n            }\r\n.pricing-content-1 .price-table-footer {\r\n        padding: 20px 0;\r\n    }\r\n.pricing-content-1 .price-table-footer > .price-button {\r\n            font-weight: bold;\r\n            padding: 10px 20px;\r\n        }\r\n@media (max-width: 1024px) {\r\n    .pricing-content-1 .mobile-padding {\r\n        padding: 0;\r\n        margin: 0;\r\n    }\r\n\r\n        .pricing-content-1 .mobile-padding > i {\r\n            margin-right: 5px;\r\n        }\r\n\r\n    .pricing-content-1 .price-table-content {\r\n        padding-left: 10px;\r\n        padding-right: 10px;\r\n    }\r\n}\r\n@media (max-width: 1024px) {\r\n    .pricing-content-1 .mobile-padding {\r\n        padding: 0 15px;\r\n        margin: 0 -15px;\r\n    }\r\n\r\n        .pricing-content-1 .mobile-padding > i {\r\n            margin-right: 20px;\r\n        }\r\n\r\n    .pricing-content-1 .price-table-content {\r\n        padding-left: 15px;\r\n        padding-right: 15px;\r\n    }\r\n}\r\n/***\r\nPricing Table 2\r\n***/\r\n.pricing-content-2 {\r\n    background-color: #fff;\r\n}\r\n.pricing-content-2 .no-padding {\r\n        padding: 0;\r\n    }\r\n.pricing-content-2 .text-left {\r\n        text-align: left;\r\n    }\r\n.pricing-content-2 .text-right {\r\n        text-align: right;\r\n    }\r\n.pricing-content-2.pricing-bg-dark {\r\n        background-color: #2F353B;\r\n    }\r\n.pricing-content-2 .pricing-title {\r\n        border-color: #444;\r\n    }\r\n.pricing-content-2 .pricing-title > h1 {\r\n            color: #fff;\r\n        }\r\n.pricing-content-2 .pricing-table-container {\r\n        padding-top: 40px;\r\n        padding-bottom: 40px;\r\n    }\r\n.pricing-content-2 .pricing-table-container .padding-fix {\r\n            padding-left: 15px;\r\n            padding-right: 15px;\r\n        }\r\n.pricing-content-2 .pricing-table-container .price-column-container {\r\n            background-color: #fff;\r\n            margin: 30px 0;\r\n            padding: 60px 0;\r\n            text-align: center;\r\n            border-bottom: 4px solid #ccc;\r\n        }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-right {\r\n                border-right: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-left {\r\n                border-left: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-top {\r\n                border-top: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.featured-price {\r\n                margin: 0;\r\n                padding: 89px 0;\r\n                border: 1px solid;\r\n                border-bottom: 4px solid;\r\n                border-color: #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.featured-price > .price-feature-label {\r\n                    position: absolute;\r\n                    top: 0;\r\n                    left: 50%;\r\n                    display: inline-block;\r\n                    width: 110px;\r\n                    margin: 0 0 0 -60px;\r\n                    padding: 7px 15px;\r\n                    color: #fff;\r\n                    font-weight: 300;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-head > h2 {\r\n                letter-spacing: 1px;\r\n                font-weight: 600;\r\n                font-size: 18px;\r\n                color: #ACB5C3;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-head > h2.opt-pricing-5 {\r\n                    padding: 7px 15px;\r\n                    display: inline;\r\n                    margin: 0 auto 20px auto;\r\n                    font-size: 16px;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > h3 {\r\n                font-size: 60px;\r\n                position: relative;\r\n                font-weight: 600;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > h3 > .price-sign {\r\n                    font-size: 24px;\r\n                    position: absolute;\r\n                    margin-left: -15px;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > p {\r\n                margin-top: 0;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content {\r\n                color: #333;\r\n                font-weight: 300;\r\n                font-size: 16px;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content .row {\r\n                    padding-top: 20px;\r\n                    padding-bottom: 20px;\r\n                    border-bottom: 1px solid;\r\n                    border-color: #eee;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content .row:first-child {\r\n                        border-top: 1px solid;\r\n                        border-color: #eee;\r\n                    }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-footer {\r\n                padding: 40px 0 0 0;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-footer > .featured-price {\r\n                    font-size: 20px;\r\n                    font-weight: 300;\r\n                    border-bottom: 3px solid #3FABA4;\r\n                }\r\n@media (max-width: 991px) {\r\n    .pricing-content-2 .price-column-container {\r\n        border-left: 1px solid;\r\n        border-right: 1px solid;\r\n        border-color: #ccc;\r\n    }\r\n}\r\n\r\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L2Vucm9sbG1lbnQvZW5yb2xsbWVudC5taW4uY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDRCQUE0QjtBQUM1Qjs7R0FFRztBQUNIO0lBQ0ksc0JBQXNCO0FBQzFCO0FBRUk7UUFDSSxZQUFZO1FBQ1osY0FBYztJQUNsQjtBQUVBO1FBQ0ksV0FBVztJQUNmO0FBRUE7UUFDSSxRQUFRO1FBQ1IsU0FBUztRQUNULG1DQUFtQztRQUNuQyxvQ0FBb0M7UUFDcEMsc0JBQXNCO1FBQ3RCLFlBQVk7SUFDaEI7QUFFSTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVBO1lBQ0kseUJBQXlCO1FBQzdCO0FBRUE7WUFDSSx5QkFBeUI7UUFDN0I7QUFFQTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVKO1FBQ0ksa0JBQWtCO1FBQ2xCLFNBQVM7UUFDVCxXQUFXO1FBQ1gsV0FBVztRQUNYLGVBQWU7UUFDZix5QkFBeUI7UUFDekIsZ0JBQWdCO1FBQ2hCLDBCQUEwQjtRQUMxQixXQUFXO1FBQ1gseUJBQXlCO1FBQ3pCLDZCQUE2QjtRQUc3Qiw0QkFBNEI7SUFDaEM7QUFFSTtZQUNJLFlBQVk7WUFDWixrQkFBa0I7WUFDbEIsUUFBUTtZQUNSLFNBQVM7WUFDVCxVQUFVO1lBQ1YsU0FBUztZQUNULHNCQUFzQjtZQUN0QixtQkFBbUI7WUFDbkIscURBQXFEO1FBQ3pEO0FBRUo7UUFDSSx3QkFBd0I7UUFDeEIsa0JBQWtCO0lBQ3RCO0FBRUk7WUFDSSxjQUFjO1FBQ2xCO0FBRUo7UUFDSSxrQkFBa0I7UUFDbEIsU0FBUztRQUNULHNCQUFzQjtJQUMxQjtBQUVJO1lBQ0kseUJBQXlCO1FBQzdCO0FBRUE7WUFDSSxjQUFjO1FBQ2xCO0FBRUE7WUFDSSxlQUFlO1FBQ25CO0FBRUo7UUFDSSxXQUFXO1FBQ1gsZUFBZTtJQUNuQjtBQUVJO1lBQ0ksZUFBZTtRQUNuQjtBQUVBO1lBQ0kseUJBQXlCO1FBQzdCO0FBRUE7WUFDSSx5QkFBeUI7UUFDN0I7QUFFQTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVKO1FBQ0ksZUFBZTtRQUNmLGtCQUFrQjtJQUN0QjtBQUVJO1lBQ0ksZUFBZTtZQUNmLGtCQUFrQjtZQUNsQixrQkFBa0I7UUFDdEI7QUFFSjtRQUNJLGFBQWE7SUFDakI7QUFFQTtRQUNJLHlCQUF5QjtRQUN6QixjQUFjO1FBQ2QsZ0JBQWdCO1FBQ2hCLGVBQWU7SUFDbkI7QUFFSTtZQUNJLGlCQUFpQjtZQUNqQixvQkFBb0I7UUFDeEI7QUFFSTtnQkFDSSxjQUFjO1lBQ2xCO0FBRUE7Z0JBQ0ksaUJBQWlCO1lBQ3JCO0FBRUE7Z0JBQ0ksb0JBQW9CO1lBQ3hCO0FBRVI7UUFDSSxlQUFlO0lBQ25CO0FBRUk7WUFDSSxpQkFBaUI7WUFDakIsa0JBQWtCO1FBQ3RCO0FBRVI7SUFDSTtRQUNJLFVBQVU7UUFDVixTQUFTO0lBQ2I7O1FBRUk7WUFDSSxpQkFBaUI7UUFDckI7O0lBRUo7UUFDSSxrQkFBa0I7UUFDbEIsbUJBQW1CO0lBQ3ZCO0FBQ0o7QUFFQTtJQUNJO1FBQ0ksZUFBZTtRQUNmLGVBQWU7SUFDbkI7O1FBRUk7WUFDSSxrQkFBa0I7UUFDdEI7O0lBRUo7UUFDSSxrQkFBa0I7UUFDbEIsbUJBQW1CO0lBQ3ZCO0FBQ0o7QUFFQTs7R0FFRztBQUNIO0lBQ0ksc0JBQXNCO0FBQzFCO0FBRUk7UUFDSSxVQUFVO0lBQ2Q7QUFFQTtRQUNJLGdCQUFnQjtJQUNwQjtBQUVBO1FBQ0ksaUJBQWlCO0lBQ3JCO0FBRUE7UUFDSSx5QkFBeUI7SUFDN0I7QUFFQTtRQUNJLGtCQUFrQjtJQUN0QjtBQUVJO1lBQ0ksV0FBVztRQUNmO0FBRUo7UUFDSSxpQkFBaUI7UUFDakIsb0JBQW9CO0lBQ3hCO0FBRUk7WUFDSSxrQkFBa0I7WUFDbEIsbUJBQW1CO1FBQ3ZCO0FBRUE7WUFDSSxzQkFBc0I7WUFDdEIsY0FBYztZQUNkLGVBQWU7WUFDZixrQkFBa0I7WUFDbEIsNkJBQTZCO1FBQ2pDO0FBRUk7Z0JBQ0ksNEJBQTRCO1lBQ2hDO0FBRUE7Z0JBQ0ksMkJBQTJCO1lBQy9CO0FBRUE7Z0JBQ0ksMEJBQTBCO1lBQzlCO0FBRUE7Z0JBQ0ksU0FBUztnQkFDVCxlQUFlO2dCQUNmLGlCQUFpQjtnQkFDakIsd0JBQXdCO2dCQUN4QixrQkFBa0I7WUFDdEI7QUFFSTtvQkFDSSxrQkFBa0I7b0JBQ2xCLE1BQU07b0JBQ04sU0FBUztvQkFDVCxxQkFBcUI7b0JBQ3JCLFlBQVk7b0JBQ1osbUJBQW1CO29CQUNuQixpQkFBaUI7b0JBQ2pCLFdBQVc7b0JBQ1gsZ0JBQWdCO2dCQUNwQjtBQUVKO2dCQUNJLG1CQUFtQjtnQkFDbkIsZ0JBQWdCO2dCQUNoQixlQUFlO2dCQUNmLGNBQWM7WUFDbEI7QUFFSTtvQkFDSSxpQkFBaUI7b0JBQ2pCLGVBQWU7b0JBQ2Ysd0JBQXdCO29CQUN4QixlQUFlO2dCQUNuQjtBQUVKO2dCQUNJLGVBQWU7Z0JBQ2Ysa0JBQWtCO2dCQUNsQixnQkFBZ0I7WUFDcEI7QUFFSTtvQkFDSSxlQUFlO29CQUNmLGtCQUFrQjtvQkFDbEIsa0JBQWtCO2dCQUN0QjtBQUVKO2dCQUNJLGFBQWE7WUFDakI7QUFFQTtnQkFDSSxXQUFXO2dCQUNYLGdCQUFnQjtnQkFDaEIsZUFBZTtZQUNuQjtBQUVJO29CQUNJLGlCQUFpQjtvQkFDakIsb0JBQW9CO29CQUNwQix3QkFBd0I7b0JBQ3hCLGtCQUFrQjtnQkFDdEI7QUFFSTt3QkFDSSxxQkFBcUI7d0JBQ3JCLGtCQUFrQjtvQkFDdEI7QUFFUjtnQkFDSSxtQkFBbUI7WUFDdkI7QUFFSTtvQkFDSSxlQUFlO29CQUNmLGdCQUFnQjtvQkFDaEIsZ0NBQWdDO2dCQUNwQztBQUVoQjtJQUNJO1FBQ0ksc0JBQXNCO1FBQ3RCLHVCQUF1QjtRQUN2QixrQkFBa0I7SUFDdEI7QUFDSiIsImZpbGUiOiJzcmMvYWNjb3VudC9lbnJvbGxtZW50L2Vucm9sbG1lbnQubWluLmNzcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEN1YmljIEJlemllciBUcmFuc2l0aW9uICovXHJcbi8qKipcclxuUHJpY2luZyBUYWJsZSAxXHJcbioqKi9cclxuLnByaWNpbmctY29udGVudC0xIHtcclxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XHJcbn1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTE6YmVmb3JlLCAucHJpY2luZy1jb250ZW50LTE6YWZ0ZXIge1xyXG4gICAgICAgIGNvbnRlbnQ6IFwiIFwiO1xyXG4gICAgICAgIGRpc3BsYXk6IHRhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMTphZnRlciB7XHJcbiAgICAgICAgY2xlYXI6IGJvdGg7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5hcnJvdy1kb3duIHtcclxuICAgICAgICB3aWR0aDogMDtcclxuICAgICAgICBoZWlnaHQ6IDA7XHJcbiAgICAgICAgYm9yZGVyLWxlZnQ6IDE1cHggc29saWQgdHJhbnNwYXJlbnQ7XHJcbiAgICAgICAgYm9yZGVyLXJpZ2h0OiAxNXB4IHNvbGlkIHRyYW5zcGFyZW50O1xyXG4gICAgICAgIGJvcmRlci10b3A6IDE1cHggc29saWQ7XHJcbiAgICAgICAgbWFyZ2luOiBhdXRvO1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLmFycm93LWRvd24uYXJyb3ctYmx1ZSB7XHJcbiAgICAgICAgICAgIGJvcmRlci10b3AtY29sb3I6ICMzNTk4REM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLmFycm93LWRvd24uYXJyb3ctZ3JlZW4ge1xyXG4gICAgICAgICAgICBib3JkZXItdG9wLWNvbG9yOiAjMzJDNUQyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5hcnJvdy1kb3duLmFycm93LWRhcmsge1xyXG4gICAgICAgICAgICBib3JkZXItdG9wLWNvbG9yOiAjMkYzNTNCO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5hcnJvdy1kb3duLmFycm93LWdyZXkge1xyXG4gICAgICAgICAgICBib3JkZXItdG9wLWNvbG9yOiAjZjdmOWZiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXJpYmJvbiB7XHJcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgIHRvcDogNzVweDtcclxuICAgICAgICByaWdodDogLTRweDtcclxuICAgICAgICB3aWR0aDogOTBweDtcclxuICAgICAgICBmb250LXNpemU6IDE0cHg7XHJcbiAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcclxuICAgICAgICBmb250LXdlaWdodDogMzAwO1xyXG4gICAgICAgIHBhZGRpbmc6IDZweCAyMHB4IDZweCAxNXB4O1xyXG4gICAgICAgIGNvbG9yOiAjZmZmO1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNEOTFFMTg7XHJcbiAgICAgICAgdGV4dC1zaGFkb3c6IDBweCAxcHggMnB4ICNiYmI7XHJcbiAgICAgICAgLXdlYmtpdC1ib3gtc2hhZG93OiAwcHggMnB4IDRweCAjODg4O1xyXG4gICAgICAgIC1tb3otYm94LXNoYWRvdzogMHB4IDJweCA0cHggIzg4ODtcclxuICAgICAgICBib3gtc2hhZG93OiAwcHggMnB4IDRweCAjODg4O1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXJpYmJvbjphZnRlciB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICcgJztcclxuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICB3aWR0aDogMDtcclxuICAgICAgICAgICAgaGVpZ2h0OiAwO1xyXG4gICAgICAgICAgICByaWdodDogMHB4O1xyXG4gICAgICAgICAgICB0b3A6IDEwMCU7XHJcbiAgICAgICAgICAgIGJvcmRlci13aWR0aDogNXB4IDEwcHg7XHJcbiAgICAgICAgICAgIGJvcmRlci1zdHlsZTogc29saWQ7XHJcbiAgICAgICAgICAgIGJvcmRlci1jb2xvcjogIzY0MTIwZiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjNjQxMjBmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNpbmctdGl0bGUge1xyXG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZDtcclxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmY7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2luZy10aXRsZSA+IGgxIHtcclxuICAgICAgICAgICAgbWFyZ2luOiAyMHB4IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtY29sdW1uLWNvbnRhaW5lciB7XHJcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLWNvbHVtbi1jb250YWluZXIuYm9yZGVyLWFjdGl2ZSB7XHJcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNlNWU5ZWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLWNvbHVtbi1jb250YWluZXI6Zmlyc3QtY2hpbGQge1xyXG4gICAgICAgICAgICBtYXJnaW4tbGVmdDogMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtY29sdW1uLWNvbnRhaW5lcjpsYXN0LWNoaWxkIHtcclxuICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWhlYWQge1xyXG4gICAgICAgIGNvbG9yOiAjZmZmO1xyXG4gICAgICAgIHBhZGRpbmc6IDIwcHggMDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1oZWFkIGgyIHtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAyNnB4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1oZWFkLnByaWNlLTEge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzU5OERDO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1oZWFkLnByaWNlLTIge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzJDNUQyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1oZWFkLnByaWNlLTMge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMkYzNTNCO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLXByaWNpbmcgPiBoMyB7XHJcbiAgICAgICAgZm9udC1zaXplOiA2MHB4O1xyXG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1wcmljaW5nID4gaDMgPiAucHJpY2Utc2lnbiB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMjRweDtcclxuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICBtYXJnaW4tbGVmdDogLTE1cHg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtcHJpY2luZyA+IHAge1xyXG4gICAgICAgIG1hcmdpbi10b3A6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1jb250ZW50IHtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjdmOWZiO1xyXG4gICAgICAgIGNvbG9yOiAjNWM2ZDdlO1xyXG4gICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgICAgICAgZm9udC1zaXplOiAxNnB4O1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdyB7XHJcbiAgICAgICAgICAgIHBhZGRpbmctdG9wOiAxMHB4O1xyXG4gICAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdyBpIHtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAjNmNhZGU2O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdzpmaXJzdC1jaGlsZCB7XHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nLXRvcDogMjBweDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1jb250ZW50IC5yb3c6bGFzdC1jaGlsZCB7XHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogMjBweDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtZm9vdGVyIHtcclxuICAgICAgICBwYWRkaW5nOiAyMHB4IDA7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtZm9vdGVyID4gLnByaWNlLWJ1dHRvbiB7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAxMHB4IDIwcHg7XHJcbiAgICAgICAgfVxyXG5cclxuQG1lZGlhIChtYXgtd2lkdGg6IDEwMjRweCkge1xyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5tb2JpbGUtcGFkZGluZyB7XHJcbiAgICAgICAgcGFkZGluZzogMDtcclxuICAgICAgICBtYXJnaW46IDA7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAubW9iaWxlLXBhZGRpbmcgPiBpIHtcclxuICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA1cHg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtY29udGVudCB7XHJcbiAgICAgICAgcGFkZGluZy1sZWZ0OiAxMHB4O1xyXG4gICAgICAgIHBhZGRpbmctcmlnaHQ6IDEwcHg7XHJcbiAgICB9XHJcbn1cclxuXHJcbkBtZWRpYSAobWF4LXdpZHRoOiAxMDI0cHgpIHtcclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAubW9iaWxlLXBhZGRpbmcge1xyXG4gICAgICAgIHBhZGRpbmc6IDAgMTVweDtcclxuICAgICAgICBtYXJnaW46IDAgLTE1cHg7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAubW9iaWxlLXBhZGRpbmcgPiBpIHtcclxuICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiAyMHB4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQge1xyXG4gICAgICAgIHBhZGRpbmctbGVmdDogMTVweDtcclxuICAgICAgICBwYWRkaW5nLXJpZ2h0OiAxNXB4O1xyXG4gICAgfVxyXG59XHJcblxyXG4vKioqXHJcblByaWNpbmcgVGFibGUgMlxyXG4qKiovXHJcbi5wcmljaW5nLWNvbnRlbnQtMiB7XHJcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xyXG59XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0yIC5uby1wYWRkaW5nIHtcclxuICAgICAgICBwYWRkaW5nOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMiAudGV4dC1sZWZ0IHtcclxuICAgICAgICB0ZXh0LWFsaWduOiBsZWZ0O1xyXG4gICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMiAudGV4dC1yaWdodCB7XHJcbiAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0yLnByaWNpbmctYmctZGFyayB7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzJGMzUzQjtcclxuICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGl0bGUge1xyXG4gICAgICAgIGJvcmRlci1jb2xvcjogIzQ0NDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRpdGxlID4gaDEge1xyXG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciB7XHJcbiAgICAgICAgcGFkZGluZy10b3A6IDQwcHg7XHJcbiAgICAgICAgcGFkZGluZy1ib3R0b206IDQwcHg7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnBhZGRpbmctZml4IHtcclxuICAgICAgICAgICAgcGFkZGluZy1sZWZ0OiAxNXB4O1xyXG4gICAgICAgICAgICBwYWRkaW5nLXJpZ2h0OiAxNXB4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XHJcbiAgICAgICAgICAgIG1hcmdpbjogMzBweCAwO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiA2MHB4IDA7XHJcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogNHB4IHNvbGlkICNjY2M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5ib3JkZXItcmlnaHQge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgI2NjYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5ib3JkZXItbGVmdCB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXItbGVmdDogMXB4IHNvbGlkICNjY2M7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIuYm9yZGVyLXRvcCB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI2NjYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5mZWF0dXJlZC1wcmljZSB7XHJcbiAgICAgICAgICAgICAgICBtYXJnaW46IDA7XHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiA4OXB4IDA7XHJcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZDtcclxuICAgICAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDRweCBzb2xpZDtcclxuICAgICAgICAgICAgICAgIGJvcmRlci1jb2xvcjogI2NjYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIuZmVhdHVyZWQtcHJpY2UgPiAucHJpY2UtZmVhdHVyZS1sYWJlbCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogMDtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiA1MCU7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMTBweDtcclxuICAgICAgICAgICAgICAgICAgICBtYXJnaW46IDAgMCAwIC02MHB4O1xyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDdweCAxNXB4O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWhlYWQgPiBoMiB7XHJcbiAgICAgICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMXB4O1xyXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAjQUNCNUMzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciA+IC5wcmljZS10YWJsZS1oZWFkID4gaDIub3B0LXByaWNpbmctNSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogN3B4IDE1cHg7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogaW5saW5lO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMCBhdXRvIDIwcHggYXV0bztcclxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLXByaWNpbmcgPiBoMyB7XHJcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDYwcHg7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciA+IC5wcmljZS10YWJsZS1wcmljaW5nID4gaDMgPiAucHJpY2Utc2lnbiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAyNHB4O1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJnaW4tbGVmdDogLTE1cHg7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLXByaWNpbmcgPiBwIHtcclxuICAgICAgICAgICAgICAgIG1hcmdpbi10b3A6IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtY29udGVudCB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogIzMzMztcclxuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdyB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZy10b3A6IDIwcHg7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDIwcHg7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlci1jb2xvcjogI2VlZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciA+IC5wcmljZS10YWJsZS1jb250ZW50IC5yb3c6Zmlyc3QtY2hpbGQge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1jb2xvcjogI2VlZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWZvb3RlciB7XHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiA0MHB4IDAgMCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciA+IC5wcmljZS10YWJsZS1mb290ZXIgPiAuZmVhdHVyZWQtcHJpY2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjBweDtcclxuICAgICAgICAgICAgICAgICAgICBmb250LXdlaWdodDogMzAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDNweCBzb2xpZCAjM0ZBQkE0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuQG1lZGlhIChtYXgtd2lkdGg6IDk5MXB4KSB7XHJcbiAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNlLWNvbHVtbi1jb250YWluZXIge1xyXG4gICAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQ7XHJcbiAgICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQ7XHJcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjY2NjO1xyXG4gICAgfVxyXG59XHJcbiJdfQ== */"

/***/ }),

/***/ "./src/account/language-switch.component.html":
/*!****************************************************!*\
  !*** ./src/account/language-switch.component.html ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div *ngIf=\"languages.length > 1\" class=\"language-switch-area\">\r\n    <a *ngFor=\"let language of languages\" (click)=\"changeLanguage(language)\">\r\n        <span [ngClass]=\"{'language-icon-current': language.name==currentLanguage.name}\" title=\"{{language.displayName}}\"><i class=\"{{language.icon}}\" [attr.aria-label]=\"language.displayName\"></i></span>\r\n    </a>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/language-switch.component.ts":
/*!**************************************************!*\
  !*** ./src/account/language-switch.component.ts ***!
  \**************************************************/
/*! exports provided: LanguageSwitchComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LanguageSwitchComponent", function() { return LanguageSwitchComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_2__);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var LanguageSwitchComponent = /** @class */ (function (_super) {
    __extends(LanguageSwitchComponent, _super);
    function LanguageSwitchComponent(injector) {
        var _this = _super.call(this, injector) || this;
        _this.languages = [];
        return _this;
    }
    LanguageSwitchComponent.prototype.ngOnInit = function () {
        this.languages = lodash__WEBPACK_IMPORTED_MODULE_2__["filter"](abp.localization.languages, function (l) { return l.isDisabled === false; });
        this.currentLanguage = abp.localization.currentLanguage;
    };
    LanguageSwitchComponent.prototype.changeLanguage = function (language) {
        abp.utils.setCookieValue('Abp.Localization.CultureName', language.name, new Date(new Date().getTime() + 5 * 365 * 86400000), // 5 year
        abp.appPath);
        location.reload();
    };
    LanguageSwitchComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'language-switch',
            template: __webpack_require__(/*! ./language-switch.component.html */ "./src/account/language-switch.component.html")
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"]])
    ], LanguageSwitchComponent);
    return LanguageSwitchComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/login/login.component.html":
/*!************************************************!*\
  !*** ./src/account/login/login.component.html ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"m-login__signin\" [@routerTransition]>\r\n    <div class=\"m-login__head\">\r\n        <h3 class=\"m-login__title\">\r\n            {{ 'LogIn' | localize }}\r\n        </h3>\r\n    </div>\r\n    <form #loginForm=\"ngForm\" class=\"m-login__form m-form login-form\" method=\"post\" novalidate (ngSubmit)=\"login()\">\r\n\r\n        <div class=\"form-group m-form__group\">\r\n            <input #userNameOrEmailAddressInput=\"ngModel\" [(ngModel)]=\"loginService.authenticateModel.userNameOrEmailAddress\" autoFocus class=\"form-control m-input\" type=\"text\" autocomplete=\"off\" placeholder=\"{{'UserNameOrEmail' | localize}} *\" name=\"userNameOrEmailAddress\" required />\r\n            <validation-messages [formCtrl]=\"userNameOrEmailAddressInput\" *ngIf=\"!userNameOrEmailAddressInput.touched\"></validation-messages>\r\n        </div>\r\n\r\n        <div class=\"form-group m-form__group\">\r\n            <input #passwordInput=\"ngModel\" [(ngModel)]=\"loginService.authenticateModel.password\" class=\"form-control m-input\" type=\"password\" autocomplete=\"off\" placeholder=\"{{'Password' | localize}} *\" name=\"password\" required maxlength=\"32\" />\r\n            <validation-messages [formCtrl]=\"passwordInput\" *ngIf=\"!passwordInput.touched\"></validation-messages>\r\n        </div>\r\n\r\n        <div class=\"row m-login__form-sub\">\r\n            <div class=\"col m--align-left\">\r\n                <label class=\"m-checkbox m-checkbox--primary\">\r\n                    <input class=\"form-control\" [(ngModel)]=\"loginService.rememberMe\" type=\"checkbox\" name=\"rememberMe\" value=\"true\" />{{\"RememberMe\" | localize}}\r\n                    <span></span>\r\n                </label>\r\n            </div>\r\n            <div class=\"col m--align-right\">\r\n                <a routerLink=\"/account/forgot-password\" id=\"forget-password\" class=\"m-link forget-password\">{{\"ForgotPassword\" | localize}}</a>\r\n            </div>\r\n        </div>\r\n\r\n        <div class=\"m-login__form-action\">\r\n            <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!loginForm.form.valid\">{{\"LogIn\" | localize}}</button>\r\n        </div>\r\n    </form>\r\n\r\n    <div class=\"login-options\" *ngIf=\"(multiTenancySideIsTeanant || !isMultiTenancyEnabled) && loginService.externalLoginProviders.length > 0\">\r\n        <h4>{{\"LoginWith\" | localize}}</h4>\r\n        <ul class=\"social-icons\">\r\n            <li *ngFor=\"let provider of loginService.externalLoginProviders\">\r\n                <a class=\"social-login-icon social-icon-color {{provider.icon}}\"\r\n                   (click)=\"externalLogin(provider)\"\r\n                   title=\"{{provider.name}}\"></a>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n\r\n    <div class=\"m-stack__item m-stack__item--center\">\r\n        <div class=\"m-login__account\">\r\n            <span *ngIf=\"isSelfRegistrationAllowed\">\r\n                <a routerLink=\"/account/register\" id=\"register-btn\" class=\"m-link m-link--primary m-login__account-link\">{{\"CreateAnAccount\" | localize}}</a>\r\n                <span class=\"pipe-divider\"> | </span>\r\n            </span>\r\n            <span *ngIf=\"!multiTenancySideIsTeanant && isTenantSelfRegistrationAllowed\">\r\n                <a routerLink=\"/account/select-edition\" id=\"register-btn\" class=\"m-link m-link--primary m-login__account-link\">{{\"NewTenant\" | localize}}</a>\r\n                <span class=\"pipe-divider\"> | </span>\r\n            </span>\r\n            <a routerLink=\"/account/email-activation\" id=\"email-activation-btn\" class=\"m-link m-link--primary m-login__account-link\">{{\"EmailActivation\" | localize}}</a>\r\n        </div>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/login/login.component.ts":
/*!**********************************************!*\
  !*** ./src/account/login/login.component.ts ***!
  \**********************************************/
/*! exports provided: LoginComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LoginComponent", function() { return LoginComponent; });
/* harmony import */ var _abp_session_abp_session_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @abp/session/abp-session.service */ "./node_modules/abp-ng2-module/dist/src/session/abp-session.service.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! shared/helpers/UrlHelper */ "./src/shared/helpers/UrlHelper.ts");
/* harmony import */ var _login_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./login.service */ "./src/account/login/login.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var LoginComponent = /** @class */ (function (_super) {
    __extends(LoginComponent, _super);
    function LoginComponent(injector, loginService, _router, _sessionService, _sessionAppService) {
        var _this = _super.call(this, injector) || this;
        _this.loginService = loginService;
        _this._router = _router;
        _this._sessionService = _sessionService;
        _this._sessionAppService = _sessionAppService;
        _this.submitting = false;
        _this.isMultiTenancyEnabled = _this.multiTenancy.isEnabled;
        return _this;
    }
    Object.defineProperty(LoginComponent.prototype, "multiTenancySideIsTeanant", {
        get: function () {
            return this._sessionService.tenantId > 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LoginComponent.prototype, "isTenantSelfRegistrationAllowed", {
        get: function () {
            return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LoginComponent.prototype, "isSelfRegistrationAllowed", {
        get: function () {
            if (!this._sessionService.tenantId) {
                return false;
            }
            return this.setting.getBoolean('App.UserManagement.AllowSelfRegistration');
        },
        enumerable: true,
        configurable: true
    });
    LoginComponent.prototype.ngOnInit = function () {
        if (this._sessionService.userId > 0 && shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_6__["UrlHelper"].getReturnUrl() && shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_6__["UrlHelper"].getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken()
                .subscribe(function (result) {
                var initialReturnUrl = shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_6__["UrlHelper"].getReturnUrl();
                var returnUrl = initialReturnUrl + (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                    'accessToken=' + result.signInToken +
                    '&userId=' + result.encodedUserId +
                    '&tenantId=' + result.encodedTenantId;
                location.href = returnUrl;
            });
        }
        var state = shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_6__["UrlHelper"].getQueryParametersUsingHash().state;
        if (state && state.indexOf('openIdConnect') >= 0) {
            this.loginService.openIdConnectLoginCallback({});
        }
    };
    LoginComponent.prototype.login = function () {
        var _this = this;
        abp.ui.setBusy(undefined, '', 1);
        this.submitting = true;
        this.loginService.authenticate(function () {
            _this.submitting = false;
            abp.ui.clearBusy();
        });
    };
    LoginComponent.prototype.externalLogin = function (provider) {
        this.loginService.externalAuthenticate(provider);
    };
    LoginComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            template: __webpack_require__(/*! ./login.component.html */ "./src/account/login/login.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injector"],
            _login_service__WEBPACK_IMPORTED_MODULE_7__["LoginService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"],
            _abp_session_abp_session_service__WEBPACK_IMPORTED_MODULE_0__["AbpSessionService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["SessionServiceProxy"]])
    ], LoginComponent);
    return LoginComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/login/login.service.ts":
/*!********************************************!*\
  !*** ./src/account/login/login.service.ts ***!
  \********************************************/
/*! exports provided: ExternalLoginProvider, LoginService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ExternalLoginProvider", function() { return ExternalLoginProvider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LoginService", function() { return LoginService; });
/* harmony import */ var _abp_auth_token_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @abp/auth/token.service */ "./node_modules/abp-ng2-module/dist/src/auth/token.service.js");
/* harmony import */ var _abp_log_log_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @abp/log/log.service */ "./node_modules/abp-ng2-module/dist/src/log/log.service.js");
/* harmony import */ var _abp_message_message_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @abp/message/message.service */ "./node_modules/abp-ng2-module/dist/src/message/message.service.js");
/* harmony import */ var _abp_utils_utils_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @abp/utils/utils.service */ "./node_modules/abp-ng2-module/dist/src/utils/utils.service.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @shared/helpers/UrlHelper */ "./src/shared/helpers/UrlHelper.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @shared/utils/script-loader.service */ "./src/shared/utils/script-loader.service.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var angular_oauth2_oidc__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! angular-oauth2-oidc */ "./node_modules/angular-oauth2-oidc/esm5/angular-oauth2-oidc.js");
/* harmony import */ var adal_angular_lib_adal__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! adal-angular/lib/adal */ "./node_modules/adal-angular/lib/adal.js");
/* harmony import */ var adal_angular_lib_adal__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(adal_angular_lib_adal__WEBPACK_IMPORTED_MODULE_13__);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};














var ExternalLoginProvider = /** @class */ (function (_super) {
    __extends(ExternalLoginProvider, _super);
    function ExternalLoginProvider(providerInfo) {
        var _this = _super.call(this) || this;
        _this.initialized = false;
        _this.name = providerInfo.name;
        _this.clientId = providerInfo.clientId;
        _this.additionalParams = providerInfo.additionalParams;
        _this.icon = ExternalLoginProvider.getSocialIcon(_this.name);
        return _this;
    }
    ExternalLoginProvider.getSocialIcon = function (providerName) {
        providerName = providerName.toLowerCase();
        if (providerName === 'google') {
            providerName = 'googleplus';
        }
        return providerName;
    };
    ExternalLoginProvider.FACEBOOK = 'Facebook';
    ExternalLoginProvider.GOOGLE = 'Google';
    ExternalLoginProvider.MICROSOFT = 'Microsoft';
    ExternalLoginProvider.OPENID = 'OpenIdConnect';
    ExternalLoginProvider.WSFEDERATION = 'WsFederation';
    return ExternalLoginProvider;
}(_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalLoginProviderInfoModel"]));

var LoginService = /** @class */ (function () {
    function LoginService(_tokenAuthService, _router, _utilsService, _messageService, _tokenService, _logService, oauthService) {
        this._tokenAuthService = _tokenAuthService;
        this._router = _router;
        this._utilsService = _utilsService;
        this._messageService = _messageService;
        this._tokenService = _tokenService;
        this._logService = _logService;
        this.oauthService = oauthService;
        this.externalLoginProviders = [];
        this.clear();
    }
    LoginService_1 = LoginService;
    LoginService.prototype.authenticate = function (finallyCallback, redirectUrl) {
        var _this = this;
        finallyCallback = finallyCallback || (function () {
            abp.ui.clearBusy();
        });
        // We may switch to localStorage instead of cookies
        this.authenticateModel.twoFactorRememberClientToken = this._utilsService.getCookieValue(LoginService_1.twoFactorRememberClientTokenName);
        this.authenticateModel.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
        this.authenticateModel.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
        this._tokenAuthService
            .authenticate(this.authenticateModel)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_11__["finalize"])(finallyCallback))
            .subscribe(function (result) {
            _this.processAuthenticateResult(result, redirectUrl);
        });
    };
    LoginService.prototype.externalAuthenticate = function (provider) {
        var _this = this;
        this.ensureExternalLoginProviderInitialized(provider, function () {
            if (provider.name === ExternalLoginProvider.FACEBOOK) {
                FB.login(function (response) {
                    _this.facebookLoginStatusChangeCallback(response);
                }, { scope: 'email' });
            }
            else if (provider.name === ExternalLoginProvider.GOOGLE) {
                gapi.auth2.getAuthInstance().signIn().then(function () {
                    _this.googleLoginStatusChangeCallback(gapi.auth2.getAuthInstance().isSignedIn.get());
                });
            }
            else if (provider.name === ExternalLoginProvider.MICROSOFT) {
                WL.login({
                    scope: ['wl.signin', 'wl.basic', 'wl.emails']
                });
            }
        });
    };
    LoginService.prototype.init = function () {
        this.initExternalLoginProviders();
    };
    LoginService.prototype.processAuthenticateResult = function (authenticateResult, redirectUrl) {
        this.authenticateResult = authenticateResult;
        if (authenticateResult.shouldResetPassword) {
            // Password reset
            this._router.navigate(['account/reset-password'], {
                queryParams: {
                    userId: authenticateResult.userId,
                    tenantId: abp.session.tenantId,
                    resetCode: authenticateResult.passwordResetCode
                }
            });
            this.clear();
        }
        else if (authenticateResult.requiresTwoFactorVerification) {
            // Two factor authentication
            this._router.navigate(['account/send-code']);
        }
        else if (authenticateResult.accessToken) {
            // Successfully logged in
            if (authenticateResult.returnUrl && !redirectUrl) {
                redirectUrl = authenticateResult.returnUrl;
            }
            this.login(authenticateResult.accessToken, authenticateResult.encryptedAccessToken, authenticateResult.expireInSeconds, this.rememberMe, authenticateResult.twoFactorRememberClientToken, redirectUrl);
        }
        else {
            // Unexpected result!
            this._logService.warn('Unexpected authenticateResult!');
            this._router.navigate(['account/login']);
        }
    };
    LoginService.prototype.login = function (accessToken, encryptedAccessToken, expireInSeconds, rememberMe, twoFactorRememberClientToken, redirectUrl) {
        var tokenExpireDate = rememberMe ? (new Date(new Date().getTime() + 1000 * expireInSeconds)) : undefined;
        this._tokenService.setToken(accessToken, tokenExpireDate);
        this._utilsService.setCookieValue(_shared_AppConsts__WEBPACK_IMPORTED_MODULE_6__["AppConsts"].authorization.encrptedAuthTokenName, encryptedAccessToken, tokenExpireDate, abp.appPath);
        if (twoFactorRememberClientToken) {
            this._utilsService.setCookieValue(LoginService_1.twoFactorRememberClientTokenName, twoFactorRememberClientToken, new Date(new Date().getTime() + 365 * 86400000), // 1 year
            abp.appPath);
        }
        if (redirectUrl) {
            location.href = redirectUrl;
        }
        else {
            var initialUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].initialUrl;
            if (initialUrl.indexOf('/account') > 0) {
                initialUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_6__["AppConsts"].appBaseUrl;
            }
            location.href = initialUrl;
        }
    };
    LoginService.prototype.clear = function () {
        this.authenticateModel = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["AuthenticateModel"]();
        this.authenticateModel.rememberClient = false;
        this.authenticateResult = null;
        this.rememberMe = false;
    };
    LoginService.prototype.initExternalLoginProviders = function (callback) {
        var _this = this;
        this._tokenAuthService
            .getExternalAuthenticationProviders()
            .subscribe(function (providers) {
            _this.externalLoginProviders = lodash__WEBPACK_IMPORTED_MODULE_10__["map"](providers, function (p) { return new ExternalLoginProvider(p); });
            if (callback) {
                callback();
            }
        });
    };
    LoginService.prototype.ensureExternalLoginProviderInitialized = function (loginProvider, callback) {
        var _this = this;
        if (loginProvider.initialized) {
            callback();
            return;
        }
        if (loginProvider.name === ExternalLoginProvider.FACEBOOK) {
            new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_9__["ScriptLoaderService"]().load('//connect.facebook.net/en_US/sdk.js').then(function () {
                FB.init({
                    appId: loginProvider.clientId,
                    cookie: false,
                    xfbml: true,
                    version: 'v2.5'
                });
                FB.getLoginStatus(function (response) {
                    _this.facebookLoginStatusChangeCallback(response);
                    if (response.status !== 'connected') {
                        callback();
                    }
                });
            });
        }
        else if (loginProvider.name === ExternalLoginProvider.GOOGLE) {
            new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_9__["ScriptLoaderService"]().load('https://apis.google.com/js/api.js').then(function () {
                gapi.load('client:auth2', function () {
                    gapi.client.init({
                        clientId: loginProvider.clientId,
                        scope: 'openid profile email'
                    }).then(function () {
                        callback();
                    });
                });
            });
        }
        else if (loginProvider.name === ExternalLoginProvider.MICROSOFT) {
            new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_9__["ScriptLoaderService"]().load('//js.live.net/v5.0/wl.js').then(function () {
                WL.Event.subscribe('auth.login', _this.microsoftLogin);
                WL.init({
                    client_id: loginProvider.clientId,
                    scope: ['wl.signin', 'wl.basic', 'wl.emails'],
                    redirect_uri: _shared_AppConsts__WEBPACK_IMPORTED_MODULE_6__["AppConsts"].appBaseUrl,
                    response_type: 'token'
                });
            });
        }
        else if (loginProvider.name === ExternalLoginProvider.OPENID) {
            var authConfig = this.getOpenIdConnectConfig(loginProvider);
            this.oauthService.configure(authConfig);
            this.oauthService.initImplicitFlow('openIdConnect=1');
        }
        else if (loginProvider.name === ExternalLoginProvider.WSFEDERATION) {
            var config = this.getWsFederationConnectConfig(loginProvider);
            this.wsFederationAuthenticationContext = new adal_angular_lib_adal__WEBPACK_IMPORTED_MODULE_13__(config);
            this.wsFederationAuthenticationContext.login();
        }
    };
    LoginService.prototype.getWsFederationConnectConfig = function (loginProvider) {
        var config = {
            clientId: loginProvider.clientId,
            popUp: true,
            callback: this.wsFederationLoginStatusChangeCallback.bind(this)
        };
        if (loginProvider.additionalParams['Tenant']) {
            config.tenant = loginProvider.additionalParams['Tenant'];
        }
        return config;
    };
    LoginService.prototype.getOpenIdConnectConfig = function (loginProvider) {
        var authConfig = new angular_oauth2_oidc__WEBPACK_IMPORTED_MODULE_12__["AuthConfig"]();
        authConfig.loginUrl = loginProvider.additionalParams['LoginUrl'];
        authConfig.issuer = loginProvider.additionalParams['Authority'];
        authConfig.skipIssuerCheck = loginProvider.additionalParams['ValidateIssuer'] === 'false';
        authConfig.clientId = loginProvider.clientId;
        authConfig.responseType = 'id_token';
        authConfig.redirectUri = window.location.origin + '/account/login';
        authConfig.scope = 'openid';
        authConfig.requestAccessToken = false;
        return authConfig;
    };
    LoginService.prototype.facebookLoginStatusChangeCallback = function (resp) {
        var _this = this;
        if (resp.status === 'connected') {
            var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalAuthenticateModel"]();
            model.authProvider = ExternalLoginProvider.FACEBOOK;
            model.providerAccessCode = resp.authResponse.accessToken;
            model.providerKey = resp.authResponse.userID;
            model.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
            model.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
            this._tokenAuthService.externalAuthenticate(model)
                .subscribe(function (result) {
                if (result.waitingForActivation) {
                    _this._messageService.info('You have successfully registered. Waiting for activation!');
                    return;
                }
                _this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
            });
        }
    };
    LoginService.prototype.openIdConnectLoginCallback = function (resp) {
        var _this = this;
        this.initExternalLoginProviders(function () {
            var openIdProvider = lodash__WEBPACK_IMPORTED_MODULE_10__["filter"](_this.externalLoginProviders, { name: 'OpenIdConnect' })[0];
            var authConfig = _this.getOpenIdConnectConfig(openIdProvider);
            _this.oauthService.configure(authConfig);
            abp.ui.setBusy();
            _this.oauthService.tryLogin().then(function () {
                var claims = _this.oauthService.getIdentityClaims();
                var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalAuthenticateModel"]();
                model.authProvider = ExternalLoginProvider.OPENID;
                model.providerAccessCode = _this.oauthService.getIdToken();
                model.providerKey = claims['sub'];
                model.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
                model.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
                _this._tokenAuthService.externalAuthenticate(model)
                    .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_11__["finalize"])(function () { abp.ui.unblock(); }))
                    .subscribe(function (result) {
                    if (result.waitingForActivation) {
                        _this._messageService.info('You have successfully registered. Waiting for activation!');
                        return;
                    }
                    _this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
                });
            });
        });
    };
    LoginService.prototype.googleLoginStatusChangeCallback = function (isSignedIn) {
        var _this = this;
        if (isSignedIn) {
            var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalAuthenticateModel"]();
            model.authProvider = ExternalLoginProvider.GOOGLE;
            model.providerAccessCode = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            model.providerKey = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
            model.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
            model.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
            this._tokenAuthService.externalAuthenticate(model)
                .subscribe(function (result) {
                if (result.waitingForActivation) {
                    _this._messageService.info('You have successfully registered. Waiting for activation!');
                    return;
                }
                _this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
            });
        }
    };
    LoginService.prototype.wsFederationLoginStatusChangeCallback = function (errorDesc, token, error, tokenType) {
        var _this = this;
        var user = this.wsFederationAuthenticationContext.getCachedUser();
        var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalAuthenticateModel"]();
        model.authProvider = ExternalLoginProvider.WSFEDERATION;
        model.providerAccessCode = token;
        model.providerKey = user.profile.sub;
        model.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
        model.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
        this._tokenAuthService.externalAuthenticate(model)
            .subscribe(function (result) {
            if (result.waitingForActivation) {
                _this._messageService.info('You have successfully registered. Waiting for activation!');
                _this._router.navigate(['account/login']);
                return;
            }
            _this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
        });
    };
    /**
    * Microsoft login is not completed yet, because of an error thrown by zone.js: https://github.com/angular/zone.js/issues/290
    */
    LoginService.prototype.microsoftLogin = function () {
        var _this = this;
        this._logService.debug(WL.getSession());
        var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["ExternalAuthenticateModel"]();
        model.authProvider = ExternalLoginProvider.MICROSOFT;
        model.providerAccessCode = WL.getSession().access_token;
        model.providerKey = WL.getSession().id; // How to get id?
        model.singleSignIn = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getSingleSignIn();
        model.returnUrl = _shared_helpers_UrlHelper__WEBPACK_IMPORTED_MODULE_7__["UrlHelper"].getReturnUrl();
        this._tokenAuthService.externalAuthenticate(model)
            .subscribe(function (result) {
            if (result.waitingForActivation) {
                _this._messageService.info('You have successfully registered. Waiting for activation!');
                return;
            }
            _this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
        });
    };
    var LoginService_1;
    LoginService.twoFactorRememberClientTokenName = 'TwoFactorRememberClientToken';
    LoginService = LoginService_1 = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_4__["Injectable"])(),
        __metadata("design:paramtypes", [_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_8__["TokenAuthServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_5__["Router"],
            _abp_utils_utils_service__WEBPACK_IMPORTED_MODULE_3__["UtilsService"],
            _abp_message_message_service__WEBPACK_IMPORTED_MODULE_2__["MessageService"],
            _abp_auth_token_service__WEBPACK_IMPORTED_MODULE_0__["TokenService"],
            _abp_log_log_service__WEBPACK_IMPORTED_MODULE_1__["LogService"],
            angular_oauth2_oidc__WEBPACK_IMPORTED_MODULE_12__["OAuthService"]])
    ], LoginService);
    return LoginService;
}());



/***/ }),

/***/ "./src/account/login/send-two-factor-code.component.html":
/*!***************************************************************!*\
  !*** ./src/account/login/send-two-factor-code.component.html ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{'SendSecurityCode' | localize}}\r\n            </h3>\r\n        </div>\r\n        <form #twoFactorForm=\"ngForm\" class=\"m-login__form m-form\" method=\"post\" (ngSubmit)=\"submit()\" *ngIf=\"loginService.authenticateResult\">\r\n            <p>{{\"SendSecurityCode_Information\" | localize}}</p>\r\n            <div class=\"form-group m-form__group\">\r\n                <select autoFocus\r\n                        size=\"1\"\r\n                        class=\"form-control\"\r\n                        [(ngModel)]=\"selectedTwoFactorProvider\"\r\n                        name=\"selectedTwoFactorProvider\">\r\n                    <option *ngFor=\"let provider of loginService.authenticateResult.twoFactorAuthProviders\" [value]=\"provider\">{{provider}}</option>\r\n                </select>\r\n            </div>\r\n\r\n            <div class=\"m-login__form-action\">\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\">{{\"Submit\" | localize}}</button>\r\n            </div>\r\n        </form>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n"

/***/ }),

/***/ "./src/account/login/send-two-factor-code.component.ts":
/*!*************************************************************!*\
  !*** ./src/account/login/send-two-factor-code.component.ts ***!
  \*************************************************************/
/*! exports provided: SendTwoFactorCodeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SendTwoFactorCodeComponent", function() { return SendTwoFactorCodeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _login_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./login.service */ "./src/account/login/login.service.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var SendTwoFactorCodeComponent = /** @class */ (function (_super) {
    __extends(SendTwoFactorCodeComponent, _super);
    function SendTwoFactorCodeComponent(injector, loginService, _tokenAuthService, _router) {
        var _this = _super.call(this, injector) || this;
        _this.loginService = loginService;
        _this._tokenAuthService = _tokenAuthService;
        _this._router = _router;
        _this.submitting = false;
        return _this;
    }
    SendTwoFactorCodeComponent.prototype.canActivate = function () {
        if (this.loginService.authenticateModel &&
            this.loginService.authenticateResult &&
            this.loginService.authenticateResult.twoFactorAuthProviders &&
            this.loginService.authenticateResult.twoFactorAuthProviders.length) {
            return true;
        }
        return false;
    };
    SendTwoFactorCodeComponent.prototype.ngOnInit = function () {
        if (!this.canActivate()) {
            this._router.navigate(['account/login']);
            return;
        }
        this.selectedTwoFactorProvider = this.loginService.authenticateResult.twoFactorAuthProviders[0];
    };
    SendTwoFactorCodeComponent.prototype.submit = function () {
        var _this = this;
        var model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SendTwoFactorAuthCodeModel"]();
        model.userId = this.loginService.authenticateResult.userId;
        model.provider = this.selectedTwoFactorProvider;
        this.submitting = true;
        this._tokenAuthService
            .sendTwoFactorAuthCode(model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_6__["finalize"])(function () { return _this.submitting = false; }))
            .subscribe(function () {
            _this._router.navigate(['account/verify-code']);
        });
    };
    SendTwoFactorCodeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./send-two-factor-code.component.html */ "./src/account/login/send-two-factor-code.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _login_service__WEBPACK_IMPORTED_MODULE_5__["LoginService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["TokenAuthServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], SendTwoFactorCodeComponent);
    return SendTwoFactorCodeComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/login/validate-two-factor-code.component.html":
/*!*******************************************************************!*\
  !*** ./src/account/login/validate-two-factor-code.component.html ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{'VerifySecurityCode' | localize}}\r\n            </h3>\r\n        </div>\r\n        <form #twoFactorForm=\"ngForm\" class=\"m-login__form m-form verify-security-code-form\" method=\"post\" (ngSubmit)=\"submit()\">\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #passwordInput=\"ngModel\" autoFocus [(ngModel)]=\"code\" class=\"form-control form-control-solid placeholder-no-fix input-ltr\" type=\"password\" autocomplete=\"off\" placeholder=\"{{'Code' | localize}} *\" name=\"code\" required maxlength=\"16\" />\r\n                <validation-messages [formCtrl]=\"passwordInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"form-group margin-top-20\">\r\n                <label class=\"m-checkbox\">\r\n                    <input class=\"form-control\" [(ngModel)]=\"loginService.authenticateModel.rememberClient\" type=\"checkbox\" name=\"rememberClient\" value=\"true\" />{{\"RememberThisBrowser\" | localize}}\r\n                    <span></span>\r\n                </label>\r\n            </div>\r\n\r\n\r\n            <div class=\"m-login__form-action\">\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!twoFactorForm.form.valid\">{{\"Submit\" | localize}}</button>\r\n                <span class=\"remaining-time-counter\" *ngIf=\"remainingSeconds >= 0\">{{\"RemainingTime\" | localize}}: {{\"SecondShort{0}\" | localize:remainingSeconds}}.</span>\r\n            </div>\r\n        </form>\r\n    </div>\r\n\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/login/validate-two-factor-code.component.less":
/*!*******************************************************************!*\
  !*** ./src/account/login/validate-two-factor-code.component.less ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".remaining-time-counter {\n  margin-left: 10px;\n  color: red;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L2xvZ2luL0Q6L0RyaW1hIEFzcE5ldFplcm8vYW5ndWxhci9zcmMvYWNjb3VudC9sb2dpbi92YWxpZGF0ZS10d28tZmFjdG9yLWNvZGUuY29tcG9uZW50Lmxlc3MiLCJzcmMvYWNjb3VudC9sb2dpbi92YWxpZGF0ZS10d28tZmFjdG9yLWNvZGUuY29tcG9uZW50Lmxlc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDSSxpQkFBQTtFQUNBLFVBQUE7QUNDSiIsImZpbGUiOiJzcmMvYWNjb3VudC9sb2dpbi92YWxpZGF0ZS10d28tZmFjdG9yLWNvZGUuY29tcG9uZW50Lmxlc3MiLCJzb3VyY2VzQ29udGVudCI6WyIucmVtYWluaW5nLXRpbWUtY291bnRlciB7XG4gICAgbWFyZ2luLWxlZnQ6IDEwcHg7XG4gICAgY29sb3I6IHJlZDtcbn0iLCIucmVtYWluaW5nLXRpbWUtY291bnRlciB7XG4gIG1hcmdpbi1sZWZ0OiAxMHB4O1xuICBjb2xvcjogcmVkO1xufVxuIl19 */"

/***/ }),

/***/ "./src/account/login/validate-two-factor-code.component.ts":
/*!*****************************************************************!*\
  !*** ./src/account/login/validate-two-factor-code.component.ts ***!
  \*****************************************************************/
/*! exports provided: ValidateTwoFactorCodeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ValidateTwoFactorCodeComponent", function() { return ValidateTwoFactorCodeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var _login_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./login.service */ "./src/account/login/login.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var ValidateTwoFactorCodeComponent = /** @class */ (function (_super) {
    __extends(ValidateTwoFactorCodeComponent, _super);
    function ValidateTwoFactorCodeComponent(injector, loginService, _router) {
        var _this = _super.call(this, injector) || this;
        _this.loginService = loginService;
        _this._router = _router;
        _this.submitting = false;
        _this.remainingSeconds = 90;
        return _this;
    }
    ValidateTwoFactorCodeComponent.prototype.canActivate = function () {
        if (this.loginService.authenticateModel &&
            this.loginService.authenticateResult) {
            return true;
        }
        return false;
    };
    ValidateTwoFactorCodeComponent.prototype.ngOnInit = function () {
        var _this = this;
        if (!this.canActivate()) {
            this._router.navigate(['account/login']);
            return;
        }
        var timerSource = Object(rxjs__WEBPACK_IMPORTED_MODULE_4__["timer"])(1000, 1000);
        this.timerSubscription = timerSource.subscribe(function () {
            _this.remainingSeconds = _this.remainingSeconds - 1;
            if (_this.remainingSeconds === 0) {
                _this.message.warn(_this.l('TimeoutPleaseTryAgain')).then(function () {
                    _this.loginService.authenticateModel.twoFactorVerificationCode = null;
                    _this._router.navigate(['account/login']);
                });
            }
        });
    };
    ValidateTwoFactorCodeComponent.prototype.ngOnDestroy = function () {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }
    };
    ValidateTwoFactorCodeComponent.prototype.submit = function () {
        this.loginService.authenticateModel.twoFactorVerificationCode = this.code;
        this.loginService.authenticate();
    };
    ValidateTwoFactorCodeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./validate-two-factor-code.component.html */ "./src/account/login/validate-two-factor-code.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()],
            styles: [__webpack_require__(/*! ./validate-two-factor-code.component.less */ "./src/account/login/validate-two-factor-code.component.less")]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _login_service__WEBPACK_IMPORTED_MODULE_5__["LoginService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], ValidateTwoFactorCodeComponent);
    return ValidateTwoFactorCodeComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/password/forgot-password.component.html":
/*!*************************************************************!*\
  !*** ./src/account/password/forgot-password.component.html ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{\"ForgotPassword\" | localize}}\r\n            </h3>\r\n        </div>\r\n        <form class=\"m-login__form m-form forget-form\" #forgotPassForm=\"ngForm\" method=\"post\" novalidate (ngSubmit)=\"save()\">\r\n            <p>\r\n                {{\"SendPasswordResetLink_Information\" | localize}}\r\n            </p>\r\n            <div class=\"form-group m-form__group\">\r\n                <input #emailAddressInput=\"ngModel\" [(ngModel)]=\"model.emailAddress\" autoFocus class=\"form-control placeholder-no-fix\" type=\"text\" autocomplete=\"off\" placeholder=\"{{'EmailAddress' | localize}} *\" name=\"emailAddress\" required maxlength=\"256\" email />\r\n                <validation-messages [formCtrl]=\"emailAddressInput\"></validation-messages>\r\n            </div>\r\n            <div class=\"m-login__form-action\">\r\n\r\n                <button [disabled]=\"saving\" routerLink=\"/account/login\" type=\"button\" class=\"btn btn-outline-primary  m-btn m-btn--pill m-btn--custom\"><i class=\"fa fa-arrow-left\"></i> {{\"Back\" | localize}}</button>\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!forgotPassForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-check\"></i> {{\"Submit\" | localize}}</button>\r\n            </div>\r\n        </form>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/password/forgot-password.component.ts":
/*!***********************************************************!*\
  !*** ./src/account/password/forgot-password.component.ts ***!
  \***********************************************************/
/*! exports provided: ForgotPasswordComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ForgotPasswordComponent", function() { return ForgotPasswordComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/nav/app-url.service */ "./src/shared/common/nav/app-url.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var ForgotPasswordComponent = /** @class */ (function (_super) {
    __extends(ForgotPasswordComponent, _super);
    function ForgotPasswordComponent(injector, _accountService, _appUrlService, _router) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this._appUrlService = _appUrlService;
        _this._router = _router;
        _this.model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["SendPasswordResetCodeInput"]();
        _this.saving = false;
        return _this;
    }
    ForgotPasswordComponent.prototype.save = function () {
        var _this = this;
        this.saving = true;
        this._accountService.sendPasswordResetCode(this.model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_6__["finalize"])(function () { _this.saving = false; }))
            .subscribe(function () {
            _this.message.success(_this.l('PasswordResetMailSentMessage'), _this.l('MailSent')).then(function () {
                _this._router.navigate(['account/login']);
            });
        });
    };
    ForgotPasswordComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./forgot-password.component.html */ "./src/account/password/forgot-password.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["AccountServiceProxy"],
            _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__["AppUrlService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], ForgotPasswordComponent);
    return ForgotPasswordComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/password/reset-password.component.html":
/*!************************************************************!*\
  !*** ./src/account/password/reset-password.component.html ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{\"ChangePassword\" | localize}}\r\n            </h3>\r\n        </div>\r\n        <form #resetPassForm=\"ngForm\" class=\"m-login__form\" method=\"post\" (ngSubmit)=\"save()\">\r\n            <p>\r\n                {{\"PleaseEnterYourNewPassword\" | localize}}\r\n            </p>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"Password\" class=\"form-control placeholder-no-fix\" [(ngModel)]=\"model.password\" #Password=\"ngModel\" placeholder=\"{{'Password' | localize}}\" validateEqual=\"PasswordRepeat\"\r\n                       reverse=\"true\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\"\r\n                       [requireUppercase]=\"passwordComplexitySetting.requireUppercase\" [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n            <div [hidden]=\"resetPassForm.form.valid || resetPassForm.form.pristine\" class=\"form-group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"Password.errors\">\r\n                    <li [hidden]=\"!Password.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                </ul>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"PasswordRepeat\" class=\"form-control placeholder-no-fix\" [ngModel]=\"model.passwordRepeat\" #PasswordRepeat=\"ngModel\" placeholder=\"{{'PasswordRepeat' | localize}}\" validateEqual=\"Password\"\r\n                       reverse=\"false\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\"\r\n                       [requireUppercase]=\"passwordComplexitySetting.requireUppercase\" [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n            <div [hidden]=\"resetPassForm.form.valid || resetPassForm.form.pristine\" class=\"form-group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"PasswordRepeat.errors\">\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                    <li [hidden]=\"PasswordRepeat.valid\">{{\"PasswordsDontMatch\" | localize}}</li>\r\n                </ul>\r\n            </div>\r\n\r\n            <div class=\"m-login__form-action\">\r\n                <button [disabled]=\"saving\" routerLink=\"/account/login\" type=\"button\" class=\"btn btn-outline-primary  m-btn m-btn--pill m-btn--custom\"><i class=\"fa fa-arrow-left\"></i> {{\"Back\" | localize}}</button>\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!resetPassForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-check\"></i> {{\"Submit\" | localize}}</button>\r\n            </div>\r\n\r\n        </form>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n"

/***/ }),

/***/ "./src/account/password/reset-password.component.ts":
/*!**********************************************************!*\
  !*** ./src/account/password/reset-password.component.ts ***!
  \**********************************************************/
/*! exports provided: ResetPasswordComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ResetPasswordComponent", function() { return ResetPasswordComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/nav/app-url.service */ "./src/shared/common/nav/app-url.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _login_login_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../login/login.service */ "./src/account/login/login.service.ts");
/* harmony import */ var _reset_password_model__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./reset-password.model */ "./src/account/password/reset-password.model.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};









var ResetPasswordComponent = /** @class */ (function (_super) {
    __extends(ResetPasswordComponent, _super);
    function ResetPasswordComponent(injector, _accountService, _router, _activatedRoute, _loginService, _appUrlService, _profileService) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this._router = _router;
        _this._activatedRoute = _activatedRoute;
        _this._loginService = _loginService;
        _this._appUrlService = _appUrlService;
        _this._profileService = _profileService;
        _this.model = new _reset_password_model__WEBPACK_IMPORTED_MODULE_7__["ResetPasswordModel"]();
        _this.passwordComplexitySetting = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PasswordComplexitySetting"]();
        _this.saving = false;
        return _this;
    }
    ResetPasswordComponent.prototype.ngOnInit = function () {
        var _this = this;
        this._profileService.getPasswordComplexitySetting().subscribe(function (result) {
            _this.passwordComplexitySetting = result.setting;
        });
        if (this._activatedRoute.snapshot.queryParams['c']) {
            this.model.c = this._activatedRoute.snapshot.queryParams['c'];
            this._accountService.resolveTenantId(new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["ResolveTenantIdInput"]({ c: this.model.c })).subscribe(function (tenantId) {
                _this.appSession.changeTenantIfNeeded(tenantId);
            });
        }
        else {
            this.model.userId = this._activatedRoute.snapshot.queryParams['userId'];
            this.model.resetCode = this._activatedRoute.snapshot.queryParams['resetCode'];
            this.appSession.changeTenantIfNeeded(this.parseTenantId(this._activatedRoute.snapshot.queryParams['tenantId']));
        }
    };
    ResetPasswordComponent.prototype.save = function () {
        var _this = this;
        this.saving = true;
        this._accountService.resetPassword(this.model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_8__["finalize"])(function () { _this.saving = false; }))
            .subscribe(function (result) {
            if (!result.canLogin) {
                _this._router.navigate(['account/login']);
                return;
            }
            // Autheticate
            _this.saving = true;
            _this._loginService.authenticateModel.userNameOrEmailAddress = result.userName;
            _this._loginService.authenticateModel.password = _this.model.password;
            _this._loginService.authenticate(function () {
                _this.saving = false;
            });
        });
    };
    ResetPasswordComponent.prototype.parseTenantId = function (tenantIdAsStr) {
        var tenantId = !tenantIdAsStr ? undefined : parseInt(tenantIdAsStr);
        if (tenantId === NaN) {
            tenantId = undefined;
        }
        return tenantId;
    };
    ResetPasswordComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./reset-password.component.html */ "./src/account/password/reset-password.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["AccountServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _login_login_service__WEBPACK_IMPORTED_MODULE_6__["LoginService"],
            _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__["AppUrlService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["ProfileServiceProxy"]])
    ], ResetPasswordComponent);
    return ResetPasswordComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/password/reset-password.model.ts":
/*!******************************************************!*\
  !*** ./src/account/password/reset-password.model.ts ***!
  \******************************************************/
/*! exports provided: ResetPasswordModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ResetPasswordModel", function() { return ResetPasswordModel; });
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var ResetPasswordModel = /** @class */ (function (_super) {
    __extends(ResetPasswordModel, _super);
    function ResetPasswordModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ResetPasswordModel;
}(_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__["ResetPasswordInput"]));



/***/ }),

/***/ "./src/account/payment/buy.component.html":
/*!************************************************!*\
  !*** ./src/account/payment/buy.component.html ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__head\">\r\n        <h3 class=\"m-login__title\">\r\n            {{\"PaymentInfo\" | localize}}\r\n        </h3>\r\n    </div>\r\n\r\n    <form class=\"buy-edition-form\" method=\"post\">\r\n\r\n        <div class=\"text-center m--margin-bottom-20\">({{\"Edition\" | localize}}: {{edition.displayName}})</div>\r\n\r\n        <div *ngIf=\"edition.monthlyPrice\" class=\"form-group\">\r\n            <label class=\"m-radio\">\r\n                <input class=\"form-control\" type=\"radio\" name=\"PaymentPeriodType\"\r\n                       checked\r\n                       [value]=\"paymentPeriodType.Monthly\"\r\n                       (change)=\"onPaymentPeriodChangeChange(paymentPeriodType.Monthly)\" />{{\"MonthlyPrice\" | localize}}: {{appSession.application.currencySign}}{{edition.monthlyPrice | number : '1.2-2'}}\r\n                <span></span>\r\n            </label>\r\n        </div>\r\n\r\n        <div *ngIf=\"edition.annualPrice\" class=\"form-group\">\r\n            <label class=\"m-radio\">\r\n                <input class=\"form-control\" type=\"radio\" name=\"PaymentPeriodType\"\r\n                       [value]=\"paymentPeriodType.Annual\"\r\n                       (change)=\"onPaymentPeriodChangeChange(paymentPeriodType.Annual)\" />{{\"AnnualPrice\" | localize}}: {{appSession.application.currencySign}}{{edition.annualPrice | number : '1.2-2'}}\r\n                <span></span>\r\n            </label>\r\n        </div>\r\n\r\n        <hr />\r\n\r\n        <div *ngIf=\"supportsRecurringPayments\" class=\"form-group\">\r\n            <label class=\"m-checkbox margin-bottom-0\">\r\n                <input class=\"form-control\" type=\"checkbox\" name=\"RecurringPaymentEnabled\"\r\n                       [(ngModel)]=\"recurringPaymentEnabled\" /> {{\"AutomaticallyBillMyAccount\" | localize}}\r\n                <span></span>\r\n            </label>\r\n        </div>\r\n\r\n        <div *ngFor=\"let paymentGateway of paymentGateways\" class=\"form-group\">\r\n            <button *ngIf=\"paymentGateway.supportsRecurringPayments || !recurringPaymentEnabled\" (click)=\"checkout(paymentGateway.gatewayType)\" class=\"btn btn-success btn-block\">{{\"CheckoutWith\" + getPaymentGatewayType(paymentGateway.gatewayType) | localize}}</button>\r\n        </div>\r\n\r\n    </form>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/buy.component.ts":
/*!**********************************************!*\
  !*** ./src/account/payment/buy.component.ts ***!
  \**********************************************/
/*! exports provided: BuyEditionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BuyEditionComponent", function() { return BuyEditionComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./payment-helper.service */ "./src/account/payment/payment-helper.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var BuyEditionComponent = /** @class */ (function (_super) {
    __extends(BuyEditionComponent, _super);
    function BuyEditionComponent(injector, _activatedRoute, _router, _paymnetHelperService, _paymentAppService, _tenantRegistrationService) {
        var _this = _super.call(this, injector) || this;
        _this._activatedRoute = _activatedRoute;
        _this._router = _router;
        _this._paymnetHelperService = _paymnetHelperService;
        _this._paymentAppService = _paymentAppService;
        _this._tenantRegistrationService = _tenantRegistrationService;
        _this.edition = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionSelectDto"]();
        _this.tenantId = abp.session.tenantId;
        _this.paymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentPeriodType"];
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentPeriodType"].Monthly;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionPaymentGatewayType"];
        _this.supportsRecurringPayments = false;
        _this.recurringPaymentEnabled = false;
        _this.editionId = 0;
        return _this;
    }
    BuyEditionComponent.prototype.ngOnInit = function () {
        var _this = this;
        var tenantId = parseInt(this._activatedRoute.snapshot.queryParams['tenantId']);
        abp.multiTenancy.setTenantIdCookie(tenantId);
        this.editionPaymentType = this._activatedRoute.snapshot.queryParams['editionPaymentType'];
        this.editionId = this._activatedRoute.snapshot.queryParams['editionId'];
        this._tenantRegistrationService.getEdition(this.editionId)
            .subscribe(function (result) {
            _this.edition = result;
        });
        this._paymentAppService.getActiveGateways(undefined)
            .subscribe(function (result) {
            _this.paymentGateways = result;
            _this.supportsRecurringPayments = result.some(function (pg) { return pg.supportsRecurringPayments; });
        });
    };
    BuyEditionComponent.prototype.checkout = function (gatewayType) {
        var _this = this;
        var input = {};
        input.editionId = this.editionId;
        input.editionPaymentType = (this.editionPaymentType);
        input.paymentPeriodType = (this.selectedPaymentPeriodType);
        input.recurringPaymentEnabled = this.recurringPaymentEnabled;
        input.subscriptionPaymentGatewayType = gatewayType;
        input.successUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/' + this._paymnetHelperService.getEditionPaymentType(this.editionPaymentType) + 'Succeed';
        input.errorUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/PaymentFailed';
        this._paymentAppService.createPayment(input)
            .subscribe(function (paymentId) {
            _this._router.navigate(['account/' + _this.getPaymentGatewayType(gatewayType).toLocaleLowerCase() + '-purchase'], {
                queryParams: {
                    paymentId: paymentId,
                    redirectUrl: 'account/register-tenant-result'
                }
            });
        });
    };
    BuyEditionComponent.prototype.getPaymentGatewayType = function (gatewayType) {
        return this._paymnetHelperService.getPaymentGatewayType(gatewayType);
    };
    BuyEditionComponent.prototype.onPaymentPeriodChangeChange = function (selectedPaymentPeriodType) {
        this.selectedPaymentPeriodType = selectedPaymentPeriodType;
    };
    BuyEditionComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./buy.component.html */ "./src/account/payment/buy.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__["PaymentHelperService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["TenantRegistrationServiceProxy"]])
    ], BuyEditionComponent);
    return BuyEditionComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/extend.component.html":
/*!***************************************************!*\
  !*** ./src/account/payment/extend.component.html ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__head\">\r\n        <h3 class=\"m-login__title\">\r\n            {{\"PaymentInfo\" | localize}}\r\n        </h3>\r\n    </div>\r\n\r\n    <form class=\"register-form\" method=\"post\" asp-action=\"PaymentResult\" id=\"formPaymentResult\">\r\n        <div class=\"text-center\">{{\"Extend_Edition_Description\" | localize:edition.displayName}}</div>\r\n\r\n        <div class=\"form-group\">\r\n            <label class=\"m-radio\">\r\n                <input class=\"form-control\" type=\"radio\" name=\"PaymentPeriodType\"\r\n                       checked\r\n                       [value]=\"paymentPeriodType.Monthly\"\r\n                       (change)=\"onPaymentPeriodChangeChange(paymentPeriodType.Monthly)\" />{{\"MonthlyPrice\" | localize}}: {{appSession.application.currencySign}}{{edition.monthlyPrice | number : '1.2-2'}}\r\n                <span></span>\r\n            </label>\r\n        </div>\r\n\r\n        <div class=\"form-group\">\r\n            <label class=\"m-radio\">\r\n                <input class=\"form-control\" type=\"radio\" name=\"PaymentPeriodType\"\r\n                       [value]=\"paymentPeriodType.Annual\"\r\n                       (change)=\"onPaymentPeriodChangeChange(paymentPeriodType.Annual)\" />{{\"AnnualPrice\" | localize}}: {{appSession.application.currencySign}}{{edition.annualPrice | number : '1.2-2'}}\r\n                <span></span>\r\n            </label>\r\n        </div>\r\n\r\n        <div *ngFor=\"let paymentGateway of paymentGateways\" class=\"form-group\">\r\n            <button (click)=\"checkout(paymentGateway.gatewayType)\" class=\"btn btn-success btn-block\">{{\"CheckoutWith\" + getPaymentGatewayType(paymentGateway.gatewayType) | localize}}</button>\r\n        </div>\r\n    </form>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/extend.component.ts":
/*!*************************************************!*\
  !*** ./src/account/payment/extend.component.ts ***!
  \*************************************************/
/*! exports provided: ExtendEditionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ExtendEditionComponent", function() { return ExtendEditionComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./payment-helper.service */ "./src/account/payment/payment-helper.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var ExtendEditionComponent = /** @class */ (function (_super) {
    __extends(ExtendEditionComponent, _super);
    function ExtendEditionComponent(injector, _router, _paymnetHelperService, _activatedRoute, _paymentAppService) {
        var _this = _super.call(this, injector) || this;
        _this._router = _router;
        _this._paymnetHelperService = _paymnetHelperService;
        _this._activatedRoute = _activatedRoute;
        _this._paymentAppService = _paymentAppService;
        _this.edition = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionSelectDto"]();
        _this.tenantId = abp.session.tenantId;
        _this.paymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentPeriodType"];
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionPaymentGatewayType"];
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentPeriodType"].Monthly;
        _this.editionPaymentTypeCheck = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionPaymentType"];
        return _this;
    }
    ExtendEditionComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.editionPaymentType = parseInt(this._activatedRoute.snapshot.queryParams['editionPaymentType']);
        this._paymentAppService.getPaymentInfo(undefined)
            .subscribe(function (result) {
            _this.edition = result.edition;
            _this.additionalPrice = Number(result.additionalPrice.toFixed(2));
        });
        this._paymentAppService.getActiveGateways(undefined)
            .subscribe(function (result) {
            _this.paymentGateways = result;
        });
    };
    ExtendEditionComponent.prototype.checkout = function (gatewayType) {
        var _this = this;
        var input = {};
        input.editionId = this.edition.id;
        input.editionPaymentType = (this.editionPaymentType);
        input.paymentPeriodType = (this.selectedPaymentPeriodType);
        input.recurringPaymentEnabled = false;
        input.subscriptionPaymentGatewayType = gatewayType;
        input.successUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/' + this._paymnetHelperService.getEditionPaymentType(this.editionPaymentType) + 'Succeed';
        input.errorUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/PaymentFailed';
        this._paymentAppService.createPayment(input)
            .subscribe(function (paymentId) {
            _this._router.navigate(['account/' + _this.getPaymentGatewayType(gatewayType).toLocaleLowerCase() + '-purchase'], {
                queryParams: {
                    paymentId: paymentId,
                    redirectUrl: 'app/admin/subscription-management'
                }
            });
        });
    };
    ExtendEditionComponent.prototype.getPaymentGatewayType = function (gatewayType) {
        return this._paymnetHelperService.getPaymentGatewayType(gatewayType);
    };
    ExtendEditionComponent.prototype.onPaymentPeriodChangeChange = function (selectedPaymentPeriodType) {
        this.selectedPaymentPeriodType = selectedPaymentPeriodType;
    };
    ExtendEditionComponent.prototype.isUpgrade = function () {
        return this.additionalPrice > 0;
    };
    ExtendEditionComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./extend.component.html */ "./src/account/payment/extend.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__["PaymentHelperService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentServiceProxy"]])
    ], ExtendEditionComponent);
    return ExtendEditionComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/payment-helper.service.ts":
/*!*******************************************************!*\
  !*** ./src/account/payment/payment-helper.service.ts ***!
  \*******************************************************/
/*! exports provided: PaymentHelperService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PaymentHelperService", function() { return PaymentHelperService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var PaymentHelperService = /** @class */ (function () {
    function PaymentHelperService() {
    }
    PaymentHelperService.prototype.getPaymentGatewayType = function (gatewayType) {
        if (parseInt(gatewayType) === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_1__["SubscriptionPaymentGatewayType"].Paypal) {
            return 'Paypal';
        }
        return 'Stripe';
    };
    PaymentHelperService.prototype.getEditionPaymentType = function (editionPaymentType) {
        if (parseInt(editionPaymentType) === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_1__["EditionPaymentType"].BuyNow) {
            return 'BuyNow';
        }
        else if (parseInt(editionPaymentType) === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_1__["EditionPaymentType"].Extend) {
            return 'Extend';
        }
        else if (parseInt(editionPaymentType) === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_1__["EditionPaymentType"].NewRegistration) {
            return 'NewRegistration';
        }
        return 'Upgrade';
    };
    PaymentHelperService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])()
    ], PaymentHelperService);
    return PaymentHelperService;
}());



/***/ }),

/***/ "./src/account/payment/paypal/paypal-purchase.component.html":
/*!*******************************************************************!*\
  !*** ./src/account/payment/paypal/paypal-purchase.component.html ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <hr class=\"border-green\" />\r\n    <div class=\"form-actions\">\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Item\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\">\r\n                    {{description}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Price\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\" id=\"totalPrice\">\r\n                    {{appSession.application.currencySign}}{{totalAmount | number : '1.2-2'}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div *ngIf=\"config && config.demoUsername && config.demoPassword\" class=\"m-alert m-alert--icon m-alert--icon-solid m-alert--outline alert alert-brand alert-dismissible fade show\" role=\"alert\">\r\n        <div class=\"m-alert__icon\">\r\n            <i class=\"flaticon-exclamation\"></i>\r\n            <span></span>\r\n        </div>\r\n        <div class=\"m-alert__text\">\r\n            <h4>\r\n                {{l(\"DemoPayPalAccount\")}}\r\n            </h4>\r\n            <p>\r\n                <span>{{l(\"UserName\")}}: <strong>{{config.demoUsername}}</strong></span><br />\r\n                <span>{{l(\"Password\")}}: <strong>{{config.demoPassword}}</strong></span>\r\n            </p>\r\n        </div>\r\n    </div>\r\n\r\n    <div id=\"paypal-button\"></div>\r\n    <div [busyIf]=\"paypalIsLoading\" *ngIf=\"paypalIsLoading\"></div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/paypal/paypal-purchase.component.ts":
/*!*****************************************************************!*\
  !*** ./src/account/payment/paypal/paypal-purchase.component.ts ***!
  \*****************************************************************/
/*! exports provided: PayPalPurchaseComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PayPalPurchaseComponent", function() { return PayPalPurchaseComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/utils/script-loader.service */ "./src/shared/utils/script-loader.service.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/helpers/XmlHttpRequestHelper */ "./src/shared/helpers/XmlHttpRequestHelper.ts");
/* harmony import */ var _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @account/register/tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var PayPalPurchaseComponent = /** @class */ (function (_super) {
    __extends(PayPalPurchaseComponent, _super);
    function PayPalPurchaseComponent(injector, _activatedRoute, _payPalPaymentAppService, _paymentAppService, _router, _tenantRegistrationHelper) {
        var _this = _super.call(this, injector) || this;
        _this.injector = injector;
        _this._activatedRoute = _activatedRoute;
        _this._payPalPaymentAppService = _payPalPaymentAppService;
        _this._paymentAppService = _paymentAppService;
        _this._router = _router;
        _this._tenantRegistrationHelper = _tenantRegistrationHelper;
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentPeriodType"].Monthly;
        _this.paypalIsLoading = true;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["SubscriptionPaymentGatewayType"];
        _this.totalAmount = 0;
        _this.description = '';
        return _this;
    }
    PayPalPurchaseComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.paymentId = this._activatedRoute.snapshot.queryParams['paymentId'];
        this.redirectUrl = this._activatedRoute.snapshot.queryParams['redirectUrl'];
        new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__["ScriptLoaderService"]().load('https://www.paypalobjects.com/api/checkout.js').then(function () {
            _this._paymentAppService.getPaymentAsync(_this.paymentId)
                .subscribe(function (result) {
                _this.description = result.description;
                _this.totalAmount = result.amount;
                _this.successCallbackUrl = result.successUrl;
                _this.errorCallbackUrl = result.errorUrl;
                _this.subscriptionPaymentGateway = (result.gateway);
                _this._payPalPaymentAppService.getConfiguration()
                    .subscribe(function (config) {
                    _this.config = config;
                    _this.paypalIsLoading = false;
                    _this.preparePaypalButton();
                });
            });
        });
    };
    PayPalPurchaseComponent.prototype.preparePaypalButton = function () {
        var self = this;
        window.paypal.Button.render({
            style: { size: 'responsive' },
            env: self.config.environment,
            client: {
                sandbox: self.config.clientId,
                production: ''
            },
            commit: true,
            payment: function (data, actions) {
                return actions.payment.create({
                    transactions: [{
                            amount: {
                                total: self.totalAmount,
                                currency: self.appSession.application.currency
                            }
                        }]
                });
            },
            onAuthorize: function (data) {
                var _this = this;
                self._payPalPaymentAppService.confirmPayment(self.paymentId, data.paymentID, data.payerID)
                    .subscribe(function () {
                    _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__["XmlHttpRequestHelper"].ajax('post', self.successCallbackUrl + (self.successCallbackUrl.includes('?') ? '&' : '?') + 'paymentId=' + self.paymentId, null, null, function (result) {
                        _this._tenantRegistrationHelper.registrationResult.isActive = true;
                        self._router.navigate([self.redirectUrl]);
                    });
                });
            },
            onCancel: function (data) {
                var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["CancelPaymentDto"]();
                input.gateway = self.subscriptionPaymentGateway.Paypal;
                input.paymentId = data.paymentID;
                self._payPalPaymentAppService.cancelPayment(input).toPromise();
            }
        }, '#paypal-button');
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], PayPalPurchaseComponent.prototype, "selectedPaymentPeriodType", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], PayPalPurchaseComponent.prototype, "editionPaymentType", void 0);
    PayPalPurchaseComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'paypal-purchase-component',
            template: __webpack_require__(/*! ./paypal-purchase.component.html */ "./src/account/payment/paypal/paypal-purchase.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PayPalPaymentServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__["TenantRegistrationHelperService"]])
    ], PayPalPurchaseComponent);
    return PayPalPurchaseComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/stripe/stripe-purchase.component.html":
/*!*******************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-purchase.component.html ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <hr class=\"border-green\" />\r\n    <div class=\"form-actions\">\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Item\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\">\r\n                    {{description}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Price\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\" id=\"totalPrice\">\r\n                    {{appSession.application.currencySign}}{{amount | number : '1.2-2'}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <button id=\"stripe-checkout\" class=\"stripe-checkout-button btn btn-primary btn-block\">{{'Purchase' | localize}}</button>\r\n    <div [busyIf]=\"stripeIsLoading\" *ngIf=\"stripeIsLoading\"></div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/stripe/stripe-purchase.component.ts":
/*!*****************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-purchase.component.ts ***!
  \*****************************************************************/
/*! exports provided: StripePurchaseComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StripePurchaseComponent", function() { return StripePurchaseComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/utils/script-loader.service */ "./src/shared/utils/script-loader.service.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/helpers/XmlHttpRequestHelper */ "./src/shared/helpers/XmlHttpRequestHelper.ts");
/* harmony import */ var _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @account/register/tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var StripePurchaseComponent = /** @class */ (function (_super) {
    __extends(StripePurchaseComponent, _super);
    function StripePurchaseComponent(injector, _activatedRoute, _stripePaymentAppService, _paymentAppService, _router, _tenantRegistrationHelper) {
        var _this = _super.call(this, injector) || this;
        _this._activatedRoute = _activatedRoute;
        _this._stripePaymentAppService = _stripePaymentAppService;
        _this._paymentAppService = _paymentAppService;
        _this._router = _router;
        _this._tenantRegistrationHelper = _tenantRegistrationHelper;
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentPeriodType"].Monthly;
        _this.amount = 0;
        _this.description = '';
        _this.stripeIsLoading = true;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["SubscriptionPaymentGatewayType"];
        _this.subscriptionStartType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["SubscriptionStartType"];
        _this.redirectUrl = '';
        return _this;
    }
    StripePurchaseComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.paymentId = this._activatedRoute.snapshot.queryParams['paymentId'];
        this.redirectUrl = this._activatedRoute.snapshot.queryParams['redirectUrl'];
        var isUpgrade = this._activatedRoute.snapshot.queryParams['isUpgrade'];
        new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__["ScriptLoaderService"]().load('https://checkout.stripe.com/checkout.js').then(function () {
            _this._paymentAppService.getPaymentAsync(_this.paymentId)
                .subscribe(function (result) {
                _this.amount = result.amount;
                _this.description = result.description;
                _this.successCallbackUrl = result.successUrl;
                _this.errorCallbackUrl = result.errorUrl;
                if (!result.isRecurring) {
                    _this._stripePaymentAppService.getConfiguration()
                        .subscribe(function (config) {
                        _this.prepareStripeButton(config.publishableKey);
                        _this.stripeIsLoading = false;
                    });
                }
                else {
                    var route = isUpgrade ? 'account/stripe-update-subscription' : 'account/stripe-subscribe';
                    _this._router.navigate([route], {
                        queryParams: {
                            paymentId: _this.paymentId,
                            redirectUrl: _this.redirectUrl
                        }
                    });
                }
            });
        });
    };
    StripePurchaseComponent.prototype.prepareStripeButton = function (stripeKey) {
        var _this = this;
        var handler = StripeCheckout.configure({
            key: stripeKey,
            locale: 'auto',
            currency: this.appSession.application.currency,
            token: function (token) {
                abp.ui.setBusy();
                var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["StripeConfirmPaymentInput"]();
                input.paymentId = _this.paymentId;
                input.stripeToken = token.id;
                _this._stripePaymentAppService.confirmPayment(input).subscribe(function () {
                    _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__["XmlHttpRequestHelper"].ajax('POST', _this.successCallbackUrl + (_this.successCallbackUrl.indexOf('?') >= 0 ? '&' : '?') + 'paymentId=' + _this.paymentId, null, null, function (result) {
                        _this._tenantRegistrationHelper.registrationResult.isActive = true;
                        abp.ui.clearBusy();
                        _this._router.navigate([_this.redirectUrl]);
                    });
                });
            }
        });
        document.getElementById('stripe-checkout').addEventListener('click', function (e) {
            handler.open({
                name: 'Drima',
                description: _this.description,
                amount: _this.amount * 100
            });
            e.preventDefault();
        });
        window.addEventListener('popstate', function () {
            handler.close();
        });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], StripePurchaseComponent.prototype, "selectedPaymentPeriodType", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], StripePurchaseComponent.prototype, "editionPaymentType", void 0);
    StripePurchaseComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'stripe-purchase-component',
            template: __webpack_require__(/*! ./stripe-purchase.component.html */ "./src/account/payment/stripe/stripe-purchase.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["StripePaymentServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__["TenantRegistrationHelperService"]])
    ], StripePurchaseComponent);
    return StripePurchaseComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/stripe/stripe-subscribe.component.html":
/*!********************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-subscribe.component.html ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <hr class=\"border-green\" />\r\n    <div class=\"form-actions\">\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Item\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\">\r\n                    {{description}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"amount\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\" id=\"totalPrice\">\r\n                    {{appSession.application.currencySign}}{{amount | number : '1.2-2'}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <button id=\"stripe-checkout\" class=\"stripe-checkout-button btn btn-primary btn-block\">{{'Purchase' | localize}}</button>\r\n    <div [busyIf]=\"stripeIsLoading\" *ngIf=\"stripeIsLoading\"></div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/stripe/stripe-subscribe.component.ts":
/*!******************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-subscribe.component.ts ***!
  \******************************************************************/
/*! exports provided: StripeSubscribeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StripeSubscribeComponent", function() { return StripeSubscribeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/utils/script-loader.service */ "./src/shared/utils/script-loader.service.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/helpers/XmlHttpRequestHelper */ "./src/shared/helpers/XmlHttpRequestHelper.ts");
/* harmony import */ var _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @account/register/tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};








var StripeSubscribeComponent = /** @class */ (function (_super) {
    __extends(StripeSubscribeComponent, _super);
    function StripeSubscribeComponent(injector, _activatedRoute, _stripePaymentAppService, _paymentAppService, _router, _tenantRegistrationHelper) {
        var _this = _super.call(this, injector) || this;
        _this._activatedRoute = _activatedRoute;
        _this._stripePaymentAppService = _stripePaymentAppService;
        _this._paymentAppService = _paymentAppService;
        _this._router = _router;
        _this._tenantRegistrationHelper = _tenantRegistrationHelper;
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentPeriodType"].Monthly;
        _this.amount = 0;
        _this.description = '';
        _this.stripeIsLoading = true;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["SubscriptionPaymentGatewayType"];
        _this.subscriptionStartType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["SubscriptionStartType"];
        _this.redirectUrl = '';
        return _this;
    }
    StripeSubscribeComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.paymentId = this._activatedRoute.snapshot.queryParams['paymentId'];
        this.redirectUrl = this._activatedRoute.snapshot.queryParams['redirectUrl'];
        new _shared_utils_script_loader_service__WEBPACK_IMPORTED_MODULE_3__["ScriptLoaderService"]().load('https://checkout.stripe.com/checkout.js').then(function () {
            _this._paymentAppService.getPaymentAsync(_this.paymentId)
                .subscribe(function (result) {
                _this.amount = result.amount;
                _this.description = result.description;
                _this.successCallbackUrl = result.successUrl;
                _this.errorCallbackUrl = result.errorUrl;
                _this._stripePaymentAppService.getConfiguration()
                    .subscribe(function (config) {
                    _this.prepareStripeButton(config.publishableKey);
                    _this.stripeIsLoading = false;
                });
            });
        });
    };
    StripeSubscribeComponent.prototype.prepareStripeButton = function (stripeKey) {
        var _this = this;
        var handler = StripeCheckout.configure({
            key: stripeKey,
            locale: 'auto',
            currency: this.appSession.application.currency,
            token: function (token) {
                abp.ui.setBusy();
                var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["StripeCreateSubscriptionInput"]();
                input.paymentId = _this.paymentId;
                input.stripeToken = token.id;
                _this._stripePaymentAppService.createSubscription(input).subscribe(function () {
                    _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_5__["XmlHttpRequestHelper"].ajax('POST', _this.successCallbackUrl + (_this.successCallbackUrl.indexOf('?') >= 0 ? '&' : '?') + 'paymentId=' + _this.paymentId, null, null, function (result) {
                        _this._tenantRegistrationHelper.registrationResult.isActive = true;
                        abp.ui.clearBusy();
                        _this._router.navigate([_this.redirectUrl]);
                    });
                });
            }
        });
        document.getElementById('stripe-checkout').addEventListener('click', function (e) {
            handler.open({
                name: 'Drima',
                description: _this.description,
                amount: _this.amount * 100
            });
            e.preventDefault();
        });
        window.addEventListener('popstate', function () {
            handler.close();
        });
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], StripeSubscribeComponent.prototype, "selectedPaymentPeriodType", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Input"])(),
        __metadata("design:type", Number)
    ], StripeSubscribeComponent.prototype, "editionPaymentType", void 0);
    StripeSubscribeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'stripe-subscribe-component',
            template: __webpack_require__(/*! ./stripe-subscribe.component.html */ "./src/account/payment/stripe/stripe-subscribe.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_4__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["StripePaymentServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_7__["PaymentServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _account_register_tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__["TenantRegistrationHelperService"]])
    ], StripeSubscribeComponent);
    return StripeSubscribeComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/stripe/stripe-update-subscription.component.html":
/*!******************************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-update-subscription.component.html ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <hr class=\"border-green\" />\r\n    <div class=\"form-actions\">\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-4 control-label\">{{l(\"Item\")}}</label>\r\n            <div class=\"col-sm-8 text-right\">\r\n                <p class=\"form-control-static text-bold\">\r\n                    {{description}}\r\n                </p>\r\n            </div>\r\n        </div>\r\n        <div class=\"form-group row\">\r\n            <label class=\"col-sm-12 control-label\">{{\"RecurringSubscriptionUpgradeNote\" | localize}}</label>\r\n        </div>\r\n    </div>\r\n\r\n    <button class=\"btn btn-primary btn-block\" (click)=\"upgradeSubscription()\">{{'Purchase' | localize}}</button>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/stripe/stripe-update-subscription.component.ts":
/*!****************************************************************************!*\
  !*** ./src/account/payment/stripe/stripe-update-subscription.component.ts ***!
  \****************************************************************************/
/*! exports provided: StripeUpdateSubscriptionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StripeUpdateSubscriptionComponent", function() { return StripeUpdateSubscriptionComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/helpers/XmlHttpRequestHelper */ "./src/shared/helpers/XmlHttpRequestHelper.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var StripeUpdateSubscriptionComponent = /** @class */ (function (_super) {
    __extends(StripeUpdateSubscriptionComponent, _super);
    function StripeUpdateSubscriptionComponent(injector, _activatedRoute, _stripePaymentAppService, _paymentAppService, _router) {
        var _this = _super.call(this, injector) || this;
        _this._activatedRoute = _activatedRoute;
        _this._stripePaymentAppService = _stripePaymentAppService;
        _this._paymentAppService = _paymentAppService;
        _this._router = _router;
        _this.description = '';
        _this.redirectUrl = '';
        return _this;
    }
    StripeUpdateSubscriptionComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.paymentId = this._activatedRoute.snapshot.queryParams['paymentId'];
        this.redirectUrl = this._activatedRoute.snapshot.queryParams['redirectUrl'];
        this._paymentAppService.getPaymentAsync(this.paymentId)
            .subscribe(function (result) {
            _this.description = result.description;
            _this.successCallbackUrl = result.successUrl;
            _this.errorCallbackUrl = result.errorUrl;
        });
    };
    StripeUpdateSubscriptionComponent.prototype.upgradeSubscription = function () {
        var _this = this;
        abp.ui.setBusy();
        var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["StripeUpdateSubscriptionInput"]();
        input.paymentId = this.paymentId;
        this._stripePaymentAppService.updateSubscription(input).subscribe(function () {
            _shared_helpers_XmlHttpRequestHelper__WEBPACK_IMPORTED_MODULE_4__["XmlHttpRequestHelper"].ajax('POST', _this.successCallbackUrl + (_this.successCallbackUrl.indexOf('?') >= 0 ? '&' : '?') + 'paymentId=' + _this.paymentId, null, null, function (result) {
                abp.ui.clearBusy();
                _this._router.navigate([_this.redirectUrl]);
            });
        });
    };
    StripeUpdateSubscriptionComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'stripe-update-subscirption-component',
            template: __webpack_require__(/*! ./stripe-update-subscription.component.html */ "./src/account/payment/stripe/stripe-update-subscription.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["StripePaymentServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PaymentServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], StripeUpdateSubscriptionComponent);
    return StripeUpdateSubscriptionComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_2__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/payment/upgrade.component.html":
/*!****************************************************!*\
  !*** ./src/account/payment/upgrade.component.html ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__head\">\r\n        <h3 class=\"m-login__title\">\r\n            {{\"PaymentInfo\" | localize}}\r\n        </h3>\r\n    </div>\r\n\r\n    <form class=\"register-form\" method=\"post\" asp-action=\"PaymentResult\" id=\"formPaymentResult\">\r\n        <div class=\"text-center m--margin-bottom-20\">{{\"Upgrade_Edition_Description\" | localize:edition.displayName}}</div>\r\n\r\n        <hr />\r\n\r\n        <div class=\"form-actions\" *ngIf=\"hasRecurringSubscription()\">\r\n            <div class=\"form-group row\">\r\n                <label class=\"col-sm-12 control-label\">{{\"RecurringSubscriptionUpgradeNote\" | localize}}</label>\r\n            </div>\r\n        </div>\r\n\r\n        <div class=\"form-actions\" *ngIf=\"!hasRecurringSubscription()\">\r\n            <div class=\"form-group row\">\r\n                <label class=\"col-sm-8 control-label\">{{\"Total\" | localize}}</label>\r\n                <div class=\"col-sm-4 text-right\">\r\n                    <p class=\"m--font-bold\" id=\"totalPrice\">\r\n                        {{appSession.application.currencySign}}{{additionalPrice | number : '1.2-2'}}\r\n                    </p>\r\n                </div>\r\n            </div>\r\n        </div>\r\n\r\n        <div *ngFor=\"let paymentGateway of paymentGateways\" class=\"form-group\">\r\n            <button (click)=\"checkout(paymentGateway.gatewayType)\" class=\"btn btn-success btn-block\">{{\"CheckoutWith\" + getPaymentGatewayType(paymentGateway.gatewayType) | localize}}</button>\r\n        </div>\r\n    </form>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/payment/upgrade.component.ts":
/*!**************************************************!*\
  !*** ./src/account/payment/upgrade.component.ts ***!
  \**************************************************/
/*! exports provided: UpgradeEditionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "UpgradeEditionComponent", function() { return UpgradeEditionComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./payment-helper.service */ "./src/account/payment/payment-helper.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var UpgradeEditionComponent = /** @class */ (function (_super) {
    __extends(UpgradeEditionComponent, _super);
    function UpgradeEditionComponent(injector, _router, _paymnetHelperService, _activatedRoute, _paymentAppService) {
        var _this = _super.call(this, injector) || this;
        _this._router = _router;
        _this._paymnetHelperService = _paymnetHelperService;
        _this._activatedRoute = _activatedRoute;
        _this._paymentAppService = _paymentAppService;
        _this.subscriptionPaymentType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionPaymentType"];
        _this.subscriptionStartType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionStartType"];
        _this.edition = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionSelectDto"]();
        _this.tenantId = abp.session.tenantId;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionPaymentGatewayType"];
        _this.editionPaymentTypeCheck = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionPaymentType"];
        return _this;
    }
    UpgradeEditionComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.editionPaymentType = parseInt(this._activatedRoute.snapshot.queryParams['editionPaymentType']);
        this.upgradeEditionId = this._activatedRoute.snapshot.queryParams['upgradeEditionId'];
        if (this.appSession.tenant.edition.isFree) {
            this._router.navigate(['account/buy'], {
                queryParams: {
                    tenantId: this.appSession.tenant.id,
                    editionPaymentType: this.editionPaymentType,
                    editionId: this.upgradeEditionId,
                    subscriptionStartType: this.subscriptionStartType.Paid
                }
            });
        }
        this._paymentAppService.getPaymentInfo(this.upgradeEditionId)
            .subscribe(function (result) {
            _this.edition = result.edition;
            _this.additionalPrice = Number(result.additionalPrice.toFixed(2));
        });
        this._paymentAppService.getLastCompletedPayment().subscribe(function (result) {
            var gateway = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentGatewayModel"]();
            gateway.gatewayType = result.gateway;
            gateway.supportsRecurringPayments = true;
            _this.paymentGateways = [gateway];
            _this.paymentPeriodType = result.paymentPeriodType;
            if (_this.appSession.tenant.subscriptionPaymentType === _this.subscriptionPaymentType.Manual) {
                _this._paymentAppService.getActiveGateways(undefined)
                    .subscribe(function (result) {
                    _this.paymentGateways = result;
                });
            }
        });
    };
    UpgradeEditionComponent.prototype.checkout = function (gatewayType) {
        var _this = this;
        var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["CreatePaymentDto"]();
        input.editionId = this.edition.id;
        input.editionPaymentType = (this.editionPaymentType);
        input.paymentPeriodType = (this.paymentPeriodType);
        input.recurringPaymentEnabled = this.hasRecurringSubscription();
        input.subscriptionPaymentGatewayType = gatewayType;
        input.successUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/' + this._paymnetHelperService.getEditionPaymentType(this.editionPaymentType) + 'Succeed';
        input.errorUrl = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_5__["AppConsts"].remoteServiceBaseUrl + '/api/services/app/payment/PaymentFailed';
        this._paymentAppService.createPayment(input)
            .subscribe(function (paymentId) {
            _this._router.navigate(['account/' + _this.getPaymentGatewayType(gatewayType).toLocaleLowerCase() + '-purchase'], {
                queryParams: {
                    paymentId: paymentId,
                    isUpgrade: true,
                    redirectUrl: 'app/admin/subscription-management'
                }
            });
        });
    };
    UpgradeEditionComponent.prototype.getPaymentGatewayType = function (gatewayType) {
        return this._paymnetHelperService.getPaymentGatewayType(gatewayType);
    };
    UpgradeEditionComponent.prototype.hasRecurringSubscription = function () {
        return this.appSession.tenant.subscriptionPaymentType !== this.subscriptionPaymentType.Manual;
    };
    UpgradeEditionComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./upgrade.component.html */ "./src/account/payment/upgrade.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _payment_helper_service__WEBPACK_IMPORTED_MODULE_6__["PaymentHelperService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["PaymentServiceProxy"]])
    ], UpgradeEditionComponent);
    return UpgradeEditionComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/register/pricing.min.css":
/*!**********************************************!*\
  !*** ./src/account/register/pricing.min.css ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/* Cubic Bezier Transition */\r\n/***\r\nPricing Table 1\r\n***/\r\n.pricing-content-1 {\r\n    background-color: #fff;\r\n}\r\n.pricing-content-1:before, .pricing-content-1:after {\r\n        content: \" \";\r\n        display: table;\r\n    }\r\n.pricing-content-1:after {\r\n        clear: both;\r\n    }\r\n.pricing-content-1 .arrow-down {\r\n        width: 0;\r\n        height: 0;\r\n        border-left: 15px solid transparent;\r\n        border-right: 15px solid transparent;\r\n        border-top: 15px solid;\r\n        margin: auto;\r\n    }\r\n.pricing-content-1 .arrow-down.arrow-blue {\r\n            border-top-color: #3598DC;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-green {\r\n            border-top-color: #32C5D2;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-dark {\r\n            border-top-color: #2F353B;\r\n        }\r\n.pricing-content-1 .arrow-down.arrow-grey {\r\n            border-top-color: #f7f9fb;\r\n        }\r\n.pricing-content-1 .price-ribbon {\r\n        position: absolute;\r\n        top: 75px;\r\n        right: -4px;\r\n        width: 90px;\r\n        font-size: 14px;\r\n        text-transform: uppercase;\r\n        font-weight: 300;\r\n        padding: 6px 20px 6px 15px;\r\n        color: #fff;\r\n        background-color: #D91E18;\r\n        text-shadow: 0px 1px 2px #bbb;\r\n        box-shadow: 0px 2px 4px #888;\r\n    }\r\n.pricing-content-1 .price-ribbon:after {\r\n            content: ' ';\r\n            position: absolute;\r\n            width: 0;\r\n            height: 0;\r\n            right: 0px;\r\n            top: 100%;\r\n            border-width: 5px 10px;\r\n            border-style: solid;\r\n            border-color: #64120f transparent transparent #64120f;\r\n        }\r\n.pricing-content-1 .pricing-title {\r\n        border-bottom: 1px solid;\r\n        border-color: #fff;\r\n    }\r\n.pricing-content-1 .pricing-title > h1 {\r\n            margin: 20px 0;\r\n        }\r\n.pricing-content-1 .price-column-container {\r\n        text-align: center;\r\n        margin: 0;\r\n        background-color: #fff;\r\n    }\r\n.pricing-content-1 .price-column-container.border-active {\r\n            border: 1px solid #e5e9ee;\r\n        }\r\n.pricing-content-1 .price-column-container:first-child {\r\n            margin-left: 0;\r\n        }\r\n.pricing-content-1 .price-column-container:last-child {\r\n            margin-right: 0;\r\n        }\r\n.pricing-content-1 .price-table-head {\r\n        color: #fff;\r\n        padding: 20px 0;\r\n    }\r\n.pricing-content-1 .price-table-head h2 {\r\n            font-size: 26px;\r\n        }\r\n.pricing-content-1 .price-table-head.price-1 {\r\n            background-color: #3598DC;\r\n        }\r\n.pricing-content-1 .price-table-head.price-2 {\r\n            background-color: #32C5D2;\r\n        }\r\n.pricing-content-1 .price-table-head.price-3 {\r\n            background-color: #2F353B;\r\n        }\r\n.pricing-content-1 .price-table-pricing > h3 {\r\n        font-size: 60px;\r\n        position: relative;\r\n    }\r\n.pricing-content-1 .price-table-pricing > h3 > .price-sign {\r\n            font-size: 24px;\r\n            position: absolute;\r\n            margin-left: -15px;\r\n        }\r\n.pricing-content-1 .price-table-pricing > p {\r\n        margin-top: 0;\r\n    }\r\n.pricing-content-1 .price-table-content {\r\n        background-color: #f7f9fb;\r\n        color: #5c6d7e;\r\n        font-weight: 600;\r\n        font-size: 16px;\r\n    }\r\n.pricing-content-1 .price-table-content .row {\r\n            padding-top: 10px;\r\n            padding-bottom: 10px;\r\n        }\r\n.pricing-content-1 .price-table-content .row i {\r\n                color: #6cade6;\r\n            }\r\n.pricing-content-1 .price-table-content .row:first-child {\r\n                padding-top: 20px;\r\n            }\r\n.pricing-content-1 .price-table-content .row:last-child {\r\n                padding-bottom: 20px;\r\n            }\r\n.pricing-content-1 .price-table-footer {\r\n        padding: 20px 0;\r\n    }\r\n.pricing-content-1 .price-table-footer > .price-button {\r\n            font-weight: bold;\r\n            padding: 10px 20px;\r\n        }\r\n@media (max-width: 1024px) {\r\n    .pricing-content-1 .mobile-padding {\r\n        padding: 0;\r\n        margin: 0;\r\n    }\r\n\r\n        .pricing-content-1 .mobile-padding > i {\r\n            margin-right: 5px;\r\n        }\r\n\r\n    .pricing-content-1 .price-table-content {\r\n        padding-left: 10px;\r\n        padding-right: 10px;\r\n    }\r\n}\r\n@media (max-width: 1024px) {\r\n    .pricing-content-1 .mobile-padding {\r\n        padding: 0 15px;\r\n        margin: 0 -15px;\r\n    }\r\n\r\n        .pricing-content-1 .mobile-padding > i {\r\n            margin-right: 20px;\r\n        }\r\n\r\n    .pricing-content-1 .price-table-content {\r\n        padding-left: 15px;\r\n        padding-right: 15px;\r\n    }\r\n}\r\n/***\r\nPricing Table 2\r\n***/\r\n.pricing-content-2 {\r\n    background-color: #fff;\r\n}\r\n.pricing-content-2 .no-padding {\r\n        padding: 0;\r\n    }\r\n.pricing-content-2 .text-left {\r\n        text-align: left;\r\n    }\r\n.pricing-content-2 .text-right {\r\n        text-align: right;\r\n    }\r\n.pricing-content-2.pricing-bg-dark {\r\n        background-color: #2F353B;\r\n    }\r\n.pricing-content-2 .pricing-title {\r\n        border-color: #444;\r\n    }\r\n.pricing-content-2 .pricing-title > h1 {\r\n            color: #fff;\r\n        }\r\n.pricing-content-2 .pricing-table-container {\r\n        padding-top: 40px;\r\n        padding-bottom: 40px;\r\n    }\r\n.pricing-content-2 .pricing-table-container .padding-fix {\r\n            padding-left: 15px;\r\n            padding-right: 15px;\r\n        }\r\n.pricing-content-2 .pricing-table-container .price-column-container {\r\n            background-color: #fff;\r\n            margin: 30px 0;\r\n            padding: 60px 0;\r\n            text-align: center;\r\n            border-bottom: 4px solid #ccc;\r\n        }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-right {\r\n                border-right: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-left {\r\n                border-left: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.border-top {\r\n                border-top: 1px solid #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.featured-price {\r\n                margin: 0;\r\n                padding: 89px 0;\r\n                border: 1px solid;\r\n                border-bottom: 4px solid;\r\n                border-color: #ccc;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container.featured-price > .price-feature-label {\r\n                    position: absolute;\r\n                    top: 0;\r\n                    left: 50%;\r\n                    display: inline-block;\r\n                    width: 110px;\r\n                    margin: 0 0 0 -60px;\r\n                    padding: 7px 15px;\r\n                    color: #fff;\r\n                    font-weight: 300;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-head > h2 {\r\n                letter-spacing: 1px;\r\n                font-weight: 600;\r\n                font-size: 18px;\r\n                color: #ACB5C3;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-head > h2.opt-pricing-5 {\r\n                    padding: 7px 15px;\r\n                    display: inline;\r\n                    margin: 0 auto 20px auto;\r\n                    font-size: 16px;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > h3 {\r\n                font-size: 60px;\r\n                position: relative;\r\n                font-weight: 600;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > h3 > .price-sign {\r\n                    font-size: 24px;\r\n                    position: absolute;\r\n                    margin-left: -15px;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-pricing > p {\r\n                margin-top: 0;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content {\r\n                color: #333;\r\n                font-weight: 300;\r\n                font-size: 16px;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content .row {\r\n                    padding-top: 20px;\r\n                    padding-bottom: 20px;\r\n                    border-bottom: 1px solid;\r\n                    border-color: #eee;\r\n                }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-content .row:first-child {\r\n                        border-top: 1px solid;\r\n                        border-color: #eee;\r\n                    }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-footer {\r\n                padding: 40px 0 0 0;\r\n            }\r\n.pricing-content-2 .pricing-table-container .price-column-container > .price-table-footer > .featured-price {\r\n                    font-size: 20px;\r\n                    font-weight: 300;\r\n                    border-bottom: 3px solid #3FABA4;\r\n                }\r\n@media (max-width: 991px) {\r\n    .pricing-content-2 .price-column-container {\r\n        border-left: 1px solid;\r\n        border-right: 1px solid;\r\n        border-color: #ccc;\r\n    }\r\n}\r\n\r\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L3JlZ2lzdGVyL3ByaWNpbmcubWluLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0QkFBNEI7QUFDNUI7O0dBRUc7QUFDSDtJQUNJLHNCQUFzQjtBQUMxQjtBQUVJO1FBQ0ksWUFBWTtRQUNaLGNBQWM7SUFDbEI7QUFFQTtRQUNJLFdBQVc7SUFDZjtBQUVBO1FBQ0ksUUFBUTtRQUNSLFNBQVM7UUFDVCxtQ0FBbUM7UUFDbkMsb0NBQW9DO1FBQ3BDLHNCQUFzQjtRQUN0QixZQUFZO0lBQ2hCO0FBRUk7WUFDSSx5QkFBeUI7UUFDN0I7QUFFQTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVBO1lBQ0kseUJBQXlCO1FBQzdCO0FBRUE7WUFDSSx5QkFBeUI7UUFDN0I7QUFFSjtRQUNJLGtCQUFrQjtRQUNsQixTQUFTO1FBQ1QsV0FBVztRQUNYLFdBQVc7UUFDWCxlQUFlO1FBQ2YseUJBQXlCO1FBQ3pCLGdCQUFnQjtRQUNoQiwwQkFBMEI7UUFDMUIsV0FBVztRQUNYLHlCQUF5QjtRQUN6Qiw2QkFBNkI7UUFHN0IsNEJBQTRCO0lBQ2hDO0FBRUk7WUFDSSxZQUFZO1lBQ1osa0JBQWtCO1lBQ2xCLFFBQVE7WUFDUixTQUFTO1lBQ1QsVUFBVTtZQUNWLFNBQVM7WUFDVCxzQkFBc0I7WUFDdEIsbUJBQW1CO1lBQ25CLHFEQUFxRDtRQUN6RDtBQUVKO1FBQ0ksd0JBQXdCO1FBQ3hCLGtCQUFrQjtJQUN0QjtBQUVJO1lBQ0ksY0FBYztRQUNsQjtBQUVKO1FBQ0ksa0JBQWtCO1FBQ2xCLFNBQVM7UUFDVCxzQkFBc0I7SUFDMUI7QUFFSTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVBO1lBQ0ksY0FBYztRQUNsQjtBQUVBO1lBQ0ksZUFBZTtRQUNuQjtBQUVKO1FBQ0ksV0FBVztRQUNYLGVBQWU7SUFDbkI7QUFFSTtZQUNJLGVBQWU7UUFDbkI7QUFFQTtZQUNJLHlCQUF5QjtRQUM3QjtBQUVBO1lBQ0kseUJBQXlCO1FBQzdCO0FBRUE7WUFDSSx5QkFBeUI7UUFDN0I7QUFFSjtRQUNJLGVBQWU7UUFDZixrQkFBa0I7SUFDdEI7QUFFSTtZQUNJLGVBQWU7WUFDZixrQkFBa0I7WUFDbEIsa0JBQWtCO1FBQ3RCO0FBRUo7UUFDSSxhQUFhO0lBQ2pCO0FBRUE7UUFDSSx5QkFBeUI7UUFDekIsY0FBYztRQUNkLGdCQUFnQjtRQUNoQixlQUFlO0lBQ25CO0FBRUk7WUFDSSxpQkFBaUI7WUFDakIsb0JBQW9CO1FBQ3hCO0FBRUk7Z0JBQ0ksY0FBYztZQUNsQjtBQUVBO2dCQUNJLGlCQUFpQjtZQUNyQjtBQUVBO2dCQUNJLG9CQUFvQjtZQUN4QjtBQUVSO1FBQ0ksZUFBZTtJQUNuQjtBQUVJO1lBQ0ksaUJBQWlCO1lBQ2pCLGtCQUFrQjtRQUN0QjtBQUVSO0lBQ0k7UUFDSSxVQUFVO1FBQ1YsU0FBUztJQUNiOztRQUVJO1lBQ0ksaUJBQWlCO1FBQ3JCOztJQUVKO1FBQ0ksa0JBQWtCO1FBQ2xCLG1CQUFtQjtJQUN2QjtBQUNKO0FBRUE7SUFDSTtRQUNJLGVBQWU7UUFDZixlQUFlO0lBQ25COztRQUVJO1lBQ0ksa0JBQWtCO1FBQ3RCOztJQUVKO1FBQ0ksa0JBQWtCO1FBQ2xCLG1CQUFtQjtJQUN2QjtBQUNKO0FBRUE7O0dBRUc7QUFDSDtJQUNJLHNCQUFzQjtBQUMxQjtBQUVJO1FBQ0ksVUFBVTtJQUNkO0FBRUE7UUFDSSxnQkFBZ0I7SUFDcEI7QUFFQTtRQUNJLGlCQUFpQjtJQUNyQjtBQUVBO1FBQ0kseUJBQXlCO0lBQzdCO0FBRUE7UUFDSSxrQkFBa0I7SUFDdEI7QUFFSTtZQUNJLFdBQVc7UUFDZjtBQUVKO1FBQ0ksaUJBQWlCO1FBQ2pCLG9CQUFvQjtJQUN4QjtBQUVJO1lBQ0ksa0JBQWtCO1lBQ2xCLG1CQUFtQjtRQUN2QjtBQUVBO1lBQ0ksc0JBQXNCO1lBQ3RCLGNBQWM7WUFDZCxlQUFlO1lBQ2Ysa0JBQWtCO1lBQ2xCLDZCQUE2QjtRQUNqQztBQUVJO2dCQUNJLDRCQUE0QjtZQUNoQztBQUVBO2dCQUNJLDJCQUEyQjtZQUMvQjtBQUVBO2dCQUNJLDBCQUEwQjtZQUM5QjtBQUVBO2dCQUNJLFNBQVM7Z0JBQ1QsZUFBZTtnQkFDZixpQkFBaUI7Z0JBQ2pCLHdCQUF3QjtnQkFDeEIsa0JBQWtCO1lBQ3RCO0FBRUk7b0JBQ0ksa0JBQWtCO29CQUNsQixNQUFNO29CQUNOLFNBQVM7b0JBQ1QscUJBQXFCO29CQUNyQixZQUFZO29CQUNaLG1CQUFtQjtvQkFDbkIsaUJBQWlCO29CQUNqQixXQUFXO29CQUNYLGdCQUFnQjtnQkFDcEI7QUFFSjtnQkFDSSxtQkFBbUI7Z0JBQ25CLGdCQUFnQjtnQkFDaEIsZUFBZTtnQkFDZixjQUFjO1lBQ2xCO0FBRUk7b0JBQ0ksaUJBQWlCO29CQUNqQixlQUFlO29CQUNmLHdCQUF3QjtvQkFDeEIsZUFBZTtnQkFDbkI7QUFFSjtnQkFDSSxlQUFlO2dCQUNmLGtCQUFrQjtnQkFDbEIsZ0JBQWdCO1lBQ3BCO0FBRUk7b0JBQ0ksZUFBZTtvQkFDZixrQkFBa0I7b0JBQ2xCLGtCQUFrQjtnQkFDdEI7QUFFSjtnQkFDSSxhQUFhO1lBQ2pCO0FBRUE7Z0JBQ0ksV0FBVztnQkFDWCxnQkFBZ0I7Z0JBQ2hCLGVBQWU7WUFDbkI7QUFFSTtvQkFDSSxpQkFBaUI7b0JBQ2pCLG9CQUFvQjtvQkFDcEIsd0JBQXdCO29CQUN4QixrQkFBa0I7Z0JBQ3RCO0FBRUk7d0JBQ0kscUJBQXFCO3dCQUNyQixrQkFBa0I7b0JBQ3RCO0FBRVI7Z0JBQ0ksbUJBQW1CO1lBQ3ZCO0FBRUk7b0JBQ0ksZUFBZTtvQkFDZixnQkFBZ0I7b0JBQ2hCLGdDQUFnQztnQkFDcEM7QUFFaEI7SUFDSTtRQUNJLHNCQUFzQjtRQUN0Qix1QkFBdUI7UUFDdkIsa0JBQWtCO0lBQ3RCO0FBQ0oiLCJmaWxlIjoic3JjL2FjY291bnQvcmVnaXN0ZXIvcHJpY2luZy5taW4uY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQ3ViaWMgQmV6aWVyIFRyYW5zaXRpb24gKi9cclxuLyoqKlxyXG5QcmljaW5nIFRhYmxlIDFcclxuKioqL1xyXG4ucHJpY2luZy1jb250ZW50LTEge1xyXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcclxufVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMTpiZWZvcmUsIC5wcmljaW5nLWNvbnRlbnQtMTphZnRlciB7XHJcbiAgICAgICAgY29udGVudDogXCIgXCI7XHJcbiAgICAgICAgZGlzcGxheTogdGFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xOmFmdGVyIHtcclxuICAgICAgICBjbGVhcjogYm90aDtcclxuICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLmFycm93LWRvd24ge1xyXG4gICAgICAgIHdpZHRoOiAwO1xyXG4gICAgICAgIGhlaWdodDogMDtcclxuICAgICAgICBib3JkZXItbGVmdDogMTVweCBzb2xpZCB0cmFuc3BhcmVudDtcclxuICAgICAgICBib3JkZXItcmlnaHQ6IDE1cHggc29saWQgdHJhbnNwYXJlbnQ7XHJcbiAgICAgICAgYm9yZGVyLXRvcDogMTVweCBzb2xpZDtcclxuICAgICAgICBtYXJnaW46IGF1dG87XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAuYXJyb3ctZG93bi5hcnJvdy1ibHVlIHtcclxuICAgICAgICAgICAgYm9yZGVyLXRvcC1jb2xvcjogIzM1OThEQztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAuYXJyb3ctZG93bi5hcnJvdy1ncmVlbiB7XHJcbiAgICAgICAgICAgIGJvcmRlci10b3AtY29sb3I6ICMzMkM1RDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLmFycm93LWRvd24uYXJyb3ctZGFyayB7XHJcbiAgICAgICAgICAgIGJvcmRlci10b3AtY29sb3I6ICMyRjM1M0I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLmFycm93LWRvd24uYXJyb3ctZ3JleSB7XHJcbiAgICAgICAgICAgIGJvcmRlci10b3AtY29sb3I6ICNmN2Y5ZmI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtcmliYm9uIHtcclxuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgdG9wOiA3NXB4O1xyXG4gICAgICAgIHJpZ2h0OiAtNHB4O1xyXG4gICAgICAgIHdpZHRoOiA5MHB4O1xyXG4gICAgICAgIGZvbnQtc2l6ZTogMTRweDtcclxuICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gICAgICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgICAgICAgcGFkZGluZzogNnB4IDIwcHggNnB4IDE1cHg7XHJcbiAgICAgICAgY29sb3I6ICNmZmY7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0Q5MUUxODtcclxuICAgICAgICB0ZXh0LXNoYWRvdzogMHB4IDFweCAycHggI2JiYjtcclxuICAgICAgICAtd2Via2l0LWJveC1zaGFkb3c6IDBweCAycHggNHB4ICM4ODg7XHJcbiAgICAgICAgLW1vei1ib3gtc2hhZG93OiAwcHggMnB4IDRweCAjODg4O1xyXG4gICAgICAgIGJveC1zaGFkb3c6IDBweCAycHggNHB4ICM4ODg7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtcmliYm9uOmFmdGVyIHtcclxuICAgICAgICAgICAgY29udGVudDogJyAnO1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgIHdpZHRoOiAwO1xyXG4gICAgICAgICAgICBoZWlnaHQ6IDA7XHJcbiAgICAgICAgICAgIHJpZ2h0OiAwcHg7XHJcbiAgICAgICAgICAgIHRvcDogMTAwJTtcclxuICAgICAgICAgICAgYm9yZGVyLXdpZHRoOiA1cHggMTBweDtcclxuICAgICAgICAgICAgYm9yZGVyLXN0eWxlOiBzb2xpZDtcclxuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjNjQxMjBmIHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICM2NDEyMGY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2luZy10aXRsZSB7XHJcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkO1xyXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljaW5nLXRpdGxlID4gaDEge1xyXG4gICAgICAgICAgICBtYXJnaW46IDIwcHggMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS1jb2x1bW4tY29udGFpbmVyIHtcclxuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICAgICAgbWFyZ2luOiAwO1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5ib3JkZXItYWN0aXZlIHtcclxuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2U1ZTllZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtY29sdW1uLWNvbnRhaW5lcjpmaXJzdC1jaGlsZCB7XHJcbiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS1jb2x1bW4tY29udGFpbmVyOmxhc3QtY2hpbGQge1xyXG4gICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtaGVhZCB7XHJcbiAgICAgICAgY29sb3I6ICNmZmY7XHJcbiAgICAgICAgcGFkZGluZzogMjBweCAwO1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWhlYWQgaDIge1xyXG4gICAgICAgICAgICBmb250LXNpemU6IDI2cHg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWhlYWQucHJpY2UtMSB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzNTk4REM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWhlYWQucHJpY2UtMiB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzMkM1RDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWhlYWQucHJpY2UtMyB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyRjM1M0I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtcHJpY2luZyA+IGgzIHtcclxuICAgICAgICBmb250LXNpemU6IDYwcHg7XHJcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLXByaWNpbmcgPiBoMyA+IC5wcmljZS1zaWduIHtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAyNHB4O1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAtMTVweDtcclxuICAgICAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1wcmljaW5nID4gcCB7XHJcbiAgICAgICAgbWFyZ2luLXRvcDogMDtcclxuICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQge1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmN2Y5ZmI7XHJcbiAgICAgICAgY29sb3I6ICM1YzZkN2U7XHJcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgICAgICBmb250LXNpemU6IDE2cHg7XHJcbiAgICB9XHJcblxyXG4gICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtY29udGVudCAucm93IHtcclxuICAgICAgICAgICAgcGFkZGluZy10b3A6IDEwcHg7XHJcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAxMHB4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtY29udGVudCAucm93IGkge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICM2Y2FkZTY7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtY29udGVudCAucm93OmZpcnN0LWNoaWxkIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmctdG9wOiAyMHB4O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTEgLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdzpsYXN0LWNoaWxkIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAyMHB4O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1mb290ZXIge1xyXG4gICAgICAgIHBhZGRpbmc6IDIwcHggMDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1mb290ZXIgPiAucHJpY2UtYnV0dG9uIHtcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XHJcbiAgICAgICAgICAgIHBhZGRpbmc6IDEwcHggMjBweDtcclxuICAgICAgICB9XHJcblxyXG5AbWVkaWEgKG1heC13aWR0aDogMTAyNHB4KSB7XHJcbiAgICAucHJpY2luZy1jb250ZW50LTEgLm1vYmlsZS1wYWRkaW5nIHtcclxuICAgICAgICBwYWRkaW5nOiAwO1xyXG4gICAgICAgIG1hcmdpbjogMDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5tb2JpbGUtcGFkZGluZyA+IGkge1xyXG4gICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDVweDtcclxuICAgICAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5wcmljZS10YWJsZS1jb250ZW50IHtcclxuICAgICAgICBwYWRkaW5nLWxlZnQ6IDEwcHg7XHJcbiAgICAgICAgcGFkZGluZy1yaWdodDogMTBweDtcclxuICAgIH1cclxufVxyXG5cclxuQG1lZGlhIChtYXgtd2lkdGg6IDEwMjRweCkge1xyXG4gICAgLnByaWNpbmctY29udGVudC0xIC5tb2JpbGUtcGFkZGluZyB7XHJcbiAgICAgICAgcGFkZGluZzogMCAxNXB4O1xyXG4gICAgICAgIG1hcmdpbjogMCAtMTVweDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0xIC5tb2JpbGUtcGFkZGluZyA+IGkge1xyXG4gICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDIwcHg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMSAucHJpY2UtdGFibGUtY29udGVudCB7XHJcbiAgICAgICAgcGFkZGluZy1sZWZ0OiAxNXB4O1xyXG4gICAgICAgIHBhZGRpbmctcmlnaHQ6IDE1cHg7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKipcclxuUHJpY2luZyBUYWJsZSAyXHJcbioqKi9cclxuLnByaWNpbmctY29udGVudC0yIHtcclxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XHJcbn1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTIgLm5vLXBhZGRpbmcge1xyXG4gICAgICAgIHBhZGRpbmc6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0yIC50ZXh0LWxlZnQge1xyXG4gICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLnByaWNpbmctY29udGVudC0yIC50ZXh0LXJpZ2h0IHtcclxuICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcclxuICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTIucHJpY2luZy1iZy1kYXJrIHtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMkYzNTNCO1xyXG4gICAgfVxyXG5cclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10aXRsZSB7XHJcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjNDQ0O1xyXG4gICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGl0bGUgPiBoMSB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIHtcclxuICAgICAgICBwYWRkaW5nLXRvcDogNDBweDtcclxuICAgICAgICBwYWRkaW5nLWJvdHRvbTogNDBweDtcclxuICAgIH1cclxuXHJcbiAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucGFkZGluZy1maXgge1xyXG4gICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDE1cHg7XHJcbiAgICAgICAgICAgIHBhZGRpbmctcmlnaHQ6IDE1cHg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcclxuICAgICAgICAgICAgbWFyZ2luOiAzMHB4IDA7XHJcbiAgICAgICAgICAgIHBhZGRpbmc6IDYwcHggMDtcclxuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiA0cHggc29saWQgI2NjYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyLmJvcmRlci1yaWdodCB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjY2NjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyLmJvcmRlci1sZWZ0IHtcclxuICAgICAgICAgICAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI2NjYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5ib3JkZXItdG9wIHtcclxuICAgICAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjY2NjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyLmZlYXR1cmVkLXByaWNlIHtcclxuICAgICAgICAgICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDg5cHggMDtcclxuICAgICAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkO1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogNHB4IHNvbGlkO1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjY2NjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lci5mZWF0dXJlZC1wcmljZSA+IC5wcmljZS1mZWF0dXJlLWxhYmVsIHtcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDUwJTtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDExMHB4O1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMCAwIDAgLTYwcHg7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogN3B4IDE1cHg7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNmZmY7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDMwMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtaGVhZCA+IGgyIHtcclxuICAgICAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAxcHg7XHJcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxOHB4O1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICNBQ0I1QzM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWhlYWQgPiBoMi5vcHQtcHJpY2luZy01IHtcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiA3cHggMTVweDtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmU7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwIGF1dG8gMjBweCBhdXRvO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtcHJpY2luZyA+IGgzIHtcclxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogNjBweDtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLXByaWNpbmcgPiBoMyA+IC5wcmljZS1zaWduIHtcclxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDI0cHg7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAtMTVweDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtcHJpY2luZyA+IHAge1xyXG4gICAgICAgICAgICAgICAgbWFyZ2luLXRvcDogMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLnByaWNpbmctY29udGVudC0yIC5wcmljaW5nLXRhYmxlLWNvbnRhaW5lciAucHJpY2UtY29sdW1uLWNvbnRhaW5lciA+IC5wcmljZS10YWJsZS1jb250ZW50IHtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAjMzMzO1xyXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDMwMDtcclxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtY29udGVudCAucm93IHtcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nLXRvcDogMjBweDtcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogMjBweDtcclxuICAgICAgICAgICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjZWVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWNvbnRlbnQgLnJvdzpmaXJzdC1jaGlsZCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjZWVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2luZy10YWJsZS1jb250YWluZXIgLnByaWNlLWNvbHVtbi1jb250YWluZXIgPiAucHJpY2UtdGFibGUtZm9vdGVyIHtcclxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDQwcHggMCAwIDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAucHJpY2luZy1jb250ZW50LTIgLnByaWNpbmctdGFibGUtY29udGFpbmVyIC5wcmljZS1jb2x1bW4tY29udGFpbmVyID4gLnByaWNlLXRhYmxlLWZvb3RlciA+IC5mZWF0dXJlZC1wcmljZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAyMHB4O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICMzRkFCQTQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5AbWVkaWEgKG1heC13aWR0aDogOTkxcHgpIHtcclxuICAgIC5wcmljaW5nLWNvbnRlbnQtMiAucHJpY2UtY29sdW1uLWNvbnRhaW5lciB7XHJcbiAgICAgICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZDtcclxuICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZDtcclxuICAgICAgICBib3JkZXItY29sb3I6ICNjY2M7XHJcbiAgICB9XHJcbn1cclxuIl19 */"

/***/ }),

/***/ "./src/account/register/register-tenant-result.component.html":
/*!********************************************************************!*\
  !*** ./src/account/register/register-tenant-result.component.html ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <h4>{{\"SuccessfullyRegistered\" | localize}}</h4>\r\n    <ul>\r\n        <li><span class=\"text-muted\">{{\"TenancyName\" | localize}}:</span> {{model.tenancyName}}</li>\r\n        <li><span class=\"text-muted\">{{\"TenantName\" | localize}}:</span> {{model.name}}</li>\r\n        <li><span class=\"text-muted\">{{\"UserName\" | localize}}:</span> {{model.userName}}</li>\r\n        <li><span class=\"text-muted\">{{\"EmailAddress\" | localize}}:</span> {{model.emailAddress}}</li>\r\n    </ul>\r\n    <div>\r\n        <div *ngIf=\"model.isEmailConfirmationRequired\" class=\"alert alert-warning\" role=\"alert\">\r\n            {{\"ConfirmationMailSentPleaseClickLinkInTheEmail\" | localize:model.emailAddress}}\r\n        </div>\r\n        <div *ngIf=\"!model.isActive\" class=\"alert alert-warning\" role=\"alert\">\r\n            {{\"YourAccountIsWaitingToBeActivatedByAdmin\" | localize}}\r\n        </div>\r\n        <div *ngIf=\"tenantUrl\" class=\"alert alert-info\" role=\"alert\">\r\n            {{\"TenantRegistrationLoginInfo\" | localize}}<br />\r\n            <a href=\"{{tenantUrl}}\">{{tenantUrl}}</a>\r\n        </div>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/register/register-tenant-result.component.ts":
/*!******************************************************************!*\
  !*** ./src/account/register/register-tenant-result.component.ts ***!
  \******************************************************************/
/*! exports provided: RegisterTenantResultComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RegisterTenantResultComponent", function() { return RegisterTenantResultComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/nav/app-url.service */ "./src/shared/common/nav/app-url.service.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var RegisterTenantResultComponent = /** @class */ (function (_super) {
    __extends(RegisterTenantResultComponent, _super);
    function RegisterTenantResultComponent(injector, _router, _appUrlService, _tenantRegistrationHelper) {
        var _this = _super.call(this, injector) || this;
        _this._router = _router;
        _this._appUrlService = _appUrlService;
        _this._tenantRegistrationHelper = _tenantRegistrationHelper;
        _this.model = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["RegisterTenantOutput"]();
        _this.saving = false;
        return _this;
    }
    RegisterTenantResultComponent.prototype.ngOnInit = function () {
        if (!this._tenantRegistrationHelper.registrationResult) {
            this._router.navigate(['account/login']);
            return;
        }
        this.model = this._tenantRegistrationHelper.registrationResult;
        abp.multiTenancy.setTenantIdCookie(this.model.tenantId);
        this.tenantUrl = this._appUrlService.getAppRootUrlOfTenant(this.model.tenancyName);
    };
    RegisterTenantResultComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./register-tenant-result.component.html */ "./src/account/register/register-tenant-result.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _shared_common_nav_app_url_service__WEBPACK_IMPORTED_MODULE_4__["AppUrlService"],
            _tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_6__["TenantRegistrationHelperService"]])
    ], RegisterTenantResultComponent);
    return RegisterTenantResultComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/register/register-tenant.component.html":
/*!*************************************************************!*\
  !*** ./src/account/register/register-tenant.component.html ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{\"TenantSignUp\" | localize}}\r\n            </h3>\r\n        </div>\r\n\r\n        <div *ngIf=\"model.edition\" class=\"hint text-center\">({{\"Edition\" | localize}}: {{model.edition.displayName}})</div>\r\n\r\n        <form #registerForm=\"ngForm\" role=\"form\" novalidate (submit)=\"save()\" class=\"m-login__form m-form register-form\">\r\n            <h4 class=\"m-login__title m--margin-top-20\">\r\n                {{\"TenantInformations\" | localize}}\r\n            </h4>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #tenancyName=\"ngModel\" class=\"form-control\" autoFocus type=\"text\" placeholder=\"{{'TenancyName' | localize}} *\" [(ngModel)]=\"model.tenancyName\" name=\"tenancyName\" required maxlength=\"64\" pattern=\"^[a-zA-Z][a-zA-Z0-9_-]{1,}$\" />\r\n                <div *ngIf=\"!tenancyName.valid && !tenancyName.pristine\">\r\n                    <span class=\"help-block text-danger\">{{\"TenantName_Regex_Description\" | localize}}</span>\r\n                </div>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #nameInput=\"ngModel\" class=\"form-control\" type=\"text\" placeholder=\"{{'TenantName' | localize}} *\" [(ngModel)]=\"model.name\" name=\"Name\" required maxlength=\"128\" />\r\n                <validation-messages [formCtrl]=\"nameInput\"></validation-messages>\r\n            </div>\r\n\r\n            <h4 class=\"m-login__title m--margin-top-20\">\r\n                {{\"AccountSettings\" | localize}}\r\n            </h4>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #adminEmailAddressInput=\"ngModel\" class=\"form-control\" type=\"email\" placeholder=\"{{'AdminEmailAddress' | localize}} *\" [(ngModel)]=\"model.adminEmailAddress\" name=\"adminEmailAddress\" required maxlength=\"256\" email />\r\n                <validation-messages [formCtrl]=\"adminEmailAddressInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"Password\" class=\"form-control\" [(ngModel)]=\"model.adminPassword\" #Password=\"ngModel\" placeholder=\"{{'AdminPassword' | localize}}\" validateEqual=\"PasswordRepeat\"\r\n                       reverse=\"true\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\"\r\n                       [requireUppercase]=\"passwordComplexitySetting.requireUppercase\" [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n            <div [hidden]=\"registerForm.form.valid || registerForm.form.pristine\" class=\"form-group m-form__group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"Password.errors\">\r\n                    <li [hidden]=\"!Password.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                </ul>\r\n            </div>\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"PasswordRepeat\" class=\"form-control\" [ngModel]=\"model.passwordRepeat\" #PasswordRepeat=\"ngModel\" placeholder=\"{{'PasswordRepeat' | localize}}\" validateEqual=\"Password\"\r\n                       reverse=\"false\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\" [requireUppercase]=\"passwordComplexitySetting.requireUppercase\"\r\n                       [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n\r\n            <div [hidden]=\"registerForm.form.valid || registerForm.form.pristine\" class=\"form-group m-form__group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"PasswordRepeat.errors\">\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                    <li [hidden]=\"PasswordRepeat.valid\">{{\"PasswordsDontMatch\" | localize}}</li>\r\n                </ul>\r\n            </div>\r\n            <h4 *ngIf=\"useCaptcha\" class=\"m-login__title m--margin-top-20\">\r\n                {{\"Captha_Hint\" | localize}}\r\n            </h4>\r\n\r\n            <div *ngIf=\"useCaptcha\" class=\"form-group m--margin-bottom-20\">\r\n                <re-captcha #recaptchaRef (resolved)=\"captchaResolved($event)\" [siteKey]=\"recaptchaSiteKey\"></re-captcha>\r\n            </div>\r\n\r\n            <div class=\"m-login__form-action\">\r\n                <button [disabled]=\"saving\" routerLink=\"/account/login\" type=\"button\" class=\"btn btn-outline-primary  m-btn m-btn--pill m-btn--custom\"><i class=\"fa fa-arrow-left\"></i> {{\"Back\" | localize}}</button>\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!registerForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-check\"></i> {{\"Submit\" | localize}}</button>\r\n            </div>\r\n        </form>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/register/register-tenant.component.ts":
/*!***********************************************************!*\
  !*** ./src/account/register/register-tenant.component.ts ***!
  \***********************************************************/
/*! exports provided: RegisterTenantComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RegisterTenantComponent", function() { return RegisterTenantComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _register_tenant_model__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./register-tenant.model */ "./src/account/register/register-tenant.model.ts");
/* harmony import */ var _tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./tenant-registration-helper.service */ "./src/account/register/tenant-registration-helper.service.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ng-recaptcha */ "./node_modules/ng-recaptcha/index.js");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};










var RegisterTenantComponent = /** @class */ (function (_super) {
    __extends(RegisterTenantComponent, _super);
    function RegisterTenantComponent(injector, _tenantRegistrationService, _router, _profileService, _tenantRegistrationHelper, _activatedRoute) {
        var _this = _super.call(this, injector) || this;
        _this._tenantRegistrationService = _tenantRegistrationService;
        _this._router = _router;
        _this._profileService = _profileService;
        _this._tenantRegistrationHelper = _tenantRegistrationHelper;
        _this._activatedRoute = _activatedRoute;
        _this.model = new _register_tenant_model__WEBPACK_IMPORTED_MODULE_6__["RegisterTenantModel"]();
        _this.passwordComplexitySetting = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PasswordComplexitySetting"]();
        _this.subscriptionStartType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["SubscriptionStartType"];
        _this.paymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PaymentPeriodType"];
        _this.selectedPaymentPeriodType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PaymentPeriodType"].Monthly;
        _this.subscriptionPaymentGateway = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["SubscriptionPaymentGatewayType"];
        _this.paymentId = '';
        _this.recaptchaSiteKey = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].recaptchaSiteKey;
        _this.saving = false;
        return _this;
    }
    RegisterTenantComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.model.editionId = this._activatedRoute.snapshot.queryParams['editionId'];
        this.editionPaymentType = this._activatedRoute.snapshot.queryParams['editionPaymentType'];
        if (this.model.editionId) {
            this.model.subscriptionStartType = this._activatedRoute.snapshot.queryParams['subscriptionStartType'];
        }
        //Prevent to create tenant in a tenant context
        if (this.appSession.tenant != null) {
            this._router.navigate(['account/login']);
            return;
        }
        this._profileService.getPasswordComplexitySetting().subscribe(function (result) {
            _this.passwordComplexitySetting = result.setting;
        });
    };
    RegisterTenantComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        if (this.model.editionId) {
            this._tenantRegistrationService.getEdition(this.model.editionId)
                .subscribe(function (result) {
                _this.model.edition = result;
            });
        }
    };
    Object.defineProperty(RegisterTenantComponent.prototype, "useCaptcha", {
        get: function () {
            return this.setting.getBoolean('App.TenantManagement.UseCaptchaOnRegistration');
        },
        enumerable: true,
        configurable: true
    });
    RegisterTenantComponent.prototype.save = function () {
        var _this = this;
        if (this.useCaptcha && !this.model.captchaResponse) {
            this.message.warn(this.l('CaptchaCanNotBeEmpty'));
            return;
        }
        this.saving = true;
        this._tenantRegistrationService.registerTenant(this.model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_8__["finalize"])(function () { _this.saving = false; }))
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_8__["catchError"])(function (err, caught) {
            _this.recaptchaRef.reset();
        }))
            .subscribe(function (result) {
            _this.notify.success(_this.l('SuccessfullyRegistered'));
            _this._tenantRegistrationHelper.registrationResult = result;
            if (parseInt(_this.model.subscriptionStartType.toString()) === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["SubscriptionStartType"].Paid) {
                _this._router.navigate(['account/buy'], {
                    queryParams: {
                        tenantId: result.tenantId,
                        editionId: _this.model.editionId,
                        subscriptionStartType: _this.model.subscriptionStartType,
                        editionPaymentType: _this.editionPaymentType
                    }
                });
            }
            else {
                _this._router.navigate(['account/register-tenant-result']);
            }
        });
    };
    RegisterTenantComponent.prototype.captchaResolved = function (captchaResponse) {
        this.model.captchaResponse = captchaResponse;
    };
    RegisterTenantComponent.prototype.onPaymentPeriodChangeChange = function (selectedPaymentPeriodType) {
        this.selectedPaymentPeriodType = selectedPaymentPeriodType;
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"])('recaptchaRef'),
        __metadata("design:type", ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__["RecaptchaComponent"])
    ], RegisterTenantComponent.prototype, "recaptchaRef", void 0);
    RegisterTenantComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./register-tenant.component.html */ "./src/account/register/register-tenant.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["TenantRegistrationServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["ProfileServiceProxy"],
            _tenant_registration_helper_service__WEBPACK_IMPORTED_MODULE_7__["TenantRegistrationHelperService"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["ActivatedRoute"]])
    ], RegisterTenantComponent);
    return RegisterTenantComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/register/register-tenant.model.ts":
/*!*******************************************************!*\
  !*** ./src/account/register/register-tenant.model.ts ***!
  \*******************************************************/
/*! exports provided: RegisterTenantModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RegisterTenantModel", function() { return RegisterTenantModel; });
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var RegisterTenantModel = /** @class */ (function (_super) {
    __extends(RegisterTenantModel, _super);
    function RegisterTenantModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RegisterTenantModel;
}(_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__["RegisterTenantInput"]));



/***/ }),

/***/ "./src/account/register/register.component.html":
/*!******************************************************!*\
  !*** ./src/account/register/register.component.html ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-login__signin\">\r\n        <div class=\"m-login__head\">\r\n            <h3 class=\"m-login__title\">\r\n                {{\"SignUp\" | localize}}\r\n            </h3>\r\n        </div>\r\n        <form #registerForm=\"ngForm\" class=\"m-login__form\" method=\"post\" novalidate (ngSubmit)=\"save()\">\r\n            <div class=\"form-group m-form__group\">\r\n                <input #nameInput=\"ngModel\" class=\"form-control\" autoFocus type=\"text\" placeholder=\"{{'Name' | localize}} *\" [(ngModel)]=\"model.name\" name=\"Name\" required maxlength=\"32\" />\r\n                <validation-messages [formCtrl]=\"nameInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #surnameInput=\"ngModel\" class=\"form-control\" type=\"text\" placeholder=\"{{'Surname' | localize}} *\" [(ngModel)]=\"model.surname\" name=\"Surname\" required maxlength=\"32\" />\r\n                <validation-messages [formCtrl]=\"surnameInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #emailAddressInput=\"ngModel\" class=\"form-control\" type=\"email\" placeholder=\"{{'EmailAddress' | localize}} *\" [(ngModel)]=\"model.emailAddress\" name=\"EmailAddress\" required maxlength=\"256\" pattern=\"^\\w+([-+.']\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$\" />\r\n                <validation-messages [formCtrl]=\"emailAddressInput\"></validation-messages>\r\n            </div>\r\n\r\n            <div class=\"form-group m-form__group\">\r\n                <input #userNameInput=\"ngModel\" class=\"form-control\" type=\"text\" autocomplete=\"off\" placeholder=\"{{'UserName' | localize}} *\" name=\"UserName\" [(ngModel)]=\"model.userName\" required maxlength=\"32\" />\r\n                <validation-messages [formCtrl]=\"userNameInput\"></validation-messages>\r\n            </div>\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"Password\" class=\"form-control\" [(ngModel)]=\"model.password\" #Password=\"ngModel\" placeholder=\"{{'Password' | localize}}\" validateEqual=\"PasswordRepeat\"\r\n                       reverse=\"true\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\"\r\n                       [requireUppercase]=\"passwordComplexitySetting.requireUppercase\" [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n            <div [hidden]=\"registerForm.form.valid || registerForm.form.pristine\" class=\"form-group m-form__group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"Password.errors\">\r\n                    <li [hidden]=\"!Password.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!Password.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                </ul>\r\n            </div>\r\n            <div class=\"form-group m-form__group\">\r\n                <input type=\"password\" name=\"PasswordRepeat\" class=\"form-control\" [ngModel]=\"model.passwordRepeat\" #PasswordRepeat=\"ngModel\" placeholder=\"{{'PasswordRepeat' | localize}}\" validateEqual=\"Password\"\r\n                       reverse=\"false\" [requireDigit]=\"passwordComplexitySetting.requireDigit\" [requireLowercase]=\"passwordComplexitySetting.requireLowercase\"\r\n                       [requireUppercase]=\"passwordComplexitySetting.requireUppercase\" [requireNonAlphanumeric]=\"passwordComplexitySetting.requireNonAlphanumeric\" [requiredLength]=\"passwordComplexitySetting.requiredLength\"\r\n                       required>\r\n            </div>\r\n            <div [hidden]=\"registerForm.form.valid || registerForm.form.pristine\" class=\"form-group m-form__group\">\r\n                <ul class=\"help-block text-danger\" *ngIf=\"PasswordRepeat.errors\">\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireDigit\">{{\"PasswordComplexity_RequireDigit_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireLowercase\">{{\"PasswordComplexity_RequireLowercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireUppercase\">{{\"PasswordComplexity_RequireUppercase_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requireNonAlphanumeric\">{{\"PasswordComplexity_RequireNonAlphanumeric_Hint\" | localize}}</li>\r\n                    <li [hidden]=\"!PasswordRepeat.errors.requiredLength\">{{\"PasswordComplexity_RequiredLength_Hint\" | localize:passwordComplexitySetting.requiredLength}}</li>\r\n                    <li [hidden]=\"PasswordRepeat.valid\">{{\"PasswordsDontMatch\" | localize}}</li>\r\n                </ul>\r\n            </div>\r\n            <p *ngIf=\"useCaptcha\" class=\"hint margin-top-20\">\r\n                {{\"Captha_Hint\" | localize}}\r\n            </p>\r\n\r\n            <div *ngIf=\"useCaptcha\" class=\"form-group m--margin-bottom-20\">\r\n                <re-captcha #recaptchaRef (resolved)=\"captchaResolved($event)\" [siteKey]=\"recaptchaSiteKey\"></re-captcha>\r\n            </div>\r\n\r\n            <div class=\"m-login__form-action\">\r\n                <button [disabled]=\"saving\" routerLink=\"/account/login\" type=\"button\" class=\"btn btn-outline-primary  m-btn m-btn--pill m-btn--custom\"><i class=\"fa fa-arrow-left\"></i> {{\"Back\" | localize}}</button>\r\n                <button type=\"submit\" class=\"btn btn-primary m-btn m-btn--pill m-btn--custom m-btn--air\" [disabled]=\"!registerForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-check\"></i> {{\"Submit\" | localize}}</button>\r\n            </div>\r\n        </form>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/register/register.component.ts":
/*!****************************************************!*\
  !*** ./src/account/register/register.component.ts ***!
  \****************************************************/
/*! exports provided: RegisterComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RegisterComponent", function() { return RegisterComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/AppConsts */ "./src/shared/AppConsts.ts");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _login_login_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../login/login.service */ "./src/account/login/login.service.ts");
/* harmony import */ var _register_model__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./register.model */ "./src/account/register/register.model.ts");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ng-recaptcha */ "./node_modules/ng-recaptcha/index.js");
/* harmony import */ var ng_recaptcha__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};










var RegisterComponent = /** @class */ (function (_super) {
    __extends(RegisterComponent, _super);
    function RegisterComponent(injector, _accountService, _router, _loginService, _profileService) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this._router = _router;
        _this._loginService = _loginService;
        _this._profileService = _profileService;
        _this.model = new _register_model__WEBPACK_IMPORTED_MODULE_7__["RegisterModel"]();
        _this.passwordComplexitySetting = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["PasswordComplexitySetting"]();
        _this.recaptchaSiteKey = _shared_AppConsts__WEBPACK_IMPORTED_MODULE_2__["AppConsts"].recaptchaSiteKey;
        _this.saving = false;
        return _this;
    }
    RegisterComponent.prototype.ngOnInit = function () {
        var _this = this;
        //Prevent to register new users in the host context
        if (this.appSession.tenant == null) {
            this._router.navigate(['account/login']);
            return;
        }
        this._profileService.getPasswordComplexitySetting().subscribe(function (result) {
            _this.passwordComplexitySetting = result.setting;
        });
    };
    Object.defineProperty(RegisterComponent.prototype, "useCaptcha", {
        get: function () {
            return this.setting.getBoolean('App.UserManagement.UseCaptchaOnRegistration');
        },
        enumerable: true,
        configurable: true
    });
    RegisterComponent.prototype.save = function () {
        var _this = this;
        if (this.useCaptcha && !this.model.captchaResponse) {
            this.message.warn(this.l('CaptchaCanNotBeEmpty'));
            return;
        }
        this.saving = true;
        this._accountService.register(this.model)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_8__["finalize"])(function () { _this.saving = false; }))
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_8__["catchError"])(function (err, caught) {
            _this.recaptchaRef.reset();
        }))
            .subscribe(function (result) {
            if (!result.canLogin) {
                _this.notify.success(_this.l('SuccessfullyRegistered'));
                _this._router.navigate(['account/login']);
                return;
            }
            //Autheticate
            _this.saving = true;
            _this._loginService.authenticateModel.userNameOrEmailAddress = _this.model.userName;
            _this._loginService.authenticateModel.password = _this.model.password;
            _this._loginService.authenticate(function () { _this.saving = false; });
        });
    };
    RegisterComponent.prototype.captchaResolved = function (captchaResponse) {
        this.model.captchaResponse = captchaResponse;
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"])('recaptchaRef'),
        __metadata("design:type", ng_recaptcha__WEBPACK_IMPORTED_MODULE_9__["RecaptchaComponent"])
    ], RegisterComponent.prototype, "recaptchaRef", void 0);
    RegisterComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./register.component.html */ "./src/account/register/register.component.html"),
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_3__["accountModuleAnimation"])()]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["AccountServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"],
            _login_login_service__WEBPACK_IMPORTED_MODULE_6__["LoginService"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_5__["ProfileServiceProxy"]])
    ], RegisterComponent);
    return RegisterComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_4__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/register/register.model.ts":
/*!************************************************!*\
  !*** ./src/account/register/register.model.ts ***!
  \************************************************/
/*! exports provided: RegisterModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RegisterModel", function() { return RegisterModel; });
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var RegisterModel = /** @class */ (function (_super) {
    __extends(RegisterModel, _super);
    function RegisterModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RegisterModel;
}(_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_0__["RegisterInput"]));



/***/ }),

/***/ "./src/account/register/select-edition.component.html":
/*!************************************************************!*\
  !*** ./src/account/register/select-edition.component.html ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div [@routerTransition]>\r\n    <div class=\"m-pricing-table-1 m-pricing-table-1--fixed\">\r\n        <div class=\"m-portlet\">\r\n            <div class=\"m-portlet__body\">\r\n                <div class=\"m-pricing-table-1__items row row-centered\">\r\n                    <div class=\"m-pricing-table-1__item col-lg-3 col-centered\"\r\n                         *ngFor=\"let editionWithFeatures of editionsSelectOutput.editionsWithFeatures;  let i = index\">\r\n\r\n\r\n                        <div class=\"m-pricing-table-1__visual\">\r\n                            <div class=\"m-pricing-table-1__hexagon1\"></div>\r\n                            <div class=\"m-pricing-table-1__hexagon2\"></div>\r\n                            <span class=\"m-pricing-table-1__icon m--font-brand\">\r\n                                <i class=\"fa {{editionIcons[i]}}\"></i>\r\n                            </span>\r\n                        </div>\r\n\r\n\r\n                        <span class=\"m-pricing-table-1__price\">\r\n                            {{editionWithFeatures.edition.displayName}}\r\n                        </span>\r\n\r\n                        <h2 class=\"m-pricing-table-1__subtitle\" *ngIf=\"isFree(editionWithFeatures.edition)\">\r\n                            {{\"Free\" | localize}}\r\n                        </h2>\r\n\r\n                        <h2 class=\"m-pricing-table-1__subtitle\" *ngIf=\"!isFree(editionWithFeatures.edition)\">\r\n\r\n                            <span class=\"m-pricing-table-1__label\">{{appSession.application.currencySign}}</span> {{editionWithFeatures.edition.monthlyPrice}} {{\"PerMonth\" | localize}} /\r\n                            <span class=\"m-pricing-table-1__label\">{{appSession.application.currencySign}}</span>{{editionWithFeatures.edition.annualPrice}} {{\"PerYear\" | localize}}\r\n\r\n                        </h2>\r\n\r\n                        <span class=\"m-pricing-table-1__description\">\r\n\r\n                            <ng-container *ngFor=\"let feature of editionsSelectOutput.allFeatures\">\r\n                                <!--Checbox Feature-->\r\n                                <ng-container *ngIf=\"isTrueFalseFeature(feature)\">\r\n                                    <i class=\"la la-check m--font-success\" *ngIf=\"featureEnabledForEdition(feature,editionWithFeatures)\"></i>\r\n                                    <i class=\"la la-times m--font-metal\" *ngIf=\"!featureEnabledForEdition(feature,editionWithFeatures)\"></i>\r\n                                </ng-container>\r\n                                <ng-container *ngIf=\"isTrueFalseFeature(feature)\">{{feature.displayName}}</ng-container>\r\n                                <!--Checbox Feature-->\r\n                                <!--Not Checbox Feature-->\r\n                                <ng-container *ngIf=\"!isTrueFalseFeature(feature)\">\r\n                                    <i class=\"la la-check m--font-success\"></i>\r\n                                </ng-container>\r\n                                <ng-container *ngIf=\"!isTrueFalseFeature(feature)\">{{feature.displayName}}:{{getFeatureValueForEdition(feature,editionWithFeatures)}}</ng-container>\r\n                                <!--Not Checbox Feature-->\r\n                                <br />\r\n                            </ng-container>\r\n\r\n                        </span>\r\n\r\n                        <div class=\"m-pricing-table-1__btn\">\r\n\r\n                            <button class=\"btn btn-warning m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                    (click)=\"upgrade(editionWithFeatures.edition, editionPaymentType.Upgrade)\"\r\n                                    *ngIf=\"isUserLoggedIn\"\r\n                                    [disabled]=\"!canUpgrade(editionWithFeatures.edition)\">\r\n                                {{\"Upgrade\" | localize}}\r\n                            </button>\r\n\r\n                            <button class=\"btn btn-success m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                    [routerLink]=\"['/account/register-tenant']\"\r\n                                    [queryParams]=\"{editionId: editionWithFeatures.edition.id, subscriptionStartType: subscriptionStartType.Free}\"\r\n                                    href=\"#\"\r\n                                    *ngIf=\"!isUserLoggedIn && isFree(editionWithFeatures.edition)\">\r\n                                {{\"Start\" | localize}}\r\n                            </button>\r\n\r\n                            <button class=\"btn btn-warning m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                    [routerLink]=\"['/account/register-tenant']\"\r\n                                    [queryParams]=\"{editionId: editionWithFeatures.edition.id, subscriptionStartType: subscriptionStartType.Trial}\"\r\n                                    href=\"#\"\r\n                                    *ngIf=\"!isUserLoggedIn && !isFree(editionWithFeatures.edition) && editionWithFeatures.edition.trialDayCount\">\r\n                                {{\"FreeTrial\" | localize}}\r\n                            </button>\r\n\r\n                            <button class=\"btn btn-primary m-btn m-btn--custom m-btn--pill m-btn--wide m-btn--uppercase m-btn--bolder m-btn--sm\"\r\n                                    [routerLink]=\"['/account/register-tenant']\"\r\n                                    [queryParams]=\"{editionId: editionWithFeatures.edition.id, subscriptionStartType: subscriptionStartType.Paid, editionPaymentType: editionPaymentType.NewRegistration}\"\r\n                                    href=\"#\"\r\n                                    *ngIf=\"!isUserLoggedIn && !isFree(editionWithFeatures.edition)\">\r\n                                {{\"BuyNow\" | localize}}\r\n                            </button>\r\n\r\n                        </div>\r\n\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/register/select-edition.component.less":
/*!************************************************************!*\
  !*** ./src/account/register/select-edition.component.less ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/* centered columns styles */\n.row-centered {\n  text-align: center;\n  display: block !important;\n}\n.col-centered {\n  display: inline-table;\n  float: none;\n  /* reset the text-align */\n  text-align: left;\n  /* inline-block space fix */\n  margin-right: -4px;\n}\n.m-pricing-table-1__price,\n.m-pricing-table-1__subtitle,\n.m-pricing-table-1__btn {\n  text-align: center;\n}\nbody {\n  background-color: #f2f3f8;\n}\ndiv.m-content div.m-login__logo {\n  margin-bottom: 50px !important;\n}\n.m-pricing-table-1__item:nth-child(4n) {\n  border-right: none !important;\n}\n.m-pricing-table-1 .m-pricing-table-1__items .m-pricing-table-1__item .m-pricing-table-1__price {\n  font-size: 2rem !important;\n}\nbutton:disabled,\nbutton[disabled] {\n  cursor: not-allowed !important;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hY2NvdW50L3JlZ2lzdGVyL3NlbGVjdC1lZGl0aW9uLmNvbXBvbmVudC5sZXNzIiwic3JjL2FjY291bnQvcmVnaXN0ZXIvRDovRHJpbWEgQXNwTmV0WmVyby9hbmd1bGFyL3NyYy9hY2NvdW50L3JlZ2lzdGVyL3NlbGVjdC1lZGl0aW9uLmNvbXBvbmVudC5sZXNzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDRCQUE0QjtBQ0M1QjtFQUNJLGtCQUFBO0VBQ0EseUJBQUE7QURDSjtBQ0VBO0VBQ0kscUJBQUE7RUFDQSxXQUFBO0VEQUYseUJBQXlCO0VDRXZCLGdCQUFBO0VEQUYsMkJBQTJCO0VDRXpCLGtCQUFBO0FEQUo7QUNHQTs7O0VBQ0ksa0JBQUE7QURDSjtBQ0VBO0VBQ0kseUJBQUE7QURBSjtBQ0dBO0VBQ0ksOEJBQUE7QURESjtBQ0lBO0VBQ0ksNkJBQUE7QURGSjtBQ0tBO0VBQ0ksMEJBQUE7QURISjtBQ01BOztFQUVJLDhCQUFBO0FESkoiLCJmaWxlIjoic3JjL2FjY291bnQvcmVnaXN0ZXIvc2VsZWN0LWVkaXRpb24uY29tcG9uZW50Lmxlc3MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBjZW50ZXJlZCBjb2x1bW5zIHN0eWxlcyAqL1xuLnJvdy1jZW50ZXJlZCB7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDtcbn1cbi5jb2wtY2VudGVyZWQge1xuICBkaXNwbGF5OiBpbmxpbmUtdGFibGU7XG4gIGZsb2F0OiBub25lO1xuICAvKiByZXNldCB0aGUgdGV4dC1hbGlnbiAqL1xuICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAvKiBpbmxpbmUtYmxvY2sgc3BhY2UgZml4ICovXG4gIG1hcmdpbi1yaWdodDogLTRweDtcbn1cbi5tLXByaWNpbmctdGFibGUtMV9fcHJpY2UsXG4ubS1wcmljaW5nLXRhYmxlLTFfX3N1YnRpdGxlLFxuLm0tcHJpY2luZy10YWJsZS0xX19idG4ge1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5ib2R5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjNmODtcbn1cbmRpdi5tLWNvbnRlbnQgZGl2Lm0tbG9naW5fX2xvZ28ge1xuICBtYXJnaW4tYm90dG9tOiA1MHB4ICFpbXBvcnRhbnQ7XG59XG4ubS1wcmljaW5nLXRhYmxlLTFfX2l0ZW06bnRoLWNoaWxkKDRuKSB7XG4gIGJvcmRlci1yaWdodDogbm9uZSAhaW1wb3J0YW50O1xufVxuLm0tcHJpY2luZy10YWJsZS0xIC5tLXByaWNpbmctdGFibGUtMV9faXRlbXMgLm0tcHJpY2luZy10YWJsZS0xX19pdGVtIC5tLXByaWNpbmctdGFibGUtMV9fcHJpY2Uge1xuICBmb250LXNpemU6IDJyZW0gIWltcG9ydGFudDtcbn1cbmJ1dHRvbjpkaXNhYmxlZCxcbmJ1dHRvbltkaXNhYmxlZF0ge1xuICBjdXJzb3I6IG5vdC1hbGxvd2VkICFpbXBvcnRhbnQ7XG59XG4iLCIvKiBjZW50ZXJlZCBjb2x1bW5zIHN0eWxlcyAqL1xuLnJvdy1jZW50ZXJlZCB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIGRpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7XG59XG5cbi5jb2wtY2VudGVyZWQge1xuICAgIGRpc3BsYXk6IGlubGluZS10YWJsZTtcbiAgICBmbG9hdDogbm9uZTtcbiAgICAvKiByZXNldCB0aGUgdGV4dC1hbGlnbiAqL1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgLyogaW5saW5lLWJsb2NrIHNwYWNlIGZpeCAqL1xuICAgIG1hcmdpbi1yaWdodDogLTRweDtcbn1cblxuLm0tcHJpY2luZy10YWJsZS0xX19wcmljZSwgLm0tcHJpY2luZy10YWJsZS0xX19zdWJ0aXRsZSwgLm0tcHJpY2luZy10YWJsZS0xX19idG4ge1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cblxuYm9keSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjNmODtcbn1cblxuZGl2Lm0tY29udGVudCBkaXYubS1sb2dpbl9fbG9nbyB7XG4gICAgbWFyZ2luLWJvdHRvbTogNTBweCAhaW1wb3J0YW50O1xufVxuXG4ubS1wcmljaW5nLXRhYmxlLTFfX2l0ZW06bnRoLWNoaWxkKDRuKSB7XG4gICAgYm9yZGVyLXJpZ2h0OiBub25lICFpbXBvcnRhbnQ7XG59XG5cbi5tLXByaWNpbmctdGFibGUtMSAubS1wcmljaW5nLXRhYmxlLTFfX2l0ZW1zIC5tLXByaWNpbmctdGFibGUtMV9faXRlbSAubS1wcmljaW5nLXRhYmxlLTFfX3ByaWNlIHtcbiAgICBmb250LXNpemU6IDJyZW0gIWltcG9ydGFudDtcbn1cblxuYnV0dG9uOmRpc2FibGVkLFxuYnV0dG9uW2Rpc2FibGVkXSB7XG4gICAgY3Vyc29yOiBub3QtYWxsb3dlZCAhaW1wb3J0YW50O1xufVxuIl19 */"

/***/ }),

/***/ "./src/account/register/select-edition.component.ts":
/*!**********************************************************!*\
  !*** ./src/account/register/select-edition.component.ts ***!
  \**********************************************************/
/*! exports provided: SelectEditionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectEditionComponent", function() { return SelectEditionComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/animations/routerTransition */ "./src/shared/animations/routerTransition.ts");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_5__);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var SelectEditionComponent = /** @class */ (function (_super) {
    __extends(SelectEditionComponent, _super);
    function SelectEditionComponent(injector, _tenantRegistrationService, _subscriptionService, _router) {
        var _this = _super.call(this, injector) || this;
        _this._tenantRegistrationService = _tenantRegistrationService;
        _this._subscriptionService = _subscriptionService;
        _this._router = _router;
        _this.editionsSelectOutput = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionsSelectOutput"]();
        _this.isUserLoggedIn = false;
        _this.isSetted = false;
        _this.editionPaymentType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionPaymentType"];
        _this.subscriptionStartType = _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionStartType"];
        /*you can change your edition icons order within editionIcons variable */
        _this.editionIcons = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-cogwheel-2', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];
        return _this;
    }
    SelectEditionComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.isUserLoggedIn = abp.session.userId > 0;
        this._tenantRegistrationService.getEditionsForSelect()
            .subscribe(function (result) {
            _this.editionsSelectOutput = result;
            if (!_this.editionsSelectOutput.editionsWithFeatures || _this.editionsSelectOutput.editionsWithFeatures.length <= 0) {
                _this._router.navigate(['/account/register-tenant']);
            }
        });
    };
    SelectEditionComponent.prototype.isFree = function (edition) {
        return !edition.monthlyPrice && !edition.annualPrice;
    };
    SelectEditionComponent.prototype.isTrueFalseFeature = function (feature) {
        return feature.inputType.name === 'CHECKBOX';
    };
    SelectEditionComponent.prototype.featureEnabledForEdition = function (feature, edition) {
        var featureValues = lodash__WEBPACK_IMPORTED_MODULE_5__["filter"](edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return false;
        }
        var featureValue = featureValues[0];
        return featureValue.value.toLowerCase() === 'true';
    };
    SelectEditionComponent.prototype.getFeatureValueForEdition = function (feature, edition) {
        var featureValues = lodash__WEBPACK_IMPORTED_MODULE_5__["filter"](edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return '';
        }
        var featureValue = featureValues[0];
        return featureValue.value;
    };
    SelectEditionComponent.prototype.canUpgrade = function (edition) {
        if (this.appSession.tenant.edition.id === edition.id) {
            return false;
        }
        var currentMonthlyPrice = this.appSession.tenant.edition.monthlyPrice
            ? this.appSession.tenant.edition.monthlyPrice
            : 0;
        var targetMonthlyPrice = edition && edition.monthlyPrice ? edition.monthlyPrice : 0;
        return this.isUserLoggedIn &&
            this.appSession.tenant.edition &&
            currentMonthlyPrice <= targetMonthlyPrice;
    };
    SelectEditionComponent.prototype.upgrade = function (upgradeEdition, editionPaymentType) {
        var _this = this;
        if (editionPaymentType === _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["EditionPaymentType"].Upgrade && this.upgradeIsFree(upgradeEdition)) {
            this._subscriptionService.upgradeTenantToEquivalentEdition(upgradeEdition.id)
                .subscribe(function () {
                _this._router.navigate(['app/admin/subscription-management']);
            });
        }
        else {
            this._router.navigate(['/account/upgrade'], { queryParams: { upgradeEditionId: upgradeEdition.id, editionPaymentType: editionPaymentType } });
        }
    };
    SelectEditionComponent.prototype.upgradeIsFree = function (upgradeEdition) {
        if (!this.appSession.tenant || !this.appSession.tenant.edition) {
            return false;
        }
        var bothEditionsAreFree = this.appSession.tenant.edition.isFree && upgradeEdition.isFree;
        var bothEditionsHasSamePrice = !upgradeEdition.isFree &&
            upgradeEdition.monthlyPrice === this.appSession.tenant.edition.monthlyPrice &&
            upgradeEdition.annualPrice === this.appSession.tenant.edition.annualPrice;
        return bothEditionsAreFree || bothEditionsHasSamePrice;
    };
    SelectEditionComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            template: __webpack_require__(/*! ./select-edition.component.html */ "./src/account/register/select-edition.component.html"),
            encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewEncapsulation"].None,
            animations: [Object(_shared_animations_routerTransition__WEBPACK_IMPORTED_MODULE_2__["accountModuleAnimation"])()],
            styles: [__webpack_require__(/*! ./select-edition.component.less */ "./src/account/register/select-edition.component.less"), __webpack_require__(/*! ./pricing.min.css */ "./src/account/register/pricing.min.css")]
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["TenantRegistrationServiceProxy"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_4__["SubscriptionServiceProxy"],
            _angular_router__WEBPACK_IMPORTED_MODULE_1__["Router"]])
    ], SelectEditionComponent);
    return SelectEditionComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_3__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/register/tenant-registration-helper.service.ts":
/*!********************************************************************!*\
  !*** ./src/account/register/tenant-registration-helper.service.ts ***!
  \********************************************************************/
/*! exports provided: TenantRegistrationHelperService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TenantRegistrationHelperService", function() { return TenantRegistrationHelperService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var TenantRegistrationHelperService = /** @class */ (function () {
    function TenantRegistrationHelperService() {
    }
    TenantRegistrationHelperService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])()
    ], TenantRegistrationHelperService);
    return TenantRegistrationHelperService;
}());



/***/ }),

/***/ "./src/account/shared/tenant-change-modal.component.html":
/*!***************************************************************!*\
  !*** ./src/account/shared/tenant-change-modal.component.html ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div bsModal #tenantChangeModal=\"bs-modal\" (onShown)=\"onShown()\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"tenantChangeModal\" aria-hidden=\"true\" [config]=\"{backdrop: 'static'}\">\r\n    <div class=\"modal-dialog modal-lg\">\r\n\r\n        <div class=\"modal-content\">\r\n\r\n            <form *ngIf=\"active\" #changeTenantForm=\"ngForm\" novalidate (ngSubmit)=\"save()\">\r\n\r\n                <div class=\"modal-header\">\r\n                    <h5 class=\"modal-title\">\r\n                        <span>{{\"ChangeTenant\" | localize}}</span>\r\n                    </h5>\r\n                    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" (click)=\"close()\"></button>\r\n                </div>\r\n\r\n                <div class=\"modal-body\">\r\n                    <div class=\"form-group\">\r\n                        <label class=\"float-left\">{{\"TenancyName\" | localize}}</label>\r\n                        <input #tenancyNameInput type=\"text\" name=\"TenancyName\" class=\"form-control\" [ngClass]=\"{'edited':tenancyName}\" [(ngModel)]=\"tenancyName\" maxlength=\"64\">\r\n                        <span class=\"float-left m-form__help\">{{\"LeaveEmptyToSwitchToHost\" | localize}}</span>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class=\"modal-footer\">\r\n                    <button [disabled]=\"saving\" type=\"button\" class=\"btn btn-secondary close-button\" (click)=\"close()\">{{\"Cancel\" | localize}}</button>\r\n                    <button type=\"submit\" class=\"btn btn-primary save-button\" [disabled]=\"!changeTenantForm.form.valid\" [buttonBusy]=\"saving\" [busyText]=\"l('SavingWithThreeDot')\"><i class=\"fa fa-save\"></i> <span>{{\"Save\" | localize}}</span></button>\r\n                </div>\r\n\r\n            </form>\r\n\r\n        </div>\r\n    </div>\r\n</div>\r\n"

/***/ }),

/***/ "./src/account/shared/tenant-change-modal.component.ts":
/*!*************************************************************!*\
  !*** ./src/account/shared/tenant-change-modal.component.ts ***!
  \*************************************************************/
/*! exports provided: TenantChangeModalComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TenantChangeModalComponent", function() { return TenantChangeModalComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var ngx_bootstrap__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ngx-bootstrap */ "./node_modules/ngx-bootstrap/esm5/ngx-bootstrap.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var TenantChangeModalComponent = /** @class */ (function (_super) {
    __extends(TenantChangeModalComponent, _super);
    function TenantChangeModalComponent(_accountService, injector) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        _this.tenancyName = '';
        _this.active = false;
        _this.saving = false;
        return _this;
    }
    TenantChangeModalComponent.prototype.show = function (tenancyName) {
        this.tenancyName = tenancyName;
        this.active = true;
        this.modal.show();
    };
    TenantChangeModalComponent.prototype.onShown = function () {
        this.tenancyNameInput.nativeElement.focus();
    };
    TenantChangeModalComponent.prototype.save = function () {
        var _this = this;
        if (!this.tenancyName) {
            abp.multiTenancy.setTenantIdCookie(undefined);
            this.close();
            location.reload();
            return;
        }
        var input = new _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["IsTenantAvailableInput"]();
        input.tenancyName = this.tenancyName;
        this.saving = true;
        this._accountService.isTenantAvailable(input)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_4__["finalize"])(function () { _this.saving = false; }))
            .subscribe(function (result) {
            switch (result.state) {
                case _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["TenantAvailabilityState"].Available:
                    abp.multiTenancy.setTenantIdCookie(result.tenantId);
                    _this.close();
                    location.reload();
                    return;
                case _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["TenantAvailabilityState"].InActive:
                    _this.message.warn(_this.l('TenantIsNotActive', _this.tenancyName));
                    break;
                case _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["TenantAvailabilityState"].NotFound: //NotFound
                    _this.message.warn(_this.l('ThereIsNoTenantDefinedWithName{0}', _this.tenancyName));
                    break;
            }
        });
    };
    TenantChangeModalComponent.prototype.close = function () {
        this.active = false;
        this.modal.hide();
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"])('tenantChangeModal'),
        __metadata("design:type", ngx_bootstrap__WEBPACK_IMPORTED_MODULE_3__["ModalDirective"])
    ], TenantChangeModalComponent.prototype, "modal", void 0);
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"])('tenancyNameInput'),
        __metadata("design:type", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ElementRef"])
    ], TenantChangeModalComponent.prototype, "tenancyNameInput", void 0);
    TenantChangeModalComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'tenantChangeModal',
            template: __webpack_require__(/*! ./tenant-change-modal.component.html */ "./src/account/shared/tenant-change-modal.component.html")
        }),
        __metadata("design:paramtypes", [_shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["AccountServiceProxy"],
            _angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"]])
    ], TenantChangeModalComponent);
    return TenantChangeModalComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__["AppComponentBase"]));



/***/ }),

/***/ "./src/account/shared/tenant-change.component.ts":
/*!*******************************************************!*\
  !*** ./src/account/shared/tenant-change.component.ts ***!
  \*******************************************************/
/*! exports provided: TenantChangeComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TenantChangeComponent", function() { return TenantChangeComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @shared/common/app-component-base */ "./src/shared/common/app-component-base.ts");
/* harmony import */ var _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/service-proxies/service-proxies */ "./src/shared/service-proxies/service-proxies.ts");
/* harmony import */ var _tenant_change_modal_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tenant-change-modal.component */ "./src/account/shared/tenant-change-modal.component.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var TenantChangeComponent = /** @class */ (function (_super) {
    __extends(TenantChangeComponent, _super);
    function TenantChangeComponent(injector, _accountService) {
        var _this = _super.call(this, injector) || this;
        _this._accountService = _accountService;
        return _this;
    }
    TenantChangeComponent.prototype.ngOnInit = function () {
        if (this.appSession.tenant) {
            this.tenancyName = this.appSession.tenant.tenancyName;
            this.name = this.appSession.tenant.name;
        }
    };
    Object.defineProperty(TenantChangeComponent.prototype, "isMultiTenancyEnabled", {
        get: function () {
            return abp.multiTenancy.isEnabled;
        },
        enumerable: true,
        configurable: true
    });
    TenantChangeComponent.prototype.showChangeModal = function () {
        this.tenantChangeModal.show(this.tenancyName);
    };
    __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"])('tenantChangeModal'),
        __metadata("design:type", _tenant_change_modal_component__WEBPACK_IMPORTED_MODULE_3__["TenantChangeModalComponent"])
    ], TenantChangeComponent.prototype, "tenantChangeModal", void 0);
    TenantChangeComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'tenant-change',
            template: "<span *ngIf=\"isMultiTenancyEnabled\">\n        {{\"CurrentTenant\" | localize}}: <span *ngIf=\"tenancyName\" title=\"{{name}}\"><strong>{{tenancyName}}</strong></span> <span *ngIf=\"!tenancyName\">{{\"NotSelected\" | localize}}</span> (<a href=\"javascript:;\" (click)=\"showChangeModal()\">{{l(\"Change\")}}</a>)\n        <tenantChangeModal #tenantChangeModal></tenantChangeModal>\n    </span>"
        }),
        __metadata("design:paramtypes", [_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injector"],
            _shared_service_proxies_service_proxies__WEBPACK_IMPORTED_MODULE_2__["AccountServiceProxy"]])
    ], TenantChangeComponent);
    return TenantChangeComponent;
}(_shared_common_app_component_base__WEBPACK_IMPORTED_MODULE_1__["AppComponentBase"]));



/***/ })

}]);
//# sourceMappingURL=account-account-module.js.map