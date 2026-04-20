<p align="center">
  <img src="public/logo.png" alt="IdeaXCoder Logo" width="200" />
</p>

# IdeaXCoder Frontend

Welcome to the frontend application for **IdeaXCoder**, an agentic AI coding interface designed to act as your technical architect.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Styling:** Vanilla CSS (Modern Black & White Theme)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **3D Visuals:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

## 🧠 Project Context

This frontend interacts deeply with a Python/FastAPI backend using LangGraph to process your project ideas. The platform captures user requirements via multiple interactive chat interfaces, performs background web search/wiki research, and generates structured technical specifications.

For rules and agent-specific contexts, please review:

- [Agents Guidelines](../AGENTS.md)
- [Claude Context](../CLAUDE.md)
- [Gemini Context](../GEMINI.md)

## 💻 Step-by-Step Setup Instructions

Follow these steps to fully configure and run both the backend architecture and frontend UI.

### 1. Prerequisites

- **Node.js**: (Version 18+ recommended)
- **Python**: (Version 3.10+ recommended)
- **Ollama**: Install [Ollama](https://ollama.com/) locally to run LLM models. Ensure you pull the required model (e.g., `ollama pull llama3`) so the local agent can utilize it.

### 2. Environment Configuration (.env)

Create the necessary environment variables before running either application:

1. **Frontend**: In the `frontend` directory, create a `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Backend**: Create a `.env` file located in the root project directory (or within `backend`) and explicitly define the `OLLAMA_MODEL` variable. The `backend/main.py` relies on this to route LLM requests properly:

   ```env
   OLLAMA_MODEL=llama3
   ```

### 3. Backend Setup

Since the frontend relies heavily on API interactions with the Python backend, start by setting it up:

1. Open a terminal in the root project directory (`IdeaXCoder`).
2. Create and activate a Python virtual environment:

   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   ```

3. Install backend dependencies (if applicable):

   ```bash
   pip install -r backend/requirements.txt
   ```

4. Run the FastAPI server:

   ```bash
   # From the root directory:
   uvicorn backend.main:app --reload --port 8000
   ```

### 4. Frontend Setup

Now, start the Next.js visual renderer:

1. Open up a second terminal and navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install all Node dependencies:

   ```bash
   npm install
   ```

3. Start the Next.js development server:

   ```bash
   npm run dev
   ```

### 5. Verify the Application

- Open [http://localhost:3000](http://localhost:3000) with your browser to view the Next.js frontend UI.
- The UI should now be successfully communicating with the FastAPI backend at `http://localhost:8000`.

You can freely begin editing the view layer by modifying `app/page.tsx`. Changes will auto-update in your browser.

## 🎨 Branding

The **IdeaXCoder** branding is inspired by **Architectural Brutalism** and the **Digital Sculptor** creative north star (via Stitch).

| Asset | Description | Path |
| :--- | :--- | :--- |
| **Logo** | A structural, monochromatic representation of AI and architecture. | `public/logo.png` |
| **Favicon** | A simplified geometric symbol for browser tabs. | `src/app/favicon.ico` |

## 🌐 API Interaction

The frontend is configured to interface directly with the FastAPI backend. It utilizes AI capabilities via Ollama and orchestrates human-in-the-loop flows natively within the UI components.
