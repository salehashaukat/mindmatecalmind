import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // IMPORTANT for OpenAI

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 120,
    });

    return NextResponse.json({
      text: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { text: "Something went quiet… I'm still here 💜" },
      { status: 500 }
    );
  }
}
