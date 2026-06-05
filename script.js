const photoSlots = 4;
const defaultCanvas = { width: 240, height: 720 };
const DEFAULT_STRIP_LABEL = 'BLUNians 26-27';
const BLUN_DRIVE_UPLOAD_LINK = 'https://drive.google.com/drive/folders/1T3WCQzW9mDJFNq8E0TZdjewSeryMumMq?usp=sharing';

const templates = {
  emerald: { name: 'Emerald', bg: '#fff8e6', border: '#063b22', text: '#063b22', style: 'classic', accent: '#c7a22a' },
  gold: { name: 'Gold', bg: '#f7e9b4', border: '#a88418', text: '#063b22', style: 'classic', accent: '#063b22' },
  classic: { name: 'Classic', bg: '#ffffff', border: '#063b22', text: '#063b22', style: 'classic', accent: '#c7a22a' },
  film: { name: 'Film', bg: '#101010', border: '#c7a22a', text: '#fff8e6', style: 'film', accent: '#063b22' },
  polaroid: { name: 'Polaroid', bg: '#fffdf2', border: '#e6ddbd', text: '#063b22', style: 'polaroid', accent: '#c7a22a' },
  noir: { name: 'Noir', bg: '#111111', border: '#5a5a5a', text: '#ffffff', style: 'classic', accent: '#c7a22a' },
  campusDuo: {
    name: 'Campus Duo', bg: '#063b22', border: '#17bb0f', text: '#ffffff', style: 'overlay', accent: '#c7a22a',
    overlaySrc: 'assets/template-campus-duo.png', canvasWidth: 1200, canvasHeight: 1800,
    slots: [
      { x: 63, y: 79, w: 1072, h: 602, photoIndex: 0, label: 'Photo 1' },
      { x: 64, y: 764, w: 1072, h: 581, photoIndex: 1, label: 'Photo 2' }
    ]
  },
  campusSolo: {
    name: 'Campus Solo', bg: '#063b22', border: '#0b502f', text: '#ffffff', style: 'overlay', accent: '#c7a22a',
    overlaySrc: 'assets/template-campus-solo.png', canvasWidth: 1500, canvasHeight: 2000,
    slots: [
      { x: 74, y: 80, w: 1352, h: 1247, photoIndex: 0, label: 'Photo 1' }
    ]
  },
  filmstripRetro: {
    name: 'Retro Film', bg: '#0f0908', border: '#0f0908', text: '#ffffff', style: 'retroFilm', accent: '#ebe7dd',
    canvasWidth: 600, canvasHeight: 1800,
    slots: [
      { x: 68, y: 0, w: 466, h: 550, photoIndex: 0, label: 'Photo 1' },
      { x: 68, y: 590, w: 466, h: 588, photoIndex: 1, label: 'Photo 2' },
      { x: 68, y: 1250, w: 466, h: 550, photoIndex: 2, label: 'Photo 3' }
    ]
  }
};

const state = {
  photos: [],
  stream: null,
  currentTemplate: 'emerald',
  stripConfig: { ...templates.emerald },
  lastDownloadBlob: null,
  renderJob: 0,
  currentScreen: 'landing',
  captureMode: 'manual',
  timerRunning: false,
  countdownInterval: null
};

const imageCache = new Map();
const overlayCache = new Map();

const els = {
  screens: document.querySelectorAll('.screen'),
  stepPills: document.querySelectorAll('.step-pill'),
  gotoButtons: document.querySelectorAll('[data-goto]'),
  cameraFeed: document.getElementById('cameraFeed'),
  snapCanvas: document.getElementById('snapCanvas'),
  stripCanvas: document.getElementById('stripCanvas'),
  capturePreviewCard: document.getElementById('capturePreviewModal'),
  capturePreviewCanvas: document.getElementById('capturePreviewCanvas'),
  captureModalPreviewCanvas: document.getElementById('captureModalPreviewCanvas'),
  downloadPreviewCanvas: document.getElementById('downloadPreviewCanvas'),
  noCamera: document.getElementById('noCamera'),
  permissionBanner: document.getElementById('permissionBanner'),
  enableCameraButton: document.getElementById('enableCameraButton'),
  enableCameraFromBanner: document.getElementById('enableCameraFromBanner'),
  quickCameraButton: document.getElementById('quickCameraButton'),
  captureButton: document.getElementById('captureButton'),
  resetButton: document.getElementById('resetButton'),
  retakePreviewButton: document.getElementById('retakePreviewButton'),
  nextFromPreviewButton: document.getElementById('nextFromPreviewButton'),
  goDownloadButton: document.getElementById('goDownloadButton'),
  downloadButton: document.getElementById('downloadButton'),
  photoCount: document.getElementById('photoCount'),
  requiredPhotosBadge: document.getElementById('requiredPhotosBadge'),
  selectedTemplateTitle: document.getElementById('selectedTemplateTitle'),
  flashOverlay: document.getElementById('flashOverlay'),
  countdownOverlay: document.getElementById('countdownOverlay'),
  manualMode: document.getElementById('manualMode'),
  timerMode: document.getElementById('timerMode'),
  timerSeconds: document.getElementById('timerSeconds'),
  modeCards: document.querySelectorAll('.mode-card'),
  toast: document.getElementById('toast'),
  shareModal: document.getElementById('shareModal'),
  closeModalButton: document.getElementById('closeModalButton'),
  doneButton: document.getElementById('doneButton'),
  shareFacebookButton: document.getElementById('shareFacebookButton'),
  shareMessengerButton: document.getElementById('shareMessengerButton'),
  uploadDriveButton: document.getElementById('uploadDriveButton'),
  driveModal: document.getElementById('driveModal'),
  closeDriveModalButton: document.getElementById('closeDriveModalButton'),
  closeDriveDoneButton: document.getElementById('closeDriveDoneButton'),
  openDriveLinkButton: document.getElementById('openDriveLinkButton'),
  copyDriveLinkButton: document.getElementById('copyDriveLinkButton'),
  driveLinkText: document.getElementById('driveLinkText'),
  customBg: null,
  customBorder: null,
  customText: null,
  stripLabel: null,
  photoFilter: document.getElementById('photoFilter'),
  dateTimeWatermark: document.getElementById('dateTimeWatermark'),
  customWatermark: document.getElementById('customWatermark'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon')
};

function bindEvents() {
  els.gotoButtons.forEach(button => {
    button.addEventListener('click', event => {
      const target = button.dataset.goto;
      if (!target) return;
      event.preventDefault();
      navigateTo(target);
    });
  });

  els.stepPills.forEach(button => button.addEventListener('click', () => navigateTo(button.dataset.goto)));

  els.enableCameraButton.addEventListener('click', requestCameraAgain);
  els.enableCameraFromBanner.addEventListener('click', requestCameraAgain);
  els.quickCameraButton.addEventListener('click', requestCameraAgain);
  els.captureButton.addEventListener('click', capturePhoto);
  els.resetButton.addEventListener('click', resetPhotos);
  els.retakePreviewButton.addEventListener('click', resetPhotos);
  els.nextFromPreviewButton.addEventListener('click', () => {
    closeCapturePreviewModal();
    navigateTo('download');
  });
  els.downloadButton.addEventListener('click', downloadStrip);

  document.querySelectorAll('.template-btn').forEach(button => {
    button.addEventListener('click', () => applyTemplate(button.dataset.template));
  });

  [els.customWatermark].forEach(input => input.addEventListener('input', renderAllPreviews));
  [els.photoFilter, els.dateTimeWatermark].forEach(input => input.addEventListener('change', renderAllPreviews));
  [els.manualMode, els.timerMode].forEach(input => input.addEventListener('change', updateCaptureMode));
  els.timerSeconds.addEventListener('change', updateCaptureButtonText);

  els.themeToggle.addEventListener('click', toggleTheme);
  els.closeModalButton.addEventListener('click', closeShareModal);
  els.doneButton.addEventListener('click', closeShareModal);
  els.shareFacebookButton.addEventListener('click', () => shareStrip('facebook'));
  els.shareMessengerButton.addEventListener('click', () => shareStrip('messenger'));
  els.uploadDriveButton.addEventListener('click', showDriveModal);
  els.closeDriveModalButton.addEventListener('click', closeDriveModal);
  els.closeDriveDoneButton.addEventListener('click', closeDriveModal);
  els.copyDriveLinkButton.addEventListener('click', copyDriveLink);

  els.shareModal.addEventListener('click', event => {
    if (event.target === els.shareModal) closeShareModal();
  });

  els.driveModal.addEventListener('click', event => {
    if (event.target === els.driveModal) closeDriveModal();
  });
}


function updateCaptureMode() {
  state.captureMode = els.timerMode.checked ? 'timer' : 'manual';
  els.modeCards.forEach(card => {
    const input = card.querySelector('input');
    card.classList.toggle('active', input && input.checked);
  });
  updateCaptureButtonText();
}

function updateCaptureButtonText() {
  if (!els.captureButton) return;

  const required = getRequiredPhotoCount();
  const done = state.photos.length >= required;

  if (done) {
    els.captureButton.textContent = 'Photos Complete';
    els.captureButton.disabled = true;
    return;
  }

  els.captureButton.textContent = state.captureMode === 'timer'
    ? `Start ${els.timerSeconds.value}s Timer`
    : 'Capture';

  if (state.stream && !state.timerRunning) {
    els.captureButton.disabled = false;
  }
}

function startTimerCapture() {
  const required = getRequiredPhotoCount();

  if (state.photos.length >= required) {
    showToast(`You already captured the needed ${required} photo${required > 1 ? 's' : ''}.`);
    return;
  }

  if (!els.cameraFeed.videoWidth) {
    showToast('Camera is still loading. Please wait a second.');
    return;
  }

  state.timerRunning = true;
  els.captureButton.disabled = true;
  runTimerSequence();
}

function runTimerSequence() {
  const required = getRequiredPhotoCount();

  if (!state.timerRunning) return;

  if (state.photos.length >= required) {
    state.timerRunning = false;
    els.countdownOverlay.classList.add('hidden');
    updateCaptureButtonText();
    showCapturePreviewModal();
    return;
  }

  let remaining = Number(els.timerSeconds.value || 5);
  els.countdownOverlay.textContent = remaining;
  els.countdownOverlay.classList.remove('hidden');

  clearInterval(state.countdownInterval);
  state.countdownInterval = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      clearInterval(state.countdownInterval);
      els.countdownOverlay.classList.add('hidden');
      capturePhotoNow({ fromTimer: true });

      if (state.photos.length < getRequiredPhotoCount()) {
        setTimeout(runTimerSequence, 750);
      } else {
        state.timerRunning = false;
        updateCaptureButtonText();
        showCapturePreviewModal();
      }

      return;
    }

    els.countdownOverlay.textContent = remaining;
  }, 1000);
}

function navigateTo(screen) {
  const mapping = {
    landing: 'landingScreen',
    templates: 'templateScreen',
    capture: 'captureScreen',
    download: 'downloadScreen'
  };

  if (!mapping[screen]) return;

  if (screen === 'capture' && !state.stream) initCamera();

  if (screen === 'download' && state.photos.length < getRequiredPhotoCount()) {
    showToast(`Capture ${getRequiredPhotoCount()} photo${getRequiredPhotoCount() > 1 ? 's' : ''} first for this template.`);
    screen = 'capture';
    if (!state.stream) initCamera();
  }

  state.currentScreen = screen;
  els.screens.forEach(section => section.classList.toggle('active', section.id === mapping[screen]));
  els.stepPills.forEach(button => button.classList.toggle('active', button.dataset.goto === screen));
  renderAllPreviews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getRequiredPhotoCount(template = state.stripConfig) {
  if (template.slots?.length) return Math.max(...template.slots.map(slot => slot.photoIndex)) + 1;
  return photoSlots;
}

function refreshDownloadState() {
  const required = getRequiredPhotoCount();
  const ready = state.photos.length >= required;
  els.downloadButton.disabled = !ready;
  if (els.goDownloadButton) els.goDownloadButton.disabled = !ready;
  els.requiredPhotosBadge.textContent = `${required} photo${required > 1 ? 's' : ''} needed`;
  updateCapturePreviewVisibility();
  updateCaptureButtonText();
}

function updateCapturePreviewVisibility() {
  const ready = state.photos.length >= getRequiredPhotoCount();

  const captureLayout = document.querySelector('.capture-layout');
  if (captureLayout) {
    captureLayout.classList.toggle('preview-hidden', !ready);
  }
}

async function showCapturePreviewModal() {
  await renderToCanvas(els.captureModalPreviewCanvas, false);
  els.capturePreviewCard.classList.remove('hidden');
}

function closeCapturePreviewModal() {
  els.capturePreviewCard.classList.add('hidden');
}

async function initCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraUnavailable();
    showToast('Camera is not supported in this browser.');
    return;
  }

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });
    els.cameraFeed.srcObject = state.stream;
    els.noCamera.classList.add('hidden');
    els.permissionBanner.classList.add('hidden');
    updateCaptureButtonText();
    showToast('✅ Camera enabled. Ready, BLUNian!');
  } catch (error) {
    console.error('Camera error:', error);
    showCameraUnavailable();
    showToast('Camera permission denied. Click Enable Camera to try again.');
  }
}

function showCameraUnavailable() {
  els.noCamera.classList.remove('hidden');
  els.permissionBanner.classList.remove('hidden');
  els.captureButton.disabled = true;
}

function requestCameraAgain() {
  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }
  initCamera();
}

function capturePhoto() {
  if (state.timerRunning) return;

  if (state.captureMode === 'timer') {
    startTimerCapture();
    return;
  }

  capturePhotoNow();
}

function capturePhotoNow(options = {}) {
  const required = getRequiredPhotoCount();

  if (state.photos.length >= required) {
    showToast(`You already captured the needed ${required} photo${required > 1 ? 's' : ''}. Continue to download or reset.`);
    updateCaptureButtonText();
    return;
  }

  if (!els.cameraFeed.videoWidth) {
    showToast('Camera is still loading. Please wait a second.');
    return;
  }

  const canvas = els.snapCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = els.cameraFeed.videoWidth;
  canvas.height = els.cameraFeed.videoHeight;

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(els.cameraFeed, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  state.photos.push(canvas.toDataURL('image/jpeg', 0.92));
  playFlash();
  updateThumbnails();
  updatePhotoCount();
  refreshDownloadState();
  renderAllPreviews();

  if (state.photos.length >= required) {
    showToast('🎉 Enough photos captured for this template. You can now continue.');
    if (!options.fromTimer) {
      showCapturePreviewModal();
    }
  }
}

function playFlash() {
  els.flashOverlay.classList.remove('active');
  void els.flashOverlay.offsetWidth;
  els.flashOverlay.classList.add('active');
}

function resetPhotos() {
  closeCapturePreviewModal();
  clearInterval(state.countdownInterval);
  state.timerRunning = false;
  els.countdownOverlay.classList.add('hidden');
  state.photos = [];
  state.lastDownloadBlob = null;
  updateThumbnails();
  updatePhotoCount();
  refreshDownloadState();
  renderAllPreviews();
  showToast('Photos reset.');
}

function updatePhotoCount() {
  const required = getRequiredPhotoCount();
  els.photoCount.textContent = `${state.photos.length} / ${required} needed`;
}

function updateThumbnails() {
  const required = getRequiredPhotoCount();

  for (let index = 0; index < photoSlots; index += 1) {
    const slot = document.getElementById(`thumb${index}`);
    const needed = index < required;

    slot.classList.toggle('unneeded', !needed);
    slot.classList.toggle('filled', Boolean(state.photos[index]));

    if (!needed) {
      slot.innerHTML = '';
      continue;
    }

    slot.innerHTML = state.photos[index]
      ? `<img src="${state.photos[index]}" alt="Captured photo ${index + 1}">`
      : String(index + 1);
  }
}

function applyTemplate(name) {
  if (!templates[name]) return;
  state.currentTemplate = name;
  state.stripConfig = { ...templates[name] };

  const required = getRequiredPhotoCount();
  if (state.photos.length > required) {
    state.photos = state.photos.slice(0, required);
  }

  els.selectedTemplateTitle.textContent = state.stripConfig.name;

  document.querySelectorAll('.template-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.template === name);
  });

  updateThumbnails();
  updatePhotoCount();
  refreshDownloadState();
  renderAllPreviews();
  showToast(`${state.stripConfig.name} template selected.`);
}

function setCanvasSize(canvas, width, height) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function getTransparentOverlay(src) {
  if (overlayCache.has(src)) return overlayCache.get(src);

  const promise = (async () => {
    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 15 && g < 15 && b < 15) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  })();

  overlayCache.set(src, promise);
  return promise;
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const newWidth = image.width * ratio;
  const newHeight = image.height * ratio;
  const offsetX = x + (width - newWidth) / 2;
  const offsetY = y + (height - newHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, newWidth, newHeight);
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function roundRect(ctx, x, y, width, height, radius) {
  roundedRectPath(ctx, x, y, width, height, radius);
}

function drawPhotoPlaceholder(ctx, x, y, w, h, label, bg = '#111', color = 'rgba(255,255,255,0.72)', radius = 8) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.max(16, Math.round(w * 0.06))}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + (w / 2), y + (h / 2));
  ctx.restore();
}

async function drawPhotoToRect(ctx, slot, filter, renderId, options = {}) {
  const { x, y, w, h, photoIndex, label, radius = 8 } = slot;
  if (state.photos[photoIndex]) {
    const image = await loadImage(state.photos[photoIndex]);
    if (renderId !== state.renderJob) return false;
    ctx.save();
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.clip();
    if (filter !== 'none') ctx.filter = filter;
    drawCoverImage(ctx, image, x, y, w, h);
    ctx.restore();
    ctx.filter = 'none';
  } else {
    drawPhotoPlaceholder(ctx, x, y, w, h, label, options.placeholderBg || '#111', options.placeholderColor || 'rgba(255,255,255,0.72)', radius);
  }
  return true;
}

function drawRetroFilmBase(ctx, template) {
  const { canvasWidth: width, canvasHeight: height, bg, accent } = template;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = accent;
  template.slots.forEach(slot => ctx.fillRect(slot.x, slot.y, slot.w, slot.h));

  ctx.fillStyle = bg;
  ctx.fillRect(0, 550, width, 40);
  ctx.fillRect(0, 1210, width, 40);

  ctx.fillStyle = '#f3f1ec';
  const holeW = 48, holeH = 34, leftX = 10, rightX = width - 10 - holeW;
  const ys = [12, 88, 164, 240, 316, 392, 468, 584, 660, 736, 812, 888, 964, 1040, 1116, 1232, 1308, 1384, 1460, 1536, 1612, 1688, 1764];
  ys.forEach(y => {
    roundedRectPath(ctx, leftX, y, holeW, holeH, 8); ctx.fill();
    roundedRectPath(ctx, rightX, y, holeW, holeH, 8); ctx.fill();
  });
}

async function drawRetroFilmTemplate(ctx, template, filter, renderId) {
  drawRetroFilmBase(ctx, template);
  for (const slot of template.slots) {
    const ok = await drawPhotoToRect(ctx, slot, filter, renderId, { placeholderBg: '#ebe7dd', placeholderColor: 'rgba(35,20,18,0.45)', radius: 0 });
    if (!ok) return;
  }
}

async function drawOverlayTemplate(ctx, template, filter, renderId) {
  const width = template.canvasWidth;
  const height = template.canvasHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = template.bg;
  ctx.fillRect(0, 0, width, height);

  for (const slot of template.slots) {
    const ok = await drawPhotoToRect(ctx, slot, filter, renderId, { placeholderBg: '#020202', placeholderColor: 'rgba(255,255,255,0.72)', radius: 0 });
    if (!ok) return;
  }

  const overlay = await getTransparentOverlay(template.overlaySrc);
  if (renderId !== state.renderJob) return;
  ctx.drawImage(overlay, 0, 0, width, height);
}

async function renderClassicTemplate(ctx, template, filter) {
  const width = defaultCanvas.width;
  const height = defaultCanvas.height;
  const padding = 13;
  const footerHeight = 42;
  const photoGap = 12;
  const photoWidth = width - padding * 2;
  const photoHeight = (height - padding * 2 - footerHeight - photoGap * 3) / photoSlots;
  const label = DEFAULT_STRIP_LABEL;
  const { bg, border, text, style, accent } = template;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  drawTemplateDecorations(ctx, { width, height, bg, border, text, style, accent });

  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  roundRect(ctx, 3, 3, width - 6, height - 6, 12);
  ctx.stroke();

  for (let i = 0; i < photoSlots; i += 1) {
    const x = padding;
    const y = padding + i * (photoHeight + photoGap);

    roundRect(ctx, x, y, photoWidth, photoHeight, 8);
    ctx.fillStyle = hexToRgba(border, 0.12);
    ctx.fill();

    if (state.photos[i]) {
      try {
        const image = await loadImage(state.photos[i]);
        ctx.save();
        roundRect(ctx, x, y, photoWidth, photoHeight, 8);
        ctx.clip();
        if (filter !== 'none') ctx.filter = filter;
        drawCoverImage(ctx, image, x, y, photoWidth, photoHeight);
        ctx.restore();
      } catch (error) {
        console.error('Could not load photo:', error);
      }
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = hexToRgba(text, 0.56);
      ctx.font = '700 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Photo ${i + 1}`, width / 2, y + photoHeight / 2);
    }

    drawPhotoBorder(ctx, x, y, photoWidth, photoHeight, border);
  }
  drawFooter(ctx, width, height, label, text, accent, border);
}

function drawTemplateDecorations(ctx, config) {
  const { width, height, border, style, accent } = config;
  if (style === 'film') {
    ctx.fillStyle = '#050505';
    for (let y = 26; y < height - 56; y += 40) {
      roundRect(ctx, 7, y, 8, 15, 3); ctx.fill();
      roundRect(ctx, width - 15, y, 8, 15, 3); ctx.fill();
    }
  }
  if (style === 'polaroid') {
    ctx.fillStyle = hexToRgba(accent, 0.22);
    ctx.fillRect(0, height - 58, width, 58);
  }
  if (style === 'classic') {
    ctx.fillStyle = hexToRgba(accent, 0.16);
    ctx.beginPath();
    ctx.arc(width + 14, -12, 82, 0, Math.PI * 2);
    ctx.arc(-12, height - 42, 72, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = hexToRgba(border, 0.10);
  ctx.fillRect(0, 0, width, 8);
}

function drawPhotoBorder(ctx, x, y, width, height, border) {
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 8);
  ctx.stroke();
}

function drawFooter(ctx, width, height, label, text, accent, border) {
  ctx.fillStyle = hexToRgba(accent, 0.18);
  ctx.fillRect(12, height - 37, width - 24, 24);

  ctx.fillStyle = text;
  ctx.font = '800 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height - 25);

  ctx.fillStyle = hexToRgba(border, 0.74);
  ctx.font = '700 8px Outfit, sans-serif';
  ctx.fillText('Bonifacio Luz Natividad Educational Foundation, Inc.', width / 2, height - 9);
}

function getWatermarkLines() {
  const lines = [];
  if (els.dateTimeWatermark.checked) {
    lines.push(new Date().toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }));
  }

  const custom = els.customWatermark.value.trim();
  if (custom) lines.push(custom);
  return lines;
}

function drawWatermarks(ctx, width, height) {
  const textLines = getWatermarkLines();
  if (!textLines.length) return;

  const margin = Math.max(16, width * 0.035);
  const fontSize = Math.max(14, Math.round(width * 0.026));
  const lineHeight = Math.round(fontSize * 1.35);
  const boxWidth = Math.min(width * 0.72, Math.max(...textLines.map(line => line.length)) * fontSize * 0.62 + 22);
  const boxHeight = textLines.length * lineHeight + 16;
  const x = width - margin - boxWidth;
  const y = height - margin - boxHeight;

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = 'rgba(2,24,14,0.68)';
  roundRect(ctx, x, y, boxWidth, boxHeight, Math.max(8, fontSize * 0.45));
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  textLines.forEach((line, index) => {
    ctx.fillText(line, x + 11, y + 8 + index * lineHeight);
  });

  ctx.restore();
  ctx.globalAlpha = 1;
}

async function renderToCanvas(canvas, includeWatermarks = true) {
  const renderId = ++state.renderJob;
  const template = state.stripConfig;
  const ctx = canvas.getContext('2d');
  const filter = els.photoFilter.value;

  const width = template.canvasWidth || defaultCanvas.width;
  const height = template.canvasHeight || defaultCanvas.height;
  setCanvasSize(canvas, width, height);

  if (template.style === 'overlay') {
    await drawOverlayTemplate(ctx, template, filter, renderId);
  } else if (template.style === 'retroFilm') {
    await drawRetroFilmTemplate(ctx, template, filter, renderId);
  } else {
    await renderClassicTemplate(ctx, template, filter);
  }

  if (includeWatermarks) drawWatermarks(ctx, width, height);
}

async function renderAllPreviews() {
  await renderToCanvas(els.stripCanvas, false);

  if (state.photos.length >= getRequiredPhotoCount()) {
    await renderToCanvas(els.capturePreviewCanvas, false);
    if (!els.capturePreviewCard.classList.contains('hidden')) {
      await renderToCanvas(els.captureModalPreviewCanvas, false);
    }
  }

  await renderToCanvas(els.downloadPreviewCanvas, true);
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const parsed = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean;
  const value = Number.parseInt(parsed, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function downloadStrip() {
  const required = getRequiredPhotoCount();
  if (state.photos.length < required) {
    showToast(`Capture at least ${required} photo${required > 1 ? 's' : ''} first before downloading.`);
    return;
  }

  await renderToCanvas(els.downloadPreviewCanvas, true);

  els.downloadPreviewCanvas.toBlob(blob => {
    if (!blob) {
      showToast('Could not prepare the photo strip. Please try again.');
      return;
    }

    state.lastDownloadBlob = blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BLUNians-Photo-Booth-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showShareModal();
  }, 'image/png');
}

function showShareModal() { els.shareModal.classList.remove('hidden'); }
function closeShareModal() { els.shareModal.classList.add('hidden'); }

function showDriveModal() {
  const hasRealLink = BLUN_DRIVE_UPLOAD_LINK && !BLUN_DRIVE_UPLOAD_LINK.includes('PASTE_YOUR');
  els.driveLinkText.textContent = hasRealLink
    ? BLUN_DRIVE_UPLOAD_LINK
    : 'Add your public Google Drive/Google Form upload link in script.js first.';
  els.openDriveLinkButton.href = hasRealLink ? BLUN_DRIVE_UPLOAD_LINK : '#';
  els.openDriveLinkButton.classList.toggle('disabled-link', !hasRealLink);
  els.driveModal.classList.remove('hidden');

  if (!hasRealLink) showToast('BLUN Drive link is not set yet. Paste the upload link in script.js.');
}

function closeDriveModal() { els.driveModal.classList.add('hidden'); }

async function copyDriveLink() {
  const text = els.driveLinkText.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('BLUN Drive link copied.');
  } catch (error) {
    showToast('Could not copy link. You may copy it manually.');
  }
}

async function shareStrip(platform) {
  const shareTitle = 'BLUNians Photo Booth';
  const shareText = 'Check out my BLUNians photo strip!';

  if (state.lastDownloadBlob && navigator.canShare && navigator.share) {
    const file = new File([state.lastDownloadBlob], 'BLUNians-Photo-Booth.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, files: [file] });
        closeShareModal();
        showToast('Shared successfully!');
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
  }

  if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  } else {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(location.href)}&redirect_uri=${encodeURIComponent(location.href)}`, '_blank', 'noopener,noreferrer');
  }
  closeShareModal();
  showToast('Opening share page. Upload your downloaded strip there.');
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => els.toast.classList.remove('show'), 3000);
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('bluniansTheme', isLight ? 'light' : 'dark');
  els.themeIcon.textContent = isLight ? '🌙' : '☀️';
}

function loadTheme() {
  const savedTheme = localStorage.getItem('bluniansTheme') || 'dark';
  const isLight = savedTheme === 'light';
  document.body.classList.toggle('light-mode', isLight);
  els.themeIcon.textContent = isLight ? '🌙' : '☀️';
}


function boot() {
  bindEvents();
  loadTheme();
  applyTemplate('emerald');
  updateCaptureMode();
  updateThumbnails();
  updatePhotoCount();
  refreshDownloadState();
  renderAllPreviews();
}

document.addEventListener('DOMContentLoaded', boot);
