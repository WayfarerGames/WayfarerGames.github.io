# Free vs Pro Comparison

Both Free and Pro use the same core `BulletSpawner` and module architecture.

## Important: you can build Pro-style behavior yourself

Pro includes ready-to-use modules for advanced workflows.  
In Free, you can still implement those behaviors yourself via the public modules API:

- `IBulletSpawnModule`
- `IBulletInitModule`
- `IBulletModule` / `IParallelBulletModule`
- `IBulletDieModule`
- `ISpawnerRuntimeModuleProvider`

That means Pro is primarily about speed and convenience (prebuilt modules), not a locked runtime.

## Capability comparison

| Capability | Free | Pro |
|---|---|---|
| Core spawning/rendering pipeline | Included | Included |
| Free built-in modules (speed/size/color/damage over time, rotate spawn, wait) | Included | Included |
| Tracking/homing behaviors | Build with custom modules | Included as prebuilt module |
| Force-over-time style motion controls | Build with custom modules | Included as prebuilt module |
| Bounce/reflect on collision | Build with custom die/collision modules | Included as prebuilt module |
| Sub-spawner chaining (spawn on hit/death) | Build with custom module logic | Included as prebuilt module |
| Replay/rewind workflows | Build with custom runtime module/state tooling | Included as prebuilt modules |
| Deterministic runtime helpers | Build with custom runtime module provider | Included as prebuilt module |
| Setup speed for advanced features | More engineering time | Faster out of the box |

## Which should you choose?

- Choose **Free** if you want maximum control and do not mind implementing advanced behavior.
- Choose **Pro** if you want those advanced systems shipped as production-ready modules immediately.

## Paid version

- Asset Store page: https://prf.hn/click/camref:1101lwk2s/destination:https://assetstore.unity.com/
