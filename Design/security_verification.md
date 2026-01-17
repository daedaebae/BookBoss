# Security Verification Instructions

Please follow these steps to verify that the security fixes are working correctly.

## Prerequisites
1.  **Restart the Application**: Since we changed `docker-compose.yml` and `server.js`, you must rebuild and restart the containers.
    ```bash
    docker-compose down
    docker-compose up -d --build
    ```
    *Note: Ensure you have created the `.env` file from `.env.example` and set your secrets before running `docker-compose up`.*

## Test 1: Verify Registration is Restricted
**Goal**: Ensure random users cannot register.
1.  Attempt to register a new user via the API (you can use Postman or `curl`):
    ```bash
    curl -X POST http://localhost:3000/api/register \
      -H "Content-Type: application/json" \
      -d '{"username": "hacker", "password": "password"}'
    ```
2.  **Expected Result**: `401 Unauthorized` or `403 Forbidden`. The endpoint now requires a valid Admin token.

## Test 2: Verify Admin Access
**Goal**: Ensure the Admin can still perform actions.
1.  Log in as the Admin (if you haven't changed the default in `create_docker_admin.js`, it might be `admin`/`admin` - **Change this immediately!**)
    ```bash
    curl -X POST http://localhost:3000/api/login \
      -H "Content-Type: application/json" \
      -d '{"username": "admin", "password": "admin"}'
    ```
2.  Copy the `token` from the response.
3.  Try to create a new user (only Admins can do this now):
    ```bash
    curl -X POST http://localhost:3000/api/register \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
      -d '{"username": "new_user", "password": "password"}'
    ```
4.  **Expected Result**: `201 Created` (Success).

## Test 3: Verify Unprivileged Access
**Goal**: Ensure a non-admin user CANNOT delete books.
1.  Log in as the `new_user` created in Test 2.
2.  Try to delete a book (replace `1` with a valid book ID):
    ```bash
    curl -X DELETE http://localhost:3000/api/books/1 \
      -H "Authorization: Bearer NEW_USER_TOKEN"
    ```
3.  **Expected Result**: `403 Forbidden` (Admin access required).

## Test 4: Verify SSRF Protection
**Goal**: Ensure the server doesn't download files from internal/local IP addresses.
1.  As an Admin, try to add a book with a local URL as the cover image coverage:
    ```bash
    curl -X POST http://localhost:3000/api/books \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
      -d '{
        "title": "SSRF Test",
        "cover": "http://localhost:3306", 
        "author": "Hacker"
      }'
    ```
    *Note: `localhost:3306` is your database port.*
2.  **Expected Result**: The server logs should show `Invalid cover URL blocked`. The book might be created, but the cover image should NOT be downloaded from the internal port.
