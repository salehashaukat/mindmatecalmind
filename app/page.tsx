"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Send message to AI
  const sendMessage = async () => {
    if (!input) return;
    const userMessage = input;
    setMessages([...messages, { from: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { from: "ai", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "ai", text: "Error: Could not get response." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
        <h2>
          Please <a href="/login" style={{ color: "#4CAF50" }}>login</a> to access Calmind
        </h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Calmind</h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          minHeight: "400px",
          marginBottom: "10px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: "5px 0", color: msg.from === "ai" ? "#0070f3" : "#000" }}>
            <strong>{msg.from === "ai" ? "Calmind: " : "You: "}</strong>{msg.text}
          </div>
        ))}
        {loading && <div style={{ color: "#0070f3" }}>Calmind is typing...</div>}
      </div>

      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          onKeyDown={(e) => { if(e.key === "Enter") sendMessage(); }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            marginLeft: "5px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#555", textAlign: "center" }}>
        Calmind is not a replacement for human connection and does not provide medical advice.
      </div>
    </div>
  );
}


