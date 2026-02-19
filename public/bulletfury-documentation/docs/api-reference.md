# API Reference

This page documents the public API surface in `com.wayfarergames.bulletfury` as it exists in the package source.

It is written for developers who want exact names, expected behavior, and practical usage guidance.

## What this reference covers

- Runtime APIs you are expected to use directly (`BulletSpawner`, module interfaces, data models, events).
- Built-in free modules in `BulletFury.Modules`.
- Rendering/data types that are public and available from code.
- Advanced/low-level public types that exist but are usually engine-internal for Bulletfury operation.

## Namespaces

- `BulletFury`: spawner, modules interfaces, core config/data classes.
- `BulletFury.Data`: bullet container/event/enums used by runtime and modules.
- `BulletFury.Modules`: built-in free modules.
- `Common` and `Common.FloatOrRandom`: random/value helper types used by Bulletfury.
- `Wayfarer_Games.Common` and `Wayfarer_Games.Common.FloatOrRandom`: utility/random helper namespaces exposed by the package.

---

## BulletSpawner

`BulletSpawner` is the main entry point. It owns bullet simulation, module execution, collision checks, and render queue submission.

### Type

- `BulletFury.BulletSpawner : MonoBehaviour`

### Public properties

- `SharedRenderData RenderData` - Active render config (inline or shared ScriptableObject).
- `BulletMainData Main` - Bullet simulation settings (fire mode, speed, lifetime, collision profile, etc).
- `SpawnShapeData SpawnShapeData` - Spawn positions and initial direction generation config.
- `BurstData BurstData` - Burst sequencing and active bullet cap config.
- `float LastSimulationDeltaTime` - Last simulation step delta from runtime module.
- `int BulletCount` - Current number of active bullets.
- `bool Disposed` - Whether native buffers were disposed.
- `static SortedList<float, RenderQueueData> RenderQueue` - Global queue consumed by `BulletRenderer`.

### Public events

- `event Action<BulletContainer, bool> OnBulletDiedEvent`
  - `bool` indicates end-of-life (`true`) vs collision death (`false`).
- `event Action<int, BulletContainer> OnBulletSpawnedEvent`
  - Invoked after bullet init and module bootstrapping.
- `event Action OnWeaponFiredEvent`
  - Invoked when a spawn sequence starts.

### Public methods

- Lifecycle/control:
  - `void Start()`
  - `void OnDestroy()`
  - `void Stop()`
  - `void Play()`
  - `void SetSimulationPaused(bool paused)`
  - `void EnsureSimulationInitialized()`
  - `void ClearBullets()`
  - `void RenderBulletsNow()`
  - `void UpdateAllBullets(Camera cam, float? dt = null)`
  - `bool CheckBulletsRemaining()`
  - `void ActivateWaitingBullets()`

- Preset/state:
  - `void SetPreset(BulletSpawnerPreset preset)`
  - `SpawnerState CaptureState(SpawnerState reusableState = null)`
  - `void ApplyState(SpawnerState state)`

- Spawning:
  - `void Spawn(Vector3 position, Vector3 up, float deltaTime)`
  - `void SpawnImmediate(Vector3 position, Vector3 up, float deltaTime)`
  - `void Spawn(Transform obj, float deltaTime)`

- Module retrieval:
  - `T GetModule<T>() where T : IBaseBulletModule`
  - `bool TryGetModule<T>(out T module) where T : IBaseBulletModule`
  - `List<T> GetModulesOfType<T>() where T : IBaseBulletModule`
  - `void GetModulesOfType<T>(List<T> output) where T : IBaseBulletModule`

### Nested public types

- `BulletSpawner.RenderQueueData`
  - `BulletRenderData RenderData`
  - `Camera Camera`
  - `int Count`
  - `NativeArray<Matrix4x4> Transforms`
  - `NativeArray<float4> Colors`
  - `NativeArray<float> Times`
  - `BulletSpawner Spawner`

- `BulletSpawner.SpawnerState`
  - Snapshot payload used by `CaptureState` / `ApplyState`.
  - Includes bullet array, spawn scheduling internals, and runtime module state.

### Usage example: manual firing

```csharp
using BulletFury;
using UnityEngine;

public class PlayerGun : MonoBehaviour
{
    [SerializeField] private BulletSpawner spawner;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            // Uses this transform's current position and up direction.
            spawner.Spawn(transform.position, transform.up, Time.deltaTime);
        }
    }
}
```

### Usage example: save/load spawner simulation

```csharp
using BulletFury;
using UnityEngine;

public class SpawnerStateController : MonoBehaviour
{
    [SerializeField] private BulletSpawner spawner;
    private BulletSpawner.SpawnerState state;

    public void Save()
    {
        state = spawner.CaptureState(state);
    }

    public void Load()
    {
        if (state != null)
            spawner.ApplyState(state);
    }
}
```

### Best practices

- Call `EnsureSimulationInitialized()` before doing custom state operations early in lifecycle.
- Use `SpawnImmediate(...)` only for event-driven cases where you intentionally bypass fire-rate timing.
- Prefer `TryGetModule<T>` for optional modules; use `GetModule<T>` only when module presence is guaranteed.
- Call `ClearBullets()` when changing high-level pattern presets at runtime to avoid mixed old/new behavior.
- Use `SetSimulationPaused(true)` if you want to freeze simulation but keep rendering live.

---

## Module interfaces and contracts

These are the extension points for custom behavior.

### `IBulletHitHandler`

- Signature: `void Hit(BulletContainer bullet)`
- Implement on collider hierarchies to receive collision callbacks queued by `BulletSpawner`.

### `IBaseBulletModule`

- Marker interface for all module categories.

### `IBulletSpawnModule`

- Signature: `void Execute(ref Vector3 position, ref Quaternion rotation, float deltaTime)`
- Runs during spawn position/orientation generation, before bullet is created.

### `IBulletInitModule`

- Signature: `void Execute(ref BulletContainer container)`
- Runs once per bullet at creation.

### `IBulletModule`

- Signature: `void Execute(ref BulletContainer container, float deltaTime)`
- Runs during simulation update.

### `IParallelBulletModule`

- Marker interface that opts an `IBulletModule` into parallel execution (`Parallel.For`).
- Keep logic pure math/data only; no Unity API calls, scene access, allocations, or mutable shared state.

### `IBulletDieModule`

- Signature:
  - `CollisionBehaviour Execute(ref BulletContainer container, bool isCollision, GameObject collidingObject)`
- Enum:
  - `CollisionBehaviour.Dies`
  - `CollisionBehaviour.StaysAlive`
- Called when a bullet would die from collision or end-of-life; return `StaysAlive` to cancel death.

### Runtime module interfaces (advanced)

- `ISpawnerRuntimeModule`
  - `float LastSimulationDeltaTime { get; }`
  - `void OnRuntimeReset(Squirrel3 random)`
  - `void OnSimulationStep(float deltaTime)`
  - `float Sample(FloatOrRandom value, Squirrel3 random)`
  - `object CaptureState()`
  - `void RestoreState(object state)`

- `ISpawnerRuntimeModuleProvider : IBaseBulletModule`
  - `ISpawnerRuntimeModule CreateRuntimeModule()`

Use runtime modules when you need custom deterministic value sampling/state progression for spawner-level behavior.

### Custom module template

```csharp
using System;
using BulletFury;
using BulletFury.Data;
using UnityEngine;

namespace MyGame.Modules
{
    [Serializable]
    [ModuleDescription("Adds a constant lateral drift.")]
    [ModulePerformanceImpact(ModulePerformanceImpactRating.Low)]
    public class SideDriftModule : IBulletModule, IParallelBulletModule
    {
        [SerializeField] private float drift = 1f;

        public void Execute(ref BulletContainer container, float deltaTime)
        {
            container.Position += container.Right * drift * deltaTime;
        }
    }
}
```

---

## Core configuration types

### `BulletMainData`

- `FireMode FireMode` (`Automatic`, `Manual`)
- `bool PlayOnEnable`
- `FloatOrRandom FireRate`
- `FloatOrRandom Damage`
- `FloatOrRandom Lifetime`
- `FloatOrRandom Speed`
- `Color StartColor`
- `FloatOrRandom StartSize`
- `bool UseRotationForDirection`
- `bool MoveWithTransform`
- `bool RotateWithTransform`
- `ColliderType ColliderType` (`Circle`, `Capsule`)
- `float ColliderSize` (0..1)
- `float CapsuleLength` (0..1)

### `SpawnShapeData`

- `SpawnDir spawnDir`
- `int numPoints`
- `int numPerSide`
- `int numPerGroup`
- `FloatOrRandom groupRadius`
- `bool spawnCentreBullet`
- `bool groupDirection`
- `float removeFromEdgePercent`
- `FloatOrRandom radius`
- `FloatOrRandom arc`
- `bool randomise`
- `bool onEdge`
- `FloatOrRandom directionArc`
- `void Spawn(Action<Vector2, Vector2> onGetPoint, Squirrel3 rnd)`

`Spawn(...)` computes all spawn positions and direction vectors based on shape/arc/group settings and invokes callback per spawn point.

### `BurstData`

- `float delay`
- `int maxActiveBullets` (`0` = uncapped, internally clamped by spawner storage capacity)
- `int burstCount`
- `float burstDelay`
- `float stackSpeedIncrease`
- `bool burstsUpdatePositionEveryBullet`

### `BulletSpawnerPreset : ScriptableObject`

- `bool UseMain`
- `BulletMainData Main`
- `bool UseShape`
- `SpawnShapeData ShapeData`
- `bool UseBurstData`
- `BurstData BurstData`
- `bool UseModules`
- `List<IBaseBulletModule> BulletModules`

Apply at runtime with `BulletSpawner.SetPreset(...)`.

---

## Bullet data model (`BulletFury.Data`)

### `BulletContainer` fields

- Identity:
  - `int Id`

- Transform and orientation:
  - `float3 Position`
  - `Quaternion Rotation`
  - `Quaternion Direction`
  - `float3 Forward`
  - `float3 Right`
  - `float3 Up`

- Visual:
  - `Color Color`
  - `Color StartColor`
  - `float StartSize`
  - `float CurrentSize`

- Collision:
  - `float ColliderSize`
  - `byte UseCapsule`
  - `float CapsuleLength`
  - `byte Collided`

- Lifetime/state:
  - `float Lifetime`
  - `float CurrentLifeSeconds`
  - `float CurrentLifePercent`
  - `byte Dead`
  - `byte EndOfLife`
  - `byte Waiting`
  - `float TimeToWait`

- Movement and gameplay:
  - `float Speed`
  - `float CurrentSpeed`
  - `float3 Velocity`
  - `float3 Force`
  - `float AngularVelocity`
  - `float Damage`

- Move-to-origin behavior:
  - `byte MovingToOrigin`
  - `float3 OriginPosition`
  - `float MoveToOriginTime`
  - `float MoveToOriginCurrentTime`
  - `float3 MoveToOriginStartPosition`

- Method:
  - `void InitWithPositionRotationDirection(float3 position, Quaternion rotation, Quaternion direction)`

### Data enums

- `SpawnDir`: `Shape`, `Randomised`, `Spherised`, `Direction`, `Point`
- `ForceSpace`: `Local`, `World`
- `CurveUsage`: `Lifetime`, `LoopedTime`

### Event types

- `BulletSpawnedEvent : UnityEvent<int, BulletContainer>`
- `BulletDiedEvent : UnityEvent<int, BulletContainer, bool>`
- `BulletCancelledEvent : UnityEvent<int, BulletContainer, bool>`
- `BulletCollisionEvent : UnityEvent<BulletContainer, Transform>`

---

## Rendering and shared render data

### `BulletRenderData`

Public fields:
- `Camera Camera`
- `Texture2D Texture`
- `bool Animated`
- `int Rows`
- `int Columns`
- `float PerFrameLength`
- `int Layer`
- `int Priority`

Public members:
- `Material Material { get; }`
- `static void ResetMaterials()`
- `Material GetMaterial()`
- `void ReturnMaterial(Material material)`
- `void DisposeMaterials()`

### `SharedRenderData`

- `BulletRenderData Data { get; }`
- `SharedRenderDataSO SharedDataSO { get; }` (editor-only)
- Implicit conversions:
  - `SharedRenderData -> BulletRenderData`
  - `BulletRenderData -> SharedRenderData`
  - `SharedRenderDataSO -> SharedRenderData`

### `SharedRenderDataSO : ScriptableObject`

- `void SetData(BulletRenderData data)`
- Implicit conversion:
  - `SharedRenderDataSO -> BulletRenderData`

### `BulletRenderer` (advanced static renderer API)

- `Mesh Mesh { get; }`
- `static void Init()`
- `static void Dispose()`
- `static void Render(BulletRenderData data, NativeArray<Matrix4x4> transforms, NativeArray<float4> colors, NativeArray<float> times, int numBullets, Camera cam)`

Most users should not call `BulletRenderer.Render(...)` manually. Use `BulletSpawner` unless building a custom render path.

---

## Built-in free modules (`BulletFury.Modules`)

### `AngularVelocityModule : BulletModule, IParallelBulletModule`

- Purpose: rotates bullet orientation over time.
- Serialized fields:
  - `AnimationCurve angularVelocity`
  - `float scale`

### `BulletColorOverTimeModule : BulletModule`

- Purpose: applies gradient over life or looped time.
- Fields:
  - `Gradient colorOverTime`

### `BulletDamageOverTimeModule : IBulletModule, IParallelBulletModule`

- Purpose: scales `BulletContainer.Damage`.
- Fields:
  - `AnimationCurve damageOverTime`

### `BulletSizeOverTimeModule : BulletModule, IParallelBulletModule`

- Purpose: scales size over time.
- Fields:
  - `AnimationCurve sizeOverTime`

### `SpeedOverTimeModule : BulletModule, IParallelBulletModule`

- Purpose: scales current speed over time.
- Serialized fields:
  - `AnimationCurve speedOverTime`
  - `float scale`

### `SpawnerRotateModule : IBulletSpawnModule`

- Purpose: continuously rotates spawn basis at emit time.
- Serialized fields:
  - `float angularSpeed`
- Public property:
  - `float CurrentAngle { get; }`

### `WaitToContinueModule : IBulletInitModule`

- Purpose: mark bullets as waiting after a configured pre-wait simulation time.
- Serialized fields:
  - `float timeToPlayBeforeWaiting`
- Works with `BulletSpawner.ActivateWaitingBullets()`.

---

## Premium add-on modules (`BulletFury.Modules`)

These types are in the premium package (`Bulletfury.Premium`) and are not part of the free module set.

### `AimedShotModule : IBulletSpawnModule`

- Re-aims spawn rotation toward a target before emission.
- Supports multiple aim modes via `AimType`: `Instant`, `Linear`, `Slerp`, `SmoothDamp`, `Predicted`.
- Public method:
  - `void SetTarget(Transform newTarget)`

### `TrackObjectModule : BulletModule`

- Continuously steers active bullets toward a tracked transform over lifetime.
- Public properties:
  - `Transform ToTrack { get; }`
  - `float TurnSpeed { get; }`

### `BulletBounceModule : IBulletDieModule`

- Intercepts collision death and reflects bullet direction/velocity for ricochet behavior.
- Can filter by collider tag and scale speed/lifetime per bounce.

### `ForceOverTimeModule : BulletModule, IParallelBulletModule`

- Applies curve-driven forces over bullet lifetime.
- Key options:
  - `ForceSpace space` (`Local`/`World`)
  - `Vector3 scale`
  - `AnimationCurve forceOverTimeX/Y/Z`

### `SinWaveOffsetModule : BulletModule, IParallelBulletModule`

- Adds sinusoidal lateral offset to bullet trajectory over time.
- Key controls include amplitude, frequency, phase offset, direction invert, and amplitude curve.

### `SpawnFromTransformModule : IBulletInitModule`

- Spawns bullets from a referenced transform and interpolates toward original spawn position.

### `SubSpawnerModule : IBulletDieModule`

- Emits configured sub-spawners on collision and/or end-of-life events.
- Uses `SubSpawnerData[]` payload configuration.

### `ReplayModule : IBaseBulletModule`

- Records `BulletSpawner.SpawnerState` snapshots over time for playback/rewind flows.
- Key methods:
  - `void RecordStep(BulletSpawner spawner, float deltaTime)`
  - `void ResetTimeline()`
  - `void PrepareForRewind(BulletSpawner spawner)`
  - `void TrimFutureSteps()`
  - `bool TryRewindBySeconds(float rewindSeconds, out float actualSecondsRewound)`
  - `bool TryGetAppliedState(out BulletSpawner.SpawnerState state)`

### `RewindModule : IBaseBulletModule`

- Applies rewind playback against a `ReplayModule` timeline.
- Key methods:
  - `void BeginRewind()`
  - `void EndRewind()`
  - `bool Rewind(BulletSpawner spawner, ReplayModule replayModule, float deltaTime)`

### `DeterministicRuntimeModule : ISpawnerRuntimeModuleProvider, ISpawnerRuntimeModule, IBulletInitModule`

- Installs deterministic random sampling/tick stepping into spawner runtime.
- Public members:
  - `ulong Tick { get; }`
  - `float LastSimulationDeltaTime { get; }`
  - `ISpawnerRuntimeModule CreateRuntimeModule()`
  - `void OnRuntimeReset(Squirrel3 random)`
  - `void OnSimulationStep(float deltaTime)`
  - `float Sample(FloatOrRandom value, Squirrel3 random)`
  - `object CaptureState()`
  - `void RestoreState(object state)`
  - `void Execute(ref BulletContainer container)`

### `SubSpawnerData` (premium data model)

- `bool emitOnCollide`
- `bool emitOnLifeEnd`
- `bool inheritRotation`
- `bool inheritColor`
- `BulletSpawner spawner`

---

## Attributes and metadata

### `ModulePerformanceImpactRating`

- `Low`, `Medium`, `High`, `VeryHigh`

### `ModulePerformanceImpactAttribute`

- Constructors:
  - `ModulePerformanceImpactAttribute(ModulePerformanceImpactRating rating)`
  - `ModulePerformanceImpactAttribute(ModulePerformanceImpactRating rating, string justification)`
- Properties:
  - `ModulePerformanceImpactRating Rating { get; }`
  - `string Justification { get; }`

### `ModuleDescriptionAttribute`

- Constructor:
  - `ModuleDescriptionAttribute(string description)`
- Property:
  - `string Description { get; }`

Use these on custom modules to improve inspector discoverability and team readability.

---

## Common/random utility APIs

These are public in the package and often useful in custom runtime/module code.

### `Common.FloatOrRandom.FloatOrRandom`

- `float Value { get; }`
- `float GetValue(Squirrel3 rnd)`
- Implicit conversion:
  - `FloatOrRandom -> float`
  - `float -> FloatOrRandom`

### `Wayfarer_Games.Common.FloatOrRandom.IntOrRandom`

- `int Value { get; }`
- `int GetValue(Squirrel3 rnd)`
- Implicit conversion:
  - `IntOrRandom -> int`
  - `int -> IntOrRandom`

### `Common.Squirrel3`

- Constructors:
  - `Squirrel3()`
  - `Squirrel3(int seed)`
- Static:
  - `Squirrel3 Instance`
- State:
  - `readonly struct State`
  - `void SetSeed(int seed)`
  - `void ResetState()`
  - `State CaptureState()`
  - `void RestoreState(State state)`
- Sampling:
  - `float Next()`
  - `double NextDouble()`
  - `Vector2 RandomPointInUnitCircle()`
  - `float Range(float min, float max)`
  - `double Range(double min, double max)`
  - `int Range(int min, int max)`
  - `bool Bool()`
  - `bool Bool(float chance)`
  - `bool Bool(double chance)`
- Selection:
  - `T WeightedRandom<T>(Dictionary<T, float> items) where T : class`
  - `T WeightedRandom<T>(List<T> items) where T : class, IWeightedItem`
  - `T GetRandomElement<T>(IEnumerable<T> list, out int idx)`

### `Common.IWeightedItem`

- `float Weight { get; }`

### `Wayfarer_Games.Common.QuaternionUtil`

- `Quaternion AngVelToDeriv(Quaternion current, Vector3 angVel)`
- `Vector3 DerivToAngVel(Quaternion current, Quaternion deriv)`
- `Quaternion IntegrateRotation(Quaternion rotation, Vector3 angularVelocity, float deltaTime)`
- `Quaternion SmoothDamp(Quaternion rot, Quaternion target, ref Quaternion deriv, float time, float deltaTime)`

---

## Low-level/advanced public types

### `BulletJob : IJobParallelFor`

`BulletJob` is public, but primarily intended for internal scheduling from `BulletSpawner`.

Public fields include bullet arrays, render output arrays, transform deltas, collision sizing, and feature toggles (`UseRotationForDirection`, `MoveWithTransform`, `RotateWithTransform`).

Public method:
- `void Execute(int index)`

Unless you are building a custom simulation runner, use `BulletSpawner.UpdateAllBullets(...)` rather than scheduling `BulletJob` yourself.

---

## Best practices and pitfalls

- Keep module logic deterministic and side-effect free where possible.
- For `IParallelBulletModule`, do not call Unity object APIs (`Transform`, scene queries, physics, object creation/destruction).
- Treat `BulletContainer` as mutable state for the current step only; initialize all values you depend on.
- Use `TryGetModule<T>` and null checks in gameplay code that supports optional module loadouts.
- Keep `maxActiveBullets` tuned; uncapped (`0`) can still hit internal limits depending on spawner capacity.
- Prefer circle colliders for throughput; capsule colliders are heavier.
- If using `CaptureState/ApplyState`, keep module composition stable between save/load to avoid semantic mismatches.

## Recommended testing checklist

- Verify `FireMode.Automatic` and `FireMode.Manual` behaviors independently.
- Validate module behavior with and without `IParallelBulletModule`.
- Test collision and end-of-life death paths separately (including custom `IBulletDieModule` cancellation).
- Test pause/resume (`SetSimulationPaused`) and waiting bullets (`ActivateWaitingBullets`).
- If you rely on replay/state restore, test deterministic capture/restore over multiple seconds under varying frame rates.
