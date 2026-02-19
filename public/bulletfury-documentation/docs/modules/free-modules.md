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

The Pro version includes even more modules like **Homing/Tracking**, **Force Fields**, **Bouncing**, and **Sub-Spawners**. But don't worry, the free version is plenty powerful for most games!

## Performance Tips

- **Parallel is better**: Most built-in modules run in parallel (on multiple CPU cores) automatically.
- **Keep it simple**: If you're spawning thousands of bullets, try to use simple curves.
