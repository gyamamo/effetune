let portAudio;
let Speaker;

function getPortAudio() {
  if (portAudio) return portAudio;
  try {
    // Lazy-load so that missing native symbols don't abort the process immediately
    // when Electron has a different Node version
    portAudio = require('naudiodon');
  } catch (err) {
    console.error('Failed to load naudiodon:', err);
    console.error('Try running "npm run rebuild" to rebuild the native module.');
    portAudio = null;
  }
  return portAudio;
}

function getSpeaker() {
  if (Speaker) return Speaker;
  try {
    Speaker = require('speaker');
  } catch (err) {
    console.error('Speaker fallback unavailable:', err);
    Speaker = null;
  }
  return Speaker;
}

class NativeOutput {
  constructor() {
    this.stream = null;
    this.mode = null;
  }

  start(options) {
    if (this.stream) return;
    const pa = getPortAudio();
    if (!pa) {
      const Fallback = getSpeaker();
      if (!Fallback) {
        console.warn('Native audio output unavailable and no fallback found.');
        return;
      }
      const { sampleRate, channelCount } = options;
      this.stream = new Fallback({
        channels: channelCount,
        sampleRate,
        bitDepth: 32,
        float: true
      });
      this.mode = 'speaker';
      return;
    }
    const { sampleRate, channelCount } = options;
    this.stream = new pa.AudioIO({
      outOptions: {
        channelCount,
        sampleFormat: pa.SampleFormatFloat32,
        sampleRate,
        deviceId: -1,
        closeOnError: false
      }
    });
    this.stream.start();
    this.mode = 'portaudio';
  }

  write(buffer) {
    if (!this.stream) return;
    if (!Buffer.isBuffer(buffer)) {
      buffer = Buffer.from(buffer.buffer);
    }
    this.stream.write(buffer);
  }

  stop() {
    if (!this.stream) return;
    try {
      if (this.mode === 'portaudio') {
        this.stream.quit();
      } else if (this.mode === 'speaker') {
        this.stream.end();
      }
    } catch (err) {
      // ignore errors during shutdown
    }
    this.stream = null;
    this.mode = null;
  }
}

module.exports = new NativeOutput();
