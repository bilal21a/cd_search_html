﻿(function (funcName, baseObj) {
    
    window.addEventListener("message", function (e) {
        var frame = document.getElementById("korahCcrChatContainer");
        switch (e.data.action) {
            case LSListener.EVENTS.INIT:
                var listener = new LSListener(frame.contentWindow, e.data.name, e.data.initiator);
                break;
        }
    });
	
    // The public function name defaults to window.docReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if (document.readyState === "complete") {
            ready();
        }
    }

    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function (callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function () { callback(context); }, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({ fn: callback, ctx: context });
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener("DOMContentLoaded", ready, false);
                // backup is window load event
                window.addEventListener("load", ready, false);
            } else {
                // must be IE
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);

docReady(function () {
    console.log("docReady");
    try {
        var containerFrame = document.getElementById("korahCcrChatContainer");
        containerFrame.setAttribute("allow", "camera *;microphone *;geolocation *;");
        if (!containerFrame) {
            console.log("[SCC]ContainerFrame not found");
            return;
        }

        if (!containerFrame.dataset || !containerFrame.dataset.hosturl) {
            console.log("[SCC]Valid host url not detected");
            return;
        }
        var lang = "default";
        if (getParameterByName("ccrLang")) {
            lang = getParameterByName("ccrLang");
        } else if (getParameterByName("lang")) {
            lang = getParameterByName("lang");
        } else if (containerFrame.dataset.lang) {
            lang = containerFrame.dataset.lang;
        } else {
            var html = document.getElementsByTagName("html");
            if (html[0] !== null && html[0].lang) {
                lang = html[0].lang;
            }
        }
        containerFrame.dataset.lang = lang;

        let sR = "true";
        if (getParameterByName("sR")) {
            sR = getParameterByName("sR");
        }
        containerFrame.dataset.sR = sR;
        
        if(getParameterByName("ccrOrgId")) {
            containerFrame.dataset.orgid = getParameterByName("ccrOrgId");
        }

        function receiveMessage(evt) {
            if (evt.origin !== origin) {
                return;
            }
            if (typeof evt.data.ccr !== "undefined" && typeof evt.data.ccr.type !== "undefined") {
                switch (evt.data.ccr.type) {
                    case "ready":
                        messager.sendInit();
                        break;
                    case "start":
                        containerFrame.style.width = "90px";
                        containerFrame.style.height = "90px";
                        containerFrame.style.bottom = evt.data.ccr.content.bottom;
                        containerFrame.style.right = evt.data.ccr.content.right;
                        containerFrame.style.top = evt.data.ccr.content.top;
                        containerFrame.style.left = evt.data.ccr.content.left;
                        containerFrame.style["max-height"] = "100vh";
                        containerFrame.style["max-width"] = "100vw";
                        containerFrame.style.visibility = evt.data.ccr.content.visibility;
                        if (!document.querySelector("#ccrChatButton")) {
                            containerFrame.style.display = containerFrame.style.display;
                        }
                        break;
                    case "show":
                        containerFrame.classList.add("openedChatframe");
                        containerFrame.style.width = evt.data.ccr.content.width;
                        containerFrame.style.height = evt.data.ccr.content.height;
                        containerFrame.style.bottom = evt.data.ccr.content.bottom;
                        containerFrame.style.right = evt.data.ccr.content.right;
                        containerFrame.style.top = evt.data.ccr.content.top;
                        containerFrame.style.left = evt.data.ccr.content.left;
                        containerFrame.style["max-height"] = "100vh";
                        containerFrame.style["max-width"] = "100vw";
                        break;
                    case "hidden":
                        containerFrame.classList.remove("openedChatframe");
                        containerFrame.style.width = "90px";
                        containerFrame.style.height = "90px";
                        containerFrame.style.bottom = evt.data.ccr.content.bottom;
                        containerFrame.style.right = evt.data.ccr.content.right;
                        containerFrame.style.top = evt.data.ccr.content.top;
                        containerFrame.style.left = evt.data.ccr.content.left;
                        containerFrame.style["max-height"] = "100vh";
                        containerFrame.style["max-width"] = "100vw";
                        break;
                    case "resize":
                        containerFrame.style.width = evt.data.ccr.content.width;
                        containerFrame.style.height = evt.data.ccr.content.height;
                        break;
                    case "csKey":
                        containerFrame.csKey = evt.data.ccr.content.csKey;
                        break;
                    case "cobrowse":
                        var key = evt.data.ccr.content.key;
                        cobrowse(key);
                        break;
                    default:
                        console.log("Invalid message");
                        break;
                }
            }

        }
        if (window.addEventListener) {
            window.addEventListener("message", receiveMessage, false);
        } else {
            window.attachEvent("onmessage", receiveMessage);
        }

        var origin = containerFrame.dataset.hosturl.replace("/oprCns/", "");
        var messager = {
            sendInit: function () {
                let msg = {
                    ccr: {
                        type: "init",
                        content: {}
                    }
                };
                for (let data in containerFrame.dataset) {
                    msg.ccr.content[data] = containerFrame.dataset[data];
                }

                if(rsp){
                    msg.ccr.rsp = rsp;
                }

                if (typeof containerFrame.dataset.isclntauthrq == "string" && containerFrame.dataset.isclntauthrq.trim().toLowerCase() == "true") {
                    var profile = localStorage.getItem("profile");
                    if (profile) {
                        msg.ccr.profile = profile;
                    }
                }

                if (typeof ccrResources != "object" || ccrResources == null) {
                    var orgId = containerFrame.dataset.orgid;
                    var resourceJsName = "/i18Locale." + orgId + ".js";
                    var localBaseUrl = containerFrame.dataset.baseurl;
                    var resourceHostUrl = getCurPageDir() + "/js";
                    if (typeof localBaseUrl === "string" && localBaseUrl.trim() != "") {
                        resourceHostUrl = localBaseUrl.replace(/\/$/, "");
                    }
                    var resoureUrl = resourceHostUrl.replace(/\/$/, "") + resourceJsName;
                    getUrl(resoureUrl,
                        function () {   //State change
                            if (this.readyState == 4 && this.status == 200) {
                                try {
                                    eval(this.responseText);
                                    msg.ccr.ccrResources = ccrResources; // Declared by baseusrl/i18Locale.js
                                } catch (e) {
                                    console.warn(e);
                                } finally {
                                    containerFrame.contentWindow.postMessage(msg, origin);
                                }
                            }
                        },
                        function () {   //404 callback
                            containerFrame.contentWindow.postMessage(msg, origin);
                        });
                } else {
                    msg.ccr.ccrResources = ccrResources; // Declared by i18Locale.js included in the html
                    containerFrame.contentWindow.postMessage(msg, origin);
                }
            },
            sendShow: function () {
                let msg = {
                    ccr: {
                        type: "show",
                        content: {}
                    }
                };
                containerFrame.contentWindow.postMessage(msg, origin);
            },
            sendFocusLost: function () {
                let msg = {
                    ccr: {
                        type: "focuslost",
                        content: {}
                    }
                };
                if (containerFrame !== null && containerFrame.contentWindow !== null) {
                    containerFrame.contentWindow.postMessage(msg, origin);
                }
            },
            sendNewResources: function (resources){
                let msg = {
                    ccr: {
                        type: "widgetResource",
                        ccrResources: resources
                    }
                };
                containerFrame.contentWindow.postMessage(msg, origin);

            }
        };

        var orgId = containerFrame.dataset.orgid;
        var serverHost = containerFrame.dataset.hosturl;
        var url = serverHost + "getWidgetCfg.php";
        var usrTrackerSwitch = "";
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("post", url);
        xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xmlHttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var rsp = JSON.parse(this.responseText);
                console.log(rsp.cfgTrackSwitch);
                usrTrackerSwitch = rsp.cfgTrackSwitch;
                if(usrTrackerSwitch == true || usrTrackerSwitch == "true"){
                    var isLoaduiTracker = containerFrame.dataset.isloaduitracker;

                    if (isLoaduiTracker == "true") {
                        loaduiTrackerJS(containerFrame.dataset.hosturl, containerFrame);
                    }
                }
            }

        };
        xmlHttp.send(encodeURI('orgId=' + orgId));

        customJsBeforeCcrBtnLoad(messager, lang);
        var isCheckCcrAvailability = containerFrame.dataset.ischeckccravailability;
        var serverHost = containerFrame.dataset.hosturl;
        var rsp;
        var iframeUrl = serverHost + "ccr-btn-sdk/ccrBtn/ccrBtnTemplate.html";
        if (isCheckCcrAvailability == "true") {
            var orgId = containerFrame.dataset.orgid;
            var url = serverHost + "ccrBtnAvailability.php";
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("post", url);
            xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xmlHttp.onload = function () {
                if (xmlHttp.status === 200) {
                    rsp = xmlHttp.responseText;
                    if (typeof rsp == "string") {
                        rsp = JSON.parse(rsp);
                    }
                    if (rsp && typeof rsp.rc != "undefined" && rsp.rc == 1) {
                        containerFrame.setAttribute("src", iframeUrl);
                    }
                    if(rsp && typeof rsp.rc != "undefined" && rsp.rc == 0){
                        var slimWidget = document.querySelector("#slimWidget");
                        if(slimWidget){
                            slimWidget.style.display = "none";
                        }
                    }
                } else {
                    containerFrame.parentNode.removeChild(containerFrame);
                    var slimWidget = document.querySelector("#slimWidget");
                    if(slimWidget){
                        slimWidget.style.display = "none";
                    }
                }
            };
            xmlHttp.send(encodeURI('orgId=' + orgId));
        } else {
            containerFrame.setAttribute("src", iframeUrl);
        }

    } catch (e) {
        console.error(e);
        containerFrame.parentNode.removeChild(containerFrame);
    }

    function loaduiTrackerJS(baseurl, containerFrame) {
        var scripts = {};
        scripts[baseurl + "js/html2canvas.min.js"] = false;
        scripts[baseurl + "js/uiTracker.js"] = false;

        for(var k in scripts){
            (function(k){
                _element = document.createElement("script");
                _element.src = k;
                _element.type = "text/javascript";
                _element.onload = function () {
                    scripts[k] = true;
                    var check = true;
                    for(var j in scripts){
                        check &= scripts[j];
                    }
                    if(check){
                        window.uiTracker = new UiTracker(containerFrame);
                    }
                };
                document.head.appendChild(_element);
            })(k);
        }
    }

});

function customJsBeforeCcrBtnLoad(messager, lang) {
    
    var chatBtn = document.querySelector("#ccrChatButton");
    var chatContainer = document.querySelector("#korahCcrChatContainer");
    var chatText = {
        "btnadd": {
            "en": "Launch chatbot service on this page",
            "fr": "Lancer le service de clavarbot sur cette page"
        },
        "btndel": {
            "en": "Remove chatbot service from this page",
            "fr": "Enlever le service de clavarbot de cette page"
        },
        "heading": {
            "en": "Ask a Question! MSCA",
            "fr": "Posez une question! MSCA"
        },
        "message": {
            "en": "<p>For help with general questions about Passport.</p><p><a href=\"/en/employment-social-development/corporate/portfolio/service-canada/improving-services/scc-tou.html\">Terms of Use and Information Statement</a></p>",
            "fr": "<p>Pour d’aide avec des demandes de renseignements généraux sur les passeports. </p><p><a href=\"/fr/emploi-developpement-social/ministere/portefeuille/service-canada/ameliorer-services/csc-mdu.html\">Modalités d’utilisation et Avis d’information</a></p>"
        }
    };
    if (chatBtn) {
        chatContainer.style.display = "none";
        chatBtn.addEventListener("click", function () {
            if (hasClass(chatBtn, "scc-chat-btn-add")) {
                chatBtn.classList.remove("scc-chat-btn-add");
                chatBtn.innerHTML = chatText.btndel[lang];
                chatContainer.style.display = "block";
                messager.sendShow();
            } else {
                chatContainer.style.display = "none";
                chatBtn.classList.add("scc-chat-btn-add");
                chatBtn.innerHTML = chatText.btnadd[lang];
            }
        });
    } else {
        chatContainer.style.display = "block";
    }
}

function getUrl(url, onStateChange, finalCallback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
    xhr.onreadystatechange = onStateChange;
    xhr.onerror = function (err) {
        console.error(err);
        onStateChange();
    }
    xhr.onloadend = function () {
        if (xhr.status == 404) {
            console.error(url + " not found.");
            if (typeof finalCallback == "function") {
                finalCallback();
            }
        }
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/gi, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)', "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/gi, ' '));
}

function getCurPageDir() {
    var loc = window.location.pathname;
    return loc.substring(0, loc.lastIndexOf('/')).replace(/\/$/, "");;
}

function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
}

function cobrowse( key ){
    (function(w,t,c,p,s,e){p=new Promise(function(r){w[c]={client:function(){if(!s){
        s=document.createElement(t);s.src='https://js.cobrowse.io/CobrowseIO.js';s.async=1;
        e=document.getElementsByTagName(t)[0];e.parentNode.insertBefore(s,e);s.onload=function()
        {r(w[c]);};}return p;}};});})(window,'script','CobrowseIO');
    
    CobrowseIO.license = key;
    CobrowseIO.trustedOrigins = [
        window.location.origin,
        'https://svc1.korahlimited.com:10443'
    ];
    CobrowseIO.client().then(function(){
        CobrowseIO.start({allowIFrameStart:true});
    });
}

function LSListener(childWindow, name, uid) {

    var _self = this;
    var _cache = {};
    var _childWindow = childWindow;
    var _name = name;
    var _storageKey = _getStorageKey();
    var _uid = uid;

    _init();

    function _init() {
        var item = localStorage.getItem(_storageKey);
        if (item = JSON.parse(item)) {
            _cache = item;
        }

        window.addEventListener("message", function (e) {
            if (e.data.name == _name) {
                switch (e.data.action) {
                    case LSListener.EVENTS.SET:
                        _setItem(e.data.args.key, e.data.args.item);
                        _notify(e.data.initiator, e.data.action, e.data.args);
                        break;
                    case LSListener.EVENTS.UNSET:
                        _removeItem(e.data.args.key);
                        _notify(e.data.initiator, e.data.action, e.data.args);
                        break;
                    case LSListener.EVENTS.CLEAR:
                        _clear();
                        _notify(e.data.initiator, e.data.action, e.data.args);
                        break;
                }
            }
        });

        _notify(_uid, LSListener.EVENTS.INIT, {
            "cache": _cache
        });
    }

    //When passed a number n, this method will return the name of the nth key in the storage.
    function _key(n) {
        // TODO: implement this????
    }

    //When passed a key name, will return that key's value.
    function _getItem(key) {
        key = _normalizeKey(key);
        if (key in _cache) {
            return _cache[key];
        }
        return null;
    }

    //When passed a key name and value, will add that key to the storage, or update that key's value if it already exists.
    function _setItem(key, item) {
        if (item === undefined) {
            throw new TypeError("Failed to execute 'setItem' on 'Storage': 2 arguments required, but only 1 present.");
        }
        key = _normalizeKey(key);
        _cache[key] = item.toString();
        _saveCache();
    }

    //When passed a key name, will remove that key from the storage.
    function _removeItem(key) {
        key = _normalizeKey(key);
        if (key in _cache) {
            delete _cache[key];
            _saveCache();
        }
    }

    //When invoked, will empty all keys out of the storage.
    function _clear() {
        _cache = {};
        _saveCache();
    }

    function _normalizeKey(key) {
        if (key === undefined) return "undefined";
        if (key === null) return "null";
        return key.toString();
    }

    function _notify(initiator, action, args) {
        _childWindow.postMessage({
            "name": _name,
            "initiator": initiator,
            "action": action,
            "args": args
        }, "*");
    }

    function _saveCache() {
        localStorage.setItem(_storageKey, JSON.stringify(_cache));
    }

    function _getStorageKey() {
        return "CCRLSCACHE_" + _name;
    }

    _self.key = _key;
    _self.getItem = _getItem;

    return _self;

}
LSListener.EVENTS = {
    INIT: 0,
    SET: 1,
    UNSET: 2,
    CLEAR: 3
}
