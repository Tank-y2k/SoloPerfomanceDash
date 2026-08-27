# SoloPerfomanceDash

A self-contained queue performance dashboard.

## Run locally

Opening `index.html` directly continues to work, including the dashboard's in-page notification and sound fallback. Native browser notifications from `file://` URLs are not consistently supported because notification permissions are tied to secure origins and browser policy.

For the most reliable browser notification support, serve the folder from localhost:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>, choose **Menu → Notifications**, enable scheduled reminders, and grant browser permission. Keep the dashboard tab open: this static app does not install a service worker, so it cannot schedule reminders after the page is closed.
