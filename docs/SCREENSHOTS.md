# Screenshots

Captured from the actual v0.6.0 application. Custom examples are illustrative and are not measured site data. Screenshots are JPEG viewport captures; no simulated UI was drawn or generated.

| Image | Setup / interpretation |
| --- | --- |
| [Custom profile](screenshots/custom-profile.jpg) | Other country, named units and local reference; geometry is user-defined. |
| [Building match](screenshots/building-match.jpg) | Two selected aquifers, 20 m each, separated by 10 m clay; Kh assumptions 20 and 10 m/day. |
| [Thermal plume](screenshots/thermal-plume.jpg) | Two-year illustrative transient run, month-end snapshots; selected saved time appears in the view. |
| [Cross-section](screenshots/cross-section.jpg) | Same illustrative run, both aquifers and clay gap. Temperatures are depth-averaged, not a vertical simulation. |
| [REGIS profile](screenshots/regis-profile.jpg) | Public software test point RD 121394 / 487383; regional model data, not a design recommendation. |

To reproduce the custom case: use Other, reference elevation 0 m, Upper sand 0–20 m (Kh 20), Clay separator 20–30 m (Kh blank), Lower sand 30–50 m (Kh 10). Select both aquifers and apply. Leave plant/building/thermal defaults, set duration to 2 years and use month-end saved states. Slider position is visible in thermal captures. Every property is an assumption except values retrieved explicitly for the REGIS screenshot.
