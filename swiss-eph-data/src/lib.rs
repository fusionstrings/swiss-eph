//! Embedded ephemeris data for Swiss Ephemeris.
//!
//! This crate provides pre-packaged ephemeris files for use with `swiss-eph`.
//! The data covers planetary and lunar positions from 1800-2400 CE.
//!
//! # Usage
//!
//! ```rust
//! use swiss_eph_data::{SEPL_18, SEMO_18};
//!
//! // Access raw ephemeris bytes
//! let planet_data: &[u8] = SEPL_18;
//! let moon_data: &[u8] = SEMO_18;
//! ```

/// Planetary ephemeris data (1800-2400 CE).
/// 
/// File: `sepl_18.se1`
/// Contains positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
pub static SEPL_18: &[u8] = include_bytes!("../ephe/sepl_18.se1");

/// Lunar ephemeris data (1800-2400 CE).
/// 
/// File: `semo_18.se1`
/// Contains high-precision Moon positions.
pub static SEMO_18: &[u8] = include_bytes!("../ephe/semo_18.se1");

/// List of all available ephemeris files.
pub static FILES: &[(&str, &[u8])] = &[
    ("sepl_18.se1", SEPL_18),
    ("semo_18.se1", SEMO_18),
];

/// Returns a list of all available ephemeris files.
pub fn list_files() -> &'static [(&'static str, &'static [u8])] {
    FILES
}

/// Get ephemeris data by filename.
pub fn get_file(name: &str) -> Option<&'static [u8]> {
    match name {
        "sepl_18.se1" => Some(SEPL_18),
        "semo_18.se1" => Some(SEMO_18),
        _ => None,
    }
}
