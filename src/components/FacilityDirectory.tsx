import { useRef } from "react";
import type { Facility } from "../hooks/useFacilities";

// Filtering and acquisition remain owned by the page's full source inventory.
// This view only bounds the displayed rows; it never truncates the search pool.
export default function FacilityDirectory({
  query,
  onQueryChange,
  results,
  loading,
  partial,
  onChangeCategories,
  onSelect,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  results: Facility[];
  loading: boolean;
  partial: boolean;
  onChangeCategories: () => void;
  onSelect: (facility: Facility) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;
  return (
    <div className="facility-directory-panel">
      <div className="facility-directory-field">
        <label htmlFor="facility-name">Facility name</label>
        <input
          ref={input}
          id="facility-name"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search healthcare or school names"
          aria-describedby="facility-directory-help"
          autoComplete="off"
        />
      </div>
      <p id="facility-directory-help" className="facility-directory-help">
        Search within the selected map categories.
      </p>
      <p
        className="facility-directory-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {results.length.toLocaleString()}{" "}
        {results.length === 1 ? "match" : "matches"}
        {results.length > 50 ? " · First 50 shown" : ""}
        {loading
          ? " · Loading inventories…"
          : partial
            ? " · Partial source coverage"
            : ""}
      </p>
      {results.length > 0 ? (
        <ul
          className="facility-directory-results"
          aria-label="Facility results"
          key={query}
        >
          {results.slice(0, 50).map((facility) => (
            <li key={facility.id}>
              <button type="button" onClick={() => onSelect(facility)}>
                <strong>{facility.name}</strong>
                <span>
                  {facility.category} · Source status:{" "}
                  {facility.status || "Not supplied"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="facility-directory-empty">
          <strong>
            {loading ? "Waiting for source records" : "No matching facilities"}
          </strong>
          <p>
            {loading
              ? "Results will appear as the selected inventories load."
              : hasQuery
                ? "Try a shorter name or check the spelling."
                : "Check the map categories and source availability."}
          </p>
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                input.current?.focus();
              }}
            >
              Clear search
            </button>
          ) : (
            <button type="button" onClick={onChangeCategories}>
              Review map categories
            </button>
          )}
        </div>
      )}
    </div>
  );
}
