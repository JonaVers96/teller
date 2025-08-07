const DEFAULT_STATE = {
  count: 0,
  goal: 1000,
  plus: [5, 10, 15, 20],
  minus: [-10, -100],
};

function loadState(){
  try{
    const raw = localStorage.getItem('counterState');
    if(!raw) return {...DEFAULT_STATE};
    const parsed = JSON.parse(raw);
    // Merge with defaults to be safe when keys are missing
    return {
      count: Number.isFinite(parsed.count) ? parsed.count : DEFAULT_STATE.count,
      goal: Number.isFinite(parsed.goal) && parsed.goal > 0 ? parsed.goal : DEFAULT_STATE.goal,
      plus: Array.isArray(parsed.plus) && parsed.plus.length === 4 ? parsed.plus.map(Number) : [...DEFAULT_STATE.plus],
      minus: Array.isArray(parsed.minus) && parsed.minus.length === 2 ? parsed.minus.map(Number) : [...DEFAULT_STATE.minus],
    };
  }catch{ return {...DEFAULT_STATE}; }
}

let state = loadState();

function saveState(){
  localStorage.setItem('counterState', JSON.stringify(state));
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function percent(){
  if(state.goal <= 0) return 0;
  return clamp((state.count / state.goal) * 100, 0, 100);
}

// Elements
const countText = document.getElementById('countText');
const goalText = document.getElementById('goalText');
const percentText = document.getElementById('percentText');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');

// Buttons
const plusBtns = [
  document.getElementById('btnP1'),
  document.getElementById('btnP2'),
  document.getElementById('btnP3'),
  document.getElementById('btnP4'),
];
const minusBtns = [
  document.getElementById('btnM1'),
  document.getElementById('btnM2'),
];

function updateButtonLabels(){
  plusBtns.forEach((btn, i) => { btn.textContent = `${state.plus[i] >= 0 ? '+' : ''}${state.plus[i]}`; });
  minusBtns.forEach((btn, i) => { btn.textContent = `${state.minus[i] >= 0 ? '+' : ''}${state.minus[i]}`; });
}

function setButtonDisabledStates(){
  plusBtns.forEach((btn, i) => { btn.disabled = state.plus[i] > 0 && state.count >= state.goal; });
  minusBtns.forEach((btn, i) => { btn.disabled = state.minus[i] < 0 && state.count <= 0; });
}

function render(){
  // Clamp count to [0, goal]
  state.count = clamp(state.count, 0, state.goal);

  countText.textContent = state.count.toLocaleString('nl-BE');
  goalText.textContent = state.goal.toLocaleString('nl-BE');
  const pct = Math.floor(percent());
  percentText.textContent = pct + '%';
  progressLabel.textContent = pct + '%';
  progressBar.style.width = pct + '%';
  document.querySelector('.progress-wrap').setAttribute('aria-valuenow', String(pct));

  updateButtonLabels();
  setButtonDisabledStates();
  saveState();
}

function bump(delta){
  const next = state.count + Number(delta);
  state.count = clamp(next, 0, state.goal);
  render();
}

// Attach button handlers
plusBtns.forEach((btn, i) => btn.addEventListener('click', () => bump(state.plus[i])));
minusBtns.forEach((btn, i) => btn.addEventListener('click', () => bump(state.minus[i])));

// Keyboard shortcuts (ignore when typing in inputs)
addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  const typing = tag === 'input' || tag === 'textarea' || e.isContentEditable;
  if(typing) return;
  if(e.key === 'Enter'){ e.preventDefault(); bump(1); }
  if(e.key === 'Backspace'){ e.preventDefault(); bump(-1); }
});

// Settings drawer logic
const settings = document.getElementById('settings');
const backdrop = document.getElementById('backdrop');
const menuToggle = document.getElementById('menuToggle');
const closeSettings = document.getElementById('closeSettings');
const settingsForm = document.getElementById('settingsForm');

function openSettings(){
  // Populate inputs with current state
  document.getElementById('goalInput').value = state.goal;
  document.getElementById('p1Input').value = state.plus[0];
  document.getElementById('p2Input').value = state.plus[1];
  document.getElementById('p3Input').value = state.plus[2];
  document.getElementById('p4Input').value = state.plus[3];
  document.getElementById('m1Input').value = state.minus[0];
  document.getElementById('m2Input').value = state.minus[1];

  settings.classList.add('open');
  settings.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  backdrop.classList.remove('hidden');
}
function closeSettingsPanel(){
  settings.classList.remove('open');
  settings.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  backdrop.classList.add('hidden');
}

menuToggle.addEventListener('click', () => {
  const isOpen = settings.classList.contains('open');
  if(isOpen) closeSettingsPanel(); else openSettings();
});
closeSettings?.addEventListener('click', closeSettingsPanel);
backdrop.addEventListener('click', closeSettingsPanel);

// Save settings
settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const goal = Number(document.getElementById('goalInput').value);
  const p1 = Number(document.getElementById('p1Input').value);
  const p2 = Number(document.getElementById('p2Input').value);
  const p3 = Number(document.getElementById('p3Input').value);
  const p4 = Number(document.getElementById('p4Input').value);
  const m1 = Number(document.getElementById('m1Input').value);
  const m2 = Number(document.getElementById('m2Input').value);

  if(Number.isFinite(goal) && goal > 0) state.goal = Math.floor(goal);
  state.plus = [p1,p2,p3,p4].map(v => Number.isFinite(v) ? Math.floor(v) : 0);
  state.minus = [m1,m2].map(v => Number.isFinite(v) ? Math.floor(v) : 0);

  render();
  closeSettingsPanel();
});

// Defaults & reset
const resetDefaultsBtn = document.getElementById('resetDefaults');
const resetCounterBtn = document.getElementById('resetCounter');
resetDefaultsBtn.addEventListener('click', () => {
  state.goal = DEFAULT_STATE.goal;
  state.plus = [...DEFAULT_STATE.plus];
  state.minus = [...DEFAULT_STATE.minus];
  // Reflect in inputs immediately
  document.getElementById('goalInput').value = state.goal;
  document.getElementById('p1Input').value = state.plus[0];
  document.getElementById('p2Input').value = state.plus[1];
  document.getElementById('p3Input').value = state.plus[2];
  document.getElementById('p4Input').value = state.plus[3];
  document.getElementById('m1Input').value = state.minus[0];
  document.getElementById('m2Input').value = state.minus[1];
});
resetCounterBtn.addEventListener('click', () => { state.count = 0; render(); });



// === Confetti ===
// Lightweight canvas confetti without external libs
const confettiCanvas = document.createElement('canvas');
confettiCanvas.className = 'confetti-canvas';
document.body.appendChild(confettiCanvas);
const cctx = confettiCanvas.getContext('2d');
let rafId = null;
function resizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
addEventListener('resize', resizeCanvas); resizeCanvas();

const COLORS = ['#FFC700','#FF3B3B','#2E3192','#41BBC7','#7F3F98','#00A651'];
function rand(min, max){ return Math.random()*(max-min)+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function burstConfetti(opts={}){
  const { count = 180, duration = 2500 } = opts;
  const particles = [];
  const w = confettiCanvas.width, h = confettiCanvas.height;
  for(let i=0;i<count;i++){
    particles.push({
      x: rand(0, w),
      y: -10,
      size: rand(6,12),
      angle: rand(0, Math.PI*2),
      spin: rand(-0.3, 0.3),
      vx: rand(-3, 3),
      vy: rand(2, 7),
      ay: 0.12,
      color: pick(COLORS),
    });
  }
  let start;
  function frame(ts){
    if(!start) start = ts;
    const t = ts - start;
    cctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.vy += p.ay; p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.angle);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      cctx.restore();
    }
    if(t < duration){ rafId = requestAnimationFrame(frame); } else { cctx.clearRect(0,0,w,h); cancelAnimationFrame(rafId); }
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}

// Initial confetti burst on goal reached
if(state.count >= state.goal){
  burstConfetti({ count: 300, duration: 4000 });
  // Reset count after confetti
  setTimeout(() => { state.count = 0; render(); }, 4000);
}
function checkGoalReached(){
  if(state.count >= state.goal){
    burstConfetti({ count: 300, duration: 4000 });
    // Reset count after confetti
    setTimeout(() => { state.count = 0; render(); }, 4000);
  }
}
// Initial render
render();
// Initial goal check
checkGoalReached();
