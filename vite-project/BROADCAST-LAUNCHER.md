# Windows one-click broadcast launcher

From `vite-project`, double-click `start-broadcast.bat`.

It will:
1. stop any old process listening on port 3001 and any old `cloudflared.exe`;
2. verify Node/npm/cloudflared;
3. start `npm run server`;
4. wait until the local Control page responds;
5. start a Cloudflare Quick Tunnel;
6. capture the new `trycloudflare.com` address;
7. save the public, Control, Caster, and Overlay URLs to `artifacts/current-public-url.txt`;
8. open the local Control page automatically.

Keep the server and tunnel windows running during the event. Double-click `stop-broadcast.bat` when finished.

The local operator intentionally uses `http://127.0.0.1:3001/control`; remote Caster/Overlay clients use the generated HTTPS URL.

If startup fails, inspect `artifacts/cloudflared.log` and the `HOK Broadcast Server` window.
