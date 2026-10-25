/* objects.js — MODELING: item (model/primitif/lampu), material, import file, seleksi. */
let items=[],uid=0,sel=null;const reg=new Map();

const matsOf=it=>{const s=new Set();it.obj.traverse(m=>{if(m.isMesh)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x&&s.add(x))});return[...s]};

function setColor(it,hex){
 it.color=hex;
 if(it.kind=='light'){it.obj.color.set(hex);it.obj.children[0].material.color.set(hex);return}
 matsOf(it).forEach(x=>{if(!x.color)return;
  if(it.keep){x.userData.oc=x.userData.oc||x.color.clone();x.color.copy(x.userData.oc).multiply(new T.Color(hex))}else x.color.set(hex)});
}

/* material: it.mat={r,m,t,ec,ei,wf,ov}. ov=false -> pakai material asli model (GLB), nilai asli disimpan di userData.om */
const defMat=it=>{const x=it.kind=='light'?null:matsOf(it).find(m=>m.isMeshStandardMaterial);
 return{r:x?x.roughness:.5,m:x?x.metalness:0,t:0,ec:'#000000',ei:1,wf:false,ov:!it.keep}};
function applyMat(it){
 if(it.kind=='light'||!it.mat)return;
 const m=it.mat,ec=new T.Color(m.ec);
 matsOf(it).forEach(x=>{
  x.envMapIntensity=S.envInt;x.wireframe=!!m.wf;
  if(!x.isMeshStandardMaterial)return;
  const o=x.userData.om||(x.userData.om={r:x.roughness,m:x.metalness,ec:x.emissive.clone(),ei:x.emissiveIntensity,t:x.isMeshPhysicalMaterial?x.transmission:0});
  const had=x.isMeshPhysicalMaterial&&x.transmission>0;
  if(m.ov){x.roughness=m.r;x.metalness=m.m;x.emissive.copy(ec);x.emissiveIntensity=m.ei;if(x.isMeshPhysicalMaterial){x.transmission=m.t;x.thickness=m.t>0?.6:0}}
  else{x.roughness=o.r;x.metalness=o.m;x.emissive.copy(o.ec);x.emissiveIntensity=o.ei;if(x.isMeshPhysicalMaterial)x.transmission=o.t}
  if(x.isMeshPhysicalMaterial&&had!==x.transmission>0)x.needsUpdate=true;   // transmission mengubah shader
 });
}
function applyPreset(it,k){
 const p=MATS[k];if(!p||it.kind=='light')return;
 it.mat={...it.mat,r:p.r,m:p.m,t:it.keep?0:p.t,ec:'#000000',ei:1,ov:true};
 setColor(it,it.keep?'#ffffff':p.c);applyMat(it);
}

/* ---------- tambah / hapus ---------- */
function add(it){
 it.id=++uid;it.color=it.color||'#b8b8b8';reg.set(it.id,it);scene.add(it.obj);items.push(it);
 if(it.kind!='light'){it.mat=it.mat||defMat(it);applyMat(it)}
 setColor(it,it.color);select(it);commit();
}
function disposeObj(o){   // bebaskan memori GPU (data tetap ada di CPU, jadi undo masih aman)
 o.traverse(m=>{
  if(m.geometry)m.geometry.dispose();
  (m.material?(Array.isArray(m.material)?m.material:[m.material]):[]).forEach(x=>{Object.values(x).forEach(v=>v&&v.isTexture&&v.dispose());x.dispose()});
  if(m.shadow&&m.shadow.map){m.shadow.map.dispose();m.shadow.map=null}
 });
}
function rm(t){scene.remove(t.obj);items=items.filter(x=>x!==t);disposeObj(t.obj)}
function del(){if(!sel)return;rm(sel);select(null);commit()}
function resetScene(){
 if(!confirm('Mulai scene baru? Semua object dan pengaturan akan dihapus.'))return;
 items.slice().forEach(rm);select(null);
 S=defaultState();ped=false;lastAsp=null;lastEI=null;histClear();
 applyAll();resetCam();addPrim('sphere');fillUI();toast('Scene baru');
}

/* ---------- import ---------- */
function prep(o,keep){
 const mat=new T.MeshPhysicalMaterial({color:'#d0d0d0',roughness:.55,metalness:.05,side:T.DoubleSide});
 o.traverse(m=>{if(m.isMesh){if(!keep)m.material=mat;m.castShadow=m.receiveShadow=true;if(!m.geometry.attributes.normal)m.geometry.computeVertexNormals()}});
 const n=items.filter(t=>t.kind=='obj').length;let b=new T.Box3().setFromObject(o);
 o.scale.setScalar(2/(Math.max(...b.getSize(new T.Vector3()).toArray())||1));o.updateMatrixWorld(true);
 b=new T.Box3().setFromObject(o);const c=b.getCenter(new T.Vector3());
 o.position.set(-c.x+n*2.5,-b.min.y+(S.pedestal?.3:0),-c.z);
}
function addFiles(fl){[...fl].forEach(f=>{
 const g=/\.glb$/i.test(f.name);if(!g&&!/\.obj$/i.test(f.name))return;
 const r=new FileReader(),nm=f.name.replace(/\.(obj|glb)$/i,''),bad=()=>toast('Gagal membaca '+f.name);
 r.onload=()=>{try{
  if(g)new T.GLTFLoader().parse(r.result,'',x=>{prep(x.scene,true);add({kind:'obj',keep:true,obj:x.scene,name:nm,color:'#ffffff'})},bad);
  else{const o=new T.OBJLoader().parse(r.result);prep(o);add({kind:'obj',obj:o,name:nm,color:'#d0d0d0'})}
 }catch(e){bad()}};
 g?r.readAsArrayBuffer(f):r.readAsText(f)})}

/* ---------- primitif & lampu ---------- */
function addPrim(t){
 const g={cube:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(.5,48,32),cylinder:new T.CylinderGeometry(.5,.5,1,48)}[t];
 const m=new T.Mesh(g,new T.MeshPhysicalMaterial({color:'#b8b8b8',roughness:.5}));m.castShadow=m.receiveShadow=true;
 m.position.set(0,.5+(S.pedestal?.3:0),0);add({kind:'prim',obj:m,name:t[0].toUpperCase()+t.slice(1)});
}
function addLight(type,pos=[3,4,3],col='#ffffff',int=1.5,s=true){
 let L;
 if(type=='sun')L=new T.DirectionalLight(col,int);
 else if(type=='point')L=new T.PointLight(col,int,0);
 else if(type=='spot')L=new T.SpotLight(col,int,0,.6,.4);
 else L=new T.RectAreaLight(col,int,3,3);
 if(L.shadow){L.castShadow=true;L.shadow.mapSize.set(1024,1024);L.shadow.bias=-.0005;if(type=='sun')Object.assign(L.shadow.camera,{left:-8,right:8,top:8,bottom:-8})}
 L.add(new T.Mesh(new T.SphereGeometry(.12,16,8),new T.MeshBasicMaterial({color:col})));
 L.position.set(...pos);L.lookAt(0,0,0);
 const it={kind:'light',ltype:type,obj:L,name:type[0].toUpperCase()+type.slice(1)+' light',int,color:col};
 if(s)add(it);else{it.id=++uid;reg.set(it.id,it);scene.add(L);items.push(it)}
}
function lightPreset(n){const d=LP[n];items.filter(t=>t.kind=='light').forEach(rm);S.int=d.s;d.L.forEach(l=>addLight(...l,false));select(null);applyAll();fillUI();commit()}

/* ---------- seleksi ---------- */
function select(it){sel=it;tc.detach();if(it&&tool!='select')tc.attach(it.obj);objPanel();outl();redraw()}
