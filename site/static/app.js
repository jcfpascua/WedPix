import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    addDoc,
    collection,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { firebaseConfig } from "./config.js";

const maxFileSize = 100 * 1024 * 1024;
const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const firebaseConfigured = Object.values(firebaseConfig).every((value) =>
    typeof value === "string" && value.length > 0 && !value.includes("YOUR_")
);
const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
const database = firebaseApp ? getFirestore(firebaseApp) : null;
const storage = firebaseApp ? getStorage(firebaseApp) : null;

function mediaTypeFor(file) {
    if (imageTypes.has(file.type)) return "image";
    if (videoTypes.has(file.type)) return "video";
    return null;
}

function safeExtension(file) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    return extension || "media";
}

function uploadToStorage(file, storagePath, onProgress) {
    return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(ref(storage, storagePath), file, {
            contentType: file.type
        });
        task.on(
            "state_changed",
            (snapshot) => onProgress(snapshot.bytesTransferred / snapshot.totalBytes),
            reject,
            () => resolve(task.snapshot)
        );
    });
}

async function uploadFile(file, onProgress) {
    const mediaType = mediaTypeFor(file);
    if (!mediaType) {
        throw new Error(`${file.name}: unsupported file type.`);
    }
    if (file.size > maxFileSize) {
        throw new Error(`${file.name}: files must be 100 MB or smaller.`);
    }

    const storagePath = `uploads/${crypto.randomUUID()}.${safeExtension(file)}`;
    await uploadToStorage(file, storagePath, onProgress);
    try {
        await addDoc(collection(database, "media"), {
            originalName: file.name,
            mediaType,
            storagePath,
            uploadedAt: serverTimestamp()
        });
    } catch (error) {
        await deleteObject(ref(storage, storagePath)).catch(() => {});
        throw error;
    }
}

async function createGalleryItem(item) {
    const article = document.createElement("article");
    article.className = "gallery-item";
    const sourceUrl = await getDownloadURL(ref(storage, item.storagePath));

    if (item.mediaType === "image") {
        const image = document.createElement("img");
        image.src = sourceUrl;
        image.alt = item.originalName;
        image.loading = "lazy";
        article.append(image);
    } else {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        const source = document.createElement("source");
        source.src = sourceUrl;
        video.append(source);
        article.append(video);
    }

    const name = document.createElement("p");
    name.className = "media-name";
    name.textContent = item.originalName;

    const download = document.createElement("a");
    download.className = "download-link";
    download.href = sourceUrl;
    download.download = item.originalName;
    download.textContent = "Download";

    const date = document.createElement("p");
    date.className = "media-date";
    const uploadedAt = item.uploadedAt?.toDate?.() ?? item.uploadedAt;
    date.textContent = uploadedAt ? new Date(uploadedAt).toLocaleString() : "Just uploaded";
    article.append(name, download, date);
    return article;
}

async function loadGallery() {
    const grid = document.querySelector("#gallery-grid");
    const status = document.querySelector("#gallery-status");
    if (!firebaseConfigured) {
        status.textContent = "Firebase is not configured yet.";
        return;
    }

    try {
        const mediaQuery = query(collection(database, "media"), orderBy("uploadedAt", "desc"));
        const snapshot = await getDocs(mediaQuery);
        const cards = await Promise.all(snapshot.docs.map((item) =>
            createGalleryItem({ id: item.id, ...item.data() })
        ));
        grid.replaceChildren(...cards);
        status.textContent = cards.length
            ? `${cards.length} shared ${cards.length === 1 ? "memory" : "memories"}`
            : "No photos or videos have been shared yet.";
    } catch (error) {
        status.textContent = `Could not load the gallery: ${error.message}`;
    }
}

function setupUpload() {
    const form = document.querySelector("#upload-form");
    const picker = document.querySelector("#media-files");
    const button = document.querySelector("#upload-button");
    const status = document.querySelector("#upload-status");
    const selectedFiles = document.querySelector("#selected-files");

    picker.addEventListener("change", () => {
        const count = picker.files.length;
        selectedFiles.textContent = count
            ? `${count} ${count === 1 ? "file" : "files"} selected`
            : "No files selected";
    });

    form.addEventListener("submit", async (event) => {
        if (!firebaseConfigured && form.hasAttribute("data-flask-fallback")) {
            return;
        }
        event.preventDefault();
        if (!firebaseConfigured) {
            status.textContent = "Firebase is not configured yet.";
            return;
        }

        const files = Array.from(picker.files);
        if (!files.length) {
            status.textContent = "Choose at least one file to upload.";
            return;
        }

        button.disabled = true;
        let uploaded = 0;
        const failures = [];
        for (const file of files) {
            status.textContent = `Uploading ${uploaded + failures.length + 1} of ${files.length}: ${file.name} (0%)`;
            try {
                await uploadFile(file, (progress) => {
                    status.textContent = `Uploading ${uploaded + failures.length + 1} of ${files.length}: ${file.name} (${Math.round(progress * 100)}%)`;
                });
                uploaded += 1;
            } catch (error) {
                failures.push(`${file.name}: ${error.message}`);
            }
        }
        button.disabled = false;
        status.textContent = [
            uploaded ? `Uploaded ${uploaded} ${uploaded === 1 ? "file" : "files"}.` : "No files were uploaded.",
            ...failures
        ].join(" ");
        if (uploaded) {
            form.reset();
            selectedFiles.textContent = "No files selected";
        }
    });
}

if (document.querySelector("#upload-form")) {
    setupUpload();
}
if (document.querySelector("#gallery-grid")) {
    loadGallery();
}