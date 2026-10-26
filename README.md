# ATES Explorer

Explore how the aquifer beneath your site could meet the heating and cooling needs of a building.

**[Open ATES Explorer](https://floriansmit.github.io/ates-explorer/)** · [Alternative hosted app](https://ates-explorer.floriansmit88.chatgpt.site/) · [Step-by-step user guide](docs/USER_GUIDE.md)

ATES Explorer is a browser-based tool for exploring low-temperature, open-loop **aquifer thermal energy storage (ATES)**. Select local aquifer layers, configure a warm/cold well pair, and compare its estimated performance with monthly building demand. You can also simulate how aquifer temperatures change over successive heating and cooling seasons.

Use it to compare early concepts, explore assumptions and understand the relationship between geology, building demand and seasonal heat storage. Calculations are experimental screening estimates; site investigation and detailed engineering are needed before making design or permitting decisions.

![ATES Explorer showing a custom geological profile](docs/screenshots/custom-profile.jpg)

## What you can explore

- **Local geology:** retrieve a geological profile in the Netherlands or Denmark, or build your own layered profile for another location.
- **Aquifer selection:** select one or several aquifers, adjust well-screen intervals and enter hydraulic properties.
- **Building demand:** use generated seasonal heating/cooling profiles or import your own monthly loads.
- **System performance:** estimate groundwater flow, heating and cooling delivery, unmet demand and electricity use.
- **Seasonal behaviour:** explore warm and cold plumes, production temperatures and the effect of regional groundwater flow.
- **Alternative scenarios:** change assumptions, save inputs and export results for further analysis.

## Get started

Open the [app](https://floriansmit.github.io/ates-explorer/) in your browser. No installation is needed.

1. **Choose a country and site.** For the Netherlands or Denmark, search for an address, click the map or enter coordinates. For another country, choose **Other · custom profile** and enter your own layers and elevation reference. You can also choose **Explore an example stack** to try a labelled synthetic profile.
2. **Select the aquifers.** Click an aquifer band in the profile or select its row in the layer list. Select multiple intervals if needed, then click **Use selected aquifer intervals**. Clay and unselected gaps are excluded from screened thickness and transmissivity.
3. **Configure the system.** Review screen tops/bases and horizontal hydraulic conductivity (**Kh**, in m/day). Enter any missing Kh values before calculating. Set flow, well spacing, well-pair count, pumping assumptions and heat-pump settings.
4. **Define building demand.** Enter annual heating and cooling demand or import 12 monthly values. Review the **Building × aquifer match**, monthly delivery and aquifer energy balance.
5. **Run the thermal simulation.** Set temperatures, thermal properties, groundwater gradient and simulation duration, then click **Run thermal simulation**. Use playback or the time slider to inspect the plume and cross-section.
6. **Save your work.** Use **Export scenario** to download your inputs for later restoration, and export monthly or thermal results as needed.

See the [user guide](docs/USER_GUIDE.md) for detailed instructions.

## Country coverage and geological data

| Option | Available data | What you need to check or supply |
| --- | --- | --- |
| **Netherlands · REGIS II** | Live TNO regional layer geometry and available hydraulic properties on a 100 m grid; elevations in m NAP. | Confirm local conditions, feasible saturated screen intervals and any missing Kh values. |
| **Denmark · FOHM / DK-model** | Live GEUS layer geometry, separated into named source-model groups. | Choose one model group and enter Kh for every selected interval. The point service does not declare a vertical datum; elevations remain labelled as source elevations. |
| **Other · custom profile** | User-defined aquifer and aquitard layers for any country, including Estonia. | Supply layer depths, a consistent elevation reference, hydraulic properties and supporting evidence or assumptions. |

Missing data stays unknown. A failed or unavailable geological lookup does not silently substitute an example profile. Regional models help frame an assessment but do not establish site suitability.

Custom-profile depths are positive down from your chosen reference level; elevations are positive up. Define fully saturated aquifer intervals, as the app does not automatically correct them for the water table. Record measured values or clearly identified assumptions in the evidence fields.

## Understanding your results

**Building match:** delivered and unmet heating/cooling show how the assumed system matches monthly demand. Monthly totals do not establish whether hourly peak loads can be covered. Backup heating and cooling are excluded.

**Thermal balance:** compare heat injected into and extracted from the aquifer. Positive injection minus extraction means net heat addition; negative means net removal. Equal building heating and cooling demand does not necessarily balance the aquifer, because heat-pump electricity contributes to delivered heating. At COP 5, for example, 100 MWh of delivered heating removes approximately 80 MWh from the aquifer.

**Temperature evolution:** compare production temperatures and plume shapes at the same season in successive years. Regional groundwater flow can move stored heat away even when annual well-side energy is balanced. Set the hydraulic gradient to zero to explore a case without background flow. Flow direction is relative to the local model axes, not a geographic compass bearing.

**Cross-section:** this is a conceptual view of separate, depth-averaged aquifer temperature fields. It repeats the local geological column horizontally and does not calculate vertical temperature variation or heat transfer through clay.

**Energy-balance residual:** this checks numerical conservation. It is different from the operational balance between seasonal heat injection and extraction.

![Thermal plume playback](docs/screenshots/thermal-plume.jpg)

## Import, export and privacy

- **Monthly demand CSV:** use the header `month,heat_MWh,cool_MWh`, followed by exactly 12 rows for months 1–12 with nonnegative values. Imported loads override the generated seasonal profile. See [example-loads.csv](example-loads.csv).
- **Scenario JSON:** export and restore system inputs, geological provenance, selected screens, custom profiles and evidence. After restoring a scenario, rerun the thermal simulation.
- **Results:** download monthly screening results as CSV and transient thermal results as JSON.

Calculations run on your device. Imported scenario and demand files are processed locally. Address searches, maps and geological lookups contact their respective external services. There is no telemetry or automatic project saving, so **export a scenario before leaving if you want to keep your work**.

Changing the location, country, model group or aquifer selection invalidates previous results. After editing a custom profile, update its preview and apply the selected intervals again.

## Scope and limitations

ATES Explorer has numerical checks, but it has not yet been independently benchmarked against an established ATES simulator or calibrated against field observations.

The model simplifies each selected aquifer as a homogeneous, depth-averaged layer. It excludes vertical leakage and aquitard heat exchange, buoyancy, explicit fracture flow, clogging, geochemistry and interference between neighbouring systems or repeated well pairs. Heat-pump performance is an approximation rather than a manufacturer's performance curve.

Treat results as sensitive to your geological, hydraulic, thermal and building assumptions. Compare finer grids and larger simulation domains, and verify site conditions, groundwater chemistry, feasible abstraction/injection rates and applicable permits with appropriate specialists.

## Further information

- [User guide](docs/USER_GUIDE.md) — complete workflow, controls and interpretation.
- [Model description](docs/MODEL.md) — equations, assumptions and excluded processes.
- [Verification and validation status](docs/VALIDATION.md) — what has been checked and what remains unvalidated.
- [Screenshot gallery](docs/SCREENSHOTS.md) — example workflows and views.
- [European model inventory](europe-models.html) — potential data sources for additional countries; these are not active country integrations.
- [Developer guide](docs/DEVELOPMENT.md) — running locally, testing and building.
