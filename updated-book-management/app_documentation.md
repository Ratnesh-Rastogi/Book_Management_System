# Flask Book Management API — End-to-End Documentation

## Overview

`app.py` is a **RESTful Flask API** for managing a book inventory. It uses:

- **Flask** — lightweight Python web framework
- **Flask-CORS** — enables Cross-Origin Resource Sharing (so frontend apps on different ports can call this API)
- **SQLite** — file-based database to persist book records
- **Python standard library** — `datetime`, `os`, `tempfile`, `sqlite3`

The app exposes five HTTP endpoints to **Create, Read, Update, and Delete (CRUD)** book records, plus a health check.

---

## Database Schema

A single table `book` is used:

| Column      | Type    | Description                         |
|-------------|---------|-------------------------------------|
| `id`        | INTEGER | Auto-incremented primary key        |
| `publisher` | TEXT    | Publisher name (required)           |
| `name`      | TEXT    | Book title (required)               |
| `date`      | TEXT    | Publication date (`YYYY-MM-DD`)     |
| `cost`      | REAL    | Price of the book (required)        |

---

## App Initialization

```python
app = Flask(__name__)
CORS(app)
```

- Creates the Flask app instance.
- `CORS(app)` allows all origins to call this API (useful during development).

---

## Helper Functions

### `get_db_path()`

```python
def get_db_path():
```

**Purpose:** Returns the correct path to the SQLite database file depending on the environment.

**Logic:**
- If the environment variable `PYTEST_CURRENT_TEST` is set (i.e., tests are running), it returns a path inside the system's temp directory — so tests use an isolated DB and don't pollute production data.
- Otherwise, it falls back to the `BOOKS_DB_PATH` environment variable, or the default `books.db` in the same directory as the script.

**Parameters:** None  
**Returns:** `str` — absolute path to the `.db` file

---

### `ensure_schema(connection)`

```python
def ensure_schema(connection):
```

**Purpose:** Creates the `book` table if it doesn't already exist. This is an idempotent operation — safe to call on every connection.

**Parameters:**
- `connection` — an active `sqlite3.Connection` object

**Returns:** Nothing (commits the DDL and closes the cursor)

---

### `get_db_connection()`

```python
def get_db_connection():
```

**Purpose:** Opens and returns a new SQLite database connection, ready to use.

**Details:**
- Sets `row_factory = sqlite3.Row` so rows can be accessed by column name.
- `timeout=10` — waits up to 10 seconds if the DB is locked (useful under concurrent access).
- Calls `ensure_schema()` on every new connection to guarantee the table exists.

**Parameters:** None  
**Returns:** `sqlite3.Connection`

---

### `init_db()`

```python
def init_db():
```

**Purpose:** Bootstraps the database on app startup. Opens a connection (which triggers `ensure_schema`) and immediately closes it.

**Parameters:** None  
**Returns:** Nothing

---

### `validate_book_payload(payload)`

```python
def validate_book_payload(payload):
```

**Purpose:** Validates incoming JSON payloads for create and update endpoints. Centralises all input checks so both endpoints share the same rules.

**Parameters:**
- `payload` — the parsed JSON dict from `request.get_json()`, or `None` if parsing failed

**Validation rules (in order):**
1. Request must be JSON and payload must not be `None`.
2. Handles a case-sensitivity quirk: if `"Cost"` (capital C) is present but `"cost"` is not, it normalises it to lowercase.
3. All four fields — `publisher`, `name`, `date`, `cost` — must be present and non-empty.
4. `cost` must be convertible to a `float`.
5. `date` must match the format `YYYY-MM-DD`.

**Returns:**
- `None` if the payload is valid (no error)
- A `str` error message if any check fails (e.g., `"Missing field: name"`, `"Invalid date format"`)

---

## Routes / Endpoints

### `GET /` — List All Books

```python
@app.route('/', methods=['GET'])
def get_books():
```

**Purpose:** Fetches and returns all books in the database.

**Parameters:** None (no request body or URL parameters)

**Response:**
- `200 OK` — JSON array of all book objects:
```json
[
  {
    "id": 1,
    "publisher": "O'Reilly",
    "name": "Flask Web Development",
    "date": "2018-03-01",
    "cost": 39.99
  }
]
```
- Returns an empty array `[]` if no books exist.

---

### `POST /create` — Add a New Book

```python
@app.route('/create', methods=['POST'])
def create_books():
```

**Purpose:** Inserts a new book record into the database.

**Request Body (JSON):**
```json
{
  "publisher": "O'Reilly",
  "name": "Flask Web Development",
  "date": "2018-03-01",
  "cost": 39.99
}
```

**Parameters:** All four fields are required — `publisher`, `name`, `date`, `cost`.

**Response:**
- `201 Created` — returns the submitted book data as JSON.
- `400 Bad Request` — returns `{"error": "<message>"}` if validation fails.

**Note:** The returned JSON does not include the newly generated `id`. The DB auto-increments it, but it's not reflected back.

---

### `PUT /update/<int:id>` — Update an Existing Book

```python
@app.route('/update/<int:id>', methods=['PUT'])
def update_book(id):
```

**Purpose:** Updates all fields of an existing book by its ID.

**URL Parameter:**
- `id` (`int`) — the unique ID of the book to update (from the database)

**Request Body (JSON):** Same structure as `/create` — all four fields required.

**Response:**
- `200 OK` — returns `{"data": <updated_book_object>}`.
- `400 Bad Request` — if validation fails.
- `404 Not Found` — if no book with the given `id` exists (`{"error": "Book not found"}`).

---

### `DELETE /delete/<int:id>` — Delete a Book

```python
@app.route('/delete/<int:id>', methods=['DELETE'])
def delete_book(id):
```

**Purpose:** Permanently removes a book record from the database.

**URL Parameter:**
- `id` (`int`) — the unique ID of the book to delete

**Request Body:** None required.

**Response:**
- `200 OK` — `{"message": "Book deleted successfully"}`
- `404 Not Found` — `{"error": "Book not found"}` if the ID doesn't exist.

---

### `GET /health` — Health Check

```python
@app.route("/health")
def health():
```

**Purpose:** Simple liveness probe — used by monitoring tools, load balancers, or orchestrators (e.g., Kubernetes) to confirm the service is running.

**Parameters:** None

**Response:**
- `200 OK` — `{"status": "healthy"}`

---

## Error Handlers

### `404 Not Found`

```python
@app.errorhandler(404)
def not_found(error):
```

Catches all unmatched routes and returns:
```json
{"error": "Resource not found"}
```

---

### `405 Method Not Allowed`

```python
@app.errorhandler(405)
def method_not_allowed(error):
```

Triggered when a valid route is called with the wrong HTTP method (e.g., `DELETE /create`). Returns:
```json
{"error": "Method not allowed"}
```

---

## Entry Point

```python
if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)
```

When the script is run directly (not imported as a module):
1. `init_db()` is called to ensure the database and schema are ready.
2. The Flask development server starts on **port 5001** with **debug mode enabled** (auto-reloads on code changes, shows detailed error pages).

> ⚠️ `debug=True` should be disabled in production environments.

---

## API Summary Table

| Method   | Endpoint           | Description             | Success Code |
|----------|--------------------|-------------------------|--------------|
| `GET`    | `/`                | List all books          | `200`        |
| `POST`   | `/create`          | Create a new book       | `201`        |
| `PUT`    | `/update/<id>`     | Update a book by ID     | `200`        |
| `DELETE` | `/delete/<id>`     | Delete a book by ID     | `200`        |
| `GET`    | `/health`          | Health check            | `200`        |

---

## Environment Variables

| Variable              | Default                        | Description                             |
|-----------------------|--------------------------------|-----------------------------------------|
| `BOOKS_DB_PATH`       | `books.db` (next to `app.py`) | Override the database file location     |
| `PYTEST_CURRENT_TEST` | _(not set)_                   | Set automatically by pytest; uses a temp DB for tests |
