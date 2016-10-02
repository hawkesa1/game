var fileUploader;
var lyricTracker;
var currentStateStore;

$(document).ready(
		function($) {
			console.log("The Document is Ready!");
			fileUploader = new FileUploader(document
					.getElementById('fileUploadHolder'));
			lyricTracker = new LyricTracker($('#canvasContainer'));
			currentStateStore = new CurrentStateStore();
		});
$(function() {
	$("#save").click(function() {
		saveLyrics(lineArrayToJSON(), currentStateStore.currentSongId);
	});
});
$(function() {
	$("#loadButton").click(function() {
		loadTrack();
		loadCurrentTab();
	});
});
$(function() {
	$("#lyricTextButton").click(function() {
		convertLyricTextToWords();
	});
});
$(function() {
	$("#wordInfoPlay").click(function() {
		var wordId = $('#wordInfoId').val();
		var lineIndex = wordId.split('_')[1];
		var wordIndex = wordId.split('_')[2];
		var aLineObject = currentStateStore.lineArray[lineIndex];
		var aWordObject = aLineObject.words[wordIndex];
		playWord(aWordObject);
	});
});

$(function() {
	$("#wordInfoPlayLine")
			.click(
					function() {
						var wordId = $('#wordInfoId').val();
						var lineIndex = wordId.split('_')[1];
						var wordIndex = 0;
						var aLineObject = currentStateStore.lineArray[lineIndex];
						var aWordObject = aLineObject.words[wordIndex];
						var vid = document.getElementById("audio");
						if (aWordObject.startTime && aWordObject.startTime >= 0) {
							vid.currentTime = aWordObject.startTime / 1000;
							vid.play();
							currentStateStore.stopAtTime = aLineObject.words[aLineObject.words.length - 1].endTime;
						}
					});
});
$(function() {
	$("#playPauseButton").click(function(e) {
		e.preventDefault();
		var vid = document.getElementById("audio");
		if (vid.paused) {
			vid.play();
			$('#playPauseButton').text("Pause");
		} else {
			vid.pause();
			$('#playPauseButton').text("Play");
		}
	});
});



$(function() {
	$("#playSlowButton").click(function(e) {
		e.preventDefault();
		var vid = document.getElementById("audio");
		if (vid.playbackRate == 0.5) {
			$("#playSlowButton").text("Slow");
			$("#playFastButton").text("Fast");
			vid.playbackRate = 1;
		} else {
			$("#playSlowButton").text("Normal");
			$("#playFastButton").text("Fast");
			vid.playbackRate = 0.5;
		}
		vid.play();
	});
});
$(function() {
	$("#playFastButton").click(function(e) {
		e.preventDefault();
		var vid = document.getElementById("audio");
		if (vid.playbackRate == 2) {
			$("#playFastButton").text("Fast");
			$("#playSlowButton").text("Slow");
			vid.playbackRate = 1;
		} else {
			$("#playSlowButton").text("Slow");
			$("#playFastButton").text("Normal");
			vid.playbackRate = 2;
		}
		vid.play();
	});
});
$(function() {
	$("#skipBack5Button").click(function(e) {
		e.preventDefault();
		var vid = document.getElementById("audio");
		vid.currentTime = vid.currentTime - 5;
	});
});
$(function() {
	$("#skipForward5Button").click(function(e) {
		e.preventDefault();
		var vid = document.getElementById("audio");
		vid.currentTime = vid.currentTime + 5;
	});
});

$(function() {
	$("#enableTextView").click(function(e) {
		e.preventDefault();
		enableLyricTextView();
	});
});
$(function() {
	$("#enableWordView").click(function(e) {
		e.preventDefault();
		enableLyricWordView();
	});
});
$(function() {
	$("#addCurrentWord").mouseup(function() {
		if (!document.getElementById('audio').paused) {
			addCurrentWordEnd();
		}
	});
});
$(function() {
	$("#addCurrentWord").mousedown(function() {
		if (!document.getElementById('audio').paused) {
			addCurrentWordStart();
		}
	});
});


$(function() {
	$("#clickButton").mousedown(function(e) {
		console.log("Clicked");
		e.preventDefault();
		addCurrentGameClickStart();
		
		
	});
});
$(function() {
	$("#clickButton").mouseup(function(e) {
		console.log("Clicked");
		e.preventDefault();
		addCurrentGameClickEnd();
	});
});





$(function() {
	$("#removePreviousWord").mouseup(
			function() {
				var word = findWordById(currentStateStore.lastAddedWordId);
				delete word.startTime;
				delete word.endTime;
				$('#lyrics').html(generateLyrics(currentStateStore.lineArray));
				addClickToLyrics();

				var container = $('#lyrics')
				var scrollTo = $('#' + currentStateStore.nextWordToAddId);
				container.scrollTop((scrollTo.offset().top)
						- container.offset().top + container.scrollTop());
			});
});

var rtime;
var timeout = false;
var delta = 500;
$(window).resize(function() {
	rtime = new Date();
	if (timeout === false) {
		timeout = true;
		setTimeout(resizeend, delta);
	}
});

function resizeend() {
	if (new Date() - rtime < delta) {
		setTimeout(resizeend, delta);
	} else {
		console.log("done resizing")
		timeout = false;
	}
}
var spaceIsDown = false;
$(document).keydown(
		function(e) {
			if (e.keyCode == 32 && e.target == document.body) {
				e.preventDefault();
			}
			if (e.which == 32 && !spaceIsDown
					&& currentStateStore.currentLyricView === "WORD_VIEW") {
				e.preventDefault();
				$('#clickButton').mousedown();
				$('#clickButton').addClass("activeProgramatically");
				spaceIsDown = true;
			}
		});
$(document).keyup(function(e) {
	if (e.keyCode == 32 && e.target == document.body) {
		e.preventDefault();
	}
	if (e.which == 32 && currentStateStore.currentLyricView === "WORD_VIEW") {
		e.preventDefault();
		$('#clickButton').mouseup();
	}
	$('#clickButton').removeClass("activeProgramatically");
	spaceIsDown = false;
	return true;
});
