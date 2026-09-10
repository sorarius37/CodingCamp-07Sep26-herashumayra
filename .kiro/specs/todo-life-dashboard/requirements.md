# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application (SPA) built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend server. All user data is persisted using the browser's Local Storage API. The dashboard combines a contextual greeting, a configurable Pomodoro focus timer, a full-featured to-do list, and a quick-links panel into one clean, minimal interface. An optional light/dark mode toggle and user-customizable settings are also provided.

The application is deployed as a static site (e.g., via GitHub Pages) and requires no installation or setup beyond opening the page in a modern browser.

---

## Glossary

- **Dashboard**: The single HTML page that contains all features of the application.
- **Greeting_Widget**: The UI component that displays the current time, date, and a personalized greeting message.
- **Timer**: The Pomodoro-style countdown timer component.
- **Todo_List**: The UI component responsible for managing task items.
- **Task**: A single to-do item that has a text label, a completion status, and a creation timestamp.
- **Quick_Links**: The UI component that displays user-defined bookmark buttons linking to external websites.
- **Link_Item**: A single entry in the Quick_Links panel consisting of a display label and a URL.
- **Local_Storage**: The browser's `localStorage` Web API used for client-side data persistence.
- **Theme**: The visual color scheme of the Dashboard (light or dark).
- **User_Name**: The personalized name the user configures for the greeting.
- **Pomodoro_Duration**: The configurable work-session length (in minutes) used by the Timer.

---

## Requirements

---

### Requirement 1: Display Real-Time Greeting

**User Story:** As a user, I want to see the current time, date, and a greeting based on the time of day, so that the Dashboard feels personal and contextually aware.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time updated every second.
2. THE Greeting_Widget SHALL display the current local date including the day name, date number, month, and year.
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting prefix "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting prefix "Good Afternoon".
5. WHEN the local hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting prefix "Good Evening".
6. WHEN the local hour is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting prefix "Good Night".
7. WHERE a User_Name has been saved in Local_Storage, THE Greeting_Widget SHALL append the User_Name to the greeting prefix (e.g., "Good Morning, Hera!").
8. WHERE no User_Name has been saved in Local_Storage, THE Greeting_Widget SHALL display the greeting prefix without a name.

---

### Requirement 2: User Name Configuration

**User Story:** As a user, I want to set my name in the Dashboard, so that the greeting is personalized to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field where the user can enter a User_Name.
2. WHEN the user submits a non-empty User_Name, THE Dashboard SHALL save the User_Name to Local_Storage.
3. WHEN the user submits a non-empty User_Name, THE Greeting_Widget SHALL immediately reflect the updated User_Name without requiring a page reload.
4. WHEN the page loads, THE Dashboard SHALL read the User_Name from Local_Storage and pre-populate the name input field with the stored value.
5. IF the user submits an empty string as the User_Name, THEN THE Dashboard SHALL remove the User_Name from Local_Storage and display the greeting without a name.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a countdown timer I can start, pause, and reset, so that I can use the Pomodoro technique to manage my focus sessions.

#### Acceptance Criteria

1. THE Timer SHALL initialize the countdown to the configured Pomodoro_Duration when the Dashboard first loads.
2. WHEN the user activates the start control, THE Timer SHALL begin counting down in one-second intervals.
3. WHILE the Timer is counting down, THE Timer SHALL update the displayed minutes and seconds every second.
4. WHEN the user activates the pause control, THE Timer SHALL stop the countdown and retain the remaining time.
5. WHEN the user activates the reset control, THE Timer SHALL stop any active countdown and restore the display to the full Pomodoro_Duration.
6. WHEN the countdown reaches zero, THE Timer SHALL stop automatically and display "00:00".
7. WHEN the countdown reaches zero, THE Timer SHALL emit an audible alert to notify the user.
8. WHILE the Timer is counting down, THE Timer SHALL disable the start control to prevent duplicate intervals.
9. WHILE the Timer is not counting down, THE Timer SHALL disable the pause control.

---

### Requirement 4: Configurable Pomodoro Duration

**User Story:** As a user, I want to set the timer duration to a custom number of minutes, so that I can adapt the focus session length to my preference.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a numeric input field where the user can enter a Pomodoro_Duration in whole minutes.
2. WHEN the user saves a valid Pomodoro_Duration (a whole number between 1 and 120 inclusive), THE Dashboard SHALL store it in Local_Storage.
3. WHEN the user saves a valid Pomodoro_Duration while the Timer is not counting down, THE Timer SHALL reset to the new Pomodoro_Duration immediately.
4. IF the user enters a value outside the range 1–120 or a non-numeric value, THEN THE Dashboard SHALL display an inline validation message and SHALL NOT update the stored Pomodoro_Duration.
5. WHEN the page loads, THE Dashboard SHALL read the Pomodoro_Duration from Local_Storage and initialize the Timer to that value.
6. WHERE no Pomodoro_Duration has been saved in Local_Storage, THE Timer SHALL initialize to a default duration of 25 minutes.

---

### Requirement 5: Task Management — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and see all my tasks displayed, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field and a submission control for adding a new Task.
2. WHEN the user submits a non-empty task text, THE Todo_List SHALL add the Task to the list with a completion status of incomplete and a creation timestamp set to the current local time.
3. WHEN the user submits a non-empty task text, THE Todo_List SHALL persist the updated task list to Local_Storage.
4. WHEN the user submits a non-empty task text that is identical (case-insensitive) to an existing incomplete Task text, THE Dashboard SHALL display an inline warning message and SHALL NOT add a duplicate Task.
5. IF the user submits an empty task text, THEN THE Dashboard SHALL display an inline validation message and SHALL NOT add a Task.
6. WHEN the page loads, THE Todo_List SHALL read all Tasks from Local_Storage and render them in the list.
7. THE Todo_List SHALL display the total count of tasks and the count of completed tasks in a summary line.

---

### Requirement 6: Task Management — Edit Tasks

**User Story:** As a user, I want to edit an existing task's text, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an edit control for each Task.
2. WHEN the user activates the edit control for a Task, THE Todo_List SHALL replace the task's display text with an editable input field pre-populated with the current task text.
3. WHEN the user confirms the edit with a non-empty updated text, THE Todo_List SHALL update the Task's text and persist the change to Local_Storage.
4. WHEN the user confirms an edit that results in text identical (case-insensitive) to another existing incomplete Task, THE Dashboard SHALL display an inline warning and SHALL NOT save the duplicate text.
5. WHEN the user cancels the edit, THE Todo_List SHALL restore the original task text without making changes.
6. IF the user confirms the edit with an empty string, THEN THE Todo_List SHALL display an inline validation message and SHALL NOT update the Task.

---

### Requirement 7: Task Management — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can keep my list relevant and track progress.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle control for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL update the Task's completion status to complete and persist the change to Local_Storage.
3. WHEN the user activates the completion toggle for a complete Task, THE Todo_List SHALL update the Task's completion status to incomplete and persist the change to Local_Storage.
4. THE Todo_List SHALL visually differentiate completed Tasks from incomplete Tasks (e.g., strikethrough text and reduced opacity).
5. THE Todo_List SHALL provide a delete control for each Task.
6. WHEN the user activates the delete control for a Task, THE Todo_List SHALL remove that Task from the list and persist the updated list to Local_Storage.

---

### Requirement 8: Task Sorting

**User Story:** As a user, I want to sort my task list by different criteria, so that I can view tasks in a meaningful order.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a sort control with the following options: by creation date (newest first), by creation date (oldest first), alphabetically (A–Z), alphabetically (Z–A), and by status (incomplete first).
2. WHEN the user selects a sort option, THE Todo_List SHALL re-render all Tasks in the selected order without modifying the stored order in Local_Storage.
3. WHEN the page loads, THE Todo_List SHALL apply the default sort order of creation date (newest first).

---

### Requirement 9: Quick Links Management

**User Story:** As a user, I want to save and access my favorite website links directly from the Dashboard, so that I can navigate to them quickly.

#### Acceptance Criteria

1. THE Dashboard SHALL provide input fields for a display label and a URL, and a submission control for adding a new Link_Item.
2. WHEN the user submits a non-empty label and a valid URL, THE Quick_Links SHALL add the Link_Item, persist it to Local_Storage, and render it as a clickable button.
3. WHEN the user activates a Link_Item button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
4. THE Quick_Links SHALL provide a delete control for each Link_Item.
5. WHEN the user activates the delete control for a Link_Item, THE Quick_Links SHALL remove that Link_Item and persist the updated list to Local_Storage.
6. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Dashboard SHALL display an inline validation message and SHALL NOT add the Link_Item.
7. IF the user submits an empty label or an empty URL, THEN THE Dashboard SHALL display an inline validation message and SHALL NOT add the Link_Item.
8. WHEN the page loads, THE Quick_Links SHALL read all Link_Items from Local_Storage and render them.

---

### Requirement 10: Light / Dark Mode Toggle

**User Story:** As a user, I want to switch between a light and a dark visual theme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control to switch between light and dark Theme.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI components immediately without a page reload.
3. WHEN the user activates the theme toggle, THE Dashboard SHALL save the selected Theme to Local_Storage.
4. WHEN the page loads, THE Dashboard SHALL read the Theme from Local_Storage and apply it before rendering any content.
5. WHERE no Theme has been saved in Local_Storage, THE Dashboard SHALL apply the light Theme as the default.

---

### Requirement 11: Data Persistence and Storage

**User Story:** As a user, I want all my settings and data to be automatically saved in the browser, so that my information is still there when I return to the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local_Storage API as the sole data persistence mechanism.
2. THE Dashboard SHALL store tasks, Quick_Links Link_Items, User_Name, Pomodoro_Duration, and Theme preference each under a distinct Local_Storage key.
3. WHEN the page loads, THE Dashboard SHALL restore all persisted data (tasks, links, settings) before displaying the UI to the user.
4. IF Local_Storage is unavailable or throws a storage quota error, THEN THE Dashboard SHALL display a non-blocking warning message informing the user that data cannot be saved.

---

### Requirement 12: Browser Compatibility and Standalone Use

**User Story:** As a user, I want the Dashboard to work reliably across all modern browsers without any installation, so that I can use it anywhere.

#### Acceptance Criteria

1. THE Dashboard SHALL render and function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL consist of exactly one HTML file, one CSS file located in a `css/` directory, and one JavaScript file located in a `js/` directory.
3. THE Dashboard SHALL load and be fully interactive within 2 seconds on a standard desktop or laptop computer with a modern browser.
4. THE Dashboard SHALL require no external server, build step, or runtime dependency to operate.
