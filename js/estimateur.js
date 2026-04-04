/* ══ DOMAIN SELECTOR (global) ══ */
window.selectedDomain = window.selectedDomain || '';
window.selectDomain = function(val){
  window.selectedDomain = val;
  var ta = document.getElementById('descInput');
  if(ta && !ta.value.trim() && val){
    ta.placeholder = "Ex : J\'ai un(e) "+val.toLowerCase()+" à Tunis. Je veux gérer...";
  }
  try{ sessionStorage.setItem('bz_domain', val); }catch(e){}
};


// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
const DEFAULT_PRICES = {
  "Authentification":50,"Dashboard":50,
  "Gestion stock":100,"Gestion ventes":100,"Gestion dettes":80,
  "Gestion clients":80,"Rapports / statistiques":100,
  "Multi utilisateurs":120,"Notifications":80,"QR code":50,
  "Scan produits":100,"App Android":150,
  "Design premium":100,"Multilingue":80,"Mode hors-ligne":120,
  "_comp_moyenne":100,"_comp_avancee":300,
  "_maint_min":20,"_maint_max":50,
  "_marketplace_activation":150,
  "_pack_essentiel_pct":100,"_pack_pro_pct":125,"_pack_partenaire_pct":160,
};
const GROUPS = {
  base:["Authentification","Dashboard"],
  business:["Gestion stock","Gestion ventes","Gestion dettes","Gestion clients","Rapports / statistiques"],
  avancees:["Multi utilisateurs","Notifications","QR code","Scan produits"],
  mobile:["App Android"],
  extras:["Design premium","Multilingue","Mode hors-ligne"],
};

// Détails spécifiques par fonctionnalité pour enrichir le prompt
const FEAT_DETAILS = {
  "Authentification": "connexion sécurisée par email/mot de passe, gestion des sessions, déconnexion automatique",
  "Dashboard": "tableau de bord principal avec indicateurs clés, statistiques en temps réel, graphiques d'activité",
  "Gestion stock": "inventaire des produits/articles avec quantités, prix unitaire en DT, alertes de rupture de stock, historique des mouvements entrée/sortie",
  "Gestion ventes": "enregistrement des ventes, calcul du total en DT, historique des transactions, chiffre d'affaires journalier et mensuel",
  "Gestion dettes": "suivi des dettes clients et fournisseurs, montants en DT, dates d'échéance, statuts (payé/en attente), relances",
  "Gestion clients": "fichier clients avec nom, téléphone (+216), adresse, historique des achats, notes",
  "Rapports / statistiques": "rapports périodiques (jour/semaine/mois), graphiques d'évolution, top produits/clients, export ou impression",
  "Multi utilisateurs": "plusieurs comptes avec rôles distincts (administrateur, employé, gérant), permissions par rôle, journal des actions",
  "Notifications": "alertes en temps réel (stock faible, nouvelles commandes, rappels, événements importants)",
  "QR code": "génération de QR codes pour produits, tickets ou accès, lecture de QR codes via caméra",
  "Scan produits": "scan de codes-barres produits via caméra du smartphone pour identification et saisie rapide",
  "App Android": "version mobile Android (PWA installable) pour accès depuis smartphone et tablette",
  "Design premium": "interface moderne avec animations fluides, thème dark/light, composants UI professionnels",
  "Multilingue": "interface disponible en français et en arabe, changement de langue en un clic",
  "Mode hors-ligne": "fonctionnement sans connexion internet avec synchronisation automatique à la reconnexion",
};

let prices={}, selected=new Set(), complexity="simple", monetize=false;

// ══════════════════════════════════════════════
// PRICES
// ══════════════════════════════════════════════
function loadPrices(){
  try{const s=JSON.parse(localStorage.getItem('ep5_prices')||'{}');prices={...DEFAULT_PRICES,...s};}
  catch{prices={...DEFAULT_PRICES};}
}
loadPrices();

function buildAdmin(){
  const sections={
    "— Fonctionnalités":Object.keys(DEFAULT_PRICES).filter(k=>!k.startsWith('_')),
    "— Complexité":["_comp_moyenne","_comp_avancee"],
    "— Maintenance":["_maint_min","_maint_max"],
    "— Marketplace":["_marketplace_activation"],
    "— Multiplicateurs packs":["_pack_essentiel_pct","_pack_pro_pct","_pack_partenaire_pct"],
  };
  const labels={
    "_comp_moyenne":"Complexité Moyenne (+DT)","_comp_avancee":"Complexité Avancée (+DT)",
    "_maint_min":"Maintenance min DT/mois","_maint_max":"Maintenance max DT/mois",
    "_marketplace_activation":"Activation Marketplace (+DT)",
    "_pack_essentiel_pct":"Pack Essentiel (% base)","_pack_pro_pct":"Pack Pro (% base)","_pack_partenaire_pct":"Pack Partenaire (% base)",
  };
  let html='';
  Object.entries(sections).forEach(([title,keys])=>{
    html+=`<div class="price-section-title">${title}</div>`;
    html+=keys.map(k=>`<div class="pf"><label>${labels[k]||k}</label>
      <input type="number" id="pi-${k.replace(/\W/g,'_')}" value="${prices[k]??0}" min="0"></div>`).join('');
  });
  document.getElementById('priceInputs').innerHTML=html;
}
function savePrices(){
  if(window.WalaupSound) WalaupSound.success();
  Object.keys(DEFAULT_PRICES).forEach(k=>{
    const el=document.getElementById('pi-'+k.replace(/\W/g,'_'));
    if(el) prices[k]=Number(el.value)||0;
  });
  localStorage.setItem('ep5_prices',JSON.stringify(prices));
  const b=document.querySelector('.btn-save');
  if(b){b.textContent='✅ Sauvegardé !';setTimeout(()=>b.textContent='💾 Sauvegarder les prix',2200);}
}

/* ══ DOMAIN SELECTOR — moved to top ══ */
function toggleAdmin(){
  const p=document.getElementById('adminPanel'),b=document.getElementById('adminToggle');
  p.classList.toggle('open')&&buildAdmin();
  b.classList.toggle('open',p.classList.contains('open'));
}

// ══════════════════════════════════════════════
// BUILD UI
// ══════════════════════════════════════════════
function buildGrids(){
  Object.entries(GROUPS).forEach(([g,feats])=>{
    document.getElementById('g-'+g).innerHTML=feats.map(f=>`
      <div class="feat-item${selected.has(f)?' sel':''}" onclick="toggleFeat('${f}',this)">
        <span class="feat-name">${f}</span>
        <span class="feat-price">${prices[f]??0} DT</span>
      </div>`).join('');
  });
}
function updateCompLabels(){
  document.getElementById('ex-simple').textContent='+0 DT';
  document.getElementById('ex-moyenne').textContent='+'+(prices._comp_moyenne??100)+' DT';
  document.getElementById('ex-avancee').textContent='+'+(prices._comp_avancee??300)+' DT';
}

// ══════════════════════════════════════════════
// INTERACTIONS
// ══════════════════════════════════════════════
function toggleFeat(name,el){
  if(window.WalaupSound) WalaupSound.click();
  selected.has(name)?(selected.delete(name),el.classList.remove('sel')):(selected.add(name),el.classList.add('sel'));
  calculate();
  // Si le prompt est déjà affiché, le mettre à jour automatiquement
  const ta=document.getElementById('promptTa');
  const desc=document.getElementById('descInput').value.trim();
  if(ta && ta.value && desc) ta.value=buildPrompt(desc);
}
function setComp(val,btn){
  if(window.WalaupSound) WalaupSound.tab();
  complexity=val;
  document.querySelectorAll('.comp-btn').forEach(b=>b.classList.remove('act','simple','moyenne','avancee'));
  btn.classList.add('act',val);calculate();
  const ta=document.getElementById('promptTa');
  const desc=document.getElementById('descInput').value.trim();
  if(ta && ta.value && desc) ta.value=buildPrompt(desc);
}
function toggleMonetize(){
  monetize=!monetize;
  document.getElementById('monetizeToggle').classList.toggle('active',monetize);
  document.getElementById('marketplaceAddon').classList.toggle('show',monetize);
  document.getElementById('pro-mfeat').style.display=monetize?'flex':'none';
  document.getElementById('market-price-pro').style.display=monetize?'block':'none';
  if(monetize) calcRevenue();
  calculate();
  const ta=document.getElementById('promptTa');
  const desc=document.getElementById('descInput').value.trim();
  if(ta && ta.value && desc) ta.value=buildPrompt(desc);
}
function choosePack(el,name){
  if(window.WalaupSound) WalaupSound.tab();
  document.querySelectorAll('.pack').forEach(p=>p.classList.remove('chosen'));
  el.classList.add('chosen');
  const labels={essentiel:'🟢 Essentiel',pro:'🔵 Pro ⭐',partenaire:'🔴 Partenaire'};
  sessionStorage.setItem('bz_pack',name);
  showContinueBanner(name,labels[name]||name);
}

// ══════════════════════════════════════════════
// CALCULATE
// ══════════════════════════════════════════════
function calculate(){
  let base=0;
  selected.forEach(f=>base+=prices[f]??0);
  if(complexity==='moyenne') base+=prices._comp_moyenne??100;
  if(complexity==='avancee') base+=prices._comp_avancee??300;
  const n=selected.size;
  if(n===0){document.getElementById('results').classList.remove('on');return;}
  const weeks=Math.max(1,Math.round(n*0.8+(complexity==='simple'?0:complexity==='moyenne'?1:2)));
  const delai=weeks<=1?'1 sem.':weeks<=4?weeks+' sem.':(Math.ceil(weeks/4))+' mois+';
  const mMin=prices._maint_min??20,mMax=prices._maint_max??50;
  const mktCost=monetize?(prices._marketplace_activation??150):0;
  const tE=Math.round(base*(prices._pack_essentiel_pct??100)/100);
  const tP=Math.round(base*(prices._pack_pro_pct??125)/100)+mktCost;
  const tB=Math.round(base*(prices._pack_partenaire_pct??160)/100)+mktCost;
  document.getElementById('results').classList.add('on');
  document.getElementById('rTotal').textContent=base.toLocaleString()+' DT';
  document.getElementById('rDelai').textContent=delai;
  document.getElementById('rMaint').textContent=mMin+'–'+mMax+' DT';
  document.getElementById('rMods').textContent=n;
  document.getElementById('selTags').innerHTML=[...selected].map(f=>`<span class="sel-tag">${f}</span>`).join('');
  document.getElementById('setup-essentiel').innerHTML=tE.toLocaleString()+' DT<span class="unit">setup</span>';
  document.getElementById('monthly-essentiel').textContent='+ '+mMin+' DT / mois';
  document.getElementById('setup-pro').innerHTML=tP.toLocaleString()+' DT<span class="unit">setup</span>';
  document.getElementById('monthly-pro').textContent='+ '+mMin+'–'+mMax+' DT / mois';
  document.getElementById('setup-partenaire').innerHTML=tB.toLocaleString()+' DT<span class="unit">setup</span>';
  document.getElementById('monthly-partenaire').textContent='+ '+mMax+'–'+(mMax*2)+' DT / mois';
}

// ══════════════════════════════════════════════
// REVENUE SIM
// ══════════════════════════════════════════════
function calcRevenue(){
  const c=+document.getElementById('sliderClients').value;
  const p=+document.getElementById('sliderPrice').value;
  document.getElementById('valClients').textContent=c;
  document.getElementById('valPrice').textContent=p+' DT';
  const total=c*p,share=Math.round(total*.65),platform=total-share;
  document.getElementById('rvTotal').textContent=total+' DT';
  document.getElementById('rvClient').textContent=share+' DT';
  document.getElementById('rvPlatform').textContent=platform+' DT';
  document.getElementById('revExample').innerHTML=
    `Si <strong>${c} entreprise${c>1?'s':''}</strong> utilisent votre app à <strong>${p} DT/mois</strong> → vous gagnez <strong style="color:var(--c-green)">${share} DT/mois</strong> passivement.`;
}

// ══════════════════════════════════════════════
// BUILD PROMPT — 100% local, basé sur la description
// ══════════════════════════════════════════════
function buildPrompt(desc){
  const feats = [...selected];
  const comp = complexity==='simple'?'Simple (logique basique, peu de modules)'
              :complexity==='moyenne'?'Moyenne (authentification, plusieurs modules liés)'
              :'Avancée (multi-utilisateurs, logique métier complexe, nombreux modules)';

  // Construire la section fonctionnalités avec détails
  let featSection = '';
  if(feats.length > 0){
    featSection = feats.map(f=>{
      const detail = FEAT_DETAILS[f] || '';
      return `• ${f}${detail ? ' — '+detail : ''}`;
    }).join('\n');
  } else {
    featSection = '• À définir selon la description ci-dessus';
  }

  // Détecter la langue souhaitée
  const wantsArabic = /arab|arabe|عرب/i.test(desc);
  const langNote = wantsArabic ? 'français et arabe (RTL support requis)' : 'français';

  // Section monétisation
  const monetizeSection = monetize
    ? `\nMonétisation :
• Prévoir un système d'abonnement mensuel pour pouvoir vendre l'application à d'autres entreprises du même secteur
• Dashboard admin pour gérer les abonnés et les paiements
• Isolation des données par client (multi-tenant)\n`
    : '';

  var _dom = (typeof selectedDomain !== 'undefined' ? selectedDomain : '') || (window.selectedDomain||'');
  const domainLine = _dom ? ('\nSecteur : ' + _dom) : '';
  return `Crée une application web complète basée sur le besoin suivant :

━━━ DESCRIPTION DU CLIENT ━━━${domainLine}
${desc}

━━━ FONCTIONNALITÉS REQUISES ━━━
${featSection}

━━━ COMPLEXITÉ ━━━
${comp}
${monetizeSection}
━━━ DONNÉES ET LOCALISATION ━━━
• Tous les montants et prix en Dinar Tunisien (DT)
• Interface en ${langNote}
• Données de démonstration réalistes : prénoms tunisiens (Ahmed, Sami, Fatma, Mariem...), villes tunisiennes (Tunis, Sfax, Sousse...), numéros de téléphone format +216

━━━ STACK TECHNIQUE ━━━
• Fichier HTML unique et autonome — tout inclus : HTML + CSS + JS (aucune dépendance externe, aucun import npm)
• Firebase Firestore pour la base de données en temps réel
• Firebase Auth pour l'authentification sécurisée
• Design moderne et professionnel : responsive mobile-first, mode dark/light activable, UI soignée
• Compatible navigateur mobile (iPhone, Android)

━━━ ÉCRANS À IMPLÉMENTER ━━━
Crée tous les écrans nécessaires pour les fonctionnalités listées ci-dessus, adaptés au contexte décrit par le client. Chaque écran doit avoir une navigation claire et des formulaires fonctionnels avec validation.

━━━ LIVRABLE ━━━
Un seul fichier HTML complet, sans erreurs, prêt à ouvrir dans un navigateur et à déployer.`;
}

// ══════════════════════════════════════════════
// GÉNÉRER LE PROMPT (bouton principal)
// ══════════════════════════════════════════════
function genererPrompt(){
  if(window.WalaupSound) WalaupSound.send();
  const desc = document.getElementById('descInput').value.trim();
  if(desc.length < 10){
    document.getElementById('descInput').focus();
    document.getElementById('descInput').style.borderColor='var(--c-rose)';
    setTimeout(()=>document.getElementById('descInput').style.borderColor='',2000);
    return;
  }

  // Mettre à jour le prompt
  const prompt = buildPrompt(desc);

  // Sauvegarder en session
  sessionStorage.setItem('bz_domain', selectedDomain||'');
  sessionStorage.setItem('bz_prompt', prompt);
  sessionStorage.setItem('bz_features', JSON.stringify([...selected]));
  sessionStorage.setItem('bz_complexity', complexity);
  sessionStorage.setItem('bz_monetize', monetize?'1':'0');

  // Afficher le panel
  const panel = document.getElementById('promptPanel');
  const ta = document.getElementById('promptTa');
  ta.value = prompt;
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});

  // Calculer si fonctionnalités cochées
  if(selected.size > 0) calculate();
}

// ══════════════════════════════════════════════
// ACTIONS PROMPT
// ══════════════════════════════════════════════
function copyPrompt(btn){
  if(window.WalaupSound) WalaupSound.success();
  const ta=document.getElementById('promptTa');
  if(!ta) return;
  navigator.clipboard.writeText(ta.value).then(()=>{
    btn.textContent='✓ Copié !';
    btn.style.background='rgba(16,185,129,.2)';
    btn.style.borderColor='rgba(16,185,129,.4)';
    btn.style.color='var(--c-green)';
    setTimeout(()=>{
      btn.textContent='📋 Copier le prompt';
      btn.style.background='';btn.style.borderColor='';btn.style.color='';
    },2200);
  });
}
function ouvrirDans(target){
  const prompt=document.getElementById('promptTa')?.value||'';
  if(!prompt)return;
  const urls={
    claude:'https://claude.ai/new?q='+encodeURIComponent(prompt),
    chatgpt:'https://chat.openai.com/?q='+encodeURIComponent(prompt)
  };
  window.open(urls[target],'_blank');
}

// ══════════════════════════════════════════════
// CONTINUE BANNER
// ══════════════════════════════════════════════
function showContinueBanner(pack,label){
  let banner=document.getElementById('continueBanner');
  if(!banner){
    banner=document.createElement('div');
    banner.id='continueBanner';
    Object.assign(banner.style,{
      position:'fixed',bottom:'0',left:'0',right:'0',zIndex:'999',
      background:'rgba(8,12,24,.96)',borderTop:'1px solid rgba(108,143,255,.3)',
      backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',
      padding:'14px 22px',display:'flex',alignItems:'center',
      justifyContent:'space-between',gap:'14px',flexWrap:'wrap',
      animation:'bsUp .35s cubic-bezier(.34,1.3,.64,1)'
    });
    document.body.appendChild(banner);
    const s=document.createElement('style');
    s.textContent='@keyframes bsUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}';
    document.head.appendChild(s);
  }
  const colors={essentiel:'#34d399',pro:'#6c8fff',partenaire:'#f43f5e'};
  const col=colors[pack]||'#6c8fff';
  banner.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:42px;height:42px;border-radius:11px;background:${col}22;border:1px solid ${col}55;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${label.split(' ')[0]}</div>
      <div>
        <div style="font-weight:800;font-size:.9rem;color:#f0efff">Pack <span style="color:${col}">${label}</span> sélectionné</div>
        <div style="font-size:.75rem;color:rgba(220,218,255,.5);margin-top:2px">💳 Paiement uniquement après validation de votre démo</div>
      </div>
    </div>
    <div style="display:flex;gap:9px;flex-shrink:0">
      <button onclick="document.getElementById('continueBanner').remove();sessionStorage.removeItem('bz_pack')"
        style="padding:9px 16px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:rgba(220,218,255,.6);font-size:.8rem;cursor:pointer;font-family:inherit">Annuler</button>
      <button onclick="goToClient('${pack}')"
        style="padding:9px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,${col},${col}bb);color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;box-shadow:0 4px 18px ${col}55;font-family:inherit">
        Commencer ma demande →</button>
    </div>`;
}

function goToClient(pack){
  const desc=document.getElementById('descInput').value.trim();
  const prompt=sessionStorage.getItem('bz_prompt')||buildPrompt(desc||'Application sur mesure');
  // Calculate price for selected pack
  let priceBase=0;
  selected.forEach(f=>priceBase+=prices[f]??0);
  if(complexity==='moyenne')priceBase+=prices._comp_moyenne??100;
  if(complexity==='avancee')priceBase+=prices._comp_avancee??300;
  const priceMkt=monetize?(prices._marketplace_activation??150):0;
  const pricePct={essentiel:prices._pack_essentiel_pct??100,pro:prices._pack_pro_pct??125,partenaire:prices._pack_partenaire_pct??160};
  const estimatedPrice=Math.round(priceBase*(pricePct[pack]||100)/100)+(pack!=='essentiel'?priceMkt:0);
  // Save all data to sessionStorage
  sessionStorage.setItem('bz_pack',pack);
  sessionStorage.setItem('bz_prompt',prompt);
  sessionStorage.setItem('bz_features',JSON.stringify([...selected]));
  sessionStorage.setItem('bz_complexity',complexity||'simple');
  sessionStorage.setItem('bz_monetize',monetize?'1':'0');
  sessionStorage.setItem('bz_domain',(window.selectedDomain||selectedDomain||''));
  sessionStorage.setItem('bz_estimatedPrice',estimatedPrice>0?estimatedPrice+'':0);
  // Build client URL from current location (works on GitHub Pages with any subfolder)
  const base=window.location.href.substring(0,window.location.href.lastIndexOf('/')+1);
  const clientUrl=base+'client.html?pack='+encodeURIComponent(pack);
  console.log('Navigating to:', clientUrl);
  // Navigate — handle both iframe and standalone
  try{
    if(window.top&&window.top!==window){
      // Inside iframe: postMessage to parent then navigate top
      try{window.parent.postMessage({type:'bz_pack_chosen',pack},'*');}catch(e){}
      window.top.location.href=clientUrl;
    }else{
      // Standalone page
      window.location.href=clientUrl;
    }
  }catch(e){
    // Fallback: navigate current window
    window.location.href='client.html?pack='+encodeURIComponent(pack);
  }
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.getElementById('descInput').addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key==='Enter') genererPrompt();
});

buildGrids(); updateCompLabels(); calcRevenue();

// Firebase Auth — firebase-config.js gère l'init, pas besoin de réinitialiser
(function(){
  try{
    firebase.auth().onAuthStateChanged(u=>{
      if(!u||document.getElementById('authBadge'))return;
      const name=(u.displayName||u.email||'').split(' ')[0]||'Client';
      const badge=document.createElement('div');
      badge.id='authBadge';
      badge.style.cssText='position:fixed;top:14px;right:14px;z-index:800;display:flex;align-items:center;gap:8px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.25);border-radius:11px;padding:7px 13px;font-size:.76rem;color:#34d399;cursor:pointer;backdrop-filter:blur(12px)';
      badge.innerHTML='<span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#6c8fff,#b07cff);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:#fff">'+(name[0]||'C').toUpperCase()+'</span><span style="font-weight:700">'+name+'</span><span style="opacity:.55"> · connecté</span>';
      badge.onclick=()=>window.location.href='client.html';
      document.body.appendChild(badge);
    });
  }catch(e){console.warn('Firebase:',e)}
})();

// Restore pack
(function(){
  const saved=new URLSearchParams(location.search).get('pack')||sessionStorage.getItem('bz_pack');
  if(!saved)return;
  sessionStorage.setItem('bz_pack',saved);
  const labels={essentiel:'🟢 Essentiel',pro:'🔵 Pro ⭐',partenaire:'🔴 Partenaire'};
  window.addEventListener('DOMContentLoaded',()=>{
    const el=document.querySelector('.pack.'+saved);
    if(el){el.classList.add('chosen');showContinueBanner(saved,labels[saved]||saved);}
  });
})();


// Sons : délégués à js/sound.js (WalaupSound)
window.HiveSound = window.WalaupSound || {};
window.BizSound = window.WalaupSound || {};
