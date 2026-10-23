/* Comptoir du Flan — appli équipe
   Étape 1 : connexion, rôles, équipe, points de vente
   Étape 2 : parfums, planning, envois & réassorts, production labo, journée vendeur, tournée livreur, ventes */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const APP_URL=location.origin+location.pathname;
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayISO=()=>isoOf(new Date());
const parseISO=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return isoOf(d)};
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const fmtDay=s=>{const d=parseISO(s);return JOURS[d.getDay()]+' '+d.getDate()+' '+MOIS[d.getMonth()]};
const hhmm=t=>t?String(t).slice(0,5).replace(':','h'):'';
const timeOf=ts=>{try{const d=new Date(ts);return pad(d.getHours())+'h'+pad(d.getMinutes())}catch(e){return ''}};
const ef=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
const eur=v=>ef.format(+v||0);
const int=v=>{const n=parseInt(v,10);return isFinite(n)&&n>0?n:0};

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
const isLabo=p=>!!(p&&p.actif&&(p.role==='chef_patissier'||p.role==='patissier'));
const roleLabel=r=>(ROLES[r]||ROLES.aucun).label;
const roleShort=r=>(ROLES[r]||ROLES.aucun).short;
// Règle : le prénom ne s'affiche que s'il a été renseigné à l'activation du compte ; sinon, le rôle.
const displayName=p=>p&&p.prenom?(p.prenom+(p.nom?' '+p.nom.charAt(0)+'.':'')):roleShort(p&&p.role);
const initials=p=>p&&p.prenom?(p.prenom.charAt(0)+(p.nom?p.nom.charAt(0):'')).toUpperCase():'CF';

/* ---------- Accès par écran ---------- */
const CAN={
  accueil:()=>true, profil:()=>true, planning:()=>true,
  tableau:()=>isResp(me), equipe:()=>isResp(me), envois:()=>isResp(me), ventes:()=>isResp(me), parfums:()=>isResp(me),
  production:()=>isResp(me)||isLabo(me),
  boutiques:()=>isResp(me)||me.role==='vendeur'||me.role==='livreur',
  journee:()=>me.role==='vendeur', tournee:()=>me.role==='livreur'
};
function navItems(){
  if(isResp(me))return [['accueil','Accueil'],['tableau','Tableau de bord'],['planning','Planning'],['envois','Envois et réassorts'],['production','Production'],['ventes','Ventes du jour'],['parfums','Parfums'],['equipe','Équipe'],['boutiques','Points de vente']];
  if(isLabo(me))return [['accueil','Accueil'],['production','Production du jour'],['planning','Mon planning']];
  if(me.role==='vendeur')return [['accueil','Accueil'],['journee','Ma journée'],['planning','Mon planning'],['boutiques','Points de vente']];
  if(me.role==='livreur')return [['accueil','Accueil'],['tournee','Ma tournée'],['planning','Mon planning'],['boutiques','Points de vente']];
  return [['accueil','Accueil'],['planning','Mon planning']];
}

/* ---------- Modules de l'accueil ---------- */
const T=(name,desc,href,etape,badge)=>({name,desc,href,etape,badge});
const POLES=[
  {key:'resp_vente',title:'Vente',tiles:[T('Planning de l\'équipe','Qui travaille où, chaque jour','#planning'),T('Ventes du jour','Clôtures des boutiques','#ventes'),T('Points de vente','Adresses, horaires','#boutiques'),T('Commandes spéciales','Événements, entreprises, acomptes',null,5)]},
  {key:'resp_production',title:'Production',tiles:[T('Production du jour','Ce que le labo prépare','#production'),T('Parfums','Catalogue, prix, en vente ou non','#parfums'),T('Recettes et marges','Coût de revient par flan',null,3)]},
  {key:'*',title:'Pilotage',tiles:[T('Envois et réassorts','Livraisons du matin, réassorts signalés','#envois',null,'signale'),T('Tableau de bord','Vue d\'ensemble','#tableau'),T('Prévisions sur 7 jours','Production et équipe conseillées',null,3),T('Agenda','Dates importantes et événements',null,4)]},
  {key:'direction',title:'Admin et compta',tiles:[T('Comptes de l\'équipe','Invitations et rôles','#equipe'),T('Comptabilité','Recettes, dépenses, échéances',null,3),T('Heures et pointages','Préparation de la paie',null,4)]},
  {key:'resp_partenariats',title:'Partenariats et marketing',tiles:[T('Demandes reçues','Franchises, partenariats, pros',null,6),T('Réseau de franchises','Chiffres consolidés',null,6),T('Réseaux sociaux','Suivi du community manager',null,6)]}
];
const LABO_TILES=[T('Production du jour','Envois à préparer, réassorts','#production',null,'labo'),T('Mon planning','Mes horaires de la semaine','#planning'),T('Étapes de production','Cuisson, refroidissement, garnissage',null,3),T('Traçabilité HACCP','Lots, températures, DLC',null,3)];
const ROLE_TILES={
  chef_patissier:LABO_TILES, patissier:LABO_TILES,
  vendeur:[T('Ma journée','Réception, réassort, clôture','#journee',null,'reception'),T('Mon planning','Mes boutiques et horaires','#planning'),T('Points de vente','Adresses et horaires','#boutiques'),T('Commandes clients','Retraits click & collect',null,5)],
  livreur:[T('Ma tournée','Envois à livrer','#tournee',null,'tournee'),T('Mon planning','Mes horaires de la semaine','#planning'),T('Points de vente','Adresses et horaires','#boutiques')],
  cm:[T('Mon planning','Mes horaires de la semaine','#planning'),T('Réseaux sociaux','Statistiques et objectifs',null,6),T('Nouvelle publication','Préparer et programmer',null,6),T('Calendrier éditorial','Le mois en un coup d\'œil',null,6)]
};

/* ---------- Envois : statuts ---------- */
const STATUT={signale:['Signalé','b-gold'],valide:['À préparer','b-info'],pret:['Prêt au labo','b-good'],en_route:['En route','b-gold'],livre:['Livré','b-good'],refuse:['Refusé','b-bad']};
const STEPS=['valide','pret','en_route','livre'];
const STEP_LBL={valide:'Validé',pret:'Prêt',en_route:'En route',livre:'Livré'};

/* ---------- État ---------- */
let sb=null,user=null,me=null,loaded=false,channel=null;
let profiles=[],boutiques=[],invitations=[],parfums=[],planning=[],envois=[],clotures=[];
let route='accueil',day=todayISO(),authMode='login',justLoggedIn=false,recovering=false;
let ui={editShop:null,addShop:false,lastInvite:null,newEnvoi:false,editParfum:null,addParfum:false};
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
  if(/parfums_nom_key/i.test(m))return 'Un parfum porte déjà ce nom.';
  if(/duplicate key|already exists/i.test(m))return 'Cet élément existe déjà.';
  if(/row-level security|permission denied/i.test(m))return 'Tu n’as pas les droits pour faire ça.';
  if(/Failed to fetch|NetworkError|network/i.test(m))return 'Pas de connexion internet. Réessaie quand le réseau revient.';
  return m?m:'Une erreur est survenue. Réessaie.';
}
const shopName=id=>{const b=boutiques.find(x=>x.id===id);return b?b.nom:'?'};
const prof=id=>profiles.find(p=>p.id===id);
const parfum=id=>parfums.find(p=>p.id===id);
const sortLines=ls=>(ls||[]).slice().sort((a,b)=>((parfum(a.parfum_id)||{}).ordre||0)-((parfum(b.parfum_id)||{}).ordre||0));
const lineTotal=ls=>(ls||[]).reduce((a,l)=>a+(l.quantite||0),0);
function lieuLabel(p){return p.lieu==='boutique'?shopName(p.boutique_id):({labo:'Labo',tournee:'Tournée de livraison',bureau:'Bureau'}[p.lieu]||p.lieu)}
function roleOptions(sel,withNone){return (withNone?`<option value="aucun"${sel==='aucun'?' selected':''}>Choisir un rôle…</option>`:'')+ROLE_KEYS.map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(ROLES[k].label)}</option>`).join('')}
function setOffline(){$('#offline').hidden=navigator.onLine}
window.addEventListener('online',()=>{setOffline();if(user)loadAll()});
window.addEventListener('offline',setOffline);
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Message copié')}catch(e){toast('Sélectionne le texte et copie-le')}}
const sw=c=>`<span class="sw" style="background:${esc(c||'#ccc')}"></span>`;
function chipsOf(lines,key){key=key||'quantite';const ls=sortLines(lines).filter(l=>(l[key]||0)>0);return ls.length?`<div class="chips">${ls.map(l=>{const p=parfum(l.parfum_id)||{};return `<span class="chip">${sw(p.couleur)}${esc(p.nom||'?')} <b>${l[key]}</b></span>`}).join('')}</div>`:'<span class="meta">Aucune quantité</span>'}
function stepsOf(e){if(e.statut==='signale'||e.statut==='refuse')return `<span class="badge ${STATUT[e.statut][1]}">${STATUT[e.statut][0]}</span>`;const i=STEPS.indexOf(e.statut);return `<div class="steps">${STEPS.map((s,k)=>`<span class="${k<i?'done':k===i?'now':''}">${STEP_LBL[s]}</span>`).join('')}</div>`}
function dayNav(title){return `<div class="daynav" role="group" aria-label="Choisir le jour"><button class="iconbtn" type="button" data-act="day" data-d="-1" aria-label="Jour précédent">‹</button><b>${esc(title||fmtDay(day))}</b><button class="iconbtn" type="button" data-act="day" data-d="1" aria-label="Jour suivant">›</button>${day!==todayISO()?'<button class="btn ghost sm" type="button" data-act="day" data-d="0">Aujourd’hui</button>':''}</div>`}
function qtyGrid(prefix,values,list){values=values||{};return `<div class="qty">${list.map(p=>`<label title="${esc(p.nom)}">${sw(p.couleur)}<span>${esc(p.nom)}</span><input type="number" min="0" step="1" inputmode="numeric" id="${prefix}-${p.id}" value="${values[p.id]||''}" placeholder="0" aria-label="${esc(p.nom)}"></label>`).join('')}</div>`}
function readGrid(prefix,list){const out=[];list.forEach(p=>{const el=document.getElementById(prefix+'-'+p.id);const q=el?int(el.value):0;if(q)out.push({parfum_id:p.id,q})});return out}
const dispo=()=>parfums.filter(p=>p.disponible);
const counts=()=>({
  signale:envois.filter(e=>e.statut==='signale').length,
  labo:envois.filter(e=>e.statut==='valide').length,
  tournee:envois.filter(e=>e.livreur_id===me.id&&e.statut==='pret').length,
  reception:envois.filter(e=>e.statut==='en_route').length
});
const prixEntier=p=>p&&p.prix_entier!=null?+p.prix_entier:(p?4*(+p.prix_quart):0);
function caOf(c){return (c.cloture_lignes||[]).reduce((a,l)=>{const p=parfum(l.parfum_id);return a+(l.quarts_vendus||0)*(p?+p.prix_quart:0)+(l.entiers_vendus||0)*prixEntier(p)},0)}
function recuOf(boutiqueId){const r={};envois.filter(e=>e.boutique_id===boutiqueId&&e.statut==='livre').forEach(e=>(e.envoi_lignes||[]).forEach(l=>r[l.parfum_id]=(r[l.parfum_id]||0)+l.quantite));return r}

/* ---------- Écrans d'authentification ---------- */
function show(which){$('#auth').hidden=which!=='auth';$('#app').hidden=which!=='app'}
function setAuthMode(m,okMsg){
  authMode=m;
  const C={login:['Connexion','Connecte-toi avec l’adresse donnée par ton responsable.','Se connecter'],activate:['Activer mon compte','Utilise l’adresse à laquelle ton responsable t’a invité·e.','Créer mon compte'],reset:['Mot de passe oublié','Tu vas recevoir un lien pour en choisir un nouveau.','Recevoir le lien']}[m];
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
  const d0=day,d6=addDays(day,6);
  const [p,b,pf,pl,ev,cl]=await Promise.all([
    sb.from('profiles').select('*').order('created_at'),
    sb.from('boutiques').select('*').order('created_at'),
    sb.from('parfums').select('*').order('ordre'),
    sb.from('planning').select('*').gte('jour',d0).lte('jour',d6).order('jour').order('debut'),
    sb.from('envois').select('*, envoi_lignes(*)').eq('jour',d0).order('created_at'),
    sb.from('clotures').select('*, cloture_lignes(*)').eq('jour',d0)
  ]);
  if(p.error){toast(frErr(p.error));return}
  profiles=p.data||[];me=profiles.find(x=>x.id===user.id)||null;
  boutiques=b.data||[];parfums=pf.data||[];planning=pl.data||[];envois=ev.data||[];clotures=cl.data||[];
  if(pf.error&&/parfums/.test(pf.error.message||''))toast('Base pas à jour : lance etape2.sql dans Supabase.');
  if(isResp(me)){const i=await sb.from('invitations').select('*').order('created_at',{ascending:false});invitations=i.data||[]}else invitations=[];
  loaded=true;render();
}
let rT;const reload=()=>{clearTimeout(rT);rT=setTimeout(loadAll,300)};
function subscribe(){
  if(channel)sb.removeChannel(channel);
  channel=sb.channel('cdf');
  ['profiles','boutiques','invitations','parfums','planning','envois','envoi_lignes','clotures','cloture_lignes'].forEach(t=>channel.on('postgres_changes',{event:'*',schema:'public',table:t},reload));
  channel.subscribe();
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
function stopApp(){if(channel){sb.removeChannel(channel);channel=null}user=null;me=null;profiles=[];boutiques=[];invitations=[];parfums=[];planning=[];envois=[];clotures=[];loaded=false;locked=false;renderLock()}

/* ---------- Rendu ---------- */
const ROUTES=['accueil','tableau','planning','envois','production','ventes','parfums','equipe','boutiques','journee','tournee','profil'];
function readRoute(){const h=(location.hash||'#accueil').slice(1);route=ROUTES.includes(h)?h:'accueil'}
window.addEventListener('hashchange',()=>{readRoute();ui.editShop=null;ui.addShop=false;ui.newEnvoi=false;ui.editParfum=null;ui.addParfum=false;render();window.scrollTo({top:0})});

function render(){
  if(!user||!loaded)return;
  const main=$('#main'),nav=$('#nav');
  if(!me||!me.actif||me.role==='aucun'){nav.innerHTML='';$('#me').innerHTML='';main.innerHTML=waitView();return}
  if(!CAN[route]())route='accueil';
  nav.innerHTML=navItems().map(([k,l])=>`<a href="#${k}"${k===route?' aria-current="page"':''}>${esc(l)}</a>`).join('');
  $('#me').innerHTML=`<span class="avatar" aria-hidden="true">${esc(initials(me))}</span><span>${esc(displayName(me))}</span>`;
  if(locked&&!pinAction){main.innerHTML='';return}
  const V={accueil:homeView,tableau:dashView,planning:planningView,envois:envoisView,production:productionView,ventes:ventesView,parfums:parfumsView,equipe:teamView,boutiques:shopsView,journee:journeeView,tournee:tourneeView,profil:profileView};
  main.innerHTML=V[route]();
}

function waitView(){
  const inactive=me&&!me.actif;
  return `<div class="wait"><img src="icons/logo.png" alt="Le Comptoir du Flan"><h1>${inactive?'Compte désactivé':'Compte en attente'}</h1>
    <p style="margin:0;color:var(--muted)">${inactive?'Ton accès a été désactivé. Parle à un responsable si c’est une erreur.':'Ton compte est bien créé. Un responsable doit maintenant te donner un rôle pour que tu accèdes à l’appli.'}</p>
    <button class="btn ghost" type="button" data-act="logout">Se déconnecter</button></div>`;
}

/* --- Accueil --- */
function tileHTML(t,mine,c){
  if(t.etape)return `<div class="tile soon"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span><span class="badge b-mute" style="align-self:flex-start;margin-top:4px">Étape ${t.etape}</span></div>`;
  const n=t.badge?c[t.badge]:0;
  return `<a class="tile${mine?' mine':''}" href="${t.href}">${n?`<span class="count" aria-label="${n} nouveau(x)">${n}</span>`:''}<b>${esc(t.name)}</b><span>${esc(t.desc)}</span></a>`;
}
function myToday(){const t=todayISO();return planning.filter(p=>p.user_id===me.id&&p.jour===t)}
function homeView(){
  const c=counts(),hello=me.prenom?`Bonjour ${esc(me.prenom)}`:'Bonjour';
  let body='';
  if(isResp(me)){
    const owner=k=>{if(k==='*')return 'Tous les responsables';const p=profiles.find(x=>x.role===k&&x.actif);return p?displayName(p):roleShort(k)};
    const poles=POLES.slice().sort((a,b)=>(b.key===me.role)-(a.key===me.role));
    const alert=day===todayISO()&&c.signale?`<a class="banner" href="#envois" style="text-decoration:none"><span class="k">Réassort${c.signale>1?'s':''} à traiter</span><span class="v">${c.signale} demande${c.signale>1?'s':''} des boutiques</span><span class="s">Valide les quantités, préviens le labo et le livreur.</span></a>`:'';
    body=alert+poles.map(p=>{const mine=p.key===me.role;return `<section class="pole"><div class="pole-h"><h2>${esc(p.title)}</h2><span>${esc(owner(p.key))}${mine?' · ton pôle':''}</span></div><div class="tiles">${p.tiles.map(t=>tileHTML(t,mine,c)).join('')}</div></section>`}).join('');
  }else{
    const aff=myToday();
    const banner=aff.length?`<div class="banner"><span class="k">Aujourd’hui</span>${aff.map(a=>`<span class="v">${esc(lieuLabel(a))}</span><span class="s">${a.debut?hhmm(a.debut)+(a.fin?' – '+hhmm(a.fin):''):'Horaires à préciser'}${a.note?' · '+esc(a.note):''}</span>`).join('')}</div>`:`<div class="card"><span class="sub">Pas d’affectation prévue aujourd’hui.</span></div>`;
    const tiles=(ROLE_TILES[me.role]||[]).concat([T('Mon profil','Prénom, code PIN','#profil')]);
    body=banner+`<section class="pole"><div class="pole-h"><h2>Mon espace</h2><span>${esc(roleLabel(me.role))}</span></div><div class="tiles">${tiles.map(t=>tileHTML(t,false,c)).join('')}</div></section>`;
  }
  return `<div class="page"><div class="head"><div><h1>${hello}</h1><p>${esc(roleLabel(me.role))} · ${esc(fmtDay(todayISO()))}</p></div></div>${body}<p class="note">Les modules marqués « Étape » arrivent au fil des mises à jour.</p></div>`;
}

/* --- Tableau de bord --- */
function dashView(){
  const act=profiles.filter(p=>p.actif&&p.role!=='aucun');
  const waiting=profiles.filter(p=>p.role==='aucun'&&p.actif);
  const pend=invitations.filter(i=>!i.used_at);
  const shopsOn=boutiques.filter(b=>b.actif);
  const sent=envois.filter(e=>!['signale','refuse'].includes(e.statut));
  const flans=sent.reduce((a,e)=>a+lineTotal(e.envoi_lignes),0);
  const ca=clotures.reduce((a,c)=>a+caOf(c),0);
  const shopsToday=[...new Set(planning.filter(p=>p.jour===day&&p.lieu==='boutique').map(p=>p.boutique_id))];
  const closed=clotures.length;
  const c=counts();
  const cnt={};act.forEach(p=>cnt[p.role]=(cnt[p.role]||0)+1);
  const arr=ROLE_KEYS.filter(k=>cnt[k]).map(k=>[k,cnt[k]]);const max=Math.max(1,...arr.map(a=>a[1]));
  const todo=[];
  if(c.signale)todo.push(`<li><a href="#envois">${c.signale} réassort${c.signale>1?'s':''} à valider</a></li>`);
  if(waiting.length)todo.push(`<li><a href="#equipe">${waiting.length} compte${waiting.length>1?'s':''} à valider</a></li>`);
  const missing=shopsToday.filter(id=>!clotures.some(x=>x.boutique_id===id));
  if(day<=todayISO()&&missing.length)todo.push(`<li>Clôture manquante : ${missing.map(id=>esc(shopName(id))).join(', ')}</li>`);
  if(!planning.some(p=>p.jour===day))todo.push(`<li><a href="#planning">Planning du jour vide</a></li>`);
  if(pend.length)todo.push(`<li>${pend.length} invitation${pend.length>1?'s':''} pas encore utilisée${pend.length>1?'s':''}</li>`);
  return `<div class="page">
  <div class="head"><div><h1>Tableau de bord</h1><p>Équipe, envois et ventes</p></div>${dayNav()}</div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Chiffre d’affaires</span><span class="val num">${eur(ca)}</span><span class="hint">${closed} clôture${closed>1?'s':''} reçue${closed>1?'s':''}${shopsToday.length?' sur '+shopsToday.length:''}</span></div>
    <div class="card kpi"><span class="lbl">Flans envoyés</span><span class="val num">${flans}</span><span class="hint">${sent.length} envoi${sent.length>1?'s':''} · ${sent.filter(e=>e.type==='reassort').length} réassort${sent.filter(e=>e.type==='reassort').length>1?'s':''}</span></div>
    <div class="card kpi"><span class="lbl">Réassorts à valider</span><span class="val num">${c.signale}</span><span class="hint">${c.signale?'<a href="#envois">Traiter</a>':'Rien en attente'}</span></div>
    <div class="card kpi"><span class="lbl">Équipe active</span><span class="val num">${act.length}</span><span class="hint">${planning.filter(p=>p.jour===day).length} affectation${planning.filter(p=>p.jour===day).length>1?'s':''} ce jour</span></div>
  </section>
  <div class="grid g2">
    <section class="card"><h2>Ventes par point de vente</h2>
      ${clotures.length?`<div class="bars">${clotures.map(x=>[x,caOf(x)]).sort((a,b)=>b[1]-a[1]).map(([x,v],i,all)=>`<div class="bar" style="grid-template-columns:minmax(0,9rem) minmax(0,1fr) 5.5rem"><span class="name">${esc(shopName(x.boutique_id))}</span><span class="track"><span class="fill" style="display:block;width:${v/Math.max(1,all[0][1])*100}%"></span></span><span class="n num">${eur(v)}</span></div>`).join('')}</div>`:'<p class="empty">Aucune clôture pour ce jour.</p>'}
      <a class="link" href="#ventes">Détail des ventes</a></section>
    <div class="grid" style="gap:16px;align-content:start">
      <section class="card"><h2>À faire</h2>${todo.length?`<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px">${todo.join('')}</ul>`:'<p class="empty">Rien à signaler.</p>'}</section>
      <section class="card"><h2>Équipe par rôle</h2><div class="bars">${arr.map(([k,n])=>`<div class="bar"><span class="name">${esc(ROLES[k].label)}</span><span class="track"><span class="fill" style="display:block;width:${n/max*100}%"></span></span><span class="n num">${n}</span></div>`).join('')}</div></section>
    </div>
  </div></div>`;
}

/* --- Planning --- */
function planningView(){
  if(!isResp(me)){
    const mine=planning.filter(p=>p.user_id===me.id);
    const days=Array.from({length:7},(_,i)=>addDays(day,i));
    return `<div class="page"><div class="head"><div><h1>Mon planning</h1><p>Les 7 jours à partir du ${esc(fmtDay(day))}</p></div>${dayNav()}</div>
    <section class="card">${days.map(d=>{const a=mine.filter(p=>p.jour===d);return `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><b style="text-transform:capitalize">${esc(fmtDay(d))}</b><span>${a.length?a.map(x=>`${esc(lieuLabel(x))} · ${x.debut?hhmm(x.debut)+(x.fin?' – '+hhmm(x.fin):''):'horaires à préciser'}`).join('<br>'):'<span class="meta" style="color:var(--muted)">Repos</span>'}</span></div>`}).join('')}</section>
    <p class="note">Le planning est fait par les responsables. Une question : parle à ton responsable.</p></div>`;
  }
  const today=planning.filter(p=>p.jour===day);
  const actives=profiles.filter(p=>p.actif&&p.role!=='aucun');
  const busy=new Set(today.map(p=>p.user_id));
  const week=Array.from({length:7},(_,i)=>addDays(day,i));
  const lieuOpts=`<option value="labo">Labo</option><option value="tournee">Tournée de livraison</option><option value="bureau">Bureau</option>`+boutiques.filter(b=>b.actif).map(b=>`<option value="b:${b.id}">Boutique · ${esc(b.nom)}</option>`).join('');
  const groups=[['Boutiques',today.filter(p=>p.lieu==='boutique')],['Labo',today.filter(p=>p.lieu==='labo')],['Livraison',today.filter(p=>p.lieu==='tournee')],['Bureau',today.filter(p=>p.lieu==='bureau')]];
  return `<div class="page">
  <div class="head"><div><h1>Planning de l’équipe</h1><p>Chaque jour : qui travaille où, et à quelle heure</p></div>${dayNav()}</div>
  <div class="week" role="group" aria-label="Semaine">${week.map((d,i)=>{const n=planning.filter(p=>p.jour===d).length;const dt=parseISO(d);return `<button type="button" data-act="day" data-d="${i}"${i===0?' aria-current="date"':''}><span>${JOURS[dt.getDay()].slice(0,3)}.</span><b>${dt.getDate()}</b><span>${n} pers.</span></button>`}).join('')}</div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>${esc(fmtDay(day))}</h2>
      ${today.length?groups.filter(g=>g[1].length).map(([t,list])=>`<div><div class="meta" style="font-weight:700;margin:6px 0">${t}</div>${list.map(p=>{const u=prof(p.user_id);return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><div class="who"><span class="avatar">${esc(initials(u))}</span><span>${esc(displayName(u))}<small>${esc(lieuLabel(p))} · ${p.debut?hhmm(p.debut)+(p.fin?' – '+hhmm(p.fin):''):'horaires à préciser'}${p.note?' · '+esc(p.note):''}</small></span></div><button class="btn ghost sm" type="button" data-act="planDel" data-id="${p.id}">Retirer</button></div>`}).join('')}</div>`).join(''):'<p class="empty">Personne n’est planifié ce jour.</p>'}
      ${today.length?`<div class="btnrow"><button class="btn ghost sm" type="button" data-act="planCopy">Copier ce jour sur le lendemain</button></div>`:''}
    </section>
    <section class="card"><h2>Ajouter une affectation</h2>
      <form id="planForm" class="grid" style="gap:12px" novalidate>
        <label class="field">Membre<select id="plUser">${actives.map(p=>`<option value="${p.id}">${esc(displayName(p))} · ${esc(roleShort(p.role))}${busy.has(p.id)?' (déjà planifié)':''}</option>`).join('')}</select></label>
        <label class="field">Lieu<select id="plLieu">${lieuOpts}</select></label>
        <div class="row2"><label class="field">Début<input id="plDebut" type="time" value="09:00"></label><label class="field">Fin<input id="plFin" type="time" value="17:00"></label></div>
        <label class="field">Note<input id="plNote" placeholder="Ouverture, renfort…"></label>
        <p class="msg err" id="plErr" hidden></p>
        <button class="btn" type="submit">Ajouter au ${esc(fmtDay(day))}</button>
      </form>
      <p class="note">Les vendeurs n’ont pas de boutique fixe : c’est cette affectation qui leur ouvre la journée (réassort, clôture) de la boutique choisie.</p>
    </section>
  </div></div>`;
}

/* --- Envois et réassorts (responsables) --- */
function livreurSelect(id,sel){
  const livs=profiles.filter(p=>p.actif&&p.role==='livreur');
  const onTour=new Set(planning.filter(p=>p.jour===day&&p.lieu==='tournee').map(p=>p.user_id));
  if(!sel){const f=livs.find(l=>onTour.has(l.id));sel=f?f.id:''}
  return `<select class="inline-sel" id="${id}" aria-label="Livreur"><option value="">Sans livreur</option>${livs.map(l=>`<option value="${l.id}"${l.id===sel?' selected':''}>${esc(displayName(l))}${onTour.has(l.id)?' · en tournée':''}</option>`).join('')}</select>`;
}
function envoisView(){
  const sig=envois.filter(e=>e.statut==='signale');
  const flow=envois.filter(e=>e.statut!=='signale');
  const sigHTML=sig.length?sig.map(e=>{const by=prof(e.signale_par);return `<div class="envoi${e.urgent?' hot':''}">
      <div class="envoi-h"><span><b>${esc(shopName(e.boutique_id))}</b><span class="meta"> · réassort signalé à ${timeOf(e.created_at)} par ${esc(displayName(by))}</span></span>${e.urgent?'<span class="badge b-bad">Urgent</span>':''}</div>
      ${e.note?`<span style="font-size:14px">« ${esc(e.note)} »</span>`:''}
      <div class="qty">${sortLines(e.envoi_lignes).map(l=>{const p=parfum(l.parfum_id)||{};return `<label>${sw(p.couleur)}<span>${esc(p.nom)} <small style="color:var(--muted)">(demandé ${l.demande??l.quantite})</small></span><input type="number" min="0" inputmode="numeric" id="rv-${l.id}" value="${l.quantite}" aria-label="${esc(p.nom)}"></label>`}).join('')}</div>
      <div class="btnrow">${livreurSelect('rvl-'+e.id,null)}<button class="btn sm" type="button" data-act="rValider" data-id="${e.id}">Valider : labo + livreur</button><button class="btn danger sm" type="button" data-act="rRefuser" data-id="${e.id}">Refuser</button></div>
    </div>`}).join(''):'<p class="empty">Aucun réassort en attente.</p>';
  const flowHTML=flow.length?flow.map(e=>{const l=prof(e.livreur_id);return `<div class="envoi">
      <div class="envoi-h"><span><b>${esc(shopName(e.boutique_id))}</b> <span class="badge ${e.type==='reassort'?'b-gold':'b-mute'}">${e.type==='reassort'?'Réassort':'Livraison du matin'}</span></span><span class="meta">${lineTotal(e.envoi_lignes)} flans · ${l?esc(displayName(l)):'sans livreur'}</span></div>
      ${chipsOf(e.envoi_lignes)}${stepsOf(e)}
      <div class="btnrow"><label class="meta">Statut <select class="inline-sel" data-act="setStatut" data-id="${e.id}">${['valide','pret','en_route','livre','refuse'].map(s=>`<option value="${s}"${s===e.statut?' selected':''}>${STATUT[s][0]}</option>`).join('')}</select></label>
      <label class="meta">Livreur ${livreurSelect('fl-'+e.id,e.livreur_id||'none').replace('class="inline-sel"','class="inline-sel" data-act="setLivreur" data-id="'+e.id+'"')}</label>
      <button class="btn ghost sm" type="button" data-act="envoiDel" data-id="${e.id}">Supprimer</button></div>
    </div>`}).join(''):'<p class="empty">Aucun envoi prévu ce jour.</p>';
  const form=ui.newEnvoi?`<section class="card"><h2>Nouvel envoi</h2><form id="envoiForm" class="grid" style="gap:12px" novalidate>
      <div class="row2"><label class="field">Point de vente<select id="neShop">${boutiques.filter(b=>b.actif).map(b=>`<option value="${b.id}">${esc(b.nom)}</option>`).join('')}</select></label>
      <label class="field">Type<select id="neType"><option value="matin">Livraison du matin</option><option value="reassort">Réassort</option></select></label></div>
      <label class="field">Livreur${livreurSelect('neLiv',null).replace('class="inline-sel"','class="inline-sel" style="min-height:48px;border-radius:12px"')}</label>
      <div class="field">Quantités (flans entiers)${qtyGrid('ne',{},dispo())}</div>
      <label class="field">Note<input id="neNote" placeholder="Facultatif"></label>
      <p class="msg err" id="neErr" hidden></p>
      <div class="btnrow"><button class="btn" type="submit">Envoyer au labo</button><button class="btn ghost sm" type="button" data-act="newEnvoi">Annuler</button></div>
    </form></section>`:'';
  return `<div class="page">
  <div class="head"><div><h1>Envois et réassorts</h1><p>Le vendeur signale, tu décides, le labo prépare, le livreur livre.</p></div>${dayNav()}</div>
  <section class="card"><h2>Réassorts signalés <span class="badge ${sig.length?'b-bad':'b-mute'}">${sig.length}</span></h2>${sigHTML}</section>
  ${form}
  <section class="card"><div class="envoi-h"><h2>Suivi des envois</h2>${ui.newEnvoi?'':'<button class="btn sm" type="button" data-act="newEnvoi">+ Préparer un envoi</button>'}</div>${flowHTML}</section>
  </div>`;
}

/* --- Production du jour (labo + responsables) --- */
function productionView(){
  const act=envois.filter(e=>['valide','pret','en_route','livre'].includes(e.statut));
  const todo=act.filter(e=>e.statut==='valide');
  const tot={},rest={};act.forEach(e=>(e.envoi_lignes||[]).forEach(l=>{tot[l.parfum_id]=(tot[l.parfum_id]||0)+l.quantite;if(e.statut==='valide')rest[l.parfum_id]=(rest[l.parfum_id]||0)+l.quantite}));
  const ids=Object.keys(tot).sort((a,b)=>((parfum(a)||{}).ordre||0)-((parfum(b)||{}).ordre||0));
  const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
  return `<div class="page">
  <div class="head"><div><h1>Production du jour</h1><p>${sum(rest)} flans encore à préparer · ${sum(tot)} au total</p></div>${dayNav()}</div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>À préparer <span class="badge ${todo.length?'b-info':'b-mute'}">${todo.length}</span></h2>
      ${todo.length?todo.sort((a,b)=>(b.type==='reassort')-(a.type==='reassort')||(b.urgent-a.urgent)).map(e=>`<div class="envoi${e.type==='reassort'?' hot':''}">
        <div class="envoi-h"><span><b>${esc(shopName(e.boutique_id))}</b> ${e.type==='reassort'?'<span class="badge b-bad">Réassort'+(e.urgent?' urgent':'')+'</span>':'<span class="badge b-mute">Livraison du matin</span>'}</span><span class="meta">${lineTotal(e.envoi_lignes)} flans</span></div>
        ${chipsOf(e.envoi_lignes)}${e.note?`<span class="meta">${esc(e.note)}</span>`:''}
        <div class="btnrow"><button class="btn sm" type="button" data-act="pret" data-id="${e.id}">C’est prêt</button><span class="meta">${e.livreur_id?'Livreur : '+esc(displayName(prof(e.livreur_id))):'Livreur pas encore choisi'}</span></div></div>`).join(''):'<p class="empty">Rien à préparer pour l’instant.</p>'}
    </section>
    <section class="card"><h2>Total par parfum</h2>
      ${ids.length?`<div class="tbl-wrap"><table class="ptable" style="min-width:0"><thead><tr><th>Parfum</th><th>Reste</th><th>Total</th></tr></thead><tbody>${ids.map(id=>{const p=parfum(id)||{};return `<tr><td>${sw(p.couleur)} ${esc(p.nom)}</td><td class="num"><b>${rest[id]||0}</b></td><td class="num">${tot[id]}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="empty">Aucun envoi validé ce jour.</p>'}
      <p class="note">Quantités en flans entiers. Les envois déjà prêts restent comptés dans le total.</p>
    </section>
  </div></div>`;
}

/* --- Ma journée (vendeur) --- */
function journeeView(){
  const aff=planning.filter(p=>p.user_id===me.id&&p.jour===day&&p.lieu==='boutique');
  if(!aff.length)return `<div class="page"><div class="head"><div><h1>Ma journée</h1><p>${esc(fmtDay(day))}</p></div>${dayNav()}</div><section class="card"><h2>Pas d’affectation en boutique</h2><p class="sub">Les responsables ne t’ont pas encore affecté à une boutique ce jour-là. Regarde <a href="#planning">ton planning</a>.</p></section></div>`;
  const a=aff[0],B=a.boutique_id,isToday=day===todayISO();
  const mine=envois.filter(e=>e.boutique_id===B);
  const enRoute=mine.filter(e=>e.statut==='en_route');
  const others=mine.filter(e=>e.statut!=='en_route');
  const recu=recuOf(B);
  const cl=clotures.find(c=>c.boutique_id===B);
  const clv={};(cl&&cl.cloture_lignes||[]).forEach(l=>clv[l.parfum_id]=l);
  const list=parfums.filter(p=>p.disponible||recu[p.id]||clv[p.id]);
  return `<div class="page">
  <div class="head"><div><h1>${esc(shopName(B))}</h1><p>Ma journée · ${esc(fmtDay(day))}${a.debut?' · '+hhmm(a.debut)+(a.fin?' – '+hhmm(a.fin):''):''}</p></div>${dayNav()}</div>
  ${aff.length>1?`<p class="note">Tu as plusieurs affectations ce jour : l’appli affiche la première (${esc(shopName(B))}).</p>`:''}
  ${enRoute.length?`<section class="card" style="border-color:var(--gold)"><h2>Livraison en route</h2>${enRoute.map(e=>`<div class="envoi"><div class="envoi-h"><b>${e.type==='reassort'?'Réassort':'Livraison du matin'}</b><span class="meta">${lineTotal(e.envoi_lignes)} flans · ${esc(displayName(prof(e.livreur_id)))}</span></div>${chipsOf(e.envoi_lignes)}<button class="btn" type="button" data-act="recu" data-id="${e.id}">J’ai bien reçu</button></div>`).join('')}</section>`:''}
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Signaler un réassort</h2>
      ${isToday?`<form id="reassortForm" class="grid" style="gap:12px" novalidate data-boutique="${B}">
        <p class="sub">Indique ce qu’il te manque (en flans entiers). Un responsable valide, puis le labo prépare et le livreur t’apporte.</p>
        ${qtyGrid('ra',{},dispo())}
        <label class="check"><input type="checkbox" id="raUrgent">C’est urgent (rupture en cours)</label>
        <label class="field">Message<input id="raNote" placeholder="Ex. : plus de vanille, gros rush"></label>
        <p class="msg err" id="raErr" hidden></p>
        <button class="btn" type="submit">Envoyer la demande</button></form>`:'<p class="sub">Les réassorts se signalent le jour même.</p>'}
    </section>
    <section class="card"><h2>Suivi des envois</h2>
      ${others.length?others.map(e=>`<div class="envoi"><div class="envoi-h"><b>${e.type==='reassort'?'Réassort':'Livraison du matin'}</b>${e.statut==='signale'?'<span class="badge b-gold">En attente d’un responsable</span>':''}</div>${chipsOf(e.envoi_lignes,e.statut==='signale'?'demande':'quantite')}${stepsOf(e)}</div>`).join(''):'<p class="empty">Aucun envoi pour ta boutique ce jour.</p>'}
    </section>
  </div>
  <section class="card"><h2>Clôture de la journée ${cl?`<span class="badge b-good">Enregistrée à ${timeOf(cl.updated_at)}</span>`:''}</h2>
    <p class="sub">Pour chaque parfum : parts (quarts) vendues, flans entiers vendus, parts restantes en fin de journée.</p>
    <form id="clotureForm" data-boutique="${B}" novalidate>
      <div class="tbl-wrap"><table class="ptable"><thead><tr><th>Parfum</th><th>Reçu</th><th>Quarts vendus</th><th>Entiers vendus</th><th>Quarts invendus</th></tr></thead><tbody>
      ${list.map(p=>{const v=clv[p.id]||{};return `<tr><td>${sw(p.couleur)} ${esc(p.nom)}</td><td class="num">${recu[p.id]?recu[p.id]+' flans':'–'}</td><td><input type="number" min="0" inputmode="numeric" id="cq-${p.id}" value="${v.quarts_vendus||''}" placeholder="0" aria-label="${esc(p.nom)} quarts vendus"></td><td><input type="number" min="0" inputmode="numeric" id="ce-${p.id}" value="${v.entiers_vendus||''}" placeholder="0" aria-label="${esc(p.nom)} entiers vendus"></td><td><input type="number" min="0" inputmode="numeric" id="ci-${p.id}" value="${v.quarts_invendus||''}" placeholder="0" aria-label="${esc(p.nom)} quarts invendus"></td></tr>`}).join('')}
      </tbody></table></div>
      <label class="field" style="margin-top:12px">Remarque<input id="clNote" value="${esc(cl&&cl.note||'')}" placeholder="Météo, affluence, incident…"></label>
      <p class="msg err" id="clErr" hidden style="margin-top:10px"></p>
      <div class="btnrow" style="margin-top:12px"><button class="btn" type="submit">${cl?'Mettre à jour la clôture':'Enregistrer la clôture'}</button></div>
    </form>
  </section></div>`;
}

/* --- Ma tournée (livreur) --- */
function tourneeView(){
  const mine=envois.filter(e=>e.livreur_id===me.id);
  const order={pret:0,valide:1,en_route:2,livre:3};
  return `<div class="page">
  <div class="head"><div><h1>Ma tournée</h1><p>${mine.length} envoi${mine.length>1?'s':''} · ${mine.reduce((a,e)=>a+lineTotal(e.envoi_lignes),0)} flans</p></div>${dayNav()}</div>
  ${mine.length?mine.slice().sort((a,b)=>(order[a.statut]??9)-(order[b.statut]??9)).map(e=>{const b=boutiques.find(x=>x.id===e.boutique_id)||{};return `<div class="envoi${e.type==='reassort'&&e.statut==='pret'?' hot':''}">
    <div class="envoi-h"><span><b>${esc(b.nom||'?')}</b> <span class="badge ${e.type==='reassort'?'b-bad':'b-mute'}">${e.type==='reassort'?'Réassort':'Livraison du matin'}</span></span><span class="meta">${lineTotal(e.envoi_lignes)} flans</span></div>
    <span class="meta">${esc([b.adresse,b.ville].filter(Boolean).join(' · ')||'Adresse à compléter')}${b.horaires?' · '+esc(b.horaires):''}</span>
    ${chipsOf(e.envoi_lignes)}${stepsOf(e)}
    ${e.statut==='pret'?`<button class="btn" type="button" data-act="parti" data-id="${e.id}">Je pars avec cet envoi</button>`:e.statut==='valide'?'<span class="meta">En préparation au labo.</span>':e.statut==='en_route'?'<span class="meta">Le vendeur confirme la réception à ton arrivée.</span>':''}
  </div>`}).join(''):'<section class="card"><p class="empty">Aucun envoi pour toi ce jour.</p></section>'}
  </div>`;
}

/* --- Ventes du jour (responsables) --- */
function ventesView(){
  const shops=boutiques.filter(b=>b.actif);
  const rows=shops.map(b=>{const c=clotures.find(x=>x.boutique_id===b.id);const ls=c?c.cloture_lignes||[]:[];
    const q=ls.reduce((a,l)=>a+(l.quarts_vendus||0),0),e=ls.reduce((a,l)=>a+(l.entiers_vendus||0),0),i=ls.reduce((a,l)=>a+(l.quarts_invendus||0),0);
    const recu=Object.values(recuOf(b.id)).reduce((a,v)=>a+v,0);
    const vend=planning.filter(p=>p.jour===day&&p.lieu==='boutique'&&p.boutique_id===b.id).map(p=>displayName(prof(p.user_id)));
    return {b,c,q,e,i,recu,ca:c?caOf(c):0,taux:recu?Math.round(i/(recu*4)*1000)/10:null,vend};});
  const T=rows.reduce((a,r)=>({ca:a.ca+r.ca,q:a.q+r.q,e:a.e+r.e,i:a.i+r.i,recu:a.recu+r.recu}),{ca:0,q:0,e:0,i:0,recu:0});
  return `<div class="page">
  <div class="head"><div><h1>Ventes du jour</h1><p>${rows.filter(r=>r.c).length} clôture${rows.filter(r=>r.c).length>1?'s':''} sur ${rows.filter(r=>r.vend.length||r.c).length||shops.length} boutique${shops.length>1?'s':''} ouvertes</p></div>${dayNav()}</div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Chiffre d’affaires</span><span class="val num">${eur(T.ca)}</span><span class="hint">calculé avec les prix des parfums</span></div>
    <div class="card kpi"><span class="lbl">Quarts vendus</span><span class="val num">${T.q}</span><span class="hint">+ ${T.e} flan${T.e>1?'s':''} entier${T.e>1?'s':''}</span></div>
    <div class="card kpi"><span class="lbl">Quarts invendus</span><span class="val num">${T.i}</span><span class="hint">${T.recu?Math.round(T.i/(T.recu*4)*1000)/10+' % du reçu':'—'}</span></div>
    <div class="card kpi"><span class="lbl">Flans livrés</span><span class="val num">${T.recu}</span><span class="hint">réceptions confirmées</span></div>
  </section>
  <section class="card"><h2>Par point de vente</h2><div class="tbl-wrap"><table><thead><tr><th>Point de vente</th><th>Vendeur</th><th>CA</th><th>Quarts</th><th>Entiers</th><th>Invendus</th><th>Taux</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${esc(r.b.nom)}</b></td><td>${r.vend.length?esc(r.vend.join(', ')):'<span class="meta" style="color:var(--muted)">—</span>'}</td><td class="num">${r.c?eur(r.ca):'<span class="badge '+(r.vend.length?'b-bad':'b-mute')+'">'+(r.vend.length?'Pas clôturé':'Fermé ?')+'</span>'}</td><td class="num">${r.c?r.q:''}</td><td class="num">${r.c?r.e:''}</td><td class="num">${r.c?r.i:''}</td><td class="num">${r.taux!=null&&r.c?r.taux+' %':''}</td></tr>`).join('')}
    <tr class="total"><td>Total</td><td></td><td class="num">${eur(T.ca)}</td><td class="num">${T.q}</td><td class="num">${T.e}</td><td class="num">${T.i}</td><td></td></tr>
  </tbody></table></div></section>
  ${clotures.filter(c=>c.note).length?`<section class="card"><h2>Remarques des vendeurs</h2>${clotures.filter(c=>c.note).map(c=>`<p style="margin:0;font-size:14px"><b>${esc(shopName(c.boutique_id))}</b> : ${esc(c.note)}</p>`).join('')}</section>`:''}
  </div>`;
}

/* --- Parfums (responsables) --- */
function parfumForm(p){
  p=p||{nom:'',prix_quart:8,prix_entier:'',couleur:'#C9A24A',disponible:true};
  return `<form class="grid" style="gap:10px" data-parfumform="${p.id||'new'}" novalidate>
    <label class="field">Nom<input name="nom" value="${esc(p.nom)}"></label>
    <div class="row2"><label class="field">Prix du quart (€)<input name="prix_quart" type="number" step="0.10" min="0" inputmode="decimal" value="${p.prix_quart}"></label><label class="field">Prix de l’entier (€)<input name="prix_entier" type="number" step="0.10" min="0" inputmode="decimal" value="${p.prix_entier??''}" placeholder="À définir"></label></div>
    <div class="row2"><label class="field">Couleur<input name="couleur" type="color" value="${esc(p.couleur)}" style="padding:4px"></label><label class="field">Statut<select name="disponible"><option value="1"${p.disponible?' selected':''}>En vente</option><option value="0"${p.disponible?'':' selected'}>Pas en vente</option></select></label></div>
    <p class="msg err" hidden></p>
    <div class="btnrow"><button class="btn sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-act="cancelParfum">Annuler</button></div></form>`;
}
function parfumsView(){
  const on=parfums.filter(p=>p.disponible).length;
  return `<div class="page">
  <div class="head"><div><h1>Parfums</h1><p>${on} en vente · ${parfums.length-on} pas en vente</p></div>${ui.addParfum?'':'<button class="btn sm" type="button" data-act="addParfum">+ Ajouter un parfum</button>'}</div>
  ${ui.addParfum?`<section class="card"><h2>Nouveau parfum</h2>${parfumForm(null)}</section>`:''}
  <div class="parfums">${parfums.map(p=>ui.editParfum===p.id?`<div class="parfum"><div class="bandeau" style="background:${esc(p.couleur)}"></div><div class="in">${parfumForm(p)}</div></div>`:`<div class="parfum${p.disponible?'':' off'}"><div class="bandeau" style="background:${esc(p.couleur)}"></div><div class="in">
    <div class="envoi-h"><b>${esc(p.nom)}</b><span class="badge ${p.disponible?'b-good':'b-mute'}">${p.disponible?'En vente':'Pas en vente'}</span></div>
    <span class="meta">Quart ${eur(p.prix_quart)} · entier ${p.prix_entier!=null?eur(p.prix_entier):'<span class="badge b-gold">à définir</span>'}</span>
    <div class="btnrow" style="margin-top:auto"><button class="btn ghost sm" type="button" data-act="editParfum" data-id="${p.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="toggleParfum" data-id="${p.id}">${p.disponible?'Retirer de la vente':'Remettre en vente'}</button></div>
  </div></div>`).join('')}</div>
  <p class="note">Seuls les parfums « en vente » apparaissent dans les réassorts et les envois. Le prix de l’entier « à définir » est compté à 4 quarts dans le chiffre d’affaires.</p></div>`;
}

/* --- Équipe --- */
function teamView(){
  const waiting=profiles.filter(p=>p.role==='aucun'&&p.actif);
  const pend=invitations.filter(i=>!i.used_at);
  const team=profiles.filter(p=>p.role!=='aucun'||!p.actif);
  const L=ui.lastInvite;
  const msg=L?`Bonjour,\nTu es invité·e dans l'appli de l'équipe du Comptoir du Flan (${roleLabel(L.role)}).\n1. Ouvre : ${APP_URL}\n2. Choisis « Activer mon compte »\n3. Utilise cette adresse : ${L.email}`:'';
  return `<div class="page">
  <div class="head"><div><h1>Comptes de l’équipe</h1><p>Inviter, donner un rôle, désactiver un accès</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Inviter quelqu’un</h2>
      <form id="inviteForm" class="grid" style="gap:12px" novalidate>
        <label class="field">Adresse e-mail<input id="iEmail" type="email" autocomplete="off" placeholder="prenom@exemple.fr"></label>
        <label class="field">Rôle<select id="iRole">${roleOptions('vendeur')}</select></label>
        <p class="msg err" id="iErr" hidden></p>
        <button class="btn" type="submit">Créer l’invitation</button>
      </form>
      ${L?`<div class="grid" style="gap:8px"><b style="font-size:14px">Message à envoyer (SMS, WhatsApp, mail)</b><div class="copybox" id="inviteText">${esc(msg)}</div><button class="btn ghost sm" type="button" data-act="copyInvite">Copier le message</button></div>`:''}
      <p class="note">Le prénom apparaît seulement quand la personne active son compte. Les boutiques et horaires se donnent jour par jour dans le Planning.</p>
    </section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Comptes à valider <span class="badge ${waiting.length?'b-gold':'b-mute'}">${waiting.length}</span></h2>
        <p class="sub">Personnes inscrites sans invitation : donne-leur un rôle pour ouvrir leur accès.</p>
        ${waiting.length?waiting.map(p=>`<div class="grid" style="gap:8px;padding:10px 0;border-top:1px solid var(--cream)">
          <div class="who"><span class="avatar">${esc(initials(p))}</span><span>${esc(p.prenom?p.prenom+' '+(p.nom||''):'Sans prénom')}<small>${esc(p.email)}</small></span></div>
          <select class="inline-sel" id="w-role-${p.id}" aria-label="Rôle">${roleOptions('aucun',true)}</select>
          <div class="btnrow"><button class="btn sm" type="button" data-act="approve" data-id="${p.id}">Valider</button><button class="btn sm danger" type="button" data-act="toggle" data-id="${p.id}">Refuser l’accès</button></div></div>`).join(''):'<p class="empty">Aucun compte en attente.</p>'}
      </section>
      <section class="card"><h2>Invitations en attente <span class="badge b-mute">${pend.length}</span></h2>
        ${pend.length?pend.map(i=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span style="min-width:0;overflow-wrap:anywhere">${esc(i.email)}<small style="display:block;color:var(--muted);font-size:12px">${esc(roleLabel(i.role))}</small></span><button class="btn ghost sm" type="button" data-act="delInvite" data-email="${esc(i.email)}">Annuler</button></div>`).join(''):'<p class="empty">Aucune invitation en attente.</p>'}
      </section>
    </div>
  </div>
  <section class="card"><h2>Équipe <span class="badge b-mute">${team.filter(p=>p.actif).length} actif${team.filter(p=>p.actif).length>1?'s':''}</span></h2>
    <div class="tbl-wrap"><table style="min-width:480px"><thead><tr><th>Membre</th><th>Rôle</th><th>Accès</th></tr></thead><tbody>
    ${team.map(p=>{const self=p.id===me.id;return `<tr><td><div class="who"><span class="avatar" aria-hidden="true">${esc(initials(p))}</span><span>${esc(displayName(p))}${self?' (toi)':''}<small>${esc(p.email)}</small></span></div></td>
      <td><select data-act="setRole" data-id="${p.id}" aria-label="Rôle"${self?' disabled':''}>${roleOptions(p.role)}</select></td>
      <td>${self?'<span class="badge b-good">Actif</span>':`<button class="btn sm ${p.actif?'ghost':''}" type="button" data-act="toggle" data-id="${p.id}">${p.actif?'Désactiver':'Réactiver'}</button>`}</td></tr>`}).join('')}
    </tbody></table></div></section></div>`;
}

/* --- Points de vente --- */
function shopForm(b){
  b=b||{nom:'',ville:'',adresse:'',zone:'montpellier',horaires:''};
  return `<form class="grid" style="gap:10px" data-shopform="${b.id||'new'}" novalidate>
    <label class="field">Nom<input name="nom" value="${esc(b.nom)}"></label>
    <label class="field">Adresse<input name="adresse" value="${esc(b.adresse||'')}" placeholder="N° et rue"></label>
    <label class="field">Ville<input name="ville" value="${esc(b.ville||'')}"></label>
    <label class="field">Zone<select name="zone"><option value="montpellier"${b.zone==='montpellier'?' selected':''}>Zone Montpellier</option><option value="hors"${b.zone==='hors'?' selected':''}>Hors Montpellier</option></select></label>
    <label class="field">Horaires<input name="horaires" value="${esc(b.horaires||'')}" placeholder="Lun–sam 10h–20h"></label>
    <p class="msg err" hidden></p>
    <div class="btnrow"><button class="btn sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-act="cancelShop">Annuler</button></div></form>`;
}
function shopsView(){
  const can=isResp(me),list=boutiques.filter(b=>can||b.actif);
  return `<div class="page">
  <div class="head"><div><h1>${list.filter(b=>b.actif).length} points de vente</h1><p>Montpellier et alentours, Nîmes, Béziers, Marseille</p></div>${can&&!ui.addShop?'<button class="btn sm" type="button" data-act="addShop">+ Ajouter un point de vente</button>':''}</div>
  ${ui.addShop?`<section class="card"><h2>Nouveau point de vente</h2>${shopForm(null)}</section>`:''}
  <div class="shops">${list.map(b=>ui.editShop===b.id?`<div class="shop">${shopForm(b)}</div>`:`<div class="shop${b.actif?'':' off'}">
    <div class="shop-h"><b>${esc(b.nom)}</b><span class="badge ${b.zone==='montpellier'?'b-gold':'b-info'}">${b.zone==='montpellier'?'Zone Montpellier':'Hors Montpellier'}</span></div>
    <span class="meta">${esc([b.adresse,b.ville].filter(Boolean).join(' · '))}</span>
    <span style="font-size:14px">${b.horaires?esc(b.horaires):'<span class="badge b-bad">Horaires à compléter</span>'}</span>
    ${b.actif?'':'<span class="meta">Désactivé</span>'}
    ${can?`<div class="actions"><button class="btn ghost sm" type="button" data-act="editShop" data-id="${b.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="toggleShop" data-id="${b.id}">${b.actif?'Désactiver':'Réactiver'}</button></div>`:''}
  </div>`).join('')}</div></div>`;
}

/* --- Profil --- */
function profileView(){
  return `<div class="page">
  <div class="head"><div><h1>Mon profil</h1><p>${esc(roleLabel(me.role))}</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Mes informations</h2>
      <form id="profileForm" class="grid" style="gap:12px" novalidate>
        <div class="row2"><label class="field">Prénom<input id="pPrenom" value="${esc(me.prenom||'')}" autocomplete="given-name"></label><label class="field">Nom<input id="pNom" value="${esc(me.nom||'')}" autocomplete="family-name"></label></div>
        <label class="field">Adresse e-mail<input value="${esc(me.email)}" disabled></label>
        <button class="btn" type="submit">Enregistrer</button></form>
      <p class="note">Ton rôle est géré par les responsables.</p></section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Code PIN</h2>
        <p class="sub">${pinRec?`Code à ${pinRec.len} chiffres actif sur cet appareil. Il est demandé à l’ouverture et après 2 minutes en arrière-plan.`:'Avec un code PIN, tu ouvres l’appli sur ce téléphone sans retaper ton mot de passe.'}</p>
        <div class="btnrow">${pinRec?'<button class="btn ghost sm" type="button" data-act="pinChange">Changer le PIN</button><button class="btn ghost sm" type="button" data-act="pinOff">Désactiver</button><button class="btn ghost sm" type="button" data-act="lock">Verrouiller maintenant</button>':'<button class="btn sm" type="button" data-act="pinOn">Activer un code PIN</button>'}</div></section>
      <section class="card"><h2>Session</h2><button class="btn ghost" type="button" data-act="logout">Se déconnecter</button></section>
    </div></div></div>`;
}

/* ---------- Actions ---------- */
async function act(fn,okMsg){try{const r=await fn();if(r&&r.error)throw r.error;if(okMsg)toast(okMsg);reload();return true}catch(e){toast(frErr(e));return false}}
function armed(t,label){if(t.dataset.armed)return true;t.dataset.armed='1';const old=t.textContent;t.textContent=label||'Confirmer ?';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;t.textContent=old}},3500);return false}
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('button');if(!t)return;
  if(t.dataset.key)return press(t.dataset.key);
  if(t.id==='lockAlt'){if(pinAction)return unlockNow();locked=false;renderLock();await sb.auth.signOut();return}
  if(t.id==='toActivate')return setAuthMode(authMode==='login'?'activate':'login');
  if(t.id==='toReset')return setAuthMode('reset');
  const a=t.dataset.act,id=t.dataset.id;if(!a)return;
  switch(a){
    case 'logout':await sb.auth.signOut();return;
    case 'day':{const d=t.dataset.d;day=d==='0'?todayISO():addDays(day,+d);loaded=true;render();loadAll();return}
    case 'copyInvite':{const el=$('#inviteText');if(el)copyText(el.textContent);return}
    case 'delInvite':return act(()=>sb.from('invitations').delete().eq('email',t.dataset.email),'Invitation annulée');
    case 'approve':{const r=$('#w-role-'+id).value;if(r==='aucun')return toast('Choisis d’abord un rôle');return act(()=>sb.from('profiles').update({role:r}).eq('id',id),'Accès ouvert')}
    case 'toggle':{const p=prof(id);if(!p)return;if(p.actif&&!armed(t))return;return act(()=>sb.from('profiles').update({actif:!p.actif}).eq('id',id),p.actif?'Accès désactivé':'Accès réactivé')}
    case 'addShop':ui.addShop=true;ui.editShop=null;return render();
    case 'editShop':ui.editShop=id;ui.addShop=false;return render();
    case 'cancelShop':ui.editShop=null;ui.addShop=false;return render();
    case 'toggleShop':{const b=boutiques.find(x=>x.id===id);if(!b)return;return act(()=>sb.from('boutiques').update({actif:!b.actif}).eq('id',id),b.actif?'Point de vente désactivé':'Point de vente réactivé')}
    case 'addParfum':ui.addParfum=true;ui.editParfum=null;return render();
    case 'editParfum':ui.editParfum=id;ui.addParfum=false;return render();
    case 'cancelParfum':ui.editParfum=null;ui.addParfum=false;return render();
    case 'toggleParfum':{const p=parfum(id);if(!p)return;return act(()=>sb.from('parfums').update({disponible:!p.disponible}).eq('id',id),p.disponible?'Retiré de la vente':'Remis en vente')}
    case 'planDel':return act(()=>sb.from('planning').delete().eq('id',id),'Affectation retirée');
    case 'planCopy':{
      const next=addDays(day,1),src=planning.filter(p=>p.jour===day);
      const exist=planning.filter(p=>p.jour===next);
      const rows=src.filter(s=>!exist.some(e=>e.user_id===s.user_id&&e.lieu===s.lieu&&e.boutique_id===s.boutique_id)).map(s=>({jour:next,user_id:s.user_id,lieu:s.lieu,boutique_id:s.boutique_id,debut:s.debut,fin:s.fin,note:s.note}));
      if(!rows.length)return toast('Le lendemain a déjà ces affectations');
      return act(()=>sb.from('planning').insert(rows),rows.length+' affectation(s) copiée(s) sur '+fmtDay(next));
    }
    case 'newEnvoi':ui.newEnvoi=!ui.newEnvoi;return render();
    case 'rValider':{
      const e=envois.find(x=>x.id===id);if(!e)return;
      const lines=e.envoi_lignes||[];
      const vals=lines.map(l=>({l,q:int(document.getElementById('rv-'+l.id)?.value)}));
      if(!vals.some(v=>v.q))return toast('Mets au moins une quantité, ou refuse la demande');
      const liv=$('#rvl-'+id).value||null;t.disabled=true;
      try{
        for(const v of vals){if(v.q!==v.l.quantite){const r=await sb.from('envoi_lignes').update({quantite:v.q}).eq('id',v.l.id);if(r.error)throw r.error}}
        const r=await sb.from('envois').update({statut:'valide',livreur_id:liv}).eq('id',id);if(r.error)throw r.error;
        toast(liv?'Validé : le labo et le livreur sont prévenus':'Validé : le labo est prévenu (choisis un livreur)');reload();
      }catch(err){toast(frErr(err));t.disabled=false}
      return;
    }
    case 'rRefuser':if(!armed(t,'Confirmer le refus'))return;return act(()=>sb.from('envois').update({statut:'refuse'}).eq('id',id),'Réassort refusé');
    case 'envoiDel':if(!armed(t))return;return act(()=>sb.from('envois').delete().eq('id',id),'Envoi supprimé');
    case 'pret':return act(()=>sb.from('envois').update({statut:'pret'}).eq('id',id),'Marqué prêt : le livreur est prévenu');
    case 'parti':return act(()=>sb.from('envois').update({statut:'en_route'}).eq('id',id),'Bonne route !');
    case 'recu':return act(()=>sb.from('envois').update({statut:'livre'}).eq('id',id),'Réception confirmée');
    case 'pinOn':return startPinFlow('create');
    case 'pinChange':return startPinFlow('change');
    case 'pinOff':return startPinFlow('disable');
    case 'lock':return lockNow();
  }
});
document.addEventListener('change',ev=>{
  const s=ev.target.closest('select[data-act]');if(!s)return;
  const id=s.dataset.id,a=s.dataset.act;
  if(a==='setRole')act(()=>sb.from('profiles').update({role:s.value}).eq('id',id),'Rôle mis à jour');
  if(a==='setStatut')act(()=>sb.from('envois').update({statut:s.value}).eq('id',id),'Statut mis à jour');
  if(a==='setLivreur')act(()=>sb.from('envois').update({livreur_id:s.value||null}).eq('id',id),'Livreur mis à jour');
});
document.addEventListener('submit',async ev=>{
  const f=ev.target;ev.preventDefault();
  const btn=f.querySelector('button[type=submit]');
  const fail=(sel,m)=>{const e=typeof sel==='string'?$(sel):sel;if(e){e.textContent=m;e.hidden=false}if(btn)btn.disabled=false};
  if(f.id==='authForm')return submitAuth();
  if(f.id==='newPwForm'){
    const pw=$('#newPw').value;if(pw.length<10)return fail('#newPwErr','10 caractères minimum.');
    const {error}=await sb.auth.updateUser({password:pw});if(error)return fail('#newPwErr',frErr(error));
    recovering=false;toast('Mot de passe changé');
    const {data}=await sb.auth.getSession();if(data.session){justLoggedIn=true;startApp(data.session)}else showAuth();return;
  }
  if(btn)btn.disabled=true;
  if(f.id==='inviteForm'){
    const email=$('#iEmail').value.trim().toLowerCase(),role=$('#iRole').value;
    if(!/^\S+@\S+\.\S+$/.test(email))return fail('#iErr','Entre une adresse e-mail valide.');
    if(profiles.some(p=>p.email.toLowerCase()===email))return fail('#iErr','Cette personne a déjà un compte : change son rôle dans la liste Équipe.');
    const {error}=await sb.from('invitations').upsert({email,role,invited_by:me.id,used_at:null});
    if(error)return fail('#iErr',frErr(error));
    ui.lastInvite={email,role};toast('Invitation créée');reload();return;
  }
  if(f.id==='profileForm'){await act(()=>sb.from('profiles').update({prenom:$('#pPrenom').value.trim()||null,nom:$('#pNom').value.trim()||null}).eq('id',me.id),'Profil enregistré');if(btn)btn.disabled=false;return}
  if(f.id==='planForm'){
    const lieuV=$('#plLieu').value,isB=lieuV.startsWith('b:');
    const row={jour:day,user_id:$('#plUser').value,lieu:isB?'boutique':lieuV,boutique_id:isB?lieuV.slice(2):null,debut:$('#plDebut').value||null,fin:$('#plFin').value||null,note:$('#plNote').value.trim()||null};
    if(!row.user_id)return fail('#plErr','Choisis un membre.');
    if(row.debut&&row.fin&&row.fin<=row.debut)return fail('#plErr','L’heure de fin doit être après le début.');
    const {error}=await sb.from('planning').insert(row);if(error)return fail('#plErr',frErr(error));
    toast('Affectation ajoutée');reload();return;
  }
  if(f.id==='envoiForm'){
    const lines=readGrid('ne',dispo());if(!lines.length)return fail('#neErr','Indique au moins une quantité.');
    const {data,error}=await sb.from('envois').insert({jour:day,boutique_id:$('#neShop').value,type:$('#neType').value,statut:'valide',livreur_id:$('#neLiv').value||null,note:$('#neNote').value.trim()||null}).select('id').single();
    if(error)return fail('#neErr',frErr(error));
    const r=await sb.from('envoi_lignes').insert(lines.map(l=>({envoi_id:data.id,parfum_id:l.parfum_id,quantite:l.q})));
    if(r.error)return fail('#neErr',frErr(r.error));
    ui.newEnvoi=false;toast('Envoi créé : le labo le voit dans sa production');reload();return;
  }
  if(f.id==='reassortForm'){
    const lines=readGrid('ra',dispo());if(!lines.length)return fail('#raErr','Indique au moins un parfum et une quantité.');
    const {data,error}=await sb.from('envois').insert({jour:day,boutique_id:f.dataset.boutique,type:'reassort',statut:'signale',urgent:$('#raUrgent').checked,note:$('#raNote').value.trim()||null}).select('id').single();
    if(error)return fail('#raErr',frErr(error));
    const r=await sb.from('envoi_lignes').insert(lines.map(l=>({envoi_id:data.id,parfum_id:l.parfum_id,quantite:l.q,demande:l.q})));
    if(r.error)return fail('#raErr',frErr(r.error));
    toast('Demande envoyée aux responsables');reload();return;
  }
  if(f.id==='clotureForm'){
    const B=f.dataset.boutique;
    const ids=parfums.map(p=>p.id).filter(pid=>document.getElementById('cq-'+pid));
    const old=clotures.find(c=>c.boutique_id===B);const oldIds=new Set((old&&old.cloture_lignes||[]).map(l=>l.parfum_id));
    const lines=ids.map(pid=>({parfum_id:pid,quarts_vendus:int($('#cq-'+pid).value),entiers_vendus:int($('#ce-'+pid).value),quarts_invendus:int($('#ci-'+pid).value)})).filter(l=>l.quarts_vendus||l.entiers_vendus||l.quarts_invendus||oldIds.has(l.parfum_id));
    if(!lines.length)return fail('#clErr','Remplis au moins une ligne.');
    const {data,error}=await sb.from('clotures').upsert({jour:day,boutique_id:B,vendeur_id:me.id,note:$('#clNote').value.trim()||null,updated_at:new Date().toISOString()},{onConflict:'jour,boutique_id'}).select('id').single();
    if(error)return fail('#clErr',frErr(error));
    const r=await sb.from('cloture_lignes').upsert(lines.map(l=>Object.assign({cloture_id:data.id},l)),{onConflict:'cloture_id,parfum_id'});
    if(r.error)return fail('#clErr',frErr(r.error));
    toast('Clôture enregistrée');reload();return;
  }
  if(f.dataset.shopform){
    const d=Object.fromEntries(new FormData(f));const err=f.querySelector('.msg');
    if(!d.nom.trim())return fail(err,'Donne un nom au point de vente.');
    const row={nom:d.nom.trim(),adresse:d.adresse.trim()||null,ville:d.ville.trim()||null,zone:d.zone,horaires:d.horaires.trim()||null};
    const isNew=f.dataset.shopform==='new';
    const {error}=isNew?await sb.from('boutiques').insert(row):await sb.from('boutiques').update(row).eq('id',f.dataset.shopform);
    if(error)return fail(err,frErr(error));
    ui.editShop=null;ui.addShop=false;toast(isNew?'Point de vente ajouté':'Point de vente modifié');reload();return;
  }
  if(f.dataset.parfumform){
    const d=Object.fromEntries(new FormData(f));const err=f.querySelector('.msg');
    if(!d.nom.trim())return fail(err,'Donne un nom au parfum.');
    const pq=parseFloat(String(d.prix_quart).replace(',','.'));if(!(pq>=0))return fail(err,'Prix du quart invalide.');
    const pe=String(d.prix_entier).trim()===''?null:parseFloat(String(d.prix_entier).replace(',','.'));
    const isNew=f.dataset.parfumform==='new';
    const row={nom:d.nom.trim(),prix_quart:pq,prix_entier:isFinite(pe)?pe:null,couleur:d.couleur,disponible:d.disponible==='1'};
    if(isNew)row.ordre=(Math.max(0,...parfums.map(p=>p.ordre||0))+1);
    const {error}=isNew?await sb.from('parfums').insert(row):await sb.from('parfums').update(row).eq('id',f.dataset.parfumform);
    if(error)return fail(err,frErr(error));
    ui.editParfum=null;ui.addParfum=false;toast(isNew?'Parfum ajouté':'Parfum modifié');reload();return;
  }
  if(btn)btn.disabled=false;
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
    if(authMode==='login'){justLoggedIn=true;const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error){justLoggedIn=false;fail(frErr(error))}}
    else if(authMode==='activate'){
      const {data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:APP_URL,data:{prenom:$('#aPrenom').value.trim(),nom:$('#aNom').value.trim()}}});
      if(error)fail(frErr(error));else if(!data.session)setAuthMode('login','Compte créé. Clique le lien du mail de confirmation (pense aux spams), puis connecte-toi ici.');else justLoggedIn=true;
    }else{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL});if(error)fail(frErr(error));else setAuthMode('login','Si un compte existe avec cette adresse, un lien vient d’être envoyé.')}
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
  if(hiddenAt&&Date.now()-hiddenAt>6*3600*1000)day=todayISO();
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
