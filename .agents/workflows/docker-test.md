---
description: How to rebuild and run Docker tests for BookBoss
---

// turbo-all

## Docker Test Workflow

This workflow udpates and rebuilds any existing test environment, rebuilds the Docker image from local source, runs the full test suite, and saves the results to `.docker_test/`.

**Rules:**
- Always update the `.docker_test/` files and folders before testing (use `.template-*` files as the template to create the needed files for testing).
- Test results and container logs are saved in `.docker_test/` with timestamps.
- `.docker_test/` is in `.gitignore` — never commit it.

---

## Steps

### 1. Stop and remove any existing test containers and volumes.
```bash
cd /Users/user/Projects/BookBoss/.docker_test
docker compose down --remove-orphans --volumes
```

### 2. Update scripts and files within the `.docker_test` folder to test recent changes.

> **Note:** If any of the above files were deleted, copy them from the version in git history or from the Antigravity brain artifacts.

### 3. Build the Docker image from the project root.
```bash
cd /Users/user/Projects/BookBoss/.docker_test
docker compose build --no-cache
```

### 4. Start the test container.
```bash
docker compose up -d
```

### 5. Wait for the container to fully initialize (DB migrations can take ~20-30 seconds on first boot).
```bash
sleep 30
docker logs bookboss_test --tail 30
```

Verify you see `Starting Node.js Backend Server...` and no migration errors.

### 6. Run the Fix First audit test suite.
```bash
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
bash /Users/user/Projects/BookBoss/.docker_test/fix_first_audit_test.sh \
  http://localhost:3001 \
  /Users/user/Projects/BookBoss/.docker_test/test_results_${TIMESTAMP}.md
```

### 7. Save container logs.
```bash
docker logs bookboss_test > /Users/user/Projects/BookBoss/.docker_test/container_logs_$(date +%Y-%m-%d_%H%M%S).txt 2>&1
```

### 8. Notify the user container is running and they are free to test.

### 9. Review test results.
Open the `test_results_<timestamp>.md` file in `.docker_test/` for the full report.