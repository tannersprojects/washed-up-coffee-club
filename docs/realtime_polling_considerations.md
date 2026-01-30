# Realtime Updates & Polling Considerations

## Discussion Date
January 27, 2026

## Question
Should we implement Supabase Realtime for real-time leaderboard updates? Multiple people will be joining challenges, and we want to know if this is a "nice to have" for later or something we should implement now.

## Current Implementation
- Server-driven updates: Form submissions trigger `update()` which re-runs the load function
- Load function queries all challenges and participants on every update
- Dashboard syncs via `$effect` when server data changes

## Analysis

### When Supabase Realtime Would Be Valuable

1. **High-frequency updates**: Multiple users joining/leaving frequently
2. **Live leaderboard changes**: People completing challenges throughout the day with positions changing
3. **Competitive scenarios**: When real-time position updates matter for user experience
4. **Active engagement**: Users actively watching the leaderboard and expecting instant updates

### For Our Use Case (<100 users, local running club)

**Current characteristics:**
- Small user base (<100 members)
- Challenges are "Flash Challenges" (24-hour windows)
- Join/leave events are relatively infrequent
- Leaderboard updates happen when activities are synced (via webhooks or manual sync)

**Assessment:**
- Joins/leaves: Not frequent enough to require realtime
- Leaderboard updates: Could be useful if people complete challenges throughout the day
- Overall: Likely overkill for current scale

## Recommendation: **Defer Realtime Implementation**

### Reasons to Wait

1. **Early stage validation**: Focus on core features first, validate user needs
2. **Current approach works**: Users can refresh or we can add a simple "Refresh" button
3. **Cost/Complexity trade-off**: Realtime adds:
   - WebSocket connection management
   - More complex state synchronization
   - Connection failure handling
   - Additional Supabase costs if scaling
   - More code to maintain and debug
4. **YAGNI principle**: "You Aren't Gonna Need It" - don't build features until there's clear demand

### When to Revisit

Implement Realtime when you observe:
- ✅ Users frequently refreshing to see updates
- ✅ Active challenges with frequent completions throughout the day
- ✅ User feedback requesting "live" updates
- ✅ Competitive scenarios where position changes matter in real-time
- ✅ Scale increases significantly (>100 active concurrent users)

## Alternative: Simple Polling (Interim Solution)

If you want updates without full realtime complexity, consider periodic polling:

```typescript
// Simple polling every 30 seconds when challenge is active
$effect(() => {
	if (challenge?.isActive) {
		const interval = setInterval(() => {
			invalidate('dashboard:data');
		}, 30000);
		return () => clearInterval(interval);
	}
});
```

**Benefits:**
- Much simpler than Realtime
- No WebSocket management
- Good enough for most use cases
- Easy to implement and remove later

**Drawbacks:**
- Not truly "real-time" (30s delay)
- Still makes periodic database queries
- Less efficient than Realtime for high-frequency updates

## Implementation Priority

1. **Now**: Keep current server-driven approach
2. **If needed**: Add simple polling (30-60 second intervals)
3. **Later**: Implement Supabase Realtime if clear demand emerges

## Related: Optimistic Updates vs Server Refresh

**Current approach (server-driven):**
- Always accurate
- Refreshes all data
- Simple code
- ❌ Extra database queries on every action
- ❌ Extra server round-trip (~100-300ms delay)

**Hybrid approach (recommended for join/leave):**
- Optimistic update for immediate feedback
- Server sync in background for accuracy
- Best of both worlds

See implementation in `JoinChallengeButton.svelte` for hybrid approach example.

## Notes

- Realtime is a "nice to have" feature, not a requirement
- Focus on core functionality first
- Add when there's clear user demand or competitive need
- Simple polling is a good middle ground if needed sooner
