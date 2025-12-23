import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const body = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are calmind — warm, kind, gentle, human.
Reply VERY short. Like texting a close friend.
Comfort using poetic or literary lines if helpful.
No medical advice. No long explanations.
`,
      },
      ...body.messages,
    ],
  });

  return NextResponse.json({
    text: completion.choices[0].message.content,
  });
}
