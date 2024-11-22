////////////////////////////////////////////////////////////
// GAME
////////////////////////////////////////////////////////////

/*!
 * 
 * GAME SETTING CUSTOMIZATION START
 * 
 */
var textScoreGuide = 'PLANE'; //game score description
var textResultWin = 'TOTAL : [NUMBER] PLANES'; //result score display text

var planeMoveSpeed = 1; //plane moving speed
var actionIconPositionY = -50; //icon timer position
var actionTimer = 15; //icon timer
var terminalStopTimer = 20; //timer for terminal stop
var landingTimer = 30; //timer for next landing aircraft
var targetScore = 3; //score target to increase game speed, it will multiplied for next speed eg.(3, 6, 12, 24...)
var levelSpeed_arr = {
    planeMoveSpeed: .1,
    landingTimer: 5,
    actionTimer: 2
}; //the total number increase for game speed

var timerCircleColour = '#ffffff'; //icon timer colour
var timerCicleWidth = 40; //icon timer width
var bgCircleColour = '#666'; //icon timer background colour
var bgCircleWidth = 43; //icon timer background width

var exitMessage = 'Are you sure you want\nto quit the game?'; //quit game message

//Social share, [SCORE] will replace with game score
var shareEnable = false; //toggle share
var shareText = 'SHARE IT NOW'; //text for share instruction
var shareTitle = 'Best score on Airport Rush [TERMINAL] is [SCORE]'; //social share score title
var shareMessage = '[SCORE] is mine new best score on Airport Rush [TERMINAL]! Try it now!'; //social share score message


/*!
 *
 * GAME SETTING CUSTOMIZATION END
 *
 */

$.editor = {
    enable: false
};
var terminalNum = 0;
var runwayNum = 0;
var gateNum = 0;
var gameOver = false;
var globalInterval = null;

var playerData = {
    level: '',
    score: 0,
    targetScore: 0,
    landingTimer: 0,
    actionTimer: 0,
    planeMoveSpeed: 0,
    first: true
};
var planeData = [];
var trackName_arr = ['landing', 'holding1', 'taxiway1', 'terminalin', 'terminalout', 'taxiway2', 'holding2', 'takeoff'];

/*!
 * 
 * GAME BUTTONS - This is the function that runs to setup button event
 * 
 */

function buildGameButton() {
    btnStart.cursor = "pointer";
    btnStart.addEventListener("mousedown", function(evt) {
        playSound('soundButton');
        goPage('terminal');
    });

    btnSelect.cursor = "pointer";
    btnSelect.addEventListener("mousedown", function(evt) {
        playSound('soundButton');
        goPage('game');
    });

    btnArrowLeft.cursor = "pointer";
    btnArrowLeft.addEventListener("mousedown", function(evt) {
        toggleSelect(false);
    });

    btnArrowRight.cursor = "pointer";
    btnArrowRight.addEventListener("mousedown", function(evt) {
        toggleSelect(true);
    });

    for (n = 0; n < terminals_arr.length; n++) {
        $.thumbs['thumb_' + n].name = n;
        $.thumbs['thumb_' + n].cursor = "pointer";
        $.thumbs['thumb_' + n].addEventListener("mousedown", function(evt) {
            selectTerminalsThumbs(evt.target.name);
        });
    }

    btnOk.cursor = "pointer";
    btnOk.addEventListener("click", function(evt) {
        playSound('soundButton');
        toggleOverlay('');
        startGame();
    });

    btnFacebook.cursor = "pointer";
    btnFacebook.addEventListener("click", function(evt) {
        share('facebook');
    });
    btnWhatsapp.cursor = "pointer";
    btnWhatsapp.addEventListener("click", function(evt) {
        share('whatsapp');
    });
    btnTwitter.cursor = "pointer";
    btnTwitter.addEventListener("click", function(evt) {
        share('twitter');
    });

    buttonReplay.cursor = "pointer";
    buttonReplay.addEventListener("mousedown", function(evt) {
        playSound('soundButton');
        clearGame();
        goPage('terminal');
    });

    //confirm
    buttonConfirm.cursor = "pointer";
    buttonConfirm.addEventListener("click", function(evt) {
        playSound('soundClick');
        toggleConfirm(false);
        stopGame(true);
        goPage('main');
    });

    buttonCancel.cursor = "pointer";
    buttonCancel.addEventListener("click", function(evt) {
        playSound('soundClick');
        toggleConfirm(false);
    });

    itemExit.addEventListener("click", function(evt) {});

    //options
    buttonSoundOff.cursor = "pointer";
    buttonSoundOff.addEventListener("click", function(evt) {
        toggleGameMute(true);
    });

    buttonSoundOn.cursor = "pointer";
    buttonSoundOn.addEventListener("click", function(evt) {
        toggleGameMute(false);
    });

    buttonFullscreen.cursor = "pointer";
    buttonFullscreen.addEventListener("click", function(evt) {
        toggleFullScreen();
    });

    buttonSettings.cursor = "pointer";
    buttonSettings.addEventListener("click", function(evt) {
        toggleOption();
    });

    buttonExit.cursor = "pointer";
    buttonExit.addEventListener("click", function(evt) {
        toggleConfirm(true);
        toggleOption();
    });
}

/*!
 * 
 * DISPLAY PAGES - This is the function that runs to display pages
 * 
 */
var curPage = ''

function goPage(page) {
    curPage = page;

    mainContainer.visible = false;
    selectContainer.visible = false;
    gameContainer.visible = false;
    resultContainer.visible = false;

    var targetContainer = '';
    switch (page) {
        case 'main':
            playSoundLoop('musicMain');
            targetContainer = mainContainer;
            break;

        case 'terminal':
            stopSoundLoop('soundAirport');
            playSoundLoop('musicMain');
            targetContainer = selectContainer;
            selectPage(1);
            break;

        case 'game':
            targetContainer = gameContainer;
            setupGame();

            if ($.editor.enable) {
                loadEditPage();
                toggleOverlay('');
            } else {
                stopSoundLoop('musicMain');
                playSoundLoop('soundAirport');
                toggleOverlay('terminal');
            }
            break;
    }

    targetContainer.alpha = 0;
    targetContainer.visible = true;
    $(targetContainer)
        .clearQueue()
        .stop(true, true)
        .animate({
            alpha: 1
        }, 500);

    resizeCanvas();
}

/*!
 * 
 * TOGGLE OVERLAY - This is the function that runs to toggle terminal/result pop up
 * 
 */
function toggleOverlay(con) {
    levelContainer.visible = false;
    resultContainer.visible = false;

    var targetContainer = '';
    switch (con) {
        case 'terminal':
            targetContainer = levelContainer;
            break;

        case 'result':
            targetContainer = resultContainer;
            saveGame(playerData.score, playerData.level);

            if (typeof displayB == 'function') {
                displayB();
            }
            break;
    }

    targetContainer.alpha = 0;
    targetContainer.visible = true;
    $(targetContainer)
        .clearQueue()
        .stop(true, true)
        .animate({
            alpha: 0
        }, 500)
        .animate({
            alpha: 1
        }, 500);
}


/*!
 * 
 * SELECT TERMINALS - This is the function that runs to display select terminals
 * 
 */
var selectPageNum = 1;
var selectPageTotal = 1;
var maxThumbPerPage = 3;

function buildSelectPagination() {
    selectPageTotal = terminals_arr.length / maxThumbPerPage;
    if (String(selectPageTotal).indexOf('.') > -1) {
        selectPageTotal = Math.floor(selectPageTotal) + 1;
    }
}

function toggleSelect(con) {
    if (con) {
        selectPageNum++;
        selectPageNum = selectPageNum > selectPageTotal ? selectPageTotal : selectPageNum;
    } else {
        selectPageNum--;
        selectPageNum = selectPageNum < 1 ? 1 : selectPageNum;
    }
    selectPage(selectPageNum);
}

function selectPage(num) {
    selectPageNum = num;
    bgThumbSelected.visible = false;

    var startNum = (selectPageNum - 1) * maxThumbPerPage;
    var endNum = startNum + (maxThumbPerPage - 1);
    var thumbCount = 1;
    for (n = 0; n < terminals_arr.length; n++) {
        if (n >= startNum && n <= endNum) {
            thumbCount++;
            $.thumbs['thumb_' + n].visible = $.thumbs['thumb_text_' + n].visible = true;
        } else {
            $.thumbs['thumb_' + n].visible = $.thumbs['thumb_text_' + n].visible = false;
        }
    }

    for (n = 1; n <= 3; n++) {
        if (n < thumbCount) {
            this['bgThumb' + n].visible = true;
        } else {
            this['bgThumb' + n].visible = false;
        }
    }

    if (selectPageNum == 1) {
        btnArrowLeft.visible = false;
    } else {
        btnArrowLeft.visible = true;
    }

    if (selectPageNum == selectPageTotal || selectPageTotal == 1) {
        btnArrowRight.visible = false;
    } else {
        btnArrowRight.visible = true;
    }
}

function selectTerminalsThumbs(num) {
    terminalNum = num;
    bgThumbSelected.x = $.thumbs['thumb_' + num].x;
    bgThumbSelected.y = $.thumbs['thumb_' + num].y;
    bgThumbSelected.visible = true;

    playerData.level = txtTerminalName.text = txtResultTerminal.text = terminals_arr[terminalNum].name;
}

/*!
 * 
 * SETUP GAME - This is the function that runs to setup game
 * 
 */
function setupGame() {
    gameOver = false;
    planeNum = 0;
    planeData = [];
    selectTerminal(terminalNum);

    playerData.actionTimer = actionTimer;
    playerData.planeMoveSpeed = planeMoveSpeed;
    playerData.landingTimer = landingTimer;
    playerData.targetScore = targetScore;
    playerData.score = 0;
    updateScore(0);
}

/*!
 * 
 * START GAME - This is the function that runs to start play game
 * 
 */
function startGame() {
    playerData.first = true;
    landingTimer_arr = [];

    /*createPlane(0);
    createPlane(1);
	
    planeData[0].plane.visible = planeData[0].shadow.visible = true;
    planeData[1].plane.visible = planeData[1].shadow.visible = true;
	
    stage.addEventListener("stagemousemove", handlerMultitouchMethod);*/

    for (n = 0; n < terminals_arr[terminalNum].runway.length; n++) {
        landingTimer_arr.push({
            timer: null
        });
        startLandingTimer(n);
    }

    toggleInterval(true);
}

function stopGame() {
    TweenMax.killAll();
    toggleInterval(false);
    stopPlaneData();
    clearGame();
}

function stopPlaneData() {
    for (n = 0; n < landingTimer_arr.length; n++) {
        clearTimeout(landingTimer_arr[n].timer);
    }

    for (n = 0; n < planeData.length; n++) {
        if (planeData[n].plane != null) {
            planeData[n].interval = false;
            TweenMax.killTweensOf(planeData[n].level);
            TweenMax.killTweensOf(planeData[n].value);
            TweenMax.killTweensOf(planeData[n].timer);

            /*$(planeData[n].timer)
            .clearQueue()
            .stop();
            clearInterval(planeData[n].interval);*/
        }
    }
}

function handlerMultitouchMethod(evt) {
    switch (evt.type) {
        case 'stagemousemove':
            updatePlaneCollision();
            planeData[0].plane.x = evt.stageX;
            planeData[0].plane.y = evt.stageY;
            break;
    }
}

/*!
 *
 * SAVE GAME - This is the function that runs to save game
 *
 */
function saveGame(score, type) {
    /*$.ajax({
      type: "POST",
      url: 'saveResults.php',
      data: {score:score},
      success: function (result) {
          console.log(result);
      }
    });*/
}


/*!
 * 
 * SELECT TERMINAL - This is the function that runs to load terminal
 * 
 */
function selectTerminal(num) {
    for (n = 0; n < terminals_arr.length; n++) {
        $.terminals['terminal_' + n].visible = false;
    }
    $.terminals['terminal_' + num].visible = true;
}

/*!
 * 
 * STOP GAME - This is the function that runs to stop play game
 * 
 */
function clearGame() {
    planeContainer.removeAllChildren();
    planeIconContainer.removeAllChildren();
}

/*!
 * 
 * AIRCRAFT RUNWAY - This is the function that runs for landing timer
 * 
 */
var landingTimer_arr = [];

function startLandingTimer(curTrackTimerNum) {
    var delayTotal = 0;
    var delayNum;

    if (playerData.first) {
        playerData.first = false;
        delayTotal = 3;
        delayNum = Math.random() * delayTotal;
        delayNum = delayNum * 1000;
    } else {
        delayTotal = playerData.landingTimer;
        delayNum = (Math.random() * delayTotal) + (delayTotal / 2);
        delayNum = delayNum * 1000;
    }

    landingTimer_arr[curTrackTimerNum].timer = setTimeout(stopTrackTimer, delayNum, curTrackTimerNum);
}

function stopTrackTimer(curTrackTimerNum) {
    var randomRadioNum = Math.floor(Math.random() * 2) + 1;

    playSound('soundRadio' + randomRadioNum);
    createPlane(curTrackTimerNum);
    startLandingTimer(curTrackTimerNum);
}

/*!
 * 
 * CREATE NEW PLANE - This is the function that runs to create new plane
 * 
 */
var planeNum = 0;

function createPlane(curRunwayNum) {
    var planeTypeNum = Math.floor(Math.random() * planes_arr.length);;

    $.planes[planeNum] = new createjs.Sprite($.planesData[planeTypeNum], "static");
    $.planes[planeNum].framerate = 20;
    $.planes[planeNum].gotoAndStop(0);

    $.planes['s' + planeNum] = new createjs.Sprite($.planesData['shadow' + planeTypeNum], "static");
    $.planes['s' + planeNum].framerate = 20;
    $.planes['s' + planeNum].gotoAndStop(0);

    $.planes['timer' + planeNum] = new createjs.Shape();
    $.planes['timerBg' + planeNum] = new createjs.Shape();
    $.planes['timerBg' + planeNum].graphics.clear();
    $.planes['timerBg' + planeNum].graphics.beginFill(bgCircleColour).drawCircle(0, 0, bgCircleWidth);

    $.planes['iconLanding' + planeNum] = iconLanding.clone();
    $.planes['iconTerminal' + planeNum] = iconTerminal.clone();
    $.planes['iconExitTerminal' + planeNum] = iconExitTerminal.clone();
    $.planes['iconTakeoff' + planeNum] = iconTakeoff.clone();

    $.planes['timer' + planeNum].visible = $.planes['timerBg' + planeNum].visible = $.planes['iconLanding' + planeNum].visible = $.planes['iconTerminal' + planeNum].visible = $.planes['iconExitTerminal' + planeNum].visible = $.planes['iconTakeoff' + planeNum].visible = false;

    $.planes['iconLanding' + planeNum].name = planeNum;
    $.planes['iconTerminal' + planeNum].name = planeNum;
    $.planes['iconExitTerminal' + planeNum].name = planeNum;
    $.planes['iconTakeoff' + planeNum].name = planeNum;

    $.planes['iconLanding' + planeNum].cursor = "pointer";
    $.planes['iconLanding' + planeNum].addEventListener("mousedown", function(evt) {
        proceedMode(evt.target.name);
    });
    $.planes['iconTerminal' + planeNum].cursor = "pointer";
    $.planes['iconTerminal' + planeNum].addEventListener("mousedown", function(evt) {
        proceedMode(evt.target.name);
    });
    $.planes['iconExitTerminal' + planeNum].cursor = "pointer";
    $.planes['iconExitTerminal' + planeNum].addEventListener("mousedown", function(evt) {
        proceedMode(evt.target.name);
    });
    $.planes['iconTakeoff' + planeNum].cursor = "pointer";
    $.planes['iconTakeoff' + planeNum].addEventListener("mousedown", function(evt) {
        proceedMode(evt.target.name);
    });

    planeData.push({
        type: planeTypeNum,
        plane: $.planes[planeNum],
        shadow: $.planes['s' + planeNum],
        mode: 0,
        value: {
            x: 0,
            y: 0,
            oldX: 0,
            oldY: 0,
            lastX: 0,
            lastY: 0
        },
        level: {
            val: 0
        },
        interval: false,
        timer: {
            count: 0,
            store: 0,
            max: 0,
            skip: false
        },
        runwayNum: curRunwayNum,
        gateNum: gateNum
    });

    planeData[planeNum].plane.x = planeData[planeNum].shadow.x = planeData[planeNum].value.x = terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[0]][0].x;
    planeData[planeNum].plane.y = planeData[planeNum].shadow.y = planeData[planeNum].value.y = terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[0]][0].y;

    planeData[planeNum].plane.visible = planeData[planeNum].shadow.visible = false;
    planeContainer.addChild($.planes['s' + planeNum], $.planes[planeNum]);
    planeIconContainer.addChild($.planes['timerBg' + planeNum], $.planes['timer' + planeNum], $.planes['iconLanding' + planeNum], $.planes['iconTerminal' + planeNum], $.planes['iconExitTerminal' + planeNum], $.planes['iconTakeoff' + planeNum]);

    startPlaneActionTimer(planeNum);
    planeNum++;
}

/*!
 * 
 * STOP PLANE - This is the function that runs to stop plane
 * 
 */
function stopPlane(num) {
    //clearInterval(planeData[num].interval);
    planeData[num].interval = false;
    TweenMax.killTweensOf(planeData[num].level);
    TweenMax.killTweensOf(planeData[num].value);

    planeData[num].plane = null;
    planeData[num].shadow = null;
    planeContainer.removeChild($.planes['s' + num], $.planes[num]);
    planeIconContainer.removeChild($.planes['timerBg' + num], $.planes['timer' + num], $.planes['iconLanding' + num], $.planes['iconTerminal' + num], $.planes['iconExitTerminal' + num], $.planes['iconTakeoff' + num]);
}

/*!
 * 
 * START ACTION TIMER - This is the function that runs to start action timer
 * 
 */
function startPlaneActionTimer(num) {
    $.planes['iconLanding' + num].x = $.planes['iconTerminal' + num].x = $.planes['iconExitTerminal' + num].x = $.planes['iconTakeoff' + num].x = $.planes['timerBg' + num].x = $.planes['timer' + num].x = planeData[num].shadow.x;
    $.planes['iconLanding' + num].y = $.planes['iconTerminal' + num].y = $.planes['iconExitTerminal' + num].y = $.planes['iconTakeoff' + num].y = $.planes['timerBg' + num].y = $.planes['timer' + num].y = planeData[num].shadow.y + actionIconPositionY;

    $.planes['iconLanding' + num].visible = $.planes['iconTerminal' + num].visible = $.planes['iconExitTerminal' + num].visible = $.planes['iconTakeoff' + num].visible = false;

    $.planes['timerBg' + num].visible = $.planes['timer' + num].visible = true;
    planeData[num].timer.max = playerData.actionTimer;

    if (planeData[num].mode == 0) {
        $.planes['iconLanding' + num].visible = true;
    } else if (planeData[num].mode == 1) {
        $.planes['iconTerminal' + num].visible = true;
    } else if (planeData[num].mode == 3 && !planeData[num].timer.skip) {
        $.planes['timerBg' + num].visible = $.planes['timer' + num].visible = false;
        planeData[num].timer.max = terminalStopTimer;
        playSound('soundShutdown');
        playSound('soundDing');
    } else if (planeData[num].mode == 3) {
        $.planes['iconExitTerminal' + num].visible = true;
        playSound('soundLaunch');
    } else if (planeData[num].mode == 5) {
        $.planes['iconTakeoff' + num].visible = true;
    }

    planeData[num].timer.count = planeData[num].timer.store = 0;

    updateTimerIcon(num);
    //clearInterval(planeData[num].interval);
    //TweenMax.killTweensOf(planeData[num].interval);
    planeData[num].interval = true;

    //TweenMax.to(planeData[num].interval, .1, {onUpdate:loopInterval, onUpdateParams:[num], overwrite:true});

    /*planeData[num].interval = setInterval(function(){
    	planeData[num].timer.store+=.1;
    	console.log(planeData[num].timer.store);
    	
    	TweenMax.killTweensOf(planeData[num].timer);
    	$(planeData[num].timer)
    	.clearQueue()
    	.stop()
    	.animate({count:planeData[num].timer.store},
    		{duration: 100,
    		step: function(){
    			updateTimerIcon(num);
    		}
    	});
    	
    	TweenMax.to(planeData[num].timer, 1, {count:planeData[num].timer.store, onUpdate:function(){
    		updateTimerIcon(num);	
    	}, overwrite:true});
    	
    	if(planeData[num].timer.count >= planeData[num].timer.max){
    		stopPlaneActionTimer(num);
    	}
    }, 100);*/
}

/*!
 * 
 * STOP ACTION TIMER - This is the function that runs to stop action timer
 * 
 */
function stopPlaneActionTimer(num) {
    /*$(planeData[num].timer)
    .clearQueue()
    .stop();*/
    //clearInterval(planeData[num].interval);

    TweenMax.killTweensOf(planeData[num].timer);
    //TweenMax.killTweensOf(planeData[num].interval);
    planeData[num].interval = false;

    $.planes['iconLanding' + num].visible = $.planes['iconTerminal' + num].visible = $.planes['iconExitTerminal' + num].visible = $.planes['iconTakeoff' + num].visible = false;
    $.planes['timerBg' + num].visible = $.planes['timer' + num].visible = false;

    if (planeData[num].mode == 3 && !planeData[num].timer.skip) {
        planeData[num].timer.skip = true;
        startPlaneActionTimer(num);
    } else {
        if (planeData[num].mode != 0) {
            planeData[num].mode++;
        }
        animatePlane(num);
    }
}

/*!
 * 
 * UPDATE ICON TIMER - This is the function that runs to updaye icon timer
 * 
 */
function updateTimerIcon(num) {
    $.planes['timer' + num].graphics.clear();
    $.planes['timer' + num].graphics.beginFill(timerCircleColour);

    var numberAngle = Number(-1.55 - (Math.PI * 2 * ((planeData[num].timer.max - planeData[num].timer.count) / planeData[num].timer.max)));
    var endAngle = Number(numberAngle + (Math.PI * 2 * ((planeData[num].timer.max - planeData[num].timer.count) / planeData[num].timer.max)));
    $.planes['timer' + num].graphics.moveTo(0, 0).arc(0, 0, timerCicleWidth, numberAngle, endAngle, false).lineTo(0, 0).closePath();
}


/*!
 * 
 * PROCEED NEXT STEP - This is the function that runs to proceed next step
 * 
 */
function proceedMode(num) {
    if (!gameOver) {
        stopPlaneActionTimer(num);
    }
}

/*!
 * 
 * LOOP GAME - This is the function that runs to loop game
 * 
 */
function updateGame() {

}

function toggleInterval(con) {
    if (con) {
        globalInterval = setInterval(function() {
            for (var n = 0; n < planeData.length; n++) {
                if (planeData[n].interval) {
                    planeData[n].timer.store += .1;
                    TweenMax.killTweensOf(planeData[n].timer);
                    TweenMax.to(planeData[n].timer, 1, {
                        count: planeData[n].timer.store,
                        onUpdate: updateTimerIcon,
                        onUpdateParams: [n],
                        overwrite: true
                    });

                    if (planeData[n].timer.count >= planeData[n].timer.max) {
                        stopPlaneActionTimer(n);
                    }
                }
            }
        }, 100);
    } else {
        clearInterval(globalInterval);
        globalInterval = null;
    }
}

/*!
 * 
 * PLANE DIRECTION - This is the function that runs to check plane direction
 * 
 */
function checkPlaneDirection(angle) {
    if (angle >= -180 && angle <= -90) {
        return 3;
    } else if (angle >= -91 && angle <= -1) {
        return 0;
    } else if (angle >= 0 && angle <= 90) {
        return 1;
    } else if (angle >= 91 && angle <= 180) {
        return 2;
    }
}

/*!
 * 
 * START PLANE ANIMATION - This is the function that runs to start plane animation
 * 
 */
var runwayPath = [];

function animatePlane(num) {
    planeData[num].plane.visible = planeData[num].shadow.visible = true;
    runwayPath = [];
    var curPlaneMode = planeData[num].mode;
    var curRunwayNum = planeData[num].runwayNum;

    if (curPlaneMode == 3 || curPlaneMode == 4) {
        if (curPlaneMode == 3 && !$.editor.enable) {
            planeData[num].gateNum = getOpenGate(curRunwayNum, num);
        }
        runwayPath = terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[curPlaneMode]][planeData[num].gateNum].path;
    } else {
        runwayPath = terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[curPlaneMode]];
    }

    var totalDistance = 0;
    if (curPlaneMode == 0) {
        planeData[num].value.x = planeData[num].plane.x = planeData[num].shadow.x = runwayPath[0].x;
        planeData[num].value.y = planeData[num].plane.y = planeData[num].shadow.y = runwayPath[0].y;

        for (n = 0; n < runwayPath.length; n++) {
            if (n < runwayPath.length - 1) {
                totalDistance += getDistance(runwayPath[n].x, runwayPath[n].y, runwayPath[n + 1].x, runwayPath[n + 1].y);
            }
        }
    } else {
        planeData[num].value.x = planeData[num].plane.x = planeData[num].shadow.x = planeData[num].value.lastX;
        planeData[num].value.y = planeData[num].plane.y = planeData[num].shadow.y = planeData[num].value.lastY;

        if (runwayPath.length == 1) {
            totalDistance += getDistance(planeData[num].value.lastX, planeData[num].value.lastY, runwayPath[0].x, runwayPath[0].y);
        } else {
            for (n = 0; n < runwayPath.length; n++) {
                if (n < runwayPath.length - 1) {
                    if (n == 0) {
                        totalDistance += getDistance(planeData[num].value.lastX, planeData[num].value.lastY, runwayPath[n + 1].x, runwayPath[n + 1].y);
                    } else {
                        totalDistance += getDistance(runwayPath[n].x, runwayPath[n].y, runwayPath[n + 1].x, runwayPath[n + 1].y);
                    }
                }
            }
        }
    }

    var runwayPathLast = runwayPath.length == 1 ? 0 : (runwayPath.length - 1);
    planeData[num].value.lastX = runwayPath[runwayPathLast].x;
    planeData[num].value.lastY = runwayPath[runwayPathLast].y;

    var easeMode;
    if (curPlaneMode == 0) {
        easeMode = Expo.easeOut;
    } else if (curPlaneMode == 7) {
        easeMode = Expo.easeIn;
    } else {
        easeMode = Linear.easeNone;
    }
    planeData[num].level.val = 0;

    var timeSpeed = (.1 * totalDistance) * (playerData.planeMoveSpeed * .1);

    //sound
    if (curPlaneMode == 0) {
        playSound('soundLanding');
    } else if (curPlaneMode == 2) {
        playSound('soundPassby');
    } else if (curPlaneMode == 4) {
        playSound('soundSeatbelt');
    } else if (curPlaneMode == 6) {
        playSound('soundPassby');
    } else if (curPlaneMode == 7) {
        setTimeout(function() {
            playSound('soundTakeoff');
        }, 3300);
    }

    if (curPlaneMode == 0) {
        planeData[num].level.val = 100;
        TweenMax.to(planeData[num].level, timeSpeed / 2, {
            val: 0,
            ease: easeMode,
            overwrite: true
        });
    } else if (curPlaneMode == 7) {
        planeData[num].level.val = 0;
        TweenMax.to(planeData[num].level, timeSpeed / 2, {
            delay: timeSpeed / 2,
            val: 100,
            ease: easeMode,
            overwrite: true
        });
    }

    TweenMax.to(planeData[num].value, timeSpeed, {
        level: 0,
        bezier: {
            curviness: 0,
            autoRotate: true,
            values: runwayPath
        },
        ease: easeMode,
        overwrite: true,
        onComplete: animatePlaneComplete,
        onCompleteParams: [num],
        onUpdate: updatePlaneMove,
        onUpdateParams: [num]
    });
}

/*!
 * 
 * PLANE ANIMATION COMPLETE - This is the function that runs when plane animation complete
 * 
 */
function animatePlaneComplete(num) {
    if ($.editor.enable) {
        if (planeData[num].mode !== 7) {
            planeData[num].mode++;
            animatePlane(num);
        }
    } else {
        if (planeData[num].mode == 7) {
            updateScore(1);
            stopPlane(num);
        } else {
            if (planeData[num].mode == 1 || planeData[num].mode == 3 || planeData[num].mode == 5) {
                startPlaneActionTimer(num);
            } else {
                planeData[num].mode++;
                animatePlane(num);
            }
        }
    }
}

/*!
 * 
 * FIND FREE OPEN GATE - This is the function that runs return free open gate
 * 
 */
function getOpenGate(curRunwayNum, num) {
    var occupyGate_arr = [];

    for (n = 0; n < planeData.length; n++) {
        if (planeData[n].mode == 3 && n != num) {
            occupyGate_arr.push(planeData[n].gateNum);
        }
    }

    var exist = false;
    for (n = 0; n < terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[3]].length; n++) {
        if (occupyGate_arr.indexOf(n) == -1) {
            exist = true;
            return n;
        }
    }

    if (!exist) {
        var number = Math.floor(Math.random() * terminals_arr[terminalNum].runway[curRunwayNum][trackName_arr[3]].length);
        return number;
    }
}

/*!
 * 
 * UPDATE PLANE - This is the function that runs to update plane move
 * 
 */
function updatePlaneMove(num) {
    updatePlaneDirection(num);
    updatePlaneDepth();
    updatePlaneCollision();
}

/*!
 * 
 * PLANE ROTATION - This is the function that runs to update plane rotation
 * 
 */
function updatePlaneDirection(n) {
    planeData[n].plane.x = planeData[n].shadow.x = planeData[n].value.x;

    planeData[n].plane.y = planeData[n].value.y - planeData[n].level.val;
    planeData[n].shadow.y = planeData[n].value.y;

    var moveAngle = getAngle(planeData[n].value.oldX, planeData[n].value.oldY, planeData[n].value.x, planeData[n].value.y);
    var planeFrame = checkPlaneDirection(moveAngle);

    planeData[n].plane.gotoAndStop(planeFrame);
    planeData[n].shadow.gotoAndStop(planeFrame);

    planeData[n].value.oldX = planeData[n].value.x;
    planeData[n].value.oldY = planeData[n].value.y;
}

/*!
 * 
 * UPDATE PLANE DEPTH - This is the function that runs to update plane depth
 * 
 */
function updatePlaneDepth() {
    var planeDepth_arr = [];
    for (n = 0; n < planeData.length; n++) {
        if (planeData[n].plane != null) {
            planeDepth_arr.push({
                id: n,
                y: planeData[n].shadow.y + planeData[n].level.val
            });
        }
    }

    //sort by position y
    planeDepth_arr.sort(function(a, b) {
        return parseFloat(a.y) - parseFloat(b.y);
    });

    var childNum = 0;
    for (n = 0; n < planeDepth_arr.length; n++) {
        planeContainer.setChildIndex(planeData[planeDepth_arr[n].id].shadow, childNum);
        childNum++;
        planeContainer.setChildIndex(planeData[planeDepth_arr[n].id].plane, childNum);
        childNum++;
    }
}

/*!
 * 
 * UPDATE PLANE COLLISION - This is the function that runs to update plane collision
 * 
 */
function updatePlaneCollision() {
    for (n = 0; n < planeData.length; n++) {
        var targetPlane = planeData[n].plane;
        if (targetPlane != null && targetPlane.visible) {
            var targetPlaneLevel = planeData[n].level.val - planes_arr[planeData[n].type].planeHeight;
            for (p = 0; p < planeData.length; p++) {
                var hitPlaneLevel = planeData[p].level.val - planes_arr[planeData[p].type].planeHeight;
                var distanceLevel = Math.abs(targetPlaneLevel - hitPlaneLevel);
                var hitPlane = planeData[p].plane;

                if (hitPlane != null && hitPlane.visible) {
                    if (n != p && distanceLevel < planes_arr[planeData[p].type].planeHeight) {
                        var pointPlane = targetPlane.globalToLocal(hitPlane.x, hitPlane.y);
                        if (targetPlane.hitTest(pointPlane.x, pointPlane.y)) {
                            if (!gameOver) {
                                bombAnimation.x = targetPlane.x;
                                bombAnimation.y = targetPlane.y;
                                stopPlanesAnimation();
                            }
                            return;
                        };
                    }
                }
            }
        }
    }
}


/*!
 * 
 * STOP PLANE ANIMATION - This is the function that runs to stop plane animation
 * 
 */
function stopPlanesAnimation() {
    if (!gameOver) {
        gameOver = true;
        playSound('soundCrash');
        planeContainer.addChild(bombAnimation);
        bombAnimation.gotoAndPlay('explode');

        stopPlaneData();

        setTimeout(function() {
            stopGame();
            toggleOverlay('result');
        }, 1000);
    }
}

/*!
 * 
 * UPDATE SCORE - This is the function that runs to update game score
 * 
 */
function updateScore(num) {
    playerData.score += num;
    txtResultScore.text = textResultWin.replace('[NUMBER]', playerData.score);
    txtScoreNumber.text = playerData.score;

    //update game speed
    if (playerData.score >= playerData.targetScore) {
        playerData.targetScore += playerData.targetScore;
        playerData.planeMoveSpeed -= levelSpeed_arr.planeMoveSpeed;
        playerData.landingTimer -= levelSpeed_arr.landingTimer;
        playerData.actionTimer -= levelSpeed_arr.actionTimer;
    }
}

/*!
 * 
 * CONFIRM - This is the function that runs to toggle confirm
 * 
 */
function toggleConfirm(con) {
    confirmContainer.visible = con;

    if (con) {
        TweenMax.pauseAll(true, true);
        toggleInterval(false);
        //gameData.paused = true;
    } else {
        TweenMax.resumeAll(true, true);
        toggleInterval(true);
        //gameData.paused = false;
    }
}

/*!
 * 
 * OPTIONS - This is the function that runs to toggle options
 * 
 */

function toggleOption() {
    if (optionsContainer.visible) {
        optionsContainer.visible = false;
    } else {
        optionsContainer.visible = true;
    }
}

/*!
 * 
 * OPTIONS - This is the function that runs to mute and fullscreen
 * 
 */
function toggleGameMute(con) {
    buttonSoundOff.visible = false;
    buttonSoundOn.visible = false;
    toggleMute(con);
    if (con) {
        buttonSoundOn.visible = true;
    } else {
        buttonSoundOff.visible = true;
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

/*!
 * 
 * SHARE - This is the function that runs to open share url
 * 
 */
function share(action) {
    gtag('event', 'click', {
        'event_category': 'share',
        'event_label': action
    });

    var loc = location.href
    loc = loc.substring(0, loc.lastIndexOf("/") + 1);
    var title = shareTitle.replace("[SCORE]", playerData.score);
    var text = shareMessage.replace("[SCORE]", playerData.score);

    title = title.replace("[TERMINAL]", playerData.level);
    text = text.replace("[TERMINAL]", playerData.level);

    var shareurl = '';

    if (action == 'twitter') {
        shareurl = 'https://twitter.com/intent/tweet?url=' + loc + '&text=' + text;
    } else if (action == 'facebook') {
        shareurl = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(loc + 'share.php?desc=' + text + '&title=' + title + '&url=' + loc + '&thumb=' + loc + 'share.jpg');
    } else if (action == 'google') {
        shareurl = 'https://plus.google.com/share?url=' + loc;
    } else if (action == 'whatsapp') {
        shareurl = "whatsapp://send?text=" + encodeURIComponent(text) + " - " + encodeURIComponent(loc);
    }

    window.open(shareurl);
}