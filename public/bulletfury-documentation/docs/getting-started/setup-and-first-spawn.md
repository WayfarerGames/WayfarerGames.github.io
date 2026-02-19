# Setup and First Spawn

Let's get you up and running! This guide will take you from zero to seeing your first bullets flying across the screen.

## 1) Install the package

First things first, add Bulletfury to your Unity project's `Packages/manifest.json`:

```json
"com.wayfarergames.bulletfury": "https://github.com/<your-org>/<your-repo>.git?path=/PackageSource/com.wayfarergames.bulletfury"
```

Just a reminder: Bulletfury needs **Unity 6+** and **URP**. It also relies on a few Unity packages like Burst and Mathematics, but those should install automatically.

## 2) Create a spawner object

Now for the fun part!

1. Create an empty `GameObject` in your scene.
2. Add the `BulletSpawner` component to it.
3. You'll see a few sections in the inspector:
   - **Render Data**: How your bullets look.
   - **Main**: Basic bullet properties like speed and lifetime.
   - **Spawn Shape Data**: Where bullets come from (circle, line, point, etc.).
   - **Burst Data**: How many bullets fire at once.

## 3) Make it visible

Before we can see anything, we need to tell Bulletfury how to draw the bullets.

In **Render Data**:
- Assign your **Main Camera**.
- Assign a **Texture2D** for your bullet sprite. (Crucial! If you don't set this, nothing will show up.)
- Set the sorting **Layer** and **Priority** if you need them to appear on top of other things.

## 4) Configure the basics

Let's set up a simple stream of bullets.

In **Main**:
- Set `FireMode` to `Automatic` so it starts firing right away.
- Check `PlayOnEnable`.
- Set `FireRate` to `0.1` (that's 10 shots per second).
- Set `Lifetime` to `1.5` seconds.
- Set `Speed` to `5`.

In **Spawn Shape Data** (let's keep it simple for now):
- `numPoints`: `1`
- `numPerSide`: `1`
- `radius`: `0`
- `spawnDir`: `Direction`

In **Burst Data**:
- `burstCount`: `1`
- `delay`: `0`

## 5) Fire!

Hit **Play Mode**. If everything is set up right, you should see a stream of bullets shooting out!

## Manual spawning

Want to control when bullets fire? Set `FireMode` to `Manual` and use a script like this:

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
            // Fire!
            spawner.Spawn(transform.position, transform.up, Time.deltaTime);
        }
    }
}
```

Here are the main methods you'll use:
- `Spawn(Transform obj, float deltaTime)`: Uses the transform's position and rotation.
- `Spawn(Vector3 position, Vector3 up, float deltaTime)`: Uses a specific position and direction.
- `SpawnImmediate(...)`: Fires instantly, ignoring the fire rate.

## Controlling the simulation

You can also control the spawner at runtime:
- `Play()` / `Stop()`: Start or stop the automatic firing.
- `SetSimulationPaused(bool paused)`: Pause all bullets in mid-air.
- `ClearBullets()`: Remove all active bullets.
- `ActivateWaitingBullets()`: Release bullets that are waiting (great for complex patterns).

## Troubleshooting

If things aren't working, check these common issues:

- **No bullets visible?**
  - Did you assign a texture in `Render Data`?
  - Is the camera assigned?
  - Is the spawner object active?

- **Bullets not firing in manual mode?**
  - Are you calling `Spawn()`?
  - Check if `FireRate` or `Delay` is preventing shots.

- **Bullets vanish immediately?**
  - Check `Lifetime` in `Main` settings.
  - Check if they're hitting something immediately (collision settings).
