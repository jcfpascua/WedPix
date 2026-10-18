
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from database import initialize_database, get_connection
from pathlib import Path
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
app.secret_key = "change-this-to-a-random-secret-before-deployment"

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp",
    "mp4", "mov", "webm"
}

app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100 MB per request

initialize_database()


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        files = request.files.getlist("files")
        uploaded_count = 0

        for file in files:
            if not file or not file.filename:
                continue

            if not allowed_file(file.filename):
                flash(f"Unsupported file type: {file.filename}")
                continue

            original_name = secure_filename(file.filename)
            extension = original_name.rsplit(".", 1)[1].lower()
            stored_name = f"{uuid.uuid4().hex}.{extension}"
            file_path = UPLOAD_FOLDER / stored_name

            file.save(file_path)

            media_type = (
                "image"
                if extension in {"jpg", "jpeg", "png", "gif", "webp"}
                else "video"
            )

            try:
                connection = get_connection()
                connection.execute(
                    """
                    INSERT INTO media (filename, original_name, media_type)
                    VALUES (?, ?, ?)
                    """,
                    (stored_name, original_name, media_type)
                )
                connection.commit()
                connection.close()
                uploaded_count += 1
            except Exception:
                if file_path.exists():
                    file_path.unlink()
                flash(f"Could not save {original_name}. Please try again.")

        if uploaded_count:
            flash(f"Successfully uploaded {uploaded_count} file(s)!")

        return redirect(url_for("upload"))

    return render_template("upload.html")


@app.route("/gallery")
def gallery():
    connection = get_connection()
    media_items = connection.execute(
        "SELECT * FROM media ORDER BY uploaded_at DESC, id DESC"
    ).fetchall()
    connection.close()

    return render_template("gallery.html", media_items=media_items)



@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/download/<filename>")
def download_file(filename):
    return send_from_directory(
        UPLOAD_FOLDER,
        filename,
        as_attachment=True
    )



if __name__ == "__main__":
    app.run(debug=True)
