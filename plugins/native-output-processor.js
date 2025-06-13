class NativeOutputProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input.length > 0) {
      const blockSize = input[0].length;
      const channels = input.length;
      const buffer = new Float32Array(blockSize * channels);
      for (let ch = 0; ch < channels; ch++) {
        buffer.set(input[ch], ch * blockSize);
        if (output[ch]) output[ch].set(input[ch]);
      }
      this.port.postMessage({ type: 'audio', buffer }, [buffer.buffer]);
    }
    return true;
  }
}

registerProcessor('native-output-processor', NativeOutputProcessor);
