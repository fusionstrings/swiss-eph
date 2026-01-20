// Worker example for wasi | inline | moshier
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasi | inline | moshier - flag: " + CALC_FLAG);
  }
};
