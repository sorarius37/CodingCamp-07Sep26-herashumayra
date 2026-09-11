# Implementation Plan: To-Do Life Dashboard

## Overview

Implement a single-page web application using HTML, CSS, and Vanilla JavaScript with no build tools or external runtime dependencies. All state is persisted via `localStorage`. The app consists of exactly three files: `index.html`, `css/style.css`, and `js/app.js`. Modules are organized as plain object literals / IIFEs inside the single JS file.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - [x] 1.1 Create `index.html` with semantic HTML5 structure
    - Create the three-file layout: `index.html`, `css/style.css`, `js/app.js`
    - Add `<link>` to `css/style.css` and `<script defer src="js/app.js">` in `index.html`
    - Add the four widget sections as `<section>` elements: `#greeting`, `#timer`, `#todo`, `#quick-links`
    - Add a settings panel `<section id="settings">` with inputs for User_Name and Pomodoro_Duration
    - Add a theme toggle `<button id="theme-toggle">` in the header
    - Add a `<div id="storage-warning" hidden>` banner for the localStorage quota error
    - _Requirements: 12.2, 12.4_

  - [x] 1.2 Set up `css/style.css` with CSS custom properties for theming
    - Define `:root` variables for light theme colors (`--bg`, `--surface`, `--text`, `--accent`, etc.)
    - Define `[data-theme="dark"]` overrides for dark theme colors
    - Add base reset styles, font stack, and layout grid for the dashboard
    - Add `.visually-hidden` and other utility classes
    - _Requirements: 10.2, 10.5, 12.1_

  - [x] 1.3 Set up the `js/app.js` skeleton with module stubs and `App.init()`
    - Declare module object stubs: `StorageService`, `GreetingModule`, `TimerModule`, `TodoModule`, `LinksModule`, `ThemeModule`, `SettingsModule`, `App`
    - Wire `App.init()` to `DOMContentLoaded` and call each module's `init()` / `start()` in order
    - _Requirements: 12.2, 12.4_

- [x] 2. Implement StorageService
  - [x] 2.1 Implement `StorageService` with all CRUD methods
    - Define `KEYS` object with the five storage keys: `tld_tasks`, `tld_links`, `tld_username`, `tld_duration`, `tld_theme`
    - Implement `get(key)` with `JSON.parse` and `try/catch` returning `null` on error
    - Implement `set(key, value)` with `JSON.stringify` and `try/catch`; on `QuotaExceededError` dispatch `storage-error` custom event on `document`
    - Implement `remove(key)`
    - Implement typed helpers: `loadTasks()`, `saveTasks()`, `loadLinks()`, `saveLinks()`, `loadUserName()`, `saveUserName()`, `loadDuration()` (default 25), `saveDuration()`, `loadTheme()` (default `'light'`), `saveTheme()`
    - _Requirements: 11.1, 11.2, 11.4_

  - [ ]* 2.2 Write property test for user name storage round-trip (Property 4)
    - **Property 4: User name storage round-trip**
    - **Validates: Requirements 2.2, 2.4**
    - Use `fc.string({ minLength: 1 })` — for any non-empty name, `saveUserName(name)` then `loadUserName()` must return `name`

  - [ ]* 2.3 Write property test for duration storage round-trip (Property 5)
    - **Property 5: Duration storage round-trip**
    - **Validates: Requirements 4.2, 4.5**
    - Use `fc.integer({ min: 1, max: 120 })` — for any valid duration `n`, save then load must return `n`

  - [ ]* 2.4 Write property test for localStorage key isolation (Property 21)
    - **Property 21: localStorage keys are isolated**
    - **Validates: Requirements 11.2**
    - Save arbitrary independent values for all five data types; verify loading one does not affect others

- [x] 3. Implement ThemeModule
  - [x] 3.1 Implement `ThemeModule` with `init()`, `apply()`, `toggle()`, and `current()`
    - `init()`: load theme from `StorageService.loadTheme()` and call `apply()`
    - `apply(theme)`: set `document.body.dataset.theme = theme`
    - `toggle()`: flip between `'light'` and `'dark'`, call `apply()`, then `StorageService.saveTheme()`
    - `current()`: return `document.body.dataset.theme`
    - Bind the `#theme-toggle` button click to `ThemeModule.toggle()`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 3.2 Write unit tests for ThemeModule
    - Test `apply('dark')` sets `data-theme="dark"` on `<body>`
    - Test `toggle()` flips from light to dark and back
    - Test `init()` applies the loaded theme before first render
    - _Requirements: 10.2, 10.4_

- [x] 4. Implement GreetingModule
  - [x] 4.1 Implement pure helpers: `getGreetingPrefix(hour)`, `formatDate(date)`, `buildGreeting(hour, name)`
    - `getGreetingPrefix(hour)`: return "Good Morning" for hours 5–11, "Good Afternoon" for 12–17, "Good Evening" for 18–20, "Good Night" for 21–23 and 0–4
    - `formatDate(date)`: return string like "Monday, 7 July 2025" using `toLocaleDateString` or manual formatting
    - `buildGreeting(hour, name)`: compose prefix + optional name (e.g., "Good Morning, Hera!" or "Good Morning")
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 4.2 Write property test for greeting prefix coverage (Property 1)
    - **Property 1: Greeting prefix covers all hours**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Use `fc.integer({ min: 0, max: 23 })` — result must be one of the four strings; ranges exhaustive and non-overlapping

  - [ ]* 4.3 Write property test for greeting includes name when provided (Property 2)
    - **Property 2: Greeting includes name when a name is provided**
    - **Validates: Requirements 1.7**
    - Use `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` and `fc.integer({ min: 0, max: 23 })`

  - [ ]* 4.4 Write property test for date formatting (Property 3)
    - **Property 3: Date formatting contains all required parts**
    - **Validates: Requirements 1.2**
    - Use `fc.date()` — result must contain a day name, a day number, a month name, and a 4-digit year

  - [x] 4.5 Implement `GreetingModule._render()` and `start()` / `stop()`
    - `start()`: read User_Name from `StorageService`, call `_render()`, then start a `setInterval(1000)` that calls `_render()` each tick
    - `_render(now, name)`: update the `#greeting` DOM elements for time, date, and greeting text
    - `stop()`: clear the interval
    - _Requirements: 1.1, 1.7, 1.8_

- [x] 5. Implement SettingsModule
  - [x] 5.1 Implement `SettingsModule.saveUserName(name)` and bind the name input
    - Trim the input value; if non-empty, call `StorageService.saveUserName(name)` and call `GreetingModule._render()` immediately with the new name; if empty, call `StorageService.remove(KEYS.USERNAME)` and re-render greeting without a name
    - Show inline validation if the name field submission results in clearing the stored name
    - Pre-populate the name input on `init()` from `StorageService.loadUserName()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Implement `SettingsModule.saveDuration(input)` and bind the duration input
    - Validate input is a whole integer in [1, 120]; return `{ ok: false, error: '...' }` otherwise and show inline validation message
    - On valid input: call `StorageService.saveDuration(n)` and, if timer is idle, call `TimerModule.init(n)` to reset the display
    - Pre-populate the duration input on `init()` from `StorageService.loadDuration()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.3 Write property test for invalid duration rejection (Property 6)
    - **Property 6: Invalid duration is rejected and storage is unchanged**
    - **Validates: Requirements 4.4**
    - Use `fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 121 }), fc.float().filter(n => !Number.isInteger(n)), fc.string())` — must return `{ ok: false }` and not mutate storage

- [x] 6. Implement TimerModule
  - [x] 6.1 Implement `TimerModule.formatTime(seconds)` pure helper
    - Return `"MM:SS"` zero-padded string; `formatTime(0)` must return `"00:00"`
    - _Requirements: 3.3, 3.6_

  - [x] 6.2 Implement `TimerModule.init()`, `start()`, `pause()`, and `reset()` with state machine
    - `init(durationMinutes)`: set `_remaining = durationMinutes * 60`, `_state = 'idle'`, update the timer display
    - `start()`: only runs when `_state` is `'idle'` or `'paused'`; set `_state = 'running'`; start `setInterval(1000)` that decrements `_remaining`, calls `_updateDisplay()`, and on zero calls `_onComplete()`; update button enable/disable states
    - `pause()`: only when `_state === 'running'`; clear interval, set `_state = 'paused'`; update button states
    - `reset()`: clear interval, reload duration from `StorageService.loadDuration()`, set `_state = 'idle'`, call `_updateDisplay()`, update button states
    - Guard in interval callback: `if (this._state !== 'running') return;` to prevent race conditions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.9_

  - [x] 6.3 Implement `TimerModule._onComplete()` with audible alert
    - Call `clearInterval`, set `_remaining = 0`, `_state = 'idle'`, update display to `"00:00"`
    - Create and play an `AudioContext`-based beep or use `new Audio(...)` to emit the audible alert
    - _Requirements: 3.6, 3.7_

  - [ ]* 6.4 Write property test for timer reset restoring full duration (Property 7)
    - **Property 7: Timer reset always restores the full duration**
    - **Validates: Requirements 3.5**
    - Use `fc.integer({ min: 1, max: 120 })` and `fc.nat()` (elapsed seconds) — after `reset()`, `_remaining` must equal `d * 60`

  - [ ]* 6.5 Write unit tests for TimerModule state machine
    - Test idle→running on `start()`; running→paused on `pause()`; paused→running on `start()`; any→idle on `reset()`
    - Test start control is disabled while running; pause control is disabled while idle
    - _Requirements: 3.2, 3.4, 3.5, 3.8, 3.9_

- [x] 7. Implement TodoModule
  - [x] 7.1 Implement `TodoModule.init()` — load tasks from storage
    - Load `Task[]` from `StorageService.loadTasks()` into `_tasks`
    - Set default `_currentSort = 'newest'`
    - _Requirements: 5.6_

  - [x] 7.2 Implement `TodoModule.addTask(text)` with duplicate detection
    - Trim `text`; return `{ ok: false }` if empty
    - Check case-insensitive match against existing incomplete tasks; return `{ ok: false }` if duplicate
    - Create a `Task` object: `{ id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() }`
    - Push to `_tasks`, call `StorageService.saveTasks()`, call `render()`
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.3 Write property test for adding task persists (Property 8)
    - **Property 8: Adding a task persists and is loadable**
    - **Validates: Requirements 5.2, 5.3**
    - Use `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)` with unique text; verify `StorageService.loadTasks()` contains matching task

  - [ ]* 7.4 Write property test for empty task rejection (Property 9)
    - **Property 9: Empty task text is always rejected**
    - **Validates: Requirements 5.5**
    - Use `fc.string().filter(s => s.trim() === '')` — must return `{ ok: false }` and list length unchanged

  - [ ]* 7.5 Write property test for duplicate task rejection (Property 10)
    - **Property 10: Duplicate task text is always rejected**
    - **Validates: Requirements 5.4**
    - Arbitrary task array with an incomplete task; adding a case-insensitive match must return `{ ok: false }` and list length unchanged

  - [x] 7.6 Implement `TodoModule.editTask(id, newText)`
    - Trim `newText`; return `{ ok: false }` if empty
    - Check case-insensitive duplicate against other incomplete tasks; return `{ ok: false }` if match
    - Mutate the matching task's `text`, call `StorageService.saveTasks()`, call `render()`
    - _Requirements: 6.3, 6.4, 6.6_

  - [ ]* 7.7 Write property test for task edit persists (Property 11)
    - **Property 11: Task edit persists correctly**
    - **Validates: Requirements 6.3**
    - Arbitrary task array; valid non-duplicate `newText`; after edit, loaded task must have `text === newText.trim()`

  - [ ]* 7.8 Write property test for empty/duplicate edit rejection (Property 12)
    - **Property 12: Empty or duplicate edit text is always rejected**
    - **Validates: Requirements 6.4, 6.6**
    - Arbitrary task array; empty or duplicate new text must return `{ ok: false }` and leave storage unchanged

  - [x] 7.9 Implement `TodoModule.toggleTask(id)` and `deleteTask(id)`
    - `toggleTask(id)`: find task by id, flip `done`, call `StorageService.saveTasks()`, call `render()`
    - `deleteTask(id)`: filter out task by id, call `StorageService.saveTasks()`, call `render()`
    - _Requirements: 7.2, 7.3, 7.6_

  - [ ]* 7.10 Write property test for toggle involution (Property 13)
    - **Property 13: Toggle completion is an involution (round-trip)**
    - **Validates: Requirements 7.2, 7.3**
    - Arbitrary task array + valid id; two toggles must restore original `done` value

  - [ ]* 7.11 Write property test for delete removes exactly one task (Property 14)
    - **Property 14: Delete removes exactly one task**
    - **Validates: Requirements 7.6**
    - Use `fc.array(fc.record({...}))` + valid id; deleted id absent, all others preserved

  - [x] 7.12 Implement `TodoModule.sortTasks(criterion)` and `getTaskSummary(tasks)`
    - `sortTasks(criterion)`: return a sorted copy without mutating `_tasks` or calling `StorageService.saveTasks()`; support all five `SortCriterion` values
    - `getTaskSummary(tasks)`: return `{ total: tasks.length, completed: tasks.filter(t => t.done).length }`
    - _Requirements: 8.1, 8.2, 8.3, 5.7_

  - [ ]* 7.13 Write property test for sort does not mutate storage (Property 15)
    - **Property 15: Sort does not mutate storage**
    - **Validates: Requirements 8.2**
    - Use arbitrary task array + `fc.constantFrom('newest','oldest','alpha-asc','alpha-desc','status')`; storage must return original order after sort

  - [ ]* 7.14 Write property test for task summary counts (Property 20)
    - **Property 20: Task summary counts are always consistent**
    - **Validates: Requirements 5.7**
    - Use `fc.array(fc.record({ done: fc.boolean() }))` — `total === tasks.length` and `completed === filter(done).length`

  - [x] 7.15 Implement `TodoModule.render()`
    - Render each task as a list item with: completion toggle checkbox, display text (or editable input when in edit mode), edit button, delete button
    - Apply strikethrough + reduced opacity to completed tasks
    - Apply current sort via `sortTasks(_currentSort)` before rendering
    - Render summary line using `getTaskSummary()`
    - Bind the sort control `<select>` to update `_currentSort` and call `render()`
    - Show inline validation messages for add/edit errors adjacent to their inputs
    - _Requirements: 5.6, 5.7, 6.1, 6.2, 6.5, 7.1, 7.4, 7.5, 8.1, 8.3_

- [x] 8. Checkpoint — verify core modules
  - Ensure StorageService, ThemeModule, GreetingModule, SettingsModule, TimerModule, and TodoModule are wired in `App.init()` and pass all their respective tests. Ask the user if any questions arise.

- [x] 9. Implement LinksModule
  - [x] 9.1 Implement `LinksModule.isValidUrl(url)` and `addLink(label, url)`
    - `isValidUrl(url)`: return `true` only if `url.startsWith('http://')` or `url.startsWith('https://')`
    - `addLink(label, url)`: trim both; return `{ ok: false }` if either is empty; return `{ ok: false }` if `!isValidUrl(url)`; create `LinkItem`, push to `_links`, call `StorageService.saveLinks()`, call `render()`
    - _Requirements: 9.1, 9.2, 9.6, 9.7_

  - [ ]* 9.2 Write property test for adding link persists (Property 16)
    - **Property 16: Adding a link persists and is loadable**
    - **Validates: Requirements 9.2**
    - Use `fc.string({ minLength: 1 })` and `fc.webUrl()` — after `addLink`, `loadLinks()` must contain matching item

  - [ ]* 9.3 Write property test for invalid URL rejection (Property 17)
    - **Property 17: Invalid URLs are rejected**
    - **Validates: Requirements 9.6**
    - Use `fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))` — must return `{ ok: false }` unchanged

  - [ ]* 9.4 Write property test for empty label/URL rejection (Property 18)
    - **Property 18: Empty label or URL is rejected**
    - **Validates: Requirements 9.7**
    - Pairs where `label.trim()` or `url.trim()` is `""` — must return `{ ok: false }`

  - [x] 9.5 Implement `LinksModule.deleteLink(id)` and `render()`
    - `deleteLink(id)`: filter out link by id, call `StorageService.saveLinks()`, call `render()`
    - `render()`: render each `LinkItem` as a `<button>` that opens `url` in a new tab via `window.open(url, '_blank')`; render a delete control per item; bind add-link form to `addLink()`
    - _Requirements: 9.3, 9.4, 9.5, 9.8_

  - [ ]* 9.6 Write property test for delete link removes exactly one (Property 19)
    - **Property 19: Delete link removes exactly one item**
    - **Validates: Requirements 9.5**
    - Arbitrary links array + valid id; deleted id absent, all others preserved

- [x] 10. Implement page-load hydration and error handling
  - [x] 10.1 Wire full page-load hydration in `App.init()`
    - Before any render: call `ThemeModule.init()`, then `GreetingModule.start()`, `SettingsModule.init()`, `TimerModule.init(StorageService.loadDuration())`, `TodoModule.init()` + `TodoModule.render()`, `LinksModule.init()` + `LinksModule.render()`
    - Ensure all stored data is applied before the first visible render
    - _Requirements: 11.3, 4.5, 4.6, 5.6, 9.8, 10.4_

  - [x] 10.2 Implement the `storage-error` listener and warning banner
    - Listen for the `storage-error` custom event on `document`
    - On event: unhide `#storage-warning` div and populate it with a non-blocking message (e.g., "Storage unavailable — data cannot be saved.")
    - _Requirements: 11.4_

  - [ ]* 10.3 Write integration tests for page-load hydration and storage error banner
    - Test all data types (tasks, links, username, duration, theme) hydrate correctly when pre-populated in `localStorage` before page load
    - Test `storage-error` event causes the `#storage-warning` banner to become visible
    - _Requirements: 11.3, 11.4_

- [x] 11. UI polish — layout, typography, and responsive design
  - [x] 11.1 Complete CSS layout for all four widgets and settings panel
    - Implement CSS grid or flexbox dashboard layout that positions all four widgets visibly on a single page
    - Ensure the layout is readable on both desktop and tablet viewport widths (≥ 768 px)
    - Style the storage warning banner as a non-intrusive top-bar or snackbar
    - _Requirements: 12.1, 12.3_

  - [x] 11.2 Style completed vs. incomplete tasks and timer button states
    - Apply `text-decoration: line-through` and reduced `opacity` to completed task items
    - Disable (grey out) the start button while the timer is running; disable the pause button while idle
    - Style inline validation error messages in a distinct color adjacent to their input fields
    - _Requirements: 7.4, 3.8, 3.9_

  - [ ]* 11.3 Write unit test for completed task visual class
    - Test that a completed task's DOM element has the CSS class or attribute that triggers strikethrough/opacity
    - _Requirements: 7.4_

- [x] 12. Final checkpoint — full integration
  - Ensure all modules are wired together in `App.init()`, all tests pass, the three-file structure is intact, and the app loads correctly by opening `index.html` directly in a browser (no server required). Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at meaningful milestones
- Property tests validate universal correctness guarantees across a wide input space; unit tests cover specific examples and edge cases
- The test setup requires `vitest` + `jsdom` + `fast-check` as dev-only dependencies; they are never bundled into the production build, preserving the zero-dependency requirement (Requirement 12.4)
- Duplicate detection applies only to **incomplete** tasks — completed tasks with the same text do not block re-adding
- `crypto.randomUUID()` is available in all modern browsers (Chrome, Firefox, Edge, Safari); use `Date.now().toString()` as a fallback for older environments

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["5.1", "5.2", "6.1"] },
    { "id": 5, "tasks": ["5.3", "6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4", "6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2"] },
    { "id": 8, "tasks": ["7.3", "7.4", "7.5", "7.6"] },
    { "id": 9, "tasks": ["7.7", "7.8", "7.9"] },
    { "id": 10, "tasks": ["7.10", "7.11", "7.12"] },
    { "id": 11, "tasks": ["7.13", "7.14", "7.15", "9.1"] },
    { "id": 12, "tasks": ["9.2", "9.3", "9.4", "9.5"] },
    { "id": 13, "tasks": ["9.6", "10.1"] },
    { "id": 14, "tasks": ["10.2"] },
    { "id": 15, "tasks": ["10.3", "11.1"] },
    { "id": 16, "tasks": ["11.2"] },
    { "id": 17, "tasks": ["11.3"] }
  ]
}
```
