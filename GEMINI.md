# IdeaXCoder Project Context (NVIDIA)
This is an agentic AI coding interface that leverages LangGraph and FastAPI to structure inputs and produce detailed architecture plans. Data models and state transitions are validated using Pydantic, ensuring rigorous technical accuracy from idea to spec.

## Core Objectives
- **Technical Architect Scope:** Transform user-provided ideas into production-ready **Architectural Blueprints**.
- **Root-Level Integration:** Manage the seamless interaction between the root Next.js frontend and the `backend/` FastAPI server.
- **Full-Stack Environment:** Maintain `.env.local` (Frontend) and `.env` (Backend) in the root directory for orchestration.
- **Iterative Refinement:** Utilize Human-in-the-Loop checkpoints to allow user feedback during the graph execution.
- **Model Orchestration:** Defaults to `meta/llama-3.1-70b-instruct` via NVIDIA NIM for high-speed, high-accuracy architectural inference.
- **Coding & Styling Standards:** Code style uses strict Vanilla CSS rules. All styling attributes must reside in [globals.css](file:///K:/Codes/Web%20Devlopment/My%20Projects/kharajch---IdeaXCoder/src/app/globals.css) globally, avoiding local `<style jsx>` modules. E2E interactions must be test-verified using Playwright configurations inside [test_frontend.spec.js](file:///K:/Codes/Web%20Devlopment/My%20Projects/kharajch---IdeaXCoder/test/test_frontend.spec.js).


---

