/* ══ PWA SERVICE WORKER + INSTALL ══ */
(function(){
  // Register service worker
  // SW only works on https — skip silently on file://
  if('serviceWorker' in navigator &&
     (location.protocol==='https:' || location.protocol==='http:')){
    try{
      var swCode=[
        "self.addEventListener('push',function(e){",
        "var d=e.data?e.data.json():{title:'Walaup Admin',body:'Nouveau message'};",
        "e.waitUntil(self.registration.showNotification(d.title,{body:d.body,tag:'walaup',vibrate:[200,100,200]}));",
        "});",
        "self.addEventListener('notificationclick',function(e){",
        "e.notification.close();",
        "e.waitUntil(clients.openWindow('/'));",
        "});"
      ].join('\n');
      var blob=new Blob([swCode],{type:'application/javascript'});
      navigator.serviceWorker.register(URL.createObjectURL(blob))
        .then(function(r){window._swReg=r;})
        .catch(function(){});
    }catch(e){}
  }

  // Install prompt
  var _installEvt = null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    _installEvt = e;
    // Show after 3s if not dismissed
    setTimeout(function(){
      if(!localStorage.getItem('pwa_dismissed')){
        var banner = document.getElementById('pwaInstallBanner');
        if(banner) banner.classList.add('show');
      }
    }, 3000);
  });

  window.installPWA = function(){
    if(!_installEvt) return;
    _installEvt.prompt();
    _installEvt.userChoice.then(function(r){
      if(r.outcome === 'accepted') localStorage.setItem('pwa_installed','1');
      dismissPWA();
    });
  };

  window.dismissPWA = function(){
    var banner = document.getElementById('pwaInstallBanner');
    if(banner) banner.classList.remove('show');
    localStorage.setItem('pwa_dismissed','1');
  };

  // Visual notification banner (for new messages via Firestore)
  window.showNotifBanner = function(title, body){
    // Sound
    if(window.WalaupSound) WalaupSound.notif();
    // Visual badge
    var nb = document.getElementById('notifBadge');
    if(nb){
      var nt = nb.querySelector('.notif-text');
      if(nt) nt.innerHTML = '<strong>' + (title||'Nouveau message') + '</strong><br>' + (body||'');
      nb.classList.add('show');
      setTimeout(function(){ nb.classList.remove('show'); }, 5000);
    }
    // Browser notification (if permission granted)
    if(Notification && Notification.permission === 'granted'){
      try{ new Notification(title||'Walaup', {body: body||'', icon: '/favicon.ico'}); }catch(e){}
    }
  };

  // Request notification permission
  window.requestNotifPermission = function(){
    if(Notification && Notification.permission === 'default'){
      Notification.requestPermission().then(function(p){
        if(p === 'granted') console.log('Notifications autorisées');
      });
    }
  };

  // Auto-request on first interaction
  document.addEventListener('click', function(){
    if(Notification && Notification.permission === 'default'){
      Notification.requestPermission();
    }
  }, {once: true, passive: true});
})();

function doLogin(){
  var p=document.getElementById("passIn");
  if(!p)return;
  var pass=p.value;
  if(pass===ADMIN_PASS){
    sessionStorage.setItem("bzAdmin","1");
    if(typeof showAdmin==="function")showAdmin();
  } else {
    var el=document.getElementById("lerr");
    if(el)el.style.display="block";
  }
}

function _reqPushPerm(){
  if(!("Notification" in window))return;
  if(Notification.permission==="default"){
    setTimeout(function(){
      Notification.requestPermission().then(function(p){
        if(p==="granted"){try{new Notification("🔔 Walaup Admin",{body:"Notifications activées.",tag:"walaup-welcome"});}catch(e){}}
      });
    },3500);
  }
}
const ADMIN_PASS="bizflow2025";

/* ══ GLOBAL STATE — declared before any function can reference them ══ */
var allLeads=[],curFilter='all',curLeadId=null,unsubMsgs=null,_ppOpen=false;
var _unsubTestis=null;
var payFilter='all';
var tarifs={packs:{essentiel:{fixed:600,monthly:0,active:true,remise:0,remiseMotif:''},pro:{fixed:1200,monthly:0,active:true,remise:0,remiseMotif:''},partenaire:{fixed:2000,monthly:0,active:true,remise:0,remiseMotif:''}},features:{'Authentification':120,'Dashboard':80,'Gestion stock':180,'Gestion ventes':160,'Gestion dettes':150,'Gestion clients':140,'Rapports / statistiques':200,'Multi utilisateurs':250,'Notifications':100,'QR code':130,'Scan produits':140,'App Android':400,'Design premium':150,'Multilingue':100,'Gestion employés':160,'Paiement en ligne':200,'API externe':180,'Export PDF/Excel':120,'Chat intégré':170}};

/* Theme */

/* Helpers */
function toast(m,t='suc'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;clearTimeout(el._t);el.classList.add('on');el._t=setTimeout(()=>el.classList.remove('on'),3500);}
function _fmtShort(ts){
  if(!ts)return'';
  var d;
  if(ts.toDate)d=ts.toDate();
  else if(ts.seconds)d=new Date(ts.seconds*1000);
  else d=new Date(ts);
  var now=new Date();
  var diffMs=now-d;
  var diffH=diffMs/3600000;
  var diffD=diffMs/86400000;
  if(diffH<1)return Math.max(1,Math.floor(diffMs/60000))+'m';
  if(diffH<24)return d.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'});
  if(diffD<2)return'Hier';
  if(diffD<7)return['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
  return d.toLocaleDateString('fr',{day:'2-digit',month:'short'});
}

function fmtD(ts){if(!ts)return'—';const d=ts.toDate?ts.toDate():new Date(ts);const now=new Date(),diff=now-d;if(diff<60000)return'À l\'instant';if(diff<3600000)return Math.floor(diff/60000)+'min';if(diff<86400000)return Math.floor(diff/3600000)+'h';return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}

/* Login */
function doLogin(){if(document.getElementById('passIn').value===ADMIN_PASS){sessionStorage.setItem('bzAdmin','1');showAdmin();}else{document.getElementById('lerr').style.display='block';if(window.WalaupSound)WalaupSound.error();}}
function showAdmin(){
  // Inject manifest safely (avoids CORS on file://)
  if(location.protocol==='http:'||location.protocol==='https:'){
    var mLink=document.createElement('link');
    mLink.rel='manifest';mLink.href='manifest-admin.json';
    document.head.appendChild(mLink);
  }
  document.getElementById('loginView').style.display='none';
  document.getElementById('adminView').style.display='flex';
  loadLeads();loadTestis();loadTarifs();
  showTab('dash',document.querySelector('.nav-tab'));
}
function logout(){sessionStorage.removeItem('bzAdmin');document.getElementById('adminView').style.display='none';document.getElementById('loginView').style.display='flex';}

/* ══ ADMIN DEMO MANAGEMENT ══ */
async function resetDemoApproval(msgId){
  if(!window.confirm('Réinitialiser la validation de cette démo ?'))return;
  try{
    await db.collection('messages').doc(msgId).update({approvedByClient:false,approvedAt:null});
    // Check if any demo remains approved
    const snap=await db.collection('messages').where('leadId','==',curLeadId).where('approvedByClient','==',true).get();
    const newStatus=snap.empty?'demo':'validated';
    await db.collection('leads').doc(curLeadId).update({status:newStatus,clientApprovedAt:null});
    toast('✅ Validation réinitialisée — statut: '+newStatus);
  }catch(e){toast('Erreur','err');}
}

async function forceApproveDemoAdmin(msgId){
  try{
    const snap=await db.collection('messages').where('leadId','==',curLeadId).where('type','==','demo').get();
    const batch=db.batch();
    snap.docs.forEach(d=>{if(d.id!==msgId)batch.update(d.ref,{approvedByClient:false,approvedAt:null});});
    batch.update(db.collection('messages').doc(msgId),{approvedByClient:true,approvedAt:FS.serverTimestamp()});
    await batch.commit();
    await db.collection('leads').doc(curLeadId).update({status:'payment_requested',clientApprovedAt:FS.serverTimestamp()});
    toast('✅ Validation déplacée — statut: payment_requested');
  }catch(e){toast('Erreur','err');}
}


if(sessionStorage.getItem('bzAdmin')==='1'){showAdmin();_reqPushPerm();setTimeout(function(){
/* ── REAL-TIME NOTIFICATIONS (admin) ── */
db.collection('notifications').where('userId','==','admin').where('read','==',false)
  .onSnapshot(function(snap){
    snap.docChanges().forEach(function(change){
      if(change.type === 'added'){
        var d = change.doc.data();
        if(window.WalaupSound)WalaupSound.notif();
        window.showNotifBanner && window.showNotifBanner(d.title||'Nouvelle notification', d.message||'');
        // Mark as read after showing
        setTimeout(function(){ change.doc.ref.update({read:true}); }, 3000);
      }
    });
  });
},2000);}

/* Tab switch */
function showTab(tab,btn){
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  const map={dash:'dashTab',clients:'clientsTab',tarifs:'tarifsTab',paiements:'paiementsTab',stats:'statsTab',testi:'testiTab',marketplace:'marketplaceTab'};
  document.querySelectorAll('.tab-pane').forEach(el=>el.classList.remove('on'));
  const id=map[tab];
  const el=document.getElementById(id);
  if(el){el.classList.add('on');el.style.flexDirection='column';}
  if(tab==='stats'&&allLeads.length)renderStatBars();
  if(tab==='paiements')renderPayments();
  if(tab==='marketplace')loadMarketplaceAdmin();
  // Sync sidebar active state
  ['dash','clients','paiements','tarifs','stats','testi','marketplace'].forEach(t=>{
    const sbi=document.getElementById('sbi-'+t);
    if(sbi)sbi.classList.toggle('active',t===tab);
  });
}

/* ── LEADS ── */

var _leadUnreadMap={};
var _leadLastMsgMap={};

function loadLeads(){
  db.collection('leads').onSnapshot(snap=>{
    allLeads=[...snap.docs].map(d=>({id:d.id,...d.data()}));
    // Sort by lastMsgAt (most recent activity first), fallback to createdAt
    allLeads.sort((a,b)=>{
      var ta=a.lastMsgAt?.toMillis?.()??a.lastMsgAt?.seconds*1000??a.createdAt?.toMillis?.()??0;
      var tb=b.lastMsgAt?.toMillis?.()??b.lastMsgAt?.seconds*1000??b.createdAt?.toMillis?.()??0;
      return tb-ta;
    });
    renderStats();renderLeads();renderDashboard();renderPayments();
  },e=>console.error(e));

  // Global listener: unread client messages across all leads
  db.collection('messages')
    .where('from','==','client')
    .where('readByAdmin','==',false)
    .onSnapshot(snap=>{
      _leadUnreadMap={};
      snap.docs.forEach(doc=>{
        var m=doc.data();
        if(!m.leadId)return;
        _leadUnreadMap[m.leadId]=(_leadUnreadMap[m.leadId]||0)+1;
        var msgTime=m.createdAt?.toMillis?.()??0;
        var prev=_leadLastMsgMap[m.leadId];
        if(!prev||msgTime>prev.time){
          _leadLastMsgMap[m.leadId]={text:m.text||'📎',time:msgTime,from:'client'};
        }
        // Bubble lastMsgAt to lead doc for sorting
        db.collection('leads').doc(m.leadId)
          .update({lastMsgAt:m.createdAt})
          .catch(()=>{});
      });
      renderLeads();
      // Sidebar badge
      var total=Object.values(_leadUnreadMap).reduce(function(a,b){return a+b;},0);
      var badge=document.getElementById('sbBadgeClients');
      if(badge){badge.textContent=total>9?'9+':total||'';badge.className='sb-badge'+(total?' on':'');}
      // Phone push (background only)
      if(total>0) _maybePush(total);
    },()=>{});
}

function _maybePush(n){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  if(document.visibilityState==='visible')return;
  try{
    var title='💬 Walaup Admin — '+n+' message'+(n>1?'s':'')+' non lu'+(n>1?'s':'');
    var body='Un client vous a envoyé un message.';
    if(window._swReg){
      window._swReg.showNotification(title,{body:body,tag:'walaup-admin',renotify:true,vibrate:[200,100,200]});
    } else {
      new Notification(title,{body:body,tag:'walaup-admin'});
    }
  }catch(e){}
}



function renderStats(){
  const uniqueClients=groupLeadsByClient(allLeads).length;
  const n=allLeads.length;
  const stats={total:uniqueClients,new:allLeads.filter(l=>l.status==='new').length,demo:allLeads.filter(l=>l.status==='demo').length,validated:allLeads.filter(l=>l.status==='validated').length,conv:allLeads.filter(l=>l.status==='converted').length};
  ['stTotal','stNew','stDemo','stVal','stConv'].forEach((id,i)=>{
    const el=document.getElementById(id);if(el)el.textContent=Object.values(stats)[i];
  });
  ['st2Total','st2New','st2Demo','st2Val','st2Conv'].forEach((id,i)=>{
    const el=document.getElementById(id);if(el)el.textContent=Object.values(stats)[i];
  });
  const cc=document.getElementById('clientCount');if(cc)cc.textContent='('+uniqueClients+')';
}


function renderDashboard(){
  // Activity feed — last 6 actions
  const feed=document.getElementById('actFeed');
  if(!feed)return;
  const dotColors={new:'var(--ac)',contacted:'var(--ac2)',demo:'var(--yellow)',validated:'var(--green)',converted:'var(--green)',closed:'var(--mu)'};
  const recent=allLeads.slice(0,6);
  feed.innerHTML=recent.map(l=>`<div class="activity-item"><div class="act-dot" style="background:${dotColors[l.status||'new']||'var(--ac)'}"></div><div class="act-txt"><strong>${l.name||'Client'}</strong> — ${spLabel(l.status)}</div><div class="act-time">${fmtD(l.createdAt)}</div></div>`).join('')||'<div style="padding:12px 0;font-size:.8rem;color:var(--mu)">Aucune activité</div>';
  // Top clients
  const topC=document.getElementById('topClients');
  if(!topC)return;
  const packColors={essentiel:'rgba(52,211,153,.1)',pro:'rgba(92,142,255,.1)',partenaire:'rgba(248,113,113,.1)'};
  const packText={essentiel:'var(--green)',pro:'var(--ac)',partenaire:'var(--red)'};
  topC.innerHTML=allLeads.slice(0,5).map(l=>`<div class="top-client"><div class="tc-av">${(l.name||'?')[0].toUpperCase()}</div><div><div class="tc-name">${l.name||'—'}</div><div style="font-size:.68rem;color:var(--mu)">${l.type||'—'}</div></div>${l.pack?`<span class="tc-pack" style="background:${packColors[l.pack]||'var(--sf)'};color:${packText[l.pack]||'var(--mu)'}">${l.packLabel||l.pack}</span>`:''}</div>`).join('')||'<div style="padding:12px 0;font-size:.8rem;color:var(--mu)">Aucun client</div>';
  renderChartBars();
}


function renderChartBars(){
  renderBars('chartType', getGroupCounts(l=>l.type||'Autre'));
  renderBars('chartPack', getGroupCounts(l=>l.packLabel||l.pack||'Sans pack'));
}


function renderStatBars(){
  renderBars('st2Type', getGroupCounts(l=>l.type||'Autre'));
  renderBars('st2Pack', getGroupCounts(l=>l.packLabel||l.pack||'Sans pack'));
}


function getGroupCounts(keyFn){
  const counts={};
  allLeads.forEach(l=>{const k=keyFn(l);counts[k]=(counts[k]||0)+1;});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
}


function renderBars(containerId,entries){
  const el=document.getElementById(containerId);if(!el)return;
  if(!entries.length){el.innerHTML='<div style="font-size:.78rem;color:var(--mu)">Aucune donnée</div>';return;}
  const max=Math.max(...entries.map(e=>e[1]),1);
  el.innerHTML=entries.map(([k,v])=>`<div class="cbar"><div class="cbar-val">${v}</div><div class="cbar-fill" style="height:${Math.max(v/max*100,4)}%"></div><div class="cbar-lbl">${k.substring(0,10)}</div></div>`).join('');
}


function spClass(s){return's-'+(s||'new');}


function spLabel(s){const m={new:'🔵 Nouvelle',contacted:'🟣 Contacté',demo:'🟡 Démo',validated:'🟢 Validée',payment_requested:'⏳ Paiement en attente',payment_confirmed:'✅ Paiement confirmé',converted:'✅ Livrée',closed:'⚫ Fermé'};return m[s]||'🔵 Nouvelle';}


function setFilter(f,btn){curFilter=f;document.querySelectorAll('.fb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');renderLeads();}


/* ══ GROUPEMENT PAR CLIENT ══
   Clé d'identité : userId > phone > email > name
   Tous les leads d'un même vrai client sont regroupés.
══════════════════════════════════════════════════ */
function clientKey(l){
  if(l.userId)return 'uid:'+l.userId;
  if(l.phone&&l.phone.trim())return 'ph:'+l.phone.trim().replace(/\s/g,'');
  if(l.userEmail&&l.userEmail.trim())return 'em:'+l.userEmail.trim().toLowerCase();
  return 'nm:'+(l.name||'').trim().toLowerCase();
}

function groupLeadsByClient(leads){
  const map=new Map();
  leads.forEach(l=>{
    const k=clientKey(l);
    if(!map.has(k))map.set(k,[]);
    map.get(k).push(l);
  });
  // Trier chaque groupe par date (plus récent en premier)
  map.forEach(arr=>arr.sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0)));
  // Retourner un tableau de groupes triés par date du lead le plus récent
  return [...map.values()].sort((a,b)=>(b[0].createdAt?.toMillis()||0)-(a[0].createdAt?.toMillis()||0));
}

function statusDotColor(s){
  const m={new:'var(--ac)',contacted:'var(--ac2)',demo:'var(--yellow)',
    validated:'var(--green)',payment_requested:'var(--yellow)',
    payment_confirmed:'var(--green)',converted:'var(--green)',closed:'var(--mu)'};
  return m[s]||'var(--ac)';
}

function renderLeads(){
  const q=(document.getElementById('searchIn')?.value||'').toLowerCase();

  // Filtrer les leads individuels
  const filtered=allLeads.filter(l=>{
    if(curFilter!=='all'&&l.status!==curFilter)return false;
    if(q&&!(l.name||'').toLowerCase().includes(q)
        &&!(l.type||'').toLowerCase().includes(q)
        &&!(l.phone||'').includes(q)
        &&!(l.userEmail||'').toLowerCase().includes(q))return false;
    return true;
  });

  const groups=groupLeadsByClient(filtered);
  const list=document.getElementById('clientsList');
  const PC={essentiel:'var(--green)',pro:'var(--ac)',partenaire:'var(--red)'};

  if(!groups.length){
    list.innerHTML='<div style="padding:20px;text-align:center;font-size:.8rem;color:var(--mu)">Aucun client</div>';
    const cc=document.getElementById('clientCount');if(cc)cc.textContent='(0)';
    return;
  }

  const cc=document.getElementById('clientCount');
  if(cc)cc.textContent='('+groups.length+')';

  list.innerHTML=groups.map(group=>{
    const rep=group[0]; // lead représentatif (le plus récent)
    const isActive=group.some(l=>l.id===curLeadId);
    const multi=group.length>1;

    // Pills des demandes (si plusieurs)
    const pillsHtml=multi
      ? `<div class="ci-demands">${group.map((l,i)=>`
          <span class="ci-demand-pill ${l.id===curLeadId?'active-pill':''}" onclick="event.stopPropagation();selectLeadInGroup('${l.id}')">
            App ${i+1}
            <span style="width:5px;height:5px;border-radius:50%;background:${statusDotColor(l.status)};display:inline-block;margin-left:2px"></span>
          </span>`).join('')}</div>`
      : '';

    // Statut à afficher = celui du lead actif ou du plus récent
    const displayLead=group.find(l=>l.id===curLeadId)||rep;

    // Unread count for this group
    var groupUnread=group.reduce(function(s,l){return s+(_leadUnreadMap[l.id]||0);},0);
    var lastMsgEntry=group.map(function(l){return _leadLastMsgMap[l.id];}).filter(Boolean)
      .sort(function(a,b){return (b.time||0)-(a.time||0);})[0];
    var hasUnread=groupUnread>0;
    var repTs=rep.lastMsgAt||rep.createdAt;
    var timeLabel=repTs?_fmtShort(repTs):'';

    return `<div class="client-item ${isActive?'active':''}${hasUnread?' has-unread':''}" onclick="selectLeadInGroup('${rep.id}',${isActive?'false':'true'})">
      <div class="ci-top">
        <div style="flex:1;min-width:0">
          <div class="ci-name" style="display:flex;align-items:center;gap:4px">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rep.name||'—'}${multi?`<span class="ci-count">${group.length}</span>`:''}</span>
            ${hasUnread?`<span class="ci-unread-badge">${groupUnread>9?'9+':groupUnread}</span>`:''}
            <span class="ci-time">${timeLabel}</span>
          </div>
          <div class="ci-meta">${rep.phone||rep.userEmail||'—'}</div>
          ${lastMsgEntry?`<div class="ci-last-msg">${lastMsgEntry.from==='client'?'👤 ':'🔹 '}${(lastMsgEntry.text||'').substring(0,45)}${(lastMsgEntry.text||'').length>45?'…':''}</div>`:''}
        </div>
        <span class="ci-status ${spClass(displayLead.status)}" style="flex-shrink:0;margin-left:6px">${spLabel(displayLead.status)}</span>
      </div>
      ${displayLead.pack?`<div class="ci-pack" style="color:${PC[displayLead.pack]||'var(--ac)'}">${displayLead.packLabel||displayLead.pack}</div>`:''}
      ${pillsHtml}
    </div>`;
  }).join('');
}


function renderAdminChat(msgs,leadId){
  const c=document.getElementById('adminChatMsgs');
  if(!msgs.length){c.innerHTML='<div style="text-align:center;padding:36px;color:var(--mu);font-size:.8rem">Aucun message.<br>Envoyez un premier message au client.</div>';return;}
  c.innerHTML='';
  msgs.forEach(m=>{
    if(m.type==='system'){c.innerHTML+=`<div class="msg-bubble from-system"><div class="bubble-inner">⚙️ ${m.text}</div><div class="bubble-meta">${fmtD(m.createdAt)}</div></div>`;}
    else if(m.type==='demo'||m.type==='final'){
      const approved=m.approvedByClient;
      const isFin=m.type==='final';
      const adminBtns=!isFin
        ?(approved
            ?`<button onclick="resetDemoApproval('${m.id}')" style="padding:4px 9px;border-radius:6px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.06);color:var(--red);font-size:.67rem;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600">↩ Annuler validation</button>`
            :`<button onclick="forceApproveDemoAdmin('${m.id}')" style="padding:4px 9px;border-radius:6px;border:1px solid rgba(52,211,153,.3);background:rgba(52,211,153,.06);color:var(--green);font-size:.67rem;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600">✅ Valider cette version</button>`)
        :'';
      c.innerHTML+=`<div class="demo-bubble-a" style="${isFin?'border-color:rgba(52,211,153,.4);background:rgba(52,211,153,.05)':approved?'border-color:rgba(52,211,153,.28);background:rgba(52,211,153,.03)':''}">
        <div class="dba-ver">${isFin?'🏁 Version finale':'🎯 Démo '+(m.demoVersion||'')}</div>
        <div class="dba-msg">${m.text||''}</div>
        <div class="dba-url"><a href="${m.demoUrl}" target="_blank" style="color:var(--ac);font-size:.7rem;word-break:break-all">${m.demoUrl||''}</a></div>
        <div class="dba-meta">
          ${approved?'<span class="approved-badge">✅ '+(isFin?'Reçue':'Validée')+'</span>':'<span style="color:var(--mu);font-size:.68rem">⏳ En attente client</span>'}
          <span style="font-size:.62rem;color:var(--mu2)">${fmtD(m.createdAt)}</span>
        </div>
        ${adminBtns?`<div style="display:flex;gap:5px;margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.07);flex-wrap:wrap;align-items:center"><span style="font-size:.63rem;color:var(--mu2)">Admin :</span>${adminBtns}<a href="${m.demoUrl}" target="_blank" style="padding:4px 9px;border-radius:6px;border:1px solid var(--bd2);background:var(--sf);color:var(--ac);font-size:.67rem;font-weight:600">🔗 Ouvrir</a></div>`:''}
      </div>`;
    }else if(m.type==='approval'){c.innerHTML+=`<div class="approval-bub">✅ ${m.text}<div style="font-size:.63rem;opacity:.6;margin-top:3px">${fmtD(m.createdAt)}</div></div>`;}
    else if(m.type==='image'){
      const isAdmin=m.from==='admin';
      c.innerHTML+=`<div class="msg-bubble ${isAdmin?'from-admin':'from-client'}"><div class="bubble-inner"><img src="${m.imageData}" style="max-width:180px;border-radius:9px;cursor:pointer;border:1px solid var(--bd)" onclick="window.open(this.src,'_blank')" alt="${m.imageName||'image'}"><div style="font-size:.68rem;margin-top:3px;opacity:.7">${m.imageName||'image'} — cliquer pour agrandir</div></div><div class="bubble-meta">${isAdmin?'Vous':'Client'} · ${fmtD(m.createdAt)}</div></div>`;
    }else if(m.type==='voice'){
      const isAdmin=m.from==='admin';
      c.innerHTML+=`<div class="msg-bubble ${isAdmin?'from-admin':'from-client'}"><div class="bubble-inner"><div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--sf);border-radius:9px;border:1px solid var(--bd)"><button onclick="var a=new Audio('${m.audioData}');a.play()" style="width:26px;height:26px;border-radius:50%;border:none;background:var(--ac);color:#fff;cursor:pointer">▶</button><span style="font-size:.75rem;color:var(--mu)">🎤 Vocal ${m.duration||0}s</span></div></div><div class="bubble-meta">${isAdmin?'Vous':'Client'} · ${fmtD(m.createdAt)}</div></div>`;
    }else if(m.type==='payment'){
      c.innerHTML+=`<div class="approval-bub" style="background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.2);color:var(--yellow)">💳 ${m.text}<div style="font-size:.63rem;opacity:.6;margin-top:3px">${fmtD(m.createdAt)}</div></div>`;
    }else{
      const isAdmin=m.from==='admin';
      c.innerHTML+=`<div class="msg-bubble ${isAdmin?'from-admin':'from-client'}"><div class="bubble-inner">${m.text}</div><div class="bubble-meta">${!m.readByClient&&isAdmin?'<span class="unread-dot"></span>':''}${isAdmin?'Vous':'Client'} · ${fmtD(m.createdAt)}</div></div>`;
    }
  });
  c.scrollTop=c.scrollHeight;
  if(_chatOvOpen)syncChatOverlay();
  // Update unread dot
  const dot=document.getElementById('chatUnreadDot');
  const unreads=msgs.filter(m=>!m.readByAdmin&&m.from!=='admin').length;
  if(dot){dot.textContent=unreads>9?'9+':unreads||'';dot.className='chat-unread-dot'+(unreads?' on':'');}
}


async function sendAdminMsg(){
  if(window.WalaupSound) WalaupSound.send();
  if(!curLeadId)return;
  const lead=allLeads.find(l=>l.id===curLeadId);
  const text=document.getElementById('adminMsgIn').value.trim();if(!text)return;
  document.getElementById('adminMsgIn').value='';document.getElementById('adminMsgIn').style.height='auto';
  try{
    await db.collection('messages').add({leadId:curLeadId,userId:lead?.userId||null,from:'admin',type:'text',text,createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true});
    if(lead?.status==='new'){
      await db.collection('leads').doc(curLeadId).update({status:'contacted',updatedAt:FS.serverTimestamp(),lastMsgAt:FS.serverTimestamp()});
    } else {
      await db.collection('leads').doc(curLeadId).update({lastMsgAt:FS.serverTimestamp()});
    }
    if(lead?.userId)await db.collection('notifications').add({userId:lead.userId,leadId:curLeadId,title:'💬 Message de Walaup',message:text.substring(0,100)+(text.length>100?'...':''),type:'message',read:false,createdAt:FS.serverTimestamp()});
  }catch(e){console.error(e);toast('Erreur: '+e.message,'err');}
}


async function sendDemoMsg(){
  if(!curLeadId)return;
  const lead=allLeads.find(l=>l.id===curLeadId);
  const url=document.getElementById('demoUrlIn').value.trim();
  const ver=document.getElementById('demoVerIn').value.trim();
  const msg=document.getElementById('demoMsgIn').value.trim();
  const isFinal=document.getElementById('isFinalChk')?document.getElementById('isFinalChk').checked:false;
  if(!url){toast('Entrez l\'URL de la démo/finale','err');return;}

  const existing=await db.collection('messages').where('leadId','==',curLeadId).where('type','==','demo').get();
  const vNum=existing.size+1;
  var leadStatus2=lead&&lead.status||'';

  if(isFinal){
    try{
      await db.collection('messages').add({
        leadId:curLeadId,userId:lead&&lead.userId||null,from:'admin',type:'final',
        text:msg||'🏁 Votre application finale est prête !',
        demoUrl:url,demoVersion:'finale',versionNumber:vNum,
        approvedByClient:false,createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true
      });
      await db.collection('leads').doc(curLeadId).update({status:'converted',updatedAt:FS.serverTimestamp()});
      if(lead&&lead.userId){
        await db.collection('notifications').add({
          userId:lead.userId,leadId:curLeadId,
          title:'🏁 Votre application finale est prête !',
          message:'Votre app est terminée — ouvrez-la dans votre espace client.',
          type:'final_ready',read:false,createdAt:FS.serverTimestamp()
        });
        await db.collection('messages').add({
          leadId:curLeadId,from:'system',type:'system',
          text:'🏁 Version finale livrée ! Confirmez la réception dans votre espace.',
          createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true
        });
      }
      document.getElementById('demoUrlIn').value='';
      document.getElementById('demoMsgIn').value='';
      var chk=document.getElementById('isFinalChk');if(chk)chk.checked=false;
      toast('🏁 Version finale envoyée !');
    }catch(e){toast('Erreur: '+e.message,'err');}
    return;
  }

  // Block regular demo if payment pending/confirmed — must send final
  var leadStatus=lead&&lead.status||'';
  if(['payment_requested','payment_confirmed'].includes(leadStatus)&&!isFinal){
    toast('💳 Paiement reçu — cochez "🏁 Version finale" pour la livraison.','err');
    if(document.getElementById('isFinalChk'))document.getElementById('isFinalChk').checked=true;
    return;
  }
  // Block regular demo if client has already paid
  if(['payment_requested','payment_confirmed'].includes(leadStatus2)&&!isFinal){
    toast('💳 Paiement reçu — cochez "🏁 Version finale" pour livrer.','err');
    var chk2=document.getElementById('isFinalChk');if(chk2)chk2.checked=true;
    return;
  }
  if(existing.size>=3&&!isFinal){
    toast('⚠️ Max 3 démos. Cochez "🏁 Version finale" pour la livraison.','err');
    var chk3=document.getElementById('isFinalChk');if(chk3)chk3.checked=true;
    return;
  }

  try{
    await db.collection('messages').add({
      leadId:curLeadId,userId:lead&&lead.userId||null,from:'admin',type:'demo',
      text:msg||'Nouvelle version disponible — testez et dites-nous ce que vous en pensez !',
      demoUrl:url,demoVersion:ver||'v'+vNum,versionNumber:vNum,
      approvedByClient:false,createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true
    });
    await db.collection('leads').doc(curLeadId).update({status:'demo',updatedAt:FS.serverTimestamp()});
    if(lead&&lead.userId){
      await db.collection('notifications').add({
        userId:lead.userId,leadId:curLeadId,
        title:'🎯 Nouvelle démo disponible !',
        message:'Version '+(ver||'v'+vNum)+' prête — testez-la dans votre espace client.',
        type:'demo_ready',read:false,createdAt:FS.serverTimestamp()
      });
    }
    document.getElementById('demoUrlIn').value='';
    document.getElementById('demoMsgIn').value='';
    var nxt=vNum+1;
    var el_num=document.getElementById('demoVerNum');if(el_num)el_num.textContent=nxt;
    var el_in=document.getElementById('demoVerIn');if(el_in)el_in.value='v'+nxt;
    var el_rem=document.getElementById('demoRemain');
    if(el_rem){var left=3-vNum;el_rem.textContent=left>0?'('+left+' restante'+(left>1?'s':'')+'  )':'(max atteint — cochez finale)';}
    if(vNum>=3)toast('🎯 Démo v'+vNum+' envoyée. Max atteint — prochaine version = finale.');
    else toast('🎯 Démo v'+vNum+' envoyée !');
  }catch(e){toast('Erreur: '+e.message,'err');}
}


async function updateStatus(val){
  if(window.WalaupSound) WalaupSound.tab();
  if(!curLeadId)return;
  try{
    await db.collection('leads').doc(curLeadId).update({status:val,updatedAt:FS.serverTimestamp(),lastMsgAt:FS.serverTimestamp()});
    // Log status change as a system message for history
    await db.collection('messages').add({
      leadId:curLeadId,from:'system',type:'system',
      text:'Statut changé → '+statusLabel(val),
      createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true
    });
    const lead=allLeads.find(l=>l.id===curLeadId);
    if(lead?.userId){
      const labels={contacted:'Votre demande est en cours d\'analyse.',demo:'Une démo a été préparée pour vous !',validated:'Votre application a été validée !',converted:'Votre application est livrée !'};
      if(labels[val])await db.collection('notifications').add({userId:lead.userId,leadId:curLeadId,title:'📋 Mise à jour',message:labels[val],type:'status',read:false,createdAt:FS.serverTimestamp()});
    }
    toast('Statut mis à jour');
  }catch(e){toast('Erreur','err');}
}


async function quickDelete(leadId, clientName){
  const lead=allLeads.find(l=>l.id===leadId);
  if(!lead)return;
  const key=clientKey(lead);
  const group=allLeads.filter(l=>clientKey(l)===key);
  const isLastDemand=group.length<=1;
  const msg=isLastDemand
    ?'Supprimer "'+clientName+'" et toutes ses données ?'
    :'Supprimer la demande "'+( lead.type||'cette demande')+'" de '+clientName+'?';
  if(!window.confirm(msg))return;
  try{
    const msgs=await db.collection('messages').where('leadId','==',leadId).get();
    const notifs=await db.collection('notifications').where('leadId','==',leadId).get();
    const batch=db.batch();
    msgs.docs.forEach(d=>batch.delete(d.ref));
    notifs.docs.forEach(d=>batch.delete(d.ref));
    batch.delete(db.collection('leads').doc(leadId));
    await batch.commit();
    if(curLeadId===leadId){
      const remaining=group.filter(l=>l.id!==leadId);
      if(remaining.length){curLeadId=null;selectLead(remaining[0].id);}
      else{
        curLeadId=null;
        document.getElementById('cdEmpty').style.display='flex';
        document.getElementById('cdContent').style.display='none';
        document.getElementById('demandsBar').style.display='none';
        if(unsubMsgs){unsubMsgs();unsubMsgs=null;}
      }
    }
    toast('✅ '+(isLastDemand?'Client supprimé':'Demande supprimée'));
  }catch(e){toast('❌ Erreur: '+e.message,'err');}
}


async function deleteClient(){
  const lead=allLeads.find(l=>l.id===curLeadId);
  if(!lead)return;

  // Vérifier si le client a d'autres demandes
  const key=clientKey(lead);
  const group=allLeads.filter(l=>clientKey(l)===key);
  const isLastDemand=group.length<=1;

  const msg=isLastDemand
    ? 'Supprimer définitivement "'+( lead.name||'ce client')+'" et toutes ses données ?'
    : 'Supprimer la demande "'+( lead.type||'cette demande')+'" de '+( lead.name||'ce client')+'?\n(Le client a '+group.length+' demandes — les autres seront conservées)';

  if(!window.confirm(msg))return;
  try{
    const msgs=await db.collection('messages').where('leadId','==',curLeadId).get();
    const notifs=await db.collection('notifications').where('leadId','==',curLeadId).get();
    const batch=db.batch();
    msgs.docs.forEach(d=>batch.delete(d.ref));
    notifs.docs.forEach(d=>batch.delete(d.ref));
    batch.delete(db.collection('leads').doc(curLeadId));
    await batch.commit();

    if(unsubMsgs){unsubMsgs();unsubMsgs=null;}

    // S'il reste d'autres demandes → ouvrir la suivante
    const remaining=group.filter(l=>l.id!==curLeadId);
    if(remaining.length){
      curLeadId=null;
      selectLead(remaining[0].id);
    }else{
      curLeadId=null;
      document.getElementById('cdEmpty').style.display='flex';
      document.getElementById('cdContent').style.display='none';
      document.getElementById('demandsBar').style.display='none';
    }
    toast('✅ '+(isLastDemand?'Client supprimé':'Demande supprimée'));
  }catch(e){
    console.error(e);toast('❌ Erreur: '+e.message,'err');
  }
}


/* Sélectionner un lead depuis la liste groupée.
   - Si le client a plusieurs demandes et qu'on clique sur le groupe
     pour la 1ère fois → on ouvre automatiquement la demande la plus récente
   - selectLeadInGroup('id') → ouvre directement ce lead
*/
function selectLeadInGroup(id, autoFirst=false){
  // id peut être n'importe quel lead du groupe
  const lead=allLeads.find(l=>l.id===id);
  if(!lead)return;

  // Trouver tout le groupe
  const key=clientKey(lead);
  const group=allLeads.filter(l=>clientKey(l)===key)
    .sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));

  // Si on vient de cliquer sur le groupe pour la 1ère fois → lead le plus récent
  const targetId = autoFirst ? group[0].id : id;
  selectLead(targetId, group);
}

async function selectLead(id, group=null){
  curLeadId=id;
  _ppOpen=false;

  // Reconstruire le groupe si non fourni
  const lead=allLeads.find(l=>l.id===id);
  if(!lead)return;
  if(!group){
    const key=clientKey(lead);
    group=allLeads.filter(l=>clientKey(l)===key)
      .sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
  }

  renderLeads();
  showCdSection('fiche',document.querySelector('.cd-nav-btn'));

  document.getElementById('cdEmpty').style.display='none';
  const cont=document.getElementById('cdContent');
  cont.style.display='flex';cont.style.flexDirection='column';

  // ── Header : toujours le nom/contact du client (représentatif) ──
  const rep=group[0];
  document.getElementById('cdhName').textContent=rep.name||'—';
  document.getElementById('cdhMeta').innerHTML=
    (rep.type||'—')+' · '+(rep.phone||'—')+
    (rep.userEmail?' · '+rep.userEmail:'')+
    (rep.userId
      ?'&nbsp;<span style="color:var(--green);font-size:.68rem">● connecté</span>'
      :'&nbsp;<span style="color:var(--mu);font-size:.68rem">○ sans compte</span>');

  // ── Barre de demandes (visible seulement si plusieurs) ──
  const demandsBar=document.getElementById('demandsBar');
  const demandBtns=document.getElementById('demandBtns');
  if(group.length>1){
    demandsBar.style.display='flex';
    demandBtns.innerHTML=group.map((l,i)=>{
      const dotColor=statusDotColor(l.status);
      const label=l.type||('App '+(i+1));
      const shortLabel=label.length>18?label.substring(0,16)+'…':label;
      return `<button class="demand-btn ${l.id===curLeadId?'on':''}"
        onclick="selectLead('${l.id}')">
        <span class="d-status-dot" style="background:${dotColor}"></span>
        ${shortLabel}
        <span style="font-size:.58rem;opacity:.6">${spLabel(l.status).replace(/[🔵🟣🟡🟢✅⏳⚫]/g,'').trim()}</span>
      </button>`;
    }).join('');
  }else{
    demandsBar.style.display='none';
  }

  // ── Statut de LA demande sélectionnée ──
  document.getElementById('statusSel').value=lead.status||'new';

  // ── Contenu de la fiche (demande sélectionnée) ──
  renderClientInfo(lead);
  renderPromptPanel(lead);

  // Demo version counter
  const dSnap=await db.collection('messages').where('leadId','==',id).where('type','==','demo').get();
  const dNum=dSnap.size+1;
  const el_dnum=document.getElementById('demoVerNum');if(el_dnum)el_dnum.textContent=dNum;
  const el_dvin=document.getElementById('demoVerIn');if(el_dvin)el_dvin.value='v'+dNum;
  const el_rem=document.getElementById('demoRemain');
  if(el_rem){
    const rem=3-dSnap.size;
    el_rem.textContent=rem>0?'('+rem+' restante'+(rem>1?'s':'')+')':'(max atteint — cochez finale)';
    el_rem.style.color=rem<=0?'var(--red)':rem===1?'var(--yellow)':'var(--mu)';
  }
  const fchk=document.getElementById('isFinalChk');
  const autoFinal=dSnap.size>=3||['payment_requested','payment_confirmed'].includes(lead.status||'');
  if(fchk)fchk.checked=autoFinal;
  const finalLabel=fchk&&fchk.parentElement;
  if(finalLabel&&autoFinal)finalLabel.style.color='var(--green)';
  else if(finalLabel)finalLabel.style.color='';

  // Payment alert
  const payAlert=document.getElementById('payAlertBanner');
  if(payAlert){
    const payStatuses=['validated','payment_requested','payment_confirmed'];
    if(payStatuses.includes(lead.status||'new')){
      payAlert.style.display='flex';
      const title=document.getElementById('payAlertTitle');
      const sub=document.getElementById('payAlertSub');
      if(lead.status==='validated'){
        if(title)title.textContent='✅ Démo validée par le client';
        if(sub)sub.textContent='Le client a validé sa démo. Demandez le paiement ou envoyez la version finale.';
      }else if(lead.status==='payment_requested'){
        if(title)title.textContent='💳 Paiement requis — en attente';
        if(sub)sub.textContent='Le client est invité à régler. Confirmez quand le paiement est reçu.';
      }else if(lead.status==='payment_confirmed'){
        if(title)title.textContent='✅ Paiement confirmé !';
        if(sub)sub.textContent='Paiement reçu. Envoyez la version finale de l\'application.';
        payAlert.style.background='linear-gradient(135deg,rgba(52,211,153,.1),rgba(52,211,153,.05))';
        payAlert.style.borderColor='rgba(52,211,153,.3)';
        const ttl=document.getElementById('payAlertTitle');if(ttl)ttl.style.color='var(--green)';
      }
    }else{
      payAlert.style.display='none';
      payAlert.style.background='';payAlert.style.borderColor='';
    }
  }

  // Chat de CETTE demande uniquement
  loadAdminChat(id,lead.userId);

  // Chat overlay title
  const title=document.getElementById('chatOvTitle');
  const sub=document.getElementById('chatOvSub');
  if(title)title.textContent='💬 '+(lead.name||rep.name||'Messages')+' — '+(lead.type||'App');
  if(sub)sub.textContent=lead.userEmail||lead.userPhone||rep.phone||'';

  // Mobile: slide in
  openClientDetail();
}


function loadAdminChat(leadId,clientUserId){
  if(unsubMsgs)unsubMsgs();
  var _adminChatFirst=true;
  unsubMsgs=db.collection('messages').where('leadId','==',leadId).onSnapshot(snap=>{
    const msgs=[...snap.docs].map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0));
    if(!_adminChatFirst){
      const hasNewFromClient=snap.docChanges().some(c=>c.type==='added'&&c.doc.data().from==='client');
      if(hasNewFromClient&&window.WalaupSound)WalaupSound.receive();
    }
    _adminChatFirst=false;
    renderAdminChat(msgs,leadId);
    // Unread badge on Messagerie nav button
    const unread=snap.docs.filter(d=>!d.data().readByAdmin&&d.data().from==='client');
    var badge=document.getElementById('cdMsgBadge');
    if(badge){
      if(unread.length){
        badge.textContent=unread.length>9?'9+':unread.length;
        badge.style.display='inline-flex';
      } else {
        badge.style.display='none';
      }
    }
    // Mark as read
    if(unread.length){const batch=db.batch();unread.forEach(d=>batch.update(d.ref,{readByAdmin:true}));batch.commit().catch(()=>{});}
    // Update lastMsgAt from latest msg
    if(msgs.length&&msgs[msgs.length-1].createdAt){
      db.collection('leads').doc(leadId).update({lastMsgAt:msgs[msgs.length-1].createdAt}).catch(()=>{});
    }
  },e=>console.error(e));
}


function renderClientInfo(lead){
  const feats=Array.isArray(lead.features)&&lead.features.length?lead.features:(lead.categories?lead.categories.split(',').map(s=>s.trim()).filter(Boolean):[]);
  let html='';
  if(lead.pack)html+=`<div class="is-row"><span class="isk">Pack</span><span class="isv" style="font-weight:700;color:var(--ac)">${lead.packLabel||lead.pack}</span></div>`;
  if(lead.type&&lead.type!=='À définir')html+=`<div class="is-row"><span class="isk">Type</span><span class="isv">${lead.type}</span></div>`;
  if(lead.phone)html+=`<div class="is-row"><span class="isk">Tél</span><span class="isv">${lead.phone}</span></div>`;
  if(lead.userEmail)html+=`<div class="is-row"><span class="isk">Email</span><span class="isv">${lead.userEmail}</span></div>`;
  if(lead.complexity)html+=`<div class="is-row"><span class="isk">Complexité</span><span class="isv">${lead.complexity}</span></div>`;
  if(lead.monetize)html+=`<div class="is-row"><span class="isk">Monétisation</span><span class="isv" style="color:var(--green)">✓ Activée</span></div>`;
  if(feats.length)html+=`<div class="is-row" style="flex-direction:column;gap:6px"><span class="isk">Fonctionnalités</span><div style="display:flex;flex-wrap:wrap;gap:4px">${feats.map(f=>`<span class="feat-tag">${f}</span>`).join('')}</div></div>`;
  if(lead.description)html+=`<div class="is-row"><span class="isk">Description</span><span class="isv" style="font-style:italic;color:var(--mu)">${lead.description}</span></div>`;
  document.getElementById('clientInfo').innerHTML=html||'<div style="font-size:.78rem;color:var(--mu)">Informations en attente.</div>';
}


function togglePrompt(){/* no-op: prompt has its own full section */}


function buildAutoPrompt(lead){
  const feats=Array.isArray(lead.features)&&lead.features.length?lead.features:[];
  const pack=lead.packLabel||lead.pack||'Non précisé';
  const comp=lead.complexity||'simple';
  const domain=lead.domain||lead.categories||'';
  const desc=lead.description||lead.categories||'';
  const mono=lead.monetize?'\n• Prévoir un système de monétisation / abonnements':'';
  return `Crée une application web complète pour ce client Walaup :\n\n━━━ CLIENT ━━━\nNom : ${lead.name||'—'}\nPack : ${pack}\nSecteur : ${domain||'Non précisé'}\n\n━━━ DESCRIPTION ━━━\n${desc||'Application sur mesure'}\n\n━━━ FONCTIONNALITÉS ━━━\n${feats.length?feats.map(f=>'• '+f).join('\n'):'• À définir selon description'}\n${mono}\n\n━━━ COMPLEXITÉ ━━━\n${comp==='simple'?'Simple — logique basique':comp==='moyenne'?'Moyenne — auth + plusieurs modules':'Avancée — multi-utilisateurs + logique métier'}\n\n━━━ STACK TECHNIQUE ━━━\n• Fichier HTML unique autonome (HTML + CSS + JS)\n• Firebase Firestore + Auth\n• Design moderne responsive, mode dark\n• Données tunisiennes (DT, +216, prénoms locaux)\n\n━━━ LIVRABLE ━━━\nFichier HTML complet prêt à déployer sur GitHub Pages.`;
}

function renderPromptPanel(lead){
  const ppText=document.getElementById('ppText');
  const ppNo=document.getElementById('ppNoPrompt');
  const ppFeats=document.getElementById('ppFeats');
  if(!ppText||!ppNo||!ppFeats)return;
  // Use saved prompt or auto-generate from lead data
  const prompt=lead.claudePrompt||buildAutoPrompt(lead);
  ppText.style.display='block';
  ppNo.style.display='none';
  ppText.value=prompt;
  // Features tags
  const feats=Array.isArray(lead.features)&&lead.features.length?lead.features:[];
  ppFeats.innerHTML=feats.length?feats.map(f=>`<span class="feat-tag">${f}</span>`).join(''):'';
  // Prompt section always visible — no toggle needed
}


function copyPrompt(){
  const t=document.getElementById('ppText');
  if(!t||!t.value){toast('Aucun prompt disponible','err');return;}
  navigator.clipboard.writeText(t.value).then(()=>{toast('✅ Prompt copié !');}).catch(()=>toast('Erreur copie','err'));
}


function openInClaude(){
  const t=document.getElementById('ppText');
  if(!t||!t.value){toast('Aucun prompt disponible','err');return;}
  const encoded=encodeURIComponent(t.value);
  window.open('https://claude.ai/new?q='+encoded,'_blank');
}


function loadTestis(){
  if(typeof _unsubTestis !== 'undefined' && _unsubTestis)return;
  _unsubTestis=db.collection('testimonials').onSnapshot(snap=>{
    const testis=[...snap.docs].map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
    const el=document.getElementById('testiList');
    if(!testis.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--mu)">Aucun témoignage</div>';return;}
    el.innerHTML=testis.map(t=>`<div class="testi-row"><div class="tr-info"><div class="tr-name">${t.name}</div><div class="tr-quote">"${(t.quote||'').substring(0,80)}${(t.quote||'').length>80?'...':''}"</div><div style="font-size:.68rem;color:var(--mu2)">${t.role}</div></div><button class="toggle-btn ${t.approved?'t-on':'t-off'}" onclick="toggleTesti('${t.id}',${t.approved})">${t.approved?'✓ Publié':'○ Masqué'}</button><button class="del-btn" onclick="delTesti('${t.id}')">🗑</button></div>`).join('');
  });
}


async function addTesti(){
  const name=document.getElementById('tn').value.trim(),role=document.getElementById('tr').value.trim(),quote=document.getElementById('tq').value.trim();
  if(!name||!role||!quote){toast('Remplissez tous les champs','err');return;}
  try{await db.collection('testimonials').add({name,role,quote,approved:true,createdAt:FS.serverTimestamp()});document.getElementById('tn').value='';document.getElementById('tr').value='';document.getElementById('tq').value='';toast('✅ Témoignage ajouté');}catch(e){toast('❌ '+e.message,'err');}
}


async function toggleTesti(id,cur){try{await db.collection('testimonials').doc(id).update({approved:!cur});toast(cur?'Masqué':'Publié');}catch(e){toast('Erreur','err');}}


async function delTesti(id){if(!confirm('Supprimer ?'))return;try{await db.collection('testimonials').doc(id).delete();toast('Supprimé');}catch(e){toast('Erreur','err');}}


function copyClientInfo(){
  const lead=allLeads.find(l=>l.id===curLeadId);if(!lead)return;
  const info=[lead.name,lead.phone,lead.userEmail||'—',lead.type,lead.packLabel||'—',lead.description||''].join('\n');
  navigator.clipboard.writeText(info).then(()=>toast('Infos copiées')).catch(()=>{});
}


function switchInputTab(tab,btn){document.querySelectorAll('.itab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');document.getElementById('msgPanel').style.display=tab==='msg'?'block':'none';document.getElementById('demoPanel').style.display=tab==='demo'?'block':'none';}

/* ══ NAVIGATION SECTIONS FICHE CLIENT ══ */
var _currentCdSection='fiche';

function showCdSection(name, btn){
  _currentCdSection=name;
  // Boutons nav
  document.querySelectorAll('.cd-nav-btn').forEach(b=>b.classList.remove('on'));
  if(btn){btn.classList.add('on');}
  else{
    // Find the right button by section name
    var btns=document.querySelectorAll('.cd-nav-btn');
    btns.forEach(function(b){if(b.onclick&&b.onclick.toString().includes("'"+name+"'"))b.classList.add('on');});
  }
  // Sections
  document.querySelectorAll('.cd-section').forEach(s=>s.classList.remove('on'));
  var secId='cdSection'+name.charAt(0).toUpperCase()+name.slice(1);
  var sec=document.getElementById(secId);
  if(sec)sec.classList.add('on');
  // Si messagerie : scroller en bas + clear badge
  if(name==='messagerie'){
    var msgs=document.getElementById('adminChatMsgs');
    if(msgs)setTimeout(function(){msgs.scrollTop=msgs.scrollHeight;},80);
    var badge=document.getElementById('cdMsgBadge');
    if(badge)badge.style.display='none';
  }
  // Si historique : charger
  if(name==='historique')renderHistorique();
}

function renderHistorique(){
  var lead=allLeads.find(function(l){return l.id===curLeadId;});
  var container=document.getElementById('clientHistorique');
  if(!container||!lead)return;
  container.innerHTML='<div style="padding:20px;text-align:center;color:var(--mu);font-size:.8rem">Chargement…</div>';

  function tsToDate(ts){
    if(!ts)return null;
    if(ts.toDate)return ts.toDate();
    if(ts.seconds)return new Date(ts.seconds*1000);
    if(ts instanceof Date)return ts;
    return null;
  }
  function fmtFull(d){
    if(!d)return'—';
    return d.toLocaleDateString('fr',{day:'2-digit',month:'short',year:'numeric'})+' à '+d.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'});
  }

  var items=[];

  var t0=tsToDate(lead.createdAt);
  if(t0)items.push({time:t0,action:'📥 Demande reçue',detail:'Via le formulaire Walaup',color:'var(--ac)',sub:''});

  var statusMap={
    contacted:'📞 Client contacté',demo:'🎯 Démo envoyée',
    validated:'✅ Démo validée par le client',
    payment_requested:'💳 Paiement demandé',
    payment_confirmed:'✅ Paiement confirmé',
    converted:'🏁 Application livrée',
    closed:'⚫ Dossier fermé'
  };
  var statusColorMap={
    contacted:'var(--ac2)',demo:'var(--yellow)',validated:'var(--green)',
    payment_requested:'var(--yellow)',payment_confirmed:'var(--green)',
    converted:'var(--green)',closed:'var(--mu)'
  };
  if(lead.status&&lead.status!=='new'&&lead.updatedAt){
    var tUp=tsToDate(lead.updatedAt);
    if(tUp)items.push({time:tUp,action:statusMap[lead.status]||('Statut: '+lead.status),detail:'',color:statusColorMap[lead.status]||'var(--mu)',sub:''});
  }

  db.collection('messages').where('leadId','==',curLeadId).orderBy('createdAt','asc').get()
  .then(function(snap){
    snap.docs.forEach(function(doc){
      var m=doc.data();
      var t=tsToDate(m.createdAt);
      if(!t)return;
      if(m.type==='demo'){
        items.push({time:t,
          action:'🎯 Démo '+(m.demoVersion||'')+ ' envoyée',
          detail:m.demoUrl?('<a href="'+m.demoUrl+'" target="_blank" style="color:var(--ac);word-break:break-all;font-size:.71rem">'+m.demoUrl.substring(0,55)+(m.demoUrl.length>55?'…':'')+'</a>'):'',
          color:'var(--yellow)',
          sub:m.approvedByClient?'✅ Validée par le client':'⏳ En attente de validation du client'
        });
      } else if(m.type==='final'){
        items.push({time:t,
          action:'🏁 Version finale livrée',
          detail:m.demoUrl?('<a href="'+m.demoUrl+'" target="_blank" style="color:var(--green);word-break:break-all;font-size:.71rem">'+m.demoUrl.substring(0,55)+(m.demoUrl.length>55?'…':'')+'</a>'):'',
          color:'var(--green)',
          sub:m.approvedByClient?'✅ Confirmée par le client':'⏳ En attente confirmation du client'
        });
      } else if(m.type==='system'){
        items.push({time:t,action:'⚙️ '+(m.text||'Événement système'),detail:'',color:'var(--mu)',sub:''});
      } else if(m.from==='admin'){
        items.push({time:t,action:'🔹 Message admin',
          detail:(m.text||'').substring(0,90)+((m.text||'').length>90?'…':''),color:'var(--ac2)',sub:''});
      } else if(m.from==='client'){
        items.push({time:t,action:'👤 Message client',
          detail:(m.text||'').substring(0,90)+((m.text||'').length>90?'…':''),color:'var(--mu)',sub:''});
      }
    });

    items.sort(function(a,b){return b.time-a.time;});

    if(!items.length){
      container.innerHTML='<div style="padding:28px;text-align:center;color:var(--mu);font-size:.84rem">Aucun historique disponible.</div>';
      return;
    }

    container.innerHTML=items.map(function(item,i){
      return '<div class="hist-item" style="opacity:0;animation:hive-enter .35s cubic-bezier(.16,1,.3,1) '+(i*0.04)+'s both">'+
        '<div class="hist-dot" style="background:'+item.color+';box-shadow:0 0 0 3px '+item.color+'22;margin-top:5px;flex-shrink:0"></div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="hist-action">'+item.action+'</div>'+
          (item.detail?'<div class="hist-detail">'+item.detail+'</div>':'')+
          (item.sub?'<div style="font-size:.68rem;margin-top:3px;color:'+item.color+'">'+item.sub+'</div>':'')+
          '<div class="hist-time">'+fmtFull(item.time)+'</div>'+
        '</div>'+
      '</div>';
    }).join('');
  })
  .catch(function(){
    container.innerHTML='<div style="padding:20px;text-align:center;color:var(--red);font-size:.8rem">⚠️ Erreur de chargement</div>';
  });
}
function statusLabel(s){const m={new:'Nouvelle',contacted:'Contacté',demo:'Démo',validated:'Validée',payment_requested:'Paiement requis',payment_confirmed:'Paiement confirmé',converted:'Livrée',closed:'Fermé'};return m[s]||s;}
function statusColor(s){const m={new:'var(--ac)',contacted:'var(--ac2)',demo:'var(--yellow)',validated:'var(--green)',payment_requested:'var(--yellow)',payment_confirmed:'var(--green)',converted:'var(--green)',closed:'var(--mu)'};return m[s]||'var(--mu)';}


/* ══ TARIFS ══ */
const DEFAULT_TARIFS = {
  packs:{
    essentiel:{fixed:600,monthly:0,active:true,remise:0,remiseMotif:''},
    pro:{fixed:1200,monthly:0,active:true,remise:0,remiseMotif:''},
    partenaire:{fixed:2000,monthly:0,active:true,remise:0,remiseMotif:''}
  },
  features:{
    'Authentification':120,'Dashboard':80,'Gestion stock':180,'Gestion ventes':160,
    'Gestion dettes':150,'Gestion clients':140,'Rapports / statistiques':200,
    'Multi utilisateurs':250,'Notifications':100,'QR code':130,'Scan produits':140,
    'App Android':400,'Design premium':150,'Multilingue':100,'Gestion employés':160,
    'Paiement en ligne':200,'API externe':180,'Export PDF/Excel':120,'Chat intégré':170
  }
};
// tarifs declared globally above

function loadTarifs(){
  const saved=localStorage.getItem('bz_tarifs');
  if(saved){try{Object.assign(tarifs,JSON.parse(saved));}catch(e){}}
  renderTarifsUI();
}

function renderTarifsUI(){
  // Pack fields
  ['essentiel','pro','partenaire'].forEach(p=>{
    const pfx={essentiel:'Ess',pro:'Pro',par:'Par'};
    const k=p==='partenaire'?'Par':(p==='pro'?'Pro':'Ess');
    const data=tarifs.packs[p]||{};
    const fixed=document.getElementById('p'+k+'Fixed');
    const mois=document.getElementById('p'+k+'Mois');
    const active=document.getElementById('p'+k+'Active');
    if(fixed)fixed.value=data.fixed||0;
    if(mois)mois.value=data.monthly||0;
    if(active)active.checked=data.active!==false;
    // Remise display
    if(data.remise>0){
      const rb=document.getElementById('rem'+p.charAt(0).toUpperCase()+p.slice(1));
      const rt=document.getElementById('rem'+p.charAt(0).toUpperCase()+p.slice(1)+'Txt');
      if(rb)rb.style.display='flex';
      if(rt)rt.textContent='−'+data.remise+'% — '+data.remiseMotif;
    }
  });
  // Features grid
  const grid=document.getElementById('tarifsGrid');
  if(!grid)return;
  const feats=tarifs.features||{};
  const groups={
    'Base':['Authentification','Dashboard'],
    'Business':['Gestion stock','Gestion ventes','Gestion dettes','Gestion clients','Rapports / statistiques','Gestion employés'],
    'Avancé':['Multi utilisateurs','Notifications','QR code','Scan produits','Paiement en ligne','API externe','Export PDF/Excel','Chat intégré'],
    'Mobile':['App Android'],
    'Extra':['Design premium','Multilingue']
  };
  grid.innerHTML='';
  Object.entries(groups).forEach(([grp,items])=>{
    const sec=document.createElement('div');
    sec.className='tarif-section';
    sec.innerHTML=`<div class="ts-hd"><h3>📦 ${grp}</h3></div><div class="ts-bd">`+
      items.map(f=>`<div class="tarif-row">
        <span class="tarif-label">${f}</span>
        <input class="tarif-input" type="number" id="tf_${f.replace(/ |\//g,'_')}" value="${feats[f]||0}" min="0">
        <span class="tarif-unit">DT</span>
      </div>`).join('')+'</div>';
    grid.appendChild(sec);
  });
}

function saveTarifs(){
  // Read packs
  const packs={};
  [['essentiel','Ess'],['pro','Pro'],['partenaire','Par']].forEach(([p,k])=>{
    const rem=document.getElementById('rem'+p.charAt(0).toUpperCase()+p.slice(1));
    const prevRemise=tarifs.packs[p]?.remise||0;
    const prevMotif=tarifs.packs[p]?.remiseMotif||'';
    packs[p]={
      fixed:parseInt(document.getElementById('p'+k+'Fixed')?.value||0),
      monthly:parseInt(document.getElementById('p'+k+'Mois')?.value||0),
      active:document.getElementById('p'+k+'Active')?.checked!==false,
      remise:prevRemise,remiseMotif:prevMotif
    };
  });
  // Read features
  const features={};
  const groups=['Authentification','Dashboard','Gestion stock','Gestion ventes','Gestion dettes','Gestion clients','Rapports / statistiques','Gestion employés','Multi utilisateurs','Notifications','QR code','Scan produits','Paiement en ligne','API externe','Export PDF/Excel','Chat intégré','App Android','Design premium','Multilingue'];
  groups.forEach(f=>{
    const el=document.getElementById('tf_'+f.replace(/ |\//g,'_'));
    if(el)features[f]=parseInt(el.value||0);
  });
  tarifs={packs,features};
  localStorage.setItem('bz_tarifs',JSON.stringify(tarifs));
  // Sync to Firestore for estimateur to read
  db.collection('config').doc('tarifs').set({...tarifs,updatedAt:FS.serverTimestamp()}).catch(()=>{});
  toast('✅ Tarifs sauvegardés et synchronisés !');
}

function applyRemise(pack){
  const p=pack.charAt(0).toUpperCase()+pack.slice(1);
  const pct=parseInt(document.getElementById('r'+p)?.value||0);
  const motif=document.getElementById('m'+p)?.value.trim();
  if(!pct||!motif){toast('Entrez % et motif','err');return;}
  tarifs.packs[pack]=tarifs.packs[pack]||{};
  tarifs.packs[pack].remise=pct;
  tarifs.packs[pack].remiseMotif=motif;
  localStorage.setItem('bz_tarifs',JSON.stringify(tarifs));
  const rb=document.getElementById('rem'+p);
  const rt=document.getElementById('rem'+p+'Txt');
  if(rb)rb.style.display='flex';
  if(rt)rt.textContent='−'+pct+'% — '+motif;
  toast('✅ Remise de '+pct+'% appliquée au pack '+pack);
}

function cancelRemise(pack){
  const p=pack.charAt(0).toUpperCase()+pack.slice(1);
  if(tarifs.packs[pack]){tarifs.packs[pack].remise=0;tarifs.packs[pack].remiseMotif='';}
  localStorage.setItem('bz_tarifs',JSON.stringify(tarifs));
  const rb=document.getElementById('rem'+p);
  if(rb)rb.style.display='none';
  document.getElementById('r'+p).value='';
  document.getElementById('m'+p).value='';
  toast('Remise annulée');
}

/* ══ PAYMENTS ══ */
// payFilter declared globally above
function filterPay(f,btn){
  payFilter=f;
  document.querySelectorAll('.pf-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderPayments();
}

/* Confirm payment directly from payments tab */



/* ══ PAYMENTS — PATCHED FUNCTIONS ══ */
function renderPayments(){
  const PAY_STATUSES=['validated','payment_requested','payment_confirmed','converted','closed'];
  const allPayLeads=allLeads.filter(l=>PAY_STATUSES.includes(l.status)||l.payMethod);
  const payLeads=payFilter==='all'?allPayLeads:allPayLeads.filter(l=>l.status===payFilter);
  const confirmed=allPayLeads.filter(l=>['payment_confirmed','converted','closed'].includes(l.status));
  const pending=allPayLeads.filter(l=>['validated','payment_requested'].includes(l.status));
  const now=new Date(),month=now.getMonth(),year=now.getFullYear();
  const monthConf=confirmed.filter(l=>{const d=l.payConfirmedAt?.toDate?.();return d&&d.getMonth()===month&&d.getFullYear()===year;});
  function getAmount(l){
    if(l.payAmount&&l.payAmount>0)return l.payAmount;
    const base=(tarifs.packs[l.pack]||{fixed:0}).fixed||0;
    const rem=(tarifs.packs[l.pack]||{remise:0}).remise||0;
    return Math.round(base*(1-rem/100));
  }
  const totalDT=confirmed.reduce((s,l)=>s+getAmount(l),0);
  const monthDT=monthConf.reduce((s,l)=>s+getAmount(l),0);
  const el_total=document.getElementById('payTotal');
  const el_pend=document.getElementById('payPending');
  const el_conf=document.getElementById('payConfirmed');
  const el_month=document.getElementById('payMonth');
  if(el_total)el_total.textContent=(totalDT||'0')+' DT';
  if(el_pend)el_pend.textContent=pending.length;
  if(el_conf)el_conf.textContent=confirmed.length;
  if(el_month)el_month.textContent=(monthDT||'0')+' DT';
  const tbody=document.getElementById('payTable');
  if(!tbody)return;
  if(!payLeads.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--mu);font-size:.82rem">Aucune transaction à afficher</td></tr>';return;}
  const PC={essentiel:{color:'var(--green)',label:'🟢 Essentiel'},pro:{color:'var(--ac)',label:'🔵 Pro'},partenaire:{color:'var(--red)',label:'🔴 Partenaire'}};
  const STATUS_MAP={validated:{cls:'ps-pending',label:'✅ Démo validée',desc:'En attente de paiement client'},payment_requested:{cls:'ps-pending',label:'💳 Paiement requis',desc:'Client invité à payer'},payment_confirmed:{cls:'ps-confirmed',label:'✅ Paiement reçu',desc:'Paiement confirmé'},converted:{cls:'ps-confirmed',label:'✅ Livré',desc:'App livrée'},closed:{cls:'ps-confirmed',label:'✅ Terminé',desc:'Terminé'}};
  tbody.innerHTML=payLeads.map(l=>{
    const st=STATUS_MAP[l.status]||{cls:'ps-pending',label:l.status,desc:''};
    const packInfo=PC[l.pack]||{color:'var(--mu)',label:'—'};
    const price=getAmount(l);
    const priceStr=price>0?price+' DT':'—';
    const isActionable=['validated','payment_requested'].includes(l.status);
    const actionBtns=isActionable
      ?`<button onclick="openPayMethodModal('${l.id}')" style="padding:5px 10px;border-radius:7px;border:none;background:var(--green);color:#000;font-size:.67rem;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif">✅ Confirmer</button>`
      :`<button onclick="selectLead('${l.id}');sbNav('clients')" style="padding:5px 10px;border-radius:7px;border:1px solid var(--bd2);background:none;color:var(--mu);font-size:.67rem;cursor:pointer;font-family:'Outfit',sans-serif">Voir →</button>`;
    return `<tr><td><div style="font-weight:700;font-size:.82rem">${l.name||'—'}</div><div style="font-size:.67rem;color:var(--mu);margin-top:1px">${l.userEmail||l.userPhone||l.phone||'—'}</div></td><td><span style="font-size:.71rem;color:${packInfo.color};font-weight:700">${packInfo.label}</span></td><td style="font-weight:700;font-size:.8rem">${priceStr}</td><td><span class="pay-method-badge">${l.payMethod||'—'}</span></td><td><span class="pay-status ${st.cls}">${st.label}</span><div style="font-size:.63rem;color:var(--mu);margin-top:2px">${st.desc}</div></td><td style="font-size:.71rem;color:var(--mu)">${fmtD(l.payConfirmedAt||l.clientApprovedAt||l.createdAt)}</td><td>${actionBtns}</td></tr>`;
  }).join('');
}

async function requestPayment(){if(!curLeadId)return;openPayMethodModal(curLeadId);}

async function confirmPaymentAdmin(leadId){openPayMethodModal(leadId||curLeadId);}

function openPayMethodModal(leadId){
  const lead=allLeads.find(l=>l.id===leadId);if(!lead)return;
  const base=(tarifs.packs[lead.pack]||{fixed:0}).fixed||0;
  const rem=(tarifs.packs[lead.pack]||{remise:0}).remise||0;
  const amount=lead.payAmount||(Math.round(base*(1-rem/100)));
  const sub=document.getElementById('payModalSub');
  const amountEl=document.getElementById('payModalAmount');
  const leadIdEl=document.getElementById('payModalLeadId');
  const methodEl=document.getElementById('payModalMethod');
  const confirmBtn=document.getElementById('payModalConfirmBtn');
  if(sub)sub.textContent=(lead.name||'—')+' · Pack '+(lead.packLabel||lead.pack||'—');
  if(amountEl)amountEl.textContent=(amount||'—')+' DT';
  if(leadIdEl)leadIdEl.value=leadId;
  if(methodEl)methodEl.value='';
  if(confirmBtn){confirmBtn.disabled=true;confirmBtn.style.opacity='.5';}
  document.querySelectorAll('.pay-method-btn').forEach(b=>b.classList.remove('selected'));
  const modal=document.getElementById('payMethodModal');
  if(modal)modal.style.display='flex';
}

function closePayMethodModal(){const modal=document.getElementById('payMethodModal');if(modal)modal.style.display='none';}

function selectPayMethod(btn){
  document.querySelectorAll('.pay-method-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  const methodEl=document.getElementById('payModalMethod');
  if(methodEl)methodEl.value=btn.getAttribute('data-method')||'';
  const confirmBtn=document.getElementById('payModalConfirmBtn');
  if(confirmBtn){confirmBtn.disabled=false;confirmBtn.style.opacity='1';}
  if(window.WalaupSound)WalaupSound.click();
}

async function executePaymentConfirm(){
  const leadId=document.getElementById('payModalLeadId')?.value;
  const method=document.getElementById('payModalMethod')?.value;
  if(!leadId||!method)return;
  closePayMethodModal();
  const lead=allLeads.find(l=>l.id===leadId);
  const base=(tarifs.packs[lead?.pack]||{fixed:0}).fixed||0;
  const rem=(tarifs.packs[lead?.pack]||{remise:0}).remise||0;
  const amount=Math.round(base*(1-rem/100));
  try{
    await db.collection('leads').doc(leadId).update({status:'payment_confirmed',payConfirmedAt:FS.serverTimestamp(),payMethod:method,payAmount:amount,updatedAt:FS.serverTimestamp()});
    if(lead?.userId){
      await db.collection('notifications').add({userId:lead.userId,leadId,title:'✅ Paiement confirmé !',message:'Votre paiement de '+amount+' DT ('+method+') a été reçu.',type:'payment_ok',read:false,createdAt:FS.serverTimestamp()});
      await db.collection('messages').add({leadId,from:'system',type:'system',text:'✅ Paiement confirmé ('+method+' — '+amount+' DT). Votre application finale est en cours de préparation.',createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true});
    }
    if(window.WalaupSound)WalaupSound.success();
    toast('✅ Paiement '+amount+' DT confirmé via '+method);
  }catch(e){toast('Erreur: '+e.message,'err');}
}


/* ══ SIDEBAR NAVIGATION ══ */
function toggleSidebar(){
  var sb=document.getElementById('adminSidebar');
  var ov=document.getElementById('sbOverlay');
  var btn=document.getElementById('hamBtn');
  if(!sb)return;
  var isOpen=sb.classList.contains('open');
  if(isOpen){closeSidebar();}
  else{
    sb.classList.add('open');
    if(ov)ov.classList.add('on');
    if(btn)btn.classList.add('open');
    document.body.style.overflow='hidden';
  }
}

function closeSidebar(){
  var sb=document.getElementById('adminSidebar');
  var ov=document.getElementById('sbOverlay');
  var btn=document.getElementById('hamBtn');
  if(sb)sb.classList.remove('open');
  if(ov)ov.classList.remove('on');
  if(btn)btn.classList.remove('open');
  document.body.style.overflow='';
}

function sbNav(tab){
  // Update sidebar active state
  var tabs=['dash','clients','paiements','tarifs','stats','testi','marketplace'];
  tabs.forEach(function(t){
    var el=document.getElementById('sbi-'+t);
    if(el)el.classList.toggle('active',t===tab);
  });
  // Also update topbar nav-tab
  var navTabs=document.querySelectorAll('.nav-tab');
  navTabs.forEach(function(btn){btn.classList.remove('on');});
  // Find matching nav-tab by onclick
  var found=false;
  navTabs.forEach(function(btn){
    if(btn.getAttribute('onclick')&&btn.getAttribute('onclick').indexOf("'"+tab+"'")>=0){
      btn.classList.add('on');found=true;
    }
  });
  // Call showTab
  showTab(tab,found?null:null);
  // Close sidebar on mobile after navigation
  closeSidebar();
}

// Update sidebar badges from allLeads
function updateSidebarBadges(){
  if(typeof allLeads==='undefined')return;
  var pendingClients=allLeads.filter(function(l){return l.status==='new'||l.status==='demo';}).length;
  var pendingPay=allLeads.filter(function(l){return l.status==='payment_requested'||l.status==='validated';}).length;
  var bc=document.getElementById('sbBadgeClients');
  var bp=document.getElementById('sbBadgePay');
  if(bc){bc.textContent=pendingClients||'';bc.className='sb-badge'+(pendingClients?' on':'');}
  if(bp){bp.textContent=pendingPay||'';bp.className='sb-badge'+(pendingPay?' on':'');}
}

// Close sidebar on Escape key
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSidebar();});

// Swipe to close sidebar
(function(){
  var startX=0;
  document.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;},{passive:true});
  document.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-startX;
    var sb=document.getElementById('adminSidebar');
    if(sb&&sb.classList.contains('open')&&dx<-60)closeSidebar();
    if(sb&&!sb.classList.contains('open')&&startX<30&&dx>60)toggleSidebar();
  },{passive:true});
})();

/* ══════════════════════════════════════════
   ADMIN — MARKETPLACE MANAGEMENT
══════════════════════════════════════════ */

var _mpUnsub=null, _mpEditId=null;

function loadMarketplaceAdmin(){
  if(_mpUnsub)_mpUnsub();
  _mpUnsub=db.collection('marketplace_apps').orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      const apps=[...snap.docs].map(d=>({id:d.id,...d.data()}));
      renderMpApps(apps);
      // Stats
      var total=apps.length;
      var active=apps.filter(a=>a.active!==false).length;
      var hidden=apps.filter(a=>a.active===false).length;
      // Count leads from marketplace
      var sold=allLeads.filter(l=>l.source==='marketplace').length;
      var el_t=document.getElementById('mpTotal');
      var el_a=document.getElementById('mpActiveCount');
      var el_h=document.getElementById('mpHidden');
      var el_s=document.getElementById('mpSold');
      if(el_t)el_t.textContent=total;
      if(el_a)el_a.textContent=active;
      if(el_h)el_h.textContent=hidden;
      if(el_s)el_s.textContent=sold;
    },e=>console.error(e));
}

function _imgFallback(img){
  img.style.display="none";
  var ns=img.nextSibling;
  if(ns)ns.style.display="flex";
}

function renderMpApps(apps){
  var list=document.getElementById("mpAppsList");
  if(!list)return;
  if(!apps.length){
    list.innerHTML="<div style=\"text-align:center;padding:40px;color:var(--mu)\"><div style=\"font-size:2.5rem;margin-bottom:10px\">📭</div><div style=\"font-size:.84rem\">Aucune application — ajoutez-en une !</div></div>";
    return;
  }

  list.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px";
  list.innerHTML="";

  apps.forEach(function(a){
    var isActive = a.active!==false;
    var catLabel = {cafe:"☕ Café",commerce:"🏪 Commerce",services:"⚙️ Services",gestion:"📊 Gestion",autre:"📦 Autre"}[a.category]||"📦";
    var name = (a.name||"App").replace(/</g,"&lt;");
    var desc = ((a.description||"").substring(0,90) + ((a.description||"").length>90?"…":"")).replace(/</g,"&lt;");

    // Build card element
    var card = document.createElement("div");
    card.style.cssText = "background:var(--sf2);border:1px solid " + (isActive?"var(--bd2)":"rgba(248,113,113,.12)") + ";border-radius:13px;overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s;cursor:default";
    card.onmouseenter = function(){this.style.transform="translateY(-3px)";this.style.boxShadow="0 12px 32px rgba(0,0,0,.4)";};
    card.onmouseleave = function(){this.style.transform="";this.style.boxShadow="";};

    // ── Hero / Thumbnail ──
    var hero = document.createElement("div");
    hero.style.cssText = "position:relative;height:160px;overflow:hidden;border-radius:13px 13px 0 0;background:linear-gradient(135deg,rgba(92,142,255,.1),rgba(167,139,250,.08))";

    if(a.thumbnailUrl){
      var img = document.createElement("img");
      img.src = a.thumbnailUrl;
      img.alt = name;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
      img.onerror = function(){
        this.style.display="none";
        fallback.style.display="flex";
      };
      var fallback = document.createElement("div");
      fallback.style.cssText = "display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:3rem";
      fallback.textContent = a.icon||"📱";
      hero.appendChild(img);
      hero.appendChild(fallback);
    } else {
      var iconDiv = document.createElement("div");
      iconDiv.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.2rem;filter:drop-shadow(0 4px 12px rgba(92,142,255,.3))";
      iconDiv.textContent = a.icon||"📱";
      hero.appendChild(iconDiv);
    }

    // Bottom gradient overlay
    var grad = document.createElement("div");
    grad.style.cssText = "position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,rgba(6,6,26,.9),transparent);pointer-events:none";
    hero.appendChild(grad);

    // Status badge
    var statusBadge = document.createElement("div");
    statusBadge.style.cssText = "position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:20px;font-size:.62rem;font-weight:800;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);" + (isActive?"background:rgba(52,211,153,.3);color:#34d399":"background:rgba(248,113,113,.3);color:#f87171");
    statusBadge.textContent = isActive?"● Publiée":"○ Masquée";
    hero.appendChild(statusBadge);

    // Category badge
    var catBadge = document.createElement("div");
    catBadge.style.cssText = "position:absolute;top:10px;left:10px;padding:3px 9px;border-radius:20px;font-size:.62rem;font-weight:700;backdrop-filter:blur(8px);background:rgba(0,0,0,.45);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.1)";
    catBadge.textContent = catLabel;
    hero.appendChild(catBadge);

    // Price on image
    if(a.price){
      var priceDiv = document.createElement("div");
      priceDiv.style.cssText = "position:absolute;bottom:10px;right:12px;font-family:Syne,sans-serif;font-weight:800;font-size:1.05rem;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6)";
      priceDiv.textContent = a.price;
      if(a.origPrice){
        var orig = document.createElement("span");
        orig.style.cssText = "font-size:.65rem;color:rgba(255,255,255,.5);text-decoration:line-through;margin-left:7px";
        orig.textContent = a.origPrice;
        priceDiv.appendChild(orig);
      }
      hero.appendChild(priceDiv);
    }

    card.appendChild(hero);

    // ── Body ──
    var body = document.createElement("div");
    body.style.cssText = "padding:13px 14px;flex:1;display:flex;flex-direction:column;gap:5px";

    var nameEl = document.createElement("div");
    nameEl.style.cssText = "font-family:Syne,sans-serif;font-weight:800;font-size:.9rem;line-height:1.3";
    nameEl.textContent = a.name||"App";
    body.appendChild(nameEl);

    var descEl = document.createElement("div");
    descEl.style.cssText = "font-size:.73rem;color:var(--mu);line-height:1.55;flex:1";
    descEl.textContent = a.description||"";
    if((a.description||"").length>90)descEl.textContent=a.description.substring(0,90)+"…";
    body.appendChild(descEl);

    // Tags
    if(a.tags&&a.tags.length){
      var tagsDiv = document.createElement("div");
      tagsDiv.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-top:4px";
      a.tags.slice(0,4).forEach(function(t){
        var tag = document.createElement("span");
        tag.style.cssText = "font-size:.6rem;padding:2px 7px;border-radius:12px;background:rgba(92,142,255,.08);color:var(--mu);border:1px solid rgba(92,142,255,.12)";
        tag.textContent = t;
        tagsDiv.appendChild(tag);
      });
      if(a.tags.length>4){
        var more = document.createElement("span");
        more.style.cssText = "font-size:.6rem;color:var(--mu2)";
        more.textContent = "+"+( a.tags.length-4);
        tagsDiv.appendChild(more);
      }
      body.appendChild(tagsDiv);
    }

    // Demo URL
    if(a.demoUrl){
      var link = document.createElement("a");
      link.href = a.demoUrl;
      link.target = "_blank";
      link.style.cssText = "font-size:.63rem;color:var(--ac);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;margin-top:3px";
      link.textContent = "🔗 " + a.demoUrl.replace(/^https?:\/\//,"").substring(0,40)+"…";
      body.appendChild(link);
    }

    card.appendChild(body);

    // ── Actions ──
    var actions = document.createElement("div");
    actions.style.cssText = "padding:10px 12px;border-top:1px solid var(--bd);display:flex;gap:6px;align-items:center";

    var btnToggle = document.createElement("button");
    btnToggle.style.cssText = "flex:1;padding:7px 10px;border-radius:8px;font-size:.7rem;font-weight:700;cursor:pointer;border:1px solid " + (isActive?"rgba(248,113,113,.3)":"rgba(52,211,153,.3)") + ";background:" + (isActive?"rgba(248,113,113,.07)":"rgba(52,211,153,.07)") + ";color:" + (isActive?"var(--red)":"var(--green)");
    btnToggle.textContent = isActive?"⊘ Masquer":"◉ Publier";
    btnToggle.onclick = (function(id,cur){return function(){toggleMpApp(id,cur);};})(a.id, isActive);
    actions.appendChild(btnToggle);

    var btnEdit = document.createElement("button");
    btnEdit.style.cssText = "padding:7px 12px;border-radius:8px;font-size:.7rem;font-weight:700;cursor:pointer;border:1px solid rgba(92,142,255,.25);background:rgba(92,142,255,.08);color:var(--ac)";
    btnEdit.textContent = "✏️";
    btnEdit.onclick = (function(id){return function(){editMpApp(id);};})(a.id);
    actions.appendChild(btnEdit);

    var btnDel = document.createElement("button");
    btnDel.style.cssText = "padding:7px 10px;border-radius:8px;font-size:.7rem;cursor:pointer;border:1px solid rgba(248,113,113,.2);background:none;color:rgba(248,113,113,.5)";
    btnDel.textContent = "🗑";
    btnDel.onclick = (function(id){return function(){deleteMpApp(id);};})(a.id);
    actions.appendChild(btnDel);

    card.appendChild(actions);
    list.appendChild(card);
  });
}


function openAddAppModal(){
  _mpEditId=null;
  document.getElementById('mpModalTitle').textContent='Ajouter une application';
  document.getElementById('mpEditId').value='';
  ['mpName','mpIcon','mpDesc','mpUrl','mpPrice','mpOrigPrice','mpTags','mpPartner','mpThumbUrl'].forEach(id=>{
    var el=document.getElementById(id);if(el)el.value='';
  });
  var prev=document.getElementById('mpThumbPreview');if(prev)prev.style.display='none';
  document.getElementById('mpCat').value='cafe';
  document.getElementById('mpActive').checked=true;
  var modal=document.getElementById('mpModal');
  if(modal){modal.style.display='flex';setTimeout(()=>{var el=document.getElementById('mpName');if(el)el.focus();},100);}
}

function editMpApp(id){
  db.collection('marketplace_apps').doc(id).get().then(doc=>{
    if(!doc.exists)return;
    var d=doc.data();
    _mpEditId=id;
    document.getElementById('mpModalTitle').textContent='Modifier l\'application';
    document.getElementById('mpEditId').value=id;
    document.getElementById('mpName').value=d.name||'';
    document.getElementById('mpIcon').value=d.icon||'';
    document.getElementById('mpDesc').value=d.description||'';
    document.getElementById('mpUrl').value=d.demoUrl||'';
    document.getElementById('mpPrice').value=d.price||'';
    document.getElementById('mpOrigPrice').value=d.origPrice||'';
    document.getElementById('mpCat').value=d.category||'cafe';
    document.getElementById('mpTags').value=(d.tags||[]).join(', ');
    document.getElementById('mpPartner').value=d.partner||'';
    document.getElementById('mpActive').checked=d.active!==false;
    var tUrlEl=document.getElementById('mpThumbUrl');if(tUrlEl)tUrlEl.value=d.thumbnailUrl||'';
    var tPrev=document.getElementById('mpThumbPreview');
    var tImg=document.getElementById('mpThumbImg');
    if(d.thumbnailUrl&&tPrev&&tImg){tImg.src=d.thumbnailUrl;tPrev.style.display='block';}
    else if(tPrev){tPrev.style.display='none';}
    var modal=document.getElementById('mpModal');
    if(modal)modal.style.display='flex';
  }).catch(e=>toast('Erreur: '+e.message,'err'));
}

function closeMpModal(){
  var modal=document.getElementById('mpModal');
  if(modal)modal.style.display='none';
  _mpEditId=null;
}

function previewMpThumb(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  if(!file.type.startsWith('image/'))return;
  var reader=new FileReader();
  reader.onload=function(e){
    var img=document.getElementById('mpThumbImg');
    var prev=document.getElementById('mpThumbPreview');
    if(img&&prev){img.src=e.target.result;prev.style.display='block';}
    var urlEl=document.getElementById('mpThumbUrl');if(urlEl)urlEl.value='';
  };
  reader.readAsDataURL(file);
}

async function saveMpApp(){
  if(window.WalaupSound) WalaupSound.success();
  var name=document.getElementById('mpName').value.trim();
  var icon=document.getElementById('mpIcon').value.trim();
  var desc=document.getElementById('mpDesc').value.trim();
  var url=document.getElementById('mpUrl').value.trim();
  if(!name||!url){toast('Nom et URL sont obligatoires','err');return;}
  var tags=document.getElementById('mpTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  var thumbUrl=document.getElementById('mpThumbUrl')?.value.trim()||'';
  var thumbImg=document.getElementById('mpThumbImg');
  if(!thumbUrl&&thumbImg&&thumbImg.src&&thumbImg.src.startsWith('data:'))thumbUrl=thumbImg.src;
  var data={
    name,icon:icon||'📱',description:desc,demoUrl:url,
    price:document.getElementById('mpPrice').value.trim(),
    origPrice:document.getElementById('mpOrigPrice').value.trim(),
    category:document.getElementById('mpCat').value,
    tags,partner:document.getElementById('mpPartner').value.trim(),
    active:document.getElementById('mpActive').checked,
    thumbnailUrl:thumbUrl||null,
    updatedAt:FS.serverTimestamp()
  };
  try{
    var id=_mpEditId||document.getElementById('mpEditId').value;
    if(id){
      await db.collection('marketplace_apps').doc(id).update(data);
      toast('✅ Application mise à jour');
    }else{
      data.createdAt=FS.serverTimestamp();
      data.purchases=0;
      await db.collection('marketplace_apps').add(data);
      toast('✅ Application ajoutée à la marketplace');
    }
    closeMpModal();
  }catch(e){toast('Erreur: '+e.message,'err');}
}

async function toggleMpApp(id,currentActive){
  try{
    await db.collection('marketplace_apps').doc(id).update({active:!currentActive,updatedAt:FS.serverTimestamp()});
    toast(currentActive?'App masquée de la marketplace':'App publiée sur la marketplace');
  }catch(e){toast('Erreur','err');}
}

async function deleteMpApp(id){
  if(!window.confirm('Supprimer cette application de la marketplace ?'))return;
  try{
    await db.collection('marketplace_apps').doc(id).delete();
    toast('Application supprimée');
  }catch(e){toast('Erreur','err');}
}


/* ══ CLIENT DETAIL — MOBILE SLIDE ══ */
function openClientDetail(){
  const layout=document.querySelector('.clients-layout');
  const detail=document.querySelector('.client-detail');
  if(layout)layout.classList.add('detail-open');
  if(detail)detail.classList.add('slide-in');
  // Show chat bubble (always, not just mobile)
  const cb=document.getElementById('chatBubbleBtn');
  if(cb)cb.classList.add('visible');
}

function closeClientDetail(){
  const layout=document.querySelector('.clients-layout');
  const detail=document.querySelector('.client-detail');
  if(layout)layout.classList.remove('detail-open');
  if(detail)detail.classList.remove('slide-in');
  // Hide chat bubble & overlay
  const cb=document.getElementById('chatBubbleBtn');
  if(cb)cb.classList.remove('visible');
  closeChatOverlay();
}

/* ══ CHAT OVERLAY ══ */
var _chatOvOpen=false;

function toggleChatOverlay(){
  _chatOvOpen=!_chatOvOpen;
  const ov=document.getElementById('chatOverlay');
  if(ov)ov.classList.toggle('open',_chatOvOpen);
  if(_chatOvOpen){
    // Populate from existing admin chat
    syncChatOverlay();
    setTimeout(()=>{const msgs=document.getElementById('chatOvMsgs');if(msgs)msgs.scrollTop=msgs.scrollHeight;},150);
    // Clear unread dot
    const dot=document.getElementById('chatUnreadDot');
    if(dot)dot.classList.remove('on');
  }
}

function closeChatOverlay(){
  _chatOvOpen=false;
  const ov=document.getElementById('chatOverlay');
  if(ov)ov.classList.remove('open');
}

function syncChatOverlay(){
  // Mirror the admin chat messages into the overlay
  const src=document.getElementById('adminChatMsgs');
  const dst=document.getElementById('chatOvMsgs');
  if(src&&dst)dst.innerHTML=src.innerHTML;
  // Update title
  const lead=allLeads.find(l=>l.id===curLeadId);
  const title=document.getElementById('chatOvTitle');
  const sub=document.getElementById('chatOvSub');
  if(title)title.textContent='💬 '+(lead&&lead.name||'Messages');
  if(sub)sub.textContent=lead&&lead.userEmail||'';
}

async function sendAdminMsgOv(){
  const ta=document.getElementById('chatOvInput');
  if(!ta||!ta.value.trim()||!curLeadId)return;
  const text=ta.value.trim();
  ta.value='';ta.style.height='auto';
  const lead=allLeads.find(l=>l.id===curLeadId);
  try{
    await db.collection('messages').add({
      leadId:curLeadId,userId:lead&&lead.userId||null,
      from:'admin',type:'text',text,
      createdAt:FS.serverTimestamp(),readByClient:false,readByAdmin:true
    });
  }catch(e){const t=document.getElementById('toast');if(t){t.textContent='Erreur envoi';t.className='toast err on';}}
}

// Show chat bubble when a client is selected (desktop always visible in chat panel)
function showChatBubble(){
  const cb=document.getElementById('chatBubbleBtn');
  if(cb)cb.classList.add('visible');
}