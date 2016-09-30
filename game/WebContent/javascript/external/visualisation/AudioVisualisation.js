//<![CDATA[
"use strict";
var audioContext, source, sourceAudio, graphicEqualizer, splitter, analyzer, analyzerType, merger, pendingUrls;
// fakeAudioContext was created only to act as a "null audio context", making at
// least the graph work in other browsers
function fakeAudioContext() {
}
fakeAudioContext.prototype = {
	sampleRate : 44100,
	createChannelSplitter : function() {
		return {};
	},
	createChannelMerger : function() {
		return {};
	},
	createBufferSource : function() {
		return {};
	},
	createBuffer : function(channels, filterLength, sampleRate) {
		if (sampleRate === undefined)
			return this.createBuffer(2, 1024, this.sampleRate);
		return {
			duration : filterLength / sampleRate,
			gain : 1,
			length : filterLength,
			numberOfChannels : channels,
			sampleRate : sampleRate,
			data : (function() {
				var a = new Array(channels), i;
				for (i = channels - 1; i >= 0; i--)
					a[i] = new Float32Array(filterLength);
				return a;
			})(),
			getChannelData : function(index) {
				return this.data[index];
			}
		};
	},
	createConvolver : function() {
		var mthis = this;
		return {
			buffer : null,
			context : mthis,
			normalize : true,
			numberOfInputs : 1,
			numberOfOutputs : 1
		};
	}
};
function main() {
	pendingUrls = [];
	audioContext = (window.AudioContext ? new AudioContext()
			: (window.webkitAudioContext ? new webkitAudioContext()
					: new fakeAudioContext()));

	graphicEqualizer = new GraphicalFilterEditorControl(2048, audioContext);
	// graphicEqualizer.createControl($("equalizerPlaceholder"));
	analyzerType = null;
	analyzer = null;
	splitter = audioContext.createChannelSplitter();
	merger = audioContext.createChannelMerger();
	return true;
}

function txtFile_Change() {
	return selectSource(0);
}
function txtURL_Change() {
	return selectSource(1);
}
function cleanUpAnalyzer() {
	if (analyzer) {
		analyzer.stop();
		analyzer.destroyControl();
	}
	splitter.disconnect(0);
	splitter.disconnect(1);
	if (analyzer) {
		analyzer.analyzerL.disconnect(0);
		analyzer.analyzerR.disconnect(0);
		analyzerType = null;
		analyzer = null;
	}
	merger.disconnect(0);
	return true;
}
function enableButtons(enable) {
	var e = (enable ? "" : "disabled");
	$("btnPlay").disabled = e;

	$("btnStop").disabled = e;

	return true;
}
function showLoader(show) {
	// $("imgLoader").className = (show ? "" : "HID");
	return true;
}
function createObjURL(obj, opts) {
	var url = (window.URL || window.webkitURL), objurl = (opts ? url
			.createObjectURL(obj, opts) : url.createObjectURL(obj));
	pendingUrls.push(objurl);
	return objurl;
}
function freeObjURLs() {
	if (pendingUrls.length) {
		var i, url = (window.URL || window.webkitURL);
		for (i = pendingUrls.length - 1; i >= 0; i--)
			url.revokeObjectURL(pendingUrls[i]);
		pendingUrls.splice(0, pendingUrls.length);
	}
	return true;
}
function stop() {
	enableButtons(true);
	if (sourceAudio) {
		sourceAudio.pause();
		sourceAudio = null;
		source.disconnect(0);
		source = null;
	} else if (source) {
		source.stop(0);
		source.disconnect(0);
		source = null;
	}
	graphicEqualizer.filter.convolver.disconnect(0);
	// Free all created URL's only at safe moments!
	freeObjURLs();
	return cleanUpAnalyzer();
}
function handleError(e) {
	showLoader(false);
	enableButtons(true);
	// Free all created URL's only at safe moments!
	freeObjURLs();
	alert(e);
	return true;
}
function updateConnections() {
	var t = "soundParticles";
	if (!source)
		return false;
	graphicEqualizer.filter.convolver.disconnect(0);
	switch (t) {
	case "soundParticles":
	case "fft":
	case "wl":
		if (analyzerType !== t) {
			if (analyzer)
				cleanUpAnalyzer();
			analyzerType = t;
			switch (t) {
			case "soundParticles":
				analyzer = new SoundParticles(audioContext,
						graphicEqualizer.filter);
				break;
			}
			analyzer.createControl(document
					.getElementById("analyzerPlaceholder"),
					"visualisationCanvasId");
		}

		graphicEqualizer.filter.convolver.connect(splitter, 0, 0);
		splitter.connect(analyzer.analyzerL, 0, 0);
		splitter.connect(analyzer.analyzerR, 1, 0);

		analyzer.analyzerL.connect(merger, 0, 0);
		analyzer.analyzerR.connect(merger, 0, 1);

		merger.connect(audioContext.destination, 0, 0);
		return analyzer.start();
	default:
		graphicEqualizer.filter.convolver.connect(audioContext.destination, 0,
				0);
		return cleanUpAnalyzer();
	}
}
function filterLengthChanged() {
	graphicEqualizer.changeFilterLength(2048);
	return true;
}
function finishLoadingIntoMemoryAndPlay(array, name, offline) {
	try {
		console.log("here");

		// Decode the array asynchronously
		audioContext
				.decodeAudioData(
						array,
						function(buffer) {
							try {
								if (offline) {
									// Start processing the decoded buffer
									// offline
									var offlineAudioContext = (window.OfflineAudioContext ? new OfflineAudioContext(
											buffer.numberOfChannels,
											buffer.length, buffer.sampleRate)
											: (window.webkitOfflineAudioContext ? new webkitOfflineAudioContext(
													buffer.numberOfChannels,
													buffer.length,
													buffer.sampleRate)
													: null));
									if (!offlineAudioContext)
										return handleError("Offline audio processing is not supported!");
									source = offlineAudioContext
											.createBufferSource();
									source.buffer = buffer;
									source.loop = false;
									graphicEqualizer
											.changeAudioContext(offlineAudioContext);
									source.connect(
											graphicEqualizer.filter.convolver,
											0, 0);
									graphicEqualizer.filter.convolver.connect(
											offlineAudioContext.destination, 0,
											0);
									source.start(0);
									offlineAudioContext.oncomplete = function(
											renderedData) {
										var worker = new Worker(
												"WaveExporterWorker.js"), leftBuffer = renderedData.renderedBuffer
												.getChannelData(0).buffer, rightBuffer = ((renderedData.renderedBuffer.numberOfChannels > 1) ? renderedData.renderedBuffer
												.getChannelData(1).buffer
												: null);
										worker.onmessage = function(e) {
											showLoader(false);
											enableButtons(true);
											// Massive workaround to save the
											// file (simulate a click on a
											// link)!
											// (From:
											// http://updates.html5rocks.com/2011/08/Saving-generated-files-on-the-client-side)
											var a = document.createElement("a"), i = name
													.lastIndexOf("."), evt;
											a.href = createObjURL(new Blob(
													e.data,
													{
														type : "application/octet-stream"
													}));
											a.download = ((i > 0) ? (name
													.substring(0, i) + " - (Filtered).wav")
													: "FilteredFile.wav");
											// a.click(); //Works on Chrome, but
											// not on Firefox...
											evt = document
													.createEvent("MouseEvents");
											evt.initMouseEvent("click", true,
													false, window, 0, 0, 0, 0,
													0, false, false, false,
													false, 0, null);
											a.dispatchEvent(evt);
											return true;
										};
										worker
												.postMessage(
														{
															left : leftBuffer,
															right : rightBuffer,
															length : renderedData.renderedBuffer.length,
															sampleRate : (renderedData.renderedBuffer.sampleRate | 0)
														}, [ leftBuffer,
																rightBuffer ]);
										return true;
									};
									offlineAudioContext.startRendering();
								} else {
									// Play the decoded buffer
									source = audioContext.createBufferSource();
									source.buffer = buffer;
									source.loop = true;
									graphicEqualizer
											.changeAudioContext(audioContext);
									source.connect(
											graphicEqualizer.filter.convolver,
											0, 0);
									updateConnections();
									source.start(0);
									showLoader(false);
									$("btnStop").disabled = "";
								}
							} catch (e) {
								handleError(e);
							}
							return true;
						}, function() {
							return handleError("Error decoding the file!");
						});
	} catch (e) {
		handleError(e);
	}
	return true;
}
function loadIntoMemoryAndPlay(offline) {
	var r, f, done = false;
	showLoader(true);

	f = $("txtFile").files[0];
	// Read the chosen file into memory
	r = new FileReader();
	r.onload = function() {
		done = true;
		finishLoadingIntoMemoryAndPlay(r.result, f.name, offline);
		return true;
	};
	r.onerror = function() {
		return handleError("Error reading the file!");
	};
	r.onloadend = function() {
		if (!offline && !done)
			showLoader(false);
		return true;
	};
	r.readAsArrayBuffer(f);

	return true;
}

function startVisualisation() {
	console.log("Starting here");
	sourceAudio = document.getElementById("audio");

	if (!source) {
		source = audioContext.createMediaElementSource(sourceAudio);
		sourceAudio.load();
	}
	

	graphicEqualizer.changeAudioContext(audioContext);
	source.connect(graphicEqualizer.filter.convolver, 0, 0);
	updateConnections();
	// sourceAudio.play();
	$("btnStop").disabled = "";
	return true;
}

function prepareStreamingAndPlay() {
	console.log("Starting here");
	sourceAudio = new Audio(createObjURL($("txtFile").files[0]));
	source = audioContext.createMediaElementSource(sourceAudio);
	sourceAudio.load();
	graphicEqualizer.changeAudioContext(audioContext);
	source.connect(graphicEqualizer.filter.convolver, 0, 0);
	updateConnections();
	sourceAudio.play();
	$("btnStop").disabled = "";
	return true;
}
function play() {
	try {
		console.log("play");
		prepareStreamingAndPlay();
	} catch (e) {
		handleError(e);
	}
	return true;
}

// ]]>
