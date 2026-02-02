# Svelte 5 Large-Scale Project Architecture & Context

This document defines the architectural patterns, folder structure, and state management strategies for this Svelte 5 project. Use this as context when generating code.

## 1. Core Principles

- **Reactivity**: Use Svelte 5 Runes ($state, $derived, $effect) exclusively. Avoid legacy writable stores.
- **Logic Extraction**: Business logic lives in .svelte.ts (TypeScript) classes, not in .svelte (UI) components.
- **Colocation**: Code is organized by Feature/Route, not by file type. Related components, logic, and API calls live together in the route folder.
- **Smart Objects**: Transform raw data (POJOs) into Class Instances immediately upon data loading.

## 2. Directory Structure

### Global vs. Feature

- **`src/lib/_`**: Generic, app-wide utilities and UI components (e.g., Buttons, Form Inputs, Date Formatters).
- **`src/routes/_`**: Domain-specific logic. If a component or class is only used for the "Projects" feature, it belongs in `src/routes/projects/...`.

### The Tree

```
src/
├── lib/
│   ├── components/ui/  # Generic UI (shadcn-svelte, etc.)
│   ├── db/             # Database Clients (Drizzle, Prisma, Firebase)
│   ├── utils/          # Pure helper functions
│   └── state/          # GLOBAL State Singletons
│       ├── auth.svelte.ts  # (See svelte5_auth_pattern.md)
│       └── theme.svelte.ts
│
├── routes/
│   ├── +layout.svelte  # Main App Shell
│   │
│   │   # --- FEATURE: PROJECTS ---
│   ├── projects/[id]/
│   │   ├── +layout.svelte      # Project-specific layout
│   │   ├── +page.svelte        # Entry point view
│   │   ├── +page.server.ts     # Server-side data loading
│   │   │
│   │   │   # LOGIC (Private folder)
│   │   ├── _logic/
│   │   │   ├── Project.svelte.ts  # Parent Class (Manager)
│   │   │   └── Task.svelte.ts     # Child Class (Item)
│   │   │
│   │   │   # COMPONENTS (Private folder)
│   │   ├── _components/
│   │   │   ├── ProjectHeader.svelte
│   │   │   └── KanbanBoard.svelte
│   │   │
│   │   └── settings/  # Sub-route
│   │       └── +page.svelte
│   │
│   └── (auth)/  # Auth routes
```

## 3. State Management Patterns

### Tier 1: Global State (Singleton)

Used for: Theme, Toasts, User Session.

Pattern: Export a const instance of a class.

```typescript
// src/lib/state/theme.svelte.ts
class ThemeState {
    mode: 'light' | 'dark';

    constructor() {
        this.mode = $state('light');
    }

    toggle() {
        this.mode = this.mode === 'light' ? 'dark' : 'light';
    }
}

export const theme = new ThemeState();
```

### Tier 2: Feature/Page State (Context)

Used for: Complex page data that needs to reset on navigation (e.g., A specific Project).

Pattern: Initialize in +page.svelte or +layout.svelte, share via setContext.

```typescript
// src/routes/projects/[id]/_logic/Project.svelte.ts
import { setContext, getContext } from 'svelte';

const KEY = Symbol('PROJECT_CTX');

export class Project {
    // ... logic ...
}

export function initProject(data: any) {
    return setContext(KEY, new Project(data));
}

export function getProject() {
    return getContext(KEY) as Project;
}
```

### Tier 3: Local Component State

Used for: Dropdown open/close, simple form inputs.

Pattern: Use $state directly inside the .svelte component.

## 4. The "Smart Object" Pattern (Composition)

Do not manage an array of objects inside a single massive class. Instead, create a hierarchy of classes.

### The Child Class (The Item)

Responsible for its own state (isEditing, isLoading) and validation.

```typescript
// src/routes/projects/[id]/_logic/Task.svelte.ts
export class Task {
    // Declare properties with types
    id: string;
    title: string;
    status: 'todo' | 'done';
    isEditing: boolean;

    constructor(data: { id: string; title: string; status: 'todo' | 'done' }) {
        // Initialize state in constructor
        this.id = data.id;
        this.title = $state(data.title);
        this.status = $state(data.status);

        // UI State (Not persisted to DB)
        this.isEditing = $state(false);
    }

    // Helper for JSON.stringify to remove UI state when sending to API
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            status: this.status
        };
    }

    async updateTitle(newTitle: string) {
        this.title = newTitle;
        this.isEditing = false;
        // API call logic here...
    }
}
```

### The Parent Class (The Manager)

Responsible for the collection (Add, Remove, Reorder, Filter).

```typescript
// src/routes/projects/[id]/_logic/Project.svelte.ts
import { Task } from './Task.svelte.ts';

export class Project {
    tasks: Task[];
    completedCount: number;

    constructor(rawTasks: any[]) {
        // Hydrate raw data into Class Instances
        this.tasks = $state(rawTasks.map(t => new Task(t)));

        // Derived values update automatically
        this.completedCount = $derived(this.tasks.filter(t => t.status === 'done').length);
    }

    removeTask(id: string) {
        this.tasks = this.tasks.filter(t => t.id !== id);
    }
}
```

## 5. Usage in Components

Components should receive Class Instances as props, not raw data.

```svelte
<!-- src/routes/projects/[id]/+page.svelte -->
<script lang="ts">
    import { initProject } from './_logic/Project.svelte.ts';
    import TaskItem from './_components/TaskItem.svelte';

    let { data } = $props();
    
    // Initialize State Logic
    const project = initProject(data.tasks);
</script>

<h1>{project.completedCount} Completed</h1>

{#each project.tasks as task (task.id)}
    <!-- Pass the class instance -->
    <TaskItem {task} />
{/each}
```

```svelte
<!-- src/routes/projects/[id]/_components/TaskItem.svelte -->
<script lang="ts">
    import type { Task } from '../_logic/Task.svelte.ts';
    let { task } = $props<{ task: Task }>();
</script>

<!-- Fine-grained reactivity: modifying task.title here only updates this DOM node -->
<input bind:value={task.title} />
```

## 6. Dashboard Feature Example

The `dashboard` route in this project follows the same feature‑oriented pattern:

```text
src/routes/dashboard/
  +page.svelte          # Initializes context and renders the dashboard shell
  +page.server.ts       # Loads challenges and participants from the database
  loader.server.ts      # Shared loader logic
  _logic/
    context.ts          # setDashboardContext / getDashboardContext
    DashboardUI.svelte.ts
    ChallengeUI.svelte.ts
    LeaderboardUI.svelte.ts
  _components/
    DashboardNav.svelte
    ChallengeHero.svelte
    LeaderboardSection.svelte
    LeaderboardTabs.svelte
    LeaderboardTable.svelte
    LeaderboardRow.svelte
    ChallengeDetails.svelte
    ChallengeStatsGrid.svelte
    DashboardFooter.svelte
```

Page‑level components (`+page.svelte`, `+page.server.ts`) are thin: they delegate all interactive behavior to the `_logic` classes via context, while `_components` focus purely on rendering and user interaction.
