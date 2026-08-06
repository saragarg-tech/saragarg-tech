/**
 * Bio-Circuit Background Engine
 * Simulates vascular circuit pathways with slow pulsing bio-currents.
 */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'circuit-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;
  let nodes = [];
  let connections = [];
  let pulses = [];

  const MOUSE = { x: -1000, y: -1000, radius: 150 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initCircuit();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    MOUSE.x = e.clientX;
    MOUSE.y = e.clientY;
  });

  class Node {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.neighbors = [];
    }
  }

  class Pulse {
    constructor(startNode, endNode) {
      this.startNode = startNode;
      this.endNode = endNode;
      this.progress = 0;
      this.speed = 0.003 + Math.random() * 0.004; // Slow, fluid movement
      // Hybrid clinical cyan with deep blood-crimson accent pulses
      this.color = Math.random() > 0.3 ? '56, 189, 248' : '225, 29, 72'; 
    }

    update() {
      this.progress += this.speed;
      return this.progress >= 1;
    }

    draw(ctx, globalPulseAlpha) {
      const currentX = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
      const currentY = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

      ctx.beginPath();
      ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${0.8 * globalPulseAlpha})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${this.color}, 1)`;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset blur for performance
    }
  }

  function initCircuit() {
    nodes = [];
    connections = [];
    pulses = [];

    const spacing = 120;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    // Create grid with bio-circuit offsets
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        nodes.push(new Node(i * spacing + offsetX, j * spacing + offsetY));
      }
    }

    // Connect circuit nodes (strictly orthogonal or 45-degree angles)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (dist < spacing * 1.5) {
          nodes[i].neighbors.push(nodes[j]);
          connections.push([nodes[i], nodes[j]]);
        }
      }
    }
  }

  function spawnPulse() {
    if (nodes.length === 0) return;
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    if (randomNode.neighbors.length > 0) {
      const targetNode = randomNode.neighbors[Math.floor(Math.random() * randomNode.neighbors.length)];
      pulses.push(new Pulse(randomNode, targetNode));
    }
  }

  let startTime = Date.now();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const elapsed = (Date.now() - startTime) / 1000;
    
    // Slow, rhythmic vascular pulse cycle (~60 BPM / 1Hz heartbeat cycle)
    const pulseCycle = (Math.sin(elapsed * 2.5) + 1) / 2; // Value between 0 and 1
    const lineAlpha = 0.04 + pulseCycle * 0.08; // Base circuit visibility dynamic glow
    const nodeGlow = 0.1 + pulseCycle * 0.25;

    // Draw static circuit pathways
    ctx.lineWidth = 1;
    connections.forEach(([n1, n2]) => {
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
      ctx.stroke();
    });

    // Draw circuit node joints
    nodes.forEach((node) => {
      const distToMouse = Math.hypot(node.x - MOUSE.x, node.y - MOUSE.y);
      let localAlpha = nodeGlow;

      if (distToMouse < MOUSE.radius) {
        localAlpha += (1 - distToMouse / MOUSE.radius) * 0.5;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 212, 191, ${localAlpha})`;
      ctx.fill();
    });

    // Spawn new blood-flow pulse packets continuously
    if (Math.random() < 0.15) {
      spawnPulse();
    }

    // Update and render pulse packets
    for (let i = pulses.length - 1; i >= 0; i--) {
      const isFinished = pulses[i].update();
      pulses[i].draw(ctx, pulseCycle + 0.3);

      if (isFinished) {
        // Chain pulse to next adjacent node to simulate unbroken blood flow
        const nextStart = pulses[i].endNode;
        if (nextStart.neighbors.length > 0 && Math.random() > 0.3) {
          const nextEnd = nextStart.neighbors[Math.floor(Math.random() * nextStart.neighbors.length)];
          pulses[i] = new Pulse(nextStart, nextEnd);
        } else {
          pulses.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(animate);
  }

  // Initialize and start animation
  resize();
  animate();
})();
