---
title: The Architecture of Shmup Enemy Spawning
date: 2026-02-25
summary: How to stop hardcoding your level waves and start building data-driven enemy spawns using the Command Pattern and SOLID principles.
---
# The Architecture of Shmup Enemy Spawning

Hey! Since we've already covered the math behind firing beautiful geometric bullet patterns, I thought it would be fun to tackle the other side of the shoot 'em up equation: the enemies firing them.

> This post focuses on the software architecture of building levels. For actual wave pacing and enemy placement theory, I highly recommend checking out [Boghog's Shmup Workshop](https://youtu.be/RENI2gk0ZJA?si=PNe3QkoFeO2gRlbH)



I'll let you in on a secret: hardcoding your enemy spawns in your game loop is a trap. If your update loop is full of timers and nested `if` statements, making a full, five-minute level is going to be an absolute nightmare. We need a way to cleanly sequence exactly what happens and when.



Enter the Command Pattern!



## Timers!



Let's start by looking at what we want to avoid. When you first start building a level, it's really tempting to just count the seconds and spawn enemies based on the current time:



```cs
private float levelTimer = 0f;
private bool waveOneSpawned = false;
private bool waveTwoSpawned = false;

void Update()
{
    levelTimer += Time.deltaTime;

    if (levelTimer >= 2.0f && !waveOneSpawned)
    {
        SpawnEnemy(enemyPrefabA, new Vector2(5, 10));
        waveOneSpawned = true;
    }

    if (levelTimer >= 5.5f && !waveTwoSpawned)
    {
        SpawnEnemy(enemyPrefabB, new Vector2(-5, 10));
        waveTwoSpawned = true;
    }
}
```

Notice the problem? For a typical shmup level, you might have hundreds of spawns. This script will turn into an absolute monster, and tuning the timing of an early wave means manually tweaking all the numbers for the rest of the level. It's rigid, creates bugs, and hurts to read.



## Commands!



Instead of writing the logic out procedurally, let's turn "Spawning an Enemy" into an object. We want to decouple _what_ happens from _when_ it happens.



However, we don't just want fire-and-forget commands. What if we want a command that pauses the level until the screen is clear of enemies? If we use a basic loop, we'll immediately hit a wall. To pause the game's timeline, a command needs a way to tell the queue: _"I'm not done yet!"_



We also want to make sure this code is incredibly clean and performant. In Unity, the rookie mistake is to use `FindObjectsOfType<Enemy>()` to check if the screen is clear. That is intensely slow and creates garbage collection spikes.



Instead, we are going to design our architecture using SOLID principles so everything is fast, decoupled, and easy to extend.



## Context!



First, our commands shouldn't depend on a monolithic `LevelManager` script. That breaks the Dependency Inversion Principle. Commands should depend on abstractions (interfaces).



Let's create an interface that holds references to all the systems our commands might need to interact with:



```cs
public interface IEnemyTracker
{
    int ActiveEnemyCount { get; }
}

public interface ILevelContext
{
    IEnemyTracker EnemyTracker { get; }
    // We could add IAudioService, IScoreManager, etc. here later

}
```

Now, instead of Unity's slow methods, our actual game logic will just maintain a simple integer counter of enemies. An `EnemySpawner` increments it, and an `Enemy`'s OnDestroy event decrements it. Checking if the screen is clear is now a lightning-fast `O(1)` integer check!


## Wait For It...



Next, let's look at our command structure. Every command needs to be executable, and every command needs to report if it is finished:



```cs
public interface ILevelCommand
{
    float Timestamp { get; }

    // We pass our decoupled context here
    void Execute(ILevelContext context);

    // Allows commands to block the queue from progressing
    bool IsComplete { get; }
}
```



For standard, fire-and-forget commands (like spawning an enemy), `IsComplete` will just return `true`. They finish instantly.



But here is our `WaitUntilClearCommand`. Its single responsibility is to capture the enemy tracker when executed, and then constantly report its completion status based on that tracker.



```cs

public class WaitUntilClearCommand : ILevelCommand
{
    public float Timestamp { get; }

    // We store a reference to the tracker once executed
    private IEnemyTracker tracker;

    public WaitUntilClearCommand(float timestamp)
    {
        Timestamp = timestamp;
    }

    public void Execute(ILevelContext context)
    {
        tracker = context.EnemyTracker;
    }

    public bool IsComplete => tracker != null && tracker.ActiveEnemyCount == 0;
}
```



Look at how clean that is! It knows nothing about Unity, nothing about prefabs, and nothing about timers. It just asks the tracker for the count.



## The Upgraded Queue!



Finally, let's look at how our main game loop handles this. We need to introduce the concept of an `activeBlockingCommand`.



If a command blocks, we stop pulling from the queue and we _pause the timer_.



```cs

public class LevelTimeline : MonoBehaviour
{
    private Queue<ILevelCommand> commandQueue;
    private ILevelContext context;
    private float levelTimer = 0f;

    // Stores any command that takes time to complete
    private ILevelCommand activeBlockingCommand = null;

    void Update()
    {
        // 1. If we are blocked, wait until the command finishes
        if (activeBlockingCommand != null)
        {
            if (activeBlockingCommand.IsComplete)
            {
                // Unblock
                activeBlockingCommand = null;
            }
            else
            {
                // Still waiting? Stop doing level updates.
                return;
            }
        }

        // 2. We only advance time if we aren't blocked
        levelTimer += Time.deltaTime;

        // 3. Process new commands
        while (
            commandQueue.Count > 0 &&
            commandQueue.Peek().Timestamp <= levelTimer
        )
        {
            ILevelCommand nextCommand = commandQueue.Dequeue();
            nextCommand.Execute(context);

            // If this command isn't instantly finished, it blocks the queue!
            if (!nextCommand.IsComplete)
            {
                activeBlockingCommand = nextCommand;
                break; // Exit the while loop early
            }
        }
    }
}
```



Because we followed the Open/Closed Principle, our `LevelTimeline` code is completely closed for modification. We never have to touch this `Update` loop again to add new features! Want to wait for 5 seconds? Add a `WaitTimeCommand`. Want to wait until the boss reaches half health? Add a `WaitForBossPhaseCommand`!



## Data!



This is where the magic really happens. Because our commands are just objects holding data (a time, a prefab, a position), we no longer have to define our levels in code.



We can move our level design completely out of C#. You could write your levels in a JSON file, a CSV spreadsheet, or `ScriptableObjects`. Here is what a level might look like when serialized to JSON:



```json
[
  {
    "type": "SpawnEnemy",
    "timestamp": 2.0,
    "enemyId": "Fighter",
    "position": { "x": 5.0, "y": 10.0 }
  },
  {
    "type": "WaitUntilClear",
    "timestamp": 2.5
  },
  {
    "type": "SpawnEnemy",
    "timestamp": 3.0,
    "enemyId": "HeavyBomber",
    "position": { "x": 0.0, "y": 12.0 }
  }
]
```
> N.b. if you're in Unity, you'll want to use something like Newtonsoft JSON to help with this


Now you can tweak timings, add complex waiting logic, and build entire new waves without ever recompiling your game. This opens the door to player-created levels, too, which is even cooler.



## Taking it further!



This architecture is the foundation of a modern shmup engine. Our engine is completely separated: the timeline handles the flow of time, the commands handle the instructions, and the context handles the game state.



Once you have a timeline of commands running your game data like this, the next natural step is building a visual tool. Instead of typing out JSON, you can build a timeline editor (like Unity's Timeline or a custom visual graph) where you can literally drag and drop spawns and wait commands exactly where you want them. But it all starts with this clean, decoupled queue!