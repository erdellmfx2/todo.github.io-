// GitHub To-Do List - JavaScript with Repository Integration
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newTaskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const prioritySelect = document.getElementById('priority');
    const dueDateInput = document.getElementById('due-date');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const exportBtn = document.getElementById('export-tasks');
    const importBtn = document.getElementById('import-tasks');
    const syncLitebotBtn = document.getElementById('sync-litebot');
    const githubTokenInput = document.getElementById('github-token');
    const saveTokenBtn = document.getElementById('save-token');
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
    
    // Repository configuration
    const REPO_OWNER = 'erdellmfx2';
    const REPO_NAME = 'todo-manager';
    const REPO_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
    const TASKS_ACTIVE_URL = `${REPO_URL}/contents/tasks/active`;
    const TASKS_COMPLETED_URL = `${REPO_URL}/contents/tasks/completed`;
    const TASKS_ARCHIVED_URL = `${REPO_URL}/contents/tasks/archived`;
    
    // State
    let tasks = [];
    let currentFilter = 'all';
    
    // Initialize
    updateCurrentDate();
    loadTasks();
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
    syncLitebotBtn.addEventListener('click', syncWithLitebot);
    saveTokenBtn.addEventListener('click', saveGitHubToken);
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
        });
    });
    
    copyJsonBtn.addEventListener('click', copyExportData);
    importJsonBtn.addEventListener('click', importTasksFromJson);
    
    // Load GitHub token if exists
    const savedToken = localStorage.getItem('github_repo_token');
    if (savedToken && githubTokenInput) {
        githubTokenInput.value = savedToken;
        // Update sync button text
        if (syncLitebotBtn) {
            syncLitebotBtn.innerHTML = '<i class="fas fa-check-circle"></i> Auto-sync enabled';
            syncLitebotBtn.classList.add('btn-success');
        }
    }
    
    // Functions
    
    function updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    async function loadTasks() {
        // Try to load from repository first
        const repoTasks = await loadTasksFromRepository();
        if (repoTasks.length > 0) {
            tasks = repoTasks;
            console.log(`Loaded ${tasks.length} tasks from repository`);
        } else {
            // Fallback to localStorage for migration
            const localTasks = JSON.parse(localStorage.getItem('github-todo-tasks')) || [];
            if (localTasks.length > 0) {
                tasks = localTasks.map(convertOldTaskFormat);
                console.log(`Loaded ${tasks.length} tasks from localStorage (migrating)`);
                // Auto-migrate if we have a token
                const token = localStorage.getItem('github_repo_token');
                if (token) {
                    migrateLocalTasksToRepository();
                }
            } else {
                // Return an empty list if no tasks exist
                tasks = [];
            }
        }
        
        renderTasks();
        updateStats();
    }
    
    function convertOldTaskFormat(oldTask) {
        return {
            id: `task-${oldTask.id || Date.now() + Math.random()}`,
            title: oldTask.title,
            description: "",
            status: oldTask.completed ? "completed" : "pending",
            priority: oldTask.priority || "medium",
            created_by: "erdell",
            created_at: oldTask.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_to: ["lite_bot"],
            due_date: oldTask.dueDate || null,
            tags: [],
            estimated_time: null,
            dependencies: [],
            history: [
                {
                    action: "created",
                    by: "erdell",
                    at: oldTask.createdAt || new Date().toISOString(),
                    notes: `Migrated from old system: ${oldTask.title}`
                }
            ],
            notes: ""
        };
    }
    
    function addSampleTask() {
        // Set due date to tomorrow at 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const sampleTask = {
            id: `task-${Date.now()}`,
            title: "Check on my patent tomorrow at 10 AM",
            description: "",
            status: "pending",
            priority: "high",
            created_by: "erdell",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_to: ["lite_bot"],
            due_date: tomorrow.toISOString(),
            tags: ["sample", "reminder"],
            estimated_time: "30 minutes",
            dependencies: [],
            history: [
                {
                    action: "created",
                    by: "system",
                    at: new Date().toISOString(),
                    notes: "Sample task for first-time users"
                }
            ],
            notes: "This is a sample task. Edit or delete it as needed."
        };
        
        tasks.push(sampleTask);
        saveTaskToRepository(sampleTask, "create");
    }
    
    async function loadTasksFromRepository() {
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            console.log('No GitHub token found');
            return [];
        }
        
        try {
            // Load from active, completed, and archived directories, bypassing cache
            const cacheBuster = `?t=${Date.now()}`;
            const [activeResponse, completedResponse, archivedResponse] = await Promise.all([
                fetch(`${TASKS_ACTIVE_URL}${cacheBuster}`, {
                    headers: { 'Authorization': `token ${token}` }
                }).catch(() => ({ ok: false })),
                fetch(`${TASKS_COMPLETED_URL}${cacheBuster}`, {
                    headers: { 'Authorization': `token ${token}` }
                }).catch(() => ({ ok: false })),
                fetch(`${TASKS_ARCHIVED_URL}${cacheBuster}`, {
                    headers: { 'Authorization': `token ${token}` }
                }).catch(() => ({ ok: false }))
            ]);
            
            const tasks = [];
            
            const processDirectoryResponse = async (response, isArchived = false) => {
                if (response.ok) {
                    const files = await response.json();
                    for (const file of files) {
                        if (file.name.endsWith('.json')) {
                            // Also bypass cache when fetching tasks
                            const taskResponse = await fetch(`${file.download_url}?t=${Date.now()}`);
                            const task = await taskResponse.json();
                            if (isArchived) {
                                // Ensure tasks loaded from archived folder are explicitly marked
                                task.archived_at = task.archived_at || new Date().toISOString();
                            }
                            
                            // Handle GitHub API cache returning the same task from multiple directories
                            const existingIndex = tasks.findIndex(t => t.id === task.id);
                            if (existingIndex !== -1) {
                                if (isArchived) {
                                    tasks[existingIndex] = task; // Archived copy takes precedence over completed
                                }
                            } else {
                                tasks.push(task);
                            }
                        }
                    }
                }
            };

            await processDirectoryResponse(activeResponse);
            await processDirectoryResponse(completedResponse);
            await processDirectoryResponse(archivedResponse, true);
            
            return tasks;
        } catch (error) {
            console.error('Error loading tasks from repository:', error);
            return [];
        }
    }
    
    async function migrateLocalTasksToRepository() {
        const localTasks = JSON.parse(localStorage.getItem('github-todo-tasks')) || [];
        if (localTasks.length === 0) return;
        
        console.log(`Migrating ${localTasks.length} tasks to repository...`);
        
        let migrated = 0;
        for (const oldTask of localTasks) {
            const newTask = convertOldTaskFormat(oldTask);
            const success = await saveTaskToRepository(newTask, "migrate");
            if (success) migrated++;
        }
        
        console.log(`Migration complete: ${migrated}/${localTasks.length} tasks migrated`);
        
        // Clear old localStorage after successful migration
        if (migrated > 0) {
            localStorage.removeItem('github-todo-tasks');
            localStorage.setItem('tasks_migrated', 'true');
        }
    }
    
    async function addTask() {
        const title = newTaskInput.value.trim();
        if (!title) {
            newTaskInput.focus();
            return;
        }
        
        const task = {
            id: `task-${Date.now()}`,
            title: title,
            description: "",
            status: "pending",
            priority: prioritySelect.value || "medium",
            created_by: "erdell",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_to: ["lite_bot"],
            due_date: dueDateInput.value || null,
            tags: [],
            estimated_time: null,
            dependencies: [],
            history: [
                {
                    action: "created",
                    by: "erdell",
                    at: new Date().toISOString(),
                    notes: `Task created: ${title}`
                }
            ],
            notes: ""
        };
        
        // Save to repository
        const success = await saveTaskToRepository(task, "create");
        if (success) {
            tasks.push(task);
            renderTasks();
            updateStats();
            newTaskInput.value = '';
            newTaskInput.focus();
            
            // Reset due date
            dueDateInput.value = '';
        } else {
            alert('Failed to save task to repository. Check your GitHub token.');
        }
    }
    
    async function saveTaskToRepository(task, action = "update") {
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            console.log('No GitHub token found');
            return false;
        }
        
        const filename = `${task.id}.json`;
        const content = JSON.stringify(task, null, 2);
        const encodedContent = btoa(content);
        
        // Determine directory based on status structure
        const directory = task.archived_at ? "archived" : (task.status === "completed" ? "completed" : "active");
        const url = `${REPO_URL}/contents/tasks/${directory}/${filename}`;
        
        try {
            // Check for previous file in other directories to clean them up (e.g. unarchiving, completing)
            const directories = ["active", "completed", "archived"];
            for (const dir of directories) {
                if (dir === directory) continue; // Skip the destination directory
                const oldUrl = `${REPO_URL}/contents/tasks/${dir}/${filename}`;
                
                try {
                    const deleteCheckResponse = await fetch(oldUrl, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    
                    if (deleteCheckResponse.ok) {
                        const oldFileData = await deleteCheckResponse.json();
                        // Delete the old file
                        await fetch(oldUrl, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `token ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: `Move task to ${directory}: cleanup old copy of ${task.title}`,
                                sha: oldFileData.sha
                            })
                        });
                        console.log(`Cleaned up old copy from ${dir}`);
                    }
                } catch (e) {
                    console.log(`No old copy found in ${dir}`);
                }
            }
            // Check if file exists
            const checkResponse = await fetch(url, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            let sha = null;
            if (checkResponse.status === 200) {
                // File exists, get its SHA
                const existingFile = await checkResponse.json();
                sha = existingFile.sha;
                console.log(`File exists, SHA: ${sha.substring(0, 8)}...`);
            } else if (checkResponse.status === 404) {
                // File doesn't exist (normal for new tasks)
                console.log('File does not exist, will create new');
            } else {
                // Some other error
                console.error('Error checking file:', checkResponse.status, await checkResponse.text());
                return false;
            }
            
            // Prepare request data
            const requestData = {
                message: `${action} task: ${task.title}`,
                content: encodedContent
            };
            
            // Only include SHA if file exists (for updates)
            if (sha) {
                requestData.sha = sha;
            }
            
            // GitHub API always uses PUT for creating/updating files
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                console.log(`Task ${action}d successfully: ${task.id}`);
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to save task:', errorText);
                
                // Show user-friendly error
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.message.includes('Invalid request')) {
                        alert('Failed to save task. Please check your GitHub token has "repo" scope.');
                    } else {
                        alert(`Failed to save task: ${errorJson.message}`);
                    }
                } catch {
                    alert('Failed to save task to repository. Check your GitHub token.');
                }
                return false;
            }
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Network error saving task. Check your connection.');
            return false;
        }
    }
    
    async function deleteTaskFromRepository(taskId) {
        const token = localStorage.getItem('github_repo_token');
        if (!token) return false;
        
        // Try all three directories
        const directories = ['active', 'completed', 'archived'];
        
        for (const directory of directories) {
            const url = `${REPO_URL}/contents/tasks/${directory}/${taskId}.json`;
            
            try {
                // Check if file exists
                const checkResponse = await fetch(url, {
                    headers: { 'Authorization': `token ${token}` }
                });
                
                if (checkResponse.ok) {
                    const existingFile = await checkResponse.json();
                    const sha = existingFile.sha;
                    
                    const deleteResponse = await fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Delete task: ${taskId}`,
                            sha: sha
                        })
                    });
                    
                    if (deleteResponse.ok) {
                        console.log(`Task deleted successfully: ${taskId}`);
                        return true;
                    }
                }
            } catch (error) {
                console.error(`Error checking/deleteing from ${directory}:`, error);
            }
        }
        
        return false;
    }
    
    function renderTasks() {
        todoList.innerHTML = '';
        
        let filteredTasks = tasks;
        
        // Apply filter
        switch (currentFilter) {
            case 'pending':
                filteredTasks = tasks.filter(t => (t.status === 'pending' || t.status === 'in_progress') && !t.archived_at);
                break;
            case 'completed':
                filteredTasks = tasks.filter(t => t.status === 'completed' && !t.archived_at);
                break;
            case 'archived':
                filteredTasks = tasks.filter(t => t.archived_at);
                break;
            case 'high':
                filteredTasks = tasks.filter(t => (t.priority === 'high' || t.priority === 'critical') && !t.archived_at);
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(today) && !t.archived_at);
                break;
            case 'all':
            default:
                // For 'all', we typically want to hide archived unless we specifically chose the archived filter
                filteredTasks = tasks.filter(t => !t.archived_at && t.status !== 'archived');
                break;
        }
        
        if (filteredTasks.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No tasks found</h3>
                    <p>${currentFilter === 'all' ? 'Add your first task above!' : 'No tasks match this filter.'}</p>
                </div>
            `;
            return;
        }
        
        // Sort by priority (critical > high > medium > low) then by creation date
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        filteredTasks.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `todo-item ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority}`;
            taskEl.dataset.id = task.id;
            
            const priorityClass = `priority-${task.priority}`;
            const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            
            let dueDateText = '';
            if (task.due_date) {
                const dueDate = new Date(task.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (dueDate < today && task.status !== 'completed') {
                    dueDateText = `<span class="due-date overdue">Overdue: ${dueDate.toLocaleDateString()}</span>`;
                } else {
                    dueDateText = `<span class="due-date">Due: ${dueDate.toLocaleDateString()}</span>`;
                }
            }
            
            taskEl.innerHTML = `
                <div class="todo-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.status === 'completed' ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="todo-content">
                    <div class="todo-header">
                        <h3 class="todo-title">${escapeHtml(task.title)}</h3>
                        <span class="priority-badge ${priorityClass}">${priorityText}</span>
                    </div>
                    ${task.description ? `<p class="todo-description">${escapeHtml(task.description)}</p>` : ''}
                    <div class="todo-meta">
                        ${dueDateText}
                        <span class="task-id">${task.id}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn-icon edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskEl.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            
            const editBtn = taskEl.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editTask(task.id));
            
            const deleteBtn = taskEl.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            todoList.appendChild(taskEl);
        });
    }
    
    async function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const oldStatus = task.status;
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.updated_at = new Date().toISOString();
            
            // Check if we are un-archiving
            if (task.archived_at && task.status === 'pending') {
                delete task.archived_at;
                delete task.archived_by;
                task.history.push({
                    action: "status_update",
                    by: "erdell",
                    at: new Date().toISOString(),
                    notes: `Task unarchived and reopened`,
                    old_status: "archived",
                    new_status: "pending"
                });
            } else {
                task.history.push({
                    action: "status_update",
                    by: "erdell",
                    at: new Date().toISOString(),
                    notes: `Task ${task.status === 'completed' ? 'completed' : 'reopened'}`,
                    old_status: oldStatus,
                    new_status: task.status
                });
            }
            
            // Save to repository
            const success = await saveTaskToRepository(task, "update");
            if (success) {
                renderTasks();
                updateStats();
            } else {
                // Revert on error
                task.status = oldStatus;
                task.history.pop();
                alert('Failed to update task in repository. Check your GitHub token.');
            }
        }
    }
    
    async function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newTitle = prompt('Edit task title:', task.title);
        if (newTitle === null) return; // User cancelled
        
        if (newTitle.trim()) {
            const oldTitle = task.title;
            task.title = newTitle.trim();
            task.updated_at = new Date().toISOString();
            
            task.history.push({
                action: "edit",
                by: "erdell",
                at: new Date().toISOString(),
                notes: `Title changed from "${oldTitle}" to "${task.title}"`
            });
            
            // Save to repository
            const success = await saveTaskToRepository(task, "edit");
            if (success) {
                renderTasks();
            } else {
                // Revert on error
                task.title = oldTitle;
                task.history.pop();
                alert('Failed to update task in repository. Check your GitHub token.');
            }
        }
    }
    
    async function deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        // Delete from repository
        const success = await deleteTaskFromRepository(taskId);
        if (success) {
            // Remove from local array
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            updateStats();
        } else {
            alert('Failed to delete task from repository. It may have already been deleted.');
        }
    }
    
    async function clearCompletedTasks() {
        if (!confirm('Move all completed tasks to archived? You can restore them later.')) {
            return;
        }
        
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            alert('Please save your GitHub token first.');
            return;
        }
        
        // Get all completed tasks
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const completedUrl = `${REPO_URL}/contents/tasks/completed${cacheBuster}`;
            const response = await fetch(completedUrl, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (response.status === 404) {
                alert('No completed tasks found.');
                return;
            }
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error fetching completed tasks:', error);
                alert('Error fetching completed tasks. Check console.');
                return;
            }
            
            const completedTasks = await response.json();
            
            if (completedTasks.length === 0) {
                alert('No completed tasks to archive.');
                return;
            }
            
            let archivedCount = 0;
            let errors = [];
            
            // Move each completed task to archived
            for (const taskFile of completedTasks) {
                try {
                    // Get task content (bypassing cache again)
                    const fileCacheBuster = `&t=${Date.now()}`;
                    const taskResponse = await fetch(`${REPO_URL}/contents/tasks/completed/${taskFile.name}?ref=main${fileCacheBuster}`, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    
                    if (!taskResponse.ok) {
                        errors.push(`Failed to read ${taskFile.name}: ${taskResponse.status}`);
                        continue;
                    }
                    
                    const fileData = await taskResponse.json();
                    const taskData = JSON.parse(atob(fileData.content));
                    
                    // Update task for archiving
                    taskData.archived_at = new Date().toISOString();
                    taskData.archived_by = 'erdell';
                    taskData.history.push({
                        timestamp: new Date().toISOString(),
                        action: 'archived',
                        by: 'erdell',
                        notes: 'Moved to archived via archive completed'
                    });
                    
                    const filename = taskFile.name;
                    const content = JSON.stringify(taskData, null, 2);
                    const encodedContent = btoa(content);
                    
                    // Create in archived directory
                    const archivedUrl = `${REPO_URL}/contents/tasks/archived/${filename}`;
                    const createResponse = await fetch(archivedUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Archive task: ${taskData.title}`,
                            content: encodedContent
                        })
                    });
                    
                    if (createResponse.ok) {
                        // Delete from completed directory
                        const deleteUrl = `${REPO_URL}/contents/tasks/completed/${filename}`;
                        const deleteResponse = await fetch(deleteUrl, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `token ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: `Remove from completed: ${taskData.title}`,
                                sha: taskFile.sha
                            })
                        });
                        
                        if (deleteResponse.ok) {
                            archivedCount++;
                            console.log(`✅ Archived: ${taskData.title}`);
                            
                            // Update the task in the local array to reflect its new state
                            const taskIndex = tasks.findIndex(t => t.id === taskData.id);
                            if (taskIndex !== -1) {
                                tasks[taskIndex] = taskData;
                            }
                        } else {
                            errors.push(`Failed to delete ${filename} from completed`);
                        }
                    } else {
                        errors.push(`Failed to archive ${filename}`);
                    }
                } catch (error) {
                    errors.push(`Error processing ${taskFile.name}: ${error.message}`);
                }
            }
            
            // Show results
            if (archivedCount > 0) {
                alert(`✅ Archived ${archivedCount} task(s) to archived directory.`);
                renderTasks();
                updateStats();
            }
            
            
            if (errors.length > 0) {
                console.error('Archive errors:', errors);
                if (archivedCount === 0) {
                    alert(`❌ Failed to archive tasks. Check console for details.`);
                } else {
                    alert(`⚠️ Archived ${archivedCount} tasks, but had ${errors.length} error(s). Check console.`);
                }
            }
            
        } catch (error) {
            console.error('Error in clearCompletedTasks:', error);
            alert('Error archiving tasks. Check console.');
        }
    }
    
    function updateStats() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        
        const todayTasks = tasks.filter(t => {
            if (!t.created_at) return false;
            const createdDate = new Date(t.created_at).toISOString().split('T')[0];
            return createdDate === today;
        }).length;
        
        const weekTasks = tasks.filter(t => {
            if (!t.created_at) return false;
            const createdDate = new Date(t.created_at);
            return createdDate >= weekAgo;
        }).length;
        
        const overdueTasks = tasks.filter(t => {
            if (t.status === 'completed' || !t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate < now;
        }).length;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        todayTasksEl.textContent = todayTasks;
        weekTasksEl.textContent = weekTasks;
        overdueTasksEl.textContent = overdueTasks;
    }
    
    function openExportModal() {
        const exportData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            source: 'github-todo-website-repository',
            repository: `${REPO_OWNER}/${REPO_NAME}`,
            tasks: tasks,
            stats: {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                pending: tasks.filter(t => t.status !== 'completed').length
            }
        };
        
        exportDataTextarea.value = JSON.stringify(exportData, null, 2);
        modal.classList.add('active');
        
        // Switch to export tab
        modalTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.modal-tab[data-tab="export"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('export-tab').classList.add('active');
    }
    
    function openImportModal() {
        importDataTextarea.value = '';
        modal.classList.add('active');
        
        // Switch to import tab
        modalTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.modal-tab[data-tab="import"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('import-tab').classList.add('active');
    }
    
    function closeModalWindow() {
        modal.classList.remove('active');
    }
    
    function copyExportData() {
        exportDataTextarea.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyJsonBtn.innerHTML;
        copyJsonBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyJsonBtn.classList.add('btn-success');
        
        setTimeout(() => {
            copyJsonBtn.innerHTML = originalText;
            copyJsonBtn.classList.remove('btn-success');
        }, 2000);
    }
    
    async function importTasksFromJson() {
        const jsonString = importDataTextarea.value.trim();
        if (!jsonString) {
            alert('Please paste JSON data to import');
            return;
        }
        
        try {
            const importData = JSON.parse(jsonString);
            let importedTasks = [];
            
            // Handle different import formats
            if (importData.version === '1.0' || importData.version === '2.0') {
                // New format (from export)
                importedTasks = importData.tasks || [];
            } else if (Array.isArray(importData)) {
                // Array of tasks
                importedTasks = importData;
            } else {
                // Old localStorage format
                importedTasks = importData.tasks || [];
            }
            
            if (importedTasks.length === 0) {
                alert('No tasks found in import data');
                return;
            }
            
            if (!confirm(`Import ${importedTasks.length} tasks? This will add them to your repository.`)) {
                return;
            }
            
            let imported = 0;
            for (const importTask of importedTasks) {
                // Convert to new format if needed
                let task;
                if (importTask.id && importTask.id.startsWith('task-')) {
                    // Already in new format
                    task = importTask;
                } else {
                    // Convert from old format
                    task = convertOldTaskFormat(importTask);
                }
                
                // Ensure unique ID
                if (tasks.some(t => t.id === task.id)) {
                    task.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
                
                // Save to repository
                const success = await saveTaskToRepository(task, "import");
                if (success) {
                    tasks.push(task);
                    imported++;
                }
            }
            
            closeModalWindow();
            renderTasks();
            updateStats();
            
            alert(`Imported ${imported} tasks successfully`);
            
        } catch (error) {
            alert(`Error importing tasks: ${error.message}`);
            console.error('Import error:', error);
        }
    }
    
    async function syncWithLitebot() {
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            alert('Please set your GitHub token first');
            githubTokenInput.focus();
            return;
        }
        
        // Test repository access
        const testResponse = await fetch(REPO_URL, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!testResponse.ok) {
            alert('❌ Invalid token or repository access. Please check your token has repo scope.');
            return;
        }
        
        // Update sync button to show auto-sync is enabled
        syncLitebotBtn.innerHTML = '<i class="fas fa-check-circle"></i> Auto-sync enabled';
        syncLitebotBtn.classList.add('btn-success');
        
        alert(`✅ Repository sync configured!\n\nYour tasks are now automatically saved to:\nhttps://github.com/${REPO_OWNER}/${REPO_NAME}\n\nlite_bot will check for updates every 15-30 minutes.`);
    }
    
    async function saveGitHubToken() {
        const token = githubTokenInput.value.trim();
        if (!token) {
            alert('Please enter a GitHub token');
            githubTokenInput.focus();
            return;
        }
        
        // Test the token by trying to access the repository
        try {
            const response = await fetch(REPO_URL, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (response.ok) {
                // Token works, save it
                localStorage.setItem('github_repo_token', token);
                alert('✅ GitHub token saved successfully!\n\nYour tasks will now sync automatically with the repository.');
                
                // Update sync button
                if (syncLitebotBtn) {
                    syncLitebotBtn.innerHTML = '<i class="fas fa-check-circle"></i> Auto-sync enabled';
                    syncLitebotBtn.classList.add('btn-success');
                }
                
                // Migrate existing tasks if any
                const localTasks = JSON.parse(localStorage.getItem('github-todo-tasks')) || [];
                if (localTasks.length > 0) {
                    if (confirm(`Migrate ${localTasks.length} existing tasks to repository?`)) {
                        await migrateLocalTasksToRepository();
                        // Reload tasks from repository
                        await loadTasks();
                    }
                }
                
            } else {
                alert('❌ Invalid token. Please check that:\n1. Token has "repo" scope\n2. Repository "erdellmfx2/todo-manager" exists\n3. You have access to the repository');
            }
        } catch (error) {
            alert(`❌ Error testing token: ${error.message}`);
            console.error('Token test error:', error);
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Auto-save tasks on page unload (backup)
    window.addEventListener('beforeunload', function() {
        // Keep localStorage as backup
        localStorage.setItem('github-todo-tasks-backup', JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.status === 'completed',
            priority: t.priority,
            createdAt: t.created_at,
            dueDate: t.due_date
        }))));
    });

    
    // ======================
    // ARCHIVE SYSTEM FUNCTIONS
    // ======================
    
    async function showArchivedTasks() {
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            alert('Please save your GitHub token first.');
            return;
        }
        
        try {
            const archivedUrl = `${REPO_URL}/contents/tasks/archived`;
            const response = await fetch(archivedUrl, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (response.status === 404) {
                alert('No archived tasks found.');
                return;
            }
            
            if (!response.ok) {
                const error = await response.text();
                console.error('Error fetching archived tasks:', error);
                alert('Error fetching archived tasks. Check console.');
                return;
            }
            
            const archivedTasks = await response.json();
            
            if (archivedTasks.length === 0) {
                alert('No archived tasks found.');
                return;
            }
            
            // Create modal for archived tasks
            const modal = document.createElement('div');
            modal.className = 'archive-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'archive-modal-content';
            modalContent.style.cssText = 'background: white; padding: 20px; border-radius: 10px; max-width: 600px; max-height: 80vh; overflow-y: auto; width: 90%;';
            
            let html = `<h2 style="margin-top: 0;">📦 Archived Tasks (${archivedTasks.length})</h2>`;
            
            for (const taskFile of archivedTasks) {
                const taskResponse = await fetch(`${REPO_URL}/contents/tasks/completed/${taskFile.name}?ref=main`, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                
                if (taskResponse.ok) {
                    const fileData = await taskResponse.json();
                    const taskData = JSON.parse(atob(fileData.content));
                    
                    html += `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
                            <h3 style="margin: 0 0 5px 0;">${taskData.title}</h3>
                            <p style="margin: 0 0 5px 0; color: #666;">${taskData.description || 'No description'}</p>
                            <div style="font-size: 12px; color: #888;">
                                Archived: ${new Date(taskData.archived_at).toLocaleDateString()}<br>
                                Originally created: ${new Date(taskData.created_at).toLocaleDateString()}
                            </div>
                            <button onclick="restoreArchivedTask('${taskFile.name}')" 
                                    style="margin-top: 10px; padding: 5px 10px; background: #2ea44f; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                🔄 Restore to Active
                            </button>
                        </div>
                    `;
                }
            }
            
            html += `
                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="this.closest('.archive-modal').remove()" 
                            style="padding: 8px 16px; background: #ddd; border: none; border-radius: 3px; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
            
            modalContent.innerHTML = html;
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
        } catch (error) {
            console.error('Error showing archived tasks:', error);
            alert('Error loading archived tasks. Check console.');
        }
    }
    
    async function restoreArchivedTask(filename) {
        const token = localStorage.getItem('github_repo_token');
        if (!token) {
            alert('Please save your GitHub token first.');
            return;
        }
        
        if (!confirm('Restore this task to active tasks?')) {
            return;
        }
        
        try {
            // Get archived task
            const archivedUrl = `${REPO_URL}/contents/tasks/archived/${filename}`;
            const getResponse = await fetch(archivedUrl, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (!getResponse.ok) {
                alert('Failed to get archived task.');
                return;
            }
            
            const taskFile = await getResponse.json();
            const taskResponse = await fetch(`${REPO_URL}/contents/tasks/completed/${taskFile.name}?ref=main`, {
                        headers: { 'Authorization': `token ${token}` }
                    });
            
            const fileData = await taskResponse.json();
            const taskData = JSON.parse(atob(fileData.content));
            
            // Update task for restoration
            taskData.status = 'pending';
            delete taskData.archived_at;
            delete taskData.archived_by;
            taskData.history.push({
                timestamp: new Date().toISOString(),
                action: 'restored',
                by: 'erdell',
                notes: 'Restored from archived'
            });
            
            const content = JSON.stringify(taskData, null, 2);
            const encodedContent = btoa(content);
            
            // Create in active directory
            const activeUrl = `${REPO_URL}/contents/tasks/active/${filename}`;
            const createResponse = await fetch(activeUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Restore task: ${taskData.title}`,
                    content: encodedContent
                })
            });
            
            if (createResponse.ok) {
                // Delete from archived
                const deleteResponse = await fetch(archivedUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Remove from archived: ${taskData.title}`,
                        sha: taskFile.sha
                    })
                });
                
                if (deleteResponse.ok) {
                    alert(`✅ Restored: ${taskData.title}`);
                    
                    // Close modal and refresh
                    const modal = document.querySelector('.archive-modal');
                    if (modal) modal.remove();
                    
                    loadTasks();
                } else {
                    alert('Restored but failed to remove from archived.');
                }
            } else {
                alert('Failed to restore task.');
            }
            
        } catch (error) {
            console.error('Error restoring task:', error);
            alert('Error restoring task. Check console.');
        }
    }
    
    // Add "View Archived" button to UI
    function addArchiveButton() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // Check if button already exists
        if (document.getElementById('view-archived-btn')) return;
        
        const archiveBtn = document.createElement('button');
        archiveBtn.id = 'view-archived-btn';
        archiveBtn.className = 'btn btn-secondary';
        archiveBtn.innerHTML = '<i class="fas fa-archive"></i> View Archived';
        archiveBtn.style.marginTop = '10px';
        archiveBtn.onclick = showArchivedTasks;
        
        sidebar.appendChild(archiveBtn);
    }
    
    // Update clear completed button text
    function updateClearButtonText() {
        const clearBtn = document.getElementById('clear-completed');
        if (clearBtn) {
            clearBtn.innerHTML = '<i class="fas fa-archive"></i> Archive Completed';
            clearBtn.title = 'Move completed tasks to archived (can be restored later)';
        }
    }
    
    // Initialize archive system
    addArchiveButton();
    updateClearButtonText();
    });