/* engine.js — INTI 3D: renderer, scene, langit, environment reflection (IBL), lantai, kamera, render loop. */
const rd=new T.WebGLRenderer({antialias:true,alpha:true});
rd.outputEncoding=T.sRGBEncoding;rd.toneMapping=T.ACESFilmicToneMapping;rd.shadowMap.enabled=true;rd.shadowMap.type=T.PCFSoftShadowMap;
rd.setPixelRatio(Math.min(devicePixelRatio,1.5));rd.setClearColor(0,0);
$('#stage').prepend(rd.domElement);
T.RectAreaLightUniformsLib.init();
const scene=new T.Scene();scene.fog=new T.FogExp2(0,0);

/* ---------- sky (+ glow matahari) ---------- */
const U={top:{value:new T.Color()},hor:{value:new T.Color()},bot:{value:new T.Color()},bri:{value:1},stars:{value:0},neb:{value:0},
 sd:{value:new T.Vector3(0,1,0)},sc:{value:new T.Color()},sk:{value:0}};
const SKY_VS='varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const SKY_FS=`uniform vec3 top,hor,bot,sd,sc;uniform float bri,stars,neb,sk,lin;varying vec3 vP;
 float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
 void main(){vec3 v=normalize(vP);float y=v.y;
 vec3 c=y>0.?mix(hor,top,pow(y,.6)):mix(hor,bot,pow(-y,.5));
 if(stars>0.){c+=step(.9975,h(floor(v*220.)))*stars*step(-.1,y);
  float n=(sin(v.x*3.+sin(v.y*4.))*sin(v.z*3.+v.y*2.))*.5+.5;c+=neb*n*n*vec3(.35,.1,.5)*.6;}
 if(sk>0.){float d=max(dot(v,normalize(sd)),0.);c+=sc*sk*(pow(d,900.)*10.+pow(d,28.)*.12);}
 c*=bri;
 gl_FragColor=vec4(lin>.5?c:pow(c,vec3(1./2.2)),1.);}`;
/* lin=0 -> keluaran sRGB untuk layar; lin=1 -> linear untuk environment map. Uniform lain dibagi (by reference). */
const skyMat=lin=>new T.ShaderMaterial({uniforms:{...U,lin:{value:lin}},side:T.BackSide,depthWrite:false,fog:false,vertexShader:SKY_VS,fragmentShader:SKY_FS});
const sky=new T.Mesh(new T.SphereGeometry(500,32,16),skyMat(0));
sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);

/* ---------- environment reflection dari sky ---------- */
const pm=new T.PMREMGenerator(rd),envScene=new T.Scene();
envScene.add(new T.Mesh(new T.SphereGeometry(50,32,16),skyMat(1)));   // scene terpisah: tetap jalan walau BG transparent
let envRT=null,envKey='',envTm=0;
function buildEnv(){
 const rt=pm.fromScene(envScene,0,.1,100);
 if(envRT)envRT.dispose();envRT=rt;
 scene.environment=S.env?rt.texture:null;redraw();
}
function queueEnv(k){if(k===envKey)return;envKey=k;clearTimeout(envTm);envTm=setTimeout(buildEnv,envRT?90:0)}

/* ---------- lampu dasar, lantai, grid, pedestal ---------- */
const hemi=new T.HemisphereLight(0xffffff,0x444444,.55),sun=new T.DirectionalLight();
Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:80});
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
scene.add(hemi,sun);
const gShadow=new T.ShadowMaterial({opacity:.45}),gSolid=new T.MeshStandardMaterial({roughness:.85,metalness:0}),
 ground=new T.Mesh(new T.PlaneGeometry(1000,1000),gShadow);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new T.GridHelper(20,20,0x999999,0x555555);grid.position.y=.002;scene.add(grid);
const pedestal=new T.Mesh(new T.CylinderGeometry(1.4,1.5,.3,64),new T.MeshStandardMaterial({color:'#cfcfcf',roughness:.6}));
pedestal.position.y=.15;pedestal.castShadow=pedestal.receiveShadow=true;scene.add(pedestal);

/* ---------- kamera & kontrol ---------- */
const persp=new T.PerspectiveCamera(35,16/9,.1,2000),ortho=new T.OrthographicCamera(-5,5,5,-5,-500,2000);
persp.position.set(5,3.5,6);let cam=persp;
const controls=new T.OrbitControls(cam,rd.domElement);controls.enableDamping=true;controls.target.set(0,.8,0);
const tc=new T.TransformControls(cam,rd.domElement);scene.add(tc);
tc.addEventListener('dragging-changed',e=>controls.enabled=!e.value&&!S.cam.locked);
tc.addEventListener('objectChange',()=>{fillUI();redraw()});
tc.addEventListener('mouseUp',()=>commit());
tc.addEventListener('change',redraw);controls.addEventListener('change',redraw);

function switchCam(t){
 const n=t=='ortho'?ortho:persp;if(n===cam)return;
 const tg=controls.target,half=Math.tan(persp.fov*Math.PI/360);let d=cam.position.distanceTo(tg);
 if(n===ortho)ortho.zoom=10/(2*d*half);else d=(10/ortho.zoom)/(2*half);
 n.position.copy(tg).addScaledVector(cam.position.clone().sub(tg).normalize(),d);n.quaternion.copy(cam.quaternion);n.updateProjectionMatrix();
 cam=n;controls.object=n;tc.camera=n;
}
function fit(){
 const r=$('#vp').getBoundingClientRect(),a=ASP[S.cam.aspect];let w=r.width-24,h=r.height-24;
 if(w/h>a)w=h*a;else h=w/a;w=Math.max(40,Math.floor(w));h=Math.max(40,Math.floor(h));
 $('#stage').style.width=w+'px';$('#stage').style.height=h+'px';rd.setSize(w,h);
 persp.aspect=a;ortho.left=-5*a;ortho.right=5*a;persp.updateProjectionMatrix();ortho.updateProjectionMatrix();
 draw();   // setSize mengosongkan canvas -> gambar ulang langsung supaya tidak berkedip
}
function resetCam(){
 controls.target.set(0,.8,0);cam.position.set(5,3.5,6);
 if(cam===ortho)ortho.zoom=10/(2*8.47*Math.tan(persp.fov*Math.PI/360));
 cam.updateProjectionMatrix();controls.update();redraw();
}
function frameView(){   // fokus ke object terpilih, atau semua object kalau tidak ada yang dipilih
 const b=new T.Box3(),t=new T.Box3(),list=sel&&sel.kind!='light'?[sel]:items.filter(i=>i.kind!='light');
 list.forEach(i=>{t.setFromObject(i.obj);if(!t.isEmpty())b.union(t)});
 if(b.isEmpty())return resetCam();
 const c=b.getCenter(new T.Vector3()),r=Math.max(b.getSize(new T.Vector3()).length()/2,.3);
 const dir=cam.position.clone().sub(controls.target).normalize();controls.target.copy(c);
 if(cam===ortho){ortho.zoom=10/(2*r*1.25);cam.position.copy(c).addScaledVector(dir,30)}
 else{const v=persp.fov*Math.PI/360,h=Math.atan(Math.tan(v)*persp.aspect),d=r/Math.sin(Math.min(v,h))*1.1;cam.position.copy(c).addScaledVector(dir,d)}
 cam.updateProjectionMatrix();controls.update();redraw();
}

/* ---------- terapkan state S ke scene ---------- */
let ped=false,lastAsp=null,lastEI=null;
function applyAll(){
 const m=S.bg,tr=m=='transparent',isSky=m=='sky';let c={top:S.top,hor:S.hor,bot:S.bot};
 if(m=='studio')c={top:S.studio,hor:S.studio,bot:S.studio};
 if(m=='gradient')c={top:S.gA,hor:'#'+new T.Color(S.gA).lerp(new T.Color(S.gB),.5).getHexString(),bot:S.gB};
 U.top.value.set(c.top);U.hor.value.set(c.hor);U.bot.value.set(c.bot);U.bri.value=S.bri;
 U.stars.value=isSky?S.stars:0;U.neb.value=isSky?S.neb:0;
 const e=S.el*Math.PI/180,az=S.az*Math.PI/180;
 sun.color.set(S.sun);sun.intensity=S.int;sun.position.set(Math.cos(e)*Math.sin(az),Math.sin(e),Math.cos(e)*Math.cos(az)).multiplyScalar(30);
 U.sd.value.copy(sun.position).normalize();U.sc.value.set(S.sun).multiplyScalar(Math.min(S.int,4)*.5);U.sk.value=isSky?1:0;
 sky.visible=!tr;rd.toneMappingExposure=S.exp;
 scene.fog.color.set(c.hor).multiplyScalar(Math.min(1,S.bri));scene.fog.density=tr?0:S.fog*.08;
 hemi.color.set(c.top);hemi.groundColor.set(c.bot);hemi.intensity=S.env?.25:.55;
 scene.environment=S.env&&envRT?envRT.texture:null;
 queueEnv([c.top,c.hor,c.bot,S.bri,U.stars.value,U.neb.value,U.sk.value,S.sun,S.el,S.az,Math.min(S.int,4)].join());
 ground.visible=S.ground!='off';ground.material=S.ground=='solid'?gSolid:gShadow;
 gSolid.color.set(S.gcol);gSolid.roughness=S.grough;gSolid.envMapIntensity=S.envInt;pedestal.material.envMapIntensity=S.envInt;
 grid.visible=S.grid;pedestal.visible=S.pedestal;
 if(S.pedestal!=ped){const d=S.pedestal?.3:-.3;items.forEach(t=>t.kind!='light'&&(t.obj.position.y+=d));ped=S.pedestal}
 if(S.envInt!==lastEI){lastEI=S.envInt;items.forEach(t=>applyMat(t))}
 if(S.cam.type!=(cam===ortho?'ortho':'persp'))switchCam(S.cam.type);
 persp.fov=2*Math.atan((ASP[S.cam.aspect]<1?18:12)/S.cam.focal)*180/Math.PI;persp.updateProjectionMatrix();
 if(lastAsp!=S.cam.aspect){lastAsp=S.cam.aspect;fit()}
 controls.enabled=!S.cam.locked&&!tc.dragging;
 syncChrome();redraw();
}
function preset(k){const {n,...d}=PRE[k];Object.assign(S,d,{sky:k,bg:'sky'})}

/* ---------- render on demand (hemat GPU saat idle) ---------- */
let dirty=true;
function redraw(){dirty=true}
function draw(){sky.position.copy(cam.position);rd.render(scene,cam)}
function loop(){requestAnimationFrame(loop);controls.update();if(dirty){dirty=false;draw()}}
