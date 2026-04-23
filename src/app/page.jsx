"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TorusKnot } from "@react-three/drei";
import Tilt from "react-parallax-tilt";
import { FiSearch, FiMessageSquare, FiCommand, FiRefreshCw, FiCopy, FiCheck, FiX, FiMaximize2 } from "react-icons/fi";

const API_URL = "/api";

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
  const [streamingTokens, setStreamingTokens] = useState("");
  const [currentSpec, setCurrentSpec] = useState(null);
  const [pendingFeedback, setPendingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [showFullSpec, setShowFullSpec] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
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

  const processStream = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === "token") {
              setStreamingTokens((prev) => prev + data.content);
            } else if (data.type === "log") {
              setLogs((prev) => [...prev, data.content]);
              setStreamingTokens(""); // Clear tokens on new log
            } else if (data.type === "final") {
              setThreadId(data.thread_id || threadId);
              setLogs(data.think_log || []);
              setStreamingTokens("");
              setCurrentSpec(data.spec);
              
              if (data.status === "pending_feedback") {
                setPendingFeedback(true);
              } else if (data.status === "completed") {
                setPendingFeedback(false);
                setLogs((prev) => [...prev, "Process completed!"]);
                saveHistory({
                  id: data.thread_id || threadId,
                  timestamp: new Date().toISOString(),
                  title: formData.problem_statement.substring(0, 30) + "...",
                  spec: data.spec
                });
              }
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    }
  };

  const submitResearch = async () => {
    setIsEvaluating(true);
    setLogs(["Submitting research payload..."]);
    setStreamingTokens("");
    try {
      const res = await fetch(`${API_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      await processStream(res);
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
    setStreamingTokens("");
    
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          is_satisfactory: isSatisfactory,
          feedback: isSatisfactory ? null : feedbackMsg
        })
      });
      await processStream(res);
      setFeedbackMsg("");
    } catch (err) {
      setLogs((prev) => [...prev, `ERROR: ${err.message}`]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopy = () => {
    if (!currentSpec) return;
    const text = JSON.stringify(currentSpec, null, 2);
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const startNew = () => {
    setFormData({
      problem_statement: "", solution: "", implementation: "",
      features: "", constraints: "", expectations: ""
    });
    setThreadId(null);
    setLogs([]);
    setStreamingTokens("");
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
                <div key={i} className="chatbox-card glass-panel" style={{ padding: "12px", cursor: "pointer" }} onClick={() => { setCurrentSpec(h.spec); setShowFullSpec(true); }}>
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
          
          <div style={{ flex: 1, maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column-reverse" }}>
            {streamingTokens && (
              <div className="log-entry" style={{ color: "#00ffcc", fontStyle: "italic", borderLeft: "2px solid #00ffcc", paddingLeft: "8px", marginBottom: "8px" }}>
                &gt; {streamingTokens}
              </div>
            )}
            {logs.slice().reverse().map((log, i) => (
              <div key={i} className="log-entry">&gt; {log}</div>
            ))}
            
            {isEvaluating && !streamingTokens && <div className="log-entry pulse">&gt; Processing...</div>}
          </div>

          {currentSpec && (
            <div className="spec-container glass-panel" style={{ marginTop: "16px", cursor: "pointer" }} onClick={() => setShowFullSpec(true)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ color: "white" }}>Current Specification</h4>
                <FiMaximize2 style={{ color: "#888" }} />
              </div>
              <div style={{ maxHeight: "150px", overflow: "hidden", position: "relative" }}>
                <pre style={{ fontSize: "10px", opacity: 0.7 }}>{JSON.stringify(currentSpec, null, 2)}</pre>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "linear-gradient(transparent, rgba(25,25,25,0.9))" }}></div>
              </div>
              <p style={{ fontSize: "10px", textAlign: "center", marginTop: "4px", color: "#666" }}>Click to expand and copy</p>
            </div>
          )}

        </motion.div>
      </div>

      {/* Full Spec Modal */}
      <AnimatePresence>
        {showFullSpec && currentSpec && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>Technical Specification</h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleCopy} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                    {copySuccess ? <FiCheck /> : <FiCopy />} {copySuccess ? "Copied!" : "Copy JSON"}
                  </button>
                  <button onClick={() => setShowFullSpec(false)} style={{ background: "rgba(255,25,25,0.3)", color: "#fff", padding: "12px" }}>
                    <FiX />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <div className="spec-grid">
                  {Object.entries(currentSpec).map(([key, value]) => (
                    <div key={key} className="spec-section">
                      <h3>{key.replace(/_/g, ' ').toUpperCase()}</h3>
                      <div className="spec-value">
                        {Array.isArray(value) ? (
                          <ul>
                            {value.map((item, idx) => <li key={idx}>{item}</li>)}
                          </ul>
                        ) : (
                          <p>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="raw-json">
                  <h3>Raw JSON</h3>
                  <pre>{JSON.stringify(currentSpec, null, 2)}</pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .modal-content {
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #111 !important;
          border: 1px solid #444 !important;
        }
        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .spec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }
        .spec-section h3 {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .spec-value {
          background: rgba(255,255,255,0.03);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #222;
        }
        .spec-value ul {
          list-style: none;
        }
        .spec-value li {
          margin-bottom: 8px;
          padding-left: 16px;
          position: relative;
        }
        .spec-value li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #00ffcc;
        }
        .raw-json {
          margin-top: 40px;
          border-top: 1px solid #333;
          padding-top: 24px;
        }
        .raw-json h3 {
          font-size: 12px;
          color: #888;
          margin-bottom: 16px;
        }
        .raw-json pre {
          background: #000;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          color: #00ffcc;
          overflow-x: auto;
        }
      `}</style>
    </>
  );
}
