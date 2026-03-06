---
description: start on the fix first items list
---

## Fix First Workflow

This workflow instructs the agent to systematically address the top-priority items that the user has designated as "fix first".

### Steps

1. Read the `/Users/user/Projects/BookBoss/Design/Fix_first.md` document to review the list of high-priority bugs or tasks.
2. Identify the first unresolved item on the list.
3. Analyze the codebase to understand the root cause of the issue or the requirements of the task.
4. Formulate an `implementation_plan.md` detailing how to fix the issue and present it to the user for approval.
5. Once approved, execute the changes.
6. Verify the fix (use the `/docker-test` workflow if appropriate).
7. Update the `Fix_first.md` document to check off the completed item.
