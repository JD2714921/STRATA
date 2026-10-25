"use client";
import { useState } from "react";
import { ArrowUpRight, FileText, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { corpusReport } from "@/lib/strata/historical";
import type { MarketEvent } from "@/lib/strata/types";
export function CorpusView({
  events,
  onInspect,
  year,
  onYear,
}: {
  events: MarketEvent[];
  onInspect: (e: MarketEvent) => void;
  year: string;
  onYear: (v: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [previousEvents, setPreviousEvents] = useState(events);
  if (events !== previousEvents) {
    setPreviousEvents(events);
    setPage(0);
  }
  const visible = events.slice(page * 10, page * 10 + 10);
  const years = Object.keys(corpusReport.years);
  const counts = years.map(
    (y) => corpusReport.years[y as keyof typeof corpusReport.years],
  );
  return (
    <>
      <div className="metrics">
        <div className="metric">
          <span>Ingested events</span>
          <strong>{corpusReport.totalRecords}</strong>
          <small>
            {years[0]}–{years.at(-1)} · {years.length} source files
          </small>
        </div>
        <div className="metric">
          <span>Records by year</span>
          <strong>{counts.join(" / ")}</strong>
          <small>{years.join(" / ")}</small>
        </div>
        <div className="metric">
          <span>Externally verified</span>
          <strong>0</strong>
          <small>User-supplied historical accounts</small>
        </div>
        <div className="metric">
          <span>Review flags</span>
          <strong>{corpusReport.recordsFlagged}</strong>
          <small>
            {corpusReport.recordsWithSourceDescriptions} non-specific citations
          </small>
        </div>
        <div className="metric">
          <span>Elasticity available</span>
          <strong>0 / {corpusReport.totalRecords}</strong>
          <small>Null values preserved</small>
        </div>
      </div>
      <section className="panel">
        <div className="section-head">
          <h3>
            Historical Corpus{" "}
            <span className="badge">{events.length} MATCHING</span>
          </h3>
          <Select value={year} onValueChange={onYear}>
            <SelectTrigger aria-label="Corpus year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All years", ...years].map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="muted">
          Middle circle: what was expected. Outer circle: what the supplied
          record says happened.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Event / UTC date",
                "Location",
                "Expected · middle circle",
                "Observed · outer circle",
                "Relevance",
                "Review",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <button className="corpus-title" onClick={() => onInspect(e)}>
                    {e.title}
                    <ArrowUpRight size={14} />
                    <small>
                      {e.date.slice(0, 10)} · {e.historical?.sourceFile}
                    </small>
                  </button>
                </TableCell>
                <TableCell>
                  <span className="corpus-excerpt">
                    {e.historical?.raw.location_name}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="corpus-excerpt">
                    {e.historical?.raw.middle_circle}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="corpus-excerpt">
                    {e.historical?.raw.outer_circle}
                  </p>
                </TableCell>
                <TableCell>{e.historical?.raw.relevance_score}/10</TableCell>
                <TableCell>
                  <button className="text-button" onClick={() => onInspect(e)}>
                    {e.historical?.issues.length ? (
                      <>
                        <AlertCircle size={14} />
                        {e.historical.issues.length} flags
                      </>
                    ) : (
                      "Unverified"
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!events.length && (
          <div className="empty">
            No matching historical records. Use Historical and All historical
            markets to view the complete batch.
          </div>
        )}
        <div className="pagination">
          <span>
            {events.length} records · page {page + 1} /{" "}
            {Math.max(1, Math.ceil(events.length / 10))}
          </span>
          <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button
            disabled={(page + 1) * 10 >= events.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
      <div className="callout">
        Relevance is the supplied 0–10 score, not confidence or a probability.
        Source links are retained but have not been independently checked.
        Historical instrument references are preserved without silently
        converting FX directions, futures into cash products, or bond prices
        into yields.
      </div>
    </>
  );
}
export function HistoricalDetail({ event }: { event: MarketEvent }) {
  const h = event.historical;
  if (!h) return null;
  const r = h.raw;
  return (
    <>
      <div className="focus-tags">
        <span className="badge">USER PROVIDED</span>
        <span className="badge">HISTORICAL</span>
        <span className="badge">UNVERIFIED</span>
      </div>
      <p>{r.description}</p>
      <div className="context-row">
        <span>Supplied UTC time</span>
        <b>{r.date_time_utc.replace("T", " ").replace("Z", " UTC")}</b>
      </div>
      {h.normalizedDateTimeUtc && h.normalizedDateTimeUtc !== r.date_time_utc && (
        <div className="context-row">
          <span>Chronological display time</span>
          <b>{h.normalizedDateTimeUtc.replace("T", " ").replace("Z", " UTC")}</b>
        </div>
      )}
      <div className="context-row">
        <span>Original location</span>
        <b>{r.location_name}</b>
      </div>
      <div className="context-row">
        <span>Coordinates</span>
        <b>
          {r.latitude}, {r.longitude}
        </b>
      </div>
      <div className="context-row">
        <span>Relevance / confidence</span>
        <b>{r.relevance_score}/10 · confidence unknown</b>
      </div>
      <h3 className="subheading">Middle circle · expected</h3>
      <p>{r.middle_circle}</p>
      <h3 className="subheading">Outer circle · observed</h3>
      <p>{r.outer_circle}</p>
      <div className="context-row">
        <span>Elasticity</span>
        <b>
          {r.elasticity_value === null
            ? "Not supplied"
            : r.elasticity_value + " · supplied, unverified"}
        </b>
      </div>
      <h3 className="subheading">Original instrument references</h3>
      <div className="focus-tags">
        {r.instruments.map((i, index) => (
          <span className="badge" key={i + index}>
            {i}
          </span>
        ))}
      </div>
      <details>
        <summary>Mapping & derived classification</summary>
        <p>Mapped context IDs: {h.mappedInstrumentIds.join(", ") || "None"}</p>
        <p>
          Preserved without mapping:{" "}
          {h.unmappedInstrumentReferences.join(", ") || "None"}
        </p>
        <p>
          Category: {h.derivedCategory}. Region: {h.derivedRegion}. These
          display classifications use simple rules and are not verified source
          fields. No market session or numeric reaction has been inferred.
        </p>
      </details>
      <h3 className="subheading">Sources as supplied</h3>
      <div className="source-list">
        {r.sources.map((s, i) =>
          /^https?:\/\//.test(s) ? (
            <a key={i} href={s} target="_blank" rel="noopener noreferrer">
              <FileText size={14} />
              <span>{s}</span>
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <p key={i}>
              <strong>Source description only:</strong> {s}
            </p>
          ),
        )}
      </div>
      {h.issues.length > 0 && (
        <div className="callout">
          <h4>Review flags</h4>
          {h.issues.map((i) => (
            <p key={i}>{i}</p>
          ))}
        </div>
      )}
      <h3 className="subheading">Original notes</h3>
      <p>{r.notes || "None supplied"}</p>
      <details>
        <summary>Ingestion provenance</summary>
        <p>
          Batch: {h.batchId}
          <br />
          Original file: {h.sourceFile}
          <br />
          Source row: {h.sourceRow}
          <br />
          Ingested: {h.ingestedAt}
        </p>
        <p className="hash">SHA-256: {h.sourceSha256}</p>
        <p>
          Original values preserved. No source claims have been independently
          verified.
        </p>
      </details>
      <details>
        <summary>Original JSON record</summary>
        <pre className="raw-json">{JSON.stringify(r, null, 2)}</pre>
      </details>
    </>
  );
}
