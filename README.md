# @fusionstrings/swisseph-wasi

Swiss Ephemeris astronomical calculation library compiled to WebAssembly for
cross-platform JavaScript/TypeScript usage.

## Features

- **Cross-platform**: Works in Deno, Node.js, browsers, and edge runtimes
  (Cloudflare Workers)
- **High precision**: Bit-level accuracy matching native Swiss Ephemeris
  calculations
- **Complete API**: 95+ functions for planetary positions, houses, eclipses, and
  more
- **Zero dependencies**: Self-contained WASM module with built-in Moshier
  ephemeris
- **TypeScript**: Full type definitions with TSDoc documentation

## Installation

### Deno / JSR

```typescript
import { load } from "jsr:@fusionstrings/swisseph-wasi";
```

### Node.js / npm

```bash
npm install @fusionstrings/swisseph-wasi
```

```typescript
import { load } from "@fusionstrings/swisseph-wasi";
```

### Browser

```html
<script type="module">
  import { load } from "https://esm.sh/@fusionstrings/swisseph-wasi";
</script>
```

## Quick Start

```typescript
import { Constants, load } from "@fusionstrings/swisseph-wasi";

// Initialize the Swiss Ephemeris
const eph = await load();

// Calculate Julian Day for a date
const jd = eph.swe_julday(2024, 6, 15, 12.0, Constants.SE_GREG_CAL);

// Get Sun's position
const { xx, error } = eph.swe_calc_ut(
  jd,
  Constants.SE_SUN,
  Constants.SEFLG_SPEED,
);
console.log(`Sun longitude: ${xx[0]}°`);

// Calculate house cusps (Placidus, Zurich)
const { cusps, ascmc } = eph.swe_houses(jd, 47.3769, 8.5417, "P".charCodeAt(0));
console.log(`Ascendant: ${ascmc[0]}°`);
console.log(`MC: ${ascmc[1]}°`);
```

## API Overview

### Core Calculations

| Function                       | Description                 |
| ------------------------------ | --------------------------- |
| `swe_calc` / `swe_calc_ut`     | Planetary positions (TT/UT) |
| `swe_houses` / `swe_houses_ex` | House cusps and angles      |
| `swe_julday` / `swe_revjul`    | Julian Day conversions      |
| `swe_sidtime`                  | Sidereal time               |
| `swe_deltat`                   | Delta T (TT - UT)           |

### Coordinate Systems

| Function           | Description                  |
| ------------------ | ---------------------------- |
| `swe_cotrans`      | Ecliptic ↔ Equatorial        |
| `swe_azalt`        | Horizontal coordinates       |
| `swe_set_sid_mode` | Sidereal mode (Lahiri, etc.) |
| `swe_get_ayanamsa` | Ayanamsa value               |

### Eclipses & Events

| Function                    | Description            |
| --------------------------- | ---------------------- |
| `swe_sol_eclipse_when_glob` | Solar eclipse timing   |
| `swe_lun_eclipse_when`      | Lunar eclipse timing   |
| `swe_rise_trans`            | Rise/set/transit times |

### Constants

Access astronomical constants via the `Constants` export:

```typescript
import { Constants } from "@fusionstrings/swisseph-wasi";

Constants.SE_SUN; // 0 - Sun
Constants.SE_MOON; // 1 - Moon
Constants.SE_MERCURY; // 2 - Mercury
// ... etc.

Constants.SEFLG_SPEED; // Include velocities
Constants.SEFLG_SWIEPH; // Use Swiss Ephemeris files
Constants.SE_GREG_CAL; // Gregorian calendar
```

## Using Ephemeris Files

By default, the library uses the built-in Moshier ephemeris. For higher
precision, load Swiss Ephemeris data files:

```typescript
const eph = await load({ ephePath: "./ephe" });

// Or mount files manually
const sepl_18 = await Deno.readFile("./ephe/sepl_18.se1");
eph.mount("sepl_18.se1", sepl_18);
eph.set_ephe_path(".");
```

## Platform Support

| Platform           | Status | Notes                      |
| ------------------ | ------ | -------------------------- |
| Deno               | ✅     | Native support             |
| Node.js            | ✅     | Via npm package            |
| Browser            | ✅     | ESM bundle                 |
| Cloudflare Workers | ✅     | Edge runtime compatible    |
| Bun                | ✅     | Works with Node.js package |

## License

**AGPL-3.0** - Same license as the Swiss Ephemeris library.

This software is based on the Swiss Ephemeris by Astrodienst AG. See
https://www.astro.com/swisseph/ for more information.

## Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG
- WASM compilation using WASI SDK
