/**
 * Network Visualization Module
 * Renders the neural network architecture and activations on canvas
 */

class NetworkVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Visualization settings
        this.layerPositions = [];
        this.nodeRadius = 10;
        this.maxNodesPerLayer = 20;
        
        // Colors - dark theme with glow effects
        this.colors = {
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#3f3f5a',
            background: '#0f0f17',
            cardBg: '#1a1a25',
            text: '#f0f0f5',
            textSecondary: '#8888a0',
            accent: '#6366f1',
            accentGlow: 'rgba(99, 102, 241, 0.5)',
            positiveGlow: 'rgba(16, 185, 129, 0.6)',
            connectionActive: 'rgba(99, 102, 241, 0.4)'
        };
        
        this.setupLayers();
    }

    setupLayers() {
        const padding = 80;
        const layerSpacing = (this.width - 2 * padding) / 3;
        
        this.layerPositions = [
            { x: padding, name: 'Input', subtext: '784 neurons', displaySize: 18 },
            { x: padding + layerSpacing, name: 'Hidden 1', subtext: '128 neurons', displaySize: 18 },
            { x: padding + layerSpacing * 2, name: 'Hidden 2', subtext: '64 neurons', displaySize: 16 },
            { x: padding + layerSpacing * 3, name: 'Output', subtext: '10 classes', displaySize: 10 }
        ];
    }

    clear() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colors.background);
        gradient.addColorStop(1, this.colors.cardBg);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add subtle grid pattern
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    // Calculate node positions for a layer
    getNodePositions(layerIndex, numNodes) {
        const layer = this.layerPositions[layerIndex];
        const displayNodes = Math.min(numNodes, layer.displaySize);
        const positions = [];
        
        const topPadding = 50;
        const bottomPadding = 50;
        const availableHeight = this.height - topPadding - bottomPadding;
        const spacing = availableHeight / (displayNodes - 1 || 1);
        
        for (let i = 0; i < displayNodes; i++) {
            positions.push({
                x: layer.x,
                y: topPadding + i * spacing,
                nodeIndex: Math.floor(i * numNodes / displayNodes)
            });
        }
        
        return positions;
    }

    // Draw connections between layers - simplified version
    drawConnections(sourcePositions, targetPositions, sourceActivations, targetActivations) {
        if (!sourceActivations || !targetActivations) return;
        
        const ctx = this.ctx;
        
        // Draw connections from active source nodes to active target nodes
        for (let s = 0; s < sourcePositions.length; s++) {
            const sourcePos = sourcePositions[s];
            const sourceAct = Math.abs(sourceActivations[sourcePos.nodeIndex] || 0);
            
            if (sourceAct < 0.05) continue;
            
            for (let t = 0; t < targetPositions.length; t++) {
                const targetPos = targetPositions[t];
                const targetAct = Math.abs(targetActivations[targetPos.nodeIndex] || 0);
                
                if (targetAct < 0.05) continue;
                
                const strength = Math.sqrt(sourceAct * targetAct);
                const alpha = Math.min(0.6, strength * 0.9);
                
                if (alpha < 0.05) continue;
                
                // Create gradient for connection
                const gradient = ctx.createLinearGradient(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
                gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha * 0.5})`);
                gradient.addColorStop(0.5, `rgba(16, 185, 129, ${alpha})`);
                gradient.addColorStop(1, `rgba(99, 102, 241, ${alpha * 0.5})`);
                
                ctx.beginPath();
                ctx.moveTo(sourcePos.x, sourcePos.y);
                ctx.lineTo(targetPos.x, targetPos.y);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = Math.max(0.5, strength * 2.5);
                ctx.stroke();
            }
        }
    }

    // Draw a single node with glow effect
    drawNode(x, y, activation, isOutput = false, label = null) {
        const ctx = this.ctx;
        const radius = isOutput ? this.nodeRadius + 4 : this.nodeRadius;
        
        // Determine color and glow based on activation
        let fillColor, glowColor, strokeColor;
        const act = activation || 0;
        
        if (act > 0.5) {
            // High activation - green glow
            const intensity = Math.min(1, act);
            fillColor = `rgba(16, 185, 129, ${0.6 + intensity * 0.4})`;
            glowColor = `rgba(16, 185, 129, ${intensity * 0.8})`;
            strokeColor = '#10b981';
        } else if (act > 0.1) {
            // Medium activation - purple/blue
            const intensity = act / 0.5;
            fillColor = `rgba(99, 102, 241, ${0.4 + intensity * 0.5})`;
            glowColor = `rgba(99, 102, 241, ${intensity * 0.5})`;
            strokeColor = '#6366f1';
        } else {
            // Low/no activation
            fillColor = this.colors.neutral;
            glowColor = 'transparent';
            strokeColor = '#4a4a5a';
        }
        
        // Draw glow effect for active nodes
        if (act > 0.1) {
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = act > 0.5 ? 15 : 8;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.restore();
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Draw label for output nodes
        if (label !== null) {
            ctx.fillStyle = activation > 0.3 ? '#fff' : this.colors.text;
            ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
        }
    }

    // Draw layer labels with modern styling
    drawLayerLabels() {
        const ctx = this.ctx;
        
        this.layerPositions.forEach((layer, index) => {
            // Main label
            ctx.fillStyle = this.colors.text;
            ctx.font = '600 12px Inter, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(layer.name, layer.x, this.height - 35);
            
            // Sub label
            ctx.fillStyle = this.colors.textSecondary;
            ctx.font = '400 10px Inter, -apple-system, sans-serif';
            ctx.fillText(layer.subtext, layer.x, this.height - 20);
        });
    }

    // Draw ellipsis to indicate more nodes
    drawEllipsis(x, y1, y2) {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.textSecondary;
        const midY = (y1 + y2) / 2;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(x, midY + i * 10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Main render function
    render(network) {
        this.clear();
        
        const activations = network.getActivations();
        const architecture = network.getArchitecture();
        
        // Get node positions for each layer
        const inputPositions = this.getNodePositions(0, architecture.layers[0].size);
        const hidden1Positions = this.getNodePositions(1, architecture.layers[1].size);
        const hidden2Positions = this.getNodePositions(2, architecture.layers[2].size);
        const outputPositions = this.getNodePositions(3, architecture.layers[3].size);
        
        // Draw connections (back to front for proper layering)
        if (activations.hidden2 && activations.output) {
            this.drawConnections(
                hidden2Positions, outputPositions, 
                activations.hidden2, activations.output);
        }
        
        if (activations.hidden1 && activations.hidden2) {
            this.drawConnections(
                hidden1Positions, hidden2Positions, 
                activations.hidden1, activations.hidden2);
        }
        
        if (activations.input && activations.hidden1) {
            this.drawConnections(
                inputPositions, hidden1Positions, 
                activations.input, activations.hidden1);
        }
        
        // Draw input layer nodes
        inputPositions.forEach((pos, i) => {
            const activation = activations.input ? activations.input[pos.nodeIndex] : 0;
            this.drawNode(pos.x, pos.y, activation);
        });
        
        // Draw hidden layer 1 nodes
        hidden1Positions.forEach((pos, i) => {
            const activation = activations.hidden1 ? activations.hidden1[pos.nodeIndex] : 0;
            this.drawNode(pos.x, pos.y, activation);
        });
        
        // Draw hidden layer 2 nodes
        hidden2Positions.forEach((pos, i) => {
            const activation = activations.hidden2 ? activations.hidden2[pos.nodeIndex] : 0;
            this.drawNode(pos.x, pos.y, activation);
        });
        
        // Draw output layer nodes with digit labels
        outputPositions.forEach((pos, i) => {
            const activation = activations.output ? activations.output[pos.nodeIndex] : 0;
            this.drawNode(pos.x, pos.y, activation, true, pos.nodeIndex.toString());
        });
        
        // Draw layer labels
        this.drawLayerLabels();
        
        // Draw title with gradient effect
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '600 14px Inter, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Neural Network Architecture', this.width / 2, 25);
    }

    // Render empty state
    renderEmpty() {
        this.clear();
        
        // Draw placeholder nodes
        this.layerPositions.forEach((layer, layerIdx) => {
            const numNodes = layer.displaySize;
            const positions = this.getNodePositions(layerIdx, numNodes);
            
            positions.forEach((pos, i) => {
                this.drawNode(pos.x, pos.y, 0, layerIdx === 3, layerIdx === 3 ? pos.nodeIndex.toString() : null);
            });
        });
        
        this.drawLayerLabels();
        
        // Draw instruction
        this.ctx.fillStyle = this.colors.textSecondary;
        this.ctx.font = '500 14px Inter, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Draw a digit to see activations', this.width / 2, 25);
    }
}

// Export for use in other files
window.NetworkVisualizer = NetworkVisualizer;