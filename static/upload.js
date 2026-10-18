const filePicker = document.querySelector("#media-files");
const selectedFileNames = document.querySelector("#selected-file-names");

filePicker.addEventListener("change", () => {
    const names = Array.from(filePicker.files, (file) => file.name);
    selectedFileNames.textContent = names.length ? names.join(", ") : "No file chosen";
});