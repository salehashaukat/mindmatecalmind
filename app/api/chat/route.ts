import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Supabase (server only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, userMessage, history } = await req.json();

    if (!email || !userMessage) {
      return NextResponse.json(
        { text: "Email or message missing." },
        { status: 400 }
      );
    }

    // 1️⃣ Save USER message
    await supabase.from("messages").insert({
      email,
      sender: "user",
      text: userMessage,
    });

    // 2️⃣ OpenAI response with enhanced personality
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Calmind — a warm, poetic, comforting companion.
Always acknowledge the user's feelings.
Encourage them gently, highlight their importance, and remind them human connection matters.
Use metaphors, literary or nature imagery. Keep replies short, empathetic, and human-like.
Never give medical advice.
          `,
        },
        ...history,
        { role: "user", content: userMessage },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "…";

    // 3️⃣ Save CALMIND message
    await supabase.from("messages").insert({
      email,
      sender: "calmind",
      text: reply,
    });

    return NextResponse.json({ text: reply });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { text: "Something went wrong." },
      { status: 500 }
    );
  }
}
