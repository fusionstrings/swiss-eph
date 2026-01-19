import { instantiate } from "../../src/loader.ts";
import { printResults } from "../shared/logic.ts";

const eph = await instantiate();
printResults("Deno", "wasmbuild", "Inline", { jd: 2460477, sun: { longitude: 0 }, ascmc: [0, 0] });