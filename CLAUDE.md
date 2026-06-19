# IdeaXCoder Project Context (Claude)
Next.js acts as the primary visual display renderer, integrated directly into the project root. The UI follows an **"Architectural Brutalism"** and **"Digital Sculptor"** aesthetic—monochromatic, structured, and premium. It utilizes Vanilla CSS for all styling, combined with Framer Motion and React Three Fiber to create a high-fidelity 3D command center. The intelligence is powered by NVIDIA NIM (meta/llama-3.1-70b-instruct).

## Frontend Requirements
- **3D Command Center:** A technical architect dashboard that feels alive and responsive.
- **Glassmorphism & Brutalism:** Use high-contrast monochromatic themes with subtle glass effects and bold typography.
- **Interactive Chat Flows:** Multi-stage interfaces that capture requirements and display agent progress in real-time.
- **Performance:** Optimized for smooth 3D interactions using React Three Fiber.
- **Environment Configuration:** Requires `.env.local` in the root with `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Development & Test Commands
- **Start FastAPI Backend:** `.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000`
- **Start Next.js Frontend:** `npm run dev`
- **Run Backend Tests:** `npm run test:backend` (runs `pytest test/test_backend.py`)
- **Run E2E Playwright Tests:** `npm run test:e2e` (runs `playwright test`)
- **Run E2E Playwright UI:** `npm run test:e2e:ui` (interactive UI runner)

## Styling Rules
- **Strict Vanilla CSS:** Avoid TailwindCSS. Manage all visual tokens, glassmorphism panel styles, and layout styles inside [globals.css](file:///K:/Codes/Web%20Devlopment/My%20Projects/kharajch---IdeaXCoder/src/app/globals.css).
- **No Scoped CSS (`style jsx`):** Scoped `<style jsx>` blocks are not parsed by default in this App Router structure. Put modal, grid, overlays, and responsive animations in the global stylesheet.


---

