'use strict';

// ---------------------------------------------------------------------------
// StorageService — centralises all localStorage access
// ---------------------------------------------------------------------------
const StorageService = {
  KEYS: {
    TASKS:    'tld_tasks',
    LINKS:    'tld_links',
    USERNAME: 'tld_username',
    DURATION: 'tld_duration',
    THEME:    'tld_theme',
  },

  /** @returns {any|null} */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /** @returns {void} */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      document.dispatchEvent(new CustomEvent('storage-error', { detail: e }));
    }
  },

  /** @returns {void} */
  remove(key) {
    localStorage.removeItem(key);
  },

  /** @returns {Task[]} */
  loadTasks() {
    return this.get(this.KEYS.TASKS) ?? [];
  },

  /** @returns {void} */
  saveTasks(tasks) {
    this.set(this.KEYS.TASKS, tasks);
  },

  /** @returns {LinkItem[]} */
  loadLinks() {
    return this.get(this.KEYS.LINKS) ?? [];
  },

  /** @returns {void} */
  saveLinks(links) {
    this.set(this.KEYS.LINKS, links);
  },

  /** @returns {string|null} */
  loadUserName() {
    return this.get(this.KEYS.USERNAME);
  },

  /** @returns {void} */
  saveUserName(name) {
    this.set(this.KEYS.USERNAME, name);
  },

  /** @returns {number} default 25 */
  loadDuration() {
    const stored = this.get(this.KEYS.DURATION);
    return (typeof stored === 'number' && Number.isInteger(stored)) ? stored : 25;
  },

  /** @returns {void} */
  saveDuration(n) {
    this.set(this.KEYS.DURATION, n);
  },

  /** @returns {'light'|'dark'} default 'light' */
  loadTheme() {
    const stored = this.get(this.KEYS.THEME);
    return stored === 'dark' ? 'dark' : 'light';
  },

  /** @returns {void} */
  saveTheme(theme) {
    this.set(this.KEYS.THEME, theme);
  },
};

// ---------------------------------------------------------------------------
// GreetingModule — clock, date, and greeting rendering
// ---------------------------------------------------------------------------
const GreetingModule = {
  /** Active interval ID or null. @type {number|null} */
  _intervalId: null,

  /** Kicks off the 1-second clock interval. @returns {void} */
  start() {
    const name = StorageService.loadUserName();
    this._render(new Date(), name);
    this._intervalId = setInterval(() => {
      this._render(new Date(), StorageService.loadUserName());
    }, 1000);
  },

  /** Clears the clock interval. @returns {void} */
  stop() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  /**
   * Pure helper — maps an hour (0–23) to one of the four greeting strings.
   * @param {number} hour
   * @returns {string}
   */
  getGreetingPrefix(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night'; // 21–23 and 0–4
  },

  /**
   * Pure helper — formats a Date as "Weekday, D Month YYYY".
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  },

  /**
   * Pure helper — composes prefix + optional user name.
   * @param {number} hour
   * @param {string|null} name
   * @returns {string}
   */
  buildGreeting(hour, name) {
    const prefix = this.getGreetingPrefix(hour);
    if (name && name.trim().length > 0) {
      return `${prefix}, ${name.trim()}!`;
    }
    return prefix;
  },

  /**
   * Updates the #greeting DOM elements.
   * @param {Date} [now]
   * @param {string|null} [name]
   * @returns {void}
   */
  _render(now = new Date(), name = StorageService.loadUserName()) {
    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    const textEl = document.getElementById('greeting-text');

    if (timeEl) {
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}:${ss}`;
    }

    if (dateEl) {
      dateEl.textContent = this.formatDate(now);
    }

    if (textEl) {
      textEl.textContent = this.buildGreeting(now.getHours(), name);
    }
  },
};

// ---------------------------------------------------------------------------
// TimerModule — Pomodoro countdown state machine
// ---------------------------------------------------------------------------
const TimerModule = {
  /** @type {'idle'|'running'|'paused'} */
  _state: 'idle',

  /** Remaining seconds. @type {number} */
  _remaining: 0,

  /** Active interval ID or null. @type {number|null} */
  _intervalId: null,

  /** Guard to prevent double-binding button click handlers. @type {boolean} */
  _buttonsBound: false,

  /**
   * Initialises the timer with the given duration.
   * @param {number} durationMinutes
   * @returns {void}
   */
  init(durationMinutes) {
    this._remaining = durationMinutes * 60;
    this._state = 'idle';
    this._updateDisplay();
    this._updateButtonStates();

    // Bind button click handlers once
    if (!this._buttonsBound) {
      const startBtn = document.getElementById('timer-start');
      const pauseBtn = document.getElementById('timer-pause');
      const resetBtn = document.getElementById('timer-reset');
      if (startBtn) startBtn.addEventListener('click', () => TimerModule.start());
      if (pauseBtn) pauseBtn.addEventListener('click', () => TimerModule.pause());
      if (resetBtn) resetBtn.addEventListener('click', () => TimerModule.reset());
      this._buttonsBound = true;
    }
  },

  /** Transitions idle/paused → running. @returns {void} */
  start() {
    if (this._state !== 'idle' && this._state !== 'paused') return;
    this._state = 'running';
    this._updateButtonStates();
    this._intervalId = setInterval(() => {
      if (this._state !== 'running') return;
      this._remaining -= 1;
      this._updateDisplay();
      if (this._remaining <= 0) {
        this._onComplete();
      }
    }, 1000);
  },

  /** Transitions running → paused. @returns {void} */
  pause() {
    if (this._state !== 'running') return;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state = 'paused';
    this._updateButtonStates();
  },

  /** Transitions any → idle, restores full duration. @returns {void} */
  reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    const duration = StorageService.loadDuration();
    this._remaining = duration * 60;
    this._state = 'idle';
    this._updateDisplay();
    this._updateButtonStates();
  },

  /**
   * Pure helper — formats seconds as "MM:SS".
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },

  /** Updates the #timer-display element. @returns {void} */
  _updateDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = this.formatTime(this._remaining);
    }
  },

  /** Enables/disables start and pause buttons based on current state. @returns {void} */
  _updateButtonStates() {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    if (startBtn) startBtn.disabled = (this._state === 'running');
    if (pauseBtn) pauseBtn.disabled = (this._state !== 'running');
  },

  /** Called when the countdown reaches zero. @returns {void} */
  _onComplete() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._remaining = 0;
    this._state = 'idle';
    this._updateDisplay();
    this._updateButtonStates();

    // Audible alert via AudioContext (with new Audio fallback)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.0);
    } catch (e) {
      // Fallback: no audio if AudioContext unavailable
    }
  },
};

// ---------------------------------------------------------------------------
// TodoModule — task CRUD + sort
// ---------------------------------------------------------------------------
const TodoModule = {
  /** @type {Task[]} */
  _tasks: [],

  /** @type {SortCriterion} */
  _currentSort: 'newest',

  /** Track which task id is currently in edit mode. @type {string|null} */
  _editingId: null,

  /** Loads tasks from storage. @returns {void} */
  init() {
    this._tasks = StorageService.loadTasks();
    this._currentSort = 'newest';
  },

  /**
   * Validates, creates, and persists a new task.
   * @param {string} text
   * @returns {Result}
   */
  addTask(text) {
    const trimmed = text.trim();
    if (trimmed === '') {
      return { ok: false, error: 'Task text cannot be empty.' };
    }
    const lower = trimmed.toLowerCase();
    const duplicate = this._tasks.some(
      t => !t.done && t.text.toLowerCase() === lower
    );
    if (duplicate) {
      return { ok: false, error: 'A task with this text already exists.' };
    }
    const task = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    };
    this._tasks.push(task);
    StorageService.saveTasks(this._tasks);
    this.render();
    return { ok: true };
  },

  /**
   * Validates and updates an existing task's text.
   * @param {string} id
   * @param {string} newText
   * @returns {Result}
   */
  editTask(id, newText) {
    const trimmed = newText.trim();
    if (trimmed === '') {
      return { ok: false, error: 'Task text cannot be empty.' };
    }
    const lower = trimmed.toLowerCase();
    const duplicate = this._tasks.some(
      t => t.id !== id && !t.done && t.text.toLowerCase() === lower
    );
    if (duplicate) {
      return { ok: false, error: 'A task with this text already exists.' };
    }
    const task = this._tasks.find(t => t.id === id);
    if (task) {
      task.text = trimmed;
      StorageService.saveTasks(this._tasks);
      this.render();
    }
    return { ok: true };
  },

  /**
   * Flips the done flag for the given task id.
   * @param {string} id
   * @returns {void}
   */
  toggleTask(id) {
    const task = this._tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      StorageService.saveTasks(this._tasks);
      this.render();
    }
  },

  /**
   * Removes the task with the given id.
   * @param {string} id
   * @returns {void}
   */
  deleteTask(id) {
    this._tasks = this._tasks.filter(t => t.id !== id);
    StorageService.saveTasks(this._tasks);
    this.render();
  },

  /**
   * Returns a sorted copy of _tasks without mutating storage.
   * @param {SortCriterion} criterion
   * @returns {Task[]}
   */
  sortTasks(criterion) {
    const copy = this._tasks.slice();
    switch (criterion) {
      case 'newest':
        copy.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        copy.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'alpha-asc':
        copy.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
        break;
      case 'alpha-desc':
        copy.sort((a, b) => b.text.toLowerCase().localeCompare(a.text.toLowerCase()));
        break;
      case 'status':
        copy.sort((a, b) => Number(a.done) - Number(b.done));
        break;
      default:
        copy.sort((a, b) => b.createdAt - a.createdAt);
    }
    return copy;
  },

  /**
   * Returns total and completed counts for a tasks array.
   * @param {Task[]} tasks
   * @returns {{ total: number, completed: number }}
   */
  getTaskSummary(tasks) {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.done).length,
    };
  },

  /** Re-renders the #todo-list and summary. @returns {void} */
  render() {
    const sorted = this.sortTasks(this._currentSort);
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';

    sorted.forEach(task => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark task complete');
      checkbox.addEventListener('change', () => TodoModule.toggleTask(task.id));
      li.appendChild(checkbox);

      // Mark the <li> itself when done, for CSS styling hooks
      if (task.done) {
        li.classList.add('todo-item--done');
      }

      if (this._editingId === task.id) {
        // Edit mode — wrap input+error in a column div, buttons in their own group
        li.classList.add('todo-item--editing');

        const editWrapper = document.createElement('div');
        editWrapper.className = 'task-edit-wrapper';

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = task.text;
        editWrapper.appendChild(editInput);

        const editError = document.createElement('span');
        editError.className = 'inline-error';
        editError.setAttribute('role', 'alert');
        editWrapper.appendChild(editError);

        li.appendChild(editWrapper);

        const editActions = document.createElement('div');
        editActions.className = 'task-actions';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
          const result = TodoModule.editTask(task.id, editInput.value);
          if (result.ok) {
            TodoModule._editingId = null;
            TodoModule.render();
          } else {
            editError.textContent = result.error;
          }
        });
        editActions.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
          TodoModule._editingId = null;
          TodoModule.render();
        });
        editActions.appendChild(cancelBtn);

        li.appendChild(editActions);

        // Clear error when input gains focus
        editInput.addEventListener('focus', () => { editError.textContent = ''; });
      } else {
        // View mode
        const span = document.createElement('span');
        span.className = 'task-text' + (task.done ? ' task-done' : '');
        span.textContent = task.text;
        li.appendChild(span);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          TodoModule._editingId = task.id;
          TodoModule.render();
        });
        li.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => TodoModule.deleteTask(task.id));
        li.appendChild(deleteBtn);
      }

      list.appendChild(li);
    });

    // Summary
    const summary = document.getElementById('todo-summary');
    if (summary) {
      const { total, completed } = this.getTaskSummary(sorted);
      summary.textContent = `${total} tasks · ${completed} completed`;
    }

    // Add form
    const addForm = document.getElementById('todo-add-form');
    const addInput = document.getElementById('todo-input');
    const addError = document.getElementById('todo-add-error');

    if (addForm && addInput && addError) {
      addForm.onsubmit = (e) => {
        e.preventDefault();
        const result = TodoModule.addTask(addInput.value);
        if (result.ok) {
          addInput.value = '';
          addError.textContent = '';
        } else {
          addError.textContent = result.error;
        }
      };
      addInput.onfocus = () => { addError.textContent = ''; };
    }

    // Sort select
    const sortSelect = document.getElementById('todo-sort-select');
    if (sortSelect) {
      sortSelect.value = this._currentSort;
      sortSelect.onchange = (e) => {
        TodoModule._currentSort = e.target.value;
        TodoModule.render();
      };
    }
  },
};

// ---------------------------------------------------------------------------
// LinksModule — quick-link CRUD
// ---------------------------------------------------------------------------
const LinksModule = {
  /** @type {LinkItem[]} */
  _links: [],

  /** Loads links from storage and renders. @returns {void} */
  init() {
    this._links = StorageService.loadLinks();
    this.render();
  },

  /**
   * Validates and persists a new link.
   * @param {string} label
   * @param {string} url
   * @returns {Result}
   */
  addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();

    if (trimmedLabel === '') {
      return { ok: false, error: 'Link label cannot be empty.' };
    }
    if (trimmedUrl === '') {
      return { ok: false, error: 'Link URL cannot be empty.' };
    }
    if (!this.isValidUrl(trimmedUrl)) {
      return { ok: false, error: 'URL must start with http:// or https://' };
    }

    const link = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      label: trimmedLabel,
      url: trimmedUrl,
    };
    this._links.push(link);
    StorageService.saveLinks(this._links);
    this.render();
    return { ok: true };
  },

  /**
   * Removes the link with the given id, persists, and re-renders.
   * @param {string} id
   * @returns {void}
   */
  deleteLink(id) {
    this._links = this._links.filter(link => link.id !== id);
    StorageService.saveLinks(this._links);
    this.render();
  },

  /**
   * Returns true only if url starts with 'http://' or 'https://'.
   * @param {string} url
   * @returns {boolean}
   */
  isValidUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  },

  /** Re-renders the #links-container and binds the add-link form. @returns {void} */
  render() {
    const container = document.getElementById('links-container');
    if (!container) return;

    container.innerHTML = '';

    this._links.forEach(link => {
      const item = document.createElement('div');
      item.className = 'link-item-wrapper';
      item.dataset.id = link.id;

      // Clickable button that opens the URL in a new tab (Req 9.3)
      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.className = 'link-btn';
      linkBtn.textContent = link.label;
      linkBtn.setAttribute('aria-label', `Open ${link.label}`);
      linkBtn.addEventListener('click', () => window.open(link.url, '_blank'));
      item.appendChild(linkBtn);

      // Delete control (Req 9.4, 9.5)
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', `Delete ${link.label}`);
      deleteBtn.addEventListener('click', () => LinksModule.deleteLink(link.id));
      item.appendChild(deleteBtn);

      container.appendChild(item);
    });

    // Bind add-link form (Req 9.8 — already loaded via init; form submission adds new links)
    const addForm = document.getElementById('links-add-form');
    const labelInput = document.getElementById('link-label-input');
    const urlInput = document.getElementById('link-url-input');
    const addError = document.getElementById('links-add-error');

    if (addForm && labelInput && urlInput && addError) {
      addForm.onsubmit = (e) => {
        e.preventDefault();
        const result = LinksModule.addLink(labelInput.value, urlInput.value);
        if (result.ok) {
          labelInput.value = '';
          urlInput.value = '';
          addError.textContent = '';
        } else {
          addError.textContent = result.error;
        }
      };

      // Clear error when either input gains focus
      labelInput.onfocus = () => { addError.textContent = ''; };
      urlInput.onfocus = () => { addError.textContent = ''; };
    }
  },
};

// ---------------------------------------------------------------------------
// ThemeModule — light / dark toggle
// ---------------------------------------------------------------------------
const ThemeModule = {
  /** Loads persisted theme and applies it. @returns {void} */
  init() {
    const saved = StorageService.loadTheme();
    this.apply(saved);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => ThemeModule.toggle());
    }
  },

  /** Flips between 'light' and 'dark', persists the new value. @returns {void} */
  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    this.apply(next);
    StorageService.saveTheme(next);
  },

  /**
   * Sets data-theme on <body>.
   * @param {'light'|'dark'} theme
   * @returns {void}
   */
  apply(theme) {
    document.body.dataset.theme = theme;
  },

  /** @returns {'light'|'dark'} */
  current() {
    return document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  },
};

// ---------------------------------------------------------------------------
// SettingsModule — user name + Pomodoro duration configuration
// ---------------------------------------------------------------------------
const SettingsModule = {
  /** Pre-populates inputs from storage and binds save buttons. @returns {void} */
  init() {
    // Pre-populate username input
    const usernameInput = document.getElementById('settings-username');
    if (usernameInput) {
      usernameInput.value = StorageService.loadUserName() ?? '';
    }

    // Pre-populate duration input
    const durationInput = document.getElementById('settings-duration');
    if (durationInput) {
      durationInput.value = StorageService.loadDuration();
    }

    // Bind username save button
    const usernameSaveBtn = document.getElementById('settings-username-save');
    if (usernameSaveBtn && usernameInput) {
      usernameSaveBtn.addEventListener('click', () => {
        SettingsModule.saveUserName(usernameInput.value);
      });
      // Clear error on focus
      usernameInput.addEventListener('focus', () => {
        const errEl = document.getElementById('settings-username-error');
        if (errEl) errEl.textContent = '';
      });
    }

    // Bind duration save button
    const durationSaveBtn = document.getElementById('settings-duration-save');
    if (durationSaveBtn && durationInput) {
      durationSaveBtn.addEventListener('click', () => {
        const result = SettingsModule.saveDuration(durationInput.value);
        const errEl = document.getElementById('settings-duration-error');
        if (errEl) errEl.textContent = result.ok ? '' : result.error;
      });
      // Clear error on focus
      durationInput.addEventListener('focus', () => {
        const errEl = document.getElementById('settings-duration-error');
        if (errEl) errEl.textContent = '';
      });
    }
  },

  /**
   * Persists the user name and triggers a greeting re-render.
   * @param {string} name
   * @returns {void}
   */
  saveUserName(name) {
    const trimmed = name.trim();
    const errEl = document.getElementById('settings-username-error');

    if (trimmed.length > 0) {
      StorageService.saveUserName(trimmed);
      GreetingModule._render(new Date(), trimmed);
      if (errEl) errEl.textContent = '';
    } else {
      StorageService.remove(StorageService.KEYS.USERNAME);
      GreetingModule._render(new Date(), null);
      if (errEl) errEl.textContent = 'Name cleared — greeting will show without a name.';
    }
  },

  /**
   * Validates and persists a new Pomodoro duration.
   * @param {any} input
   * @returns {Result}
   */
  saveDuration(input) {
    const n = Number(input);
    const errEl = document.getElementById('settings-duration-error');

    if (!Number.isInteger(n) || n < 1 || n > 120) {
      const error = 'Please enter a whole number between 1 and 120.';
      if (errEl) errEl.textContent = error;
      return { ok: false, error };
    }

    StorageService.saveDuration(n);
    if (errEl) errEl.textContent = '';

    // If timer is idle, reset display to new duration
    if (TimerModule._state === 'idle') {
      TimerModule.init(n);
    }

    return { ok: true };
  },
};

// ---------------------------------------------------------------------------
// App — bootstraps all modules on DOMContentLoaded
// ---------------------------------------------------------------------------
const App = {
  init() {
    // Task 10.2 — storage-error warning banner
    document.addEventListener('storage-error', () => {
      const banner = document.getElementById('storage-warning');
      const message = document.getElementById('storage-warning-message');
      if (banner) banner.removeAttribute('hidden');
      if (message) message.textContent = 'Storage unavailable — data cannot be saved.';
    });

    // Dismiss button for the storage warning banner
    const closeBtn = document.getElementById('storage-warning-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const banner = document.getElementById('storage-warning');
        if (banner) banner.setAttribute('hidden', '');
      });
    }

    // Task 10.1 — full page-load hydration in correct order
    ThemeModule.init();
    GreetingModule.start();
    SettingsModule.init();
    TimerModule.init(StorageService.loadDuration());
    TodoModule.init();
    TodoModule.render();
    LinksModule.init();
    LinksModule.render();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
