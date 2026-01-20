// Worker example for wasmbuild | inline | swiss
// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

export default {
  fetch(_request: Request) {
    return new Response("Worker wasmbuild | inline | swiss - flag: " + CALC_FLAG);
  }
};
