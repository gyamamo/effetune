const portAudio = require('naudiodon');

class NativeOutput {
  constructor() {
    this.stream = null;
  }

  start(options) {
    if (this.stream) return;
    const { sampleRate, channelCount } = options;
    this.stream = new portAudio.AudioIO({
      outOptions: {
        channelCount,
        sampleFormat: portAudio.SampleFormatFloat32,
        sampleRate,
        deviceId: -1,
        closeOnError: false
      }
    });
    this.stream.start();
  }

  write(buffer) {
    if (!this.stream) return;
    // buffer is expected to be a Float32Array
    const buf = Buffer.from(buffer.buffer);
    this.stream.write(buf);
  }

  stop() {
    if (this.stream) {
      try {
        this.stream.quit();
      } catch (err) {
        // ignore errors during shutdown
      }
      this.stream = null;
    }
  }
}

module.exports = new NativeOutput();
