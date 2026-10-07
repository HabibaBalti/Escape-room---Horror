# The Wall Between Us

A **two-player co-op horror escape room** that runs in the browser. Inspired by the format of Enchambered's *Alone Together*: each player is in a different room on their own screen, and the answer to almost every lock is in the **other** player's room. You have to talk your way out.

**Story:** Sisters Saya and Rin wake up on opposite sides of a wall in their grandmother's house in the seaside town of Uzuhama. The wallpaper is covered in spirals, the dolls' mouths are sewn shut, and something in the walls gets bolder the longer you stay.

**Art style:** hand-built SVG in the style of ink horror manga (heavy linework, cross-hatching, fear lines, spiral eyes, endless hair), coloured in bone, rust, bruise purple and blood red.

## How to play

1. Open `index.html` (or the hosted page) on **two devices**, one per player.
2. One player picks **Saya** (The Doll Atelier), the other picks **Rin** (The Nursery).
3. Get on a voice call. Don't look at each other's screens. Describe everything you see.
4. Click objects to inspect them. Items go in your **Pockets**; click them to inspect or use them.
5. Use **Hints** if you're stuck (step-by-step nudges, then the answer).

Expect about 45–75 minutes. Headphones are recommended, because all of the sound is synthesised live.

> ⚠️ Contains flashing images, body horror and jump scares. Turn jump scares and flashing off in ⚙ Settings.

## Running it

It's a static site with no build step and no server.

- **Locally:** double-click `index.html`, or run `npx serve .`
- **GitHub Pages:** Settings → Pages → deploy from branch → root folder.

Progress saves in each browser's local storage, so a refresh won't lose your place.
URL shortcuts: `?role=saya` / `?role=rin` jump straight into a room; `?reset` wipes saved progress.

## Files

| File | What's in it |
|---|---|
| `index.html` | Screens, panels and overlays |
| `css/style.css` | Ink-and-paper look, lighting, flicker and scare animations |
| `js/art.js` | All the artwork: rooms, close-ups, faces, procedural hair and spirals |
| `js/audio.js` | Web Audio sound: drone, heartbeat, whispers, creaks, the scream |
| `js/game.js` | Game state, puzzles, hints, the horror director and endings |
| `SOLUTIONS.md` | **Spoilers.** The full walkthrough |
| `guide/The-Wall-Between-Us-Solution-Guide.pdf` | **Spoilers.** Illustrated printable solution guide (built from `guide/guide.html`) |
