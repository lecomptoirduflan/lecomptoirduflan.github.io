/* Comptoir du Flan — appli équipe
   Étape 1 : connexion, rôles, équipe, points de vente
   Étape 2 : parfums, planning, envois & réassorts, production labo, journée vendeur, tournée livreur, ventes
   Étape 6 : pages du site pour les clients, clients inscrits, contacts, Travaillons ensemble, community manager */
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
  borne:{label:'Borne de pointage (tablette)',short:'Borne'},
  client:{label:'Client',short:'Client'},
  aucun:{label:'En attente',short:'En attente'}
};
const ROLE_KEYS=Object.keys(ROLES).filter(k=>k!=='aucun'&&k!=='client');
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
  repartition:()=>isResp(me)||me.role==='chef_patissier',
  boutiques:()=>isResp(me)||me.role==='vendeur'||me.role==='livreur',
  journee:()=>me.role==='vendeur', tournee:()=>me.role==='livreur',
  labo:()=>isResp(me)||isLabo(me), marges:()=>isResp(me), compta:()=>me.role==='direction',
  pointage:()=>me.role!=='borne', heures:()=>isResp(me), agenda:()=>me.role!=='borne',
  commandes:()=>isResp(me)||me.role==='vendeur', commander:()=>me.role==='client', mescommandes:()=>me.role==='client',
  clients:()=>isResp(me), contacts:()=>isResp(me), demandes:()=>isResp(me), cm:()=>isResp(me)||me.role==='cm',
  maison:()=>me.role==='client', nosparfums:()=>me.role==='client', histoire:()=>me.role==='client', infos:()=>me.role==='client', ensemble:()=>me.role==='client'
};
const CLIENT_ROUTES=['maison','nosparfums','commander','mescommandes','histoire','infos','ensemble','profil'];
function navItems(){
  if(me.role==='client')return [['maison','Accueil'],['nosparfums','Nos parfums'],['commander','Commander'],['mescommandes','Mes commandes'],['histoire','Notre histoire'],['infos','Infos pratiques'],['ensemble','Travaillons ensemble'],['profil','Mon profil']];
  if(me.role==='cm')return [['accueil','Accueil'],['pointage','Mes heures'],['cm','Réseaux sociaux'],['planning','Mon planning'],['agenda','Agenda']];
  if(isResp(me))return [['accueil','Accueil'],['tableau','Tableau de bord'],['repartition','Répartition de demain'],['planning','Planning'],['envois','Envois et réassorts'],['commandes','Commandes'],['production','Production'],['labo','Labo · HACCP'],['ventes','Ventes du jour'],['parfums','Parfums'],['marges','Marges']].concat(me.role==='direction'?[['compta','Compta']]:[]).concat([['heures','Heures'],['agenda','Agenda'],['demandes','Demandes'],['cm','Réseaux sociaux'],['clients','Clients'],['contacts','Contacts'],['equipe','Équipe'],['boutiques','Points de vente']]);
  if(me.role==='chef_patissier')return [['accueil','Accueil'],['pointage','Mes heures'],['production','Production'],['labo','Labo · HACCP'],['repartition','Répartition de demain'],['planning','Mon planning'],['agenda','Agenda']];
  if(isLabo(me))return [['accueil','Accueil'],['pointage','Mes heures'],['production','Production'],['labo','Labo · HACCP'],['planning','Mon planning'],['agenda','Agenda']];
  if(me.role==='vendeur')return [['accueil','Accueil'],['pointage','Mes heures'],['journee','Ma journée'],['commandes','Commandes'],['planning','Mon planning'],['agenda','Agenda'],['boutiques','Points de vente']];
  if(me.role==='livreur')return [['accueil','Accueil'],['pointage','Mes heures'],['tournee','Ma tournée'],['planning','Mon planning'],['agenda','Agenda'],['boutiques','Points de vente']];
  return [['accueil','Accueil'],['pointage','Mes heures'],['planning','Mon planning'],['agenda','Agenda']];
}

/* ---------- Modules de l'accueil ---------- */
const T=(name,desc,href,etape,badge)=>({name,desc,href,etape,badge});
const POLES=[
  {key:'resp_vente',title:'Vente',tiles:[T('Planning de l\'équipe','Qui travaille où, chaque jour','#planning'),T('Ventes du jour','Clôtures des boutiques','#ventes'),T('Points de vente','Adresses, horaires','#boutiques'),T('Commandes clients','Flans entiers, retrait à Saint-Lazare','#commandes',null,'commandes')]},
  {key:'resp_production',title:'Production',tiles:[T('Répartition de demain','Ce que chaque boutique reçoit demain','#repartition'),T('Production du jour','Ce que le labo prépare','#production'),T('Parfums','Catalogue, prix, en vente ou non','#parfums'),T('Recettes et marges','Coût de revient par flan','#marges'),T('Labo · HACCP','Lots, températures, réceptions','#labo')]},
  {key:'*',title:'Pilotage',tiles:[T('Envois et réassorts','Livraisons du matin, réassorts signalés','#envois',null,'signale'),T('Tableau de bord','Vue d\'ensemble','#tableau'),T('Prévisions','Proposition de livraison de demain (météo, calendrier)','#repartition'),T('Agenda','Dates importantes et événements','#agenda')]},
  {key:'direction',title:'Admin et compta',tiles:[T('Comptes de l\'équipe','Invitations et rôles','#equipe'),T('Comptabilité','Recettes, dépenses, échéances','#compta'),T('Heures et pointages','Préparation de la paie','#heures',null,'anomalies'),T('Contacts','Équipe, fournisseurs, clients pro','#contacts')]},
  {key:'resp_partenariats',title:'Partenariats et marketing',tiles:[T('Demandes reçues','Franchises, partenariats, pros, candidatures','#demandes',null,'demandes'),T('Réseaux sociaux','Calendrier éditorial, publications à valider','#cm',null,'pubs'),T('Clients inscrits','Comptes clients et commandes','#clients'),T('Réseau de franchises','Chiffres consolidés',null,7)]}
];
const LABO_TILES=[T('Production','Envois à préparer, réassorts','#production',null,'labo'),T('Mon planning','Mes horaires de la semaine','#planning'),T('Lots de production','Étapes, cuisson, refroidissement','#labo'),T('Températures et réceptions','Relevés HACCP','#labo')];
const PT_TILE=T('Mes heures','Mes pointages de la semaine (pointage sur la borne)','#pointage');
const ROLE_TILES={
  chef_patissier:[T('Répartition de demain','Quantités par boutique, à envoyer au labo','#repartition')].concat(LABO_TILES), patissier:LABO_TILES,
  vendeur:[T('Ma journée','Réception, réassort, clôture','#journee',null,'reception'),T('Mon planning','Mes boutiques et horaires','#planning'),T('Points de vente','Adresses et horaires','#boutiques'),T('Commandes clients','Retraits de flans entiers','#commandes')],
  livreur:[T('Ma tournée','Envois à livrer','#tournee',null,'tournee'),T('Mon planning','Mes horaires de la semaine','#planning'),T('Points de vente','Adresses et horaires','#boutiques')],
  cm:[T('Réseaux sociaux','Calendrier éditorial et résultats','#cm',null,'pubsCm'),T('Nouvelle publication','Préparer, envoyer en validation','#cm'),T('Mon planning','Mes horaires de la semaine','#planning')]
};

/* ---------- Envois : statuts ---------- */
const STATUT={signale:['Signalé','b-gold'],valide:['À préparer','b-info'],pret:['Prêt au labo','b-good'],en_route:['En route','b-gold'],livre:['Livré','b-good'],refuse:['Refusé','b-bad']};
const STEPS=['valide','pret','en_route','livre'];
const STEP_LBL={valide:'Validé',pret:'Prêt',en_route:'En route',livre:'Livré'};

/* ---------- État ---------- */
let sb=null,user=null,me=null,loaded=false,channel=null;
let profiles=[],boutiques=[],invitations=[],parfums=[],planning=[],envois=[],clotures=[],envoisAll=[],cloturesAll=[],calendrier=[];
let rep={target:null,adj:{},adjTouched:{},qty:{},inc:{},liv:{}},meteo={};
let mesPointages=[],monPlanning=[],commandesAll=[],parametres={};
let contacts=[],demandes=[],publications=[],reseauxStats=[],clientsData=null,cmInfos=null;
let lots=[],equipements=[],releves=[],receptions=[],ingredients=[],recettes=[],reglages={},compta=null;
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
const PHOTOS=["photos/cacahuete.jpg", "photos/coco.jpg", "photos/flankie-cookie.jpg", "photos/flankie-pecan.jpg", "photos/flankie-pistache.jpg", "photos/fraise-basilic.jpg", "photos/framboise.jpg", "photos/frangipane.jpg", "photos/mangue.jpg", "photos/marbre.jpg", "photos/marron.jpg", "photos/myrtille.jpg", "photos/noisette.jpg", "photos/passion.jpg", "photos/pecan.jpg", "photos/pistache.jpg", "photos/pur-chocolat-ghana-80.jpg", "photos/sesame.jpg", "photos/speculos.jpg", "photos/vanille.jpg"];
const sw=x=>{if(x&&typeof x==='object'){if(x.photo)return `<img class="sw ph" src="${esc(x.photo)}" alt="" loading="lazy">`;x=x.couleur}return `<span class="sw" style="background:${esc(x||'#ccc')}"></span>`};
function chipsOf(lines,key){key=key||'quantite';const ls=sortLines(lines).filter(l=>(l[key]||0)>0);return ls.length?`<div class="chips">${ls.map(l=>{const p=parfum(l.parfum_id)||{};return `<span class="chip">${sw(p)}${esc(p.nom||'?')} <b>${l[key]}</b></span>`}).join('')}</div>`:'<span class="meta">Aucune quantité</span>'}
function stepsOf(e){if(e.statut==='signale'||e.statut==='refuse')return `<span class="badge ${STATUT[e.statut][1]}">${STATUT[e.statut][0]}</span>`;const i=STEPS.indexOf(e.statut);return `<div class="steps">${STEPS.map((s,k)=>`<span class="${k<i?'done':k===i?'now':''}">${STEP_LBL[s]}</span>`).join('')}</div>`}
function dayNav(title){return `<div class="daynav" role="group" aria-label="Choisir le jour"><button class="iconbtn" type="button" data-act="day" data-d="-1" aria-label="Jour précédent">‹</button><b>${esc(title||fmtDay(day))}</b><button class="iconbtn" type="button" data-act="day" data-d="1" aria-label="Jour suivant">›</button>${day!==todayISO()?'<button class="btn ghost sm" type="button" data-act="day" data-d="0">Aujourd’hui</button>':''}</div>`}
function qtyGrid(prefix,values,list){values=values||{};return `<div class="qty">${list.map(p=>`<label title="${esc(p.nom)}">${sw(p)}<span>${esc(p.nom)}</span><input type="number" min="0" step="1" inputmode="numeric" id="${prefix}-${p.id}" value="${values[p.id]||''}" placeholder="0" aria-label="${esc(p.nom)}"></label>`).join('')}</div>`}
function readGrid(prefix,list){const out=[];list.forEach(p=>{const el=document.getElementById(prefix+'-'+p.id);const q=el?int(el.value):0;if(q)out.push({parfum_id:p.id,q})});return out}
const dispo=()=>parfums.filter(p=>p.disponible);
const counts=()=>({
  signale:envois.filter(e=>e.statut==='signale').length,
  labo:envoisAll.filter(e=>e.statut==='valide'&&(e.jour===todayISO()||e.jour===addDays(todayISO(),1))).length,
  tournee:envois.filter(e=>e.livreur_id===me.id&&e.statut==='pret').length,
  reception:envois.filter(e=>e.statut==='en_route').length,
  anomalies:0,
  commandes:commandesAll.filter(c=>c.statut==='nouvelle').length,
  demandes:demandes.filter(d=>d.statut==='nouvelle').length,
  pubs:publications.filter(p=>p.statut==='a_valider').length,
  pubsCm:publications.filter(p=>p.statut==='validee'||(p.statut==='idee'&&p.commentaire)).length
});
function caOf(c){return (c.cloture_lignes||[]).reduce((a,l)=>{const p=parfum(l.parfum_id);return a+(l.quarts_vendus||0)*(p?+p.prix_quart:0)},0)}
const pertesOf=l=>(l.quarts_jetes||0)+(l.quarts_casses||0)+(l.quarts_donnes||0);

/* ---------- Stock en parts (un flan = 4 parts, vendable 3 jours à partir de sa production) ---------- */
const PARTS=4, DUREE=3;
const lastDay=d=>addDays(d,DUREE-1);
function takeFrom(lots,q,dayX,mode){
  // mode 'vente' : lots encore vendables, du plus ancien au plus récent ; 'jete' : périmés d'abord ; sinon tout
  let left=q;
  const order=lots.slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  const pass=mode==='vente'?[order.filter(l=>lastDay(l.d)>=dayX),order]:mode==='jete'?[order.filter(l=>lastDay(l.d)<dayX),order]:[order];
  for(const list of pass){for(const l of list){if(!left)break;const t=Math.min(l.q,left);l.q-=t;left-=t}}
  for(let i=lots.length-1;i>=0;i--)if(lots[i].q<=0)lots.splice(i,1);
  return left;
}
function arrivals(b,p,d,onlyDelivered){
  const out=[];
  envoisAll.filter(e=>e.boutique_id===b&&e.jour===d&&(onlyDelivered?e.statut==='livre':!['signale','refuse'].includes(e.statut))).forEach(e=>(e.envoi_lignes||[]).forEach(l=>{if(l.parfum_id===p&&l.quantite>0)out.push({d:e.produit_le||addDays(d,-1),q:l.quantite*PARTS})}));
  return out;
}
const clotureLine=(b,p,d)=>{const c=cloturesAll.find(x=>x.boutique_id===b&&x.jour===d);return c?(c.cloture_lignes||[]).find(l=>l.parfum_id===p)||{}:null};
// Lots restants à la FIN du jour `upto` (selon les réceptions et clôtures connues)
function lotsAt(b,p,upto){
  const lots=[];
  for(let d=addDays(upto,-12);d<=upto;d=addDays(d,1)){
    arrivals(b,p,d,true).forEach(a=>lots.push(a));
    const l=clotureLine(b,p,d);
    if(l){takeFrom(lots,l.quarts_jetes||0,d,'jete');takeFrom(lots,(l.quarts_vendus||0)+(l.quarts_casses||0)+(l.quarts_donnes||0),d,'vente')}
  }
  return lots;
}
const sumQ=ls=>ls.reduce((a,l)=>a+l.q,0);
const usableOn=(lots,d)=>sumQ(lots.filter(l=>lastDay(l.d)>=d));

/* ---------- Prévision des ventes (en parts) ---------- */
function historyOf(b,p,before){
  const days=cloturesAll.filter(c=>c.boutique_id===b&&c.jour<before).map(c=>c.jour).sort();
  const veilleDay=days.length?days[days.length-1]:null;
  const v=veilleDay?(clotureLine(b,p,veilleDay).quarts_vendus||0):null;
  const wd=parseISO(before).getDay();
  const same=days.filter(d=>parseISO(d).getDay()===wd&&d>=addDays(before,-35)).slice(-4).map(d=>clotureLine(b,p,d).quarts_vendus||0);
  const avgSame=same.length?same.reduce((a,x)=>a+x,0)/same.length:null;
  const base=avgSame!=null&&v!=null?0.6*avgSame+0.4*v:avgSame!=null?avgSame:v!=null?v:null;
  return {veilleDay,veille:v,same:same.length,avgSame,base};
}
function calFor(b,d){const z=(boutiques.find(x=>x.id===b)||{}).zone_scolaire||'C';return calendrier.filter(c=>c.debut<=d&&c.fin>=d&&(c.zone==='toutes'||c.zone===z))}
function meteoAdj(m){if(!m)return 0;let a=0;if(m.pluie>=5)a-=15;else if(m.pluie>=1)a-=5;if(m.tmax>=32)a-=10;return a}
const meteoKey=b=>{const x=boutiques.find(y=>y.id===b)||{};return x.lat!=null?(Math.round(x.lat*10)/10)+','+(Math.round(x.lon*10)/10):null};
const meteoTxt=m=>m?`${m.pluie>=1?'Pluie '+m.pluie.toFixed(1).replace('.',',')+' mm':'Sec'} · ${Math.round(m.tmin)}–${Math.round(m.tmax)} °C`:'Météo indisponible';
async function loadMeteo(target){
  const keys=[...new Set(boutiques.filter(b=>b.actif).map(b=>meteoKey(b.id)).filter(Boolean))].filter(k=>meteo[k+'@'+target]===undefined);
  if(!keys.length)return;
  await Promise.all(keys.map(async k=>{
    const id=k+'@'+target;meteo[id]=null;
    try{const [la,lo]=k.split(',');
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FParis&start_date=${target}&end_date=${target}`);
      const j=await r.json();if(j&&j.daily&&j.daily.time&&j.daily.time.length)meteo[id]={tmax:j.daily.temperature_2m_max[0],tmin:j.daily.temperature_2m_min[0],pluie:j.daily.precipitation_sum[0]||0};
    }catch(e){}
  }));
  if(route==='repartition')render();
}
const meteoOf=(b,target)=>{const k=meteoKey(b);return k?meteo[k+'@'+target]:null};
// Stock utilisable le jour `target` : dernières données connues + envois prévus d'ici là − ventes estimées des jours non clôturés
function stockForecast(b,p,target){
  const closed=cloturesAll.filter(c=>c.boutique_id===b&&c.jour<target).map(c=>c.jour).sort();
  const last=closed.length?closed[closed.length-1]:addDays(target,-1);
  const lots=lotsAt(b,p,last);
  for(let d=addDays(last,1);d<target;d=addDays(d,1)){
    arrivals(b,p,d,false).forEach(a=>lots.push(a));
    const h=historyOf(b,p,d);if(h.base)takeFrom(lots,Math.round(h.base),d,'vente');
  }
  return {usable:usableOn(lots,target),last};
}

/* ---------- Écrans d'authentification ---------- */
function show(which){$('#auth').hidden=which!=='auth';$('#app').hidden=which!=='app'}
function setAuthMode(m,okMsg){
  authMode=m;
  if(m==='ensemble'){authMode=m;$('#authForm').hidden=true;const bx=$('#ensembleBox');bx.hidden=false;bx.innerHTML=demandeFormHTML()+'<button class="link" type="button" id="toLogin">Retour à la connexion</button>';demTypeUpdate(bx.querySelector('form'));$('#authTag').innerHTML='Travaillons<br>ensemble.';$('#authSub').textContent='Franchise, partenariat, commande pro, candidature : écrivez-nous.';return}
  $('#authForm').hidden=false;$('#ensembleBox').hidden=true;
  const C={login:['Connexion','Équipe ou client : connecte-toi avec ton adresse e-mail.','Se connecter'],activate:['Activer mon compte','Utilise l’adresse à laquelle ton responsable t’a invité·e.','Créer mon compte'],reset:['Mot de passe oublié','Tu vas recevoir un lien pour en choisir un nouveau.','Recevoir le lien'],client:['Créer mon compte client','Commande tes flans entiers en ligne, retrait en boutique, paiement sur place.','Créer mon compte']}[m];
  const signup=m==='activate'||m==='client';
  $('#authTitle').textContent=C[0];$('#authLead').textContent=C[1];$('#authBtn').textContent=C[2];
  $('#nameRow').hidden=!signup;$('#charteRow').hidden=!signup;$('#telRow').hidden=m!=='client';
  $('#pwRow').hidden=m==='reset';$('#pwHint').hidden=!signup;$('#pwHint').textContent=m==='client'?'8 caractères minimum.':'10 caractères minimum.';
  $('#charteTxt').textContent=m==='client'?'J’accepte que mes nom, prénom, e-mail et téléphone soient utilisés par le Comptoir du Flan pour gérer mes commandes. Je peux supprimer mon compte à tout moment.':'J’accepte que mes nom, prénom, adresse e-mail et rôle soient utilisés par le Comptoir du Flan pour l’organisation du travail.';
  $('#aPw').autocomplete=signup?'new-password':'current-password';
  $('#toActivate').textContent=m==='login'?'Équipe : première connexion ? Activer mon compte':'J’ai déjà un compte';
  $('#toReset').hidden=m!=='login';$('#clientCta').hidden=m==='client';$('#toEnsemble').hidden=m!=='login';
  $('#authTag').innerHTML=m==='client'?'L’art du flan,<br>tout simplement.':'Produire juste.<br>Vendre mieux.';
  $('#authSub').textContent=m==='client'?'Commandez vos flans entiers en ligne, retrait en boutique, paiement sur place.':'L’outil interne de l’équipe : production, ventes, stocks et prévisions.';
  $('#authErr').hidden=true;const ok=$('#authOk');ok.textContent=okMsg||'';ok.hidden=!okMsg;
}
function showAuth(okMsg){show('auth');$('#authForm').hidden=false;$('#newPwForm').hidden=true;setAuthMode(!okMsg&&location.hash==='#client'?'client':!okMsg&&location.hash==='#ensemble'?'ensemble':'login',okMsg)}

/* ---------- Données ---------- */
async function loadAll(){
  const d0=day,d6=addDays(day,6);
  const [p,b,pf,pl,ev,cl]=await Promise.all([
    sb.from('profiles').select('*').order('created_at'),
    sb.from('boutiques').select('*').order('created_at'),
    sb.from('parfums').select('*').order('ordre'),
    sb.from('planning').select('*').gte('jour',d0).lte('jour',d6).order('jour').order('debut'),
    sb.from('envois').select('*, envoi_lignes(*)').gte('jour',addDays(d0,-12)).lte('jour',addDays(d0,1)).order('created_at'),
    sb.from('clotures').select('*, cloture_lignes(*)').gte('jour',addDays(d0,-35)).lte('jour',d0)
  ]);
  const cal=await sb.from('calendrier').select('*').order('debut');calendrier=cal.data||[];
  if(p.error){toast(frErr(p.error));return}
  profiles=p.data||[];me=profiles.find(x=>x.id===user.id)||null;
  boutiques=b.data||[];parfums=pf.data||[];planning=pl.data||[];envoisAll=ev.data||[];cloturesAll=cl.data||[];
  envois=envoisAll.filter(e=>e.jour===d0);clotures=cloturesAll.filter(c=>c.jour===d0);
  if(pf.error)toast('Base pas à jour : lance etape2.sql dans Supabase.');
  else if(cal.error)toast('Base pas à jour : lance etape2b.sql dans Supabase.');
  if(isResp(me)){const i=await sb.from('invitations').select('*').order('created_at',{ascending:false});invitations=i.data||[]}else invitations=[];
  if(me&&me.role!=='borne'){
    const pr=await sb.from('parametres').select('*');parametres={};(pr.data||[]).forEach(x=>parametres[x.cle]=x.valeur);
    if(me.role==='client'){const c=await sb.from('commandes').select('*, commande_lignes(*)').eq('client_id',user.id).order('retrait_jour',{ascending:false}).limit(50);commandesAll=c.data||[];}
    else if(isResp(me)||isLabo(me)||me.role==='vendeur'){const c=await sb.from('commandes').select('*, commande_lignes(*)').gte('retrait_jour',addDays(todayISO(),-21)).lte('retrait_jour',addDays(todayISO(),90)).order('retrait_jour').order('retrait_heure');commandesAll=c.data||[];if(c.error&&route==='commandes')toast('Base pas à jour : lance etape5.sql dans Supabase.');}
  }
  if(me&&me.role!=='borne'&&me.role!=='client'){const ws=weekStart(todayISO());const [mp,mpl]=await Promise.all([sb.from('pointages').select('*').eq('user_id',user.id).gte('jour',ws).lte('jour',addDays(ws,6)),sb.from('planning').select('*').eq('user_id',user.id).gte('jour',ws).lte('jour',addDays(ws,6))]);mesPointages=mp.data||[];monPlanning=mpl.data||[];if(pinPointage===null)sb.rpc('pin_pointage_defini').then(r=>{pinPointage=!!(r&&r.data);if(route==='pointage')render()},()=>{});}
  if(heuresData&&route==='heures'&&!heuresData.loading)loadHeures(heuresData.ws);
  if(isResp(me)||isLabo(me)){
    const [lo,eq,re,rc]=await Promise.all([
      sb.from('lots').select('*').gte('jour',addDays(d0,-14)).lte('jour',addDays(d0,1)).order('created_at'),
      sb.from('equipements').select('*').order('ordre'),
      sb.from('releves').select('*').gte('created_at',new Date(Date.now()-7*864e5).toISOString()).order('created_at'),
      sb.from('receptions').select('*').gte('jour',addDays(todayISO(),-30)).order('jour',{ascending:false})
    ]);
    lots=lo.data||[];equipements=eq.data||[];releves=re.data||[];receptions=rc.data||[];
    if(lo.error&&(route==='labo'))toast('Base pas à jour : lance etape3.sql dans Supabase.');
  }
  if(isResp(me)){
    const [ig,rc,rg]=await Promise.all([sb.from('ingredients').select('*').order('nom'),sb.from('recettes').select('*'),sb.from('reglages').select('*')]);
    ingredients=ig.data||[];recettes=rc.data||[];reglages={};(rg.data||[]).forEach(r=>reglages[r.cle]=r.valeur);
  }
  if(isResp(me)){const [ct,dm]=await Promise.all([sb.from('contacts').select('*').order('nom'),sb.from('demandes').select('*').order('created_at',{ascending:false}).limit(500)]);contacts=ct.data||[];demandes=dm.data||[];if(ct.error&&['contacts','demandes'].includes(route))toast('Base pas à jour : lance etape6.sql dans Supabase.');if(route==='clients'&&clientsData&&!clientsData.loading)loadClients()}else{contacts=[];demandes=[]}
  if(me&&(isResp(me)||me.role==='cm')){const [pb,rs]=await Promise.all([sb.from('publications').select('*').gte('jour',addDays(todayISO(),-120)).lte('jour',addDays(todayISO(),240)).order('jour'),sb.from('reseaux_stats').select('*').gte('mois',addDays(todayISO(),-400))]);publications=pb.data||[];reseauxStats=rs.data||[];if(pb.error&&route==='cm')toast('Base pas à jour : lance etape6.sql dans Supabase.')}else{publications=[];reseauxStats=[]}
  if(compta&&route==='compta'&&!compta.loading)loadCompta(compta.mois);
  loaded=true;render();refreshLastMod();if(route==='tableau'&&isResp(me))loadJournal();
}
let rT;const reload=()=>{clearTimeout(rT);rT=setTimeout(loadAll,300)};
function subscribe(){
  if(channel)sb.removeChannel(channel);
  channel=sb.channel('cdf');
  ['profiles','boutiques','invitations','parfums','planning','envois','envoi_lignes','clotures','cloture_lignes','calendrier','lots','releves','receptions','equipements','ingredients','recettes','reglages','ecritures','pointages','evenements','heures_validations','commandes','commande_lignes','parametres','contacts','demandes','publications','reseaux_stats'].forEach(t=>channel.on('postgres_changes',{event:'*',schema:'public',table:t},reload));
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
function stopApp(){if(channel){sb.removeChannel(channel);channel=null}user=null;me=null;profiles=[];boutiques=[];invitations=[];parfums=[];planning=[];envois=[];clotures=[];envoisAll=[];cloturesAll=[];calendrier=[];lots=[];equipements=[];releves=[];receptions=[];ingredients=[];recettes=[];reglages={};compta=null;mesPointages=[];monPlanning=[];heuresData=null;agData=null;pinPointage=null;lastMod={};journalData=null;commandesAll=[];parametres={};contacts=[];demandes=[];publications=[];reseauxStats=[];clientsData=null;cmInfos=null;ui.demOk=false;loaded=false;locked=false;renderLock()}

/* ---------- Rendu ---------- */
const ROUTES=['clients','contacts','demandes','cm','maison','nosparfums','histoire','infos','ensemble','commandes','commander','mescommandes','pointage','heures','agenda','labo','marges','compta','accueil','tableau','repartition','planning','envois','production','ventes','parfums','equipe','boutiques','journee','tournee','profil'];
function readRoute(){const h=(location.hash||'#accueil').slice(1);route=ROUTES.includes(h)?h:(me&&me.role==='client'?'maison':'accueil')}
window.addEventListener('hashchange',()=>{readRoute();ui.editShop=null;ui.addShop=false;ui.newEnvoi=false;ui.editParfum=null;ui.addParfum=false;ui.margeParfum=null;ui.hSel=null;ui.ctAdd=false;ui.ctEdit=null;ui.cmNew=false;ui.pubEdit=null;ui.demOk=false;if(route==='clients')clientsData=null;if(route==='cm')cmInfos=null;render();refreshLastMod();if(route==='tableau'&&me&&isResp(me))loadJournal();window.scrollTo({top:0})});

/* --- Dernière modification (journal) --- */
const ROUTE_TABLES={commandes:['commandes','commande_lignes','parametres'],accueil:null,tableau:null,repartition:['envois','envoi_lignes','calendrier'],planning:['planning'],envois:['envois','envoi_lignes'],production:['envois','envoi_lignes','lots'],labo:['lots','releves','receptions','equipements'],ventes:['clotures','cloture_lignes'],parfums:['parfums'],marges:['ingredients','recettes','reglages'],compta:['ecritures'],equipe:['profiles','invitations'],boutiques:['boutiques'],journee:['envois','envoi_lignes','clotures','cloture_lignes'],tournee:['envois'],heures:['pointages','heures_validations','reglages'],agenda:['evenements','calendrier'],pointage:['pointages'],profil:['profiles'],clients:['profiles','commandes'],contacts:['contacts','profiles'],demandes:['demandes'],cm:['publications','reseaux_stats']};
const TABLE_LBL={profiles:'comptes',invitations:'invitations',boutiques:'points de vente',parfums:'parfums',planning:'planning',envois:'envois',envoi_lignes:'quantités d’envoi',clotures:'clôtures',cloture_lignes:'clôtures',calendrier:'calendrier',lots:'lots de production',releves:'températures',receptions:'réceptions',equipements:'équipements',ingredients:'ingrédients',recettes:'recettes',reglages:'réglages',ecritures:'comptabilité',pointages:'pointages',heures_validations:'validations d’heures',evenements:'agenda',commandes:'commandes',commande_lignes:'commandes',parametres:'paramètres',contacts:'contacts',demandes:'demandes',publications:'publications',reseaux_stats:'abonnés'};
const ACT_LBL={INSERT:'ajout',UPDATE:'modification',DELETE:'suppression'};
let lastMod={},lastModT=null;
function whenTxt(ts){const d=new Date(ts),t=todayISO(),k=isoOf(d);return (k===t?'aujourd’hui':k===addDays(t,-1)?'hier':'le '+d.getDate()+' '+MOIS[d.getMonth()])+' à '+timeOf(ts)}
function refreshLastMod(){clearTimeout(lastModT);lastModT=setTimeout(async()=>{if(!sb||!me||me.role==='borne'||me.role==='client')return;const r=route;try{const {data,error}=await sb.rpc('derniere_modif',{p_tables:ROUTE_TABLES[r]||null});if(error)return;lastMod[r]=data||false;if(route===r)paintLastMod()}catch(e){}},400)}
function paintLastMod(){const el=document.getElementById('lastMod');if(me&&me.role==='client'){if(el)el.remove();return}const m=lastMod[route];if(!el)return;el.innerHTML=m?`Dernière modification : <b>${esc(m.nom)}</b> · ${esc(whenTxt(m.at))} · ${esc(ACT_LBL[m.action]||'')} (${esc(TABLE_LBL[m.table]||m.table)})`:m===false?'Aucune modification enregistrée pour l’instant.':''}
function render(){
  if(!user||!loaded)return;
  const main=$('#main'),nav=$('#nav');
  if(!me||!me.actif||me.role==='aucun'){nav.innerHTML='';$('#me').innerHTML='';main.innerHTML=waitView();return}
  document.body.classList.toggle('borne-mode',me.role==='borne'&&route!=='profil');
  if(me.role==='borne'&&route!=='profil'&&borne.step==='sign'&&document.getElementById('bSig'))return;
  if(me.role==='borne'){nav.innerHTML='';$('#me').innerHTML=`<span class="avatar">B</span><span>Borne</span>`;main.innerHTML=route==='profil'?profileView():borneView();if(borne.step==='sign')setTimeout(sigInit,0);return}
  if(me.role==='client'&&!CLIENT_ROUTES.includes(route))route='maison';
  if(!CAN[route]())route=me.role==='client'?'maison':'accueil';
  nav.innerHTML=navItems().map(([k,l])=>`<a href="#${k}"${k===route?' aria-current="page"':''}>${esc(l)}</a>`).join('');
  $('#me').innerHTML=`<span class="avatar" aria-hidden="true">${esc(initials(me))}</span><span>${esc(displayName(me))}</span>`;
  if(locked&&!pinAction){main.innerHTML='';return}
  const V={commandes:commandesView,commander:commanderView,mescommandes:mesCommandesView,pointage:pointageView,heures:heuresView,agenda:agendaView,labo:laboView,marges:margesView,compta:comptaView,accueil:homeView,tableau:dashView,repartition:repartitionView,planning:planningView,envois:envoisView,production:productionView,ventes:ventesView,parfums:parfumsView,equipe:teamView,boutiques:shopsView,journee:journeeView,tournee:tourneeView,profil:profileView,clients:clientsView,contacts:contactsView,demandes:demandesView,cm:cmView,maison:maisonView,nosparfums:nosParfumsView,histoire:histoireView,infos:infosView,ensemble:ensembleView};
  main.innerHTML=V[route]();
  const hd=main.querySelector('.page > .head');if(hd){hd.insertAdjacentHTML('afterend','<p class="lastmod" id="lastMod" aria-live="polite"></p>');paintLastMod()}
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
  if(t.href==='#compta'&&me.role!=='direction')return `<div class="tile soon"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span><span class="badge b-mute" style="align-self:flex-start;margin-top:4px">Réservé à la direction</span></div>`;
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
    const tiles=[PT_TILE].concat(ROLE_TILES[me.role]||[]).concat([T('Agenda','Dates importantes','#agenda'),T('Mon profil','Prénom, codes PIN','#profil')]);
    body=banner+`<section class="pole"><div class="pole-h"><h2>Mon espace</h2><span>${esc(roleLabel(me.role))}</span></div><div class="tiles">${tiles.map(t=>tileHTML(t,false,c)).join('')}</div></section>`;
  }
  return `<div class="page"><div class="head"><div><h1>${hello}</h1><p>${esc(roleLabel(me.role))} · ${esc(fmtDay(todayISO()))}</p></div></div>${body}<p class="note">Les modules marqués « Étape » arrivent au fil des mises à jour.</p></div>`;
}

/* --- Tableau de bord --- */
let journalData=null;
async function loadJournal(){try{const {data,error}=await sb.rpc('journal_recent',{p_limit:12});if(error)return;journalData=data||[];if(route==='tableau')render()}catch(e){}}
function journalHTML(){if(journalData===null)return '<p class="empty">Chargement…</p>';if(!journalData.length)return '<p class="empty">Rien pour l’instant.</p>';
  return `<div style="display:flex;flex-direction:column">${journalData.map(j=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--cream);font-size:13.5px;flex-wrap:wrap"><span><b>${esc(j.nom)}</b> · ${esc(ACT_LBL[j.action]||'')} · ${esc(TABLE_LBL[j.table]||j.table)}</span><span style="color:var(--muted)">${esc(whenTxt(j.at))}</span></div>`).join('')}</div>`}
function dashView(){
  const act=profiles.filter(p=>p.actif&&!['aucun','borne'].includes(p.role));
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
  if(c.commandes)todo.push(`<li><a href="#commandes">${c.commandes} commande${c.commandes>1?'s':''} client à confirmer</a></li>`);
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
      <section class="card"><h2>Dernières modifications</h2>${journalHTML()}</section>
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
  const actives=profiles.filter(p=>p.actif&&!['aucun','borne'].includes(p.role));
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
      <div class="qty">${sortLines(e.envoi_lignes).map(l=>{const p=parfum(l.parfum_id)||{};return `<label>${sw(p)}<span>${esc(p.nom)} <small style="color:var(--muted)">(demandé ${l.demande??l.quantite})</small></span><input type="number" min="0" inputmode="numeric" id="rv-${l.id}" value="${l.quantite}" aria-label="${esc(p.nom)}"></label>`}).join('')}</div>
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

/* --- Répartition de demain (responsables + chef pâtissier) --- */
function repInit(target){
  if(rep.target===target)return;
  rep={target,adj:{},adjTouched:{},qty:{},inc:{},liv:{}};
  const planned=planning.filter(p=>p.jour===target&&p.lieu==='boutique');
  boutiques.filter(b=>b.actif).forEach(b=>{
    const ex=envoisAll.find(e=>e.jour===target&&e.boutique_id===b.id&&e.type==='matin'&&e.statut!=='refuse');
    rep.inc[b.id]=ex?true:(planned.length?planned.some(p=>p.boutique_id===b.id):true);
    if(ex){rep.qty[b.id]={};(ex.envoi_lignes||[]).forEach(l=>rep.qty[b.id][l.parfum_id]=l.quantite);rep.liv[b.id]=ex.livreur_id||''}
  });
}
function repAdj(b,target){
  if(rep.adjTouched[b])return rep.adj[b];
  return meteoAdj(meteoOf(b,target))+calFor(b,target).reduce((a,c)=>a+(c.ajustement||0),0);
}
function repRows(b,target){
  const adj=repAdj(b,target);
  return dispo().map(p=>{
    const h=historyOf(b,p.id,target);
    const st=stockForecast(b,p.id,target);
    const demand=h.base!=null?Math.round(h.base*(1+adj/100)):null;
    const need=demand!=null?Math.max(0,demand-st.usable):null;
    const prop=need!=null?Math.ceil(need/PARTS):null;
    return {p,h,st,demand,prop};
  });
}
function repartitionView(){
  const target=addDays(day,1);repInit(target);loadMeteo(target);
  const shops=boutiques.filter(b=>b.actif);
  const livs=profiles.filter(p=>p.actif&&p.role==='livreur');
  const onTour=new Set(planning.filter(p=>p.jour===target&&p.lieu==='tournee').map(p=>p.user_id));
  const defLiv=(livs.find(l=>onTour.has(l.id))||{}).id||'';
  const anyPlan=planning.some(p=>p.jour===target&&p.lieu==='boutique');
  const totals={};let grand=0;
  const cards=shops.map(b=>{
    const rows=repRows(b.id,target);const inc=rep.inc[b.id];
    const ex=envoisAll.find(e=>e.jour===target&&e.boutique_id===b.id&&e.type==='matin'&&e.statut!=='refuse');
    const locked=ex&&ex.statut!=='valide';
    const q=rep.qty[b.id]||{};
    let tot=0;rows.forEach(r=>{const v=q[r.p.id]!=null?q[r.p.id]:(r.prop||0);if(inc){totals[r.p.id]=(totals[r.p.id]||0)+v;tot+=v}});grand+=inc?tot:0;
    const m=meteoOf(b.id,target),cal=calFor(b.id,target),adj=repAdj(b.id,target);
    const vend=planning.filter(p=>p.jour===target&&p.lieu==='boutique'&&p.boutique_id===b.id).map(p=>displayName(prof(p.user_id)));
    const noHist=rows.every(r=>r.h.base==null);
    return `<section class="card${inc?'':' off'}" style="${inc?'':'opacity:.6'}">
      <div class="envoi-h"><div><h2>${esc(b.nom)}</h2><span class="meta">${vend.length?'Vendeur : '+esc(vend.join(', ')):anyPlan?'Personne de planifié':'Planning de demain pas encore fait'}</span></div>
        <label class="check" style="font-size:14px;font-weight:500"><input type="checkbox" data-rep="inc" data-b="${b.id}"${inc?' checked':''}${locked?' disabled':''}>Livrer demain</label></div>
      <div class="chips"><span class="chip">${esc(meteoTxt(m))}</span>${cal.map(c=>`<span class="chip">${esc(c.libelle)}${c.ajustement?' · '+(c.ajustement>0?'+':'')+c.ajustement+' %':''}</span>`).join('')}
        <label class="chip">Ajustement <input type="number" step="5" data-rep="adj" data-b="${b.id}" value="${adj}" style="width:62px;min-height:30px;border:1px solid var(--line2);border-radius:8px;text-align:center;font:inherit" aria-label="Ajustement en pourcentage"> %</label></div>
      ${locked?`<p class="msg ok">Déjà parti au labo et marqué « ${esc(STATUT[ex.statut][0])} » : plus modifiable ici.</p>`:''}
      ${noHist?'<p class="note">Pas encore de clôtures pour cette boutique : pas de proposition, saisis les quantités.</p>':''}
      <div class="tbl-wrap"><table class="ptable" style="min-width:600px"><thead><tr><th>Parfum</th><th title="Parts vendues au dernier jour clôturé">Veille</th><th title="Moyenne des parts vendues le même jour de la semaine (4 dernières semaines)">Même jour</th><th title="Parts encore vendables demain">Stock demain</th><th title="Ventes prévues demain, en parts">Prévu</th><th>Proposé</th><th>À envoyer</th></tr></thead><tbody>
      ${rows.map(r=>{const v=q[r.p.id]!=null?q[r.p.id]:(r.prop||0);return `<tr><td>${sw(r.p)} ${esc(r.p.nom)}</td><td class="num">${r.h.veille??'–'}</td><td class="num">${r.h.avgSame!=null?Math.round(r.h.avgSame)+' <small style="color:var(--muted)">('+r.h.same+' sem.)</small>':'–'}</td><td class="num">${r.st.usable} parts</td><td class="num">${r.demand??'–'}</td><td class="num">${r.prop!=null?r.prop+' fl.':'–'}</td><td><input type="number" min="0" inputmode="numeric" data-rep="qty" data-b="${b.id}" data-p="${r.p.id}" value="${v||''}" placeholder="0"${locked||!inc?' disabled':''} aria-label="${esc(r.p.nom)}, flans à envoyer"></td></tr>`}).join('')}
      <tr class="total"><td>Total</td><td colspan="5"></td><td class="num">${tot} flans</td></tr></tbody></table></div>
      <div class="btnrow"><label class="meta">Livreur <select class="inline-sel" data-rep="liv" data-b="${b.id}"${locked?' disabled':''}><option value="">Sans livreur</option>${livs.map(l=>`<option value="${l.id}"${(rep.liv[b.id]!=null?rep.liv[b.id]:defLiv)===l.id?' selected':''}>${esc(displayName(l))}${onTour.has(l.id)?' · en tournée':''}</option>`).join('')}</select></label>
      ${ex?`<span class="badge ${STATUT[ex.statut][1]}">Envoyé au labo · ${esc(STATUT[ex.statut][0])}</span>`:''}</div>
    </section>`}).join('');
  const tIds=Object.keys(totals).filter(k=>totals[k]>0).sort((a,b)=>((parfum(a)||{}).ordre||0)-((parfum(b)||{}).ordre||0));
  return `<div class="page">
  <div class="head"><div><h1>Répartition du ${esc(fmtDay(target))}</h1><p>Livraison du matin, préparée la veille par le labo. Quantités en flans entiers (4 parts).</p></div>${dayNav('Préparé le '+fmtDay(day))}</div>
  ${(()=>{const cs=commandesAll.filter(c=>['nouvelle','confirmee'].includes(c.statut)&&c.retrait_jour===target);const n=cs.reduce((a,c)=>a+cmdFlans(c),0);return n?`<section class="card" style="border-color:var(--gold)"><h2>+ ${n} flan${n>1?'s':''} de commandes clients à retirer le ${esc(fmtDay(target))}</h2><p class="sub">À produire en plus de la répartition (${cs.length} commande${cs.length>1?'s':''}). Détail dans Commandes.</p></section>`:''})()}
  <section class="card dark"><h2 style="color:var(--gold-l)">Total à produire : ${grand} flans</h2>
    ${tIds.length?`<div class="chips">${tIds.map(id=>{const p=parfum(id)||{};return `<span class="chip" style="background:#2a2a2a;border-color:#3a3a3a;color:#FFF8EC">${sw(p)}${esc(p.nom)} <b>${totals[id]}</b></span>`}).join('')}</div>`:'<p class="sub">Aucune quantité pour l’instant.</p>'}
    <div class="btnrow"><button class="btn" type="button" data-act="repSend" style="background:var(--gold-l);color:var(--ink)">Envoyer au labo</button><button class="btn ghost sm" type="button" data-act="repReset">Revenir aux propositions</button></div>
    <p class="sub">Propositions = ventes prévues (60 % moyenne du même jour + 40 % veille, ajustées météo et calendrier) − stock encore vendable demain. Un flan se vend ${DUREE} jours après sa production.</p>
  </section>
  ${cards}
  ${isResp(me)?calendrierSection():''}
  </div>`;
}
function calendrierSection(){
  const up=calendrier.filter(c=>c.fin>=todayISO()).slice(0,14);
  return `<section class="card"><h2>Calendrier : vacances, fêtes, événements</h2>
    <p class="sub">Chaque période ajoute son pourcentage aux propositions des boutiques concernées (zone C : Montpellier, Nîmes, Béziers ; zone B : Marseille).</p>
    ${up.length?`<div class="tbl-wrap"><table style="min-width:520px"><thead><tr><th>Période</th><th>Dates</th><th>Zone</th><th>Effet</th><th></th></tr></thead><tbody>${up.map(c=>`<tr><td><b>${esc(c.libelle)}</b> <span class="badge b-mute">${esc({vacances:'Vacances',ferie:'Férié',fete:'Fête',evenement:'Événement'}[c.type])}</span></td><td>${c.debut===c.fin?esc(fmtDay(c.debut)):esc(fmtDay(c.debut))+' → '+esc(fmtDay(c.fin))}</td><td>${c.zone==='toutes'?'Toutes':'Zone '+esc(c.zone)}</td><td><input type="number" step="5" data-act="calAdj" data-id="${c.id}" value="${c.ajustement}" style="width:64px;min-height:36px;border:1px solid var(--line2);border-radius:8px;text-align:center;font:inherit" aria-label="Effet en pourcentage"> %</td><td><button class="btn ghost sm" type="button" data-act="calDel" data-id="${c.id}">Retirer</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Rien de prévu.</p>'}
    <form id="calForm" class="grid" style="gap:10px" novalidate>
      <div class="row2"><label class="field">Libellé<input id="caLib" placeholder="Marché de Noël, braderie…"></label><label class="field">Type<select id="caType"><option value="evenement">Événement</option><option value="fete">Fête</option><option value="vacances">Vacances</option><option value="ferie">Férié</option></select></label></div>
      <div class="row2"><label class="field">Début<input id="caDeb" type="date"></label><label class="field">Fin<input id="caFin" type="date"></label></div>
      <div class="row2"><label class="field">Zone<select id="caZone"><option value="toutes">Toutes</option><option value="C">Zone C</option><option value="B">Zone B</option></select></label><label class="field">Effet (%)<input id="caAdj" type="number" step="5" value="10"></label></div>
      <p class="msg err" id="caErr" hidden></p>
      <button class="btn sm" type="submit">Ajouter au calendrier</button></form>
  </section>`;
}

/* --- Production (labo + responsables) : aujourd'hui et livraison de demain matin --- */
function productionView(){
  const tmw=addDays(day,1);
  const act=envoisAll.filter(e=>(e.jour===day||e.jour===tmw)&&['valide','pret','en_route','livre'].includes(e.statut));
  const todo=act.filter(e=>e.statut==='valide');
  const tot={},rest={};act.forEach(e=>(e.envoi_lignes||[]).forEach(l=>{tot[l.parfum_id]=(tot[l.parfum_id]||0)+l.quantite;if(e.statut==='valide')rest[l.parfum_id]=(rest[l.parfum_id]||0)+l.quantite}));
  const ids=Object.keys(tot).sort((a,b)=>((parfum(a)||{}).ordre||0)-((parfum(b)||{}).ordre||0));
  const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
  const card=e=>`<div class="envoi${e.type==='reassort'?' hot':''}">
    <div class="envoi-h"><span><b>${esc(shopName(e.boutique_id))}</b> ${e.type==='reassort'?'<span class="badge b-bad">Réassort'+(e.urgent?' urgent':'')+'</span>':`<span class="badge b-mute">Livraison ${e.jour===day?'du matin':'de demain matin'}</span>`}</span><span class="meta">${lineTotal(e.envoi_lignes)} flans</span></div>
    ${chipsOf(e.envoi_lignes)}${e.note?`<span class="meta">${esc(e.note)}</span>`:''}
    <div class="btnrow"><button class="btn sm" type="button" data-act="pret" data-id="${e.id}">C’est prêt</button><span class="meta">${e.livreur_id?'Livreur : '+esc(displayName(prof(e.livreur_id))):'Livreur pas encore choisi'}</span></div></div>`;
  const reas=todo.filter(e=>e.type==='reassort'),today=todo.filter(e=>e.type==='matin'&&e.jour===day),demain=todo.filter(e=>e.type==='matin'&&e.jour===tmw);
  const grp=(t,l)=>l.length?`<div class="grid" style="gap:10px"><div class="meta" style="font-weight:700">${t}</div>${l.map(card).join('')}</div>`:'';
  return `<div class="page">
  <div class="head"><div><h1>Production</h1><p>${sum(rest)} flans encore à préparer · ${sum(tot)} au total (aujourd’hui et demain matin)</p></div>${dayNav()}</div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>À préparer <span class="badge ${todo.length?'b-info':'b-mute'}">${todo.length}</span></h2>
      ${todo.length?grp('Réassorts (urgent)',reas.sort((a,b)=>b.urgent-a.urgent))+grp('Livraison du matin · '+fmtDay(day),today)+grp('Livraison de demain matin · '+fmtDay(tmw),demain):'<p class="empty">Rien à préparer pour l’instant.</p>'}
      ${me.role==='chef_patissier'||isResp(me)?'<a class="link" href="#repartition">Préparer la répartition de demain</a>':''}
    </section>
    ${(()=>{const cs=commandesAll.filter(c=>c.statut==='confirmee'&&(c.retrait_jour===day||c.retrait_jour===tmw)).sort((a,b)=>(a.retrait_jour+a.retrait_heure).localeCompare(b.retrait_jour+b.retrait_heure));
      return cs.length?`<section class="card"><h2>Commandes clients à préparer <span class="badge b-info">${cs.length}</span></h2>${cs.map(c=>`<div class="envoi"><div class="envoi-h"><span><b>${esc(c.numero)}</b> · ${esc(c.client_nom)}</span><span class="meta">Retrait ${esc(retraitTxt(c))}</span></div>${cmdChips(c)}${c.note?`<span class="meta">« ${esc(c.note)} »</span>`:''}<div class="btnrow"><button class="btn sm" type="button" data-act="cmdSt" data-id="${c.id}" data-s="prete">Commande prête</button></div></div>`).join('')}</section>`:''})()}
    <section class="card"><h2>Total par parfum</h2>
      ${ids.length?`<div class="tbl-wrap"><table class="ptable" style="min-width:0"><thead><tr><th>Parfum</th><th>Reste</th><th>Total</th></tr></thead><tbody>${ids.map(id=>{const p=parfum(id)||{};return `<tr><td>${sw(p)} ${esc(p.nom)}</td><td class="num"><b>${rest[id]||0}</b></td><td class="num">${tot[id]}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="empty">Aucun envoi validé.</p>'}
      <p class="note">En flans entiers. La date de production est enregistrée quand tu cliques « C’est prêt » : le flan se vend ${DUREE} jours à partir de cette date.</p>
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
  const cl=clotures.find(c=>c.boutique_id===B);
  const clv={};(cl&&cl.cloture_lignes||[]).forEach(l=>clv[l.parfum_id]=l);
  const prev=addDays(day,-1);
  const rows=parfums.map(p=>{
    const lots=lotsAt(B,p.id,prev);
    const recu=sumQ(arrivals(B,p.id,day,true));
    const debut=sumQ(lots);
    const premier=sumQ(lots.filter(l=>lastDay(l.d)===day));
    const perime=sumQ(lots.filter(l=>lastDay(l.d)<day));
    return {p,debut,recu,premier,perime,v:clv[p.id]||{}};
  }).filter(r=>r.p.disponible||r.debut||r.recu||clv[r.p.id]);
  const urgent=rows.filter(r=>r.premier||r.perime);
  return `<div class="page">
  <div class="head"><div><h1>${esc(shopName(B))}</h1><p>Ma journée · ${esc(fmtDay(day))}${a.debut?' · '+hhmm(a.debut)+(a.fin?' – '+hhmm(a.fin):''):''}</p></div>${dayNav()}</div>
  ${aff.length>1?`<p class="note">Tu as plusieurs affectations ce jour : l’appli affiche la première (${esc(shopName(B))}).</p>`:''}
  ${enRoute.length?`<section class="card" style="border-color:var(--gold)"><h2>Livraison en route</h2>${enRoute.map(e=>`<div class="envoi"><div class="envoi-h"><b>${e.type==='reassort'?'Réassort':'Livraison du matin'}</b><span class="meta">${lineTotal(e.envoi_lignes)} flans · ${esc(displayName(prof(e.livreur_id)))}</span></div>${chipsOf(e.envoi_lignes)}<button class="btn" type="button" data-act="recu" data-id="${e.id}">J’ai bien reçu</button></div>`).join('')}</section>`:''}
  ${urgent.length?`<section class="card" style="border-color:var(--bad)"><h2>À vendre en premier</h2><div class="chips">${urgent.map(r=>`${r.premier?`<span class="chip">${sw(r.p)}${esc(r.p.nom)} <b>${r.premier} parts</b> · dernier jour</span>`:''}${r.perime?`<span class="chip" style="border-color:var(--bad)">${sw(r.p)}${esc(r.p.nom)} <b>${r.perime} parts</b> · périmées, à jeter</span>`:''}`).join('')}</div><p class="note">Sers toujours les parts les plus anciennes d’abord. Un flan se vend ${DUREE} jours à partir de sa production.</p></section>`:''}
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Signaler un réassort</h2>
      ${isToday?`<form id="reassortForm" class="grid" style="gap:12px" novalidate data-boutique="${B}">
        <p class="sub">Indique ce qu’il te manque, en flans entiers (4 parts). Un responsable valide, puis le labo prépare et le livreur t’apporte.</p>
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
    <p class="sub">Tout en <b>parts</b>. Le reste est calculé et passe au lendemain.</p>
    <form id="clotureForm" data-boutique="${B}" novalidate>
      <div class="tbl-wrap"><table class="ptable" style="min-width:640px"><thead><tr><th>Parfum</th><th title="Parts en boutique au début de la journée">Début</th><th title="Parts reçues aujourd’hui">Reçu</th><th>Vendues</th><th title="Parts périmées jetées">Jetées</th><th>Cassées</th><th>Données</th><th>Reste</th></tr></thead><tbody>
      ${rows.map(r=>{const v=r.v,inp=(k,lbl)=>`<td><input type="number" min="0" inputmode="numeric" id="c${k}-${r.p.id}" data-row="${r.p.id}" value="${v['quarts_'+lbl]||''}" placeholder="0" aria-label="${esc(r.p.nom)} ${lbl}"></td>`;
        const reste=r.debut+r.recu-(v.quarts_vendus||0)-(v.quarts_jetes||0)-(v.quarts_casses||0)-(v.quarts_donnes||0);
        return `<tr data-stock="${r.debut+r.recu}" data-pid="${r.p.id}"><td>${sw(r.p)} ${esc(r.p.nom)}</td><td class="num">${r.debut}</td><td class="num">${r.recu||'–'}</td>${inp('v','vendus')}${inp('j','jetes')}${inp('c','casses')}${inp('d','donnes')}<td class="num"><b id="cr-${r.p.id}" style="${reste<0?'color:var(--bad)':''}">${reste}</b></td></tr>`}).join('')}
      </tbody></table></div>
      <p class="note" style="margin-top:8px">Un reste négatif veut dire que le stock de l’appli ne correspond pas à la vitrine : signale-le dans la remarque.</p>
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
    const v=ls.reduce((a,l)=>a+(l.quarts_vendus||0),0),j=ls.reduce((a,l)=>a+(l.quarts_jetes||0),0),k=ls.reduce((a,l)=>a+(l.quarts_casses||0),0),d=ls.reduce((a,l)=>a+(l.quarts_donnes||0),0);
    const reste=c?parfums.reduce((a,p)=>a+sumQ(lotsAt(b.id,p.id,day)),0):null;
    const vend=planning.filter(p=>p.jour===day&&p.lieu==='boutique'&&p.boutique_id===b.id).map(p=>displayName(prof(p.user_id)));
    return {b,c,v,j,k,d,reste,ca:c?caOf(c):0,vend};});
  const T=rows.reduce((a,r)=>({ca:a.ca+r.ca,v:a.v+r.v,j:a.j+r.j,k:a.k+r.k,d:a.d+r.d,reste:a.reste+(r.reste||0)}),{ca:0,v:0,j:0,k:0,d:0,reste:0});
  const pertes=T.j+T.k+T.d;
  return `<div class="page">
  <div class="head"><div><h1>Ventes du jour</h1><p>${rows.filter(r=>r.c).length} clôture${rows.filter(r=>r.c).length>1?'s':''} reçue${rows.filter(r=>r.c).length>1?'s':''} · tout en parts</p></div>${dayNav()}</div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Chiffre d’affaires</span><span class="val num">${eur(T.ca)}</span><span class="hint">parts × prix du quart</span></div>
    <div class="card kpi"><span class="lbl">Parts vendues</span><span class="val num">${T.v}</span><span class="hint">soit ${Math.round(T.v/PARTS*10)/10} flans</span></div>
    <div class="card kpi"><span class="lbl">Pertes</span><span class="val num">${pertes}</span><span class="hint">${T.j} jetées · ${T.k} cassées · ${T.d} données</span></div>
    <div class="card kpi"><span class="lbl">Reste en boutiques</span><span class="val num">${T.reste}</span><span class="hint">parts, passent à demain</span></div>
  </section>
  <section class="card"><h2>Par point de vente</h2><div class="tbl-wrap"><table><thead><tr><th>Point de vente</th><th>Vendeur</th><th>CA</th><th>Vendues</th><th>Jetées</th><th>Cassées</th><th>Données</th><th>Reste</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${esc(r.b.nom)}</b></td><td>${r.vend.length?esc(r.vend.join(', ')):'<span style="color:var(--muted)">—</span>'}</td><td class="num">${r.c?eur(r.ca):'<span class="badge '+(r.vend.length?'b-bad':'b-mute')+'">'+(r.vend.length?'Pas clôturé':'Fermé ?')+'</span>'}</td><td class="num">${r.c?r.v:''}</td><td class="num">${r.c?r.j:''}</td><td class="num">${r.c?r.k:''}</td><td class="num">${r.c?r.d:''}</td><td class="num">${r.reste!=null?r.reste:''}</td></tr>`).join('')}
    <tr class="total"><td>Total</td><td></td><td class="num">${eur(T.ca)}</td><td class="num">${T.v}</td><td class="num">${T.j}</td><td class="num">${T.k}</td><td class="num">${T.d}</td><td class="num">${T.reste}</td></tr>
  </tbody></table></div></section>
  ${clotures.filter(c=>c.note).length?`<section class="card"><h2>Remarques des vendeurs</h2>${clotures.filter(c=>c.note).map(c=>`<p style="margin:0;font-size:14px"><b>${esc(shopName(c.boutique_id))}</b> : ${esc(c.note)}</p>`).join('')}</section>`:''}
  </div>`;
}

/* --- Parfums (responsables) --- */
function parfumForm(p){
  p=p||{nom:'',prix_quart:8,prix_entier:'',couleur:'#C9A24A',disponible:true};
  return `<form class="grid" style="gap:10px" data-parfumform="${p.id||'new'}" novalidate>
    <label class="field">Nom<input name="nom" value="${esc(p.nom)}"></label>
    <div class="row2"><label class="field">Prix du quart (€)<input name="prix_quart" type="number" step="0.10" min="0" inputmode="decimal" value="${p.prix_quart}"></label><label class="field">Prix de l’entier, commande (€)<input name="prix_entier" type="number" step="0.10" min="0" inputmode="decimal" value="${p.prix_entier??''}" placeholder="À définir"></label></div>
    <label class="field">Photo<select name="photo"><option value="">Aucune (couleur)</option>${PHOTOS.map(f=>`<option value="${f}"${p.photo===f?' selected':''}>${esc(f.replace('photos/','').replace('.jpg','').replace(/-/g,' '))}</option>`).join('')}</select></label>
    <div class="row2"><label class="field">Couleur<input name="couleur" type="color" value="${esc(p.couleur)}" style="padding:4px"></label><label class="field">Statut<select name="disponible"><option value="1"${p.disponible?' selected':''}>En vente</option><option value="0"${p.disponible?'':' selected'}>Pas en vente</option></select></label></div>
    <p class="msg err" hidden></p>
    <div class="btnrow"><button class="btn sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-act="cancelParfum">Annuler</button></div></form>`;
}
function parfumsView(){
  const on=parfums.filter(p=>p.disponible).length;
  return `<div class="page">
  <div class="head"><div><h1>Parfums</h1><p>${on} en vente · ${parfums.length-on} pas en vente</p></div>${ui.addParfum?'':'<button class="btn sm" type="button" data-act="addParfum">+ Ajouter un parfum</button>'}</div>
  ${ui.addParfum?`<section class="card"><h2>Nouveau parfum</h2>${parfumForm(null)}</section>`:''}
  <div class="parfums">${parfums.map(p=>ui.editParfum===p.id?`<div class="parfum"><div class="bandeau" style="background:${esc(p.couleur)}"></div><div class="in">${parfumForm(p)}</div></div>`:`<div class="parfum${p.disponible?'':' off'}">${p.photo?`<img class="pphoto" src="${esc(p.photo)}" alt="${esc(p.nom)}" loading="lazy">`:`<div class="bandeau" style="background:${esc(p.couleur)}"></div>`}<div class="in">
    <div class="envoi-h"><b>${esc(p.nom)}</b><span class="badge ${p.disponible?'b-good':'b-mute'}">${p.disponible?'En vente':'Pas en vente'}</span></div>
    <span class="meta">Quart ${eur(p.prix_quart)} · entier ${p.prix_entier!=null?eur(p.prix_entier):'<span class="badge b-gold">à définir</span>'}</span>
    <div class="btnrow" style="margin-top:auto"><button class="btn ghost sm" type="button" data-act="editParfum" data-id="${p.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="toggleParfum" data-id="${p.id}">${p.disponible?'Retirer de la vente':'Remettre en vente'}</button></div>
  </div></div>`).join('')}</div>
  <p class="note">Seuls les parfums « en vente » apparaissent dans la répartition, les réassorts et les envois. En boutique, la vente se fait à la part (prix du quart) ; le prix de l’entier sert aux commandes retirées à Saint-Lazare.</p></div>`;
}

/* ================= ÉTAPE 3 ================= */
const LOT_STEPS=[
  {k:'prep_at',l:'Préparation'},
  {k:'cuisson_at',l:'Sortie du four',t:'temp_four',tl:'Four (°C)'},
  {k:'refroid_at',l:'Début refroidissement'},
  {k:'refroid_fin_at',l:'Fin refroidissement',t:'temp_coeur',tl:'À cœur (°C)'},
  {k:'garnissage_at',l:'Garnissage / mise en boîte'}
];
const REFROID_MAX_MIN=120, REFROID_MAX_T=10;
const nextStep=l=>LOT_STEPS.find(s=>!l[s.k]);
function refroidCheck(l){
  if(!l.refroid_at||!l.refroid_fin_at)return null;
  const min=Math.round((new Date(l.refroid_fin_at)-new Date(l.refroid_at))/60000);
  const ok=min<=REFROID_MAX_MIN&&(l.temp_coeur==null||+l.temp_coeur<=REFROID_MAX_T);
  return {min,ok};
}
const codeOf=nom=>String(nom||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase()||'XXX';
const hoursSince=ts=>ts?(Date.now()-new Date(ts))/3600000:Infinity;
const fmtT=v=>v==null?'–':String(v).replace('.',',')+' °C';
function lotDest(l){
  const out={};envoisAll.filter(e=>e.produit_le===l.jour&&(e.envoi_lignes||[]).some(x=>x.parfum_id===l.parfum_id)).forEach(e=>{const q=(e.envoi_lignes||[]).filter(x=>x.parfum_id===l.parfum_id).reduce((a,x)=>a+x.quantite,0);out[e.boutique_id]=(out[e.boutique_id]||0)+q});
  return Object.entries(out);
}

/* --- Labo · HACCP --- */
function laboView(){
  const tab=ui.laboTab||'lots';
  const tabs=[['lots','Lots de production'],['temp','Températures'],['recep','Réceptions']];
  const body=tab==='lots'?laboLots():tab==='temp'?laboTemps():laboRecep();
  return `<div class="page">
  <div class="head"><div><h1>Labo · HACCP</h1><p>Traçabilité de la production, des températures et des marchandises</p></div>${tab==='temp'?'':dayNav()}</div>
  <div class="btnrow" role="tablist">${tabs.map(([k,l])=>`<button class="btn sm ${k===tab?'':'ghost'}" type="button" role="tab" aria-selected="${k===tab}" data-act="laboTab" data-t="${k}">${l}</button>`).join('')}</div>
  ${body}</div>`;
}
function laboLots(){
  const tmw=addDays(day,1);
  const need={};envoisAll.filter(e=>(e.jour===day||e.jour===tmw)&&['valide','pret'].includes(e.statut)).forEach(e=>(e.envoi_lignes||[]).forEach(l=>need[l.parfum_id]=(need[l.parfum_id]||0)+l.quantite));
  const todays=lots.filter(l=>l.jour===day);
  const made={};todays.forEach(l=>made[l.parfum_id]=(made[l.parfum_id]||0)+l.quantite);
  const todo=Object.keys(need).map(id=>[id,need[id]-(made[id]||0)]).filter(x=>x[1]>0).sort((a,b)=>((parfum(a[0])||{}).ordre||0)-((parfum(b[0])||{}).ordre||0));
  const pre=ui.lotPrefill||{};
  const form=`<section class="card"><h2>Lancer un lot</h2>
    ${todo.length&&day===todayISO()?`<div class="grid" style="gap:6px"><span class="meta">Encore à produire d’après les envois (aujourd’hui et demain matin) :</span><div class="chips">${todo.map(([id,q])=>{const p=parfum(id)||{};return `<button class="chip" type="button" data-act="lotPrefill" data-p="${id}" data-q="${q}" style="cursor:pointer">${sw(p)}${esc(p.nom)} <b>${q}</b></button>`}).join('')}</div></div>`:''}
    <form id="lotForm" class="grid" style="gap:12px" novalidate>
      <div class="row2"><label class="field">Parfum<select id="loParfum">${parfums.filter(p=>p.disponible||p.id===pre.p).map(p=>`<option value="${p.id}"${p.id===pre.p?' selected':''}>${esc(p.nom)}</option>`).join('')}</select></label>
      <label class="field">Quantité (flans)<input id="loQte" type="number" min="1" inputmode="numeric" value="${pre.q||''}"></label></div>
      <label class="field">N° de lot des matières premières<input id="loIngr" placeholder="Lait L2410, œufs 1234, crème C77…"><small>Pour retrouver un ingrédient en cas d’alerte sanitaire.</small></label>
      <p class="msg err" id="loErr" hidden></p>
      <button class="btn" type="submit">Créer le lot du ${esc(fmtDay(day))}</button>
    </form></section>`;
  const cards=todays.length?todays.map(l=>{
    const p=parfum(l.parfum_id)||{},n=nextStep(l),rc=refroidCheck(l),dest=lotDest(l);
    return `<div class="envoi${rc&&!rc.ok?' hot':''}">
      <div class="envoi-h"><span style="display:flex;align-items:center;gap:8px">${sw(p)}<b>${esc(p.nom)}</b> <span class="badge b-mute">${l.quantite} flans</span></span><span class="meta">Lot <b>${esc(l.numero)}</b> · DLC ${esc(fmtDay(l.dlc))}</span></div>
      <div class="steps">${LOT_STEPS.map(s=>`<span class="${l[s.k]?'done':(n&&n.k===s.k?'now':'')}">${s.l}${l[s.k]?' · '+timeOf(l[s.k]):''}${s.t&&l[s.t]!=null?' · '+fmtT(l[s.t]):''}</span>`).join('')}</div>
      ${rc?`<span class="badge ${rc.ok?'b-good':'b-bad'}" style="align-self:flex-start">Refroidissement ${rc.min} min${l.temp_coeur!=null?' · '+fmtT(l.temp_coeur):''} · ${rc.ok?'conforme':'NON conforme (max '+REFROID_MAX_MIN+' min, ≤ '+REFROID_MAX_T+' °C)'}</span>`:''}
      ${n?`<div class="btnrow">${n.t?`<input type="number" step="0.1" inputmode="decimal" id="lt-${l.id}" placeholder="${n.tl}" aria-label="${n.tl}" style="width:130px;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit">`:''}<button class="btn sm" type="button" data-act="lotStep" data-id="${l.id}" data-k="${n.k}">${n.l} : fait</button></div>`:'<span class="badge b-good" style="align-self:flex-start">Lot terminé</span>'}
      ${l.ingredients?`<span class="meta">Matières premières : ${esc(l.ingredients)}</span>`:''}
      ${dest.length?`<span class="meta">Livré à : ${dest.map(([b,q])=>esc(shopName(b))+' ('+q+')').join(', ')}</span>`:''}
      ${isResp(me)||l.created_by===me.id?`<div class="btnrow"><button class="btn ghost sm" type="button" data-act="lotDel" data-id="${l.id}">Supprimer</button></div>`:''}
    </div>`}).join(''):'<p class="empty">Aucun lot ce jour.</p>';
  return `<div class="grid g2" style="align-items:start">${form}<section class="card"><h2>Lots du ${esc(fmtDay(day))} <span class="badge b-mute">${todays.reduce((a,l)=>a+l.quantite,0)} flans</span></h2>${cards}
    <p class="note">Refroidissement rapide : de la sortie du four à ${REFROID_MAX_T} °C à cœur en ${REFROID_MAX_MIN} min maximum. DLC = jour de production + 2 jours.</p></section></div>`;
}
function laboTemps(){
  const eq=equipements.filter(e=>e.actif);
  const today=releves.filter(r=>isoOf(new Date(r.created_at))===todayISO());
  const canEq=isResp(me)||me.role==='chef_patissier';
  return `<div class="grid g2" style="align-items:start">
  <section class="card"><h2>Relever une température</h2>
    ${eq.length?eq.map(e=>{const last=releves.filter(r=>r.equipement_id===e.id).sort((a,b)=>b.created_at<a.created_at?-1:1)[0];const h=hoursSince(last&&last.created_at);
      return `<form class="envoi" data-releve="${e.id}" novalidate>
        <div class="envoi-h"><b>${esc(e.nom)}</b><span class="meta">entre ${fmtT(e.t_min)} et ${fmtT(e.t_max)}</span></div>
        <span class="meta">${last?`Dernier relevé : <b style="${last.conforme?'':'color:var(--bad)'}">${fmtT(last.valeur)}</b> à ${timeOf(last.created_at)}${isoOf(new Date(last.created_at))!==todayISO()?' ('+esc(fmtDay(isoOf(new Date(last.created_at))))+')':''}`:'Jamais relevé'}${h>12?' · <span class="badge b-bad">À relever</span>':''}</span>
        <div class="btnrow"><input name="valeur" type="number" step="0.1" inputmode="decimal" placeholder="°C" aria-label="Température de ${esc(e.nom)}" style="width:110px;min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit;font-size:16px"><input name="action" placeholder="Action corrective si hors limites" aria-label="Action corrective" style="flex:1 1 200px;min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit"><button class="btn sm" type="submit">Enregistrer</button></div>
        <p class="msg err" hidden></p></form>`}).join(''):'<p class="empty">Aucun équipement.</p>'}
    <p class="note">À relever au moins deux fois par jour (ouverture et fermeture du labo). Hors limites : note l’action (réglage, produits déplacés, technicien appelé…).</p>
    ${canEq?`<form id="eqForm" class="grid" style="gap:10px;border-top:1px solid var(--cream);padding-top:12px" novalidate><b style="font-size:14px">Ajouter un équipement</b>
      <label class="field">Nom<input id="eqNom" placeholder="Vitrine réfrigérée, cellule de refroidissement…"></label>
      <div class="row2"><label class="field">Mini (°C)<input id="eqMin" type="number" step="0.5" value="0"></label><label class="field">Maxi (°C)<input id="eqMax" type="number" step="0.5" value="4"></label></div>
      <p class="msg err" id="eqErr" hidden></p><button class="btn ghost sm" type="submit">Ajouter</button></form>`:''}
  </section>
  <section class="card"><h2>Relevés d’aujourd’hui <span class="badge b-mute">${today.length}</span></h2>
    ${today.length?`<div class="tbl-wrap"><table style="min-width:420px"><thead><tr><th>Heure</th><th>Équipement</th><th>Temp.</th><th>Par</th><th>Action</th></tr></thead><tbody>${today.slice().sort((a,b)=>a.created_at<b.created_at?1:-1).map(r=>{const e=equipements.find(x=>x.id===r.equipement_id)||{};return `<tr><td>${timeOf(r.created_at)}</td><td>${esc(e.nom||'?')}</td><td><span class="badge ${r.conforme?'b-good':'b-bad'}">${fmtT(r.valeur)}</span></td><td>${esc(displayName(prof(r.user_id)))}</td><td>${esc(r.action||'')}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="empty">Aucun relevé aujourd’hui.</p>'}
    <p class="note">Tous les relevés sont conservés dans la base, avec l’heure et la personne qui les a faits.</p>
  </section></div>`;
}
function laboRecep(){
  const list=receptions.slice().sort((a,b)=>a.jour<b.jour?1:a.jour>b.jour?-1:(a.created_at<b.created_at?1:-1));
  return `<div class="grid g2" style="align-items:start">
  <section class="card"><h2>Nouvelle réception</h2>
    <form id="recForm" class="grid" style="gap:12px" novalidate>
      <div class="row2"><label class="field">Fournisseur<input id="reFour" list="fourList"></label><label class="field">Produit<input id="reProd" list="prodList" placeholder="Lait entier, œufs…"></label></div>
      <datalist id="fourList">${[...new Set(receptions.map(r=>r.fournisseur))].map(f=>`<option value="${esc(f)}">`).join('')}</datalist>
      <datalist id="prodList">${[...new Set(receptions.map(r=>r.produit).concat(ingredients.map(i=>i.nom)))].map(f=>`<option value="${esc(f)}">`).join('')}</datalist>
      <div class="row2"><label class="field">N° de lot fournisseur<input id="reLot"></label><label class="field">DLC / DDM<input id="reDlc" type="date"></label></div>
      <div class="row2"><label class="field">Température à réception (°C)<input id="reTemp" type="number" step="0.1" inputmode="decimal" placeholder="Produits frais"></label><label class="field">Conformité<select id="reOk"><option value="1">Conforme</option><option value="0">Non conforme</option></select></label></div>
      <label class="field">Remarque<input id="reNote" placeholder="Emballage abîmé, refusé, avoir demandé…"></label>
      <p class="msg err" id="reErr" hidden></p>
      <button class="btn" type="submit">Enregistrer la réception</button>
    </form><p class="note">Contrôle à réception : produits frais ≤ 4 °C, emballage intact, DLC suffisante.</p></section>
  <section class="card"><h2>30 derniers jours <span class="badge b-mute">${list.length}</span></h2>
    ${list.length?`<div class="tbl-wrap"><table style="min-width:560px"><thead><tr><th>Date</th><th>Produit</th><th>Fournisseur</th><th>Lot</th><th>DLC</th><th>Temp.</th><th></th></tr></thead><tbody>${list.map(r=>`<tr><td>${esc(r.jour.slice(8)+'/'+r.jour.slice(5,7))}</td><td><b>${esc(r.produit)}</b>${r.note?`<small style="display:block;color:var(--muted)">${esc(r.note)}</small>`:''}</td><td>${esc(r.fournisseur)}</td><td>${esc(r.lot_fournisseur||'')}</td><td>${r.dlc?esc(r.dlc.slice(8)+'/'+r.dlc.slice(5,7)):''}</td><td>${r.temperature!=null?fmtT(r.temperature):''}</td><td><span class="badge ${r.conforme?'b-good':'b-bad'}">${r.conforme?'OK':'Non conforme'}</span></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Aucune réception enregistrée.</p>'}
  </section></div>`;
}

/* --- Recettes et marges (responsables) --- */
const reg=(k,d)=>reglages[k]!=null?+reglages[k]:d;
function coutFlan(pid){
  const rs=recettes.filter(r=>r.parfum_id===pid&&+r.quantite>0);
  let c=0,complete=rs.length>0;
  rs.forEach(r=>{const i=ingredients.find(x=>x.id===r.ingredient_id);if(!i||i.prix==null)complete=false;else c+=(+r.quantite)*(+i.prix)});
  return {cout:c,complete,n:rs.length};
}
function margeOf(p){
  const tva=reg('tva_vente',5.5),emb=reg('emballage_part',0);
  const cf=coutFlan(p.id),ht=(+p.prix_quart)/(1+tva/100),cp=cf.cout/PARTS+emb;
  return {cf,ht,cp,marge:ht-cp,taux:ht?(ht-cp)/ht:0};
}
function margesView(){
  const sel=ui.margeParfum&&parfum(ui.margeParfum)?parfum(ui.margeParfum):null;
  const since=addDays(todayISO(),-30);
  let parts=0,mb=0,partsInc=0;
  cloturesAll.filter(c=>c.jour>=since).forEach(c=>(c.cloture_lignes||[]).forEach(l=>{const p=parfum(l.parfum_id);if(!p)return;const m=margeOf(p);parts+=l.quarts_vendus||0;if(m.cf.complete)mb+=(l.quarts_vendus||0)*m.marge;else partsInc+=l.quarts_vendus||0}));
  const rows=parfums.slice().sort((a,b)=>(b.disponible-a.disponible)||(a.ordre-b.ordre)).map(p=>({p,m:margeOf(p)}));
  const editor=sel?(()=>{const rs=recettes.filter(r=>r.parfum_id===sel.id);const m=margeOf(sel);const unused=ingredients.filter(i=>!rs.some(r=>r.ingredient_id===i.id));
    return `<section class="card"><div class="envoi-h"><h2 style="display:flex;align-items:center;gap:10px">${sw(sel)} Recette : ${esc(sel.nom)}</h2><button class="btn ghost sm" type="button" data-act="margeSel" data-id="">Fermer</button></div>
      <p class="sub">Quantités pour <b>1 flan entier</b> (${PARTS} parts), dans l’unité de chaque ingrédient.</p>
      ${rs.length?`<div class="tbl-wrap"><table class="ptable" style="min-width:420px"><thead><tr><th>Ingrédient</th><th>Quantité / flan</th><th>Prix</th><th>Coût</th><th></th></tr></thead><tbody>${rs.map(r=>{const i=ingredients.find(x=>x.id===r.ingredient_id)||{};return `<tr><td>${esc(i.nom)}</td><td><input type="number" step="0.001" min="0" inputmode="decimal" data-act="recQte" data-p="${sel.id}" data-i="${r.ingredient_id}" value="${+r.quantite}" style="width:90px" aria-label="Quantité de ${esc(i.nom)}"> ${esc(i.unite||'')}</td><td>${i.prix!=null?eur(i.prix)+' / '+esc(i.unite):'<span class="badge b-gold">prix ?</span>'}</td><td class="num">${i.prix!=null?eur((+r.quantite)*(+i.prix)):'–'}</td><td><button class="btn ghost sm" type="button" data-act="recDel" data-p="${sel.id}" data-i="${r.ingredient_id}">Retirer</button></td></tr>`}).join('')}
        <tr class="total"><td>Coût matières / flan</td><td></td><td></td><td class="num">${eur(m.cf.cout)}</td><td></td></tr></tbody></table></div>`:'<p class="empty">Recette vide.</p>'}
      ${unused.length?`<form id="recAdd" data-p="${sel.id}" class="btnrow" novalidate><select class="inline-sel" id="raIng" aria-label="Ingrédient">${unused.map(i=>`<option value="${i.id}">${esc(i.nom)} (${esc(i.unite)})</option>`).join('')}</select><input id="raQte" type="number" step="0.001" min="0" inputmode="decimal" placeholder="Qté / flan" style="width:110px;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit" aria-label="Quantité"><button class="btn sm" type="submit">Ajouter</button></form>`:''}
    </section>`})():'';
  return `<div class="page">
  <div class="head"><div><h1>Recettes et marges</h1><p>Coût de revient par flan et par part, marge sur le prix de vente</p></div></div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Marge brute · 30 jours</span><span class="val num">${eur(mb)}</span><span class="hint">${partsInc?partsInc+' parts sans coût connu non comptées':'sur '+parts+' parts vendues'}</span></div>
    <div class="card kpi"><span class="lbl">Parts vendues · 30 jours</span><span class="val num">${parts}</span><span class="hint">d’après les clôtures</span></div>
    <label class="card kpi"><span class="lbl">Emballage par part (€ HT)</span><input type="number" step="0.01" min="0" inputmode="decimal" data-act="reglage" data-k="emballage_part" value="${reg('emballage_part',0)}" style="font-family:var(--f-title);font-size:28px;font-weight:700;border:1px solid var(--line2);border-radius:10px;padding:4px 10px;width:100%"><span class="hint">assiette, cuillère, sachet…</span></label>
    <label class="card kpi"><span class="lbl">TVA sur la vente (%)</span><input type="number" step="0.1" min="0" inputmode="decimal" data-act="reglage" data-k="tva_vente" value="${reg('tva_vente',5.5)}" style="font-family:var(--f-title);font-size:28px;font-weight:700;border:1px solid var(--line2);border-radius:10px;padding:4px 10px;width:100%"><span class="hint">5,5 % à emporter, à confirmer avec le comptable</span></label>
  </section>
  ${editor}
  <section class="card"><h2>Marge par parfum</h2>
    <div class="tbl-wrap"><table style="min-width:680px"><thead><tr><th>Parfum</th><th>Coût / flan</th><th>Coût / part</th><th>Prix part HT</th><th>Marge / part</th><th>Taux</th><th></th></tr></thead><tbody>
    ${rows.map(({p,m})=>`<tr style="${p.disponible?'':'opacity:.6'}"><td>${sw(p)} ${esc(p.nom)}</td><td class="num">${m.cf.n?eur(m.cf.cout)+(m.cf.complete?'':' <span class="badge b-gold">incomplet</span>'):'<span class="badge b-mute">recette vide</span>'}</td><td class="num">${m.cf.complete?eur(m.cp):'–'}</td><td class="num">${eur(m.ht)}</td><td class="num">${m.cf.complete?`<b style="${m.marge<0?'color:var(--bad)':''}">${eur(m.marge)}</b>`:'–'}</td><td class="num">${m.cf.complete?Math.round(m.taux*100)+' %':'–'}</td><td><button class="btn ghost sm" type="button" data-act="margeSel" data-id="${p.id}">Recette</button></td></tr>`).join('')}
    </tbody></table></div></section>
  <section class="card"><h2>Ingrédients <span class="badge b-mute">${ingredients.length}</span></h2>
    <p class="sub">Prix HT par unité (kg, litre ou pièce). Un ingrédient sans prix rend la marge du parfum « incomplète ».</p>
    <div class="tbl-wrap"><table class="ptable" style="min-width:560px"><thead><tr><th>Ingrédient</th><th>Unité</th><th>Prix HT</th><th>Fournisseur</th></tr></thead><tbody>
    ${ingredients.map(i=>`<tr><td><b>${esc(i.nom)}</b></td><td><select class="inline-sel" data-act="ingUp" data-id="${i.id}" data-k="unite" aria-label="Unité">${['kg','L','pièce'].map(u=>`<option${u===i.unite?' selected':''}>${u}</option>`).join('')}</select></td><td><input type="number" step="0.01" min="0" inputmode="decimal" data-act="ingUp" data-id="${i.id}" data-k="prix" value="${i.prix??''}" placeholder="?" style="width:90px" aria-label="Prix de ${esc(i.nom)}"> €</td><td><input data-act="ingUp" data-id="${i.id}" data-k="fournisseur" value="${esc(i.fournisseur||'')}" style="width:100%;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit" aria-label="Fournisseur de ${esc(i.nom)}"></td></tr>`).join('')}
    </tbody></table></div>
    <form id="ingForm" class="btnrow" novalidate><input id="inNom" placeholder="Nouvel ingrédient" style="flex:1 1 200px;min-height:44px;border:1px solid var(--line2);border-radius:12px;padding:0 12px;font:inherit" aria-label="Nom de l’ingrédient"><select class="inline-sel" id="inUnite" aria-label="Unité"><option>kg</option><option>L</option><option>pièce</option></select><button class="btn sm" type="submit">Ajouter</button></form>
  </section></div>`;
}

/* --- Comptabilité (direction) --- */
const CAT_DEP=['Matières premières','Emballages','Loyer et charges','Salaires','Charges sociales (URSSAF)','Énergie','Transport et livraison','Marketing','Équipement et entretien','Impôts et taxes','Banque et assurances','Autre'];
const CAT_REC=['Événements et entreprises','Franchises et redevances','Commandes hors appli','Autre'];
const monthOf=d=>d.slice(0,7);
const monthLabel=m=>{const [y,mo]=m.split('-').map(Number);return MOIS[mo-1]+' '+y};
const lastOfMonth=m=>{const [y,mo]=m.split('-').map(Number);return isoOf(new Date(y,mo,0))};
async function loadCompta(m){
  compta={mois:m,loading:true,clotures:[],ecritures:[],echeances:[],commandes:[]};
  const [c,e,ech,cmd]=await Promise.all([
    sb.from('clotures').select('jour, cloture_lignes(parfum_id,quarts_vendus)').gte('jour',m+'-01').lte('jour',lastOfMonth(m)),
    sb.from('ecritures').select('*').gte('jour',m+'-01').lte('jour',lastOfMonth(m)).order('jour'),
    sb.from('ecritures').select('*').eq('paye',false).order('echeance'),
    sb.from('commandes').select('total,retrait_jour').eq('statut','retiree').gte('retrait_jour',m+'-01').lte('retrait_jour',lastOfMonth(m))
  ]);
  if(e.error){toast(/ecritures/.test(e.error.message||'')?'Base pas à jour : lance etape3.sql dans Supabase.':frErr(e.error))}
  if(compta.mois!==m)return;
  compta={mois:m,loading:false,clotures:c.data||[],ecritures:e.data||[],echeances:ech.data||[],commandes:cmd.data||[]};
  if(route==='compta')render();
}
const ht=(ttc,tva)=>(+ttc)/(1+(+tva)/100);
function comptaView(){
  const m=ui.mois||monthOf(todayISO());
  if(!compta||compta.mois!==m){loadCompta(m);return `<div class="page"><p class="empty">Chargement de ${esc(monthLabel(m))}…</p></div>`}
  const tvaV=reg('tva_vente',5.5);
  const caDay={};compta.clotures.forEach(c=>{caDay[c.jour]=(caDay[c.jour]||0)+(c.cloture_lignes||[]).reduce((a,l)=>{const p=parfum(l.parfum_id);return a+(l.quarts_vendus||0)*(p?+p.prix_quart:0)},0)});
  const caTTC=Object.values(caDay).reduce((a,b)=>a+b,0),caHT=caTTC/(1+tvaV/100);
  const rec=compta.ecritures.filter(e=>e.sens==='recette'),dep=compta.ecritures.filter(e=>e.sens==='depense');
  const cmdTTC=(compta.commandes||[]).reduce((a,x)=>a+(+x.total),0);
  const recTTC=rec.reduce((a,e)=>a+(+e.montant_ttc),0)+cmdTTC,recHT=rec.reduce((a,e)=>a+ht(e.montant_ttc,e.tva),0)+cmdTTC/(1+tvaV/100);
  const depTTC=dep.reduce((a,e)=>a+(+e.montant_ttc),0),depHT=dep.reduce((a,e)=>a+ht(e.montant_ttc,e.tva),0);
  const resultat=caHT+recHT-depHT;
  const tvaColl=(caTTC-caHT)+(recTTC-recHT),tvaDed=depTTC-depHT;
  const cat={};dep.forEach(e=>cat[e.categorie]=(cat[e.categorie]||0)+(+e.montant_ttc));
  const catArr=Object.entries(cat).sort((a,b)=>b[1]-a[1]);const cmax=Math.max(1,...catArr.map(x=>x[1]));
  // graphique CA par jour
  const last=+lastOfMonth(m).slice(8),vals=Array.from({length:last},(_,i)=>caDay[m+'-'+pad(i+1)]||0),vmax=Math.max(1,...vals);
  const step=vmax<=200?50:vmax<=500?100:vmax<=2000?500:vmax<=5000?1000:2000,top=Math.ceil(vmax/step)*step;
  const W=760,H=200,L=44,B=24,bw=(W-L-6)/last;
  let svg='';for(let v=0;v<=top;v+=step){const y=8+(H-8-B)*(1-v/top);svg+=`<line x1="${L}" x2="${W-4}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`}
  vals.forEach((v,i)=>{const h=(H-8-B)*(v/top),x=L+i*bw+bw*.15;if(v)svg+=`<rect x="${x}" y="${H-B-h}" width="${bw*.7}" height="${Math.max(h,1)}" rx="2" fill="var(--gold)"><title>${i+1} : ${eur(v)}</title></rect>`;if((i+1)%5===1||i+1===last)svg+=`<text x="${x+bw*.35}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--muted)">${i+1}</text>`});
  const ech=compta.echeances.slice(0,10);
  return `<div class="page">
  <div class="head"><div><h1>Comptabilité</h1><p>Réservée à la direction · montants estimés, à valider avec le comptable</p></div>
    <div class="daynav" role="group" aria-label="Choisir le mois"><button class="iconbtn" type="button" data-act="mois" data-d="-1" aria-label="Mois précédent">‹</button><b>${esc(monthLabel(m))}</b><button class="iconbtn" type="button" data-act="mois" data-d="1" aria-label="Mois suivant">›</button></div></div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">CA boutiques (TTC)</span><span class="val num">${eur(caTTC)}</span><span class="hint">${compta.clotures.length} clôture${compta.clotures.length>1?'s':''} · ${eur(caHT)} HT</span></div>
    <div class="card kpi"><span class="lbl">Autres recettes (TTC)</span><span class="val num">${eur(recTTC)}</span><span class="hint">dont ${eur(cmdTTC)} de commandes clients retirées</span></div>
    <div class="card kpi"><span class="lbl">Dépenses (TTC)</span><span class="val num">${eur(depTTC)}</span><span class="hint">${eur(depHT)} HT</span></div>
    <div class="card kpi"><span class="lbl">Résultat estimé (HT)</span><span class="val num" style="color:${resultat>=0?'var(--good)':'var(--bad)'}">${eur(resultat)}</span><span class="hint">TVA à reverser ≈ ${eur(tvaColl-tvaDed)}</span></div>
  </section>
  <section class="card"><h2>Chiffre d’affaires par jour</h2><div class="tbl-wrap"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:520px;height:auto;display:block" role="img" aria-label="Chiffre d’affaires TTC par jour">${svg}</svg></div><p class="note">CA calculé avec les prix actuels des parfums × parts vendues des clôtures.</p></section>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Ajouter une écriture</h2>
      <form id="ecrForm" class="grid" style="gap:12px" novalidate>
        <div class="row2"><label class="field">Type<select id="ecSens"><option value="depense">Dépense</option><option value="recette">Recette</option></select></label><label class="field">Date<input id="ecJour" type="date" value="${monthOf(todayISO())===m?todayISO():m+'-01'}"></label></div>
        <div class="row2"><label class="field">Catégorie<select id="ecCat">${CAT_DEP.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><label class="field">Fournisseur / client<input id="ecTiers"></label></div>
        <label class="field">Libellé<input id="ecLib" placeholder="Facture lait septembre, loyer Saint-Lazare…"></label>
        <div class="row2"><label class="field">Montant TTC (€)<input id="ecMt" type="number" step="0.01" min="0" inputmode="decimal"></label><label class="field">TVA<select id="ecTva"><option value="20">20 %</option><option value="10">10 %</option><option value="5.5">5,5 %</option><option value="0">0 % (salaires, URSSAF…)</option></select></label></div>
        <div class="row2"><label class="field">Échéance (si à payer)<input id="ecEch" type="date"></label><label class="field">Statut<select id="ecPaye"><option value="1">Payé / encaissé</option><option value="0">À payer</option></select></label></div>
        <p class="msg err" id="ecErr" hidden></p><button class="btn" type="submit">Enregistrer</button></form></section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Échéances à venir <span class="badge ${ech.length?'b-gold':'b-mute'}">${compta.echeances.length}</span></h2>
        ${ech.length?ech.map(e=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span><b>${esc(e.libelle)}</b><small style="display:block;color:var(--muted)">${e.echeance?(e.echeance<todayISO()?'<span style="color:var(--bad)">En retard · </span>':'')+esc(fmtDay(e.echeance)):'Sans échéance'} · ${eur(e.montant_ttc)}</small></span><button class="btn ghost sm" type="button" data-act="ecrPaye" data-id="${e.id}">Marquer payé</button></div>`).join(''):'<p class="empty">Rien à payer.</p>'}</section>
      <section class="card"><h2>Dépenses par catégorie</h2>${catArr.length?`<div class="bars">${catArr.map(([c,v])=>`<div class="bar" style="grid-template-columns:minmax(0,11rem) minmax(0,1fr) 6rem"><span class="name">${esc(c)}</span><span class="track"><span class="fill" style="display:block;width:${v/cmax*100}%"></span></span><span class="n num">${eur(v)}</span></div>`).join('')}</div>`:'<p class="empty">Aucune dépense ce mois.</p>'}</section>
    </div>
  </div>
  <section class="card"><h2>Écritures de ${esc(monthLabel(m))} <span class="badge b-mute">${compta.ecritures.length}</span></h2>
    ${compta.ecritures.length?`<div class="tbl-wrap"><table style="min-width:640px"><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>TTC</th><th>TVA</th><th>Statut</th><th></th></tr></thead><tbody>${compta.ecritures.map(e=>`<tr><td>${esc(e.jour.slice(8)+'/'+e.jour.slice(5,7))}</td><td><b>${esc(e.libelle)}</b>${e.tiers?`<small style="display:block;color:var(--muted)">${esc(e.tiers)}</small>`:''}</td><td><span class="badge ${e.sens==='recette'?'b-good':'b-mute'}">${e.sens==='recette'?'Recette':'Dépense'}</span> ${esc(e.categorie)}</td><td class="num">${e.sens==='recette'?'+':'−'}${eur(e.montant_ttc)}</td><td class="num">${String(e.tva).replace('.',',')} %</td><td>${e.paye?'<span class="badge b-good">Payé</span>':'<span class="badge b-gold">À payer</span>'}</td><td><button class="btn ghost sm" type="button" data-act="ecrDel" data-id="${e.id}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Aucune écriture ce mois.</p>'}
  </section></div>`;
}

/* ================= ÉTAPE 4 : pointage, borne, heures, agenda ================= */
const PT_LBL={arrivee:'Arrivée',pause_debut:'Début de pause',pause_fin:'Fin de pause',depart:'Départ'};
const PT_BTN={arrivee:'Je commence',pause_debut:'Je pars en pause',pause_fin:'Je reprends',depart:'Je termine'};
const hm=min=>{min=Math.round(min||0);const s=min<0?'−':'';min=Math.abs(min);return s+Math.floor(min/60)+'h'+pad(min%60)};
const weekStart=d=>{const x=parseISO(d);const k=(x.getDay()+6)%7;x.setDate(x.getDate()-k);return isoOf(x)};
const minOf=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return h*60+(m||0)};
function plannedMin(rows){return rows.reduce((a,p)=>{const d=minOf(p.debut),f=minOf(p.fin);return a+(d!=null&&f!=null&&f>d?f-d:0)},0)}
function workOf(list,isPast){
  const L=list.slice().sort((a,b)=>a.at<b.at?-1:1);let min=0,start=null,state='out';const an=[];
  for(const p of L){const t=new Date(p.at);
    if(p.type==='arrivee'){if(state==='in')an.push('Deux arrivées de suite');start=t;state='in'}
    else if(p.type==='pause_debut'){if(state==='in'){min+=(t-start)/6e4;state='pause'}else an.push('Pause sans arrivée')}
    else if(p.type==='pause_fin'){if(state==='pause'){start=t;state='in'}else an.push('Fin de pause sans début')}
    else if(p.type==='depart'){if(state==='in')min+=(t-start)/6e4;else if(state!=='pause')an.push('Départ sans arrivée');state='done'}}
  let live=0;if(state==='in'&&!isPast)live=(Date.now()-start)/6e4;
  if(isPast&&state==='in')an.push('Oubli de départ');
  if(isPast&&state==='pause')an.push('Pause jamais terminée');
  return {min,live,state,an,first:L.find(p=>p.type==='arrivee')};
}
const nextActions=state=>state==='in'?['pause_debut','depart']:state==='pause'?['pause_fin']:['arrivee'];

/* --- Mes heures (lecture seule : le pointage se fait sur la borne) --- */
function pointageView(){
  const t=todayISO(),ws=weekStart(t);
  const mineToday=mesPointages.filter(p=>p.jour===t);
  const w=workOf(mineToday,false);
  const aff=monPlanning.filter(p=>p.jour===t);
  const days=Array.from({length:7},(_,i)=>{const d=addDays(ws,i);const x=workOf(mesPointages.filter(p=>p.jour===d),d<t);return {d,pm:plannedMin(monPlanning.filter(p=>p.jour===d)),wm:x.min+x.live,an:x.an,n:mesPointages.filter(p=>p.jour===d).length}});
  const wkP=days.reduce((a,x)=>a+x.pm,0),wkW=days.reduce((a,x)=>a+x.wm,0);
  return `<div class="page">
  <div class="head"><div><h1>Mes heures</h1><p>Le pointage se fait sur la <b>borne</b> du labo ou de la boutique, avec ton code personnel.</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card" style="gap:14px">
      <div class="banner"><span class="k">${w.state==='in'?'En service':w.state==='pause'?'En pause':w.state==='done'?'Journée terminée':'Pas encore pointé aujourd’hui'}</span><span class="v">${hm(w.min+w.live)} aujourd’hui</span><span class="s">${aff.length?aff.map(a=>esc(lieuLabel(a))+(a.debut?' · '+hhmm(a.debut)+(a.fin?' – '+hhmm(a.fin):''):'')).join(' / '):'Pas d’affectation prévue aujourd’hui'}</span></div>
      ${mineToday.length?mineToday.slice().sort((a,b)=>a.at<b.at?-1:1).map(p=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--cream)"><span>${PT_LBL[p.type]}</span><b class="num">${timeOf(p.at)}${p.source==='correction'?' <span class="badge b-gold">corrigé</span>':''}</b></div>`).join(''):'<p class="empty">Aucun pointage aujourd’hui.</p>'}
      ${pinPointage===false?'<a class="btn ghost sm" href="#profil">Créer mon code de pointage</a>':''}
      <p class="note">Un oubli ou une erreur ? Préviens un responsable : il corrige dans « Heures ».</p>
    </section>
    <section class="card"><h2>Ma semaine</h2>
      <div class="grid g2" style="gap:8px"><div class="kpi"><span class="lbl">Pointé</span><span class="val num" style="font-size:30px">${hm(wkW)}</span></div><div class="kpi"><span class="lbl">Prévu au planning</span><span class="val num" style="font-size:30px">${hm(wkP)}</span></div></div>
      ${days.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--cream);${x.d===t?'font-weight:700':''}"><span style="text-transform:capitalize">${esc(fmtDay(x.d))}</span><span class="num">${x.n?hm(x.wm):'–'}${x.pm?` <small style="color:var(--muted)">/ ${hm(x.pm)}</small>`:''}${x.an.length?' <span class="badge b-bad">'+esc(x.an[0])+'</span>':''}</span></div>`).join('')}
    </section>
  </div></div>`;
}

/* --- Borne de pointage (tablette partagée, code PIN personnel) --- */
let borne={pin:'',step:'pin',info:null,msg:'',err:'',busy:false},borneT=null,borneClock=null;
function borneReset(){borne={pin:'',step:'pin',info:null,msg:'',err:'',busy:false};clearTimeout(borneT);if(route&&me&&me.role==='borne')render()}
function borneView(){
  const now=new Date(),clock=pad(now.getHours())+':'+pad(now.getMinutes());
  if(!borneClock)borneClock=setInterval(()=>{const c=document.getElementById('bClock');if(c){const n=new Date();c.textContent=pad(n.getHours())+':'+pad(n.getMinutes())}},15000);
  const I=borne.info;
  const left=`<section class="b-left"><div style="display:flex;align-items:center;gap:14px"><img src="icons/logo.png" alt="" style="width:64px;height:64px;background:#fff;border-radius:12px;object-fit:contain"><span style="display:flex;flex-direction:column"><span style="font-family:var(--f-title);font-size:22px">Borne de pointage</span><span style="color:#BDB6A8;font-size:14px">${esc(me.boutique_id&&boutiques.find(b=>b.id===me.boutique_id)?shopName(me.boutique_id):'Labo')} · <a href="#profil" style="color:#BDB6A8">réglages</a></span></span></div>
    <div><div id="bClock" style="font-family:var(--f-title);font-size:96px;font-weight:300;line-height:1;color:var(--gold-l)">${clock}</div><div style="font-size:20px;color:#D9D3C7;text-transform:capitalize">${esc(fmtDay(todayISO()))}</div></div>
    ${borne.step==='done'?`<div role="status" style="border:1px solid var(--gold-l);padding:18px;border-radius:14px;display:flex;flex-direction:column;gap:6px"><span style="color:#BDB6A8;font-size:14px">Pointage enregistré</span><span style="font-family:var(--f-title);font-size:26px">${esc(borne.msg)}</span></div>`:`<div style="color:#BDB6A8;font-size:15px;line-height:1.7">1. Tape ton code personnel, puis OK<br>2. Choisis : arrivée, pause ou départ<br>3. Signe avec le doigt<br><span style="font-size:13px;color:#8C857A">Pas de code ? Crée-le dans l’appli : Mon profil → Code de pointage.</span></div>`}</section>`;
  let right='';
  if(borne.step==='sign'&&I){
    right=`<div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:460px"><span style="font-family:var(--f-title);font-size:26px">${esc(PT_BTN[borne.action])}</span>
      <span style="color:#BDB6A8;font-size:15px">${esc(I.prenom||'')}, signe dans le cadre avec ton doigt.</span>
      <canvas id="bSig" width="600" height="240" style="width:100%;aspect-ratio:5/2;background:#fff;border-radius:14px;touch-action:none;cursor:crosshair"></canvas>
      <span id="bSigErr" role="alert" style="min-height:1.2em;color:#F08A7A;font-size:14px"></span>
      <div style="display:flex;gap:10px"><button type="button" class="b-act" data-act="sigClear" style="flex:1">Effacer</button><button type="button" class="b-act main" id="bSigOk" data-act="sigOk" style="flex:2">Valider le pointage</button></div>
      <button type="button" class="link" data-act="borneReset" style="color:#BDB6A8">Annuler</button></div>`;
  }else if(borne.step==='action'&&I){
    const st=I.dernier==='arrivee'||I.dernier==='pause_fin'?'in':I.dernier==='pause_debut'?'pause':I.dernier==='depart'?'done':'out';
    const sugg=nextActions(st);
    right=`<div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:420px"><span style="font-family:var(--f-title);font-size:30px">Bonjour ${esc(I.prenom||'')}</span>
      <span style="color:#BDB6A8;font-size:15px">${(I.planning||[]).length?I.planning.map(p=>esc(p.lieu==='boutique'?p.boutique:{labo:'Labo',tournee:'Tournée',bureau:'Bureau'}[p.lieu]||p.lieu)+(p.debut?' · '+hhmm(p.debut)+(p.fin?' – '+hhmm(p.fin):''):'')).join(' / '):'Pas d’affectation prévue aujourd’hui'}</span>
      ${['arrivee','pause_debut','pause_fin','depart'].map(a=>`<button type="button" class="b-act${sugg[0]===a?' main':''}" data-act="borneSign" data-type="${a}">${PT_BTN[a]}</button>`).join('')}
      <button type="button" class="link" data-act="borneReset" style="color:#BDB6A8">Ce n’est pas moi</button></div>`;
  }else{
    right=`<div style="display:flex;flex-direction:column;gap:20px;align-items:center"><span style="font-family:var(--f-title);font-size:24px">Ton code</span>
      <div style="display:flex;gap:14px;min-height:20px">${Array.from({length:Math.max(4,borne.pin.length)},(_,i)=>`<span style="width:20px;height:20px;border-radius:999px;${i<borne.pin.length?'background:var(--gold-l)':'border:2px solid #5A5A5A'}"></span>`).join('')}</div>
      <span role="alert" style="min-height:1.4em;color:#F08A7A;font-size:15px">${esc(borne.err)}</span>
      <div class="b-pad">${['1','2','3','4','5','6','7','8','9','del','0','ok'].map(k=>`<button type="button" data-act="borneKey" data-k="${k}" aria-label="${k==='del'?'Effacer':k==='ok'?'Valider':k}" class="${k==='ok'?'ok':''}"${borne.busy?' disabled':''}>${k==='del'?'⌫':k==='ok'?'OK':k}</button>`).join('')}</div></div>`;
  }
  return `<div class="borne">${left}<section class="b-right">${right}</section></div>`;
}
let sigStrokes=[];
function sigInit(){
  const c=document.getElementById('bSig');if(!c||c.dataset.ready)return;c.dataset.ready='1';sigStrokes=[];
  const ctx=c.getContext('2d');ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#141414';
  let cur=null;
  const pt=e=>{const r=c.getBoundingClientRect();return [Math.round((e.clientX-r.left)/r.width*300),Math.round((e.clientY-r.top)/r.height*120)]};
  const draw=()=>{ctx.clearRect(0,0,c.width,c.height);sigStrokes.forEach(st=>{ctx.beginPath();st.forEach(([x,y],i)=>{const X=x*2,Y=y*2;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});if(st.length===1)ctx.lineTo(st[0][0]*2+1,st[0][1]*2+1);ctx.stroke()})};
  c.addEventListener('pointerdown',e=>{e.preventDefault();const er=document.getElementById('bSigErr');if(er)er.textContent='';c.setPointerCapture(e.pointerId);cur=[pt(e)];sigStrokes.push(cur);draw();clearTimeout(borneT);borneT=setTimeout(borneReset,45000)});
  c.addEventListener('pointermove',e=>{if(!cur)return;const p=pt(e),l=cur[cur.length-1];if(Math.abs(p[0]-l[0])+Math.abs(p[1]-l[1])>=2){cur.push(p);draw()}});
  const end=()=>{cur=null};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
  c._redraw=draw;
}
const sigPath=()=>sigStrokes.filter(s=>s.length).map(s=>s.map(([x,y],i)=>(i?'L':'M')+' '+Math.max(0,x)+' '+Math.max(0,y)).join(' ')).join(' ');
const sigSVG=(d,h)=>d&&/^[ML0-9 ]+$/.test(d)?`<svg viewBox="0 0 300 120" style="height:${h||36}px;width:auto;background:#fff;border:1px solid var(--line);border-radius:6px;vertical-align:middle" role="img" aria-label="Signature"><path d="${d}" fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`:'';
async function borneCall(action,signature){
  if(borne.busy)return;borne.busy=true;borne.err='';if(borne.step!=='sign')render();
  try{
    const {data,error}=await sb.rpc('pointer_borne',{p_pin:borne.pin,p_action:action||null,p_signature:signature||null});
    if(error)throw error;
    if(!data||!data.ok){borne={pin:'',step:'pin',info:null,msg:'',err:'Code inconnu, réessaie',busy:false};return render()}
    if(action){borne={pin:'',step:'done',info:null,msg:PT_LBL[action]+' à '+data.heure+(data.prenom?' · '+data.prenom:''),err:'',busy:false};render();clearTimeout(borneT);borneT=setTimeout(borneReset,6000);return}
    borne.info=data;borne.step='action';borne.busy=false;render();clearTimeout(borneT);borneT=setTimeout(borneReset,30000);
  }catch(e){borne={pin:'',step:'pin',info:null,msg:'',err:frErr(e),busy:false};render()}
}

/* --- Heures et pointages (responsables) --- */
let heuresData=null;
async function loadHeures(ws){
  heuresData={ws,loading:true,pointages:[],planning:[],valid:[]};
  const we=addDays(ws,6);
  const [p,pl,va]=await Promise.all([sb.from('pointages').select('*').gte('jour',ws).lte('jour',we).order('at'),sb.from('planning').select('*').gte('jour',ws).lte('jour',we),sb.from('heures_validations').select('*').gte('jour',ws).lte('jour',we)]);
  if(p.error&&/pointages/.test(p.error.message||''))toast('Base pas à jour : lance etape4.sql dans Supabase.');
  if(!heuresData||heuresData.ws!==ws)return;
  heuresData={ws,loading:false,pointages:p.data||[],planning:pl.data||[],valid:va.data||[]};
  if(route==='heures')render();
}
const H_SEUILS=[['h_avance','Arrivée en avance de plus de',30],['h_retard','Retard de plus de',10],['h_depart_tard','Départ après l’heure prévue de plus de',30],['h_depart_tot','Départ anticipé de plus de',15]];
const seuil=k=>{const d=H_SEUILS.find(x=>x[0]===k);const v=reg(k,d?d[2]:0);return isFinite(v)&&v>=0?v:(d?d[2]:0)};
const lieuNom=l=>l==='labo'?'Labo':shopName(l);
const tmin=ts=>{const f=new Date(ts);return f.getHours()*60+f.getMinutes()};
function dayAnomalies(pts,pl,d,t){
  const w=workOf(pts,d<t),an=w.an.slice();
  const deb=pl.map(x=>minOf(x.debut)).filter(x=>x!=null).sort((a,b)=>a-b)[0];
  const fin=pl.map(x=>minOf(x.fin)).filter(x=>x!=null).sort((a,b)=>b-a)[0];
  if(w.first&&deb!=null){const m=tmin(w.first.at)-deb;if(m>seuil('h_retard'))an.push('Retard de '+m+' min');else if(-m>seuil('h_avance'))an.push('Arrivée '+(-m)+' min avant l’heure prévue')}
  const dep=pts.filter(x=>x.type==='depart').sort((a,b)=>a.at<b.at?1:-1)[0];
  if(dep&&fin!=null){const m=tmin(dep.at)-fin;if(m>seuil('h_depart_tard'))an.push('Départ '+m+' min après l’heure prévue');else if(-m>seuil('h_depart_tot'))an.push('Départ anticipé de '+(-m)+' min')}
  if(pl.length&&!pts.length&&d<t)an.push('Absent (prévu au planning)');
  if(pts.length&&!pl.length)an.push('Pointé sans être au planning');
  if(pl.length&&!pl.some(x=>x.lieu==='bureau')){
    const ok=new Set(pl.map(x=>x.lieu==='boutique'?x.boutique_id:'labo'));
    const bad=[...new Set(pts.filter(x=>x.source==='borne'&&x.borne_lieu&&!ok.has(x.borne_lieu)).map(x=>x.borne_lieu))];
    if(bad.length)an.push('Pointé à '+bad.map(lieuNom).join(', ')+' (prévu : '+[...ok].map(lieuNom).join(', ')+')');
  }
  return {w,an};
}
function weekRows(H){
  const t=todayISO();
  const staff=profiles.filter(p=>p.actif&&!['aucun','borne'].includes(p.role));
  return staff.map(u=>{let P=0,W=0;const days=[];
    for(let i=0;i<7;i++){const d=addDays(H.ws,i);const pl=H.planning.filter(x=>x.user_id===u.id&&x.jour===d);const pts=H.pointages.filter(x=>x.user_id===u.id&&x.jour===d);
      const pm=plannedMin(pl),{w,an}=dayAnomalies(pts,pl,d,t);const valid=(H.valid||[]).find(v=>v.user_id===u.id&&v.jour===d)||null;
      P+=pm;W+=w.min+w.live;days.push({d,pm,wm:w.min+w.live,an:valid?[]:an,anAll:an,valid,n:pts.length});}
    return {u,P,W,days};}).filter(r=>r.P||r.W||r.days.some(x=>x.n));
}
function heuresView(){
  const ws=ui.semaine||weekStart(todayISO());
  if(!heuresData||heuresData.ws!==ws){loadHeures(ws);return `<div class="page"><p class="empty">Chargement de la semaine…</p></div>`}
  const H=heuresData,rows=weekRows(H);
  const anomalies=[];rows.forEach(r=>r.days.forEach(x=>x.an.forEach(a=>anomalies.push({u:r.u,d:x.d,a}))));
  const T=rows.reduce((a,r)=>({P:a.P+r.P,W:a.W+r.W}),{P:0,W:0});
  const sel=ui.hSel&&prof(ui.hSel.u)?ui.hSel:null;
  const detail=sel?(()=>{const pts=H.pointages.filter(x=>x.user_id===sel.u&&x.jour===sel.d).sort((a,b)=>a.at<b.at?-1:1);const u=prof(sel.u);
    return `<section class="card" style="border-color:var(--gold)"><div class="envoi-h"><h2>${esc(displayName(u))} · ${esc(fmtDay(sel.d))}</h2><button class="btn ghost sm" type="button" data-act="hSel" data-u="">Fermer</button></div>
      ${pts.length?pts.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${PT_LBL[p.type]} · <b class="num">${timeOf(p.at)}</b> <span class="badge ${p.source==='correction'?'b-gold':'b-mute'}">${p.source==='correction'?'corrigé':p.source==='borne'?'borne · '+esc(lieuNom(p.borne_lieu||'labo')):p.source}</span>${sigSVG(p.signature,34)}${p.note?` <small style="color:var(--muted)">${esc(p.note)}</small>`:''}</span><button class="btn ghost sm" type="button" data-act="ptDel" data-id="${p.id}">Supprimer</button></div>`).join(''):'<p class="empty">Aucun pointage.</p>'}
      <form id="ptForm" class="btnrow" data-u="${sel.u}" data-d="${sel.d}" novalidate><select class="inline-sel" id="ptType" aria-label="Type">${Object.entries(PT_LBL).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><input id="ptHeure" type="time" required aria-label="Heure" style="min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit"><input id="ptNote" placeholder="Motif de la correction" aria-label="Motif" style="flex:1 1 180px;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit"><button class="btn sm" type="submit">Ajouter</button></form>
      <p class="msg err" id="ptErr" hidden></p>
      ${(()=>{const pl=H.planning.filter(x=>x.user_id===sel.u&&x.jour===sel.d);const {an}=dayAnomalies(pts,pl,sel.d,todayISO());const v=(H.valid||[]).find(x=>x.user_id===sel.u&&x.jour===sel.d);
        return `<div class="grid" style="gap:8px;border-top:1px solid var(--cream);padding-top:12px">${an.length?`<div class="chips">${an.map(a=>`<span class="chip" style="border-color:var(--bad)">${esc(a)}</span>`).join('')}</div>`:'<span class="meta">Aucune anomalie détectée.</span>'}
        ${v?`<div class="btnrow"><span class="badge b-good">Journée validée par ${esc(displayName(prof(v.valide_par)))}</span>${v.note?`<span class="meta">${esc(v.note)}</span>`:''}<button class="btn ghost sm" type="button" data-act="hUnvalid" data-u="${sel.u}" data-d="${sel.d}">Annuler la validation</button></div>`
           :`<div class="btnrow"><input id="hvNote" placeholder="Note (ex. : renfort demandé, retard justifié)" aria-label="Note de validation" style="flex:1 1 220px;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit"><button class="btn sm" type="button" data-act="hValid" data-u="${sel.u}" data-d="${sel.d}">Valider la journée</button></div>`}</div>`})()}
      </section>`})():'';
  return `<div class="page">
  <div class="head"><div><h1>Heures et pointages</h1><p>Semaine du ${esc(fmtDay(ws))} · prévu au planning / pointé</p></div>
    <div class="daynav"><button class="iconbtn" type="button" data-act="semaine" data-d="-7" aria-label="Semaine précédente">‹</button><b>Sem. du ${parseISO(ws).getDate()} ${MOIS[parseISO(ws).getMonth()]}</b><button class="iconbtn" type="button" data-act="semaine" data-d="7" aria-label="Semaine suivante">›</button></div></div>
  <section class="grid g4">
    <div class="card kpi"><span class="lbl">Heures pointées</span><span class="val num">${hm(T.W)}</span><span class="hint">${rows.length} personne${rows.length>1?'s':''}</span></div>
    <div class="card kpi"><span class="lbl">Heures prévues</span><span class="val num">${hm(T.P)}</span><span class="hint">d’après le planning</span></div>
    <div class="card kpi"><span class="lbl">Écart</span><span class="val num" style="color:${T.W-T.P>0?'var(--gold-d)':'inherit'}">${hm(T.W-T.P)}</span><span class="hint">pointé − prévu</span></div>
    <div class="card kpi"><span class="lbl">Anomalies</span><span class="val num" style="color:${anomalies.length?'var(--bad)':'inherit'}">${anomalies.length}</span><span class="hint">non validées · horaires, lieu, oublis</span></div>
  </section>
  ${detail}
  <section class="card"><div class="envoi-h"><h2>Semaine</h2><div class="btnrow"><button class="btn ghost sm" type="button" data-act="csvWeek">Exporter la semaine (CSV)</button><button class="btn ghost sm" type="button" data-act="csvMonth">Exporter le mois (CSV)</button></div></div>
    <div class="tbl-wrap"><table style="min-width:860px"><thead><tr><th>Membre</th>${Array.from({length:7},(_,i)=>{const d=addDays(ws,i),x=parseISO(d);return `<th>${JOURS[x.getDay()].slice(0,3)}. ${x.getDate()}</th>`}).join('')}<th>Total</th></tr></thead><tbody>
    ${rows.length?rows.map(r=>`<tr><td><div class="who"><span class="avatar">${esc(initials(r.u))}</span><span>${esc(displayName(r.u))}<small>${esc(roleShort(r.u.role))}</small></span></div></td>
      ${r.days.map(x=>`<td><button type="button" data-act="hSel" data-u="${r.u.id}" data-d="${x.d}" class="hcell${x.valid?' ok':x.an.length?' bad':Math.abs(x.wm-x.pm)>15&&x.pm?' warn':''}" title="${esc(x.valid?'Validée':x.an.join(', '))}">${x.wm||x.n?`<b>${hm(x.wm)}</b>`:'<span style="color:var(--muted)">–</span>'}<small>${x.pm?hm(x.pm):''}</small></button></td>`).join('')}
      <td class="num"><b>${hm(r.W)}</b><small style="display:block;color:var(--muted)">${hm(r.P)}</small></td></tr>`).join(''):`<tr><td colspan="9"><p class="empty">Aucune heure prévue ni pointée cette semaine.</p></td></tr>`}
    </tbody></table></div>
    <p class="note">En gras : pointé. En petit : prévu. Rouge : anomalie (horaires, lieu, oubli). Doré : écart de plus de 15 min. Vert : journée validée. Clique une case pour voir les pointages, les signatures, corriger ou valider.</p></section>
  <section class="card"><h2>Seuils des anomalies</h2>
    <p class="sub">En minutes, par rapport aux horaires du planning. Modifiable par les responsables ; s’applique tout de suite à toutes les semaines.</p>
    <div class="grid g4">${H_SEUILS.map(([k,l])=>`<label class="field">${esc(l)}<span style="display:flex;align-items:center;gap:8px"><input type="number" min="0" step="5" inputmode="numeric" data-act="reglage" data-k="${k}" value="${seuil(k)}" style="max-width:110px"> min</span></label>`).join('')}</div>
  </section>
  <section class="card"><h2>Anomalies <span class="badge ${anomalies.length?'b-bad':'b-mute'}">${anomalies.length}</span></h2>
    ${anomalies.length?anomalies.map(a=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span><b>${esc(displayName(a.u))}</b> · ${esc(fmtDay(a.d))} · ${esc(a.a)}</span><button class="btn ghost sm" type="button" data-act="hSel" data-u="${a.u.id}" data-d="${a.d}">Corriger</button></div>`).join(''):'<p class="empty">Aucune anomalie cette semaine.</p>'}</section>
  </div>`;
}
function downloadCSV(name,rows){
  const csv='﻿'+rows.map(r=>r.map(v=>{v=String(v??'');return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}
const hdec=min=>(Math.round((min||0)/60*100)/100).toString().replace('.',',');
async function exportHeures(from,to,name){
  const [p,pl,va]=await Promise.all([sb.from('pointages').select('*').gte('jour',from).lte('jour',to),sb.from('planning').select('*').gte('jour',from).lte('jour',to),sb.from('heures_validations').select('*').gte('jour',from).lte('jour',to)]);
  if(p.error)return toast(frErr(p.error));
  const t=todayISO(),out=[['Membre','E-mail','Rôle','Jour','Prévu (h)','Pointé (h)','Écart (h)','Anomalies','Validé']],tot={};
  profiles.filter(u=>!['aucun','borne'].includes(u.role)).forEach(u=>{
    for(let d=from;d<=to;d=addDays(d,1)){const pts=(p.data||[]).filter(x=>x.user_id===u.id&&x.jour===d),pls=(pl.data||[]).filter(x=>x.user_id===u.id&&x.jour===d);if(!pts.length&&!pls.length)continue;
      const {w,an}=dayAnomalies(pts,pls,d,t),pm=plannedMin(pls),wm=w.min+w.live;const v=(va.data||[]).find(x=>x.user_id===u.id&&x.jour===d);tot[u.id]=tot[u.id]||{P:0,W:0};tot[u.id].P+=pm;tot[u.id].W+=wm;
      out.push([(u.prenom?u.prenom+' '+(u.nom||''):roleShort(u.role)).trim(),u.email,roleLabel(u.role),d,hdec(pm),hdec(wm),hdec(wm-pm),an.join(', '),v?'oui'+(v.note?' ('+v.note+')':''):'']);}
  });
  out.push([]);out.push(['TOTAL PAR PERSONNE']);
  Object.entries(tot).forEach(([id,v])=>{const u=prof(id);out.push([(u.prenom?u.prenom+' '+(u.nom||''):roleShort(u.role)).trim(),u.email,roleLabel(u.role),'',hdec(v.P),hdec(v.W),hdec(v.W-v.P),''])});
  downloadCSV(name,out);toast('Export téléchargé');
}

/* --- Agenda --- */
const AG_CAT={evenement:['Commandes et événements','#F4ECD8','#5C4510'],production:['Parfums et production','#141414','#E6C15C'],admin:['Admin et compta','#E3EDF6','#1F3F5E'],equipe:['Équipe','#EAF3E6','#24522C'],marketing:['Marketing','#F6E1E6','#7A2A40'],fermeture:['Fermetures et fériés','#EFE7DA','#4A3D31']};
let agData=null;
async function loadAgenda(m){
  agData={m,loading:true,items:[]};
  const from=addDays(m+'-01',-7),to=addDays(lastOfMonth(m),40);
  const {data,error}=await sb.from('evenements').select('*').lte('jour',to).or(`fin.gte.${from},and(fin.is.null,jour.gte.${from})`).order('jour');
  if(error&&/evenements/.test(error.message||''))toast('Base pas à jour : lance etape4.sql dans Supabase.');
  if(!agData||agData.m!==m)return;agData={m,loading:false,items:data||[]};if(route==='agenda')render();
}
function agendaView(){
  const m=ui.agMois||monthOf(todayISO());
  if(!agData||agData.m!==m){loadAgenda(m);return `<div class="page"><p class="empty">Chargement de l’agenda…</p></div>`}
  const off=ui.agOff||{};const cats=Object.keys(AG_CAT).filter(k=>k!=='admin'||isResp(me));
  const items=agData.items.filter(e=>!off[e.categorie]);
  const zone='C';
  const calOn=d=>off.fermeture?[]:calendrier.filter(c=>c.debut<=d&&c.fin>=d&&(c.zone==='toutes'||c.zone===zone));
  const on=d=>items.filter(e=>e.jour<=d&&(e.fin||e.jour)>=d);
  const first=parseISO(m+'-01'),lead=(first.getDay()+6)%7,last=+lastOfMonth(m).slice(8),t=todayISO();
  const pill=k=>`display:block;padding:3px 6px;border-radius:6px;font-size:11px;line-height:1.3;background:${AG_CAT[k][1]};color:${AG_CAT[k][2]};overflow-wrap:anywhere`;
  let cells='';for(let i=0;i<lead;i++)cells+='<div></div>';
  for(let n=1;n<=last;n++){const d=m+'-'+pad(n);const cal=calOn(d);const vac=cal.some(c=>c.type==='vacances');const ev=on(d);
    cells+=`<div class="agday${d===t?' today':''}"><span class="agn">${n}</span>${vac?'<span style="height:4px;border-radius:999px;background:#8FB3D9"></span>':''}${cal.filter(c=>c.type!=='vacances').map(c=>`<span style="${pill('fermeture')}">${esc(c.libelle)}</span>`).join('')}${ev.map(e=>`<span style="${pill(e.categorie)}">${e.heure?hhmm(e.heure)+' · ':''}${esc(e.titre)}</span>`).join('')}</div>`}
  const up=agData.items.filter(e=>(e.fin||e.jour)>=t&&(e.categorie!=='admin'||isResp(me))).slice(0,10);
  return `<div class="page">
  <div class="head"><div><h1>Agenda</h1><p>Dates importantes, événements et échéances de l’équipe</p></div>
    <div class="daynav"><button class="iconbtn" type="button" data-act="agMois" data-d="-1" aria-label="Mois précédent">‹</button><b>${esc(monthLabel(m))}</b><button class="iconbtn" type="button" data-act="agMois" data-d="1" aria-label="Mois suivant">›</button></div></div>
  <div class="chips" role="group" aria-label="Catégories">${cats.map(k=>`<button type="button" class="chip" data-act="agCat" data-k="${k}" aria-pressed="${!off[k]}" style="cursor:pointer;${off[k]?'opacity:.45':''}"><span class="sw" style="background:${AG_CAT[k][1]};border-color:${AG_CAT[k][2]}"></span>${AG_CAT[k][0]}</button>`).join('')}</div>
  <div class="grid g2" style="align-items:start;grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
    <section class="card"><div class="tbl-wrap"><div class="agrid">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(h=>`<span class="agh">${h}</span>`).join('')}${cells}</div></div>
      <p class="note"><span style="display:inline-block;width:22px;height:4px;border-radius:999px;background:#8FB3D9;vertical-align:middle"></span> Vacances scolaires (zone C) · les fériés et fêtes viennent du calendrier de la répartition.</p></section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>À venir</h2>${up.length?up.map(e=>{const d=parseISO(e.jour);return `<div style="display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--cream)"><span style="display:flex;flex-direction:column;align-items:center;min-width:40px"><b style="font-family:var(--f-title);font-size:22px;line-height:1">${d.getDate()}</b><small style="color:var(--muted)">${MOIS[d.getMonth()].slice(0,4)}.</small></span><span style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1"><b style="font-size:14px">${esc(e.titre)}</b><small style="color:var(--muted)">${[e.heure?hhmm(e.heure):'',e.fin&&e.fin!==e.jour?'jusqu’au '+fmtDay(e.fin):'',e.boutique_id?shopName(e.boutique_id):'',e.note||''].filter(Boolean).map(esc).join(' · ')}</small><span class="badge" style="align-self:flex-start;background:${AG_CAT[e.categorie][1]};color:${AG_CAT[e.categorie][2]}">${AG_CAT[e.categorie][0]}</span></span>${isResp(me)?`<button class="btn ghost sm" type="button" data-act="agDel" data-id="${e.id}">Retirer</button>`:''}</div>`}).join(''):'<p class="empty">Rien de prévu.</p>'}</section>
      ${isResp(me)?`<section class="card"><h2>Ajouter un événement</h2><form id="agForm" class="grid" style="gap:10px" novalidate>
        <label class="field">Titre<input id="agTitre" placeholder="Mariage 60 parts, inventaire, réunion…"></label>
        <div class="row2"><label class="field">Date<input id="agJour" type="date" value="${monthOf(t)===m?t:m+'-01'}"></label><label class="field">Jusqu’au (facultatif)<input id="agFin" type="date"></label></div>
        <div class="row2"><label class="field">Heure<input id="agHeure" type="time"></label><label class="field">Catégorie<select id="agCat">${Object.entries(AG_CAT).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label></div>
        <label class="field">Point de vente<select id="agShop"><option value="">Aucun / tous</option>${boutiques.filter(b=>b.actif).map(b=>`<option value="${b.id}">${esc(b.nom)}</option>`).join('')}</select></label>
        <label class="field">Note<input id="agNote" placeholder="Qui, quoi, acompte…"></label>
        <p class="msg err" id="agErr" hidden></p><button class="btn sm" type="submit">Ajouter</button></form>
        <p class="note">« Admin et compta » n’est visible que par les responsables.</p></section>`:''}
    </div>
  </div></div>`;
}

/* --- Code de pointage (profil) --- */
let pinPointage=null;
async function loadPinPointage(){try{const {data}=await sb.rpc('pin_pointage_defini');pinPointage=!!data}catch(e){pinPointage=false}if(route==='profil')render()}
function pinPointageSection(){
  if(me.role==='borne')return '';
  if(pinPointage===null){loadPinPointage();}
  return `<section class="card"><h2>Code de pointage (borne)</h2>
    <p class="sub">${pinPointage?'Ton code est enregistré. Tu peux le changer ici.':'Indispensable pour pointer : le pointage se fait uniquement sur la borne du labo ou de la boutique. 4 à 6 chiffres, personnel : ne le donne à personne.'}</p>
    <form id="pinPtForm" class="btnrow" novalidate><input id="ppA" type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="Code" aria-label="Nouveau code" style="width:110px;min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit;font-size:16px"><input id="ppB" type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="Confirmer" aria-label="Confirmer le code" style="width:110px;min-height:44px;border:1px solid var(--line2);border-radius:10px;padding:0 10px;font:inherit;font-size:16px"><button class="btn sm" type="submit">${pinPointage?'Changer':'Enregistrer'}</button></form>
    <p class="msg err" id="ppErr" hidden></p><p class="note">Le code est chiffré : personne, même un responsable, ne peut le lire.</p></section>`;
}

/* ================= ÉTAPE 5 : commandes clients ================= */
const P_DEF={seuil_flans:3,delai_petit_h:24,delai_grand_h:72,max_flans:30,jours:[2,3,4,5,6],heure_debut:'10:00',heure_fin:'18:30',pas_minutes:30,boutique_retrait:null,en_ligne:true};
const PC=()=>Object.assign({},P_DEF,(parametres.commandes||{}));
const ISO_JOURS=['','lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const isoDow=d=>{const x=parseISO(d).getDay();return x===0?7:x};
const CMD_ST={nouvelle:['Reçue','b-gold'],confirmee:['Confirmée','b-info'],prete:['Prête','b-good'],retiree:['Retirée','b-mute'],annulee:['Annulée','b-bad']};
const CMD_STEPS=['nouvelle','confirmee','prete','retiree'];
const PAY={a_payer:'À payer',acompte:'Acompte versé',paye:'Payé'};
const boutiqueRetrait=()=>{const p=PC();return boutiques.find(b=>b.id===p.boutique_retrait)||boutiques.find(b=>b.nom==='Saint-Lazare')||null};
const catalogue=()=>parfums.filter(p=>p.disponible&&p.prix_entier!=null);
function creneaux(d,minTs){const p=PC();const out=[];let m=minOf(p.heure_debut),f=minOf(p.heure_fin),step=Math.max(5,+p.pas_minutes||30);
  for(;m<=f;m+=step){const h=pad(Math.floor(m/60))+':'+pad(m%60);if(minTs&&new Date(d+'T'+h+':00').getTime()<minTs)continue;out.push(h)}return out}
function delaiPour(n){const p=PC();return n<=(+p.seuil_flans)?(+p.delai_petit_h):(+p.delai_grand_h)}
function joursRetrait(n){const p=PC(),minTs=Date.now()+delaiPour(n)*3600e3,out=[];
  for(let i=0;i<45&&out.length<21;i++){const d=addDays(todayISO(),i);if(!(p.jours||[]).includes(isoDow(d)))continue;if(creneaux(d,minTs).length)out.push(d)}return out}
const cmdLines=c=>sortLines((c.commande_lignes||[]).map(l=>Object.assign({},l)));
const cmdFlans=c=>(c.commande_lignes||[]).reduce((a,l)=>a+l.quantite,0);
function cmdChips(c){return `<div class="chips">${cmdLines(c).map(l=>{const p=parfum(l.parfum_id)||{};return `<span class="chip">${sw(p)}${esc(p.nom||'Parfum')} <b>${l.quantite}</b></span>`}).join('')}</div>`}
function cmdSteps(c){if(c.statut==='annulee')return `<span class="badge b-bad">Annulée</span>`;const i=CMD_STEPS.indexOf(c.statut);return `<div class="steps">${CMD_STEPS.map((s,k)=>`<span class="${k<i?'done':k===i?'now':''}">${CMD_ST[s][0]}</span>`).join('')}</div>`}
const retraitTxt=c=>fmtDay(c.retrait_jour)+' à '+hhmm(c.retrait_heure);

/* --- Espace client : commander --- */
function commanderView(){
  const p=PC(),B=boutiqueRetrait(),cat=catalogue(),cart=ui.cart||(ui.cart={});
  const n=cat.reduce((a,x)=>a+(cart[x.id]||0),0),tot=cat.reduce((a,x)=>a+(cart[x.id]||0)*(+x.prix_entier),0);
  const jours=n?joursRetrait(n):[];if(ui.cmdJour&&!jours.includes(ui.cmdJour))ui.cmdJour=null;const jour=ui.cmdJour||jours[0]||null;
  const minTs=Date.now()+delaiPour(n||1)*3600e3,heures=jour?creneaux(jour,minTs):[];if(ui.cmdHeure&&!heures.includes(ui.cmdHeure))ui.cmdHeure=null;
  const hello=me.prenom?'Bonjour '+esc(me.prenom):'Bonjour';
  if(p.en_ligne===false)return `<div class="page"><div class="head"><div><h1>${hello}</h1></div></div><section class="card"><h2>Commandes en ligne fermées</h2><p class="sub">Les commandes en ligne sont momentanément fermées. Appelle la boutique ou passe nous voir.</p></section></div>`;
  return `<div class="page">
  <div class="head"><div><h1>${hello}</h1><p>Commande tes flans entiers · retrait à <b>${esc(B?B.nom:'Saint-Lazare')}</b> · paiement au retrait</p></div></div>
  <section class="card dark" style="gap:6px"><span class="sub">Jusqu’à ${p.seuil_flans} flan${p.seuil_flans>1?'s':''} : commande ${p.delai_petit_h} h à l’avance · au-delà : ${p.delai_grand_h} h à l’avance.</span><span class="sub">Retrait du ${(p.jours||[]).map(j=>ISO_JOURS[j]).join(', ')}, de ${hhmm(p.heure_debut)} à ${hhmm(p.heure_fin)}${B&&B.adresse?' · '+esc(B.adresse):''}.</span></section>
  <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px;align-items:start" id="cmdGrid">
    <section class="parfums">${cat.length?cat.map(x=>{const q=cart[x.id]||0;return `<div class="parfum">${x.photo?`<img class="pphoto" src="${esc(x.photo)}" alt="${esc(x.nom)}" loading="lazy">`:`<div class="bandeau" style="background:${esc(x.couleur)}"></div>`}<div class="in">
      <div class="envoi-h"><b>${esc(x.nom)}</b><span class="num" style="font-weight:700">${eur(x.prix_entier)}</span></div><span class="meta">Flan entier · 4 parts</span>
      <div class="stepper"><button type="button" data-act="cart" data-p="${x.id}" data-d="-1" aria-label="Retirer un ${esc(x.nom)}"${q?'':' disabled'}>−</button><b class="num" aria-live="polite">${q}</b><button type="button" data-act="cart" data-p="${x.id}" data-d="1" aria-label="Ajouter un ${esc(x.nom)}">+</button></div></div></div>`}).join(''):'<p class="empty">Aucun flan entier disponible à la commande pour le moment.</p>'}</section>
    <section class="card" style="position:sticky;top:calc(80px + env(safe-area-inset-top,0px))"><h2>Ma commande</h2>
      ${n?`<div class="grid" style="gap:6px">${cat.filter(x=>cart[x.id]).map(x=>`<div style="display:flex;justify-content:space-between;gap:8px"><span>${sw(x)} ${cart[x.id]} × ${esc(x.nom)}</span><span class="num">${eur(cart[x.id]*x.prix_entier)}</span></div>`).join('')}<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px;font-weight:700"><span>${n} flan${n>1?'s':''}</span><span class="num">${eur(tot)}</span></div></div>
        ${n>(+p.max_flans)?`<p class="msg err">Au-delà de ${p.max_flans} flans, contacte directement la boutique.</p>`:jours.length?`<label class="field">Jour de retrait<select id="cJour" data-act="cmdJour">${jours.map(d=>`<option value="${d}"${d===jour?' selected':''}>${esc(fmtDay(d))}</option>`).join('')}</select></label>
        <label class="field">Heure<select id="cHeure" data-act="cmdHeure">${heures.map(h=>`<option value="${h}"${h===ui.cmdHeure?' selected':''}>${hhmm(h)}</option>`).join('')}</select></label>
        <label class="field">Un mot pour nous (facultatif)<input id="cNote" maxlength="300" placeholder="Anniversaire, message, allergie…" value="${esc(ui.cmdNote||'')}"></label>
        <p class="msg err" id="cErr" hidden></p>
        <button class="btn" type="button" data-act="cmdValider">Valider ma commande · ${eur(tot)}</button>
        <p class="note">Paiement au retrait. Délai pour ${n} flan${n>1?'s':''} : ${delaiPour(n)} h.</p>`:'<p class="msg err">Pas de créneau disponible dans les prochaines semaines.</p>'}`
      :'<p class="empty">Choisis tes flans avec les boutons +.</p>'}
    </section>
  </div></div>`;
}
/* --- Espace client : mes commandes --- */
function mesCommandesView(){
  const list=commandesAll.slice().sort((a,b)=>(b.retrait_jour+b.retrait_heure).localeCompare(a.retrait_jour+a.retrait_heure));
  const B=boutiqueRetrait();
  return `<div class="page">
  <div class="head"><div><h1>Mes commandes</h1><p>Retrait à ${esc(B?B.nom:'Saint-Lazare')} · du ${(PC().jours||[]).map(j=>ISO_JOURS[j]).join(', ')}, ${hhmm(PC().heure_debut)}–${hhmm(PC().heure_fin)} · paiement au retrait</p></div><a class="btn sm" href="#commander">+ Nouvelle commande</a></div>
  ${ui.lastCmd?`<section class="card" style="border-color:var(--good);background:var(--good-bg)"><h2>Merci ! Commande ${esc(ui.lastCmd.numero)} envoyée</h2><p class="sub" style="color:var(--good)">La boutique va la confirmer. Tu suis son avancement ici. Paiement au retrait : ${eur(ui.lastCmd.total)}.</p></section>`:''}
  ${list.length?list.map(c=>{const can=['nouvelle','confirmee'].includes(c.statut);return `<div class="envoi">
    <div class="envoi-h"><span><b>Commande ${esc(c.numero)}</b> <span class="badge ${CMD_ST[c.statut][1]}">${CMD_ST[c.statut][0]}</span></span><span class="num" style="font-weight:700">${eur(c.total)}</span></div>
    <span class="meta">Retrait ${esc(retraitTxt(c))} · ${esc(PAY[c.paiement])}${c.paiement==='acompte'?' ('+eur(c.acompte)+')':''}</span>
    ${cmdChips(c)}${cmdSteps(c)}${c.note?`<span class="meta">« ${esc(c.note)} »</span>`:''}
    ${c.statut==='prete'?'<span class="badge b-good" style="align-self:flex-start">Ta commande t’attend en boutique</span>':''}
    ${can?`<div class="btnrow"><button class="btn ghost sm" type="button" data-act="cmdAnnulerClient" data-id="${c.id}">Annuler la commande</button></div>`:''}</div>`}).join(''):'<section class="card"><p class="empty">Aucune commande pour l’instant.</p><a class="btn sm" href="#commander">Commander un flan</a></section>'}
  </div>`;
}

/* --- Commandes (équipe) --- */
function commandesView(){
  const t=todayISO(),tab=ui.cmdTab||'aconfirmer',p=PC();
  const live=commandesAll.filter(c=>c.statut!=='annulee');
  const T={aconfirmer:commandesAll.filter(c=>c.statut==='nouvelle'),avenir:commandesAll.filter(c=>['confirmee','prete'].includes(c.statut)&&c.retrait_jour>=t),jour:commandesAll.filter(c=>c.retrait_jour===day&&c.statut!=='annulee'),historique:commandesAll.filter(c=>['retiree','annulee'].includes(c.statut)||(c.retrait_jour<t&&c.statut!=='prete'))};
  const list=(T[tab]||[]).slice().sort((a,b)=>(a.retrait_jour+a.retrait_heure).localeCompare(b.retrait_jour+b.retrait_heure)*(tab==='historique'?-1:1));
  const tabs=[['aconfirmer','À confirmer'],['avenir','À venir'],['jour','Par jour'],['historique','Terminées']];
  const prod={};live.filter(c=>['confirmee','nouvelle'].includes(c.statut)&&(c.retrait_jour===t||c.retrait_jour===addDays(t,1))).forEach(c=>(c.commande_lignes||[]).forEach(l=>prod[l.parfum_id]=(prod[l.parfum_id]||0)+l.quantite));
  const card=c=>{const fin=['retiree','annulee'].includes(c.statut);return `<div class="envoi${c.statut==='nouvelle'?' hot':''}">
    <div class="envoi-h"><span><b>${esc(c.numero)}</b> <span class="badge ${CMD_ST[c.statut][1]}">${CMD_ST[c.statut][0]}</span> <span class="badge b-mute">${c.source==='en_ligne'?'En ligne':'Équipe'}</span></span><span class="num" style="font-weight:700">${eur(c.total)} · ${cmdFlans(c)} flan${cmdFlans(c)>1?'s':''}</span></div>
    <span><b>${esc(c.client_nom)}</b>${c.client_tel?` · <span style="user-select:all">${esc(c.client_tel)}</span>`:''}${c.client_email?` · <span class="meta" style="user-select:all">${esc(c.client_email)}</span>`:''}</span>
    <span class="meta">Retrait <b>${esc(retraitTxt(c))}</b>${c.boutique_id?' · '+esc(shopName(c.boutique_id)):''}</span>
    ${cmdChips(c)}${c.note?`<span class="meta">« ${esc(c.note)} »</span>`:''}${cmdSteps(c)}
    ${fin?'':`<div class="btnrow">
      ${c.statut==='nouvelle'?`<button class="btn sm" type="button" data-act="cmdSt" data-id="${c.id}" data-s="confirmee">Confirmer</button>`:''}
      ${c.statut==='confirmee'?`<button class="btn sm" type="button" data-act="cmdSt" data-id="${c.id}" data-s="prete">Prête</button>`:''}
      ${c.statut==='prete'?`<button class="btn sm" type="button" data-act="cmdSt" data-id="${c.id}" data-s="retiree">Retirée par le client</button>`:''}
      <label class="meta">Paiement <select class="inline-sel" data-act="cmdPay" data-id="${c.id}">${Object.entries(PAY).map(([k,l])=>`<option value="${k}"${k===c.paiement?' selected':''}>${l}</option>`).join('')}</select></label>
      ${c.paiement==='acompte'?`<label class="meta">Acompte <input type="number" min="0" step="0.5" inputmode="decimal" data-act="cmdAcompte" data-id="${c.id}" value="${+c.acompte||''}" style="width:80px;min-height:40px;border:1px solid var(--line2);border-radius:10px;padding:0 8px;font:inherit"> €</label>`:''}
      <button class="btn ghost sm" type="button" data-act="cmdSt" data-id="${c.id}" data-s="annulee">Annuler</button></div>`}
    ${fin?`<span class="meta">${esc(PAY[c.paiement])}${c.paiement==='acompte'?' · '+eur(c.acompte):''}</span>`:''}</div>`};
  const noAccess=me.role==='vendeur'&&!commandesAll.length;
  const allH=creneaux(day,null);
  return `<div class="page">
  <div class="head"><div><h1>Commandes clients</h1><p>Flans entiers · retrait à ${esc((boutiqueRetrait()||{}).nom||'Saint-Lazare')}</p></div>${tab==='jour'?dayNav():''}</div>
  <div class="btnrow" role="tablist">${tabs.map(([k,l])=>`<button class="btn sm ${k===tab?'':'ghost'}" type="button" role="tab" aria-selected="${k===tab}" data-act="cmdTab" data-t="${k}">${l} <span class="badge ${k==='aconfirmer'&&T[k].length?'b-bad':'b-mute'}" style="margin-left:4px">${T[k].length}</span></button>`).join('')}<button class="btn sm" type="button" data-act="cmdNew" style="margin-left:auto">+ Commande par téléphone</button></div>
  ${noAccess?'<section class="card"><p class="sub">Tu vois les commandes les jours où tu es affecté au point de retrait.</p></section>':''}
  ${Object.keys(prod).length?`<section class="card"><h2>À produire pour les commandes (aujourd’hui et demain)</h2><div class="chips">${Object.entries(prod).sort((a,b)=>((parfum(a[0])||{}).ordre||0)-((parfum(b[0])||{}).ordre||0)).map(([id,q])=>{const x=parfum(id)||{};return `<span class="chip">${sw(x)}${esc(x.nom)} <b>${q}</b></span>`}).join('')}</div><p class="note">Le labo les voit aussi dans sa Production.</p></section>`:''}
  ${ui.cmdNew?`<section class="card"><h2>Nouvelle commande (téléphone, boutique)</h2><form id="cmdForm" class="grid" style="gap:12px" novalidate>
    <div class="row2"><label class="field">Nom du client<input id="ncNom" autocomplete="off"></label><label class="field">Téléphone<input id="ncTel" type="tel" autocomplete="off"></label></div>
    <label class="field">E-mail (facultatif)<input id="ncMail" type="email" autocomplete="off"></label>
    <div class="row2"><label class="field">Jour de retrait<input id="ncJour" type="date" min="${t}" value="${addDays(t,1)}"></label><label class="field">Heure<select id="ncHeure">${allH.map(h=>`<option>${h}</option>`).join('')}</select></label></div>
    <div class="field">Flans entiers${qtyGrid('nc',{},catalogue())}</div>
    <div class="row2"><label class="field">Paiement<select id="ncPay">${Object.entries(PAY).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><label class="field">Acompte (€)<input id="ncAcompte" type="number" min="0" step="0.5" inputmode="decimal" placeholder="0"></label></div>
    <label class="field">Note<input id="ncNote" placeholder="Message, allergie, événement…"></label>
    <p class="msg err" id="ncErr" hidden></p>
    <div class="btnrow"><button class="btn" type="submit">Enregistrer (confirmée)</button><button class="btn ghost sm" type="button" data-act="cmdNew">Annuler</button></div>
    <p class="note">Commande saisie par l’équipe : pas de délai minimum imposé, à toi de vérifier avec le labo.</p></form></section>`:''}
  <section class="card">${list.length?list.map(card).join(''):'<p class="empty">Aucune commande ici.</p>'}</section>
  ${isResp(me)?`<section class="card"><h2>Règles des commandes en ligne</h2>
    <form id="cmdRegles" class="grid" style="gap:12px" novalidate>
      <label class="check"><input type="checkbox" id="crOn"${p.en_ligne!==false?' checked':''}>Commandes en ligne ouvertes</label>
      <div class="grid g4"><label class="field">Jusqu’à (flans)<input id="crSeuil" type="number" min="1" value="${p.seuil_flans}"></label><label class="field">Délai petite commande (h)<input id="crPetit" type="number" min="0" value="${p.delai_petit_h}"></label><label class="field">Délai au-delà (h)<input id="crGrand" type="number" min="0" value="${p.delai_grand_h}"></label><label class="field">Maximum en ligne (flans)<input id="crMax" type="number" min="1" value="${p.max_flans}"></label></div>
      <div class="grid g4"><label class="field">Retrait à partir de<input id="crDeb" type="time" value="${esc(p.heure_debut)}"></label><label class="field">Jusqu’à<input id="crFin" type="time" value="${esc(p.heure_fin)}"></label><label class="field">Créneaux toutes les (min)<input id="crPas" type="number" min="5" step="5" value="${p.pas_minutes}"></label><label class="field">Point de retrait<select id="crBout">${boutiques.filter(b=>b.actif).map(b=>`<option value="${b.id}"${(boutiqueRetrait()||{}).id===b.id?' selected':''}>${esc(b.nom)}</option>`).join('')}</select></label></div>
      <div class="field">Jours de retrait<div class="chips">${[1,2,3,4,5,6,7].map(j=>`<label class="chip" style="cursor:pointer"><input type="checkbox" name="crJ" value="${j}"${(p.jours||[]).includes(j)?' checked':''}> ${ISO_JOURS[j]}</label>`).join('')}</div></div>
      <p class="msg err" id="crErr" hidden></p><button class="btn sm" type="submit">Enregistrer les règles</button></form>
    <p class="note">Lien à partager aux clients (Instagram, site) : <span style="user-select:all">${esc(APP_URL)}#client</span></p></section>`:''}
  </div>`;
}

/* --- Équipe --- */
function teamView(){
  const waiting=profiles.filter(p=>p.role==='aucun'&&p.actif);
  const pend=invitations.filter(i=>!i.used_at);
  const team=profiles.filter(p=>p.role!=='client'&&(p.role!=='aucun'||!p.actif));
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
          <div class="btnrow"><button class="btn sm" type="button" data-act="approve" data-id="${p.id}">Valider</button><button class="btn sm danger" type="button" data-act="delCompte" data-id="${p.id}">Supprimer le compte</button></div></div>`).join(''):'<p class="empty">Aucun compte en attente.</p>'}
      </section>
      <section class="card"><h2>Invitations en attente <span class="badge b-mute">${pend.length}</span></h2>
        ${pend.length?pend.map(i=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--cream);flex-wrap:wrap"><span style="min-width:0;overflow-wrap:anywhere">${esc(i.email)}<small style="display:block;color:var(--muted);font-size:12px">${esc(roleLabel(i.role))}</small></span><button class="btn ghost sm" type="button" data-act="delInvite" data-email="${esc(i.email)}">Annuler</button></div>`).join(''):'<p class="empty">Aucune invitation en attente.</p>'}
      </section>
    </div>
  </div>
  <section class="card"><h2>Équipe <span class="badge b-mute">${team.filter(p=>p.actif).length} actif${team.filter(p=>p.actif).length>1?'s':''}</span></h2>
    <div class="tbl-wrap"><table style="min-width:480px"><thead><tr><th>Membre</th><th>Rôle</th><th>Accès</th></tr></thead><tbody>
    ${team.map(p=>{const self=p.id===me.id;return `<tr><td><div class="who"><span class="avatar" aria-hidden="true">${esc(initials(p))}</span><span>${esc(displayName(p))}${self?' (toi)':''}<small>${esc(p.email)}</small></span></div></td>
      <td><select data-act="setRole" data-id="${p.id}" aria-label="Rôle"${self?' disabled':''}>${roleOptions(p.role)}</select>${p.role==='borne'?`<select data-act="setBorneLieu" data-id="${p.id}" aria-label="Lieu de la borne" style="margin-top:6px;display:block"><option value="">Lieu : Labo</option>${boutiques.filter(b=>b.actif).map(b=>`<option value="${b.id}"${b.id===p.boutique_id?' selected':''}>Lieu : ${esc(b.nom)}</option>`).join('')}</select>`:''}</td>
      <td>${self?'<span class="badge b-good">Actif</span>':`<div class="btnrow"><button class="btn sm ${p.actif?'ghost':''}" type="button" data-act="toggle" data-id="${p.id}">${p.actif?'Désactiver':'Réactiver'}</button>${p.role==='direction'&&me.role!=='direction'?'':`<button class="btn sm danger" type="button" data-act="delCompte" data-id="${p.id}">Supprimer</button>`}</div>`}</td></tr>`}).join('')}
    </tbody></table></div>
    <p class="note"><b>Désactiver</b> bloque l’accès mais garde tout (réactivable). <b>Supprimer</b> efface le compte, son planning et son code de pointage ; ses heures pointées sont archivées pour la paie. L’adresse e-mail pourra être réinvitée.</p></section></div>`;
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
        <label class="field">Téléphone<input id="pTel" type="tel" value="${esc(me.telephone||'')}" autocomplete="tel">${me.role==='client'?'':'<small>Visible par les responsables dans Contacts.</small>'}</label>
        <label class="field">Adresse e-mail<input value="${esc(me.email)}" disabled></label>
        <button class="btn" type="submit">Enregistrer</button></form>
      ${me.role==='client'?'':'<p class="note">Ton rôle est géré par les responsables.</p>'}</section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Code PIN</h2>
        <p class="sub">${pinRec?`Code à ${pinRec.len} chiffres actif sur cet appareil. Il est demandé à l’ouverture et après 2 minutes en arrière-plan.`:'Avec un code PIN, tu ouvres l’appli sur ce téléphone sans retaper ton mot de passe.'}</p>
        <div class="btnrow">${pinRec?'<button class="btn ghost sm" type="button" data-act="pinChange">Changer le PIN</button><button class="btn ghost sm" type="button" data-act="pinOff">Désactiver</button><button class="btn ghost sm" type="button" data-act="lock">Verrouiller maintenant</button>':'<button class="btn sm" type="button" data-act="pinOn">Activer un code PIN</button>'}</div></section>
      ${me.role==='client'?'':pinPointageSection()}
      ${me.role==='client'?`<section class="card"><h2>Supprimer mon compte</h2><p class="sub">Tes informations sont effacées. Tes commandes passées restent connues de la boutique avec ton nom, pour sa comptabilité.</p><button class="btn danger sm" type="button" data-act="delMoi">Supprimer mon compte</button></section>`:''}
      <section class="card"><h2>Session</h2><button class="btn ghost" type="button" data-act="logout">Se déconnecter</button>${me.role==='borne'?'<a class="btn ghost sm" href="#accueil">Retour à la borne</a>':''}</section>
    </div></div></div>`;
}

/* ================= Étape 6 : site client, clients, contacts, demandes, community manager ================= */
const SLOGAN='L’art du flan, tout simplement.';
const SITE='photos/site/';

/* --- Pages du site pour les clients --- */
function siteSec(img,alt,kicker,title,text,href,link,rev){
  return `<section class="s-sec${rev?' rev':''}"><img src="${SITE+img}" alt="${esc(alt)}" loading="lazy"><div class="s-txt">${kicker?`<span class="s-kicker">${esc(kicker)}</span>`:''}<h2>${esc(title)}</h2><p>${esc(text)}</p>${href?`<a class="s-link" href="${href}">${esc(link)}</a>`:''}</div></section>`;
}
function maisonView(){
  const n=parfums.filter(p=>p.disponible).length;
  const next=commandesAll.filter(c=>c.retrait_jour>=todayISO()&&!['annulee','retiree'].includes(c.statut)).sort((a,b)=>(a.retrait_jour+a.retrait_heure).localeCompare(b.retrait_jour+b.retrait_heure))[0];
  return `<div class="page site">
  <section class="s-hero"><div class="s-hero-txt"><span class="s-kicker">Notre passion, le flan</span><h1>L’art du flan,<br>tout simplement.</h1>
    <p>Commandez en ligne vos flans entiers, à retirer en boutique. Paiement sur place.</p>
    <div class="btnrow"><a class="btn" href="#commander">Commander un flan entier</a><a class="btn ghost" href="#nosparfums">Découvrir nos parfums</a></div></div>
    <img src="${SITE}hero.jpg" alt="Flans entiers et parts sur un plateau en bois"></section>
  ${next?`<a class="banner" href="#mescommandes" style="text-decoration:none"><span class="k">Ma prochaine commande</span><span class="v">${esc(fmtDay(next.retrait_jour))} à ${esc(hhmm(next.retrait_heure))}</span><span class="s">${esc((CMD_ST[next.statut]||['',''])[0])} · n° ${esc(next.numero||'')}</span></a>`:''}
  ${siteSec('univers.jpg','Parts de flans aux pralinés','Un univers dédié au flan','Un univers dédié au flan','Un assortiment exclusif de flans préparés sur une base de crème onctueuse parfumée à la véritable vanille de Madagascar, sublimés par des pralinés nobles, des fruits raffinés et des saveurs inédites.','#nosparfums','Voir tous les parfums →')}
  ${siteSec('maison.jpg','Flans aux fruits','Premier Comptoir en France','Quand l’élégance rencontre la gourmandise','Au Comptoir du Flan, nous avons choisi de réinventer un grand classique français. Chaque recette allie savoir-faire artisanal, ingrédients sélectionnés avec exigence et créativité, pour transformer un dessert intemporel en expérience haut de gamme.','#commander','Commander →',true)}
  ${siteSec('tradition.jpg','Flan entier et part au praliné','Entre tradition et innovation','Tradition française, créativité gourmande, le flan comme jamais','Des bases authentiques, une pâte sucrée parfumée à l’amande et à la fleur de sel, des pralinés 100 % fruits secs, des coulis de fruits naturels… Chaque détail compte pour offrir un dessert qui séduit les yeux autant que les papilles.','#histoire','L’histoire du Comptoir →')}
  ${siteSec('experience.jpg','Petits flans aux fruits rouges','','Offrez-vous l’expérience',(n?n+' parfums uniques':'Des parfums uniques')+' pour réinventer le flan à la française. Chaque matin, nos flans sont préparés du jour.','#infos','Horaires de nos boutiques →',true)}
  <p class="s-foot">Le Comptoir du Flan — ${SLOGAN}</p></div>`;
}
function nosParfumsView(){
  const list=parfums.slice().sort((a,b)=>(b.disponible-a.disponible)||((a.ordre||0)-(b.ordre||0)));
  const B=boutiqueRetrait();
  return `<div class="page site">
  <div class="head"><div><h1>Nos parfums</h1><p>Les parts se vendent dans toutes nos boutiques. Les flans entiers se commandent en ligne, retrait à ${esc(B?B.nom:'Saint-Lazare')}.</p></div><a class="btn sm" href="#commander">Commander un flan entier</a></div>
  <div class="parfums">${list.map(p=>`<div class="parfum${p.disponible?'':' off'}">${p.photo?`<img class="pphoto" src="${esc(p.photo)}" alt="${esc(p.nom)}" loading="lazy">`:`<div class="bandeau" style="background:${esc(p.couleur||'#E6C15C')}"></div>`}<div class="in">
    <div class="envoi-h"><b>${esc(p.nom)}</b>${p.disponible?'':'<span class="badge b-mute">Pas en ce moment</span>'}</div>
    <span class="meta">Le quart · <b class="num">${eur(p.prix_quart)}</b></span>${p.prix_entier!=null?`<span class="meta">Flan entier · <b class="num">${eur(p.prix_entier)}</b></span>`:''}</div></div>`).join('')}</div>
  <p class="s-foot">Fabriqués le matin même · ${SLOGAN}</p></div>`;
}
function histoireView(){
  const P=['Le Comptoir du Flan, c’est avant tout l’histoire d’un homme, Jean Gautier. Né au Venezuela d’une mère vénézuélienne et d’un père français, Jean a grandi entre deux cultures, entre soleil et terroir. À six ans, il rejoint la France et s’installe à La Salvetat-sur-Agout, un village où les traditions et le goût du vrai occupent une place essentielle.',
    'Il découvre très tôt la magie de la cuisine. Enfant curieux et gourmand, il s’amuse à préparer des plats pour sa famille, trouvant déjà dans ces moments de partage une évidence : celle de nourrir les autres avec amour.',
    'À 17 ans, il franchit une nouvelle étape en réalisant son premier stage chez le pâtissier reconnu Xavier Flipo. Ce sera le début d’un parcours jalonné de rencontres prestigieuses et d’expériences dans des maisons d’exception : auprès de grands noms de la pâtisserie comme Cédric Grolet ou Clara Jung, et dans l’univers raffiné de l’hôtellerie de luxe au sein du Four Seasons en région PACA.',
    'Mais derrière toutes ces expériences, une passion ne l’a jamais quitté : le flan. Ce dessert populaire et intemporel, qu’il a toujours réalisé en famille, est pour lui bien plus qu’une gourmandise : c’est un souvenir d’enfance, un lien entre les générations, un symbole de simplicité et de bonheur.',
    'Petit à petit, Jean s’amuse à revisiter le flan pour ses proches et amis. Son ingéniosité, son savoir-faire et son exigence transforment ce dessert du quotidien en une véritable œuvre de pâtisserie. Très vite, l’engouement est au rendez-vous : ses flans ne laissent personne indifférent.'];
  const P2=['Sur sa route, il croise Philippe et Sébastien. Animés par les mêmes valeurs (l’amour du travail bien fait, le respect des produits, l’esprit d’entreprendre), ils partagent avec Jean une vision commune : donner au flan la place qu’il mérite, en faire un dessert d’exception.',
    'C’est ainsi qu’est né Le Comptoir du Flan : la première enseigne nationale dédiée uniquement au flan, déclinée en une multitude de saveurs, toutes pensées avec exigence et passion.',
    'Un hommage à la tradition, sublimé par la créativité d’un jeune chef, et porté par une ambition : transformer un dessert populaire en une expérience haut de gamme, accessible à tous les gourmands.',
    'Le Comptoir du Flan, c’est plus qu’une boutique : c’est une aventure humaine, un rêve devenu réalité, et une invitation à redécouvrir l’intemporel… autrement.'];
  const M=['Chez Le Comptoir du Flan, nous avons choisi de consacrer tout notre savoir-faire à un grand classique de la pâtisserie française : le flan. Premier concept en France exclusivement dédié à cette spécialité, nous réinventons le flan en le sublimant à travers plus de 23 parfums haut de gamme.',
    'Notre ambition est simple : offrir une expérience unique, où tradition et innovation se rencontrent. Chaque flan est élaboré avec des ingrédients rigoureusement sélectionnés, un respect des recettes artisanales et une créativité qui surprend les palais les plus exigeants.',
    'Au-delà d’un dessert, nous faisons du flan une véritable signature gourmande : raffinée, élégante et inoubliable.',
    'Le Comptoir du Flan, c’est l’adresse incontournable des amateurs de douceur qui recherchent l’excellence, la variété et le plaisir de découvrir de nouvelles saveurs.'];
  const ps=a=>a.map(t=>`<p>${esc(t)}</p>`).join('');
  return `<div class="page site">
  <article class="s-article"><span class="s-kicker">Notre histoire</span><h1>L’histoire du Comptoir du Flan</h1>${ps(P)}
    <blockquote class="s-quote">« Donner au flan la place qu’il mérite, en faire un dessert d’exception. »</blockquote>${ps(P2)}</article>
  <section class="s-sec"><img src="${SITE}univers.jpg" alt="Parts de flans aux pralinés" loading="lazy"><div class="s-txt"><span class="s-kicker">Notre Maison</span><h2>Le premier Comptoir dédié au flan</h2>${ps(M)}</div></section>
  <section class="card dark" style="gap:6px"><h2 style="color:var(--gold-l)">Fabriqués le matin même</h2><span class="sub">Tous nos flans sont préparés chaque matin : les retraits se font sur les créneaux indiqués pour garantir fraîcheur et qualité.</span>
    <div class="btnrow" style="margin-top:6px"><a class="btn" href="#nosparfums">Découvrir nos parfums</a><a class="btn ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" href="#infos">Horaires et commande</a></div></section>
  <p class="s-foot">Le Comptoir du Flan — ${SLOGAN}</p></div>`;
}
function infosView(){
  const p=PC(),B=boutiqueRetrait();
  const shops=boutiques.filter(b=>b.actif);
  return `<div class="page site">
  <div class="head"><div><h1>Infos pratiques</h1><p>Commande, retrait et horaires de nos boutiques</p></div></div>
  <div class="grid g2" style="align-items:start">
    <section class="card"><h2>Flan entier sur commande</h2>
      <ul class="s-list"><li>Commande en ligne depuis l’onglet <a href="#commander">Commander</a>.</li>
      <li>Jusqu’à ${p.seuil_flans} flan${p.seuil_flans>1?'s':''} : au moins ${p.delai_petit_h} h à l’avance. Au-delà : ${p.delai_grand_h} h à l’avance.</li>
      <li>Retrait à <b>${esc(B?B.nom:'Saint-Lazare')}</b>${B&&B.adresse?' ('+esc(B.adresse)+')':''}, le ${(p.jours||[]).map(j=>ISO_JOURS[j]).join(', ')}, de ${hhmm(p.heure_debut)} à ${hhmm(p.heure_fin)}.</li>
      <li>Paiement au retrait. Un acompte peut être demandé pour les grosses commandes.</li>
      <li>Au-delà de ${p.max_flans} flans, contactez directement la boutique.</li></ul></section>
    <section class="card"><h2>Les parts</h2>
      <ul class="s-list"><li>En vente au quart dans toutes nos boutiques, sans réservation.</li><li>Tous nos flans sont fabriqués le matin même.</li><li>Pour un événement ou une commande professionnelle : <a href="#ensemble">Travaillons ensemble</a>.</li></ul></section>
  </div>
  <section class="card"><h2>Nos boutiques vous accueillent</h2>
    <div class="shops">${shops.map(b=>`<div class="shop"><div class="shop-h"><b>${esc(b.nom)}</b>${B&&B.id===b.id?'<span class="badge b-gold">Retrait des commandes</span>':''}</div><span class="meta">${esc([b.adresse,b.ville].filter(Boolean).join(' · '))}</span><span style="font-size:14px">${b.horaires?esc(b.horaires):'<span class="meta">Horaires bientôt en ligne</span>'}</span></div>`).join('')||'<p class="empty">Les boutiques arrivent bientôt.</p>'}</div></section>
  <p class="s-foot">Le Comptoir du Flan — ${SLOGAN}</p></div>`;
}

/* --- Travaillons ensemble (public, avec ou sans compte) --- */
const DEM_TYPES={franchise:['Devenir franchisé','Ouvrir un Comptoir du Flan dans votre ville'],partenariat:['Partenariat','Restaurant, hôtel, épicerie fine, marque…'],pro:['Commande pro ou événement','Mariage, séminaire, cocktail, entreprise'],candidature:['Rejoindre l’équipe','Pâtisserie, vente, livraison, communication'],autre:['Autre demande','Presse, question, suggestion']};
const DEM_ST={nouvelle:['Nouvelle','b-gold'],en_cours:['En cours','b-info'],acceptee:['Acceptée','b-good'],refusee:['Refusée','b-bad'],archivee:['Archivée','b-mute']};
const APPORTS=['Moins de 50 000 €','De 50 000 à 100 000 €','Plus de 100 000 €','Je préfère en parler de vive voix'];
const DEM_MSG={franchise:'Votre projet en quelques lignes',partenariat:'Votre établissement et votre idée de partenariat',pro:'Date, nombre de personnes, parfums souhaités',candidature:'Le poste qui vous intéresse et votre parcours',autre:'Votre message'};
function demandeFormHTML(pre){
  pre=pre||{};const t='franchise';
  return `<form id="demandeForm" class="grid" style="gap:12px" novalidate>
    <div><h1 style="margin:0 0 6px">Travaillons ensemble</h1><p class="lead" style="margin:0">Ouvrir un Comptoir du Flan dans votre ville, proposer un partenariat, commander pour un événement ou rejoindre l’équipe : dites-nous tout, on vous répond sous 5 jours ouvrés.</p></div>
    <fieldset class="dtypes"><legend class="sr">Type de demande</legend>${Object.entries(DEM_TYPES).map(([k,v])=>`<label class="dtype"><input type="radio" name="dType" value="${k}"${k===t?' checked':''}><span><b>${esc(v[0])}</b><small>${esc(v[1])}</small></span></label>`).join('')}</fieldset>
    <label class="field">Prénom et nom<input id="dNom" autocomplete="name" value="${esc(pre.nom||'')}"></label>
    <div class="row2"><label class="field">E-mail<input id="dEmail" type="email" autocomplete="email" value="${esc(pre.email||'')}"></label><label class="field">Téléphone<input id="dTel" type="tel" autocomplete="tel" value="${esc(pre.tel||'')}"></label></div>
    <div class="row2"><label class="field" id="dSocRow">Société ou établissement<input id="dSoc" autocomplete="organization"></label><label class="field"><span id="dVilleLbl">Ville visée</span><input id="dVille" autocomplete="address-level2"></label></div>
    <label class="field" id="dApportRow">Apport personnel envisagé<select id="dApport"><option value="">Choisir…</option>${APPORTS.map(a=>`<option>${esc(a)}</option>`).join('')}</select></label>
    <label class="field"><span id="dMsgLbl">${esc(DEM_MSG[t])}</span><textarea id="dMsg" rows="5" maxlength="4000"></textarea></label>
    <label class="check"><input type="checkbox" id="dOk"><span>J’accepte que mes informations soient utilisées par le Comptoir du Flan pour traiter ma demande. Elles sont supprimées au plus tard 2 ans après notre dernier échange.</span></label>
    <p class="msg err" id="dErr" hidden></p>
    <button class="btn" type="submit">Envoyer ma demande</button></form>`;
}
function demTypeUpdate(f){
  const t=(f.querySelector('input[name="dType"]:checked')||{}).value||'autre';
  const a=f.querySelector('#dApportRow');if(a)a.hidden=t!=='franchise';
  const s=f.querySelector('#dSocRow');if(s)s.hidden=t==='candidature';
  const v=f.querySelector('#dVilleLbl');if(v)v.textContent=t==='franchise'?'Ville visée':'Ville';
  const m=f.querySelector('#dMsgLbl');if(m)m.textContent=DEM_MSG[t];
}
const DEM_MERCI=`<div class="grid" style="gap:12px"><h1 style="margin:0">Merci !</h1><p class="lead" style="margin:0">Votre demande est bien envoyée. Nous vous répondons sous 5 jours ouvrés, par e-mail ou par téléphone.</p></div>`;
function ensembleView(){
  return `<div class="page site"><section class="card" style="max-width:720px;margin:0 auto;width:100%" id="ensembleCard">${ui.demOk?DEM_MERCI+'<button class="btn ghost sm" type="button" data-act="demAutre" style="align-self:flex-start">Envoyer une autre demande</button>':demandeFormHTML({nom:[me.prenom,me.nom].filter(Boolean).join(' '),email:me.email,tel:me.telephone})}</section></div>`;
}
async function envoyerDemande(f,btn){
  const err=f.querySelector('#dErr');const fail=m=>{err.textContent=m;err.hidden=false;if(btn)btn.disabled=false};err.hidden=true;
  const v=id=>(f.querySelector('#'+id)||{}).value||'';
  const t=(f.querySelector('input[name="dType"]:checked')||{}).value;
  if(!t)return fail('Choisissez le type de demande.');
  if(v('dNom').trim().length<2)return fail('Indiquez votre prénom et votre nom.');
  if(!/^\S+@\S+\.\S+$/.test(v('dEmail').trim()))return fail('Indiquez une adresse e-mail valide.');
  if(v('dMsg').trim().length<10)return fail('Écrivez quelques mots sur votre demande.');
  if(!f.querySelector('#dOk').checked)return fail('Cochez la case pour envoyer votre demande.');
  if(btn)btn.disabled=true;
  try{const {error}=await sb.rpc('envoyer_demande',{p_type:t,p_nom:v('dNom'),p_email:v('dEmail'),p_message:v('dMsg'),p_societe:t==='candidature'?null:v('dSoc'),p_ville:v('dVille'),p_tel:v('dTel'),p_apport:t==='franchise'?v('dApport'):null});
    if(error)throw error;
    if(f.closest('#ensembleBox')){f.outerHTML=DEM_MERCI+'<button class="link" type="button" id="toLogin2">Retour à la connexion</button>'}else{ui.demOk=true;render()}
  }catch(e){fail(/envoyer_demande/.test(e.message||'')?'Ce formulaire n’est pas encore ouvert. Réessayez plus tard.':frErr(e))}
}

/* --- Clients inscrits (responsables) --- */
async function loadClients(){clientsData={loading:true,list:[]};try{const {data,error}=await sb.rpc('liste_clients');if(error)throw error;clientsData={list:data||[]}}catch(e){clientsData={list:[],err:/liste_clients/.test(e.message||'')?'Base pas à jour : lance etape6.sql dans Supabase.':frErr(e)}}if(route==='clients')render()}
function clientsView(){
  if(!clientsData){loadClients();return `<div class="page"><p class="empty">Chargement des clients…</p></div>`}
  const L=clientsData.list,actifs=L.filter(c=>+c.nb>0),tot=L.reduce((a,c)=>a+(+c.total||0),0);
  const mois=L.filter(c=>c.created_at&&String(c.created_at).slice(0,7)===todayISO().slice(0,7)).length;
  const nm=c=>[c.prenom,c.nom].filter(Boolean).join(' ')||'Sans nom';
  return `<div class="page">
  <div class="head"><div><h1>Clients inscrits</h1><p>Comptes créés depuis l’espace client · visibles uniquement par les responsables</p></div>${L.length?'<button class="btn ghost sm" type="button" data-act="cliCsv">Exporter (CSV)</button>':''}</div>
  ${clientsData.err?`<p class="msg err">${esc(clientsData.err)}</p>`:''}
  <div class="grid g4">
    <div class="card kpi"><span class="lbl">Clients inscrits</span><span class="val num">${L.length}</span><span class="hint">${mois} ce mois-ci</span></div>
    <div class="card kpi"><span class="lbl">Ont déjà commandé</span><span class="val num">${actifs.length}</span><span class="hint">${L.length?Math.round(actifs.length*100/L.length):0} % des inscrits</span></div>
    <div class="card kpi"><span class="lbl">Total des commandes</span><span class="val num">${eur(tot)}</span><span class="hint">hors commandes annulées</span></div>
    <div class="card kpi"><span class="lbl">Panier moyen</span><span class="val num">${eur(actifs.length?tot/actifs.reduce((a,c)=>a+(+c.nb),0):0)}</span><span class="hint">par commande</span></div>
  </div>
  <section class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="margin:0">Liste <span class="badge b-mute">${L.length}</span></h2><input class="search" id="cliQ" type="search" placeholder="Rechercher un nom, un e-mail, un téléphone" aria-label="Rechercher un client"></div>
    ${L.length?`<div class="tbl-wrap"><table style="min-width:640px"><thead><tr><th>Client</th><th>Téléphone</th><th>Inscrit le</th><th class="num">Commandes</th><th class="num">Total</th><th>Dernier retrait</th><th></th></tr></thead><tbody>
    ${L.map(c=>`<tr data-q="${esc((nm(c)+' '+(c.email||'')+' '+(c.telephone||'')).toLowerCase())}"><td><div class="who"><span class="avatar" aria-hidden="true">${esc(initials(c))}</span><span>${esc(nm(c))}<small>${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:''}</small></span></div></td>
      <td>${c.telephone?`<a href="tel:${esc(String(c.telephone).replace(/[^+0-9]/g,''))}">${esc(c.telephone)}</a>`:'<span class="meta">—</span>'}</td>
      <td>${c.created_at?esc(new Date(c.created_at).toLocaleDateString('fr-FR')):''}</td><td class="num">${+c.nb||0}</td><td class="num">${eur(c.total)}</td><td>${c.derniere?esc(fmtDay(c.derniere)):'<span class="meta">—</span>'}</td>
      <td><button class="btn sm danger" type="button" data-act="cliDel" data-id="${c.id}" data-nom="${esc(nm(c))}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Aucun client inscrit pour l’instant. Le lien à partager : '+esc(APP_URL)+'#client</p>'}
    <p class="note">Supprimer un compte client efface ses informations de connexion. Ses commandes passées restent avec le nom indiqué à la commande, pour la comptabilité. Lien d’inscription à partager : <b>${esc(APP_URL)}#client</b></p></section></div>`;
}

/* --- Contacts (responsables) --- */
const CT_CAT={fournisseur:'Fournisseurs',client_pro:'Clients pro',partenaire:'Partenaires',prestataire:'Prestataires',autre:'Autres'};
const telLink=t=>t?`<a href="tel:${esc(String(t).replace(/[^+0-9]/g,''))}">${esc(t)}</a>`:'';
const mailLink=m=>m?`<a href="mailto:${esc(m)}">${esc(m)}</a>`:'';
function contactForm(c){
  c=c||{categorie:ui.ctTab&&ui.ctTab!=='equipe'?ui.ctTab:'fournisseur'};
  const f=(k,l,ph,type)=>`<label class="field">${l}<input name="${k}" ${type?`type="${type}"`:''} value="${esc(c[k]||'')}" placeholder="${esc(ph||'')}"></label>`;
  return `<form class="grid" style="gap:10px" data-contactform="${c.id||'new'}" novalidate>
    <div class="row2"><label class="field">Catégorie<select name="categorie">${Object.entries(CT_CAT).map(([k,v])=>`<option value="${k}"${k===c.categorie?' selected':''}>${v.replace(/s$/,'')}</option>`).join('')}</select></label>${f('nom','Nom','Nom du contact')}</div>
    <div class="row2">${f('societe','Société','')}${f('fonction','Fonction ou produits','Farine, emballages, commercial…')}</div>
    <div class="row2">${f('telephone','Téléphone','','tel')}${f('email','E-mail','','email')}</div>
    ${f('adresse','Adresse','')}${f('note','Note','Jours de livraison, n° client, conditions…')}
    <p class="msg err" hidden></p><div class="btnrow"><button class="btn sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-act="ctCancel">Annuler</button></div></form>`;
}
function contactsView(){
  const tab=ui.ctTab||'fournisseur';
  const team=profiles.filter(p=>p.actif&&!['client','aucun','borne'].includes(p.role)).sort((a,b)=>ROLE_KEYS.indexOf(a.role)-ROLE_KEYS.indexOf(b.role));
  const n=k=>k==='equipe'?team.length:contacts.filter(c=>c.categorie===k).length;
  const tabs=Object.entries(CT_CAT).concat([['equipe','Équipe']]);
  let body;
  if(tab==='equipe')body=team.length?`<div class="tbl-wrap"><table style="min-width:560px"><thead><tr><th>Membre</th><th>Rôle</th><th>Téléphone</th><th>E-mail</th></tr></thead><tbody>${team.map(p=>`<tr data-q="${esc(((p.prenom||'')+' '+(p.nom||'')+' '+roleLabel(p.role)+' '+(p.email||'')+' '+(p.telephone||'')).toLowerCase())}"><td><div class="who"><span class="avatar" aria-hidden="true">${esc(initials(p))}</span><span>${esc(p.prenom?p.prenom+' '+(p.nom||''):roleShort(p.role))}</span></div></td><td>${esc(roleLabel(p.role))}</td><td>${telLink(p.telephone)||'<span class="meta">Non renseigné</span>'}</td><td>${mailLink(p.email)}</td></tr>`).join('')}</tbody></table></div><p class="note">Chaque membre renseigne son téléphone dans <b>Mon profil</b>.</p>`:'<p class="empty">Personne dans l’équipe pour l’instant.</p>';
  else{const list=contacts.filter(c=>c.categorie===tab).sort((a,b)=>(a.societe||a.nom).localeCompare(b.societe||b.nom,'fr'));
    body=(ui.ctAdd?`<div class="shop">${contactForm(null)}</div>`:'')+(list.length?`<div class="shops">${list.map(c=>ui.ctEdit===c.id?`<div class="shop">${contactForm(c)}</div>`:`<div class="shop" data-q="${esc([c.nom,c.societe,c.fonction,c.telephone,c.email,c.adresse,c.note].filter(Boolean).join(' ').toLowerCase())}">
      <div class="shop-h"><b>${esc(c.societe||c.nom)}</b></div>${c.societe?`<span>${esc(c.nom)}${c.fonction?' · '+esc(c.fonction):''}</span>`:c.fonction?`<span>${esc(c.fonction)}</span>`:''}
      ${c.telephone?`<span>${telLink(c.telephone)}</span>`:''}${c.email?`<span style="overflow-wrap:anywhere">${mailLink(c.email)}</span>`:''}${c.adresse?`<span class="meta">${esc(c.adresse)}</span>`:''}${c.note?`<span class="meta">${esc(c.note)}</span>`:''}
      <div class="actions"><button class="btn ghost sm" type="button" data-act="ctEdit" data-id="${c.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="ctDel" data-id="${c.id}">Supprimer</button></div></div>`).join('')}</div>`:ui.ctAdd?'':`<p class="empty">Aucun contact dans « ${esc(CT_CAT[tab])} ».</p>`);}
  return `<div class="page">
  <div class="head"><div><h1>Contacts</h1><p>Équipe, fournisseurs, clients pro et autres · accès réservé aux responsables</p></div>${tab!=='equipe'&&!ui.ctAdd?'<button class="btn sm" type="button" data-act="ctAdd">+ Ajouter un contact</button>':''}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div class="chips" role="tablist">${tabs.map(([k,l])=>`<button type="button" class="chip" role="tab" data-act="ctTab" data-t="${k}" aria-selected="${k===tab}" style="cursor:pointer;${k===tab?'background:var(--ink);color:#fff;border-color:var(--ink)':''}">${esc(l)} <b>${n(k)}</b></button>`).join('')}</div>
    <input class="search" id="ctQ" type="search" placeholder="Rechercher un contact" aria-label="Rechercher un contact"></div>
  <section class="card">${body}</section>
  <p class="note">Données personnelles : accès réservé aux responsables. Pense à supprimer les contacts qui ne servent plus (RGPD).</p></div>`;
}

/* --- Demandes reçues (responsables) --- */
function demandesView(){
  const tab=ui.demTab||'nouvelle',ty=ui.demType||'';
  const grp={nouvelle:['nouvelle'],en_cours:['en_cours'],traitees:['acceptee','refusee'],archivee:['archivee']};
  const lbl={nouvelle:'Nouvelles',en_cours:'En cours',traitees:'Traitées',archivee:'Archivées'};
  const list=demandes.filter(d=>grp[tab].includes(d.statut)&&(!ty||d.type===ty));
  const resps=profiles.filter(p=>isResp(p));
  const link=APP_URL+'#ensemble';
  return `<div class="page">
  <div class="head"><div><h1>Demandes reçues</h1><p>Franchises, partenariats, commandes pro et candidatures envoyées depuis « Travaillons ensemble »</p></div></div>
  <section class="card dark" style="gap:8px"><span class="sub">Formulaire à partager (site, Instagram, e-mail) : ouvert à tous, même sans compte.</span><div class="btnrow"><span class="copybox" id="demLink" style="flex:1;min-width:0">${esc(link)}</span><button class="btn sm" type="button" data-act="demCopy">Copier le lien</button></div></section>
  <div class="chips" role="tablist">${Object.keys(grp).map(k=>{const c=demandes.filter(d=>grp[k].includes(d.statut)).length;return `<button type="button" class="chip" data-act="demTab" data-t="${k}" aria-selected="${k===tab}" style="cursor:pointer;${k===tab?'background:var(--ink);color:#fff;border-color:var(--ink)':''}">${lbl[k]} <b>${c}</b></button>`}).join('')}</div>
  <div class="chips">${[['','Tous les types']].concat(Object.entries(DEM_TYPES).map(([k,v])=>[k,v[0]])).map(([k,l])=>`<button type="button" class="chip" data-act="demType" data-t="${k}" aria-pressed="${k===ty}" style="cursor:pointer;${k===ty?'border-color:var(--gold);background:var(--gold-bg)':''}">${esc(l)} <b>${demandes.filter(d=>grp[tab].includes(d.statut)&&(!k||d.type===k)).length}</b></button>`).join('')}</div>
  ${list.length?list.map(d=>`<section class="card" style="gap:8px">
    <div class="envoi-h"><span class="badge b-info">${esc(DEM_TYPES[d.type][0])}</span><span class="meta">${esc(whenTxt(d.created_at))}</span></div>
    <h2 style="margin:0">${esc(d.nom)}${d.societe?' · '+esc(d.societe):''}</h2>
    <span class="meta">${[d.ville?(d.type==='franchise'?'Ville visée : ':'')+d.ville:'',d.apport?'Apport : '+d.apport:''].filter(Boolean).map(esc).join(' · ')}</span>
    <div class="btnrow">${mailLink(d.email)}${d.telephone?' · '+telLink(d.telephone):''}</div>
    <p style="margin:0;white-space:pre-wrap;background:var(--cream);padding:10px 12px;border-radius:10px">${esc(d.message)}</p>
    <div class="row2"><label class="field">Statut<select data-act="demStatut" data-id="${d.id}">${Object.entries(DEM_ST).map(([k,v])=>`<option value="${k}"${k===d.statut?' selected':''}>${v[0]}</option>`).join('')}</select></label>
      <label class="field">Suivi par<select data-act="demSuivi" data-id="${d.id}"><option value="">Personne</option>${resps.map(p=>`<option value="${p.id}"${p.id===d.suivi_par?' selected':''}>${esc(displayName(p))}</option>`).join('')}</select></label></div>
    <label class="field">Note interne<textarea rows="2" id="dn-${d.id}" placeholder="Rappelé le…, rendez-vous, suite à donner">${esc(d.note||'')}</textarea></label>
    <div class="btnrow"><button class="btn ghost sm" type="button" data-act="demNote" data-id="${d.id}">Enregistrer la note</button><button class="btn ghost sm" type="button" data-act="demDel" data-id="${d.id}">Supprimer</button></div>
  </section>`).join(''):`<p class="empty">Aucune demande ${tab==='nouvelle'?'nouvelle':'dans « '+lbl[tab]+' »'}.</p>`}
  <p class="note">Une demande refusée ou terminée peut être archivée puis supprimée : on ne garde pas les données personnelles plus de 2 ans.</p></div>`;
}

/* --- Espace community manager --- */
const RESEAUX={instagram:['Instagram','#E1306C'],tiktok:['TikTok','#141414'],facebook:['Facebook','#1877F2'],linkedin:['LinkedIn','#0A66C2'],autre:['Autre','#8A8578']};
const FORMATS={post:'Post',carrousel:'Carrousel',reel:'Reel',story:'Story',video:'Vidéo'};
const PUB_ST={idee:['Brouillon','b-mute'],a_valider:['À valider','b-gold'],validee:['Validée','b-info'],programmee:['Programmée','b-info'],publiee:['Publiée','b-good']};
const PUB_STEPS=['idee','a_valider','validee','programmee','publiee'];
async function loadCmInfos(){cmInfos={loading:true};try{const {data,error}=await sb.rpc('cm_infos');if(error)throw error;cmInfos=data||{top:[]}}catch(e){cmInfos={top:[],err:true}}if(route==='cm')render()}
function pubForm(p){
  const isNew=!p;p=p||{jour:ui.cmJour||todayISO(),reseau:'instagram',format:'post',statut:'idee'};const R=isResp(me);
  const vis=PHOTOS.concat(Object.values({a:SITE+'hero.jpg',b:SITE+'univers.jpg',c:SITE+'maison.jpg',d:SITE+'tradition.jpg',e:SITE+'experience.jpg'}));
  return `<form class="grid" style="gap:10px" data-pubform="${p.id||'new'}" novalidate>
    <div class="row2"><label class="field">Date<input name="jour" type="date" value="${esc(p.jour)}"></label><label class="field">Heure<input name="heure" type="time" value="${esc(p.heure?String(p.heure).slice(0,5):'')}"></label></div>
    <div class="row2"><label class="field">Réseau<select name="reseau">${Object.entries(RESEAUX).map(([k,v])=>`<option value="${k}"${k===p.reseau?' selected':''}>${v[0]}</option>`).join('')}</select></label><label class="field">Format<select name="format">${Object.entries(FORMATS).map(([k,v])=>`<option value="${k}"${k===p.format?' selected':''}>${v}</option>`).join('')}</select></label></div>
    <label class="field">Titre (pour l’équipe)<input name="titre" value="${esc(p.titre||'')}" placeholder="Lancement du flan praliné"></label>
    <label class="field">Légende<textarea name="texte" rows="4" placeholder="Le texte publié">${esc(p.texte||'')}</textarea></label>
    <div class="row2"><label class="field">Hashtags<input name="hashtags" value="${esc(p.hashtags||'')}" placeholder="#flan #montpellier"></label><label class="field">Parfum mis en avant<select name="parfum_id"><option value="">Aucun</option>${parfums.map(x=>`<option value="${x.id}"${x.id===p.parfum_id?' selected':''}>${esc(x.nom)}</option>`).join('')}</select></label></div>
    <label class="field">Visuel (photothèque ou lien)<input name="visuel" list="pubVis" value="${esc(p.visuel||'')}" placeholder="Choisir une photo ou coller un lien"><datalist id="pubVis">${vis.map(v=>`<option value="${esc(v)}">`).join('')}</datalist></label>
    ${isNew?`<label class="check"><input type="checkbox" name="envoyer"${R?'':' checked'}><span>${R?'Valider directement':'Envoyer en validation aux responsables'}</span></label>`:''}
    <p class="msg err" hidden></p><div class="btnrow"><button class="btn sm" type="submit">${isNew?'Enregistrer':'Enregistrer les modifications'}</button><button class="btn ghost sm" type="button" data-act="pubCancel">Annuler</button></div></form>`;
}
function pubCard(p){
  const R=isResp(me),pf=parfum(p.parfum_id),au=prof(p.auteur),st=PUB_ST[p.statut];
  const vis=p.visuel&&/\.(jpe?g|png|webp)$/i.test(p.visuel)&&!/^javascript:/i.test(p.visuel)?`<img src="${esc(p.visuel)}" alt="" style="width:100%;max-width:220px;aspect-ratio:1;object-fit:cover;border-radius:12px">`:'';
  const acts=[];
  if(p.statut==='idee')acts.push(`<button class="btn sm" type="button" data-act="pubSt" data-s="a_valider" data-id="${p.id}">Envoyer en validation</button>`);
  if(p.statut==='a_valider'&&R)acts.push(`<button class="btn sm" type="button" data-act="pubSt" data-s="validee" data-id="${p.id}">Valider</button><button class="btn ghost sm" type="button" data-act="pubRetour" data-id="${p.id}">Demander des modifications</button>`);
  if(p.statut==='validee')acts.push(`<button class="btn sm" type="button" data-act="pubSt" data-s="programmee" data-id="${p.id}">Marquer programmée</button>`);
  if(p.statut==='validee'||p.statut==='programmee')acts.push(`<button class="btn sm" type="button" data-act="pubSt" data-s="publiee" data-id="${p.id}">Marquer publiée</button>`);
  return `<section class="card" style="gap:8px" id="pub-${p.id}">
    <div class="envoi-h"><span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="badge" style="background:${RESEAUX[p.reseau][1]};color:#fff">${RESEAUX[p.reseau][0]}</span><span class="badge b-mute">${FORMATS[p.format]}</span><span class="badge ${st[1]}">${st[0]}</span></span><span class="meta">${esc(fmtDay(p.jour))}${p.heure?' · '+hhmm(p.heure):''}</span></div>
    <div class="steps">${PUB_STEPS.map((s,k)=>{const i=PUB_STEPS.indexOf(p.statut);return `<span class="${k<i?'done':k===i?'now':''}">${PUB_ST[s][0]}</span>`}).join('')}</div>
    ${ui.pubEdit===p.id?pubForm(p):`<h2 style="margin:0">${esc(p.titre)}</h2>
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">${vis}<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px">${p.texte?`<p style="margin:0;white-space:pre-wrap">${esc(p.texte)}</p>`:'<span class="meta">Pas encore de légende.</span>'}${p.hashtags?`<span style="color:var(--info,#2D6A9F);font-size:14px">${esc(p.hashtags)}</span>`:''}${pf?`<span class="chip" style="align-self:flex-start">${sw(pf)}${esc(pf.nom)}</span>`:''}<span class="meta">Par ${esc(au?displayName(au):'Compte supprimé')}</span></div></div>
    ${p.commentaire&&p.statut==='idee'?`<p class="msg err" style="margin:0">Retour des responsables : ${esc(p.commentaire)}</p>`:''}
    ${p.statut==='publiee'?`<div class="grid" style="gap:8px"><b style="font-size:14px">Résultats</b><div class="qty">${[['vues','Vues'],['likes','J’aime'],['commentaires','Commentaires'],['partages','Partages']].map(([k,l])=>`<label><span>${l}</span><input type="number" min="0" inputmode="numeric" data-act="pubStat" data-k="${k}" data-id="${p.id}" value="${p[k]!=null?p[k]:''}" placeholder="0"></label>`).join('')}</div><label class="field">Lien de la publication<input data-act="pubLien" data-id="${p.id}" type="url" value="${esc(p.lien||'')}" placeholder="https://www.instagram.com/p/…"></label></div>`:''}
    ${ui.pubRetour===p.id?`<div class="grid" style="gap:8px"><label class="field">Ce qu’il faut changer<textarea id="prc-${p.id}" rows="2"></textarea></label><div class="btnrow"><button class="btn sm" type="button" data-act="pubRetourOk" data-id="${p.id}">Renvoyer au community manager</button><button class="btn ghost sm" type="button" data-act="pubRetour" data-id="">Annuler</button></div></div>`:''}
    <div class="btnrow">${acts.join('')}<button class="btn ghost sm" type="button" data-act="pubEdit" data-id="${p.id}">Modifier</button><button class="btn ghost sm" type="button" data-act="pubDel" data-id="${p.id}">Supprimer</button></div>`}
  </section>`;
}
function cmView(){
  const m=ui.cmMois||monthOf(todayISO()),R=isResp(me),t=todayISO();
  if(!cmInfos)loadCmInfos();
  const inM=publications.filter(p=>monthOf(p.jour)===m);
  const first=parseISO(m+'-01'),lead=(first.getDay()+6)%7,last=+lastOfMonth(m).slice(8);
  let cells='';for(let i=0;i<lead;i++)cells+='<div></div>';
  for(let n=1;n<=last;n++){const d=m+'-'+pad(n);const ps=inM.filter(p=>p.jour===d).sort((a,b)=>String(a.heure||'').localeCompare(String(b.heure||'')));const fete=calendrier.filter(c=>c.debut<=d&&c.fin>=d&&c.type!=='vacances');
    cells+=`<div class="agday${d===t?' today':''}${ui.cmJour===d?' sel':''}"><button type="button" class="agn" data-act="cmJour" data-d="${d}" aria-label="Choisir le ${esc(fmtDay(d))}" style="border:0;background:none;cursor:pointer;font:inherit;padding:0;text-align:left">${n}</button>${fete.map(c=>`<span style="font-size:10.5px;color:var(--muted)">${esc(c.libelle)}</span>`).join('')}${ps.map(p=>`<button type="button" data-act="cmSel" data-id="${p.id}" style="all:unset;cursor:pointer;display:block;padding:3px 6px;border-radius:6px;font-size:11px;line-height:1.3;background:${RESEAUX[p.reseau][1]};color:#fff;overflow-wrap:anywhere;${p.statut==='idee'?'opacity:.55':''}">${p.heure?hhmm(p.heure)+' · ':''}${esc(p.titre)}</button>`).join('')}</div>`}
  const aValider=publications.filter(p=>p.statut==='a_valider').sort((a,b)=>a.jour.localeCompare(b.jour));
  const sel=ui.cmSel&&publications.find(p=>p.id===ui.cmSel);
  const pub=inM.filter(p=>p.statut==='publiee'),vues=pub.reduce((a,p)=>a+(p.vues||0),0),eng=pub.reduce((a,p)=>a+(p.likes||0)+(p.commentaires||0)+(p.partages||0),0);
  const prevM=isoOf(new Date(first.getFullYear(),first.getMonth()-1,1)).slice(0,7);
  const st=(r,mm)=>reseauxStats.find(s=>s.reseau===r&&String(s.mois).slice(0,7)===mm)||{};
  const semaine=publications.filter(p=>p.jour>=t&&p.jour<=addDays(t,6)).sort((a,b)=>(a.jour+(a.heure||'')).localeCompare(b.jour+(b.heure||'')));
  const top=(cmInfos&&cmInfos.top)||[];
  return `<div class="page">
  <div class="head"><div><h1>Réseaux sociaux</h1><p>${R?'Calendrier éditorial du community manager, validations et résultats':'Calendrier éditorial, publications et résultats'}</p></div>
    <div class="btnrow"><div class="daynav"><button class="iconbtn" type="button" data-act="cmMois" data-d="-1" aria-label="Mois précédent">‹</button><b>${esc(monthLabel(m))}</b><button class="iconbtn" type="button" data-act="cmMois" data-d="1" aria-label="Mois suivant">›</button></div>${ui.cmNew?'':'<button class="btn sm" type="button" data-act="cmNew">+ Nouvelle publication</button>'}</div></div>
  ${ui.cmNew?`<section class="card"><h2>Nouvelle publication</h2>${pubForm(null)}</section>`:''}
  ${R&&aValider.length?`<section class="grid" style="gap:12px"><h2 style="margin:0">À valider <span class="badge b-gold">${aValider.length}</span></h2>${aValider.map(pubCard).join('')}</section>`:''}
  ${sel&&!(R&&sel.statut==='a_valider')?`<div class="grid" style="gap:8px"><div class="btnrow"><button class="btn ghost sm" type="button" data-act="cmSel" data-id="">← Fermer</button></div>${pubCard(sel)}</div>`:''}
  <div class="grid g4">
    <div class="card kpi"><span class="lbl">Publications du mois</span><span class="val num">${inM.length}</span><span class="hint">${inM.filter(p=>p.statut==='idee').length} brouillon(s) · ${inM.filter(p=>p.statut==='a_valider').length} à valider</span></div>
    <div class="card kpi"><span class="lbl">Publiées</span><span class="val num">${pub.length}</span><span class="hint">${inM.filter(p=>p.statut==='programmee'||p.statut==='validee').length} prête(s) à publier</span></div>
    <div class="card kpi"><span class="lbl">Vues</span><span class="val num">${vues.toLocaleString('fr-FR')}</span><span class="hint">publications du mois</span></div>
    <div class="card kpi"><span class="lbl">Interactions</span><span class="val num">${eng.toLocaleString('fr-FR')}</span><span class="hint">j’aime + commentaires + partages</span></div>
  </div>
  <div class="grid g21" style="align-items:start">
    <section class="card"><h2>Calendrier éditorial</h2><div class="tbl-wrap"><div class="agrid">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(h=>`<span class="agh">${h}</span>`).join('')}${cells}</div></div>
      <div class="chips">${Object.values(RESEAUX).map(v=>`<span class="chip"><span class="sw" style="background:${v[1]}"></span>${v[0]}</span>`).join('')}<span class="chip" style="opacity:.6">Pâle = brouillon</span></div>
      <p class="note">Clique sur un numéro de jour pour y créer une publication, sur une publication pour l’ouvrir. Les fêtes viennent du calendrier de la répartition.</p></section>
    <div class="grid" style="gap:16px">
      <section class="card"><h2>Cette semaine</h2>${semaine.length?semaine.map(p=>`<button type="button" data-act="cmSel" data-id="${p.id}" style="all:unset;cursor:pointer;display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--cream)"><span style="min-width:0"><b style="font-size:14px">${esc(p.titre)}</b><small style="display:block;color:var(--muted)">${esc(fmtDay(p.jour))}${p.heure?' · '+hhmm(p.heure):''} · ${RESEAUX[p.reseau][0]}</small></span><span class="badge ${PUB_ST[p.statut][1]}" style="align-self:center">${PUB_ST[p.statut][0]}</span></button>`).join(''):'<p class="empty">Rien de prévu cette semaine.</p>'}</section>
      <section class="card"><h2>Idées tirées des ventes</h2>${top.length?`<p class="sub">Les parfums les plus vendus ces 7 derniers jours :</p><div class="chips">${top.map((x,i)=>`<span class="chip">${x.photo?`<img class="sw ph" src="${esc(x.photo)}" alt="">`:''}${i+1}. ${esc(x.nom)}</span>`).join('')}</div><p class="note">Un post « coulisses de la fabrication » sur le n° 1 avant le week-end peut l’appuyer.</p>`:'<p class="empty">Les idées arrivent quand les boutiques font leurs clôtures.</p>'}
        <p class="note">Le chiffre d’affaires, la paie et les marges ne sont pas visibles depuis cet espace.</p></section>
    </div>
  </div>
  <section class="card"><h2>Abonnés · ${esc(monthLabel(m))}</h2>
    <div class="tbl-wrap"><table style="min-width:520px"><thead><tr><th>Réseau</th><th>Abonnés</th><th>Mois précédent</th><th>Évolution</th><th>Objectif</th></tr></thead><tbody>
    ${['instagram','tiktok','facebook','linkedin'].map(r=>{const c=st(r,m),pv=st(r,prevM);const dlt=c.abonnes!=null&&pv.abonnes!=null?c.abonnes-pv.abonnes:null;const obj=c.objectif;
      return `<tr><td><span class="chip"><span class="sw" style="background:${RESEAUX[r][1]}"></span>${RESEAUX[r][0]}</span></td>
      <td><input type="number" min="0" inputmode="numeric" data-act="rsSet" data-r="${r}" data-k="abonnes" data-m="${m}" value="${c.abonnes!=null?c.abonnes:''}" style="width:110px" aria-label="Abonnés ${RESEAUX[r][0]}"></td>
      <td class="num">${pv.abonnes!=null?pv.abonnes.toLocaleString('fr-FR'):'—'}</td>
      <td class="num" style="color:${dlt==null?'inherit':dlt>=0?'var(--good)':'var(--bad)'}">${dlt==null?'—':(dlt>=0?'+':'')+dlt.toLocaleString('fr-FR')}</td>
      <td><input type="number" min="0" inputmode="numeric" data-act="rsSet" data-r="${r}" data-k="objectif" data-m="${m}" value="${obj!=null?obj:''}" style="width:110px" aria-label="Objectif ${RESEAUX[r][0]}">${obj&&c.abonnes!=null?` <small class="meta">${Math.round(c.abonnes*100/obj)} %</small>`:''}</td></tr>`}).join('')}
    </tbody></table></div><p class="note">Note le nombre d’abonnés en début ou fin de mois, toujours au même moment, pour comparer.</p></section>
  ${(()=>{const autres=inM.filter(p=>p.id!==ui.cmSel&&!(R&&p.statut==='a_valider')).sort((a,b)=>(a.jour+(a.heure||'')).localeCompare(b.jour+(b.heure||'')));return autres.length?`<section class="grid" style="gap:12px"><h2 style="margin:0">Toutes les publications du mois</h2>${autres.map(pubCard).join('')}</section>`:''})()}
  <p class="note">Circuit : brouillon → à valider (envoyé par le community manager) → validée (par un responsable) → programmée → publiée. Si la légende change après validation, la publication repasse « à valider ».</p></div>`;
}
function csvDownload(rows,name){const csv='﻿'+rows.map(r=>r.map(v=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- Actions ---------- */
async function act(fn,okMsg){try{const r=await fn();if(r&&r.error)throw r.error;if(okMsg)toast(okMsg);reload();return true}catch(e){toast(frErr(e));return false}}
function armed(t,label){if(t.dataset.armed)return true;t.dataset.armed='1';const old=t.textContent;t.textContent=label||'Confirmer ?';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;t.textContent=old}},3500);return false}
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('button');if(!t)return;
  if(t.dataset.key)return press(t.dataset.key);
  if(t.id==='lockAlt'){if(pinAction)return unlockNow();locked=false;renderLock();await sb.auth.signOut();return}
  if(t.id==='toActivate')return setAuthMode(authMode==='login'?'activate':'login');
  if(t.id==='toReset')return setAuthMode('reset');
  if(t.id==='toClient')return setAuthMode('client');
  if(t.id==='toEnsemble')return setAuthMode('ensemble');
  if(t.id==='toLogin'||t.id==='toLogin2'){if(location.hash==='#ensemble')history.replaceState(null,'',location.pathname);return setAuthMode('login')}
  const a=t.dataset.act,id=t.dataset.id;if(!a)return;
  switch(a){
    case 'logout':await sb.auth.signOut();return;
    case 'day':{const d=t.dataset.d;day=d==='0'?todayISO():addDays(day,+d);loaded=true;render();loadAll();return}
    case 'copyInvite':{const el=$('#inviteText');if(el)copyText(el.textContent);return}
    case 'delInvite':return act(()=>sb.from('invitations').delete().eq('email',t.dataset.email),'Invitation annulée');
    case 'approve':{const r=$('#w-role-'+id).value;if(r==='aucun')return toast('Choisis d’abord un rôle');return act(()=>sb.from('profiles').update({role:r}).eq('id',id),'Accès ouvert')}
    case 'delCompte':{const u=prof(id);if(!u)return;if(!armed(t,'Confirmer la suppression'))return;t.disabled=true;
      try{const {error}=await sb.rpc('supprimer_compte',{p_user:id});if(error)throw error;toast('Compte supprimé : '+displayName(u));reload()}catch(e){t.disabled=false;toast(/supprimer_compte/.test(e.message||'')?'Base pas à jour : lance etape4d.sql dans Supabase.':frErr(e))}return}
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
    case 'calDel':if(!armed(t))return;rep.target=null;return act(()=>sb.from('calendrier').delete().eq('id',id),'Retiré du calendrier');
    case 'repReset':rep.target=null;return render();
    case 'repSend':return repSend(t);
    case 'borneKey':{const k=t.dataset.k;borne.err='';if(k==='del')borne.pin=borne.pin.slice(0,-1);else if(k==='ok'){if(borne.pin.length<4){borne.err='4 à 6 chiffres';return render()}return borneCall(null)}else if(borne.pin.length<6)borne.pin+=k;return render()}
    case 'borneSign':borne.action=t.dataset.type;borne.step='sign';render();clearTimeout(borneT);borneT=setTimeout(borneReset,45000);return;
    case 'sigClear':{sigStrokes=[];const c=document.getElementById('bSig');if(c&&c._redraw)c._redraw();return}
    case 'sigOk':{const d=sigPath();const pts=sigStrokes.reduce((a,s)=>a+s.length,0);if(pts<8||d.length<20){const e=document.getElementById('bSigErr');if(e)e.textContent='Signe d’abord dans le cadre.';return}t.disabled=true;return borneCall(borne.action,d)}
    case 'hValid':{const note=($('#hvNote')||{}).value||null;const r=await act(()=>sb.from('heures_validations').upsert({user_id:t.dataset.u,jour:t.dataset.d,valide_par:me.id,note:note&&note.trim()||null}),'Journée validée');if(r&&heuresData)loadHeures(heuresData.ws);return}
    case 'hUnvalid':{const r=await act(()=>sb.from('heures_validations').delete().eq('user_id',t.dataset.u).eq('jour',t.dataset.d),'Validation annulée');if(r&&heuresData)loadHeures(heuresData.ws);return}
    case 'borneReset':return borneReset();
    case 'semaine':ui.semaine=addDays(ui.semaine||weekStart(todayISO()),+t.dataset.d);ui.hSel=null;heuresData=null;return render();
    case 'hSel':ui.hSel=t.dataset.u?{u:t.dataset.u,d:t.dataset.d}:null;render();if(ui.hSel)window.scrollTo({top:0,behavior:'smooth'});return;
    case 'ptDel':{if(!armed(t))return;const r=await act(()=>sb.from('pointages').delete().eq('id',id),'Pointage supprimé');if(r&&heuresData)loadHeures(heuresData.ws);return}
    case 'csvWeek':{const ws=ui.semaine||weekStart(todayISO());return exportHeures(ws,addDays(ws,6),'heures-semaine-'+ws+'.csv')}
    case 'csvMonth':{const m=monthOf(ui.semaine||todayISO());return exportHeures(m+'-01',lastOfMonth(m),'heures-'+m+'.csv')}
    case 'agMois':{const [y,mo]=(ui.agMois||monthOf(todayISO())).split('-').map(Number);ui.agMois=isoOf(new Date(y,mo-1+(+t.dataset.d),1)).slice(0,7);agData=null;return render()}
    case 'agCat':{ui.agOff=ui.agOff||{};ui.agOff[t.dataset.k]=!ui.agOff[t.dataset.k];return render()}
    case 'agDel':{if(!armed(t))return;const r=await act(()=>sb.from('evenements').delete().eq('id',id),'Événement retiré');if(r)loadAgenda(ui.agMois||monthOf(todayISO()));return}
    case 'cart':{const c=ui.cart||(ui.cart={});const q=Math.max(0,(c[t.dataset.p]||0)+(+t.dataset.d));if(q)c[t.dataset.p]=q;else delete c[t.dataset.p];ui.lastCmd=null;return render()}
    case 'cmdValider':{const cat=catalogue(),cart=ui.cart||{};const lignes=cat.filter(x=>cart[x.id]).map(x=>({parfum_id:x.id,quantite:cart[x.id]}));const j=$('#cJour')&&$('#cJour').value,h=$('#cHeure')&&$('#cHeure').value,err=$('#cErr');
      if(!lignes.length||!j||!h){err.textContent='Choisis tes flans, un jour et une heure.';err.hidden=false;return}
      t.disabled=true;try{const {data,error}=await sb.rpc('passer_commande',{p_lignes:lignes,p_jour:j,p_heure:h,p_note:($('#cNote')||{}).value||null});if(error)throw error;
        ui.cart={};ui.cmdJour=null;ui.cmdHeure=null;ui.cmdNote='';ui.lastCmd=data;location.hash='#mescommandes';reload()}catch(e){t.disabled=false;err.textContent=frErr(e);err.hidden=false}return}
    case 'cmdAnnulerClient':{if(!armed(t,'Confirmer l’annulation'))return;t.disabled=true;try{const {error}=await sb.rpc('annuler_commande',{p_id:id});if(error)throw error;toast('Commande annulée');reload()}catch(e){t.disabled=false;toast(frErr(e))}return}
    case 'delMoi':{if(!armed(t,'Confirmer : supprimer définitivement'))return;t.disabled=true;try{const {error}=await sb.rpc('supprimer_mon_compte_client');if(error)throw error;toast('Compte supprimé');await sb.auth.signOut()}catch(e){t.disabled=false;toast(frErr(e))}return}
    case 'cmdTab':ui.cmdTab=t.dataset.t;return render();
    case 'cmdNew':ui.cmdNew=!ui.cmdNew;return render();
    case 'cmdSt':{const s2=t.dataset.s;if(s2==='annulee'&&!armed(t,'Confirmer l’annulation'))return;return act(()=>sb.from('commandes').update({statut:s2}).eq('id',id),{confirmee:'Commande confirmée',prete:'Commande prête',retiree:'Commande retirée',annulee:'Commande annulée'}[s2])}
    case 'laboTab':ui.laboTab=t.dataset.t;return render();
    case 'lotPrefill':ui.lotPrefill={p:t.dataset.p,q:+t.dataset.q};render();const el=$('#loIngr');if(el)el.focus();return;
    case 'lotStep':{const l=lots.find(x=>x.id===id);if(!l)return;const st=LOT_STEPS.find(s=>s.k===t.dataset.k);const row={};row[st.k]=new Date().toISOString();
      if(st.t){const v=parseFloat(String(($('#lt-'+id)||{}).value||'').replace(',','.'));if(!isFinite(v))return toast('Indique la température : '+st.tl);row[st.t]=v;
        if(st.t==='temp_coeur'&&v>REFROID_MAX_T)toast('Attention : plus de '+REFROID_MAX_T+' °C à cœur');}
      return act(()=>sb.from('lots').update(row).eq('id',id),st.l+' : enregistré')}
    case 'lotDel':if(!armed(t))return;return act(()=>sb.from('lots').delete().eq('id',id),'Lot supprimé');
    case 'margeSel':ui.margeParfum=id||null;render();if(id)window.scrollTo({top:0,behavior:'smooth'});return;
    case 'recDel':return act(()=>sb.from('recettes').delete().eq('parfum_id',t.dataset.p).eq('ingredient_id',t.dataset.i),'Ingrédient retiré');
    case 'mois':{const [y,mo]=(ui.mois||monthOf(todayISO())).split('-').map(Number);const d=new Date(y,mo-1+(+t.dataset.d),1);ui.mois=isoOf(d).slice(0,7);compta=null;return render()}
    case 'ecrPaye':{const r=await act(()=>sb.from('ecritures').update({paye:true}).eq('id',id),'Marqué payé');if(r&&compta)loadCompta(compta.mois);return}
    case 'ecrDel':{if(!armed(t))return;const r=await act(()=>sb.from('ecritures').delete().eq('id',id),'Écriture supprimée');if(r&&compta)loadCompta(compta.mois);return}
    case 'demAutre':ui.demOk=false;return render();
    case 'cliDel':{if(!armed(t,'Confirmer la suppression'))return;t.disabled=true;try{const {error}=await sb.rpc('supprimer_compte',{p_user:id});if(error)throw error;toast('Compte client supprimé : '+t.dataset.nom);loadClients()}catch(e){t.disabled=false;toast(frErr(e))}return}
    case 'cliCsv':{const L=(clientsData&&clientsData.list)||[];return csvDownload([['Prénom','Nom','E-mail','Téléphone','Inscrit le','Commandes','Total','Dernier retrait']].concat(L.map(c=>[c.prenom,c.nom,c.email,c.telephone,c.created_at?new Date(c.created_at).toLocaleDateString('fr-FR'):'',c.nb,String(c.total).replace('.',','),c.derniere||''])),'clients-'+todayISO()+'.csv')}
    case 'ctTab':ui.ctTab=t.dataset.t;ui.ctAdd=false;ui.ctEdit=null;return render();
    case 'ctAdd':ui.ctAdd=true;ui.ctEdit=null;return render();
    case 'ctEdit':ui.ctEdit=id;ui.ctAdd=false;return render();
    case 'ctCancel':ui.ctAdd=false;ui.ctEdit=null;return render();
    case 'ctDel':if(!armed(t))return;return act(()=>sb.from('contacts').delete().eq('id',id),'Contact supprimé');
    case 'demTab':ui.demTab=t.dataset.t;return render();
    case 'demType':ui.demType=t.dataset.t;return render();
    case 'demCopy':return copyText(APP_URL+'#ensemble');
    case 'demNote':{const el=$('#dn-'+id);return act(()=>sb.from('demandes').update({note:el&&el.value.trim()||null}).eq('id',id),'Note enregistrée')}
    case 'demDel':if(!armed(t,'Confirmer la suppression'))return;return act(()=>sb.from('demandes').delete().eq('id',id),'Demande supprimée');
    case 'cmMois':{const [y,mo]=(ui.cmMois||monthOf(todayISO())).split('-').map(Number);ui.cmMois=isoOf(new Date(y,mo-1+(+t.dataset.d),1)).slice(0,7);ui.cmSel=null;return render()}
    case 'cmNew':ui.cmNew=true;ui.pubEdit=null;render();window.scrollTo({top:0,behavior:'smooth'});return;
    case 'cmJour':ui.cmJour=t.dataset.d;ui.cmNew=true;ui.pubEdit=null;render();window.scrollTo({top:0,behavior:'smooth'});return;
    case 'cmSel':ui.cmSel=id||null;ui.pubEdit=null;ui.pubRetour=null;render();if(id){const el=document.getElementById('pub-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}return;
    case 'pubCancel':ui.cmNew=false;ui.pubEdit=null;ui.cmJour=null;return render();
    case 'pubEdit':ui.pubEdit=id;ui.cmNew=false;return render();
    case 'pubSt':return act(()=>sb.from('publications').update(t.dataset.s==='a_valider'?{statut:'a_valider',commentaire:null}:{statut:t.dataset.s}).eq('id',id),{a_valider:'Envoyé aux responsables',validee:'Publication validée',programmee:'Marquée programmée',publiee:'Marquée publiée : note ses résultats'}[t.dataset.s]);
    case 'pubRetour':ui.pubRetour=id||null;return render();
    case 'pubRetourOk':{const c=($('#prc-'+id)||{}).value||'';if(!c.trim())return toast('Écris ce qu’il faut changer');ui.pubRetour=null;return act(()=>sb.from('publications').update({statut:'idee',commentaire:c.trim()}).eq('id',id),'Renvoyé au community manager')}
    case 'pubDel':if(!armed(t))return;ui.cmSel=null;return act(()=>sb.from('publications').delete().eq('id',id),'Publication supprimée');
    case 'pinOn':return startPinFlow('create');
    case 'pinChange':return startPinFlow('change');
    case 'pinOff':return startPinFlow('disable');
    case 'lock':return lockNow();
  }
});
document.addEventListener('change',ev=>{
  const r=ev.target.closest('[data-rep]');
  if(r){const b=r.dataset.b,k=r.dataset.rep;
    if(k==='inc'){rep.inc[b]=r.checked;return render()}
    if(k==='liv'){rep.liv[b]=r.value;return}
    if(k==='adj'){rep.adj[b]=parseInt(r.value,10)||0;rep.adjTouched[b]=true;const q=rep.qty[b];if(q)Object.keys(q).forEach(p=>{if(q[p+'_auto'])delete q[p]});return render()}
    if(k==='qty'){rep.qty[b]=rep.qty[b]||{};rep.qty[b][r.dataset.p]=int(r.value);return render()}
  }
  const x=ev.target.closest('[data-act="ingUp"],[data-act="recQte"],[data-act="reglage"]');
  if(x){const a=x.dataset.act;
    if(a==='ingUp'){const k=x.dataset.k,row={};row[k]=k==='prix'?(x.value===''?null:parseFloat(String(x.value).replace(',','.'))):(x.value.trim()||null);if(k==='unite')row[k]=x.value;act(()=>sb.from('ingredients').update(row).eq('id',x.dataset.id),'Ingrédient mis à jour');return}
    if(a==='recQte'){const q=parseFloat(String(x.value).replace(',','.'))||0;act(()=>sb.from('recettes').upsert({parfum_id:x.dataset.p,ingredient_id:x.dataset.i,quantite:q}),'Recette mise à jour');return}
    if(a==='reglage'){const v=parseFloat(String(x.value).replace(',','.'));if(!isFinite(v))return;act(()=>sb.from('reglages').upsert({cle:x.dataset.k,valeur:v}),'Réglage enregistré');return}
  }
  if(ev.target.name==='dType'){demTypeUpdate(ev.target.closest('form'));return}
  const pst=ev.target.closest('[data-act="pubStat"]');if(pst){const row={};row[pst.dataset.k]=pst.value===''?null:int(pst.value);act(()=>sb.from('publications').update(row).eq('id',pst.dataset.id),'Résultat enregistré');return}
  const pl=ev.target.closest('[data-act="pubLien"]');if(pl){const v=pl.value.trim();if(v&&!/^https?:\/\//i.test(v))return toast('Le lien doit commencer par https://');act(()=>sb.from('publications').update({lien:v||null}).eq('id',pl.dataset.id),'Lien enregistré');return}
  const rs=ev.target.closest('[data-act="rsSet"]');if(rs){const row={reseau:rs.dataset.r,mois:rs.dataset.m+'-01'};const cur=reseauxStats.find(x=>x.reseau===row.reseau&&String(x.mois).slice(0,7)===rs.dataset.m)||{};row.abonnes=cur.abonnes!=null?cur.abonnes:null;row.objectif=cur.objectif!=null?cur.objectif:null;row[rs.dataset.k]=rs.value===''?null:int(rs.value);act(()=>sb.from('reseaux_stats').upsert(row),'Enregistré');return}
  const cj=ev.target.closest('[data-act="cmdJour"]');if(cj){ui.cmdJour=cj.value;ui.cmdHeure=null;ui.cmdNote=($('#cNote')||{}).value||'';return render()}
  const ch=ev.target.closest('[data-act="cmdHeure"]');if(ch){ui.cmdHeure=ch.value;return}
  const cp=ev.target.closest('[data-act="cmdPay"]');if(cp){act(()=>sb.from('commandes').update({paiement:cp.value}).eq('id',cp.dataset.id),'Paiement mis à jour');return}
  const ca2=ev.target.closest('[data-act="cmdAcompte"]');if(ca2){const v=parseFloat(String(ca2.value).replace(',','.'))||0;act(()=>sb.from('commandes').update({acompte:v}).eq('id',ca2.dataset.id),'Acompte enregistré');return}
  const es=ev.target.closest('#ecSens');if(es){const c=$('#ecCat');if(c)c.innerHTML=(es.value==='recette'?CAT_REC:CAT_DEP).map(v=>`<option>${esc(v)}</option>`).join('');const tv=$('#ecTva');if(tv&&es.value==='recette')tv.value='5.5';return}
  const ca=ev.target.closest('input[data-act="calAdj"]');
  if(ca){act(()=>sb.from('calendrier').update({ajustement:parseInt(ca.value,10)||0}).eq('id',ca.dataset.id),'Effet mis à jour');rep.target=null;return}
  const s=ev.target.closest('select[data-act]');if(!s)return;
  const id=s.dataset.id,a=s.dataset.act;
  if(a==='setRole')act(()=>sb.from('profiles').update({role:s.value}).eq('id',id),'Rôle mis à jour');
  if(a==='setBorneLieu')act(()=>sb.from('profiles').update({boutique_id:s.value||null}).eq('id',id),'Lieu de la borne mis à jour');
  if(a==='setStatut')act(()=>sb.from('envois').update({statut:s.value}).eq('id',id),'Statut mis à jour');
  if(a==='demStatut')act(()=>sb.from('demandes').update({statut:s.value}).eq('id',id),'Statut mis à jour');
  if(a==='demSuivi')act(()=>sb.from('demandes').update({suivi_par:s.value||null}).eq('id',id),'Suivi mis à jour');
  if(a==='setLivreur')act(()=>sb.from('envois').update({livreur_id:s.value||null}).eq('id',id),'Livreur mis à jour');
});
document.addEventListener('input',ev=>{
  const q=ev.target.closest('#cliQ,#ctQ');if(q){const v=q.value.trim().toLowerCase();document.querySelectorAll('#main [data-q]').forEach(r=>{r.hidden=!!v&&!r.dataset.q.includes(v)});return}
  const i=ev.target.closest('#clotureForm input[data-row]');if(!i)return;
  const pid=i.dataset.row,tr=i.closest('tr');const st=+tr.dataset.stock;
  const used=['v','j','c','d'].reduce((a,k)=>a+int(($('#c'+k+'-'+pid)||{}).value),0);
  const out=$('#cr-'+pid);if(out){out.textContent=st-used;out.style.color=st-used<0?'var(--bad)':''}
});
document.addEventListener('submit',async ev=>{
  const f=ev.target;ev.preventDefault();
  const btn=f.querySelector('button[type=submit]');
  const fail=(sel,m)=>{const e=typeof sel==='string'?$(sel):sel;if(e){e.textContent=m;e.hidden=false}if(btn)btn.disabled=false};
  if(f.id==='authForm')return submitAuth();
  if(f.id==='demandeForm')return envoyerDemande(f,btn);
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
  if(f.id==='profileForm'){await act(()=>sb.from('profiles').update({prenom:$('#pPrenom').value.trim()||null,nom:$('#pNom').value.trim()||null,telephone:$('#pTel').value.trim()||null}).eq('id',me.id),'Profil enregistré');if(btn)btn.disabled=false;return}
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
    const ids=parfums.map(p=>p.id).filter(pid=>document.getElementById('cv-'+pid));
    const old=clotures.find(c=>c.boutique_id===B);const oldIds=new Set((old&&old.cloture_lignes||[]).map(l=>l.parfum_id));
    const lines=ids.map(pid=>({parfum_id:pid,quarts_vendus:int($('#cv-'+pid).value),quarts_jetes:int($('#cj-'+pid).value),quarts_casses:int($('#cc-'+pid).value),quarts_donnes:int($('#cd-'+pid).value)})).filter(l=>l.quarts_vendus||l.quarts_jetes||l.quarts_casses||l.quarts_donnes||oldIds.has(l.parfum_id));
    if(!lines.length)return fail('#clErr','Remplis au moins une ligne.');
    const {data,error}=await sb.from('clotures').upsert({jour:day,boutique_id:B,vendeur_id:me.id,note:$('#clNote').value.trim()||null,updated_at:new Date().toISOString()},{onConflict:'jour,boutique_id'}).select('id').single();
    if(error)return fail('#clErr',frErr(error));
    const r=await sb.from('cloture_lignes').upsert(lines.map(l=>Object.assign({cloture_id:data.id},l)),{onConflict:'cloture_id,parfum_id'});
    if(r.error)return fail('#clErr',frErr(r.error));
    toast('Clôture enregistrée');reload();return;
  }
  if(f.id==='cmdForm'){
    const lignes=readGrid('nc',catalogue()).map(l=>({parfum_id:l.parfum_id,quantite:l.q}));const nom=$('#ncNom').value.trim(),j=$('#ncJour').value;
    if(!nom)return fail('#ncErr','Indique le nom du client.');if(!j)return fail('#ncErr','Indique le jour de retrait.');if(!lignes.length)return fail('#ncErr','Indique au moins un flan.');
    const pay=$('#ncPay').value,ac=parseFloat(String($('#ncAcompte').value).replace(',','.'))||0;
    const {data,error}=await sb.rpc('passer_commande',{p_lignes:lignes,p_jour:j,p_heure:$('#ncHeure').value,p_note:$('#ncNote').value.trim()||null,p_client:{nom,tel:$('#ncTel').value.trim(),email:$('#ncMail').value.trim()},p_paiement:pay,p_acompte:pay==='acompte'?ac:0});
    if(error)return fail('#ncErr',frErr(error));ui.cmdNew=false;ui.cmdTab='avenir';toast('Commande '+data.numero+' enregistrée');reload();return;
  }
  if(f.id==='cmdRegles'){
    const jours=[...f.querySelectorAll('input[name="crJ"]:checked')].map(x=>+x.value);const v={seuil_flans:+$('#crSeuil').value||1,delai_petit_h:+$('#crPetit').value||0,delai_grand_h:+$('#crGrand').value||0,max_flans:+$('#crMax').value||1,heure_debut:$('#crDeb').value,heure_fin:$('#crFin').value,pas_minutes:Math.max(5,+$('#crPas').value||30),boutique_retrait:$('#crBout').value||null,jours,en_ligne:$('#crOn').checked};
    if(!jours.length)return fail('#crErr','Choisis au moins un jour de retrait.');if(!v.heure_debut||!v.heure_fin||v.heure_fin<=v.heure_debut)return fail('#crErr','Vérifie les horaires de retrait.');
    const {error}=await sb.from('parametres').upsert({cle:'commandes',valeur:v});if(error)return fail('#crErr',frErr(error));toast('Règles enregistrées');reload();if(btn)btn.disabled=false;return;
  }
  if(f.id==='ptForm'){
    const h=$('#ptHeure').value;if(!h)return fail('#ptErr','Indique l’heure.');
    const at=new Date(f.dataset.d+'T'+h+':00').toISOString();
    const {error}=await sb.from('pointages').insert({user_id:f.dataset.u,jour:f.dataset.d,type:$('#ptType').value,at,note:$('#ptNote').value.trim()||'Correction'});
    if(error)return fail('#ptErr',frErr(error));toast('Pointage ajouté');if(heuresData)loadHeures(heuresData.ws);return;
  }
  if(f.id==='agForm'){
    const titre=$('#agTitre').value.trim(),jour=$('#agJour').value,fin=$('#agFin').value||null;
    if(!titre)return fail('#agErr','Donne un titre.');if(!jour)return fail('#agErr','Choisis la date.');if(fin&&fin<jour)return fail('#agErr','La fin doit être après le début.');
    const {error}=await sb.from('evenements').insert({titre,jour,fin,heure:$('#agHeure').value||null,categorie:$('#agCat').value,boutique_id:$('#agShop').value||null,note:$('#agNote').value.trim()||null});
    if(error)return fail('#agErr',frErr(error));toast('Ajouté à l’agenda');ui.agMois=monthOf(jour);loadAgenda(ui.agMois);return;
  }
  if(f.id==='pinPtForm'){
    const a=$('#ppA').value.trim(),b=$('#ppB').value.trim();
    if(!/^[0-9]{4,6}$/.test(a))return fail('#ppErr','Le code doit faire 4 à 6 chiffres.');if(a!==b)return fail('#ppErr','Les deux codes ne correspondent pas.');
    const {error}=await sb.rpc('set_pin_pointage',{p_pin:a});if(error)return fail('#ppErr',frErr(error));
    pinPointage=true;toast('Code de pointage enregistré');render();return;
  }
  if(f.id==='lotForm'){
    const pid=$('#loParfum').value,q=int($('#loQte').value);if(!q)return fail('#loErr','Indique la quantité de flans.');
    const p=parfum(pid)||{},n=lots.filter(l=>l.jour===day&&l.parfum_id===pid).length+1;
    const numero=day.slice(2).replace(/-/g,'')+'-'+codeOf(p.nom)+'-'+n;
    const {error}=await sb.from('lots').insert({numero,jour:day,parfum_id:pid,quantite:q,dlc:addDays(day,DUREE-1),ingredients:$('#loIngr').value.trim()||null});
    if(error)return fail('#loErr',/lots_numero_key|duplicate/.test(error.message||'')?'Ce numéro de lot existe déjà : réessaie.':frErr(error));
    ui.lotPrefill=null;toast('Lot '+numero+' créé');reload();return;
  }
  if(f.dataset.releve){
    const err=f.querySelector('.msg'),e=equipements.find(x=>x.id===f.dataset.releve);
    const v=parseFloat(String(f.elements.valeur.value).replace(',','.'));if(!isFinite(v))return fail(err,'Indique la température.');
    const ok=v>=+e.t_min&&v<=+e.t_max,action=f.elements.action.value.trim();
    if(!ok&&!action)return fail(err,'Hors limites : indique l’action corrective.');
    const {error}=await sb.from('releves').insert({equipement_id:e.id,valeur:v,conforme:ok,action:action||null});
    if(error)return fail(err,frErr(error));toast(ok?'Relevé enregistré':'Relevé hors limites enregistré');reload();return;
  }
  if(f.id==='eqForm'){
    const nom=$('#eqNom').value.trim(),mi=parseFloat($('#eqMin').value),ma=parseFloat($('#eqMax').value);
    if(!nom)return fail('#eqErr','Donne un nom.');if(!(ma>mi))return fail('#eqErr','Le maxi doit être au-dessus du mini.');
    const {error}=await sb.from('equipements').insert({nom,t_min:mi,t_max:ma,ordre:equipements.length+1});if(error)return fail('#eqErr',frErr(error));
    toast('Équipement ajouté');reload();return;
  }
  if(f.id==='recForm'){
    const four=$('#reFour').value.trim(),prod=$('#reProd').value.trim();if(!four||!prod)return fail('#reErr','Indique le fournisseur et le produit.');
    const t=$('#reTemp').value===''?null:parseFloat(String($('#reTemp').value).replace(',','.'));
    const {error}=await sb.from('receptions').insert({fournisseur:four,produit:prod,lot_fournisseur:$('#reLot').value.trim()||null,dlc:$('#reDlc').value||null,temperature:isFinite(t)?t:null,conforme:$('#reOk').value==='1',note:$('#reNote').value.trim()||null});
    if(error)return fail('#reErr',frErr(error));toast('Réception enregistrée');reload();return;
  }
  if(f.id==='ingForm'){
    const nom=$('#inNom').value.trim();if(!nom){if(btn)btn.disabled=false;return toast('Donne un nom à l’ingrédient')}
    await act(()=>sb.from('ingredients').insert({nom,unite:$('#inUnite').value}),'Ingrédient ajouté');if(btn)btn.disabled=false;return;
  }
  if(f.id==='recAdd'){
    const q=parseFloat(String($('#raQte').value).replace(',','.'));if(!(q>0)){if(btn)btn.disabled=false;return toast('Indique la quantité pour 1 flan')}
    await act(()=>sb.from('recettes').upsert({parfum_id:f.dataset.p,ingredient_id:$('#raIng').value,quantite:q}),'Ingrédient ajouté à la recette');if(btn)btn.disabled=false;return;
  }
  if(f.id==='ecrForm'){
    const mt=parseFloat(String($('#ecMt').value).replace(',','.')),lib=$('#ecLib').value.trim(),jour=$('#ecJour').value;
    if(!lib)return fail('#ecErr','Indique un libellé.');if(!(mt>=0)||$('#ecMt').value==='')return fail('#ecErr','Indique le montant TTC.');if(!jour)return fail('#ecErr','Indique la date.');
    const row={sens:$('#ecSens').value,jour,categorie:$('#ecCat').value,libelle:lib,tiers:$('#ecTiers').value.trim()||null,montant_ttc:mt,tva:parseFloat($('#ecTva').value),echeance:$('#ecEch').value||null,paye:$('#ecPaye').value==='1'};
    const {error}=await sb.from('ecritures').insert(row);if(error)return fail('#ecErr',frErr(error));
    toast('Écriture enregistrée');if(monthOf(jour)!==ui.mois&&ui.mois){ui.mois=monthOf(jour)}loadCompta(ui.mois||monthOf(todayISO()));return;
  }
  if(f.id==='calForm'){
    const row={libelle:$('#caLib').value.trim(),type:$('#caType').value,debut:$('#caDeb').value,fin:$('#caFin').value||$('#caDeb').value,zone:$('#caZone').value,ajustement:parseInt($('#caAdj').value,10)||0};
    if(!row.libelle)return fail('#caErr','Donne un libellé.');
    if(!row.debut)return fail('#caErr','Choisis la date de début.');
    if(row.fin<row.debut)return fail('#caErr','La fin doit être après le début.');
    const {error}=await sb.from('calendrier').insert(row);if(error)return fail('#caErr',frErr(error));
    rep.target=null;toast('Ajouté au calendrier');reload();return;
  }
  if(f.dataset.contactform){
    const d=Object.fromEntries(new FormData(f));const err=f.querySelector('.msg');
    if(!d.nom.trim())return fail(err,'Indique le nom du contact.');
    if(d.email.trim()&&!/^\S+@\S+\.\S+$/.test(d.email.trim()))return fail(err,'Adresse e-mail invalide.');
    const row={categorie:d.categorie};['nom','societe','fonction','telephone','email','adresse','note'].forEach(k=>row[k]=d[k].trim()||null);
    const isNew=f.dataset.contactform==='new';
    const {error}=isNew?await sb.from('contacts').insert(row):await sb.from('contacts').update(row).eq('id',f.dataset.contactform);
    if(error)return fail(err,/contacts/.test(error.message||'')&&/exist/.test(error.message||'')?'Base pas à jour : lance etape6.sql dans Supabase.':frErr(error));
    ui.ctAdd=false;ui.ctEdit=null;ui.ctTab=row.categorie;toast(isNew?'Contact ajouté':'Contact modifié');reload();return;
  }
  if(f.dataset.pubform){
    const d=Object.fromEntries(new FormData(f));const err=f.querySelector('.msg');
    if(!d.titre.trim())return fail(err,'Donne un titre à la publication.');if(!d.jour)return fail(err,'Choisis la date.');
    const v=d.visuel.trim();if(v&&!/^(https?:\/\/|photos\/)/i.test(v))return fail(err,'Visuel : choisis une photo de la liste ou colle un lien https://');
    const row={jour:d.jour,heure:d.heure||null,reseau:d.reseau,format:d.format,titre:d.titre.trim(),texte:d.texte.trim()||null,hashtags:d.hashtags.trim()||null,parfum_id:d.parfum_id||null,visuel:v||null};
    const isNew=f.dataset.pubform==='new';
    if(isNew)row.statut=d.envoyer?(isResp(me)?'validee':'a_valider'):'idee';
    const {error}=isNew?await sb.from('publications').insert(row):await sb.from('publications').update(row).eq('id',f.dataset.pubform);
    if(error)return fail(err,frErr(error));
    ui.cmNew=false;ui.pubEdit=null;ui.cmJour=null;ui.cmMois=monthOf(row.jour);toast(isNew?(row.statut==='a_valider'?'Envoyé en validation':'Publication enregistrée'):'Publication modifiée');reload();return;
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
    const row={nom:d.nom.trim(),prix_quart:pq,prix_entier:isFinite(pe)?pe:null,couleur:d.couleur,disponible:d.disponible==='1',photo:d.photo||null};
    if(isNew)row.ordre=(Math.max(0,...parfums.map(p=>p.ordre||0))+1);
    const {error}=isNew?await sb.from('parfums').insert(row):await sb.from('parfums').update(row).eq('id',f.dataset.parfumform);
    if(error)return fail(err,frErr(error));
    ui.editParfum=null;ui.addParfum=false;toast(isNew?'Parfum ajouté':'Parfum modifié');reload();return;
  }
  if(btn)btn.disabled=false;
});

async function repSend(btn){
  const target=rep.target;if(!target)return;
  const work=[];
  for(const b of boutiques.filter(x=>x.actif)){
    const ex=envoisAll.find(e=>e.jour===target&&e.boutique_id===b.id&&e.type==='matin'&&e.statut!=='refuse');
    if(ex&&ex.statut!=='valide')continue;
    const rows=repRows(b.id,target),q=rep.qty[b.id]||{};
    const lines=rep.inc[b.id]?rows.map(r=>({parfum_id:r.p.id,quantite:q[r.p.id]!=null?q[r.p.id]:(r.prop||0)})).filter(l=>l.quantite>0):[];
    const liv=(rep.liv[b.id]!=null?rep.liv[b.id]:(document.querySelector(`select[data-rep="liv"][data-b="${b.id}"]`)||{}).value)||null;
    work.push({b,ex,lines,liv});
  }
  if(!work.some(w=>w.lines.length||w.ex))return toast('Aucune quantité à envoyer');
  btn.disabled=true;let n=0;
  try{
    for(const w of work){
      if(!w.lines.length){if(w.ex){const r=await sb.from('envois').delete().eq('id',w.ex.id);if(r.error)throw r.error}continue}
      let id=w.ex&&w.ex.id;
      if(id){let r=await sb.from('envois').update({livreur_id:w.liv}).eq('id',id);if(r.error)throw r.error;r=await sb.from('envoi_lignes').delete().eq('envoi_id',id);if(r.error)throw r.error}
      else{const r=await sb.from('envois').insert({jour:target,boutique_id:w.b.id,type:'matin',statut:'valide',livreur_id:w.liv}).select('id').single();if(r.error)throw r.error;id=r.data.id}
      const r=await sb.from('envoi_lignes').insert(w.lines.map(l=>({envoi_id:id,parfum_id:l.parfum_id,quantite:l.quantite})));if(r.error)throw r.error;n++;
    }
    toast(n+' livraison'+(n>1?'s':'')+' envoyée'+(n>1?'s':'')+' au labo');rep.target=null;reload();
  }catch(e){toast(frErr(e))}finally{btn.disabled=false}
}

async function submitAuth(){
  const email=$('#aEmail').value.trim(),pw=$('#aPw').value,err=$('#authErr'),ok=$('#authOk');
  err.hidden=true;ok.hidden=true;const fail=m=>{err.textContent=m;err.hidden=false};
  if(!/^\S+@\S+\.\S+$/.test(email))return fail('Entre une adresse e-mail valide.');
  if(authMode==='login'&&!pw)return fail('Entre ton mot de passe.');
  if(authMode==='activate'||authMode==='client'){
    if(!$('#aPrenom').value.trim())return fail('Entre ton prénom.');
    if(authMode==='client'&&!/^[+0-9 .()-]{8,20}$/.test($('#aTel').value.trim()))return fail('Entre ton numéro de téléphone (pour te prévenir si besoin).');
    if(pw.length<(authMode==='client'?8:10))return fail('Le mot de passe doit faire au moins '+(authMode==='client'?8:10)+' caractères.');
    if(!$('#aCharte').checked)return fail('Coche la case pour continuer.');
  }
  const btn=$('#authBtn');btn.disabled=true;
  try{
    if(authMode==='login'){justLoggedIn=true;const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error){justLoggedIn=false;fail(frErr(error))}}
    else if(authMode==='activate'){
      const {data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:APP_URL,data:{prenom:$('#aPrenom').value.trim(),nom:$('#aNom').value.trim()}}});
      if(error)fail(frErr(error));else if(!data.session)setAuthMode('login','Compte créé. Clique le lien du mail de confirmation (pense aux spams), puis connecte-toi ici.');else justLoggedIn=true;
    }else if(authMode==='client'){
      const {data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:APP_URL,data:{espace:'client',prenom:$('#aPrenom').value.trim(),nom:$('#aNom').value.trim(),telephone:$('#aTel').value.trim()}}});
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
