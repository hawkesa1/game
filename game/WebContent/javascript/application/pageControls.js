var updatePageDetails = function(json) {
	$('#trackTitle').html(json.title);
	$('#trackArtist').html(json.artist);
	$('#trackAlbum').html(json.album);
}

var updateConsole = function(text) {
	var holder = document.getElementById('fileUploadHolder');
	holder.innerHTML += text;
	$('#fileUploadHolder').scrollTop($('#fileUploadHolder')[0].scrollHeight);
}
var clearConsole = function(text) {
	var holder = document.getElementById('fileUploadHolder');
	holder.innerHTML = "";
}

function loadCreateTab() {
	$('#currentTab').removeClass('visibleTab');
	$('#loadTab').removeClass('visibleTab');
	$('#currentTab').addClass('hiddenTab');
	$('#loadTab').addClass('hiddenTab');
	$('#newTab').removeClass('hiddenTab');
	$('#newTab').addClass('visibleTab');
	console.log("Yo")
}
function loadCurrentTab() {
	$('#newTab').removeClass('visibleTab');
	$('#loadTab').removeClass('visibleTab');
	$('#newTab').addClass('hiddenTab');
	$('#loadTab').addClass('hiddenTab');
	$('#currentTab').removeClass('hiddenTab');
	$('#currentTab').addClass('visibleTab');
	console.log("Yo")
}
function loadLoadTab() {
	$('#currentTab').removeClass('visibleTab');
	$('#newTab').removeClass('visibleTab');
	$('#currentTab').addClass('hiddenTab');
	$('#newTab').addClass('hiddenTab');

	$('#loadTab').removeClass('hiddenTab');
	$('#loadTab').addClass('visibleTab');
	console.log("Yo")
}

function addClickToLyrics() {
	$(function() {
		$(".word").click(function(event) {
			wordClicked(event.target.id);
		});
	});
	$(function() {
		$(".word").mouseover(function(event) {
			wordMouseOver(event.target.id);
		});
	});
	$(function() {
		$(".word").mouseout(function(event) {
			wordMouseOut(event.target.id);
		});
	});
}

function playPause() {
	var vid = document.getElementById("audio");
	if (vid.paused) {
		vid.play();
		$('#playPause').val("Pause");
	} else {
		vid.pause();
		$('#playPause').val("Play");
	}
}

var currentlyAddingWord = false;

function formatTime(number) {
	// return number.toFixed(2); // this seems to break drag and drop!
	return number;
}



//var vid = document.getElementById("audio");


//if (!currentStateStore.currentPlayingWord) {
//	currentStateStore.missedClickTime = vid.currentTime;
//	vid.pause();
//}

function addCurrentGameClickStart() {
	 	var aGameClick=new GameClick();
	 	currentStateStore.currentlyAddingGameClick=true;
	 	aGameClick.startTime=formatTime($("#audio").prop("currentTime") * 1000);
		currentStateStore.currentlyAddingGameClick = true;
		currentStateStore.gameClicks.push(aGameClick);
		console.log("Added a new click start time: " + currentStateStore.gameClicks.length);
}

function addCurrentGameClickEnd() {
 	var aGameClick=currentStateStore.gameClicks[currentStateStore.gameClicks.length-1];
 	currentStateStore.currentlyAddingGameClick=false;
 	aGameClick.endTime=formatTime($("#audio").prop("currentTime") * 1000);
	console.log(currentStateStore.gameClicks);
}

function GameClick(startTime, endTime)
{
	this.startTime=startTime;
	this.endTime=endTime;
}

function addCurrentWordStart() {
	if (($("#audio").prop("currentTime") * 1000) > currentStateStore.highestEndTime
			&& currentStateStore.nextWordToAddId != "") {
		currentStateStore.currentlyAddingWord = true;
		findWordById(currentStateStore.nextWordToAddId);
		var aLineObject = currentStateStore.lineArray[currentStateStore.currentLineIndex];
		var aWordObject = aLineObject.words[currentStateStore.currentWordIndex];
		aWordObject.startTime = formatTime($("#audio").prop("currentTime") * 1000);

		if (currentStateStore.currentWordIndex == 0) {
			aLineObject.startTime = formatTime($("#audio").prop("currentTime") * 1000);
		}

		currentStateStore.currentSelectedWordId = aWordObject.id;
		$('#wordInfoId').val(currentStateStore.currentSelectedWordId)

		$('#wordInfoWord').val(
				aWordObject.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
		$('#wordInfoStartTime')
				.val(
						millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
		$('#wordInfoEndTime').val("");

		$('.word').removeClass("wordSelected");
		$(
				'#word_' + currentStateStore.currentLineIndex + "_"
						+ currentStateStore.currentWordIndex).addClass(
				"wordSelected");

		$('.word').removeClass("nextWordToAdd");
		$('.word').removeClass("wordBeingAdded");
		$('#' + aWordObject.id).addClass("wordBeingAdded");

		console.log("Adding: " + aWordObject.id);

	} else {
		console.log("You can't add words out of order!!!");
	}

}

function addCurrentWordEnd() {
	if (currentStateStore.currentlyAddingWord
			&& currentStateStore.nextWordToAddId != "") {
		var aLineObject = currentStateStore.lineArray[currentStateStore.currentLineIndex];
		var aWordObject = aLineObject.words[currentStateStore.currentWordIndex];
		currentStateStore.currentlyAddingWord = false;
		aWordObject.endTime = formatTime($("#audio").prop("currentTime") * 1000);
		$('#wordInfoEndTime')
				.val(
						millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));
		$(
				'#word_' + currentStateStore.currentLineIndex + "_"
						+ currentStateStore.currentWordIndex).addClass(
				"wordHasTime");
		currentStateStore.lastAddedWordId = aWordObject.id;
		currentStateStore.highestEndTime = aWordObject.endTime;
		currentStateStore.currentWordIndex++;
		if (currentStateStore.currentWordIndex >= aLineObject.words.length) {
			currentStateStore.currentWordIndex = 0;
			aLineObject.endTime = formatTime($("#audio").prop("currentTime") * 1000);
			currentStateStore.currentLineIndex++;
			var container = $('#lyrics')
			var scrollTo = $('#' + currentStateStore.currentSelectedWordId);
			container.scrollTop((scrollTo.offset().top - 0)
					- container.offset().top + container.scrollTop());
		}
		if (currentStateStore.currentLineIndex < currentStateStore.lineArray.length) {
			aLineObject = currentStateStore.lineArray[currentStateStore.currentLineIndex];
			aWordObject = aLineObject.words[currentStateStore.currentWordIndex];
			currentStateStore.nextWordToAddId = aWordObject.id;
			$('#playLine_' + currentStateStore.currentLineIndex).removeClass(
					'playLineDisabled');
			$('.word').removeClass("nextWordToAdd");
			$(
					'#word_' + currentStateStore.currentLineIndex + "_"
							+ currentStateStore.currentWordIndex).addClass(
					"nextWordToAdd");
		} else {
			console.log("No More words to add");
			currentStateStore.nextWordToAddId = "";
		}
	} else {
		console.log("You can't add an end time without a start time");
	}
}

function lineArrayToJSON() {
	// html = JSON.stringify($.toJSON(currentStateStore.lineArray), null, 2);
	return $.toJSON(currentStateStore.lineArray);
}
function lineArrayToLRC() {
	var lrc = "";
	var words;
	var word;
	for (var i = 0; i < currentStateStore.lineArray.length; i++) {
		lrc += "["
				+ millisecondsToISOMinutesSecondsMilliseconds(currentStateStore.lineArray[i].startTime)
				+ "]";
		words = currentStateStore.lineArray[i].words;
		for (var j = 0; j < words.length; j++) {
			if (j != 0) {
				lrc += " ";
			}
			word = words[j];
			lrc += word.word
		}
		lrc += "\n";
	}
	return lrc;
}
function lineArrayToEnhancedLRC() {
	var lrc = "";
	var words;
	var word;
	for (var i = 0; i < currentStateStore.lineArray.length; i++) {
		lrc += "["
				+ millisecondsToISOMinutesSecondsMilliseconds(currentStateStore.lineArray[i].startTime)
				+ "]";
		words = currentStateStore.lineArray[i].words;
		for (var j = 0; j < words.length; j++) {
			if (j != 0) {
				lrc += " ";
			}
			word = words[j];
			lrc += "<"
					+ millisecondsToISOMinutesSecondsMilliseconds(word.startTime)
					+ ">";
			lrc += word.word
			lrc += "<"
					+ millisecondsToISOMinutesSecondsMilliseconds(word.endTime)
					+ ">";
		}
		lrc += "\n";
	}
	return lrc;
}

function enableLyricTextView(textToShow) {

	if (currentStateStore.currentLyricView === "TEXT_VIEW") {
	} else if (currentStateStore.currentLyricView === "SCRIPT_VIEW") {
		generateLyrics($.parseJSON($('#lyricScript').val()));
	} else if (currentStateStore.currentLyricView === "WORD_VIEW") {

	}
	$('#lyricText').show();
	$('#lyrics').hide();
	$('#lyricScript').hide();
	// if (confirm('You will lose any entered timings if you return to text
	// view. Are you sure?')) {

	var html = "";

	if (textToShow) {
		html = textToShow;
	} else {

		for (var i = 0; i < currentStateStore.lineArray.length; i++) {
			words = currentStateStore.lineArray[i].words;
			for (var j = 0; j < words.length; j++) {
				if (j != 0) {
					html += " ";
				}
				html += words[j].word;
			}
			html += "\n";
			$('#lyricText').html(html);
		}
		currentStateStore.lineArray.length = 0;
		currentStateStore.onlyWordsArray.length = 0;
	}
	$('#lyricText').html(html);
	currentStateStore.currentLyricView = "TEXT_VIEW";
	$("#editButton").addClass("hiddenDiv");
	$("#recordButton").removeClass("hiddenDiv");
}

function enableLyricWordView() {
	if (currentStateStore.currentLyricView === "WORD_VIEW") {
	} else if (currentStateStore.currentLyricView === "TEXT_VIEW") {
		$('#lyricText').hide();
		$('#lyricScript').hide();
		$('#lyrics').show();
		convertLyricTextToWords();
	} else if (currentStateStore.currentLyricView === "SCRIPT_VIEW") {
		$('#lyrics').html(generateLyrics($.parseJSON($('#lyricScript').val())));
		$('#lyricText').hide();
		$('#lyricScript').hide();
		$('#lyrics').show();
		addClickToLyrics();
	}
	currentStateStore.currentLyricView = "WORD_VIEW";
	$("#editButton").removeClass("hiddenDiv");
	$("#recordButton").addClass("hiddenDiv");
}
