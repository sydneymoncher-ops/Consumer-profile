# Signal / Self — Consumer Intelligence Lab

A local-first React and TypeScript dashboard for exploring voluntarily supplied browsing, conversation, and shopping records. The app contains no analytics, tracking code, server, or external AI API. Imported data is held in page memory and clears when the page is closed or reloaded.

## Development

Requires Node.js 20 or newer and pnpm.

- pnpm install
- pnpm dev
- pnpm test
- pnpm build

The test fixtures are synthetic and exist only inside automated tests. They are never loaded into the dashboard or represented as real user behavior.

## Chrome history connector (unpublished)

The dashboard cannot access browser history by itself. For local testing:

1. Start the dashboard with pnpm dev. The extension currently targets the configured GitHub Pages origin, so local testing requires temporarily updating the exact match and dashboard URL in extension/manifest.json, extension/background.js, and extension/popup.js.
2. Open chrome://extensions, enable Developer mode, and choose Load unpacked. Select the extension/ folder.
3. Open the dashboard, choose Arm this dashboard tab, then click the extension toolbar button. The extension's explicit approval and transfer action will also enable its receiver for that dashboard tab.
4. Choose a history period and select Approve & transfer. Chrome will ask for the optional History permission. No history is read if permission is declined.

The extension returns distinct URL history items whose last visit is within the selected window (not every individual visit). It does not request passwords, cookies, authentication tokens, or access to private accounts. The extension stores no records. The dashboard receives data only in the open tab. Disconnect disables the page-side receiver; remove the extension permission separately in chrome://extensions.

The Web Store listing is not published. No listing URL is provided. extension/STORE_LISTING.md has the draft disclosures and permission rationale.

## Data formats

- Chrome history / Google Takeout: JSON or CSV with URL, title, and date-like fields
- ChatGPT: conversations JSON; user-authored messages are extracted, assistant messages ignored, common quote blocks omitted
- Shopping/order exports: CSV or JSON with a filename containing order or purchase
- Product catalog: CSV or JSON with a filename containing catalog or product; include name, url, and optionally category, price, or image

Use imports only for data you choose to provide. Review a file before importing. Nothing is uploaded.

## Product discovery

The lab does not scrape retailer sites or verify live product details. Add a retailer URL and details yourself, or import a product catalog. Recommendation scores are keyword overlap heuristics, not quality ratings. Prices are user-supplied and explicitly unverified.

## GitHub Pages

A GitHub Actions workflow builds dist/ and deploys it to Pages on pushes to main. Enable GitHub Actions as the Pages build source in repository settings. The application base path assumes the repository name Consumer-profile.

## Limitations

- Chrome history search returns URL history items, not a full event log of every visit. Time of day reflects each URL's last-visit timestamp.
- Interest labels and shopping tendencies use small transparent keyword dictionaries. Low coverage must be treated as insufficient evidence.
- Network communities are visual associations, not causal links.
- This local connector has not been installed or tested in a real Chrome profile in this environment.
- No Chrome Web Store review, GitHub push, Pages activation, live deployment, or real-person data analysis has occurred.
