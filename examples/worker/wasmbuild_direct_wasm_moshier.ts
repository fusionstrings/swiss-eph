// Worker example for wasmbuild | direct_wasm | moshier
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | direct_wasm | moshier - flag: " + CALC_FLAG);
  }
};
