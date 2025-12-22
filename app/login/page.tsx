"use client";

import { useEffect, useState } from "react";

type Message = {
  sender: "user" | "calmind";
  text: string;
};

export default function LoginPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [calmindName, setCalmindName] = useState("Calmind");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem("messages");
    const savedName = localStorage.getItem("calmindName");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedName) setCalmindName(savedName);
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("calmindName", calmindName);
  }, [messages, calmindName]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `
You are Calmind, a kind, warm, humorous AI companion. 
Always respond very short, like texting a friend. 
Use comforting literary lines, quotes, or poetic phrases when appropriate. 
Never give medical advice. 
Keep responses empathetic, casual, human-like, and concise.
              `,
            },
            ...newMessages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          ],
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "calmind", text: data.text },
        ]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1500);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "calmind", text: "Oops! Something went wrong." },
      ]);
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);
  const deleteChat = () => {
    setMessages([]);
    setCalmindName("Calmind");
    localStorage.removeItem("messages");
    localStorage.removeItem("calmindName");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const TypingDots = () => (
    <span style={{ display: "inline-block" }}>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <style jsx>{`
        .dot { animation: blink 1.4s infinite both; margin-right: 2px; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
      `}</style>
    </span>
  );

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20, display: "flex", flexDirection: "column", height: "100vh" }}>
      <h1 style={{ color: "purple", textAlign: "center", marginBottom: 10 }}>
        {calmindName} 💜
      </h1>

      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 8, padding: 10, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "#e0e0e0" : "#d1c4e9", padding: "8px 12px", borderRadius: 12, marginBottom: 6, maxWidth: "80%", wordBreak: "break-word" }}>
            {msg.text}
          </div>
        ))}
        {isTyping && <div style={{ alignSelf: "flex-start", background: "#d1c4e9", padding: "8px 12px", borderRadius: 12, fontStyle: "italic" }}><TypingDots /></div>}
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type your message..." />
        <button style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 8, background: "purple", color: "#fff", border: "none" }} onClick={sendMessage}>Send</button>
      </div>

      <div style={{ marginTop: 10, textAlign: "right", position: "relative" }}>
        <button style={{ background: "transparent", border: "none", color: "purple", cursor: "pointer" }} onClick={() => setShowSettings(!showSettings)}>⚙ Settings</button>

        {showSettings && (
          <div style={{ position: "absolute", right: 0, background: "#f9f9f9", border: "1px solid #ccc", borderRadius: 8, padding: 10, marginTop: 5, zIndex: 10 }}>
            <div style={{ marginBottom: 6 }}>
              <label>Name: </label>
              <input value={calmindName} onChange={(e) => setCalmindName(e.target.value)} style={{ padding: 4, borderRadius: 4, border: "1px solid #ccc" }} />
            </div>
            <button style={{ marginRight: 6, padding: "4px 8px", borderRadius: 4 }} onClick={clearChat}>Clear Chat</button>
            <button style={{ padding: "4px 8px", borderRadius: 4 }} onClick={deleteChat}>Delete Chat</button>
          </div>
        )}
      </div>

      <footer style={{ marginTop: 20, fontSize: 12, color: "#888", textAlign: "center" }}>
        {calmindName} is not a replacement for human connection or a medical professional.
      </footer>
    </div>
  );
}
