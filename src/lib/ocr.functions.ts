import { createServerFn } from "@tanstack/react-start";

interface MeterPair { a: string; b: string }
interface OcrResult {
  tops: Record<string, MeterPair>;
  raw?: string;
}

/**
 * Extract A/B meter readings per fuel from a base64 image using Lovable AI (Gemini vision).
 * Returns 7-digit zero-padded strings.
 */
export const extractMeterFromImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string }) => {
    if (!d?.imageDataUrl || typeof d.imageDataUrl !== "string") throw new Error("imageDataUrl required");
    if (d.imageDataUrl.length > 8_000_000) throw new Error("Image too large");
    return d;
  })
  .handler(async ({ data }): Promise<OcrResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway key missing");

    const prompt = `Bu yoqilg'i shahobchasi (АЗС) ertalabki sanoq qog'ozi/displeyi rasm.
Har bir yoqilg'i (Ai-92 K4, Ai-92 K5, Ai-95, Ai-98) uchun A tomon va B tomon hisoblagich (счётчик) qiymatini topib chiqar.
Faqat raqamlar. Agar mavjud bo'lmasa null qaytar.
JSON shaklida qaytar:
{"92k4":{"a":"0000000","b":"0000000"},"92k5":{"a":null,"b":null},"95":{"a":null,"b":null},"98":{"a":null,"b":null}}
Hech qanday izoh yozma, faqat JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const norm = (v: unknown): string => {
      if (v == null) return "";
      const digits = String(v).replace(/\D/g, "");
      if (!digits) return "";
      return digits.slice(-7).padStart(7, "0");
    };

    const ids = ["92k4", "92k5", "95", "98"] as const;
    const tops: Record<string, MeterPair> = {};
    for (const id of ids) {
      const p = parsed?.[id] ?? {};
      tops[id] = { a: norm(p?.a), b: norm(p?.b) };
    }
    return { tops, raw: text };
  });
