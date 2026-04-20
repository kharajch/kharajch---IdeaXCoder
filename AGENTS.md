# IdeaXCoder Project Context (Agents)
The backend architecture resides in `backend/main.py` and connects to Ollama alongside Web Search Tools and Wikipedia search agents. Agent state is strictly configured within an AppState typing dict in Python.

## Agent Architecture & Workflow
- **LangGraph Integration:** Processes project ideas and coordinates agent tasks.
- **Research Capabilities:** Utilizes Web Search and Wikipedia search agents to gather context.
- **Technical Specifications:** Generates structured technical specifications based on gathered user requirements.
- **Human-in-the-Loop:** Incorporates ongoing feedback to iteratively refine output and architecture plans.
- **Environment Configuration:** The backend explicitly requires `OLLAMA_MODEL` (e.g., `OLLAMA_MODEL=llama3`) to be defined in a `.env` file to correctly route requests to the locally running model.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

