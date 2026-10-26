(() => {
  const STORAGE_KEY = "todo-list-tasks-v1";
  const taskForm = document.querySelector("#taskForm");
  const taskInput = document.querySelector("#taskInput");
  const taskList = document.querySelector("#taskList");
  const emptyState = document.querySelector("#emptyState");
  const taskSummary = document.querySelector("#taskSummary");
  const completedSummary = document.querySelector("#completedSummary");
  const clearCompletedButton = document.querySelector("#clearCompleted");
  const todayDate = document.querySelector("#todayDate");
  const liveMessage = document.querySelector("#liveMessage");
  const filters = [...document.querySelectorAll("[data-filter]")];

  let currentFilter = "all";
  let tasks = loadTasks();

  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric"
  }).format(new Date());

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved)
        ? saved.filter(task => task && typeof task.id === "string" &&
            typeof task.text === "string" && typeof task.completed === "boolean")
        : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      liveMessage.textContent = "Could not save tasks in this browser.";
    }
  }

  function announce(message) {
    liveMessage.textContent = message;
  }

  function render() {
    const visibleTasks = tasks.filter(task => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    taskList.replaceChildren();
    visibleTasks.forEach(task => {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " done" : ""}`;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "complete-toggle";
      toggle.setAttribute("aria-label", task.completed ? `Mark "${task.text}" active` : `Complete "${task.text}"`);
      toggle.setAttribute("aria-pressed", String(task.completed));
      const check = document.createElement("span");
      check.textContent = task.completed ? "✓" : "";
      toggle.append(check);
      toggle.addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        render();
        announce(task.completed ? "Task completed." : "Task marked active.");
      });

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete "${task.text}"`);
      remove.title = "Delete task";
      remove.addEventListener("click", () => {
        tasks = tasks.filter(entry => entry.id !== task.id);
        saveTasks();
        render();
        announce("Task deleted.");
      });

      item.append(toggle, text, remove);
      taskList.append(item);
    });

    const activeCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.length - activeCount;
    taskSummary.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
    completedSummary.textContent = `${completedCount} completed`;
    emptyState.classList.toggle("hidden", visibleTasks.length > 0);
    emptyState.querySelector("h3").textContent =
      tasks.length === 0 ? "No tasks here yet" : "No matching tasks";
    emptyState.querySelector("p").textContent =
      tasks.length === 0 ? "Add a task above and make today count." : "Try another filter to see your tasks.";
    clearCompletedButton.disabled = completedCount === 0;

    filters.forEach(button => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  taskForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) {
      taskInput.focus();
      return;
    }
    tasks.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      completed: false
    });
    saveTasks();
    currentFilter = "all";
    taskInput.value = "";
    render();
    taskInput.focus();
    announce(`Added task: ${text}`);
  });

  filters.forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  clearCompletedButton.addEventListener("click", () => {
    const count = tasks.filter(task => task.completed).length;
    if (count === 0) return;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
    announce(`Cleared ${count} completed ${count === 1 ? "task" : "tasks"}.`);
  });

  render();
})();
