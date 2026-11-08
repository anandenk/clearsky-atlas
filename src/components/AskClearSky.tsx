"use client";
import { useEffect, useRef, useState } from "react";
import type { Selection } from "../domain";
import type { Place } from "../frontend/provider";
import type { AssistantResponse, EvidenceCard } from "../assistant/types";
import { AssistantNarrative } from "./AssistantNarrative";
import { Icon } from "./Icon";
import { DiscoveryProfileEditor, DiscoveryEvidence } from "./DiscoveryEvidence";
import type { DiscoveryProfile, DiscoveryResult } from "../contracts/discovery";
import "../styles/assistant.css";

const measurement = (n: number | null) =>
  n === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { maximumSignificantDigits: 5 }).format(n);
type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; response: AssistantResponse };
const candidateKey = (s: Selection) => `${s.label}/${s.coordinate.join(",")}`;

function Evidence({
  card,
  onConfirm,
  confirmed,
  disabled,
  onAccept,
  onExplore,
  bounds,
  insights,
}: {
  card: EvidenceCard;
  insights?: AssistantResponse["insights"];
  onConfirm: (s: Selection) => void;
  confirmed: Set<string>;
  disabled: boolean;
  onAccept: (profile: DiscoveryProfile) => void;
  onExplore: (candidate: DiscoveryResult["candidates"][number]) => void;
  bounds?: [number, number, number, number];
}) {
  if (card.kind === "profile")
    return (
      <DiscoveryProfileEditor
        profile={card.profile}
        bounds={bounds}
        onAccept={onAccept}
        disabled={disabled}
      />
    );
  if (card.kind === "discovery")
    return (
      <DiscoveryEvidence
        data={card.data}
        summaries={insights?.filter((i) => i.evidenceId === card.id)}
        onExplore={onExplore}
        disabled={disabled}
      />
    );
  if (card.kind === "candidates")
    return (
      <section className="ask-card" aria-label="Address matches">
        <h3>Confirm the Census match</h3>
        <p className="ask-muted">{card.query}</p>
        {card.errors.map((e, i) => (
          <p key={i} role="status">
            {e}
          </p>
        ))}
        {card.candidates.map((s) => (
          <div className="ask-candidate" key={candidateKey(s)}>
            <strong>{s.label}</strong>
            <p>{s.precision}</p>
            <button
              disabled={disabled || confirmed.has(candidateKey(s))}
              onClick={() => onConfirm(s)}
            >
              {confirmed.has(candidateKey(s))
                ? "Address confirmed"
                : "Confirm this address"}
            </button>
          </div>
        ))}
      </section>
    );
  if (card.kind === "definitions")
    return (
      <section className="ask-card" aria-label="Indicator definitions">
        {card.definitions.map((d) => (
          <div key={d.id}>
            <h3>{d.label}</h3>
            <p>{d.definition}</p>
            <p>
              {d.unit ?? "Unit unavailable"} ·{" "}
              {d.measurementPeriod ?? "Period unavailable"}
            </p>
            <a href={d.definitionSource} target="_blank" rel="noreferrer">
              Source definition
            </a>
          </div>
        ))}
      </section>
    );
  if (card.kind === "comparison")
    return (
      <section className="ask-card" aria-label="Verified comparison">
        <details className="ask-evidence-details">
          <summary>Comparison values & sources</summary>
          <span className="ask-eyebrow">
            Tract evidence · {card.data.datasetVersion}
          </span>
          {card.data.rows.map((row) => (
            <div className="ask-measure" key={row.indicatorId}>
              <h3>{row.label}</h3>
              <p className="ask-muted">
                {row.measurementPeriod ?? "Period unavailable"} ·{" "}
                {row.unit ?? "Unit unavailable"}
              </p>
              <dl>
                {row.values.map((v) => (
                  <div key={v.locationId}>
                    <dt>
                      {card.labels[v.locationId] ?? v.tractId}
                      <small>Tract {v.tractId}</small>
                    </dt>
                    <dd>
                      <strong>{measurement(v.rawValue)}</strong> {row.unit}
                      <small>
                        {v.percentile === null
                          ? "Percentile unavailable"
                          : `${measurement(v.percentile)} source percentile`}
                      </small>
                      {v.locationId !== card.data.referenceId && (
                        <small>
                          {v.comparisonToReference.rawDifferenceBMinusA === null
                            ? "Difference unavailable"
                            : `${measurement(v.comparisonToReference.rawDifferenceBMinusA)} ${v.comparisonToReference.rawDifferenceUnit} vs reference`}
                        </small>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p>{row.summary.interpretation}</p>
              <details>
                <summary>Definition & source</summary>
                <p>{row.definition}</p>
                {row.limitations.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
                <a href={row.definitionSource} target="_blank" rel="noreferrer">
                  Source definition
                </a>
                <p>
                  Source SHA-256: <code>{row.provenance.sha256}</code>
                </p>
              </details>
            </div>
          ))}
        </details>
      </section>
    );
  return (
    <section className="ask-card" aria-label="Nearby facility evidence">
      <details className="ask-evidence-details">
        <summary>Nearby facility values & sources</summary>
        <h3>Nearby source-listed facilities</h3>
        {card.healthcareFilter && (
          <p>
            Healthcare filter: {card.healthcareFilter.kind} · source status{" "}
            {card.healthcareFilter.status} · subtype codes{" "}
            {card.healthcareFilter.subtypes.join(", ")}
          </p>
        )}
        <p>
          Original confirmed address points · straight-line distance to
          published points. No travel-time, eligibility or access guarantee.
        </p>
        {card.data.categories.map((category) => (
          <div key={category.category}>
            <h4>{category.category}</h4>
            {category.availability !== "ready" ? (
              <p>This category is unavailable.</p>
            ) : (
              category.results.map((result) => (
                <div className="ask-facilities" key={result.locationId}>
                  <strong>{card.labels[result.locationId]}</strong>
                  {result.facilities.map((f) => (
                    <div key={f.id}>
                      <span>{f.name ?? "Unnamed source record"}</span>
                      <span>
                        {measurement(f.distanceKm ?? null)} km straight-line
                      </span>
                      <small>
                        Subtype: {f.subtype ?? "Not supplied"} · Source status:{" "}
                        {f.status ?? "Not supplied"} · {f.sourcePeriod}
                      </small>
                    </div>
                  ))}
                  {"sourceUrl" in category && (
                    <a
                      href={category.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Facility source
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </details>
    </section>
  );
}

export default function AskClearSky({
  places,
  onConfirm,
  onComparison,
  disabled,
  bounds,
  onDiscovery,
  onExplore,
  onClearHighlights,
}: {
  places: Place[];
  onConfirm: (s: Selection) => void;
  onComparison: (ids: string[]) => void;
  disabled: boolean;
  bounds?: [number, number, number, number];
  onDiscovery: (data: DiscoveryResult) => void;
  onExplore: (candidate: DiscoveryResult["candidates"][number]) => void;
  onClearHighlights: () => void;
}) {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(""),
    [messages, setMessages] = useState<Message[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [discoveredTractIds, setDiscoveredTractIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<DiscoveryProfile>();
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set());
  const [continuation, setContinuation] = useState<{
    keys: string[];
    message: string;
  } | null>(null);
  const generation = useRef(0),
    abort = useRef<AbortController | null>(null),
    input = useRef<HTMLTextAreaElement>(null),
    bottom = useRef<HTMLDivElement>(null);
  const contextKey = JSON.stringify(
    places.map((p) => [
      p.id,
      p.selection.label,
      p.selection.tractId,
      p.selection.coordinate,
    ]),
  );
  const latestContext = useRef(contextKey);
  latestContext.current = contextKey;
  function cancel() {
    generation.current++;
    abort.current?.abort();
    setBusy(false);
  }
  function close() {
    cancel();
    onClearHighlights();
    setOpen(false);
    setContinuation(null);
    requestAnimationFrame(() => input.current?.focus());
  }
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    cancel();
  }, [contextKey]);
  useEffect(() => {
    if (disabled) {
      cancel();
      onClearHighlights();
      setOpen(false);
      setMessages([]);
      setDiscoveredTractIds([]);
      setProfile(undefined);
      setConfirmed(new Set());
      setContinuation(null);
    }
  }, [disabled]);
  useEffect(() => {
    if (!disabled) input.current?.focus();
  }, [disabled]);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !busy)
      bottom.current?.parentElement
        ?.querySelector(".ask-message:last-of-type")
        ?.scrollIntoView({ block: "start" });
    else bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy, error]);
  useEffect(() => {
    if (
      continuation &&
      continuation.keys.every((key) =>
        places.some((p) => candidateKey(p.selection) === key),
      )
    ) {
      setContinuation(null);
      void send(continuation.message);
    }
  }, [continuation, contextKey]);

  async function send(text: string, acceptedProfile?: DiscoveryProfile) {
    if (!text.trim() || disabled) return;
    cancel();
    const turn = ++generation.current,
      controller = new AbortController();
    abort.current = controller;
    const snapshot = contextKey;
    const history = messages
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }));
    setOpen(true);
    setDraft("");
    input.current?.focus();
    setError("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          ...(bounds ? { mapBounds: bounds } : {}),
          ...(discoveredTractIds.length ? { discoveredTractIds } : {}),
          history,
          discoveryProfile: acceptedProfile ?? profile,
          locations: places.map((p) => ({
            id: p.id,
            label: p.selection.label,
            tractId: p.selection.tractId,
            coordinate: p.selection.coordinate,
            confirmed: true,
          })),
        }),
      });
      const result = await response.json();
      if (
        controller.signal.aborted ||
        turn !== generation.current ||
        snapshot !== latestContext.current
      )
        return;
      if (!response.ok)
        throw Error(result.error || "Ask ClearSky is unavailable. Try again.");
      const answer = result as AssistantResponse;
      setMessages((m) => [
        ...m,
        { role: "assistant", text: answer.message, response: answer },
      ]);
      answer.evidence.forEach((c) => {
        if (c.kind === "discovery") {
          onDiscovery(c.data);
          setDiscoveredTractIds(c.data.candidates.map((c) => c.tractId));
          setProfile(c.data.profile);
          const candidates = c.data.candidates;
          if (candidates.length)
            onExplore({
              ...candidates[0],
              bbox: [
                Math.min(...candidates.map((v) => v.bbox[0])),
                Math.min(...candidates.map((v) => v.bbox[1])),
                Math.max(...candidates.map((v) => v.bbox[2])),
                Math.max(...candidates.map((v) => v.bbox[3])),
              ],
            });
        }
        if (c.kind === "comparison") {
          const ids = [
            ...new Set(
              c.data.rows.flatMap((row) => row.values.map((v) => v.locationId)),
            ),
          ];
          if (
            ids.length >= 2 &&
            ids.every((id) => places.some((p) => p.id === id))
          )
            onComparison(ids);
        }
      });
      for (const action of answer.actions) {
        if (
          action.type === "open-comparison" &&
          action.locationIds.every((id) => places.some((p) => p.id === id))
        )
          onComparison(action.locationIds);
      }
    } catch (e) {
      if (!controller.signal.aborted && turn === generation.current)
        setError((e as Error).message);
    } finally {
      if (turn === generation.current) setBusy(false);
    }
  }
  function confirm(selection: Selection, response: AssistantResponse) {
    const next = new Set(confirmed).add(candidateKey(selection));
    setConfirmed(next);
    onConfirm(selection);
    const groups = response.evidence.filter(
      (c): c is Extract<EvidenceCard, { kind: "candidates" }> =>
        c.kind === "candidates" && c.candidates.length > 0,
    );
    if (
      groups.length &&
      groups.every((g) => g.candidates.some((s) => next.has(candidateKey(s))))
    ) {
      const keys = groups.map((g) =>
        candidateKey(g.candidates.find((s) => next.has(candidateKey(s)))!),
      );
      const original =
        messages.findLast((m) => m.role === "user")?.text ??
        "Compare my selected places and nearby schools.";
      setContinuation({
        keys,
        message:
          `The application has now confirmed the requested addresses. Continue my request using the current confirmed selections: ${original}`.slice(
            0,
            2000,
          ),
      });
    }
  }
  return (
    <>
      {!disabled && (
        <aside
          id="ask-clearsky"
          className={`ask-panel${open ? "" : " ask-panel-intro"}`}
          aria-label="Ask ClearSky"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className="ask-heading">
            <div>
              <h2>Ask ClearSky</h2>
              <p className="ask-subtitle">
                {messages.length
                  ? "Your atlas, in conversation"
                  : "Start with a question about a place."}
              </p>
            </div>
            {open && (
              <button
                className="icon-button"
                aria-label="Minimize Ask ClearSky"
                onClick={close}
              >
                <Icon name="close" />
              </button>
            )}
            {!open && messages.length > 0 && (
              <button className="ask-resume" onClick={() => setOpen(true)}>
                Resume conversation
              </button>
            )}
          </div>
          <details className="ask-privacy">
            <summary>
              <Icon name="info" size={14} /> Processed by Gemini{" "}
              <span>Privacy & data</span>
            </summary>
            <p>
              Queries, selected addresses and relevant atlas evidence are
              processed by Gemini. Conversation stays in this browser’s memory
              until reload. New address lookups go to Census.
            </p>
          </details>
          <div className="ask-conversation" aria-busy={busy}>
            {messages.map((m, i) => (
              <article key={i} className={`ask-message ${m.role}`}>
                <span className="ask-eyebrow">
                  {m.role === "user" ? "You" : "ClearSky · Gemini"}
                </span>
                {m.role === "assistant" ? (
                  <AssistantNarrative text={m.text} />
                ) : (
                  <p>{m.text}</p>
                )}
                {m.role === "assistant" && (
                  <>
                    {m.response.clarification && (
                      <p className="ask-clarification">
                        {m.response.clarification}
                      </p>
                    )}
                    {m.response.evidence.map((card) => (
                      <Evidence
                        key={card.id}
                        card={card}
                        insights={m.response.insights}
                        confirmed={confirmed}
                        disabled={busy || i !== messages.length - 1}
                        bounds={bounds}
                        onExplore={onExplore}
                        onAccept={(p) => {
                          setProfile(p);
                          void send(
                            "Use the profile I just accepted in the application to find areas. Show candidates with their evidence and tradeoffs.",
                            p,
                          );
                        }}
                        onConfirm={(s) => confirm(s, m.response)}
                      />
                    ))}
                    {i === messages.length - 1 && (
                      <div className="ask-followups">
                        {m.response.followUps.map((s) => (
                          <button
                            key={s}
                            disabled={busy}
                            onClick={() => void send(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <details className="ask-usage">
                      <summary>Request details</summary>
                      <p>
                        {m.response.usage.model} ·{" "}
                        {(m.response.usage.latencyMs / 1000).toFixed(1)} s ·{" "}
                        {m.response.usage.inputTokens} input /{" "}
                        {m.response.usage.outputTokens +
                          m.response.usage.thinkingTokens}{" "}
                        output tokens · {m.response.usage.calls} tool calls
                      </p>
                    </details>
                  </>
                )}
              </article>
            ))}
            {busy && (
              <p role="status" className="ask-status">
                Checking the atlas evidence…{" "}
                <button onClick={cancel}>Cancel</button>
              </p>
            )}
            {error && (
              <div role="alert" className="ask-error">
                <p>{error}</p>
                <button
                  onClick={() =>
                    void send(
                      messages.findLast((m) => m.role === "user")?.text ??
                        "Compare my selected places",
                    )
                  }
                >
                  Try again
                </button>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form
            className="ask-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <label htmlFor="ask-message">Your question</label>
            <div>
              <textarea
                id="ask-message"
                ref={input}
                rows={2}
                maxLength={2000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  messages.length
                    ? "What would you like to explore?"
                    : "Ask about air quality, compare addresses, or find an area…"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!busy && draft.trim()) void send(draft);
                  }
                }}
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send question"
              >
                <Icon name="arrow" />
              </button>
            </div>
            <p className="ask-compose-hint">
              Grounded in atlas sources. Check the evidence.
            </p>
          </form>
        </aside>
      )}
    </>
  );
}
