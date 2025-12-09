import { streamText, convertToModelMessages } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: "openai/gpt-5-mini",
    prompt,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
