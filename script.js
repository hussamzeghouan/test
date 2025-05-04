
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('placeholder');
    const gridSizeInput = document.getElementById('gridSize');
    const densityInput = document.getElementById('density');
    const colorMode = document.getElementById('colorMode');
    const customColor = document.getElementById('customColor');
    const colorWrapper = document.getElementById('colorPickerWrapper');
    const shapeSelect = document.getElementById('shape');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const svgOutput = document.getElementById('svgOutput');
    const exportPng = document.getElementById('exportPng');
    const toggleTheme = document.getElementById('toggleTheme');
    let image = new Image();

    function updateUI() {
      const isSingle = colorMode.value === 'single';
      colorWrapper.classList.toggle('hidden', !isSingle);
    }

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        image.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });

    image.onload = () => {
      canvas.classList.remove('hidden');
      placeholder.classList.add('hidden');
      drawGrid();
    };

    function drawGrid() {
      const grid = +gridSizeInput.value;
      const density = +densityInput.value;
      const shape = shapeSelect.value;
      const useSingleColor = colorMode.value === 'single';
      const selectedColor = customColor.value;

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${image.width} ${image.height}">`;

      for (let y = 0; y < image.height; y += grid) {
        for (let x = 0; x < image.width; x += grid) {
          const i = (y * image.width + x) * 4;
          const [r, g, b, a] = [
            imgData.data[i],
            imgData.data[i+1],
            imgData.data[i+2],
            imgData.data[i+3]
          ];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness < density && a > 0) {
            const color = useSingleColor ? selectedColor : `rgb(${r},${g},${b})`;
            ctx.fillStyle = color;
            if (shape === 'rect') {
              ctx.fillRect(x, y, grid, grid);
              svg += `<rect x="${x}" y="${y}" width="${grid}" height="${grid}" fill="${color}" />`;
            } else if (shape === 'dot') {
              const cx = x + grid / 2;
              const cy = y + grid / 2;
              const radius = grid / 2;
              ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.fill();
              svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" />`;
            } else if (shape === 'hex') {
              const size = grid / 2;
              const points = [...Array(6)].map((_, i) => {
                const angle = Math.PI / 3 * i;
                const px = x + size + size * Math.cos(angle);
                const py = y + size + size * Math.sin(angle);
                return `${px},${py}`;
              }).join(' ');
              ctx.beginPath();
              ctx.moveTo(...points.split(',')[0].split(' '));
              ctx.fill();
              svg += `<polygon points="${points}" fill="${color}" />`;
            }
          }
        }
      }
      svg += `</svg>`;
      svgOutput.textContent = svg;
    }

    [gridSizeInput, densityInput, colorMode, customColor, shapeSelect].forEach(input =>
      input.addEventListener('input', () => {
        updateUI();
        if (!canvas.classList.contains('hidden')) drawGrid();
      })
    );

    copyButton.onclick = () => {
      navigator.clipboard.writeText(svgOutput.textContent).then(() => {
        copyButton.textContent = "Copied!";
        setTimeout(() => copyButton.textContent = "Copy SVG", 1500);
      });
    };

    downloadButton.onclick = () => {
      const blob = new Blob([svgOutput.textContent], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "pattern.svg";
      link.click();
    };

    exportPng.onclick = () => {
      const link = document.createElement("a");
      link.download = "preview.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    toggleTheme.onclick = () => {
      document.body.classList.toggle("dark-mode");
    };

    updateUI();
  