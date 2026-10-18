# WedPix

Wedding media sharing app. The Flask application is useful for local
development, but GitHub Pages cannot run Flask, write uploaded files, or host
SQLite. The `site/` directory is the static GitHub Pages version; it stores
guest uploads in Firebase Storage and gallery metadata in Cloud Firestore.

## Configure Firebase

1. Create a Firebase project and register a **Web app** in Project settings.
2. In **Build > Firestore Database**, create a database. In **Build > Storage**,
	enable Storage and create its default bucket if prompted.
3. Copy the Firebase web app configuration into
	[`site/static/config.js`](site/static/config.js), replacing every
	`YOUR_FIREBASE_...` placeholder. Copy the `storageBucket` value exactly as
	Firebase provides it.
4. Publish [`firebase/firestore.rules`](firebase/firestore.rules) in
	**Firestore Database > Rules**, and publish
	[`firebase/storage.rules`](firebase/storage.rules) in **Storage > Rules**.
	Alternatively, install the Firebase CLI, run `firebase login` and
	`firebase use --add` from this repository to select the project, then run
	`firebase deploy --only firestore:rules,storage`.

The Firebase web configuration is public by design, not a server secret.
The included rules allow anyone to view the gallery and upload eligible files,
but disallow changing or deleting existing files and metadata. Anonymous
uploads can still consume storage and bandwidth. Monitor Firebase usage and
quotas; for a private or abuse-resistant event, add authentication and App
Check or put uploads behind a trusted service with rate limits before sharing
the site.

## Deploy to GitHub Pages

1. Push the repository to GitHub with the workflow at
	`.github/workflows/deploy-pages.yml` on the `main` or `master` branch.
2. In the repository, open **Settings > Pages** and set the build and deployment
	source to **GitHub Actions**.
3. Push a change or run **Deploy static site to GitHub Pages** from the Actions
	tab. The workflow publishes only `site/`; the Flask source, local database,
	and upload folder are not part of the Pages artifact.

The static site uses relative links and works for both user and project Pages
URLs. The guest-upload form accepts JPEG, PNG, GIF, WebP, MP4, QuickTime, and
WebM files, individually up to 100 MB. Firebase Storage holds the original
files; the gallery lists the corresponding metadata from Firestore.

## Run the Flask development app

The existing Flask routes and SQLite database remain available for local
development. Install the app's Python dependencies, then run
`python -m flask --app app run` from this repository. With the placeholders
unchanged in the root `static/config.js`, the upload form continues to post to
Flask. The Flask database and uploads are separate from the Firebase-backed
GitHub Pages site.
