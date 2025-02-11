// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.TimelineModel}
 * @implements {WebInspector.TargetManager.Observer}
 */
WebInspector.TimelineModelImpl = function()
{
    WebInspector.TimelineModel.call(this);
    /** @type {?WebInspector.Target} */
    this._currentTarget = null;
    this._filters = [];
    this._bindings = new WebInspector.TimelineModelImpl.InterRecordBindings();

    this.reset();

    WebInspector.targetManager.addModelListener(WebInspector.TimelineManager, WebInspector.TimelineManager.EventTypes.TimelineEventRecorded, this._onRecordAdded, this);
    WebInspector.targetManager.addModelListener(WebInspector.TimelineManager, WebInspector.TimelineManager.EventTypes.TimelineStarted, this._onStarted, this);
    WebInspector.targetManager.addModelListener(WebInspector.TimelineManager, WebInspector.TimelineManager.EventTypes.TimelineStopped, this._onStopped, this);
    WebInspector.targetManager.addModelListener(WebInspector.TimelineManager, WebInspector.TimelineManager.EventTypes.TimelineProgress, this._onProgress, this);
    WebInspector.targetManager.observeTargets(this);
}

WebInspector.TimelineModelImpl.TransferChunkLengthBytes = 5000000;

WebInspector.TimelineModelImpl.prototype = {
    /**
     * @param {!WebInspector.Target} target
     */
    targetAdded: function(target) { },

    /**
     * @param {!WebInspector.Target} target
     */
    targetRemoved: function(target)
    {
        if (this._currentTarget === target)
            this._currentTarget = null;
    },

    /**
     * @param {boolean} captureStacks
     * @param {boolean} captureMemory
     * @param {boolean} capturePictures
     */
    startRecording: function(captureStacks, captureMemory, capturePictures)
    {
        console.assert(!capturePictures, "Legacy timeline does not support capturing pictures");
        this.reset();
        this._currentTarget = WebInspector.context.flavor(WebInspector.Target);
        console.assert(this._currentTarget);

        this._clientInitiatedRecording = true;
        var maxStackFrames = captureStacks ? 30 : 0;
        var includeGPUEvents = WebInspector.experimentsSettings.gpuTimeline.isEnabled();
        var liveEvents = [ WebInspector.TimelineModel.RecordType.BeginFrame,
                           WebInspector.TimelineModel.RecordType.DrawFrame,
                           WebInspector.TimelineModel.RecordType.RequestMainThreadFrame,
                           WebInspector.TimelineModel.RecordType.ActivateLayerTree ];
        this._currentTarget.timelineManager.start(maxStackFrames, liveEvents.join(","), captureMemory, includeGPUEvents, this._fireRecordingStarted.bind(this));
    },

    stopRecording: function()
    {
        if (!this._currentTarget)
            return;

        if (!this._clientInitiatedRecording) {
            this._currentTarget.timelineManager.start(undefined, undefined, undefined, undefined, stopTimeline.bind(this));
            return;
        }

        /**
         * Console started this one and we are just sniffing it. Initiate recording so that we
         * could stop it.
         * @this {WebInspector.TimelineModelImpl}
         */
        function stopTimeline()
        {
            this._currentTarget.timelineManager.stop(this._fireRecordingStopped.bind(this));
        }

        this._clientInitiatedRecording = false;
        this._currentTarget.timelineManager.stop(this._fireRecordingStopped.bind(this));
    },

    /**
     * @return {!Array.<!WebInspector.TimelineModel.Record>}
     */
    records: function()
    {
        return this._records;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onRecordAdded: function(event)
    {
        var timelineManager = /** @type {!WebInspector.TimelineManager} */ (event.target);
        if (this._collectionEnabled && timelineManager.target() === this._currentTarget)
            this._addRecord(/** @type {!TimelineAgent.TimelineEvent} */(event.data));
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onStarted: function(event)
    {
        if (!event.data || this._collectionEnabled)
            return;
        // Started from console.
        var timelineManager = /** @type {!WebInspector.TimelineManager} */ (event.target);
        if (this._currentTarget !== timelineManager.target()) {
            this.reset();
            this._currentTarget = timelineManager.target();
        }
        this._fireRecordingStarted();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onStopped: function(event)
    {
        var timelineManager = /** @type {!WebInspector.TimelineManager} */ (event.target);
        if (timelineManager.target() !== this._currentTarget)
            return;
        // We were buffering events, discard those that got through, the real ones are coming!
        this.reset();
        this._currentTarget = timelineManager.target();

        var events = /** @type {!Array.<!TimelineAgent.TimelineEvent>} */ (event.data.events);
        for (var i = 0; i < events.length; ++i)
            this._addRecord(events[i]);

        if (event.data.consoleTimeline) {
            // Stopped from console.
            this._fireRecordingStopped(null, null);
        }

        this._collectionEnabled = false;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onProgress: function(event)
    {
        var timelineManager = /** @type {!WebInspector.TimelineManager} */ (event.target);
        if (timelineManager.target() === this._currentTarget)
            this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordingProgress, event.data);
    },

    _fireRecordingStarted: function()
    {
        this._collectionEnabled = true;
        this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordingStarted);
    },

    /**
     * @param {?Protocol.Error} error
     * @param {?ProfilerAgent.CPUProfile} cpuProfile
     */
    _fireRecordingStopped: function(error, cpuProfile)
    {
        if (cpuProfile)
            WebInspector.TimelineJSProfileProcessor.mergeJSProfileIntoTimeline(this, cpuProfile);
        this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordingStopped);
    },

    /**
     * @param {!TimelineAgent.TimelineEvent} payload
     */
    _addRecord: function(payload)
    {
        this._internStrings(payload);
        this._payloads.push(payload);

        var record = this._innerAddRecord(payload, null);
        this._updateBoundaries(record);
        this._records.push(record);
        if (record.type() === WebInspector.TimelineModel.RecordType.Program)
            this._mainThreadTasks.push(record);
        if (record.type() === WebInspector.TimelineModel.RecordType.GPUTask)
            this._gpuThreadTasks.push(record);

        this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordAdded, record);
    },

    /**
     * @param {!TimelineAgent.TimelineEvent} payload
     * @param {?WebInspector.TimelineModel.Record} parentRecord
     * @return {!WebInspector.TimelineModel.Record}
     */
    _innerAddRecord: function(payload, parentRecord)
    {
        var record = new WebInspector.TimelineModel.RecordImpl(this, payload, parentRecord);
        if (WebInspector.TimelineUIUtilsImpl.isEventDivider(record))
            this._eventDividerRecords.push(record);

        for (var i = 0; payload.children && i < payload.children.length; ++i)
            this._innerAddRecord.call(this, payload.children[i], record);

        if (parentRecord)
            parentRecord._selfTime -= record.endTime() - record.startTime();
        return record;
    },

    /**
     * @param {!WebInspector.ChunkedFileReader} fileReader
     * @param {!WebInspector.Progress} progress
     * @return {!WebInspector.OutputStream}
     */
    createLoader: function(fileReader, progress)
    {
        return new WebInspector.TimelineModelLoader(this, fileReader, progress);
    },

    /**
     * @param {!WebInspector.OutputStream} stream
     */
    writeToStream: function(stream)
    {
        var saver = new WebInspector.TimelineSaver(stream);
        saver.save(this._payloads, window.navigator.appVersion);
    },

    reset: function()
    {
        if (!this._collectionEnabled)
            this._currentTarget = null;
        this._payloads = [];
        this._stringPool = {};
        this._bindings._reset();
        WebInspector.TimelineModel.prototype.reset.call(this);
    },

    /**
     * @param {!TimelineAgent.TimelineEvent} record
     */
    _internStrings: function(record)
    {
        for (var name in record) {
            var value = record[name];
            if (typeof value !== "string")
                continue;

            var interned = this._stringPool[value];
            if (typeof interned === "string")
                record[name] = interned;
            else
                this._stringPool[value] = value;
        }

        var children = record.children;
        for (var i = 0; children && i < children.length; ++i)
            this._internStrings(children[i]);
    },

    __proto__: WebInspector.TimelineModel.prototype
}


/**
 * @constructor
 */
WebInspector.TimelineModelImpl.InterRecordBindings = function() {
    this._reset();
}

WebInspector.TimelineModelImpl.InterRecordBindings.prototype = {
    _reset: function()
    {
        this._sendRequestRecords = {};
        this._timerRecords = {};
        this._requestAnimationFrameRecords = {};
        this._layoutInvalidate = {};
        this._lastScheduleStyleRecalculation = {};
        this._webSocketCreateRecords = {};
    }
}

/**
 * @constructor
 * @implements {WebInspector.TimelineModel.Record}
 * @param {!WebInspector.TimelineModel} model
 * @param {!TimelineAgent.TimelineEvent} timelineEvent
 * @param {?WebInspector.TimelineModel.Record} parentRecord
 */
WebInspector.TimelineModel.RecordImpl = function(model, timelineEvent, parentRecord)
{
    this._model = model;
    var bindings = this._model._bindings;
    this._record = timelineEvent;
    this._thread = this._record.thread || WebInspector.TimelineModel.MainThreadName;
    this._children = [];
    if (parentRecord) {
        this.parent = parentRecord;
        parentRecord.children().push(this);
    }

    this._selfTime = this.endTime() - this.startTime();

    var recordTypes = WebInspector.TimelineModel.RecordType;
    switch (timelineEvent.type) {
    case recordTypes.ResourceSendRequest:
        // Make resource receive record last since request was sent; make finish record last since response received.
        bindings._sendRequestRecords[timelineEvent.data["requestId"]] = this;
        break;

    case recordTypes.ResourceReceiveResponse:
    case recordTypes.ResourceReceivedData:
    case recordTypes.ResourceFinish:
        this._initiator = bindings._sendRequestRecords[timelineEvent.data["requestId"]];
        break;

    case recordTypes.TimerInstall:
        bindings._timerRecords[timelineEvent.data["timerId"]] = this;
        break;

    case recordTypes.TimerFire:
        this._initiator = bindings._timerRecords[timelineEvent.data["timerId"]];
        break;

    case recordTypes.RequestAnimationFrame:
        bindings._requestAnimationFrameRecords[timelineEvent.data["id"]] = this;
        break;

    case recordTypes.FireAnimationFrame:
        this._initiator = bindings._requestAnimationFrameRecords[timelineEvent.data["id"]];
        break;

    case recordTypes.ScheduleStyleRecalculation:
        bindings._lastScheduleStyleRecalculation[this.frameId()] = this;
        break;

    case recordTypes.RecalculateStyles:
        this._initiator = bindings._lastScheduleStyleRecalculation[this.frameId()];
        break;

    case recordTypes.InvalidateLayout:
        // Consider style recalculation as a reason for layout invalidation,
        // but only if we had no earlier layout invalidation records.
        var layoutInitator = this;
        if (!bindings._layoutInvalidate[this.frameId()] && parentRecord && parentRecord.type() === recordTypes.RecalculateStyles)
            layoutInitator = parentRecord._initiator;
        bindings._layoutInvalidate[this.frameId()] = layoutInitator;
        break;

    case recordTypes.Layout:
        this._initiator = bindings._layoutInvalidate[this.frameId()];
        bindings._layoutInvalidate[this.frameId()] = null;
        if (this.stackTrace())
            this.addWarning(WebInspector.UIString("Forced synchronous layout is a possible performance bottleneck."));
        break;

    case recordTypes.WebSocketCreate:
        bindings._webSocketCreateRecords[timelineEvent.data["identifier"]] = this;
        break;

    case recordTypes.WebSocketSendHandshakeRequest:
    case recordTypes.WebSocketReceiveHandshakeResponse:
    case recordTypes.WebSocketDestroy:
        this._initiator = bindings._webSocketCreateRecords[timelineEvent.data["identifier"]];
        break;
    }
}

WebInspector.TimelineModel.RecordImpl.prototype = {
    /**
     * @return {?Array.<!ConsoleAgent.CallFrame>}
     */
    callSiteStackTrace: function()
    {
        return this._initiator ? this._initiator.stackTrace() : null;
    },

    /**
     * @return {?WebInspector.TimelineModel.Record}
     */
    initiator: function()
    {
        return this._initiator;
    },

    /**
     * @return {?WebInspector.Target}
     */
    target: function()
    {
        return this._model._currentTarget;
    },

    /**
     * @return {number}
     */
    selfTime: function()
    {
        return this._selfTime;
    },

    /**
     * @return {!Array.<!WebInspector.TimelineModel.Record>}
     */
    children: function()
    {
        return this._children;
    },

    /**
     * @return {number}
     */
    startTime: function()
    {
        return this._record.startTime;
    },

    /**
     * @return {string}
     */
    thread: function()
    {
        return this._thread;
    },

    /**
     * @return {number}
     */
    endTime: function()
    {
        return this._endTime || this._record.endTime || this._record.startTime;
    },

    /**
     * @param {number} endTime
     */
    setEndTime: function(endTime)
    {
        this._endTime = endTime;
    },

    /**
     * @return {!Object}
     */
    data: function()
    {
        return this._record.data;
    },

    /**
     * @return {string}
     */
    type: function()
    {
        return this._record.type;
    },

    /**
     * @return {string}
     */
    frameId: function()
    {
        return this._record.frameId || "";
    },

    /**
     * @return {?Array.<!ConsoleAgent.CallFrame>}
     */
    stackTrace: function()
    {
        if (this._record.stackTrace && this._record.stackTrace.length)
            return this._record.stackTrace;
        return null;
    },

    /**
     * @param {string} key
     * @return {?Object}
     */
    getUserObject: function(key)
    {
        if (!this._userObjects)
            return null;
        return this._userObjects.get(key);
    },

    /**
     * @param {string} key
     * @param {?Object|undefined} value
     */
    setUserObject: function(key, value)
    {
        if (!this._userObjects)
            this._userObjects = new StringMap();
        this._userObjects.put(key, value);
    },

    /**
     * @param {string} message
     */
    addWarning: function(message)
    {
        if (!this._warnings)
            this._warnings = [];
        this._warnings.push(message);
    },

    /**
     * @return {?Array.<string>}
     */
    warnings: function()
    {
        return this._warnings;
    }
}

/**
 * @constructor
 * @implements {WebInspector.OutputStream}
 * @param {!WebInspector.TimelineModel} model
 * @param {!{cancel: function()}} reader
 * @param {!WebInspector.Progress} progress
 */
WebInspector.TimelineModelLoader = function(model, reader, progress)
{
    this._model = model;
    this._reader = reader;
    this._progress = progress;
    this._buffer = "";
    this._firstChunk = true;
}

WebInspector.TimelineModelLoader.prototype = {
    /**
     * @param {string} chunk
     */
    write: function(chunk)
    {
        var data = this._buffer + chunk;
        var lastIndex = 0;
        var index;
        do {
            index = lastIndex;
            lastIndex = WebInspector.TextUtils.findBalancedCurlyBrackets(data, index);
        } while (lastIndex !== -1)

        var json = data.slice(0, index) + "]";
        this._buffer = data.slice(index);

        if (!index)
            return;

        if (this._firstChunk) {
            this._firstChunk = false;
            this._model.reset();
        } else {
            // Prepending "0" to turn string into valid JSON.
            json = "[0" + json;
        }

        var items;
        try {
            items = /** @type {!Array.<!TimelineAgent.TimelineEvent>} */ (JSON.parse(json));
        } catch (e) {
            WebInspector.console.error("Malformed timeline data.");
            this._model.reset();
            this._reader.cancel();
            this._progress.done();
            return;
        }

        // Skip 0-th element - it is either version or 0.
        for (var i = 1, size = items.length; i < size; ++i)
            this._model._addRecord(items[i]);
    },

    close: function()
    {
    }
}

/**
 * @constructor
 * @param {!WebInspector.OutputStream} stream
 */
WebInspector.TimelineSaver = function(stream)
{
    this._stream = stream;
}

WebInspector.TimelineSaver.prototype = {
    /**
     * @param {!Array.<*>} payloads
     * @param {string} version
     */
    save: function(payloads, version)
    {
        this._payloads = payloads;
        this._recordIndex = 0;
        this._prologue = "[" + JSON.stringify(version);

        this._writeNextChunk(this._stream);
    },

    _writeNextChunk: function(stream)
    {
        const separator = ",\n";
        var data = [];
        var length = 0;

        if (this._prologue) {
            data.push(this._prologue);
            length += this._prologue.length;
            delete this._prologue;
        } else {
            if (this._recordIndex === this._payloads.length) {
                stream.close();
                return;
            }
            data.push("");
        }
        while (this._recordIndex < this._payloads.length) {
            var item = JSON.stringify(this._payloads[this._recordIndex]);
            var itemLength = item.length + separator.length;
            if (length + itemLength > WebInspector.TimelineModelImpl.TransferChunkLengthBytes)
                break;
            length += itemLength;
            data.push(item);
            ++this._recordIndex;
        }
        if (this._recordIndex === this._payloads.length)
            data.push(data.pop() + "]");
        stream.write(data.join(separator), this._writeNextChunk.bind(this));
    }
}
