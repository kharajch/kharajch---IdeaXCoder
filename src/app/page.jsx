"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TorusKnot } from "@react-three/drei";
import Tilt from "react-parallax-tilt";
import { FiSearch, FiMessageSquare, FiCommand, FiRefreshCw } from "react-icons/fi";

const API_URL = "http://localhost:8000";

// --- 3D Background Component ---
function Background3D() {
  const meshRef = useRef(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <TorusKnot ref={meshRef} args={[10, 3, 100, 16]} position={[0, 0, -20]}>
        <meshStandardMaterial color="#ffffff" wireframe />
      </TorusKnot>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

// --- Main Page ---
export default function IdeaXCoder() {
  // State for forms
  const [formData, setFormData] = useState({
    problem_statement: "",
    solution: "",
    implementation: "",
    features: "",
    constraints: "",
    expectations: ""
  });

  // Flow State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentSpec, setCurrentSpec] = useState(null);
  const [pendingFeedback, setPendingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  
  // History State
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Storage Effect
  useEffect(() => {
    const saved = localStorage.getItem("ideaxcoder_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveHistory = (newEntry) => {
    const nextH = [newEntry, ...history];
    setHistory(nextH);
    localStorage.setItem("ideaxcoder_history", JSON.stringify(nextH));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitResearch = async () => {
    setIsEvaluating(true);
    setLogs(["Submitting research payload to backend..."]);
    try {
      const res = await axios.post(`${API_URL}/research`, formData);
      setThreadId(res.data.thread_id);
      setLogs((prev) => [...prev, ...(res.data.think_log || [])]);
      
      if (res.data.status === "pending_feedback") {
        setCurrentSpec(res.data.spec);
        setPendingFeedback(true);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `ERROR: ${err.message}`]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const submitFeedback = async (isSatisfactory) => {
    if (!threadId) return;
    setIsEvaluating(true);
    setLogs((prev) => [...prev, isSatisfactory ? "Approving Spec..." : "Submitting Feedback..."]);
    
    try {
      const res = await axios.post(`${API_URL}/feedback`, {
        thread_id: threadId,
        is_satisfactory: isSatisfactory,
        feedback: isSatisfactory ? null : feedbackMsg
      });

      setLogs((prev) => [...prev, ...(res.data.think_log || [])]);
      setCurrentSpec(res.data.spec);

      if (res.data.status === "completed") {
        setPendingFeedback(false);
        setLogs((prev) => [...prev, "Process completed explicitly!"]);
        // Save to History
        saveHistory({
          id: threadId,
          timestamp: new Date().toISOString(),
          title: formData.problem_statement.substring(0, 30) + "...",
          spec: res.data.spec
        });
      } else {
        // Still pending
        setFeedbackMsg("");
      }
    } catch (err) {
      setLogs((prev) => [...prev, `ERROR: ${err.message}`]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const startNew = () => {
    setFormData({
      problem_statement: "", solution: "", implementation: "",
      features: "", constraints: "", expectations: ""
    });
    setThreadId(null);
    setLogs([]);
    setCurrentSpec(null);
    setPendingFeedback(false);
  };

  return (
    <>
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <Background3D />
        </Canvas>
      </div>

      <div className="container">
        {/* Left: Chat History */}
        <motion.div 
          className="sidebar glass-panel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiMessageSquare /> History
          </h2>
          <div style={{ position: "relative" }}>
            <FiSearch style={{ position: "absolute", left: "10px", top: "14px", color: "#888" }} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            {history
              .filter(h => h.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((h, i) => (
                <div key={i} className="chatbox-card glass-panel" style={{ padding: "12px", cursor: "pointer" }} onClick={() => setCurrentSpec(h.spec)}>
                  <p style={{ fontSize: "14px", fontWeight: "bold" }}>{h.title}</p>
                  <p style={{ fontSize: "10px", color: "#888" }}>{new Date(h.timestamp).toLocaleString()}</p>
                </div>
            ))}
            {history.length === 0 && <p style={{ color: "#555", fontSize: "12px", textAlign: "center" }}>No history found.</p>}
          </div>
        </motion.div>

        {/* Center: Main Inputs */}
        <motion.div 
          style={{ display: "flex", flexDirection: "column" }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="hero">
            <h1>IdeaXCoder</h1>
            <p style={{ color: "#aaa", marginTop: "8px" }}>AI Agentic Technical Architecture</p>
            <button onClick={startNew} style={{ marginTop: "16px", background: "transparent", border: "1px solid #fff", color: "#fff" }}>
              <FiRefreshCw /> Start New Concept
            </button>
          </div>

          <div className="form-grid">
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>1. Problem Statement</label>
                <textarea rows={3} name="problem_statement" value={formData.problem_statement} onChange={handleInputChange} placeholder="What problem are you solving?" />
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>2. Proposed Solution</label>
                <textarea rows={3} name="solution" value={formData.solution} onChange={handleInputChange} placeholder="How are you solving it?" />
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>3. Implementation Plan</label>
                <textarea rows={3} name="implementation" value={formData.implementation} onChange={handleInputChange} placeholder="Step by step approach?" />
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>4. Key Features</label>
                <textarea rows={3} name="features" value={formData.features} onChange={handleInputChange} placeholder="Detailed list of features" />
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>5. Constraints & Edge Cases</label>
                <textarea rows={3} name="constraints" value={formData.constraints} onChange={handleInputChange} placeholder="Known limitations?" />
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
              <div className="chatbox-card glass-panel">
                <label>6. Expectations</label>
                <textarea rows={3} name="expectations" value={formData.expectations} onChange={handleInputChange} placeholder="Acceptance criteria?" />
              </div>
            </Tilt>
          </div>

          <div style={{ marginTop: "32px", textAlign: "center" }}>
            <button 
              onClick={submitResearch} 
              disabled={isEvaluating || pendingFeedback}
              style={{ width: "250px", fontSize: "16px" }}
            >
              {isEvaluating && !pendingFeedback ? "Thinking..." : "Generate Architecture"}
            </button>
          </div>

          <AnimatePresence>
            {pendingFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="chatbox-card glass-panel" 
                style={{ marginTop: "24px", borderColor: "#fff" }}
              >
                <h3 style={{ marginBottom: "12px" }}>Human-in-the-Loop Feedback required!</h3>
                <p style={{ fontSize: "14px", marginBottom: "12px", color: "#ccc" }}>Please review the generated spec in the thinking pad. Is it satisfactory?</p>
                <textarea 
                  rows={2} 
                  placeholder="If not, what needs to be changed?" 
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                />
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button onClick={() => submitFeedback(false)} disabled={isEvaluating || !feedbackMsg} style={{ flex: 1, background: "transparent", border: "1px solid #fff", color: "#fff" }}>
                    Iterate Request
                  </button>
                  <button onClick={() => submitFeedback(true)} disabled={isEvaluating} style={{ flex: 1 }}>
                    Approve Spec
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* Right: Thinking Scratchpad */}
        <motion.div 
          className="scratchpad glass-panel"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiCommand /> Thinking Process
          </h3>
          
          <div style={{ flex: 1 }}>
            {logs.map((log, i) => (
              <div key={i} className="log-entry">&gt; {log}</div>
            ))}
            
            {isEvaluating && <div className="log-entry pulse">&gt; Processing...</div>}
          </div>

          {currentSpec && (
            <div className="spec-container glass-panel" style={{ marginTop: "16px" }}>
              <h4 style={{ marginBottom: "8px", color: "white" }}>Current Specification</h4>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <pre>{JSON.stringify(currentSpec, null, 2)}</pre>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </>
  );
}
