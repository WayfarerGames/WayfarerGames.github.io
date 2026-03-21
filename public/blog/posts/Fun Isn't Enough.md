---
title: Fun Isn't Enough: Why I Killed My Best Mechanic
date: 2026-03-21
summary: How an ugly prototype and a painful playtest taught me that a mechanic can be incredibly fun, but still be wrong for your game if it's too hard to teach.
---

# Fun Isn't Enough

Hey! Today I want to step back from code architecture and talk about game design. Specifically, how playtesting can prove a mechanic is incredibly fun...  and also that you need to delete it 😂

I’ve been working on an aggressive, *Burnout*-style racing game, and I wanted a strong mechanical hook to make it stand out from the crowd. So, I prototyped a neat bouncing mechanic.

<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bounce.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

Here is how it worked: instead of braking into corners and losing speed, you hold a button to become perfectly frictionless and bouncy, allowing you to bounce off the walls. If you let go of the button when you are closely aligned with the track's forward direction, you get a generous boost refill.

Once you figured out how it worked, it felt AMAZING. It was so much faster and gave you these insane lines through corners. 

There was a major problem though, have you spotted it?

## The Teaching Trap

This mechanic was too difficult to explain and teach.

I put together a dedicated tutorial flow that forced the player to use the mechanic on a really simple track. I put it in front of 10 to 15 people, and basically all of them completely failed. I had to physically step in and explain how to do it.

Once they finally got it, most people had a blast! But that doesn't actually matter. If your game isn't simple to understand right out of the gate, it will have a massive churn rate. Players just won't stick around long enough to find the fun.

Sometimes your game's unique selling point is the exact thing working against it. It was a bit of a gut punch to realize this. It was a genuinely fun, highly unique mechanic, but that uniqueness fought against every natural instinct players bring into a racing game (like "brake for corners" and "try not to hit the walls").

## Throwaway Code

Thankfully, I didn't lose months to this idea. 

The bounce prototype took about a week to implement fully. I knew I needed to validate it, so I didn't get attached to the code. I didn't spend a single minute on clean architecture or SOLID principles. I just threw it in as a hacky mess so I could get it into players' hands. 

> **The Lesson:** Test early and test often. If you spend three months building perfectly decoupled architecture for a mechanic that takes 10 minutes to explain, you are building a beautiful ship that will immediately sink.

Because the code was cheap, throwing it away didn't hurt. 

## The Pivot

I've got a new mechanic to replace it that is much more straightforward. If you stick behind other drivers for long enough, you gain the ability to pierce right through them, shattering them into a million pieces.

<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/pierce.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

This actually fits the aggressive vibe of the game a lot better! Drafting is something that already aligns with the way people typically play racing games, so I don't have to teach them a totally alien concept. I haven't fully playtested this specific implementation just yet—I want to make a couple more little tweaks first—but it is already miles easier to explain.

Don't get too attached to your mechanics, even the really fun ones. Build an ugly prototype, validate it early, and don't be afraid to kill your darlings if your players can't figure them out.