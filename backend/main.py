import os
import uuid
from typing import List, Optional, Literal
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_nvidia_ai_endpoints import ChatNVIDIA
# from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# Load Environment Variables
load_dotenv()

# Setup App
app = FastAPI(title="IdeaXCoder API")
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
from typing_extensions import TypedDict

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
    spec: Optional[ProjectSpec]
    pending_feedback: bool
    feedback: Optional[str]
    is_satisfactory: bool
    think_log: List[str]

# Graph Nodes
def search_and_formulate_node(state: AppState):
    print("[search_and_formulate_node] Starting...")
    data = state["input_data"]
    
    # Optional search steps to enrich the prompt
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

    # LLM Request using structured output
    if not llm:
        raise Exception("AI model is not configured (missing NVIDIA_API_KEY).")
    structured_llm = llm.with_structured_output(ProjectSpec)
    
    prompt = f"""
    You are an expert Software Architect. Using the following user requirements and context, build a technical specification.
    User Requirements: {data}
    Additional Context from Web Info: {combined_result_set}
    Formulate the project architecture.
    """
    
    spec = structured_llm.invoke([HumanMessage(content=prompt)])
    
    return {
        "spec": spec, 
        "combined_result_set": combined_result_set, 
        "pending_feedback": True,
        "think_log": ["Used web/wiki tools.", "Generated initial spec.", "Waiting for feedback."]
    }

def evaluate_feedback_node(state: AppState):
    print("[evaluate_feedback_node] Starting...")
    is_sat = state.get("is_satisfactory", True)
    if is_sat:
        return {"pending_feedback": False, "think_log": ["User is satisfied. Terminating process."]}
    
    # If not satisfied
    return {"think_log": ["User provided feedback. Need to parse and re-formulate."]}

def process_feedback_node(state: AppState):
    print("[process_feedback_node] Starting...")
    # Re-evaluate
    if not llm:
        raise Exception("AI model is not configured (missing NVIDIA_API_KEY).")
    structured_llm = llm.with_structured_output(ProjectSpec)
    
    prompt = f"""
    You are an expert Software Architect. You previously built this spec:
    {state['spec']}
    
    The user provided the following feedback because they were NOT satisfied:
    {state['feedback']}
    
    Please incorporate the feedback and provide a NEW, updated technical specification.
    """
    
    spec = structured_llm.invoke([HumanMessage(content=prompt)])
    return {
        "spec": spec,
        "pending_feedback": True, 
        "feedback": None,
        "think_log": ["Re-generated spec based on feedback.", "Waiting for feedback."]
    }

# Edges
def route_after_eval(state: AppState):
    if state.get("is_satisfactory", True):
        return END
    return "process_feedback"

# Build Graph
workflow = StateGraph(AppState)
workflow.add_node("search_and_formulate", search_and_formulate_node)
workflow.add_node("evaluate_feedback", evaluate_feedback_node)
workflow.add_node("process_feedback", process_feedback_node)

workflow.add_edge(START, "search_and_formulate")
workflow.add_edge("search_and_formulate", END) # The process stops conceptually here to wait for user if via API we pause. 
# Re-mapping for single-pass API where Human-in-loop is just sequential API calls:
# Actually we can't pause the graph cleanly without checkpoints and 'interrupt_before'. 
# We'll use interrupt.

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

@app.post("/research")
async def research_api(req: ResearchRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    input_data = req.dict()
    initial_state = {
        "input_data": input_data,
        "pending_feedback": False,
        "is_satisfactory": False,
        "think_log": ["Initializing research agent..."]
    }
    
    # Run the graph until the interrupt
    app_graph.invoke(initial_state, config=config)
    
    state = app_graph.get_state(config).values
    
    return {
        "thread_id": thread_id,
        "spec": state.get("spec"),
        "think_log": state.get("think_log"),
        "status": "pending_feedback"
    }

@app.post("/feedback")
async def feedback_api(req: FeedbackRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    # Update State with feedback
    app_graph.update_state(config, {"feedback": req.feedback, "is_satisfactory": req.is_satisfactory})
    
    # Resume the graph
    app_graph.invoke(None, config=config)
    state = app_graph.get_state(config).values
    
    if req.is_satisfactory:
        return {
            "status": "completed",
            "spec": state.get("spec"),
            "think_log": ["User approved the specification. Finishing process."]
        }
    else:
        return {
            "status": "pending_feedback",
            "spec": state.get("spec"),
            "think_log": state.get("think_log")
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
