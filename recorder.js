// Zadefinuju si tady promenny globalne, aby nepatrily do scopu jQueryho
// handleru a mohl bych je zkoumat v konzoli.
var myCodeMirror, myPlaybackMirror, recordingTracks, recordingStartTime;

$(function () {

myCodeMirror = CodeMirror.fromTextArea($("#editorArea").get(0));
myPlaybackMirror = CodeMirror.fromTextArea($("#playbackArea").get(0),
                                           {readOnly: true});

// The things I track and how to compute and set them.
var recordingSources = { bufferContents:
                         function () { return myCodeMirror.getValue();},
                         cursorPosition:
                         function () { return myCodeMirror.getCursor();},
                         selectionRange:
                         function () {
                             return { from: myCodeMirror.getCursor(true),
                                      to: myCodeMirror.getCursor(false)};},
                         scrollPosition:
                         function () { return myCodeMirror.getScrollInfo();} };


$("#startButton").click(function () {
    myCodeMirror.focus();
    recordingTracks = {};
    recordingStartTime = new Date();

    $.each(recordingSources, function (name, record) {
        recordingTracks[name] = [];
        recordingTracks[name].push({ time: 0,
                                     value: record()});
    });
    recordingTracks['evaluatedCode'] = [];
});

function recordCurrentState() {
    $.each(recordingSources, function (name, record) {
        var ourTrack = recordingTracks[name];
        var currentState = record();
        if (!_.isEqual(currentState, _.last(ourTrack).value)) {
            ourTrack.push({ time: new Date() - recordingStartTime,
                            value: currentState});
        };
    });
};

// Timhle odchytime zatim vsechny aktivity CodeMirror bufferu,
// ktere nas zajimaji.
myCodeMirror.setOption("onCursorActivity", recordCurrentState);
myCodeMirror.setOption("onScroll", recordCurrentState);

// Eval nemerime pri eventech, ale sbirame pri kliknuti tlacitka 'Eval!'.
$("#evalButton").click(function () {
    var currentCode = myCodeMirror.getValue();
    recordingTracks['evaluatedCode'].push({ time: new Date() - recordingStartTime,
                                            value: currentCode });
    eval(currentCode);
});

$("#playButton").click(function () {
    myPlaybackMirror.focus();
    $.each(recordingTracks, function (name, track) {
        $.map(track, function (event) {
            setTimeout(function () {
                playbook[name](event.value, myPlaybackMirror);},
                       event.time);});});
});

$("#dumpButton").click(function () {
    $("#dumpArea").val(JSON.stringify(recordingTracks, undefined, 2));
});

$("#parseButton").click(function () {
    recordingTracks = JSON.parse($("#dumpArea").val());
});

});