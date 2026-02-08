/**
 * Network Visualization — "Oscilloscope" renderer
 * Warm amber / teal on near-black CRT background
 */

class NetworkVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.dpr = window.devicePixelRatio || 1;

        this.layerPositions = [];
        this.nodeRadius = 8;

        // Analog-instrument palette
        this.colors = {
            hot:        '#E8A44A',   // ember / amber
            hotGlow:    'rgba(232,164,74,0.55)',
            cool:       '#3EC9A7',   // teal
            coolGlow:   'rgba(62,201,167,0.45)',
            dim:        '#2E2C28',
            dimStroke:  '#4E4B47',
            bg:         '#0E110D',
            text:       '#F0EBE1',
            textDim:    '#918C82',
            wire:       'rgba(232,164,74,0.25)',
            wireHot:    'rgba(62,201,167,0.6)',
        };

        this.setupLayers();
    }

    /* ── fit canvas to parent container ── */
    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        this.canvas.width  = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.width  = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.width  = w;
        this.height = h;
        this.setupLayers();
    }

    setupLayers() {
        const pad = 70;
        const sp  = (this.width - 2 * pad) / 3;

        this.layerPositions = [
            { x: pad,          name: 'INPUT',    sub: '784',  displaySize: 16 },
            { x: pad + sp,     name: 'HIDDEN-1', sub: '128',  displaySize: 16 },
            { x: pad + sp * 2, name: 'HIDDEN-2', sub: '64',   displaySize: 14 },
            { x: pad + sp * 3, name: 'OUTPUT',   sub: '10',   displaySize: 10 },
        ];
    }

    clear() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // subtle cross-hatch grid (oscilloscope reticle)
        ctx.strokeStyle = 'rgba(240,235,225,0.03)';
        ctx.lineWidth = 0.5;
        const g = 28;
        for (let x = 0; x < this.width; x += g) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (let y = 0; y < this.height; y += g) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }
    }

    getNodePositions(layerIndex, numNodes) {
        const layer = this.layerPositions[layerIndex];
        const dn = Math.min(numNodes, layer.displaySize);
        const topPad = 40, botPad = 48;
        const avail = this.height - topPad - botPad;
        const sp = avail / (dn - 1 || 1);
        const positions = [];
        for (let i = 0; i < dn; i++) {
            positions.push({
                x: layer.x,
                y: topPad + i * sp,
                nodeIndex: Math.floor(i * numNodes / dn)
            });
        }
        return positions;
    }

    /* ── connections ── */
    drawConnections(srcPos, tgtPos, srcAct, tgtAct) {
        if (!srcAct || !tgtAct) return;
        const ctx = this.ctx;

        for (let s = 0; s < srcPos.length; s++) {
            const sp = srcPos[s];
            const sa = Math.abs(srcAct[sp.nodeIndex] || 0);
            if (sa < 0.04) continue;

            for (let t = 0; t < tgtPos.length; t++) {
                const tp = tgtPos[t];
                const ta = Math.abs(tgtAct[tp.nodeIndex] || 0);
                if (ta < 0.04) continue;

                const strength = Math.sqrt(sa * ta);
                const alpha = Math.min(0.55, strength * 0.8);
                if (alpha < 0.04) continue;

                // warm amber → teal gradient
                const grad = ctx.createLinearGradient(sp.x, sp.y, tp.x, tp.y);
                grad.addColorStop(0,   `rgba(232,164,74,${alpha * 0.45})`);
                grad.addColorStop(0.5, `rgba(62,201,167,${alpha})`);
                grad.addColorStop(1,   `rgba(232,164,74,${alpha * 0.45})`);

                ctx.beginPath();
                ctx.moveTo(sp.x, sp.y);
                ctx.lineTo(tp.x, tp.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = Math.max(0.4, strength * 2);
                ctx.stroke();
            }
        }
    }

    /* ── single node ── */
    drawNode(x, y, activation, isOutput = false, label = null) {
        const ctx = this.ctx;
        const r = isOutput ? this.nodeRadius + 3 : this.nodeRadius;
        const act = activation || 0;

        let fill, stroke, glow;

        if (act > 0.5) {
            const t = Math.min(1, act);
            fill   = `rgba(62,201,167,${0.55 + t * 0.45})`;
            stroke = '#3EC9A7';
            glow   = this.colors.coolGlow;
        } else if (act > 0.1) {
            const t = act / 0.5;
            fill   = `rgba(232,164,74,${0.35 + t * 0.5})`;
            stroke = '#E8A44A';
            glow   = this.colors.hotGlow;
        } else {
            fill   = this.colors.dim;
            stroke = this.colors.dimStroke;
            glow   = null;
        }

        // glow ring
        if (glow) {
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = act > 0.5 ? 14 : 7;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.restore();
        }

        // solid disc
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // output digit labels
        if (label !== null) {
            ctx.fillStyle = act > 0.3 ? '#0E110D' : this.colors.text;
            ctx.font = `bold 10px 'IBM Plex Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
        }
    }

    drawLayerLabels() {
        const ctx = this.ctx;
        this.layerPositions.forEach(layer => {
            ctx.fillStyle = this.colors.textDim;
            ctx.font = `600 9px 'IBM Plex Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.letterSpacing = '1px';
            ctx.fillText(layer.name, layer.x, this.height - 30);

            ctx.fillStyle = this.colors.textDim;
            ctx.font = `400 8px 'IBM Plex Mono', monospace`;
            ctx.fillText(layer.sub + ' n', layer.x, this.height - 18);
        });
    }

    /* ── main render ── */
    render(network) {
        this.resize();
        this.clear();

        const activations   = network.getActivations();
        const architecture  = network.getArchitecture();

        const ip = this.getNodePositions(0, architecture.layers[0].size);
        const h1 = this.getNodePositions(1, architecture.layers[1].size);
        const h2 = this.getNodePositions(2, architecture.layers[2].size);
        const op = this.getNodePositions(3, architecture.layers[3].size);

        // connections back-to-front
        if (activations.hidden2 && activations.output)
            this.drawConnections(h2, op, activations.hidden2, activations.output);
        if (activations.hidden1 && activations.hidden2)
            this.drawConnections(h1, h2, activations.hidden1, activations.hidden2);
        if (activations.input && activations.hidden1)
            this.drawConnections(ip, h1, activations.input, activations.hidden1);

        // nodes
        ip.forEach(p => this.drawNode(p.x, p.y, activations.input  ? activations.input[p.nodeIndex]  : 0));
        h1.forEach(p => this.drawNode(p.x, p.y, activations.hidden1? activations.hidden1[p.nodeIndex]: 0));
        h2.forEach(p => this.drawNode(p.x, p.y, activations.hidden2? activations.hidden2[p.nodeIndex]: 0));
        op.forEach(p => this.drawNode(p.x, p.y, activations.output ? activations.output[p.nodeIndex] : 0, true, p.nodeIndex.toString()));

        this.drawLayerLabels();
    }

    renderEmpty() {
        this.resize();
        this.clear();

        this.layerPositions.forEach((layer, li) => {
            const pos = this.getNodePositions(li, layer.displaySize);
            pos.forEach(p => {
                this.drawNode(p.x, p.y, 0, li === 3, li === 3 ? p.nodeIndex.toString() : null);
            });
        });

        this.drawLayerLabels();

        // hint
        this.ctx.fillStyle = this.colors.textDim;
        this.ctx.font = `500 11px 'DM Sans', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Draw a digit to see activations', this.width / 2, 20);
    }
}

window.NetworkVisualizer = NetworkVisualizer;