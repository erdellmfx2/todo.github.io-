// GitHub To-Do List - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newTaskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const prioritySelect = document.getElementById('priority');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const exportBtn = document.getElementById('export-tasks');
    const importBtn = document.getElementById('import-tasks');
    const modal = document.getElementById('import-export-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const exportDataTextarea = document.getElementById('export-data');
    const importDataTextarea = document.getElementById('import-data');
    const copyJsonBtn = document.getElementById('copy-json');
    const importJsonBtn = document.getElementById('import-json');
    
    // Statistics elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const todayTasksEl = document.getElementById('today-tasks');
    const weekTasksEl = document.getElementById('week-tasks');
    const overdueTasksEl = document.getElementById('overdue-tasks');
    const currentDateEl = document.getElementById('current-date');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('github-todo-tasks')) || [];
    let currentFilter = 'all';
    
    // Initialize
    updateCurrentDate();
    renderTasks();
    updateStats();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    exportBtn.addEventListener('click', openExportModal);
    importBtn.addEventListener('click', openImportModal);
    closeModal.addEventListener('click', closeModalWindow);
    
    modalTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            modalTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            if (tabId === 'export') {
                updateExportData();
            }
        });
    });
    
    copyJsonBtn.addEventListener('click', copyToClipboard);
    importJsonBtn.addEventListener('click', importTasksFromJson);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalWindow();
        }
    });
    
    // Functions
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    function addTask() {
        const title = newTaskInput.value.trim();
        if (!title) {
            alert('Please enter a task title');
            newTaskInput.focus();
            return;
        }
        
        const task = {
            id: Date.now(),
            title: title,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        tasks.unshift(task); // Add to beginning
        saveTasks();
        renderTasks();
        updateStats();
        
        // Reset input
        newTaskInput.value = '';
        newTaskInput.focus();
        prioritySelect.value = 'medium';
    }
    
    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle !== null && newTitle.trim() !== '') {
            task.title = newTitle.trim();
            saveTasks();
            renderTasks();
        }
    }
    
    function clearCompletedTasks() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function saveTasks() {
        localStorage.setItem('github-todo-tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        // Filter tasks based on current filter
        let filteredTasks = tasks;
        
        switch (currentFilter) {
            case 'pending':
                filteredTasks = tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(t => t.completed);
                break;
            case 'high':
                filteredTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
                break;
        }
        
        // Clear the list
        todoList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks found</h3>
                <p>${tasks.length === 0 ? 'Add your first to-do item above to get started!' : 'No tasks match the current filter'}</p>
            `;
            todoList.appendChild(emptyState);
            return;
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `todo-item ${task.completed ? 'completed' : ''}`;
            taskEl.innerHTML = `
                <div class="todo-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="todo-content">
                    <div class="todo-title ${task.completed ? 'completed' : ''}">
                        ${task.title}
                        <span class="todo-priority priority-${task.priority}">
                            ${getPriorityLabel(task.priority)}
                        </span>
                    </div>
                    <div class="todo-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(task.createdAt)}</span>
                        ${task.completed ? `<span><i class="far fa-check-circle"></i> Completed: ${formatDate(task.completedAt)}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="todo-action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskEl.querySelector('input[type="checkbox"]');
            const editBtn = taskEl.querySelector('.edit-btn');
            const deleteBtn = taskEl.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            todoList.appendChild(taskEl);
        });
    }
    
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        
        // Calculate today's tasks
        const today = new Date().toDateString();
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.createdAt).toDateString();
            return taskDate === today;
        }).length;
        todayTasksEl.textContent = todayTasks;
        
        // Calculate this week's tasks
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.createdAt);
            return taskDate >= oneWeekAgo;
        }).length;
        weekTasksEl.textContent = weekTasks;
        
        // Calculate overdue tasks (tasks created more than 7 days ago and not completed)
        const overdueTasks = tasks.filter(t => {
            if (t.completed) return false;
            const taskDate = new Date(t.createdAt);
            const daysOld = (Date.now() - taskDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysOld > 7;
        }).length;
        overdueTasksEl.textContent = overdueTasks;
    }
    
    function getPriorityLabel(priority) {
        const labels = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical'
        };
        return labels[priority] || 'Medium';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }
    
    function openExportModal() {
        modal.classList.add('active');
        updateExportData();
    }
    
    function openImportModal() {
        modal.classList.add('active');
        modalTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.modal-tab[data-tab="import"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('import-tab').classList.add('active');
        importDataTextarea.value = '';
    }
    
    function closeModalWindow() {
        modal.classList.remove('active');
    }
    
    function updateExportData() {
        exportDataTextarea.value = JSON.stringify(tasks, null, 2);
    }
    
    function copyToClipboard() {
        exportDataTextarea.select();
        exportDataTextarea.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(exportDataTextarea.value)
            .then(() => {
                alert('Tasks copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard');
            });
    }
    
    function importTasksFromJson() {
        try {
            const importedTasks = JSON.parse(importDataTextarea.value);
            
            // Validate the imported data
            if (!Array.isArray(importedTasks)) {
                throw new Error('Invalid data format: Expected an array of tasks');
            }
            
            // Basic validation of task structure
            const isValid = importedTasks.every(task => 
                task && 
                typeof task.title === 'string' &&
                typeof task.completed === 'boolean'
            );
            
            if (!isValid) {
                throw new Error('Invalid task structure in imported data');
            }
            
            if (confirm(`This will replace all ${tasks.length} current tasks with ${importedTasks.length} imported tasks. Continue?`)) {
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                updateStats();
                closeModalWindow();
                alert('Tasks imported successfully!');
            }
        } catch (error) {
            alert(`Error importing tasks: ${error.message}`);
        }
    }
    
    // Add some sample tasks if empty
    if (tasks.length === 0) {
        const sampleTasks = [
            {
                id: 1,
                title: 'Review pull request #42',
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: 2,
                title: 'Fix login page bug',
                priority: 'critical',
                completed: true,
                createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                completedAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Update documentation',
                priority: 'medium',
                completed: false,
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                completedAt: null
            },
            {
                id: 4,
                title: 'Plan next sprint',
                priority: 'low',
                completed: false,
                createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                completedAt: null
            }
        ];
        
        tasks = sampleTasks;
        saveTasks();
        renderTasks();
        updateStats();
    }
});