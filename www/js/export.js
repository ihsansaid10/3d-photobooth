/* export.js — render resolusi tinggi ke PNG/JPG (supersampling, shadow map besar, color grade + vignette).
   Versi Android: di app native, hasil render disimpan ke cache lalu dibuka lewat Share sheet (Simpan ke Galeri / Drive / dll). */
function shadows(n){scene.traverse(o=>{if(o.isLight&&o.castShadow){const s=o.isPointLight?Math.min(n,2048):n;o.shadow.mapSize.set(s,s);if(o.shadow.map){o.shadow.map.dispose();o.shadow.map=null}}})}

/* simpan hasil render: native -> Filesystem + Share, browser -> download biasa */
async function saveBlob(b,name){
 const cp=window.Capacitor;
 if(cp&&cp.isNativePlatform&&cp.isNativePlatform()){
  const data=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(b)});
  const {Filesystem,Share}=cp.Plugins;
  const f=await Filesystem.writeFile({path:name,data,directory:'CACHE'});
  await Share.share({title:name,url:f.uri,dialogTitle:'Simpan / bagikan hasil render'});
 }else{
  const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=name;l.click();
  setTimeout(()=>URL.revokeObjectURL(l.href),4000);
 }
}

function exportImg(fmt){
 const Q=QS[S.q],a=ASP[S.cam.aspect],w=a>=1?Q.e:Math.round(Q.e*a),h=a>=1?Math.round(Q.e/a):Q.e;
 const gl=rd.getContext(),cap=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),ss=Math.min(Q.ss,cap/Math.max(w,h));
 const pr=rd.getPixelRatio(),lg=items.filter(t=>t.kind=='light'),gv=grid.visible;
 const out=document.createElement('canvas');out.width=w;out.height=h;const x=out.getContext('2d');x.imageSmoothingQuality='high';
 tc.visible=false;lg.forEach(t=>t.obj.children[0].visible=false);if(!S.gridR)grid.visible=false;shadows(Q.sm);
 try{
  rd.setPixelRatio(1);rd.setSize(Math.round(w*ss),Math.round(h*ss),false);sky.position.copy(cam.position);rd.render(scene,cam);
  if(fmt=='jpg'){x.fillStyle='#fff';x.fillRect(0,0,w,h)}
  if(Q.fx)x.filter='contrast(1.06) saturate(1.1)';
  x.drawImage(rd.domElement,0,0,w,h);x.filter='none';
  if(Q.fx&&S.bg!='transparent'){const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*.45,w/2,h/2,Math.hypot(w,h)/2);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.32)');x.fillStyle=g;x.fillRect(0,0,w,h)}
 }finally{   // apapun yang terjadi, kembalikan viewport ke kondisi normal
  rd.setPixelRatio(pr);fit();shadows(1024);tc.visible=true;lg.forEach(t=>t.obj.children[0].visible=true);grid.visible=gv;redraw();
 }
 out.toBlob(async b=>{
  if(!b)return toast('Gagal membuat gambar (resolusi terlalu besar?)');
  try{await saveBlob(b,`photobooth-${Date.now()}.${fmt}`);toast(`Render ${fmt.toUpperCase()} ${w}×${h} tersimpan`)}
  catch(e){toast('Gagal menyimpan render')}
 },fmt=='jpg'?'image/jpeg':'image/png',.95);
}
