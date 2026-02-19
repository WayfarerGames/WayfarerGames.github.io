# Free Modules

Here's the toolbox you get with the free version of Bulletfury. These modules are the building blocks for creating all sorts of patterns.

You can add any of these to your `BulletSpawner` component in the Inspector.

## How modules work

Think of modules as little scripts that run at specific times in a bullet's life:

- **Spawn Modules**: Run *before* the bullet is created (to set position/rotation).
- **Init Modules**: Run *once* when the bullet is born.
- **Update Modules**: Run *every frame* while the bullet is alive.
- **Die Modules**: Run when the bullet hits something or expires.

## The Modules

### SpawnerRotateModule
*Make it spin!*

- **What it does**: Rotates the spawner over time.
- **Perfect for**: Spirals, rotating fans, spinning rings.
- **Key setting**: `angularSpeed` (how fast it spins in degrees per second).

### SpeedOverTimeModule
*Faster! Slower!*

- **What it does**: Changes the bullet's speed over its lifetime.
- **Perfect for**: Bullets that start slow and speed up, or pulse in speed.
- **Key settings**: Draw a curve for speed over time.

### AngularVelocityModule
*Curved shots*

- **What it does**: Rotates the bullet's direction over time.
- **Perfect for**: Wavy patterns, boomerangs, or spiraling shots.
- **Key settings**: Draw a curve for rotation speed over time.

### BulletSizeOverTimeModule
*Grow and shrink*

- **What it does**: Changes the bullet's size.
- **Perfect for**: Popping bullets into existence, or shrinking them as they fade out.
- **Key settings**: Draw a curve for size over time.

### BulletColorOverTimeModule
*Pretty colors*

- **What it does**: Tints the bullet color over its life.
- **Perfect for**: Fading bullets out, or making them "heat up" as they travel.
- **Key settings**: Set a gradient for color over time.

### BulletDamageOverTimeModule
*Damage falloff*

- **What it does**: Changes how much damage a bullet does based on how long it's been alive.
- **Perfect for**: Shotguns (high damage close up, low damage far away).
- **Key settings**: Draw a curve for damage multiplier.

### WaitToContinueModule
*Wait for it...*

- **What it does**: Pauses bullets after a certain time, waiting for a signal to continue.
- **Perfect for**: "Trace then release" patterns, or freezing bullets in place before launching them at the player.
- **How to use**: Call `spawner.ActivateWaitingBullets()` in your code to release them.

## Want more?

The Pro version includes even more modules like **Homing/Tracking**, **Bouncing**, **Sub-Spawners**, and **Rewind/Replay**. But don't worry, the free version is plenty powerful for most games!

## Premium-only Modules

> **Premium-only:** The modules in this section are part of Bulletfury Pro and are not included in the free package.

### AimedShotModule
*Smart spawn aiming*

- **What it does**: Re-aims emission direction at a target before bullets spawn.
- **Perfect for**: Turrets, lock-on volleys, and predictive enemy shots.
- **Why it's useful**: Gives you precise control over how patterns track moving targets.

### TrackObjectModule
*Homing over lifetime*

- **What it does**: Steers bullets toward a tracked target while they are alive.
- **Perfect for**: Homing missiles, pressure projectiles, and adaptive boss attacks.
- **Why it's useful**: Makes patterns feel reactive without rebuilding your whole spawner setup.

### BulletBounceModule
*Ping-pong chaos*

- **What it does**: Lets bullets bounce off colliders instead of dying immediately.
- **Perfect for**: Arena patterns, enclosed boss rooms, and "last bullet standing" style attacks.
- **Why it's useful**: Creates dense patterns from fewer bullets.

### SubSpawnerModule
*Bullets that make bullets*

- **What it does**: Spawns new bullets when parent bullets hit or expire.
- **Perfect for**: Splitting shots, chain reactions, and layered boss phases.
- **Why it's useful**: Great for complex patterns built from simple pieces.

### ForceOverTimeModule
*Add acceleration and drift*

- **What it does**: Applies curve-driven force over time in local or world space.
- **Perfect for**: Wind-like motion, gravity drifts, and arcing trajectories.
- **Why it's useful**: Lets you shape complex motion without custom per-pattern scripts.

### SinWaveOffsetModule
*Wavy movement*

- **What it does**: Offsets bullets sideways with sinusoidal motion over time.
- **Perfect for**: Serpentine shots, weaving walls, and rhythm-style bullet patterns.
- **Why it's useful**: Adds visual complexity while keeping spawn logic simple.

### SpawnFromTransformModule
*Proxy origin spawning*

- **What it does**: Spawns bullets from a referenced transform, then moves them back to their original target position.
- **Perfect for**: Portal effects, offset emitters, and "remote muzzle" style weapons.
- **Why it's useful**: Decouples where bullets appear from where the spawner lives.

### ReplayModule + RewindModule
*Time tricks*

- **What it does**: Records simulation snapshots, then rewinds through them in real time. Requires the `DeterministicRuntimeModule`
- **Perfect for**: Timeline attacks, deterministic pattern replays, and stylized time-control mechanics.
- **Why it's useful**: Makes advanced "scripted chaos" patterns much easier to produce.

### DeterministicRuntimeModule
*Stable simulation seeds*

- **What it does**: Installs deterministic runtime sampling with seed/tick control.
- **Perfect for**: Replays, synchronized encounters, and repeatable debugging.
- **Why it's useful**: Helps make runs reproducible across sessions.

## Performance Tips

- **Parallel is better**: Most built-in modules run in parallel (on multiple CPU cores) automatically.
- **Keep it simple**: If you're spawning thousands of bullets, try to use simple curves.
