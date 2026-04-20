# Objective

    I Want To Build A Web Application That Will Have Multiple Chat Interfaces To Interact With The LLM To Build The Project With The Proper Tech Stack And Architecture From A Prompt Of Rough Idea Of The Project Given To The LLM. The LLM Will Ask Questions To The User To Gather More Information About The Project And Will Build The Project With The Proper Tech Stack And Architecture. The LLM Will Also Provide The User With The Proper Tech Stack And Architecture For The Project.

    The Web App Will Be Named "kharajch---IdeaXCoder"

# Tech Stact

    1. Google Stitch (IMPORTANT - Must Use Google Stitch for Designing)
    2. HTML
    3. CSS
    4. JavaScript
    5. Next.js (IMPORTANT - Must Use Next.js for Frontend)
    6. React
    7. Vanila CSS (IMPORTANT - No Tailwind CSS, Using Vanila CSS Is Strictly Required For Styling)
    8. LangChain (IMPORTANT - Must Use LangChain for Backend)
    9. LangGraph (IMPORTANT - Must Use LangGraph for Backend)
    10. Python (IMPORTANT - Must Use Python for Backend)
    11. FastAPI (IMPORTANT - Must Use FastAPI for Backend)
    12. Pydantic (IMPORTANT - Must Use Pydantic for Backend)
    13. Framer Motion
    14. GSAP
    15. Three.js
    16. React Three Fiber
    17. React Icons
    13. React Scroll
    14. React Tilt
    15. React Parallax
    16. React Spring
    16. React Flip Toolkit

# Architecture

    1. The web application will have a frontend and a backend.
    2. The frontend will have multiple chatboxes to ask questions to the LLM.
            a. Chatbox asking for the problem statement.
            b. What do you think is the solution for this problem statement?
            c. What do you want to implement as the solution give a descriptive overview of the solution step by step.
            d. What type of features do you want to implement in the application give a detailed list of features?
            e. What will be the input, output, what to process, what to give result as output give a descriptive answer.
            f. What will be the constraints and edge cases for the project give a descriptive answer.
            g. What is your expectation from this project? What do you want to implement as the final result? What will make the final output as satisfactory to you? What is the acceptance criteria for this project?
    
    3. The backend will have an endpoint to handle the requests from the frontend and send the responses to the frontend.
    4. The frontend will submit a post request to the backend endpoint with the question.
    5. The backend will send the question to the LLM.
    6. The LLM will return the answer to the backend.
    7. The backend will send the answer to the frontend.
    8. The frontend will display the answer to the user.
    9. The LLM must remember the previous questions and answers.
    10. The chat history will be saved in the local storage of the browser.
    11. There Will Be A Option To Start A New Chat.

# Design

    1. The Website Will Be A Modern Website With Smooth Animations And Transitions.
    2. Theme Color Will Be Black And White With 3D Designs and Animations.
    3. Hero Section  Will Be Modern And Eye Catching. It Will Also Include The Company Logo @logo.jpg
    4.Title Of The Website Will Be "kharajch---IdeaXCoder"
    5.Favicon Will Be Photo @favicon.ico

# Workflow

## Initialization & Setup

    1. Initialize A Git Repository. (use `git init`)
    2. Create a .gitignore file and add all the dependencies and node_modules, .env, venv folder to it.
    3. Create A New Next.js Project. (use `npx create-next-app@latest`)
    4. Install All The Dependencies. (use `npm install`)
    5. Create A Virtual Environment Named "venv" For Python
    6. Install The Dependencies -
        a. FastAPI
        b. LangChain
        c. LangGraph
        d. Langchain-core
        e. Langchain-community
        f. Langchain-ollama
        g. Python-dotenv
        h. Requests
        h. BeautifulSoup4
    6. Create A .env File In The Root Directory And Add The Following Variables -
        a. OLLAMA_API_KEY=Your_API_KEY

### git

        1. Stage All The Files. (use `git add .`)
        2. Commit The Code With The Message "Initial Commit". (use `git commit -m "Initial Commit"`)

## Backend Development

    1. Create A Langchain, LangGraph Based Application Using FastAPI -
        a. import FastAPI from fastapi
        b. import load_dotenv from dotenv
        c. import BaseModel from pydantic
        d. import ChatOpenRouter from langchain_openrouter
        e. import SystemMessage, HumanMessage, AIMessage from langchain_core.messages
        f. from langchain_core.prompts import PromptTemplate
        g. from langgraph.graph import StateGraph, END, START
        h. from typing import TypeDict
        h. Difine the StateDict as a TypeDict with proper keys and values required for the project.
        i. Difine the PromptTemplate to implement a proper structured Technical Design Plan using the PROJECT IDEA given as a prompt by the user. 
        j. Define the LLM using Ollama
        k. Define the Graph using Langchain
        l. Create Nodes For The Graph
        m. Add Edges and Conditional Edges For The Graph
        n. Compile The Graph
        o. Execute The Graph With Proper Input
        p. Create a FastAPI endpoint named "/research" where the frontend page will submit a post request with the message of the user and it will return the answer.
        q. Use with_structured_output(json_schema) to get the response in JSON format and then extract the conten out of it. The Content Format Will Be As Follows: (IMPORTANT Must Follow Define Using Pydantic)
            i. Objective : String
            ii. Tech Stack : List[String]
            iii. Architecture : String
            iv. Data Model : String
            v. Design Decisions : String
            vi. Functional Flows : List[String]
            vii. Development Plan & Steps : List[String]
            viii. Acceptance Criteria : List[String]
        r. Send The Response To The Frontend.
        s. Ask the user if satisfied or not with the answer. If not then ask what changes he wants to make and then again send the request to the LLM. Regenerate the response based on the user's feedback.
        t. read @workflow.png file for more information about the workflow.

### git

        1. Stage All The Files.
        2. Commit The Code With The Message "Backend Development Completed". (use `git commit -m "Backend Development Completed"`)

## Frontend Development

    1. Create The Frontend Design Using Google Stitch.
    2. Create A Modern Logo Using Google Stitch. (save it as @logo.jpg)
    3. Create A Modern Favicon And Design Using Google Stitch. (save it as @favicon.ico)
    4. Create A Modern Website Using Next.js And React.
    5. Use Vanila CSS For Styling.
    6. Use Framer Motion And GSAP For Animations.
    6. Use Three.js And React Three Fiber For 3D Designs.
    7. Use React Icons For Icons.
    8. Use React Scroll For Scrolling.
    9. Use React Tilt For Tilt Effects.
    10. Use React Parallax For Parallax Effects.
    11. Use React Spring For Spring Animations.
    12. Use React Flip Toolkit For Flip Animations.
    13. Create A Modern Hero Section With The Logo And Title.
    14. Create Modern Chatboxes.
    15. Create A Modern Chat History Section.
    16. Create A Modern Thinking Section.
    17. Create A Modern Searchbar To Search The History Section.
    18. Create A Modern Footer.

### git

        1. Stage All The Files. (use `git add .`)
        2. Commit The Code With The Message "Frontend Development Completed". (use `git commit -m "Frontend Development Completed"`)

## Important Notes

    1. Don't use any other library in the development if not necessary.
    2. Just before the final commit, create GEMINI.md, AGENTS.md, CLAUDE.md files with proper context about the project written in them.
    3. Create A Folder Named "planning" And Copy @design.md, @prompt.txt, @workflow.png And @spec.md Inside It.
