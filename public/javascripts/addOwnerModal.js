/* ==========================================================
      ADD OWNER — CAMERA SCRIPT (Converted from Edit Version)
========================================================== */

let addCameraStream = null;

/* ---------- Helper Getters ---------- */
const videoAdd = () => document.getElementById("cameraStream");
const timerAdd = () => document.getElementById("cameraTimer");
const wrapperAdd = () => document.getElementById("cameraWrapper");
const previewAdd = () => document.getElementById("previewImg");
const inputCameraAdd = () => document.getElementById("cameraImage");

/* ---------- 1. Start Camera ---------- */
async function startCamera() {
    wrapperAdd().classList.remove("d-none");

    timerAdd().style.display = "none";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        addCameraStream = stream;
        videoAdd().srcObject = stream;
    } catch (err) {
        console.error("Camera error:", err);
        alert("Camera unavailable or permission denied.");
        stopCamera();
    }
}

/* ---------- 2. Stop Camera ---------- */
function stopCamera() {
    if (addCameraStream) {
        addCameraStream.getTracks().forEach(t => t.stop());
        addCameraStream = null;
    }
    wrapperAdd().classList.add("d-none");
}

/* ---------- 3. Capture Photo ---------- */
function capturePhoto() {
    const video = videoAdd();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame
    canvas.getContext("2d").drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.9);

    previewAdd().src = base64;
    inputCameraAdd().value = base64;

    stopCamera();
}

/* ---------- 4. Countdown Capture ---------- */
function capturePhotoWithTimer() {
    let count = 3;

    timerAdd().textContent = count;
    timerAdd().style.display = "block";

    const interval = setInterval(() => {
        count--;

        if (count > 0) {
            timerAdd().textContent = count;
        } else if (count === 0) {
            timerAdd().textContent = "Capture!";
        } else {
            clearInterval(interval);
            timerAdd().style.display = "none";
            capturePhoto();
        }
    }, 1000);
}

/* ---------- 5. File Picker Preview ---------- */
function loadOwnerImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    previewAdd().src = URL.createObjectURL(file);
    inputCameraAdd().value = ""; // remove camera base64
}

/* ---------- 6. Auto-close camera on modal hide ---------- */
const addOwnerModal = document.getElementById("addOwnerModal");
if (addOwnerModal) {
    addOwnerModal.addEventListener("hidden.bs.modal", stopCamera);
}
