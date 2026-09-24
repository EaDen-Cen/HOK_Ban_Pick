# Windows BP recognition and broadcast update

## Start

Run `npm ci` and `npm run build` in `vite-project`. In the host's `.env`, set
`HOK_CAPTURE_ENABLED=1`, then use the existing `start-broadcast.bat` or `npm run server`.
Open the **local** Control URL (normally `http://127.0.0.1:3001/control`). In match
settings select **Screen recognition (review required)** and save. Settings now expand
under the game confirmation controls on the left.

Enter the desktop physical-pixel rectangle `x`, `y`, `width`, `height` around the
current game's current hero portrait. Coordinates can be negative on secondary
monitors. The rectangle can be inside a visible game/OBS window; it must contain one
portrait, not the entire draft screen. Region coordinates stay in this browser's
local storage and are not shared with remote operators.

Click **Read region**, inspect the captured crop and the top three candidates, then
confirm the correct hero or reject the result. The current side and ban/pick phase
are shown in the review. Confidence is image similarity, not a calibrated accuracy
percentage. Results below 0.55 similarity fail closed to manual input. The server
still checks duplicates, phase order, Player/Global BP eligibility and revision.
Every candidate expires after 30 seconds and is discarded on any match revision.
You can always use the normal picker or change the mode back to manual.

## Capture boundary

- Capture and recognition run on the Windows authoritative host, never in Caster,
  Overlay or the remote browser. The capture route only returns candidates and a
  crop; it cannot submit a draft action.
- Requires an interactive, unlocked desktop. Minimized, obscured, protected or
  exclusive-fullscreen windows may return the wrong pixels or black frames. Keep
  the target visible and prefer windowed/borderless game or an OBS preview.
- Desktop capture uses Windows GDI through a hidden PowerShell child process.
  Sharp decodes all supported roster assets locally and compares normalized RGB
  templates. Nothing is uploaded to an OCR/AI service, and crops are not saved.
- The route requires the control token, loopback address/host and same-origin
  requests; forwarded/Cloudflare requests are rejected. The existing public
  control, caster and overlay routes continue to work as before.
- This first version is on-demand, one calibrated current slot per read. It does
  not track a window as it moves or infer the full ten-player draft automatically.
  Different skins, overlays, animations or portrait crops may require manual input.

## Decisions for the production capture workflow

1. **Use the included visible-region capture** for a fixed Windows/OBS setup.
   No extra desktop application is required. Confirm the monitor scaling and
   portrait rectangles against actual tournament footage before relying on it.
2. **Windows Graphics Capture companion** if operators need a native window picker,
   a region that follows a moved window, or continuous candidate detection. This
   needs a separate packaged Windows helper and representative game recordings.
3. **OBS source integration** if the production team already keeps a stable game
   capture source. Decide which OBS source/scene and whether OBS WebSocket may be
   enabled and paired locally.

Recommended next decision: whether the match feed is a PC game window, emulator,
capture-card/phone feed or OBS source. Provide the target resolution and a few
representative BP screenshots to calibrate per-slot regions and measure accuracy.
The current release does not claim live-match recognition accuracy.

## Art audit and display

Initial main `d617664b7e27ea586748e7986c292ce8dbec8e39` had **116 heroes and 0 artLink**.
During implementation, main advanced to `a2b4d87504e36672ad26c0deea3c4564ba1c5fa9`
by merging Hero Sync PR #4. This implementation incorporates that latest main and
retains all **118 heroes**, with **111 actual official main-art URLs**:
108 decoded images have a longest edge >=1000 px; Ao'yin, Flowborn (Tank), and
Garuda have approximately 756×780 px official character images. Missing art:
Flowborn (Marksman), Flowborn (Mage), Flowborn (Assassin), Flowborn (Roamer),
Annette, Florentino and Lorion.

PR #4 admitted Flowborn (Assassin) and Flowborn (Roamer). They are preserved from
latest main; its audit still marks them unconfirmed and their Chinese labels remain
"Coming soon". Review their tournament availability separately. Seven artLink values
that merely aliased thumbnails have been removed, so they do not masquerade as full
art or prevent subsequent backfill retries.

`research/hero-sync/art-audit.json` records browser-decoded dimensions and URLs.
Run `npm run hero:art-audit` to repeat (Chrome required; override `CHROME_PATH`).
Missing full art no longer becomes an artLink pointing at a small local icon;
future sync attempts keep retrying it. Existing fallback aliases also retry.

Side cards are 300 px wide and show full art with `object-fit: contain`, plus a
separate caption and role column. Current-game bans are 72×72 px with hero labels.
Empty history is omitted entirely. Numeric or win-box scores follow team identity,
side swaps and the existing delayed caster timeline (BO1:1, BO3:2, BO5:3 boxes).
Remote full art still falls back to local portraits when the CDN is unavailable.

## Validation scope

Build, lint, hero validation, server tests and Playwright regression tests cover
the original draft modes, first pick, swapping, delay, team library and portraits.
Recognition tests use image fixtures and mocked capture responses; they do not
record the operator's desktop. Live game accuracy, mixed-DPI capture calibration,
and a real Cloudflare/OBS deployment require the production setup.
