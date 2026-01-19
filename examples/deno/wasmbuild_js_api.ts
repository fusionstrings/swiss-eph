import * as SwissEph from "../../lib/wasm-inline/swiss_eph.js";
import { printResults } from "../shared/logic.ts";

const ver = SwissEph.version();
const pos = SwissEph.calc_ut(2460477, 0, 0);
printResults("Deno", "wasmbuild", "JS API", { jd: 2460477, sun: { longitude: pos.longitude }, ascmc: [0, 0] });