# IdeaXCoder Project Context (Agents)
The backend architecture resides in `backend/main.py` and connects to Ollama alongside Web Search Tools and Wikipedia search agents. Agent state is strictly managed using an `AppState` TypedDict in Python, ensuring persistent context throughout the architectural planning process.

## Agent Architecture & Workflow
- **LangGraph Integration:** Orchestrates the flow between requirement gathering, research, and specification generation.
- **Research Capabilities:** Employs specialized agents to crawl the web and Wikipedia for technical documentation and best practices.
- **Architect Core:** Synthesizes gathered data into comprehensive, structured technical specifications (Blueprints).
- **Human-in-the-Loop:** Pause/Resume capability allows users to refine the agent's direction before moving to the next phase.
- **Environment Configuration:** Requires `OLLAMA_MODEL` (e.g., `OLLAMA_MODEL="nemotron-mini:latest"`) in the root `.env` file to correctly route requests to the local inference engine.

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project uses Next.js (App Router) integrated directly at the root. File structure and API conventions are critical—refer to `src/app` for visual logic. Heed deprecation notices and adhere to the strict Vanilla CSS styling rules.
<!-- END:nextjs-agent-rules -->


