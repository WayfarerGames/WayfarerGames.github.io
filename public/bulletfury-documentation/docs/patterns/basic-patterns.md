# Basic Patterns

These recipes use free package features only.

## Pattern 1: Straight stream

Good for baseline enemy fire.

### Main settings

- `FireMode`: `Automatic`
- `FireRate`: `0.08` to `0.15`
- `Speed`: `4` to `8`
- `Lifetime`: `1.5` to `3`

### Spawn Shape Data

- `numPoints`: `1`
- `numPerSide`: `1`
- `radius`: `0`
- `spawnDir`: `Direction`

### Modules

- none required

---

## Pattern 2: Radial burst

Spawns a full ring from a single emitter.

### Main settings

- `FireMode`: `Automatic` or `Manual`
- `FireRate`: `0.5` to `1.2`

### Spawn Shape Data

- `numPoints`: `24` (or 12/36 depending on density)
- `numPerSide`: `1`
- `radius`: `0`
- `arc`: `360`
- `spawnDir`: `Spherised`

### Burst Data (optional)

- `burstCount`: `1` for single ring
- `burstCount` > `1` + `burstDelay` for stacked rings

---

## Pattern 3: Rotating spiral

Classic bullet-hell spiral using one spawn module.

### Base settings

- Start from Pattern 1 settings.

### Add module

- Add `SpawnerRotateModule`.
- Set `angularSpeed` to `60`-`240` depending on desired spin.

### Optional polish modules

- `SpeedOverTimeModule` for acceleration tails.
- `BulletColorOverTimeModule` for visual rhythm.

---

## Pattern 4: Wave stream

Creates movement variation while preserving directional fire.

### Base settings

- Start from Pattern 1.

### Add module

- Add `SpeedOverTimeModule`.
- Example curve:
  - starts at `0.7`
  - peaks around `1.2`
  - returns to `0.8`
- Set `Mode` to `Time` and `Time` to `0.5`-`1.2` for repeated pulsing.

---

## Pattern 5: Hold then release

Spawn bullets, pause them, then release in sync.

### Setup

- Add `WaitToContinueModule`.
- Set `timeToPlayBeforeWaiting` to when bullets should enter waiting mode.

### Trigger release

Call:

```csharp
spawner.ActivateWaitingBullets();
```

### Common use

- Boss attack telegraph:
  - spawn pattern
  - short pause
  - release all bullets at once

---

## Pattern 6: Manual shotgun cone

Fire on input and randomize cone direction with spawn settings.

### Main settings

- `FireMode`: `Manual`

### Spawn Shape Data

- `numPoints`: `8` to `16`
- `numPerSide`: `1`
- `spawnDir`: `Randomised`
- `directionArc`: `20` to `45`
- `randomise`: `true`
- `onEdge`: `true` (optional for edge-only spread)

### Script trigger

```csharp
if (Input.GetMouseButtonDown(0))
    spawner.Spawn(transform, Time.deltaTime);
```

## Pattern tuning checklist

- Increase `numPoints` for denser patterns.
- Increase `FireRate` interval to reduce spawn frequency.
- Reduce module count first when optimizing heavy scenes.
- Prefer circle collider mode unless capsule behavior is required.
