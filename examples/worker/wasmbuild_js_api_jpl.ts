// Worker example for wasmbuild | js_api | jpl
// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | js_api | jpl - flag: " + CALC_FLAG);
  }
};
