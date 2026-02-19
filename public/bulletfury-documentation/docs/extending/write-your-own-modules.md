# Write Your Own Modules

So you want to go beyond the basics? Awesome! Bulletfury is designed to be extended, and writing your own modules is surprisingly easy.

## How it works

Custom modules are just C# classes. You don't need to inherit from `MonoBehaviour`—just implement one of the module interfaces, and Bulletfury will pick it up automatically.

### The Rules
For your module to show up in the Inspector, it must be:
1. `[Serializable]`
2. A normal `class` (not abstract)
3. Have a default constructor (which C# gives you for free usually)

## Choose your weapon (Interface)

- **`IBulletSpawnModule`**: Run this *before* a bullet is born. Good for changing where it spawns.
- **`IBulletInitModule`**: Run this *once* when a bullet is born. Good for setting initial stats.
- **`IBulletModule`**: Run this *every frame*. This is where the magic happens (movement, color, etc.).
- **`IBulletDieModule`**: Run this when a bullet hits something. Want bouncing bullets? This is the place.

## Example 1: Making bullets drift sideways

Let's make a module that pushes bullets to the right over time.

```csharp
using System;
using BulletFury;
using BulletFury.Data;
using UnityEngine;

namespace MyGame.BulletModules
{
    [Serializable]
    // We implement IParallelBulletModule to say "this is safe to run on multiple threads!"
    public class SideDriftModule : IBulletModule, IParallelBulletModule
    {
        [SerializeField] private float driftSpeed = 1f;

        public void Execute(ref BulletContainer container, float deltaTime)
        {
            // Move along the bullet's local right vector
            container.Position += container.Right * driftSpeed * deltaTime;
        }
    }
}
```

## Example 2: Custom spawn offset

Want to shift the spawn point a bit?

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

## Example 3: Ignoring certain colliders

By default, bullets die when they hit anything. Let's change that!

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
            // If we hit a "TriggerOnly" object, stay alive!
            if (isCollision && collidingObject != null && collidingObject.CompareTag("TriggerOnly"))
            {
                return IBulletDieModule.CollisionBehaviour.StaysAlive;
            }

            // Otherwise, die as usual
            return IBulletDieModule.CollisionBehaviour.Dies;
        }
    }
}
```

## Make it pretty in the Inspector

You can add descriptions and performance warnings to help your team:

```csharp
[ModuleDescription("Makes bullets drift sideways.")]
[ModulePerformanceImpact(ModulePerformanceImpactRating.Low)]
public class SideDriftModule : ...
```

## A note on performance (Parallel vs Main Thread)

If you implement `IParallelBulletModule`, your code will run on worker threads. This is **much faster**, but it has rules:
- **Don't** touch Unity APIs (like `transform`, `GameObject.Find`, `Physics`).
- **Don't** change global variables.
- **Do** stick to math and the `BulletContainer` data.

If you *need* to touch Unity stuff, just implement `IBulletModule` (without `IParallel...`) and it will run safely on the main thread.

## Controlling modules from code

You can grab your modules at runtime to tweak them:

```csharp
if (spawner.TryGetModule<SideDriftModule>(out var drift))
{
    drift.driftSpeed = 5f; // Turbo drift!
}
```
