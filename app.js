// RSVP Reader - pure client-side
const el = (id) => document.getElementById(id);

const state = {
  playing: false,
  idx: 0,
  chunks: [],
  timer: null,
  totalShown: 0,
  lastBreath: 0,
};

// ---- UI refs
const screen = el('screen');
const wpm = el('wpm');
const wpmVal = el('wpmVal');
const chunkSel = el('chunk');
const orpChk = el('orp');
const breathChk = el('breath');
const progress = el('progress');
const bar = el('bar');
const input = el('input');
const toggleBtn = el('toggle');
const pdfFile = el('pdfFile');

// ---- Helpers
const normalize = (txt) => txt
  .replace(/\r/g," ")
  .replace(/\u00AD/g,"")         // soft hyphen
  .replace(/-\s*\n/g, "")        // hyphenated line breaks
  .replace(/\s+\n/g, " ")
  .replace(/\n+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const calcOrpIndex = (word) => {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return Math.min(3, len - 1);
};

const punctDelay = (token) => {
  const t = token.trim();
  if (/[.!?]$/.test(t)) return 300;
  if (/[,;:]$/.test(t)) return 120;
  if (t.includes("—")) return 200;
  return 0;
};

const makeChunks = (words, size) => {
  const chunks = [];
  for (let i=0; i<words.length; i+=size){
    chunks.push(words.slice(i, i+size));
  }
  return chunks;
};

const baseDelayMs = () => Math.round(60000 / parseInt(wpm.value,10));

const renderChunk = (arr) => {
  const text = arr.join(" ");
  if (!orpChk.checked) { screen.innerHTML = text; return; }
  const target = arr.reduce((a,b)=> (b.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"").length > a.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"").length) ? b : a, arr[0]);
  const clean = target.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"");
  const orp = Math.min(calcOrpIndex(clean), Math.max(clean.length-1,0));
  const partA = clean.slice(0,orp), pivot = clean.slice(orp, orp+1), partB = clean.slice(orp+1);
  const highlighted = target.replace(clean, `${partA}<b>${pivot}</b>${partB}`);
  screen.innerHTML = text.replace(target, highlighted);
};

const updateProgress = () => {
  progress.textContent = `${Math.min(state.idx+1, Math.max(state.chunks.length,1))} / ${Math.max(state.chunks.length,0)}`;
  const pct = state.chunks.length ? (state.idx / state.chunks.length) * 100 : 0;
  bar.style.width = `${pct}%`;
};

const scheduleNext = () => {
  if (!state.playing || state.idx >= state.chunks.length) {
    state.playing = false; toggleBtn.textContent = 'Başlat'; return;
  }
  const current = state.chunks[state.idx];
  renderChunk(current);

  const perToken = Math.max(50, Math.round(baseDelayMs() / current.length));
  const longest = current.reduce((a,b)=> (b.length > a.length) ? b : a, current[0]);
  const longPenalty = longest.length >= 12 ? 90 : 0;
  const pDelay = punctDelay(current[current.length-1]);
  const breath = (breathChk.checked && state.totalShown >= state.lastBreath + 100) ? 1000 : 0;
  if (breath) state.lastBreath = state.totalShown;

  const delay = perToken + longPenalty + pDelay + breath;

  state.totalShown += current.length;
  state.idx++;
  updateProgress();

  state.timer = setTimeout(scheduleNext, delay);
};

const rebuildFromInput = () => {
  const txt = normalize(input.value || "");
  if (!txt) { state.chunks = []; state.idx=0; updateProgress(); return; }
  const words = txt.split(" ").filter(Boolean);
  state.chunks = makeChunks(words, parseInt(chunkSel.value,10));
  state.idx = 0; state.totalShown = 0; state.lastBreath = 0;
  updateProgress();
};

// ---- PDF handling (client-side only)
async function readPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const str = content.items.map(i => ('str' in i) ? i.str : (i?.text || '')).join(' ');
    text += "\n" + str;
  }
  return text;
}

// ---- Events
wpm.addEventListener('input', () => { wpmVal.textContent = wpm.value; });
['input','change'].forEach(evt=>{
  chunkSel.addEventListener(evt, rebuildFromInput);
  orpChk.addEventListener(evt, ()=> renderChunk(state.chunks[state.idx]||["Hazır"]));
  breathChk.addEventListener(evt, ()=>{});
});

el('toggle').addEventListener('click', ()=>{
  if (!state.chunks.length) rebuildFromInput();
  state.playing = !state.playing;
  toggleBtn.textContent = state.playing ? 'Duraklat' : 'Başlat';
  if (state.playing) scheduleNext(); else if (state.timer) clearTimeout(state.timer);
});

el('back10').addEventListener('click', ()=>{
  state.idx = Math.max(0, state.idx - 10); updateProgress();
  if (!state.playing && state.chunks[state.idx]) renderChunk(state.chunks[state.idx]);
});
el('fwd10').addEventListener('click', ()=>{
  state.idx = Math.min((state.chunks.length-1), state.idx + 10); updateProgress();
  if (!state.playing && state.chunks[state.idx]) renderChunk(state.chunks[state.idx]);
});

el('reset').addEventListener('click', ()=>{
  if (state.timer) clearTimeout(state.timer);
  state.playing=false; toggleBtn.textContent='Başlat';
  state.idx=0; state.chunks=[]; state.totalShown=0; state.lastBreath=0; 
  screen.textContent='Hazır'; updateProgress();
});

el('loadSample').addEventListener('click', ()=>{
  input.value = `Bu bir RSVP okuma denemesidir. Hızlı okuma için metin, kelime veya küçük gruplar halinde aynı noktada gösterilir.
Noktalama işaretleri doğal ritim için gecikme ekler: virgül sonrası kısa; nokta sonrası daha uzun bir duraklama yapılır.
Uzun kelimelerde algıyı kolaylaştırmak amacıyla ORP (Optimal Recognition Point) harfi vurgulanır. Hazırsan, "Başlat" tuşuna bas ve WPM değerini artırıp azaltarak kendine uygun hızı bul!`;
  rebuildFromInput();
});

el('saveState').addEventListener('click', ()=>{
  const save = {
    idx: state.idx,
    text: input.value,
    wpm: wpm.value,
    chunk: chunkSel.value,
    orp: orpChk.checked,
    breath: breathChk.checked
  };
  localStorage.setItem('rsvp_state', JSON.stringify(save));
  alert('Kayıt edildi (tarayıcıya).');
});

el('loadState').addEventListener('click', ()=>{
  const raw = localStorage.getItem('rsvp_state');
  if (!raw) return alert('Kayıt bulunamadı.');
  const save = JSON.parse(raw);
  input.value = save.text || '';
  wpm.value = save.wpm || '400'; wpmVal.textContent = wpm.value;
  chunkSel.value = save.chunk || '1';
  orpChk.checked = !!save.orp;
  breathChk.checked = !!save.breath;
  rebuildFromInput();
  state.idx = Math.min(save.idx || 0, state.chunks.length-1);
  updateProgress();
  if (state.chunks[state.idx]) renderChunk(state.chunks[state.idx]);
});

pdfFile.addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  // Pure client-side PDF text extraction
  input.value = 'PDF okunuyor...';
  try {
    const text = await readPdf(file);
    input.value = text || '(PDF metin çıkmadı; görüntü tabanlı olabilir. OCR için Tesseract.js ekleyebilirsiniz.)';
  } catch (err){
    console.error(err);
    input.value = 'PDF okunamadı. Dosya şifreli veya bozuk olabilir.';
  }
  rebuildFromInput();
});

// init
wpmVal.textContent = wpm.value;
renderChunk(["Hazır"]);
updateProgress();
