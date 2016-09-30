var isAWordHovered = false;
var isAWordEdgeHovered = false;
var isAWordPlaying = false;
var startOfWordMouseDownX = 0;
var endOfWordMouseDownX = 0;
var middleOfWordMouseDownX = 0;
var trackingMouseDownX = 0;
var LyricTracker = function(container) {

	var WAV_FILE_TIME_GAP = 10;
	var DRAW_TIME_BY_PAGE_WIDTH = 0;
	var POINT_SPACING = 2;
	var X_MOVE = 0;
	var Y_MOVE = 80;
	var arcRadius = 2;
	var SHIFT_TO_FIX_LINE_THICKNESS = 0.5;
	var wordSelectedColour = "#ccff33";
	var wordHoveredColour = "orange";
	var wordPlayingColour = "#00ff00";
	var wordStandardColour = 'white';
	var wordEdgeColour = "green";
	var trackingSquareColour = 'white';
	var beforeTimeCoverColour = 'white';
	var wavLineColour = 'white';
	var dividerLineColour = '#00ff00';
	var canvasFontMarker = "10px Calibri";
	var canvasFontMarkerColour = 'white';
	var canvasFontText = "20px Calibri";
	var canvasFontTextColour = 'white';
	var wordBoxY = 150.5;
	var wordBoxHeight = 20;
	var TRACKING_AREA_BOTTOM_Y = 25;
	var BEFORE_TIME_WIDTH = 200;
	var firstPass = true;
	var aWord;
	var tenths = 0;
	var screenPressed = false;
	var startX = 0;
	var veryStartX = 0;
	var clickStartTime = 0;
	var wasPaused = true;
	var clickedWhilePausedX = 0;
	var trackingClicked = 0;
	var trackingSquareX = 0;
	var hoverWhilePausedX = 0;
	var doubleClickedWhilePausedX = 0;
	var canvas1Height = 200;
	var canvas1Width = 800;

	this.canvas = document.createElement('canvas');
	this.canvas.width = canvas1Width;
	this.canvas.height = canvas1Height;
	this.canvas.id = "canvas1";
	this.canvas.context = this.canvas.getContext('2d');
	container.html(this.canvas);
	bindCanvasTouchControls();

	LyricTracker.prototype.loadWavForm = function(tags) {
		console.log('loading wav form');
		this.generateWaveForm(tags.tXxxWavPointsValue);
	}

	LyricTracker.prototype.generateWaveForm = function(text) {
		var wavePointsArray = waveFormTextToArray(text)
		waveForm = new WaveForm(500, 0.25, X_MOVE, Y_MOVE, BEFORE_TIME_WIDTH,
				POINT_SPACING, wavePointsArray);
		animate();
	}

	function waveFormTextToArray(waveFormText) {
		waveFormText = waveFormText.replace(/\\r\\n/g, '\n');
		var tempLines = waveFormText.split('\n');
		var wp = 0;
		var wavePoints = [];
		var startPoints = BEFORE_TIME_WIDTH / 2;
		var time, yHigh, yLow;
		for (var i = 0; i < startPoints; i++) {
			wavePoints[wp++] = new WavePoint(0, 0, 0);
		}
		for (var i = 0; i < tempLines.length; i++) {
			time = ((tempLines[i].split(',')[0]));
			yLow = ((tempLines[i].split(',')[1]));
			yHigh = ((tempLines[i].split(',')[2]));
			wavePoints[wp++] = new WavePoint(time, yLow, yHigh);
		}
		return wavePoints;
	}
	function WavePoint(time, yLow, yHigh) {
		this.time = time;
		this.yHigh = yHigh;
		this.yLow = yLow;
	}

	function WaveForm(drawTime, pointHeight, xShift, yShift, currentLine,
			pointSpacing, wavePoints) {
		this.drawTime = drawTime; // The number of miliseconds ahead to draw
		this.pointHeight = pointHeight;// The multiplier for pointHeight
		this.xShift = xShift; // The distance to shift points on x axis
		this.yShift = yShift; // The distance to shift points on y axis
		this.currentLine = currentLine; // The distance in of the 0 second mark
		// on
		// the x-axis
		this.pointSpacing = pointSpacing; // The distance between points on
		// x-axis
		this.wavePoints = wavePoints; // The array of WavePoint objects
		this.pointX = 0;
		this.pointY = 0;
		this.currentYPoint = 0;
		this.first = true;
		this.wavePoint;
		this.startTime = 0;
	}

	// Receives the currentTimeof the audio file and the context of the canvas

	WaveForm.prototype.draw = function(time, ctx) {
		var vid = document.getElementById("audio");

		if (vid.currentTime < 0.2) {
			currentStateStore.missedClickTime = 0;
			vid.play();
		} else {
			if (currentStateStore.missedClickTime > 0) {
				console.log(currentStateStore.missedClickTime);
				if (currentStateStore.missedClickTime > 20) {
					vid.currentTime = vid.currentTime - 2;
				} else if (currentStateStore.missedClickTime > 10) {
					vid.currentTime = vid.currentTime - 1;
				} else {
					vid.currentTime = vid.currentTime - 0.1;
				}
				currentStateStore.missedClickTime = vid.currentTime;
			}
		}

		if (vid.paused) {
			$('#playPauseButton').text("Play");
		} else {
			$('#playPauseButton').text("Pause");
		}
		if (time > currentStateStore.stopAtTime) {
			// Because it misses and looks messy
			document.getElementById("audio").currentTime = currentStateStore.stopAtTime / 1000;
			vid.pause();
			currentStateStore.stopAtTime = 999999;
		}

		// The wav file has 1 entry per WAV_FILE_TIME_GAP (usually 10ms)
		this.startTime = Math.round((time) / WAV_FILE_TIME_GAP);

		ctx.moveTo(this.xShift, this.yShift + SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.beginPath();
		ctx.strokeStyle = wavLineColour;
		this.first = true;
		// Draw Upper Line
		var point = 0;
		// We only draw part of the full audio, so we are only interested in the
		// time between start time and the upper limit
		for (var i = this.startTime; i < (this.startTime + (this.drawTime)); i++) {
			// to determine the x location of the point
			this.pointX = ((i - this.startTime) * this.pointSpacing)
					+ this.xShift;
			point = 0;
			// to determine the y location of the point
			if (i < this.wavePoints.length) {
				point = this.wavePoints[i].yHigh;
			} else {
				point = 0;
			}
			this.pointY = (point * -(this.pointHeight)) + this.yShift;
			if (this.first) {
				this.first = false;
				drawArc(this.pointX, this.pointY, arcRadius);
			}
			ctx.lineTo(this.pointX, this.pointY + SHIFT_TO_FIX_LINE_THICKNESS);
			if (this.pointX == this.xShift + this.currentLine) {
				this.currentYPoint = this.pointY;
			}
		}
		ctx.strokeStyle = wavLineColour;
		ctx.stroke();

		drawArc(this.pointX, this.pointY, arcRadius);
		drawArc(this.xShift + this.currentLine, this.currentYPoint, arcRadius);

		// Draw Lower Line
		ctx.moveTo(this.xShift, this.yShift + SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.beginPath();
		this.first = true;
		for (var i = this.startTime; i < (this.startTime + this.drawTime); i++) {
			this.pointX = ((i - this.startTime) * this.pointSpacing)
					+ this.xShift;
			point = 0;
			if (i < this.wavePoints.length) {
				point = this.wavePoints[i].yLow;
			} else {
				point = 0;
			}
			this.pointY = (point * -(this.pointHeight)) + this.yShift;
			if (this.first) {
				this.first = false;
				drawArc(this.pointX, this.pointY, arcRadius);
			}
			ctx.lineTo(this.pointX, this.pointY + SHIFT_TO_FIX_LINE_THICKNESS);
			if (this.pointX == this.xShift + this.currentLine) {
				this.currentYPoint = this.pointY;
			}
		}

		ctx.strokeStyle = wavLineColour;
		ctx.stroke();
		drawArc(this.pointX, this.pointY, arcRadius);
		drawArc(this.xShift + this.currentLine, this.currentYPoint, arcRadius);

		isAWordPlaying = false;
		isAWordHovered = false;
		isAWordEdgeHovered = false;

		for (var i = 0; i < currentStateStore.gameClicks.length; i++) {
			aGameClick = currentStateStore.gameClicks[i];
			if (aGameClick.startTime) {
				var startTime = aGameClick.startTime / 10;
				if (startTime < this.startTime + 300) {
					// the word currently being drawn
					var endTime = aGameClick.endTime / 10;
					if (!endTime && startTime < this.startTime) {
						endTime = this.startTime;
					}
					if (startTime + (endTime - startTime) + 100 > this.startTime) {
						var clickClickX = (((startTime - this.startTime) + 100) * this.pointSpacing)
								+ this.xShift;
						var width = ((endTime - startTime)) * this.pointSpacing;

						ctx.globalAlpha = 0.5;
						ctx.strokeRect(clickClickX, wordBoxY-30, width,
								wordBoxHeight);
						ctx.fillRect(wordX, wordBoxY-30, width, wordBoxHeight);
						ctx.globalAlpha = 1;

					}

				}
			}
		}

		for (var i = 0; i < currentStateStore.onlyWordsArray.length; i++) {
			aWord = currentStateStore.onlyWordsArray[i];
			// only interested in words that have a start time set
			if (aWord.startTime) {
				var startTime = aWord.startTime / 10;
				// only interested in words that are less than 3 seconds in the
				// future
				if (startTime < this.startTime + 300) {
					// the word currently being drawn
					var endTime = aWord.endTime / 10;
					if (!endTime && startTime < this.startTime) {
						endTime = this.startTime;
					}
					// only interested in words whose end time is less than a
					// second
					// in the past
					if (startTime + (endTime - startTime) + 100 > this.startTime) {
						var wordX = (((startTime - this.startTime) + 100) * this.pointSpacing)
								+ this.xShift;
						var width = ((endTime - startTime)) * this.pointSpacing;

						// Set the word currently being played
						if (startTime < this.startTime
								&& endTime > this.startTime) {
							isAWordPlaying = true;
							if (currentStateStore.currentPlayingWordId != aWord.id) {
								currentStateStore.currentPlayingWordId = aWord.id;
								currentStateStore.currentPlayingWord = aWord;
								changeCurrentPlayingWordId();
							}
						}

						// Allow a word to be selected if it is currently paused
						if (clickedWhilePausedX > 0) {
							if (clickedWhilePausedX > wordX
									&& clickedWhilePausedX < wordX + width) {
								if (clickedWhilePausedX > wordX
										&& clickedWhilePausedX < wordX + 5) {
									startOfWordMouseDownX = clickedWhilePausedX;
									// end
								} else if (clickedWhilePausedX > (wordX + width - 5)
										&& clickedWhilePausedX < wordX + width) {
									endOfWordMouseDownX = clickedWhilePausedX;
								} else {
									// middle
									middleOfWordMouseDownX = clickedWhilePausedX;
								}
								clickedWhilePausedX = 0;
								currentStateStore.currentSelectedWordId = aWord.id;
								currentStateStore.currentSelectedWord = aWord;
								changeCurrentSelectedWord();
							}
						}
						if (hoverWhilePausedX > 0
								&& (hoverWhilePausedX >= wordX && hoverWhilePausedX <= wordX
										+ width)) {
							// start
							if (hoverWhilePausedX > wordX
									&& hoverWhilePausedX <= wordX + 5) {
								isAWordEdgeHovered = true;
								// end
							} else if (hoverWhilePausedX >= (wordX + width - 5)
									&& hoverWhilePausedX <= wordX + width) {
								isAWordEdgeHovered = true;

							} else {
								// middle
								isAWordHovered = true;
							}
							currentStateStore.currentHoveredWordId = aWord.id;
						} else {
							currentStateStore.currentHoveredWordId = ""
						}
						if (doubleClickedWhilePausedX > 0
								&& (doubleClickedWhilePausedX > wordX && doubleClickedWhilePausedX < wordX
										+ width)) {
							doubleClickedWhilePausedX = 0;
							currentStateStore.currentDoubleClickedWordId = aWord.id;
							playWord(aWord);
						}

						if (aWord.id == currentStateStore.currentSelectedWordId) {
							if (aWord.id == currentStateStore.currentPlayingWordId) {
								ctx.fillStyle = wordPlayingColour;
							} else {
								ctx.fillStyle = wordSelectedColour;
							}
							ctx.save();
							ctx.strokeStyle = wordStandardColour;
							ctx.strokeRect(wordX, wordBoxY, width,
									wordBoxHeight);
							ctx.fillRect(wordX, wordBoxY, width, wordBoxHeight);
							ctx.restore();

							// Start
							ctx.beginPath();
							ctx.moveTo(wordX + 1, wordBoxY);
							ctx.lineTo(wordX + 1, (wordBoxY + wordBoxHeight));
							ctx.lineWidth = 4;
							ctx.strokeStyle = wordEdgeColour;
							ctx.globalAlpha = 0.5;
							ctx.stroke();

							// and End Lines
							ctx.beginPath();
							ctx.moveTo(wordX + width - 2, wordBoxY);
							ctx.lineTo(wordX + width - 2,
									(wordBoxY + wordBoxHeight));
							ctx.lineWidth = 4;
							ctx.strokeStyle = wordEdgeColour;
							ctx.globalAlpha = 0.5;
							ctx.save();
							ctx.stroke();
							ctx.restore();
							ctx.globalAlpha = 1;
							ctx.lineWidth = 1;
						} else if ((aWord.id == currentStateStore.currentHoveredWordId)) {
							if (aWord.id == currentStateStore.currentPlayingWordId) {
								ctx.fillStyle = wordPlayingColour;
								ctx.strokeStyle = wordStandardColour;
							} else {
								ctx.fillStyle = wordHoveredColour;
								ctx.strokeStyle = wordStandardColour;
							}
							ctx.save();
							ctx.globalAlpha = 0.5;
							ctx.strokeRect(wordX, wordBoxY, width,
									wordBoxHeight);
							ctx.fillRect(wordX, wordBoxY, width, wordBoxHeight);
							ctx.globalAlpha = 1;
							ctx.restore();
						} else {
							if (aWord.id == currentStateStore.currentPlayingWordId) {
								ctx.fillStyle = wordPlayingColour;
								// ctx.fillStyle = "black";
							} else {
								ctx.fillStyle = canvasFontTextColour;
							}
							ctx.save();
							if (aWord.id == currentStateStore.currentPlayingWordId) {
								ctx.fillStyle = wordPlayingColour;
							} else {
								ctx.fillStyle = "white";
								ctx.strokeStyle = wordStandardColour;
							}

							ctx.globalAlpha = 0.5;
							ctx.strokeRect(wordX, wordBoxY, width,
									wordBoxHeight);
							ctx.fillRect(wordX, wordBoxY, width, wordBoxHeight);
							ctx.restore();
							ctx.globalAlpha = 1;
						}
						ctx.font = canvasFontText;
						// ctx.fillStyle = wordStandardColour;
						ctx.fillText(aWord.word, wordX, (wordBoxY
								+ wordBoxHeight + 15))
					}
				}
			}
		}
		if (!isAWordPlaying) {
			if (currentStateStore.currentPlayingWordId != "") {
				currentStateStore.currentPlayingWordId = "";
				currentStateStore.currentPlayingWord = null;
				changeCurrentPlayingWordId();
			}
		}

		for (var i = this.startTime; i < (this.startTime + (this.drawTime)); i++) {
			if (firstPass) {
				firstPass = false;
			}
		}

		// Draw Numbers
		var point = 0;
		var bTime = 0;
		for (var i = this.startTime; i < (this.startTime + (this.drawTime)); i++) {
			this.pointX = ((i - this.startTime) * this.pointSpacing)
					+ this.xShift;
			point = 0;
			if (i < this.wavePoints.length) {
				bTime = this.wavePoints[i].time;
				point = this.wavePoints[i].yHigh;
			} else {
				point = 0;
			}
			tenths++;
			if (i % 10 == 0 && tenths != 0 && tenths != 100) {
				ctx.font = canvasFontMarker;
				ctx.fillStyle = canvasFontMarkerColour;
				ctx.fillText("|", this.pointX - 2, 131);
				ctx.fillText("|", this.pointX - 2, 37);

			}
			if (i % 100 == 0) {
				ctx.font = canvasFontMarker;
				ctx.fillStyle = canvasFontMarkerColour;
				ctx
						.fillText(secondsToTime((i / 100) - 1),
								this.pointX - 2, 131);
				ctx.fillText(secondsToTime((i / 100) - 1), this.pointX - 2, 37);
				tenths = 0;
			}
		}

		// Draw Top Time Line
		ctx.beginPath();
		ctx.strokeStyle = dividerLineColour;
		ctx
				.moveTo(this.xShift, this.yShift + 100
						+ SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.lineTo(X_MOVE, this.yShift + 100 + SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.stroke();

		// Draw Bottom Time Line
		ctx.beginPath();
		ctx.strokeStyle = dividerLineColour;
		ctx
				.moveTo(this.xShift, this.yShift + 115
						+ SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.lineTo(X_MOVE, this.yShift + 115 + SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.stroke();

		// Draw The Tracking Area
		// Bottom Line
		ctx.beginPath();
		ctx.strokeStyle = dividerLineColour;
		ctx.moveTo(this.xShift, TRACKING_AREA_BOTTOM_Y
				+ SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.lineTo(X_MOVE, 25 + SHIFT_TO_FIX_LINE_THICKNESS);
		ctx.stroke();

		trackingSquareX = ((this.startTime / currentStateStore.trackDuration) * (ctx.canvas.clientWidth - 226)) + 203;
		ctx.fillStyle = trackingSquareColour;
		ctx.strokeStyle = wavLineColour;

		ctx.globalAlpha = 0.3;
		ctx.strokeRect(trackingSquareX, 2, 20, 20);
		ctx.fillRect(trackingSquareX, 2, 20, 20);
		ctx.globalAlpha = 1;

		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.fillStyle = '#00ff00';

		if (trackingClicked > 0) {
			if (trackingClicked > trackingSquareX
					&& trackingClicked < trackingSquareX + 20) {
				trackingMouseDownX = trackingClicked;
			}
		}

		if (clickedWhilePausedX > 0) {
			if (clickedWhilePausedX > wordX
					&& clickedWhilePausedX < wordX + width) {
				// start
				if (clickedWhilePausedX > wordX
						&& clickedWhilePausedX < wordX + 5) {
					startOfWordMouseDownX = clickedWhilePausedX;
					// end
				} else if (clickedWhilePausedX > (wordX + width - 5)
						&& clickedWhilePausedX < wordX + width) {

					endOfWordMouseDownX = clickedWhilePausedX;
				} else {
					// middle
					middleOfWordMouseDownX = clickedWhilePausedX;
				}
				clickedWhilePausedX = 0;
				currentStateStore.currentSelectedWordId = aWord.id;
				currentStateStore.currentSelectedWord = aWord;
				changeCurrentSelectedWord();
			}
		}

		ctx.fillStyle = beforeTimeCoverColour;
		ctx.strokeStyle = '#a6a6a6';
		ctx.rect(0, 0, BEFORE_TIME_WIDTH, ctx.canvas.clientHeight);
		ctx.globalAlpha = 0.3;
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.globalAlpha = 1;

		function drawArc(xPosition, yPosition, radius) {
			ctx.fillStyle = $('#circleColor').val();
			ctx.strokeStyle = $('#circleColor').val();
			ctx.beginPath();
			ctx.arc(xPosition, yPosition, radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.stroke();
			ctx.strokeStyle = $('#lineColor').val();
		}
	};

	function secondsToTime(seconds) {
		return seconds;
	}

	function bindCanvasTouchControls() {
		$("#canvas1").bind(
				"mousedown",
				function(e) {
					e.preventDefault();
					var offset = $(this).offset();
					var clickX = e.pageX - offset.left;
					var clickY = e.pageY - offset.top;
					if (clickY > wordBoxY) {
						if (document.getElementById('audio').paused) {
							clickedWhilePausedX = clickX;
						}
					} else if (clickY < TRACKING_AREA_BOTTOM_Y
							&& clickX > BEFORE_TIME_WIDTH) {
						trackingClicked = clickX;
					} else {
						screenPressed = true;
						var audioElm = document.getElementById('audio');
						var currentTime = audioElm.currentTime;
						wasPaused = audioElm.paused;
						audioElm.pause();
						startX = clickX;
						veryStartX = clickX;
						clickStartTime = currentTime;
					}

				});
		$("#canvas1").bind("dblclick", function(e) {
			e.preventDefault();
			var offset = $(this).offset();
			var clickX = e.pageX - offset.left;
			var clickY = e.pageY - offset.top;
			if (clickY > wordBoxY) {
				if (document.getElementById('audio').paused) {
					doubleClickedWhilePausedX = clickX;
				}
			}
		});
		$("#canvas1").bind("mouseup", function(e) {
			screenPressed = false;
			var audioElm = document.getElementById('audio');
			if (!wasPaused) {
				audioElm.play();
			}
			startOfWordMouseDownX = 0;
			endOfWordMouseDownX = 0;
			middleOfWordMouseDownX = 0;
			trackingMouseDownX = 0
			trackingClicked = 0;
		});
		$("#canvas1")
				.bind(
						"mousemove touchmove",
						function(e) {
							var offset = $(this).offset();
							var clickX = e.clientX - offset.left;
							if (screenPressed) {
								var distanceMoved = clickX - startX;
								startX = clickX;
								var audioElm = document.getElementById('audio');
								audioElm.currentTime = audioElm.currentTime
										+ -((distanceMoved) / 200);
							}
							var clickY = e.pageY - offset.top;
							setCursor(clickX, clickY);
							var audioElm = document.getElementById('audio');
							if (trackingMouseDownX > 0) {

								audioElm.currentTime = ((clickX - 200) / (canvas1Width - 200))
										* audioElm.duration;
								trackingMouseDownX = clickX;
							} else if (clickY > wordBoxY) {
								hoverWhilePausedX = clickX;
								if (startOfWordMouseDownX > 0) {
									if (currentStateStore.currentSelectedWord.startTime
											+ ((clickX - startOfWordMouseDownX) * 5) < (currentStateStore.currentSelectedWord.endTime - 50)) {
										if (currentStateStore.currentSelectedWordPreviousWord != null
												&& currentStateStore.currentSelectedWord.startTime
														+ ((clickX - startOfWordMouseDownX) * 5) > (currentStateStore.currentSelectedWordPreviousWord.endTime + 10)) {
											currentStateStore.currentSelectedWord.startTime = currentStateStore.currentSelectedWord.startTime
													+ ((clickX - startOfWordMouseDownX) * 5);
										} else if (currentStateStore.currentSelectedWordPreviousWord == null
												&& currentStateStore.currentSelectedWord.startTime
														+ ((clickX - startOfWordMouseDownX) * 5) > 0) {
											currentStateStore.currentSelectedWord.startTime = currentStateStore.currentSelectedWord.startTime
													+ ((clickX - startOfWordMouseDownX) * 5);
										}
									}
									startOfWordMouseDownX = clickX;
									changeCurrentSelectedWord();

								} else if (endOfWordMouseDownX > 0) {
									if (currentStateStore.currentSelectedWord.endTime
											+ ((clickX - endOfWordMouseDownX) * 5) > (currentStateStore.currentSelectedWord.startTime + 50)
											&& currentStateStore.currentSelectedWord.endTime
													+ ((clickX - endOfWordMouseDownX) * 5) < currentStateStore.currentSelectedWordNextWord.startTime - 10) {
										currentStateStore.currentSelectedWord.endTime = currentStateStore.currentSelectedWord.endTime
												+ ((clickX - endOfWordMouseDownX) * 5);
									}

									if (currentStateStore.currentSelectedWord.id == currentStateStore.lastAddedWordId) {
										currentStateStore.highestEndTime = currentStateStore.currentSelectedWord.endTime;
									}

									endOfWordMouseDownX = clickX;
									changeCurrentSelectedWord();
								} else if (middleOfWordMouseDownX > 0) {
									var temp1 = parseFloat(currentStateStore.currentSelectedWord.startTime)
											+ ((clickX - middleOfWordMouseDownX) * 5);
									var temp2 = parseFloat(currentStateStore.currentSelectedWord.endTime)
											+ ((clickX - middleOfWordMouseDownX) * 5);
									var temp3 = parseFloat(currentStateStore.currentSelectedWordNextWord.startTime) - 10;
									+((clickX - middleOfWordMouseDownX) * 5);

									if (currentStateStore.currentSelectedWordPreviousWord != null
											&& currentStateStore.currentSelectedWord.startTime
													+ ((clickX - middleOfWordMouseDownX) * 5) > (currentStateStore.currentSelectedWordPreviousWord.endTime + 10)
											&& currentStateStore.currentSelectedWord.endTime
													+ ((clickX - middleOfWordMouseDownX) * 5) < currentStateStore.currentSelectedWordNextWord.startTime - 10) {

										currentStateStore.currentSelectedWord.endTime = currentStateStore.currentSelectedWord.endTime
												+ ((clickX - middleOfWordMouseDownX) * 5);
										currentStateStore.currentSelectedWord.startTime = currentStateStore.currentSelectedWord.startTime
												+ ((clickX - middleOfWordMouseDownX) * 5);

									} else if (currentStateStore.currentSelectedWordPreviousWord == null
											&& temp1 > 0 && temp2 < temp3) {

										currentStateStore.currentSelectedWord.endTime = currentStateStore.currentSelectedWord.endTime
												+ ((clickX - middleOfWordMouseDownX) * 5);
										currentStateStore.currentSelectedWord.startTime = currentStateStore.currentSelectedWord.startTime
												+ ((clickX - middleOfWordMouseDownX) * 5);

									}

									if (currentStateStore.currentSelectedWord.id == currentStateStore.lastAddedWordId) {
										currentStateStore.highestEndTime = currentStateStore.currentSelectedWord.endTime;
									}

									middleOfWordMouseDownX = clickX;
									changeCurrentSelectedWord();
								}
							} else {
								hoverWhilePausedX = 0;
								currentStateStore.currentHoveredWordId = "";
							}
						});

		$("#canvas1").bind("mouseout", function(e) {
			hoverWhilePausedX = 0;
			currentStateStore.currentHoveredWordId = "";
			startOfWordMouseDownX = 0;
			trackingClicked = 0;
			trackingMouseDownX = 0;
		});
	}

	function setCursor(hoverX, hoverY) {
		if (hoverY > 0 && hoverY < TRACKING_AREA_BOTTOM_Y) {
			$("#canvas1").css("cursor", "default");
		} else if (hoverY > TRACKING_AREA_BOTTOM_Y && hoverY < wordBoxY) {
			$("#canvas1").css("cursor", "pointer");
		} else if (hoverY > wordBoxY && hoverY <= 315) {
			if (isAWordHovered) {
				$("#canvas1").css("cursor", "move");
			} else if (isAWordEdgeHovered) {
				$("#canvas1").css("cursor", "e-resize");
			} else {
				$("#canvas1").css("cursor", "default");
			}
		} else {
			$("#canvas1").css("cursor", "default");
		}
	}

};
