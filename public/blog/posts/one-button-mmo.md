---
title: One Button MMO
date: 2026-07-23
summary: Some tradeoffs behind letting thousands of players change a single value without losing clicks, double-counting retries, or producing two winners.
---

# One Button MMO

Hey! I've been working on [*Million Countdown*](https://wayfarergames.itch.io/million-clicks), a game where everyone clicks one button that counts down from 1,000,000 to zero.

That's the whole pitch. There's one button. You press it. The number gets smaller.

This sounds like it should be the easiest game I've ever made 😂

It is not.

I'll let you in on a secret: "multiplayer" really means "arguments about what order things happened in". A normal clicker keeps its number on your device and updates it the instant you press the button. A shared clicker has to answer a much nastier question: what does "the number" even mean when thousands of people are changing it at once, all with different connections, all seeing a slightly different version of the game?

Nearly every decision in this project is a tradeoff between three things: being correct, feeling instant, and not melting the server, and that's usually a "pick two" kind of situation...

## Prediction!

The server has to own the final number, obviously. If every browser got to decide what counted, cheating would be hilariously easy!

Unfortunately, a round trip to the server takes time:

```text
press → send click → server updates → response returns → update screen
```

Even a good 80ms connection makes that feel a bit sticky, and on a bad connection it feels completely broken.

The fix is client-side prediction - the same trick shooters use to move your character before the server agrees. When you click, your "contribution" number and combo meter update immediately, and the server catches up a moment later.

But you can only predict things you're allowed to be temporarily wrong about:

- **Your own state can be predicted.** Your browser knows which clicks it has sent but haven't been confirmed yet, so it can include them early.
- **Shared state can't.** Your browser has no idea how many clicks everyone else has just made, so the countdown and leaderboard always show what the server said.

I also smooth the displayed countdown towards each new server value instead of snapping it. If 40 other players clicked between updates, the number rolls down through the difference, which feels snappier and more like "individual clicks are updating this number". They very much are not.

The combo meter follows the same rule. The game can predict that the meter is full, but the ×2 multiplier doesn't switch on until the server confirms it. That means there is a tiny delay at the exact moment the multiplier activates, so you never see a ×2 contribution that later gets corrected back down to ×1. In practice though, you're never going to notice this!

## You Can't Shard One Number

Most scaling advice boils down to "divide the work between machines". That doesn't really work here, because we have one value that **every single player is touching**. The countdown itself can't be split into ten independent counters, because then which counter gets the final click? How do all ten agree the round is over?

So I made scoring a single long, messy script that runs on a single thread and is the "source of truth". Every click runs through one small all-or-nothing operation that validates the round, applies the rate limits, works out the multiplier, reduces the countdown, updates your contribution, moves your leaderboard position and bumps a version number.

Usually, you'd never want to do that. I'm sure someone reading this just threw up a little. It does actually work here, though, because the operation is tiny, lives entirely in memory, and never waits on anything halfway through. That means every accepted click has exactly one place in the order!

## Batching!

Sending one network message per click is wasteful - people can click fast, and every message carries the same protocol overhead. But waiting around to build big batches is worse, because it increases the amount of unconfirmed stuff on your screen.

So we compromise: the client waits a tiny window and sends up to 16 clicks in one compact message. At normal speeds, most batches contain just one click. During a frenzy, it sends a few clicks per message. The delay is too short to actually feel, but it removes a bunch of work that happens when the system is busiest.

## A Timeout Doesn't Mean It Failed

Batching creates another problem: networks are really annoying.

What happens if you send a click, the server applies it, and the reply gets lost on the way back? Your browser only sees a timeout. If you send the click again... have you now contributed once or twice?

You can't fix that with "retry and hope". Every click gets a sequence number, and the server remembers the last one it accepted from you. Batches look like this:

```text
stream: abc123
first sequence: 481
click count: 6
```

That means "clicks 481 to 486". If the response disappears, the client sends the exact same batch again. The server spots that it has already seen those numbers and returns the original result instead of scoring them twice.

There are a couple of extra wrinkles. If the browser reconnects and finds the server further ahead than expected, it uses the server's number and carries on. And if the round ended while the clicks were travelling, they are thrown away.

The alternative is choosing between lost clicks and duplicated clicks every time a response goes missing, but I'm pretty sure that would be bad in this sort of game 🤔

## Zero Is a Race Condition

The final click is the most interesting problem. When I say interesting I do of course mean "aaaaaaaaaaaaaaaaa\[\.\.\.\]"

When the countdown is at 1 and two players click at almost exactly the same time, you might think to do this:

```text
Player A reads 1
Player B reads 1
Player A writes 0 and wins
Player B writes 0 and also wins
```

Congratulations, we now have two winners 🫠

Instead, that one all-or-nothing scoring operation handles every part of the process, so no other click can sneak into the middle. By the time the next player's click hits the code, the round is already over. A nice, simple, if messy, fix.

## Broadcasting!

The obvious realtime implementation is to broadcast the new countdown to everyone after every accepted click.

That works brilliantly with three players and becomes increasingly stupid as the game gets popular. If 2,000 clicks land in one second, sending 2,000 updates to every connected player doesn't make anything smoother - browsers can't meaningfully display 2,000 intermediate states anyway. They'd just burn CPU decoding messages and rewriting the same number over and over.

The trick is noticing that different information has different urgency:

- Your own click comes back immediately, because it resolves the click *you* just made.
- The global countdown updates are merged together and broadcast up to 20 times per second.
- The leaderboard updates up to 5 times per second.
- A full snapshot goes out periodically, so one missed message can't leave anyone permanently wrong.

The high-frequency messages themselves are fixed-size binary frames rather than JSON, so I'm not shipping the words "remaining" and "players" thousands of times a second. The entire global state fits in 39 bytes.

Yes, that means spectators can be up to 50ms behind the newest countdown, and the leaderboard up to 200ms behind. Nobody can tell, and neither delay changes a scoring decision, because those displays are never used as authority. "Realtime" doesn't mean "send everything instantly" - it means each part of the screen is fresh enough for what it's for.

## Fairness!

Rate limiting one player is easy. It stops a single browser from spamming thousands of clicks per second, but it does nothing about someone opening fifty tabs with fifty identities.

The obvious next step is a limit per network - and that's a trap. Hundreds of legitimate players at a school, office or event can all appear to come from the same place. A strict per-network limit treats a successful real-world crowd exactly like an attack, which is a terrible reward for going viral in a classroom.

So the network allowance stretches: the more distinct, recently active players on a connection, the more capacity it gets, up to a hard ceiling. One person can't multiply their throughput by opening more tabs, but a genuine crowd sharing a connection gets room to play.

## The Whole Game Is One Number

We have one input and one objective, and that simplicity exposes every tiny little flaw. There's no room for the shared number to be *approximately* right - everyone has to agree that one ordered sequence of changes happened, even when messages get delayed, duplicated and lost along the way.

Every decision here comes from asking the same question: does being wrong here change the result?
