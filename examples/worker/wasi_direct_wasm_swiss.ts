// Worker example for wasi | direct_wasm | swiss
// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasi | direct_wasm | swiss - flag: " + CALC_FLAG);
  }
};
