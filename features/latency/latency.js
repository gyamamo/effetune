let audioCtx;
let micTrack;
let workletNode;
let sampleTimer;
let displayTimer;
let processingTimeUs = 0;
const latencySamples = [];
const SAMPLE_INTERVAL_MS = 100;
const DISPLAY_INTERVAL_MS = 500;
const MAX_SAMPLES = DISPLAY_INTERVAL_MS / SAMPLE_INTERVAL_MS;

function sampleLatency() {
    const baseLatency = audioCtx.baseLatency || 0;
    const inputLatency = (micTrack.getSettings && micTrack.getSettings().latency) || 0;
    const totalLatencyUs = (baseLatency + inputLatency) * 1e6 + processingTimeUs;
    latencySamples.push(totalLatencyUs);
    if (latencySamples.length > MAX_SAMPLES) {
        latencySamples.shift();
    }
}

function updateLatencyDisplay(resultElem) {
    if (latencySamples.length === 0) return;
    const sum = latencySamples.reduce((a, b) => a + b, 0);
    const avgLatency = sum / latencySamples.length;
    resultElem.textContent = `Latency: ${avgLatency.toFixed(1)} \u03bcs`;
}

async function startLatencyMeasurement() {
    const resultElem = document.getElementById('latency-result');
    resultElem.textContent = 'Measuring...';

    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    await audioCtx.audioWorklet.addModule('../../plugins/audio-processor.js');
    workletNode = new AudioWorkletNode(audioCtx, 'plugin-processor');
    workletNode.port.onmessage = (event) => {
        if (event.data.type === 'processTime') {
            processingTimeUs = event.data.avgProcessTime * 1000;
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micTrack = stream.getAudioTracks()[0];
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(workletNode).connect(audioCtx.destination);

    sampleTimer = setInterval(sampleLatency, SAMPLE_INTERVAL_MS);
    displayTimer = setInterval(() => updateLatencyDisplay(resultElem), DISPLAY_INTERVAL_MS);
}

document.getElementById('start-latency-btn').addEventListener('click', () => {
    startLatencyMeasurement().catch(err => {
        document.getElementById('latency-result').textContent = 'Error: ' + err.message;
    });
});
