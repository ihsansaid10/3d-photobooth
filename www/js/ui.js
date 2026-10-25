/* ui.js — menu utama, panel properti, outliner, dialog, input & shortcut. Tidak berisi logika 3D. */
let tool='move';

/* ---------- menu utama ---------- */
const MENUS=[
 ['File',[['import','Import .obj / .glb…','Ctrl+O'],['new','New scene…'],'-',['png','Render PNG'],['jpg','Render JPG']]],
 ['Edit',[['undo','Undo','Ctrl+Z'],['redo','Redo','Ctrl+Y'],'-',['del','Delete','Del']]],
 ['Add',[['prim:cube','■ Cube'],['prim:sphere','● Sphere'],['prim:cylinder','▮ Cylinder'],'-',['light:sun','☀️ Sun light'],['light:point','💡 Point light'],['light:spot','🔦 Spot light'],['light:area','▭ Area light']]],
 ['View',[['tog:cam.thirds','Rule of thirds'],['tog:grid','Grid floor'],['tog:pedestal','Pedestal'],['tog:cam.locked','Lock camera','L'],'-',
  ['frame','Frame selected / all','F'],['resetcam','Reset camera','Home'],['camtype','Perspective ⇄ Orthographic','5']]],
 ['Render',[['q:draft','Draft · 1280px'],['q:high','High · 2048px'],['q:ultra','Ultra · 3072px'],'-',['png','Render PNG'],['jpg','Render JPG']]],
 ['Help',[['welcome','Welcome'],['keys','Keyboard shortcuts','?']]]
];
$('#menus').innerHTML=MENUS.map(([n,it])=>`<div class="menu"><button class="mb" aria-haspopup="true">${n}</button><div class="dd" role="menu">`+
 it.map(x=>x=='-'?'<hr>':`<button role="menuitem" data-a="${x[0]}"><i></i>${x[1]}<kbd>${x[2]||''}</kbd></button>`).join('')+'</div></div>').join('');
let openM=null;
const closeM=()=>{if(openM){openM.classList.remove('open');openM=null}};
$('#menus').addEventListener('click',e=>{const mb=e.target.closest('.mb');if(!mb)return;
 const m=mb.parentElement,was=m===openM;closeM();if(!was){m.classList.add('open');openM=m}e.stopPropagation()});
$('#menus').addEventListener('pointerover',e=>{if(!openM)return;const m=e.target.closest('.menu');if(m&&m!==openM){closeM();m.classList.add('open');openM=m}});

/* ---------- helper HTML panel ---------- */
const R=(l,k,a,b,s,d='k')=>`<label class="row"><span>${l}</span><input type="range" data-${d}="${k}" min="${a}" max="${b}" step="${s}"><output></output></label>`;
const C=(l,k,d='k')=>`<label class="row"><span>${l}</span><input type="color" data-${d}="${k}"></label>`;
const K=(l,k,d='k')=>`<label class="row"><span>${l}</span><input type="checkbox" data-${d}="${k}"></label>`;
const D=(l,k,o)=>`<label class="row"><span>${l}</span><select data-k="${k}">${o.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>`;
const B=(a,t)=>`<button data-a="${a}">${t}</button>`;
const PANELS={
 obj:'',
 cam:D('Type','cam.type',[['persp','Perspective'],['ortho','Orthographic']])+R('Focal length (mm)','cam.focal',12,200,1)+
  D('Aspect ratio','cam.aspect',[['16:9','16:9'],['1:1','1:1'],['4:5','4:5'],['9:16','9:16']])+K('Rule of thirds','cam.thirds')+K('Lock camera (L)','cam.locked')+
  `<div class="g2">${B('frame','Frame (F)')}${B('resetcam','Reset (Home)')}</div>`+
  '<p class="hint">Orbit: drag. Pan: Shift+drag atau klik kanan. Zoom: scroll. Frame di viewport = hasil render.</p>',
 world:D('Background','bg',[['sky','Sky'],['studio','Infinite studio'],['gradient','Gradient'],['transparent','Transparent']])+
  D('Sky preset','sky',Object.entries(PRE).map(([k,v])=>[k,v.n]))+R('Sun intensity','int',0,6,.05)+R('Exposure','exp',.2,3,.01)+R('Fog','fog',0,1,.01)+R('BG brightness','bri',0,2,.01)+
  R('Sun elevation','el',1,90,1)+R('Sun azimuth','az',0,360,1)+C('Sun color','sun')+C('Studio color','studio')+C('Gradient top','gA')+C('Gradient bottom','gB')+
  '<h5>Reflections</h5>'+K('Sky reflections','env')+R('Reflection power','envInt',0,3,.01)+
  '<p class="hint">Reflections diambil dari langit yang dipilih, jadi object glossy / metal ikut berubah suasana saat preset diganti.</p>',
 light:`<h5>Add light</h5><div class="g2">${B('light:sun','☀️ Sun')}${B('light:point','💡 Point')}${B('light:spot','🔦 Spot')}${B('light:area','▭ Area')}</div>
  <h5>Presets</h5><div class="g2">${B('lp:cinematic','Cinematic')}${B('lp:softbox','Softbox')}${B('lp:dramatic','Dramatic')}${B('lp:neon','Neon')}</div>
  <p class="hint">Pilih light di outliner untuk atur warna, intensitas, dan posisi. Preset mengganti semua light buatanmu dan menurunkan sun. Sun dan Spot selalu mengarah ke titik tengah.</p>`,
 studio:D('Ground','ground',[['solid','Solid floor'],['shadow','Shadow catcher'],['off','None']])+
  '<h5>Floor color</h5><div class="plate">'+FLOORS.map(([h,n])=>`<button class="sw" data-fc="${h}" title="${n}" aria-label="${n}" style="background:${h}"></button>`).join('')+'</div>'+
  C('Custom color','gcol')+R('Floor roughness','grough',0,1,.01)+K('Grid floor','grid')+K('Pedestal','pedestal')+
  `<h5>Primitives</h5><div class="g2">${B('prim:cube','Cube')}${B('prim:sphere','Sphere')}${B('prim:cylinder','Cylinder')}</div>`,
 render:D('Quality','q',[['draft','Draft (1280px)'],['high','High (2048px)'],['ultra','Ultra (3072px)']])+K('Grid in render','gridR')+
  '<p class="hint">Preview tetap ringan. Kualitas hanya berlaku saat render: resolusi, supersampling antialiasing, resolusi shadow, dan color grade + vignette (High/Ultra).</p>'+
  `<div class="g2">${B('png','Render PNG')}${B('jpg','Render JPG')}</div>`
};
const TABS=[['obj','🟧','Object'],['cam','🎥','Camera'],['world','🌍','World'],['light','💡','Lights'],['studio','🧱','Studio'],['render','📷','Render']];
$('#props').innerHTML=TABS.map(t=>`<div class="pn" id="p-${t[0]}">${PANELS[t[0]]}</div>`).join('');
$('#tabs').innerHTML=TABS.map(t=>`<button data-t="${t[0]}" title="${t[2]}">${t[1]}</button>`).join('');
$('#tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(b)tab(b.dataset.t)};
function tab(t){$$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));$$('.pn').forEach(p=>p.classList.toggle('on',p.id=='p-'+t))}

/* ---------- panel object ---------- */
const matSection=()=>'<h5>Material</h5><div class="g3">'+Object.entries(MATS).map(([k,v])=>B('mat:'+k,v.n)).join('')+'</div>'+
 R('Roughness','m.r',0,1,.01,'s')+R('Metalness','m.m',0,1,.01,'s')+(sel.keep?'':R('Glass','m.t',0,1,.01,'s'))+
 C('Emissive','m.ec','s')+R('Emissive power','m.ei',0,4,.05,'s')+K('Wireframe','m.wf','s')+(sel.keep?B('matreset','↺ Pakai material asli model'):'');
function objPanel(){
 const p=$('#p-obj');
 if(!sel){p.innerHTML='<p class="hint">Pilih object di outliner atau klik di viewport. Import file .obj atau .glb lewat menu File atau drop ke viewport.</p>';return}
 const l=sel.kind=='light';
 p.innerHTML=`<label class="row"><span>Name</span><input type="text" data-s="name"></label>`+
  ['X','Y','Z'].map((a,i)=>`<label class="row"><span>Location ${a}</span><input type="number" step=".1" data-s="p${i}"></label>`).join('')+
  (l?'':R('Scale','sc',.05,10,.01,'s'))+C('Color','color','s')+
  (l?R('Intensity','int',0,sel.ltype=='area'?20:10,.05,'s'):matSection())+
  '<button data-a="del" style="width:100%;margin-top:10px">Delete (Del)</button><p class="hint">G pindah, R putar, S scale. Slider Scale = resize seragam.</p>';
 fillUI();
}

/* ---------- sinkron UI <-> state ---------- */
function rng(e){if(e.type=='range'){e.style.setProperty('--p',(e.value-e.min)/(e.max-e.min)*100+'%');const o=e.nextElementSibling;if(o)o.textContent=(+e.value).toFixed(2).replace(/\.?0+$/,'')}}
function fillUI(){
 $$('[data-k]').forEach(e=>{const v=gp(e.dataset.k);if(e.type=='checkbox')e.checked=v;else e.value=v;rng(e)});
 if(sel)$$('[data-s]').forEach(e=>{
  if(e===document.activeElement&&e.type!='range')return;
  const k=e.dataset.s,o=sel.obj;let v;
  if(k=='name')v=sel.name;else if(k=='color')v=sel.color;else if(k=='int')v=sel.int;else if(k=='sc')v=o.scale.x;
  else if(k.startsWith('m.'))v=sel.mat?sel.mat[k.slice(2)]:0;
  else v=Math.round(o.position.getComponent(+k[1])*1000)/1000;
  if(e.type=='checkbox')e.checked=!!v;else e.value=v;rng(e)});
 $$('[data-fc]').forEach(b=>b.classList.toggle('on',S.ground=='solid'&&b.dataset.fc==S.gcol.toLowerCase()));
 $$('[data-a^="tog:"]').forEach(b=>b.classList.toggle('chk',!!gp(b.dataset.a.slice(4))));
 $$('[data-a^="q:"]').forEach(b=>b.classList.toggle('chk',S.q==b.dataset.a.slice(2)));
}
function syncChrome(){
 $('#thirds').classList.toggle('on',S.cam.thirds);$('#lock').classList.toggle('on',S.cam.locked);
 $('#hud').textContent=`${cam===ortho?'Orthographic':'Perspective'} · ${S.cam.aspect} · ${Math.round(S.cam.focal)}mm${S.cam.locked?' · camera locked':''}`;
}
function outl(){
 $('#outl').innerHTML=items.map(t=>`<li data-id="${t.id}" class="${t===sel?'on':''}">${{obj:'▲',prim:'■',light:'💡'}[t.kind]} ${t.name}</li>`).join('')||'<li class="hint">Scene kosong</li>';
 $('#cnt').textContent=items.length+' item';
}
$('#outl').onclick=e=>{const l=e.target.closest('li[data-id]');if(l)select(items.find(t=>t.id==l.dataset.id))};

/* ---------- tools ---------- */
function setTool(t){tool=t;tc.setMode({move:'translate',rotate:'rotate',scale:'scale'}[t]||'translate');tc.detach();if(sel&&t!='select')tc.attach(sel.obj);
 $$('#tools [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool==t));redraw()}
$('#tools').innerHTML=[['select','⬚','Select (Q)'],['move','✥','Move (G)'],['rotate','⟲','Rotate (R)'],['scale','⤡','Scale (S)']].map(t=>`<button data-tool="${t[0]}" title="${t[2]}">${t[1]}</button>`).join('')+
 '<button id="lock" title="Lock camera (L)" style="margin-top:auto">🔒</button>';
const toggle=k=>{sp(k,!gp(k));applyAll();fillUI();commit()};
$('#tools').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tool)setTool(b.dataset.tool);else toggle('cam.locked')};

/* ---------- toast & dialog ---------- */
let toastT=0;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400)}
const dlg=id=>{const d=$(id);if(d&&!d.open&&d.showModal)d.showModal()};

/* ---------- aksi (menu, tombol, shortcut) ---------- */
function act(a){
 const [h,v]=a.split(':');
 switch(h){
  case 'import':$('#file').click();break;
  case 'new':resetScene();break;
  case 'png':case 'jpg':exportImg(h);break;
  case 'undo':undo();break;case 'redo':redo();break;
  case 'del':del();break;
  case 'prim':addPrim(v);tab('obj');break;
  case 'light':addLight(v);tab('obj');break;
  case 'lp':lightPreset(v);break;
  case 'tog':toggle(v);break;
  case 'q':S.q=v;fillUI();commit();break;
  case 'frame':frameView();break;
  case 'resetcam':resetCam();break;
  case 'camtype':S.cam.type=S.cam.type=='persp'?'ortho':'persp';applyAll();fillUI();commit();break;
  case 'mat':if(sel&&sel.kind!='light'){applyPreset(sel,v);fillUI();commit();redraw()}break;
  case 'matreset':if(sel&&sel.mat){sel.mat.ov=false;applyMat(sel);fillUI();commit();redraw()}break;
  case 'welcome':dlg('#dlgWelcome');break;
  case 'keys':dlg('#dlgKeys');break;
 }
}
document.addEventListener('click',e=>{
 const fc=e.target.closest('[data-fc]');
 if(fc){S.gcol=fc.dataset.fc;S.ground='solid';applyAll();fillUI();commit();return}
 const cl=e.target.closest('[data-close]');if(cl)cl.closest('dialog').close();
 const b=e.target.closest('[data-a]');
 if(b){closeM();act(b.dataset.a)}else if(!e.target.closest('.menu'))closeM();
});

/* ---------- input panel ---------- */
$('#props').addEventListener('input',e=>{
 const t=e.target,k=t.dataset.k,s=t.dataset.s,val=t.type=='checkbox'?t.checked:t.type=='range'?+t.value:t.value;
 if(k){sp(k,val);if(k=='sky')preset(t.value);applyAll();fillUI()}
 else if(s&&sel){
  if(s=='name'){sel.name=val;outl()}
  else if(s=='color')setColor(sel,val);
  else if(s=='int'){sel.int=+val;sel.obj.intensity=+val}
  else if(s=='sc')sel.obj.scale.setScalar(+val);
  else if(s.startsWith('m.')){const f=s.slice(2);sel.mat[f]=val;if(f!='wf')sel.mat.ov=true;applyMat(sel)}
  else if(!isNaN(parseFloat(val)))sel.obj.position.setComponent(+s[1],parseFloat(val));
  rng(t)}
});
$('#props').addEventListener('change',()=>commit());

/* ---------- file, drag & drop, klik-pilih di viewport ---------- */
$('#file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('#vp').ondragover=e=>e.preventDefault();
$('#vp').ondrop=e=>{e.preventDefault();addFiles(e.dataTransfer.files)};
let dn;rd.domElement.addEventListener('pointerdown',e=>dn=[e.clientX,e.clientY]);
rd.domElement.addEventListener('pointerup',e=>{
 if(!dn||e.button||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>4)return;
 const r=rd.domElement.getBoundingClientRect(),rc=new T.Raycaster();
 rc.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
 const h=rc.intersectObjects(items.map(t=>t.obj),true)[0];
 select(h?items.find(t=>{for(let o=h.object;o;o=o.parent)if(o===t.obj)return true}):null);
});

/* ---------- shortcut ---------- */
addEventListener('keydown',e=>{
 if(e.target.matches('input[type=text],input[type=number],select,textarea'))return;
 const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(k=='escape'){if(openM)closeM();else select(null);return}
 if(c&&k=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(c&&k=='y'){e.preventDefault();redo()}
 else if(c&&k=='o'){e.preventDefault();$('#file').click()}
 else if(!c){
  if(k=='q')setTool('select');else if(k=='g')setTool('move');else if(k=='r')setTool('rotate');else if(k=='s')setTool('scale');
  else if(k=='l')toggle('cam.locked');else if(k=='f')frameView();else if(k=='home')resetCam();else if(k=='5')act('camtype');
  else if(e.key=='?')dlg('#dlgKeys');
  else if((k=='delete'||k=='backspace')&&sel){e.preventDefault();del()}}
});

/* render-on-demand: tandai "perlu gambar ulang" tiap ada interaksi */
['pointerdown','pointerup','wheel','keydown','input','change','click'].forEach(ev=>addEventListener(ev,redraw,{passive:true,capture:true}));
