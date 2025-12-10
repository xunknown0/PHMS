   let editStream = {};

    function getCameraTimerElement(id) { return document.getElementById(`cameraTimerEdit-${id}`); }
    function getCameraStreamElement(id) { return document.getElementById(`cameraStreamEdit-${id}`); }

    // 1. Open Camera Stream
    async function startCameraEdit(id) {
        document.getElementById(`cameraWrapperEdit-${id}`).classList.remove("d-none");
        const timerEl = getCameraTimerElement(id);
        if (timerEl) timerEl.style.display = 'none';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            editStream[id] = stream;
            getCameraStreamElement(id).srcObject = stream;
        } catch (err) {
            console.error("Camera access failed:", err);
            alert("Camera unavailable or permission denied.");
            stopCameraEdit(id);
        }
    }

    // 2. Stop Camera Stream
    function stopCameraEdit(id) {
        if (editStream[id]) {
            editStream[id].getTracks().forEach(track => track.stop());
            delete editStream[id];
        }
        document.getElementById(`cameraWrapperEdit-${id}`).classList.add("d-none");
    }

    // 3. Capture Photo (Execution)
    function capturePhotoEdit(id) {
        const video = getCameraStreamElement(id);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.9);

        document.getElementById(`previewEditImg-${id}`).src = base64;
        document.getElementById(`cameraImageEdit-${id}`).value = base64;
        stopCameraEdit(id);
    }

    // 4. Capture with 3-second Countdown
    function capturePhotoWithTimerEdit(id) {
        const timerEl = getCameraTimerElement(id);
        let count = 3;
        
        timerEl.textContent = count;
        timerEl.style.display = 'block';

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                timerEl.textContent = count;
            } else if (count === 0) {
                // Optional: Show a capture prompt
                timerEl.textContent = 'Capture!'; 
            } else {
                clearInterval(interval);
                timerEl.textContent = '';
                timerEl.style.display = 'none';
                capturePhotoEdit(id); 
            }
        }, 1000);
    }

    // 5. File Input Preview/Clear Camera Data
    function loadOwnerEditImage(event, id) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById(`previewEditImg-${id}`).src = URL.createObjectURL(file);
        document.getElementById(`cameraImageEdit-${id}`).value = "";
    }