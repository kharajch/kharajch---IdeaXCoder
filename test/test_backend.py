import os
import sys
import json
import pytest
from httpx import AsyncClient, ASGITransport

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

import main

# Mock LLM to simulate NVIDIA NIM streaming response
class MockChatLLM:
    async def astream(self, messages, **kwargs):
        yield type('Chunk', (object,), {'content': "<thought>\nAnalyzing requirements for a test application...\n</thought>\n"})()
        
        spec_data = {
            "objective": "Build a test app",
            "tech_stack": ["React", "FastAPI", "SQLite"],
            "architecture": "MVC Client-Server",
            "data_model": "Task: id, title, done",
            "design_decisions": "Use clean code principles",
            "functional_flows": ["User registers", "User creates task"],
            "development_plan_steps": ["Setup database", "Implement API", "Build UI"],
            "acceptance_criteria": ["Tasks can be added", "API responds under 200ms"]
        }
        yield type('Chunk', (object,), {'content': json.dumps(spec_data)})()

@pytest.fixture(autouse=True)
def setup_mock_llm():
    # Inject Mock LLM into main module before test runs
    original_llm = main.llm
    main.llm = MockChatLLM()
    yield
    main.llm = original_llm

@pytest.mark.asyncio
async def test_research_endpoint():
    transport = ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {"idea": "Create a task tracking application"}
        response = await ac.post("/research", json=payload)
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                event_data = json.loads(line[6:])
                events.append(event_data)
        
        # We expect a series of logs/tokens and a final event
        assert len(events) > 0
        final_event = events[-1]
        assert final_event["type"] == "final"
        assert final_event["status"] == "pending_feedback"
        assert "spec" in final_event
        assert final_event["spec"]["objective"] == "Build a test app"
        assert "thread_id" in final_event
