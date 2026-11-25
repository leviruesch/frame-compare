
const $=id=>document.getElementById(id),NAMES=["Oben","Unten"],COL=["#fb7185","#34d399"];
const fmt=(x,d=1)=>x.toFixed(d).replace(".",","),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const P=[0,1].map(i=>({i,z:1,tx:0,ty:0,shapes:[],sel:null,start:0,fps:30,drag:null,gid:null,name:"",url:null,blob:null,pstart:0}));
let lite=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=2,playing=false;try{const l=localStorage.getItem("fc_lite");if(l!==null)lite=l==="1"}catch(e){}
const DPR=()=>Math.min(window.devicePixelRatio||1,lite?1:2);
let n=0,timer=null,act=0,kind="l",mode="d",curCol="#fb7185",full=false;const PAL=["#fb7185","#34d399","#60a5fa","#fbbf24","#c084fc","#22d3ee","#f97316","#ffffff"];try{full=localStorage.getItem("fc_full")==="1"}catch(e){}
const V=i=>$("v"+i),step=p=>1/p.fps;

/* ---------- Speicher (IndexedDB, nur auf diesem Gerät) ---------- */
let dbp;const db=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open("framecompare",1);r.onupgradeneeded=()=>{const d=r.result;["videos","blobs"].forEach(s=>d.createObjectStore(s,{keyPath:"id"}));d.createObjectStore("meta",{keyPath:"k"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(st,mode,fn)=>{const d=await db();return new Promise((res,rej)=>{const t=d.transaction(st,mode);let r;try{r=fn(...[].concat(st).map(s=>t.objectStore(s)))}catch(e){rej(e)}t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)})};
const G={vids:[],cats:[],filter:"Alle",target:null,ok:true};
async function gload(){try{G.vids=await tx("videos","readonly",s=>s.getAll());const m=await tx("meta","readonly",s=>s.get("cats"));G.cats=m?m.v:[];G.ok=true}catch(e){G.ok=false}}
const saveCats=()=>tx("meta","readwrite",s=>s.put({k:"cats",v:G.cats}));
const putMeta=m=>tx("videos","readwrite",s=>s.put(m));
function thumb(file){return new Promise(res=>{const v=document.createElement("video"),u=URL.createObjectURL(file);v.muted=true;v.preload="auto";v.src=u;
  const fin=(t,d)=>{URL.revokeObjectURL(u);res({thumb:t,dur:d})},to=setTimeout(()=>fin("",0),5000);
  v.onloadedmetadata=()=>{v.currentTime=Math.min(1,v.duration/3)};
  v.onseeked=()=>{try{const c=document.createElement("canvas"),w=240,h=Math.round(w*v.videoHeight/v.videoWidth)||180;c.width=w;c.height=h;c.getContext("2d").drawImage(v,0,0,w,h);clearTimeout(to);fin(c.toDataURL("image/jpeg",.65),v.duration)}catch(e){clearTimeout(to);fin("",v.duration)}};
  v.onerror=()=>{clearTimeout(to);fin("",0)}})}
async function addVideos(files,cat){const out=[];for(const f of files){const t=await thumb(f),id=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));
  const m={id,name:f.name.replace(/\.[^.]+$/,""),cat:cat||"",thumb:t.thumb,dur:t.dur,size:f.size,added:Date.now(),fps:30,start:0};
  await tx(["videos","blobs"],"readwrite",(a,b)=>{a.put(m);b.put({id,blob:f})});G.vids.push(m);out.push(m)}
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}return out}

/* ---------- Dialoge ---------- */
function dlg(title,o={}){return new Promise(res=>{const d=$("dlg");d.innerHTML=`<div class="box"><b>${esc(title)}</b>${o.input?`<input id="dli" value="${esc(o.value||"")}" placeholder="${esc(o.input)}">`:""}<div class="its"></div><div class="r" style="justify-content:flex-end"><button id="dlx">Abbrechen</button>${o.input?'<button class="pri" id="dlo">OK</button>':""}</div></div>`;d.classList.add("on");
  const done=v=>{d.classList.remove("on");res(v)};(o.items||[]).forEach(([l,fn,dg])=>{const b=document.createElement("button");b.className=dg?"dg":"";b.textContent=l;b.onclick=()=>{done(null);fn&&fn()};d.querySelector(".its").appendChild(b)});
  $("dlx").onclick=()=>done(null);if(o.input){const i=$("dli");setTimeout(()=>i.focus(),50);$("dlo").onclick=()=>done(i.value.trim());i.onkeydown=e=>{if(e.key==="Enter")done(i.value.trim())}}})}

/* ---------- Galerie ---------- */
const dur=s=>s?Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"):"";
function grender(){
  $("chips").innerHTML=["Alle",...G.cats,"Ohne"].map(c=>`<button class="chip ${G.filter===c?"on":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")+'<button class="chip" id="addcat">+ Kategorie</button>';
  $("gmanage").innerHTML=G.cats.includes(G.filter)?'<button id="rencat">Kategorie umbenennen</button><button class="dg" id="delcat">Kategorie löschen</button>':"";
  const f=G.filter,l=G.vids.filter(v=>f==="Alle"||(f==="Ohne"?!v.cat:v.cat===f)).sort((a,b)=>b.added-a.added);
  $("grid").innerHTML=G.ok?(l.length?l.map(v=>`<div class="card" data-id="${v.id}"><div class="th" style="background-image:url('${v.thumb}')"></div><div class="cap"><b>${esc(v.name)}</b><span class="mu">${esc(v.cat||"Ohne Kategorie")} ${dur(v.dur)}${v.start?" · Start "+fmt(v.start,2)+" s":""}</span></div></div>`).join(""):'<div class="mu">Noch keine Videos hier. Mit „+ Videos“ hinzufügen.</div>'):'<div class="mu">Speichern ist in diesem Browser nicht möglich (z. B. privater Modus).</div>';
  if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(e=>$("gst").textContent="Gespeichert nur auf diesem Gerät · belegt "+fmt((e.usage||0)/1048576,0)+" MB");}
async function openGal(t){G.target=t;await gload();grender();$("gal").classList.add("on")}
const closeGal=()=>$("gal").classList.remove("on");
$("bgal").onclick=()=>openGal(null);$("gback").onclick=closeGal;
$("gadd").onchange=async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;$("gst").textContent="Speichere "+fs.length+" Video(s) …";
  try{await addVideos(fs,G.cats.includes(G.filter)?G.filter:"")}catch(err){G.ok=false}grender()};
async function pick(i,id){const m=G.vids.find(v=>v.id===id),r=await tx("blobs","readonly",s=>s.get(id));if(!r)return;setSlot(P[i],r.blob,m);closeGal()}
async function newCat(){const v=await dlg("Neue Kategorie",{input:"Name"});if(!v||["Alle","Ohne"].includes(v)||G.cats.includes(v))return null;G.cats.push(v);await saveCats();return v}
async function chooseCat(m){await dlg("Kategorie für „"+m.name+"“",{items:[["Ohne Kategorie",()=>setCat(m,"")],...G.cats.map(c=>[c,()=>setCat(m,c)]),["+ Neue Kategorie …",async()=>{const c=await newCat();if(c)setCat(m,c)}]]})}
async function setCat(m,c){m.cat=c;await putMeta(m);grender()}
$("gal").addEventListener("click",async e=>{const t=e.target.closest("[data-cat],[data-id],#addcat,#rencat,#delcat");if(!t)return;
  if(t.dataset.cat!==undefined){G.filter=t.dataset.cat;grender()}
  else if(t.id==="addcat"){const c=await newCat();if(c)G.filter=c;grender()}
  else if(t.id==="rencat"){const v=await dlg("Kategorie umbenennen",{input:"Name",value:G.filter});if(!v||["Alle","Ohne"].includes(v)||G.cats.includes(v))return;const o=G.filter;G.cats[G.cats.indexOf(o)]=v;await saveCats();for(const m of G.vids)if(m.cat===o){m.cat=v;await putMeta(m)}G.filter=v;grender()}
  else if(t.id==="delcat"){dlg("Kategorie „"+G.filter+"“ löschen? Die Videos bleiben erhalten.",{items:[["Kategorie löschen",async()=>{const o=G.filter;G.cats=G.cats.filter(c=>c!==o);await saveCats();for(const m of G.vids)if(m.cat===o){m.cat="";await putMeta(m)}G.filter="Alle";grender()},true]]})}
  else if(t.dataset.id){const m=G.vids.find(v=>v.id===t.dataset.id);if(G.target!=null)return pick(G.target,m.id);
    dlg(m.name,{items:[["Oben laden",()=>pick(0,m.id)],["Unten laden",()=>pick(1,m.id)],["Kategorie ändern",()=>chooseCat(m)],["Umbenennen",async()=>{const v=await dlg("Umbenennen",{input:"Name",value:m.name});if(v){m.name=v;await putMeta(m);grender()}}],
      ["Löschen",()=>dlg("„"+m.name+"“ endgültig löschen?",{items:[["Ja, löschen",async()=>{await tx(["videos","blobs"],"readwrite",(a,b)=>{a.delete(m.id);b.delete(m.id)});G.vids=G.vids.filter(v=>v.id!==m.id);P.forEach(p=>{if(p.gid===m.id)p.gid=null});grender()},true]]}),true]]})}});

/* ---------- Vergleich ---------- */
$("stages").innerHTML=P.map(p=>`<div class="sg" id="sg${p.i}"><video id="v${p.i}" muted playsinline preload="auto"></video><canvas id="c${p.i}"></canvas><span class="lab" id="lab${p.i}">${NAMES[p.i]}</span><div class="zb"><button data-z="${p.i}:-">−</button><button data-z="${p.i}:0" id="zl${p.i}">1,0×</button><button data-z="${p.i}:+">＋</button></div><div class="empty" id="em${p.i}"><div>Video ${NAMES[p.i].toLowerCase()}</div><div class="r"><button class="chip pri" data-gal="${p.i}">Aus Galerie</button><label class="chip">Datei<input type="file" accept="video/*" data-file="${p.i}"></label></div></div></div>`).join("");
$("pset").innerHTML=P.map(p=>`<div class="blk"><div class="r"><b>${NAMES[p.i]}</b><button data-gal="${p.i}">Galerie</button><label class="chip">Datei<input type="file" accept="video/*" data-file="${p.i}"></label><button id="sv${p.i}" style="display:none">In Galerie sichern</button><span class="mu">FPS</span><input type="number" id="fps${p.i}" value="30" min="1" max="240"></div>
<div class="r" style="flex-wrap:nowrap"><button id="b${p.i}m">◀</button><input type="range" id="r${p.i}" min="0" max="0" step="any" value="0"><button id="b${p.i}p">▶</button></div>
<div class="r"><button class="pri" id="s${p.i}">Start hier setzen</button><span class="mu" id="st${p.i}">Start 0,000 s</span></div></div>`).join("")+'<div class="r"><span class="mu">Tempo</span><select id="spd"><option value="1">1×</option><option value=".5">0,5×</option><option value=".25">0,25×</option></select><button class="chip" id="mmode"></button><button class="chip" id="mlite"></button></div>';
document.addEventListener("click",e=>{const g=e.target.closest("[data-gal]");if(g)openGal(+g.dataset.gal);const z=e.target.closest("[data-z]");if(z){const[i,k]=z.dataset.z.split(":"),q=P[+i],c=$("c"+i);if(k==="0"){q.z=1;q.tx=q.ty=0;applyView(+i)}else q.zoomAt(c.clientWidth/2,c.clientHeight/2,q.z*(k==="+"?1.4:1/1.4))}});
document.addEventListener("change",e=>{const f=e.target.dataset&&e.target.dataset.file;if(f!==undefined&&f!==""&&e.target.files[0]){setSlot(P[+f],e.target.files[0],null);e.target.value=""}});
function setSlot(p,blob,m){if(p.url)URL.revokeObjectURL(p.url);p.url=URL.createObjectURL(blob);p.blob=blob;p.gid=m?m.id:null;p.name=m?m.name:(blob.name||"").replace(/\.[^.]+$/,"");p.fps=m?m.fps||30:30;p.pstart=m?m.start||0:0;
  $("fps"+p.i).value=p.fps;$("em"+p.i).classList.add("hide");$("lab"+p.i).textContent=NAMES[p.i]+(p.name?" · "+p.name:"");$("sv"+p.i).style.display=p.gid?"none":"";p.shapes=[];p.sel=null;V(p.i).src=p.url;p.z=1;p.tx=p.ty=0;applyView(p.i)}
function range(){let hi=Infinity,lo=Infinity;for(const p of P){const d=V(p.i).duration;if(!d||!isFinite(d))return[0,0];hi=Math.min(hi,Math.floor((d-p.start)*p.fps));lo=Math.min(lo,Math.floor(p.start*p.fps))}const L=full?-lo:0;return[L,Math.max(L,hi)]}
function seek(k){const[lo,hi]=range();n=Math.max(lo,Math.min(k,hi));P.forEach(p=>{const v=V(p.i);if(v.duration)v.currentTime=Math.min(v.duration,Math.max(0,p.start+n*step(p)+step(p)*.01))});
  $("gs").min=lo;$("gs").max=hi;$("gs").value=n;$("gc").textContent=(n>0?"+":"")+n+" / "+hi;P.forEach(p=>$("r"+p.i).value=V(p.i).currentTime)}
function setFull(f){full=f;try{localStorage.setItem("fc_full",f?"1":"0")}catch(e){}$("mmode").textContent=full?"Modus: ganzes Video":"Modus: ab Start kürzen";seek(n)}
const stepOne=(p,d)=>{const v=V(p.i);v.pause();v.currentTime=Math.max(0,Math.min(v.duration||0,v.currentTime+d*step(p)))};
P.forEach(p=>{const i=p.i,v=V(i);
  v.onloadedmetadata=()=>{p.start=Math.min(p.pstart||0,v.duration);p.pstart=0;$("st"+i).textContent="Start "+fmt(p.start,3)+" s"+(p.gid&&p.start?" ✓ aus Galerie":"");$("r"+i).max=v.duration;$("r"+i).step=step(p);fit(i);seek(0)};
  v.ontimeupdate=v.onseeked=()=>{$("r"+i).value=v.currentTime};
  $("fps"+i).onchange=e=>{p.fps=Math.max(1,+e.target.value||30);$("r"+i).step=step(p);seek(n);const m=G.vids.find(x=>x.id===p.gid);if(m){m.fps=p.fps;putMeta(m)}};
  $("r"+i).oninput=e=>{v.currentTime=+e.target.value};
  $("b"+i+"m").onclick=()=>stepOne(p,-1);$("b"+i+"p").onclick=()=>stepOne(p,1);
  $("s"+i).onclick=()=>{p.start=v.currentTime;const m=G.vids.find(x=>x.id===p.gid);$("st"+i).textContent="Start "+fmt(p.start,3)+" s"+(m?" ✓ gemerkt":" (Video nicht in Galerie)");if(m){m.start=p.start;putMeta(m).catch(()=>{$("st"+i).textContent+=" – Speichern fehlgeschlagen"})}seek(0)};
  $("sv"+i).onclick=async()=>{if(!p.blob)return;await gload();try{const [m]=await addVideos([p.blob],"");m.fps=p.fps;m.start=p.start;m.name=p.name||m.name;await putMeta(m);p.gid=m.id;$("sv"+i).style.display="none"}catch(e){}};
  $("sg"+i).addEventListener("pointerdown",()=>setAct(i),true);canvasSetup(p);new ResizeObserver(()=>fit(i)).observe($("sg"+i))});
function setAct(i){act=i;P.forEach(p=>$("sg"+p.i).classList.toggle("act",document.body.classList.contains("tool")&&p.i===i));info()}
$("bset").onclick=()=>{$("pset").classList.toggle("open");$("bset").classList.toggle("pri")};
$("btool").onclick=()=>{const o=document.body.classList.toggle("tool");$("ptool").classList.toggle("open",o);$("btool").classList.toggle("pri",o);setAct(act)};
$("kl").onclick=()=>{kind="l";$("kl").classList.add("on");$("ka").classList.remove("on")};
$("ka").onclick=()=>{kind="a";$("ka").classList.add("on");$("kl").classList.remove("on")};
$("prev").onclick=()=>{stop();seek(n-1)};$("next").onclick=()=>{stop();seek(n+1)};$("gs").oninput=e=>{stop();seek(+e.target.value)};$("play").onclick=()=>playing?stop():go();
const waitSeeked=()=>Promise.all(P.map(p=>{const v=V(p.i);return v.seeking?new Promise(r=>{const f=()=>{v.removeEventListener("seeked",f);r()};v.addEventListener("seeked",f);setTimeout(r,400)}):0}));
function go(){const[lo,hi]=range();if(!hi&&!lo)return;if(n>=hi)seek(lo);$("play").textContent="❚❚";playing=true;let last=performance.now();
  const tick=async()=>{if(!playing)return;const t=performance.now(),iv=1000/(P[0].fps*+$("spd").value);
    if(t-last>=iv){last=t;if(n>=range()[1]){stop();return}seek(n+1);await waitSeeked()}
    if(playing)timer=requestAnimationFrame(tick)};timer=requestAnimationFrame(tick)}
function stop(){playing=false;cancelAnimationFrame(timer);timer=null;$("play").textContent="▶"}
addEventListener("keydown",e=>{if($("gal").classList.contains("on")||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==="ArrowRight"){stop();seek(n+1);e.preventDefault()}if(e.key==="ArrowLeft"){stop();seek(n-1);e.preventDefault()}if(e.key===" "){playing?stop():go();e.preventDefault()}
  if(e.key==="Delete")$("del").click()});
$("cpy").onclick=()=>{let p=P[act];if(p.sel==null)p=P[1-act];const s=p.shapes[p.sel];if(!s)return;const q=P[1-p.i];q.shapes.push(JSON.parse(JSON.stringify(s)));q.sel=q.shapes.length-1;draw(q.i);setAct(q.i);setMode("m");
  $("hint").textContent="Kopiert ins "+["obere","untere"][q.i]+" Video. Verschieben-Modus ist an: ziehe irgendwo im Video, um die Form zu verschieben. Punkte einzeln ziehen, fein mit den Pfeilen justieren."};
$("del").onclick=()=>{const p=P[act];if(p.sel==null)return;p.shapes.splice(p.sel,1);p.sel=null;draw(act);info()};
$("delall").onclick=()=>{P.forEach(p=>{p.shapes=[];p.sel=null;draw(p.i)});info()};

/* ---------- Zeichnen & Messen ---------- */
function R(i){const c=$("c"+i),v=V(i),cw=c.clientWidth,ch=c.clientHeight,vw=v.videoWidth||16,vh=v.videoHeight||9,s=Math.min(cw/vw,ch/vh),w=vw*s,h=vh*s;return{x:(cw-w)/2,y:(ch-h)/2,w,h}}
function fit(i){const c=$("c"+i),r=DPR();c.width=Math.max(1,c.clientWidth*r);c.height=Math.max(1,c.clientHeight*r);if(P[i].clampV)P[i].clampV();applyView(i)}
function val(p,s){const q=s.pts;
  if(s.t==="l"){const a=Math.atan2(-(q[1].y-q[0].y),q[1].x-q[0].x)*180/Math.PI;return((a%180)+180)%180}
  const ax=q[0].x-q[1].x,ay=q[0].y-q[1].y,bx=q[2].x-q[1].x,by=q[2].y-q[1].y;
  return Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/(Math.hypot(ax,ay)*Math.hypot(bx,by)||1))))*180/Math.PI}
function applyView(i){const p=P[i],v=V(i);v.style.transformOrigin="0 0";v.style.transform="translate("+p.tx+"px,"+p.ty+"px) scale("+p.z+")";const l=$("zl"+i);if(l)l.textContent=fmt(p.z)+"×";p.vq||(p.vq=requestAnimationFrame(()=>{p.vq=0;draw(i)}))}
const mid=s=>({x:s.pts.reduce((a,b)=>a+b.x,0)/s.pts.length,y:s.pts.reduce((a,b)=>a+b.y,0)/s.pts.length});
function chip(x,c,t,px,py,col){x.font="700 12px system-ui,sans-serif";const w=x.measureText(t).width+14;x.fillStyle="#000c";x.beginPath();x.roundRect?x.roundRect(px-w/2,py-11,w,22,11):x.rect(px-w/2,py-11,w,22);x.fill();x.fillStyle=col;x.textAlign="center";x.textBaseline="middle";x.fillText(t,px,py+1)}
function draw(i){const p=P[i],c=$("c"+i),x=c.getContext("2d"),r=DPR(),g=R(i);x.setTransform(r,0,0,r,0,0);x.clearRect(0,0,c.clientWidth,c.clientHeight);
  const X=a=>(g.x+a.x*g.w)*p.z+p.tx,Y=a=>(g.y+a.y*g.w)*p.z+p.ty;
  p.shapes.forEach((s,k)=>{const sel=k===p.sel,col=s.c||COL[i],q=s.pts,v=val(p,s);x.strokeStyle=x.fillStyle=col;x.lineWidth=sel?3:2.5;x.lineCap=x.lineJoin="round";
    const path=()=>{x.beginPath();q.forEach((a,j)=>j?x.lineTo(X(a),Y(a)):x.moveTo(X(a),Y(a)))};if(sel){path();x.strokeStyle="#fff";x.globalAlpha=.5;x.lineWidth=8;x.stroke();x.globalAlpha=1;x.strokeStyle=col}x.lineWidth=sel?3:2.5;path();x.stroke();
    let lx,ly;const m=mid(s);
    if(s.t==="a"){const vx=X(q[1]),vy=Y(q[1]),a1=Math.atan2(Y(q[0])-vy,X(q[0])-vx),a2=Math.atan2(Y(q[2])-vy,X(q[2])-vx);let d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
      x.beginPath();x.arc(vx,vy,26,a1,a1+d,d<0);x.stroke();lx=vx+Math.cos(a1+d/2)*52;ly=vy+Math.sin(a1+d/2)*52}
    else{const dx=X(q[1])-X(q[0]),dy=Y(q[1])-Y(q[0]),L=Math.hypot(dx,dy)||1;lx=X(m)-dy/L*22;ly=Y(m)+dx/L*22}
    q.forEach(a=>{x.beginPath();x.arc(X(a),Y(a),sel?7:5,0,7);x.fill();x.strokeStyle="#fff";x.lineWidth=1.5;x.stroke();x.strokeStyle=col});
    if(sel){x.beginPath();x.arc(X(m),Y(m),13,0,7);x.fillStyle="#000a";x.fill();x.strokeStyle=col;x.lineWidth=2;x.stroke();x.fillStyle=col;x.font="14px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("✥",X(m),Y(m)+1)}
    chip(x,c,(s.t==="a"?"∠ ":"")+fmt(v)+"°",lx,ly,col)})}
function info(){const s=P.map(p=>p.shapes[p.sel]),v=s.map((a,i)=>a?val(P[i],a):null);let d=null;
  if(s[0]&&s[1]&&s[0].t===s[1].t){d=v[0]-v[1];if(s[0].t==="l")d=((d+90)%180+180)%180-90}
  const cell=(l,c,t)=>`<div class="st"><span>${l}</span><b style="color:${c}">${t}</b></div>`,tx=(a,x)=>a?(a.t==="a"?"∠ ":"")+fmt(x)+"°":"–";
  $("stats").innerHTML=cell("Oben"+(s[0]?s[0].t==="a"?" · Winkel":" · Linie":""),(s[0]&&s[0].c)||COL[0],tx(s[0],v[0]))+cell("Unten"+(s[1]?s[1].t==="a"?" · Winkel":" · Linie":""),(s[1]&&s[1].c)||COL[1],tx(s[1],v[1]))+cell("Unterschied","var(--tx)",d==null?"–":(d>0?"+":"")+fmt(d)+"°");swr()}
function canvasSetup(p){const c=$("c"+p.i),upd=()=>{if(p.uq)return;p.uq=requestAnimationFrame(()=>{p.uq=0;draw(p.i);info()})},ptr=new Map();let gest=null,pan=null;
  const cx=v=>Math.max(0,Math.min(1,v)),cy=v=>{const g=R(p.i);return Math.max(0,Math.min(g.h/g.w,v))};
  const scr=e=>{const b=c.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}};
  const toC=q=>{const g=R(p.i);return{x:((q.x-p.tx)/p.z-g.x)/g.w,y:((q.y-p.ty)/p.z-g.y)/g.w}};
  const toS=a=>{const g=R(p.i);return{x:(g.x+a.x*g.w)*p.z+p.tx,y:(g.y+a.y*g.w)*p.z+p.ty}};
  const D=(q,a)=>{const t=toS(a);return Math.hypot(q.x-t.x,q.y-t.y)};
  const sd=(q,a,b)=>{const A=toS(a),B=toS(b),dx=B.x-A.x,dy=B.y-A.y,t=Math.max(0,Math.min(1,((q.x-A.x)*dx+(q.y-A.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(q.x-A.x-t*dx,q.y-A.y-t*dy)};
  p.clampV=()=>{const W=c.clientWidth,H=c.clientHeight;p.z=Math.max(1,Math.min(10,p.z));p.tx=Math.min(0,Math.max(W-W*p.z,p.tx));p.ty=Math.min(0,Math.max(H-H*p.z,p.ty))};
  p.zoomAt=(sx,sy,nz)=>{const bx=(sx-p.tx)/p.z,by=(sy-p.ty)/p.z;p.z=nz;p.clampV();p.tx=sx-bx*p.z;p.ty=sy-by*p.z;p.clampV();applyView(p.i)};
  c.addEventListener("wheel",e=>{e.preventDefault();const q=scr(e);p.zoomAt(q.x,q.y,p.z*(e.deltaY<0?1.15:1/1.15))},{passive:false});
  c.onpointerdown=e=>{try{c.setPointerCapture(e.pointerId)}catch(_){}ptr.set(e.pointerId,scr(e));
    if(ptr.size===2){if(p.drag&&p.drag.t==="new"){p.shapes.splice(p.sel,1);p.sel=null}p.drag=null;pan=null;const[a,b]=[...ptr.values()];gest={d:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,z:p.z,tx:p.tx,ty:p.ty};return upd()}
    if(ptr.size>2)return;setAct(p.i);const q=scr(e);
    if(!document.body.classList.contains("tool")){pan={x:q.x,y:q.y,tx:p.tx,ty:p.ty};return}
    const m=toC(q),T=28,cur=p.shapes[p.sel];
    if(mode==="m"){if(cur)for(let j=0;j<cur.pts.length;j++)if(D(q,cur.pts[j])<T){p.drag={t:"pt",j};return upd()}
      for(let k=p.shapes.length-1;k>=0;k--){const pt=p.shapes[k].pts;for(let j=0;j<pt.length-1;j++)if(sd(q,pt[j],pt[j+1])<T){p.sel=k;p.drag={t:"mv",x:m.x,y:m.y};return upd()}}
      if(cur){p.drag={t:"mv",x:m.x,y:m.y};return upd()}return}
    if(cur&&D(q,mid(cur))<T){p.drag={t:"mv",x:m.x,y:m.y};return upd()}
    for(let k=p.shapes.length-1;k>=0;k--){const pt=p.shapes[k].pts;for(let j=0;j<pt.length;j++)if(D(q,pt[j])<T){p.sel=k;p.drag={t:"pt",j};return upd()}}
    for(let k=p.shapes.length-1;k>=0;k--){const pt=p.shapes[k].pts;for(let j=0;j<pt.length-1;j++)if(sd(q,pt[j],pt[j+1])<T){p.sel=k;p.drag={t:"mv",x:m.x,y:m.y};return upd()}}
    const a={x:cx(m.x),y:cy(m.y)};p.shapes.push({t:kind,c:curCol,pts:kind==="l"?[{...a},{...a}]:[{...a},{...a},{...a}]});curCol=PAL[(PAL.indexOf(curCol)+1)%PAL.length];p.sel=p.shapes.length-1;p.drag={t:"new",j:kind==="l"?1:0};upd()};
  c.onpointermove=e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,scr(e));
    if(gest&&ptr.size>=2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,nz=Math.max(1,Math.min(10,gest.z*d/gest.d)),bx=(gest.mx-gest.tx)/gest.z,by=(gest.my-gest.ty)/gest.z;
      p.z=nz;p.tx=mx-bx*nz;p.ty=my-by*nz;p.clampV();return applyView(p.i)}
    const q=scr(e);if(pan){p.tx=pan.tx+q.x-pan.x;p.ty=pan.ty+q.y-pan.y;p.clampV();return applyView(p.i)}
    if(!p.drag)return;const m=toC(q),sh=p.shapes[p.sel];if(!sh)return;
    if(p.drag.t==="mv"){const dx=m.x-p.drag.x,dy=m.y-p.drag.y;sh.pts.forEach(a=>{a.x+=dx;a.y+=dy});p.drag.x=m.x;p.drag.y=m.y}
    else{const a=sh.pts[p.drag.j];a.x=cx(m.x);a.y=cy(m.y)}upd()};
  c.onpointerup=c.onpointercancel=e=>{ptr.delete(e.pointerId);if(ptr.size<2)gest=null;if(!ptr.size)pan=null;const sh=p.shapes[p.sel];
    if(sh&&p.drag&&p.drag.t==="new"){const pt=sh.pts,g=R(p.i),V0=sh.t==="l"?pt[0]:pt[1],E=sh.t==="l"?pt[1]:pt[0],dx=E.x-V0.x,dy=E.y-V0.y;
      if(Math.hypot(dx,dy)*g.w*p.z<10){p.shapes.splice(p.sel,1);p.sel=null}
      else if(sh.t==="a"){const a=-Math.PI/3;pt[2]={x:cx(V0.x+dx*Math.cos(a)-dy*Math.sin(a)),y:cy(V0.y+dx*Math.sin(a)+dy*Math.cos(a))}}}
    p.drag=null;cancelAnimationFrame(p.uq);p.uq=0;draw(p.i);info()};}
function swr(){const s=P[act].shapes[P[act].sel],c=s?s.c:curCol;$("sw").innerHTML=PAL.map(k=>`<i data-c="${k}" style="background:${k}" class="${k===c?"on":""}"></i>`).join("")}
$("sw").onclick=e=>{const k=e.target.dataset&&e.target.dataset.c;if(!k)return;const p=P[act],s=p.shapes[p.sel];if(s){s.c=k;draw(act)}curCol=k;info()};
function setMode(m){mode=m;$("mdraw").classList.toggle("on",m==="d");$("mmove").classList.toggle("on",m==="m");
  $("hint").textContent=m==="d"?"Zeichnen: ziehen = neue Form. Form oder Punkt anfassen = verschieben. Zwei Finger = zoomen und schieben.":"Verschieben: ziehe irgendwo im aktiven Video, um die ausgewählte Form zu bewegen. Punkte einzeln ziehen. Andere Form antippen = auswählen. Zwei Finger = zoomen."}
$("mdraw").onclick=()=>setMode("d");$("mmove").onclick=()=>setMode("m");$("mmode").onclick=()=>setFull(!full);
let nt;const nudge=(dx,dy,rot)=>{const p=P[act],s=p.shapes[p.sel];if(!s)return;const g=R(act);
  if(rot){const m=mid(s),a=rot*Math.PI/360;s.pts.forEach(q=>{const x=q.x-m.x,y=q.y-m.y;q.x=m.x+x*Math.cos(a)-y*Math.sin(a);q.y=m.y+x*Math.sin(a)+y*Math.cos(a)})}
  else s.pts.forEach(q=>{q.x+=dx*2/(g.w*p.z);q.y+=dy*2/(g.w*p.z)});draw(act);info()};
$("ptool").addEventListener("pointerdown",e=>{const b=e.target.closest("[data-n],[data-r]");if(!b)return;const f=()=>b.dataset.n?nudge(...b.dataset.n.split(",").map(Number)):nudge(0,0,+b.dataset.r);f();clearInterval(nt);nt=setInterval(f,80)});
["pointerup","pointercancel"].forEach(t=>addEventListener(t,()=>clearInterval(nt)));
function setLite(f){lite=f;try{localStorage.setItem("fc_lite",f?"1":"0")}catch(e){}document.documentElement.classList.toggle("lite",f);$("mlite").textContent="Sparmodus: "+(f?"an":"aus");P.forEach(p=>{V(p.i).preload=f?"metadata":"auto";fit(p.i)})}
$("mlite").onclick=()=>setLite(!lite);
setMode("d");setFull(full);setLite(lite);gload();info();
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
