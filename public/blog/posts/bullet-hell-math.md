---
title: The Mathematics of Bullet Hell Patterns
date: 2026-02-18
summary: How great danmaku patterns aren't hand-placed — they're mathematical functions. A walkthrough of a single algorithm, evolved from a point on a circle into spiraling, fractal barrages.
---

# The Mathematics of Bullet Hell Patterns
Hey! As I put the finishing touches on the open source version of Bulletfury, I thought it would be fun to talk bullet spawning and maths (everyone's favourite).

> This post focuses on implementation math. For design theory I'll point you to [Sparen's Danmaku Design Guides](https://sparen.github.io/ph3tutorials/danmakudesign.html), which are excellent.

I'll let you in on a secret: it's all circles! Most of the best patterns are just different types of circles under the hood. We'll start off simple and evolve the process until it's clear how the craziest bullet hell games make their pretty patterns.

## Circles!
So let's start at the beginning: spawning bullets in a circle. When dealing with circles, we like polar coordinates - that's an angle and a radius. We'll use the number of bullets to work out the angle, and then we'll convert the polar coordinates to an x and y position so our game engine knows where to put them:

```cs
for (int i=0;i<numBullets;++i)
{
    var angle = (float)i/numBullets * 360;
    var position = (cos(angle) * radius, sin(angle) * radius);
}
```

Here's what that looks like as we increase the number of bullets:
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-points.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-points.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

Notice anything? We get useful shapes out of this, not just circles! Bullets = 3 gives us a triangle, 4 gives a square, 5 a pentagon, etc.

## Polygons!
Now let's fill in the edges. To do that, we need to create bullets between two points - so we'll take this point and the next point, and interpolate between them. Linearly. We're gonna use lerp.

```cs
// We already know the angles for our corners from the Circle step
var p1 = PolarToCartesian(angle, radius);
var p2 = PolarToCartesian(nextAngle, radius);

// Now we fill the gap between them!
for (int j = 0; j < numPerSide; j++)
{
    // Calculate how far along the line we are (from 0 to 1)
    float t = (float)j / numPerSide;
    
    // A little offset to center the bullets nicely on the line
    t += (1f / numPerSide) / 2f; 

    // Find the exact point on the edge
    var position = Vector2.Lerp(p1, p2, t);
    
    SpawnBullet(position);
}
```

Here's what that looks like as we increase the number of bullets per side:
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-edges.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-edges.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Arcs!
An extra way to add some visual interest is to limit the _arc_ of the circle. Instead of doing the hard coded 360° in, we'll swap that out for an arc that we can define from 0-360:
```cs
var angle = (i * arc / numPoints);
```
One extra bit of polish here is adding an offset, so the shape is centered:
```cs
var offset = arc / 2f - (0.5f * arc);
var angle = (i * arc / numPoints) + offset;
```
Now here's what that looks like as we increase the number of bullets per side:
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-arc.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-arc.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Movement!
Bullets should, obviously, move. We're going to keep it simple here and just set an initial direction and make the bullets move in that direction for their whole lifetime. 

We have a few options here! We can make the bullets move:

All together in the same direction - I use the `up` direction of the spawner GameObject, so you can rotate the object to aim:
```cs
Vector2 direction = spawnerTransform.up;
```
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-direction.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-direction.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

Out from the center of the shape (radial), which forms a circle over time. We can just normalize the spawn position of the bullet:
```cs
Vector2 direction = spawnPosition.normalized;
```
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-sphereized.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-sphereized.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

Perpendicular to the edges of the polygon, which keeps the shape. We get the direction at the midpoint of the edge for this:
```cs
Vector2 edgeMidpoint = Vector2.Lerp(vertexA, vertexB, 0.5f);
Vector2 direction = edgeMidpoint.normalized;
```
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-edge.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-edge.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

Along the points of the shape, which shoots bullets diagonally. To do this, we just grab the direction of the closest corner:
```cs
Vector2 direction = t < 0.5f ? vertexA : vertexB;
```
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-point.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-point.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Spirals!
This is where the fun begins. Most of the patterns you see in bullet hell games will use spirals a _lot_ - but there is no complexity here! All we do is rotate the spawned position by an angle, and change that angle over time:
```cs
// In your Update loop
currentRotation += angularSpeed * Time.deltaTime;

// Apply this rotation to the final spawn position
var finalPos = Quaternion.Euler(0, 0, currentRotation) * position;
```
And that's it!
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-spiral.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-spiral.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Randomness!
A quick note on randomness - pure random feels bad in bullet hell games. It is unpredictable and can often hurt the player experience. However, there is a fix if you want a bit of variation: bounded randomness. Instead of a radius of 3, we can pick a random number between 2 and 4. Instead of a speed of 5, we'll put the speed between 5 and 7. That will give you variation in how the bullets look and behave, which gives it a more "natural" feeling without being unfair:
<video autoplay loop muted playsinline preload="metadata">
  <source src="/blog/posts/bullet-hell-random.webm" type="video/webm">
  <source src="/blog/posts/bullet-hell-random.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

It's up to you whether you prefer the look of this or not, and it will depend entirely on the game!

## Taking it further!
This is only the beginning. In Bulletfury there are even more options, but they all start from the circular base. We've got bullet groups - which is a separate circle spawned from every point on the original circle. There are modules for making bullets rotate their direction over time, apply an extra force, change speed over time, track objects, spawn two bullets with different speeds in the same position, the list goes on, but it all starts with this.