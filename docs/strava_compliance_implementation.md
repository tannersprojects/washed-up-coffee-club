# Strava Compliance Implementation Guide

## Overview

This document outlines the concrete code changes needed to achieve full Strava API compliance for Community Application approval. All requirements are based on the [Strava API Brand Guidelines](https://www.strava.com/api/v3/oauth#branding) and detailed in `strava_compliance.md`.

## Current Status

### Implemented on this branch

- ✅ "Connect with Strava" button used correctly on login page, linking to the official OAuth endpoint (`https://www.strava.com/oauth/authorize`) with official assets.
- ✅ Dashboard footer component created (`DashboardFooter.svelte`) and rendered on the dashboard page.
- ✅ "Powered by Strava" logo added to the dashboard footer, linking to `https://www.strava.com` and kept visually separate from app branding.
- ✅ Athlete names in the leaderboard link to Strava athlete pages using `row.profile.stravaAthleteId`.
- ✅ Activity entries link to Strava activity pages using `row.contribution.stravaActivityId` and the required **"View on Strava"** text.
- ✅ All Strava links use compliant styling (orange `#FC5200` + underline) and open in a new tab with `target="_blank" rel="noopener noreferrer"`.

---

## Required Code Changes

### 1. "Powered by Strava" Logo in Dashboard Footer

**File**: `src/routes/dashboard/_components/DashboardFooter.svelte`

**Current State**: Footer component exists and includes the Strava logo, but needs verification.

**Verification Checklist**:

- [ ] Logo uses correct asset path:
  - `src/lib/assets/1.2-Strava-API-Logos/Powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg`
- [ ] Logo links to `https://www.strava.com` with `target="_blank" rel="noopener noreferrer"`
- [ ] Logo is visually smaller/less prominent than "Washed Up Coffee Club" branding
- [ ] Logo is clearly separated from app name (footer placement is good)
- [ ] Logo is not modified, animated, or altered in any way
- [ ] "Powered by" text appears before the logo (optional but recommended)

**Current Implementation** (needs verification):

```svelte
<!-- Powered by Strava Logo - REQUIRED for compliance -->
<div class="flex items-center gap-2">
	<a
		href="https://www.strava.com"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-block opacity-80 transition-opacity hover:opacity-100"
	>
		<img src={stravaLogo} alt="Powered by Strava" class="h-6 w-auto" />
	</a>
</div>
```

**Recommended Enhancement**: Add "Powered by" text label:

```svelte
<!-- Powered by Strava Logo - REQUIRED for compliance -->
<div class="flex items-center gap-2">
	<span class="font-mono text-[10px] tracking-widest text-white/40 uppercase">Powered by</span>
	<a
		href="https://www.strava.com"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-block opacity-80 transition-opacity hover:opacity-100"
	>
		<img src={stravaLogo} alt="Powered by Strava" class="h-6 w-auto" />
	</a>
</div>
```

**Placement Rules**:

- ✅ Logo is in footer (separate from nav branding)
- ✅ Logo is smaller than app name in nav
- ✅ Logo links to Strava website
- ⚠️ Verify logo size is appropriate (not too large relative to footer text)

---

### 2. Athlete Name Links in Leaderboard

**File**: `src/routes/dashboard/_components/LeaderboardRow.svelte`

**Current State**: Athlete names are displayed as plain text (lines 72-77).

**Required Change**: Convert athlete names to clickable links that go to their Strava profile pages.

**Implementation**:

Replace the current athlete name display:

```svelte
<!-- Current (lines 72-77) -->
<span
	class="max-w-[120px] truncate text-base font-bold tracking-tight text-white transition-all group-hover:bg-linear-to-r group-hover:from-(--accent-lime) group-hover:to-white group-hover:bg-clip-text group-hover:text-transparent md:max-w-none"
>
	{row.profile.firstname}
	{row.profile.lastname}
</span>
```

With compliant Strava link:

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

**Key Requirements**:

- ✅ Link format: `https://strava.com/athletes/{stravaAthleteId}`
- ✅ Only link when `row.profile.stravaAthleteId` exists
- ✅ Link styling: Underline + Orange (#FC5200) - **Option 2 from guidelines**
- ✅ Opens in new tab: `target="_blank" rel="noopener noreferrer"`
- ✅ Maintains truncation and responsive behavior
- ✅ Hover effect can remain (lime gradient) but base state must be orange + underline

**Data Verification**:

- Verify `row.profile.stravaAthleteId` is available in the `LeaderboardRowData` type
- Check that `Profile` schema includes `stravaAthleteId` field (should be `bigint` from schema)

---

### 3. Activity Links in Leaderboard

**File**: `src/routes/dashboard/_components/LeaderboardRow.svelte`

**Current State**: Activity names are displayed as plain text (lines 86-93).

**Required Change**: Add "View on Strava" links for activities that have a `stravaActivityId`.

**Implementation Options**:

#### Option A: Activity Name as Link (Simpler)

Make the activity name itself the link:

```svelte
<!-- Activity Name (Desktop) - MUST link to Strava -->
<div class="hidden flex-col justify-center md:flex">
	{#if row.contribution?.stravaActivityId}
		<a
			href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
			target="_blank"
			rel="noopener noreferrer"
			class="truncate font-mono text-xs text-white/80 uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
			style="color: #FC5200;"
		>
			{row.contribution.activityName || 'View on Strava'}
		</a>
		<span class="mt-1 text-[10px] text-gray-600">
			{formatDate(row.contribution.occurredAt)}
		</span>
	{:else}
		<span class="truncate font-mono text-xs text-white/80 uppercase">No Data</span>
	{/if}
</div>
```

#### Option B: Separate "View on Strava" Link (Recommended)

Keep activity name as text, add separate "View on Strava" link below:

```svelte
<!-- Activity Name (Desktop) - MUST link to Strava -->
<div class="hidden flex-col justify-center md:flex">
	{#if row.contribution?.stravaActivityId}
		<span class="truncate font-mono text-xs text-white/80 uppercase">
			{row.contribution.activityName || 'No Data'}
		</span>
		<a
			href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-1 font-mono text-[10px] font-bold uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
			style="color: #FC5200;"
		>
			View on Strava
		</a>
		<span class="mt-0.5 text-[10px] text-gray-600">
			{formatDate(row.contribution.occurredAt)}
		</span>
	{:else}
		<span class="truncate font-mono text-xs text-white/80 uppercase">No Data</span>
	{/if}
</div>
```

**Recommendation**: Use **Option B** because:

- Clearer separation between activity name and Strava link
- More explicit "View on Strava" text (required by guidelines)
- Better visual hierarchy
- Easier to scan

**Key Requirements**:

- ✅ Link format: `https://strava.com/activities/{stravaActivityId}`
- ✅ Text format: Must include "View on Strava" text
- ✅ Link styling: Underline + Orange (#FC5200) - **Option 2 from guidelines**
- ✅ Only link when `row.contribution.stravaActivityId` exists
- ✅ Opens in new tab: `target="_blank" rel="noopener noreferrer"`

**Data Verification**:

- Verify `row.contribution.stravaActivityId` is available in the `LeaderboardRow` type
- Check that `ChallengeContribution` schema includes `stravaActivityId` field (should be `bigint` from schema)

---

## Link Styling Requirements

Strava requires that links be **identifiable** using at least one of:

1. **Bold weight**: `font-bold`
2. **Underline**: `underline decoration-2 underline-offset-2`
3. **Orange color**: `#FC5200` (Strava brand orange)

**Recommended Approach**: Use **Option 2** (Underline + Orange) for maximum clarity and compliance.

**Implementation Pattern**:

```svelte
<a
	href="..."
	target="_blank"
	rel="noopener noreferrer"
	class="underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
	style="color: #FC5200;"
>
	Link Text
</a>
```

**Why This Works**:

- ✅ Underline makes it clearly clickable
- ✅ Orange (#FC5200) matches Strava brand guidelines
- ✅ Combined approach ensures maximum visibility
- ✅ Hover effect (white text) provides good UX without violating guidelines

---

## Files to Modify

### Priority 1: Critical Compliance

1. **`src/routes/dashboard/_components/LeaderboardRow.svelte`**
   - **Line ~72-77**: Convert athlete name `<span>` to conditional `<a>` tag
   - **Line ~86-93**: Convert activity name display to include "View on Strava" link
   - **Both changes**: Apply orange (#FC5200) + underline styling

2. **`src/routes/dashboard/_components/DashboardFooter.svelte`**
   - **Line ~37-46**: Verify logo implementation matches all requirements
   - **Optional**: Add "Powered by" text label before logo

### Priority 2: Verification

3. **`src/routes/dashboard/+page.svelte`**
   - **Line 50**: Verify `<DashboardFooter />` is included
   - Confirm footer appears on all dashboard pages showing Strava data

---

## Implementation Checklist

### Phase 1: Leaderboard Links (Critical)

- [ ] Update athlete name in `LeaderboardRow.svelte` to link to Strava
  - [ ] Add conditional check for `row.profile.stravaAthleteId`
  - [ ] Apply orange (#FC5200) + underline styling
  - [ ] Ensure `target="_blank" rel="noopener noreferrer"`
  - [ ] Test with users who have Strava IDs
  - [ ] Test with users who don't have Strava IDs (should show plain text)

- [ ] Update activity display in `LeaderboardRow.svelte` to link to Strava
  - [ ] Choose Option A or Option B implementation
  - [ ] Add conditional check for `row.contribution.stravaActivityId`
  - [ ] Include "View on Strava" text
  - [ ] Apply orange (#FC5200) + underline styling
  - [ ] Ensure `target="_blank" rel="noopener noreferrer"`
  - [ ] Test with contributions that have Strava activity IDs
  - [ ] Test with contributions that don't have IDs (should show "No Data")

### Phase 2: Footer Verification

- [ ] Verify `DashboardFooter.svelte` implementation
  - [ ] Confirm logo asset path is correct
  - [ ] Confirm logo links to `https://www.strava.com`
  - [ ] Verify logo is smaller than app branding
  - [ ] Verify logo is not modified/animated
  - [ ] Optional: Add "Powered by" text label

- [ ] Verify footer placement
  - [ ] Footer appears on dashboard page
  - [ ] Footer is separate from navigation branding
  - [ ] Footer is visible but not dominant

### Phase 3: Testing & Validation

- [ ] **Visual Testing**:
  - [ ] All athlete names with Strava IDs are clickable and orange
  - [ ] All activity entries with Strava IDs show "View on Strava" link
  - [ ] Links are clearly identifiable (underline + orange visible)
  - [ ] Footer logo is visible and properly sized
  - [ ] Mobile view maintains compliance

- [ ] **Functional Testing**:
  - [ ] Athlete links open correct Strava profile pages
  - [ ] Activity links open correct Strava activity pages
  - [ ] Links open in new tabs
  - [ ] Keyboard navigation works (Tab to focus, Enter to activate)
  - [ ] No broken links (404s) for valid Strava IDs

- [ ] **Compliance Verification**:
  - [ ] Logo placement follows all rules (separate, not prominent, unmodified)
  - [ ] Link styling uses required treatments (underline + orange)
  - [ ] "View on Strava" text appears for activities
  - [ ] All Strava data links back to Strava.com

---

## Code Examples

### Athlete Name Link (Complete Implementation)

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

### Activity Link (Option B - Recommended)

```svelte
<!-- Activity Name (Desktop) - MUST link to Strava with "View on Strava" text -->
<div class="hidden flex-col justify-center md:flex">
	{#if row.contribution?.stravaActivityId}
		<span class="truncate font-mono text-xs text-white/80 uppercase">
			{row.contribution.activityName || 'No Data'}
		</span>
		<a
			href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-1 font-mono text-[10px] font-bold uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
			style="color: #FC5200;"
		>
			View on Strava
		</a>
		<span class="mt-0.5 text-[10px] text-gray-600">
			{formatDate(row.contribution.occurredAt)}
		</span>
	{:else}
		<span class="truncate font-mono text-xs text-white/80 uppercase">No Data</span>
	{/if}
</div>
```

### Footer Logo (Enhanced with "Powered by" Text)

```svelte
<!-- Powered by Strava Logo - REQUIRED for compliance -->
<div class="flex items-center gap-2">
	<span class="font-mono text-[10px] tracking-widest text-white/40 uppercase">Powered by</span>
	<a
		href="https://www.strava.com"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-block opacity-80 transition-opacity hover:opacity-100"
	>
		<img src={stravaLogo} alt="Powered by Strava" class="h-6 w-auto" />
	</a>
</div>
```

---

## Edge Cases & Considerations

### Missing Strava IDs

- **Athlete without `stravaAthleteId`**: Display name as plain text (no link)
- **Activity without `stravaActivityId`**: Display "No Data" (no link)
- **Never create broken links**: Always check for ID existence before rendering `<a>` tag

### Data Type Verification

Before implementing, verify these fields exist in your types (see `src/lib/types/dashboard.ts` and `src/lib/db/schema.ts`):

- `row.profile.stravaAthleteId` - `number | null` (from `Profile` schema)
- `row.contribution.stravaActivityId` - `number | null` (from `ChallengeContribution` schema)

### Accessibility

- All links must be keyboard accessible (Tab navigation)
- Links should have clear focus states
- Screen readers should announce links appropriately
- `alt` text on logo image is required

### Mobile Considerations

- Orange links should remain visible on dark backgrounds
- Underlines should be clear but not overwhelming
- Touch targets should be adequate size (minimum 44x44px recommended)
- Footer logo should scale appropriately on small screens

---

## Testing Strategy

### Manual Testing Checklist

1. **Athlete Links**:
   - [ ] Click athlete name → Opens Strava profile in new tab
   - [ ] Verify URL format: `https://strava.com/athletes/{id}`
   - [ ] Test with athlete who has Strava ID
   - [ ] Test with athlete who doesn't have Strava ID (should be plain text)
   - [ ] Verify link color is orange (#FC5200)
   - [ ] Verify link has underline
   - [ ] Test keyboard navigation (Tab → Enter)

2. **Activity Links**:
   - [ ] Click "View on Strava" → Opens Strava activity in new tab
   - [ ] Verify URL format: `https://strava.com/activities/{id}`
   - [ ] Test with activity that has Strava ID
   - [ ] Test with activity that doesn't have Strava ID (should show "No Data")
   - [ ] Verify "View on Strava" text is visible
   - [ ] Verify link color is orange (#FC5200)
   - [ ] Verify link has underline
   - [ ] Test keyboard navigation (Tab → Enter)

3. **Footer Logo**:
   - [ ] Logo is visible on dashboard
   - [ ] Logo links to `https://www.strava.com`
   - [ ] Logo opens in new tab
   - [ ] Logo is smaller than app branding
   - [ ] Logo is clearly separated from app name
   - [ ] Logo is not animated or modified

### Visual Regression Testing

- [ ] Screenshot: Dashboard with athlete links
- [ ] Screenshot: Dashboard with activity links
- [ ] Screenshot: Dashboard footer with Strava logo
- [ ] Screenshot: Mobile view of all compliance elements
- [ ] Compare before/after to ensure design consistency

---

## Submission Preparation

When ready to submit for Community Application approval:

1. **Screenshots to Prepare**:
   - Full dashboard view showing leaderboard with linked athlete names
   - Close-up of activity column showing "View on Strava" links
   - Footer showing "Powered by Strava" logo
   - Mobile view demonstrating responsive compliance

2. **Documentation to Include**:
   - Brief explanation of logo placement rationale
   - Description of link styling implementation
   - Confirmation that all requirements are met

3. **Testing Evidence**:
   - List of test cases executed
   - Confirmation that all links work correctly
   - Accessibility testing results

---

## Resources

- [Strava API Brand Guidelines](https://www.strava.com/api/v3/oauth#branding)
- [Strava API Agreement](https://www.strava.com/legal/api)
- [Strava Developer Support](mailto:developers@strava.com)

---

## Verification on this branch

On this dashboard branch, the above changes are implemented in:

- `src/routes/dashboard/_components/LeaderboardRow.svelte` (athlete and activity links with orange `#FC5200` + underline styling, `target="_blank" rel="noopener noreferrer"`).
- `src/routes/dashboard/_components/DashboardFooter.svelte` (\"Powered by Strava\" logo linking to `https://www.strava.com`, visually separated from app branding).

Visual proof used for Community Application review is stored in:

- `docs/strava_compliance_proof/BeforeClick.png`
- `docs/strava_compliance_proof/AfterClickOnProfile.png`
- `docs/strava_compliance_proof/DashboardWithLinksToStrava.png`
- `docs/strava_compliance_proof/LandingPageWithStravaConnectionButton.png`

---

**Last Updated**: January 28, 2026  
**Related Documents**: `strava_compliance.md` (detailed requirements), `dashboard_styling_update.md` (design context)
