# ⚙️ Commit Strategy & Repository Maintenance Guide

> How to keep this repo looking active, professional, and purposeful.

---

## 🚀 First Commit Setup

Run these commands to initialize your repository locally and push to GitHub:

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. First commit — sets the tone for the whole repo
git commit -m "chore: initialize JavaScript Mastery Lab

- Add README with full repo overview and learning philosophy
- Add learning-log.md with template and first 3 day entries
- Add roadmap.md with 6-phase curriculum (10 modules)
- Add 01-basics/concepts/variables-and-types.js with annotations
- Add COMMIT_GUIDE.md with maintenance strategy

Starting the journey: basics → backend. Building in public."

# 4. Connect to GitHub
git remote add origin https://github.com/shhivaanssh/javascript-mastery-lab.git
git branch -M main
git push -u origin main
```

---

## 📝 Commit Naming Convention

| Prefix | When To Use | Example |
|--------|-------------|---------|
| `feat:` | New concept file, new exercise | `feat: add closure examples with counter factory` |
| `docs:` | README, learning log, roadmap updates | `docs: update learning log — week 2 closures` |
| `project:` | New or updated mini/real-world project | `project: build async weather app v1` |
| `exercise:` | Add or solve a challenge | `exercise: solve array flattening without built-ins` |
| `refactor:` | Improve existing code quality | `refactor: rewrite callback chain as async/await` |
| `fix:` | Correct bugs or wrong examples | `fix: correct this binding in arrow function example` |
| `chore:` | Repo maintenance, restructuring | `chore: reorganize 03-arrays folder structure` |

---

## 📅 Daily Commit Habits

### The Minimum Viable Day
Even on a slow day, commit something:
```bash
docs: update learning log — day 7 notes on scope
```

### A Good Learning Day
```bash
feat: add scope chain visualization example
exercise: complete 5 predict-the-output scope challenges
docs: update learning log — scope clicked today
```

### A Project Day
```bash
project: add weather app — fetch + error handling
project: weather app — add loading state and retry logic
docs: update README mini projects table
```

---

## 📋 Weekly Maintenance Checklist

```
[ ] Add at least one learning log entry
[ ] Update roadmap.md module status checkboxes
[ ] Update README progress stats section
[ ] Push at least 3 meaningful commits
[ ] Link any new projects in README project table
```

---

## 🗂️ How To Add a New Module

```bash
mkdir -p 02-functions-and-scope/concepts
mkdir -p 02-functions-and-scope/exercises
mkdir -p 02-functions-and-scope/project

# Create concept file
touch 02-functions-and-scope/concepts/functions-intro.js

# Create README for the module
touch 02-functions-and-scope/README.md
```

Module README template:
```markdown
# Module 02 — Functions & Scope

## What You'll Learn
- Function declarations vs expressions
- Closures
- The scope chain

## Files
- `concepts/` — annotated concept examples
- `exercises/` — challenges (try before looking at solutions)
- `project/` — module capstone build

## Status: 🔄 In Progress
```

---

## 💡 Content Ideas When Stuck

If you're not sure what to commit today, try one of these:

- **Annotate old code** — go back to a concept file and add better comments
- **Add a "why" note** — why does this JS behavior exist? Add it to the file
- **Solve one exercise** — pick one challenge from any module
- **Refactor something** — take an old example and rewrite it more cleanly
- **Write a log entry** — document what you've been thinking about
- **Add a TLDR** — at the top of any concept file, add a 2-line summary

---

## 🔗 Keeping README Updated

When you finish a module:
1. Change its roadmap status from `⏳` to `✅`
2. Update the progress stats section in README
3. Link the completed project in the Mini Projects table

---

<sub>Consistency beats intensity. One commit a day compounds over a year.</sub>
