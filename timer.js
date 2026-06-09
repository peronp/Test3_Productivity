const MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#e05c5c' },
  short: { label: 'Short Break', minutes: 5,  color: '#4caf92' },
  long:  { label: 'Long Break',  minutes: 15, color: '#5b8dd9' },
};

const CIRCUMFERENCE = 2 * Math.PI * 88; // matches r=88 in SVG

let mode        = 'focus';
let totalSecs   = MODES.focus.minutes * 60;
let remaining   = totalSecs;
let running     = false;
let interval    = null;
let completed   = 0;
let session     = 1;

// Elements
const display       = document.getElementById('display');
const ring          = document.getElementById('ring');
const startBtn      = document.getElementById('startBtn');
const resetBtn      = document.getElementById('resetBtn');
const settingsBtn   = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settings');
const sessionNum    = document.getElementById('sessionNum');
const completedEl   = document.getElementById('completedCount');
const tabs          = document.querySelectorAll('.tab');
const app           = document.getElementById('app');

// Audio (simple beep via Web Audio API — no file needed)
function beep(freq = 520, duration = 0.18, count = 3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration);
      t += duration + 0.1;
    }
  } catch (_) {}
}

function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
}

function updateRing() {
  const progress = remaining / totalSecs;
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function render() {
  display.textContent = fmt(remaining);
  updateRing();
  sessionNum.textContent = session;
  completedEl.textContent = completed;
}

function switchMode(m) {
  stop();
  mode = m;
  totalSecs = MODES[m].minutes * 60;
  remaining  = totalSecs;
  setAccent(MODES[m].color);
  tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === m));
  ring.style.stroke = MODES[m].color;
  startBtn.textContent = 'Start';
  render();
}

function start() {
  running = true;
  startBtn.textContent = 'Pause';
  interval = setInterval(() => {
    remaining--;
    render();
    if (remaining <= 0) {
      clearInterval(interval);
      running = false;
      onComplete();
    }
  }, 1000);
}

function pause() {
  running = false;
  startBtn.textContent = 'Resume';
  clearInterval(interval);
}

function stop() {
  running = false;
  clearInterval(interval);
}

function onComplete() {
  beep();
  app.classList.add('flash');
  app.addEventListener('animationend', () => app.classList.remove('flash'), { once: true });

  if (mode === 'focus') {
    completed++;
    session++;
    // Auto-suggest break
    const next = (session % 4 === 0) ? 'long' : 'short';
    setTimeout(() => switchMode(next), 600);
  } else {
    setTimeout(() => switchMode('focus'), 600);
  }
}

// Event listeners
startBtn.addEventListener('click', () => {
  if (running) pause(); else start();
});

resetBtn.addEventListener('click', () => {
  stop();
  remaining = totalSecs;
  startBtn.textContent = 'Start';
  render();
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
});

document.getElementById('saveSettings').addEventListener('click', () => {
  const f = parseInt(document.getElementById('setFocus').value, 10);
  const s = parseInt(document.getElementById('setShort').value, 10);
  const l = parseInt(document.getElementById('setLong').value, 10);
  if (!f || !s || !l) {
    document.getElementById('settingsError').textContent = 'All values must be greater than 0.';
    return;
  }
  document.getElementById('settingsError').textContent = '';
  MODES.focus.minutes = f;
  MODES.short.minutes = s;
  MODES.long.minutes  = l;
  settingsPanel.classList.add('hidden');
  switchMode(mode); // reload with new duration
});

// Init
ring.style.strokeDasharray = CIRCUMFERENCE;
ring.style.strokeDashoffset = 0;
setAccent(MODES.focus.color);
render();
