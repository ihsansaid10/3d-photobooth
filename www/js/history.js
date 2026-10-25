/* history.js — undo / redo berbasis snapshot JSON (state S + transform/warna/material/nama tiap item). */
let hist=[],hi=-1;
const snap=()=>JSON.stringify({S,i:items.map(t=>{const o=t.obj;
 return[t.id,o.position.toArray(),[o.rotation.x,o.rotation.y,o.rotation.z],o.scale.toArray(),t.color,t.int,t.name,t.mat||null]})});
function commit(){const j=snap();if(j==hist[hi])return;hist=hist.slice(0,hi+1);hist.push(j);if(hist.length>80)hist.shift();hi=hist.length-1;btns()}
function histClear(){hist=[];hi=-1;btns()}
function restore(j){
 const d=JSON.parse(j),keep=new Set(d.i.map(x=>x[0]));S=d.S;
 items.forEach(t=>{if(!keep.has(t.id))scene.remove(t.obj)});
 items=d.i.map(x=>{const t=reg.get(x[0]),o=t.obj;if(!o.parent)scene.add(o);
  o.position.fromArray(x[1]);o.rotation.set(...x[2]);o.scale.fromArray(x[3]);t.name=x[6];
  if(x[7])t.mat={...x[7]};setColor(t,x[4]);if(x[5]!=null){t.int=x[5];o.intensity=x[5]}
  if(t.kind!='light')applyMat(t);return t});
 ped=S.pedestal;if(sel&&!items.includes(sel))sel=null;select(sel);applyAll();fillUI();btns();
}
const undo=()=>{if(hi>0)restore(hist[--hi])},redo=()=>{if(hi<hist.length-1)restore(hist[++hi])};
function btns(){$$('[data-a="undo"]').forEach(b=>b.disabled=hi<=0);$$('[data-a="redo"]').forEach(b=>b.disabled=hi>=hist.length-1)}
