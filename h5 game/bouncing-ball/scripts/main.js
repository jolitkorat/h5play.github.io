window.DOMHandler = class {
    constructor(a, b) {
        this._iRuntime = a;
        this._componentId = b;
        this._hasTickCallback = !1;
        this._tickCallback = () => this.Tick()
    }
    Attach() {}
    PostToRuntime(a, b, c, d) {
        this._iRuntime.PostToRuntimeComponent(this._componentId, a, b, c, d)
    }
    PostToRuntimeAsync(a, b, c, d) {
        return this._iRuntime.PostToRuntimeComponentAsync(this._componentId, a, b, c, d)
    }
    _PostToRuntimeMaybeSync(a, b, c) {
        this._iRuntime.UsesWorker() ? this.PostToRuntime(a, b, c) : this._iRuntime._GetLocalRuntime()._OnMessageFromDOM({
            type: "event",
            component: this._componentId,
            handler: a,
            dispatchOpts: c || null,
            data: b,
            responseId: null
        })
    }
    AddRuntimeMessageHandler(a, b) {
        this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId, a, b)
    }
    AddRuntimeMessageHandlers(a) {
        for (const [b, c] of a) this.AddRuntimeMessageHandler(b, c)
    }
    GetRuntimeInterface() {
        return this._iRuntime
    }
    GetComponentID() {
        return this._componentId
    }
    _StartTicking() {
        this._hasTickCallback || (this._iRuntime._AddRAFCallback(this._tickCallback), this._hasTickCallback = !0)
    }
    _StopTicking() {
        this._hasTickCallback && (this._iRuntime._RemoveRAFCallback(this._tickCallback),
            this._hasTickCallback = !1)
    }
    Tick() {}
};
window.RateLimiter = class {
    constructor(a, b) {
        this._callback = a;
        this._interval = b;
        this._timerId = -1;
        this._lastCallTime = -Infinity;
        this._timerCallFunc = () => this._OnTimer();
        this._canRunImmediate = this._ignoreReset = !1
    }
    SetCanRunImmediate(a) {
        this._canRunImmediate = !!a
    }
    Call() {
        if (-1 === this._timerId) {
            var a = Date.now(),
                b = a - this._lastCallTime,
                c = this._interval;
            b >= c && this._canRunImmediate ? (this._lastCallTime = a, this._RunCallback()) : this._timerId = self.setTimeout(this._timerCallFunc, Math.max(c - b, 4))
        }
    }
    _RunCallback() {
        this._ignoreReset = !0;
        this._callback();
        this._ignoreReset = !1
    }
    Reset() {
        this._ignoreReset || (this._CancelTimer(), this._lastCallTime = Date.now())
    }
    _OnTimer() {
        this._timerId = -1;
        this._lastCallTime = Date.now();
        this._RunCallback()
    }
    _CancelTimer() {
        -1 !== this._timerId && (self.clearTimeout(this._timerId), this._timerId = -1)
    }
    Release() {
        this._CancelTimer();
        this._timerCallFunc = this._callback = null
    }
};
"use strict";
class ElementState {
    constructor(a) {
        this._elem = a;
        this._hadFirstUpdate = !1;
        this._isVisibleFlag = !0
    }
    SetVisibleFlag(a) {
        this._isVisibleFlag = !!a
    }
    GetVisibleFlag() {
        return this._isVisibleFlag
    }
    HadFirstUpdate() {
        return this._hadFirstUpdate
    }
    SetHadFirstUpdate() {
        this._hadFirstUpdate = !0
    }
    GetElement() {
        return this._elem
    }
}
window.DOMElementHandler = class extends self.DOMHandler {
    constructor(a, b) {
        super(a, b);
        this._elementMap = new Map;
        this._autoAttach = !0;
        this.AddRuntimeMessageHandlers([
            ["create", c => this._OnCreate(c)],
            ["destroy", c => this._OnDestroy(c)],
            ["set-visible", c => this._OnSetVisible(c)],
            ["update-position", c => this._OnUpdatePosition(c)],
            ["update-state", c => this._OnUpdateState(c)],
            ["focus", c => this._OnSetFocus(c)],
            ["set-css-style", c => this._OnSetCssStyle(c)],
            ["set-attribute", c => this._OnSetAttribute(c)],
            ["remove-attribute",
                c => this._OnRemoveAttribute(c)
            ]
        ]);
        this.AddDOMElementMessageHandler("get-element", c => c)
    }
    SetAutoAttach(a) {
        this._autoAttach = !!a
    }
    AddDOMElementMessageHandler(a, b) {
        this.AddRuntimeMessageHandler(a, c => {
            const d = this.GetElementById(c.elementId);
            return b(d, c)
        })
    }
    _OnCreate(a) {
        const b = a.elementId,
            c = this.CreateElement(b, a),
            d = new ElementState(c);
        this._elementMap.set(b, d);
        c.style.boxSizing = "border-box";
        c.style.display = "none";
        d.SetVisibleFlag(a.isVisible);
        a = this._GetFocusElement(c);
        a.addEventListener("focus", e => this._OnFocus(b));
        a.addEventListener("blur", e => this._OnBlur(b));
        this._autoAttach && document.body.appendChild(c)
    }
    CreateElement(a, b) {
        throw Error("required override");
    }
    DestroyElement(a) {}
    _OnDestroy(a) {
        a = a.elementId;
        const b = this.GetElementById(a);
        this.DestroyElement(b);
        this._autoAttach && b.parentElement.removeChild(b);
        this._elementMap.delete(a)
    }
    PostToRuntimeElement(a, b, c) {
        c || (c = {});
        c.elementId = b;
        this.PostToRuntime(a, c)
    }
    _PostToRuntimeElementMaybeSync(a, b, c) {
        c || (c = {});
        c.elementId = b;
        this._PostToRuntimeMaybeSync(a, c)
    }
    _OnSetVisible(a) {
        if (this._autoAttach) {
            var b =
                this._elementMap.get(a.elementId),
                c = b.GetElement();
            b.HadFirstUpdate() ? c.style.display = a.isVisible ? "" : "none" : b.SetVisibleFlag(a.isVisible)
        }
    }
    _OnUpdatePosition(a) {
        if (this._autoAttach) {
            var b = this._elementMap.get(a.elementId),
                c = b.GetElement();
            c.style.left = a.left + "px";
            c.style.top = a.top + "px";
            c.style.width = a.width + "px";
            c.style.height = a.height + "px";
            a = a.fontSize;
            null !== a && (c.style.fontSize = a + "em");
            b.HadFirstUpdate() || (b.SetHadFirstUpdate(), b.GetVisibleFlag() && (c.style.display = ""))
        }
    }
    _OnUpdateState(a) {
        const b =
            this.GetElementById(a.elementId);
        this.UpdateState(b, a)
    }
    UpdateState(a, b) {
        throw Error("required override");
    }
    _GetFocusElement(a) {
        return a
    }
    _OnFocus(a) {
        this.PostToRuntimeElement("elem-focused", a)
    }
    _OnBlur(a) {
        this.PostToRuntimeElement("elem-blurred", a)
    }
    _OnSetFocus(a) {
        const b = this._GetFocusElement(this.GetElementById(a.elementId));
        a.focus ? b.focus() : b.blur()
    }
    _OnSetCssStyle(a) {
        const b = this.GetElementById(a.elementId),
            c = a.prop;
        a = a.val;
        c.startsWith("--") ? b.style.setProperty(c, a) : b.style[c] = a
    }
    _OnSetAttribute(a) {
        this.GetElementById(a.elementId).setAttribute(a.name,
            a.val)
    }
    _OnRemoveAttribute(a) {
        this.GetElementById(a.elementId).removeAttribute(a.name)
    }
    GetElementById(a) {
        const b = this._elementMap.get(a);
        if (!b) throw Error(`no element with id ${a}`);
        return b.GetElement()
    }
};
"use strict";
const isiOSLike = /(iphone|ipod|ipad|macos|macintosh|mac os x)/i.test(navigator.userAgent),
    isAndroid = /android/i.test(navigator.userAgent),
    isSafari = /safari/i.test(navigator.userAgent) && !/(chrome|chromium|edg\/|OPR\/|nwjs)/i.test(navigator.userAgent);
let resolveCounter = 0;

function AddScript(a) {
    const b = document.createElement("script");
    b.async = !1;
    b.type = "module";
    return a.isStringSrc ? new Promise(c => {
        const d = "c3_resolve_" + resolveCounter;
        ++resolveCounter;
        self[d] = c;
        b.textContent = a.str + `\n\nself["${d}"]();`;
        document.head.appendChild(b)
    }) : new Promise((c, d) => {
        b.onload = c;
        b.onerror = d;
        b.src = a;
        document.head.appendChild(b)
    })
}
let didCheckWorkerModuleSupport = !1,
    isWorkerModuleSupported = !1;

function SupportsWorkerTypeModule() {
    if (!didCheckWorkerModuleSupport) {
        try {
            new Worker("blob://", {
                get type() {
                    isWorkerModuleSupported = !0
                }
            })
        } catch (a) {}
        didCheckWorkerModuleSupport = !0
    }
    return isWorkerModuleSupported
}
let tmpAudio = new Audio;
const supportedAudioFormats = {
    "audio/webm; codecs=opus": !!tmpAudio.canPlayType("audio/webm; codecs=opus"),
    "audio/ogg; codecs=opus": !!tmpAudio.canPlayType("audio/ogg; codecs=opus"),
    "audio/webm; codecs=vorbis": !!tmpAudio.canPlayType("audio/webm; codecs=vorbis"),
    "audio/ogg; codecs=vorbis": !!tmpAudio.canPlayType("audio/ogg; codecs=vorbis"),
    "audio/mp4": !!tmpAudio.canPlayType("audio/mp4"),
    "audio/mpeg": !!tmpAudio.canPlayType("audio/mpeg")
};
tmpAudio = null;
async function BlobToString(a) {
    a = await BlobToArrayBuffer(a);
    return (new TextDecoder("utf-8")).decode(a)
}

function BlobToArrayBuffer(a) {
    return new Promise((b, c) => {
        const d = new FileReader;
        d.onload = e => b(e.target.result);
        d.onerror = e => c(e);
        d.readAsArrayBuffer(a)
    })
}
const queuedArrayBufferReads = [];
let activeArrayBufferReads = 0;
window.RealFile = window.File;
const domHandlerClasses = [],
    runtimeEventHandlers = new Map,
    pendingResponsePromises = new Map;
let nextResponseId = 0;
const runOnStartupFunctions = [];
self.runOnStartup = function(a) {
    if ("function" !== typeof a) throw Error("runOnStartup called without a function");
    runOnStartupFunctions.push(a)
};
const WEBVIEW_EXPORT_TYPES = new Set(["cordova", "playable-ad", "instant-games"]);

function IsWebViewExportType(a) {
    return WEBVIEW_EXPORT_TYPES.has(a)
}
let isWrapperFullscreen = !1;
window.RuntimeInterface = class a {
    constructor(b) {
        this._useWorker = b.useWorker;
        this._messageChannelPort = null;
        this._runtimeBaseUrl = "";
        this._scriptFolder = b.scriptFolder;
        this._workerScriptURLs = {};
        this._localRuntime = this._worker = null;
        this._domHandlers = [];
        this._canvas = this._runtimeDomHandler = null;
        this._isExportingToVideo = !1;
        this._exportToVideoDuration = 0;
        this._jobScheduler = null;
        this._rafId = -1;
        this._rafFunc = () => this._OnRAFCallback();
        this._rafCallbacks = [];
        this._wrapperInitResolve = null;
        this._wrapperComponentIds = [];
        this._exportType = b.exportType;
        this._isFileProtocol = "file" === location.protocol.substr(0, 4);
        !this._useWorker || "undefined" !== typeof OffscreenCanvas && navigator.userActivation && SupportsWorkerTypeModule() || (this._useWorker = !1);
        this._useWorker && isSafari && (this._useWorker = !1);
        if ("playable-ad" === this._exportType || "instant-games" === this._exportType) this._useWorker = !1;
        if ("cordova" === this._exportType && this._useWorker)
            if (isAndroid) {
                const c = /Chrome\/(\d+)/i.exec(navigator.userAgent);
                c && 90 <= parseInt(c[1], 10) ||
                    (this._useWorker = !1)
            } else this._useWorker = !1;
        this.IsWebView2Wrapper() ? self.chrome.webview.addEventListener("message", c => this._OnWrapperMessage(c.data)) : "macos-wkwebview" === this._exportType && (self.C3WrapperOnMessage = c => this._OnWrapperMessage(c));
        this._localFileStrings = this._localFileBlobs = null;
        "html5" !== this._exportType || window.isSecureContext || console.warn("[Construct] Warning: the browser indicates this is not a secure context. Some features may be unavailable. Use secure (HTTPS) hosting to ensure all features are available.");
        this.AddRuntimeComponentMessageHandler("runtime", "cordova-fetch-local-file", c => this._OnCordovaFetchLocalFile(c));
        this.AddRuntimeComponentMessageHandler("runtime", "create-job-worker", c => this._OnCreateJobWorker(c));
        this.AddRuntimeComponentMessageHandler("runtime", "send-wrapper-extension-message", c => this._OnSendWrapperExtensionMessage(c));
        "cordova" === this._exportType ? document.addEventListener("deviceready", () => this._Init(b)) : this._Init(b)
    }
    Release() {
        this._CancelAnimationFrame();
        this._messageChannelPort &&
            (this._messageChannelPort = this._messageChannelPort.onmessage = null);
        this._worker && (this._worker.terminate(), this._worker = null);
        this._localRuntime && (this._localRuntime.Release(), this._localRuntime = null);
        this._canvas && (this._canvas.parentElement.removeChild(this._canvas), this._canvas = null)
    }
    GetCanvas() {
        return this._canvas
    }
    GetRuntimeBaseURL() {
        return this._runtimeBaseUrl
    }
    UsesWorker() {
        return this._useWorker
    }
    GetExportType() {
        return this._exportType
    }
    IsFileProtocol() {
        return this._isFileProtocol
    }
    GetScriptFolder() {
        return this._scriptFolder
    }
    IsiOSCordova() {
        return isiOSLike &&
            "cordova" === this._exportType
    }
    IsiOSWebView() {
        const b = navigator.userAgent;
        return isiOSLike && IsWebViewExportType(this._exportType) || navigator.standalone || /crios\/|fxios\/|edgios\//i.test(b)
    }
    IsAndroid() {
        return isAndroid
    }
    IsAndroidWebView() {
        return isAndroid && IsWebViewExportType(this._exportType)
    }
    IsWebView2Wrapper() {
        return "windows-webview2" === this._exportType || !!("preview" === this._exportType && window.chrome && window.chrome.webview && window.chrome.webview.postMessage)
    }
    async _Init(b) {
        "macos-wkwebview" === this._exportType ?
            this._SendWrapperMessage({
                type: "ready"
            }) : this.IsWebView2Wrapper() && (this._SetupWebView2Polyfills(), this._wrapperComponentIds = (await this._InitWrapper()).registeredComponentIds);
        if ("playable-ad" === this._exportType) {
            this._localFileBlobs = self.c3_base64files;
            this._localFileStrings = {};
            await this._ConvertDataUrisToBlobs();
            for (let d = 0, e = b.engineScripts.length; d < e; ++d) {
                var c = b.engineScripts[d];
                this._localFileStrings.hasOwnProperty(c) ? b.engineScripts[d] = {
                        isStringSrc: !0,
                        str: this._localFileStrings[c]
                    } : this._localFileBlobs.hasOwnProperty(c) &&
                    (b.engineScripts[d] = URL.createObjectURL(this._localFileBlobs[c]))
            }
            b.workerDependencyScripts = []
        }
        if ("nwjs" === this._exportType && self.nw && self.nw.App.manifest["c3-steam-mode"]) {
            let d = 0;
            this._AddRAFCallback(() => {
                d++;
                document.body.style.opacity = 0 === d % 2 ? "1" : "0.999"
            })
        }
        b.runtimeBaseUrl ? this._runtimeBaseUrl = b.runtimeBaseUrl : (c = location.origin, this._runtimeBaseUrl = ("null" === c ? "file:///" : c) + location.pathname, c = this._runtimeBaseUrl.lastIndexOf("/"), -1 !== c && (this._runtimeBaseUrl = this._runtimeBaseUrl.substr(0, c +
            1)));
        b.workerScripts && (this._workerScriptURLs = b.workerScripts);
        c = new MessageChannel;
        this._messageChannelPort = c.port1;
        this._messageChannelPort.onmessage = d => this._OnMessageFromRuntime(d.data);
        window.c3_addPortMessageHandler && window.c3_addPortMessageHandler(d => this._OnMessageFromDebugger(d));
        this._jobScheduler = new self.JobSchedulerDOM(this);
        await this._jobScheduler.Init();
        "object" === typeof window.StatusBar && window.StatusBar.hide();
        if ("object" === typeof window.AndroidFullScreen) try {
            await new Promise((d,
                e) => {
                window.AndroidFullScreen.immersiveMode(d, e)
            })
        } catch (d) {
            console.error("Failed to enter Android immersive mode: ", d)
        }
        this._useWorker ? await this._InitWorker(b, c.port2) : await this._InitDOM(b, c.port2)
    }
    _GetWorkerURL(b) {
        b = this._workerScriptURLs.hasOwnProperty(b) ? this._workerScriptURLs[b] : b.endsWith("/workermain.js") && this._workerScriptURLs.hasOwnProperty("workermain.js") ? this._workerScriptURLs["workermain.js"] : "playable-ad" === this._exportType && this._localFileBlobs.hasOwnProperty(b) ? this._localFileBlobs[b] :
            b;
        b instanceof Blob && (b = URL.createObjectURL(b));
        return b
    }
    async CreateWorker(b, c, d) {
        if (b.startsWith("blob:")) return new Worker(b, d);
        if ("cordova" === this._exportType && this._isFileProtocol) return b = await this.CordovaFetchLocalFileAsArrayBuffer(d.isC3MainWorker ? b : this._scriptFolder + b), b = new Blob([b], {
            type: "application/javascript"
        }), new Worker(URL.createObjectURL(b), d);
        b = new URL(b, c);
        if (location.origin !== b.origin) {
            b = await fetch(b);
            if (!b.ok) throw Error("failed to fetch worker script");
            b = await b.blob();
            return new Worker(URL.createObjectURL(b),
                d)
        }
        return new Worker(b, d)
    }
    _GetWindowInnerWidth() {
        return Math.max(window.innerWidth, 1)
    }
    _GetWindowInnerHeight() {
        return Math.max(window.innerHeight, 1)
    }
    _GetCommonRuntimeOptions(b) {
        return {
            runtimeBaseUrl: this._runtimeBaseUrl,
            previewUrl: location.href,
            windowInnerWidth: this._GetWindowInnerWidth(),
            windowInnerHeight: this._GetWindowInnerHeight(),
            devicePixelRatio: window.devicePixelRatio,
            isFullscreen: a.IsDocumentFullscreen(),
            projectData: b.projectData,
            previewImageBlobs: window.cr_previewImageBlobs || this._localFileBlobs,
            previewProjectFileBlobs: window.cr_previewProjectFileBlobs,
            previewProjectFileSWUrls: window.cr_previewProjectFiles,
            swClientId: window.cr_swClientId || "",
            exportType: b.exportType,
            isDebug: (new URLSearchParams(self.location.search)).has("debug"),
            ife: !!self.ife,
            jobScheduler: this._jobScheduler.GetPortData(),
            supportedAudioFormats,
            opusWasmScriptUrl: window.cr_opusWasmScriptUrl || this._scriptFolder + "opus.wasm.js",
            opusWasmBinaryUrl: window.cr_opusWasmBinaryUrl || this._scriptFolder + "opus.wasm.wasm",
            isFileProtocol: this._isFileProtocol,
            isiOSCordova: this.IsiOSCordova(),
            isiOSWebView: this.IsiOSWebView(),
            isWebView2Wrapper: this.IsWebView2Wrapper(),
            wrapperComponentIds: this._wrapperComponentIds,
            isFBInstantAvailable: "undefined" !== typeof self.FBInstant
        }
    }
    async _InitWorker(b, c) {
        const d = this._GetWorkerURL(b.workerMainUrl);
        "preview" === this._exportType ? (this._worker = new Worker("previewworker.js", {
            type: "module",
            name: "Runtime"
        }), await new Promise((h, k) => {
            const l = m => {
                this._worker.removeEventListener("message", l);
                m.data && "ok" === m.data.type ? h() : k()
            };
            this._worker.addEventListener("message", l);
            this._worker.postMessage({
                type: "construct-worker-init",
                "import": (new URL(d, this._runtimeBaseUrl)).toString()
            })
        })) : this._worker = await this.CreateWorker(d, this._runtimeBaseUrl, {
            type: "module",
            name: "Runtime",
            isC3MainWorker: !0
        });
        this._canvas = document.createElement("canvas");
        this._canvas.style.display = "none";
        const e = this._canvas.transferControlToOffscreen();
        document.body.appendChild(this._canvas);
        window.c3canvas = this._canvas;
        self.C3_InsertHTMLPlaceholders && self.C3_InsertHTMLPlaceholders();
        let f = b.workerDependencyScripts || [],
            g = b.engineScripts;
        f = await Promise.all(f.map(h => this._MaybeGetCordovaScriptURL(h)));
        g = await Promise.all(g.map(h => this._MaybeGetCordovaScriptURL(h)));
        if ("cordova" === this._exportType)
            for (let h = 0, k = b.projectScripts.length; h < k; ++h) {
                const l = b.projectScripts[h],
                    m = l[0];
                if (m === b.mainProjectScript || "scriptsInEvents.js" === m || m.endsWith("/scriptsInEvents.js")) l[1] = await this._MaybeGetCordovaScriptURL(m)
            }
        this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(b), {
            type: "init-runtime",
            isInWorker: !0,
            messagePort: c,
            canvas: e,
            workerDependencyScripts: f,
            engineScripts: g,
            projectScripts: b.projectScripts,
            mainProjectScript: b.mainProjectScript,
            projectScriptsStatus: self.C3_ProjectScriptsStatus
        }), [c, e, ...this._jobScheduler.GetPortTransferables()]);
        this._domHandlers = domHandlerClasses.map(h => new h(this));
        this._FindRuntimeDOMHandler();
        this._runtimeDomHandler._EnableWindowResizeEvent();
        self.c3_callFunction = (h, k) => this._runtimeDomHandler._InvokeFunctionFromJS(h, k);
        "preview" ===
        this._exportType && (self.goToLastErrorScript = () => this.PostToRuntimeComponent("runtime", "go-to-last-error-script"))
    }
    async _InitDOM(b, c) {
        this._canvas = document.createElement("canvas");
        this._canvas.style.display = "none";
        document.body.appendChild(this._canvas);
        window.c3canvas = this._canvas;
        self.C3_InsertHTMLPlaceholders && self.C3_InsertHTMLPlaceholders();
        this._domHandlers = domHandlerClasses.map(g => new g(this));
        this._FindRuntimeDOMHandler();
        var d = b.engineScripts.map(g => "string" === typeof g ? (new URL(g, this._runtimeBaseUrl)).toString() :
            g);
        if (Array.isArray(b.workerDependencyScripts)) {
            var e = [...b.workerDependencyScripts].map(g => g instanceof Blob ? URL.createObjectURL(g) : g);
            d.unshift(...e)
        }
        d = await Promise.all(d.map(g => this._MaybeGetCordovaScriptURL(g)));
        await Promise.all(d.map(g => AddScript(g)));
        d = self.C3_ProjectScriptsStatus;
        e = b.mainProjectScript;
        const f = b.projectScripts;
        for (let [g, h] of f)
            if (h || (h = g), g === e) try {
                h = await this._MaybeGetCordovaScriptURL(h), await AddScript(h), "preview" !== this._exportType || d[g] || this._ReportProjectMainScriptError(g,
                    "main script did not run to completion")
            } catch (k) {
                this._ReportProjectMainScriptError(g, k)
            } else if ("scriptsInEvents.js" === g || g.endsWith("/scriptsInEvents.js")) h = await this._MaybeGetCordovaScriptURL(h), await AddScript(h);
        "preview" === this._exportType && "object" !== typeof self.C3.ScriptsInEvents ? (this._RemoveLoadingMessage(), console.error("[C3 runtime] Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."), alert("Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax.")) :
            (b = Object.assign(this._GetCommonRuntimeOptions(b), {
                isInWorker: !1,
                messagePort: c,
                canvas: this._canvas,
                runOnStartupFunctions
            }), this._runtimeDomHandler._EnableWindowResizeEvent(), this._OnBeforeCreateRuntime(), this._localRuntime = self.C3_CreateRuntime(b), await self.C3_InitRuntime(this._localRuntime, b))
    }
    _ReportProjectMainScriptError(b, c) {
        this._RemoveLoadingMessage();
        console.error(`[Preview] Failed to load project main script (${b}): `, c);
        alert(`Failed to load project main script (${b}). Check all your JavaScript code has valid syntax. Press F12 and check the console for error details.`)
    }
    _OnBeforeCreateRuntime() {
        this._RemoveLoadingMessage()
    }
    _RemoveLoadingMessage() {
        const b =
            window.cr_previewLoadingElem;
        b && (b.parentElement.removeChild(b), window.cr_previewLoadingElem = null)
    }
    async _OnCreateJobWorker(b) {
        b = await this._jobScheduler._CreateJobWorker();
        return {
            outputPort: b,
            transferables: [b]
        }
    }
    _GetLocalRuntime() {
        if (this._useWorker) throw Error("not available in worker mode");
        return this._localRuntime
    }
    PostToRuntimeComponent(b, c, d, e, f) {
        this._messageChannelPort.postMessage({
            type: "event",
            component: b,
            handler: c,
            dispatchOpts: e || null,
            data: d,
            responseId: null
        }, f)
    }
    PostToRuntimeComponentAsync(b,
        c, d, e, f) {
        const g = nextResponseId++,
            h = new Promise((k, l) => {
                pendingResponsePromises.set(g, {
                    resolve: k,
                    reject: l
                })
            });
        this._messageChannelPort.postMessage({
            type: "event",
            component: b,
            handler: c,
            dispatchOpts: e || null,
            data: d,
            responseId: g
        }, f);
        return h
    }
    _OnMessageFromRuntime(b) {
        const c = b.type;
        if ("event" === c) return this._OnEventFromRuntime(b);
        if ("result" === c) this._OnResultFromRuntime(b);
        else if ("runtime-ready" === c) this._OnRuntimeReady();
        else if ("alert-error" === c) this._RemoveLoadingMessage(), alert(b.message);
        else if ("creating-runtime" ===
            c) this._OnBeforeCreateRuntime();
        else throw Error(`unknown message '${c}'`);
    }
    _OnEventFromRuntime(b) {
        const c = b.component,
            d = b.handler,
            e = b.data,
            f = b.responseId;
        if (b = runtimeEventHandlers.get(c))
            if (b = b.get(d)) {
                var g = null;
                try {
                    g = b(e)
                } catch (h) {
                    console.error(`Exception in '${c}' handler '${d}':`, h);
                    null !== f && this._PostResultToRuntime(f, !1, "" + h);
                    return
                }
                if (null === f) return g;
                g && g.then ? g.then(h => this._PostResultToRuntime(f, !0, h)).catch(h => {
                    console.error(`Rejection from '${c}' handler '${d}':`, h);
                    this._PostResultToRuntime(f, !1, "" + h)
                }) : this._PostResultToRuntime(f, !0, g)
            } else console.warn(`[DOM] No handler '${d}' for component '${c}'`);
        else console.warn(`[DOM] No event handlers for component '${c}'`)
    }
    _PostResultToRuntime(b, c, d) {
        let e;
        d && d.transferables && (e = d.transferables);
        this._messageChannelPort.postMessage({
            type: "result",
            responseId: b,
            isOk: c,
            result: d
        }, e)
    }
    _OnResultFromRuntime(b) {
        const c = b.responseId,
            d = b.isOk;
        b = b.result;
        const e = pendingResponsePromises.get(c);
        d ? e.resolve(b) : e.reject(b);
        pendingResponsePromises.delete(c)
    }
    AddRuntimeComponentMessageHandler(b,
        c, d) {
        let e = runtimeEventHandlers.get(b);
        e || (e = new Map, runtimeEventHandlers.set(b, e));
        if (e.has(c)) throw Error(`[DOM] Component '${b}' already has handler '${c}'`);
        e.set(c, d)
    }
    static AddDOMHandlerClass(b) {
        if (domHandlerClasses.includes(b)) throw Error("DOM handler already added");
        domHandlerClasses.push(b)
    }
    _FindRuntimeDOMHandler() {
        for (const b of this._domHandlers)
            if ("runtime" === b.GetComponentID()) {
                this._runtimeDomHandler = b;
                return
            }
        throw Error("cannot find runtime DOM handler");
    }
    _OnMessageFromDebugger(b) {
        this.PostToRuntimeComponent("debugger",
            "message", b)
    }
    _OnRuntimeReady() {
        for (const b of this._domHandlers) b.Attach()
    }
    static IsDocumentFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || isWrapperFullscreen)
    }
    static _SetWrapperIsFullscreenFlag(b) {
        isWrapperFullscreen = !!b
    }
    async GetRemotePreviewStatusInfo() {
        return await this.PostToRuntimeComponentAsync("runtime", "get-remote-preview-status-info")
    }
    _AddRAFCallback(b) {
        this._rafCallbacks.push(b);
        this._RequestAnimationFrame()
    }
    _RemoveRAFCallback(b) {
        b =
            this._rafCallbacks.indexOf(b);
        if (-1 === b) throw Error("invalid callback");
        this._rafCallbacks.splice(b, 1);
        this._rafCallbacks.length || this._CancelAnimationFrame()
    }
    _RequestAnimationFrame() {
        -1 === this._rafId && this._rafCallbacks.length && (this._rafId = requestAnimationFrame(this._rafFunc))
    }
    _CancelAnimationFrame() {
        -1 !== this._rafId && (cancelAnimationFrame(this._rafId), this._rafId = -1)
    }
    _OnRAFCallback() {
        this._rafId = -1;
        for (const b of this._rafCallbacks) b();
        this._RequestAnimationFrame()
    }
    TryPlayMedia(b) {
        this._runtimeDomHandler.TryPlayMedia(b)
    }
    RemovePendingPlay(b) {
        this._runtimeDomHandler.RemovePendingPlay(b)
    }
    _PlayPendingMedia() {
        this._runtimeDomHandler._PlayPendingMedia()
    }
    SetSilent(b) {
        this._runtimeDomHandler.SetSilent(b)
    }
    IsAudioFormatSupported(b) {
        return !!supportedAudioFormats[b]
    }
    async _WasmDecodeWebMOpus(b) {
        b =
            await this.PostToRuntimeComponentAsync("runtime", "opus-decode", {
                arrayBuffer: b
            }, null, [b]);
        return new Float32Array(b)
    }
    SetIsExportingToVideo(b) {
        this._isExportingToVideo = !0;
        this._exportToVideoDuration = b
    }
    IsExportingToVideo() {
        return this._isExportingToVideo
    }
    GetExportToVideoDuration() {
        return this._exportToVideoDuration
    }
    IsAbsoluteURL(b) {
        return /^(?:[a-z\-]+:)?\/\//.test(b) || "data:" === b.substr(0, 5) || "blob:" === b.substr(0, 5)
    }
    IsRelativeURL(b) {
        return !this.IsAbsoluteURL(b)
    }
    async _MaybeGetCordovaScriptURL(b) {
        return "cordova" ===
            this._exportType && (b.startsWith("file:") || this._isFileProtocol && this.IsRelativeURL(b)) ? (b.startsWith(this._runtimeBaseUrl) && (b = b.substr(this._runtimeBaseUrl.length)), b = await this.CordovaFetchLocalFileAsArrayBuffer(b), b = new Blob([b], {
                type: "application/javascript"
            }), URL.createObjectURL(b)) : b
    }
    async _OnCordovaFetchLocalFile(b) {
        const c = b.filename;
        switch (b.as) {
            case "text":
                return await this.CordovaFetchLocalFileAsText(c);
            case "buffer":
                return await this.CordovaFetchLocalFileAsArrayBuffer(c);
            default:
                throw Error("unsupported type");
        }
    }
    _GetPermissionAPI() {
        const b = window.cordova && window.cordova.plugins && window.cordova.plugins.permissions;
        if ("object" !== typeof b) throw Error("Permission API is not loaded");
        return b
    }
    _MapPermissionID(b, c) {
        b = b[c];
        if ("string" !== typeof b) throw Error("Invalid permission name");
        return b
    }
    _HasPermission(b) {
        const c = this._GetPermissionAPI();
        return new Promise((d, e) => c.checkPermission(this._MapPermissionID(c, b), f => d(!!f.hasPermission), e))
    }
    _RequestPermission(b) {
        const c = this._GetPermissionAPI();
        return new Promise((d,
            e) => c.requestPermission(this._MapPermissionID(c, b), f => d(!!f.hasPermission), e))
    }
    async RequestPermissions(b) {
        if ("cordova" !== this.GetExportType() || this.IsiOSCordova()) return !0;
        for (const c of b)
            if (!await this._HasPermission(c) && !1 === await this._RequestPermission(c)) return !1;
        return !0
    }
    async RequirePermissions(...b) {
        if (!1 === await this.RequestPermissions(b)) throw Error("Permission not granted");
    }
    CordovaFetchLocalFile(b) {
        const c = window.cordova.file.applicationDirectory + "www/" + b;
        return new Promise((d, e) => {
            window.resolveLocalFileSystemURL(c,
                f => {
                    f.file(d, e)
                }, e)
        })
    }
    async CordovaFetchLocalFileAsText(b) {
        b = await this.CordovaFetchLocalFile(b);
        return await BlobToString(b)
    }
    _CordovaMaybeStartNextArrayBufferRead() {
        if (queuedArrayBufferReads.length && !(8 <= activeArrayBufferReads)) {
            activeArrayBufferReads++;
            var b = queuedArrayBufferReads.shift();
            this._CordovaDoFetchLocalFileAsAsArrayBuffer(b.filename, b.successCallback, b.errorCallback)
        }
    }
    CordovaFetchLocalFileAsArrayBuffer(b) {
        return new Promise((c, d) => {
            queuedArrayBufferReads.push({
                filename: b,
                successCallback: e => {
                    activeArrayBufferReads--;
                    this._CordovaMaybeStartNextArrayBufferRead();
                    c(e)
                },
                errorCallback: e => {
                    activeArrayBufferReads--;
                    this._CordovaMaybeStartNextArrayBufferRead();
                    d(e)
                }
            });
            this._CordovaMaybeStartNextArrayBufferRead()
        })
    }
    async _CordovaDoFetchLocalFileAsAsArrayBuffer(b, c, d) {
        try {
            const e = await this.CordovaFetchLocalFile(b),
                f = await BlobToArrayBuffer(e);
            c(f)
        } catch (e) {
            d(e)
        }
    }
    _OnWrapperMessage(b) {
        if ("entered-fullscreen" === b) a._SetWrapperIsFullscreenFlag(!0), this._runtimeDomHandler._OnFullscreenChange();
        else if ("exited-fullscreen" ===
            b) a._SetWrapperIsFullscreenFlag(!1), this._runtimeDomHandler._OnFullscreenChange();
        else if ("object" === typeof b) {
            const c = b.type;
            "wrapper-init-response" === c ? (this._wrapperInitResolve(b), this._wrapperInitResolve = null) : "extension-message" === c ? this.PostToRuntimeComponent("runtime", "wrapper-extension-message", b) : console.warn("Unknown wrapper message: ", b)
        } else console.warn("Unknown wrapper message: ", b)
    }
    _OnSendWrapperExtensionMessage(b) {
        this._SendWrapperMessage({
            type: "extension-message",
            componentId: b.componentId,
            messageId: b.messageId,
            params: b.params || [],
            asyncId: b.asyncId
        })
    }
    _SendWrapperMessage(b) {
        this.IsWebView2Wrapper() ? window.chrome.webview.postMessage(JSON.stringify(b)) : "macos-wkwebview" === this._exportType && window.webkit.messageHandlers.C3Wrapper.postMessage(JSON.stringify(b))
    }
    _SetupWebView2Polyfills() {
        window.moveTo = (b, c) => {
            this._SendWrapperMessage({
                type: "set-window-position",
                windowX: Math.ceil(b),
                windowY: Math.ceil(c)
            })
        };
        window.resizeTo = (b, c) => {
            this._SendWrapperMessage({
                type: "set-window-size",
                windowWidth: Math.ceil(b),
                windowHeight: Math.ceil(c)
            })
        }
    }
    _InitWrapper() {
        return this.IsWebView2Wrapper() ? new Promise(b => {
            this._wrapperInitResolve = b;
            this._SendWrapperMessage({
                type: "wrapper-init"
            })
        }) : Promise.resolve()
    }
    async _ConvertDataUrisToBlobs() {
        const b = [];
        for (const [c, d] of Object.entries(this._localFileBlobs)) b.push(this._ConvertDataUriToBlobs(c, d));
        await Promise.all(b)
    }
    async _ConvertDataUriToBlobs(b, c) {
        if ("object" === typeof c) this._localFileBlobs[b] = new Blob([c.str], {
            type: c.type
        }), this._localFileStrings[b] = c.str;
        else {
            let d =
                await this._FetchDataUri(c);
            d || (d = this._DataURIToBinaryBlobSync(c));
            this._localFileBlobs[b] = d
        }
    }
    async _FetchDataUri(b) {
        try {
            return await (await fetch(b)).blob()
        } catch (c) {
            return console.warn("Failed to fetch a data: URI. Falling back to a slower workaround. This is probably because the Content Security Policy unnecessarily blocked it. Allow data: URIs in your CSP to avoid this.", c), null
        }
    }
    _DataURIToBinaryBlobSync(b) {
        b = this._ParseDataURI(b);
        return this._BinaryStringToBlob(b.data, b.mime_type)
    }
    _ParseDataURI(b) {
        var c =
            b.indexOf(",");
        if (0 > c) throw new URIError("expected comma in data: uri");
        var d = b.substring(5, c);
        b = b.substring(c + 1);
        c = d.split(";");
        d = c[0] || "";
        const e = c[2];
        b = "base64" === c[1] || "base64" === e ? atob(b) : decodeURIComponent(b);
        return {
            mime_type: d,
            data: b
        }
    }
    _BinaryStringToBlob(b, c) {
        var d = b.length;
        let e = d >> 2,
            f = new Uint8Array(d),
            g = new Uint32Array(f.buffer, 0, e),
            h, k;
        for (k = h = 0; h < e; ++h) g[h] = b.charCodeAt(k++) | b.charCodeAt(k++) << 8 | b.charCodeAt(k++) << 16 | b.charCodeAt(k++) << 24;
        for (d &= 3; d--;) f[k] = b.charCodeAt(k), ++k;
        return new Blob([f], {
            type: c
        })
    }
};
"use strict";
const RuntimeInterface$jscomp$1 = self.RuntimeInterface;

function IsCompatibilityMouseEvent(a) {
    return a.sourceCapabilities && a.sourceCapabilities.firesTouchEvents || a.originalEvent && a.originalEvent.sourceCapabilities && a.originalEvent.sourceCapabilities.firesTouchEvents
}
const KEY_CODE_ALIASES = new Map([
        ["OSLeft", "MetaLeft"],
        ["OSRight", "MetaRight"]
    ]),
    DISPATCH_RUNTIME_AND_SCRIPT = {
        dispatchRuntimeEvent: !0,
        dispatchUserScriptEvent: !0
    },
    DISPATCH_SCRIPT_ONLY = {
        dispatchUserScriptEvent: !0
    },
    DISPATCH_RUNTIME_ONLY = {
        dispatchRuntimeEvent: !0
    };

function AddStyleSheet(a) {
    return new Promise((b, c) => {
        const d = document.createElement("link");
        d.onload = () => b(d);
        d.onerror = e => c(e);
        d.rel = "stylesheet";
        d.href = a;
        document.head.appendChild(d)
    })
}

function FetchImage(a) {
    return new Promise((b, c) => {
        const d = new Image;
        d.onload = () => b(d);
        d.onerror = e => c(e);
        d.src = a
    })
}
async function BlobToImage(a) {
    a = URL.createObjectURL(a);
    try {
        return await FetchImage(a)
    } finally {
        URL.revokeObjectURL(a)
    }
}

function BlobToString$jscomp$1(a) {
    return new Promise((b, c) => {
        let d = new FileReader;
        d.onload = e => b(e.target.result);
        d.onerror = e => c(e);
        d.readAsText(a)
    })
}
async function BlobToSvgImage(a, b, c) {
    if (!/firefox/i.test(navigator.userAgent)) return await BlobToImage(a);
    var d = await BlobToString$jscomp$1(a);
    d = (new DOMParser).parseFromString(d, "image/svg+xml");
    const e = d.documentElement;
    if (e.hasAttribute("width") && e.hasAttribute("height")) {
        const f = e.getAttribute("width"),
            g = e.getAttribute("height");
        if (!f.includes("%") && !g.includes("%")) return await BlobToImage(a)
    }
    e.setAttribute("width", b + "px");
    e.setAttribute("height", c + "px");
    d = (new XMLSerializer).serializeToString(d);
    a = new Blob([d], {
        type: "image/svg+xml"
    });
    return await BlobToImage(a)
}

function IsInContentEditable(a) {
    do {
        if (a.parentNode && a.hasAttribute("contenteditable")) return !0;
        a = a.parentNode
    } while (a);
    return !1
}
const keyboardInputElementTagNames = new Set(["input", "textarea", "datalist", "select"]);

function IsKeyboardInputElement(a) {
    return keyboardInputElementTagNames.has(a.tagName.toLowerCase()) || IsInContentEditable(a)
}
const canvasOrDocTags = new Set(["canvas", "body", "html"]);

function PreventDefaultOnCanvasOrDoc(a) {
    if (a.target.tagName) {
        var b = a.target.tagName.toLowerCase();
        canvasOrDocTags.has(b) && a.preventDefault()
    }
}

function BlockWheelZoom(a) {
    (a.metaKey || a.ctrlKey) && a.preventDefault()
}
self.C3_GetSvgImageSize = async function(a) {
    a = await BlobToImage(a);
    if (0 < a.width && 0 < a.height) return [a.width, a.height];
    a.style.position = "absolute";
    a.style.left = "0px";
    a.style.top = "0px";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    const b = a.getBoundingClientRect();
    document.body.removeChild(a);
    return [b.width, b.height]
};
self.C3_RasterSvgImageBlob = async function(a, b, c, d, e) {
    a = await BlobToSvgImage(a, b, c);
    const f = document.createElement("canvas");
    f.width = d;
    f.height = e;
    f.getContext("2d").drawImage(a, 0, 0, b, c);
    return f
};
let isCordovaPaused = !1;
document.addEventListener("pause", () => isCordovaPaused = !0);
document.addEventListener("resume", () => isCordovaPaused = !1);

function ParentHasFocus() {
    try {
        return window.parent && window.parent.document.hasFocus()
    } catch (a) {
        return !1
    }
}

function KeyboardIsVisible() {
    const a = document.activeElement;
    if (!a) return !1;
    const b = a.tagName.toLowerCase(),
        c = new Set("email number password search tel text url".split(" "));
    return "textarea" === b ? !0 : "input" === b ? c.has(a.type.toLowerCase() || "text") : IsInContentEditable(a)
}
RuntimeInterface$jscomp$1.AddDOMHandlerClass(class extends self.DOMHandler {
    constructor(a) {
        super(a, "runtime");
        this._isFirstSizeUpdate = !0;
        this._enableWindowResizeEvent = !1;
        this._simulatedResizeTimerId = -1;
        this._targetOrientation = "any";
        this._pageVisibilityIsHidden = this._attachedDeviceMotionEvent = this._attachedDeviceOrientationEvent = !1;
        this._screenReaderTextWrap = document.createElement("div");
        this._screenReaderTextWrap.className = "c3-screen-reader-text";
        this._screenReaderTextWrap.setAttribute("aria-live",
            "polite");
        document.body.appendChild(this._screenReaderTextWrap);
        this._debugHighlightElem = null;
        this._isExportToVideo = !1;
        this._exportVideoProgressMessage = "";
        this._exportVideoUpdateTimerId = -1;
        this._enableAndroidVKDetection = !1;
        this._lastWindowWidth = a._GetWindowInnerWidth();
        this._lastWindowHeight = a._GetWindowInnerHeight();
        this._vkTranslateYOffset = this._virtualKeyboardHeight = 0;
        a.AddRuntimeComponentMessageHandler("canvas", "update-size", d => this._OnUpdateCanvasSize(d));
        a.AddRuntimeComponentMessageHandler("runtime",
            "invoke-download", d => this._OnInvokeDownload(d));
        a.AddRuntimeComponentMessageHandler("runtime", "load-webfonts", d => this._OnLoadWebFonts(d));
        a.AddRuntimeComponentMessageHandler("runtime", "raster-svg-image", d => this._OnRasterSvgImage(d));
        a.AddRuntimeComponentMessageHandler("runtime", "get-svg-image-size", d => this._OnGetSvgImageSize(d));
        a.AddRuntimeComponentMessageHandler("runtime", "set-target-orientation", d => this._OnSetTargetOrientation(d));
        a.AddRuntimeComponentMessageHandler("runtime", "register-sw", () =>
            this._OnRegisterSW());
        a.AddRuntimeComponentMessageHandler("runtime", "post-to-debugger", d => this._OnPostToDebugger(d));
        a.AddRuntimeComponentMessageHandler("runtime", "go-to-script", d => this._OnPostToDebugger(d));
        a.AddRuntimeComponentMessageHandler("runtime", "before-start-ticking", () => this._OnBeforeStartTicking());
        a.AddRuntimeComponentMessageHandler("runtime", "debug-highlight", d => this._OnDebugHighlight(d));
        a.AddRuntimeComponentMessageHandler("runtime", "enable-device-orientation", () => this._AttachDeviceOrientationEvent());
        a.AddRuntimeComponentMessageHandler("runtime", "enable-device-motion", () => this._AttachDeviceMotionEvent());
        a.AddRuntimeComponentMessageHandler("runtime", "add-stylesheet", d => this._OnAddStylesheet(d));
        a.AddRuntimeComponentMessageHandler("runtime", "script-create-worker", d => this._OnScriptCreateWorker(d));
        a.AddRuntimeComponentMessageHandler("runtime", "alert", d => this._OnAlert(d));
        a.AddRuntimeComponentMessageHandler("runtime", "screen-reader-text", d => this._OnScreenReaderTextEvent(d));
        a.AddRuntimeComponentMessageHandler("runtime",
            "hide-cordova-splash", () => this._OnHideCordovaSplash());
        a.AddRuntimeComponentMessageHandler("runtime", "set-exporting-to-video", d => this._SetExportingToVideo(d));
        a.AddRuntimeComponentMessageHandler("runtime", "export-to-video-progress", d => this._OnExportVideoProgress(d));
        a.AddRuntimeComponentMessageHandler("runtime", "exported-to-video", d => this._OnExportedToVideo(d));
        a.AddRuntimeComponentMessageHandler("runtime", "exported-to-image-sequence", d => this._OnExportedToImageSequence(d));
        const b = new Set(["input",
            "textarea", "datalist"
        ]);
        window.addEventListener("contextmenu", d => {
            const e = d.target,
                f = e.tagName.toLowerCase();
            b.has(f) || IsInContentEditable(e) || d.preventDefault()
        });
        const c = a.GetCanvas();
        window.addEventListener("selectstart", PreventDefaultOnCanvasOrDoc);
        window.addEventListener("gesturehold", PreventDefaultOnCanvasOrDoc);
        c.addEventListener("selectstart", PreventDefaultOnCanvasOrDoc);
        c.addEventListener("gesturehold", PreventDefaultOnCanvasOrDoc);
        window.addEventListener("touchstart", PreventDefaultOnCanvasOrDoc, {
            passive: !1
        });
        "undefined" !== typeof PointerEvent ? (window.addEventListener("pointerdown", PreventDefaultOnCanvasOrDoc, {
            passive: !1
        }), c.addEventListener("pointerdown", PreventDefaultOnCanvasOrDoc)) : c.addEventListener("touchstart", PreventDefaultOnCanvasOrDoc);
        this._mousePointerLastButtons = 0;
        window.addEventListener("mousedown", d => {
            1 === d.button && d.preventDefault()
        });
        window.addEventListener("mousewheel", BlockWheelZoom, {
            passive: !1
        });
        window.addEventListener("wheel", BlockWheelZoom, {
            passive: !1
        });
        window.addEventListener("resize",
            () => this._OnWindowResize());
        window.addEventListener("fullscreenchange", () => this._OnFullscreenChange());
        window.addEventListener("webkitfullscreenchange", () => this._OnFullscreenChange());
        window.addEventListener("mozfullscreenchange", () => this._OnFullscreenChange());
        window.addEventListener("fullscreenerror", d => this._OnFullscreenError(d));
        window.addEventListener("webkitfullscreenerror", d => this._OnFullscreenError(d));
        window.addEventListener("mozfullscreenerror", d => this._OnFullscreenError(d));
        if (a.IsiOSWebView())
            if (window.visualViewport) {
                let d =
                    Infinity;
                window.visualViewport.addEventListener("resize", () => {
                    const e = window.visualViewport.height;
                    e > d && (document.scrollingElement.scrollTop = 0);
                    d = e
                })
            } else window.addEventListener("focusout", () => {
                KeyboardIsVisible() || (document.scrollingElement.scrollTop = 0)
            });
        this._mediaPendingPlay = new Set;
        this._mediaRemovedPendingPlay = new WeakSet;
        this._isSilent = !1
    }
    _OnBeforeStartTicking() {
        self.setTimeout(() => {
            this._enableAndroidVKDetection = !0
        }, 1E3);
        "cordova" === this._iRuntime.GetExportType() ? (document.addEventListener("pause",
            () => this._OnVisibilityChange(!0)), document.addEventListener("resume", () => this._OnVisibilityChange(!1))) : document.addEventListener("visibilitychange", () => this._OnVisibilityChange("hidden" === document.visibilityState));
        this._pageVisibilityIsHidden = !("hidden" !== document.visibilityState && !isCordovaPaused);
        return {
            isSuspended: this._pageVisibilityIsHidden
        }
    }
    Attach() {
        window.addEventListener("focus", () => this._PostRuntimeEvent("window-focus"));
        window.addEventListener("blur", () => {
            this._PostRuntimeEvent("window-blur", {
                parentHasFocus: ParentHasFocus()
            });
            this._mousePointerLastButtons = 0
        });
        window.addEventListener("focusin", b => {
            IsKeyboardInputElement(b.target) && this._PostRuntimeEvent("keyboard-blur")
        });
        window.addEventListener("keydown", b => this._OnKeyEvent("keydown", b));
        window.addEventListener("keyup", b => this._OnKeyEvent("keyup", b));
        window.addEventListener("dblclick", b => this._OnMouseEvent("dblclick", b, DISPATCH_RUNTIME_AND_SCRIPT));
        window.addEventListener("wheel", b => this._OnMouseWheelEvent("wheel", b));
        "undefined" !== typeof PointerEvent ?
            (window.addEventListener("pointerdown", b => {
                this._HandlePointerDownFocus(b);
                this._OnPointerEvent("pointerdown", b)
            }), this._iRuntime.UsesWorker() && "undefined" !== typeof window.onpointerrawupdate && self === self.top ? window.addEventListener("pointerrawupdate", b => this._OnPointerRawUpdate(b)) : window.addEventListener("pointermove", b => this._OnPointerEvent("pointermove", b)), window.addEventListener("pointerup", b => this._OnPointerEvent("pointerup", b)), window.addEventListener("pointercancel", b => this._OnPointerEvent("pointercancel",
                b))) : (window.addEventListener("mousedown", b => {
                this._HandlePointerDownFocus(b);
                this._OnMouseEventAsPointer("pointerdown", b)
            }), window.addEventListener("mousemove", b => this._OnMouseEventAsPointer("pointermove", b)), window.addEventListener("mouseup", b => this._OnMouseEventAsPointer("pointerup", b)), window.addEventListener("touchstart", b => {
                this._HandlePointerDownFocus(b);
                this._OnTouchEvent("pointerdown", b)
            }), window.addEventListener("touchmove", b => this._OnTouchEvent("pointermove", b)), window.addEventListener("touchend",
                b => this._OnTouchEvent("pointerup", b)), window.addEventListener("touchcancel", b => this._OnTouchEvent("pointercancel", b)));
        const a = () => this._PlayPendingMedia();
        window.addEventListener("pointerup", a, !0);
        window.addEventListener("touchend", a, !0);
        window.addEventListener("click", a, !0);
        window.addEventListener("keydown", a, !0);
        window.addEventListener("gamepadconnected", a, !0);
        this._iRuntime.IsAndroid() && !this._iRuntime.IsAndroidWebView() && navigator.virtualKeyboard && (navigator.virtualKeyboard.overlaysContent = !0,
            navigator.virtualKeyboard.addEventListener("geometrychange", () => {
                this._OnAndroidVirtualKeyboardChange(this._GetWindowInnerHeight(), navigator.virtualKeyboard.boundingRect.height)
            }))
    }
    _OnAndroidVirtualKeyboardChange(a, b) {
        document.body.style.transform = "";
        this._vkTranslateYOffset = 0;
        if (0 < b) {
            var c = document.activeElement;
            c && (c = c.getBoundingClientRect(), a = (c.top + c.bottom) / 2 - (a - b) / 2, a > b && (a = b), 0 > a && (a = 0), 0 < a && (document.body.style.transform = `translateY(${-a}px)`, this._vkTranslateYOffset = a))
        }
    }
    _PostRuntimeEvent(a,
        b) {
        this.PostToRuntime(a, b || null, DISPATCH_RUNTIME_ONLY)
    }
    _GetWindowInnerWidth() {
        return this._iRuntime._GetWindowInnerWidth()
    }
    _GetWindowInnerHeight() {
        return this._iRuntime._GetWindowInnerHeight()
    }
    _EnableWindowResizeEvent() {
        this._enableWindowResizeEvent = !0;
        this._lastWindowWidth = this._iRuntime._GetWindowInnerWidth();
        this._lastWindowHeight = this._iRuntime._GetWindowInnerHeight()
    }
    _OnWindowResize() {
        if (!this._isExportToVideo && this._enableWindowResizeEvent) {
            var a = this._GetWindowInnerWidth(),
                b = this._GetWindowInnerHeight();
            if (this._iRuntime.IsAndroidWebView()) {
                if (this._enableAndroidVKDetection) {
                    if (this._lastWindowWidth === a && b < this._lastWindowHeight) {
                        this._virtualKeyboardHeight = this._lastWindowHeight - b;
                        this._OnAndroidVirtualKeyboardChange(this._lastWindowHeight, this._virtualKeyboardHeight);
                        return
                    }
                    0 < this._virtualKeyboardHeight && (this._virtualKeyboardHeight = 0, this._OnAndroidVirtualKeyboardChange(b, this._virtualKeyboardHeight))
                }
                this._lastWindowWidth = a;
                this._lastWindowHeight = b
            }
            this.PostToRuntime("window-resize", {
                innerWidth: a,
                innerHeight: b,
                devicePixelRatio: window.devicePixelRatio,
                isFullscreen: RuntimeInterface$jscomp$1.IsDocumentFullscreen()
            });
            this._iRuntime.IsiOSWebView() && (-1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId), this._OnSimulatedResize(a, b, 0))
        }
    }
    _ScheduleSimulatedResize(a, b, c) {
        -1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId);
        this._simulatedResizeTimerId = setTimeout(() => this._OnSimulatedResize(a, b, c), 48)
    }
    _OnSimulatedResize(a, b, c) {
        const d = this._GetWindowInnerWidth(),
            e = this._GetWindowInnerHeight();
        this._simulatedResizeTimerId = -1;
        d != a || e != b ? this.PostToRuntime("window-resize", {
            innerWidth: d,
            innerHeight: e,
            devicePixelRatio: window.devicePixelRatio,
            isFullscreen: RuntimeInterface$jscomp$1.IsDocumentFullscreen()
        }) : 10 > c && this._ScheduleSimulatedResize(d, e, c + 1)
    }
    _OnSetTargetOrientation(a) {
        this._targetOrientation = a.targetOrientation
    }
    _TrySetTargetOrientation() {
        const a = this._targetOrientation;
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock(a).catch(b => console.warn("[Construct] Failed to lock orientation: ",
            b));
        else try {
            let b = !1;
            screen.lockOrientation ? b = screen.lockOrientation(a) : screen.webkitLockOrientation ? b = screen.webkitLockOrientation(a) : screen.mozLockOrientation ? b = screen.mozLockOrientation(a) : screen.msLockOrientation && (b = screen.msLockOrientation(a));
            b || console.warn("[Construct] Failed to lock orientation")
        } catch (b) {
            console.warn("[Construct] Failed to lock orientation: ", b)
        }
    }
    _OnFullscreenChange() {
        if (!this._isExportToVideo) {
            var a = RuntimeInterface$jscomp$1.IsDocumentFullscreen();
            a && "any" !== this._targetOrientation &&
                this._TrySetTargetOrientation();
            this.PostToRuntime("fullscreenchange", {
                isFullscreen: a,
                innerWidth: this._GetWindowInnerWidth(),
                innerHeight: this._GetWindowInnerHeight()
            })
        }
    }
    _OnFullscreenError(a) {
        console.warn("[Construct] Fullscreen request failed: ", a);
        this.PostToRuntime("fullscreenerror", {
            isFullscreen: RuntimeInterface$jscomp$1.IsDocumentFullscreen(),
            innerWidth: this._GetWindowInnerWidth(),
            innerHeight: this._GetWindowInnerHeight()
        })
    }
    _OnVisibilityChange(a) {
        this._pageVisibilityIsHidden !== a && ((this._pageVisibilityIsHidden =
            a) ? this._iRuntime._CancelAnimationFrame() : this._iRuntime._RequestAnimationFrame(), this.PostToRuntime("visibilitychange", {
            hidden: a
        }))
    }
    _OnKeyEvent(a, b) {
        "Backspace" === b.key && PreventDefaultOnCanvasOrDoc(b);
        if (!this._isExportToVideo) {
            var c = KEY_CODE_ALIASES.get(b.code) || b.code;
            this._PostToRuntimeMaybeSync(a, {
                code: c,
                key: b.key,
                which: b.which,
                repeat: b.repeat,
                altKey: b.altKey,
                ctrlKey: b.ctrlKey,
                metaKey: b.metaKey,
                shiftKey: b.shiftKey,
                timeStamp: b.timeStamp
            }, DISPATCH_RUNTIME_AND_SCRIPT)
        }
    }
    _OnMouseWheelEvent(a, b) {
        this._isExportToVideo ||
            this.PostToRuntime(a, {
                clientX: b.clientX,
                clientY: b.clientY + this._vkTranslateYOffset,
                pageX: b.pageX,
                pageY: b.pageY + this._vkTranslateYOffset,
                deltaX: b.deltaX,
                deltaY: b.deltaY,
                deltaZ: b.deltaZ,
                deltaMode: b.deltaMode,
                timeStamp: b.timeStamp
            }, DISPATCH_RUNTIME_AND_SCRIPT)
    }
    _OnMouseEvent(a, b, c) {
        this._isExportToVideo || IsCompatibilityMouseEvent(b) || this._PostToRuntimeMaybeSync(a, {
            button: b.button,
            buttons: b.buttons,
            clientX: b.clientX,
            clientY: b.clientY + this._vkTranslateYOffset,
            pageX: b.pageX,
            pageY: b.pageY + this._vkTranslateYOffset,
            movementX: b.movementX || 0,
            movementY: b.movementY || 0,
            timeStamp: b.timeStamp
        }, c)
    }
    _OnMouseEventAsPointer(a, b) {
        if (!this._isExportToVideo && !IsCompatibilityMouseEvent(b)) {
            var c = this._mousePointerLastButtons;
            "pointerdown" === a && 0 !== c ? a = "pointermove" : "pointerup" === a && 0 !== b.buttons && (a = "pointermove");
            this._PostToRuntimeMaybeSync(a, {
                pointerId: 1,
                pointerType: "mouse",
                button: b.button,
                buttons: b.buttons,
                lastButtons: c,
                clientX: b.clientX,
                clientY: b.clientY + this._vkTranslateYOffset,
                pageX: b.pageX,
                pageY: b.pageY + this._vkTranslateYOffset,
                movementX: b.movementX || 0,
                movementY: b.movementY || 0,
                width: 0,
                height: 0,
                pressure: 0,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                twist: 0,
                timeStamp: b.timeStamp
            }, DISPATCH_RUNTIME_AND_SCRIPT);
            this._mousePointerLastButtons = b.buttons;
            this._OnMouseEvent(b.type, b, DISPATCH_SCRIPT_ONLY)
        }
    }
    _OnPointerEvent(a, b) {
        if (!this._isExportToVideo) {
            var c = 0;
            "mouse" === b.pointerType && (c = this._mousePointerLastButtons);
            this._PostToRuntimeMaybeSync(a, {
                pointerId: b.pointerId,
                pointerType: b.pointerType,
                button: b.button,
                buttons: b.buttons,
                lastButtons: c,
                clientX: b.clientX,
                clientY: b.clientY + this._vkTranslateYOffset,
                pageX: b.pageX,
                pageY: b.pageY + this._vkTranslateYOffset,
                movementX: b.movementX || 0,
                movementY: b.movementY || 0,
                width: b.width || 0,
                height: b.height || 0,
                pressure: b.pressure || 0,
                tangentialPressure: b.tangentialPressure || 0,
                tiltX: b.tiltX || 0,
                tiltY: b.tiltY || 0,
                twist: b.twist || 0,
                timeStamp: b.timeStamp
            }, DISPATCH_RUNTIME_AND_SCRIPT);
            "mouse" === b.pointerType && (c = "mousemove", "pointerdown" === a ? c = "mousedown" : "pointerup" === a && (c = "mouseup"), this._OnMouseEvent(c, b, DISPATCH_SCRIPT_ONLY),
                this._mousePointerLastButtons = b.buttons)
        }
    }
    _OnPointerRawUpdate(a) {
        this._OnPointerEvent("pointermove", a)
    }
    _OnTouchEvent(a, b) {
        if (!this._isExportToVideo)
            for (let c = 0, d = b.changedTouches.length; c < d; ++c) {
                const e = b.changedTouches[c];
                this._PostToRuntimeMaybeSync(a, {
                    pointerId: e.identifier,
                    pointerType: "touch",
                    button: 0,
                    buttons: 0,
                    lastButtons: 0,
                    clientX: e.clientX,
                    clientY: e.clientY + this._vkTranslateYOffset,
                    pageX: e.pageX,
                    pageY: e.pageY + this._vkTranslateYOffset,
                    movementX: b.movementX || 0,
                    movementY: b.movementY || 0,
                    width: 2 *
                        (e.radiusX || e.webkitRadiusX || 0),
                    height: 2 * (e.radiusY || e.webkitRadiusY || 0),
                    pressure: e.force || e.webkitForce || 0,
                    tangentialPressure: 0,
                    tiltX: 0,
                    tiltY: 0,
                    twist: e.rotationAngle || 0,
                    timeStamp: b.timeStamp
                }, DISPATCH_RUNTIME_AND_SCRIPT)
            }
    }
    _HandlePointerDownFocus(a) {
        window !== window.top && window.focus();
        this._IsElementCanvasOrDocument(a.target) && document.activeElement && !this._IsElementCanvasOrDocument(document.activeElement) && document.activeElement.blur()
    }
    _IsElementCanvasOrDocument(a) {
        return !a || a === document || a === window ||
            a === document.body || "canvas" === a.tagName.toLowerCase()
    }
    _AttachDeviceOrientationEvent() {
        this._attachedDeviceOrientationEvent || (this._attachedDeviceOrientationEvent = !0, window.addEventListener("deviceorientation", a => this._OnDeviceOrientation(a)), window.addEventListener("deviceorientationabsolute", a => this._OnDeviceOrientationAbsolute(a)))
    }
    _AttachDeviceMotionEvent() {
        this._attachedDeviceMotionEvent || (this._attachedDeviceMotionEvent = !0, window.addEventListener("devicemotion", a => this._OnDeviceMotion(a)))
    }
    _OnDeviceOrientation(a) {
        this._isExportToVideo ||
            this.PostToRuntime("deviceorientation", {
                absolute: !!a.absolute,
                alpha: a.alpha || 0,
                beta: a.beta || 0,
                gamma: a.gamma || 0,
                timeStamp: a.timeStamp,
                webkitCompassHeading: a.webkitCompassHeading,
                webkitCompassAccuracy: a.webkitCompassAccuracy
            }, DISPATCH_RUNTIME_AND_SCRIPT)
    }
    _OnDeviceOrientationAbsolute(a) {
        this._isExportToVideo || this.PostToRuntime("deviceorientationabsolute", {
            absolute: !!a.absolute,
            alpha: a.alpha || 0,
            beta: a.beta || 0,
            gamma: a.gamma || 0,
            timeStamp: a.timeStamp
        }, DISPATCH_RUNTIME_AND_SCRIPT)
    }
    _OnDeviceMotion(a) {
        if (!this._isExportToVideo) {
            var b =
                null,
                c = a.acceleration;
            c && (b = {
                x: c.x || 0,
                y: c.y || 0,
                z: c.z || 0
            });
            c = null;
            var d = a.accelerationIncludingGravity;
            d && (c = {
                x: d.x || 0,
                y: d.y || 0,
                z: d.z || 0
            });
            d = null;
            var e = a.rotationRate;
            e && (d = {
                alpha: e.alpha || 0,
                beta: e.beta || 0,
                gamma: e.gamma || 0
            });
            this.PostToRuntime("devicemotion", {
                acceleration: b,
                accelerationIncludingGravity: c,
                rotationRate: d,
                interval: a.interval,
                timeStamp: a.timeStamp
            }, DISPATCH_RUNTIME_AND_SCRIPT)
        }
    }
    _OnUpdateCanvasSize(a) {
        var b = this.GetRuntimeInterface();
        b.IsExportingToVideo() || (b = b.GetCanvas(), b.style.width =
            a.styleWidth + "px", b.style.height = a.styleHeight + "px", b.style.marginLeft = a.marginLeft + "px", b.style.marginTop = a.marginTop + "px", document.documentElement.style.setProperty("--construct-scale", a.displayScale), this._isFirstSizeUpdate && (b.style.display = "", this._isFirstSizeUpdate = !1))
    }
    _OnInvokeDownload(a) {
        const b = a.url;
        a = a.filename;
        const c = document.createElement("a"),
            d = document.body;
        c.textContent = a;
        c.href = b;
        c.download = a;
        d.appendChild(c);
        c.click();
        d.removeChild(c)
    }
    async _OnLoadWebFonts(a) {
        await Promise.all(a.webfonts.map(async b => {
            b = new FontFace(b.name, `url('${b.url}')`);
            document.fonts.add(b);
            await b.load()
        }))
    }
    async _OnRasterSvgImage(a) {
        var b = a.imageBitmapOpts;
        a = await self.C3_RasterSvgImageBlob(a.blob, a.imageWidth, a.imageHeight, a.surfaceWidth, a.surfaceHeight);
        b = b ? await createImageBitmap(a, b) : await createImageBitmap(a);
        return {
            imageBitmap: b,
            transferables: [b]
        }
    }
    async _OnGetSvgImageSize(a) {
        return await self.C3_GetSvgImageSize(a.blob)
    }
    async _OnAddStylesheet(a) {
        await AddStyleSheet(a.url)
    }
    _PlayPendingMedia() {
        var a = [...this._mediaPendingPlay];
        this._mediaPendingPlay.clear();
        if (!this._isSilent)
            for (const b of a)(a = b.play()) && a.catch(c => {
                this._mediaRemovedPendingPlay.has(b) || this._mediaPendingPlay.add(b)
            })
    }
    TryPlayMedia(a) {
        if ("function" !== typeof a.play) throw Error("missing play function");
        this._mediaRemovedPendingPlay.delete(a);
        let b;
        try {
            b = a.play()
        } catch (c) {
            this._mediaPendingPlay.add(a);
            return
        }
        b && b.catch(c => {
            this._mediaRemovedPendingPlay.has(a) || this._mediaPendingPlay.add(a)
        })
    }
    RemovePendingPlay(a) {
        this._mediaPendingPlay.delete(a);
        this._mediaRemovedPendingPlay.add(a)
    }
    SetSilent(a) {
        this._isSilent = !!a
    }
    _OnHideCordovaSplash() {
        navigator.splashscreen && navigator.splashscreen.hide && navigator.splashscreen.hide()
    }
    _OnDebugHighlight(a) {
        if (a.show) {
            this._debugHighlightElem || (this._debugHighlightElem = document.createElement("div"), this._debugHighlightElem.id = "inspectOutline", document.body.appendChild(this._debugHighlightElem));
            var b = this._debugHighlightElem;
            b.style.display = "";
            b.style.left = a.left - 1 + "px";
            b.style.top = a.top - 1 + "px";
            b.style.width = a.width + 2 + "px";
            b.style.height = a.height + 2 + "px";
            b.textContent = a.name
        } else this._debugHighlightElem &&
            (this._debugHighlightElem.style.display = "none")
    }
    _OnRegisterSW() {
        window.C3_RegisterSW && window.C3_RegisterSW()
    }
    _OnPostToDebugger(a) {
        window.c3_postToMessagePort && (a.from = "runtime", window.c3_postToMessagePort(a))
    }
    _InvokeFunctionFromJS(a, b) {
        return this.PostToRuntimeAsync("js-invoke-function", {
            name: a,
            params: b
        })
    }
    _OnScriptCreateWorker(a) {
        const b = a.port2;
        (new Worker(a.url, a.opts)).postMessage({
            type: "construct-worker-init",
            port2: b
        }, [b])
    }
    _OnAlert(a) {
        alert(a.message)
    }
    _OnScreenReaderTextEvent(a) {
        var b = a.type;
        "create" === b ? (b = document.createElement("p"), b.id = "c3-sr-" + a.id, b.textContent = a.text, this._screenReaderTextWrap.appendChild(b)) : "update" === b ? (b = document.getElementById("c3-sr-" + a.id)) ? b.textContent = a.text : console.warn(`[Construct] Missing screen reader text with id ${a.id}`) : "release" === b ? (b = document.getElementById("c3-sr-" + a.id)) ? b.remove() : console.warn(`[Construct] Missing screen reader text with id ${a.id}`) : console.warn(`[Construct] Unknown screen reader text update '${b}'`)
    }
    _SetExportingToVideo(a) {
        this._isExportToVideo = !0;
        const b = document.createElement("h1");
        b.id = "exportToVideoMessage";
        b.textContent = a.message;
        document.body.prepend(b);
        document.body.classList.add("exportingToVideo");
        this.GetRuntimeInterface().GetCanvas().style.display = "";
        this._iRuntime.SetIsExportingToVideo(a.duration)
    }
    _OnExportVideoProgress(a) {
        this._exportVideoProgressMessage = a.message; - 1 === this._exportVideoUpdateTimerId && (this._exportVideoUpdateTimerId = setTimeout(() => this._DoUpdateExportVideoProgressMessage(), 250))
    }
    _DoUpdateExportVideoProgressMessage() {
        this._exportVideoUpdateTimerId = -1;
        const a = document.getElementById("exportToVideoMessage");
        a && (a.textContent = this._exportVideoProgressMessage)
    }
    _OnExportedToVideo(a) {
        window.c3_postToMessagePort({
            type: "exported-video",
            arrayBuffer: a.arrayBuffer,
            contentType: a.contentType,
            time: a.time
        })
    }
    _OnExportedToImageSequence(a) {
        window.c3_postToMessagePort({
            type: "exported-image-sequence",
            blobArr: a.blobArr,
            time: a.time,
            gif: a.gif
        })
    }
});
"use strict";
self.JobSchedulerDOM = class {
    constructor(a) {
        this._runtimeInterface = a;
        this._baseUrl = a.GetRuntimeBaseURL();
        "preview" === a.GetExportType() ? this._baseUrl += "workers/" : this._baseUrl += a.GetScriptFolder();
        this._maxNumWorkers = Math.min(navigator.hardwareConcurrency || 2, 16);
        this._dispatchWorker = null;
        this._jobWorkers = [];
        this._outputPort = this._inputPort = null
    }
    _GetWorkerScriptFolder() {
        return "playable-ad" === this._runtimeInterface.GetExportType() ? this._runtimeInterface.GetScriptFolder() : ""
    }
    async Init() {
        if (this._hasInitialised) throw Error("already initialised");
        this._hasInitialised = !0;
        var a = this._runtimeInterface._GetWorkerURL(this._GetWorkerScriptFolder() + "dispatchworker.js");
        this._dispatchWorker = await this._runtimeInterface.CreateWorker(a, this._baseUrl, {
            name: "DispatchWorker"
        });
        a = new MessageChannel;
        this._inputPort = a.port1;
        this._dispatchWorker.postMessage({
            type: "_init",
            "in-port": a.port2
        }, [a.port2]);
        this._outputPort = await this._CreateJobWorker()
    }
    async _CreateJobWorker() {
        const a = this._jobWorkers.length;
        var b = this._runtimeInterface._GetWorkerURL(this._GetWorkerScriptFolder() +
            "jobworker.js");
        b = await this._runtimeInterface.CreateWorker(b, this._baseUrl, {
            name: "JobWorker" + a
        });
        const c = new MessageChannel,
            d = new MessageChannel;
        this._dispatchWorker.postMessage({
            type: "_addJobWorker",
            port: c.port1
        }, [c.port1]);
        b.postMessage({
            type: "init",
            number: a,
            "dispatch-port": c.port2,
            "output-port": d.port2
        }, [c.port2, d.port2]);
        this._jobWorkers.push(b);
        return d.port1
    }
    GetPortData() {
        return {
            inputPort: this._inputPort,
            outputPort: this._outputPort,
            maxNumWorkers: this._maxNumWorkers
        }
    }
    GetPortTransferables() {
        return [this._inputPort,
            this._outputPort
        ]
    }
};
"use strict";
window.C3_IsSupported && (window.c3_runtimeInterface = new self.RuntimeInterface({
    useWorker: !1,
    workerMainUrl: "workermain.js",
    engineScripts: ["scripts/c3runtime.js"],
    projectScripts: [],
    mainProjectScript: "",
    scriptFolder: "scripts/",
    workerDependencyScripts: [],
    exportType: "html5"
}));
"use strict";
self.RuntimeInterface.AddDOMHandlerClass(class extends self.DOMHandler {
    constructor(a) {
        super(a, "touch");
        this.AddRuntimeMessageHandler("request-permission", b => this._OnRequestPermission(b))
    }
    async _OnRequestPermission(a) {
        a = a.type;
        let b = !0;
        0 === a ? b = await this._RequestOrientationPermission() : 1 === a && (b = await this._RequestMotionPermission());
        this.PostToRuntime("permission-result", {
            type: a,
            result: b
        })
    }
    async _RequestOrientationPermission() {
        if (!self.DeviceOrientationEvent || !self.DeviceOrientationEvent.requestPermission) return !0;
        try {
            return "granted" === await self.DeviceOrientationEvent.requestPermission()
        } catch (a) {
            return console.warn("[Touch] Failed to request orientation permission: ", a), !1
        }
    }
    async _RequestMotionPermission() {
        if (!self.DeviceMotionEvent || !self.DeviceMotionEvent.requestPermission) return !0;
        try {
            return "granted" === await self.DeviceMotionEvent.requestPermission()
        } catch (a) {
            return console.warn("[Touch] Failed to request motion permission: ", a), !1
        }
    }
});
"use strict";
const R_TO_D = 180 / Math.PI;
self.AudioDOMHandler = class extends self.DOMHandler {
    constructor(a) {
        super(a, "audio");
        this._destinationNode = this._audioContext = null;
        this._hasAttachedUnblockEvents = this._hasUnblocked = !1;
        this._unblockFunc = () => this._UnblockAudioContext();
        this._audioBuffers = [];
        this._audioInstances = [];
        this._lastAudioInstance = null;
        this._lastPlayedTags = [];
        this._loadedAudioUrls = new Set;
        this._lastTickCount = -1;
        this._pendingTags = new Map;
        this._masterVolume = 1;
        this._isSilent = !1;
        this._timeScaleMode = 0;
        this._timeScale = 1;
        this._gameTime =
            0;
        this._panningModel = "HRTF";
        this._distanceModel = "inverse";
        this._refDistance = 600;
        this._maxDistance = 1E4;
        this._rolloffFactor = 1;
        this._lastListenerPos = [0, 0, 0];
        this._lastListenerOrientation = [0, 0, -1, 0, 1, 0];
        this._hasAnySoftwareDecodedMusic = this._playMusicAsSound = !1;
        this._supportsWebMOpus = this._iRuntime.IsAudioFormatSupported("audio/webm; codecs=opus");
        this._effects = new Map;
        this._analysers = new Set;
        this._hasStartedOfflineRender = this._isPendingPostFxState = !1;
        this._microphoneTag = "";
        this._microphoneSource = null;
        self.C3Audio_OnMicrophoneStream = (b, c) => this._OnMicrophoneStream(b, c);
        this._destMediaStreamNode = null;
        self.C3Audio_GetOutputStream = () => this._OnGetOutputStream();
        self.C3Audio_DOMInterface = this;
        this.AddRuntimeMessageHandlers([
            ["create-audio-context", b => this._CreateAudioContext(b)],
            ["play", b => this._Play(b)],
            ["stop", b => this._Stop(b)],
            ["stop-all", () => this._StopAll()],
            ["set-paused", b => this._SetPaused(b)],
            ["set-volume", b => this._SetVolume(b)],
            ["fade-volume", b => this._FadeVolume(b)],
            ["set-master-volume", b => this._SetMasterVolume(b)],
            ["set-muted", b => this._SetMuted(b)],
            ["set-silent", b => this._SetSilent(b)],
            ["set-looping", b => this._SetLooping(b)],
            ["set-playback-rate", b => this._SetPlaybackRate(b)],
            ["set-stereo-pan", b => this._SetStereoPan(b)],
            ["seek", b => this._Seek(b)],
            ["preload", b => this._Preload(b)],
            ["unload", b => this._Unload(b)],
            ["unload-all", () => this._UnloadAll()],
            ["set-suspended", b => this._SetSuspended(b)],
            ["add-effect", b => this._AddEffect(b)],
            ["set-effect-param", b => this._SetEffectParam(b)],
            ["remove-effects", b => this._RemoveEffects(b)],
            ["tick", b => this._OnTick(b)],
            ["load-state", b => this._OnLoadState(b)],
            ["offline-render-audio", b => this._OnOfflineRenderAudio(b)],
            ["offline-render-finish", () => this._OnOfflineRenderFinish()]
        ])
    }
    async _CreateAudioContext(a) {
        if (a.isiOSCordova || a.isSafari) this._playMusicAsSound = !0;
        this._timeScaleMode = a.timeScaleMode;
        this._panningModel = ["equalpower", "HRTF", "soundfield"][a.panningModel];
        this._distanceModel = ["linear", "inverse", "exponential"][a.distanceModel];
        this._refDistance = a.refDistance;
        this._maxDistance = a.maxDistance;
        this._rolloffFactor = a.rolloffFactor;
        if (this._iRuntime.IsExportingToVideo()) this._playMusicAsSound = !0, this._audioContext = new OfflineAudioContext({
            numberOfChannels: 2,
            sampleRate: 48E3,
            length: Math.ceil(48E3 * this._iRuntime.GetExportToVideoDuration())
        });
        else {
            var b = {
                latencyHint: a.latencyHint
            };
            this.SupportsWebMOpus() || (b.sampleRate = 48E3);
            if ("undefined" !== typeof AudioContext) this._audioContext = new AudioContext(b);
            else if ("undefined" !== typeof webkitAudioContext) this._audioContext = new webkitAudioContext(b);
            else throw Error("Web Audio API not supported");
            this._AttachUnblockEvents();
            this._audioContext.onstatechange = () => {
                "running" !== this._audioContext.state && this._AttachUnblockEvents();
                this.PostToRuntime("audiocontext-state", {
                    audioContextState: this._audioContext.state
                })
            }
        }
        this._destinationNode = this._audioContext.createGain();
        this._destinationNode.connect(this._audioContext.destination);
        b = a.listenerPos;
        this._lastListenerPos[0] = b[0];
        this._lastListenerPos[1] = b[1];
        this._lastListenerPos[2] = b[2];
        this._audioContext.listener.setPosition(b[0], b[1], b[2]);
        this._audioContext.listener.setOrientation(...this._lastListenerOrientation);
        self.C3_GetAudioContextCurrentTime = () => this.GetAudioCurrentTime();
        try {
            await Promise.all(a.preloadList.map(c => this._GetAudioBuffer(c.originalUrl, c.url, c.type, !1)))
        } catch (c) {
            console.error("[Construct] Preloading sounds failed: ", c)
        }
        return {
            sampleRate: this._audioContext.sampleRate,
            audioContextState: this._audioContext.state,
            outputLatency: this._audioContext.outputLatency || 0
        }
    }
    _AttachUnblockEvents() {
        this._hasAttachedUnblockEvents || (this._hasUnblocked = !1, window.addEventListener("pointerup", this._unblockFunc, !0), window.addEventListener("touchend", this._unblockFunc, !0), window.addEventListener("click", this._unblockFunc, !0), window.addEventListener("keydown", this._unblockFunc, !0), this._hasAttachedUnblockEvents = !0)
    }
    _DetachUnblockEvents() {
        this._hasAttachedUnblockEvents && (this._hasUnblocked = !0, window.removeEventListener("pointerup", this._unblockFunc, !0), window.removeEventListener("touchend", this._unblockFunc, !0), window.removeEventListener("click", this._unblockFunc, !0), window.removeEventListener("keydown", this._unblockFunc, !0), this._hasAttachedUnblockEvents = !1)
    }
    _UnblockAudioContext() {
        if (!this._hasUnblocked) {
            var a = this._audioContext;
            "suspended" === a.state && a.resume && a.resume();
            var b = a.createBuffer(1, 220, 22050),
                c = a.createBufferSource();
            c.buffer = b;
            c.connect(a.destination);
            c.start(0);
            "running" === a.state && this._DetachUnblockEvents()
        }
    }
    _MatchTagLists(a, b) {
        for (const c of b) {
            b = !1;
            for (const d of a)
                if (self.AudioDOMHandler.EqualsNoCase(d, c)) {
                    b = !0;
                    break
                }
            if (!b) return !1
        }
        return !0
    }
    GetAudioContext() {
        return this._audioContext
    }
    GetAudioCurrentTime() {
        return this._audioContext.currentTime
    }
    GetDestinationNode() {
        return this._destinationNode
    }
    GetAudioContextExtern() {
        return this.GetAudioContext()
    }
    GetDestinationNodeExtern() {
        return this.GetDestinationNode()
    }
    GetDestinationForTag(a) {
        return (a =
            this._effects.get(a.toLowerCase())) ? a[0].GetInputNode() : this.GetDestinationNode()
    }
    AddEffectForTag(a, b) {
        a = a.toLowerCase();
        let c = this._effects.get(a);
        c || (c = [], this._effects.set(a, c));
        b._SetIndex(c.length);
        b._SetTag(a);
        c.push(b);
        this._ReconnectEffects(a)
    }
    _ReconnectEffects(a) {
        a = a.toLowerCase();
        let b = this.GetDestinationNode();
        const c = this._effects.get(a);
        if (c && c.length) {
            b = c[0].GetInputNode();
            for (let d = 0, e = c.length; d < e; ++d) {
                const f = c[d];
                d + 1 === e ? f.ConnectTo(this.GetDestinationNode()) : f.ConnectTo(c[d + 1].GetInputNode())
            }
        }
        for (const d of this.audioInstancesByEffectTag(a)) d.Reconnect(b);
        this._microphoneSource && this._microphoneTag === a && (this._microphoneSource.disconnect(), this._microphoneSource.connect(b))
    }
    GetMasterVolume() {
        return this._masterVolume
    }
    IsSilent() {
        return this._isSilent
    }
    GetTimeScaleMode() {
        return this._timeScaleMode
    }
    GetTimeScale() {
        return this._timeScale
    }
    GetGameTime() {
        return this._gameTime
    }
    IsPlayMusicAsSound() {
        return this._playMusicAsSound
    }
    SupportsWebMOpus() {
        return this._supportsWebMOpus
    }
    _SetHasAnySoftwareDecodedMusic() {
        this._hasAnySoftwareDecodedMusic = !0
    }
    GetPanningModel() {
        return this._panningModel
    }
    GetDistanceModel() {
        return this._distanceModel
    }
    GetReferenceDistance() {
        return this._refDistance
    }
    GetMaxDistance() {
        return this._maxDistance
    }
    GetRolloffFactor() {
        return this._rolloffFactor
    }
    DecodeAudioData(a,
        b) {
        return b ? this._iRuntime._WasmDecodeWebMOpus(a).then(c => {
            const d = this._audioContext.createBuffer(1, c.length, 48E3);
            d.getChannelData(0).set(c);
            return d
        }) : new Promise((c, d) => {
            this._audioContext.decodeAudioData(a, c, d)
        })
    }
    TryPlayMedia(a) {
        this._iRuntime.TryPlayMedia(a)
    }
    RemovePendingPlay(a) {
        this._iRuntime.RemovePendingPlay(a)
    }
    ReleaseInstancesForBuffer(a) {
        let b = 0;
        for (let c = 0, d = this._audioInstances.length; c < d; ++c) {
            const e = this._audioInstances[c];
            this._audioInstances[b] = e;
            e.GetBuffer() === a ? e.Release() : ++b
        }
        this._audioInstances.length =
            b
    }
    ReleaseAllMusicBuffers() {
        let a = 0;
        for (let b = 0, c = this._audioBuffers.length; b < c; ++b) {
            const d = this._audioBuffers[b];
            this._audioBuffers[a] = d;
            d.IsMusic() ? d.Release() : ++a
        }
        this._audioBuffers.length = a
    }* audioInstancesMatchingTags(a) {
        if (0 < a.length)
            for (const b of this._audioInstances) this._MatchTagLists(b.GetTags(), a) && (yield b);
        else this._lastAudioInstance && !this._lastAudioInstance.HasEnded() && (yield this._lastAudioInstance)
    }* audioInstancesByEffectTag(a) {
        if (a)
            for (const b of this._audioInstances) self.AudioDOMHandler.EqualsNoCase(b.GetEffectTag(),
                a) && (yield b);
        else this._lastAudioInstance && !this._lastAudioInstance.HasEnded() && (yield this._lastAudioInstance)
    }
    async _GetAudioBuffer(a, b, c, d, e) {
        for (const f of this._audioBuffers)
            if (f.GetUrl() === b) return await f.Load(), f;
        if (e) return null;
        d && (this._playMusicAsSound || this._hasAnySoftwareDecodedMusic) && this.ReleaseAllMusicBuffers();
        b = self.C3AudioBuffer.Create(this, a, b, c, d);
        this._audioBuffers.push(b);
        await b.Load();
        this._loadedAudioUrls.has(a) || (this.PostToRuntime("buffer-metadata", {
                originalUrl: a,
                duration: b.GetDuration()
            }),
            this._loadedAudioUrls.add(a));
        return b
    }
    async _GetAudioInstance(a, b, c, d, e) {
        for (const f of this._audioInstances)
            if (f.GetUrl() === b && (f.CanBeRecycled() || e)) return f.SetTags(d), f;
        a = (await this._GetAudioBuffer(a, b, c, e)).CreateInstance(d);
        this._audioInstances.push(a);
        return a
    }
    _AddPendingTags(a) {
        a = a.join(" ");
        let b = this._pendingTags.get(a);
        if (!b) {
            let c = null;
            b = {
                pendingCount: 0,
                promise: new Promise(d => c = d),
                resolve: c
            };
            this._pendingTags.set(a, b)
        }
        b.pendingCount++
    }
    _RemovePendingTags(a) {
        a = a.join(" ");
        const b = this._pendingTags.get(a);
        if (!b) throw Error("expected pending tag");
        b.pendingCount--;
        0 === b.pendingCount && (b.resolve(), this._pendingTags.delete(a))
    }
    TagsReady(a) {
        a = (0 === a.length ? this._lastPlayedTags : a).join(" ");
        return (a = this._pendingTags.get(a)) ? a.promise : Promise.resolve()
    }
    _MaybeStartTicking() {
        if (0 < this._analysers.size) this._StartTicking();
        else
            for (const a of this._audioInstances)
                if (a.IsActive()) {
                    this._StartTicking();
                    break
                }
    }
    Tick() {
        for (var a of this._analysers) a.Tick();
        a = this.GetAudioCurrentTime();
        for (var b of this._audioInstances) b.Tick(a);
        b = this._audioInstances.filter(c => c.IsActive()).map(c => c.GetState());
        this.PostToRuntime("state", {
            tickCount: this._lastTickCount,
            outputLatency: this._audioContext.outputLatency || 0,
            audioInstances: b,
            analysers: [...this._analysers].map(c => c.GetData())
        });
        0 === b.length && 0 === this._analysers.size && this._StopTicking()
    }
    PostTrigger(a, b, c) {
        this.PostToRuntime("trigger", {
            type: a,
            tags: b,
            aiid: c
        })
    }
    async _Play(a) {
        const b = a.originalUrl,
            c = a.url,
            d = a.type,
            e = a.isMusic,
            f = a.tags,
            g = a.isLooping,
            h = a.vol,
            k = a.pos,
            l = a.panning,
            m = a.stereoPan;
        let n = a.off;
        0 < n && !a.trueClock && (this._audioContext.getOutputTimestamp ? (a = this._audioContext.getOutputTimestamp(), n = n - a.performanceTime / 1E3 + a.contextTime) : n = n - performance.now() / 1E3 + this._audioContext.currentTime);
        this._lastPlayedTags = f.slice(0);
        this._AddPendingTags(f);
        try {
            this._lastAudioInstance = await this._GetAudioInstance(b, c, d, f, e), l ? (this._lastAudioInstance.SetPannerEnabled(!0), this._lastAudioInstance.SetPan(l.x, l.y, l.z, l.angle, l.innerAngle, l.outerAngle, l.outerGain), l.hasOwnProperty("uid") && this._lastAudioInstance.SetUID(l.uid)) :
                "number" === typeof m && 0 !== m ? (this._lastAudioInstance.SetStereoPannerEnabled(!0), this._lastAudioInstance.SetStereoPan(m)) : (this._lastAudioInstance.SetPannerEnabled(!1), this._lastAudioInstance.SetStereoPannerEnabled(!1)), this._lastAudioInstance.Play(g, h, k, n)
        } catch (p) {
            console.error("[Construct] Audio: error starting playback: ", p);
            return
        } finally {
            this._RemovePendingTags(f)
        }
        this._StartTicking()
    }
    _Stop(a) {
        a = a.tags;
        for (const b of this.audioInstancesMatchingTags(a)) b.Stop()
    }
    _StopAll() {
        for (const a of this._audioInstances) a.Stop()
    }
    _SetPaused(a) {
        const b =
            a.tags;
        a = a.paused;
        for (const c of this.audioInstancesMatchingTags(b)) a ? c.Pause() : c.Resume();
        this._MaybeStartTicking()
    }
    _SetVolume(a) {
        const b = a.tags;
        a = a.vol;
        for (const c of this.audioInstancesMatchingTags(b)) c.SetVolume(a)
    }
    _SetStereoPan(a) {
        const b = a.tags;
        a = a.p;
        for (const c of this.audioInstancesMatchingTags(b)) c.SetStereoPannerEnabled(!0), c.SetStereoPan(a)
    }
    async _FadeVolume(a) {
        const b = a.tags,
            c = a.vol,
            d = a.duration;
        a = a.stopOnEnd;
        await this.TagsReady(b);
        for (const e of this.audioInstancesMatchingTags(b)) e.FadeVolume(c,
            d, a);
        this._MaybeStartTicking()
    }
    _SetMasterVolume(a) {
        this._masterVolume = a.vol;
        this._destinationNode.gain.value = this._masterVolume
    }
    _SetMuted(a) {
        const b = a.tags;
        a = a.isMuted;
        for (const c of this.audioInstancesMatchingTags(b)) c.SetMuted(a)
    }
    _SetSilent(a) {
        this._isSilent = a.isSilent;
        this._iRuntime.SetSilent(this._isSilent);
        for (const b of this._audioInstances) b._UpdateMuted()
    }
    _SetLooping(a) {
        const b = a.tags;
        a = a.isLooping;
        for (const c of this.audioInstancesMatchingTags(b)) c.SetLooping(a)
    }
    async _SetPlaybackRate(a) {
        const b =
            a.tags;
        a = a.rate;
        await this.TagsReady(b);
        for (const c of this.audioInstancesMatchingTags(b)) c.SetPlaybackRate(a)
    }
    async _Seek(a) {
        const b = a.tags;
        a = a.pos;
        await this.TagsReady(b);
        for (const c of this.audioInstancesMatchingTags(b)) c.Seek(a)
    }
    async _Preload(a) {
        const b = a.originalUrl,
            c = a.url,
            d = a.type;
        a = a.isMusic;
        try {
            await this._GetAudioInstance(b, c, d, "", a)
        } catch (e) {
            console.error("[Construct] Audio: error preloading: ", e)
        }
    }
    async _Unload(a) {
        if (a = await this._GetAudioBuffer("", a.url, a.type, a.isMusic, !0)) a.Release(),
            a = this._audioBuffers.indexOf(a), -1 !== a && this._audioBuffers.splice(a, 1)
    }
    _UnloadAll() {
        for (const a of this._audioBuffers) a.Release();
        this._audioBuffers.length = 0
    }
    _SetSuspended(a) {
        a = a.isSuspended;
        !a && this._audioContext.resume && this._audioContext.resume();
        for (const b of this._audioInstances) b.SetSuspended(a);
        a && this._audioContext.suspend && this._audioContext.suspend()
    }
    _OnTick(a) {
        this._timeScale = a.timeScale;
        this._gameTime = a.gameTime;
        this._lastTickCount = a.tickCount;
        if (0 !== this._timeScaleMode)
            for (var b of this._audioInstances) b._UpdatePlaybackRate();
        !(b = a.listenerPos) || this._lastListenerPos[0] === b[0] && this._lastListenerPos[1] === b[1] && this._lastListenerPos[2] === b[2] || (this._lastListenerPos[0] = b[0], this._lastListenerPos[1] = b[1], this._lastListenerPos[2] = b[2], this._audioContext.listener.setPosition(b[0], b[1], b[2]));
        if ((b = a.listenerOrientation) && (this._lastListenerOrientation[0] !== b[0] || this._lastListenerOrientation[1] !== b[1] || this._lastListenerOrientation[2] !== b[2] || this._lastListenerOrientation[3] !== b[3] || this._lastListenerOrientation[4] !== b[4] ||
                this._lastListenerOrientation[5] !== b[5])) {
            for (let c = 0; 6 > c; ++c) this._lastListenerOrientation[c] = b[c];
            this._audioContext.listener.setOrientation(...this._lastListenerOrientation)
        }
        for (const c of a.instPans) {
            a = c.uid;
            for (const d of this._audioInstances) d.GetUID() === a && d.SetPanXYZA(c.x, c.y, c.z, c.angle)
        }
    }
    async _AddEffect(a) {
        const b = a.type;
        var c = a.tags;
        const d = a.params;
        let e;
        if ("convolution" === b) try {
            e = await this._GetAudioBuffer(a.bufferOriginalUrl, a.bufferUrl, a.bufferType, !1)
        } catch (f) {
            console.log("[Construct] Audio: error loading convolution: ",
                f);
            return
        }
        for (const f of c) {
            if ("filter" === b) c = new self.C3AudioFilterFX(this, ...d);
            else if ("delay" === b) c = new self.C3AudioDelayFX(this, ...d);
            else if ("convolution" === b) c = new self.C3AudioConvolveFX(this, e.GetAudioBuffer(), ...d), c._SetBufferInfo(a.bufferOriginalUrl, a.bufferUrl, a.bufferType);
            else if ("flanger" === b) c = new self.C3AudioFlangerFX(this, ...d);
            else if ("phaser" === b) c = new self.C3AudioPhaserFX(this, ...d);
            else if ("gain" === b) c = new self.C3AudioGainFX(this, ...d);
            else if ("stereopan" === b) c = new self.C3AudioStereoPanFX(this,
                ...d);
            else if ("tremolo" === b) c = new self.C3AudioTremoloFX(this, ...d);
            else if ("ringmod" === b) c = new self.C3AudioRingModFX(this, ...d);
            else if ("distortion" === b) c = new self.C3AudioDistortionFX(this, ...d);
            else if ("compressor" === b) c = new self.C3AudioCompressorFX(this, ...d);
            else if ("analyser" === b) c = new self.C3AudioAnalyserFX(this, ...d);
            else throw Error("invalid effect type");
            this.AddEffectForTag(f, c)
        }
        this._PostUpdatedFxState()
    }
    _SetEffectParam(a) {
        var b = a.tags;
        const c = a.index,
            d = a.param,
            e = a.value,
            f = a.ramp;
        a = a.time;
        for (const g of b) b = this._effects.get(g.toLowerCase()), !b || 0 > c || c >= b.length || b[c].SetParam(d, e, f, a);
        this._PostUpdatedFxState()
    }
    _RemoveEffects(a) {
        a = a.tags;
        for (const b of a) {
            a = b.toLowerCase();
            const c = this._effects.get(a);
            if (!c || !c.length) break;
            for (const d of c) d.Release();
            this._effects.delete(a);
            this._ReconnectEffects(a)
        }
    }
    _AddAnalyser(a) {
        this._analysers.add(a);
        this._MaybeStartTicking()
    }
    _RemoveAnalyser(a) {
        this._analysers.delete(a)
    }
    _PostUpdatedFxState() {
        this._isPendingPostFxState || (this._isPendingPostFxState = !0, Promise.resolve().then(() => this._DoPostUpdatedFxState()))
    }
    _DoPostUpdatedFxState() {
        const a = {};
        for (const [b, c] of this._effects) a[b] = c.map(d => d.GetState());
        this.PostToRuntime("fxstate", {
            fxstate: a
        });
        this._isPendingPostFxState = !1
    }
    async _OnLoadState(a) {
        const b = a.saveLoadMode;
        if (3 !== b) {
            var c = [];
            for (var d of this._audioInstances) d.IsMusic() && 1 === b || !d.IsMusic() && 2 === b ? c.push(d) : d.Release();
            this._audioInstances = c
        }
        for (const e of this._effects.values())
            for (const f of e) f.Release();
        this._effects.clear();
        this._timeScale =
            a.timeScale;
        this._gameTime = a.gameTime;
        c = a.listenerPos;
        this._lastListenerPos[0] = c[0];
        this._lastListenerPos[1] = c[1];
        this._lastListenerPos[2] = c[2];
        this._audioContext.listener.setPosition(c[0], c[1], c[2]);
        c = a.listenerOrientation;
        if (Array.isArray(c)) {
            for (d = 0; 6 > d; ++d) this._lastListenerOrientation[d] = c[d];
            this._audioContext.listener.setOrientation(...this._lastListenerOrientation)
        }
        this._isSilent = a.isSilent;
        this._iRuntime.SetSilent(this._isSilent);
        this._masterVolume = a.masterVolume;
        this._destinationNode.gain.value =
            this._masterVolume;
        c = [];
        for (const e of Object.values(a.effects)) c.push(Promise.all(e.map(f => this._AddEffect(f))));
        await Promise.all(c);
        await Promise.all(a.playing.map(e => this._LoadAudioInstance(e, b)));
        this._MaybeStartTicking()
    }
    async _LoadAudioInstance(a, b) {
        if (3 !== b) {
            var c = a.bufferOriginalUrl,
                d = a.bufferUrl,
                e = a.bufferType,
                f = a.isMusic,
                g = a.tags,
                h = a.isLooping,
                k = a.volume,
                l = a.playbackTime;
            if (!f || 1 !== b)
                if (f || 2 !== b) {
                    b = null;
                    try {
                        b = await this._GetAudioInstance(c, d, e, g, f)
                    } catch (m) {
                        console.error("[Construct] Audio: error loading audio state: ",
                            m);
                        return
                    }
                    b.LoadPanState(a.pan);
                    b.LoadStereoPanState(a.stereoPan);
                    b.Play(h, k, l, 0);
                    a.isPlaying || b.Pause();
                    b._LoadAdditionalState(a)
                }
        }
    }
    _OnMicrophoneStream(a, b) {
        this._microphoneSource && this._microphoneSource.disconnect();
        this._microphoneTag = b.toLowerCase();
        this._microphoneSource = this._audioContext.createMediaStreamSource(a);
        this._microphoneSource.connect(this.GetDestinationForTag(this._microphoneTag))
    }
    _OnGetOutputStream() {
        this._destMediaStreamNode || (this._destMediaStreamNode = this._audioContext.createMediaStreamDestination(),
            this._destinationNode.connect(this._destMediaStreamNode));
        return this._destMediaStreamNode.stream
    }
    async _OnOfflineRenderAudio(a) {
        try {
            const b = this._audioContext.suspend(a.time);
            this._hasStartedOfflineRender ? this._audioContext.resume() : (this._audioContext.startRendering().then(c => this._OnOfflineRenderCompleted(c)).catch(c => this._OnOfflineRenderError(c)), this._hasStartedOfflineRender = !0);
            await b
        } catch (b) {
            this._OnOfflineRenderError(b)
        }
    }
    _OnOfflineRenderFinish() {
        this._audioContext.resume()
    }
    _OnOfflineRenderCompleted(a) {
        const b = [];
        for (let c = 0, d = a.numberOfChannels; c < d; ++c) {
            const e = a.getChannelData(c);
            b.push(e.buffer)
        }
        this._iRuntime.PostToRuntimeComponent("runtime", "offline-audio-render-completed", {
            duration: a.duration,
            length: a.length,
            numberOfChannels: a.numberOfChannels,
            sampleRate: a.sampleRate,
            channelData: b
        }, null, b)
    }
    _OnOfflineRenderError(a) {
        console.error("[Audio] Offline rendering error: ", a)
    }
    static EqualsNoCase(a, b) {
        return a === b || a.normalize().toLowerCase() === b.normalize().toLowerCase()
    }
    static ToDegrees(a) {
        return a * R_TO_D
    }
    static DbToLinearNoCap(a) {
        return Math.pow(10,
            a / 20)
    }
    static DbToLinear(a) {
        return Math.max(Math.min(self.AudioDOMHandler.DbToLinearNoCap(a), 1), 0)
    }
    static LinearToDbNoCap(a) {
        return Math.log(a) / Math.log(10) * 20
    }
    static LinearToDb(a) {
        return self.AudioDOMHandler.LinearToDbNoCap(Math.max(Math.min(a, 1), 0))
    }
    static e4(a, b) {
        return 1 - Math.exp(-b * a)
    }
};
self.RuntimeInterface.AddDOMHandlerClass(self.AudioDOMHandler);
"use strict";
self.C3AudioBuffer = class {
    constructor(a, b, c, d, e) {
        this._audioDomHandler = a;
        this._originalUrl = b;
        this._url = c;
        this._type = d;
        this._isMusic = e;
        this._api = "";
        this._loadState = "not-loaded";
        this._loadPromise = null
    }
    Release() {
        this._loadState = "not-loaded";
        this._loadPromise = this._audioDomHandler = null
    }
    static Create(a, b, c, d, e) {
        const f = "audio/webm; codecs=opus" === d && !a.SupportsWebMOpus();
        e && f && a._SetHasAnySoftwareDecodedMusic();
        return !e || a.IsPlayMusicAsSound() || f ? new self.C3WebAudioBuffer(a, b, c, d, e, f) : new self.C3Html5AudioBuffer(a,
            b, c, d, e)
    }
    CreateInstance(a) {
        return "html5" === this._api ? new self.C3Html5AudioInstance(this._audioDomHandler, this, a) : new self.C3WebAudioInstance(this._audioDomHandler, this, a)
    }
    _Load() {}
    Load() {
        this._loadPromise || (this._loadPromise = this._Load());
        return this._loadPromise
    }
    IsLoaded() {}
    IsLoadedAndDecoded() {}
    HasFailedToLoad() {
        return "failed" === this._loadState
    }
    GetAudioContext() {
        return this._audioDomHandler.GetAudioContext()
    }
    GetApi() {
        return this._api
    }
    GetOriginalUrl() {
        return this._originalUrl
    }
    GetUrl() {
        return this._url
    }
    GetContentType() {
        return this._type
    }
    IsMusic() {
        return this._isMusic
    }
    GetDuration() {}
};
"use strict";
self.C3Html5AudioBuffer = class extends self.C3AudioBuffer {
    constructor(a, b, c, d, e) {
        super(a, b, c, d, e);
        this._api = "html5";
        this._audioElem = new Audio;
        this._audioElem.crossOrigin = "anonymous";
        this._audioElem.autoplay = !1;
        this._audioElem.preload = "auto";
        this._loadReject = this._loadResolve = null;
        this._reachedCanPlayThrough = !1;
        this._audioElem.addEventListener("canplaythrough", () => this._reachedCanPlayThrough = !0);
        this._outNode = this.GetAudioContext().createGain();
        this._mediaSourceNode = null;
        this._audioElem.addEventListener("canplay", () => {
            this._loadResolve && (this._loadState = "loaded", this._loadResolve(), this._loadReject = this._loadResolve = null);
            !this._mediaSourceNode && this._audioElem && (this._mediaSourceNode = this.GetAudioContext().createMediaElementSource(this._audioElem), this._mediaSourceNode.connect(this._outNode))
        });
        this.onended = null;
        this._audioElem.addEventListener("ended", () => {
            if (this.onended) this.onended()
        });
        this._audioElem.addEventListener("error", f => this._OnError(f))
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this);
        this._outNode.disconnect();
        this._outNode = null;
        this._mediaSourceNode.disconnect();
        this._mediaSourceNode = null;
        this._audioElem && !this._audioElem.paused && this._audioElem.pause();
        this._audioElem = this.onended = null;
        super.Release()
    }
    _Load() {
        this._loadState = "loading";
        return new Promise((a, b) => {
            this._loadResolve = a;
            this._loadReject = b;
            this._audioElem.src = this._url
        })
    }
    _OnError(a) {
        console.error(`[Construct] Audio '${this._url}' error: `, a);
        this._loadReject && (this._loadState = "failed", this._loadReject(a), this._loadReject =
            this._loadResolve = null)
    }
    IsLoaded() {
        const a = 4 <= this._audioElem.readyState;
        a && (this._reachedCanPlayThrough = !0);
        return a || this._reachedCanPlayThrough
    }
    IsLoadedAndDecoded() {
        return this.IsLoaded()
    }
    GetAudioElement() {
        return this._audioElem
    }
    GetOutputNode() {
        return this._outNode
    }
    GetDuration() {
        return this._audioElem.duration
    }
};
"use strict";
self.C3WebAudioBuffer = class extends self.C3AudioBuffer {
    constructor(a, b, c, d, e, f) {
        super(a, b, c, d, e);
        this._api = "webaudio";
        this._audioBuffer = this._audioData = null;
        this._needsSoftwareDecode = !!f
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this);
        this._audioBuffer = this._audioData = null;
        super.Release()
    }
    async _Fetch() {
        if (this._audioData) return this._audioData;
        var a = this._audioDomHandler.GetRuntimeInterface();
        if ("cordova" === a.GetExportType() && a.IsRelativeURL(this._url) && a.IsFileProtocol()) this._audioData =
            await a.CordovaFetchLocalFileAsArrayBuffer(this._url);
        else {
            a = await fetch(this._url);
            if (!a.ok) throw Error(`error fetching audio data: ${a.status} ${a.statusText}`);
            this._audioData = await a.arrayBuffer()
        }
    }
    async _Decode() {
        if (this._audioBuffer) return this._audioBuffer;
        this._audioBuffer = await this._audioDomHandler.DecodeAudioData(this._audioData, this._needsSoftwareDecode);
        this._audioData = null
    }
    async _Load() {
        try {
            this._loadState = "loading", await this._Fetch(), await this._Decode(), this._loadState = "loaded"
        } catch (a) {
            this._loadState =
                "failed", console.error(`[Construct] Failed to load audio '${this._url}': `, a)
        }
    }
    IsLoaded() {
        return !(!this._audioData && !this._audioBuffer)
    }
    IsLoadedAndDecoded() {
        return !!this._audioBuffer
    }
    GetAudioBuffer() {
        return this._audioBuffer
    }
    GetDuration() {
        return this._audioBuffer ? this._audioBuffer.duration : 0
    }
};
"use strict";
let nextAiId = 0;
self.C3AudioInstance = class {
    constructor(a, b, c) {
        this._audioDomHandler = a;
        this._buffer = b;
        this._tags = c;
        this._aiId = nextAiId++;
        this._gainNode = this.GetAudioContext().createGain();
        this._gainNode.connect(this.GetDestinationNode());
        this._pannerNode = null;
        this._isPannerEnabled = !1;
        this._pannerPosition = [0, 0, 0];
        this._pannerOrientation = [0, 0, 0];
        this._pannerConeParams = [0, 0, 0];
        this._stereoPannerNode = null;
        this._isStereoPannerEnabled = !1;
        this._stereoPan = 0;
        this._isStopped = !0;
        this._isLooping = this._resumeMe = this._isPaused = !1;
        this._volume = 1;
        this._isMuted = !1;
        this._playbackRate = 1;
        a = this._audioDomHandler.GetTimeScaleMode();
        this._isTimescaled = 1 === a && !this.IsMusic() || 2 === a;
        this._fadeEndTime = this._instUid = -1;
        this._stopOnFadeEnd = !1
    }
    Release() {
        this._buffer = this._audioDomHandler = null;
        this._pannerNode && (this._pannerNode.disconnect(), this._pannerNode = null);
        this._stereoPannerNode && (this._stereoPannerNode.disconnect(), this._stereoPannerNode = null);
        this._gainNode.disconnect();
        this._gainNode = null
    }
    GetAudioContext() {
        return this._audioDomHandler.GetAudioContext()
    }
    SetTags(a) {
        this._tags =
            a
    }
    GetTags() {
        return this._tags
    }
    GetEffectTag() {
        return 0 < this._tags.length ? this._tags[0] : ""
    }
    GetDestinationNode() {
        return this._audioDomHandler.GetDestinationForTag(this.GetEffectTag())
    }
    GetCurrentTime() {
        return this._isTimescaled ? this._audioDomHandler.GetGameTime() : performance.now() / 1E3
    }
    GetOriginalUrl() {
        return this._buffer.GetOriginalUrl()
    }
    GetUrl() {
        return this._buffer.GetUrl()
    }
    GetContentType() {
        return this._buffer.GetContentType()
    }
    GetBuffer() {
        return this._buffer
    }
    IsMusic() {
        return this._buffer.IsMusic()
    }
    GetAiId() {
        return this._aiId
    }
    HasEnded() {}
    CanBeRecycled() {}
    IsPlaying() {
        return !this._isStopped &&
            !this._isPaused && !this.HasEnded()
    }
    IsActive() {
        return !this._isStopped && !this.HasEnded()
    }
    GetPlaybackTime() {}
    GetDuration(a) {
        let b = this._buffer.GetDuration();
        a && (b /= this._playbackRate || .001);
        return b
    }
    Play(a, b, c, d) {}
    Stop() {}
    Pause() {}
    IsPaused() {
        return this._isPaused
    }
    Resume() {}
    SetVolume(a) {
        this._volume = a;
        this._gainNode.gain.cancelScheduledValues(0);
        this._fadeEndTime = -1;
        this._gainNode.gain.value = this.GetOutputVolume()
    }
    FadeVolume(a, b, c) {
        if (!this.IsMuted()) {
            var d = this._gainNode.gain;
            d.cancelScheduledValues(0);
            var e = this._audioDomHandler.GetAudioCurrentTime();
            b = e + b;
            d.setValueAtTime(d.value, e);
            d.linearRampToValueAtTime(a, b);
            this._volume = a;
            this._fadeEndTime = b;
            this._stopOnFadeEnd = c
        }
    }
    _UpdateVolume() {
        this.SetVolume(this._volume)
    }
    Tick(a) {
        -1 !== this._fadeEndTime && a >= this._fadeEndTime && (this._fadeEndTime = -1, this._stopOnFadeEnd && this.Stop(), this._audioDomHandler.PostTrigger("fade-ended", this._tags, this._aiId))
    }
    GetOutputVolume() {
        const a = this._volume;
        return isFinite(a) ? a : 0
    }
    SetMuted(a) {
        a = !!a;
        this._isMuted !== a && (this._isMuted =
            a, this._UpdateMuted())
    }
    IsMuted() {
        return this._isMuted
    }
    IsSilent() {
        return this._audioDomHandler.IsSilent()
    }
    _UpdateMuted() {}
    SetLooping(a) {}
    IsLooping() {
        return this._isLooping
    }
    SetPlaybackRate(a) {
        this._playbackRate !== a && (this._playbackRate = a, this._UpdatePlaybackRate())
    }
    _UpdatePlaybackRate() {}
    GetPlaybackRate() {
        return this._playbackRate
    }
    Seek(a) {}
    SetSuspended(a) {}
    SetPannerEnabled(a) {
        a = !!a;
        this._isPannerEnabled !== a && ((this._isPannerEnabled = a) ? (this.SetStereoPannerEnabled(!1), this._pannerNode || (this._pannerNode =
                this.GetAudioContext().createPanner(), this._pannerNode.panningModel = this._audioDomHandler.GetPanningModel(), this._pannerNode.distanceModel = this._audioDomHandler.GetDistanceModel(), this._pannerNode.refDistance = this._audioDomHandler.GetReferenceDistance(), this._pannerNode.maxDistance = this._audioDomHandler.GetMaxDistance(), this._pannerNode.rolloffFactor = this._audioDomHandler.GetRolloffFactor()), this._gainNode.disconnect(), this._gainNode.connect(this._pannerNode), this._pannerNode.connect(this.GetDestinationNode())) :
            (this._pannerNode.disconnect(), this._gainNode.disconnect(), this._gainNode.connect(this.GetDestinationNode())))
    }
    SetPan(a, b, c, d, e, f, g) {
        this._isPannerEnabled && (this.SetPanXYZA(a, b, c, d), a = self.AudioDOMHandler.ToDegrees, this._pannerConeParams[0] !== a(e) && (this._pannerConeParams[0] = a(e), this._pannerNode.coneInnerAngle = a(e)), this._pannerConeParams[1] !== a(f) && (this._pannerConeParams[1] = a(f), this._pannerNode.coneOuterAngle = a(f)), this._pannerConeParams[2] !== g && (this._pannerConeParams[2] = g, this._pannerNode.coneOuterGain =
            g))
    }
    SetPanXYZA(a, b, c, d) {
        if (this._isPannerEnabled) {
            var e = this._pannerPosition,
                f = this._pannerOrientation,
                g = Math.cos(d);
            d = Math.sin(d);
            if (e[0] !== a || e[1] !== b || e[2] !== c) e[0] = a, e[1] = b, e[2] = c, this._pannerNode.setPosition(...e);
            if (f[0] !== g || f[1] !== d || 0 !== f[2]) f[0] = g, f[1] = d, f[2] = 0, this._pannerNode.setOrientation(...f)
        }
    }
    SetStereoPannerEnabled(a) {
        a = !!a;
        this._isStereoPannerEnabled !== a && ((this._isStereoPannerEnabled = a) ? (this.SetPannerEnabled(!1), this._stereoPannerNode = this.GetAudioContext().createStereoPanner(),
            this._gainNode.disconnect(), this._gainNode.connect(this._stereoPannerNode), this._stereoPannerNode.connect(this.GetDestinationNode())) : (this._stereoPannerNode.disconnect(), this._stereoPannerNode = null, this._gainNode.disconnect(), this._gainNode.connect(this.GetDestinationNode())))
    }
    SetStereoPan(a) {
        this._isStereoPannerEnabled && this._stereoPan !== a && (this._stereoPan = this._stereoPannerNode.pan.value = a)
    }
    SetUID(a) {
        this._instUid = a
    }
    GetUID() {
        return this._instUid
    }
    GetResumePosition() {}
    Reconnect(a) {
        const b = this._stereoPannerNode ||
            this._pannerNode || this._gainNode;
        b.disconnect();
        b.connect(a)
    }
    GetState() {
        return {
            aiid: this.GetAiId(),
            tags: this._tags,
            duration: this.GetDuration(),
            volume: -1 === this._fadeEndTime ? this._volume : this._gainNode.gain.value,
            isPlaying: this.IsPlaying(),
            playbackTime: this.GetPlaybackTime(),
            playbackRate: this.GetPlaybackRate(),
            uid: this._instUid,
            bufferOriginalUrl: this.GetOriginalUrl(),
            bufferUrl: "",
            bufferType: this.GetContentType(),
            isMusic: this.IsMusic(),
            isLooping: this.IsLooping(),
            isMuted: this.IsMuted(),
            resumePosition: this.GetResumePosition(),
            pan: this.GetPanState(),
            stereoPan: this.GetStereoPanState()
        }
    }
    _LoadAdditionalState(a) {
        this.SetPlaybackRate(a.playbackRate);
        this.SetMuted(a.isMuted)
    }
    GetPanState() {
        if (!this._pannerNode) return null;
        const a = this._pannerNode;
        return {
            pos: this._pannerPosition,
            orient: this._pannerOrientation,
            cia: a.coneInnerAngle,
            coa: a.coneOuterAngle,
            cog: a.coneOuterGain,
            uid: this._instUid
        }
    }
    LoadPanState(a) {
        if (a) {
            this.SetPannerEnabled(!0);
            var b = this._pannerNode,
                c = a.pos;
            this._pannerPosition[0] = c[0];
            this._pannerPosition[1] = c[1];
            this._pannerPosition[2] =
                c[2];
            c = a.orient;
            this._pannerOrientation[0] = c[0];
            this._pannerOrientation[1] = c[1];
            this._pannerOrientation[2] = c[2];
            b.setPosition(...this._pannerPosition);
            b.setOrientation(...this._pannerOrientation);
            this._pannerConeParams[0] = a.cia;
            this._pannerConeParams[1] = a.coa;
            this._pannerConeParams[2] = a.cog;
            b.coneInnerAngle = a.cia;
            b.coneOuterAngle = a.coa;
            b.coneOuterGain = a.cog;
            this._instUid = a.uid
        } else this.SetPannerEnabled(!1)
    }
    GetStereoPanState() {
        return this._stereoPannerNode ? this._stereoPan : null
    }
    LoadStereoPanState(a) {
        "number" !==
        typeof a ? this.SetStereoPannerEnabled(!1) : (this.SetStereoPannerEnabled(!0), this.SetStereoPan(a))
    }
};
"use strict";
self.C3Html5AudioInstance = class extends self.C3AudioInstance {
    constructor(a, b, c) {
        super(a, b, c);
        this._buffer.GetOutputNode().connect(this._gainNode);
        this._buffer.onended = () => this._OnEnded()
    }
    Release() {
        this.Stop();
        this._buffer.GetOutputNode().disconnect();
        super.Release()
    }
    GetAudioElement() {
        return this._buffer.GetAudioElement()
    }
    _OnEnded() {
        this._isStopped = !0;
        this._instUid = -1;
        this._audioDomHandler.PostTrigger("ended", this._tags, this._aiId)
    }
    HasEnded() {
        return this.GetAudioElement().ended
    }
    CanBeRecycled() {
        return this._isStopped ?
            !0 : this.HasEnded()
    }
    GetPlaybackTime() {
        let a = this.GetAudioElement().currentTime;
        this._isLooping || (a = Math.min(a, this.GetDuration()));
        return a
    }
    Play(a, b, c, d) {
        d = this.GetAudioElement();
        1 !== d.playbackRate && (d.playbackRate = 1);
        d.loop !== a && (d.loop = a);
        this.SetVolume(b);
        d.muted && (d.muted = !1);
        if (d.currentTime !== c) try {
            d.currentTime = c
        } catch (e) {
            console.warn(`[Construct] Exception seeking audio '${this._buffer.GetUrl()}' to position '${c}': `, e)
        }
        this._audioDomHandler.TryPlayMedia(d);
        this._isPaused = this._isStopped = !1;
        this._isLooping = a;
        this._playbackRate = 1
    }
    Stop() {
        const a = this.GetAudioElement();
        a.paused || a.pause();
        this._audioDomHandler.RemovePendingPlay(a);
        this._isStopped = !0;
        this._isPaused = !1;
        this._instUid = -1
    }
    Pause() {
        if (!(this._isPaused || this._isStopped || this.HasEnded())) {
            var a = this.GetAudioElement();
            a.paused || a.pause();
            this._audioDomHandler.RemovePendingPlay(a);
            this._isPaused = !0
        }
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()), this._isPaused = !1)
    }
    _UpdateMuted() {
        this.GetAudioElement().muted = this._isMuted || this.IsSilent()
    }
    SetLooping(a) {
        a = !!a;
        this._isLooping !== a && (this._isLooping = a, this.GetAudioElement().loop = a)
    }
    _UpdatePlaybackRate() {
        let a = this._playbackRate;
        this._isTimescaled && (a *= this._audioDomHandler.GetTimeScale());
        try {
            this.GetAudioElement().playbackRate = a
        } catch (b) {
            console.warn(`[Construct] Unable to set playback rate '${a}':`, b)
        }
    }
    Seek(a) {
        if (!this._isStopped && !this.HasEnded()) try {
            this.GetAudioElement().currentTime = a
        } catch (b) {
            console.warn(`[Construct] Error seeking audio to '${a}': `,
                b)
        }
    }
    GetResumePosition() {
        return this.GetPlaybackTime()
    }
    SetSuspended(a) {
        a ? this.IsPlaying() ? (this.GetAudioElement().pause(), this._resumeMe = !0) : this._resumeMe = !1 : this._resumeMe && (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()), this._resumeMe = !1)
    }
};
"use strict";
self.C3WebAudioInstance = class extends self.C3AudioInstance {
    constructor(a, b, c) {
        super(a, b, c);
        this._bufferSource = null;
        this._onended_handler = d => this._OnEnded(d);
        this._hasPlaybackEnded = !0;
        this._activeSource = null;
        this._resumePosition = this._playFromSeekPos = this._playStartTime = 0;
        this._muteVol = 1
    }
    Release() {
        this.Stop();
        this._ReleaseBufferSource();
        this._onended_handler = null;
        super.Release()
    }
    _ReleaseBufferSource() {
        this._bufferSource && (this._bufferSource.onended = null, this._bufferSource.disconnect(), this._bufferSource.buffer =
            null);
        this._activeSource = this._bufferSource = null
    }
    _OnEnded(a) {
        this._isPaused || this._resumeMe || a.target !== this._activeSource || (this._isStopped = this._hasPlaybackEnded = !0, this._instUid = -1, this._ReleaseBufferSource(), this._audioDomHandler.PostTrigger("ended", this._tags, this._aiId))
    }
    HasEnded() {
        return !this._isStopped && this._bufferSource && this._bufferSource.loop || this._isPaused ? !1 : this._hasPlaybackEnded
    }
    CanBeRecycled() {
        return !this._bufferSource || this._isStopped ? !0 : this.HasEnded()
    }
    GetPlaybackTime() {
        let a;
        a = this._isPaused ? this._resumePosition : this._playFromSeekPos + (this.GetCurrentTime() - this._playStartTime) * this._playbackRate;
        this._isLooping || (a = Math.min(a, this.GetDuration()));
        return a
    }
    Play(a, b, c, d) {
        this._muteVol = 1;
        this.SetVolume(b);
        this._ReleaseBufferSource();
        this._bufferSource = this.GetAudioContext().createBufferSource();
        this._bufferSource.buffer = this._buffer.GetAudioBuffer();
        this._bufferSource.connect(this._gainNode);
        this._activeSource = this._bufferSource;
        this._bufferSource.onended = this._onended_handler;
        this._bufferSource.loop = a;
        this._bufferSource.start(d, c);
        this._isPaused = this._isStopped = this._hasPlaybackEnded = !1;
        this._isLooping = a;
        this._playbackRate = 1;
        this._playStartTime = this.GetCurrentTime();
        this._playFromSeekPos = c
    }
    Stop() {
        if (this._bufferSource) try {
            this._bufferSource.stop(0)
        } catch (a) {}
        this._isStopped = !0;
        this._isPaused = !1;
        this._instUid = -1
    }
    Pause() {
        this._isPaused || this._isStopped || this.HasEnded() || (this._resumePosition = this.GetPlaybackTime(), this._isLooping && (this._resumePosition %= this.GetDuration()),
            this._isPaused = !0, this._bufferSource.stop(0))
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._ReleaseBufferSource(), this._bufferSource = this.GetAudioContext().createBufferSource(), this._bufferSource.buffer = this._buffer.GetAudioBuffer(), this._bufferSource.connect(this._gainNode), this._activeSource = this._bufferSource, this._bufferSource.onended = this._onended_handler, this._bufferSource.loop = this._isLooping, this._UpdateVolume(), this._UpdatePlaybackRate(), this._bufferSource.start(0, this._resumePosition),
            this._playStartTime = this.GetCurrentTime(), this._playFromSeekPos = this._resumePosition, this._isPaused = !1)
    }
    GetOutputVolume() {
        return super.GetOutputVolume() * this._muteVol
    }
    _UpdateMuted() {
        this._muteVol = this._isMuted || this.IsSilent() ? 0 : 1;
        this._UpdateVolume()
    }
    SetLooping(a) {
        a = !!a;
        this._isLooping !== a && (this._isLooping = a, this._bufferSource && (this._bufferSource.loop = a))
    }
    _UpdatePlaybackRate() {
        let a = this._playbackRate;
        this._isTimescaled && (a *= this._audioDomHandler.GetTimeScale());
        this._bufferSource && (this._bufferSource.playbackRate.value =
            a)
    }
    Seek(a) {
        this._isStopped || this.HasEnded() || (this._isPaused ? this._resumePosition = a : (this.Pause(), this._resumePosition = a, this.Resume()))
    }
    GetResumePosition() {
        return this._resumePosition
    }
    SetSuspended(a) {
        a ? this.IsPlaying() ? (this._resumeMe = !0, this._resumePosition = this.GetPlaybackTime(), this._isLooping && (this._resumePosition %= this.GetDuration()), this._bufferSource.stop(0)) : this._resumeMe = !1 : this._resumeMe && (this._ReleaseBufferSource(), this._bufferSource = this.GetAudioContext().createBufferSource(), this._bufferSource.buffer =
            this._buffer.GetAudioBuffer(), this._bufferSource.connect(this._gainNode), this._activeSource = this._bufferSource, this._bufferSource.onended = this._onended_handler, this._bufferSource.loop = this._isLooping, this._UpdateVolume(), this._UpdatePlaybackRate(), this._bufferSource.start(0, this._resumePosition), this._playStartTime = this.GetCurrentTime(), this._playFromSeekPos = this._resumePosition, this._resumeMe = !1)
    }
    _LoadAdditionalState(a) {
        super._LoadAdditionalState(a);
        this._resumePosition = a.resumePosition
    }
};
"use strict";
class AudioFXBase {
    constructor(a) {
        this._audioDomHandler = a;
        this._audioContext = a.GetAudioContext();
        this._index = -1;
        this._type = this._tag = "";
        this._params = null
    }
    Release() {
        this._audioContext = null
    }
    _SetIndex(a) {
        this._index = a
    }
    GetIndex() {
        return this._index
    }
    _SetTag(a) {
        this._tag = a
    }
    GetTag() {
        return this._tag
    }
    CreateGain() {
        return this._audioContext.createGain()
    }
    GetInputNode() {}
    ConnectTo(a) {}
    SetAudioParam(a, b, c, d) {
        a.cancelScheduledValues(0);
        if (0 === d) a.value = b;
        else {
            var e = this._audioContext.currentTime;
            d += e;
            switch (c) {
                case 0:
                    a.setValueAtTime(b,
                        d);
                    break;
                case 1:
                    a.setValueAtTime(a.value, e);
                    a.linearRampToValueAtTime(b, d);
                    break;
                case 2:
                    a.setValueAtTime(a.value, e), a.exponentialRampToValueAtTime(b, d)
            }
        }
    }
    GetState() {
        return {
            type: this._type,
            tag: this._tag,
            params: this._params
        }
    }
}
self.C3AudioFilterFX = class extends AudioFXBase {
    constructor(a, b, c, d, e, f, g) {
        super(a);
        this._type = "filter";
        this._params = [b, c, d, e, f, g];
        this._inputNode = this.CreateGain();
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = g;
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - g;
        this._filterNode = this._audioContext.createBiquadFilter();
        this._filterNode.type = b;
        this._filterNode.frequency.value = c;
        this._filterNode.detune.value = d;
        this._filterNode.Q.value = e;
        this._filterNode.gain.vlaue = f;
        this._inputNode.connect(this._filterNode);
        this._inputNode.connect(this._dryNode);
        this._filterNode.connect(this._wetNode)
    }
    Release() {
        this._inputNode.disconnect();
        this._filterNode.disconnect();
        this._wetNode.disconnect();
        this._dryNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[5] = b;
                this.SetAudioParam(this._wetNode.gain, b, c, d);
                this.SetAudioParam(this._dryNode.gain, 1 - b, c, d);
                break;
            case 1:
                this._params[1] = b;
                this.SetAudioParam(this._filterNode.frequency, b, c, d);
                break;
            case 2:
                this._params[2] = b;
                this.SetAudioParam(this._filterNode.detune, b, c, d);
                break;
            case 3:
                this._params[3] = b;
                this.SetAudioParam(this._filterNode.Q, b, c, d);
                break;
            case 4:
                this._params[4] = b, this.SetAudioParam(this._filterNode.gain, b, c, d)
        }
    }
};
self.C3AudioDelayFX = class extends AudioFXBase {
    constructor(a, b, c, d) {
        super(a);
        this._type = "delay";
        this._params = [b, c, d];
        this._inputNode = this.CreateGain();
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = d;
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - d;
        this._mainNode = this.CreateGain();
        this._delayNode = this._audioContext.createDelay(b);
        this._delayNode.delayTime.value = b;
        this._delayGainNode = this.CreateGain();
        this._delayGainNode.gain.value = c;
        this._inputNode.connect(this._mainNode);
        this._inputNode.connect(this._dryNode);
        this._mainNode.connect(this._wetNode);
        this._mainNode.connect(this._delayNode);
        this._delayNode.connect(this._delayGainNode);
        this._delayGainNode.connect(this._mainNode)
    }
    Release() {
        this._inputNode.disconnect();
        this._wetNode.disconnect();
        this._dryNode.disconnect();
        this._mainNode.disconnect();
        this._delayNode.disconnect();
        this._delayGainNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a,
        b, c, d) {
        const e = self.AudioDOMHandler.DbToLinear;
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[2] = b;
                this.SetAudioParam(this._wetNode.gain, b, c, d);
                this.SetAudioParam(this._dryNode.gain, 1 - b, c, d);
                break;
            case 4:
                this._params[1] = e(b);
                this.SetAudioParam(this._delayGainNode.gain, e(b), c, d);
                break;
            case 5:
                this._params[0] = b, this.SetAudioParam(this._delayNode.delayTime, b, c, d)
        }
    }
};
self.C3AudioConvolveFX = class extends AudioFXBase {
    constructor(a, b, c, d) {
        super(a);
        this._type = "convolution";
        this._params = [c, d];
        this._bufferType = this._bufferUrl = this._bufferOriginalUrl = "";
        this._inputNode = this.CreateGain();
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = d;
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - d;
        this._convolveNode = this._audioContext.createConvolver();
        this._convolveNode.normalize = c;
        this._convolveNode.buffer = b;
        this._inputNode.connect(this._convolveNode);
        this._inputNode.connect(this._dryNode);
        this._convolveNode.connect(this._wetNode)
    }
    Release() {
        this._inputNode.disconnect();
        this._convolveNode.disconnect();
        this._wetNode.disconnect();
        this._dryNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0), this._params[1] = b, this.SetAudioParam(this._wetNode.gain, b, c, d), this.SetAudioParam(this._dryNode.gain,
                    1 - b, c, d)
        }
    }
    _SetBufferInfo(a, b, c) {
        this._bufferOriginalUrl = a;
        this._bufferUrl = b;
        this._bufferType = c
    }
    GetState() {
        const a = super.GetState();
        a.bufferOriginalUrl = this._bufferOriginalUrl;
        a.bufferUrl = "";
        a.bufferType = this._bufferType;
        return a
    }
};
self.C3AudioFlangerFX = class extends AudioFXBase {
    constructor(a, b, c, d, e, f) {
        super(a);
        this._type = "flanger";
        this._params = [b, c, d, e, f];
        this._inputNode = this.CreateGain();
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - f / 2;
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = f / 2;
        this._feedbackNode = this.CreateGain();
        this._feedbackNode.gain.value = e;
        this._delayNode = this._audioContext.createDelay(b + c);
        this._delayNode.delayTime.value = b;
        this._oscNode = this._audioContext.createOscillator();
        this._oscNode.frequency.value =
            d;
        this._oscGainNode = this.CreateGain();
        this._oscGainNode.gain.value = c;
        this._inputNode.connect(this._delayNode);
        this._inputNode.connect(this._dryNode);
        this._delayNode.connect(this._wetNode);
        this._delayNode.connect(this._feedbackNode);
        this._feedbackNode.connect(this._delayNode);
        this._oscNode.connect(this._oscGainNode);
        this._oscGainNode.connect(this._delayNode.delayTime);
        this._oscNode.start(0)
    }
    Release() {
        this._oscNode.stop(0);
        this._inputNode.disconnect();
        this._delayNode.disconnect();
        this._oscNode.disconnect();
        this._oscGainNode.disconnect();
        this._dryNode.disconnect();
        this._wetNode.disconnect();
        this._feedbackNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[4] = b;
                this.SetAudioParam(this._wetNode.gain, b / 2, c, d);
                this.SetAudioParam(this._dryNode.gain, 1 - b / 2, c, d);
                break;
            case 6:
                this._params[1] = b / 1E3;
                this.SetAudioParam(this._oscGainNode.gain, b / 1E3, c, d);
                break;
            case 7:
                this._params[2] = b;
                this.SetAudioParam(this._oscNode.frequency, b, c, d);
                break;
            case 8:
                this._params[3] = b / 100, this.SetAudioParam(this._feedbackNode.gain, b / 100, c, d)
        }
    }
};
self.C3AudioPhaserFX = class extends AudioFXBase {
    constructor(a, b, c, d, e, f, g) {
        super(a);
        this._type = "phaser";
        this._params = [b, c, d, e, f, g];
        this._inputNode = this.CreateGain();
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - g / 2;
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = g / 2;
        this._filterNode = this._audioContext.createBiquadFilter();
        this._filterNode.type = "allpass";
        this._filterNode.frequency.value = b;
        this._filterNode.detune.value = c;
        this._filterNode.Q.value = d;
        this._oscNode = this._audioContext.createOscillator();
        this._oscNode.frequency.value = f;
        this._oscGainNode = this.CreateGain();
        this._oscGainNode.gain.value = e;
        this._inputNode.connect(this._filterNode);
        this._inputNode.connect(this._dryNode);
        this._filterNode.connect(this._wetNode);
        this._oscNode.connect(this._oscGainNode);
        this._oscGainNode.connect(this._filterNode.frequency);
        this._oscNode.start(0)
    }
    Release() {
        this._oscNode.stop(0);
        this._inputNode.disconnect();
        this._filterNode.disconnect();
        this._oscNode.disconnect();
        this._oscGainNode.disconnect();
        this._dryNode.disconnect();
        this._wetNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[5] = b;
                this.SetAudioParam(this._wetNode.gain, b / 2, c, d);
                this.SetAudioParam(this._dryNode.gain, 1 - b / 2, c, d);
                break;
            case 1:
                this._params[0] = b;
                this.SetAudioParam(this._filterNode.frequency, b, c, d);
                break;
            case 2:
                this._params[1] = b;
                this.SetAudioParam(this._filterNode.detune,
                    b, c, d);
                break;
            case 3:
                this._params[2] = b;
                this.SetAudioParam(this._filterNode.Q, b, c, d);
                break;
            case 6:
                this._params[3] = b;
                this.SetAudioParam(this._oscGainNode.gain, b, c, d);
                break;
            case 7:
                this._params[4] = b, this.SetAudioParam(this._oscNode.frequency, b, c, d)
        }
    }
};
self.C3AudioGainFX = class extends AudioFXBase {
    constructor(a, b) {
        super(a);
        this._type = "gain";
        this._params = [b];
        this._node = this.CreateGain();
        this._node.gain.value = b
    }
    Release() {
        this._node.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._node.disconnect();
        this._node.connect(a)
    }
    GetInputNode() {
        return this._node
    }
    SetParam(a, b, c, d) {
        const e = self.AudioDOMHandler.DbToLinear;
        switch (a) {
            case 4:
                this._params[0] = e(b), this.SetAudioParam(this._node.gain, e(b), c, d)
        }
    }
};
self.C3AudioStereoPanFX = class extends AudioFXBase {
    constructor(a, b) {
        super(a);
        this._type = "stereopan";
        this._params = [b];
        this._node = this._audioContext.createStereoPanner();
        this._node.pan.value = b
    }
    Release() {
        this._node.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._node.disconnect();
        this._node.connect(a)
    }
    GetInputNode() {
        return this._node
    }
    SetParam(a, b, c, d) {
        b = Math.min(Math.max(b / 100, -1), 1);
        switch (a) {
            case 9:
                this._params[0] = b, this.SetAudioParam(this._node.pan, b, c, d)
        }
    }
};
self.C3AudioTremoloFX = class extends AudioFXBase {
    constructor(a, b, c) {
        super(a);
        this._type = "tremolo";
        this._params = [b, c];
        this._node = this.CreateGain();
        this._node.gain.value = 1 - c / 2;
        this._oscNode = this._audioContext.createOscillator();
        this._oscNode.frequency.value = b;
        this._oscGainNode = this.CreateGain();
        this._oscGainNode.gain.value = c / 2;
        this._oscNode.connect(this._oscGainNode);
        this._oscGainNode.connect(this._node.gain);
        this._oscNode.start(0)
    }
    Release() {
        this._oscNode.stop(0);
        this._oscNode.disconnect();
        this._oscGainNode.disconnect();
        this._node.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._node.disconnect();
        this._node.connect(a)
    }
    GetInputNode() {
        return this._node
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[1] = b;
                this.SetAudioParam(this._node.gain, 1 - b / 2, c, d);
                this.SetAudioParam(this._oscGainNode.gain, b / 2, c, d);
                break;
            case 7:
                this._params[0] = b, this.SetAudioParam(this._oscNode.frequency, b, c, d)
        }
    }
};
self.C3AudioRingModFX = class extends AudioFXBase {
    constructor(a, b, c) {
        super(a);
        this._type = "ringmod";
        this._params = [b, c];
        this._inputNode = this.CreateGain();
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = c;
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - c;
        this._ringNode = this.CreateGain();
        this._ringNode.gain.value = 0;
        this._oscNode = this._audioContext.createOscillator();
        this._oscNode.frequency.value = b;
        this._oscNode.connect(this._ringNode.gain);
        this._oscNode.start(0);
        this._inputNode.connect(this._ringNode);
        this._inputNode.connect(this._dryNode);
        this._ringNode.connect(this._wetNode)
    }
    Release() {
        this._oscNode.stop(0);
        this._oscNode.disconnect();
        this._ringNode.disconnect();
        this._inputNode.disconnect();
        this._wetNode.disconnect();
        this._dryNode.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0);
                this._params[1] =
                    b;
                this.SetAudioParam(this._wetNode.gain, b, c, d);
                this.SetAudioParam(this._dryNode.gain, 1 - b, c, d);
                break;
            case 7:
                this._params[0] = b, this.SetAudioParam(this._oscNode.frequency, b, c, d)
        }
    }
};
self.C3AudioDistortionFX = class extends AudioFXBase {
    constructor(a, b, c, d, e, f) {
        super(a);
        this._type = "distortion";
        this._params = [b, c, d, e, f];
        this._inputNode = this.CreateGain();
        this._preGain = this.CreateGain();
        this._postGain = this.CreateGain();
        this._SetDrive(d, e);
        this._wetNode = this.CreateGain();
        this._wetNode.gain.value = f;
        this._dryNode = this.CreateGain();
        this._dryNode.gain.value = 1 - f;
        this._waveShaper = this._audioContext.createWaveShaper();
        this._curve = new Float32Array(65536);
        this._GenerateColortouchCurve(b, c);
        this._waveShaper.curve =
            this._curve;
        this._inputNode.connect(this._preGain);
        this._inputNode.connect(this._dryNode);
        this._preGain.connect(this._waveShaper);
        this._waveShaper.connect(this._postGain);
        this._postGain.connect(this._wetNode)
    }
    Release() {
        this._inputNode.disconnect();
        this._preGain.disconnect();
        this._waveShaper.disconnect();
        this._postGain.disconnect();
        this._wetNode.disconnect();
        this._dryNode.disconnect();
        super.Release()
    }
    _SetDrive(a, b) {
        .01 > a && (a = .01);
        this._preGain.gain.value = a;
        this._postGain.gain.value = Math.pow(1 / a, .6) *
            b
    }
    _GenerateColortouchCurve(a, b) {
        for (let c = 0; 32768 > c; ++c) {
            let d = c / 32768;
            d = this._Shape(d, a, b);
            this._curve[32768 + c] = d;
            this._curve[32768 - c - 1] = -d
        }
    }
    _Shape(a, b, c) {
        c = 1.05 * c * b - b;
        const d = 0 > a ? -1 : 1;
        a = 0 > a ? -a : a;
        return (a < b ? a : b + c * self.AudioDOMHandler.e4(a - b, 1 / c)) * d
    }
    ConnectTo(a) {
        this._wetNode.disconnect();
        this._wetNode.connect(a);
        this._dryNode.disconnect();
        this._dryNode.connect(a)
    }
    GetInputNode() {
        return this._inputNode
    }
    SetParam(a, b, c, d) {
        switch (a) {
            case 0:
                b = Math.max(Math.min(b / 100, 1), 0), this._params[4] = b, this.SetAudioParam(this._wetNode.gain,
                    b, c, d), this.SetAudioParam(this._dryNode.gain, 1 - b, c, d)
        }
    }
};
self.C3AudioCompressorFX = class extends AudioFXBase {
    constructor(a, b, c, d, e, f) {
        super(a);
        this._type = "compressor";
        this._params = [b, c, d, e, f];
        this._node = this._audioContext.createDynamicsCompressor();
        this._node.threshold.value = b;
        this._node.knee.value = c;
        this._node.ratio.value = d;
        this._node.attack.value = e;
        this._node.release.value = f
    }
    Release() {
        this._node.disconnect();
        super.Release()
    }
    ConnectTo(a) {
        this._node.disconnect();
        this._node.connect(a)
    }
    GetInputNode() {
        return this._node
    }
    SetParam(a, b, c, d) {}
};
self.C3AudioAnalyserFX = class extends AudioFXBase {
    constructor(a, b, c) {
        super(a);
        this._type = "analyser";
        this._params = [b, c];
        this._node = this._audioContext.createAnalyser();
        this._node.fftSize = b;
        this._node.smoothingTimeConstant = c;
        this._freqBins = new Float32Array(this._node.frequencyBinCount);
        this._signal = new Uint8Array(b);
        this._rms = this._peak = 0;
        this._audioDomHandler._AddAnalyser(this)
    }
    Release() {
        this._audioDomHandler._RemoveAnalyser(this);
        this._node.disconnect();
        super.Release()
    }
    Tick() {
        this._node.getFloatFrequencyData(this._freqBins);
        this._node.getByteTimeDomainData(this._signal);
        const a = this._node.fftSize;
        let b = this._peak = 0;
        for (var c = 0; c < a; ++c) {
            let d = (this._signal[c] - 128) / 128;
            0 > d && (d = -d);
            this._peak < d && (this._peak = d);
            b += d * d
        }
        c = self.AudioDOMHandler.LinearToDb;
        this._peak = c(this._peak);
        this._rms = c(Math.sqrt(b / a))
    }
    ConnectTo(a) {
        this._node.disconnect();
        this._node.connect(a)
    }
    GetInputNode() {
        return this._node
    }
    SetParam(a, b, c, d) {}
    GetData() {
        return {
            tag: this.GetTag(),
            index: this.GetIndex(),
            peak: this._peak,
            rms: this._rms,
            binCount: this._node.frequencyBinCount,
            freqBins: this._freqBins
        }
    }
};
"use strict";

function elemsForSelector(a, b) {
    return a ? b ? Array.from(document.querySelectorAll(a)) : (a = document.querySelector(a)) ? [a] : [] : [document.documentElement]
}

function noop() {}
self.RuntimeInterface.AddDOMHandlerClass(class extends self.DOMHandler {
    constructor(a) {
        super(a, "browser");
        this._exportType = "";
        this.AddRuntimeMessageHandlers([
            ["get-initial-state", b => this._OnGetInitialState(b)],
            ["ready-for-sw-messages", () => this._OnReadyForSWMessages()],
            ["alert", b => this._OnAlert(b)],
            ["close", () => this._OnClose()],
            ["set-focus", b => this._OnSetFocus(b)],
            ["vibrate", b => this._OnVibrate(b)],
            ["lock-orientation", b => this._OnLockOrientation(b)],
            ["unlock-orientation", () => this._OnUnlockOrientation()],
            ["navigate", b => this._OnNavigate(b)],
            ["request-fullscreen", b => this._OnRequestFullscreen(b)],
            ["exit-fullscreen", () => this._OnExitFullscreen()],
            ["set-hash", b => this._OnSetHash(b)],
            ["set-document-css-style", b => this._OnSetDocumentCSSStyle(b)],
            ["get-document-css-style", b => this._OnGetDocumentCSSStyle(b)]
        ]);
        window.addEventListener("online", () => this._OnOnlineStateChanged(!0));
        window.addEventListener("offline", () => this._OnOnlineStateChanged(!1));
        window.addEventListener("hashchange", () => this._OnHashChange());
        document.addEventListener("backbutton", () => this._OnCordovaBackButton())
    }
    _OnGetInitialState(a) {
        this._exportType = a.exportType;
        return {
            location: location.toString(),
            isOnline: !!navigator.onLine,
            referrer: document.referrer,
            title: document.title,
            isCookieEnabled: !!navigator.cookieEnabled,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowOuterWidth: window.outerWidth,
            windowOuterHeight: window.outerHeight,
            isConstructArcade: "undefined" !== typeof window.is_scirra_arcade
        }
    }
    _OnReadyForSWMessages() {
        window.C3_RegisterSW &&
            window.OfflineClientInfo && window.OfflineClientInfo.SetMessageCallback(a => this.PostToRuntime("sw-message", a.data))
    }
    _OnOnlineStateChanged(a) {
        this.PostToRuntime("online-state", {
            isOnline: a
        })
    }
    _OnCordovaBackButton() {
        this.PostToRuntime("backbutton")
    }
    GetNWjsWindow() {
        return "nwjs" === this._exportType ? nw.Window.get() : null
    }
    _OnAlert(a) {
        alert(a.message)
    }
    _OnClose() {
        navigator.app && navigator.app.exitApp ? navigator.app.exitApp() : navigator.device && navigator.device.exitApp ? navigator.device.exitApp() : window.close()
    }
    _OnSetFocus(a) {
        a =
            a.isFocus;
        if ("nwjs" === this._exportType) {
            const b = this.GetNWjsWindow();
            a ? b.focus() : b.blur()
        } else a ? window.focus() : window.blur()
    }
    _OnVibrate(a) {
        navigator.vibrate && navigator.vibrate(a.pattern)
    }
    _OnLockOrientation(a) {
        a = a.orientation;
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock(a).catch(b => console.warn("[Construct] Failed to lock orientation: ", b));
        else try {
            let b = !1;
            screen.lockOrientation ? b = screen.lockOrientation(a) : screen.webkitLockOrientation ? b = screen.webkitLockOrientation(a) :
                screen.mozLockOrientation ? b = screen.mozLockOrientation(a) : screen.msLockOrientation && (b = screen.msLockOrientation(a));
            b || console.warn("[Construct] Failed to lock orientation")
        } catch (b) {
            console.warn("[Construct] Failed to lock orientation: ", b)
        }
    }
    _OnUnlockOrientation() {
        try {
            screen.orientation && screen.orientation.unlock ? screen.orientation.unlock() : screen.unlockOrientation ? screen.unlockOrientation() : screen.webkitUnlockOrientation ? screen.webkitUnlockOrientation() : screen.mozUnlockOrientation ? screen.mozUnlockOrientation() :
                screen.msUnlockOrientation && screen.msUnlockOrientation()
        } catch (a) {}
    }
    _OnNavigate(a) {
        var b = a.type;
        if ("back" === b) navigator.app && navigator.app.backHistory ? navigator.app.backHistory() : window.history.back();
        else if ("forward" === b) window.history.forward();
        else if ("reload" === b) location.reload();
        else if ("url" === b) {
            b = a.url;
            const c = a.target;
            a = a.exportType;
            self.cordova && self.cordova.InAppBrowser ? self.cordova.InAppBrowser.open(b, "_system") : "preview" === a || this._iRuntime.IsWebView2Wrapper() ? window.open(b, "_blank") :
                this._isConstructArcade || (2 === c ? window.top.location = b : 1 === c ? window.parent.location = b : window.location = b)
        } else "new-window" === b && (b = a.url, a = a.tag, self.cordova && self.cordova.InAppBrowser ? self.cordova.InAppBrowser.open(b, "_system") : window.open(b, a))
    }
    _OnRequestFullscreen(a) {
        if (this._iRuntime.IsWebView2Wrapper() || "macos-wkwebview" === this._exportType) self.RuntimeInterface._SetWrapperIsFullscreenFlag(!0), this._iRuntime._SendWrapperMessage({
            type: "set-fullscreen",
            fullscreen: !0
        });
        else {
            const b = {
                navigationUI: "auto"
            };
            a = a.navUI;
            1 === a ? b.navigationUI = "hide" : 2 === a && (b.navigationUI = "show");
            a = document.documentElement;
            let c;
            a.requestFullscreen ? c = a.requestFullscreen(b) : a.mozRequestFullScreen ? c = a.mozRequestFullScreen(b) : a.msRequestFullscreen ? c = a.msRequestFullscreen(b) : a.webkitRequestFullScreen && (c = "undefined" !== typeof Element.ALLOW_KEYBOARD_INPUT ? a.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : a.webkitRequestFullScreen());
            c instanceof Promise && c.catch(noop)
        }
    }
    _OnExitFullscreen() {
        if (this._iRuntime.IsWebView2Wrapper() ||
            "macos-wkwebview" === this._exportType) self.RuntimeInterface._SetWrapperIsFullscreenFlag(!1), this._iRuntime._SendWrapperMessage({
            type: "set-fullscreen",
            fullscreen: !1
        });
        else {
            let a;
            document.exitFullscreen ? a = document.exitFullscreen() : document.mozCancelFullScreen ? a = document.mozCancelFullScreen() : document.msExitFullscreen ? a = document.msExitFullscreen() : document.webkitCancelFullScreen && (a = document.webkitCancelFullScreen());
            a instanceof Promise && a.catch(noop)
        }
    }
    _OnSetHash(a) {
        location.hash = a.hash
    }
    _OnHashChange() {
        this.PostToRuntime("hashchange", {
            location: location.toString()
        })
    }
    _OnSetDocumentCSSStyle(a) {
        const b = a.prop,
            c = a.value,
            d = a.selector;
        a = a["is-all"];
        try {
            const e = elemsForSelector(d, a);
            for (const f of e) b.startsWith("--") ? f.style.setProperty(b, c) : f.style[b] = c
        } catch (e) {
            console.warn("[Browser] Failed to set style: ", e)
        }
    }
    _OnGetDocumentCSSStyle(a) {
        const b = a.prop;
        a = a.selector;
        try {
            const c = document.querySelector(a);
            return c ? {
                isOk: !0,
                result: window.getComputedStyle(c).getPropertyValue(b)
            } : {
                isOk: !1
            }
        } catch (c) {
            return console.warn("[Browser] Failed to get style: ",
                c), {
                isOk: !1
            }
        }
    }
});