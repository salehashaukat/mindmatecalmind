import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = body.messages || [];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return NextResponse.json({ text: "Oops! Something went wrong." });
    }

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "Hmm, I have no words!";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({ text: "Oops! Something went wrong." });
  }
}

