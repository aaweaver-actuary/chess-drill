# ChessDrill Next.js - Project Plan

## 1. General Overview and Project Goals

**ChessDrill Next.js** is a web-based chess training application designed to help users improve their chess skills by practicing variations loaded from Portable Game Notation (PGN) files. This project adapts the core concepts of the "ComChess" iOS application proposal for a modern React/Next.js environment.

**End-State Goals:**

*   **PGN-Driven Training**: Users can upload PGN files containing chess games and variations.
*   **Interactive Variation Practice**: The application will randomly select a variation from the uploaded PGN. The user will play as White/Black, making moves against computer-selected Black/White moves as defined in the variation. Black/White moves will be played automatically, and only those moves from the specific variation will be played by Black/White. It is White/Black's responsibility to play the correct moves.
*   **Mistake Correction & Repetition**: If the user deviates from the PGN variation, they will be notified of the mistake and prompted to retry the correct move. There will be visual feedback for incorrect moves only (eg the square will turn light red and the piece will return to its original position), and the piece will not be moved on the board until the correct move is made. The user will be able to retry the same variation until they succeed.
*   **Spaced Repetition (Future Goal)**: Integrate a spaced repetition system (like FSRS, for which a utility `Scheduler.ts` already exists) to optimize learning and recall of variations.
*   **User Statistics (Future Goal)**: Track user performance on variations (attempts, successes), utilizing the existing `StatsStore.ts`.
*   **Simple and Intuitive UI**:
    *   A main menu for PGN uploading and starting training sessions.
    *   A clear training interface displaying the chessboard, move feedback, and variation information.
*   **Modular and Testable Codebase**: Adherence to Test-Driven Development (TDD) and SOLID principles to ensure a high-quality, maintainable application.

## 2. Current State of the Project

The project is initialized as a Next.js application using TypeScript. Based on the provided codebase (`repomix-output.xml`):

**Key Components & Utilities:**

*   **Next.js Framework**: The application is built with Next.js 15, with standard configuration files (`next.config.ts`, `tsconfig.json`, `package.json`).
*   **UI Components**:
    *   `src/app/page.tsx`: Main page that currently renders the `ChessBoard` component.
    *   `src/components/ChessBoard.tsx`: A client-side React component using `react-chessboard` and `chess.js`. It handles board display, click-to-move (though `arePiecesDraggable` is false, suggesting click/tap interaction), promotion dialog, and right-click square highlighting. It maintains its own internal game state.
*   **Chess Logic & Utilities**:
    *   `src/utils/ChessEngine.ts`: A wrapper around `chess.js` providing methods to load PGN, make moves, get history, and reset the game.
    *   `src/utils/VariationParser.ts`: Uses `pgn-parser` to parse PGN strings into a structured format, including variations (RAVs).
    *   `src/utils/sanToSquare.ts`: Converts Standard Algebraic Notation (e.g., "e4") to a `ChessSquare` enum value.
    *   `src/enums/`: Contains TypeScript enums for `ChessPiece.ts`, `ChessPieceColor.ts`, and `ChessSquare.ts`.
    *   `src/utils/Scheduler.ts`: Wraps `ts-fsrs` for spaced repetition scheduling.
    *   `src/utils/StatsStore.ts`: An in-memory store for tracking attempts and successes for variations, with types defined in `src/types/StatsStore.d.ts`.
*   **Testing**:
    *   Jest is configured (`jest.config.js`) with `ts-jest`.
    *   Example tests exist in `src/utils/sanToSquare.test.ts`.
    *   `package.json` includes scripts for running tests (`"test": "jest --watchAll --passWithNoTests"`).
*   **Styling**:
    *   Tailwind CSS is set up (`postcss.config.mjs`, `tailwind.config.js` implied by `globals.css`).
    *   Basic global styles are in `src/app/globals.css`.
*   **Linting**: ESLint is configured (`eslint.config.mjs`).

**Current Functionality:**

*   The application displays an interactive chessboard on the homepage.
*   Basic chess move logic is available via `chess.js` integrated into the `ChessBoard` component and `ChessEngine`.
*   Utilities for PGN parsing, SAN conversion, spaced repetition scheduling, and statistics tracking are present but not fully integrated into a user-facing workflow.

## 3. Proposed Changes and MVP Roadmap

The primary goal is to transform the current component showcase into a functional PGN-based chess variation trainer. This involves integrating existing utilities, developing new training orchestration logic, and building out the necessary UI.

**MVP Features:**

1.  **PGN Upload Functionality**: Allow users to upload a PGN file from their local system.
2.  **Variation Selection**: Parse the uploaded PGN and randomly select a variation for training.
    *   The application should support multiple, nested variations.
    *   The application should handle comments and NAGs (Numeric Annotation Glyphs) in the PGN.
    *   The application should convert nested variations into a flat structure for easier selection.
    *   The application should begin storing statistics by hashing the variation string to use as a key.
3.  **Interactive Training Loop**:
    *   User plays White/Black's moves in the selected variation.
    *   The application plays Black/White's moves from the variation automatically.
    *   Validate user moves against the PGN.
    *   Provide feedback (correct/incorrect).
    *   Allow retry on incorrect moves.
    *   Store statistics on attempts, successes, number of guesses, number of times this variation has been played, how long it took to make a move, how many pieces were clicked before making a move, etc.
    *   Provide a "Show Correct Move" button to display the correct move in case of an incorrect attempt.
    *   The first two times a variation is encountered, the correct move should be shown with an annotation arrow pointing from the piece to the square. After that, the correct move should not be shown to allow the user to test their knowledge.

4.  **Basic UI**:
    *   Menu/Upload Page.
    *   Training Page with chessboard and feedback.
    *   The correct move should be shown with an annotation arrow pointing from the piece to the square.

**Roadmap:**

1.  **Module 1: Core Logic Enhancement & TDD Setup**
    *   **Task 1.1**: Enhance `ChessEngine.ts` tests for robustness.
    *   **Task 1.2**: Enhance `VariationParser.ts` tests, especially for complex PGNs with multiple lines and comments.
    *   **Task 1.3**: Develop `TrainingOrchestrator.ts` (new module): This will manage the overall training session, including PGN parsing, variation selection, move validation against the PGN, and game state progression.

2.  **Module 2: PGN Handling**
    *   **Task 2.1**: Create `PGNUploader.tsx` component for file input.
    *   **Task 2.2**: Implement logic to read PGN file content and pass it to `TrainingOrchestrator`.

3.  **Module 3: Training Mode Implementation (Variation Drill)**
    *   **Task 3.1**: Integrate `TrainingOrchestrator` with `ChessBoard.tsx`. The `ChessBoard` will primarily be a view component, with move logic driven by the orchestrator.
    *   **Task 3.2**: Implement the core training loop within `TrainingOrchestrator`:
        *   Load PGN.
        *   Select a random variation.
        *   Present White's turn.
        *   On user move, validate against the variation.
        *   If correct, play Black's corresponding move from the variation.
        *   If incorrect, provide feedback and allow retry.
        *   Handle variation completion and selection of a new random variation.

4.  **Module 4: UI Development**
    *   **Task 4.1**: Create a simple `MenuPage.tsx` with a button to trigger PGN upload and another to start training (once PGN is loaded).
    *   **Task 4.2**: Develop `TrainingPage.tsx` to host `ChessBoard.tsx` and display feedback messages, current variation information, and controls (e.g., "Next Variation", "Reset").
    *   **Task 4.3**: Integrate `PGNUploader.tsx` into the `MenuPage` or a dedicated upload step.

5.  **Module 5: State Management**
    *   **Task 5.1**: Utilize React Context or a lightweight state manager (like Zustand) for managing global state: loaded PGN data, current variation, training status.

6.  **Module 6: Refinement and Testing**
    *   **Task 6.1**: End-to-end testing of the training flow.
    *   **Task 6.2**: UI/UX refinement.

## 4. Detailed Step-by-Step TDD Checklist for MVP

This checklist emphasizes strict TDD: (a) No production code without a failing test. (b) Write only enough test to fail. (c) Write only enough code to pass.

---

**Phase 1: Core Logic - `TrainingOrchestrator.ts`**

*   **`TrainingOrchestrator` - PGN Loading & Parsing**
    *   `[x] Test:` `constructor()`: Ensure `TrainingOrchestrator` can be instantiated.
        *   `[x] Code:` Create basic `TrainingOrchestrator` class.
    *   `[x] Test:` `loadPgn(pgnString)`: Fails if PGN string is empty or invalid.
        *   `[x] Code:` Add `loadPgn` method, basic validation.
    *   `[x] Test:` `loadPgn(pgnString)`: Successfully parses a simple PGN string (e.g., "1. e4 e5") and stores parsed data (use a mock `VariationParser`).
        *   `[x] Code:` Integrate `VariationParser` (or mock), store result.
    *   `[x] Test:` `loadPgn(pgnString)`: Successfully parses a PGN string with comments and NAGs.
        *   `[x] Code:` Ensure `VariationParser` (or mock) handles these.
    *   `[x] Test:` `loadPgn(pgnString)`: Successfully parses a PGN string with nested variations.
        *   `[x] Code:` Ensure `VariationParser` (or mock) handles these.
    *   `[x] Test:` `getParsedPgn()`: Returns the parsed PGN data or null if not loaded.
        *   `[x] Code:` Add `getParsedPgn` method.
    *   `[x] Test:` `hasPgnLoaded()`: Returns true if PGN is loaded, false otherwise.
        *   `[x] Code:` Add `hasPgnLoaded` method.
    *   `[x] Test:` `generateVariationKey(variationMoves)`: Generates a consistent hash/key for a given sequence of moves.
        *   `[x] Code:` Implement variation key generation (e.g., simple string concatenation or a more robust hashing function).

*   **`TrainingOrchestrator` - Variation Selection & Management**
    *   `[x] Test:` `flattenVariations(parsedPgn)`: Converts nested variations from parser output into a flat list of playable variation lines.
        *   `[x] Test:` Add comprehensive tests for various PGN structures (no RAVs, simple RAVs, nested RAVs, multiple RAVs at same level, RAVs with comments/NAGs).
        *   `[x] Code:` Implement `flattenVariations` method using DFS to correctly extract all lines, including from RAVs, and preserve tags.
    *   `[x] Test:` `selectRandomVariation(flatVariations)`: Randomly selects one variation from the flattened list.
        *   `[x] Code:` Implement variation flattening logic.
    *   `[x] Test:` `selectRandomVariation()`: Fails if PGN not loaded or no variations found after flattening.
        *   `[x] Code:` Add checks in `selectRandomVariation`.
    *   `[x] Test:` `selectRandomVariation()`: Selects a main line if only one flat variation exists.
        *   `[x] Code:` Implement basic selection from flattened list.
    *   `[x] Test:` `selectRandomVariation()`: Selects a variation randomly from multiple flattened variations (mock `Math.random`).
        *   `[x] Code:` Implement random selection from flattened list.
    *   `[x] Test:` `getCurrentVariation()`: Returns the currently selected flattened variation (e.g., array of move objects).
        *   `[x] Code:` Add `getCurrentVariation` method.
    *   `[x] Test:` `getCurrentVariationKey()`: Returns the key for the current variation.
        *   `[x] Code:` Add `getCurrentVariationKey` method.
    *   `[x] Test:` `determineUserColor(variation)`: Determines if the user plays White or Black based on the first move of the variation.
        *   `[x] Code:` Implement logic to set user color (e.g., if PGN starts with Black's move, user is Black). For MVP, assume user is always the color making the *first* move in the selected variation snippet.

*   **`TrainingOrchestrator` - Game State & Move Handling**
    *   `[x] Test:` `startTrainingSession(userPlaysAs?: 'w' | 'b')`: Fails if PGN not loaded.
        *   `[x] Code:` Add check.
    *   `[x] Test:` `startTrainingSession()`: Selects a variation, determines user color, and initializes internal game state (`ChessEngine`) to the position *before* the first move of the variation.
        *   `[x] Code:` Implement session start, set up `ChessEngine`, store user color.
    *   `[x] Test:` `startTrainingSession()`: If it's not the user's turn first (e.g., user is Black, variation starts with White's move), automatically makes the initial PGN move(s) until it's user's turn.
        *   `[x] Code:` Add logic to play opening moves if necessary.
    *   `[x] Test:` `getCurrentFen()`: Returns the FEN of the current board position from `ChessEngine`.
        *   `[x] Code:` Add `getCurrentFen` method.
    *   `[x] Test:` `getExpectedMoveForCurrentUser()`: Returns the next expected move object (e.g., `{ from, to, san }`) for the current user from the selected variation.
        *   `[x] Code:` Implement logic to find the next move for the current player.
    *   `[x] Test:` `isUserTurn()`: Returns true if it's the user's turn to move.
        *   `[x] Code:` Implement `isUserTurn`.
    *   `[x] Test:` `handleUserMove(move: { from: string, to: string, promotion?: string })`: Fails if no training session active or not user's turn.
        *   `[x] Code:` Add checks.
    *   `[x] Test:` `handleUserMove()`: User makes a correct move (matches variation):
        *   `[x] Sub-Test:` Records statistics: increment attempts and successes for the variation key, log time taken, number of clicks (placeholder for now). - **DONE**
        *   `[x] Sub-Test:` Advances internal game state in `ChessEngine` with user's move. - **DONE**
        *   `[x] Sub-Test:` If variation is not complete, `ChessEngine` plays opponent's corresponding reply from the variation automatically. - **DONE**
        *   `[x] Sub-Test:` Returns `{ isValid: true, isVariationComplete: <boolean>, nextFen: <fen_after_opponent_move_or_user_move_if_complete>, opponentMove?: <move_object> }`. - **DONE**
        *   `[x] Code:` Implement correct move handling, opponent auto-reply, and stats recording. - **DONE**
    *   `[x] Test:` `handleUserMove()`: User makes an incorrect move:
        *   `[x] Sub-Test:` Records statistics: increment attempts for the variation key, log time taken, number of clicks.
        *   `[x] Sub-Test:` Returns `{ isValid: false, expectedMove: <move_object_of_correct_move> }`.
        *   `[x] Sub-Test:` Internal game state in `ChessEngine` does NOT change.
        *   `[x] Code:` Implement incorrect move handling and stats recording.
    *   `[x] Test:` `handleUserMove()`: User makes the last correct move in the variation (and opponent has no reply in the snippet):
        *   `[x] Sub-Test:` Returns `{ isValid: true, isVariationComplete: true, nextFen: <final_fen> }`.
        *   `[x] Code:` Implement variation completion logic.
    *   `[x] Test:` `getVariationPlayCount(variationKey)`: Returns how many times this specific variation has been started/played.
        *   `[x] Code:` Integrate with StatsStore or internal tracking.
    *   `[x] Test:` `showCorrectMoveHint()`: Returns the expected move for the current user. (Used by UI).
        *   `[x] Code:` Implement `showCorrectMoveHint`.
    *   `[x] Test:` `resetCurrentVariation()`: Resets the game to the start of the current variation, preserving play count but allowing a fresh attempt.
        *   `[x] Code:` Implement reset logic.

---

**Phase 2: PGN Upload Component - `PGNUploader.tsx` & Integration**

*   **`PGNUploader.tsx` (Logic part, UI interaction tested via e2e or integration tests later)**
    *   `[ ] Test:` (React Testing Library) Component renders an input type="file" with `accept=".pgn"`.
        *   `[ ] Code:` Create basic `PGNUploader` component, add accept attribute.

---

**Phase 3: UI Development & Integration**

*   **`MenuPage.tsx` / `src/app/page.tsx` (Initial Setup)**
    *   `[ ] Test:` (RTL) Renders `PGNUploader` component.
        *   `[ ] Code:` Add `PGNUploader` to the page.
    *   `[ ] Test:` (RTL) Renders a "Start Training" button (initially disabled).
        *   `[ ] Code:` Add button.
    *   `[ ] Test:` (State/Prop Test) "Start Training" button becomes enabled after PGN is successfully loaded and parsed by `TrainingOrchestrator`.
        *   `[ ] Code:` Manage state for PGN loaded and parsed status.
    *   `[ ] Test:` (Navigation/State Test) Clicking "Start Training" (when enabled) calls `TrainingOrchestrator.startTrainingSession()` and transitions UI to training view.
        *   `[ ] Code:` Implement action for "Start Training".

*   **`TrainingPage.tsx` (or integrated into `page.tsx`)**
    *   `[ ] Test:` (RTL) Renders `ChessBoard` component.
        *   `[ ] Code:` Add `ChessBoard`.
    *   `[ ] Test:` (RTL) `ChessBoard` is correctly oriented based on user's color (White at bottom if user is White, Black at bottom if user is Black).
        *   `[ ] Code:` Pass orientation prop to `ChessBoard` based on `TrainingOrchestrator.userColor`.
    *   `[ ] Test:` (RTL) Displays initial board position from `TrainingOrchestrator.getCurrentFen()` when training starts.
        *   `[ ] Code:` Pass FEN from orchestrator to `ChessBoard`.
    *   `[ ] Test:` (RTL) `ChessBoard` `onDrop` (or click handler) calls `TrainingOrchestrator.handleUserMove()` with the move.
        *   `[ ] Code:` Wire up `ChessBoard` interactions to orchestrator.
    *   `[ ] Test:` (RTL) When `handleUserMove` returns `isValid: true`:
        *   `[ ] Sub-Test:` Board updates to `nextFen`.
        *   `[ ] Sub-Test:` If `opponentMove` is present, an arrow briefly shows opponent's move.
        *   `[ ] Sub-Test:` No red highlighting on squares.
        *   `[ ] Code:` Implement feedback for correct move.
    *   `[ ] Test:` (RTL) When `handleUserMove` returns `isValid: false`:
        *   `[ ] Sub-Test:` Piece returns to its original square (FEN does not change on board).
        *   `[ ] Sub-Test:` The `from` and `to` squares of the attempted incorrect move are briefly highlighted red.
        *   `[ ] Sub-Test:` "Incorrect. Try again." message is displayed.
        *   `[ ] Code:` Implement visual feedback for incorrect move.
    *   `[ ] Test:` (RTL) Displays "Variation complete!" message when `handleUserMove` returns `isVariationComplete: true`.
        *   `[ ] Code:` Implement feedback display.
    *   `[ ] Test:` (RTL) Renders a "Show Correct Move" button.
        *   `[ ] Code:` Add button.
    *   `[ ] Test:` (RTL) Clicking "Show Correct Move" button:
        *   `[ ] Sub-Test:` Calls `TrainingOrchestrator.showCorrectMoveHint()`.
        *   `[ ] Sub-Test:` If variation play count for this key is < 2:
            *   `[ ] Sub-Sub-Test:` Displays an arrow on the `ChessBoard` from the `from` to `to` square of the correct move.
        *   `[ ] Sub-Test:` Else (play count >= 2):
            *   `[ ] Sub-Sub-Test:` No arrow is displayed (user should recall).
        *   `[ ] Code:` Implement "Show Correct Move" button logic and conditional arrow display.
    *   `[ ] Test:` (RTL) Renders a "Next Variation" button (visible after variation completion or perhaps always).
        *   `[ ] Code:` Add button.
    *   `[ ] Test:` (Action Test) Clicking "Next Variation" calls `TrainingOrchestrator.startTrainingSession()` (which picks a new random variation and resets board).
        *   `[ ] Code:` Implement "Next Variation" action.
    *   `[ ] Test:` (RTL) Renders a "Retry Variation" button.
        *   `[ ] Code:` Add button.
    *   `[ ] Test:` (Action Test) Clicking "Retry Variation" calls `TrainingOrchestrator.resetCurrentVariation()` and resets the board to the start of the current variation.
        *   `[ ] Code:` Implement "Retry Variation" action.
    *   `[ ] Test:` (RTL) UI correctly updates to show opponent's automatic replies on the board.
        *   `[ ] Code:` Ensure `ChessBoard` updates after opponent moves.

---

**Phase 4: Statistics Integration (`StatsStore.ts` and `TrainingOrchestrator`)**

*   **`StatsStore.ts` Enhancements**
    *   `[ ] Test:` `recordDetailedAttempt(key, details: {isSuccess: boolean, timeTakenMs: number, clicksBeforeMove: number, incorrectAttemptsOnCurrentMove: number})`
        *   `[ ] Code:` Add method to store more detailed attempt data.
    *   `[ ] Test:` `getAggregatedStats(key)`: Returns aggregated stats (total attempts, total successes, avg time, avg clicks).
        *   `[ ] Code:` Add method for aggregated stats.
    *   `[ ] Test:` `incrementVariationPlayCount(key)`
        *   `[ ] Code:` Add method to specifically track how many times a variation is started.
    *   `[ ] Test:` `getVariationPlayCount(key)`
        *   `[ ] Code:` Add getter for play count.

*   **`TrainingOrchestrator.ts` Integration with `StatsStore.ts`**
    *   `[ ] Test:` `handleUserMove` correctly calls `StatsStore.recordDetailedAttempt` with relevant data (success/fail, placeholders for time/clicks initially).
        *   `[ ] Code:` Integrate `StatsStore` calls.
    *   `[ ] Test:` `startTrainingSession` calls `StatsStore.incrementVariationPlayCount`.
        *   `[ ] Code:` Integrate `StatsStore` calls.
    *   `[ ] Test:` `TrainingOrchestrator` uses `StatsStore.getVariationPlayCount` for "Show Correct Move" logic.
        *   `[ ] Code:` Integrate `StatsStore` calls.

---

**Phase 5: State Management (Conceptual - TDD applied to consumers of state)**

*   `[ ] Decision:` Choose state management (React Context for MVP is likely sufficient).
*   `[ ] Test:` Components that consume shared state (e.g., PGN data, training status) receive and react to state changes correctly. (These tests will be part of the component tests above).
    *   `[ ] Code:` Implement chosen state solution and integrate.

---

**Phase 6: Enhancements to existing utils (if needed during implementation)**

*   **`ChessEngine.ts` Tests**
    *   `[ ] Test:` Verify all public methods of `ChessEngine` with more edge cases (e.g., invalid PGN, illegal moves, different starting FENs).
        *   `[ ] Code:` Add tests and refine `ChessEngine` as needed.
    *   `[ ] Test:` `loadFen(fenString)`: Loads a FEN string into the engine.
        *   `[ ] Code:` Add `loadFen` method to `ChessEngine`.
    *   `[ ] Test:` `getTurn()`: Returns current player's turn ('w' or 'b').
        *   `[ ] Code:` Add `getTurn` method to `ChessEngine`.

*   **`VariationParser.ts` Tests**
    *   `[ ] Test:` Parse PGNs with multiple top-level games (selects the first game's moves).
        *   `[ ] Code:` Clarify/implement behavior for multi-game PGNs.
    *   `[ ] Test:` Parse PGNs with extensive comments and various NAGs, ensuring they are accessible if needed (though maybe not directly used by orchestrator initially).
        *   `[ ] Code:` Add tests and refine `VariationParser`.
    *   `[ ] Test:` Handle malformed PGNs gracefully (e.g., returns null or throws specific error).
        *   `[ ] Code:` Add tests and refine `VariationParser`.

---

This detailed checklist will guide the development process, ensuring that TDD principles are followed strictly. Each step involves writing a failing test first, then the minimal code to pass it, followed by refactoring if necessary.
