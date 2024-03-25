let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.querySelector(".start-recording button");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");
let recorder;

function log(msg) {
  // Log messages on screen
  logElement.innerHTML = msg + "\n";
}

function startRecording(stream) {
  // Start recording
  recorder = new MediaRecorder(stream); // API to record media in JavaScript provides different functionalities
  let data = [];

  // On data available - fires periodically each time timeslice milliseconds of media have been recorded or
  // when the entire media is recorded if no timeslice is specified
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.start(); // Start the recording

  log('"Recording..."');

  // When stopped it will resolve the promise
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event.name);
  });

  // When stopped it will return the data when it is recorded and stopped completely
  return Promise.all([stopped, recorder]).then(() => data);
}

function stop(stream) {
  if (recorder.state == "recording") {
    recorder.stop();
  }

  // GetTracks = returns a sequence that represents all the MediaStreamTrack objects and stops
  // all of them
  stream.getTracks().forEach((track) => track.stop());
}

startButton.addEventListener(
  "click",
  function () {
    // Hide the settings div
    document.querySelector(".settings").style.display = "none";

    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        // Stream - MediaStreamTrack
        preview.srcObject = stream;
        preview.captureStream =
          preview.captureStream || preview.mozCaptureStream;
        return new Promise((resolve) => (preview.onplaying = resolve));
      })
      .then(() => startRecording(preview.captureStream()))
      // CaptureStream() will return a MediaStream object
      // which is streaming a real-time capture of the
      // content being rendered in the media element.
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        recording.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recording.src;
        downloadButton.download = "RecordedVideo.webm";

        log(
          "Successfully recorded " +
            recordedBlob.size +
            " bytes of " +
            recordedBlob.type +
            " media."
        );

        // Show the stop button after recording starts
        stopButton.style.display = "block";
      })
      .catch(log);
  },
  false
);

stopButton.addEventListener(
  "click",
  function () {
    // Passing the recorded chunks as an argument
    stop(preview.srcObject);

    // Show the settings div when stopped
    document.querySelector(".settings").style.display = "block";

    // Hide the stop button after stopping recording
    stopButton.style.display = "none";

    // Show the recording preview
    recording.style.display = "block";
  },
  false
);
