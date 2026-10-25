/* config.js — konstanta, preset, dan state default.
   Tidak menyentuh scene / renderer, jadi aman diubah tanpa risiko merusak engine. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],T=THREE;
T.ColorManagement.legacyMode=false;

const ASP={'1:1':1,'4:5':.8,'16:9':16/9,'9:16':9/16};
const P=o=>({stars:0,neb:0,exp:1,bri:1,fog:0,...o});
const PRE={
 daylight:P({n:'☀️ Daylight',top:'#3f8fe0',hor:'#d3e9ff',bot:'#8f9aa6',sun:'#fff4e0',int:2.2,el:55,az:40}),
 sunset:P({n:'🌇 Sunset',top:'#3d3585',hor:'#ff7b57',bot:'#6b2f55',sun:'#ff8f6b',int:1.8,el:7,az:210,fog:.12}),
 golden:P({n:'🌆 Golden Hour',top:'#34588f',hor:'#ffb347',bot:'#5e4126',sun:'#ffb04d',int:2.6,el:13,az:235,fog:.08,exp:1.1}),
 night:P({n:'🌃 Night City',top:'#03060f',hor:'#123a73',bot:'#04060c',sun:'#5c8dff',int:.5,el:35,az:300,stars:.6,fog:.15,exp:1.2}),
 space:P({n:'🌌 Space',top:'#01010a',hor:'#2b1257',bot:'#01010a',sun:'#d0d8ff',int:1.4,el:30,az:120,stars:1,neb:1}),
 overcast:P({n:'☁️ Overcast',top:'#aab3bb',hor:'#d8dce0',bot:'#8f969c',sun:'#ffffff',int:.8,el:70,az:0,fog:.25})
};
const LP={
 cinematic:{s:.4,L:[['spot',[5,6,4],'#ffcf9a',2.6],['point',[-5,3,-4],'#6fa8ff',1.6],['point',[0,2,6],'#ffffff',.4]]},
 softbox:{s:.3,L:[['area',[4,5,4],'#ffffff',7],['area',[-4,4,3],'#fff3e6',5],['area',[0,3,-5],'#ffffff',4]]},
 dramatic:{s:.05,L:[['spot',[3,7,1],'#ffffff',4.5],['point',[-4,1.5,-3],'#ff4d3d',1.4]]},
 neon:{s:.05,L:[['point',[-3,2,2],'#ff2bd6',2.6],['point',[3,2,-2],'#27e6ff',2.6],['spot',[0,6,3],'#6a4cff',2]]}
};
const QS={draft:{e:1280,ss:1,sm:1024,fx:0},high:{e:2048,ss:1.5,sm:2048,fx:1},ultra:{e:3072,ss:2,sm:4096,fx:1}};

/* color plate untuk lantai: [hex, nama] */
const FLOORS=[
 ['#f2f2f2','White'],['#d9d9d9','Light gray'],['#8d8d8d','Gray'],['#3a3a3a','Charcoal'],['#121212','Black'],['#efe3cf','Cream'],
 ['#cdb08a','Sand'],['#8a5a34','Wood'],['#c8553d','Terracotta'],['#d62839','Red'],['#f28c28','Orange'],['#f6c945','Yellow'],
 ['#4f9d69','Green'],['#2a9d8f','Teal'],['#5aa9e6','Sky blue'],['#1d3557','Navy'],['#7b4ae2','Purple'],['#ff7eb6','Pink']
];

/* preset material: r=roughness, m=metalness, t=transmission (glass), c=warna */
const MATS={
 clay:{n:'Clay',r:.95,m:0,t:0,c:'#c9b9a8'},
 plastic:{n:'Plastic',r:.28,m:0,t:0,c:'#e8e8e8'},
 rubber:{n:'Rubber',r:.85,m:0,t:0,c:'#2b2b2b'},
 chrome:{n:'Chrome',r:.04,m:1,t:0,c:'#ffffff'},
 gold:{n:'Gold',r:.22,m:1,t:0,c:'#ffcf6b'},
 glass:{n:'Glass',r:.02,m:0,t:1,c:'#ffffff'}
};

const defaultState=()=>({
 bg:'sky',sky:'daylight',studio:'#d9d9d9',gA:'#1d2b53',gB:'#ff8a5c',
 ground:'solid',gcol:'#d9d9d9',grough:.85,grid:false,gridR:false,pedestal:false,q:'high',
 env:true,envInt:1,
 cam:{type:'persp',focal:50,aspect:'16:9',locked:false,thirds:true},
 ...(({n,...d})=>d)(PRE.daylight)
});
let S=defaultState();
const gp=k=>k.split('.').reduce((o,x)=>o[x],S);
const sp=(k,v)=>{const a=k.split('.'),l=a.pop();a.reduce((o,x)=>o[x],S)[l]=v};
