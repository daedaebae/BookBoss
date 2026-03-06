---
description: How to prepare docs, scan for sensitive info, and publish a new GitHub release
---

// turbo-all

## New Release Workflow

This workflow ensures the codebase is clean, documentation is updated, and a tagged release is published to GitHub with meaningful commit messages.

**Rules:**
- NEVER commit secrets, PII, PHI, or any other sensitive information.
- NEVER push directly if a scan finds sensitive data — remove it first.
- NEVER commit the `Design/` folder or `.docker_test/`.
- Always bump the version in BOTH `book-boss-react/package.json` AND `server/package.json`.

---

## Steps

### 1. Review and update design/wiki documentation.
Review the following documents and update them to reflect any recent changes:
- `Design/Fix_first.md` — ensure items completed in this cycle are checked off and archived if the list exceeds 10 items.
- `Design/planned_features.md` — ensure recently implemented features are checked off.
- `server/API_WIKI.md` — ensure new or changed endpoints are documented.

### 2. Scan for sensitive information.
```bash
cd /Users/user/Projects/BookBoss
# Scan for secrets / keys / passwords in tracked files
git diff HEAD --name-only | xargs grep -rn -E "(password|secret|api[_-]?key|token|private[_-]?key|DATABASE_URL|JWT_SECRET|SMTP_PASS)" --include="*.ts" --include="*.js" --include="*.json" --include="*.env" 2>/dev/null || echo "No sensitive info found in changed files."
```

### 3. Confirm nothing sensitive exists in the staging area.
```bash
cd /Users/user/Projects/BookBoss
git status
git diff --cached --name-only
```

### 4. Determine the new version number.
Decide whether this is a patch, minor, or major release and update both package.json files:
```bash
# Example: bump patch version
cd /Users/user/Projects/BookBoss/book-boss-react && npm version patch --no-git-tag-version
cd /Users/user/Projects/BookBoss/server && npm version patch --no-git-tag-version
```

### 5. Stage and commit all changes with robust messages.
```bash
cd /Users/user/Projects/BookBoss
git add -A -- ':!Design/' ':!.docker_test/'
git commit -m "$(cat <<'EOF'
chore: release vX.X.X

## Summary
- <one-line summary of main feature/fix>

## Changes
- <bullet: specific component or file changed and how>
- <bullet: ...>

## Testing
- Docker test suite passed: Task 1 (auth), Task 7 (404 handling)
EOF
)"
```
> **Note:** Replace `vX.X.X` and bullet points with the actual version and changes.

### 6. Tag the release.
```bash
cd /Users/user/Projects/BookBoss
VERSION=$(node -p "require('./book-boss-react/package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
```

### 7. Push the commit and the tag.
```bash
cd /Users/user/Projects/BookBoss
git push origin main
git push origin "v${VERSION}"
```

### 8. Create the GitHub release.
```bash
VERSION=$(node -p "require('./book-boss-react/package.json').version")
gh release create "v${VERSION}" \
  --title "BookBoss v${VERSION}" \
  --notes "$(cat <<'EOF'
## What's New
- <summary of features/fixes in this release>

## Full Changelog
See commit history for detailed changes.
EOF
)"
```

### 9. Notify the user that the release is live.
Report the new version, tag, and the GitHub release URL.
