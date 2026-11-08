import { discovery } from "../../../src/discovery";
import { readAssistantBody } from "../../../src/assistant/validation";
import { contractFailure } from "../../../src/contracts/http";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    return Response.json(discovery(await readAssistantBody(req)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return contractFailure(error);
  }
}
