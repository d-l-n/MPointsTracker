let activeConfettiRaf: number | null = null;
let activeConfettiCanvas: HTMLCanvasElement | null = null;

type ConfettiShape = "rect" | "circle";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  shape: ConfettiShape;
  life: number;
  decay: number;
}

function triggerConfetti(gameColor = "#006D77"): void {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appReduce = document.querySelector('[data-reduce-effects="true"]') !== null;
  if (prefersReduced || appReduce) return;

  if (activeConfettiRaf !== null) {
    cancelAnimationFrame(activeConfettiRaf);
    activeConfettiRaf = null;
  }
  if (activeConfettiCanvas) {
    activeConfettiCanvas.remove();
    activeConfettiCanvas = null;
  }

  const canvas = document.createElement("canvas");
  canvas.style.cssText = [
    "position:fixed",
    "inset:0",
    "pointer-events:none",
    "z-index:9000",
    "width:100vw",
    "height:100dvh",
  ].join(";");
  document.body.appendChild(canvas);
  activeConfettiCanvas = canvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    activeConfettiCanvas = null;
    canvas.remove();
    return;
  }

  const baseColor = gameColor.startsWith("var(") ? "#006D77" : gameColor;
  const palette = [baseColor, "#ffffff", "#ffd700", "#52b788", "#ff6b6b", "#a78bfa"];

  const count = 110;
  const particles: ConfettiParticle[] = Array.from({ length: count }, (_, index) => {
    const fromLeft = index % 2 === 0;
    return {
      x: fromLeft ? canvas.width * 0.35 : canvas.width * 0.65,
      y: canvas.height * 0.38,
      vx: (Math.random() - 0.5) * 9,
      vy: -6 - Math.random() * 8,
      size: 5 + Math.random() * 6,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      shape: Math.random() > 0.4 ? "rect" : "circle",
      life: 1,
      decay: 0.013 + Math.random() * 0.008,
    };
  });

  let rafId = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let anyAlive = false;

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.28;
      particle.vx *= 0.98;
      particle.rotation += particle.rotSpeed;
      particle.life -= particle.decay;

      if (particle.life <= 0 || particle.y > canvas.height + 20) continue;
      anyAlive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;

      if (particle.shape === "rect") {
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (anyAlive) {
      rafId = requestAnimationFrame(tick);
      activeConfettiRaf = rafId;
      return;
    }

    cancelAnimationFrame(rafId);
    activeConfettiRaf = null;
    activeConfettiCanvas = null;
    canvas.remove();
  };

  rafId = requestAnimationFrame(tick);
  activeConfettiRaf = rafId;
}

export { triggerConfetti };
