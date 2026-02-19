# Free Modules

This page documents the modules currently available in the free package.

All modules are added on a `BulletSpawner` via the modules list in the custom inspector.

## Module execution phases

Bulletfury supports multiple module interfaces, each executed at a different point:

- `IBulletSpawnModule`: modifies spawn position/rotation before bullet creation.
- `IBulletInitModule`: runs once when each bullet is created.
- `IBulletModule`: runs every simulation step on active bullets.
- `IParallelBulletModule`: marker for `IBulletModule` implementations that are safe to run in parallel.
- `IBulletDieModule`: runs when a bullet dies/collides; can keep it alive.
- `ISpawnerRuntimeModuleProvider`: supplies custom runtime random/simulation behavior.

## Free module list

## `SpawnerRotateModule`

- **Interface**: `IBulletSpawnModule`
- **Purpose**: continuously rotates spawn orientation.
- **Key setting**:
  - `angularSpeed`: degrees/second.
- **Use when**:
  - You want spirals, rotating fans, or rotating rings.

## `SpeedOverTimeModule`

- **Interfaces**: `BulletModule`, `IParallelBulletModule`
- **Purpose**: scales `CurrentSpeed` over bullet life or looped time.
- **Key settings**:
  - `speedOverTime` curve
  - `scale`
  - inherited `Mode` (`Lifetime` or looping)
  - inherited `Time` loop duration
- **Use when**:
  - You want acceleration/deceleration or pulsing speed.

## `AngularVelocityModule`

- **Interfaces**: `BulletModule`, `IParallelBulletModule`
- **Purpose**: rotates bullet orientation over time.
- **Key settings**:
  - `angularVelocity` curve
  - `scale`
  - inherited `Mode` and `Time`
- **Use when**:
  - You want curved trajectories driven by changing forward direction.

## `BulletSizeOverTimeModule`

- **Interfaces**: `BulletModule`, `IParallelBulletModule`
- **Purpose**: scales bullet size over time.
- **Key settings**:
  - `sizeOverTime` curve
  - inherited `Mode` and `Time`
- **Use when**:
  - You want grow/shrink effects, telegraphing, or pop-in/out visuals.

## `BulletColorOverTimeModule`

- **Interface**: `BulletModule`
- **Purpose**: multiplies bullet color by a gradient over time.
- **Key settings**:
  - `colorOverTime` gradient
  - inherited `Mode` and `Time`
- **Use when**:
  - You want fade-in/fade-out, warning colors, or heat-up visuals.

## `BulletDamageOverTimeModule`

- **Interfaces**: `IBulletModule`, `IParallelBulletModule`
- **Purpose**: sets bullet damage from a curve using life percent.
- **Key settings**:
  - `damageOverTime` curve
- **Use when**:
  - You want damage falloff/ramp-up during lifetime.

## `WaitToContinueModule`

- **Interface**: `IBulletInitModule`
- **Purpose**: spawns bullets into waiting mode after an optional initial run time.
- **Key setting**:
  - `timeToPlayBeforeWaiting`
- **Use when**:
  - You want "trace then release" behavior, synchronized releases, or hold-and-fire moments.
- **Pair with**:
  - `BulletSpawner.ActivateWaitingBullets()`

## Notes on free vs premium

The free package module list above does not include premium-only modules (tracking, force fields, replay/rewind, bounce, sub-spawners, and similar advanced modules).

## Performance guidance

- Prefer modules marked `IParallelBulletModule` for heavy per-bullet logic.
- Keep custom `IParallelBulletModule` code stateless and avoid Unity API calls inside `Execute`.
- Minimize expensive curve/gradient work when very high bullet counts are active.
