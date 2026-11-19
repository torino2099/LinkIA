const C=window.CFG,$=id=>document.getElementById(id);
const sb=C.SUPABASE_URL.startsWith('TU_')?null:supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY);   // <-- conexión a Supabase
const fmt=d=>new Date(d).toLocaleString('es-MX');

function show(session){
  const adm=!!session&&session.user.email===C.ADMIN_EMAIL;
  $('login').classList.toggle('hidden',adm);$('panel').classList.toggle('hidden',!adm);
  if(adm){loadQuotes();loadPosts();}
}
if(!sb){$('lmsg').textContent='Falta configurar Supabase en config.js';}
else{sb.auth.getSession().then(({data})=>show(data.session));}

$('lf').onsubmit=async e=>{
  e.preventDefault();if(!sb)return;
  const {data,error}=await sb.auth.signInWithPassword({email:$('le').value,password:$('lp').value});
  if(error||data.user.email!==C.ADMIN_EMAIL){await sb.auth.signOut();$('lmsg').textContent='Correo o contraseña incorrectos.';return;}
  show(data.session);
};
$('out').onclick=async()=>{await sb.auth.signOut();location.reload();};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  ['tc','tm'].forEach(t=>$(t).classList.toggle('hidden',t!==b.dataset.t));
});

function row(html,onDel){
  const d=document.createElement('div');d.className='row';
  html.forEach(([k,v])=>{const p=document.createElement('p');
    if(k){const b=document.createElement('b');b.textContent=k+': ';p.appendChild(b);}
    p.appendChild(document.createTextNode(v||'—'));d.appendChild(p);});
  const x=document.createElement('button');x.className='del';x.textContent='Borrar';x.style.marginTop='10px';x.onclick=onDel;d.appendChild(x);
  return d;
}
async function loadQuotes(){
  const {data,error}=await sb.from('cotizaciones').select('*').order('created_at',{ascending:false});
  const box=$('tc');box.innerHTML='';
  if(error||!data.length){box.innerHTML='<div class="empty">No hay cotizaciones.</div>';return;}
  data.forEach(q=>box.appendChild(row([['Servicio',q.servicio],['Nombre',q.nombre],['Empresa',q.empresa],['Correo',q.email],['Teléfono',q.telefono],['Detalles',q.mensaje],['Fecha',fmt(q.created_at)]],
    async()=>{if(confirm('¿Borrar esta cotización?')){await sb.from('cotizaciones').delete().eq('id',q.id);loadQuotes();}})));
}
async function loadPosts(){
  const {data}=await sb.from('posts').select('*').order('created_at',{ascending:false});
  const box=$('plist');box.innerHTML='';
  if(!data||!data.length){box.innerHTML='<div class="empty">Aún no hay publicaciones.</div>';return;}
  data.forEach(p=>{
    const r=row([['',p.texto],['Fecha',fmt(p.created_at)]],async()=>{
      if(!confirm('¿Borrar esta publicación?'))return;
      if(p.image_path)await sb.storage.from('feed').remove([p.image_path]);
      await sb.from('posts').delete().eq('id',p.id);loadPosts();});
    if(p.image_url){const i=document.createElement('img');i.src=p.image_url;i.alt='';i.style.cssText='max-width:260px;margin-top:10px;display:block';r.insertBefore(i,r.lastChild);}
    box.appendChild(r);
  });
}
$('pf').onsubmit=async e=>{
  e.preventDefault();
  const txt=$('pt').value.trim(),f=$('pi').files[0];if(!txt&&!f)return;
  $('pmsg').textContent='Publicando…';
  let image_url=null,image_path=null;
  if(f){image_path=Date.now()+'-'+f.name.replace(/[^\w.-]/g,'_');
    const up=await sb.storage.from('feed').upload(image_path,f);
    if(up.error){$('pmsg').textContent='Error al subir la imagen.';return;}
    image_url=sb.storage.from('feed').getPublicUrl(image_path).data.publicUrl;}
  const {error}=await sb.from('posts').insert({texto:txt,image_url,image_path});
  $('pmsg').textContent=error?'Sin permiso para publicar.':'Publicado.';
  if(!error){e.target.reset();loadPosts();}
};
