/* ==========================================================================
   THE WALL BETWEEN US — audio.js
   Every sound is synthesised live with the Web Audio API (no files needed).
   ========================================================================== */
const SFX = (() => {
  let ctx = null, master = null, droneGain = null, on = true, intensity = 0, hbTimer = null, noise = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = on ? 0.85 : 0;
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  function setOn(v) {
    on = v;
    if (master) master.gain.setTargetAtTime(v ? 0.85 : 0, ctx.currentTime, 0.1);
  }
  const ready = () => ctx && on;

  function env(g, t, a, peak, dcy) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
  }
  function noiseSrc() {
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true;
    return s;
  }
  function pan(node, p) {
    if (!ctx.createStereoPanner) return node;
    const sp = ctx.createStereoPanner(); sp.pan.value = p; node.connect(sp); return sp;
  }

  // low, beating drone + wind
  function drone() {
    if (!ctx || droneGain) return;
    droneGain = ctx.createGain(); droneGain.gain.value = 0.0001; droneGain.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; lp.connect(droneGain);
    [55, 55.6, 82.3].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 2 ? 0.05 : 0.08; o.connect(g); g.connect(lp); o.start();
    });
    const n = noiseSrc(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.05; n.connect(bp); bp.connect(ng); ng.connect(droneGain); n.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 220;
    lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    droneGain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 4);
    heartLoop();
  }

  function thump(t, f, v) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.15);
    const g = ctx.createGain(); env(g, t, 0.01, v, 0.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
  }
  function heartLoop() {
    clearTimeout(hbTimer);
    const bpm = 48 + intensity * 46;
    if (ready() && intensity > 0.12) {
      const t = ctx.currentTime + 0.02, v = 0.12 + intensity * 0.35;
      thump(t, 62, v); thump(t + 0.22, 55, v * 0.7);
    }
    hbTimer = setTimeout(heartLoop, 60000 / bpm);
  }
  function setIntensity(p) {
    intensity = p;
    if (droneGain && ctx) droneGain.gain.setTargetAtTime(0.45 + p * 0.5, ctx.currentTime, 2);
  }

  function click() {
    if (!ready()) return;
    const t = ctx.currentTime, n = noiseSrc(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    const g = ctx.createGain(); env(g, t, 0.002, 0.25, 0.05); n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.08);
  }
  function tick() {
    if (!ready()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1800;
    const g = ctx.createGain(); env(g, t, 0.001, 0.06, 0.03); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.05);
  }
  // detuned music-box arpeggio
  function chime() {
    if (!ready()) return;
    const t = ctx.currentTime;
    [987.8, 1174.7, 1396.9, 1318.5, 1975.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.012);
      const g = ctx.createGain(); env(g, t + i * 0.14, 0.005, 0.18, 1.3); o.connect(g); g.connect(master); o.start(t + i * 0.14); o.stop(t + i * 0.14 + 1.5);
    });
  }
  function fail() {
    if (!ready()) return;
    const t = ctx.currentTime;
    thump(t, 70, 0.6);
    [110, 116.5].forEach((f) => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const g = ctx.createGain(); env(g, t, 0.01, 0.09, 0.5); o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6);
    });
  }
  function creak() {
    if (!ready()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    for (let i = 1; i < 12; i++) o.frequency.linearRampToValueAtTime(70 + Math.random() * 70, t + i * 0.12);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6;
    const g = ctx.createGain(); env(g, t, 0.15, 0.28, 1.3);
    o.connect(bp); bp.connect(g); pan(g, Math.random() * 2 - 1).connect(master); o.start(t); o.stop(t + 1.6);
  }
  function whisper() {
    if (!ready()) return;
    const t = ctx.currentTime, n = noiseSrc();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(1800, t);
    for (let i = 1; i < 10; i++) bp.frequency.linearRampToValueAtTime(1200 + Math.random() * 2600, t + i * 0.17);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 8; i++) { g.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.15, t + i * 0.2 + 0.08); g.gain.linearRampToValueAtTime(0.02, t + i * 0.2 + 0.18); }
    g.gain.linearRampToValueAtTime(0.0001, t + 1.8);
    n.connect(bp); bp.connect(g); pan(g, Math.random() > 0.5 ? -0.9 : 0.9).connect(master); n.start(t); n.stop(t + 1.9);
  }
  function knock(times = 3) {
    if (!ready()) return;
    const t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      thump(t + i * 0.42, 120, 0.7);
      const n = noiseSrc(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const g = ctx.createGain(); env(g, t + i * 0.42, 0.002, 0.4, 0.12); n.connect(lp); lp.connect(g); g.connect(master); n.start(t + i * 0.42); n.stop(t + i * 0.42 + 0.2);
    }
  }
  function snip() {
    if (!ready()) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const n = noiseSrc(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const g = ctx.createGain(); env(g, t + i * 0.18, 0.002, 0.35, 0.06); n.connect(hp); hp.connect(g); g.connect(master); n.start(t + i * 0.18); n.stop(t + i * 0.18 + 0.1);
    }
  }
  function flare() {
    if (!ready()) return;
    const t = ctx.currentTime, n = noiseSrc(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400;
    const g = ctx.createGain(); env(g, t, 0.02, 0.45, 0.7); n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.9);
  }
  // the jump-scare shriek
  function scream() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const ws = ctx.createWaveShaper(); const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 6); }
    ws.curve = curve;
    const g = ctx.createGain(); env(g, t, 0.01, 0.9, 1.0); ws.connect(g); g.connect(master);
    [520, 547, 1100].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.4, t + 0.25); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 1);
      const vib = ctx.createOscillator(); vib.frequency.value = 23; const vg = ctx.createGain(); vg.gain.value = f * 0.06; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + 1.1);
      const og = ctx.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(ws); o.start(t); o.stop(t + 1.1);
    });
    const n = noiseSrc(), ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(ng); ng.connect(ws); n.start(t); n.stop(t + 1.1);
    thump(t, 50, 1);
  }
  function door() {
    if (!ready()) return;
    creak(); setTimeout(() => thump(ctx.currentTime, 45, 1), 900);
  }

  return { init, setOn, drone, setIntensity, click, tick, chime, fail, creak, whisper, knock, snip, flare, scream, door };
})();
