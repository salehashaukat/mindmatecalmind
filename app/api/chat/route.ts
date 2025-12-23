import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Supabase (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, userMessage, history } = await req.json();
    if (!email || !userMessage) return NextResponse.json({ text: "Email or message missing." }, { status: 400 });

    // 1️⃣ Ensure profile exists
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, calmind_name")
      .eq("email", email)
      .limit(1);

    let profileId: string;

    if (profiles?.[0]) {
      profileId = profiles[0].id;
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .insert({ email, calmind_name: "Calmind" })
        .select("id")
        .single();
      profileId = data!.id;
    }

    // 2️⃣ Insert USER message
    await supabase.from("messages").insert({
      profile_id: profileId,
      sender: "user",
      text: userMessage,
    });

    // 3️⃣ OpenAI reply
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are calmind — warm, poetic, gentle. Short replies. No medical advice." },
        ...history,
        { role: "user", content: userMessage },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "…";

    // 4️⃣ Insert CALMIND message
    await supabase.from("messages").insert({
      profile_id: profileId,
      sender: "calmind",
      text: reply,
    });

    return NextResponse.json({ text: reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ text: "Something went wrong." }, { status: 500 });
  }
}
