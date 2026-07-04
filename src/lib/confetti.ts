let activeRaf: number | null = null;

export function triggerConfetti(gameColor = "#006D77"): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.querySelector('[data-reduce-effects="true"]')) return;

  if (activeRaf !== null) cancelAnimationFrame(activeRaf);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9000;width:100vw;height:100dvh";
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  const palette = [gameColor.startsWith("var(") ? "#006D77" : gameColor, "#fff", "#ffd700", "#52b788", "#ff6b6b", "#a78bfa"];
  const particles = Array.from({ length: 110 }, (_, i) => ({
    x: (i % 2 ? 0.65 : 0.35) * canvas.width,
    y: canvas.height * 0.38,
    vx: (Math.random() - 0.5) * 9,
    vy: -6 - Math.random() * 8,
    size: 5 + Math.random() * 6,
    color: palette[Math.floor(Math.random() * palette.length)],
    rotation: Math.random() * 6.28,
    rotSpeed: (Math.random() - 0.5) * 0.25,
    life: 1,
    decay: 0.013 + Math.random() * 0.008,
  }));

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.98;
      p.rotation += p.rotSpeed; p.life -= p.decay;
      if (p.life <= 0 || p.y > canvas.height + 20) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (alive) { activeRaf = requestAnimationFrame(tick); return; }
    cancelAnimationFrame(activeRaf);
    activeRaf = null;
    canvas.remove();
  };
  activeRaf = requestAnimationFrame(tick);
}
