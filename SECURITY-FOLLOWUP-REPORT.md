# Security Follow-Up Report
**Date:** 2026-05-18  
**Status:** Post-remediation scan — 8 issues still open

---

## Summary

Code-level fixes are confirmed applied locally (CORS, rate limiting, action pinning, admin password, .env.example). However the remediation commit **has not been pushed**, so the most critical findings are still live on GitHub. History-level and account-level items require manual action.

---

## Still Open

| ID | Severity | Issue | Why Still Open |
|----|----------|-------|---------------|
| **C-01a** | 🔴 CRITICAL | TLS private key still live on GitHub | Commit not pushed — `certs/bookboss.local.key` is still publicly downloadable |
| **C-01b** | 🔴 CRITICAL | TLS private key still in git history | Removing from HEAD doesn't purge history; key appears in commit `c48501d` |
| **H-01** | 🟠 HIGH | Personal email in git history | `david.s.murphy2@gmail.com` still in `git log --all` |
| **H-02** | 🟠 HIGH | Internal hostnames in git history | `testadmin@A-testadmins-MacBook-Pro.local` still in `git log --all` |
| **H-04** | 🟠 HIGH | `node_modules` committed to Stratogemini | Separate repo; not yet fixed |
| **M-01** | 🟡 MEDIUM | `.agents/workflows/` still live on GitHub | Commit not pushed — internal planning docs still publicly visible |
| **M-02** | 🟡 MEDIUM | CI secrets not configured in GitHub | `ci.yml` now references `${{ secrets.CI_MYSQL_PASSWORD }}` etc. but secrets aren't set — CI will fail |
| **M-03** | 🟡 MEDIUM | FUNDING.yml still links `durfy` identity cross-platform | No change made; still exposes Patreon/BMAC/Thanks.dev |

---

## Resolutions

### C-01a — Push the remediation commit immediately

```bash
git push origin main
```

This removes the key and .agents from GitHub HEAD. Do this first — everything else is lower urgency.

---

### C-01b — Purge private key from git history

After pushing, rewrite history to remove the key from all commits:

```bash
pip install git-filter-repo
git filter-repo --path certs/ --invert-paths
git push origin --force --all
git push origin --force --tags
```

Then email GitHub Support at [support.github.com](https://support.github.com) requesting a cache purge for the repo — cached objects can persist up to 90 days after a force push.

---

### H-01 / H-02 — Rewrite commit author emails

```bash
git filter-repo --email-callback '
    rewrites = {
        b"david.s.murphy2@gmail.com": b"92129349+daedaebae@users.noreply.github.com",
        b"testadmin@A-testadmins-MacBook-Pro.local": b"92129349+daedaebae@users.noreply.github.com",
        b"user@1A-testadmins-MacBook-Pro.local": b"92129349+daedaebae@users.noreply.github.com",
    }
    return rewrites.get(email, email)
'
git push origin --force --all
```

Then set your global git email to avoid recurrence:

```bash
git config --global user.email "92129349+daedaebae@users.noreply.github.com"
```

Enable **Settings → Emails → Keep my email address private** and **Block command line pushes that expose my email** on GitHub.

---

### H-04 — Remove node_modules from Stratogemini

```bash
cd /path/to/Stratogemini
echo "node_modules/" >> .gitignore
git rm -r --cached node_modules/
git commit -m "chore: remove node_modules from tracking"
git push
```

---

### M-02 — Add CI secrets in GitHub Settings

Go to **BookBoss → Settings → Secrets and Variables → Actions → New repository secret** and add:

| Secret name | Value |
|-------------|-------|
| `CI_MYSQL_ROOT_PASSWORD` | any string (e.g. `ci_root_pw`) |
| `CI_MYSQL_PASSWORD` | any string (e.g. `ci_app_pw`) |
| `CI_JWT_SECRET` | random hex string: `openssl rand -hex 32` |

CI will fail on every run until these are set.

---

### M-03 — FUNDING.yml cross-platform identity

If the donation links are not actively generating revenue, remove the file:

```bash
git rm .github/FUNDING.yml
git commit -m "chore: remove FUNDING.yml"
git push
```

If keeping it, add 2FA to the `durfy` Patreon and Buy Me a Coffee accounts and ensure their recovery email differs from your GitHub email.

---

## Confirmed Fixed ✅

| Item | Status |
|------|--------|
| CORS wildcard | Fixed — restricted to `ALLOWED_ORIGINS` |
| Rate limiting on auth | Fixed — 20 req/15 min on `/api/login` and `/api/register` |
| All GitHub Actions pinned to SHA | Fixed |
| `admin:admin` default credentials | Fixed — random password generated on first run |
| `.env.example` realistic passwords | Fixed — replaced with `CHANGE_ME_*` |
| JWT_SECRET fallback in tests | Fixed — throws if unset |
| `certs/` in `.gitignore` | Already was; files now untracked in HEAD |
| `.agents/` in `.gitignore` | Fixed — added and untracked |
| Security audit level `moderate` | Fixed |
| `SECURITY.md` added | Fixed |
