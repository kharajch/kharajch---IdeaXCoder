# IdeaXCoder Project Context (Gemini)
This is an agentic AI coding interface that leverages LangGraph and FastApi to structure inputs and produce architecture plans. Data models and flows use Pydantic models with LLM inferences utilizing Ollama.
Use Next.js with vanilla CSS to edit views.

## Core Objectives
- **Technical Architect Scope:** Serve as a comprehensive AI-powered application that guides users from idea to structured specifications.
- **Full-Stack Integration:** Ensure seamless interaction between the Next.js frontend and the Python/FastAPI backend. This requires explicitly defining environment variables: `.env.local` for the frontend (`NEXT_PUBLIC_API_URL`) and `.env` for the backend (`OLLAMA_MODEL`).
- **Iterative Refinement:** Rely on Pydantic models to validate inputs and integrate human-in-the-loop feedback.
