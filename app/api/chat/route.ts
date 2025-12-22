import { NextResponse } from "next/server";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: Message[] };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // from .env.local
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are Calmind, a kind, warm, humorous AI companion. 
Always respond very short, like texting a friend. 
Use comforting literary lines, quotes, or poetic phrases when appropriate. 
Never give medical advice. 
Keep responses empathetic, casual, human-like, and concise.
            `,
          },
          ...messages,
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ text: `OpenAI API Error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Hmm, I don't know what to say.";

    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ text: "Oops! Something went wrong on the server." }, { status: 500 });
  }
}
