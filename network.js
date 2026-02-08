/**
 * Neural Network Client - Python Backend Communication
 * Sends requests to Flask server for accurate MNIST predictions
 */

class NeuralNetwork {
    constructor() {
        this.isReady = false;
        // Use relative URL for production, localhost for development
        this.serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:5000' 
            : '';
        this.layerActivations = {
            input: new Array(784).fill(0),
            hidden1: new Array(128).fill(0),
            hidden2: new Array(64).fill(0),
            output: new Array(10).fill(0)
        };
        
        // Architecture info for visualization
        this.architecture = {
            layers: [
                { name: 'input', size: 784 },
                { name: 'hidden1', size: 128 },
                { name: 'hidden2', size: 64 },
                { name: 'output', size: 10 }
            ]
        };
        
        // Simulated weights for visualization (we'll compute from activations)
        this.weights = {
            weights1: null,
            weights2: null,
            weights3: null
        };
    }

    async initialize() {
        try {
            // Check if server is running
            const response = await fetch(`${this.serverUrl}/health`, {
                method: 'GET',
                timeout: 3000
            });
            const data = await response.json();
            
            if (data.status === 'ok' && data.model_loaded) {
                this.isReady = true;
                console.log('Connected to Python backend successfully!');
                return true;
            } else {
                console.error('Server is running but model not loaded');
                this.isReady = false;
                return false;
            }
        } catch (error) {
            console.error('Cannot connect to Python backend:', error.message);
            console.log('Make sure to run: python server.py');
            this.isReady = false;
            return false;
        }
    }

    async predict(pixelData) {
        if (!this.isReady) {
            // Try to reconnect
            const connected = await this.initialize();
            
            if (!connected) {
                return { 
                    digit: -1, 
                    confidence: 0, 
                    probabilities: new Array(10).fill(0.1),
                    error: 'Server not available. Run: python server.py'
                };
            }
        }

        try {
            // Store input for visualization
            this.layerActivations.input = Array.from(pixelData);
            
            const response = await fetch(`${this.serverUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pixels: Array.from(pixelData) })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                console.error('Prediction error:', result.error);
                return { 
                    digit: -1, 
                    confidence: 0, 
                    probabilities: new Array(10).fill(0.1) 
                };
            }

            // Update activations for visualization
            if (result.activations) {
                // Normalize activations for visualization
                const normalizeArray = (arr, targetSize) => {
                    if (!arr || arr.length === 0) return new Array(targetSize).fill(0);
                    const max = Math.max(...arr.map(Math.abs));
                    const normalized = arr.map(v => max > 0 ? v / max : 0);
                    // Pad or truncate to target size
                    while (normalized.length < targetSize) normalized.push(0);
                    return normalized.slice(0, targetSize);
                };
                
                this.layerActivations.hidden1 = normalizeArray(result.activations.hidden1, 128);
                this.layerActivations.hidden2 = normalizeArray(result.activations.hidden2, 64);
            }
            this.layerActivations.output = result.probabilities;
            
            // Generate visualization weights based on activations
            this.generateVisualizationWeights();

            return {
                digit: result.digit,
                confidence: result.confidence,
                probabilities: result.probabilities
            };

        } catch (error) {
            console.error('Request failed:', error);
            this.isReady = false;
            return { 
                digit: -1, 
                confidence: 0, 
                probabilities: new Array(10).fill(0.1),
                error: 'Connection lost. Reconnecting...'
            };
        }
    }
    
    generateVisualizationWeights() {
        // Generate pseudo-weights based on activation patterns for visualization
        // These show which connections are "active" based on input-output correlation
        
        const input = this.layerActivations.input;
        const hidden1 = this.layerActivations.hidden1;
        const hidden2 = this.layerActivations.hidden2;
        const output = this.layerActivations.output;
        
        // weights1: input -> hidden1 (simplified)
        this.weights.weights1 = {};
        for (let h = 0; h < 20; h++) {
            this.weights.weights1[h] = {};
            for (let i = 0; i < 20; i++) {
                const inputIdx = Math.floor(i * 784 / 20);
                this.weights.weights1[h][inputIdx] = (input[inputIdx] || 0) * (hidden1[h] || 0);
            }
        }
        
        // weights2: hidden1 -> hidden2
        this.weights.weights2 = {};
        for (let h2 = 0; h2 < 20; h2++) {
            this.weights.weights2[h2] = {};
            for (let h1 = 0; h1 < 20; h1++) {
                this.weights.weights2[h2][h1] = (hidden1[h1] || 0) * (hidden2[h2] || 0);
            }
        }
        
        // weights3: hidden2 -> output
        this.weights.weights3 = {};
        for (let o = 0; o < 10; o++) {
            this.weights.weights3[o] = {};
            for (let h2 = 0; h2 < 20; h2++) {
                this.weights.weights3[o][h2] = (hidden2[h2] || 0) * (output[o] || 0);
            }
        }
    }

    getActivations() {
        return this.layerActivations;
    }
    
    getWeights() {
        return this.weights;
    }
    
    getArchitecture() {
        return this.architecture;
    }
}