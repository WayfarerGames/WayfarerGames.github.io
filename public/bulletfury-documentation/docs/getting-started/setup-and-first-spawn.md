# Setup and First Spawn

Let's get you up and running! This guide will take you from zero to seeing your first bullets flying across the screen.

## 1) Install the package

First things first, let's get Bulletfury into your project. You can add the Git URL directly through the Unity Package Manager:

1. Open the Package Manager (**Window > Package Manager**).
2. Click the `+` button in the top left and select **Add package from git URL...**
3. Enter the URL for the Bulletfury repository: `https://github.com/WayfarerGames/bulletfury.git`
4. Click **Add**.

Just a reminder: Bulletfury needs **Unity 6+** and **URP**. It also relies on a few Unity packages like Burst and Mathematics, but those should install automatically.

## 2) Import the Sample Scene

Before building your own spawner, the best way to understand Bulletfury is to look at the included examples!

1. Open the Package Manager (**Window > Package Manager**).
2. Find **Bulletfury** in the list of installed packages (make sure you're looking at "Packages: In Project").
3. Go to the **Samples** tab.
4. Click **Import** next to the `Demo Scene`.
5. Open the newly imported scene (usually under `Assets/Samples/Bulletfury/`) and press Play to see it in action!

## 3) Create a spawner object

Now for the fun part!

1. Create an empty `GameObject` in your scene.
2. Add the `BulletSpawner` component to it.
3. You'll see a few sections in the inspector:
   - **RenderData**: How your bullets look.
   - **Bullet Settings**: Basic bullet properties like speed and lifetime.
   - **Spawn Shape Data**: Where bullets come from (circle, line, point, etc.).
   - **Burst Data**: How many bullets fire at once.

## 4) Make it visible

Before we can see anything, we need to tell Bulletfury how to draw the bullets.

In **RenderData**:

- Assign your **Main Camera**.
- Assign a **Texture2D** for your bullet sprite. (Crucial! If you don't set this, nothing will show up.)
- Set the sorting **Layer** and **Priority** if you need them to appear on top of other things.

> **Note:** In the Inspector's RenderData section, you'll see a green
> circle in the bullet preview. This green circle shows the size of the
> bullet's collision area relative to the bullet sprite itself.
> Bulletfury collisions work natively with Unity's 2D colliders.

## 5) Configure the basics

Let's set up a simple stream of bullets.

In **Bullet Settings**:

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

> **What does `spawnDir` do?**
> This setting controls the initial direction your bullets will travel:
>
> - **`Direction`**: Bullets fly straight up (relative to the spawner's rotation).
> - **`Spherised`**: Bullets fly directly outward from the center point.
> - **`Shape`**: Bullets fly perpendicular to the edge of the shape they spawned on.
> - **`Point`**: Bullets fly outward towards the closest corner/point of the shape.
> - **`Randomised`**: Bullets fly in a random direction within the defined `directionArc`.

In **Burst Data**:

- `burstCount`: `1`
- `delay`: `0`

## 6) Fire

Hit **Play Mode**. If everything is set up right, you should see a stream of bullets shooting out!

**Scene View Tool:** For rapid iteration without entering Play Mode, check the bottom left of your Scene window when the spawner is selected. You'll find a little widget to **play, pause, and stop** the selected spawner. This widget also displays the **current and maximum bullet count**, which is incredibly useful for testing performance and tuning density.

## Exploring Modules

You might be wondering where settings like "acceleration", "homing", or
"color changes" are. In Bulletfury, a lot of behavior is intentionally
"hidden" behind **Modules**. Instead of one massive inspector with a
hundred settings you aren't using, you snap on only the behaviors you need.

We highly encourage you to check out the [**Free Modules**](../modules/free-modules.md) page and experiment with adding them to your spawner to see what they do!

## Advanced Spawn Settings

While the basics will get you started, the **Spawn Shape Data** has a lot of hidden power for making complex patterns without any extra modules:

- **`arc`**: Only spawn bullets along a specific angle (e.g. 180 for a half-circle).
- **`randomise` / `onEdge`**: Places bullets randomly within the shape or strictly on its outline.
- **Grouping (`numPerGroup`, `groupRadius`, `groupDirection`)**: Instead of single bullets, spawn them in clusters! Great for making thick walls of bullets.
- **`removeFromEdgePercent`**: Creates gaps at the corners of your shapes.

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
  - Did you assign a texture in `RenderData`?
  - Is the spawner object active?

- **Bullets not firing in manual mode?**
  - Are you calling `Spawn()`?
  - Check if `FireRate` or `Delay` is preventing shots.

- **Bullets vanish immediately?**
  - Check `Lifetime` in `Bullet Settings`.
  - Check if they're hitting something immediately (collision settings).
