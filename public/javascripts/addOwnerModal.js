/* ==========================================================
   CAMERA + AUTO UPLOAD MODULE
========================================================== */

let cameraStream = null;
let timerLoop    = null;
let faceLoop     = null;

let currentZoom   = 1;
const AUTO_ZOOM_MAX = 2.4;
const TARGET_FACE_RATIO = 0.32;


/* Helpers */
const $ = id => document.getElementById(id);

const videoEl  = () => $("cameraStream");
const preview  = () => $("previewImg");
const modal    = () => $("cameraWrapper");
const timerUI  = () => $("cameraTimer");


/* File Picker Preview */
function loadOwnerImage(e){
  const f = e.target.files?.[0];
  if (f) preview().src = URL.createObjectURL(f);
}


/* Start Camera */
async function startCamera(){
  try{
    modal().classList.remove("d-none");

    cameraStream = await navigator.mediaDevices.getUserMedia({ video:true });
    videoEl().srcObject = cameraStream;

    startFaceZoomLoop();
  }
  catch(err){
    alert("Camera unavailable or permission denied.");
  }
}


/* Stop Camera */
function stopCamera(){
  modal().classList.add("d-none");

  clearInterval(timerLoop);
  clearInterval(faceLoop);

  videoEl().style.transform = "scale(1)";
  currentZoom = 1;

  cameraStream?.getTracks().forEach(t=>t.stop());
  cameraStream = null;
}


/* Auto Zoom Using FaceDetector (if supported) */
function startFaceZoomLoop(){

  if (!("FaceDetector" in window)) return;
  const detector = new FaceDetector({ fastMode:true });

  faceLoop = setInterval(async ()=>{
    const vid = videoEl();
    if(!vid.videoWidth) return;

    const faces = await detector.detect(vid);
    if(!faces.length) return;

    const box = faces[0].boundingBox;
    const frame = vid.videoWidth * vid.videoHeight;
    const face  = box.width * box.height;

    let desired = Math.sqrt(TARGET_FACE_RATIO / (face / frame));
    desired = Math.min(AUTO_ZOOM_MAX, Math.max(1, desired));
    currentZoom = currentZoom * .85 + desired * .15;

    vid.style.transform = `scale(${currentZoom})`;
  }, 120);
}


/* MAIN CAPTURE */
function performFullCapture(){
  const vid = videoEl();
  const canvas = document.createElement("canvas");

  canvas.width  = vid.videoWidth;
  canvas.height = vid.videoHeight;
  canvas.getContext("2d").drawImage(vid,0,0);

  const base64 = canvas.toDataURL("image/png");
  preview().src = base64;

  stopCamera();
  uploadCameraImage(base64);        // <--- NEW
}


/* Upload to backend using FormData */
async function uploadCameraImage(base64){

  // convert to blob
  const r   = await fetch(base64);
  const blob = await r.blob();

  // create fake file
  const file = new File([blob], "camera.png", { type: "image/png" });

  const form = new FormData();
  form.append("image", file);

  const response = await fetch("/owners/camera-upload", {
    method: "POST",
    body: form
  });

  const result = await response.json();

  $("cameraImage").value = result.fileName;  // store filename
}


/* COUNTDOWN */
function capturePhotoWithTimer(){
  let sec = 3;

  timerUI().innerText = sec;
  timerUI().style.display = "block";

  timerLoop = setInterval(()=>{
    sec--;
    timerUI().innerText = sec;

    if(sec <= 0){
      clearInterval(timerLoop);
      timerUI().style.display = "none";
      performFullCapture();
    }
  },1000);
}