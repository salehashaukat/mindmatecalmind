"use client";

import { useState } from "react";

/* ---------- TYPES ---------- */
type Sender = "user" | "calmind";

type Message = {
  sender: Sender;
  text: string;
};

/* ---------- COMPONENT ---------- */
export default function Page() {
  const [step, setStep] = useState<"email" | "name" | "chat">("email");
  const [email, setEmail] = useState("");
  const [companion, setCompanion] = useState("Calmind");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      sender: "user",
      text: input,
    };

    const updatedMessages: Message[] = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          messages: [
            {
              role: "system",
              content:
                "You are a calm, gentle companion. Respond briefly. Use poetic or literary comfort. No medical advice. Sound human.",
            },
            ...updatedMessages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          ],
        }),
      });

      const data = await res.json();

      const calmindReply: Message = {
        sender: "calmind",
        text: data.text,
      };

      setMessages((prev) => [...prev, calmindReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "calmind",
          text: "I’m still here. Even silence counts sometimes.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  /* ---------- STEP 1 : EMAIL ---------- */
  if (step === "email") {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Calmind 💜</h1>
        <p style={styles.subtitle}>A quiet place for heavy thoughts.</p>

        <input
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => email && setStep("name")}
        >
          Continue
        </button>
      </div>
    );
  }

  /* ---------- STEP 2 : COMPANION NAME ---------- */
  if (step === "name") {
    return (
      <div style={styles.container}>
        <p style={styles.subtitle}>
          What would you like to call your companion?
          <br />
          Something gentle. Something yours.
        </p>

        <input
          style={styles.input}
          value={companion}
          onChange={(e) => setCompanion(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => setStep("chat")}
        >
          Begin
        </button>
      </div>
    );
  }

  /* ---------- CHAT ---------- */
  return (
    <div style={styles.chatContainer}>
      <header style={styles.header}>{companion} 💜</header>

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

        {typing && (
          <div style={styles.calmindBubble}>…</div>
        )}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          placeholder="Say something…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.primaryButton} onClick={sendMessage}>
          Send
        </button>
      </div>

      <footer style={styles.footer}>
        Calmind is not a replacement for human or medical care.
      </footer>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#1f0033",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 1.6,
  },
  chatContainer: {
    minHeight: "100vh",
    background: "#1f0033",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 12,
  },
  header: {
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 8,
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "80%",
    lineHeight: 1.5,
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
    marginTop: 10,
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
  footer: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginTop: 6,
  },
};
