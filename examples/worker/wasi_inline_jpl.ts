// Worker example for wasi | inline | jpl
// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasi | inline | jpl - flag: " + CALC_FLAG);
  }
};
