// Kichik confetti effekti — kutubxonasiz (muvaffaqiyatli harakatlardan keyin)
const COLORS = ["#ff6b4a", "#ffc845", "#14b8a6", "#8b7cf6", "#ff8fab", "#4ade80"];

export function confetti({ x = 0.5, y = 0.45, count = 120 } = {}) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const ox = window.innerWidth * x;
  const oy = window.innerHeight * y;
  const parts = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 5 + Math.random() * 7,
      rot: Math.random() * 360,
      vr: -12 + Math.random() * 24,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() > 0.5 ? "rect" : "circle",
      life: 0,
    };
  });

  let frame;
  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;
    parts.forEach((p) => {
      p.life++;
      p.vy += 0.28;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - p.life / 140);
      if (alpha > 0 && p.y < window.innerHeight + 40) alive++;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (alive > 0) frame = requestAnimationFrame(tick);
    else {
      cancelAnimationFrame(frame);
      canvas.remove();
    }
  };
  tick();
}
