// SwatchFlow - Main JavaScript

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const gridSizeSlider = document.getElementById('gridSize');
const densitySlider = document.getElementById('density');
const gridSizeValue = document.getElementById('gridSizeValue');
const densityValue = document.getElementById('densityValue');
const shapeOptions = document.querySelectorAll('input[name="shape"]');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const copyButton = document.getElementById('copyButton');
const svgOutput = document.getElementById('svgOutput');
const placeholder = document.getElementById('placeholder');
const loading = document.getElementById('loading');

// App State
let image = new Image();
let imageLoaded = false;

// Initialize
function init() {
  loading.style.display = 'none';
  placeholder.style.display = 'flex';
  canvas.style.display = 'none';
  updateSliderValues();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  fileInput.addEventListener('change', handleFileSelection);
  setupDragAndDrop();
  gridSizeSlider.addEventListener('input', handleControlChange);
  densitySlider.addEventListener('input', handleControlChange);
  shapeOptions.forEach(option => option.addEventListener('change', handleControlChange));
  copyButton.addEventListener('click', copySvgToClipboard);
  image.addEventListener('load', handleImageLoaded);
  image.addEventListener('error', handleImageError);
}

// File selection
function handleFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    showError('Please select a valid image file (PNG, JPG, or SVG)');
    return;
  }

  showLoading();
  const reader = new FileReader();
  reader.onload = (e) => {
    image.src = e.target.result;
  };
  reader.onerror = () => {
    hideLoading();
    showError('Error reading file. Please try again.');
  };
  reader.readAsDataURL(file);
}

// Drag and Drop
function setupDragAndDrop() {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event =>
    uploadArea.addEventListener(event, preventDefaults, false)
  );
  ['dragenter', 'dragover'].forEach(event =>
    uploadArea.addEventListener(event, highlight, false)
  );
  ['dragleave', 'drop'].forEach(event =>
    uploadArea.addEventListener(event, unhighlight, false)
  );
  uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  uploadArea.classList.add('active');
}

function unhighlight() {
  uploadArea.classList.remove('active');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  if (file) {
    fileInput.files = dt.files;
    handleFileSelection({ target: { files: dt.files } });
  }
}

function showLoading() {
  loading.style.display = 'flex';
  placeholder.style.display = 'none';
  canvas.style.display = 'none';
}

function hideLoading() {
  loading.style.display = 'none';
}

function handleControlChange() {
  updateSliderValues();
  if (imageLoaded) processImage();
}

function updateSliderValues() {
  gridSizeValue.textContent = gridSizeSlider.value;
  densityValue.textContent = densitySlider.value;
}

function handleImageLoaded() {
  imageLoaded = true;
  processImage();
}

function handleImageError() {
  hideLoading();
  showError('Failed to load the image. Please try another file.');
}

function showError(message) {
  alert(message);
  placeholder.style.display = 'flex';
  canvas.style.display = 'none';
}

// Process the image
function processImage() {
  if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
    console.warn('Image is not fully loaded or has invalid dimensions');
    return;
  }

  const gridSize = parseInt(gridSizeSlider.value);
  const threshold = parseInt(densitySlider.value);
  const shape = getSelectedShape();

  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image before reading pixel data
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1A1E3C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${image.width} ${image.height}"><rect width="${image.width}" height="${image.height}" fill="#1A1E3C"/>`;

  for (let y = 0; y < image.height; y += gridSize) {
    for (let x = 0; x < image.width; x += gridSize) {
      const i = (y * image.width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (brightness < threshold && a > 0) {
        const color = `rgb(${r},${g},${b})`;
        ctx.fillStyle = color;

        if (shape === 'rect') {
          ctx.fillRect(x, y, gridSize, gridSize);
          svg += `<rect x="${x}" y="${y}" width="${gridSize}" height="${gridSize}" fill="${color}"/>`;
        } else {
          const cx = x + gridSize / 2;
          const cy = y + gridSize / 2;
          const radius = gridSize / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
          svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
        }
      }
    }
  }

  svg += '</svg>';
  svgOutput.textContent = svg;

  // Update UI
  placeholder.style.display = 'none';
  loading.style.display = 'none';
  canvas.style.display = 'block';
}

// Shape selector
function getSelectedShape() {
  const selected = document.querySelector('input[name="shape"]:checked');
  return selected ? selected.value : 'rect';
}

// Copy SVG
function copySvgToClipboard() {
  const svg = svgOutput.textContent;
  if (!svg) {
    showError('No SVG content to copy. Please upload an image first.');
    return;
  }

  navigator.clipboard.writeText(svg)
    .then(() => {
      const originalText = copyButton.innerHTML;
      copyButton.innerHTML = '<i class="fas fa-check"></i> SVG Copied!';
      copyButton.classList.add('success');
      setTimeout(() => {
        copyButton.innerHTML = originalText;
        copyButton.classList.remove('success');
      }, 2000);
    })
    .catch(err => {
      showError('Failed to copy SVG. Please try again.');
    });
}

// Start
window.addEventListener('DOMContentLoaded', init);
