# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkedOut is a Manifest V3 Chrome extension with a single objective: hide the unwanted "Suggestions" posts LinkedIn injects into the feed.

## Development

No build step — the extension loads directly from the repo folder.

**To test changes:**
1. Open Chrome → `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked" → select this folder
4. Reload LinkedIn (or click the reload icon on the extension card after editing files)

## Architecture

The extension is entirely flat — no bundler, no dependencies:

- [manifest.json](manifest.json) — Manifest V3 declaration; content scripts injected on `*.linkedin.com/*`
- [content.js](content.js) — Detects "Suggestions" feed cards at runtime via `MutationObserver` and marks them with the `linkedout-hidden` class (CSS alone can't match on text content). Scans are scoped to `[data-testid="mainFeed"]` when present, falling back to the whole document otherwise, and anchored on `[role="listitem"]` cards rather than LinkedIn's hashed classes/`componentkey` attributes, which churn far more often.
- [styles.css](styles.css) — CSS-only: a single rule (`.linkedout-hidden { display: none !important; }`) that hides whatever `content.js` marked.

**Why both JS and CSS?** LinkedIn's feed is dynamically rendered, so "Suggestions" cards must be detected by text content at runtime (`content.js`). CSS alone owns the actual hiding: it only ever reacts to the `linkedout-hidden` class, never inspects text itself.

This project intentionally does one thing. Resist scope creep (e.g. re-adding sidebar/premium/nav hiding) unless explicitly requested — keep detection and hiding logic scoped to "Suggestions" only.
