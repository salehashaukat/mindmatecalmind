"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Message = {
  sender: "user" | "calmind";
  text: string;
};

// Initialize Supabase client (public keys safe for client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [calmindName, setCalmindName] = useState("Calmind");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ---------------- ONBOARDING ---------------- */
  const handleOnboard = async () => {
    if (!email || !calmindName) return;

    // Save to localStorage
    localStorage.setItem("email", email);
    localStorage.setItem("calmindName", calmindName);

    // Insert or update user in Supabase
    const { data: userData } = await supabase
      .from("users")
      .upsert({ email, calmind_name: calmindName }, { onConflict: "email" })
      .select();

    // Load previous messages if any
    const { data: chatData } = await supabase
      .from("chats")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: true });

    if (chatData) {
      setMessages(
        chatData.map((c) => ({
          sender: c.sender === "user" ? "user" : "calmind", // ensures TypeScript type
          text: c.message,
        }))
      );
    }

    setHasOnboarded(true);
  };

  /* ---------------- LOAD LOCAL DATA ---------------- */
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

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!input.trim() || !email) return;

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
You are Calmind — kind, warm, quietly humorous.
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
      const calmindText = data.text;

      setTimeout(() => {
        const updated: Message[] = [...newMessages, { sender: "calmind", text: calmindText }];
        setMessages(updated);
        setIsTyping(false);

        // Save messages to Supabase
        updated.forEach(async (m) => {
          await supabase.from("chats").insert({
            user_email: email,
            sender: m.sender,
            message: m.text,
          });
        });
      }, 1200);
    } catch {
      setMessages((prev) => [...prev, { sender: "calmind", text: "I'm here. Try again 💜" }]);
      setIsTyping(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  if (!hasOnboarded) {
    return (
      <div style={styles.onboardContainer}>
        <h1 style={styles.title}>Calmind 💜</h1>
        <p style={styles.subtitle}>A quiet place for heavy thoughts.</p>

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

        <button style={styles.primaryButton} onClick={handleOnboard}>
          Enter Calmind
        </button>
      </div>
    );
  }

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
              ...(m.sender === "user" ? styles.userBubble : styles.calmindBubble),
            }}
          >
            {m.text}
          </div>
        ))}

        {isTyping && <div style={styles.calmindBubble}>…</div>}
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
          <input style={styles.input} value={calmindName} onChange={(e) => setCalmindName(e.target.value)} />
          <button style={styles.secondaryButton} onClick={() => setMessages([])}>
            Clear chat
          </button>
        </div>
      )}

      <footer style={styles.footer}>
        Calmind is not a replacement for human or medical care.
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
  title: { fontSize: 32, fontWeight: 700, textAlign: "center" },
  subtitle: { textAlign: "center", opacity: 0.9 },
  header: { display: "flex", justifyContent: "space-between", fontWeight: 600, marginBottom: 8 },
  chatBox: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 },
  bubble: { padding: "10px 14px", borderRadius: 16, maxWidth: "80%" },
  userBubble: { alignSelf: "flex-end", background: "#ffffff", color: "#000" },
  calmindBubble: { alignSelf: "flex-start", background: "#5e2b97", color: "#fff" },
  inputRow: { display: "flex", gap: 8, marginTop: 8 },
  input: { flex: 1, padding: 10, borderRadius: 8, border: "none", outline: "none" },
  primaryButton: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
  secondaryButton: { background: "#444", color: "#fff", border: "none", borderRadius: 6, padding: "8px 12px" },
  settingsBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer" },
  settings: { background: "#2e004f", padding: 12, borderRadius: 8, marginTop: 8 },
  footer: { textAlign: "center", fontSize: 12, opacity: 0.7, marginTop: 6 },
};
