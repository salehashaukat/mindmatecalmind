"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Sender = "user" | "calmind";

type Message = {
  sender: Sender;
  text: string;
};

export default function Page() {
  const [step, setStep] = useState<"email" | "checkInbox" | "name" | "chat">("email");
  const [email, setEmail] = useState("");
  const [companion, setCompanion] = useState("Calmind");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [info, setInfo] = useState("");

  /* ---------- AUTH LISTENER (NEW) ---------- */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If the user clicks the magic link and returns, move them to the 'name' step
      if (event === "SIGNED_IN" && session) {
        setEmail(session.user?.email || "");
        setStep("name");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------- SEND MAGIC LINK ---------- */
  const sendMagicLink = async () => {
    setInfo("");
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        // This ensures the link sends them back to this exact page
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      }
    });
    if (error) {
      setInfo(`Error: ${error.message}`);
    } else {
      setStep("checkInbox");
      setInfo("Check your inbox! A magic link has been sent.");
    }
  };

  /* ---------- SAVE PROFILE ---------- */
  const saveProfile = async () => {
    if (!email) return;

    await supabase.from("profiles").upsert({
      email,
      calmind_name: companion,
    });
  };

  /* ---------- GREETING ---------- */
  useEffect(() => {
    if (step === "chat" && messages.length === 0) {
      setMessages([
        {
          sender: "calmind",
          text: `Hello! I’m ${companion} 💜.
I’m here to listen, to encourage, and remind you how important you are.
Even small moments matter. Let’s share them together.`,
        },
      ]);
      saveProfile();
    }
  }, [step]);

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    // Save USER message
    await supabase.from("messages").insert({
      email,
      sender: "user",
      text: input,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userMessage: input,
          history: updatedMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      const calmindReply: Message = {
        sender: "calmind",
        text: data.text,
      };

      setMessages([...updatedMessages, calmindReply]);

      // Save CALMIND message
      await supabase.from("messages").insert({
        email,
        sender: "calmind",
        text: data.text,
      });
    } catch {
      setMessages([
        ...messages,
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

        <button style={styles.primaryButton} onClick={sendMagicLink}>
          Send Magic Link
        </button>

        {info && <p style={{ opacity: 0.8, marginTop: 12 }}>{info}</p>}
      </div>
    );
  }

  /* ---------- STEP 1.5 : CHECK INBOX ---------- */
  if (step === "checkInbox") {
    return (
      <div style={styles.container}>
        <h2 style={{ textAlign: "center" }}>Check your inbox 📬</h2>
        <p style={styles.subtitle}>Click the magic link to continue. Once you click, return here.</p>
      </div>
    );
  }

  /* ---------- STEP 2 : NAME ---------- */
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

        <button style={styles.primaryButton} onClick={() => setStep("chat")}>
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

        {typing && <div style={styles.calmindBubble}>…</div>}
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

/* ---------- STYLES (KEEPING YOUR EXACT STYLES) ---------- */
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
  title: { fontSize: 34, fontWeight: 700, textAlign: "center" },
  subtitle: { textAlign: "center", opacity: 0.9, lineHeight: 1.6 },
  chatContainer: {
    minHeight: "100vh",
    background: "#1f0033",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 12,
  },
  header: { fontWeight: 600, textAlign: "center", marginBottom: 8 },
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
  userBubble: { alignSelf: "flex-end", background: "#ffffff", color: "#000" },
  calmindBubble: {
    alignSelf: "flex-start",
    background: "#5e2b97",
    color: "#fff",
  },
  inputRow: { display: "flex", gap: 8, marginTop: 10 },
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