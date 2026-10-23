/* Comptoir du Flan — appli équipe · Étape 1 : socle (connexion, rôles, équipe, boutiques) */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const APP_URL=location.origin+location.pathname;

/* ---------- Rôles ---------- */
const ROLES={
  direction:{label:'Direction · admin et compta',short:'Direction',resp:true},
  resp_vente:{label:'Responsable vente',short:'Resp. vente',resp:true},
  resp_production:{label:'Responsable production',short:'Resp. production',resp:true},
  resp_partenariats:{label:'Responsable partenariats et marketing',short:'Resp. partenariats',resp:true},
  chef_patissier:{label:'Chef pâtissier',short:'Chef pâtissier'},
  patissier:{label:'Pâtissier',short:'Pâtissier'},
  vendeur:{label:'Vendeur',short:'Vendeur'},
  livreur:{label:'Livreur',short:'Livreur'},
  cm:{label:'Community manager',short:'Community manager'},
  aucun:{label:'En attente',short:'En attente'}
};
const ROLE_KEYS=Object.keys(ROLES).filter(k=>k!=='aucun');
const isResp=p=>!!(p&&p.actif&&ROLES[p.role]&&ROLES[p.role].resp);
const roleLabel=r=>(ROLES[r]||ROLES.aucun).label;
const roleShort=r=>(ROLES[r]||ROLES.aucun).short;
// Règle : le prénom ne s'affiche que s'il a été renseigné à la création du compte ; sinon, le rôle.
const displayName=p=>p&&p.prenom?(p.prenom+(p.nom?' '+p.nom.charAt(0)+'.':'')):roleShort(p&&p.role);
const initials=p=>p&&p.prenom?(p.prenom.charAt(0)+(p.nom?p.nom.charAt(0):'')).toUpperCase():'CF';

/* ---------- Modules (accueil) ---------- */
// etape : null = disponible maintenant ; n = arrive à l'étape n
const T=(name,desc,href,etape)=>({name,desc,href,etape});
const POLES=[
  {key:'resp_vente',title:'Vente',tiles:[T('Points de vente','Comparer et gérer les boutiques','#boutiques'),T('Planning de l\'équipe','Horaires et affluence prévue',null,4),T('Commandes spéciales','Événements, entreprises, acomptes',null,5),T('Contacts','Fournisseurs et clients pro',null,5)]},
  {key:'resp_production',title:'Production',tiles:[T('Production du jour','Suivi du labo en direct',null,2),T('Parfums de saison','Catalogue et éditions limitées',null,2),T('Recettes et marges','Coût de revient par flan',null,3)]},
  {key:'*',title:'Pilotage',owner:'Tous les responsables',tiles:[T('Tableau de bord','Vue d\'ensemble','#tableau'),T('Prévisions sur 7 jours','Production et équipe conseillées',null,3),T('Météo et ventes','Analyse et modèle',null,3),T('Agenda','Dates importantes et événements',null,4)]},
  {key:'direction',title:'Admin et compta',tiles:[T('Comptes de l\'équipe','Invitations et rôles','#equipe'),T('Comptabilité','Recettes, dépenses, échéances',null,3),T('Heures et pointages','Préparation de la paie',null,4)]},
  {key:'resp_partenariats',title:'Partenariats et marketing',tiles:[T('Demandes reçues','Franchises, partenariats, pros',null,6),T('Réseau de franchises','Chiffres consolidés',null,6),T('Réseaux sociaux','Suivi du community manager',null,6)]}
];
const ROLE_TILES={
  chef_patissier:[T('Production du jour','Quantités par parfum et par boutique',null,2),T('Étapes de production','Cuisson, refroidissement, garnissage',null,2),T('Traçabilité HACCP','Lots, températures, DLC',null,2),T('Mon planning','Mes horaires de la semaine',null,4)],
  patissier:[T('Production du jour','Quantités par parfum et par boutique',null,2),T('Étapes de production','Cuisson, refroidissement, garnissage',null,2),T('Traçabilité HACCP','Lots, températures, DLC',null,2),T('Mon planning','Mes horaires de la semaine',null,4)],
  vendeur:[T('Clôture de la journée','Ventes et invendus de ma boutique',null,2),T('Mon planning','Mes horaires de la semaine',null,4),T('Commandes clients','Retraits click & collect',null,5)],
  livreur:[T('Tournée du jour','Livraisons et transferts',null,5),T('Mon planning','Mes horaires de la semaine',null,4)],
  cm:[T('Réseaux sociaux','Statistiques et objectifs',null,6),T('Nouvelle publication','Préparer et programmer',null,6),T('Calendrier éditorial','Le mois en un coup d\'œil',null,6),T('Mon planning','Mes horaires de la semaine',null,4)]
};

/* ---------- État ---------- */
let sb=null,user=null,me=null,profiles=[],boutiques=[],invitations=[],loaded=false,channel=null;
let route='accueil',authMode='login',justLoggedIn=false,recovering=false;
let editShop=null,addShop=false,lastInvite=null;
let locked=false,pinRec=null,mode='unlock',buf='',first='',fails=0,waitUntil=0,hiddenAt=0,pinAction=null;
const pinKey=()=>'cdf-pin-'+(user?user.id:'');

/* ---------- Aides ---------- */
let tt;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2600)}
function frErr(e){
  const m=(e&&(e.message||e.error_description))||'';
  if(/Invalid login credentials/i.test(m))return 'Adresse ou mot de passe incorrect.';
  if(/Email not confirmed/i.test(m))return 'Confirme d’abord ton adresse avec le lien reçu par mail (pense aux spams).';
  if(/already registered|already been registered/i.test(m))return 'Un compte existe déjà avec cette adresse. Connecte-toi.';
  if(/Password should be at least/i.test(m))return 'Mot de passe trop court.';
  if(/rate limit|too many/i.test(m))return 'Trop de tentatives. Patiente quelques minutes.';
  if(/duplicate key|already exists/i.test(m))return 'Cette adresse a déjà une invitation.';
  if(/row-level security|permission denied/i.test(m))return 'Tu n’as pas les droits pour faire ça.';
  if(/Failed to fetch|NetworkError|network/i.test(m))return 'Pas de connexion internet. Réessaie quand le réseau revient.';
  return m?('Erreur : '+m):'Une erreur est survenue. Réessaie.';
}
const shopName=id=>{const b=boutiques.find(x=>x.id===id);return b?b.nom:''};
function shopOptions(sel,emptyLabel){return `<option value="">${esc(emptyLabel||'Toutes / labo')}</option>`+boutiques.filter(b=>b.actif||b.id===sel).map(b=>`<option value="${b.id}"${b.id===sel?' selected':''}>${esc(b.nom)}</option>`).join('')}
function roleOptions(sel,withNone){return (withNone?`<option value="aucun"${sel==='aucun'?' selected':''}>Choisir un rôle…</option>`:'')+ROLE_KEYS.map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(ROLES[k].label)}</option>`).join('')}
function setOffline(){$('#offline').hidden=navigator.onLine}
window.addEventListener('online',()=>{setOffline();if(user)loadAll()});
window.addEventListener('offline',setOffline);
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Message copié')}catch(e){toast('Sélectionne le texte et copie-le')}}

/* ---------- Écrans ---------- */
function show(which){$('#auth').hidden=which!=='auth';$('#app').hidden=which!=='app'}
function setAuthMode(m,okMsg){
  authMode=m;
  const C={
    login:['Connexion','Connecte-toi avec l’adresse donnée par ton responsable.','Se connecter'],
    activate:['Activer mon compte','Utilise l’adresse à laquelle ton responsable t’a invité·e.','Créer mon compte'],
    reset:['Mot de passe oublié','Tu vas recevoir un lien pour en choisir un nouveau.','Recevoir le lien']
  }[m];
  $('#authTitle').textContent=C[0];$('#authLead').textContent=C[1];$('#authBtn').textContent=C[2];
  $('#nameRow').hidden=m!=='activate';$('#charteRow').hidden=m!=='activate';
  $('#pwRow').hidden=m==='reset';$('#pwHint').hidden=m!=='activate';
  $('#aPw').autocomplete=m==='activate'?'new-password':'current-password';
  $('#toActivate').textContent=m==='login'?'Première connexion ? Activer mon compte':'J’ai déjà un compte';
  $('#toReset').hidden=m!=='login';
  $('#authErr').hidden=true;const ok=$('#authOk');ok.textContent=okMsg||'';ok.hidden=!okMsg;
}
function showAuth(okMsg){show('auth');$('#authForm').hidden=false;$('#newPwForm').hidden=true;setAuthMode('login',okMsg)}

/* ---------- Données ---------- */
async function loadAll(){
  const [p,b]=await Promise.all([
    sb.from('profiles').select('*').order('created_at'),
    sb.from('boutiques').select('*').order('created_at')
  ]);
  if(p.error){toast(frErr(p.error));return}
  profiles=p.data||[];me=profiles.find(x=>x.id===user.id)||null;
  boutiques=b.error?[]:(b.data||[]);
  if(isResp(me)){const i=await sb.from('invitations').select('*').order('created_at',{ascending:false});invitations=i.error?[]:(i.data||[])}else invitations=[];
  loaded=true;render();
}
let rT;const reload=()=>{clearTimeout(rT);rT=setTimeout(loadAll,300)};
function subscribe(){
  if(channel)sb.removeChannel(channel);
  channel=sb.channel('cdf-socle')
    .on('postgres_changes',{event:'*',schema:'public',table:'profiles'},reload)
    .on('postgres_changes',{event:'*',schema:'public',table:'boutiques'},reload)
    .on('postgres_changes',{event:'*',schema:'public',table:'invitations'},reload)
    .subscribe();
}

/* ---------- Session ---------- */
async function startApp(session){
  if(recovering)return;
  user=session.user;pinRec=LS.get(pinKey(),null);
  show('app');
  if(pinRec&&!justLoggedIn)lockNow();else{locked=false;renderLock()}
  justLoggedIn=false;
  $('#main').innerHTML='<div class="page"><p class="empty">Chargement…</p></div>';
  await loadAll();subscribe();
}
function stopApp(){if(channel){sb.removeChannel(channel);channel=null}user=null;me=null;profiles=[];boutiques=[];invitations=[];loaded=false;locked=false;renderLock()}

/* ---------- Rendu ---------- */
function readRoute(){const h=(location.hash||'#accueil').slice(1);route=['accueil','tableau','equipe','boutiques','profil'].includes(h)?h:'accueil'}
window.addEventListener('hashchange',()=>{readRoute();editShop=null;addShop=false;render();window.scrollTo({top:0})});

function render(){
  if(!user||!loaded)return;
  const main=$('#main'),nav=$('#nav');
  if(!me||!me.actif||me.role==='aucun'){nav.innerHTML='';$('#me').innerHTML='';main.innerHTML=waitView();return}
  if(!isResp(me)&&(route==='tableau'||route==='equipe'))route='accueil';
  const items=isResp(me)?[['accueil','Accueil'],['tableau','Tableau de bord'],['equipe','Équipe'],['boutiques','Points de vente']]:[['accueil','Accueil'],['boutiques','Points de vente']];
  nav.innerHTML=items.map(([k,l])=>`<a href="#${k}"${k===route?' aria-current="page"':''}>${esc(l)}</a>`).join('');
  $('#me').innerHTML=`<span class="avatar" aria-hidden="true">${esc(initials(me))}</span><span>${esc(displayName(me))}</span>`;
  if(locked&&!pinAction){main.innerHTML='';return}
  main.innerHTML={accueil:homeView,tableau:dashView,equipe:teamView,boutiques:shopsView,profil:profileView}[route]();
}

function waitView(){
  const inactive=me&&!me.actif;
  return `<div class="wait"><img src="icons/logo.png" alt="Le Comptoir du Flan">
    <h1>${inactive?'Compte désactivé':'Compte en attente'}</h1>
    <p class="sub" style="margin:0;color:var(--muted)">${inactive?'Ton accès a été désactivé. Parle à un responsable si c’est une erreur.':'Ton compte est bien créé. Un responsable doit maintenant te donner un rôle pour que tu accèdes à l’appli.'}</p>
    <button class="btn ghost" type="button" data-act="logout">Se déconnecter</button></div>`;
}

function tileHTML(t,mine){
  if(t.etape)return `<div class="tile soon"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span><span class="badge b-mute" style="align-self:flex-start;margin-top:4px">Étape ${t.etape}</span></div>`;
  return `<a class="tile${mine?' mine':''}" href="${t.href}"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></a>`;
}
function homeView(){
  const hello=me.prenom?`Bonjour ${esc(me.prenom)}`:'Bonjour';
  let body='';
  if(isResp(me)){
    const owner=k=>{if(k==='*')return 'Tous les responsables';const p=profiles.find(x=>x.role===k&&x.actif);return p?displayName(p):roleShort(k)};
    const poles=POLES.slice().sort((a,b)=>(b.key===me.role)-(a.key===me.role));
    body=poles.map(p=>{const mine=p.key===me.role;return `<section class="pole"><div class="pole-h"><h2>${esc(p.title)}</h2><span>${esc(owner(p.key))}${mine?' · ton pôle':''}</span></div><div class="tiles">${p.tiles.map(t=>tileHTML(t,mine)).join('')}</div></section>`}).join('');
  }else{
    const tiles=(ROLE_TILES[me.role]||[]).concat([T('Points de vente','Adresses et horaires','#boutiques'),T('Mon profil','Prénom, code PIN','#profil')]);
    body=`<section class="pole"><div class="pole-h"><h2>Mon espace</h2><span>${esc(roleLabel(me.role))}${me.boutique_id?' · '+esc(shopName(me.boutique_id)):''}</span></div><div class="tiles">${tiles.map(t=>tileHTML(t,false)).join('')}</div></section>`;
  }
  return `<div class="page"><div class="head"><div><h1>${hello}</h1><p>${esc(roleLabel(me.role))}</p></div></div>
    ${body}
    <p class="note">Les modules marqués « Étape » arrivent au fil des mises à jour.</p></div>`;
}

function dashView(){
  const act=profiles.filter(p=>p.actif&&p.role!=='aucun');
  const waiting=profiles.filter(p=>p.role==='aucun'&&p.actif);
  const pend=invitations.filter(i=>!i.used_at);
  const shopsOn=boutiques.filter(b=>b.actif);
  const noName=act.filter(p=>!p.prenom);
  const counts={};act.forEach(p=>counts[p.role]=(counts[p.role]||0)+1);
  const arr=ROLE_KEYS.filter(k=>counts[k]).map(k=>[k,counts[k]]);const max=Math.max(1,...arr.map(a=>a[1]));
  const bars=arr.length?`<div class="bars">${arr.map(([k,n])=>`<div class="bar"><span class="name">${esc(ROLES[k].label)}</span><span class="track"><span class="fill" style="display:block;width:${n/max*100}%"></span></span><span class="n num">${n}</span></div>`).join('')}</div>`:'<p class="empty">Personne pour l’instant.</p>';
  const perShop=shopsOn.map(b=>[b,act.filter(p=>p.boutique_id===b.id).length]);
  const todo=[];
  if(waiting.length)todo.push(`<li><a href="#equipe">${waiting.length} compte${waiting.length>1?'s':''} à valider</a> : leur donner un rôle.</li>`);
  if(pend.length)todo.push(`<li>${pend.length} invitation${pend.length>1?'s':''} pas encore utilisée${pend.length>1?'s':''}. Relance les personnes.</li>`);
  if(boutiques.some(b=>b.actif&&!b.horaires))todo.push(`<li><a href="#boutiques">Horaires à compléter</a> pour ${boutiques.filter(b=>b.actif&&!b.horaires).map(b=>esc(b.nom)).join(', ')}.</li>`);
  if(noName.length)todo.push(`<li>${noName.length} membre${noName.length>1?'s':''} sans prénom renseigné (affiché${noName.length>1?'s':''} par le rôle).</li>`);
  return `<div class="page">
  <div class="head"><div><h1>Tableau de bord</h1><p>Vue d’ensemble de l’équipe et des points de vente</p></div></div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Points de vente actifs</span><span class="val num">${shopsOn.length}</span><span class="hint">${shopsOn.filter(b=>b.zone==='montpellier').length} zone Montpellier · ${shopsOn.filter(b=>b.zone==='hors').length} hors</span></div>
    <div class="card kpi"><span class="lbl">Membres actifs</span><span class="val num">${act.length}</span><span class="hint">${act.filter(isResp).length} responsable${act.filter(isResp).length>1?'s':''}</span></div>
    <div class="card kpi"><span class="lbl">Invitations en attente</span><span class="val num">${pend.length}</span><span class="hint">Pas encore activées</span></div>
    <div class="card kpi"><span class="lbl">Comptes à valider</span><span class="val num">${waiting.length}</span><span class="hint">${waiting.length?'<a href="#equipe">Donner un rôle</a>':'Rien à faire'}</span></div>
  </section>
  <div class="grid g2">
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Équipe par rôle</h2>${bars}</section>
      <section class="card"><h2>Équipe par point de vente</h2>
        <div class="bars">${perShop.map(([b,n])=>`<div class="bar"><span class="name">${esc(b.nom)}</span><span class="track"><span class="fill" style="display:block;width:${n/Math.max(1,...perShop.map(x=>x[1]))*100}%"></span></span><span class="n num">${n}</span></div>`).join('')}</div>
        <p class="note">Les membres sans point de vente (labo, responsables, livreurs) n’apparaissent pas ici.</p></section>
    </div>
    <div class="grid" style="gap:16px;align-content:start">
      <section class="card"><h2>À faire</h2>${todo.length?`<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px">${todo.join('')}</ul>`:'<p class="empty">Rien à signaler.</p>'}</section>
      <section class="card dark"><h2 style="color:var(--gold-l)">Bientôt ici</h2><p class="sub">Ventes, production et invendus par boutique arrivent à l’étape 2. Prévisions, météo et marges à l’étape 3.</p></section>
    </div>
  </div></div>`;
}

function teamView(){
  const waiting=profiles.filter(p=>p.role==='aucun'&&p.actif);
  const pend=invitations.filter(i=>!i.used_at);
  const team=profiles.filter(p=>p.role!=='aucun'||!p.actif);
  const inviteMsg=lastInvite?`Bonjour,\nTu es invité·e dans l'appli de l'équipe du Comptoir du Flan (${roleLabel(lastInvite.role)}).\n1. Ouvre : ${APP_URL}\n2. Choisis « Activer mon compte »\n3. Utilise cette adresse : ${lastInvite.email}`:'';
  return `<div class="page">
  <div class="head"><div><h1>Comptes de l’équipe</h1><p>Inviter, donner un rôle, désactiver un accès</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Inviter quelqu’un</h2>
      <form id="inviteForm" class="grid" style="gap:12px" novalidate>
        <label class="field">Adresse e-mail<input id="iEmail" type="email" autocomplete="off" placeholder="prenom@exemple.fr"></label>
        <div class="row2">
          <label class="field">Rôle<select id="iRole">${roleOptions('vendeur')}</select></label>
          <label class="field">Point de vente<select id="iShop">${shopOptions('')}</select></label>
        </div>
        <p class="msg err" id="iErr" hidden></p>
        <button class="btn" type="submit">Créer l’invitation</button>
      </form>
      ${lastInvite?`<div class="grid" style="gap:8px"><b style="font-size:14px">Message à envoyer (SMS, WhatsApp, mail)</b><div class="copybox" id="inviteText">${esc(inviteMsg)}</div><button class="btn ghost sm" type="button" data-act="copyInvite">Copier le message</button></div>`:''}
      <p class="note">Le prénom et le nom apparaissent seulement quand la personne active son compte. D’ici là, elle est affichée par son rôle.</p>
    </section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Comptes à valider <span class="badge ${waiting.length?'b-gold':'b-mute'}">${waiting.length}</span></h2>
        <p class="sub">Personnes inscrites sans invitation : donne-leur un rôle pour ouvrir leur accès.</p>
        ${waiting.length?waiting.map(p=>`<div class="grid" style="gap:8px;padding:10px 0;border-top:1px solid var(--cream)">
          <div class="who"><span class="avatar">${esc(initials(p))}</span><span>${esc(p.prenom?p.prenom+' '+(p.nom||''):'Sans prénom')}<small>${esc(p.email)}</small></span></div>
          <div class="row2"><select style="min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit" id="w-role-${p.id}" aria-label="Rôle">${roleOptions('aucun',true)}</select>
          <select style="min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit" id="w-shop-${p.id}" aria-label="Point de vente">${shopOptions('')}</select></div>
          <div style="display:flex;gap:8px"><button class="btn sm" type="button" data-act="approve" data-id="${p.id}">Valider</button><button class="btn sm danger" type="button" data-act="toggle" data-id="${p.id}">Refuser l’accès</button></div></div>`).join(''):'<p class="empty">Aucun compte en attente.</p>'}
      </section>
      <section class="card"><h2>Invitations en attente <span class="badge b-mute">${pend.length}</span></h2>
        ${pend.length?pend.map(i=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span style="min-width:0;overflow-wrap:anywhere">${esc(i.email)}<small style="display:block;color:var(--muted);font-size:12px">${esc(roleLabel(i.role))}${i.boutique_id?' · '+esc(shopName(i.boutique_id)):''}</small></span><button class="btn ghost sm" type="button" data-act="delInvite" data-email="${esc(i.email)}">Annuler</button></div>`).join(''):'<p class="empty">Aucune invitation en attente.</p>'}
      </section>
    </div>
  </div>
  <section class="card"><h2>Équipe <span class="badge b-mute">${team.filter(p=>p.actif).length} actif${team.filter(p=>p.actif).length>1?'s':''}</span></h2>
    <div class="tbl-wrap"><table><thead><tr><th>Membre</th><th>Rôle</th><th>Point de vente</th><th>Accès</th></tr></thead><tbody>
    ${team.map(p=>{const self=p.id===me.id;return `<tr>
      <td><div class="who"><span class="avatar" aria-hidden="true">${esc(initials(p))}</span><span>${esc(displayName(p))}${self?' (toi)':''}<small>${esc(p.email)}</small></span></div></td>
      <td><select data-act="setRole" data-id="${p.id}" aria-label="Rôle"${self?' disabled':''}>${roleOptions(p.role)}</select></td>
      <td><select data-act="setShop" data-id="${p.id}" aria-label="Point de vente">${shopOptions(p.boutique_id||'')}</select></td>
      <td>${self?'<span class="badge b-good">Actif</span>':`<button class="btn sm ${p.actif?'ghost':''}" type="button" data-act="toggle" data-id="${p.id}">${p.actif?'Désactiver':'Réactiver'}</button>`}</td></tr>`}).join('')}
    </tbody></table></div>
  </section></div>`;
}

function shopForm(b){
  b=b||{nom:'',ville:'',zone:'montpellier',horaires:''};
  return `<form class="grid" style="gap:10px" data-shopform="${b.id||'new'}" novalidate>
    <label class="field">Nom<input name="nom" value="${esc(b.nom)}" required></label>
    <label class="field">Ville<input name="ville" value="${esc(b.ville||'')}"></label>
    <label class="field">Zone<select name="zone"><option value="montpellier"${b.zone==='montpellier'?' selected':''}>Zone Montpellier</option><option value="hors"${b.zone==='hors'?' selected':''}>Hors Montpellier</option></select></label>
    <label class="field">Horaires<input name="horaires" value="${esc(b.horaires||'')}" placeholder="Lun–sam 10h–20h"></label>
    <p class="msg err" hidden></p>
    <div style="display:flex;gap:8px"><button class="btn sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-act="cancelShop">Annuler</button></div></form>`;
}
function shopsView(){
  const can=isResp(me);
  const list=boutiques.filter(b=>can||b.actif);
  return `<div class="page">
  <div class="head"><div><h1>${list.filter(b=>b.actif).length} points de vente</h1><p>Montpellier et alentours, Nîmes, Béziers, Marseille</p></div>${can&&!addShop?'<button class="btn sm" type="button" data-act="addShop">+ Ajouter un point de vente</button>':''}</div>
  ${addShop?`<section class="card"><h2>Nouveau point de vente</h2>${shopForm(null)}</section>`:''}
  <div class="shops">${list.map(b=>editShop===b.id?`<div class="shop">${shopForm(b)}</div>`:`<div class="shop${b.actif?'':' off'}">
    <div class="shop-h"><b>${esc(b.nom)}</b><span class="badge ${b.zone==='montpellier'?'b-gold':'b-info'}">${b.zone==='montpellier'?'Zone Montpellier':'Hors Montpellier'}</span></div>
    <span class="meta">${esc(b.ville||'')}</span>
    <span style="font-size:14px">${b.horaires?esc(b.horaires):'<span class="badge b-bad">Horaires à compléter</span>'}</span>
    <span class="meta">${profiles.filter(p=>p.actif&&p.boutique_id===b.id&&p.role!=='aucun').length} membre(s) rattaché(s)${b.actif?'':' · désactivé'}</span>
    ${can?`<div class="actions"><button class="btn ghost sm" type="button" data-act="editShop" data-id="${b.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="toggleShop" data-id="${b.id}">${b.actif?'Désactiver':'Réactiver'}</button></div>`:''}
  </div>`).join('')}</div>
  ${list.length?'':'<p class="empty">Aucun point de vente enregistré.</p>'}</div>`;
}

function profileView(){
  return `<div class="page">
  <div class="head"><div><h1>Mon profil</h1><p>${esc(roleLabel(me.role))}${me.boutique_id?' · '+esc(shopName(me.boutique_id)):''}</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Mes informations</h2>
      <form id="profileForm" class="grid" style="gap:12px" novalidate>
        <div class="row2"><label class="field">Prénom<input id="pPrenom" value="${esc(me.prenom||'')}" autocomplete="given-name"></label><label class="field">Nom<input id="pNom" value="${esc(me.nom||'')}" autocomplete="family-name"></label></div>
        <label class="field">Adresse e-mail<input value="${esc(me.email)}" disabled></label>
        <button class="btn" type="submit">Enregistrer</button>
      </form>
      <p class="note">Ton rôle et ton point de vente sont gérés par les responsables.</p>
    </section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Code PIN</h2>
        <p class="sub">${pinRec?`Code à ${pinRec.len} chiffres actif sur cet appareil. Il est demandé à l’ouverture et après 2 minutes en arrière-plan.`:'Avec un code PIN, tu ouvres l’appli sur ce téléphone sans retaper ton mot de passe.'}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${pinRec?'<button class="btn ghost sm" type="button" data-act="pinChange">Changer le PIN</button><button class="btn ghost sm" type="button" data-act="pinOff">Désactiver</button><button class="btn ghost sm" type="button" data-act="lock">Verrouiller maintenant</button>':'<button class="btn sm" type="button" data-act="pinOn">Activer un code PIN</button>'}</div>
      </section>
      <section class="card"><h2>Session</h2><button class="btn ghost" type="button" data-act="logout">Se déconnecter</button></section>
    </div>
  </div></div>`;
}

/* ---------- Actions ---------- */
async function act(fn,okMsg){try{const r=await fn();if(r&&r.error)throw r.error;if(okMsg)toast(okMsg);reload()}catch(e){toast(frErr(e))}}
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('button');if(!t)return;
  if(t.dataset.key)return press(t.dataset.key);
  if(t.id==='lockAlt'){if(pinAction)return unlockNow();locked=false;renderLock();await sb.auth.signOut();return}
  if(t.id==='toActivate')return setAuthMode(authMode==='login'?'activate':'login');
  if(t.id==='toReset')return setAuthMode('reset');
  const a=t.dataset.act,id=t.dataset.id;if(!a)return;
  switch(a){
    case 'logout':await sb.auth.signOut();return;
    case 'copyInvite':{const el=$('#inviteText');if(el)copyText(el.textContent);return}
    case 'delInvite':return act(()=>sb.from('invitations').delete().eq('email',t.dataset.email),'Invitation annulée');
    case 'approve':{
      const r=$('#w-role-'+id).value,s=$('#w-shop-'+id).value||null;
      if(r==='aucun')return toast('Choisis d’abord un rôle');
      return act(()=>sb.from('profiles').update({role:r,boutique_id:s}).eq('id',id),'Accès ouvert');
    }
    case 'toggle':{const p=profiles.find(x=>x.id===id);if(!p)return;
      if(p.actif&&!t.dataset.armed){t.dataset.armed='1';t.textContent='Confirmer ?';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;render()}},3500);return}
      return act(()=>sb.from('profiles').update({actif:!p.actif}).eq('id',id),p.actif?'Accès désactivé':'Accès réactivé')}
    case 'addShop':addShop=true;editShop=null;return render();
    case 'editShop':editShop=id;addShop=false;return render();
    case 'cancelShop':editShop=null;addShop=false;return render();
    case 'toggleShop':{const b=boutiques.find(x=>x.id===id);if(!b)return;return act(()=>sb.from('boutiques').update({actif:!b.actif}).eq('id',id),b.actif?'Point de vente désactivé':'Point de vente réactivé')}
    case 'pinOn':return startPinFlow('create');
    case 'pinChange':return startPinFlow('change');
    case 'pinOff':return startPinFlow('disable');
    case 'lock':return lockNow();
  }
});
document.addEventListener('change',ev=>{
  const s=ev.target.closest('select[data-act]');if(!s)return;
  const id=s.dataset.id;
  if(s.dataset.act==='setRole')act(()=>sb.from('profiles').update({role:s.value}).eq('id',id),'Rôle mis à jour');
  if(s.dataset.act==='setShop')act(()=>sb.from('profiles').update({boutique_id:s.value||null}).eq('id',id),'Point de vente mis à jour');
});
document.addEventListener('submit',async ev=>{
  const f=ev.target;ev.preventDefault();
  if(f.id==='authForm')return submitAuth();
  if(f.id==='newPwForm'){
    const pw=$('#newPw').value,err=$('#newPwErr');
    if(pw.length<10){err.textContent='10 caractères minimum.';err.hidden=false;return}
    const {error}=await sb.auth.updateUser({password:pw});
    if(error){err.textContent=frErr(error);err.hidden=false;return}
    recovering=false;toast('Mot de passe changé');
    const {data}=await sb.auth.getSession();if(data.session){justLoggedIn=true;startApp(data.session)}else showAuth();
    return;
  }
  if(f.id==='inviteForm'){
    const email=$('#iEmail').value.trim().toLowerCase(),role=$('#iRole').value,shop=$('#iShop').value||null,err=$('#iErr');
    if(!/^\S+@\S+\.\S+$/.test(email)){err.textContent='Entre une adresse e-mail valide.';err.hidden=false;return}
    if(profiles.some(p=>p.email.toLowerCase()===email)){err.textContent='Cette personne a déjà un compte : change son rôle dans la liste Équipe.';err.hidden=false;return}
    const {error}=await sb.from('invitations').upsert({email,role,boutique_id:shop,invited_by:me.id,used_at:null});
    if(error){err.textContent=frErr(error);err.hidden=false;return}
    lastInvite={email,role};toast('Invitation créée');reload();return;
  }
  if(f.id==='profileForm'){
    const prenom=$('#pPrenom').value.trim()||null,nom=$('#pNom').value.trim()||null;
    return act(()=>sb.from('profiles').update({prenom,nom}).eq('id',me.id),'Profil enregistré');
  }
  if(f.dataset.shopform){
    const d=Object.fromEntries(new FormData(f));const err=f.querySelector('.msg');
    if(!d.nom.trim()){err.textContent='Donne un nom au point de vente.';err.hidden=false;return}
    const row={nom:d.nom.trim(),ville:d.ville.trim()||null,zone:d.zone,horaires:d.horaires.trim()||null};
    const isNew=f.dataset.shopform==='new';
    const {error}=isNew?await sb.from('boutiques').insert(row):await sb.from('boutiques').update(row).eq('id',f.dataset.shopform);
    if(error){err.textContent=frErr(error);err.hidden=false;return}
    editShop=null;addShop=false;toast(isNew?'Point de vente ajouté':'Point de vente modifié');reload();
  }
});

async function submitAuth(){
  const email=$('#aEmail').value.trim(),pw=$('#aPw').value,err=$('#authErr'),ok=$('#authOk');
  err.hidden=true;ok.hidden=true;const fail=m=>{err.textContent=m;err.hidden=false};
  if(!/^\S+@\S+\.\S+$/.test(email))return fail('Entre une adresse e-mail valide.');
  if(authMode==='login'&&!pw)return fail('Entre ton mot de passe.');
  if(authMode==='activate'){
    if(!$('#aPrenom').value.trim())return fail('Entre ton prénom.');
    if(pw.length<10)return fail('Le mot de passe doit faire au moins 10 caractères.');
    if(!$('#aCharte').checked)return fail('Coche la case pour continuer.');
  }
  const btn=$('#authBtn');btn.disabled=true;
  try{
    if(authMode==='login'){
      justLoggedIn=true;const {error}=await sb.auth.signInWithPassword({email,password:pw});
      if(error){justLoggedIn=false;fail(frErr(error))}
    }else if(authMode==='activate'){
      const {data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:APP_URL,data:{prenom:$('#aPrenom').value.trim(),nom:$('#aNom').value.trim()}}});
      if(error)fail(frErr(error));
      else if(!data.session)setAuthMode('login','Compte créé. Clique le lien du mail de confirmation (pense aux spams), puis connecte-toi ici.');
      else justLoggedIn=true;
    }else{
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL});
      if(error)fail(frErr(error));else setAuthMode('login','Si un compte existe avec cette adresse, un lien vient d’être envoyé.');
    }
  }finally{btn.disabled=false}
}

/* ---------- Code PIN (propre à chaque appareil) ---------- */
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const randHex=n=>hex(crypto.getRandomValues(new Uint8Array(n)).buffer);
async function hashPin(pin,salt){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('cdf:'+salt+':'+pin)))}
const PT={set1:['Crée ton code PIN','4 à 6 chiffres, puis OK.'],set2:['Confirme ton code','Tape-le une deuxième fois, puis OK.'],unlock:['Code PIN','Tape ton code pour ouvrir l’appli.'],old:['Code actuel','Tape ton code actuel pour continuer.']};
function renderLock(msg){
  const L=$('#lock');L.hidden=!locked;if(!locked)return;
  $('#lockT').textContent=PT[mode][0];$('#lockS').textContent=PT[mode][1];
  const n=Math.max((mode==='unlock'||mode==='old')&&pinRec?pinRec.len:4,buf.length);
  $('#dots').innerHTML=Array.from({length:n},(_,i)=>`<i class="${i<buf.length?'on':''}"></i>`).join('');
  $('#lockMsg').textContent=msg||'';$('#lockAlt').textContent=pinAction?'Annuler':'Utiliser mon mot de passe';
}
function lockNow(){if(!pinRec)return;locked=true;pinAction=null;buf='';first='';mode='unlock';render();renderLock()}
function unlockNow(){locked=false;pinAction=null;buf='';first='';render();renderLock()}
function startPinFlow(a){pinAction=a;locked=true;buf='';first='';mode=a==='create'?'set1':'old';renderLock()}
async function press(k){
  if(Date.now()<waitUntil)return renderLock(`Trop d’essais. Réessaie dans ${Math.ceil((waitUntil-Date.now())/1000)} s.`);
  if(k==='del'){buf=buf.slice(0,-1);return renderLock()}
  if(k==='ok')return submitPin();
  if(buf.length>=6)return;buf+=k;renderLock();
  if((mode==='unlock'||mode==='old')&&pinRec&&buf.length===pinRec.len)submitPin();
}
async function submitPin(){
  const p=buf;
  if(mode==='set1'){if(p.length<4)return renderLock('Il faut au moins 4 chiffres.');first=p;buf='';mode='set2';return renderLock()}
  if(mode==='set2'){buf='';if(p!==first){first='';mode='set1';return renderLock('Les deux codes ne correspondent pas. Recommence.')}
    const salt=randHex(16);pinRec={salt,hash:await hashPin(p,salt),len:p.length};LS.set(pinKey(),pinRec);
    const was=pinAction;unlockNow();toast(was==='change'?'Code PIN changé':'Code PIN activé');return}
  buf='';let ok=false;try{ok=!!pinRec&&(await hashPin(p,pinRec.salt))===pinRec.hash}catch(e){}
  if(!ok){fails++;if(fails>=5){fails=0;waitUntil=Date.now()+30000;return renderLock('Trop d’essais. Réessaie dans 30 s.')}return renderLock('Code incorrect.')}
  fails=0;
  if(mode==='old'){if(pinAction==='disable'){LS.del(pinKey());pinRec=null;unlockNow();toast('Code PIN désactivé');return}mode='set1';return renderLock()}
  unlockNow();
}
document.addEventListener('keydown',ev=>{
  if(!locked)return;
  if(/^[0-9]$/.test(ev.key)){press(ev.key);ev.preventDefault()}
  else if(ev.key==='Backspace'){press('del');ev.preventDefault()}
  else if(ev.key==='Enter'){press('ok');ev.preventDefault()}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now();return}
  if(!user)return;
  if(pinRec&&!locked&&hiddenAt&&Date.now()-hiddenAt>120000)lockNow();
  reload();
});

/* ---------- Lancement ---------- */
function boot(){
  setOffline();readRoute();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  const cfg=window.CDF_CONFIG||{};
  if(!window.supabase||!cfg.SUPABASE_URL||/TON-PROJET/.test(cfg.SUPABASE_URL)||/COLLE-ICI/.test(cfg.SUPABASE_KEY||'')){
    showAuth();const err=$('#authErr');
    err.textContent=!window.supabase?'La connexion n’a pas pu se charger. Vérifie internet.':'Appli pas encore reliée à Supabase : remplis config.js.';
    err.hidden=false;$('#authBtn').disabled=true;return;
  }
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  sb.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){recovering=true;locked=false;renderLock();show('auth');$('#authForm').hidden=true;$('#newPwForm').hidden=false;return}
    if(session&&session.user){if(!user||user.id!==session.user.id)setTimeout(()=>startApp(session),0)}
    else if(event==='SIGNED_OUT'||event==='INITIAL_SESSION'){stopApp();showAuth()}
  });
}
boot();
})();
