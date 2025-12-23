import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // server-only secret key
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, email } = body;

    if (!messages || !Array.isArray(messages) || !email) {
      return NextResponse.json(
        { text: "Email or messages missing." },
        { status: 400 }
      );
    }

    // 1️⃣ Save user messages to Supabase
    await supabase.from("user_chats").insert(
      messages.map((m: any) => ({
        email,
        sender: m.sender,
        text: m.text,
        created_at: new Date(),
      }))
    );

    // 2️⃣ Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 150,
      temperature: 0.8,
    });

    const responseText = completion.choices?.[0]?.message?.content || "…";

    // 3️⃣ Save Calmind response to Supabase
    await supabase.from("user_chats").insert({
      email,
      sender: "calmind",
      text: responseText,
      created_at: new Date(),
    });

    return NextResponse.json({ text: responseText });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { text: "Oops! Something went wrong." },
      { status: 500 }
    );
  }
}
