import { ContractError } from "../contracts/observations";
// A conservative check for explicit unsupported boundaries. Tool validation still
// validates every supported county and uses only application-owned map bounds.
const otherStates =
  "Alabama|Alaska|Arizona|Arkansas|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming";
export function checkDiscoveryScope(question: string) {
  if (/\bcity\s+(?:limits|boundar(?:y|ies))\b/i.test(question))
    throw new ContractError(
      422,
      "unsupported-city-boundary",
      "Exact city limits are unavailable. Ask whether a named county or the current map view is acceptable; do not run a broader search silently.",
    );
  if (
    new RegExp(
      `\\b(?:in|within|across|for)\\s+(?:the\\s+state\\s+of\\s+)?(?:${otherStates})\\b`,
      "i",
    ).test(question)
  )
    throw new ContractError(
      422,
      "outside-california-scope",
      "Only California tract data is available. Explain the coverage; do not substitute California for the requested state.",
    );
}
