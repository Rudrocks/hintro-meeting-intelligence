# AI Approach

## Provider

**Google Gemini 1.5 Flash** via REST API (`generativelanguage.googleapis.com/v1beta`).

Configuration:
- `temperature: 0.1` — Near-deterministic output; reduces creative hallucination
- `maxOutputTokens: 2048` — Sufficient for most meeting analyses

---

## Prompt Design

The prompt is structured around three principles: **constraint-first**, **format-explicit**, **citation-enforced**.

### Structure

```
[Role declaration]
[Explicit rules about grounding — what NOT to do]
[Meeting context: title, participants, date]
[Full transcript with timestamps]
[Exact JSON schema with example]
```

### Key Prompt Rules Injected

1. "Only extract information **explicitly stated** in the transcript"
2. "Do NOT invent attendees, decisions, action items, or outcomes"
3. "Every insight MUST include at least one citation referencing the **exact timestamp**"
4. "If something is not mentioned in the transcript, do not include it"
5. "Return ONLY valid JSON (no markdown, no backticks)"

---

## Citation Strategy

Transcript entries are formatted as:

```
[00:10] John: We should launch next Friday.
[00:20] Alice: I will prepare release notes.
```

The AI is instructed to cite `{"timestamp": "00:10"}` from this formatted input, making citations directly machine-verifiable.

Every generated field — summary, actionItems, decisions, followUpSuggestions — must include a `citations` array.

---

## Hallucination Prevention

Three layers of protection:

### Layer 1 — Prompt Constraints
Negative instructions are placed prominently at the top of the prompt, not buried. The model is explicitly told what it must NOT do, followed by what it MUST do.

### Layer 2 — Citation Validation (Post-processing)
After parsing the AI response, every citation timestamp is validated against the actual transcript:

```javascript
const validTimestamps = new Set(meeting.transcript.map(t => t.timestamp));
validateCitations(parsed.actionItems, validTimestamps, 'actionItems');
```

If a timestamp is not in the transcript, the invalid citation is removed. If all citations for an item are invalid, the first valid transcript timestamp is assigned as a fallback (rather than silently dropping the item).

### Layer 3 — Low Temperature
`temperature: 0.1` significantly reduces creative/invented outputs. The model is incentivized to quote and cite rather than invent.

---

## Output Validation Strategy

1. Strip any accidental markdown fences (` ```json `) from the response
2. `JSON.parse()` in a try/catch — returns a user-friendly error if parsing fails
3. Validate all array fields exist (default to `[]` if missing)
4. Validate all citations reference real timestamps (see Layer 2 above)
5. Save raw response to `rawResponse` DB column for debugging/auditing

---

## Known Limitations

1. **Timestamp Format Sensitivity** — The AI may round or reformat timestamps (e.g., `"00:10"` → `"0:10"`). The current validation uses exact string matching; a fuzzy matcher could handle this better.

2. **Long Transcripts** — Very long transcripts may exceed output token limits for the summary. Gemini 1.5 Flash's 1M context window handles input well; the `maxOutputTokens: 2048` cap could be increased if needed.

3. **Implicit Action Items** — If an action item is strongly implied but not explicitly stated, the model may either include it (potential hallucination) or exclude it (missed insight). The prompt biases toward exclusion to preserve grounding.

4. **Re-analysis** — Re-running analysis on the same meeting replaces the previous analysis and deletes PENDING action items. COMPLETED/IN_PROGRESS items are preserved.

5. **No streaming** — Analysis is synchronous; for very long transcripts, response times could be 10-30 seconds. A webhook/polling pattern would improve UX in production.
