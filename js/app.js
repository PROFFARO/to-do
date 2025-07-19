// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const errorMessage = document.getElementById('error-message');
const totalTasksSpan = document.getElementById('total-tasks');

// Task array to store tasks
let tasks = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initializeModals();
});

taskForm.addEventListener('submit', addTask);
taskList.addEventListener('click', handleTaskAction);

/**
 * Load tasks from localStorage
 */
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            renderTasks();
        }
    } catch (error) {
        showError('Error loading tasks from storage');
        console.error('Error loading tasks:', error);
    }
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskCount();
    } catch (error) {
        showError('Error saving tasks to storage');
        console.error('Error saving tasks:', error);
    }
}

/**
 * Add a new task
 * @param {Event} e - Form submit event
 */
function addTask(e) {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    
    if (!taskText) {
        showError('Please enter a task');
        return;
    }
    
    if (tasks.some(task => task.text.toLowerCase() === taskText.toLowerCase())) {
        showError('This task already exists');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    
    taskInput.value = '';
    clearError();
}

/**
 * Handle task actions (complete, edit, delete)
 * @param {Event} e - Click event
 */
function handleTaskAction(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = Number(taskItem.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (e.target.matches('.task-checkbox')) {
        toggleTaskComplete(taskId);
    } else if (e.target.matches('.edit-btn')) {
        editTask(task);
    } else if (e.target.matches('.delete-btn')) {
        deleteTask(taskId);
    }
}

/**
 * Toggle task complete status
 * @param {number} taskId - Task ID
 */
function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
    }
}

/**
 * Edit task
 * @param {Object} task - Task object
 */
// Modal Elements
const modalElements = {
    edit: document.getElementById('edit-modal'),
    delete: document.getElementById('delete-modal'),
    overlay: document.getElementById('modal-overlay')
};

const modalInputs = {
    edit: document.getElementById('edit-input'),
    deletePreview: document.getElementById('delete-task-preview')
};

const modalButtons = {
    saveEdit: document.getElementById('save-edit-btn'),
    cancelEdit: document.getElementById('cancel-edit-btn'),
    confirmDelete: document.getElementById('confirm-delete-btn'),
    cancelDelete: document.getElementById('cancel-delete-btn')
};

let currentTask = null;
let modalCloseTimeout;

function showModal(task, type = 'edit') {
    // Clear any existing timeouts
    if (modalCloseTimeout) {
        clearTimeout(modalCloseTimeout);
    }

    const modalElement = modalElements[type];
    currentTask = task;

    // Prepare modal content
    if (type === 'edit') {
        modalInputs.edit.value = task.text;
    } else if (type === 'delete') {
        modalInputs.deletePreview.textContent = task.text;
    }

    // Show modal with optimized timing
    requestAnimationFrame(() => {
        // Set initial display state
        modalElements.overlay.style.visibility = 'visible';
        modalElement.style.visibility = 'visible';
        
        // Force reflow
        modalElement.offsetHeight;

        // Trigger animations
        modalElements.overlay.classList.add('active');
        modalElement.classList.add('active');

        // Focus input for edit modal
        if (type === 'edit') {
            modalInputs.edit.focus();
        }
    });

    // Set up keyboard handlers for edit modal
    if (type === 'edit') {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                hideModal('edit');
            }
        };

        modalInputs.edit.addEventListener('keyup', handleKeyPress);
        modalInputs.edit.addEventListener('blur', () => {
            modalInputs.edit.removeEventListener('keyup', handleKeyPress);
        });
    }
}

function hideModal(type = 'edit') {
    const modalElement = modalElements[type];
    
    modalElement.classList.remove('active');
    modalElements.overlay.classList.remove('active');

    // Use timeout to match transition duration
    modalCloseTimeout = setTimeout(() => {
        modalElement.style.visibility = 'hidden';
        
        // Only hide overlay if no other modal is active
        if (!document.querySelector('.modal.active')) {
            modalElements.overlay.style.visibility = 'hidden';
        }
        
        if (type === 'edit') {
            currentTask = null;
            modalInputs.edit.value = '';
        }
    }, 200); // Match this with CSS transition duration
}

function saveEdit() {
    const trimmedText = modalInputs.edit.value.trim();
    
    if (!trimmedText) {
        showError('Task cannot be empty');
        return;
    }
    
    if (tasks.some(t => t.id !== currentTask.id && t.text.toLowerCase() === trimmedText.toLowerCase())) {
        showError('This task already exists');
        return;
    }
    
    currentTask.text = trimmedText;
    saveTasks();
    renderTasks();
    clearError();
    hideModal('edit');
}

function editTask(task) {
    showModal(task, 'edit');
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        showModal(task, 'delete');
    }
}

function confirmDelete() {
    if (currentTask) {
        tasks = tasks.filter(task => task.id !== currentTask.id);
        saveTasks();
        renderTasks();
        hideModal('delete');
    }
}

// Event Listeners for Modals
modalButtons.saveEdit.addEventListener('click', saveEdit);
modalButtons.cancelEdit.addEventListener('click', () => hideModal('edit'));
modalButtons.confirmDelete.addEventListener('click', confirmDelete);
modalButtons.cancelDelete.addEventListener('click', () => hideModal('delete'));

// Handle overlay clicks
modalElements.overlay.addEventListener('click', (e) => {
    if (e.target === modalElements.overlay) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal === modalElements.edit) {
            hideModal('edit');
        } else if (activeModal === modalElements.delete) {
            hideModal('delete');
        }
    }
});

// Global keyboard handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal === modalElements.edit) {
            hideModal('edit');
        } else if (activeModal === modalElements.delete) {
            hideModal('delete');
        }
    }
});

// Initialize modal functionality
function initializeModals() {
    // Event Listeners for Modals
    modalButtons.saveEdit.addEventListener('click', saveEdit);
    modalButtons.cancelEdit.addEventListener('click', () => hideModal('edit'));
    modalButtons.confirmDelete.addEventListener('click', confirmDelete);
    modalButtons.cancelDelete.addEventListener('click', () => hideModal('delete'));

    // Handle overlay clicks
    modalElements.overlay.addEventListener('click', (e) => {
        if (e.target === modalElements.overlay) {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal === modalElements.edit) {
                hideModal('edit');
            } else if (activeModal === modalElements.delete) {
                hideModal('delete');
            }
        }
    });

    // Global keyboard handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal === modalElements.edit) {
                hideModal('edit');
            } else if (activeModal === modalElements.delete) {
                hideModal('delete');
            }
        }
    });
}

/**
 * Delete task
 * @param {number} taskId - Task ID
 */
/**
 * Render tasks to DOM
 */

/**
 * Render tasks to DOM
 */
function renderTasks() {
    taskList.innerHTML = tasks.map(task => `
        <li class="task-item" data-id="${task.id}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
            >
            <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');
    
    updateTaskCount();
}

/**
 * Update total task count
 */
function updateTaskCount() {
    totalTasksSpan.textContent = tasks.length;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.opacity = '1';
}

/**
 * Clear error message
 */
function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.opacity = '0';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
