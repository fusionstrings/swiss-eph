// Worker example for wasmbuild | js_api | swiss
// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | js_api | swiss - flag: " + CALC_FLAG);
  }
};
