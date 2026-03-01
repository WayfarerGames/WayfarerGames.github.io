---
title: Your Brain Hates You
date: 2026-03-01
summary: Why your brain actively works against finishing your game and how to design a your environment to overcome common dopamine traps.
---
# Your Brain Hates You

Hey! Today, instead of systems and tech stuff, I want to step back and talk about the hardest thing to debug: your own brain.

I'll let you in on a secret: your brain often works against finishing. This isn’t a moral failing or a lack of discipline. It is just predictable human behaviour given uncertainty and long timelines. Common symptoms include doomscrolling, endless code refactoring, announcing features you haven't built, and writing massive design docs that never ship.

By the end of this post, you’ll understand the forces causing it, and you'll have a concrete checklist to turn "I should work on my game" into a repeatable shipping loop.

## The Problem

Saying your brain "hates" you is a bit dramatic. The truth is, your brain loves you! It is an ancient survival machine designed to keep you alive, which means its priority is conserving energy and avoiding threats. It is constantly scanning your environment for the path of least resistance.

This brings us to dopamine.

> Dopamine is heavily involved in wanting, drive, and learning what’s worth pursuing, especially through anticipation and reward prediction. While this is a simplified model, it’s incredibly useful for us game devs to understand. Your brain quickly learns which actions deliver fast rewards with low effort, and it will heavily bias you toward those. Because your brain wants to avoid threats, it is always looking for shortcuts that deliver quick reward signals (novelty, social approval, certainty) without the cost of building.

This leads to three common traps that quietly stall games for months:

## Trap 1: Talking Instead of Doing

Have you ever had an amazing idea for a mechanic, run straight to Discord or Twitter to announce it, and soaked in all the "Wow, that sounds incredible!" replies?

Publicly announcing goals can create a false sense of completion and identity ("I'm the kind of person making this awesome game"). Your brain generated the drive to build something, but you fed it a cheap, immediate social reward instead. The anticipation is resolved.

The result? You are left with much less drive to do the hard, ambiguous part next. This isn’t a strict rule to never share. It just means you shouldn't cash the praise check before you’ve done the work (a well-documented psychological phenomenon often called the social reality effect).

## Trap 2: Decisions Based On Vibes

Because your brain wants the path of least resistance, it prefers to make design decisions based on hypotheticals. Running a Twitter poll or posting a community questionnaire is a low-effort reward signal disguised as actual development.

I learned this the hard way during a playtest. A tester read over the concepts for two different game modes. Based purely on the idea, they filled out their pre-play feedback form and confidently stated that Option A was the right choice. Then, I actually built both.

- **Option A:** Player abandoned it after 10 minutes.
- **Option B:** Player engaged for a full hour.

People will tell you one thing and do another! In playtests, you can treat what people tell you as a hypothesis, but you learn a lot more from observed behavior. In a 20 to 30 minute test, track these specific metrics:

- **First 60 seconds:** Note points of confusion.
- **Time-to-first-fun:** Wait for their first smile, laugh, or "oh!" moment.
- **Retries:** Count the number of voluntary attempts after failing.
- **Engagement:** Notice when they ask a question versus when they just keep playing.
- **Persistence:** See if they choose to continue when given an explicit out.

## Trap 3: Ambiguity Avoidance

A lot of procrastination in game dev isn’t pleasure-seeking. It’s ambiguity mixed with a fear of wasted effort. When the next step in your project is unclear (like "Fix the combat system"), the brain flags it as a high-energy threat. In this context, "threat" often just means uncertainty plus potential wasted effort plus ego risk (finding out your idea isn't fun). It seeks clear, easy rewards elsewhere, like watching a YouTube tutorial.

> **Conversion Rule:** Rewrite any task until it starts with a verb and can be done in 10 minutes. For example, replace "Fix combat" with "Spawn one enemy in an empty room and log time-to-kill with a debug print."

## The Fix: Design a Pro-Shipping Environment

If you know your brain is an energy-efficient machine looking for shortcuts, yelling at yourself to "just work harder" won't fix anything. Instead, you need to design your environment and workflow so the "easy path" points toward shipping.

### 1. Micro-Dose Progress (Build Momentum)

If you're stuck, your task is too vague. Radically lower the energy required to start. Open the project. Hit Play. Write the next micro-step where you can’t miss it (a sticky note, a README, or a task list). The win is simply having the project open and one tiny change committed.

### 2. Use Prototyping as a "Cheap Win"

Stop theory-crafting the perfect system in your head to avoid the work. Make crappy throwaway prototypes using primitive shapes and borrowed constraints from an existing game. Or make it on paper! It gives your brain the fast, low-friction win it craves, but in a productive way.

### 3. Lock the Social Reward

You need a hard constraint to stop reward substitution. Here are a good couple of rules I like:

- Share progress only in spaces that create accountability (like a build log with a set deadline), not just praise.
- You are not allowed to post a screenshot or tweet about a feature for public validation until you have a playable, tested build.

## The Dopamine Trap Shipping Checklist

Game development is a marathon filled with uncertainty. Keep this checklist handy to keep your brain on track:

- **Daily micro-win:** Define one task that takes <15 minutes and ends in a visible change.
- **Prototype rule:** Any mechanic idea gets 60 minutes of ugly implementation before discussion.
- **Social lock:** No posting until there’s a playable build and one external playtest note.
- **Behavior > opinions:** Measure time-on-task, retries, and voluntary re-engagement.
- **Reduce friction:** Ensure your project opens in <30 seconds. Keep a "next task" note in your repo so you never start with a blank slate.
- **Weekly ship:** Package one build every 7 days, even if it’s small and ugly.
- **Weekly review:** Spend 10 minutes asking what shipped, what stalled, and what’s the next smallest playable slice.

**Template:**

- This week’s smallest playable slice: ____
- This week’s playtest question: ____
- Ship date/time: ____

Pick one item from your backlog right now. Set a 15-minute timer. Define the smallest visible change and do only that. Stop while it’s still easy, so tomorrow has low friction.
