# Dashboard Styling Update Plan

## Overview

This document outlines the design improvements needed to bring the dashboard in line with the landing page's sophisticated aesthetic. The current dashboard is functional but lacks the visual polish, animations, and glassmorphic design language established on the landing page.

## Current State Analysis

### Landing Page Design Language (`+page.svelte` & components)

**Key Design Elements:**

- **Glassmorphism**: Backdrop blur, subtle transparency, layered depth
- **Dynamic Animations**: Parallax scrolling, SVG morphing, reveal animations
- **Typography**: Massive, bold, gradient text effects, italic/skew transforms
- **Hover Effects**: Color transitions, glow effects, scale transforms
- **Visual Depth**: Layered backgrounds, gradient overlays, subtle shadows

**Example Components:**

- `Hero.svelte`: Animated SVG track morphing, parallax effects, gradient text
- `RoutineCard.svelte`: Glassmorphic cards with backdrop blur, hover glow effects
- `Manifesto.svelte`: Reveal animations, gradient text, image hover effects

### Current Dashboard State

**Issues:**

- Flat design with basic borders and solid backgrounds
- No animations or transitions
- Basic typography without gradient effects
- No hover states on interactive elements
- Utilitarian appearance - looks like a data table, not a branded experience
- Minimal visual hierarchy
- Underutilized whitespace

## Design Goals

1. **Match Landing Page Aesthetic**: Bring dashboard in line with landing page's sophisticated design
2. **Maintain Functionality**: All improvements must preserve existing functionality
3. **Enhance User Experience**: Add visual feedback, animations, and better information hierarchy
4. **Brand Consistency**: Ensure dashboard feels like part of the same application

## Component-by-Component Update Plan

### 1. ChallengeHero Component

**Current State:**

- Basic header with challenge title
- Simple badge for "Active Challenge"
- Basic action buttons
- Minimal styling

**Target State:**

- Glassmorphic card styling (similar to `RoutineCard.svelte`)
- Gradient text effects on challenge title
- Reveal animations on mount
- Enhanced hover effects on action buttons
- Better visual hierarchy with spacing and typography

**Implementation Details:**

```svelte
<!-- Add glassmorphic container -->
<div
	class="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-8 backdrop-blur-md"
>
	<!-- Add gradient overlay -->
	<div
		class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 to-transparent"
	></div>

	<!-- Challenge title with gradient -->
	<h1 class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-6xl">
		<span class="bg-linear-to-r from-(--accent-lime) to-white bg-clip-text text-transparent">
			{challenge.title}
		</span>
	</h1>

	<!-- Enhanced badge with glow -->
	<span
		class="inline-block rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-3 py-1 text-[10px] font-bold tracking-widest text-(--accent-lime) uppercase shadow-[0_0_20px_rgba(0,255,0,0.3)]"
	>
		Active Challenge
	</span>
</div>
```

**Key Features:**

- Backdrop blur (`backdrop-blur-md`)
- Subtle transparency (`bg-black/40`)
- Border with opacity (`border-white/10`)
- Gradient text effects
- Shadow/glow effects on interactive elements

### 2. ChallengeStatsGrid Component

**Current State:**

- Basic grid with flat backgrounds
- Simple hover color change
- Minimal visual interest

**Target State:**

- Glassmorphic cards matching `RoutineCard.svelte` style
- Hover effects with accent color glows
- Animated counters (if numbers change)
- Better spacing and typography
- Individual card depth and shadows

**Implementation Details:**

```svelte
<div class="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
	{#each statItems as stat}
		<div
			class="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-(--accent-lime)/50 hover:shadow-[0_0_30px_-10px_var(--accent-lime)]"
		>
			<!-- Gradient overlay on hover -->
			<div
				class="absolute inset-0 bg-linear-to-br from-(--accent-lime)/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			></div>

			<div class="relative z-10">
				<span
					class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase transition-colors group-hover:text-white"
				>
					{stat.label}
				</span>
				<span
					class="text-3xl font-black text-white transition-colors group-hover:text-(--accent-lime)"
				>
					{stat.value}
				</span>
			</div>
		</div>
	{/each}
</div>
```

**Key Features:**

- Glassmorphic styling with backdrop blur
- Hover lift effect (`hover:-translate-y-2`)
- Accent color glow on hover
- Smooth transitions
- Gradient overlays

### 3. LeaderboardTable Component

**Current State:**

- Basic table rows with minimal styling
- Simple hover background change
- No visual hierarchy for ranks or statuses

**Target State:**

- Glassmorphic row styling with backdrop blur
- Enhanced row hover effects (subtle glow, border color change)
- Better visual hierarchy for ranks (badges, colors)
- Smooth transitions for status changes
- Enhanced status indicators

**Implementation Details:**

```svelte
<div
	class="group relative overflow-hidden rounded-lg border border-white/5 bg-black/20 px-4 py-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
>
	<!-- Rank badge with glow for top 3 -->
	{#if row.rank && row.rank <= 3}
		<div
			class="absolute top-0 left-0 h-full w-1 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
		></div>
	{/if}

	<!-- Enhanced rank display -->
	<div
		class="text-center font-mono text-lg font-black {row.rank === 1
			? 'text-(--accent-lime) drop-shadow-[0_0_10px_var(--accent-lime)]'
			: 'text-gray-600'}"
	>
		{row.rank || '-'}
	</div>

	<!-- Status indicator with pulse animation -->
	{#if row.participant.status === 'in_progress'}
		<div
			class="absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
		></div>
	{/if}
</div>
```

**Key Features:**

- Glassmorphic row styling
- Enhanced hover effects
- Visual rank indicators
- Status animations
- Better spacing and typography

### 4. LeaderboardRow Component

**Current State:**

- Basic row layout
- Simple avatar display
- Minimal status indicators

**Target State:**

- Enhanced avatar styling with borders/glows
- Better typography hierarchy
- Improved status color coding
- Smooth transitions
- Better mobile responsiveness

**Implementation Details:**

```svelte
<!-- Enhanced avatar with glow -->
<div
	class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-gray-800 shadow-lg transition-all group-hover:border-(--accent-lime)/50 group-hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
>
	<img src={avatarUrl} alt={name} class="h-full w-full object-cover" />
	<!-- Status ring -->
	{#if status === 'in_progress'}
		<div class="absolute inset-0 animate-pulse rounded-full border-2 border-blue-500/50"></div>
	{/if}
</div>

<!-- Enhanced name with gradient on hover -->
<span
	class="text-base font-bold tracking-tight text-white transition-all group-hover:bg-linear-to-r group-hover:from-(--accent-lime) group-hover:to-white group-hover:bg-clip-text group-hover:text-transparent"
>
	{name}
</span>
```

### 5. LeaderboardTabs Component

**Current State:**

- Basic tab buttons
- Simple border-bottom indicator
- Minimal styling

**Target State:**

- Glassmorphic tab container
- Enhanced active state with glow
- Smooth transitions
- Better typography

**Implementation Details:**

```svelte
<div class="mb-8 flex gap-2 border-b border-white/10">
	<button
		class="relative border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all {activeTab ===
		'leaderboard'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:border-white/30 hover:text-white'}"
	>
		Leaderboard
		{#if activeTab === 'leaderboard'}
			<div
				class="absolute right-0 -bottom-0.5 left-0 h-0.5 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
			></div>
		{/if}
	</button>
</div>
```

### 6. JoinChallengeButton Component

**Current State:**

- Basic button styling
- Simple state changes

**Target State:**

- Enhanced button with glassmorphic styling
- Hover glow effects
- Loading state animations
- Better visual feedback

**Implementation Details:**

```svelte
<button
	class="group relative overflow-hidden rounded-full border-2 border-(--accent-lime) bg-(--accent-lime)/10 px-6 py-3 text-sm font-bold tracking-widest text-(--accent-lime) uppercase backdrop-blur-sm transition-all hover:bg-(--accent-lime)/20 hover:shadow-[0_0_30px_-10px_var(--accent-lime)] disabled:cursor-not-allowed disabled:opacity-50"
>
	<span class="relative z-10">{isSubmitting ? 'Joining...' : 'Join Challenge'}</span>
	<!-- Hover glow effect -->
	<div
		class="absolute inset-0 bg-(--accent-lime)/20 opacity-0 transition-opacity group-hover:opacity-100"
	></div>
</button>
```

### 7. CountdownTimer Component

**Current State:**

- Basic timer display
- Minimal styling

**Target State:**

- Enhanced typography
- Pulse animation for urgency
- Better visual hierarchy
- Glassmorphic container

### 8. Dashboard Footer

**New Component Needed:**

- Glassmorphic footer matching landing page style
- "Powered by Strava" logo (see Strava compliance doc)
- Consistent branding elements
- Smooth transitions

## Global Styling Updates

### 1. Background & Layout

**Add:**

- Gradient overlays for depth
- Subtle background patterns
- Better use of whitespace
- Consistent padding/margins

### 2. Typography

**Update:**

- Match landing page font weights and sizes
- Add gradient text effects where appropriate
- Improve tracking and line heights
- Better hierarchy with size/weight

### 3. Animations

**Add:**

- Reveal animations on mount (similar to `Manifesto.svelte`)
- Smooth transitions for state changes
- Hover animations
- Loading states

### 4. Color & Effects

**Enhance:**

- Consistent use of accent colors
- Glow effects on interactive elements
- Shadow depth for cards
- Gradient overlays

## Implementation Priority

### Phase 1: Core Components (High Priority)

1. **ChallengeHero** - First impression, most visible
2. **ChallengeStatsGrid** - High visibility, easy win
3. **LeaderboardTable** - Core functionality, most interaction

### Phase 2: Enhanced Interactions (Medium Priority)

4. **LeaderboardRow** - User engagement
5. **LeaderboardTabs** - Navigation clarity
6. **JoinChallengeButton** - Primary CTA

### Phase 3: Polish (Lower Priority)

7. **CountdownTimer** - Visual interest
8. **Dashboard Footer** - Completeness
9. **Global animations** - Final polish

## Design Patterns to Follow

### Glassmorphism Pattern

```css
background: rgba(0, 0, 0, 0.4);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Hover Effect Pattern

```css
transition: all 0.3s ease;
hover: {
	transform: translateY(-2px);
	border-color: var(--accent-lime);
	box-shadow: 0 0 30px -10px var(--accent-lime);
}
```

### Gradient Text Pattern

```css
background: linear-gradient(to right, var(--accent-lime), white);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

### Reveal Animation Pattern

```javascript
function reveal(node) {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.classList.add('reveal-active');
					observer.unobserve(node);
				}
			});
		},
		{ threshold: 0.15 }
	);
	observer.observe(node);
}
```

## Testing Checklist

- [ ] All components match landing page aesthetic
- [ ] Hover effects work on all interactive elements
- [ ] Animations are smooth and performant
- [ ] Mobile responsiveness maintained
- [ ] Accessibility not compromised
- [ ] Loading states handled gracefully
- [ ] Dark theme consistency maintained
- [ ] Typography hierarchy is clear
- [ ] Visual feedback is immediate and clear

## Notes

- Maintain existing functionality while enhancing visuals
- Test performance impact of animations
- Ensure accessibility standards are met
- Keep mobile experience smooth
- Consider reduced motion preferences
- Maintain brand consistency with landing page
