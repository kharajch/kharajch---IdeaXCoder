import os
import uuid
import json
import asyncio
from typing import List, Optional, Literal, AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict

# Load Environment Variables
load_dotenv()

# Setup App
app = FastAPI(title="IdeaXCoder API", root_path="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM Config
nvidia_model = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
nvidia_api_key = os.getenv("NVIDIA_API_KEY")

if nvidia_api_key:
    llm = ChatNVIDIA(
        model=nvidia_model,
        api_key=nvidia_api_key,
        temperature=0.7
    )
else:
    print("⚠️ WARNING: NVIDIA_API_KEY is not set. Please update your .env file.")
    llm = None

# Search Tools
from duckduckgo_search import DDGS
class CustomDDGS:
    def invoke(self, kwargs):
        try:
            with DDGS() as ddgs:
                return str(list(ddgs.text(kwargs.get("query", ""), max_results=2)))
        except Exception as e:
            return str(e)

search_tool = CustomDDGS()
wiki_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
wiki_tool = WikipediaQueryRun(api_wrapper=wiki_wrapper)

# State Definition
class ProjectSpec(BaseModel):
    objective: str = Field(description="Objective")
    tech_stack: List[str] = Field(description="Tech Stack")
    architecture: str = Field(description="Architecture")
    data_model: str = Field(description="Data Model")
    design_decisions: str = Field(description="Design Decisions")
    functional_flows: List[str] = Field(description="Functional Flows")
    development_plan_steps: List[str] = Field(description="Development Plan & Steps")
    acceptance_criteria: List[str] = Field(description="Acceptance Criteria")

class AppState(TypedDict):
    input_data: dict
    combined_result_set: str
    spec: Optional[dict]
    pending_feedback: bool
    feedback: Optional[str]
    is_satisfactory: bool
    think_log: List[str]

# Helper to parse JSON from a string that might contain other text (like <thought> blocks)
def parse_spec_from_text(text: str) -> Optional[dict]:
    try:
        # Look for the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json.loads(json_str)
    except Exception:
        pass
    return None

# Graph Nodes
async def search_and_formulate_node(state: AppState):
    data = state["input_data"]
    
    # Optional search steps
    query = f"{data.get('problem_statement', '')} {data.get('solution', '')}"
    wiki_result = ""
    search_result = ""
    if len(query) > 10:
        try:
            wiki_result = wiki_tool.invoke({"query": query[:300]})
        except Exception:
            pass
        try:
            search_result = search_tool.invoke({"query": query[:300]})
        except Exception:
            pass

    combined_result_set = f"WIKI:\n{wiki_result}\n\nWEB SEARCH:\n{search_result}"

    if not llm:
        raise Exception("AI model is not configured.")

    prompt = f"""
    You are an expert Software Architect. 
    First, brainstorm and "think" about the architecture in detail inside <thought> tags. 
    Then, provide the final technical specification in JSON format matching the schema below.
    
    SCHEMA:
    {json.dumps(ProjectSpec.model_json_schema(), indent=2)}
    
    User Requirements: {data}
    Additional Context from Web Info: {combined_result_set}
    
    Output format:
    <thought>
    Your detailed reasoning here...
    </thought>
    {{
      "objective": "...",
      ...
    }}
    """
    
    full_content = ""
    async for chunk in llm.astream([HumanMessage(content=prompt)]):
        full_content += chunk.content
    
    spec = parse_spec_from_text(full_content)
    
    # Extract thought for the log
    thought = "Generated initial specification."
    if "<thought>" in full_content and "</thought>" in full_content:
        thought_content = full_content.split("<thought>")[1].split("</thought>")[0].strip()
        thought = f"Thinking complete: {thought_content}"

    return {
        "spec": spec, 
        "combined_result_set": combined_result_set, 
        "pending_feedback": True,
        "think_log": state.get("think_log", []) + [thought]
    }

async def process_feedback_node(state: AppState):
    if not llm:
        raise Exception("AI model is not configured.")
    
    prompt = f"""
    You are an expert Software Architect. You previously built this spec:
    {json.dumps(state['spec'], indent=2)}
    
    The user provided the following feedback because they were NOT satisfied:
    {state['feedback']}
    
    Please incorporate the feedback. 
    First, think about the changes in detail inside <thought> tags.
    Then, provide a NEW, updated technical specification in JSON format.
    
    SCHEMA:
    {json.dumps(ProjectSpec.model_json_schema(), indent=2)}
    """
    
    full_content = ""
    async for chunk in llm.astream([HumanMessage(content=prompt)]):
        full_content += chunk.content
        
    spec = parse_spec_from_text(full_content)
    
    thought = "Re-generated spec based on feedback."
    if "<thought>" in full_content and "</thought>" in full_content:
        thought_content = full_content.split("<thought>")[1].split("</thought>")[0].strip()
        thought = f"Thinking complete: {thought_content}"

    return {
        "spec": spec,
        "pending_feedback": True, 
        "feedback": None,
        "think_log": state.get("think_log", []) + [thought]
    }

# Build Graph
workflow_with_human = StateGraph(AppState)
workflow_with_human.add_node("search_and_formulate", search_and_formulate_node)
workflow_with_human.add_node("process_feedback", process_feedback_node)

workflow_with_human.add_edge(START, "search_and_formulate")

def route_feedback(state: AppState):
    if state.get("is_satisfactory"):
        return END
    return "process_feedback"

workflow_with_human.add_conditional_edges("search_and_formulate", route_feedback)
workflow_with_human.add_conditional_edges("process_feedback", route_feedback)

memory = MemorySaver()
app_graph = workflow_with_human.compile(
    checkpointer=memory, 
    interrupt_after=["search_and_formulate", "process_feedback"]
)

# Models
class ResearchRequest(BaseModel):
    problem_statement: str
    solution: str
    implementation: str
    features: str
    constraints: str
    expectations: str

class FeedbackRequest(BaseModel):
    thread_id: str
    is_satisfactory: bool
    feedback: Optional[str] = None

# API Endpoints
@app.post("/research")
async def research_api(req: ResearchRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = {
        "input_data": req.dict(),
        "pending_feedback": False,
        "is_satisfactory": False,
        "think_log": ["Initializing research agent..."]
    }
    
    async def stream_generator():
        # Use astream_events to capture tokens
        async for event in app_graph.astream_events(initial_state, config=config, version="v2"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
            elif kind == "on_node_start":
                yield f"data: {json.dumps({'type': 'log', 'content': f'Running node: {event['name']}'})}\n\n"

        # Final state retrieval
        state = app_graph.get_state(config).values
        yield f"data: {json.dumps({
            'type': 'final', 
            'thread_id': thread_id, 
            'spec': state.get('spec'),
            'think_log': state.get('think_log'),
            'status': 'pending_feedback'
        })}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@app.post("/feedback")
async def feedback_api(req: FeedbackRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    # Update State with feedback
    app_graph.update_state(config, {"feedback": req.feedback, "is_satisfactory": req.is_satisfactory})
    
    async def stream_generator():
        # Resume the graph
        async for event in app_graph.astream_events(None, config=config, version="v2"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
            elif kind == "on_node_start":
                yield f"data: {json.dumps({'type': 'log', 'content': f'Resuming at node: {event['name']}'})}\n\n"

        state = app_graph.get_state(config).values
        if req.is_satisfactory:
            yield f"data: {json.dumps({
                'type': 'final',
                'status': 'completed',
                'spec': state.get('spec'),
                'think_log': state.get('think_log')
            })}\n\n"
        else:
            yield f"data: {json.dumps({
                'type': 'final',
                'status': 'pending_feedback',
                'spec': state.get('spec'),
                'think_log': state.get('think_log')
            })}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
