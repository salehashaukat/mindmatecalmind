import { NextResponse } from "next/server";

type RequestBody = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
};

export async function POST(req: Request) {
  try {
    const { messages }: RequestBody = await req.json();
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ text: "OpenAI API key not set." }, { status: 500 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 100, // short, punchy
      }),
    });

    const data = await res.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Oops! I have no response.";

    return NextResponse.json({ text: aiMessage });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ text: "Something went wrong." }, { status: 500 });
  }
}






