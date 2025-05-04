
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;

function loadImage(src) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
        originalImage = img;
        updateCanvasSize();
        applyEffect();
    };
    img.src = src;
}

document.getElementById('imageUpload').onchange = function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        loadImage(event.target.result);
    };
    reader.readAsDataURL(file);
};

document.getElementById('imageURL').onchange = function () {
    loadImage(this.value);
};

function updateCanvasSize() {
    const size = parseInt(document.getElementById('canvasSize').value);
    canvas.width = size;
    canvas.height = size;
}

function applyEffect() {
    if (!originalImage) return;
    const slices = parseInt(document.getElementById('slices').value);
    const angle = parseInt(document.getElementById('angle').value);
    const offset = parseInt(document.getElementById('offset').value);
    const pattern = document.getElementById('patternType').value;
    const lockImage = document.getElementById('lockImage').checked;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pattern === 'vertical') {
        const sliceWidth = canvas.width / slices;
        for (let i = 0; i < slices; i++) {
            const offsetY = Math.sin(i * 0.2) * offset;
            ctx.save();
            ctx.beginPath();
            ctx.rect(i * sliceWidth, 0, sliceWidth, canvas.height);
            ctx.clip();
            if (!lockImage) ctx.translate(0, offsetY);
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    } else {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRotation = (angle * Math.PI / 180);
        for (let i = 0; i < slices; i++) {
            const sliceRotation = (i / slices) * Math.PI * 2 + baseRotation;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(sliceRotation);
            ctx.drawImage(originalImage, -centerX, -centerY, canvas.width, canvas.height);
            ctx.restore();
        }
    }
}

function generateSVG() {
    if (!originalImage) return null;
    const slices = parseInt(document.getElementById('slices').value);
    const angle = parseInt(document.getElementById('angle').value);
    const offset = parseInt(document.getElementById('offset').value);
    const pattern = document.getElementById('patternType').value;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('width', canvas.width);
    svg.setAttribute('height', canvas.height);
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    const imageBase64 = tempCanvas.toDataURL('image/png');

    if (pattern === 'vertical') {
        const sliceWidth = canvas.width / slices;
        for (let i = 0; i < slices; i++) {
            const offsetY = Math.sin(i * 0.2) * offset;
            const clipPath = document.createElementNS(svgNS, 'clipPath');
            clipPath.setAttribute('id', `clip-${i}`);
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', i * sliceWidth);
            rect.setAttribute('y', 0);
            rect.setAttribute('width', sliceWidth);
            rect.setAttribute('height', canvas.height);
            clipPath.appendChild(rect);
            svg.appendChild(clipPath);

            const image = document.createElementNS(svgNS, 'image');
            image.setAttribute('x', 0);
            image.setAttribute('y', offsetY);
            image.setAttribute('width', canvas.width);
            image.setAttribute('height', canvas.height);
            image.setAttribute('clip-path', `url(#clip-${i})`);
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageBase64);
            svg.appendChild(image);
        }
    } else {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let i = 0; i < slices; i++) {
            const sliceRotation = (i / slices) * 360 + angle;
            const g = document.createElementNS(svgNS, 'g');
            g.setAttribute('transform', `rotate(${sliceRotation}, ${centerX}, ${centerY})`);
            const image = document.createElementNS(svgNS, 'image');
            image.setAttribute('x', 0);
            image.setAttribute('y', 0);
            image.setAttribute('width', canvas.width);
            image.setAttribute('height', canvas.height);
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageBase64);
            g.appendChild(image);
            svg.appendChild(g);
        }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
}

document.getElementById('canvasSize').oninput = function () {
    document.getElementById('canvasSizeValue').textContent = this.value;
    updateCanvasSize();
    applyEffect();
};

['slices', 'angle', 'offset', 'patternType', 'lockImage'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        applyEffect();
        if (id !== 'lockImage') {
            document.getElementById(id + 'Value').textContent = 
                id === 'angle' ? document.getElementById(id).value + '°' : document.getElementById(id).value;
        }
    });
});

document.getElementById('exportPNG').onclick = function () {
    const link = document.createElement('a');
    link.download = 'distorto-image.png';
    link.href = canvas.toDataURL();
    link.click();
};

document.getElementById('copySVG').onclick = function () {
    const svgString = generateSVG();
    if (svgString) {
        navigator.clipboard.writeText(svgString)
            .then(() => alert('SVG copied to clipboard!'))
            .catch(() => alert('Failed to copy SVG.'));
    }
};

document.getElementById('downloadSVG').onclick = function () {
    const svgString = generateSVG();
    if (svgString) {
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "distorto-image.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

document.getElementById('reset').onclick = function () {
    document.getElementById('slices').value = 10;
    document.getElementById('angle').value = 0;
    document.getElementById('offset').value = 20;
    document.getElementById('patternType').value = 'vertical';
    document.getElementById('lockImage').checked = false;
    document.getElementById('canvasSize').value = 1000;
    updateCanvasSize();
    applyEffect();
};
