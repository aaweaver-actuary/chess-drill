
# ComChess MVP Design & Development Tasks

## High-Level Overview
**ComChess** is an iOS training application designed to help users practice chess variations loaded from PGN files. When training begins, the application randomly selects a variation from the user's PGN file. The user plays the white pieces against computer-selected black moves. If the user makes a mistake, they're gently corrected, prompted to retry, and upon successful completion of the variation, another random variation is selected.

The app begins with a brief title splash screen before transitioning to a simple menu, enabling the user to either upload a PGN file or start training directly. PGN uploads allow users to select files from their local storage.

### Architectural Goals
- **Test-Driven Development (TDD)**: Each functionality begins with XCTest-driven unit tests.
- **Modular Swift Packages**: Core functionality is encapsulated within clearly defined Swift Package modules.
- **Plugin-based Modular Design**: Training exercises follow a protocol-oriented design, allowing additional training game modes to be added seamlessly in the future without modifying existing code.
- **MVVM Design Pattern**: Using SwiftUI (or UIKit), clearly separate models, view-models, and views.
- **SOLID Principles**: Adhering strictly to Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.

---

## Step-by-Step Module Tasks

### Module 1: Project Initialization and Testing Foundation
- Create Xcode workspace (`ComChess.xcworkspace`).
- Initialize empty Swift packages for each module (`ChessModel`, `PGNParser`, `FileManagement`, `PluginAPI`, `TrainingEngine`, `BasicTrainer`, `UIComponents`).
- Set up XCTest targets and folders for each module.
- Document the TDD workflow clearly, including pre-commit hooks enforcing tests.

---

### Module 2: ChessModel
- Define core chess concepts (Pieces, Squares, Moves, Board).
- Write extensive tests covering initialization, move logic, board state transitions, and edge cases.
- Implement an immutable board representation.
- Document clearly all public-facing APIs and ensure adherence to SOLID principles.

---

### Module 3: PGNParser
- Establish a clear protocol for PGN parsing.
- Implement a concrete PGN parser to extract variations from PGN files, supporting nested variations.
- Write comprehensive unit tests verifying correct parsing and handling of invalid PGN inputs with clear errors.
- Ensure parser adheres to SOLID and can be replaced or extended easily.

---

### Module 4: FileManagement
- Define an abstract interface for loading and listing PGN files.
- Implement local file storage interaction for loading PGNs, using Swift's FileManager API.
- Create tests for local file handling, using stubs and temporary directories to verify correctness.

---

### Module 5: PluginAPI
- Design an abstract protocol defining a generic training game interface.
- Clearly define methods and properties a training plugin must implement.
- Develop unit tests using a dummy implementation to validate protocol correctness.
- Implement a mechanism allowing easy plugin registration and retrieval at runtime.

---

### Module 6: TrainingEngine
- Develop the core training engine that orchestrates training gameplay.
- Write tests for loading variations, random variation selection, handling user moves, and resetting logic.
- Implement training session logic, verifying interactions between components through dependency injection.
- Ensure the engine’s API supports integration with SwiftUI view-models clearly and simply.

---

### Module 7: BasicTrainer (Plugin Implementation)
- Create the concrete training plugin for drilling PGN variations, conforming strictly to the training protocol.
- Implement logic for handling correct and incorrect user moves, providing gentle feedback.
- Develop thorough tests covering standard usage scenarios, mistake corrections, variation completions, and resets.

---

### Module 8: UIComponents
- **Landing Screen**: Brief title splash transitioning smoothly to main menu.
  - Write snapshot-based tests verifying UI behavior and transitions.
- **Menu Screen**: Allows users to upload PGN or begin training.
  - Write tests ensuring buttons exist and trigger correct actions.
- **File Selection Screen**: Integrates with the file management module to list and load PGN files.
  - Test file selection and engine loading behavior.
- **Training View**: Displays interactive chessboard, move indicators, and feedback messages.
  - Ensure detailed UI interaction testing for correct state updates after user inputs.
- **Chessboard Component**: Modular, reusable component to visually represent board state.
  - Use tests to ensure correctness of board rendering and responsiveness to state changes.

---

### Module 9: Continuous Integration and Quality Assurance
- Configure GitHub Actions for automatic testing and linting upon pushes.
- Include SwiftLint for consistent code style and Danger for PR quality checks.
- Generate and enforce a minimum of 80% test coverage, integrated into the project README.

---

### Module 10: Documentation and Onboarding
- Generate complete, clearly written API documentation using Jazzy.
- Create detailed developer onboarding documentation, including:
  - Project setup instructions.
  - Test-driven workflow instructions.
  - Plugin extension guide for future training modules.
- Regularly update `com-chess.md` to reflect completed tasks and progress.

---

## Timeline and Milestones

- **Week 1**: Modules 1–3 (ChessModel, PGNParser, FileManagement) foundational work.
- **Week 2**: Modules 4–6 (PluginAPI, TrainingEngine, BasicTrainer plugin) training logic integration.
- **Week 3**: Module 7–8 (BasicTrainer refinements, comprehensive UI implementation, integration with logic).
- **Week 4**: Modules 9–10 (Continuous Integration, Documentation, Onboarding, final refinements).

---

## Requirements Verification Checklist

The current document explicitly meets the original project requirements:

| Requirement | Verified | Details |
|-------------|----------|---------|
| Full unit test support | ✅ | Each module explicitly begins with unit tests (XCTest). |
| Test-driven development | ✅ | TDD explicitly mandated and integrated into workflow. |
| Good programming practices | ✅ | Explicit adherence to SOLID, modularity, MVVM clearly documented. |
| Modular design for future extension | ✅ | Defined a PluginAPI for adding future training modes easily without modifying core components. |
| Clear high-level overview | ✅ | Detailed summary provided for app flow, architecture, and design. |
| Explicit step-by-step task breakdown | ✅ | Clearly enumerated development tasks per module, logically ordered for team-wide distribution. |
| File `com-chess.md` clearly structured | ✅ | Clearly organized markdown document ready for immediate use. |
