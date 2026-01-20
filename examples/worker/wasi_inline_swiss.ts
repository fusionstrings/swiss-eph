// Worker example for wasi | inline | swiss
// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasi | inline | swiss - flag: " + CALC_FLAG);
  }
};
