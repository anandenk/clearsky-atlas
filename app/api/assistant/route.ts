import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  ThinkingLevel,
} from "@google/genai";
import { createToolkit, toolDeclarations } from "../../../src/assistant/tools";
import { runAssistant, systemInstruction } from "../../../src/assistant/engine";
import {
  parseAssistantInput,
  readAssistantBody,
} from "../../../src/assistant/validation";
import { assistantFailure } from "../../../src/assistant/errors";
import { ContractError } from "../../../src/contracts/observations";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
let active = 0;
export async function POST(req: Request) {
  try {
    const input = parseAssistantInput(await readAssistantBody(req));
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey?.trim())
      throw new ContractError(
        503,
        "gemini-key-missing",
        "Ask ClearSky needs GEMINI_API_KEY in .env.local. Address search and atlas tools are still available.",
      );
    if (active >= 2)
      throw new ContractError(
        429,
        "assistant-busy",
        "Ask ClearSky is handling other questions. Please try again shortly.",
      );
    active++;
    try {
      const signal = AbortSignal.any([req.signal, AbortSignal.timeout(45000)]);
      const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } },
      });
      const toolkit = createToolkit(
        input.locations,
        signal,
        input.discoveryProfile,
        input.mapBounds,
        input.message,
      );
      const result = await runAssistant(input, {
        ...toolkit,
        model,
        signal,
        generate: (contents, abortSignal) =>
          client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: toolDeclarations }],
              toolConfig: {
                functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
              },
              temperature: 0.2,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              abortSignal,
            },
          }),
      });
      return Response.json(result, { headers });
    } finally {
      active--;
    }
  } catch (error) {
    // Provider exceptions may contain submitted content. Never log or return raw errors.
    const failure = assistantFailure(error, req.signal.aborted);
    return Response.json(failure.body, { status: failure.status, headers });
  }
}
