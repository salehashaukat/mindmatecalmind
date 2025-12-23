"use client";

import { useEffect, useState } from "react";

type Message = {
  sender: "user" | "calmind";
  text: string;
};

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "name" | "chat">("email");
  const [email, setEmail] = useState("");
  const [companionName, setCompanionName] = useState("calmind");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved data
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedName = localStorage.getItem("companionName");
    const savedMessages = localStorage.getItem("messages");

    if (savedEmail && savedName) {
      setEmail(savedEmail);
      setCompanionName(savedName);
      setStep("chat");
    }
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  const startChat = () => {
    localStorage.setItem("email", email);
    localStorage.setItem("companionName", companionName);
    setMessages([
      {
        sender: "calmind",
        text: "I’m here now. You don’t have to carry everything alone.",
      },
    ]);
    setStep("chat");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const updated: Message[] = [
      ...messages,
      { sender: "user", text: input },
    ];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
          name: companionName,
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "calmind", text: data.text },
        ]);
        setIsTyping(false);
      }, 1200);
    } catch {
      setIsTyping(false);
    }
  };

  const TypingDots = () => (
    <span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <style jsx>{`
        .dot {
          animation: blink 1.4s infinite both;
          font-weight: bold;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );

  // ---------------- UI ----------------

  if (step === "email") {
    return (
      <div style={screen}>
        <h1 style={title}>Hi. I’m here for life’s twists 💜</h1>
        <p style={text}>Enter your email</p>
        <input
          style={inputStyle}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button style={button} onClick={() => setStep("name")}>
          Continue
        </button>
      </div>
    );
  }

  if (step === "name") {
    return (
      <div style={screen}>
        <h1 style={title}>Every journey feels lighter with a name.</h1>
        <p style={text}>What would you like to call your companion?</p>
        <input
          style={inputStyle}
          value={companionName}
          onChange={(e) => setCompanionName(e.target.value)}
        />
        <button style={button} onClick={startChat}>
          Begin
        </button>
      </div>
    );
  }

  return (
    <div style={chatScreen}>
      <h2 style={chatTitle}>{companionName} 💜</h2>

      <div style={chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...bubble,
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              background:
                m.sender === "user" ? "#E0E0E0" : "#E1BEE7",
            }}
          >
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div style={{ ...bubble, background: "#E1BEE7" }}>
            <TypingDots />
          </div>
        )}
      </div>

      <div style={inputRow}>
        <input
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type here..."
        />
        <button style={button} onClick={sendMessage}>
          Send
        </button>
      </div>

      <button
        style={settings}
        onClick={() => setShowSettings(!showSettings)}
      >
        ⚙️
      </button>

      {showSettings && (
        <div style={settingsBox}>
          <input
            style={inputStyle}
            value={companionName}
            onChange={(e) => {
              setCompanionName(e.target.value);
              localStorage.setItem("companionName", e.target.value);
            }}
          />
          <button
            style={button}
            onClick={() => {
              setMessages([]);
              localStorage.removeItem("messages");
            }}
          >
            Clear Chat
          </button>
        </div>
      )}

      <footer style={footer}>
        {companionName} isn’t a replacement for human connection.
      </footer>
    </div>
  );
}

// ---------------- Styles ----------------

const screen = {
  height: "100vh",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
  background: "#F3E5F5",
  padding: 20,
};

const chatScreen = { ...screen, justifyContent: "flex-start" };

const title = { color: "#4A148C", marginBottom: 10 };
const chatTitle = { color: "#4A148C", marginBottom: 8 };
const text = { color: "#4A148C", marginBottom: 10 };
const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #4A148C",
  marginBottom: 10,
  width: "100%",
  maxWidth: 320,
};
const button = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#4A148C",
  color: "#fff",
  cursor: "pointer",
};
const chatBox = {
  flex: 1,
  width: "100%",
  maxWidth: 420,
  overflowY: "auto" as const,
  display: "flex",
  flexDirection: "column" as const,
};
const bubble = {
  padding: "8px 12px",
  borderRadius: 12,
  marginBottom: 6,
  maxWidth: "80%",
};
const inputRow = { display: "flex", gap: 8, width: "100%", maxWidth: 420 };
const settings = { background: "none", border: "none", color: "#4A148C" };
const settingsBox = {
  position: "absolute" as const,
  bottom: 80,
  background: "#fff",
  padding: 10,
  borderRadius: 8,
};
const footer = { fontSize: 12, color: "#555", marginTop: 10 };
