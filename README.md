
# Voice-Driven Coding Assistant

A modular, voice-enabled coding assistant with a strict safety architecture.

## Architecture

This project follows a modular architecture designed for portability and safety.

### Modules

1.  **Core (`server/core.ts`)**:
    *   Contains the business logic for Intent Parsing, Safety Policy, and Planning.
    *   **Intent Parser**: Converts natural language (Phase 1: Regex) into structured `Intent` objects.
    *   **Safety Policy**: Enforces a strict whitelist of actions (`LIST_FILES`, `OPEN_FILE`, etc.) and a "Deny by Default" strategy.
    *   **Path Safety**: Normalizes all file paths to ensure they stay within the `PROJECT_ROOT` sandbox.

2.  **Web Adapter (`client/` + `server/routes.ts`)**:
    *   **Frontend**: React + TypeScript + Web Speech API. Handles voice input, displays plans, and manages the confirmation flow.
    *   **Backend**: Express server that bridges the Frontend to the Core logic.
    *   **Executor**: The component that actually performs the side effects (file reading, etc.) *after* a valid confirmation token is received.

### Security Model

*   **Plan-First Execution**: No action is ever executed directly. The system first returns a **Plan** with a `confirmation_token`.
*   **Confirmation Gating**: The `execute` endpoint requires a valid token that matches the plan.
*   **Sandbox**: File access is restricted to the project root. Path traversal (`../`) is blocked.
*   **Whitelist**: Only specific intents are allowed. Destructive actions are not implemented in the whitelist.

## Quick Start

1.  **Run the App**:
    ```bash
    npm run dev
    ```
2.  **Open the Web Interface**:
    *   Click "Start Recording" or type a command.
    *   Try saying: "List files"
    *   Review the plan card.
    *   Click "Confirm & Execute".

## Testing

### Manual Testing

1.  **List Files**:
    *   Type: "list files"
    *   Expected: A plan to list files. Execute to see the file list.

2.  **Read File**:
    *   Type: "open README.md"
    *   Expected: A plan to read the file. Execute to see the first 50 lines.

3.  **Safety Test (Negative Case)**:
    *   Type: "open ../secrets"
    *   Expected: The plan might be generated (stating "I will open ../secrets"), but **Execution must fail** with a Security Warning.

### Automated Tests

Run the core safety tests:

```bash
npx tsx test/safety.test.ts
```

## Future Roadmap

*   **Phase 2**: Replace Regex parser with an LLM (OpenAI/Anthropic).
*   **Phase 3**: Add "Edit File" intent with high-risk warnings and diff previews.
*   **Phase 4**: Add a VS Code adapter (extending `adapters/vscode`).
