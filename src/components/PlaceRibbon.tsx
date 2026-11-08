"use client";

import { useRef, type CSSProperties } from "react";
import type { Place } from "../frontend/provider";
import { placeColors } from "../map-theme";
import { Icon } from "./Icon";
import "../styles/place-ribbon.css";

type PlaceRibbonProps = {
  places: Place[];
  active: string;
  onFocus: (id: string) => void;
  onOverview: () => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onAddExample?: () => void;
};

export default function PlaceRibbon({
  places,
  active,
  onFocus,
  onOverview,
  onRemove,
  onAdd,
  onAddExample,
}: PlaceRibbonProps) {
  const overviewButton = useRef<HTMLButtonElement>(null);
  return (
    <div className="place-ribbon" role="group" aria-label="Your places">
      <button
        ref={overviewButton}
        type="button"
        className={`all-places ${active === "all" ? "is-active" : ""}`}
        onClick={onOverview}
      >
        <Icon name="layers" size={17} />
        <span>{places.length > 1 ? "Together" : "Overview"}</span>
      </button>
      {places.map((p) => {
        const letter = String.fromCharCode(64 + Number(p.id));
        return (
          <div
            className={`place-chip ${active === p.id ? "is-active" : ""}`}
            key={p.id}
            data-place-id={p.id}
            style={{
              "--place": placeColors[(Number(p.id) - 1) % placeColors.length],
            } as CSSProperties}
          >
            <button
              type="button"
              className="place-focus"
              title={p.selection.label}
              aria-label={`Focus place ${letter}: ${p.selection.label}`}
              onClick={() => onFocus(p.id)}
            >
              <b>{letter}</b>
              <span>{p.selection.place}</span>
            </button>
            <button
              type="button"
              className="place-remove"
              title={`Remove ${p.selection.label}`}
              aria-label={`Remove place ${letter}: ${p.selection.label}`}
              onClick={() => {
                // Restore keyboard focus without invoking a place/camera action.
                // The parent restores the search input when the ribbon empties.
                if (places.length > 1) overviewButton.current?.focus();
                onRemove(p.id);
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        );
      })}
      <button type="button" className="add-place" onClick={onAdd}>
        <Icon name="plus" size={17} />
        Add a place
      </button>
      {onAddExample && (
        <button type="button" className="preview-add" onClick={onAddExample}>
          Add example
        </button>
      )}
    </div>
  );
}
