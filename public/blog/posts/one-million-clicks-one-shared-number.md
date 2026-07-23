---
title: One Button MMO
date: 2026-07-23
summary: The technical tradeoffs behind letting thousands of players mutate one value without losing clicks, double-counting retries, or producing two winners.
---

# One Button MMO

Hey! I've been working on [*Million Countdown*](https://wayfarergames.itch.io/million-clicks), a game where everyone clicks one button that counts down from 1,000,000 to zero.

That's the whole pitch. There's one button. You press it. The number gets smaller.

This sounds like it should be the easiest game I've ever made 😂

It is not.

I'll let you in on a secret: "multiplayer" really means "arguments about what order things happened in". A normal clicker keeps its number on your device and updates it the instant you press the button. A shared clicker has to answer a much nastier question: what does "the number" even mean when thousands of people are changing it at once, all with different connections, all seeing a slightly different version of the game?

Nearly every decision in this project is a tradeoff between three things: being correct, feeling instant, and not melting the server. Pick any two and you're fine. Getting all three is where it gets interesting.

## Prediction!

The server has to own the real countdown. If every browser got to decide what counted, cheating would be hilariously easy and the final click would mean nothing.

Unfortunately, a round trip to the server takes time:

```text
press button → send click → server scores it → response returns → update screen
```

Even a good 80ms connection makes that feel slightly sticky. On a bad connection it feels completely broken.

The fix is client-side prediction - the same trick shooters use to move your character before the server agrees. When you click, your contribution readout and combo meter update immediately, and the server's reply catches up a moment later.

But you can only predict things you're allowed to be temporarily wrong about:

- **Your own state can be predicted.** Your browser knows which clicks it's sent that haven't been confirmed yet, so it can include them early.
- **Shared state can't.** Your browser has no idea how many clicks everyone else has in flight, so the countdown and leaderboard always show what the server said.

I also smooth the displayed countdown towards each new server value instead of snapping it. If 40 other players clicked between updates, the number rapidly rolls down through the difference - you see the scale of what just happened, but the number never pretends your browser is in charge.

The combo meter follows the same rule. Your browser can predict that the meter is full, but the ×2 multiplier doesn't switch on until the server confirms it. That costs a tiny delay at the exact moment the multiplier activates, and in exchange your screen never shows a ×2 contribution that later gets corrected back down to ×1. I hate it when games do that.

## You Can't Shard One Number

Most scaling advice boils down to "divide the work between machines". That's tricky here, because every single player is trying to change the same value.

Player profiles can be separated. History can be written later. Leaderboard reads can be cached. But the countdown itself can't be split into ten independent counters, because then which counter gets the final click? How do all ten agree the round is over?

So I did the thing you're never supposed to do: I made scoring a single point of contention, on purpose. Every click runs through one small all-or-nothing operation that validates the round, applies the rate limits, works out the multiplier, reduces the countdown, updates your contribution, moves your leaderboard position and bumps a version number. Nothing else can run in the middle of it.

Normally "the hottest path in the game runs one click at a time" is a sentence that should make you very nervous! It works here because the operation is tiny, lives entirely in memory, and never waits on anything halfway through. Giving up parallel writes buys the one guarantee this game can't live without: every accepted click has exactly one place in the order.

You can scale the work *around* a shared value, but eventually that value needs one authority. Pretending otherwise just moves the lock somewhere harder to see.

## Batching!

Sending one network message per click is wasteful - people can click fast, and every message carries the same protocol overhead. But waiting around to build big batches is worse, because it increases the amount of unconfirmed stuff on your screen.

The compromise: the client waits a tiny window and sends up to 16 clicks in one compact message. At normal speeds, most batches contain exactly one click. During a frenzy, several clicks share the envelope. The delay is too short to feel, but it removes a load of repeated work at the exact moment the system is busiest.

## A Timeout Doesn't Mean It Failed

Batching creates another problem: networks are deeply annoying.

Imagine you send a click, the server applies it, and the reply gets lost on the way back. Your browser only sees a timeout. If it sends the click again... have you now contributed once or twice?

You can't fix that with "retry and hope". Every click gets a sequence number, and the server remembers the last one it accepted from you. Batches look like this:

```text
stream: abc123
first sequence: 481
click count: 6
```

That means "clicks 481 to 486". If the response disappears, the client sends the exact same batch again. The server spots that it's already processed those sequence numbers and returns the original result instead of scoring them twice. Retrying goes from a guess to a completely safe operation.

There are a couple of extra wrinkles. If the browser reconnects and finds the server further ahead than expected, it adopts the server's number and carries on. And if the round ended while the clicks were travelling, they're thrown away - they belonged to a countdown that no longer exists.

The alternative is choosing between lost clicks and duplicated clicks every time a response goes missing. Neither is acceptable when the entire game is an exact count.

## Zero Is a Race Condition

The final click is the most interesting problem in the whole game.

Suppose the countdown is at 1 and two players click at almost exactly the same time. A naive implementation does this:

```text
Player A reads 1
Player B reads 1
Player A writes 0 and wins
Player B writes 0 and also wins
```

Congratulations, we now have two winners 🫠

The ×2 multiplier makes it messier. If 1 remains and a powered-up player clicks, their click is worth 2 - but the countdown can't reach -1. The final click has to be clamped to whatever's actually left:

```text
applied = min(multiplier, remaining)
remaining -= applied
contribution += applied

if remaining == 0:
    final_player = this_player
    round = complete
```

All of this happens inside that one all-or-nothing scoring operation, so no other click can sneak into the middle. By the time the next player's click is looked at, the round is already over.

That final click is the entire dramatic payoff of the game, so "probably correct" isn't good enough. There must be exactly one zero, exactly one winner, and no chance of the countdown wandering into negative numbers.

One more guard: every batch says which round it belongs to. A delayed batch from the previous round can't turn up after a restart and start eating the new countdown - it gets rejected as stale.

## Broadcasting!

The obvious realtime implementation is to broadcast the new countdown to everyone after every accepted click.

That works brilliantly with three players and becomes increasingly stupid as the game gets popular. If 2,000 clicks land in one second, sending 2,000 updates to every connected player doesn't make anything smoother - browsers can't meaningfully display 2,000 intermediate states anyway. They'd just burn CPU decoding messages and rewriting the same number over and over.

The trick is noticing that different information has different urgency:

- Your own acknowledgement comes back immediately, because it resolves the click *you* just made.
- The global countdown updates are merged together and broadcast up to 20 times per second.
- The leaderboard updates up to 5 times per second.
- A full snapshot goes out periodically, so one missed message can't leave anyone permanently wrong.

The messages themselves are fixed-size binary frames rather than JSON, so I'm not shipping the words "remaining" and "players" thousands of times a second. The entire global state fits in 39 bytes.

Yes, that means spectators can be up to 50ms behind the newest countdown, and the leaderboard up to 200ms behind. Nobody can tell, and neither delay changes a scoring decision, because those displays are never used as authority. "Realtime" doesn't mean "send everything instantly" - it means each part of the screen is fresh enough for what it's for.

## Fairness!

Rate limiting one player is easy. It stops a single browser from spamming thousands of clicks per second, but it does nothing about someone opening fifty tabs with fifty identities.

The obvious next step is a limit per network - and that's a trap. Hundreds of legitimate players at a school, office or event can all appear to come from the same place. A strict per-network limit treats a successful real-world crowd exactly like an attack, which is a terrible reward for going viral in a classroom.

So the network allowance stretches: the more distinct, recently active players on a connection, the more capacity it gets, up to a hard ceiling. One person can't multiply their throughput by opening more tabs, but a genuine crowd sharing a connection gets room to play.

Is this mathematically perfect abuse prevention? Absolutely not. It's a policy decision baked into the scoring path: prefer letting a real crowd in, accept that some dodgy traffic sneaks through, and cap the damage it can do.

## The Whole Game Is One Number

*Million Countdown* has one input and one objective, and that simplicity is exactly what exposes every tiny flaw. There's no room for the shared number to be *approximately* right - thousands of independent browsers have to agree that one ordered sequence of changes happened, even though messages get delayed, duplicated and lost along the way.

Every decision above comes from asking the same question: does being wrong here change the result? The countdown and the winner? Exact, always. Your combo meter, the leaderboard, the number mid-roll on a spectator's screen? Allowed to lag, predict and catch up.

> **The lesson:** Strong consistency is expensive, so spend it only where being wrong would change the outcome. Everything else can be predicted, batched, merged or rebuilt.

The button is the easy bit. Deciding what "one shared number" actually means - that's the game.
