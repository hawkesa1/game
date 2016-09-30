var FileUploader = function(container) {
	this.bindEvents(container, this);
};

FileUploader.prototype.bindEvents = function(container, theFileUploader) {
	container.ondragover = function(e) {
		e.preventDefault();
		this.className = 'hover';
		return false;
	};
	container.ondragend = function(e) {
		e.preventDefault();
		this.className = '';
		return false;
	};
	container.ondragleave = function(e) {
		e.preventDefault();
		this.className = '';
		return false;
	};
	container.ondrop = function(e) {
		e.preventDefault();
		container.className = '';
		theFileUploader.readFiles(e.dataTransfer.files);
	}
}

FileUploader.prototype.readFiles = function(files) {
	clearConsole();
	var formData = new FormData();
	var file;
	for (var i = 0; i < files.length; i++) {
		file = files[i]
		if (i == 0) { // only allow 1 file at a time
			if (file.type.split("/")[0] === "audio") {
				if (file.size < (20 * 1024 * 1024)) {
					formData.append('file', file);
					updateConsole('<p>* Reading file: ' + file.name + '</p>');
					extractTags(file, formData);
				} else {
					updateConsole("<p class='bad'>* The maximum file size is 15 Mb.  This file is: '+ parseFloat((file.size / 1024 / 1024)).toFixed(2) + ' Mb</p>");
				}
			} else {
				updateConsole("<p class='bad'>* This is not an audio file: <i>"
						+ file.name + "</i>.  Please try again..</p>");
			}
		}
	}
	function extractTags(file, formData) {
		var url = file.urn || file.name;
		var tXxxDescription;
		var tXxxWavPointsDescription = "LYRICRECORDER.COM_WAVPOINTS_0.0.1";
		var tXxxLyricsDescription = "LYRICRECORDER.COM_LYRICS_0.0.1";
		var tXxxSongId = "LYRICRECORDER.COM_SONG_ID";
		var tXxxWavPointsValue;
		var tXxxLyricsValue;
		var tXxxSongIdValue;
		var tXxxWavPointsValid = false;
		var tXxxLyricsValid = false;

		updateConsole('<p>* Checking for existing tags</p>');

		ID3.loadTags(url, function() {
			var tags = ID3.getAllTags(url);
			if (tags.TXXX) {
				for (var i = 0; i < tags.TXXX.length; i++) {
					tXxxDescription = tags.TXXX[i].data.description;
					if (tXxxDescription == tXxxWavPointsDescription) {
						tXxxWavPointsValue = tags.TXXX[i].data.text;
						tXxxWavPointsValid = true;
					} else if (tXxxDescription == tXxxLyricsDescription) {
						tXxxLyricsValue = tags.TXXX[i].data.text;
						tXxxLyricsValid = true;
					} else if (tXxxDescription == tXxxSongId) {
						tXxxSongIdValue = tags.TXXX[i].data.text;
					}
				}
			}
			var results = {
				album : tags.album,
				artist : tags.artist,
				title : tags.title,
				tXxxWavPointsValue : tXxxWavPointsValue,
				tXxxLyricsValue : tXxxLyricsValue,
				tXxxSongIdValue : tXxxSongIdValue,
				tXxxWavPointsValid : tXxxWavPointsValid,
				tXxxLyricsValid : tXxxLyricsValid
			};
			functionToCallWhenID3TagRead(results, formData, file)
		}, {
			dataReader : ID3.FileAPIReader(file)
		});
		function functionToCallWhenID3TagRead(tags, formData, file) {
			if (tags.tXxxLyricsValid && tags.tXxxWavPointsValid) {
				updateConsole("<p class='good'>* Found valid tags</p>");
				// var file=formData.get('file');
				updateConsole("<p>* Loading track</p>");
				var blob = window.URL || window.webkitURL;
				fileURL = blob.createObjectURL(file);
				document.getElementById('audio').src = fileURL;
				updateConsole("<p>* Loaded track</p>");
				updatePageDetails(tags);
				fileUploadComplete(tags);
			} else {
				updateConsole('<p>* No valid tags found</p>');
				performUpload(formData);
			}

			function fileUploadComplete(tags) {
				lyricTracker.loadWavForm(tags);
				resetStuff();
				currentStateStore.lineArray = JSON.parse(tags.tXxxLyricsValue);
				$('#lyrics').html(generateLyrics(currentStateStore.lineArray));
				addClickToLyrics();
				enableLyricWordView();
				currentStateStore.currentSongId = tags.tXxxSongIdValue;
				audio.load();
				audio
						.addEventListener(
								'loadedmetadata',
								function() {
									currentStateStore.trackDuration = document
											.getElementById('audio').duration * 100;
								});
			}

			function performUpload(formData) {
				var conversionProgress = 0;
				var conversionIntervalFunction;
				updateConsole('<p id=\'fileUploadProgress\'>* Step 1/3 Uploading file to server 0%</p>');
				var xhr = new XMLHttpRequest();
				xhr.open('POST', './FileUpload');
				xhr.onload = function(progressEvent) {
					// progress.value = progress.innerHTML = 100;
					var fileConversionProgress = document
							.getElementById('fileConversionProgress');
					fileConversionProgress.innerHTML = "* Step 2/3 Converting file 100%";
					window.clearInterval(conversionIntervalFunction);
					conversionProgress = 0;
					updateConsole('<p>* Step 3/3 Downloading file and preparing interface</p>');
					if (progressEvent.target.response == "ERROR") {
						console.log("Some sort of error occurred");
						updateConsole("<p class='bad'>* An error occurred during the conversion process</p>");
					} else {
						var json = JSON.parse(progressEvent.target.response);
						currentStateStore.currentSongId = json.uniqueId;
						// Only do this when runnign in eclipse!!!!
						updateConsole('<p>* Waiting for eclipse to refresh ...</p>');
						setTimeout(
								function() {
									updatePageDetails(json);
									loadATrack(json.uniqueId);
									updateConsole("<p class='good'>* Processing complete</p>");

								}, currentStateStore.ECLIPSE_FILE_WAIT);
					}
				};

				xhr.onerror = function(event) {
					fileUploader
							.updateConsole('<p class=\'bad\'>* An error occurred with the upload. Please try again.</p>');
				};

				xhr.upload.onprogress = function(event) {
					if (event.lengthComputable) {
						var complete = (event.loaded / event.total * 100 | 0);
						var holder = document.getElementById('fileUploadProgress');
						holder.innerHTML = "* Step 1/3 Uploading file to server "
								+ complete + "%";
						if (complete == 100) {
							updateConsole('<p id=\'fileConversionProgress\'>* Step 2/3 Converting file 0%</p>');
							conversionIntervalFunction = setInterval(
									function() {
										var fileConversionProgress = document
												.getElementById('fileConversionProgress');
										conversionProgress += 1;
										fileConversionProgress.innerHTML = "* Step 2/3 Converting file "
												+ conversionProgress + "%";
										if (conversionProgress >= 100) {
											window
													.clearInterval(conversionIntervalFunction);
										}
									}, 100);
						}
					}
				}
				formData.append('userId', 'hawkesa');
				xhr.send(formData);
			}
		}
	}
}

