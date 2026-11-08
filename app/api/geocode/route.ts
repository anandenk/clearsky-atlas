import { NextRequest, NextResponse } from "next/server";
import { selection } from "../../../src/data";
import {
  AddressInputError,
  planAddressQueries,
} from "../../../src/contracts/address-input";
import {
  isCensusStreetMatch,
  resolveCensusAddress,
} from "../../../src/contracts/address-geocoding";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return reply(
        { error: "Send the address as JSON with an address field." },
        400,
      );
    }
    const plan = planAddressQueries(body?.address);
    const { matches, query, requests } = await resolveCensusAddress(
      plan,
      req.signal,
    );
    const interpretation = {
      normalizedAddress: plan.normalizedAddress,
      queryAddress: query.address,
      assumedCalifornia: plan.assumedCalifornia,
      adjustments: query.adjustments,
      requests,
    };
    if (!matches.length)
      return reply(
        {
          error:
            "No Census street-address match. Check the building number and street spelling; add the city or five-digit ZIP. Try removing a building name or unit. Census may not cover this address; a place name, PO box, intersection or map link is not a street address.",
          interpretation,
        },
        404,
      );
    const candidates = matches.map((m) => {
      if (!isCensusStreetMatch(m))
        return {
          error:
            "Census did not return a complete street-address range match. Check the numbered street address; no location was assigned.",
        };
      if (m.addressComponents.state.toUpperCase() !== "CA")
        return { error: "This address is outside California." };
      const censusTract = m.geographies?.["Census Tracts"]?.[0]?.GEOID;
      if (typeof censusTract !== "string" || !/^06\d{9}$/.test(censusTract))
        return {
          error:
            "Census did not supply a California 2020 tract for this address. No indicator was assigned; try again or use a verified example.",
        };
      try {
        const candidate = selection(
          m.matchedAddress,
          [m.coordinates.x, m.coordinates.y],
          false,
          censusTract,
        );
        const notes = [
          ...(plan.assumedCalifornia
            ? ["California assumed for this search."]
            : []),
          ...query.adjustments,
        ];
        return {
          ...candidate,
          precision: [candidate.precision, ...notes].join(" "),
          inputInterpretation: interpretation,
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
    return reply({ candidates, interpretation });
  } catch (error) {
    if (error instanceof AddressInputError)
      return reply({ error: error.message }, 400);
    return reply(
      {
        error:
          "Address lookup is unavailable or timed out. Try again, or use the cached example addresses.",
      },
      503,
    );
  }
}
