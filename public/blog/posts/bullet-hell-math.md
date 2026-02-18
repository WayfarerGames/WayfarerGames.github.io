---
title: The Mathematics of Bullet Hell Patterns
date: 2026-02-18
summary: How great danmaku patterns aren't hand-placed — they're mathematical functions. A walkthrough of a single algorithm, evolved from a point on a circle into spiraling, fractal barrages.
---

# The Mathematics of Bullet Hell Patterns

Great danmaku patterns aren't hand-placed. They're mathematical functions.

The moment I internalised that, everything about designing Polyfury changed. You stop thinking about individual bullets and start thinking about systems — functions that take a handful of variables and output a thousand projectiles in a coherent, readable, beautiful barrage.

What follows is a walkthrough of a single algorithm, traced from its simplest form to its most complex. We start with a point on a circle. By the end, we have spiraling, fractal curtains of bullets. Each step is one idea added on top of the last.

> This post focuses on implementation math. For design theory — *why* a pattern feels fair, readable, or satisfying — I'd point you to [Sparen's Danmaku Design Guides](https://sparen.github.io/ph3tutorials/danmakudesign.html), which are excellent.

---

## Step 1: The Unit Circle

Everything begins here. A loop index becomes a 2D position.

The mechanism is polar-to-Cartesian conversion. Given an angle θ and a radius:

```
x = cos(θ) * radius
y = sin(θ) * radius
```

You feed in an angle, you get a point on a circle. Iterate over angles and you get a shape. The number of bullets you want divided into 360° gives you your step size.

- Divide 360° by **1** → a single point.
- Divide by **3** → a triangle.
- Divide by **100** → a circle.

The shape isn't a special case. A triangle is just a low-resolution circle. A hexagon is a medium-resolution circle. Every polygon is the same function with a different loop count. The "shape" is a resolution setting.

---

## Step 2: The Edge

Vertices alone make for gappy walls. Six bullets placed at the corners of a hexagon don't read as a hexagon — they read as six bullets. To create a solid shape, we need to fill the space between vertices.

The tool for this is **linear interpolation**, or lerp.

Take two adjacent vertices, A and B. Calculate a point P along the line between them using a percentage `t` where 0 is A and 1 is B:

```
P = A + t * (B - A)
```

By iterating `t` from 0 to 1 across enough steps, you draw a straight line of bullets connecting the two corners. Apply this to every pair of adjacent vertices from Step 1 and the sparse polygon becomes a solid geometric wall.

The density of the wall is just a loop count on `t`. More iterations, tighter spacing.

---

## Step 3: The Arc

A full 360° circle isn't always what you want. A focused burst, a shotgun spread, a crescent — all of these are partial circles.

The fix is **domain limiting**. Instead of iterating θ from `0` to `360°`, you iterate from `angle_start` to `angle_end`:

```
angle_start = aim_direction - (arc_width / 2)
angle_end   = aim_direction + (arc_width / 2)
```

Subtracting half the arc width from the starting angle keeps the pattern centred on whatever direction you're aiming. A 90° arc aimed forward becomes a forward-facing fan. A 30° arc aimed down becomes a focused downward blast.

The same polygon generation code from Steps 1 and 2 works unchanged. You're just clamping the range of angles it operates over. A square with a 180° domain becomes a three-sided open shape. A circle with a 45° domain becomes a tight arc. One variable, entirely different silhouettes.

---

## Step 4: The Flow

Here's where patterns go from geometric to dynamic. **Where a bullet spawns and where it travels are completely separate vectors.**

Once you've calculated a spawn position using Steps 1–3, you independently calculate a velocity. Three common modes:

**Radial** — the bullet flies straight away from the centre. Velocity is just the normalised spawn position vector. This is the default for most "explosion" patterns — bullets all spreading outward.

**Normal** — velocity is perpendicular to the edge the bullet spawned on. Bullets fly flat, parallel to the wall they formed part of. This creates sliding, sweeping walls that travel sideways across the screen rather than expanding outward.

**Cartesian** — velocity is a fixed world-space vector, like `(0, 1)` for straight down. Every bullet falls at the same angle regardless of where it spawned. This is how "rain" and "curtain" patterns work — bullets arranged in a geometric pattern but all falling in the same direction.

The key insight is that these are composable. You can mix radial and Cartesian by blending the two vectors. The spawn shape and the travel direction are just two knobs, and they're orthogonal.

---

## Step 5: The Spiral

Static shapes are readable but lifeless. The hypnotic quality of a great bullet hell pattern comes from motion — specifically, from the whole coordinate system rotating over time.

This is **angular velocity**. Each frame (or each time the pattern fires), you add a small rotation offset to every angle:

```
θ_final = θ_base + (ω * time)
```

Where `ω` is your rotation speed in degrees per second (or per shot).

The effect is striking. A ring of bullets fired once a second becomes a slow-spinning ring. A tight burst fired rapidly with a small `ω` between each shot traces out a multi-armed spiral galaxy. The bullets themselves travel in straight lines — it's only the spawn positions that rotate, but the visual result reads as curving, sweeping arcs.

Changing the sign of `ω` reverses the spiral direction. Running two instances simultaneously with `+ω` and `-ω` creates counter-rotating double helices. This is the core of most "flower" and "galaxy" patterns in the genre.

---

## Step 6: The Fractal

Density is the defining visual quality of a danmaku curtain. But naively adding more bullets to a single shape has diminishing returns — at some point you're just making a solid block.

The more interesting approach is **grouping**: instead of spawning a single bullet at a calculated point, you spawn *another shape* centred on that point.

A ring of points, each of which is itself a ring of bullets. A rotating arc of points, each emitting a small radial burst. You're stacking the output of Step 1 as the input of another Step 1. The emergent complexity is much greater than the sum of the parts, and the CPU cost is linear — just two nested loops.

A second technique is **stacking**: run the entire simulation multiple times in a single frame with slightly different speed values:

```
speed = base_speed + (burst_index * delta_speed)
```

This produces the layered "fast bullets overtaking slow bullets" effect — multiple rings expanding at different rates from the same origin point, creating depth and parallax in a 2D space.

Both techniques are applications of the same idea: reuse the algorithm, don't complicate it.

---

## Step 7: Bounded Chaos

Pure math feels robotic. Perfect circles, perfect spirals — they're technically impressive but visually cold. The last ingredient is **controlled randomness**.

The technique is applying a small noise range to constants:

```
actual_radius = base_radius + random(-noise, noise)
actual_angle  = base_angle  + random(-jitter, jitter)
```

A circle with radius noise becomes a vibrating, organic ring. A spiral with angle jitter stops looking like a mechanism and starts looking like something alive. The underlying geometry is still there — you haven't abandoned the structure — but the regularity is broken just enough to feel magical rather than algorithmic.

The key word is *bounded*. `random(-noise, noise)` keeps the variation within a controlled range, so the pattern remains readable. Too much noise and you lose the shape entirely. The right amount makes it breathe.

---

## Putting It Together

These seven steps aren't a sequence you run once. They're a set of variables on a single function:

| Variable | What it controls |
|---|---|
| `bullet_count` | Shape resolution (Step 1) |
| `fill_steps` | Edge density (Step 2) |
| `arc_width` | Domain (Step 3) |
| `velocity_mode` | Flow direction (Step 4) |
| `angular_velocity` | Spiral rate (Step 5) |
| `group_count` / `burst_layers` | Density (Step 6) |
| `noise` / `jitter` | Organic feel (Step 7) |

Tweaking one variable changes the entire character of the pattern. That's the power of thinking in algorithms rather than placements. You're not designing individual bullets — you're designing the function that generates them. And functions are infinitely tunable.
