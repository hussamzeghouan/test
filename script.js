
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;
let currentEffect = 'mirror';

function updateCanvasSize() {
    const size = parseInt(document.getElementById('canvasSize').value);
    canvas.width = size;
    canvas.height = size;
}

function drawImagePreserveRatio(img, x, y, width, height) {
    const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    const newWidth = img.width * ratio;
    const newHeight = img.height * ratio;
    const dx = (canvas.width - newWidth) / 2;
    const dy = (canvas.height - newHeight) / 2;
    ctx.drawImage(img, dx, dy, newWidth, newHeight);
}

function applyEffect() {
    if (!originalImage) return;
    const slices = parseInt(document.getElementById('slices').value);
    const angle = parseInt(document.getElementById('angle').value);
    const offset = parseInt(document.getElementById('offset').value);
    const lockImage = document.getElementById('lockImage').checked;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentEffect === 'mirror') {
        const sliceWidth = canvas.width / slices;
        for (let i = 0; i < slices; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(i * sliceWidth, 0, sliceWidth, canvas.height);
            ctx.clip();
            if (i % 2 === 0) {
                ctx.scale(-1, 1);
                ctx.translate(-canvas.width, 0);
            }
            drawImagePreserveRatio(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    else if (currentEffect === 'wave') {
        const sliceWidth = canvas.width / slices;
        for (let i = 0; i < slices; i++) {
            const offsetY = Math.sin(i * 0.5) * offset;
            ctx.save();
            ctx.beginPath();
            ctx.rect(i * sliceWidth, 0, sliceWidth, canvas.height);
            ctx.clip();
            if (!lockImage) ctx.translate(0, offsetY);
            drawImagePreserveRatio(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    else if (currentEffect === 'spiral') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRotation = (angle * Math.PI / 180);
        for (let i = 0; i < slices; i++) {
            const rot = baseRotation + (i / slices) * Math.PI * 4;
            const scale = 1 - i / slices * 0.5;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rot);
            ctx.scale(scale, scale);
            drawImagePreserveRatio(originalImage, -centerX, -centerY, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    else if (currentEffect === 'ripple') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let i = 0; i < slices; i++) {
            const scale = 1 + Math.sin(i * 0.5) * 0.1;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);
            drawImagePreserveRatio(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    else if (currentEffect === 'diagonal') {
        const sliceHeight = canvas.height / slices;
        for (let i = 0; i < slices; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, i * sliceHeight);
            ctx.lineTo(canvas.width, i * sliceHeight + 20);
            ctx.lineTo(canvas.width, (i + 1) * sliceHeight + 20);
            ctx.lineTo(0, (i + 1) * sliceHeight);
            ctx.closePath();
            ctx.clip();
            drawImagePreserveRatio(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }
}

// Event bindings
document.getElementById('imageUpload').onchange = function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            originalImage = img;
            updateCanvasSize();
            applyEffect();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

document.getElementById('imageURL').onchange = function () {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
        originalImage = img;
        updateCanvasSize();
        applyEffect();
    };
    img.src = this.value;
};

['slices', 'angle', 'offset', 'lockImage', 'canvasSize'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        document.getElementById(id + 'Value') && (document.getElementById(id + 'Value').textContent =
            id === 'angle' ? document.getElementById(id).value + '°' : document.getElementById(id).value);
        applyEffect();
    });
});

// Effect card selection
document.querySelectorAll('.effect-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.effect-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentEffect = card.dataset.effect;
        applyEffect();
    });
});

// Export PNG
document.getElementById('exportPNG').onclick = function () {
    const link = document.createElement('a');
    link.download = 'distorto-image.png';
    link.href = canvas.toDataURL();
    link.click();
};

// Copy SVG (placeholder)
document.getElementById('copySVG').onclick = function () {
    navigator.clipboard.writeText('<svg>Placeholder</svg>').then(() => {
        alert('SVG copied to clipboard!');
    });
};

// Download SVG (placeholder)
document.getElementById('downloadSVG').onclick = function () {
    const blob = new Blob(['<svg>Placeholder</svg>'], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "distorto-image.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Reset button
document.getElementById('reset').onclick = function () {
    document.getElementById('slices').value = 10;
    document.getElementById('angle').value = 0;
    document.getElementById('offset').value = 20;
    document.getElementById('lockImage').checked = false;
    document.getElementById('canvasSize').value = 1000;
    document.getElementById('canvasSizeValue').textContent = '1000';
    document.getElementById('angleValue').textContent = '0°';
    document.getElementById('slicesValue').textContent = '10';
    document.getElementById('offsetValue').textContent = '20';
    currentEffect = 'mirror';
    document.querySelectorAll('.effect-card').forEach(c => c.classList.remove('active'));
    document.querySelector('.effect-card[data-effect="mirror"]').classList.add('active');
    updateCanvasSize();
    applyEffect();
};
