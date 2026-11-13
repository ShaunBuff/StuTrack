
"use strict";

const STORAGE_KEY = "stutrack-assignments-v1";

let assignments = [];
let deleteAssignmentId = null;

// Find an HTML element by its ID.
function getElement(id) {
    return document.getElementById(id);
}

// Generate a unique ID for each assignment.
function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(16).slice(2);
}

// Get today's date in YYYY-MM-DD format.
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Create example assignments for a first-time user.
function getSampleAssignments() {
    const today = getToday();

    const addDays = (numberOfDays) => {
        const date = new Date();
        date.setDate(date.getDate() + numberOfDays);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    return [
        {
            id: createId(),
            title: "HCI Research Report",
            module: "Human-Computer Interaction",
            dueDate: addDays(5),
            priority: "High",
            status: "In Progress",
            createdAt: today
        },
        {
            id: createId(),
            title: "Database Practical",
            module: "Database Development",
            dueDate: addDays(2),
            priority: "High",
            status: "Not Started",
            createdAt: today
        },
        {
            id: createId(),
            title: "Java Programming Exercises",
            module: "Programming",
            dueDate: addDays(10),
            priority: "Medium",
            status: "In Progress",
            createdAt: today
        },
        {
            id: createId(),
            title: "Previous Study Notes",
            module: "Study Revision",
            dueDate: addDays(-2),
            priority: "Low",
            status: "Completed",
            createdAt: today
        }
    ];
}

// Load assignments from browser storage.
function loadAssignments() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            assignments = getSampleAssignments();
            saveAssignments(false);
            return;
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            throw new Error("Saved assignment data is not a list.");
        }

        assignments = parsedData;
    } catch (error) {
        console.error("Could not load assignments:", error);
        assignments = getSampleAssignments();
        showToast("Saved data could not be loaded. Example assignments were restored.");
    }
}

// Save assignments to browser storage.
function saveAssignments(showMessage = false) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));

        if (showMessage) {
            showToast("Your changes have been saved.");
        }

        return true;
    } catch (error) {
        console.error("Could not save assignments:", error);
        showToast("Could not save changes. Check your browser storage settings.");
        return false;
    }
}

// Convert a date into a readable format.
function formatDate(dateString) {
    if (!dateString) {
        return "No deadline";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Check whether an assignment is overdue.
function isOverdue(assignment) {
    return assignment.status !== "Completed"
        && Boolean(assignment.dueDate)
        && assignment.dueDate < getToday();
}

// Display a temporary notification.
function showToast(message) {
    const toast = getElement("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    if (showToast.timeoutId) {
        clearTimeout(showToast.timeoutId);
    }

    showToast.timeoutId = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Update dashboard numbers and progress.
function updateDashboard() {
    const total = assignments.length;

    const completed = assignments.filter(
        assignment => assignment.status === "Completed"
    ).length;

    const outstanding = total - completed;
    const overdue = assignments.filter(isOverdue).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    getElement("total-count").textContent = total;
    getElement("outstanding-count").textContent = outstanding;
    getElement("completed-count").textContent = completed;
    getElement("overdue-count").textContent = overdue;

    getElement("progress-fill").style.width = `${percentage}%`;
    getElement("progress-label").textContent = `${percentage}% complete`;

    if (total === 0) {
        getElement("progress-message").textContent =
            "Add your first assignment to start tracking your progress.";
    } else if (percentage === 100) {
        getElement("progress-message").textContent =
            "Excellent work! You have completed all your assignments.";
    } else if (percentage >= 60) {
        getElement("progress-message").textContent =
            "Great progress! Keep going to finish your remaining work.";
    } else {
        getElement("progress-message").textContent =
            "Stay organised and complete your assignments one step at a time.";
    }

    getElement("progress-track").setAttribute(
        "aria-valuenow",
        String(percentage)
    );
}

// Create a status badge.
function createStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = "status-badge";

    const statusClasses = {
        "Not Started": "status-not-started",
        "In Progress": "status-in-progress",
        "Completed": "status-completed"
    };

    badge.classList.add(statusClasses[status] || "status-not-started");
    badge.textContent = status;

    return badge;
}

// Create a priority badge.
function createPriorityBadge(priority) {
    const badge = document.createElement("span");
    badge.className = "priority-badge";

    const priorityClasses = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    };

    badge.classList.add(priorityClasses[priority] || "priority-medium");
    badge.textContent = `${priority} priority`;

    return badge;
}

// Create a button with a click action.
function createButton(label, className, action, title) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.title = title || label;
    button.addEventListener("click", action);

    return button;
}

// Build an assignment card safely.
function createAssignmentCard(assignment) {
    const card = document.createElement("article");
    card.className = "assignment-card";
    card.dataset.id = assignment.id;

    if (assignment.status === "Completed") {
        card.classList.add("is-completed");
    }

    const content = document.createElement("div");
    content.className = "assignment-content";

    const heading = document.createElement("h3");
    heading.className = "assignment-title";
    heading.textContent = assignment.title;

    const module = document.createElement("p");
    module.className = "assignment-module";
    module.textContent = assignment.module;

    const details = document.createElement("div");
    details.className = "assignment-badges";

    details.appendChild(createStatusBadge(assignment.status));
    details.appendChild(createPriorityBadge(assignment.priority));

    const deadline = document.createElement("p");
    deadline.className = "assignment-deadline";

    if (isOverdue(assignment)) {
        deadline.classList.add("overdue");
        deadline.textContent =
            `Overdue · Due ${formatDate(assignment.dueDate)}`;
    } else {
        deadline.textContent = `Due ${formatDate(assignment.dueDate)}`;
    }

    content.appendChild(heading);
    content.appendChild(module);
    content.appendChild(details);
    content.appendChild(deadline);

    const actions = document.createElement("div");
    actions.className = "assignment-actions";

    if (assignment.status !== "Completed") {
        actions.appendChild(
            createButton(
                assignment.status === "In Progress" ? "Reopen" : "Start",
                "action-button",
                () => changeStatus(assignment.id, "In Progress")
            )
        );

        actions.appendChild(
            createButton(
                "Complete",
                "action-button complete-button",
                () => changeStatus(assignment.id, "Completed")
            )
        );
    } else {
        actions.appendChild(
            createButton(
                "Reopen",
                "action-button",
                () => changeStatus(assignment.id, "Not Started")
            )
        );
    }

    actions.appendChild(
        createButton(
            "Edit",
            "action-button",
            () => editAssignment(assignment.id)
        )
    );

    actions.appendChild(
        createButton(
            "Share",
            "action-button",
            () => shareAssignment(assignment)
        )
    );

    actions.appendChild(
        createButton(
            "Delete",
            "action-button delete-button",
            () => askToDelete(assignment.id)
        )
    );

    card.appendChild(content);
    card.appendChild(actions);

    return card;
}

// Get assignments matching the search and filter controls.
function getFilteredAssignments() {
    const searchText = getElement("search-input").value
        .trim()
        .toLowerCase();

    const statusFilter = getElement("status-filter").value;
    const priorityFilter = getElement("priority-filter").value;

    return assignments
        .filter(assignment => {
            const matchesSearch =
                assignment.title.toLowerCase().includes(searchText)
                || assignment.module.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "All"
                || !statusFilter
                || assignment.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All"
                || !priorityFilter
                || assignment.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((first, second) => {
            if (first.status === "Completed" && second.status !== "Completed") {
                return 1;
            }

            if (first.status !== "Completed" && second.status === "Completed") {
                return -1;
            }

            if (!first.dueDate) {
                return 1;
            }

            if (!second.dueDate) {
                return -1;
            }

            return first.dueDate.localeCompare(second.dueDate);
        });
}

// Display the assignment list.
function renderAssignments() {
    const list = getElement("assignment-list");
    const emptyState = getElement("empty-state");
    const emptyHeading = getElement("empty-heading");
    const emptyMessage = getElement("empty-message");
    const resultCount = getElement("result-count");

    list.replaceChildren();

    const filteredAssignments = getFilteredAssignments();

    resultCount.textContent =
        `${filteredAssignments.length} assignment${filteredAssignments.length === 1 ? "" : "s"}`;

    if (filteredAssignments.length === 0) {
        emptyState.hidden = false;

        if (assignments.length === 0) {
            emptyHeading.textContent = "No assignments yet";
            emptyMessage.textContent =
                "Add your first assignment to start organising your studies.";
        } else {
            emptyHeading.textContent = "No matching assignments";
            emptyMessage.textContent =
                "Try changing your search or filters.";
        }

        return;
    }

    emptyState.hidden = true;

    filteredAssignments.forEach(assignment => {
        list.appendChild(createAssignmentCard(assignment));
    });
}

// Refresh all visible dashboard information.
function renderApp() {
    updateDashboard();
    renderAssignments();
}

// Reset the form to its original state.
function resetAssignmentForm() {
    getElement("assignment-form").reset();
    getElement("assignment-id").value = "";
    getElement("form-heading").textContent = "Add a new assignment";
    getElement("save-button").textContent = "Save assignment";
    getElement("assignment-form-section").hidden = false;
    getElement("assignment-title").focus();
}

// Open the assignment form.
function openAssignmentForm() {
    resetAssignmentForm();

    getElement("assignment-form-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Validate assignment details.
function isValidAssignment(title, module, dueDate) {
    if (!title.trim() || !module.trim()) {
        showToast("Please enter an assignment title and module.");
        return false;
    }

    if (dueDate && Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) {
        showToast("Please enter a valid deadline.");
        return false;
    }

    return true;
}

// Add a new assignment or update an existing one.
function handleFormSubmit(event) {
    event.preventDefault();

    const id = getElement("assignment-id").value;
    const title = getElement("assignment-title").value.trim();
    const module = getElement("assignment-module").value.trim();
    const dueDate = getElement("assignment-due-date").value;
    const priority = getElement("assignment-priority").value;
    const status = getElement("assignment-status").value;

    if (!isValidAssignment(title, module, dueDate)) {
        return;
    }

    const existingIndex = assignments.findIndex(
        assignment => assignment.id === id
    );

    // Keep a copy so the previous details can be restored if saving fails.
    const previousAssignment = existingIndex >= 0
        ? assignments[existingIndex]
        : null;

    if (existingIndex >= 0) {
        assignments[existingIndex] = {
            ...previousAssignment,
            title,
            module,
            dueDate,
            priority,
            status
        };
    } else {
        assignments.push({
            id: createId(),
            title,
            module,
            dueDate,
            priority,
            status,
            createdAt: getToday()
        });
    }

    if (!saveAssignments()) {
        if (existingIndex >= 0) {
            assignments[existingIndex] = previousAssignment;
        } else {
            assignments.pop();
        }

        return;
    }

    getElement("assignment-form-section").hidden = true;

    renderApp();

    showToast(existingIndex >= 0
        ? "Assignment updated successfully."
        : "Assignment added successfully.");
}

// Load an assignment into the form for editing.
function editAssignment(id) {
    const assignment = assignments.find(item => item.id === id);

    if (!assignment) {
        showToast("Assignment could not be found.");
        return;
    }

    getElement("assignment-id").value = assignment.id;
    getElement("assignment-title").value = assignment.title;
    getElement("assignment-module").value = assignment.module;
    getElement("assignment-due-date").value = assignment.dueDate || "";
    getElement("assignment-priority").value = assignment.priority;
    getElement("assignment-status").value = assignment.status;

    getElement("form-heading").textContent = "Edit assignment";
    getElement("save-button").textContent = "Save changes";
    getElement("assignment-form-section").hidden = false;

    getElement("assignment-form-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    getElement("assignment-title").focus();
}

// Change the status of an assignment.
function changeStatus(id, newStatus) {
    const index = assignments.findIndex(item => item.id === id);

    if (index === -1) {
        showToast("Assignment could not be found.");
        return;
    }

    const previousAssignment = assignments[index];

    assignments[index] = {
        ...previousAssignment,
        status: newStatus
    };

    if (!saveAssignments()) {
        assignments[index] = previousAssignment;
        return;
    }

    renderApp();

    showToast(`Assignment marked as ${newStatus.toLowerCase()}.`);
}

// Ask for confirmation before deleting an assignment.
function askToDelete(id) {
    const assignment = assignments.find(item => item.id === id);

    if (!assignment) {
        return;
    }

    deleteAssignmentId = id;

    getElement("delete-message").textContent =
        `Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`;

    getElement("delete-dialog").showModal();
}

// Delete the selected assignment.
function confirmDelete() {
    if (!deleteAssignmentId) {
        return;
    }

    const previousAssignments = assignments;

    assignments = assignments.filter(
        assignment => assignment.id !== deleteAssignmentId
    );

    if (!saveAssignments()) {
        assignments = previousAssignments;
        return;
    }

    getElement("delete-dialog").close();
    deleteAssignmentId = null;

    renderApp();

    showToast("Assignment deleted.");
}

// Copy assignment details to the clipboard.
async function shareAssignment(assignment) {
    const text = [
        `Assignment: ${assignment.title}`,
        `Module: ${assignment.module}`,
        `Due date: ${formatDate(assignment.dueDate)}`,
        `Priority: ${assignment.priority}`,
        `Status: ${assignment.status}`
    ].join("\n");

    // First attempt: modern Clipboard API.
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);

            showToast("Assignment details copied to the clipboard.");
            return;
        }
    } catch (error) {
        console.warn("Clipboard API unavailable:", error);
    }

    // Second attempt: alternative browser copying method.
    const textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);

    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    let copied = false;

    try {
        copied = document.execCommand("copy");
    } catch (error) {
        console.error("Alternative copy method failed:", error);
    }

    textArea.remove();

    if (copied) {
        showToast("Assignment details copied to the clipboard.");
    } else {
        // Final fallback: allow the user to copy manually.
        window.prompt("Copy these assignment details:", text);
    }
}

// Reset search and filters.
function resetFilters() {
    getElement("search-input").value = "";
    getElement("status-filter").value = "All";
    getElement("priority-filter").value = "All";

    renderAssignments();
}

// Connect the buttons and form to their functions.
function connectEventListeners() {
    getElement("assignment-form").addEventListener(
        "submit",
        handleFormSubmit
    );

    getElement("new-assignment-button").addEventListener(
        "click",
        openAssignmentForm
    );

    getElement("empty-add-button").addEventListener(
        "click",
        openAssignmentForm
    );

    getElement("cancel-form-button").addEventListener("click", () => {
        getElement("assignment-form-section").hidden = true;
        getElement("assignment-form").reset();
        getElement("assignment-id").value = "";
    });

    getElement("clear-form-button").addEventListener("click", () => {
        getElement("assignment-id").value = "";
        getElement("form-heading").textContent = "Add a new assignment";
        getElement("save-button").textContent = "Save assignment";
    });

    getElement("search-input").addEventListener(
        "input",
        renderAssignments
    );

    getElement("status-filter").addEventListener(
        "change",
        renderAssignments
    );

    getElement("priority-filter").addEventListener(
        "change",
        renderAssignments
    );

    getElement("reset-filters-button").addEventListener(
        "click",
        resetFilters
    );

    getElement("cancel-delete-button").addEventListener("click", () => {
        getElement("delete-dialog").close();
        deleteAssignmentId = null;
    });

    getElement("confirm-delete-button").addEventListener(
        "click",
        confirmDelete
    );
}

// Start the application after the page has loaded.
document.addEventListener("DOMContentLoaded", () => {
    const requiredIds = [
        "total-count",
        "outstanding-count",
        "completed-count",
        "overdue-count",
        "progress-track",
        "progress-fill",
        "progress-label",
        "progress-message",
        "assignment-form",
        "assignment-form-section",
        "assignment-id",
        "assignment-title",
        "assignment-module",
        "assignment-due-date",
        "assignment-priority",
        "assignment-status",
        "save-button",
        "cancel-form-button",
        "clear-form-button",
        "form-heading",
        "new-assignment-button",
        "empty-add-button",
        "search-input",
        "status-filter",
        "priority-filter",
        "reset-filters-button",
        "assignment-list",
        "result-count",
        "empty-state",
        "empty-heading",
        "empty-message",
        "toast",
        "delete-dialog",
        "delete-message",
        "cancel-delete-button",
        "confirm-delete-button"
    ];

    const missingIds = requiredIds.filter(id => !getElement(id));

    if (missingIds.length > 0) {
        console.error(
            "StuTrack is missing these HTML elements:",
            missingIds
        );

        alert(
            "Some StuTrack HTML elements are missing. Check the browser console for details."
        );

        return;
    }

    connectEventListeners();
    loadAssignments();
    renderApp();
});
