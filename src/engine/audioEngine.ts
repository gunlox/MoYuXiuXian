/** Web Audio 合成音效引擎 */

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted(): boolean { return muted; }

/** 播放一个简单音调 */
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore audio errors */ }
}

/** 播放和弦（多个音同时） */
function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  freqs.forEach(f => playTone(f, duration, type, volume));
}

// ============ 游戏音效 ============

/** 突破成功 — 上升和弦 */
export function sfxBreakthroughSuccess() {
  playTone(523, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 200);
  setTimeout(() => playChord([1047, 1319], 0.4, 'sine', 0.1), 350);
}

/** 突破失败 — 下降不和谐音 */
export function sfxBreakthroughFail() {
  playTone(400, 0.2, 'sawtooth', 0.08);
  setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.06), 150);
  setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.04), 300);
}

/** 战斗攻击 */
export function sfxAttack() {
  playTone(200, 0.08, 'square', 0.06);
  setTimeout(() => playTone(150, 0.05, 'square', 0.04), 50);
}

/** 战斗胜利 */
export function sfxVictory() {
  playTone(660, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(880, 0.15, 'sine', 0.08), 80);
  setTimeout(() => playTone(1100, 0.2, 'sine', 0.1), 180);
}

/** 掉落物品 */
export function sfxDrop() {
  playTone(1200, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(1500, 0.12, 'sine', 0.06), 60);
}

/** 炼丹成功 */
export function sfxAlchemySuccess() {
  playTone(800, 0.1, 'triangle', 0.08);
  setTimeout(() => playTone(1000, 0.1, 'triangle', 0.08), 80);
  setTimeout(() => playTone(1200, 0.15, 'triangle', 0.1), 160);
}

/** 炼丹失败 */
export function sfxAlchemyFail() {
  playTone(300, 0.2, 'triangle', 0.06);
  setTimeout(() => playTone(250, 0.3, 'triangle', 0.04), 150);
}

/** 按钮点击 */
export function sfxClick() {
  playTone(800, 0.04, 'sine', 0.05);
}

/** 秘境进入 */
export function sfxDungeonEnter() {
  playTone(400, 0.15, 'sine', 0.06);
  setTimeout(() => playTone(500, 0.15, 'sine', 0.06), 100);
  setTimeout(() => playTone(600, 0.2, 'sine', 0.08), 200);
}

/** 秘境Boss出现 */
export function sfxBoss() {
  playTone(150, 0.3, 'sawtooth', 0.08);
  setTimeout(() => playTone(120, 0.4, 'sawtooth', 0.06), 200);
}
