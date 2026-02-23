# Strava API Compliance Guide

## Overview

This document outlines the requirements for Strava API compliance as outlined in the [Strava API Brand Guidelines](https://www.strava.com/api/v3/oauth#branding). Compliance is **mandatory** for Community Application approval and continued API access.

## Compliance Requirements Summary

### Critical Requirements

1. **"Powered by Strava" Logo** - Must be displayed on any page showing Strava data
2. **Athlete Name Links** - Must link to `https://strava.com/athletes/{id}`
3. **Activity Links** - Must link to `https://strava.com/activities/{id}` with "View on Strava" text
4. **Link Styling** - Links must be identifiable (bold, underline, or orange #FC5200)
5. **Logo Placement** - Logo must be separate from app branding, not more prominent

## Detailed Requirements

### 1. "Powered by Strava" Logo

**Requirement:**

> All apps that choose to display the "Powered by Strava" logo or "Compatible with Strava" logo on any websites, apps and any distributable media such as images, videos or prints must comply with Strava's brand guidelines.

**Implementation:**

- **Location**: Dashboard footer (any page showing Strava data)
- **Asset**: Use horizontal white version for dark backgrounds
- **Path**: `/src/lib/assets/1.2-Strava-API-Logos/Powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg`
- **Link**: Must link to `https://www.strava.com`
- **Placement**: Separate from app branding, not more prominent than app name

**Code Example:**

```svelte
<footer class="border-t border-white/10 bg-[#050505]/80 px-6 py-8 backdrop-blur-md">
	<div class="mx-auto flex max-w-5xl items-center justify-between">
		<div class="flex flex-col gap-2 text-[10px] tracking-widest text-white/30 uppercase">
			<span>EST. 2024</span>
			<span>Charleston, SC</span>
		</div>

		<!-- Powered by Strava Logo - REQUIRED -->
		<div class="flex items-center gap-2">
			<span class="text-[10px] tracking-widest text-white/40 uppercase">Powered by</span>
			<a
				href="https://www.strava.com"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-block opacity-80 transition-opacity hover:opacity-100"
			>
				<img
					src="/src/lib/assets/1.2-Strava-API-Logos/Powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg"
					alt="Powered by Strava"
					class="h-6 w-auto"
				/>
			</a>
		</div>
	</div>
</footer>
```

**Logo Rules:**

- ✅ Must be completely separate from app name/logo
- ✅ Must not appear more prominently than app name
- ✅ Must not be modified, altered, or animated
- ✅ Must not be used as app icon
- ✅ Must link to `https://www.strava.com`

### 2. Athlete Name Links

**Requirement:**

> If you choose to link back to any original Strava data sources presented in your application you must use the following text format, "View on Strava".

**Implementation:**

- **Location**: `LeaderboardRow.svelte` - Athlete name column
- **Link Format**: `https://strava.com/athletes/{stravaAthleteId}`
- **Data Source**: `row.profile.stravaAthleteId`
- **Styling**: Must be identifiable as link (bold, underline, or orange #FC5200)

**Code Example:**

```svelte
<!-- Athlete Name - MUST link to Strava -->
{#if row.profile.stravaAthleteId}
	<a
		href={`https://strava.com/athletes/${row.profile.stravaAthleteId}`}
		target="_blank"
		rel="noopener noreferrer"
		class="max-w-[120px] truncate text-base font-bold tracking-tight text-white underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-(--accent-lime) md:max-w-none"
		style="color: #FC5200;"
	>
		{row.profile.firstname}
		{row.profile.lastname}
	</a>
{:else}
	<span class="max-w-[120px] truncate text-base font-bold tracking-tight text-white md:max-w-none">
		{row.profile.firstname}
		{row.profile.lastname}
	</span>
{/if}
```

**Link Styling Options (choose one):**

- **Bold**: `font-bold`
- **Underline**: `underline decoration-2`
- **Orange Color**: `#FC5200` (Strava brand orange)

### 3. Activity Links

**Requirement:**

> If you choose to link back to any original Strava data sources presented in your application you must use the following text format, "View on Strava".

**Implementation:**

- **Location**: `LeaderboardRow.svelte` - Activity name column
- **Link Format**: `https://strava.com/activities/{stravaActivityId}`
- **Data Source**: `row.contribution.stravaActivityId`
- **Text**: Must use "View on Strava" text format
- **Styling**: Must be identifiable as link (bold, underline, or orange #FC5200)

**Code Example:**

```svelte
<!-- Activity Name - MUST link to Strava with "View on Strava" text -->
<div class="hidden flex-col justify-center md:flex">
	{#if row.contribution?.stravaActivityId}
		<a
			href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
			target="_blank"
			rel="noopener noreferrer"
			class="truncate text-xs text-white/80 uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
			style="color: #FC5200;"
		>
			{row.contribution.activityName || 'View on Strava'}
		</a>
		<span class="mt-1 text-[10px] text-gray-600">{formatDate(row.contribution.occurredAt)}</span>
	{:else}
		<span class="truncate text-xs text-white/80 uppercase">No Data</span>
	{/if}
</div>
```

**Alternative Implementation (if activity name is separate from link):**

```svelte
<div class="hidden flex-col justify-center md:flex">
	{#if row.contribution?.stravaActivityId}
		<span class="truncate text-xs text-white/80 uppercase">
			{row.contribution.activityName || 'No Data'}
		</span>
		<a
			href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-1 text-[10px] font-bold uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
			style="color: #FC5200;"
		>
			View on Strava
		</a>
	{:else}
		<span class="truncate text-xs text-white/80 uppercase">No Data</span>
	{/if}
</div>
```

### 4. Link Styling Requirements

**Requirement:**

> Text link should be legible. Text link should be identifiable as a link by using one of the following type treatments: bold weight, underline, or orange color #FC5200.

**Implementation Options:**

**Option 1: Bold + Orange**

```svelte
<a href="..." class="font-bold" style="color: #FC5200;"> Link Text </a>
```

**Option 2: Underline + Orange**

```svelte
<a href="..." class="underline decoration-2 underline-offset-2" style="color: #FC5200;">
	Link Text
</a>
```

**Option 3: Bold + Underline**

```svelte
<a href="..." class="font-bold underline decoration-2 underline-offset-2"> Link Text </a>
```

**Recommended**: Use **Option 2** (underline + orange) for best visibility and compliance.

### 5. Logo Placement Rules

**Critical Rules:**

1. **Separation**: Logo must be "completely separate and apart from" app name/logo
2. **Prominence**: Logo must "not appear more prominently than" app name
3. **No Modification**: Never modify, alter, or animate Strava logos
4. **No Icon Use**: Never use any part of a Strava logo as app icon
5. **No Implication**: Never imply app was developed or sponsored by Strava

**Good Placement Example:**

```
[App Name]                    [Powered by] [Strava Logo]
```

**Bad Placement Example:**

```
[App Name] [Strava Logo]  ❌ Too close together
[Strava Logo] [App Name]  ❌ Strava more prominent
```

## Current Compliance Status

### ✅ Implemented on the dashboard branch

- [x] "Connect with Strava" button used correctly on the landing page, linking to the official OAuth endpoint with official assets.
- [x] "Powered by Strava" logo rendered in the dashboard footer via `DashboardFooter.svelte`, linking to `https://www.strava.com` and kept visually separate from app branding.
- [x] Athlete names in `LeaderboardRow.svelte` link to `https://strava.com/athletes/{stravaAthleteId}` with compliant orange + underline styling.
- [x] Activity entries in `LeaderboardRow.svelte` link to `https://strava.com/activities/{stravaActivityId}` using the required **\"View on Strava\"** text.
- [x] All Strava links are clearly identifiable (underline + orange `#FC5200`) and open in a new tab with `target="_blank" rel="noopener noreferrer"`.

For the step‑by‑step implementation details, see `docs/strava_compliance_implementation.md`. For visual proof used in the Community Application review, see the screenshots under `docs/strava_compliance_proof/`.

## Historical Implementation Checklist

The following checklist describes how compliance was originally implemented. All items are **complete** on this branch but are kept here as a reference.

### Phase 1: Critical Compliance (Required for Approval)

- [x] **Add "Powered by Strava" logo to dashboard footer**
  - File: `src/routes/dashboard/_components/DashboardFooter.svelte`
  - Use white horizontal logo for dark background
  - Ensure proper separation from app branding
  - Link to `https://www.strava.com`

- [x] **Link athlete names to Strava**
  - File: `src/routes/dashboard/_components/LeaderboardRow.svelte`
  - Use `row.profile.stravaAthleteId` for link
  - Format: `https://strava.com/athletes/{id}`
  - Apply link styling (bold/underline/orange)

- [x] **Link activities to Strava**
  - File: `src/routes/dashboard/_components/LeaderboardRow.svelte`
  - Use `row.contribution.stravaActivityId` for link
  - Format: `https://strava.com/activities/{id}`
  - Use "View on Strava" text format
  - Apply link styling (bold/underline/orange)

### Phase 2: Verification

- [x] **Verify logo placement**
  - Logo is separate from app name
  - Logo is not more prominent than app name
  - Logo is not modified or animated
  - Logo links to Strava website

- [x] **Verify link styling**
  - All Strava links are identifiable
  - Links use bold, underline, or orange (#FC5200)
  - Links are legible
  - "View on Strava" text format used for activities

- [x] **Verify data linking**
  - All athlete names with `stravaAthleteId` are linked
  - All activities with `stravaActivityId` are linked
  - Links open in new tab with `target="_blank" rel="noopener noreferrer"`

## Code Locations

### Files to Update

1. **`src/routes/dashboard/+page.svelte`**
   - Add dashboard footer with "Powered by Strava" logo

2. **`src/routes/dashboard/_components/LeaderboardRow.svelte`**
   - Update athlete name to link to Strava (lines 62-67)
   - Update activity name to link to Strava (lines 76-83)

### Assets Available

- **Logo Assets**: `/src/lib/assets/1.2-Strava-API-Logos/Powered by Strava/`
  - White: `pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg`
  - Orange: `pwrdBy_strava_orange/api_logo_pwrdBy_strava_horiz_orange.svg`
  - Black: `pwrdBy_strava_black/api_logo_pwrdBy_strava_horiz_black.svg`

## Testing Checklist

### Pre-Submission Testing

- [ ] "Powered by Strava" logo visible on dashboard
- [ ] Logo links to `https://www.strava.com`
- [ ] Logo is separate from app branding
- [ ] Logo is not more prominent than app name
- [ ] All athlete names with Strava IDs are clickable links
- [ ] Athlete links go to correct Strava athlete pages
- [ ] All activities with Strava IDs are clickable links
- [ ] Activity links go to correct Strava activity pages
- [ ] "View on Strava" text appears for activity links
- [ ] All links use proper styling (bold/underline/orange)
- [ ] Links open in new tab
- [ ] Links are accessible (keyboard navigation works)
- [ ] Mobile view maintains compliance

### Visual Verification

- [ ] Logo is clearly visible but not dominant
- [ ] Links are clearly identifiable as links
- [ ] Orange color (#FC5200) is used correctly
- [ ] Underlines/bold styling is applied
- [ ] Overall design maintains brand consistency

## Common Compliance Mistakes to Avoid

1. **❌ Logo too prominent**: Logo should not be larger or more visible than app name
2. **❌ Logo too close to branding**: Must be clearly separate
3. **❌ Modified logo**: Never change colors, add effects, or animate
4. **❌ Missing links**: All athlete/activity data must link back to Strava
5. **❌ Unclear link styling**: Links must be obviously clickable
6. **❌ Wrong link format**: Must use exact Strava URL format
7. **❌ Missing "View on Strava" text**: Required for activity links
8. **❌ Logo on wrong pages**: Only needed on pages showing Strava data

## Submission Notes

When submitting for Community Application approval:

1. **Screenshots Required:**
   - Dashboard showing "Powered by Strava" logo
   - Leaderboard with linked athlete names
   - Activity links with "View on Strava" text
   - Mobile view compliance

2. **Documentation:**
   - Explain logo placement rationale
   - Show link styling implementation
   - Demonstrate compliance with all requirements

3. **Testing:**
   - Test all links work correctly
   - Verify logo visibility and placement
   - Check mobile responsiveness
   - Ensure accessibility standards met

## Resources

- [Strava API Brand Guidelines](https://www.strava.com/api/v3/oauth#branding)
- [Strava API Agreement](https://www.strava.com/legal/api)
- [Strava Developer Support](mailto:developers@strava.com)

## Questions?

If you have questions about compliance, contact Strava at: **developers@strava.com**

---

**Last Updated**: January 27, 2026  
**Guidelines Version**: September 29, 2025
