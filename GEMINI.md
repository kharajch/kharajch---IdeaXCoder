# IdeaXCoder Project Context (Gemini)
This is an agentic AI coding interface that leverages LangGraph and FastAPI to structure inputs and produce detailed architecture plans. Data models and state transitions are validated using Pydantic, ensuring rigorous technical accuracy from idea to spec.

## Core Objectives
- **Technical Architect Scope:** Transform user-provided ideas into production-ready **Architectural Blueprints**.
- **Root-Level Integration:** Manage the seamless interaction between the root Next.js frontend and the `backend/` FastAPI server.
- **Full-Stack Environment:** Maintain `.env.local` (Frontend) and `.env` (Backend) in the root directory for orchestration.
- **Iterative Refinement:** Utilize Human-in-the-Loop checkpoints to allow user feedback during the graph execution.
- **Model Orchestration:** Defaults to `nemotron-mini:latest` via Ollama for lightweight, high-speed local inference.

---

