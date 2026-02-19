# Setup and First Spawn

This guide gets you from package install to seeing your first bullets.

## 1) Install the package

Add Bulletfury to your Unity project's `Packages/manifest.json`:

```json
"com.wayfarergames.bulletfury": "https://github.com/<your-org>/<your-repo>.git?path=/PackageSource/com.wayfarergames.bulletfury"
```

Bulletfury targets **Unity 6 and above** and is **URP only**.

Dependencies include:

- `com.unity.burst`
- `com.unity.collections`
- `com.unity.mathematics`

## 2) Create a spawner object

1. In your scene, create an empty `GameObject`.
2. Add the `BulletSpawner` component.
3. Configure these sections in the component:
   - **Render Data** (`SharedRenderData`)
   - **Main** (`BulletMainData`)
   - **Spawn Shape Data** (`SpawnShapeData`)
   - **Burst Data** (`BurstData`)

## 3) Configure minimum render settings

In **Render Data**:

- Assign a `Camera`.
- Assign a bullet `Texture2D`.
- Set sorting `Layer` and `Priority` if needed.

Without a valid texture, runtime updates will early-out and you will not see bullets.

## 4) Configure minimum spawn settings

In **Main**:

- `FireMode`: `Automatic` for immediate testing.
- `PlayOnEnable`: enabled.
- `FireRate`: `0.1` (10 shots/sec).
- `Lifetime`: `1.5`.
- `Speed`: `5`.

In **Spawn Shape Data**:

- `numPoints`: `1`
- `numPerSide`: `1`
- `radius`: `0`
- `spawnDir`: `Direction`

In **Burst Data**:

- `burstCount`: `1`
- `delay`: `0`

## 5) Enter Play Mode

If `FireMode` is `Automatic` and `PlayOnEnable` is true, bullets should spawn immediately.

## Manual spawn from script

If you set `FireMode` to `Manual`, call one of the spawner APIs yourself:

```csharp
using BulletFury;
using UnityEngine;

public class ManualFireExample : MonoBehaviour
{
    [SerializeField] private BulletSpawner spawner;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            // Uses a position + up vector.
            spawner.Spawn(transform.position, transform.up, Time.deltaTime);
        }
    }
}
```

Useful spawn APIs:

- `Spawn(Transform obj, float deltaTime)`
- `Spawn(Vector3 position, Vector3 up, float deltaTime)`
- `SpawnImmediate(Vector3 position, Vector3 up, float deltaTime)` (bypasses fire-rate gating)

## Runtime control helpers

`BulletSpawner` also exposes:

- `Play()` / `Stop()`
- `SetSimulationPaused(bool paused)`
- `ClearBullets()`
- `ActivateWaitingBullets()` (used with wait-style patterns)

## Troubleshooting

- No bullets visible:
  - Check `Render Data -> Texture` is assigned.
  - Check `Render Data -> Camera` is assigned.
  - Check the spawner object is active and enabled.
- Bullets do not fire in manual mode:
  - Ensure you call one of the `Spawn(...)` methods.
  - Ensure fire-rate or delay settings are not blocking your expected cadence.
- Bullets vanish immediately:
  - Increase `Main -> Lifetime`.
  - Check collision layers and collider settings.
