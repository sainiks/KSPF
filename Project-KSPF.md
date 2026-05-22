# Project Overview
**Project Name:** Artificer 3D Motion Portfolio
**Developer:** Kunal Saini (Handle: Artificer)
**Project Type:** Interactive 3D WebGL Portfolio Website
**Core Vibe:** Dark, devilish, imposing, and highly kinetic.
**Primary Visual Element:** A pitch-black Dark Phoenix that acts as a 3D scrollable element, driving the user's journey from the hero section downwards.

# Technology Stack
*   **Framework:** React
*   **3D Rendering:** Three.js, React Three Fiber (@react-three/fiber), Drei (@react-three/drei)
*   **Animation & Scroll:** GSAP (GreenSock), GSAP ScrollTrigger
*   **Package Manager:** Bun
*   **Development Environment:** Antigravity IDE / Helix Editor / Ghostty Terminal (macOS)

# Visual & Aesthetic Requirements
*   **Color Palette:** Pitch black canvas (`#000000`).
*   **3D Model:** A `.glb` file of a Phoenix (`phoenix.glb`).
*   **Material Overrides (Crucial):** The Phoenix model's native textures must be overridden via Three.js in the code. It must be rendered as obsidian/pitch-black (`#050505`) with a roughness of `0.4` and metalness of `0.6` so the feathers catch harsh light.
*   **Lighting Design:** The environment must have extremely low ambient light (`0.05`). The form of the Phoenix is revealed entirely through fierce, highly saturated lighting:
    *   Directional Light: Fiery Red (`#ff3300`, intensity 2.5)
    *   SpotLight: Intense Orange (`#ff8800`, intensity 5)
    *   PointLight (Undertow): Deep Red (`#cc0000`, intensity 3, shining from below)
*   **Typography:** The Hero section features the handle "ARTIFICER" in a large, bold, uppercase font with a red drop-shadow/glow.

# 3D Mechanics & Scroll Animation (GSAP)
*   **Canvas Setup:** The R3F `<Canvas>` is fixed to the viewport (`100vh`), while the HTML container (`#portfolio-container`) acts as the scroll track (`500vh`).
*   **Scroll Scrubbing:** GSAP ScrollTrigger is linked to the container with `scrub: 1` for fluid, physics-based lag behind the user's scroll.
*   **The Phoenix Dive:** As the user scrolls from top to bottom, the Phoenix must:
    1.  Translate down the Y-axis (diving down the page).
    2.  Translate slightly on the X-axis (drifting/banking).
    3.  Rotate on the X-axis (tilting forward into the dive).
    4.  Rotate on the Z-axis (banking like a bird turning).
    5.  Rotate on the Y-axis (completing a half-spin as it descends).

# Current Code State
The project currently successfully implements the `<Canvas>` setup, the lighting array, the `.glb` model loading via `useGLTF`, the material traversal/override for the pitch-black effect, and the GSAP timeline linked to the scroll trigger. 

# Immediate Next Steps & Directives
1. Optimize the `phoenix.glb` asset using Draco compression for instant loading.
2. Refine the GSAP timeline values to ensure the Phoenix's wings do not clip through the camera during the dive.
3. Build out the HTML overlay sections (Projects, About, Contact) that will fade in as the Phoenix passes by them during the scroll.