function loadATrack(selectedValue) {
	var audio = document.getElementById('audio');
	audio.src = mp3Location + selectedValue + ".MP3";
	loadWaveForm(selectedValue);
	loadLyricsData(selectedValue);
	currentStateStore.currentSongId = selectedValue;
	audio.load();
	audio.addEventListener('loadedmetadata', function() {
		currentStateStore.trackDuration = document.getElementById('audio').duration * 100;
	});

	$('#lyricText').hide();
	$('#lyrics').show();
	currentStateStore.currentLyricView = "WORD_VIEW";
}

function saveLyrics(JSONFormattedLyricData, songId) {
	console.log("Save Lyrics" + songId + JSONFormattedLyricData);
	$.ajax({
		type : 'POST',
		url : './LyricUploadServlet',
		data : {
			"JSONFormattedLyricData" : JSONFormattedLyricData,
			"songId" : songId
		},
		success : function(text) {
			successfullySavedLyrics(text);
		},
		error : function(xhr) {
			alert("An error occured: " + xhr.status + " " + xhr.statusText);
		}
	});
	function successfullySavedLyrics(mp3MetaData1) {
		var mp3MetaData = JSON.parse(mp3MetaData1);
		var text = mp3MetaData.title ? mp3MetaData.title : mp3MetaData.uniqueId;
		console.log(mp3MetaData);
		console.log("uniqueid" + mp3MetaData.downloadId);
		setTimeout(function() {
			var linkAddress = downloadableMp3Location + mp3MetaData.downloadId;
			console.log("downloadableMp3Location: " + linkAddress);
			$('#downloadableLink').html(
					"<a href='" + linkAddress + "' download='" + text
							+ ".MP3'>" + text + ".MP3</a>");
		}, currentStateStore.ECLIPSE_FILE_WAIT);
	}
}



function loadWaveForm(wavFormFile) {
	$.ajax({
		type : 'GET',
		url : './resources/wavForm/' + wavFormFile + '.TXT',
		data : null,
		success : function(text) {
			processResponse(text);
		}
	});
	function processResponse(text) {
		lyricTracker.generateWaveForm(text);
	}
}

function loadLyricsData(wavFormFile) {
	$.ajax({
		type : 'GET',
		url : './resources/mp3MetaData/' + wavFormFile + '.json',
		data : null,
		cache : false,
		success : function(text) {
			generateLyricData(text);
		},
		error : function(xhr) {
			// alert("An error occured: " + xhr.status + " " + xhr.statusText);
			generateLyricData("");
		}
	});
	function generateLyricData(text) {
		console.log("Hoopla:" + text.lyricRecorderSynchronisedLyrics)

		if (text.lyricRecorderSynchronisedLyrics
				&& text.lyricRecorderSynchronisedLyrics != "") {
			console.log("loading synchronised lyrics");
			try {
				resetStuff();
				currentStateStore.lineArray = JSON.parse(text.lyricRecorderSynchronisedLyrics);
				$('#lyrics').html(generateLyrics(currentStateStore.lineArray));
				addClickToLyrics();
			} catch (e) {
				console.log("Error loading synchronised lyrics");
				resetStuff();
				enableLyricTextView("Please enter some lyrics here ...")
			}
		} else if (text.unsynchronisedLyrics != "") {
			console.log("loading unsycnhronised lyrics");
			resetStuff();
			enableLyricTextView(text.unsynchronisedLyrics);
		} else {
			console.log("No lyrics found");
			resetStuff();
			enableLyricTextView("Please enter some lyrics here ...")
		}
	}
}
