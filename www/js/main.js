/* main.js — bootstrap: hubungkan semua modul lalu jalankan loop. */
new ResizeObserver(()=>fit()).observe($('#vp'));
setTool('move');tab('obj');fit();applyAll();addPrim('sphere');fillUI();btns();
loop();

/* layar Welcome: tampil sekali (bisa dibuka lagi lewat Help > Welcome) */
$('#dlgWelcome').addEventListener('close',()=>{try{localStorage.setItem('pb_seen','1')}catch(e){}});
try{if(!localStorage.getItem('pb_seen'))dlg('#dlgWelcome')}catch(e){dlg('#dlgWelcome')}
