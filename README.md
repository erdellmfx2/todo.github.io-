# GitHub To-Do List Website

A GitHub-inspired to-do list application with a dark theme and GitHub-like interface.

## Features

- **GitHub-themed UI**: Dark theme with GitHub colors and styling
- **Task Management**: Add, edit, delete, and mark tasks as complete
- **Priority Levels**: Low, Medium, High, Critical priorities with color coding
- **Filtering**: Filter tasks by status (All, Pending, Completed, High Priority)
- **Local Storage**: Tasks are saved in your browser's local storage
- **Import/Export**: Export tasks as JSON or import from JSON
- **Statistics**: Track task completion rates and productivity metrics
- **Responsive Design**: Works on desktop and mobile devices

## Files Structure

```
github-todo-website/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## How to Use

1. **Open the website**: Simply open `index.html` in your web browser
2. **Add a task**: Type in the input field and click "Add Task" or press Enter
3. **Set priority**: Choose priority level before adding task
4. **Sample task**: First-time users will see a sample "Check on my patent" task
4. **Manage tasks**:
   - ✅ Checkbox: Mark task as complete/incomplete
   - ✏️ Edit button: Edit task title
   - 🗑️ Delete button: Remove task
5. **Filter tasks**: Use the filter buttons to view specific task groups
6. **Clear completed**: Remove all completed tasks at once
7. **Import/Export**: Backup or restore your tasks using JSON

## Hosting Options

### Option 1: Local Use
Simply open `index.html` in your web browser. Tasks will be saved locally.

### Option 2: GitHub Pages
1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Repository Settings → Pages
4. Select "main" branch as source
5. Your site will be published at `https://[username].github.io/[repository-name]`

### Option 3: Netlify/Vercel
Drag and drop the folder to Netlify or Vercel for free hosting.

## Customization

### Change Colors
Edit the CSS variables in `style.css` at the top of the file:
```css
:root {
    --github-dark: #0d1117;
    --github-dark-secondary: #161b22;
    --github-border: #30363d;
    --github-text: #c9d1d9;
    /* ... etc ... */
}
```

### Add Features
- **Due Dates**: Extend the task object to include due dates
- **Categories/Tags**: Add tagging system for tasks
- **Collaboration**: Add sharing functionality
- **Cloud Sync**: Connect to a backend service

## Browser Compatibility
Works in all modern browsers (Chrome, Firefox, Safari, Edge) that support:
- Local Storage API
- ES6 JavaScript
- CSS Grid/Flexbox

## License
Free to use and modify for personal or commercial projects.

## Credits
Created for Erdell Maurice as a GitHub-inspired to-do list application.

## Sample Tasks
The app includes sample tasks to demonstrate functionality. These can be cleared once you start adding your own tasks.