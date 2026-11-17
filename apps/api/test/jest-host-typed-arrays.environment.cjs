const { TestEnvironment } = require('jest-environment-node');

/**
 * onnxruntime-node (behind transformers.js, for the RAG embedding and
 * reranker models) checks tensor data with `instanceof Float32Array` against
 * the host realm. Jest runs each spec in its own vm context with its own typed
 * array constructors, so model calls fail there. Hand the spec context the
 * host's typed array constructors.
 */
class HostTypedArraysEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    for (const name of [
      'Float32Array',
      'Float64Array',
      'Int8Array',
      'Uint8Array',
      'Int16Array',
      'Uint16Array',
      'Int32Array',
      'Uint32Array',
      'BigInt64Array',
      'BigUint64Array',
    ]) {
      this.global[name] = globalThis[name];
    }
  }
}

module.exports = HostTypedArraysEnvironment;
