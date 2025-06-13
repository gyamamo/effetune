let portAudio;

function getPortAudio() {
  if (portAudio) return portAudio;
  try {
    // Lazy-load so that missing native symbols don't abort the process immediately
    // when Electron has a different Node version
    portAudio = require('naudiodon');
  } catch (err) {
    console.error('Failed to load naudiodon:', err);
    portAudio = null;
  }
  return portAudio;
}

class NativeOutput {
  constructor() {
    this.stream = null;
  }

  start(options) {
    if (this.stream) return;
    const pa = getPortAudio();
    if (!pa) {
      console.warn('Native audio output unavailable.');
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
      this.stream.quit();
    } catch (err) {
      // ignore errors during shutdown
    }
    this.stream = null;
  }
}

module.exports = new NativeOutput();
