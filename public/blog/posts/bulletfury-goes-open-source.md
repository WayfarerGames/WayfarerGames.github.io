---
title: Bulletfury Goes Open Source
date: 2026-02-19
summary: Bulletfury V2 is now fully open source, with Unity collision support, scene previews, performance improvements, and a deep module system for custom bullet behaviors.
---

# Bulletfury Goes Open Source
Hello again! Post #2 hot off the heels of the first - Bulletfury is now open source!

Version 2 is fully working, and it is currently being used in Polyfury: Definitive Edition to great effect (thanks Hermit Cat!).

<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/polyfury-demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

There are lots of really cool changes from V1, too. Here's a brief summary:

- Works with Unity's collisions. That means no more custom collider components.
- Scene view preview, like particle systems.
- Improved performance (read: no more memory leak lol).
- In depth module system for deep customization. This is my favorite thing really; it's so easy to add new spawner and bullet behaviors.
- Massive overhaul of the editor interface. It looks pretty cool.
- Performance hints: if you are using modules that impact performance (for example, the "track object" module calculates the direction to an object for every bullet every frame), you'll get a little indicator and explanation.

V2 is a significant step up. I've learned a lot by releasing a full game using my own tool, and the core engine is now completely free and open source.

You can grab the open source repo here: [github.com/WayfarerGames/bulletfury](https://github.com/WayfarerGames/bulletfury).

There is an asterisk there, though: I've put a lot of time and effort into this, so I've separated some more interesting modules into the paid asset store version. Here's what that version has:

- Object tracking for homing missiles.
- Bouncing bullets (a commonly requested feature!).
- Same-device deterministic mode with replays and rewinding!
  - N.B. this isn't guaranteed cross-device deterministic, so you can't use it for shared replays or online multiplayer unfortunately. I would love that, but it is so much work.
- Aimed bullets with aim prediction.
- Sub spawners for bomb bullets.
- Sin waves so you can wobble your bullets.
- Force over time so you can apply extra forces.
- Spawn from transform so you can change where your bullets initially spawn from.

More will be added over time to the premium version, and this is a free upgrade for anyone who has bought V1.

If you can't afford the £15 price tag, though, I've made all of this solely through the module system - so you can probably write it yourself!
