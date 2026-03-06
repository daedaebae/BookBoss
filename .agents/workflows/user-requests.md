---
description: review the github repo for any issues opened by bookboss requests and start working the issues
---

## User Requests Workflow

This workflow is used to triage, address, and close support tickets, bug reports, or feature requests opened by users on the GitHub repository.

### Steps

1. Use the GitHub CLI to list all open issues in the BookBoss repository.
   ```bash
   gh issue list -R daedaebae/BookBoss --state open
   ```
2. Select an open issue that represents a user request or bug report. View the full details of the issue.
   ```bash
   gh issue view <issue-number> -R daedaebae/BookBoss
   ```
3. Analyze the issue and formulate an `implementation_plan.md` to address the reported problem or feature request.
4. Ask the user to review the proposed plan.
5. Execute the code changes and verify they fully resolve the user's issue.
6. (Optional) Run the `/docker-test` workflow to ensure no regressions were introduced.
7. Close the GitHub issue, optionally leaving a comment that it has been resolved.
   ```bash
   gh issue close <issue-number> -R daedaebae/BookBoss -m "Resolved in recent update."
   ```
