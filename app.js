const C=window.CFG,$=id=>document.getElementById(id);
const ok=!C.SUPABASE_URL.startsWith('TU_');
const sb=ok?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY):null;   // <-- conexión a Supabase

const SERVICIOS=[
['Firewall','Protección del perímetro de tu red con reglas, filtrado y detección de intrusos.'],
['Seguridad informática','Auditorías, antivirus gestionado y respaldos de la información de tu empresa.'],
['WiFi','Diseño e instalación de redes inalámbricas WiFi 6/7 con cobertura total.'],
['Servidores Linux','Instalación, configuración y mantenimiento de servidores Linux.'],
['Servidores Windows','Windows Server, Active Directory y Microsoft 365 para tu oficina.'],
['Servidores en la nube','Migración y administración de tus servicios en la nube.'],
['Fibra óptica','Instalación y certificación de enlaces de fibra de alta velocidad.'],
['Bases de datos','Diseño, optimización y respaldo de bases de datos SQL y NoSQL.'],
['Implementaciones de ERP','Puesta en marcha y migración de sistemas ERP a tu medida.']];
$('svcGrid').innerHTML=SERVICIOS.map((s,i)=>`<div class="card"><span class="n">SERVICIO ${String(i+1).padStart(2,'0')}</span><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('');
$('qs').innerHTML=SERVICIOS.map(s=>`<option value="${s[0]}">${s[0]}</option>`).join('');

document.querySelectorAll('[data-wa]').forEach(a=>{
  const n=a.dataset.wa==='ventas'?C.WA_VENTAS:C.WA;
  a.href='https://wa.me/'+n+'?text='+encodeURIComponent(a.dataset.msg);
});

// Cotización
$('qform').onsubmit=async e=>{
  e.preventDefault();
  if($('qh').value)return;
  if(!ok){$('qmsg').textContent='Falta configurar Supabase en config.js';return;}
  const {error}=await sb.from('cotizaciones').insert({servicio:$('qs').value,nombre:$('qn').value,empresa:$('qc').value,email:$('qe').value,telefono:$('qt').value,mensaje:$('qm').value});
  $('qmsg').textContent=error?'No se pudo enviar. Intenta de nuevo.':'¡Listo! Te contactaremos pronto.';
  if(!error)e.target.reset();
};

// Muro (solo lectura; publica y borra el admin desde admin.html)
async function loadPosts(){
  const box=$('posts');
  if(!ok){box.innerHTML='<div class="empty">Configura Supabase en config.js</div>';return;}
  const {data,error}=await sb.from('posts').select('*').order('created_at',{ascending:false}).limit(30);
  box.innerHTML='';
  if(error||!data.length){box.innerHTML='<div class="empty">Aún no hay publicaciones.</div>';return;}
  data.forEach(p=>{
    const d=document.createElement('article');d.className='card post';
    d.innerHTML='<div class="meta"></div>';
    d.firstChild.textContent='Link IA · '+new Date(p.created_at).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
    if(p.texto){const x=document.createElement('p');x.textContent=p.texto;d.appendChild(x);}
    if(p.image_url){const i=document.createElement('img');i.src=p.image_url;i.alt='Publicación';i.loading='lazy';d.appendChild(i);}
    box.appendChild(d);
  });
}
loadPosts();

// Noticias (Google Noticias vía rss2json)
async function news(q,id){
  const rss='https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=es-419&gl=MX&ceid=MX:es-419',box=$(id);
  try{
    const j=await (await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(rss))).json();
    box.innerHTML='';
    j.items.slice(0,6).forEach(it=>{
      const a=document.createElement('a');a.className='item';a.href=it.link;a.target='_blank';a.rel='noopener';
      const p=it.title.split(' - '),src=p.length>1?p.pop():'';
      a.textContent=p.join(' - ');
      const s=document.createElement('small');s.textContent=src;a.appendChild(s);box.appendChild(a);
    });
    if(!j.items.length)throw 0;
  }catch(e){box.innerHTML='<a class="item" target="_blank" rel="noopener" href="https://news.google.com/search?q='+encodeURIComponent(q)+'">Ver noticias en Google Noticias</a>';}
}
news('tecnología empresas','n1');
news('ciberseguridad OR "inteligencia artificial"','n2');
