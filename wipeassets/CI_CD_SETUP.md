# CI/CD Setup Guide - GitHub Actions

## Overview

This guide explains how to set up and use GitHub Actions for Continuous Integration/Continuous Deployment (CI/CD) in your Toilet Review System project.

## What is CI/CD?

**CI (Continuous Integration):** Automatically test and validate code changes when pushed
**CD (Continuous Deployment):** Automatically deploy working code to production

---

## 📋 Prerequisites

✅ **What You Have:**
- GitHub repository (sanketmahadik666/Abrick)
- Workflow files created in `.github/workflows/`
- Node.js backend with npm

✅ **What You Need:**
- GitHub account with admin access to repository
- Understanding of Git push/pull requests
- Environment variables configured

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Workflow Files Exist

```bash
# Check if workflow files are in place
ls -la /home/sanket/Abrick/.github/workflows/

# You should see:
# - ci-cd.yml
# - deployment.yml
```

### Step 2: Push to GitHub

```bash
cd /home/sanket/Abrick

# Add all files
git add -A

# Commit changes
git commit -m "Setup GitHub Actions CI/CD pipeline"

# Push to master branch
git push origin master
```

### Step 3: View Workflow in GitHub

1. Go to your repository: https://github.com/sanketmahadik666/Abrick
2. Click on **Actions** tab
3. Select **CI/CD Pipeline** workflow
4. You'll see all runs listed with status (✓ passed or ✗ failed)

---

## 📊 Workflow Overview

### 1. **CI/CD Pipeline** (`ci-cd.yml`)

Runs on: `push` to master/main/develop and on `pull requests`

**Jobs included:**

#### Job 1: Lint & Code Quality
```
✓ Checks Node.js version
✓ Installs dependencies
✓ Validates JavaScript syntax
✓ Validates package.json
```
**Time: ~1-2 minutes**

#### Job 2: Backend Testing
```
✓ Installs dependencies
✓ Runs npm tests (if configured)
✓ Starts server and verifies it responds
✓ Tests API endpoint
```
**Time: ~2-3 minutes**

#### Job 3: Frontend Validation
```
✓ Checks HTML file structure
✓ Validates script tags
✓ Checks for common issues
```
**Time: ~30 seconds**

#### Job 4: Security Scan
```
✓ Checks for hardcoded secrets
✓ Looks for API keys in code
✓ General security validation
```
**Time: ~30 seconds**

#### Job 5: Dependency Check
```
✓ Lists outdated packages
✓ Runs npm audit
✓ Identifies vulnerabilities
```
**Time: ~1 minute**

#### Job 6: Build Status
```
✓ Aggregates all results
✓ Reports overall status
```
**Time: ~10 seconds**

#### Job 7: Documentation Check
```
✓ Verifies documentation files exist
✓ Counts documentation lines
```
**Time: ~10 seconds**

**Total Time: ~5-7 minutes per run**

---

### 2. **Deployment Check** (`deployment.yml`)

Runs on: `push` to master/main branches

**Checks:**
```
✓ Verifies branch is production branch
✓ Confirms all required files exist
✓ Validates deployment readiness
✓ Provides deployment instructions
```

---

## 🎯 How It Works

### When You Push Code

```
1. You push to GitHub
   ↓
2. GitHub detects push event
   ↓
3. Runs CI/CD Pipeline workflow
   ↓
4. Creates virtual machine (Ubuntu)
   ↓
5. Runs all jobs in parallel (where possible)
   ↓
6. Collects results
   ↓
7. Reports status (pass/fail)
   ↓
8. Shows results in Actions tab
```

### When You Create Pull Request

```
1. Create PR to master/main
   ↓
2. GitHub detects PR event
   ↓
3. Runs CI/CD Pipeline workflow
   ↓
4. All checks run automatically
   ↓
5. Results shown on PR page
   ↓
6. Only allows merge if all checks pass (if required)
```

---

## 📍 Viewing Workflow Results

### In GitHub Web Interface

1. Go to repository → **Actions** tab
2. Select the workflow run
3. Click on a job to see detailed logs

### Workflow Badge

Add this to your README.md to show CI/CD status:

```markdown
![CI/CD Pipeline](https://github.com/sanketmahadik666/Abrick/actions/workflows/ci-cd.yml/badge.svg)
```

This displays: ✓ passing or ✗ failing status

---

## 🔧 Customizing Workflows

### Modify Trigger Events

Edit `.github/workflows/ci-cd.yml`:

```yaml
on:
  push:
    branches: [ master, main, develop ]  # Add/remove branches
  pull_request:
    branches: [ master, main, develop ]
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight
```

### Add Environment Variables

```yaml
env:
  NODE_VERSION: '18.x'
  PORT: 3000
  JWT_SECRET: ${{ secrets.JWT_SECRET }}  # From GitHub Secrets
```

### Add Build/Deploy Step

```yaml
- name: Build Docker image
  run: docker build -t abrick:latest .

- name: Deploy to server
  run: |
    ssh user@server.com "cd /app && npm install && npm start"
```

---

## 🔐 Using GitHub Secrets

For sensitive data (API keys, tokens, passwords):

### Step 1: Create Secret in GitHub

1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secret name (e.g., `JWT_SECRET`)
4. Add secret value
5. Click **Add secret**

### Step 2: Use in Workflow

```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}

# Or in a step:
- name: Use secret
  run: echo "Secret is: ${{ secrets.JWT_SECRET }}"
```

**Important:** Secrets are masked in logs (shown as `***`)

---

## ✅ Workflow Status Badges

### Add to README.md

```markdown
# Toilet Review System

![CI/CD Pipeline](https://github.com/sanketmahadik666/Abrick/actions/workflows/ci-cd.yml/badge.svg)
![Deployment Check](https://github.com/sanketmahadik666/Abrick/actions/workflows/deployment.yml/badge.svg)

Latest status: Check the **Actions** tab above
```

---

## 🐛 Troubleshooting

### Workflow Failed: "npm: command not found"

**Cause:** Node.js not installed in runner
**Fix:** Already handled in workflow with `setup-node` action

### Workflow Failed: "package.json not found"

**Cause:** Running from wrong directory
**Fix:** Ensure workflow is in correct directory (backend/)

```yaml
- name: Install dependencies
  run: cd backend && npm install  # Add 'cd backend'
```

### Workflow Timeout

**Cause:** Job taking too long
**Fix:** Increase timeout in job config:

```yaml
jobs:
  backend-test:
    timeout-minutes: 30  # Default is 360 minutes
```

### Need to Skip CI/CD

Add `[skip ci]` to commit message:

```bash
git commit -m "Quick fix [skip ci]"
git push origin master
```

---

## 📈 Viewing Workflow Artifacts

Some workflows generate artifacts (test reports, logs):

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download zip file
4. Extract and review

---

## 🎓 Example: Adding Tests

To add actual test execution:

### 1. Create test file

```javascript
// backend/test/server.test.js
const request = require('supertest');

describe('GET /api/toilet/map', () => {
  it('should return array of toilets', async () => {
    const res = await request('http://localhost:3000')
      .get('/api/toilet/map');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### 2. Update package.json

```json
{
  "scripts": {
    "test": "jest --detectOpenHandles --forceExit"
  }
}
```

### 3. Workflow automatically runs tests

```yaml
- name: Run tests
  run: cd backend && npm test
```

---

## 🚢 Setting Up Auto-Deployment

### Option 1: Deploy to Heroku

```yaml
- name: Deploy to Heroku
  uses: AkhileshNS/heroku-deploy@v3.13.15
  with:
    heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
    heroku_app_name: "your-app-name"
    heroku_email: "your-email@example.com"
```

### Option 2: Deploy to VPS with SSH

```yaml
- name: Deploy to VPS
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh -o StrictHostKeyChecking=no user@your-vps.com "cd /app && git pull && npm install && pm2 restart all"
```

### Option 3: Deploy to AWS/Google Cloud

Use AWS CLI or gcloud commands in workflow

---

## 📅 Scheduled Workflows

Run checks on a schedule (daily, weekly):

```yaml
on:
  schedule:
    - cron: '0 0 * * MON'  # Every Monday at midnight
    - cron: '0 */6 * * *'  # Every 6 hours
```

Cron format: `minute hour day month day-of-week`

---

## 🎯 Best Practices

### ✅ DO

- ✓ Run tests before merging to master
- ✓ Use branch protection rules
- ✓ Store secrets in GitHub Secrets
- ✓ Keep workflow files in `.github/workflows/`
- ✓ Use descriptive job names
- ✓ Add documentation about CI/CD
- ✓ Monitor workflow runs regularly

### ❌ DON'T

- ✗ Store secrets in workflow files (hardcoded)
- ✗ Run long-running tasks in CI (>1 hour)
- ✗ Commit large files to trigger workflows
- ✗ Use loose branch protection (allow force push)
- ✗ Ignore failed workflows
- ✗ Deploy to production without tests

---

## 📋 Checklist: First Time Setup

- [ ] Workflow files exist in `.github/workflows/`
- [ ] Push changes to GitHub
- [ ] Check Actions tab
- [ ] Verify all jobs passed
- [ ] Review workflow logs
- [ ] Add secrets if needed
- [ ] Enable branch protection (optional)
- [ ] Share CI/CD status in team

---

## 🔗 Useful Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Workflow Syntax:** https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Available Actions:** https://github.com/marketplace?type=actions
- **Cron Syntax:** https://crontab.guru/

---

## 📞 Common Commands

```bash
# View local workflow status (after push)
git log --oneline -5

# Force workflow rerun on GitHub (web UI)
# Actions tab → Select run → Re-run all jobs

# Check workflow file syntax
# Use GitHub's workflow editor (visual validation)

# Download workflow logs
# Actions tab → Select run → Download logs
```

---

## 🎉 You're All Set!

Your CI/CD pipeline is now active. Every time you push code:

1. ✓ Code is automatically tested
2. ✓ Security checks run
3. ✓ Documentation is validated
4. ✓ Results are available in Actions tab
5. ✓ Team gets instant feedback

**Next Step:** Push to GitHub and watch your first workflow run!

---

**Last Updated:** December 26, 2025
**Status:** Ready to Use
**Support:** Check GitHub Actions documentation for advanced features
