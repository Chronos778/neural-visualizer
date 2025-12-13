/**
 * Main Application Module
 */

class DigitRecognitionApp {
    constructor() {
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.networkCanvas = document.getElementById('networkCanvas');
        
        this.clearBtn = document.getElementById('clearBtn');
        this.predictBtn = document.getElementById('predictBtn');
        this.brushSizeSlider = document.getElementById('brushSize');
        this.brushSizeValue = document.getElementById('brushSizeValue');
        this.predictedDigit = document.getElementById('predictedDigit');
        this.confidence = document.getElementById('confidence');
        this.probabilityBars = document.getElementById('probabilityBars');
        this.pixelPreview = document.getElementById('pixelPreview');
        
        this.isDrawing = false;
        this.brushSize = 22;
        this.lastPos = null;
        this.predictionTimeout = null;
        
        this.visualizer = new NetworkVisualizer(this.networkCanvas);
        
        this.showLoadingState();
        this.waitForModel();
        this.init();
    }

    showLoadingState() {
        this.predictedDigit.textContent = '...';
        this.confidence.textContent = 'Connecting to server...';
        this.predictBtn.disabled = true;
        this.predictBtn.textContent = 'Loading...';
    }

    async waitForModel() {
        this.network = new NeuralNetwork();
        const connected = await this.network.initialize();
        
        if (connected) {
            this.predictedDigit.textContent = '?';
            this.confidence.textContent = 'Draw a digit';
            this.predictBtn.disabled = false;
            this.predictBtn.textContent = 'Predict';
        } else {
            this.predictedDigit.textContent = '!';
            this.confidence.textContent = 'Server not running. Run: python server.py';
            this.predictBtn.disabled = false;
            this.predictBtn.textContent = 'Retry';
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
        this.drawingCtx.fillStyle = '#000000';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        this.drawingCtx.strokeStyle = '#ffffff';
        this.drawingCtx.lineWidth = this.brushSize;
        
        // Set brush size slider default
        this.brushSizeSlider.value = this.brushSize;
        this.brushSizeValue.textContent = this.brushSize;
    }

    setupPixelPreview() {
        this.pixelPreview.innerHTML = '';
        for (let i = 0; i < 28 * 28; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            this.pixelPreview.appendChild(pixel);
        }
    }

    setupProbabilityBars() {
        this.probabilityBars.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const row = document.createElement('div');
            row.className = 'prob-row';
            row.innerHTML = `
                <span class="prob-label" id="prob-label-${i}">${i}</span>
                <div class="prob-bar-container">
                    <div class="prob-bar" id="prob-bar-${i}" style="width: 0%"></div>
                </div>
                <span class="prob-value" id="prob-value-${i}">0%</span>
            `;
            this.probabilityBars.appendChild(row);
        }
    }

    bindEvents() {
        this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawingCanvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        this.drawingCanvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'), { passive: false });
        this.drawingCanvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'), { passive: false });
        this.drawingCanvas.addEventListener('touchend', () => this.stopDrawing());
        
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.predictBtn.addEventListener('click', () => this.predict());
        
        this.brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.brushSizeValue.textContent = this.brushSize;
            this.drawingCtx.lineWidth = this.brushSize;
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        const scaleX = this.drawingCanvas.width / rect.width;
        const scaleY = this.drawingCanvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleTouch(e, type) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
        
        if (type === 'start') this.startDrawing(mouseEvent);
        else if (type === 'move') this.draw(mouseEvent);
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.lastPos = this.getCanvasCoordinates(e);
        
        this.drawingCtx.beginPath();
        this.drawingCtx.arc(this.lastPos.x, this.lastPos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.drawingCtx.fillStyle = '#ffffff';
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
        this.drawingCtx.fillStyle = '#000000';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        this.predictedDigit.textContent = '?';
        this.confidence.textContent = 'Draw a digit';
        
        for (let i = 0; i < 10; i++) {
            document.getElementById(`prob-bar-${i}`).style.width = '0%';
            document.getElementById(`prob-bar-${i}`).classList.remove('winner');
            document.getElementById(`prob-value-${i}`).textContent = '0%';
        }
        
        const pixels = this.pixelPreview.querySelectorAll('.pixel');
        pixels.forEach(pixel => pixel.style.backgroundColor = '#000');
        
        this.visualizer.renderEmpty();
    }

    getPixelData() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Use better interpolation
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(this.drawingCanvas, 0, 0, 28, 28);
        
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const pixels = [];
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const gray = imageData.data[i] / 255;
            pixels.push(gray);
        }
        
        this.updatePixelPreview(pixels);
        return pixels;
    }

    updatePixelPreview(pixels) {
        const previewPixels = this.pixelPreview.querySelectorAll('.pixel');
        pixels.forEach((value, i) => {
            const brightness = Math.floor(value * 255);
            previewPixels[i].style.backgroundColor = `rgb(${brightness}, ${brightness}, ${brightness})`;
        });
    }

    async predict() {
        if (!this.network || !this.network.isReady) {
            // Try to reconnect
            const connected = await this.network.initialize();
            if (!connected) {
                this.confidence.textContent = 'Server not running. Run: python server.py';
                return;
            }
        }
        
        const pixels = this.getPixelData();
        const totalBrightness = pixels.reduce((sum, p) => sum + p, 0);
        if (totalBrightness < 3) return;
        
        const result = await this.network.predict(pixels);
        
        if (result.error) {
            this.confidence.textContent = result.error;
            return;
        }
        
        this.updatePredictionDisplay(result);
        this.visualizer.render(this.network);
    }

    updatePredictionDisplay(result) {
        this.predictedDigit.textContent = result.digit;
        const confidencePercent = (result.confidence * 100).toFixed(1);
        this.confidence.textContent = `Confidence: ${confidencePercent}%`;
        
        // Add high confidence styling
        if (result.confidence > 0.8) {
            this.confidence.classList.add('high');
        } else {
            this.confidence.classList.remove('high');
        }
        
        // Add active class to prediction display
        this.predictedDigit.parentElement.classList.add('active');
        
        result.probabilities.forEach((prob, i) => {
            const percentage = (prob * 100).toFixed(1);
            const bar = document.getElementById(`prob-bar-${i}`);
            const value = document.getElementById(`prob-value-${i}`);
            const label = document.getElementById(`prob-label-${i}`);
            
            bar.style.width = `${percentage}%`;
            value.textContent = `${percentage}%`;
            
            if (i === result.digit) {
                bar.classList.add('winner');
                if (label) label.classList.add('winner');
            } else {
                bar.classList.remove('winner');
                if (label) label.classList.remove('winner');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DigitRecognitionApp();
});