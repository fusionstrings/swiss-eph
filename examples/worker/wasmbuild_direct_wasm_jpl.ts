// Worker example for wasmbuild | direct_wasm | jpl
// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | direct_wasm | jpl - flag: " + CALC_FLAG);
  }
};
