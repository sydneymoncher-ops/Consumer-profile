# Chrome Web Store submission draft — Signal / Self History Connector

Publication status: Not submitted or published. Do not present this draft as a store listing or link.

## Short description

Transfer a selected period of Chrome browsing history to your local Signal / Self consumer-intelligence dashboard after you approve access.

## Permission justifications

- History (optional permission): The user clicks Approve & transfer in the extension popup, grants Chrome's optional history permission, selects a time window, and transfers returned URL/title/last-visit items to the configured dashboard tab. Without this permission, no history query runs.
- Host access (https://sydneymoncher-ops.github.io/*): Required to communicate with the dashboard hosted on this origin. The content script matches only /Consumer-profile/*; the background worker sends data only to tabs whose URL is within that dashboard path.
- Storage: None.
- Remote code: None.
- Analytics: None.

## Data disclosure

The extension handles browsing history and transfers only records the user explicitly requests to the dashboard. It does not sell data, use it for advertising, transmit it to AI APIs, or retain it. The dashboard keeps imported data in page memory only.

## Submission checklist

- Finalize support contact and public privacy-policy URL.
- Test permission prompts, disconnect behavior, and transfer in supported Chrome versions.
- Capture store screenshots and promo assets.
- Submit for review and wait for approval.
- Add the verified listing URL to the dashboard only after approval.
