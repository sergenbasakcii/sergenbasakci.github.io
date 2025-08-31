(function(){
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()))}
const $=id=>document.getElementById(id)
const S={play:false,idx:0,chunks:[],timer:null,shown:0,breathMark:0,accent:"#38bdf8"}
const screen=$('screen'),wpm=$('wpm'),wpmVal=$('wpmVal'),chunkSel=$('chunk'),orp=$('orp'),breath=$('breath'),prog=$('progress'),bar=$('bar'),input=$('input'),pdfFile=$('pdfFile'),drop=$('drop')
const startBtn=$('start'),pauseBtn=$('pause'),back10=$('back10'),fwd10=$('fwd10'),fsize=$('fsize'),color=$('color'),sound=$('sound'),themeBtn=$('theme')
const tabs=[...document.querySelectorAll('.tab')],panels={paste:$('panel-paste'),pdf:$('panel-pdf')},toast=$('toast')
const base=()=>Math.round(60000/parseInt(wpm.value,10))
const tone=()=>{if(!sound.checked)return;try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator();o.type='sine';o.frequency.value=880;const g=a.createGain();g.gain.value=0.04;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},60)}catch(e){}}
const show=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300)}
const norm=t=>t.replace(/\r/g,' ').replace(/\u00AD/g,'').replace(/-\s*\n/g,'').replace(/\s+\n/g,' ').replace(/\n+/g,' ').replace(/\s+/g,' ').trim()
const orpI=w=>{const l=w.length;return l<=1?0:l<=5?1:l<=9?2:Math.min(3,l-1)}
const pDelay=t=>{const x=t.trim();return /[.!?]$/.test(x)?300:/[,;:]$/.test(x)?120:x.includes('—')?200:0}
const toChunks=(ws,s)=>{const a=[];for(let i=0;i<ws.length;i+=s)a.push(ws.slice(i,i+s));return a}
const render=arr=>{const txt=arr.join(' ');if(!orp.checked){screen.innerHTML=txt;return}const tgt=arr.reduce((a,b)=>(b.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,'').length>a.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,'').length)?b:a,arr[0]);const clean=tgt.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,'');const i=Math.min(orpI(clean),Math.max(clean.length-1,0));const A=clean.slice(0,i),P=clean.slice(i,i+1),B=clean.slice(i+1);const hi=tgt.replace(clean,`${A}<b style="color:${S.accent}">${P}</b>${B}`);screen.innerHTML=txt.replace(tgt,hi)}
const updateUI=()=>{prog.textContent=`${Math.min(S.idx+1,Math.max(S.chunks.length,1))} / ${Math.max(S.chunks.length,0)}`;const pct=S.chunks.length?(S.idx/S.chunks.length)*100:0;bar.style.width=`${pct}%`;back10.disabled=S.idx<=0;fwd10.disabled=S.idx>=Math.max(S.chunks.length-1,0);pauseBtn.textContent=S.play?'Duraklat':'Devam Et'}
const tick=()=>{if(!S.play||S.idx>=S.chunks.length){S.play=false;updateUI();return}const cur=S.chunks[S.idx];render(cur);const per=Math.max(40,Math.round(base()/cur.length));const long=cur.reduce((a,b)=>b.length>a.length?b:a,cur[0]).length>=12?90:0;const pd=pDelay(cur[cur.length-1]);const br=(breath.checked&&S.shown>=S.breathMark+100)?1000:0;if(br)S.breathMark=S.shown;const delay=per+long+pd+br;S.shown+=cur.length;S.idx++;updateUI();tone();S.timer=setTimeout(tick,delay)}
const rebuild=()=>{const txt=norm(input.value||'');if(!txt){S.chunks=[];S.idx=0;updateUI();return}const ws=txt.split(' ').filter(Boolean);S.chunks=toChunks(ws,parseInt(chunkSel.value,10));S.idx=0;S.shown=0;S.breathMark=0;updateUI()}
const ensureText=()=>{if(norm(input.value||'')!=='')return true;input.value=`Bu bir RSVP örneğidir. Metin küçük gruplar halinde aynı noktada gösterilir. Noktalama işaretleri ritim sağlar; virgülden sonra kısa, noktadan sonra uzun duraklama yapılır. Uzun kelimelerde ORP vurgusu algıyı hızlandırır. Hız ve chunk değerlerini değiştirerek ideal akışınızı bulun.`;rebuild();show('Örnek metin yüklendi');return true}
const start=()=>{ensureText();rebuild();S.play=true;S.idx=0;updateUI();tick()}
const resumePause=()=>{if(!S.chunks.length){show('Önce metin ekleyin veya PDF yükleyin');return}S.play=!S.play;updateUI();if(S.play)tick()}
const setSize=()=>{screen.style.fontSize=fsize.value+'px'}
const setColor=()=>{S.accent=color.value;document.documentElement.style.setProperty('--accent',S.accent)}
wpm.addEventListener('input',()=>{wpmVal.textContent=wpm.value})
chunkSel.addEventListener('input',()=>{const pos=S.idx;rebuild();S.idx=Math.min(pos,S.chunks.length-1);updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])})
orp.addEventListener('input',()=>render(S.chunks[S.idx]||['Hazır']))
breath.addEventListener('input',()=>{})
startBtn.addEventListener('click',start)
pauseBtn.addEventListener('click',resumePause)
back10.addEventListener('click',()=>{S.idx=Math.max(0,S.idx-10);updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])})
fwd10.addEventListener('click',()=>{S.idx=Math.min(S.chunks.length-1,S.idx+10);updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])})
fsize.addEventListener('input',setSize)
color.addEventListener('input',setColor)
$('clear').addEventListener('click',()=>{input.value='';rebuild();screen.textContent='Hazır';show('Temizlendi')})
$('loadSample').addEventListener('click',()=>{ensureText();rebuild();render(S.chunks[0]||['Hazır'])})
$('saveState').addEventListener('click',()=>{localStorage.setItem('rsvp_state',JSON.stringify({i:S.idx,txt:input.value,wpm:wpm.value,chunk:chunkSel.value,orp:orp.checked,breath:breath.checked,fsize:fsize.value,color:color.value})) ;show('Kaydedildi')})
$('loadState').addEventListener('click',()=>{const raw=localStorage.getItem('rsvp_state');if(!raw){show('Kayıt yok');return}const s=JSON.parse(raw);input.value=s.txt||'';wpm.value=s.wpm||'450';wpmVal.textContent=wpm.value;chunkSel.value=s.chunk||'2';orp.checked=!!s.orp;breath.checked=!!s.breath;fsize.value=s.fsize||'56';color.value=s.color||'#38bdf8';setSize();setColor();rebuild();S.idx=Math.min(s.i||0,S.chunks.length-1);updateUI();if(S.chunks[S.idx])render(S.chunks[S.idx]);show('Yüklendi')})
const tabTo=k=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===k));Object.keys(panels).forEach(p=>panels[p].classList.toggle('show',p===k))}
tabs.forEach(t=>t.addEventListener('click',()=>tabTo(t.dataset.tab)))
drop.addEventListener('click',()=>pdfFile.click())
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag')})
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'))
drop.addEventListener('drop',async e=>{e.preventDefault();drop.classList.remove('drag');const f=e.dataTransfer.files?.[0];if(f)await readPdf(f)})
pdfFile.addEventListener('change',async e=>{const f=e.target.files?.[0];if(f)await readPdf(f)})
async function readPdf(f){input.value='PDF okunuyor...';try{const buf=await f.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let txt='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const c=await page.getTextContent();const s=c.items.map(i=>{if(i&&typeof i.str==='string')return i.str; if(i&&typeof i.text==='string')return i.text; return ''}).join(' ');txt+='\\n'+s}input.value=txt||'(Metin bulunamadı)';tabTo('paste');rebuild();render(S.chunks[0]||['Hazır']);show('PDF yüklendi')}catch(e){input.value='PDF okunamadı.';rebuild();show('PDF okunamadı')}}
document.addEventListener('keydown',e=>{if(e.target.tagName==='TEXTAREA'||e.target.type==='range'||e.target.type==='color')return;if(e.code==='Space'){e.preventDefault();resumePause()}if(e.key==='ArrowLeft'){S.idx=Math.max(0,S.idx-(e.shiftKey?10:1));updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])}if(e.key==='ArrowRight'){S.idx=Math.min(S.chunks.length-1,S.idx+(e.shiftKey?10:1));updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])}if(e.key==='ArrowUp'){wpm.value=String(Math.min(1200,parseInt(wpm.value)+25));wpmVal.textContent=wpm.value}if(e.key==='ArrowDown'){wpm.value=String(Math.max(150,parseInt(wpm.value)-25));wpmVal.textContent=wpm.value}if(['1','2','3'].includes(e.key)){chunkSel.value=e.key;const pos=S.idx;rebuild();S.idx=Math.min(pos,S.chunks.length-1);updateUI();if(!S.play&&S.chunks[S.idx])render(S.chunks[S.idx])}if(e.key.toLowerCase()==='o'){orp.checked=!orp.checked;render(S.chunks[S.idx]||['Hazır'])}if(e.key.toLowerCase()==='b'){breath.checked=!breath.checked}})
let theme='dark';$('theme').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',theme)})
(function init(){screen.textContent='Hazır';wpmVal.textContent=wpm.value;const saved=localStorage.getItem('rsvp_state');if(saved){try{const s=JSON.parse(saved);if(s.color)document.documentElement.style.setProperty('--accent',s.color)}catch(e){}}})()
})();