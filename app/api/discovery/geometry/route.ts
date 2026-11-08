import { displayTracts } from "../../../../src/data";
import {
  validateTractId,
  ContractError,
} from "../../../../src/contracts/observations";
import { contractFailure } from "../../../../src/contracts/http";
export function GET(req: Request) {
  try {
    const ids = (new URL(req.url).searchParams.get("tractIds") ?? "").split(
      ",",
    );
    if (ids.length > 5 || new Set(ids).size !== ids.length)
      throw new ContractError(
        400,
        "invalid-discovery-tracts",
        "Supply up to five unique tract IDs.",
      );
    ids.forEach(validateTractId);
    return Response.json(displayTracts(ids), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return contractFailure(error);
  }
}
