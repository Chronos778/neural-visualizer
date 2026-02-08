/**
 * Digit Recognition App — rewired for "Lab Instrument" UI
 */

class DigitRecognitionApp {
    constructor() {
        // Canvas
        this.drawingCanvas  = document.getElementById('drawingCanvas');
        this.drawingCtx     = this.drawingCanvas.getContext('2d');
        this.networkCanvas  = document.getElementById('networkCanvas');

        // Controls
        this.clearBtn       = document.getElementById('clearBtn');
        this.predictBtn     = document.getElementById('predictBtn');
        this.brushSlider    = document.getElementById('brushSize');
        this.brushValue     = document.getElementById('brushSizeValue');

        // Readout
        this.digitEl        = document.getElementById('predictedDigit');
        this.confEl         = document.getElementById('confidence');
        this.barsEl         = document.getElementById('probabilityBars');
        this.pixelPreview   = document.getElementById('pixelPreview');

        // Status LED
        this.led            = document.getElementById('statusLed');
        this.statusText     = document.getElementById('statusText');

        // Drawing state
        this.isDrawing = false;
        this.brushSize = 20;
        this.lastPos   = null;
        this.predictionTimeout = null;

        this.visualizer = new NetworkVisualizer(this.networkCanvas);

        this.setStatus('connecting');
        this.waitForModel();
        this.init();
    }

    /* ── status LED helper ── */
    setStatus(state) {
        this.led.classList.remove('on', 'err');
        switch (state) {
            case 'ok':
                this.led.classList.add('on');
                this.statusText.textContent = 'ONLINE';
                break;
            case 'err':
                this.led.classList.add('err');
                this.statusText.textContent = 'OFFLINE';
                break;
            case 'connecting':
                this.statusText.textContent = 'CONNECTING';
                break;
        }
    }

    async waitForModel() {
        this.network = new NeuralNetwork();
        this.predictBtn.disabled = true;

        const connected = await this.network.initialize();

        if (connected) {
            this.setStatus('ok');
            this.digitEl.textContent  = '?';
            this.confEl.textContent   = 'Draw a digit';
            this.predictBtn.disabled  = false;
        } else {
            this.setStatus('err');
            this.digitEl.textContent  = '!';
            this.confEl.textContent   = 'Run: python server.py';
            this.predictBtn.disabled  = false;
        }
        this.visualizer.renderEmpty();
    }

    init() {
        this.setupCanvas();
        this.setupPixelPreview();
        this.setupProbabilityBars();
        this.bindEvents();
        this.visualizer.renderEmpty();
    }

    setupCanvas() {
        this.drawingCtx.fillStyle   = '#000';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.drawingCtx.lineCap     = 'round';
        this.drawingCtx.lineJoin    = 'round';
        this.drawingCtx.strokeStyle = '#fff';
        this.drawingCtx.lineWidth   = this.brushSize;

        this.brushSlider.value       = this.brushSize;
        this.brushValue.textContent  = this.brushSize;
    }

    setupPixelPreview() {
        this.pixelPreview.innerHTML = '';
        for (let i = 0; i < 28 * 28; i++) {
            const p = document.createElement('div');
            p.className = 'pixel';
            this.pixelPreview.appendChild(p);
        }
    }

    setupProbabilityBars() {
        this.barsEl.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const row = document.createElement('div');
            row.className = 'prob-row';
            row.innerHTML = `
                <span class="prob-label" id="prob-label-${i}">${i}</span>
                <div class="prob-bar-container">
                    <div class="prob-bar" id="prob-bar-${i}" style="width:0%"></div>
                </div>
                <span class="prob-value" id="prob-value-${i}">0%</span>
            `;
            this.barsEl.appendChild(row);
        }
    }

    /* ── events ── */
    bindEvents() {
        this.drawingCanvas.addEventListener('mousedown',  e => this.startDrawing(e));
        this.drawingCanvas.addEventListener('mousemove',  e => this.draw(e));
        this.drawingCanvas.addEventListener('mouseup',    () => this.stopDrawing());
        this.drawingCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        this.drawingCanvas.addEventListener('touchstart', e => this.handleTouch(e, 'start'), { passive: false });
        this.drawingCanvas.addEventListener('touchmove',  e => this.handleTouch(e, 'move'),  { passive: false });
        this.drawingCanvas.addEventListener('touchend',   () => this.stopDrawing());

        this.clearBtn.addEventListener('click',   () => this.clearCanvas());
        this.predictBtn.addEventListener('click', () => this.predict());

        this.brushSlider.addEventListener('input', e => {
            this.brushSize = parseInt(e.target.value);
            this.brushValue.textContent = this.brushSize;
            this.drawingCtx.lineWidth = this.brushSize;
        });

        window.addEventListener('resize', () => this.visualizer.renderEmpty());
    }

    getCanvasCoordinates(e) {
        const r  = this.drawingCanvas.getBoundingClientRect();
        const sx = this.drawingCanvas.width  / r.width;
        const sy = this.drawingCanvas.height / r.height;
        return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }

    handleTouch(e, type) {
        e.preventDefault();
        const t = e.touches[0];
        const me = { clientX: t.clientX, clientY: t.clientY };
        if (type === 'start') this.startDrawing(me);
        else this.draw(me);
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.lastPos = this.getCanvasCoordinates(e);
        this.drawingCtx.beginPath();
        this.drawingCtx.arc(this.lastPos.x, this.lastPos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.drawingCtx.fillStyle = '#fff';
        this.drawingCtx.fill();
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getCanvasCoordinates(e);
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(this.lastPos.x, this.lastPos.y);
        this.drawingCtx.lineTo(pos.x, pos.y);
        this.drawingCtx.stroke();
        this.lastPos = pos;

        if (this.predictionTimeout) clearTimeout(this.predictionTimeout);
        this.predictionTimeout = setTimeout(() => this.predict(), 100);
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.lastPos = null;
            this.predict();
        }
    }

    clearCanvas() {
        this.drawingCtx.fillStyle = '#000';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.digitEl.textContent = '?';
        this.confEl.textContent  = 'Draw a digit';
        this.confEl.classList.remove('high');

        for (let i = 0; i < 10; i++) {
            const bar = document.getElementById(`prob-bar-${i}`);
            const lbl = document.getElementById(`prob-label-${i}`);
            bar.style.width = '0%';
            bar.classList.remove('winner');
            lbl.classList.remove('winner');
            document.getElementById(`prob-value-${i}`).textContent = '0%';
        }
        this.pixelPreview.querySelectorAll('.pixel').forEach(p => p.style.backgroundColor = '#000');
        this.visualizer.renderEmpty();
    }

    getPixelData() {
        const tc = document.createElement('canvas');
        tc.width = 28; tc.height = 28;
        const tctx = tc.getContext('2d');
        tctx.imageSmoothingEnabled = true;
        tctx.imageSmoothingQuality = 'high';
        tctx.drawImage(this.drawingCanvas, 0, 0, 28, 28);

        const id = tctx.getImageData(0, 0, 28, 28);
        const px = [];
        for (let i = 0; i < id.data.length; i += 4) px.push(id.data[i] / 255);
        this.updatePixelPreview(px);
        return px;
    }

    updatePixelPreview(pixels) {
        const cells = this.pixelPreview.querySelectorAll('.pixel');
        pixels.forEach((v, i) => {
            const b = Math.floor(v * 255);
            cells[i].style.backgroundColor = `rgb(${b},${b},${b})`;
        });
    }

    async predict() {
        if (!this.network || !this.network.isReady) {
            const ok = await this.network.initialize();
            if (!ok) { this.confEl.textContent = 'Server offline'; this.setStatus('err'); return; }
            this.setStatus('ok');
        }

        const pixels = this.getPixelData();
        if (pixels.reduce((s, p) => s + p, 0) < 3) return;

        const result = await this.network.predict(pixels);
        if (result.error) { this.confEl.textContent = result.error; return; }

        this.updateReadout(result);
        this.visualizer.render(this.network);
    }

    updateReadout(result) {
        this.digitEl.textContent = result.digit;
        this.digitEl.classList.add('active');
        setTimeout(() => this.digitEl.classList.remove('active'), 300);

        const pct = (result.confidence * 100).toFixed(1);
        this.confEl.textContent = pct + ' %';
        if (result.confidence > 0.8) this.confEl.classList.add('high');
        else this.confEl.classList.remove('high');

        result.probabilities.forEach((prob, i) => {
            const p = (prob * 100).toFixed(1);
            const bar = document.getElementById(`prob-bar-${i}`);
            const val = document.getElementById(`prob-value-${i}`);
            const lbl = document.getElementById(`prob-label-${i}`);

            bar.style.width    = p + '%';
            val.textContent    = p + '%';

            if (i === result.digit) {
                bar.classList.add('winner');
                lbl.classList.add('winner');
            } else {
                bar.classList.remove('winner');
                lbl.classList.remove('winner');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DigitRecognitionApp();
});