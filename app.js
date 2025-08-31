const el=(i)=>document.getElementById(i)
const st={p:false,i:0,c:[],t:null,s:0,b:0,accent:"#38bdf8"}
const screen=el('screen'),wpm=el('wpm'),wpmVal=el('wpmVal'),chunkSel=el('chunk'),orpChk=el('orp'),breathChk=el('breath'),progress=el('progress'),bar=el('bar'),input=el('input'),pdfFile=el('pdfFile'),drop=el('drop'),imgFile=el('imgFile')
const startBtn=el('start'),pauseBtn=el('pause'),back10=el('back10'),fwd10=el('fwd10'),fsize=el('fsize'),color=el('color'),sound=el('sound')
const tabs=[...document.querySelectorAll('.tab')],panels={paste:el('panel-paste'),pdf:el('panel-pdf'),ocr:el('panel-ocr')}
const tone=()=>{if(!sound.checked)return; try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator();o.type="sine";o.frequency.value=880;const g=a.createGain();g.gain.value=0.02;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},60)}catch(e){}}
const norm=(x)=>x.replace(/\r/g," ").replace(/\u00AD/g,"").replace(/-\s*\n/g,"").replace(/\s+\n/g," ").replace(/\n+/g," ").replace(/\s+/g," ").trim()
const orpI=(w)=>{const l=w.length; if(l<=1) return 0; if(l<=5) return 1; if(l<=9) return 2; return Math.min(3,l-1)}
const pDelay=(t)=>{const x=t.trim(); if(/[.!?]$/.test(x)) return 300; if(/[,;:]$/.test(x)) return 120; if(x.includes("—")) return 200; return 0}
const chunks=(ws,s)=>{const a=[]; for(let i=0;i<ws.length;i+=s)a.push(ws.slice(i,i+s)); return a}
const base=()=>Math.round(60000/parseInt(wpm.value,10))
const render=(arr)=>{const txt=arr.join(" "); if(!orpChk.checked){screen.innerHTML=txt; return} const tgt=arr.reduce((a,b)=>(b.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"").length>a.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"").length)?b:a,arr[0]); const clean=tgt.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,""); const oi=Math.min(orpI(clean),Math.max(clean.length-1,0)); const A=clean.slice(0,oi),P=clean.slice(oi,oi+1),B=clean.slice(oi+1); const hi=tgt.replace(clean,`${A}<b style="color:${st.accent}">${P}</b>${B}`); screen.innerHTML=txt.replace(tgt,hi)}
const prog=()=>{progress.textContent=`${Math.min(st.i+1,Math.max(st.c.length,1))} / ${Math.max(st.c.length,0)}`; const pct=st.c.length?(st.i/st.c.length)*100:0; bar.style.width=`${pct}%`}
const next=()=>{if(!st.p||st.i>=st.c.length){st.p=false; return} const cur=st.c[st.i]; render(cur); const per=Math.max(40,Math.round(base()/cur.length)); const long=cur.reduce((a,b)=>b.length>a.length?b:a,cur[0]).length>=12?90:0; const pd=pDelay(cur[cur.length-1]); const br=(breathChk.checked&&st.s>=st.b+100)?1000:0; if(br) st.b=st.s; const d=per+long+pd+br; st.s+=cur.length; st.i++; prog(); tone(); st.t=setTimeout(next,d)}
const rebuild=()=>{const txt=norm(input.value||""); if(!txt){st.c=[]; st.i=0; prog(); return} const ws=txt.split(" ").filter(Boolean); st.c=chunks(ws,parseInt(chunkSel.value,10)); st.i=0; st.s=0; st.b=0; prog()}
const setSize=()=>{screen.style.fontSize=fsize.value+'px'}
const setColor=()=>{st.accent=color.value; document.documentElement.style.setProperty('--accent',st.accent)}
wpm.addEventListener('input',()=>{wpmVal.textContent=wpm.value})
chunkSel.addEventListener('input',rebuild)
orpChk.addEventListener('input',()=>render(st.c[st.i]||["Hazır"]))
breathChk.addEventListener('input',()=>{})
startBtn.addEventListener('click',()=>{if(!st.c.length) rebuild(); st.p=true; next()})
pauseBtn.addEventListener('click',()=>{st.p=false; if(st.t) clearTimeout(st.t)})
back10.addEventListener('click',()=>{st.i=Math.max(0,st.i-10); prog(); if(!st.p&&st.c[st.i]) render(st.c[st.i])})
fwd10.addEventListener('click',()=>{st.i=Math.min(st.c.length-1,st.i+10); prog(); if(!st.p&&st.c[st.i]) render(st.c[st.i])})
fsize.addEventListener('input',setSize)
color.addEventListener('input',setColor)
el('clear').addEventListener('click',()=>{input.value=""; rebuild(); screen.textContent="Hazır"})
el('loadSample').addEventListener('click',()=>{input.value=`Bu bir RSVP denemesidir. Metin küçük gruplar halinde aynı noktada gösterilir. Noktalama işaretleri doğal ritim sağlar; virgülden sonra kısa, noktadan sonra uzun beklenir. Uzun kelimelerde ORP vurgusu algıyı hızlandırır. Hız ve chunk değerlerini değiştirerek ideal akışını bul.`; rebuild()})
el('saveState').addEventListener('click',()=>{localStorage.setItem('rsvp_state',JSON.stringify({i:st.i,txt:input.value,wpm:wpm.value,chunk:chunkSel.value,orp:orpChk.checked,breath:breathChk.checked,fsize:fsize.value,color:color.value}))})
el('loadState').addEventListener('click',()=>{const raw=localStorage.getItem('rsvp_state'); if(!raw) return; const s=JSON.parse(raw); input.value=s.txt||''; wpm.value=s.wpm||'450'; wpmVal.textContent=wpm.value; chunkSel.value=s.chunk||'2'; orpChk.checked=!!s.orp; breathChk.checked=!!s.breath; fsize.value=s.fsize||'56'; color.value=s.color||'#38bdf8'; setSize(); setColor(); rebuild(); st.i=Math.min(s.i||0,st.c.length-1); prog(); if(st.c[st.i]) render(st.c[st.i])})
const tabsw=(k)=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===k)); Object.keys(panels).forEach(p=>panels[p].classList.toggle('show',p===k))}
tabs.forEach(t=>t.addEventListener('click',()=>tabsw(t.dataset.tab)))
drop.addEventListener('click',()=>pdfFile.click())
drop.addEventListener('dragover',(e)=>{e.preventDefault(); drop.classList.add('drag')})
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'))
drop.addEventListener('drop',async(e)=>{e.preventDefault(); drop.classList.remove('drag'); const f=e.dataTransfer.files?.[0]; if(f) await readPdfFile(f)})
pdfFile.addEventListener('change',async(e)=>{const f=e.target.files?.[0]; if(f) await readPdfFile(f)})
async function readPdfFile(f){input.value='PDF okunuyor...'; try{const buf=await f.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; let txt=''; for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p); const c=await page.getTextContent(); const s=c.items.map(i=>('str'in i)?i.str:(i?.text||'')).join(' '); txt+='\n'+s} input.value=txt||'(Metin bulunamadı. Görüntü tabanlı olabilir; OCR sekmesini deneyin.)'}catch(e){input.value='PDF okunamadı.'} rebuild(); tabsw('paste')}
let ocrReady=false
el('enableOcr').addEventListener('click',async()=>{if(ocrReady) return; const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; s.onload=()=>{ocrReady=true; alert('OCR etkin. Görsel veya PDF seçebilirsiniz.');}; document.body.appendChild(s)})
imgFile.addEventListener('change',async(e)=>{const f=e.target.files?.[0]; if(!f||!ocrReady) return alert('Önce OCR\'yi etkinleştirin.'); input.value='OCR çalışıyor...'; try{if(f.type==='application/pdf'){await readPdfFile(f)} else {const b=await f.arrayBuffer(); const {createWorker}=Tesseract; const worker=await createWorker('tur'); const {data:{text}}=await worker.recognize(new Blob([b])); await worker.terminate(); input.value=text||'(Metin çıkmadı)'; rebuild(); tabsw('paste')}}catch(e){input.value='OCR başarısız.'; rebuild()})
document.addEventListener('keydown',(e)=>{if(e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT') return; if(e.code==='Space'){e.preventDefault(); st.p=!st.p; if(st.p) next(); return} if(e.key==='ArrowLeft'){st.i=Math.max(0,st.i-(e.shiftKey?10:1)); prog(); if(!st.p&&st.c[st.i]) render(st.c[st.i])} if(e.key==='ArrowRight'){st.i=Math.min(st.c.length-1,st.i+(e.shiftKey?10:1)); prog(); if(!st.p&&st.c[st.i]) render(st.c[st.i])} if(e.key==='ArrowUp'){wpm.value=String(Math.min(1200,parseInt(wpm.value)+25)); wpmVal.textContent=wpm.value} if(e.key==='ArrowDown'){wpm.value=String(Math.max(150,parseInt(wpm.value)-25)); wpmVal.textContent=wpm.value} if(['1','2','3'].includes(e.key)){chunkSel.value=e.key; rebuild()} if(e.key.toLowerCase()==='o'){orpChk.checked=!orpChk.checked; render(st.c[st.i]||["Hazır"])} if(e.key.toLowerCase()==='b'){breathChk.checked=!breathChk.checked}})
const themeBtn=el('theme'); let dark=true; themeBtn.addEventListener('click',()=>{dark=!dark; document.documentElement.style.filter=dark?'none':'invert(1) hue-rotate(180deg)'})
setSize(); setColor(); wpmVal.textContent=wpm.value; render(["Hazır"]); prog()
let deferredPrompt=null; const installBtn=el('install'); window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault(); deferredPrompt=e; installBtn.style.opacity=1}); installBtn.addEventListener('click',async()=>{if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null})
