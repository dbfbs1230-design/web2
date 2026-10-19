/* 표지 전용 픽셀 눈. 지도에 입장하면 중지하고 표지로 돌아오면 재개합니다.
 * density: 눈의 밀도 / vx: 왼쪽 바람 / vy: 낙하 속도(px/초).
 * 외부 라이브러리나 이미지 다운로드 없이 Canvas에 작은 정사각형을 그립니다.
 */
(() => {
  const canvas = document.querySelector('#intro-snow'),
    ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0,
    height = 0,
    flakes = [],
    frame = 0,
    last = 0,
    enabled = true,
    gustStart = null;
  function flake(randomY = true) {
    const depth = Math.random();
    return {
      x: Math.random() * (width + 100),
      y: randomY ? Math.random() * height : -8,
      size: depth > 0.9 ? 3 : depth > 0.55 ? 2 : 1,
      alpha: 0.18 + depth * 0.58,
      vx: -(12 + depth * 24),
      vy: 20 + depth * 32,
      phase: Math.random() * Math.PI * 2,
    };
  }
  function resize() {
    if (!enabled || document.hidden) return;
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2000000 / (width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    flakes = Array.from(
      { length: Math.min(230, Math.max(55, Math.round((width * height) / 6500))) },
      () => flake(),
    );
    paint(0, 0);
  }
  function paint(dt, time) {
    ctx.clearRect(0, 0, width, height);
    // 0.9초 동안 가속: 수평 바람을 크게, 낙하는 조금만 강화합니다.
    const ramp = gustStart === null ? 0 : Math.min(1, Math.max(0, (time - gustStart) / 900));
    const wind = ramp * ramp * (3 - 2 * ramp);
    for (const f of flakes) {
      f.x += (f.vx - wind * (650 + f.size * 170) + Math.sin(time * 0.00025 + f.phase) * 4) * dt;
      f.y += (f.vy + wind * 75) * dt;
      if (f.y > height + 8) {
        Object.assign(f, flake(false));
      }
      if (f.x < -8) {
        f.x = width + 8;
        f.y = Math.random() * height;
      }
      // 중앙 로고 주변은 눈을 조금 낮춰 글자의 대비를 보존합니다.
      const center =
        Math.abs(f.x - width / 2) < Math.min(250, width * 0.35) &&
        Math.abs(f.y - height / 2) < 170;
      ctx.fillStyle = `rgba(255,255,255,${f.alpha * (center ? 0.48 : 1)})`;
      // 가속 때만 옅은 짧은 잔상을 남겨 눈이 바람에 날리는 방향을 보여줍니다.
      if (wind > 0.05) {
        const length = wind * (8 + f.size * 8);
        ctx.beginPath();
        ctx.moveTo(f.x + length, f.y - length * 0.09);
        ctx.lineTo(f.x, f.y);
        ctx.strokeStyle = `rgba(255,255,255,${f.alpha * wind * 0.28})`;
        ctx.lineWidth = f.size * 0.65;
        ctx.stroke();
      }
      ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
    }
  }
  function tick(time) {
    frame = 0;
    if (!enabled || document.hidden || reduced.matches) return;
    // 평상시에는 30fps, 입장 눈보라는 60fps로 유지합니다.
    if(last && gustStart===null && time-last<32){frame=requestAnimationFrame(tick);return;}
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    paint(dt, time);
    frame = requestAnimationFrame(tick);
  }
  function reconcile() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (!enabled || document.hidden) {
      // 보이지 않는 표지의 픽셀 버퍼를 반환합니다.
      canvas.width=canvas.height=1;flakes=[];return;
    }
    if(canvas.width===1 || width!==innerWidth || height!==innerHeight)resize();
    if (!reduced.matches) frame = requestAnimationFrame(tick);
    else paint(0,0);
  }
  window.IntroSnow = {
    start() {
      enabled = true;
      gustStart = null;
      reconcile();
    },
    gust() {
      gustStart = performance.now();
      enabled = true;
      reconcile();
    },
    stop() {
      enabled = false;
      reconcile();
    },
  };
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', reconcile);
  reduced.addEventListener('change', reconcile);
  resize();
  reconcile();
})();
