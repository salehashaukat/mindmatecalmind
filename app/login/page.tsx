"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Sender = "user" | "calmind";
type Message = { sender: Sender; text: string; };

export default function Page() {
  const [step, setStep] = useState<"email" | "name" | "chat">("email");
  const [email, setEmail] = useState("");
  const [companion, setCompanion] = useState("Calmind");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [info, setInfo] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleSimpleLogin = async () => {
    setInfo("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setInfo("I'll need your email to keep our journey safe.");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({ email: trimmedEmail }, { onConflict: 'email' });
    if (error) { setInfo("I'm having a little trouble connecting."); } 
    else { setStep("name"); }
  };

  const saveProfile = async () => {
    if (!email) return;
    await supabase.from("profiles").upsert({ email, calmind_name: companion }, { onConflict: 'email' });
  };

  /* ---------- SETTINGS FUNCTIONS ---------- */
  const clearChatLocal = () => {
    setMessages([]);
    setShowSettings(false);
  };

  const deleteChatHistory = async () => {
    if (!confirm("Are you sure you want to delete your entire history from the database?")) return;
    const { error } = await supabase.from("messages").delete().eq("email", email);
    if (!error) {
      setMessages([]);
      setShowSettings(false);
      alert("History deleted.");
    }
  };

  /* ---------- GREETING ---------- */
  useEffect(() => {
    if (step === "chat" && messages.length === 0) {
      setMessages([{
        sender: "calmind",
        text: `I'm so glad you made it here. From now on, I am ${companion}, your companion through thick and thin. 💜`,
      }]);
      saveProfile();
    }
  }, [step]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);
    await supabase.from("messages").insert({ email, sender: "user", text: input });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userMessage: input, history: updatedMessages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant", content: m.text,
        }))}),
      });
      const data = await res.json();
      const calmindReply: Message = { sender: "calmind", text: data.text };
      setMessages([...updatedMessages, calmindReply]);
      await supabase.from("messages").insert({ email, sender: "calmind", text: data.text });
    } catch {
      setMessages([...messages, { sender: "calmind", text: "I'm right here. Take your time." }]);
    } finally { setTyping(false); }
  };

  if (step === "email") {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Calmind 💜</h1>
        <p style={styles.subtitle}>Take a deep breath. <br /> Enter your email to start.</p>
        <input style={styles.input} placeholder="Your email address..." value={email} onChange={(e) => setEmail(e.target.value)} />
        <button style={styles.primaryButton} onClick={handleSimpleLogin}>Step Inside</button>
        {info && <p style={{ opacity: 0.8, marginTop: 12, textAlign: 'center', color: '#ffb3b3' }}>{info}</p>}
      </div>
    );
  }

  if (step === "name") {
    return (
      <div style={styles.container}>
        <p style={styles.subtitle}>I want to be exactly who you need. <br /><strong>What should I call myself?</strong></p>
        <input style={styles.input} value={companion} onChange={(e) => setCompanion(e.target.value)} />
        <button style={styles.primaryButton} onClick={() => setStep("chat")}>Meet {companion}</button>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <header style={styles.header}>
        <div style={{ width: 40 }}></div> {/* spacer */}
        <span>{companion} 💜</span>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', width: 40 }}
        >
          ⚙️
        </button>
      </header>

      {showSettings && (
        <div style={styles.settingsDropdown}>
          <button style={styles.settingsBtn} onClick={() => { setStep("name"); setShowSettings(false); }}>✏️ Rename Companion</button>
          <button style={styles.settingsBtn} onClick={clearChatLocal}>🧹 Clear Screen</button>
          <button style={{...styles.settingsBtn, color: '#ff4d4d'}} onClick={deleteChatHistory}>🗑️ Delete History</button>
        </div>
      )}

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.bubble, ...(m.sender === "user" ? styles.userBubble : styles.calmindBubble) }}>
            {m.text}
          </div>
        ))}
        {typing && <div style={styles.calmindBubble}>…</div>}
      </div>

      <div style={styles.inputRow}>
        <input style={styles.input} value={input} placeholder="Share what's on your heart..." onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
        <button style={styles.primaryButton} onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#1f0033", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, gap: 14 },
  title: { fontSize: 34, fontWeight: 700, textAlign: "center" },
  subtitle: { textAlign: "center", opacity: 0.9, lineHeight: 1.6, fontSize: 18 },
  chatContainer: { minHeight: "100vh", background: "#1f0033", color: "#fff", display: "flex", flexDirection: "column", padding: 12, position: 'relative' },
  header: { fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 20 },
  settingsDropdown: { position: 'absolute', top: 50, right: 12, background: '#3b0066', borderRadius: 8, padding: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #5e2b97' },
  settingsBtn: { background: 'none', border: 'none', color: '#fff', textAlign: 'left', padding: '8px 12px', cursor: 'pointer', fontSize: 14 },
  chatBox: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" },
  bubble: { padding: "12px 16px", borderRadius: 18, maxWidth: "85%", lineHeight: 1.5 },
  userBubble: { alignSelf: "flex-end", background: "#ffffff", color: "#000", borderBottomRightRadius: 4 },
  calmindBubble: { alignSelf: "flex-start", background: "#5e2b97", color: "#fff", borderBottomLeftRadius: 4 },
  inputRow: { display: "flex", gap: 8, marginTop: 10, paddingBottom: 10 },
  input: { flex: 1, padding: 12, borderRadius: 10, border: "none", outline: "none", fontSize: 16 },
  primaryButton: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontWeight: 600, fontSize: 16 }
};