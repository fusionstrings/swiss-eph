// Worker example for wasmbuild | js_api | moshier
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | js_api | moshier - flag: " + CALC_FLAG);
  }
};
