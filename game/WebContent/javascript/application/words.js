function changeCurrentPlayingWordId() {
	console.log("Chaning current played word");
	$('.word').removeClass("wordPlaying");
	if (currentStateStore.currentPlayingWord) {
		$('#' + currentStateStore.currentPlayingWordId).addClass("wordPlaying");
		$('#currentWord1').html(currentStateStore.currentPlayingWord.word);
		var container = $('#lyrics')
		var scrollTo = $('#' + currentStateStore.currentPlayingWordId);
		container.scrollTop((scrollTo.offset().top - 0)
				- container.offset().top + container.scrollTop());
		
		
	} else {
		$('#currentWord1').html("&nbsp;");
		
	}
}

function changeCurrentSelectedWord() {
	var lineIndex = currentStateStore.currentSelectedWordId.split('_')[1];
	var wordIndex = currentStateStore.currentSelectedWordId.split('_')[2];
	var aLineObject = currentStateStore.lineArray[lineIndex];
	var aWordObject = aLineObject.words[wordIndex];

	var currentSelectedWordPreviousWordLineIndex = 0;
	var currentSelectedWordPreviousWordWordIndex = 0;

	// get the previous word
	if (wordIndex == 0 && lineIndex == 0) {
		// current word is first word
		currentStateStore.currentSelectedWordPreviousWord = null;
	} else {
		if (wordIndex > 0) {
			// current word is not the first word in a line
			currentSelectedWordPreviousWordLineIndex = lineIndex;
			currentSelectedWordPreviousWordWordIndex = wordIndex - 1;
			currentStateStore.currentSelectedWordPreviousWord = currentStateStore.lineArray[currentSelectedWordPreviousWordLineIndex].words[currentStateStore.currentSelectedWordPreviousWordWordIndex];
		} else {
			// current word is the first word on the line
			currentSelectedWordPreviousWordLineIndex = lineIndex - 1;
			currentSelectedWordPreviousWordWordIndex = currentStateStore.lineArray[currentSelectedWordPreviousWordLineIndex].words.length - 1;
			currentStateStore.currentSelectedWordPreviousWord = currentStateStore.lineArray[currentSelectedWordPreviousWordLineIndex].words[currentStateStore.currentSelectedWordPreviousWordWordIndex];
		}
	}

	// get the next word
	// TO_DO

	// if it's the first word
	if (currentStateStore.currentSelectedWord.wordIndex === 0) {
		currentStateStore.currentSelectedWordPreviousWord = null;
	} else {
		currentStateStore.currentSelectedWordPreviousWord = currentStateStore.onlyWordsArray[currentStateStore.currentSelectedWord.wordIndex - 1];
	}
	if (currentStateStore.currentSelectedWord.wordIndex >= currentStateStore.onlyWordsArray.length - 1) {
		if (!currentStateStore.markerWordAtTheEnd) {
			currentStateStore.markerWordAtTheEnd=new Word();
			console.log("Created a markerWordAtTheEnd:" + currentStateStore.trackDuration * 10);
			currentStateStore.markerWordAtTheEnd.startTime = currentStateStore.trackDuration * 10;
		}
		currentStateStore.currentSelectedWordNextWord = currentStateStore.markerWordAtTheEnd;
	} else {
		currentStateStore.currentSelectedWordNextWord = currentStateStore.onlyWordsArray[currentStateStore.currentSelectedWord.wordIndex + 1]
		if (!currentStateStore.currentSelectedWordNextWord.startTime) {
			var aNewWord = new Word();
			aNewWord.startTime = 500000;
			currentStateStore.currentSelectedWordNextWord = aNewWord;
		}
	}
	// get the next word

	$('#wordInfoId').val(currentStateStore.currentSelectedWordId);
	$('#wordInfoWord').val(
			aWordObject.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
	$('#wordInfoStartTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
	$('#wordInfoEndTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));
	$('.word').removeClass("wordSelected");
	$('#word_' + lineIndex + "_" + wordIndex).addClass("wordSelected");
}

function millisecondsToISOMinutesSecondsMilliseconds(milliseconds) {
	if (!milliseconds) {
		return "00:00.000";
	}
	var date = new Date(null);
	date.setMilliseconds(milliseconds);
	return date.toISOString().substr(14, 9);
}

function convertLyricTextToWords() {
	var text = $('#lyricText').val();
	currentStateStore.lineArray = new Array();
	currentStateStore.lineArray = lyricsTextToObjects(text)
	$('#lyrics').html(generateLyrics(currentStateStore.lineArray));
	addClickToLyrics();
	currentStateStore.currentLineIndex = 0;
	currentStateStore.currentWordIndex = 0;
	var aLineObject = currentStateStore.lineArray[currentStateStore.currentLineIndex];
	var aWordObject = aLineObject.words[currentStateStore.currentWordIndex];
	currentStateStore.currentSelectedWordId = aWordObject.id;
	$('#wordInfoId').val(currentStateStore.currentSelectedWordId);

	$('#wordInfoWord').val(
			aWordObject.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
	$('#wordInfoStartTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
	$('#wordInfoEndTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));
	$('.word').removeClass("wordSelected");
	$(
			'#word_' + currentStateStore.currentLineIndex + "_"
					+ currentStateStore.currentWordIndex).addClass(
			"wordSelected");
}

function lyricsTextToObjects(lyricsText) {
	lyricsText = lyricsText.replace(/\\r\\n/g, '\n');
	lyricsText = lyricsText.replace(/ +(?= )/g, ''); // remove double spaces

	var lines1 = lyricsText.split('\n');
	var lines = new Array();
	var q = 0;
	for (var i = 0; i < lines1.length; i++) {
		if (lines1[i].trim() != "") {
			lines1[i] = lines1[i].trim();
			lines[q] = lines1[i];
			q++;
		}
	}
	var aWordObject;
	var aLineObject;
	var wordsArray;
	var words;
	var k = 0;
	for (var i = 0; i < lines.length; i++) {
		aLineObject = new LineObject();
		wordsArray = new Array();
		words = lines[i].split(' ');
		for (var j = 0; j < words.length; j++) {
			aWordObject = new WordObject();
			aWordObject.word = words[j];
			wordsArray[j] = aWordObject;
			aWordObject.wordIndex = k;
			currentStateStore.onlyWordsArray[k] = aWordObject;
			k++;
		}
		aLineObject.words = wordsArray;
		currentStateStore.lineArray[i] = aLineObject;
	}
	return currentStateStore.lineArray;
}

function playWord(aWordObject) {
	var vid = document.getElementById("audio");
	if (aWordObject.startTime && aWordObject.startTime >= 0) {
		vid.currentTime = aWordObject.startTime / 1000;
		vid.play();
		currentStateStore.stopAtTime = aWordObject.endTime;
	}
}

function playLine(lineIndex) {
	var wordIndex = 0;
	var aLineObject = currentStateStore.lineArray[lineIndex];
	var aWordObject = aLineObject.words[wordIndex];
	var vid = document.getElementById("audio");
	if (aWordObject.startTime && aWordObject.startTime >= 0) {
		vid.currentTime = aWordObject.startTime / 1000;
		vid.play();
		currentStateStore.stopAtTime = aLineObject.words[aLineObject.words.length - 1].endTime;
	}
}

function playFromLine(lineIndex) {
	var wordIndex = 0;
	var aLineObject = currentStateStore.lineArray[lineIndex];
	var aWordObject = aLineObject.words[wordIndex];
	var vid = document.getElementById("audio");
	if (aWordObject.startTime && aWordObject.startTime >= 0) {
		vid.currentTime = aWordObject.startTime / 1000;
		vid.play();
	}
}

function changeStart(timeInMs) {
	var wordId = $('#wordInfoId').val();
	var lineIndex = wordId.split('_')[1];
	var wordIndex = wordId.split('_')[2];
	var aLineObject = currentStateStore.lineArray[currentLineIndex];
	var aWordObject = aLineObject.words[currentWordIndex];
	aWordObject.startTime = aWordObject.startTime + timeInMs;
	$('#wordInfoStartTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
	$('#wordInfoEndTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));

}

function changeEnd(timeInMs) {
	var wordId = $('#wordInfoId').val();
	var lineIndex = wordId.split('_')[1];
	var wordIndex = wordId.split('_')[2];
	var aLineObject = currentStateStore.lineArray[currentLineIndex];
	var aWordObject = aLineObject.words[currentWordIndex];
	aWordObject.endTime = aWordObject.endTime + timeInMs;
	$('#wordInfoStartTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
	$('#wordInfoEndTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));
}

function findWordById(wordId) {
	var lineIndex = wordId.split('_')[1];
	var wordIndex = wordId.split('_')[2];
	currentStateStore.currentLineIndex = lineIndex;
	currentStateStore.currentWordIndex = wordIndex;
	var aLineObject = currentStateStore.lineArray[lineIndex];
	return aLineObject.words[wordIndex];
}

function wordClicked(wordId) {
	var aWordObject = findWordById(wordId);
	currentStateStore.currentSelectedWordId = aWordObject.id;
	$('#wordInfoId').val(currentStateStore.currentSelectedWordId)
	$('#wordInfoWord').val(
			aWordObject.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
	$('#wordInfoStartTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.startTime));
	$('#wordInfoEndTime').val(
			millisecondsToISOMinutesSecondsMilliseconds(aWordObject.endTime));
	$('.word').removeClass("wordSelected");
	$('#' + wordId).addClass("wordSelected");
	var vid = document.getElementById("audio");
	if (!aWordObject.startTime <= 0) {
		vid.currentTime = aWordObject.startTime / 1000;
		vid.play();
		currentStateStore.stopAtTime = aWordObject.endTime;
	}
}

function wordMouseOver(wordId) {
	if ($('#' + wordId).hasClass("wordHasTime")) {
		$('#' + wordId).addClass("wordHovered");
	}
}
function wordMouseOut(wordId) {
	$('#' + wordId).removeClass("wordHovered");
}

function resetStuff() {
	currentStateStore.onlyWordsArray = new Array();
	words = new Array();
	currentStateStore.lineArray = new Array();
}

function generateLyrics(lines) {
	resetStuff();
	currentStateStore.lineArray = lines;
	var html = "";
	var words;
	var id;
	var k = 0;
	var nextWordToAddFound = false;
	currentStateStore.nextWordToAddId = "";
	currentStateStore.highestEndTime = 0;
	currentStateStore.lastAddedWordId = "";
	for (var i = 0; i < lines.length; i++) {
		words = lines[i].words;
		html += "<div class='line'>";
		for (var j = 0; j < words.length; j++) {
			if (j === 0) {
				if (words[j].endTime) {
					html += "<a  class='playLine' id='playLine_" + i
							+ "'onclick='playLine(" + i
							+ ")' href='javascript:void(0);'>Play Line</a>";
				} else {
					html += "<a  class='playLine playLineDisabled' id='playLine_"
							+ i
							+ "'onclick='playLine("
							+ i
							+ ")' href='javascript:void(0);'>Play Line</a>";
				}
			}
			words[j].wordIndex = k;
			currentStateStore.onlyWordsArray[k] = words[j];
			k++;
			id = "word_" + i + "_" + j;
			words[j].id = id;
			if (words[j].startTime && words[j].endTime) {
				html += "<span class='word wordHasTime' id='" + id + "'>"
						+ words[j].word + "</span>" + " ";
				currentStateStore.highestEndTime = words[j].endTime;
				currentStateStore.lastAddedWordId = id;
			} else {
				if (nextWordToAddFound) {
					html += "<span class='word' id='" + id + "'>"
							+ words[j].word + "</span>" + " ";

				} else {
					nextWordToAddFound = true;
					html += "<span class='word wordSelected nextWordToAdd' id='"
							+ id + "'>" + words[j].word + "</span>" + " ";
					console.log("Next Word to Add:" + words[j].word);
					// this sets the line id!!
					findWordById(id);
					currentStateStore.nextWordToAddId = id;
					// nextWordToAdd=words[j].word;
					// console.log(nextWordToAdd);
					currentStateStore.currentSelectedWordId = words[j].id;
				}

			}
		}
		html += "</div>";
	}
	return html;
}


function Word(startTime, endTime, text) {
	this.startTime = startTime;
	this.endTime = endTime;
	this.text = text;
	this.hasBeenClicked=false;
}
function loadTrack() {
	var selectedValue = $('#loadTrack').find(":selected").val();
	loadATrack(selectedValue);
}
function WordObject() {

}
function LineObject() {

}
function SongObject() {

}
function CurrentlyDrawnWordObject() {

}
function TrackObject() {

}
