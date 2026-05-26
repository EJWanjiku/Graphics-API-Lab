# EJ Reef — HTML5 Canvas Graphics Pipeline

An interactive bioluminescent underwater scene built with **HTML5 Canvas**, **CSS**, and **JavaScript** for the Graphics API individual assignment.

## Live Demo

**GitHub Pages:** [https://ejwanjiku.github.io/Graphics-API-Lab/](https://ejwanjiku.github.io/Graphics-API-Lab/)

## Concept

Unlike a falling-object catcher game, *EJ Reef* simulates a glowing deep-sea environment with:

- **Jellyfish** — follows your cursor with pulsing motion and animated tentacles
- **Coral colony** — branching structure that sways with an underwater current
- **Spores** — click anywhere to release bioluminescent particles

## Graphics Pipeline Stages

The code in `app.js` is organized and commented to show all three stages. Each frame in `renderFrame()` runs through them in order: 

1. **Application** — Scene setup, simulation, and user input; decides *what* should exist and *how* it behaves.
   - Key functions: `updateApplication()`, object definitions (jellyfish, coral, spores), mouse/click handlers
   - In this app: jellyfish tracks the cursor, coral sways with the current, spores burst on click

2. **Geometry** — Coordinate transforms and vertex computation; converts object data into drawable shapes in world space.
   - Key functions: `buildJellyfishGeometry()`, `buildCoralGeometry()`, `buildRayGeometry()`, `transformPoint()`
   - In this app: jellyfish bell & tentacle paths, branching coral segments, underwater light-ray polygons

3. **Rasterization** — Pixel output; turns geometry into visible graphics using the Canvas 2D API.
   - Key functions: `rasterizeBackground()`, `rasterizeJellyfish()`, `rasterizeCoral()`, `rasterizeSpores()`, `rasterizeLightRays()`
   - In this app: ocean gradient, bioluminescent glow, strokes, fills, and particle pixels on canvas

## Controls

- **Move mouse** — guide the jellyfish
- **Click** — release a burst of glowing spores

## Files

```
index.html   — page structure and canvas element
styles.css   — layout and visual styling (outside canvas)
app.js       — scene logic and graphics pipeline
```

## Run Locally

Open `index.html` in any modern browser, or serve the folder with a local server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Author

Individual work submission — Graphics API Lab
