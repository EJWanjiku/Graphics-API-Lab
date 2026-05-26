/** EJ Reef — Multimedia Canvas Application */

const canvas = document.getElementById("reefCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;


const pointer = { x: WIDTH * 0.5, y: HEIGHT * 0.35, active: false };

/** Object 1: Bioluminescent jellyfish */
const jellyfish = {
  type: "jellyfish",
  x: WIDTH * 0.28,
  y: HEIGHT * 0.38,
  radius: 42,
  bellHue: 190,
  pulsePhase: 0,
  tentacleCount: 7,
  tentacleLength: 78,
  vx: 0,
  vy: 0,
};

/** Object 2: Branching coral colony */
const coral = {
  type: "coral",
  anchorX: WIDTH * 0.72,
  anchorY: HEIGHT - 28,
  branches: buildCoralBranches(9, 68, 0.78),
  swayPhase: 0,
  glowHue: 320,
};

/** Ambient floating spores released on click */
const spores = [];

/** Background light rays for depth */
const lightRays = Array.from({ length: 6 }, (_, i) => ({
  x: WIDTH * (0.12 + i * 0.16),
  width: 36 + i * 8,
  drift: Math.random() * Math.PI * 2,
}));

// ---------------------------------------------------------------------------
// APPLICATION STAGE — Procedural data generation (coral branch topology)
// ---------------------------------------------------------------------------

function buildCoralBranches(count, length, decay) {
  const branches = [];
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI * 0.85 + (i / (count - 1)) * Math.PI * 0.7;
    branches.push({
      angle,
      length,
      thickness: 10 - i * 0.35,
      children: i % 2 === 0
        ? [{ angle: -0.55, length: length * decay * 0.62, thickness: 4.5 }]
        : [{ angle: 0.48, length: length * decay * 0.55, thickness: 4 }],
    });
  }
  return branches;
}

// ---------------------------------------------------------------------------
// APPLICATION STAGE — Input handling updates scene intent
// ---------------------------------------------------------------------------

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  pointer.y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  pointer.active = true;
});

canvas.addEventListener("mouseleave", () => {
  pointer.active = false;
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  spawnSporeBurst(x, y);
});

function spawnSporeBurst(x, y) {
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
    const speed = 0.6 + Math.random() * 1.4;
    spores.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      life: 1,
      hue: 160 + Math.random() * 120,
      size: 2 + Math.random() * 3,
    });
  }
}

// ---------------------------------------------------------------------------
// APPLICATION STAGE — Per-frame simulation (physics & animation rules)
// ---------------------------------------------------------------------------

function updateApplication(delta) {
  // Jellyfish seeks pointer with gentle easing
  const targetX = pointer.active ? pointer.x : WIDTH * 0.5;
  const targetY = pointer.active ? pointer.y : HEIGHT * 0.32;
  jellyfish.vx += (targetX - jellyfish.x) * 0.0018;
  jellyfish.vy += (targetY - jellyfish.y) * 0.0018;
  jellyfish.vx *= 0.96;
  jellyfish.vy *= 0.96;
  jellyfish.x += jellyfish.vx * delta;
  jellyfish.y += jellyfish.vy * delta;
  jellyfish.x = clamp(jellyfish.x, 60, WIDTH - 60);
  jellyfish.y = clamp(jellyfish.y, 70, HEIGHT - 120);
  jellyfish.pulsePhase += delta * 0.004;

  // Coral sways with a slow underwater current
  coral.swayPhase += delta * 0.0012;

  // Spores drift upward and fade
  for (let i = spores.length - 1; i >= 0; i -= 1) {
    const spore = spores[i];
    spore.x += spore.vx * delta * 0.06;
    spore.y += spore.vy * delta * 0.06;
    spore.vy -= 0.002 * delta;
    spore.life -= 0.0016 * delta;
    if (spore.life <= 0) spores.splice(i, 1);
  }

  for (const ray of lightRays) {
    ray.drift += delta * 0.0004;
  }
}

// ---------------------------------------------------------------------------
// GEOMETRY STAGE — Transform vertices from local/model space to world space
// ---------------------------------------------------------------------------

function transformPoint(x, y, transform) {
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  const scaledX = x * transform.scaleX;
  const scaledY = y * transform.scaleY;
  return {
    x: transform.x + scaledX * cos - scaledY * sin,
    y: transform.y + scaledX * sin + scaledY * cos,
  };
}

function buildJellyfishGeometry(jf) {
  const pulse = 1 + Math.sin(jf.pulsePhase) * 0.08;
  const bellRadius = jf.radius * pulse;

  const bellOutline = [];
  const segments = 24;
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = Math.PI + t * Math.PI;
    bellOutline.push({
      x: jf.x + Math.cos(angle) * bellRadius,
      y: jf.y + Math.sin(angle) * bellRadius * 0.72,
    });
  }

  const tentacles = [];
  for (let i = 0; i < jf.tentacleCount; i += 1) {
    const spread = (i / (jf.tentacleCount - 1) - 0.5) * 0.9;
    const baseX = jf.x + spread * bellRadius * 0.85;
    const baseY = jf.y + bellRadius * 0.15;
    const points = [{ x: baseX, y: baseY }];

    const segmentsCount = 6;
    for (let s = 1; s <= segmentsCount; s += 1) {
      const progress = s / segmentsCount;
      const wave = Math.sin(jf.pulsePhase * 1.6 + i * 0.7 + progress * 4) * 12;
      points.push({
        x: baseX + wave * progress,
        y: baseY + progress * jf.tentacleLength,
      });
    }
    tentacles.push(points);
  }

  const innerGlow = { x: jf.x, y: jf.y - bellRadius * 0.15, radius: bellRadius * 0.55 };

  return { bellOutline, tentacles, innerGlow, bellRadius };
}

function buildCoralGeometry(c) {
  const sway = Math.sin(c.swayPhase) * 0.08;
  const polypPoints = [];

  function walkBranch(originX, originY, branch, depth) {
    const end = transformPoint(branch.length, 0, {
      x: originX,
      y: originY,
      rotation: branch.angle + sway * (1 + depth * 0.3),
      scaleX: 1,
      scaleY: 1,
    });

    const segment = { x1: originX, y1: originY, x2: end.x, y2: end.y, thickness: branch.thickness };

    const children = (branch.children || []).map((child) =>
      walkBranch(end.x, end.y, child, depth + 1)
    );

    polypPoints.push({ x: end.x, y: end.y, size: 3 + depth });

    return { segment, children, polypPoints: [{ x: end.x, y: end.y, size: 3 + depth }] };
  }

  const tree = c.branches.map((branch) => walkBranch(c.anchorX, c.anchorY, branch, 0));

  return { tree, sway };
}

function buildRayGeometry(time) {
  return lightRays.map((ray) => {
    const tilt = Math.sin(ray.drift) * 0.18;
    const topX = ray.x + Math.sin(time * 0.0003 + ray.drift) * 30;
    return {
      points: [
        { x: topX - ray.width, y: 0 },
        { x: topX + ray.width, y: 0 },
        { x: topX + ray.width * 2.5 + tilt * 80, y: HEIGHT },
        { x: topX - ray.width * 2.5 + tilt * 80, y: HEIGHT },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// RASTERIZATION STAGE — Convert geometric primitives to canvas pixels
// ---------------------------------------------------------------------------

function rasterizeBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#062a45");
  gradient.addColorStop(0.45, "#041726");
  gradient.addColorStop(1, "#010a12");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function rasterizeLightRays(rays) {
  for (const ray of rays) {
    ctx.beginPath();
    ctx.moveTo(ray.points[0].x, ray.points[0].y);
    for (let i = 1; i < ray.points.length; i += 1) {
      ctx.lineTo(ray.points[i].x, ray.points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(125, 211, 252, 0.035)";
    ctx.fill();
  }
}

function rasterizeSandFloor() {
  const floorGradient = ctx.createLinearGradient(0, HEIGHT - 80, 0, HEIGHT);
  floorGradient.addColorStop(0, "rgba(15, 45, 60, 0.2)");
  floorGradient.addColorStop(1, "rgba(8, 20, 30, 0.95)");
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, HEIGHT - 80, WIDTH, 80);

  ctx.fillStyle = "rgba(45, 212, 191, 0.08)";
  for (let x = 0; x < WIDTH; x += 18) {
    ctx.beginPath();
    ctx.ellipse(x + (x % 36), HEIGHT - 12, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function rasterizeJellyfish(geometry, hue) {
  const { bellOutline, tentacles, innerGlow } = geometry;

  for (const tentacle of tentacles) {
    ctx.beginPath();
    ctx.moveTo(tentacle[0].x, tentacle[0].y);
    for (let i = 1; i < tentacle.length; i += 1) {
      const prev = tentacle[i - 1];
      const curr = tentacle[i];
      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
    }
    ctx.strokeStyle = `hsla(${hue}, 85%, 70%, 0.55)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(bellOutline[0].x, bellOutline[0].y);
  for (let i = 1; i < bellOutline.length; i += 1) {
    ctx.lineTo(bellOutline[i].x, bellOutline[i].y);
  }
  ctx.closePath();
  const bellGradient = ctx.createRadialGradient(
    innerGlow.x,
    innerGlow.y,
    4,
    innerGlow.x,
    innerGlow.y,
    innerGlow.radius * 1.8
  );
  bellGradient.addColorStop(0, `hsla(${hue}, 90%, 75%, 0.95)`);
  bellGradient.addColorStop(0.55, `hsla(${hue + 20}, 80%, 55%, 0.55)`);
  bellGradient.addColorStop(1, `hsla(${hue + 40}, 70%, 45%, 0.05)`);
  ctx.fillStyle = bellGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(innerGlow.x, innerGlow.y, innerGlow.radius, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.35)`;
  ctx.fill();
}

function rasterizeCoralNode(node, hue, sway) {
  const { segment, children } = node;
  ctx.beginPath();
  ctx.moveTo(segment.x1, segment.y1);
  ctx.lineTo(segment.x2, segment.y2);
  ctx.strokeStyle = `hsla(${hue}, 70%, 58%, 0.85)`;
  ctx.lineWidth = segment.thickness;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(segment.x2, segment.y2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue + 30}, 90%, 72%, 0.9)`;
  ctx.fill();

  for (const child of children) {
    rasterizeCoralNode(child, hue, sway);
  }
}

function rasterizeCoral(geometry, hue) {
  for (const branch of geometry.tree) {
    rasterizeCoralNode(branch, hue, geometry.sway);
  }

  ctx.beginPath();
  ctx.ellipse(
    coral.anchorX,
    coral.anchorY + 6,
    48,
    14,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = `hsla(${hue}, 55%, 42%, 0.75)`;
  ctx.fill();
}

function rasterizeSpores() {
  for (const spore of spores) {
    ctx.beginPath();
    ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${spore.hue}, 90%, 70%, ${spore.life * 0.85})`;
    ctx.fill();
  }
}

function rasterizeCaustics(time) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 5; i += 1) {
    const x = (Math.sin(time * 0.0005 + i) * 0.5 + 0.5) * WIDTH;
    const y = HEIGHT * 0.25 + i * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, 90, 28, Math.sin(time * 0.0007 + i) * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(56, 189, 248, 0.04)";
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main render loop — orchestrates all three pipeline stages each frame
// ---------------------------------------------------------------------------

let lastTime = performance.now();

function renderFrame(now) {
  const delta = now - lastTime;
  lastTime = now;

  // Stage 1: Application — update scene state
  updateApplication(delta);

  // Stage 2: Geometry — compute world-space primitives
  const jellyGeometry = buildJellyfishGeometry(jellyfish);
  const coralGeometry = buildCoralGeometry(coral);
  const rayGeometry = buildRayGeometry(now);

  // Stage 3: Rasterization — draw to framebuffer (canvas pixels)
  rasterizeBackground();
  rasterizeLightRays(rayGeometry);
  rasterizeCaustics(now);
  rasterizeSandFloor();
  rasterizeCoral(coralGeometry, coral.glowHue);
  rasterizeJellyfish(jellyGeometry, jellyfish.bellHue);
  rasterizeSpores();

  requestAnimationFrame(renderFrame);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

requestAnimationFrame(renderFrame);
