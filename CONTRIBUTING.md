# Contributing to DevInsight

Thank you for your interest in contributing to **DevInsight**! We welcome bug reports, feature requests, documentation improvements, and pull requests.

---

## 🛠️ Local Development Setup

To set up the project locally:

1.  **Fork and Clone** the repository.
2.  Follow the development quickstart guides located inside the [Backend Guide](backend/README.md) and [Frontend Guide](frontend/README.md).
3.  Ensure you copy `.env.example` to `.env` in the backend directory and supply your Gemini API key and GitHub OAuth credentials.

---

## 🧪 Testing Guidelines

We enforce high coverage testing for all backend service modifications:

*   **Run Backend Tests**:
    ```bash
    cd backend
    pytest tests/ -v
    ```
*   **Run Frontend Verification**:
    ```bash
    cd frontend
    npm run build
    ```

Before submitting a Pull Request, verify that all test suites pass successfully.

---

## 🤝 Pull Request Process

1.  Create a branch from `dev` for your changes (e.g. `feat/add-agent-telemetry` or `fix/jwt-expiration`).
2.  Include detailed commits explaining the rationale for modifications.
3.  Ensure your code conforms to Python PEP 8 (via Ruff/Black) and ESLint/Prettier formatting standards.
4.  Open a Pull Request targeting the `dev` branch. Describe your changes clearly and link to any related issues.
