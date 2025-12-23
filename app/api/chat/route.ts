import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // SERVER ONLY
);

export async function POST(req: NextRequest) {
  try {
    const { email, messages } = await req.json();

    if (!email || !messages) {
      return NextResponse.json(
        { text: "Email or messages missing" },
        { status: 400 }
      );
    }

    // Save user messages
    const userMessages = messages.filter((m: any) => m.sender === "user");

    await supabase.from("messages").insert(
      userMessages.map((m: any) => ({
        email,
        sender: "user",
        text: m.text,
      }))
    );

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      max_tokens: 150,
    });

    const reply =
      completion.choices[0]?.message?.content || "…";

    // Save calmind reply
    await supabase.from("messages").insert({
      email,
      sender: "calmind",
      text: reply,
    });

    return NextResponse.json({ text: reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { text: "Server error" },
      { status: 500 }
    );
  }
}
