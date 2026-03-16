# Deployment Guide

## Quick Start

1. **Download the files** to your computer
2. **Open `index.html`** in your web browser
3. **Start using** the to-do list immediately

## GitHub Pages Deployment

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Name your repository (e.g., `github-todo-list`)
3. Choose "Public" or "Private"
4. Click "Create repository"

### Step 2: Upload Files
```bash
# Clone your repository
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME

# Copy all files from github-todo-website folder
cp -r ../github-todo-website/* .

# Commit and push
git add .
git commit -m "Add GitHub To-Do List website"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" → "Pages"
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"

### Step 4: Access Your Site
Your site will be available at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## Netlify Deployment (Alternative)

1. Go to https://app.netlify.com/drop
2. Drag and drop the `github-todo-website` folder
3. Your site will be deployed instantly
4. Netlify will give you a custom URL

## Vercel Deployment (Alternative)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the folder: `cd github-todo-website`
3. Run: `vercel`
4. Follow the prompts to deploy

## Custom Domain (Optional)

### For GitHub Pages:
1. Buy a domain from a registrar (Namecheap, GoDaddy, etc.)
2. In repository Settings → Pages → Custom domain
3. Enter your domain
4. Configure DNS records as instructed

### For Netlify/Vercel:
- Both platforms have easy domain setup in their dashboards

## Updating Your Site

### Manual Update:
1. Make changes to files
2. Commit and push to GitHub
3. GitHub Pages will auto-deploy (takes 1-2 minutes)

### Automatic Updates (GitHub Actions):
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: echo "Deploying to GitHub Pages"
```

## Troubleshooting

### GitHub Pages Not Updating
- Wait 1-2 minutes for deployment
- Check GitHub Actions tab for errors
- Clear browser cache

### Local Storage Not Working
- Ensure cookies are enabled
- Try in incognito/private mode
- Check browser console for errors (F12 → Console)

### Styling Issues
- Check CSS file is loading (F12 → Network)
- Ensure all files are in same directory
- Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Security Notes
- All data is stored locally in browser (no server required)
- No personal data is transmitted anywhere
- Export/Import uses plain JSON (keep backups)

## Support
For issues or questions:
1. Check browser console for errors (F12)
2. Ensure all files are present
3. Try different browser
4. Contact developer for assistance