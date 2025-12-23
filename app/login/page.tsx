"use client";

import { useEffect, useState } from "react";

type Message = {
  sender: "user" | "calmind";
  text: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const [calmindName, setCalmindName] = useState("calmind");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved data
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedName = localStorage.getItem("calmindName");
    const savedMessages = localStorage.getItem("messages");

    if (savedEmail && savedName) {
      setEmail(savedEmail);
      setCalmindName(savedName);
      setHasOnboarded(true);
    }
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    if (hasOnboarded) {
      localStorage.setItem("messages", JSON.stringify(messages));
      localStorage.setItem("calmindName", calmindName);
    }
  }, [messages, calmindName, hasOnboarded]);

  /* ---------------- ONBOARD ---------------- */

  if (!hasOnboarded) {
    return (
      <div style={styles.onboardContainer}>
        <h1 style={styles.title}>calmind 💜</h1>

        <p style={styles.subtitle}>
          A quiet place for heavy thoughts.
        </p>

        <input
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Name your companion of life’s twists"
          value={calmindName}
          onChange={(e) => setCalmindName(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => {
            if (!email || !calmindName) return;
            localStorage.setItem("email", email);
            localStorage.setItem("calmindName", calmindName);
            setHasOnboarded(true);
          }}
        >
          Enter calmind
        </button>
      </div>
    );
  }

  /* ---------------- CHAT ---------------- */

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { sender: "user", text: input },
    ];

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
You are calmind — kind, warm, quietly humorous.
Respond briefly like a caring friend.
Use poetic or literary comfort when helpful.
No medical advice. Keep it human.
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
      }, 1200);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "calmind", text: "I'm here. Try again 💜" },
      ]);
      setIsTyping(false);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <header style={styles.header}>
        <span>{calmindName} 💜</span>
        <button style={styles.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
          ⚙
        </button>
      </header>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.sender === "user"
                ? styles.userBubble
                : styles.calmindBubble),
            }}
          >
            {m.text}
          </div>
        ))}

        {isTyping && (
          <div style={styles.calmindBubble}>…</div>
        )}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something…"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.primaryButton} onClick={sendMessage}>
          Send
        </button>
      </div>

      {showSettings && (
        <div style={styles.settings}>
          <input
            style={styles.input}
            value={calmindName}
            onChange={(e) => setCalmindName(e.target.value)}
          />
          <button
            style={styles.secondaryButton}
            onClick={() => setMessages([])}
          >
            Clear chat
          </button>
        </div>
      )}

      <footer style={styles.footer}>
        calmind is not a replacement for human or medical care.
      </footer>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: Record<string, React.CSSProperties> = {
  onboardContainer: {
    minHeight: "100vh",
    background: "#2e004f",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  chatContainer: {
    minHeight: "100vh",
    background: "#1f0033",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.9,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
    marginBottom: 8,
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#ffffff",
    color: "#000",
  },
  calmindBubble: {
    alignSelf: "flex-start",
    background: "#5e2b97",
    color: "#fff",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
    outline: "none",
  },
  primaryButton: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 12px",
  },
  settingsBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  settings: {
    background: "#2e004f",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.7,
    marginTop: 6,
  },
};
