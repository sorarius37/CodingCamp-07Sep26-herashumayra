# Design Document: To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a single-page web application (SPA) built entirely with HTML, CSS, and Vanilla JavaScript. It runs in the browser with zero backend dependencies and persists all state via the browser's `localStorage` API.

The application is deployed as a static site (e.g., GitHub Pages) and consists of exactly three files:

- `index.html` — the single HTML entry point
- `css/style.css` — all styling and theme definitions
- `js/app.js` — all application logic

The UI is composed of four functional widgets arranged on one page:

1. **Greeting Widget** — displays real-time clock, date, and a time-of-day greeting
2. **Focus Timer** — a configurable Pomodoro countdown timer
3. **To-Do List** — full-featured task manager with add, edit, complete, delete, and sort
4. **Quick Links** — user-defined bookmarks rendered as clickable buttons

A global light/dark mode toggle and a settings panel expose user-configurable values (name, Pomodoro duration).

---

## Architecture

### High-Level Structure

The application follows a **module-per-concern** pattern within a single JavaScript file (`js/app.js`), organized into clearly separated modules using plain object literals / IIFEs. No build tool or module bundler is required.

```
index.html
  └── loads css/style.css
  └── loads js/app.js (deferred)
        ├── StorageService    — wrapper around localStorage
        ├── GreetingModule    — clock / date / greeting rendering
        ├── TimerModule       — Pomodoro countdown logic
        ├── TodoModule        — task CRUD + sort
        ├── LinksModule       — quick links CRUD
        ├── ThemeModule       — light/dark toggle
        ├── SettingsModule    — name + duration configuration
        └── App (init)        — bootstraps all modules on DOMContentLoaded
```

### Data Flow

```
DOMContentLoaded
  └── App.init()
        ├── StorageService hydrates each module
        ├── GreetingModule.start() → setInterval (1 s)
        ├── TimerModule.init()
        ├── TodoModule.render()
        ├── LinksModule.render()
        └── ThemeModule.apply()

User Action (e.g. "add task")
  └── TodoModule.addTask(text)
        ├── validate(text)
        ├── mutate in-memory tasks array
        ├── StorageService.saveTasks(tasks)
        └── TodoModule.render()
```

All state mutations follow the same three-step pattern: **validate → mutate → persist → render**.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single JS file, no build tools | Requirement 12 mandates no build step or runtime dependency |
| Module objects / IIFEs | Provides encapsulation without ES module syntax (avoids CORS issues on `file://`) |
| In-memory array as source of truth | Simple and fast; `localStorage` is kept in sync on every mutation |
| `setInterval` for clock and timer | Native browser API, no library needed |
| CSS custom properties for theming | Toggling a single `data-theme` attribute on `<body>` propagates all color changes instantly |
| `Result` return type on mutations | Keeps validation logic inside modules, not in event handlers; makes unit testing straightforward |

---

## Components and Interfaces

### StorageService

Centralizes all `localStorage` access. Catches quota errors and dispatches a custom DOM event for the UI to display a warning banner.

```js
StorageService = {
  KEYS: {
    TASKS:    'tld_tasks',
    LINKS:    'tld_links',
    USERNAME: 'tld_username',
    DURATION: 'tld_duration',
    THEME:    'tld_theme',
  },

  get(key)              → any | null,      // JSON.parse; returns null on error
  set(key, value)       → void,            // JSON.stringify; catches QuotaExceededError
  remove(key)           → void,

  loadTasks()           → Task[],
  saveTasks(tasks)      → void,

  loadLinks()           → LinkItem[],
  saveLinks(links)      → void,

  loadUserName()        → string | null,
  saveUserName(name)    → void,

  loadDuration()        → number,           // default: 25
  saveDuration(n)       → void,

  loadTheme()           → 'light' | 'dark', // default: 'light'
  saveTheme(theme)      → void,
}
```

### GreetingModule

Owns the clock interval and all greeting rendering logic. Pure helper functions are kept separate from DOM manipulation so they can be unit-tested independently.

```js
GreetingModule = {
  start()                          → void,   // kicks off setInterval(1000)
  stop()                           → void,

  // pure helpers (testable)
  getGreetingPrefix(hour: number)  → string, // one of four greeting strings
  formatDate(date: Date)           → string, // "Monday, 7 July 2025"
  buildGreeting(hour, name)        → string, // "Good Morning, Hera!" or "Good Morning"

  // private
  _render(now: Date, name: string) → void,
}
```

### TimerModule

Manages countdown state and controls. Exposes a clean state machine: `idle → running → paused → idle`.

```js
TimerModule = {
  init(durationMinutes: number) → void,
  start()                       → void,
  pause()                       → void,
  reset()                       → void,

  // pure helper (testable)
  formatTime(seconds: number)   → string,   // "MM:SS"

  // state (private)
  _state: 'idle' | 'running' | 'paused',
  _remaining: number,                        // seconds
  _intervalId: number | null,
}
```

Timer state machine:

```
idle  ──start()──▶ running ──pause()──▶ paused ──start()──▶ running
  ▲                   │                   │
  └───reset()─────────┘───────reset()─────┘
  └───reaches zero ───┘
```

### TodoModule

Manages an in-memory `Task[]` array. All mutations persist via `StorageService`.

```js
TodoModule = {
  init()                                → void,
  addTask(text: string)                 → Result,
  editTask(id: string, newText: string) → Result,
  toggleTask(id: string)                → void,
  deleteTask(id: string)                → void,
  sortTasks(criterion: SortCriterion)   → Task[],  // sorted copy; does NOT mutate storage
  getTaskSummary(tasks: Task[])         → { total: number, completed: number },
  render()                              → void,

  // private
  _tasks: Task[],
  _currentSort: SortCriterion,
}

type Result = { ok: true } | { ok: false, error: string }

type SortCriterion =
  | 'newest'     // creation date, descending
  | 'oldest'     // creation date, ascending
  | 'alpha-asc'  // A–Z
  | 'alpha-desc' // Z–A
  | 'status'     // incomplete first
```

### LinksModule

```js
LinksModule = {
  init()                              → void,
  addLink(label: string, url: string) → Result,
  deleteLink(id: string)              → void,
  isValidUrl(url: string)             → boolean, // must start with http:// or https://
  render()                            → void,

  // private
  _links: LinkItem[],
}
```

### ThemeModule

```js
ThemeModule = {
  init()                    → void,
  toggle()                  → void,
  apply(theme: Theme)       → void,  // sets data-theme on <body>
  current()                 → 'light' | 'dark',
}
```

### SettingsModule

```js
SettingsModule = {
  init()                       → void,
  saveUserName(name: string)   → void,
  saveDuration(input: any)     → Result,  // validates integer 1–120
}
```

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  text:      string,   // trimmed, non-empty
  done:      boolean,  // false on creation
  createdAt: number,   // Date.now() — milliseconds since epoch
}
```

### LinkItem

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty display name
  url:   string,  // must start with 'http://' or 'https://'
}
```

### Persisted Settings (primitive values in localStorage)

| Key | Type | Default | Description |
|---|---|---|---|
| `tld_username` | `string \| null` | `null` | User's display name |
| `tld_duration` | `number` | `25` | Pomodoro duration in minutes |
| `tld_theme` | `'light' \| 'dark'` | `'light'` | Active UI theme |
| `tld_tasks` | `Task[]` (JSON) | `[]` | Persisted task list |
| `tld_links` | `LinkItem[]` (JSON) | `[]` | Persisted quick links |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Greeting prefix covers all hours

*For any* integer hour in [0, 23], `getGreetingPrefix(hour)` returns exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night". The ranges are exhaustive and non-overlapping:
- hour ∈ [5, 11] → "Good Morning"
- hour ∈ [12, 17] → "Good Afternoon"
- hour ∈ [18, 20] → "Good Evening"
- hour ∈ [21, 23] ∪ [0, 4] → "Good Night"

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Greeting includes name when a name is provided

*For any* valid (non-empty, non-whitespace) User_Name and any hour in [0, 23], `buildGreeting(hour, name)` returns a string that starts with the correct prefix and contains the user's name.

**Validates: Requirements 1.7**

---

### Property 3: Date formatting contains all required parts

*For any* `Date` object, `formatDate(date)` returns a string that contains a valid day name (e.g. "Monday"), a day-of-month number (1–31), a month name (e.g. "January"), and a 4-digit year.

**Validates: Requirements 1.2**

---

### Property 4: User name storage round-trip

*For any* non-empty string `name`, after `StorageService.saveUserName(name)`, calling `StorageService.loadUserName()` returns `name`.

**Validates: Requirements 2.2, 2.4**

---

### Property 5: Duration storage round-trip

*For any* integer `n` in [1, 120], after `StorageService.saveDuration(n)`, calling `StorageService.loadDuration()` returns `n`.

**Validates: Requirements 4.2, 4.5**

---

### Property 6: Invalid duration is rejected and storage is unchanged

*For any* input value outside the integer range [1, 120] — including non-numeric strings, decimals, values < 1, and values > 120 — `SettingsModule.saveDuration(input)` returns `{ ok: false }` and the value in `localStorage` is not modified.

**Validates: Requirements 4.4**

---

### Property 7: Timer reset always restores the full duration

*For any* Pomodoro_Duration `d` in [1, 120] minutes and any elapsed time, after `TimerModule.reset()`, `TimerModule._remaining === d * 60`.

**Validates: Requirements 3.5**

---

### Property 8: Adding a task persists and is loadable

*For any* non-empty, non-whitespace string `text` that is not a case-insensitive duplicate of an existing incomplete task, after `TodoModule.addTask(text)`, `StorageService.loadTasks()` returns an array containing a task with `text === text.trim()`, `done === false`, and `createdAt ≤ Date.now()`.

**Validates: Requirements 5.2, 5.3**

---

### Property 9: Empty task text is always rejected

*For any* string whose `.trim()` result is `""`, `TodoModule.addTask(text)` returns `{ ok: false }` and the task list length is unchanged.

**Validates: Requirements 5.5**

---

### Property 10: Duplicate task text is always rejected

*For any* task list containing an incomplete task with text `t`, calling `TodoModule.addTask(t2)` where `t2.trim().toLowerCase() === t.toLowerCase()` returns `{ ok: false }` and the task list length is unchanged.

**Validates: Requirements 5.4**

---

### Property 11: Task edit persists correctly

*For any* task `id` in the current list and any non-empty, non-duplicate string `newText`, after `TodoModule.editTask(id, newText)`, the task with that `id` in `StorageService.loadTasks()` has `text === newText.trim()`.

**Validates: Requirements 6.3**

---

### Property 12: Empty or duplicate edit text is always rejected

*For any* task edit where the new text either trims to `""` or is a case-insensitive duplicate of another incomplete task, `TodoModule.editTask(id, text)` returns `{ ok: false }` and the task's text is unchanged in storage.

**Validates: Requirements 6.4, 6.6**

---

### Property 13: Toggle completion is an involution (round-trip)

*For any* task list and any task `id`, applying `TodoModule.toggleTask(id)` twice in sequence produces a task list functionally equivalent to the original — the task's `done` value is restored to what it was before the first toggle.

**Validates: Requirements 7.2, 7.3**

---

### Property 14: Delete removes exactly one task

*For any* task list and any task `id`, after `TodoModule.deleteTask(id)`, `StorageService.loadTasks()` does not contain any task with that `id`, and all other tasks are preserved unchanged.

**Validates: Requirements 7.6**

---

### Property 15: Sort does not mutate storage

*For any* task list and any `SortCriterion`, calling `TodoModule.sortTasks(criterion)` returns a correctly ordered array and `StorageService.loadTasks()` still returns the original unmodified order.

**Validates: Requirements 8.2**

---

### Property 16: Adding a link persists and is loadable

*For any* non-empty `label` and `url` starting with `"http://"` or `"https://"`, after `LinksModule.addLink(label, url)`, `StorageService.loadLinks()` contains a `LinkItem` with that exact label and url.

**Validates: Requirements 9.2**

---

### Property 17: Invalid URLs are rejected

*For any* string `url` that does not start with `"http://"` or `"https://"`, `LinksModule.addLink(label, url)` returns `{ ok: false }` and the links list is unchanged.

**Validates: Requirements 9.6**

---

### Property 18: Empty label or URL is rejected

*For any* `(label, url)` pair where either `label.trim()` or `url.trim()` is `""`, `LinksModule.addLink(label, url)` returns `{ ok: false }` and the links list is unchanged.

**Validates: Requirements 9.7**

---

### Property 19: Delete link removes exactly one item

*For any* links list and any link `id`, after `LinksModule.deleteLink(id)`, `StorageService.loadLinks()` does not contain any item with that `id`, and all other items are preserved unchanged.

**Validates: Requirements 9.5**

---

### Property 20: Task summary counts are always consistent

*For any* `Task[]` array, `TodoModule.getTaskSummary(tasks).total === tasks.length` and `TodoModule.getTaskSummary(tasks).completed === tasks.filter(t => t.done).length`.

**Validates: Requirements 5.7**

---

### Property 21: localStorage keys are isolated

*For any* combination of independently saved data (tasks, links, User_Name, duration, theme), saving one data type does not affect the loaded values of any other data type.

**Validates: Requirements 11.2**

---

## Error Handling

### localStorage Unavailability

`StorageService.set()` wraps all write operations in a `try/catch` for `QuotaExceededError` and any other `DOMException`. On failure it dispatches a custom DOM event `storage-error` that a top-level listener catches to display a non-blocking warning banner. Reads fall back to `null` / empty arrays when `getItem` returns `null`. JSON parsing errors are also caught and return `null`, causing modules to fall back to their default state.

```js
// StorageService.set pseudocode
set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    document.dispatchEvent(new CustomEvent('storage-error', { detail: e }));
  }
}

// StorageService.get pseudocode
get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
```

### Input Validation Errors

All mutation functions (`addTask`, `editTask`, `addLink`, `saveDuration`) return a `Result` type:

```js
{ ok: true }
{ ok: false, error: string }
```

The calling UI handler checks `result.ok` and renders the inline `error` message adjacent to the relevant input field when `ok` is `false`. The message is cleared on the next valid submission or when the input gains focus.

### Timer Edge Cases

- If `setInterval` fires after the timer has been paused (race condition), the guard `if (this._state !== 'running') return;` prevents incorrect state transitions.
- `formatTime(0)` always returns `"00:00"`.
- When the remaining time reaches zero, `clearInterval` is called and the audio alert fires before any further UI update.

### Duplicate Detection

Duplicate checking (for both task add and task edit) is performed via a case-insensitive trim comparison applied only against **incomplete** tasks. Completed tasks with the same text do not trigger a duplicate warning, allowing users to re-add a previously completed task.

---

## Testing Strategy

### Overview

This project uses a **dual testing approach**: example-based unit tests for specific behaviors and integration points, and property-based tests for universal correctness guarantees across a wide input space.

The property-based testing library is **[fast-check](https://github.com/dubzzz/fast-check)** (MIT license, zero runtime dependencies). It is included as a dev-only script tag in the test runner and is never bundled into the production build, preserving the zero-dependency requirement.

Test runner: **[Vitest](https://vitest.dev/)** configured with `jsdom` for DOM simulation. Each property test runs a **minimum of 100 iterations**.

---

### Unit Tests (Example-Based)

Focus areas:
- Timer state machine transitions: `idle → running → paused → idle` and `→ zero`
- `StorageService` fallback defaults when `localStorage` is empty or returns invalid JSON
- `isValidUrl` boundary cases (exactly `"http://"` prefix, mixed case, ftp://, etc.)
- `SettingsModule.saveDuration` boundary: 1, 120, 0, 121, `"abc"`, `1.5`
- Theme: `data-theme` attribute toggled correctly on `<body>`
- Page-load hydration: all modules receive stored data before first render

Avoid duplicating what property tests already cover (e.g., no need to write 24 separate unit tests for each greeting hour).

---

### Property-Based Tests

Each property maps directly to a Correctness Property in this document. Tests are tagged:

> `// Feature: todo-life-dashboard, Property N: <property title>`

All property tests run ≥ 100 iterations.

| Property | Module | fast-check Arbitraries |
|---|---|---|
| P1: Greeting prefix covers all hours | GreetingModule | `fc.integer({ min: 0, max: 23 })` |
| P2: Greeting includes name when provided | GreetingModule | `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)`, `fc.integer({ min: 0, max: 23 })` |
| P3: Date formatting contains all required parts | GreetingModule | `fc.date()` |
| P4: User name storage round-trip | StorageService | `fc.string({ minLength: 1 })` |
| P5: Duration storage round-trip | StorageService | `fc.integer({ min: 1, max: 120 })` |
| P6: Invalid duration rejected | SettingsModule | `fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 121 }), fc.float().filter(n => !Number.isInteger(n)), fc.string())` |
| P7: Timer reset restores duration | TimerModule | `fc.integer({ min: 1, max: 120 })`, `fc.nat()` (elapsed seconds) |
| P8: Adding task persists | TodoModule | `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` (unique text) |
| P9: Empty task rejected | TodoModule | `fc.string().filter(s => s.trim() === '')` |
| P10: Duplicate task rejected | TodoModule | arbitrary task array + matching string |
| P11: Task edit persists | TodoModule | arbitrary task array, valid new text |
| P12: Empty/duplicate edit rejected | TodoModule | arbitrary task array, empty or duplicate new text |
| P13: Toggle is involution | TodoModule | arbitrary task array + valid task id |
| P14: Delete removes exactly one task | TodoModule | `fc.array(fc.record({ id: fc.uuid(), text: fc.string(), done: fc.boolean(), createdAt: fc.nat() }))` + valid id |
| P15: Sort does not mutate storage | TodoModule | arbitrary task array + `fc.constantFrom('newest','oldest','alpha-asc','alpha-desc','status')` |
| P16: Adding link persists | LinksModule | `fc.string({ minLength: 1 })`, `fc.webUrl()` |
| P17: Invalid URLs rejected | LinksModule | `fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))` |
| P18: Empty label/URL rejected | LinksModule | pairs where label or url trims to `''` |
| P19: Delete link removes exactly one | LinksModule | arbitrary links array + valid link id |
| P20: Task summary counts consistent | TodoModule | `fc.array(fc.record({ done: fc.boolean() }))` |
| P21: localStorage keys isolated | StorageService | independent arbitrary values for each of the 5 data types |

---

### Integration Tests

The following require integration-level tests (1–3 examples each):

| Behavior | Requirements |
|---|---|
| All data types hydrate from pre-populated `localStorage` on page load | 11.3 |
| `localStorage` unavailability shows non-blocking warning | 11.4 |
| Clicking a Quick Link calls `window.open(url, '_blank')` | 9.3 |
| Theme toggle applies `data-theme` attribute to `<body>` | 10.2 |
| Timer reaching zero stops the interval and calls `audio.play()` | 3.6, 3.7 |
| Saving a new duration while timer is idle resets the display | 4.3 |
| New User_Name updates the greeting DOM without page reload | 2.3 |

---

### Not Covered by Automated Tests

Verified by manual testing or tooling audits:

| What | How |
|---|---|
| Cross-browser compatibility (Chrome, Firefox, Edge, Safari) | Manual testing in each browser |
| Load time ≤ 2 seconds | Lighthouse performance audit |
| File structure (one HTML, one CSS, one JS) | File-system check |
| Visual differentiation of completed vs. incomplete tasks | Manual visual inspection |
| Accessible color contrast in both themes | Automated WCAG contrast checker + manual audit |
