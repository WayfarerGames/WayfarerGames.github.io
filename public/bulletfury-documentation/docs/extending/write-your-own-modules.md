# Write Your Own Modules

Custom modules are plain serializable C# classes that implement Bulletfury module interfaces.

## Can Free recreate Pro-style features?

Yes. The same public module interfaces let you implement advanced behavior yourself.  
Pro packages common advanced features as ready-made modules, but the module API is open in Free.

See `Extending -> Free vs Pro Comparison` for a capability-by-capability view.

## How modules are discovered

The editor add-module picker finds all non-abstract classes derived from `IBaseBulletModule` that:

- are not `UnityEngine.Object` types
- are constructible with a parameterless constructor

That means your custom module should be:

- `[Serializable]`
- a class (not abstract)
- default-constructible

## Choose the right interface

- `IBulletSpawnModule`: alter spawn position/rotation before bullet exists.
- `IBulletInitModule`: initialize bullet fields once at spawn.
- `IBulletModule`: run each simulation step.
- `IParallelBulletModule`: add to your `IBulletModule` when thread-safe.
- `IBulletDieModule`: customize collision/end-of-life behavior.
- `ISpawnerRuntimeModuleProvider`: override sampling/runtime behavior.

## Example 1: simple per-frame bullet drift

```csharp
using System;
using BulletFury;
using BulletFury.Data;
using UnityEngine;

namespace MyGame.BulletModules
{
    [Serializable]
    public class SideDriftModule : IBulletModule, IParallelBulletModule
    {
        [SerializeField] private float driftSpeed = 1f;

        public void Execute(ref BulletContainer container, float deltaTime)
        {
            // Move along local right vector over time.
            container.Position += container.Right * driftSpeed * deltaTime;
        }
    }
}
```

## Example 2: custom spawn offset

```csharp
using System;
using BulletFury;
using UnityEngine;

namespace MyGame.BulletModules
{
    [Serializable]
    public class SpawnOffsetModule : IBulletSpawnModule
    {
        [SerializeField] private Vector3 localOffset = new Vector3(0.5f, 0f, 0f);

        public void Execute(ref Vector3 position, ref Quaternion rotation, float deltaTime)
        {
            position += localOffset;
        }
    }
}
```

## Example 3: override death-on-collision

```csharp
using System;
using BulletFury;
using BulletFury.Data;
using UnityEngine;

namespace MyGame.BulletModules
{
    [Serializable]
    public class IgnoreTriggerDeathModule : IBulletDieModule
    {
        public IBulletDieModule.CollisionBehaviour Execute(
            ref BulletContainer container,
            bool isCollision,
            GameObject collidingObject)
        {
            if (!isCollision || collidingObject == null)
                return IBulletDieModule.CollisionBehaviour.Dies;

            return collidingObject.CompareTag("TriggerOnly")
                ? IBulletDieModule.CollisionBehaviour.StaysAlive
                : IBulletDieModule.CollisionBehaviour.Dies;
        }
    }
}
```

## Recommended metadata attributes

These improve discoverability in the inspector:

- `ModuleDescriptionAttribute("...")`
- `ModulePerformanceImpactAttribute(ModulePerformanceImpactRating.Low | Medium | High | VeryHigh, "...")`

Example:

```csharp
[ModuleDescription("Apply sideways drift over time.")]
[ModulePerformanceImpact(ModulePerformanceImpactRating.Low)]
public class SideDriftModule : IBulletModule, IParallelBulletModule
{
    // ...
}
```

## Thread safety rules for `IParallelBulletModule`

When implementing `IParallelBulletModule`:

- Do not call Unity scene APIs (`FindObjectOfType`, `Physics2D`, `Transform`, etc.).
- Do not mutate shared static/global state.
- Only read/write the passed `BulletContainer` and immutable module fields.
- Keep logic deterministic and stateless where possible.

If your module needs Unity API calls, implement `IBulletModule` only (main-thread execution path).

## Accessing modules from gameplay code

Use `BulletSpawner` helpers:

- `TryGetModule<T>(out T module)`
- `GetModule<T>()`
- `GetModulesOfType<T>()`

```csharp
if (spawner.TryGetModule<SideDriftModule>(out var drift))
{
    // Use module reference to tweak settings at runtime if desired.
}
```
