// ============================================================
// AUDIO PLAYER
// Adds a play button + live waveform to any card, given an audio URL.
// Depends on nothing else — gallery.js just calls attachAudioPlayer().
// ============================================================

function attachAudioPlayer(card, audioUrl) {

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous"; // required so the analyser can read the samples

    const wrapper = document.createElement("div");
    wrapper.classList.add("audio-player");

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.classList.add("play-button");
    playButton.textContent = "▶";

    const canvas = document.createElement("canvas");
    canvas.classList.add("waveform");
    canvas.width = 120;
    canvas.height = 36;
    const canvasCtx = canvas.getContext("2d");

    let audioContext, analyser, dataArray, animationId;

    function setup() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    function draw() {
        animationId = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            i === 0 ? canvasCtx.moveTo(x, y) : canvasCtx.lineTo(x, y);
            x += sliceWidth;
        }

        canvasCtx.strokeStyle = "#333";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
    }

    playButton.addEventListener("click", (event) => {

        // Stop the click from also triggering the card's link.
        event.preventDefault();
        event.stopPropagation();

        if (!audioContext) setup();

        if (audio.paused) {
            audioContext.resume();
            audio.play();
            playButton.textContent = "⏸";
            draw();
        } else {
            audio.pause();
            playButton.textContent = "▶";
            cancelAnimationFrame(animationId);
        }
    });

    audio.addEventListener("ended", () => {
        playButton.textContent = "▶";
        cancelAnimationFrame(animationId);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    });

    wrapper.appendChild(playButton);
    wrapper.appendChild(canvas);
    card.appendChild(wrapper);
}