# Basic Patterns

Ready to make some cool patterns? Here are a few recipes using just the free modules. Feel free to tweak the numbers and make them your own!

## 1. Straight Stream
*The classic "pew pew"*

Great for basic enemies or player weapons.

**Main:**

- `FireMode`: `Automatic`
- `FireRate`: `0.1` (fast)
- `Speed`: `6`
- `Lifetime`: `2`

**Spawn Shape Data:**

- `numPoints`: `1`
- `spawnDir`: `Direction`

**Modules:** None needed!

---

## 2. Radial Burst
*The "shockwave"*

Spawns a ring of bullets expanding outward.

**Main:**

- `FireMode`: `Automatic` (or `Manual` for explosions)
- `FireRate`: `1.0` (slow)

**Spawn Shape Data:**

- `numPoints`: `24` (more points = smoother circle)
- `radius`: `0`
- `arc`: `360`
- `spawnDir`: `Spherised` (this makes them shoot outward from the center)

**Burst Data:**

- `burstCount`: `1` (single ring)
- Try `3` with a small `burstDelay` for a triple-ring effect!

---

## 3. Rotating Spiral
*The "bullet hell staple"*

A single stream that spins around, creating a beautiful spiral.

**Base Settings:** Start with the **Straight Stream** above.

**Add Module:** `SpawnerRotateModule`

- `angularSpeed`: `120` (spin speed)

**Polish:**

- Add `SpeedOverTimeModule` to make the spiral expand faster or slower as it goes out.
- Add `BulletColorOverTimeModule` to make it look hypnotic.

---

## 4. Wave Stream
*The "wobbly laser"*

A stream of bullets that speeds up and slows down, creating a wave effect.

**Base Settings:** Start with the **Straight Stream**.

**Add Module:** `SpeedOverTimeModule`

- **Curve**: Make it go up and down (e.g., 0.8 -> 1.2 -> 0.8).
- **Mode**: `Time` (loops the curve)
- **Time**: `0.8` (how fast the wave pulses)

---

## 5. Hold & Release
*The "wait for it..."*

Spawn bullets, freeze them in place, then launch them all at once.

**Setup:**

- Add `WaitToContinueModule`.
- Set `timeToPlayBeforeWaiting` to a small number (like `0.5`) so they fly out a bit and then stop.

**Trigger:**
Call this in your code when you're ready to fire:
```csharp
spawner.ActivateWaitingBullets();
```

**Great for:** Boss attacks where you want to telegraph the pattern before it becomes dangerous.

---

## 6. Shotgun Blast
*The "boomstick"*

A random spread of bullets in a cone.

**Main:**

- `FireMode`: `Manual`

**Spawn Shape Data:**

- `numPoints`: `10`
- `spawnDir`: `Randomised`
- `directionArc`: `30` (how wide the spread is)
- `randomise`: `true`

**Trigger:**
```csharp
if (Input.GetMouseButtonDown(0))
    spawner.Spawn(transform, Time.deltaTime);
```

## Tuning Tips

- **Too dense?** Lower `numPoints` or increase `FireRate` (higher number = slower fire).
- **Too slow?** Increase `Speed`.
- **Laggy?** Reduce the number of modules or total bullet count.
- **Colliders**: Use Circle colliders for best performance.
