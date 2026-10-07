/* ==========================================================================
   THE WALL BETWEEN US — game.js
   Two players, two devices, no server: every lock's answer lives in the
   *other* sister's room, so the players have to talk.
   ========================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- storage (always wrapped: private windows can throw) ---------- */
  const KEY = 'wbu1-';
  function readLS(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  function delLS(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  const settings = Object.assign({ sound: true, scares: true }, readLS(KEY + 'settings') || {});

  /* ---------- answers ---------- */
  const ANS = {
    cabinet: ['eye', 'tooth', 'knot', 'spiral'],
    cradle: [4, 3, 8, 6],
    clock: { h: 4, m: 45 },
    lamps: ART.ANS_LAMPS,
    drawer: 'SISTER',
    door: { saya: [7, 4, 2, 9], rin: [2, 9, 7, 4] },
  };

  const ROLE = {
    saya: { name: 'Saya', other: 'Rin', room: 'The Doll Atelier' },
    rin: { name: 'Rin', other: 'Saya', room: 'The Nursery' },
  };

  let role = null;
  let S = null;

  function fresh() {
    return {
      start: Date.now(), endTime: null,
      solved: {}, items: {}, flags: {}, wrong: {}, hintRev: {}, hintsUsed: 0,
      clock: { h: 12, m: 0 }, cradle: [0, 0, 0, 0], rings: [0, 0, 0, 0], lamps: Array(16).fill(0),
      newItems: {},
    };
  }
  const save = () => role && S && writeLS(KEY + role, S);

  /* ---------- screens ---------- */
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    window.scrollTo(0, 0);
  }

  function typeText(el, text, done) {
    el.classList.remove('done');
    el.innerHTML = '';
    let i = 0, html = '';
    const parts = text.split(/(\*[^*]+\*)/g).flatMap((p) => (p.startsWith('*') ? [{ red: p.slice(1, -1) }] : [...p]));
    let skip = false;
    const finish = () => { skip = true; };
    el.addEventListener('click', finish, { once: true });
    (function step() {
      if (skip) {
        el.innerHTML = parts.map((p) => (typeof p === 'string' ? esc(p) : `<span class="red">${esc(p.red)}</span>`)).join('');
        el.classList.add('done'); done && done(); return;
      }
      if (i >= parts.length) { el.classList.add('done'); done && done(); return; }
      const p = parts[i++];
      html += typeof p === 'string' ? esc(p) : `<span class="red">${esc(p.red)}</span>`;
      el.innerHTML = html;
      if (typeof p === 'string' && p.trim() && Math.random() < 0.3) SFX.tick();
      setTimeout(step, typeof p === 'string' ? (p === '\n' ? 260 : /[.,—]/.test(p) ? 140 : 24) : 300);
    })();
  }
  function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ---------- toast / whisper ---------- */
  function toast(msg) {
    const d = document.createElement('div');
    d.textContent = msg;
    $('#toast').appendChild(d);
    setTimeout(() => d.remove(), 3700);
  }
  function whisper(msg) {
    const w = $('#whisper');
    w.innerHTML = '';
    const s = document.createElement('span');
    s.textContent = msg;
    w.appendChild(s);
    SFX.whisper();
  }

  /* ---------- rendering ---------- */
  function renderRoom() {
    $('#room').innerHTML = role === 'saya' ? ART.sayaRoom(S) : ART.rinRoom(S);
    const dark = $('#dark');
    dark.className = role === 'saya' ? 'bulb' : S.flags.lit ? 'candle' : 'moon';
  }
  function renderHUD() {
    $('#hudName').textContent = ROLE[role].name;
    $('#hudRoom').textContent = ROLE[role].room;
  }

  const ITEMS = {
    scissors: { name: 'Sewing scissors', icon: 'scissors' },
    watch: { name: "Mother's pocket watch", icon: 'watch' },
    cipher: { name: "Grandmother's stitch-chart", icon: 'cipher' },
    tongue: { name: 'A porcelain tongue', icon: 'tongue' },
    candle: { name: 'A candle stub', icon: 'candle' },
    matches: { name: 'A box of matches', icon: 'matches' },
    locket: { name: 'A tarnished locket', icon: 'locket' },
  };
  function renderInv() {
    const inv = $('#inv');
    const keys = Object.keys(ITEMS).filter((k) => S.items[k]);
    if (!keys.length) { inv.innerHTML = '<span class="empty-pockets">Your pockets are empty.</span>'; return; }
    inv.innerHTML = keys.map((k) => {
      const icon = k === 'candle' && S.flags.lit ? 'candleLit' : ITEMS[k].icon;
      return `<button class="item ${S.newItems[k] ? 'new' : ''}" data-item="${k}" title="${ITEMS[k].name}" aria-label="${ITEMS[k].name}">${ART.ICON[icon]}</button>`;
    }).join('');
  }
  function give(...keys) {
    keys.forEach((k) => { S.items[k] = true; S.newItems[k] = true; });
    save(); renderInv();
  }

  /* ---------- panel ---------- */
  let panelOnClose = null;
  function panel(title, html, mount, onClose) {
    $('#panelTitle').textContent = title;
    const b = $('#panelBody');
    b.innerHTML = html;
    $('#panel').classList.remove('hidden');
    panelOnClose = onClose || null;
    SFX.click();
    if (mount) mount(b);
    const first = b.querySelector('input');
    if (first && window.matchMedia('(pointer:fine)').matches) first.focus();
  }
  function closePanel() {
    $('#panel').classList.add('hidden');
    if (panelOnClose) { const f = panelOnClose; panelOnClose = null; f(); }
    renderRoom(); renderInv();
  }
  function shakePanel() {
    const p = $('#panel .panel-box');
    p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
  }

  function wrong(id, fb, msg) {
    S.wrong[id] = (S.wrong[id] || 0) + 1;
    save();
    SFX.fail();
    shakePanel();
    if (fb) fb.textContent = msg || 'Nothing happens. Something behind the wall laughs.';
    if (S.wrong[id] % 3 === 0) setTimeout(() => jumpscare(), 500);
  }
  function solve(id) {
    S.solved[id] = true;
    save();
    SFX.chime();
  }

  /* ---------- reusable widgets ---------- */
  function wheelsHTML(vals, labels, max = 9) {
    return `<div class="wheels">${vals.map((v, i) => `<div class="wheel"><button data-w="${i}" data-dir="1" aria-label="up">▲</button><div class="d" data-d="${i}">${v}</div><button data-w="${i}" data-dir="-1" aria-label="down">▼</button>${labels ? `<label>${labels[i]}</label>` : ''}</div>`).join('')}</div>`;
  }
  function bindWheels(root, arr, max, onChange) {
    $$('.wheel button', root).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.w;
      arr[i] = (arr[i] + +b.dataset.dir + (max + 1)) % (max + 1);
      $(`[data-d="${i}"]`, root).textContent = arr[i];
      SFX.tick(); save(); onChange && onChange();
    }));
  }

  /* ======================================================================
     SAYA'S HOTSPOTS
     ====================================================================== */
  const SAYA = {
    mannequin() {
      if (!S.flags.turned) panel('The mannequin', `<p>A dressmaker's dummy, pinned all over with red-headed pins. The fabric over its chest is stained in the shape of a small hand.</p><p>It has no face. You're glad.</p>`);
      else panel('The mannequin', `<p>It has a face now.</p><p>You didn't see it happen. The head is turned toward you, tilted, as if it's been listening. The mouth is a crack full of tiny pins arranged like teeth.</p><p>You decide not to turn your back on it.</p>`);
    },
    pipe() {
      SFX.whisper();
      panel('The speaking pipe', `<p>A brass speaking tube runs from the floor up into the wall — toward the nursery on the other side.</p><p>You put your mouth to it. <i>"Rin?"</i></p><p>Something breathes back. Close. Much too close for the other side of a wall.</p><p class="muted">(Talk to your partner in real life. This pipe is just for atmosphere… probably.)</p>`);
    },
    dolls() {
      panel('The doll shelf', `<div class="art">${ART.dollsSVG()}</div>
      <p>Five porcelain dolls sit shoulder to shoulder. Each one's mouth has been <b>sewn shut</b> with thick black thread — some with more stitches than others.</p>
      <p>All of them are looking at you. When you lean to the left, their eyes are still looking at you.</p>`);
    },
    cabinet() {
      if (S.solved.cabinet) {
        panel('The carved cabinet', `<p>The doors hang open. Inside: a nest of hair, and the shape of things you already took.</p><p>The hair is warm.</p>`);
        return;
      }
      let seq = [];
      panel('The carved cabinet', `
        <p>A tall cabinet, locked tight. A brass plate on the front holds <b>eight carved buttons</b> and <b>four empty sockets</b> above them. Someone has scratched into the wood beneath: <i>"only she knows the way up."</i></p>
        <div class="slots">${[0, 1, 2, 3].map((i) => `<div class="slot" data-slot="${i}"></div>`).join('')}</div>
        <div class="keypad">${ART.SYM_ORDER.map((n) => `<button class="key" data-sym="${n}" aria-label="${n}">${ART.symSVG(n)}</button>`).join('')}</div>
        <div class="actions"><button class="btn ghost" data-act="clear">Clear</button></div>
        <div class="feedback"></div>`, (b) => {
        const fb = $('.feedback', b);
        const draw = () => $$('.slot', b).forEach((s, i) => (s.innerHTML = seq[i] ? ART.symSVG(seq[i], '#f2d68a') : ''));
        $('[data-act="clear"]', b).onclick = () => { seq = []; draw(); fb.textContent = ''; };
        $$('.key', b).forEach((k) => k.addEventListener('click', () => {
          if (seq.length >= 4) return;
          seq.push(k.dataset.sym); SFX.tick(); draw();
          if (seq.length === 4) {
            if (seq.join() === ANS.cabinet.join()) {
              solve('cabinet'); give('scissors', 'watch');
              b.innerHTML = `<p>The buttons sink into the wood one by one. Something inside the cabinet <i>exhales</i>, and the doors swing open.</p>
                <p>Inside, wrapped in a nest of long black hair: <b>a pair of rusted sewing scissors</b> and <b>Mother's pocket watch</b>. You take both.</p>
                <div class="note">The watch stopped long ago. Rin might want to see it — or hear about it.</div>`;
              toast('Took: sewing scissors, pocket watch');
            } else {
              setTimeout(() => { seq = []; draw(); }, 500);
              wrong('cabinet', fb, 'The buttons spit back out. Wrong order — or wrong symbols.');
            }
          }
        }));
      });
    },
    curtain() {
      if (!S.items.scissors) {
        panel('A curtain of hair', `<p>Long black hair hangs from a curtain rod like a drape — far too much hair for one person. It's warm, and it moves slightly, like something breathing behind it.</p><p>There's something square and metal behind it. You can't part the strands with your hands; they <i>tighten</i>.</p><p class="muted">You'd need something sharp.</p>`);
        return;
      }
      panel('A curtain of hair', `<p>The hair hangs from the rod, warm and breathing. Behind it, something square and metal.</p><div class="actions"><button class="btn" id="cut">Cut through it with the scissors</button></div>`, (b) => {
        $('#cut', b).onclick = () => {
          S.flags.cut = true; save(); SFX.snip();
          setTimeout(() => whisper('it hurt'), 700);
          b.innerHTML = `<p>Every snip makes a sound like a gasp. The cut ends curl back toward the rod, twitching, and something drips from them that is not water.</p><p>Behind the hair: <b>a metal panel with sixteen small lamps</b> and a lever.</p>`;
        };
      });
    },
    panel() {
      if (S.solved.lamps) {
        panel('The lamp panel', `<p>Seven lamps burn steadily. Through the wall, faintly, you hear Rin gasp — the handprints on her side must be glowing too.</p>`);
        return;
      }
      panel('The lamp panel', `
        <div class="note">Sixteen lamps for sixteen tiles. Light only the ones where <b>her hands</b> pressed through the wall.<br>It is one wall, child, and we stand on either side of it — <b>what is her left is my right</b>.<span class="sig">— scratched into the metal</span></div>
        <div class="lampgrid">${S.lamps.map((v, i) => `<button class="lamp ${v ? 'on' : ''}" data-l="${i}" aria-label="lamp ${i + 1}"></button>`).join('')}</div>
        <div class="actions"><button class="btn" id="lever">Pull the lever</button><button class="btn ghost" id="lclear">All off</button></div>
        <div class="feedback"></div>`, (b) => {
        const fb = $('.feedback', b);
        $$('.lamp', b).forEach((l) => l.addEventListener('click', () => {
          const i = +l.dataset.l; S.lamps[i] = S.lamps[i] ? 0 : 1; l.classList.toggle('on', !!S.lamps[i]); SFX.tick(); save();
        }));
        $('#lclear', b).onclick = () => { S.lamps.fill(0); $$('.lamp', b).forEach((l) => l.classList.remove('on')); save(); };
        $('#lever', b).onclick = () => {
          if (S.lamps.join() === ANS.lamps.join()) {
            solve('lamps');
            b.innerHTML = `<p>The lever clunks down. The seven lamps flare white-hot — and below the panel, the <b>desk drawer</b> springs open with a sound like a jaw unhinging.</p>`;
          } else wrong('lamps', fb, 'The lamps sputter and die. A thin wail from the wiring. Wrong pattern.');
        };
      });
    },
    desk() {
      if (!S.solved.lamps) {
        panel('The sewing desk', `<p>A sewing desk with a single drawer. There's no keyhole — only a thin wire that runs up the wall, behind the curtain of hair.</p><p>On the desk: a spool of black thread, a cracked doll's head, and a needle still threaded. The doll's head is facing you. You're sure it was facing the wall a moment ago.</p>`);
        return;
      }
      if (!S.items.cipher) {
        give('cipher', 'tongue');
        toast("Took: grandmother's stitch-chart, a porcelain tongue");
      }
      panel('The sewing desk', `<p>The drawer is open. You took a yellowed <b>stitch-chart</b> — patterns for embroidering with human hair, each one labelled with a letter — and a <b>porcelain tongue</b> broken off a doll, with two numbers carved into it.</p><p class="muted">Check your pockets to look at them.</p>`);
    },
    door: () => doorPanel(),
  };

  /* ======================================================================
     RIN'S HOTSPOTS
     ====================================================================== */
  const RIN = {
    window() {
      const late = Date.now() - S.start > 5 * 60 * 1000;
      panel('The window', `<p>Black sea and a white moon. The window is painted shut.</p>${late ? '<p>There is a smudge on the outside of the glass at head height. The smudge is the shape of a face pressed flat, and it is on the <i>outside</i>, and you are on the second floor.</p>' : '<p>The moon has a faint spiral on it, like a thumbprint.</p>'}`);
      if (late && settings.scares) flashWindowFace();
    },
    drawing() {
      panel("A child's crayon drawing", `<div class="art mid">${ART.stairsSVG()}</div><p>Taped to the wallpaper. A little stick figure at the bottom of a staircase, and a tall one with long hair waiting at the top. Every step has a symbol on it.</p><p>You don't remember drawing this. It's in your handwriting.</p>`);
    },
    ledger() {
      let extra = '';
      if (S.items.candle && S.items.matches && !S.flags.lit) extra = `<div class="actions"><button class="btn" id="light">Light the candle</button></div>`;
      panel('The nightstand', `<p>An old sewing ledger lies open on the nightstand, at its last page. The handwriting is Grandmother's — shaky, pressed so hard the nib tore the paper.</p>
      <div class="note hand">I sewed them quiet, one by one, so they would stop calling for her.<br>
      First — the one who weeps ink.<br>
      Then — the one who gave me her eye.<br>
      Then — the one whose hair would not stop growing.<br>
      Last — the one who wore my red ribbon.<br>
      I counted every stitch. The cradle remembers the count.</div>${extra}`, (b) => {
        const l = $('#light', b); if (l) l.onclick = () => { lightCandle(); closePanel(); };
      });
    },
    cradle() {
      if (S.solved.cradle) { panel('The cradle', `<p>The padlock hangs open. The cradle is empty except for a nest of hair in the shape of a baby. It is still rocking, very gently, though nobody is touching it.</p>`); return; }
      panel('The cradle', `<p>An old wooden cradle, still rocking slowly. Black hair spills over its rails. A brass <b>padlock with four number wheels</b> holds the lid closed. Something inside shifts when you lean close.</p>
        ${wheelsHTML(S.cradle)}
        <div class="actions"><button class="btn" id="open">Pull the shackle</button></div><div class="feedback"></div>`, (b) => {
        bindWheels(b, S.cradle, 9);
        $('#open', b).onclick = () => {
          if (S.cradle.join() === ANS.cradle.join()) {
            solve('cradle'); give('candle');
            b.innerHTML = `<p>The lock clicks. You lift the lid.</p><p>No baby. Just hair — braided into the shape of a baby, warm as skin. Tucked in its little hair-fist is a <b>candle stub</b>.</p><p>You take it. The braid's fist closes on nothing.</p>`;
            toast('Took: a candle stub');
          } else wrong('cradle', $('.feedback', b), 'The shackle won’t budge. The cradle rocks harder.');
        };
      });
    },
    clock() {
      if (S.solved.clock) { panel('The grandfather clock', `<p>The pendulum swings again. Each tick sounds like a fingernail on the inside of the case.</p>`); return; }
      const c = S.clock;
      panel('The grandfather clock', `<p>A tall clock, stopped. A tarnished plaque under the face reads:</p><div class="note">SET ME TO THE HOUR SHE STOPPED, AND I WILL GIVE YOU FIRE.</div>
        <div class="art narrow" id="cface">${ART.clockSVG(c.h, c.m)}</div>
        <div class="clockctl">
          <div class="wheel"><button data-k="h" data-dir="1">▲</button><div class="d" id="hh">${c.h}</div><button data-k="h" data-dir="-1">▼</button><label>hour</label></div>
          <div class="wheel"><button data-k="m" data-dir="1">▲</button><div class="d" id="mm">${String(c.m).padStart(2, '0')}</div><button data-k="m" data-dir="-1">▼</button><label>minutes</label></div>
        </div>
        <div class="actions"><button class="btn" id="set">Start the pendulum</button></div><div class="feedback"></div>`, (b) => {
        const draw = () => { $('#cface', b).innerHTML = ART.clockSVG(c.h, c.m); $('#hh', b).textContent = c.h; $('#mm', b).textContent = String(c.m).padStart(2, '0'); };
        $$('.clockctl button', b).forEach((bt) => bt.addEventListener('click', () => {
          const d = +bt.dataset.dir;
          if (bt.dataset.k === 'h') c.h = ((c.h - 1 + d + 12) % 12) + 1; else c.m = (c.m + d * 5 + 60) % 60;
          SFX.tick(); save(); draw();
        }));
        $('#set', b).onclick = () => {
          if (c.h === ANS.clock.h && c.m === ANS.clock.m) {
            solve('clock'); give('matches');
            b.innerHTML = `<p>The pendulum lurches into motion. Deep inside the case, something chimes — not the hour, but a little lullaby, played slightly wrong.</p><p>A small door in the base pops open. Inside: a <b>box of matches</b>, and fingernail scratches all over the inside of the door.</p>`;
            toast('Took: a box of matches');
          } else wrong('clock', $('.feedback', b), 'The pendulum swings once… and stops. Wrong time.');
        };
      });
    },
    wall() {
      if (!S.flags.lit) {
        panel('The wall', `<div class="art narrow">${ART.wallSVG(false)}</div><p>It's too dark to see. You run your hand over the wallpaper: it's divided into a grid of square tiles, four by four. Some of the tiles are <i>warm</i>.</p><p>Saya is on the other side of this wall. You can hear her moving.</p>`);
        return;
      }
      panel('The wall', `<div class="art narrow">${ART.wallSVG(true)}</div><p>In the candlelight you see them: small <b>handprints</b>, scorched black into the wallpaper tiles, as if someone pressed against the wall <b>from Saya's side</b> and burned straight through.</p><p>They're the size of your hands. Exactly the size.</p>`);
    },
    mirror() {
      if (!S.flags.lit) { panel('The vanity mirror', `<div class="art narrow">${ART.mirrorSVG(false)}</div><p>Too dark. You can just make out the oval of the glass — and, maybe, a shape in it that isn't moving when you move.</p>`); return; }
      panel('The vanity mirror', `<div class="art narrow">${ART.mirrorSVG(true)}</div><p>Strands of hair are plastered to the glass <b>from the inside</b>, coiled into <b>six shapes</b>, left to right.</p><p>Behind the shapes, your reflection is smiling. You are not smiling.</p>`);
    },
    vanity() {
      if (S.solved.drawer) { panel('The vanity drawer', `<p>The drawer is open and empty, lined with pressed moths.</p>`); return; }
      panel('The vanity drawer', `<p>The vanity's drawer is locked with a brass <b>letter lock — six letters</b>. Scratched beside it: <i>"say who you are looking for."</i></p>
        <div class="letters">${[0, 1, 2, 3, 4, 5].map((i) => `<input maxlength="1" inputmode="text" autocomplete="off" autocapitalize="characters" aria-label="letter ${i + 1}" data-i="${i}">`).join('')}</div>
        <div class="actions"><button class="btn" id="tryd">Open</button></div><div class="feedback"></div>`, (b) => {
        const ins = $$('.letters input', b);
        ins.forEach((inp, i) => {
          inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^a-z]/gi, '').toUpperCase(); SFX.tick(); if (inp.value && ins[i + 1]) ins[i + 1].focus(); });
          inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'Enter') $('#tryd', b).click(); });
        });
        $('#tryd', b).onclick = () => {
          const w = ins.map((x) => x.value).join('');
          if (w === ANS.drawer) {
            solve('drawer'); give('locket');
            b.innerHTML = `<p>The letters click into place and the drawer slides out on its own.</p><p>Inside, on a bed of pressed moths: a <b>locket</b>. You open it. A photograph of you and Saya as little girls — but Saya's face has been scratched away. On the other half, two numbers.</p>`;
            toast('Took: a tarnished locket');
          } else wrong('drawer', $('.feedback', b), 'The letters grind and reset. Behind you, the cradle starts to rock.');
        };
      });
    },
    door: () => doorPanel(),
  };

  function lightCandle() {
    S.flags.lit = true; save(); SFX.flare();
    toast('The candle catches. Shadows crawl back into the corners.');
    setTimeout(() => whisper('now she can see you too'), 2200);
    renderRoom(); renderInv();
  }

  function flashWindowFace() {
    const f = $('.winface');
    if (!f) return;
    f.classList.add('show'); SFX.creak();
    setTimeout(() => f.classList.remove('show'), 900);
  }

  /* ---------- the final door (both sides) ---------- */
  function doorPanel() {
    if (S.endTime) { ending(); return; }
    const r = S.rings;
    panel('The door', `<p>The door has no handle — only <b>four concentric brass rings</b> set into the wood, each engraved with the numbers 0–9. A notch at the top marks where to read them.</p>
      <div class="note">Two sisters, one door. The <b>outer</b> rings are <b>mine</b>; the <b>inner</b> rings are <b>hers</b>. Turn them from the outside in.<span class="sig">— carved deep, as if with a fingernail</span></div>
      <div class="ringwrap"><div class="art" id="rart">${ART.ringsSVG(r)}</div>${wheelsHTML(r, ['outermost', 'second', 'third', 'innermost'])}</div>
      <div class="actions"><button class="btn" id="tryr">Push the door</button></div><div class="feedback"></div>`, (b) => {
      bindWheels(b, r, 9, () => ($('#rart', b).innerHTML = ART.ringsSVG(r)));
      $('#tryr', b).onclick = () => {
        if (r.join() === ANS.door[role].join()) {
          solve('door'); S.endTime = Date.now(); save(); SFX.door();
          setTimeout(() => { $('#panel').classList.add('hidden'); ending(); }, 1400);
          b.innerHTML = `<p>The rings align. Somewhere inside the wall, a great many small bones click into place. The door swings inward…</p>`;
        } else wrong('door', $('.feedback', b), 'The rings spin back by themselves. The door is cold.');
      };
    });
  }

  /* ---------- items ---------- */
  function openItem(k) {
    delete S.newItems[k]; save(); renderInv();
    const lightBtn = S.items.candle && S.items.matches && !S.flags.lit ? `<div class="actions"><button class="btn" id="light">Strike a match and light the candle</button></div>` : '';
    const views = {
      scissors: () => panel('Sewing scissors', `<p>Rusted dressmaker's shears. A few long black hairs are still knotted around the pivot, and they won't come off.</p>`),
      watch: () => panel("Mother's pocket watch", `<div class="art narrow">${ART.watchSVG()}</div><p>Mother's watch. It stopped the night she went into the wall, and nobody has wound it since. The face has <b>no numbers</b> — only ticks, and a small <b>red eye</b> painted where a number should be. It lies on its side in your palm.</p><div class="note">Engraved on the back: <b>THE EYE ALWAYS LOOKS UP.</b></div>`),
      cipher: () => panel("Grandmother's stitch-chart", `<div class="art mid">${ART.cipherSVG()}</div><p>A chart for embroidering letters with hair. Twelve patterns, twelve letters. Some of the patterns look very alike.</p>`),
      tongue: () => panel('A porcelain tongue', `<div class="art narrow">${ART.tongueSVG()}</div><p>Broken from the mouth of a much larger doll. Two numbers are carved into it. It is slightly wet.</p>`),
      candle: () => panel('A candle stub', `<p>${S.flags.lit ? 'It burns with a small, steady flame that leans toward the wall — toward Saya.' : 'A stub of yellowed wax. The wick is black, as if it has been lit many times before.'}</p>${lightBtn}`, (b) => { const l = $('#light', b); if (l) l.onclick = () => { lightCandle(); closePanel(); }; }),
      matches: () => panel('A box of matches', `<p>Three matches left. The striker is worn smooth on one side.</p>${lightBtn}`, (b) => { const l = $('#light', b); if (l) l.onclick = () => { lightCandle(); closePanel(); }; }),
      locket: () => panel('A tarnished locket', `<div class="art mid">${ART.locketSVG()}</div><p>You and Saya, years ago. Someone scratched Saya's face out — hard, over and over. The other half holds two numbers.</p>`),
    };
    views[k] && views[k]();
  }

  /* ---------- hints ---------- */
  const HINTS = {
    saya: [
      { id: 'cabinet', t: 'The carved cabinet', done: () => S.solved.cabinet, h: [
        'Nothing in your room explains the symbols. Ask Rin whether any of them appear on her side.',
        "Rin has a child's crayon drawing of a staircase with a symbol on every step. The scrawl on it says how to climb.",
        'Bottom to top. Only the RED steps. Skip the crossed-out "broken" step. Four symbols in all.',
      ], sol: 'Eye → Tooth → Knot → Spiral' },
      { id: 'dolls', t: 'The dolls (Rin needs these)', done: () => false, h: [
        "Rin's cradle has a 4-digit lock and she has a ledger that talks about dolls. You're the one with the dolls.",
        'Count the stitches across each doll’s mouth. Describe each doll by what makes it different (ribbon colour, tears, missing eye, long hair).',
        'The ledger mentions four dolls. The one with the blue ribbon is a decoy.',
      ], sol: 'Ink tears = 4, missing eye = 3, floor-length hair = 8, red ribbon = 6 (blue ribbon = 5, unused). Rin’s code: 4386.' },
      { id: 'watch', t: 'The pocket watch (Rin needs this)', show: () => S.items.watch, done: () => false, h: [
        'Rin has a grandfather clock that wants "the hour she stopped". The watch is Mother’s.',
        'The watch is lying on its side. "The eye always looks up" — the red eye marks where 12 should be.',
        'Turn the watch in your head so the eye is at the top, then read it like a normal clock. The hour hand isn’t exactly on a number…',
      ], sol: 'With the eye at the top it reads 4:45 (minute hand at 9 o’clock-position = 45, hour hand ¾ of the way from 4 to 5).' },
      { id: 'curtain', t: 'The curtain of hair', show: () => S.items.watch, done: () => S.flags.cut, h: ['You need something sharp. Did anything come out of the cabinet?', 'Click the curtain while you have the scissors.'], sol: 'Open the curtain with the sewing scissors.' },
      { id: 'lamps', t: 'The lamp panel', show: () => S.flags.cut, done: () => S.solved.lamps, h: [
        "The lamps should match where 'her hands pressed through'. Rin can only see the handprints once she has light.",
        'You and Rin are looking at the same wall from opposite sides. Her left is your right.',
        'Have Rin read out each row of handprints. Keep the rows top-to-bottom, but flip each row left-to-right.',
      ], sol: 'Top row: lamps 1, 2 · Row 2: lamp 2 · Row 3: lamps 2, 3, 4 · Bottom row: lamp 4 (counting from the left, as you see it).' },
      { id: 'cipher', t: 'The stitch-chart (Rin needs this)', show: () => S.items.cipher, done: () => false, h: [
        'Rin has a six-letter lock and six hair-shapes on her mirror. You have the key.',
        'Some shapes are near-twins. Watch which way the spirals turn, and whether a knot has one tail or two.',
        'The answer is who Rin is looking for.',
      ], sol: 'Spiral turning clockwise = S, loop-topped strand = I, cross = T, three waves = E, knot with one tail = R → SISTER.' },
      { id: 'door', t: 'The door', done: () => !!S.endTime, h: [
        'You hold two numbers (the porcelain tongue). Rin holds two more.',
        '"Mine" and "hers" depend on who is reading. Your own numbers go on the outer rings.',
      ], sol: 'Saya’s door: 7 · 4 · 2 · 9 (outermost → innermost).' },
    ],
    rin: [
      { id: 'drawing', t: 'The crayon drawing (Saya needs this)', done: () => false, h: [
        'Saya has a cabinet with eight symbol-buttons and four sockets. Your drawing has symbols on it.',
        'Read the scrawl: climb from the bottom, only red steps, never the broken one.',
        'Describe the red, unbroken symbols to Saya from the bottom step up.',
      ], sol: 'Eye, Tooth, Knot, Spiral (the red spiral at the very top — not the green one).' },
      { id: 'cradle', t: 'The cradle', done: () => S.solved.cradle, h: [
        'The ledger describes four dolls. You don’t have dolls… but Saya might.',
        '"I counted every stitch." The dolls’ mouths are sewn shut. Saya should count the stitches on each.',
        'Use the ledger’s order: ink tears, missing eye, long hair, red ribbon.',
      ], sol: '4 · 3 · 8 · 6' },
      { id: 'clock', t: 'The grandfather clock', done: () => S.solved.clock, h: [
        '"The hour she stopped" — Saya found something of Mother’s that stopped.',
        'Saya’s pocket watch is on its side. The red eye on it marks 12.',
        'An hour hand three-quarters of the way between 4 and 5 means 4:45, not 5:45.',
      ], sol: 'Set the clock to 4:45.' },
      { id: 'light', t: 'Light', show: () => S.items.candle || S.items.matches, done: () => S.flags.lit, h: ['A candle from the cradle, matches from the clock.', 'Click either one in your pockets once you have both.'], sol: 'Light the candle from your pockets.' },
      { id: 'wall', t: 'The handprints (Saya needs these)', show: () => S.flags.lit, done: () => false, h: [
        'Saya has a 4×4 panel of lamps on her side of this same wall.',
        'Read each row to her, top to bottom. Remember you’re facing her: your left is her right.',
      ], sol: 'As you see it: Row 1 → tiles 3, 4 · Row 2 → tile 3 · Row 3 → tiles 1, 2, 3 · Row 4 → tile 1. Saya must flip each row.' },
      { id: 'drawer', t: 'The vanity drawer', show: () => S.flags.lit, done: () => S.solved.drawer, h: [
        'The six hair-shapes on the mirror are letters. Saya has a chart for reading them.',
        'Describe each shape carefully — which way a spiral turns matters, and so does how many tails a knot has.',
        '"Say who you are looking for."',
      ], sol: 'SISTER' },
      { id: 'door', t: 'The door', done: () => !!S.endTime, h: [
        'You hold two numbers (the locket). Saya holds two more.',
        '"Mine" and "hers" depend on who is reading. Your own numbers go on the outer rings.',
      ], sol: 'Rin’s door: 2 · 9 · 7 · 4 (outermost → innermost).' },
    ],
  };

  function openHints() {
    $('#hintWho').textContent = ROLE[role].name;
    const list = HINTS[role].filter((h) => !h.show || h.show());
    $('#hintList').innerHTML = list.map((h) => {
      const n = S.hintRev[h.id] || 0, total = h.h.length + 1;
      const items = h.h.slice(0, n).map((x) => `<li>${esc(x)}</li>`).join('') + (n > h.h.length ? `<li class="sol">${esc(h.sol)}</li>` : '');
      const btn = n < total ? `<button class="btn sm ghost" data-hint="${h.id}">${n === h.h.length ? 'Show answer' : `Reveal hint ${n + 1}`}</button>` : '';
      return `<div class="hint"><h3>${esc(h.t)} ${h.done() ? '<small class="solved">✓ done</small>' : ''}</h3><ol>${items}</ol>${btn}</div>`;
    }).join('');
    $$('#hintList [data-hint]').forEach((b) => b.addEventListener('click', () => {
      S.hintRev[b.dataset.hint] = (S.hintRev[b.dataset.hint] || 0) + 1; S.hintsUsed++; save(); SFX.click(); openHints();
    }));
    $('#hints').classList.remove('hidden');
  }

  /* ======================================================================
     HORROR DIRECTOR — dread rises with time spent in the house
     ====================================================================== */
  let loopId = null, nextSmall = 0, nextBig = 0;
  const WHISPERS = {
    common: ['count the stitches', 'she is closer than the wall', 'don’t let it finish turning', 'we were always two', 'it’s warmer in the wall', 'who is talking to you right now?', 'mother is listening', 'round and round and in'],
    saya: ['the dolls blinked', 'someone is breathing in the pipe', 'your sister sounds different'],
    rin: ['the cradle is rocking', 'don’t look at the window', 'your sister sounds different'],
  };
  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function startLoop() {
    clearInterval(loopId);
    const now = Date.now();
    nextSmall = now + 14000;
    nextBig = now + (170 + Math.random() * 80) * 1000;
    loopId = setInterval(tick, 1000);
    tick();
  }
  function tick() {
    if (!S || !$('#screen-game').classList.contains('active')) return;
    const el = (S.endTime || Date.now()) - S.start;
    $('#timer').textContent = fmt(el);
    const p = Math.min(1, el / (45 * 60 * 1000));
    document.documentElement.style.setProperty('--dread', p.toFixed(3));
    const sp = $('#creepSpiral');
    if (sp) sp.style.strokeDashoffset = (1 - p * 0.9).toFixed(3);
    SFX.setIntensity(p);
    if (S.endTime) return;

    if (role === 'saya' && !S.flags.turned && el > 6 * 60 * 1000) {
      S.flags.turned = true; save();
      if ($('#panel').classList.contains('hidden')) renderRoom();
      SFX.creak(); setTimeout(() => whisper('did the mannequin just move?'), 800);
    }
    const now = Date.now();
    if (now > nextSmall) { smallEvent(p); nextSmall = now + (18 + Math.random() * 26) * 1000 * (1 - p * 0.45); }
    if (settings.scares && now > nextBig) { jumpscare(); nextBig = now + (240 + Math.random() * 180) * 1000; }
  }
  function smallEvent(p) {
    const opts = ['whisper', 'creak', 'eyes', 'flicker'];
    if (role === 'saya') opts.push('knock');
    if (role === 'rin' && Date.now() - S.start > 4 * 60 * 1000) opts.push('window');
    if (p > 0.3) opts.push('eyes', 'whisper');
    const pick = opts[Math.floor(Math.random() * opts.length)];
    const stage = $('#stage');
    switch (pick) {
      case 'whisper': {
        const pool = WHISPERS.common.concat(WHISPERS[role]);
        whisper(pool[Math.floor(Math.random() * pool.length)]);
        break;
      }
      case 'creak': SFX.creak(); break;
      case 'knock': SFX.knock(Math.random() < 0.5 ? 3 : 4); setTimeout(() => whisper(Math.random() < 0.5 ? 'three knocks from Rin’s side… then a fourth, from inside the wall' : 'knocking — from inside the wall'), 1700); break;
      case 'window': if (settings.scares) flashWindowFace(); else SFX.creak(); break;
      case 'flicker':
        if (!settings.scares) { SFX.creak(); break; }
        stage.classList.remove('flicker'); void stage.offsetWidth; stage.classList.add('flicker');
        setTimeout(() => stage.classList.remove('flicker'), 1300);
        break;
      case 'eyes': spawnEyes(); break;
    }
  }
  function spawnEyes() {
    const box = $('#eyes');
    const e = document.createElement('div');
    e.className = 'eyepair';
    const edge = Math.random();
    e.style.left = (edge < 0.5 ? 2 + Math.random() * 14 : 80 + Math.random() * 13) + '%';
    e.style.top = (8 + Math.random() * 60) + '%';
    e.innerHTML = `<svg viewBox="0 0 80 30"><ellipse cx="18" cy="15" rx="14" ry="7" fill="#f4ecd8"/><ellipse cx="62" cy="15" rx="14" ry="7" fill="#f4ecd8"/><circle cx="18" cy="15" r="2" fill="#150d11"/><circle cx="62" cy="15" r="2" fill="#150d11"/><path d="M4 12 Q18 2 32 12 M48 12 Q62 2 76 12" stroke="#150d11" stroke-width="2" fill="none"/></svg>`;
    e.addEventListener('pointerenter', () => { e.remove(); SFX.whisper(); });
    box.appendChild(e);
    setTimeout(() => e.remove(), 6200);
  }
  function jumpscare() {
    if (!settings.scares) { SFX.fail(); return; }
    const sc = $('#scare');
    sc.innerHTML = ART.face({ grin: true, spiral: true, blood: true, seed: Math.floor(Math.random() * 999), hair: 'long', dress: '#1a0a10' });
    sc.classList.remove('hidden', 'go'); void sc.offsetWidth; sc.classList.add('go');
    SFX.scream();
    setTimeout(() => { sc.classList.add('hidden'); sc.classList.remove('go'); $('#stage').classList.add('redpulse'); setTimeout(() => $('#stage').classList.remove('redpulse'), 1700); }, 900);
  }

  /* ---------- story ---------- */
  const INTRO = {
    saya: `The ferry left you and your little sister Rin at Uzuhama just as the sun went down. Grandmother's house stood at the end of the coast road, where the wind blows in circles.\n\nYou remember falling asleep in the guest room.\n\nYou wake on cold floorboards in a room full of dolls. A single bulb sways overhead, though there is no wind. The wallpaper is printed with tiny spirals. You don't remember the wallpaper having spirals.\n\nThrough the wall, faint: Rin's voice, calling your name. She sounds very far away. She sounds very close.\n\n*Find her. Get out. Don't let the spiral finish.*`,
    rin: `The ferry left you and your big sister Saya at Uzuhama just as the sun went down. Grandmother's house stood at the end of the coast road, where the wind blows in circles.\n\nYou remember falling asleep holding Saya's hand.\n\nYou wake up in a nursery. It's dark — only moonlight through a painted-shut window. A cradle rocks by itself. Somewhere, a clock isn't ticking.\n\nThrough the wall, faint: Saya's voice, calling your name. She sounds very far away. She sounds very close.\n\n*Find her. Get out. Don't let the spiral finish.*`,
  };
  const ENDING = {
    saya: `The door opens onto a corridor that curls gently to the left. Then more to the left. Then more.\n\nYou follow it inward, round and round, the walls narrowing until your shoulders brush the paper on both sides. You hear Rin's footsteps on the other side of the wall the whole way, keeping pace with you.\n\nAt the very centre of the spiral there is a small round room, and Rin is standing in it.\n\nShe smiles at you. She has too many teeth.\n\n"Saya," she says, "I've been in here alone for so long. Why did you leave me in the wall?"\n\nShe holds out her hand. It is the exact size of the handprints.\n\n*Now we can be alone together.*`,
    rin: `The door opens onto a corridor that curls gently to the right. Then more to the right. Then more.\n\nYou follow it inward, round and round, the walls narrowing until your shoulders brush the paper on both sides. You hear Saya's footsteps on the other side of the wall the whole way, keeping pace with you.\n\nAt the very centre of the spiral there is a small round room, and Saya is standing in it.\n\nShe smiles at you. Her eyes are turning, slowly, in circles.\n\n"Rin," she says, "I sewed them quiet so they'd stop calling for you. Why did you keep calling?"\n\nThere is black thread in her hand, and a needle.\n\n*Now we can be alone together.*`,
  };

  function ending() {
    clearInterval(loopId);
    show('screen-end');
    $('#endArt').innerHTML = ART.face(role === 'saya'
      ? { hair: 'bob', grin: true, spiral: true, ribbon: '#c0202a', seed: 9, dress: '#5a2a32' }
      : { hair: 'long', spiral: true, stitch: true, seed: 7, blood: true, dress: '#2c2236' });
    $('#endStats').classList.add('hidden');
    $('#btnAgain').classList.add('hidden');
    typeText($('#endText'), ENDING[role], () => {
      const wrongs = Object.values(S.wrong).reduce((a, b) => a + b, 0);
      $('#endStats').innerHTML = `<p>You escaped in <b>${fmt(S.endTime - S.start)}</b> with <b>${S.hintsUsed}</b> hint${S.hintsUsed === 1 ? '' : 's'} and <b>${wrongs}</b> wrong attempt${wrongs === 1 ? '' : 's'}.</p><p><i>Now read your ending out loud to ${ROLE[role].other}. Did you both meet the same sister?</i></p>`;
      $('#endStats').classList.remove('hidden');
      $('#btnAgain').classList.remove('hidden');
    });
  }

  /* ---------- flow ---------- */
  function chooseRole(r) {
    role = r;
    const existing = readLS(KEY + r);
    if (existing && !existing.endTime) { S = Object.assign(fresh(), existing); startGame(); return; }
    S = fresh();
    save();
    show('screen-intro');
    $('#btnWake').classList.add('hidden');
    typeText($('#introText'), INTRO[r], () => $('#btnWake').classList.remove('hidden'));
  }
  function startGame() {
    show('screen-game');
    SFX.init(); SFX.drone();
    renderHUD(); renderRoom(); renderInv();
    $('#creep').innerHTML = ART.creepSVG();
    startLoop();
  }
  function refreshResume() {
    ['saya', 'rin'].forEach((r) => {
      const s = readLS(KEY + r);
      $(`[data-resume="${r}"]`).textContent = s && !s.endTime ? `↺ continue (${fmt(Date.now() - s.start)} in)` : '';
    });
  }

  function init() {
    $('#sharedDefs').innerHTML = ART.defs();
    $('#titleArt').innerHTML = ART.titleArt();
    $('#pSaya').innerHTML = ART.face({ hair: 'long', seed: 7, dress: '#2c2236' });
    $('#pRin').innerHTML = ART.face({ hair: 'bob', seed: 9, ribbon: '#c0202a', dress: '#5a2a32' });

    SFX.setOn(settings.sound);
    $('#optSound').checked = settings.sound;
    $('#optScares').checked = settings.scares;

    $('#btnEnter').onclick = () => { SFX.init(); SFX.drone(); SFX.creak(); show('screen-howto'); };
    $('#btnHowNext').onclick = () => { SFX.click(); refreshResume(); show('screen-choose'); };
    $$('.sister').forEach((b) => b.addEventListener('click', () => { SFX.init(); SFX.click(); chooseRole(b.dataset.role); }));
    $('#btnWake').onclick = () => { SFX.knock(3); startGame(); };
    $('#btnAgain').onclick = () => { show('screen-title'); };

    // room clicks (mouse, touch, keyboard)
    const room = $('#room');
    const act = (e) => {
      const h = e.target.closest('.hs');
      if (!h) return;
      const tbl = role === 'saya' ? SAYA : RIN;
      tbl[h.dataset.hs] && tbl[h.dataset.hs]();
    };
    room.addEventListener('click', act);
    room.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(e); } });
    $('#inv').addEventListener('click', (e) => { const it = e.target.closest('.item'); if (it) openItem(it.dataset.item); });

    // moonlight follows the pointer in Rin's dark nursery
    const stage = $('#stage');
    const moveLight = (x, y) => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--fx', ((x - r.left) / r.width) * 100 + '%');
      stage.style.setProperty('--fy', ((y - r.top) / r.height) * 100 + '%');
    };
    stage.addEventListener('pointermove', (e) => moveLight(e.clientX, e.clientY));
    stage.addEventListener('pointerdown', (e) => moveLight(e.clientX, e.clientY));

    // overlays
    $('#panelClose').onclick = closePanel;
    $('#panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
    $$('[data-close]').forEach((b) => (b.onclick = () => $('#' + b.dataset.close).classList.add('hidden')));
    ['hints', 'settings'].forEach((id) => $('#' + id).addEventListener('click', (e) => { if (e.target.id === id) $('#' + id).classList.add('hidden'); }));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#panel').classList.contains('hidden')) closePanel();
      $('#hints').classList.add('hidden'); $('#settings').classList.add('hidden');
    });
    $('#btnHints').onclick = openHints;
    $('#btnSettings').onclick = () => $('#settings').classList.remove('hidden');
    $('#optSound').onchange = (e) => { settings.sound = e.target.checked; writeLS(KEY + 'settings', settings); SFX.init(); SFX.setOn(settings.sound); };
    $('#optScares').onchange = (e) => { settings.scares = e.target.checked; writeLS(KEY + 'settings', settings); };
    $('#btnRestart').onclick = () => {
      if (!confirm('Restart your room from the beginning? Your partner keeps their progress.')) return;
      S = fresh(); save(); $('#settings').classList.add('hidden'); renderRoom(); renderInv(); startLoop(); toast('You wake up again. Again.');
    };
    $('#btnSwitch').onclick = () => { clearInterval(loopId); $('#settings').classList.add('hidden'); refreshResume(); show('screen-choose'); };

    // debug / sharing: ?role=saya or ?role=rin jumps straight in
    const qs = new URLSearchParams(location.search);
    if (qs.has('reset')) { delLS(KEY + 'saya'); delLS(KEY + 'rin'); }
    const qp = qs.get('role');
    if (qp === 'saya' || qp === 'rin') chooseRole(qp);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
