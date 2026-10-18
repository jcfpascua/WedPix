# WedPix

WedPix is a local Flask app for uploading and browsing wedding photos and
videos. Files are stored in `uploads/` and media records are stored in the
SQLite database under `instance/`.

## Run locally

From the project directory, activate your Python environment and start Flask:

```powershell
python -m flask --app app run --debug
```

Open the local address printed by Flask, usually `http://127.0.0.1:5000`.
Uploaded media and the SQLite database stay on this machine. Back up both
`uploads/` and `instance/` to preserve the gallery.
