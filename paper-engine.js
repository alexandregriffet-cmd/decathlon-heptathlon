/* Déca · Hepta : moteur de règles commun au jeu papier et au jeu en ligne.
   Il applique les règles du livre (chapitres 4 à 15) avec les tables de lecture exportées (paper-data.json).
   Aucune formule de chrono : tout résultat se lit dans les tables. */
(function(root){
'use strict';
const AP=[18,17,16,15,14,13],BASEP=[6,9,12,15];
const cl=v=>Math.max(1,Math.min(18,v));
const kind=(d,se)=>d===20?'crit':d===se?'parf':d<se?'reuss':'echec';
const KF={parf:2,reuss:1,echec:0,crit:-1};                      // forme du jour et Mental
const FALSE_START=['100','400','110h','100h','200','60','60h'];

function create(DATA,helpers){
 const {ptsOf}=helpers;                                          // barème de points (World Athletics)
 const aptOf=(CH,id)=>Math.max(13,Math.min(18,Math.round(DATA.TRIO[id].reduce((a,k)=>a+CH[k],0)/3)));
 const levelOf=pc=>pc>=100?4:pc>=80?3:pc>=60?2:1;
 const capOf=(id,pc)=>DATA.CAPMAX[id]-(4-levelOf(pc));
 const baseOf=pc=>BASEP[levelOf(pc)-1];
 const rankOf=(d,R,bonus)=>d===1?1:d===20?20:Math.min(19,Math.max(2,d+R-10+(bonus||0)));

 function lookupRace(tab,cap,resText,rank,ai){
  const b=tab.blocks.find(x=>x.cap===cap);
  const row=b.rows.find(r=>String(r.res)===resText)||b.rows.find(r=>(r.cover||[]).includes(resText))||(()=>{ /* extrémités : « et plus rapide / et plus lent » */
   const f=b.rows[0],l=b.rows[b.rows.length-1];const key=x=>{const [a,c]=String(x).split('.');return +a+(+(c||0))/100;};return key(resText)<key(f.res)?f:l;})();
  return {row,v:row.vals[20-rank][ai]};
 }

 /* Une épreuve d'un athlète. ctx = {CH, COMP, sex, cat, dayBreak, roll(info)->Promise<d20>}. L'état (forme, fatigue…) vit dans ctx.st. */
 function newState(ctx){ctx.st={forme:0,first:0,nextMent:0,nextRage:0,fat:0,stopped:false};ctx.res=[];ctx.total=0;return ctx;}
 async function playEvent(ctx,idx){
  const {CH,COMP,sex,roll}=ctx;const evs=DATA.EV[ctx.cat];const brk=ctx.dayBreak||Math.ceil(evs.length/2);
  const R=Math.round((CH.men+CH.tac)/2);
  const st=ctx.st,res=ctx.res;
  const e=evs[idx];
  {
   const id=e.id,tab=DATA.TABLES[sex][id];const L=[];let head='';
   if(ctx.gate)await ctx.gate(0);
   if(st.stopped){res.push({id,head:'',lines:['Abandon : blessure.'],detail:null,perf:null,pts:0,forfeit:true,abandon:true});return res[res.length-1];}
   if((idx===0||idx===brk)&&ctx.dayInfo){const j=idx===0?1:2;st.fat=0;st.forme=ctx.dayInfo(j).forme;st.first=0;st.nextMent=0;st.nextRage=0;}
   else if(idx===0||idx===brk){const j=idx===0?1:2;st.fat=0;
    const apt1=aptOf(CH,id);const d=await roll({k:'form',label:'Forme du jour',seuil:apt1,idx}),k=kind(d,apt1);st.forme=KF[k];st.first=0;st.nextMent=0;st.nextRage=0;
    const a=await roll({k:'alea',label:'Aléa du jour'});let t='journée normale';
    if(a===1){st.forme-=1;t='nuit blanche (forme −1)';}else if(a===2){st.first=-1;t='échauffement bâclé (−1 au premier jet)';}else if(a<=4){st.nextMent=-1;t='stress de la chambre d’appel (Mental −1 à la prochaine épreuve)';}else if(a===5){st.fat+=1;t='genou qui tire (fatigue +1)';}else if(a===15){st.first=1;t='bon échauffement (+1 au premier jet)';}else if(a<=17&&a>=16){st.nextRage=1;t='dernier conseil du coach (+1 au rang de la prochaine rage de vaincre)';}else if(a===18){st.nextMent=1;t='public chaud (Mental +1 à la prochaine épreuve)';}else if(a===19){st.forme+=1;t='excellente nuit (forme +1)';}else if(a===20){st.forme+=1;st.first=1;t='jour de grâce (forme +1, +1 au premier jet)';}
    head=`Jour ${j} : forme d20=${d} contre ${apt1} (${k==='parf'?'parfait +2':k==='reuss'?'réussi +1':k==='crit'?'échec critique −1':'échec 0'}). Aléa du jour d20=${a} : ${t}. Modificateur de forme du jour : ${(st.forme>=0?'+':'')+st.forme}.`;
    if(ctx.emit)await ctx.emit({k:'note',t:`Forme du jour : ${k==='parf'?'parfaite':k==='reuss'?'réussie':k==='crit'?'échec critique':'échec'}. Aléa du jour : ${t}. Forme ${(st.forme>=0?'+':'')+st.forme}.`});}
   const apt=aptOf(CH,id),ai=AP.indexOf(apt),pc=COMP[id],cap=capOf(id,pc),base=baseOf(pc);
   /* conditions et Mental */
   const dc=await roll({k:'cond',label:'Conditions',idx});let cm=0,ct='conditions neutres';
   if(dc>=6&&dc<=7&&['100','110h','lj'].includes(id)){cm=1;ct='vent arrière';}else if(dc>=8&&dc<=9&&['100','110h','lj'].includes(id)){cm=-1;ct='vent de face';}else if(dc===10){cm=-1;ct='pluie fine';}else if(dc===11&&['100','400','110h','1500'].includes(id)){cm=-1;ct='chaleur écrasante';}else if(dc===12&&['sp','dt','jt'].includes(id)){cm=-1;ct='rafales';}else if(dc===13||dc===14){cm=CH.men>=14?2:1;ct='le public s’enflamme';}else if(dc===15||dc===16){cm=CH.men>=14?0:-1;ct='stade silencieux';}else if(dc===17){cm=1;ct='soirée idéale';}
   const dm=await roll({k:'mental',label:'Mental',seuil:CH.men,idx}),km=kind(dm,CH.men),mm=KF[km]+st.nextMent;st.nextMent=0;
   let common=base+st.forme+cm+mm-st.fat-(ctx.rust||0);if(ctx.emit)await ctx.emit({k:'note',t:`Conditions : ${ct} (${cm>=0?'+':''}${cm}). Mental ${mm>=0?'+':''}${mm}. Seuil de base ${cl(common)}.`});let had20=false;let first=st.first;st.first=0;const rageB=st.nextRage;st.nextRage=0;
   L.push(`Conditions d20=${dc} : ${ct} (${cm>=0?'+':''}${cm}). Mental d20=${dm} contre ${CH.men} : ${KF[km]>=0?'+':''}${KF[km]}. Seuil de base ${base} + forme ${st.forme>=0?'+':''}${st.forme} + conditions ${cm>=0?'+':''}${cm} + Mental ${mm>=0?'+':''}${mm}${st.fat?' − fatigue '+st.fat:''} = ${cl(common)}.`);
   let native=null,detail=null;
   if(tab.kind==='race'){
    const g=DATA.GEO[id],N=g.N,k=g.k,F=g.F;let done=0,n=0,chain=0;const nj=[];
    let sd=cl(common+first);first=0;let d=await roll({k:'start',label:'Départ',seuil:sd,idx}),kk=kind(d,sd);
    if(kk==='crit'&&FALSE_START.includes(id)){nj.push('faux départ (d20=20), on relance avec −2');sd=cl(sd-2);d=await roll({k:'start',label:'Départ (relance)',seuil:sd,idx});kk=kind(d,sd);}
    if(d===20)had20=true;
    const gain=kk==='parf'?2:kk==='reuss'?1:0;done+=gain;nj.push(`départ d20=${d} contre ${sd} : +${gain} case${gain>1?'s':''}`);
    if(ctx.emit&&gain)await ctx.emit({k:'advance',cum:done,a:gain,out:kk,start:true,N});
    let resText='';const steps=[];
    for(;;){
     const fat=Math.floor(done/N*F*(1-CH.end/20));const se=cl(common+chain+first-fat);first=0;
     const d2=await roll({k:'run',label:'Jet '+(n+1),seuil:se,done,N,idx});if(d2===20)had20=true;const k2=kind(d2,se);const cases=(k2==='parf'?4:k2==='reuss'?3:k2==='echec'?2:1)*k;
     const r=N-done;
     if(done+cases>=N){resText=n+'.'+r;steps.push(`jet ${n+1} : d20=${d2} contre ${se} → ${cases} cases : arrivée`);if(ctx.emit)await ctx.emit({k:'advance',cum:N,a:cases,out:k2,N,finish:true});break;}
     done+=cases;n++;chain=k2==='parf'?1:k2==='crit'?-1:0;steps.push(`jet ${n} : d20=${d2}/${se} → +${cases}`);
     if(ctx.emit)await ctx.emit({k:'advance',cum:done,a:cases,out:k2,N});
    }
    const dr=await roll({k:'rage',label:'Rage de vaincre',idx}),rk=rankOf(dr,R,rageB);const lk=lookupRace(tab,cap,resText,rk,ai);native=lk.v;
    detail={type:'race',N,resText,steps,start:nj,cap,row:lk.row.res,rageD:dr,rank:rk,apt,value:native};
    L.push(`Course de ${N} cases : ${nj.join(' ; ')}. ${steps.length>4?steps.slice(0,3).join(' ; ')+' ; … ; '+steps[steps.length-1]:steps.join(' ; ')}. Résultat n.r = ${resText}.`);
    L.push(`Bloc « capacité ${cap} », ligne ${lk.row.res}. Rage d20=${dr} avec R=${R} : rang ${rk}. Colonne aptitude ${apt}.`);
   } else if(tab.kind==='field'){
    let best=null;const att=[];
    for(let a=1;a<=3;a++){
     if(ctx.gate)await ctx.gate(a);
     const s1=cl(common+first);first=0;const d1=await roll({k:'elan',label:'Élan, essai '+a,seuil:s1,idx});if(d1===20)had20=true;const k1=kind(d1,s1);const ch=k1==='parf'?1:k1==='crit'?-1:0;
     const s2=cl(common+ch);const d2=await roll({k:'throw',label:'Saut ou lancer, essai '+a,seuil:s2,idx});if(d2===20)had20=true;
     if(d2===20){att.push({n:a,nul:true,d1,s1,d2,s2});if(ctx.emit)await ctx.emit({k:'attempt',a,att:att[att.length-1]});continue;}
     const lv=(d2===s2||d2*3<=s2)?1:d2<s2?0:-1;const rrow=cap+lv;const dr=await roll({k:'rage',label:'Rage de vaincre, essai '+a,idx});const rk=rankOf(dr,R,a===1?rageB:0);
     const b=tab.blocks.find(x=>x.cap===cap);const row=b.rows.find(r=>String(r.res)===String(rrow));const v=row.vals[20-rk][ai];
     att.push({n:a,d1,s1,d2,s2,line:rrow,rageD:dr,rank:rk,value:v});if(best===null||v>best)best=v;
     if(ctx.emit)await ctx.emit({k:'attempt',a,att:att[att.length-1]});
    }
    native=best===null?0:best;detail={type:'field',att,apt,cap,value:native};
    L.push(att.map(t=>t.nul?`essai ${t.n} : élan ${t.d1}/${t.s1}, jet ${t.d2}/${t.s2} : nul`:`essai ${t.n} : élan ${t.d1}/${t.s1}, jet ${t.d2}/${t.s2} → ligne ${t.line}, rage ${t.rageD} → rang ${t.rank} : ${t.value}`).join('\n'));
   } else {
    const b=tab.blocks.find(x=>x.cap===cap);const rows=[...b.rows].reverse();const mod=st.forme+cm+mm-st.fat-(ctx.rust||0);
    const parse=x=>{const q=String(x);if(q.includes('**'))return q.startsWith('20')?99:-1;const v=parseInt(q);return isNaN(v)?-1:v;};
    if(ctx.barAsk){   /* barre commune : tous les athlètes sautent la même hauteur, la barre monte pour tout le monde */
     const rs=b.rows.map(r=>({h:r[0],s:parse(r[1+ai])}));          // du plus haut au plus bas
     const seuilAt=hM=>{let q=null;rs.forEach(x=>{if(x.h>=hM-1e-9&&(!q||x.h<q.h))q=x;});if(!q)return -1;const lo=rs[rs.length-1];return hM<lo.h-1e-9?99:q.s;};
     let fails=0,bestH=null;const log=[];
     for(let guard=0;guard<200;guard++){
      const q=await ctx.barAsk({best:bestH,fails,idx,seuilAt:cm=>seuilAt(cm/100),base:cl(base+mod+first)});
      if(!q)break;const hh=q.h/100,s=seuilAt(hh);let ok;
      if(s===-1){ok=false;log.push({h:hh,de:0,sb:0,dj:0,sj:0,ok,imp:true});}
      else if(s===99){ok=true;log.push({h:hh,de:0,sb:0,dj:0,sj:0,ok,auto:true});}
      else{
       const sb=cl(base+mod+first);first=0;const de=await roll({k:'elan',label:'Élan à '+hh.toFixed(2)+' m',seuil:sb,idx,h:hh,t:fails+1});if(de===20)had20=true;const ke=kind(de,sb);const ch=ke==='parf'?1:ke==='crit'?-1:0;
       const sj=cl(s+mod+ch);const dj=await roll({k:'jump',label:'Saut à '+hh.toFixed(2)+' m',seuil:sj,h:hh,idx,t:fails+1});if(dj===20)had20=true;const kj=kind(dj,sj);ok=(kj==='parf'||kj==='reuss');
       log.push({h:hh,de,sb,dj,sj,ok});}
      if(ok){bestH=hh;fails=0;}else fails++;
      if(ctx.emit)await ctx.emit({k:'barjump',entry:log[log.length-1],fails});
      if(fails>=3)break;
     }
     native=bestH===null?0:bestH;detail={type:'bar',log,fails,best:bestH,apt,cap};
     L.push(log.map(t=>`${t.h.toFixed(2)} m : ${t.imp?'hors de portée':t.auto?'franchi sans difficulté':'élan '+t.de+'/'+t.sb+', saut '+t.dj+'/'+t.sj+' : '+(t.ok?'passé':'raté')}`).join('\n'));
    } else {
    let fails=0,bestH=null;const log=[];
    const cand=rows.map(r=>({h:r[0],s:parse(r[1+ai])})).filter(x=>x.s>=0);
    let pos=cand.findIndex(x=>x.s<=17&&x.s>=1);if(pos<0)pos=0;
    while(pos<cand.length&&fails<3&&log.length<=30){
     const hh=cand[pos];if(hh.s===99){bestH=hh.h;pos++;fails=0;continue;}
     const sb=cl(base+mod+first);first=0;const de=await roll({k:'elan',label:'Élan à '+hh.h.toFixed(2)+' m',seuil:sb,idx,h:hh.h,t:fails+1});if(de===20)had20=true;const ke=kind(de,sb);const ch=ke==='parf'?1:ke==='crit'?-1:0;
     const sj=cl(hh.s+mod+ch);const dj=await roll({k:'jump',label:'Saut à '+hh.h.toFixed(2)+' m',seuil:sj,h:hh.h,idx,t:fails+1});if(dj===20)had20=true;const kj=kind(dj,sj);const ok=(kj==='parf'||kj==='reuss');
     log.push({h:hh.h,de,sb,dj,sj,ok});
     if(ctx.emit)await ctx.emit({k:'barjump',entry:log[log.length-1],fails:ok?0:fails+1});
     if(ok){bestH=hh.h;fails=0;const n2=cand[pos+2];pos+=(n2&&n2.s>=12&&n2.s<99)?2:1;}else{fails++;}
    }
    native=bestH===null?0:bestH;detail={type:'bar',log,fails,best:bestH,apt,cap};
    L.push(log.map(t=>`${t.h.toFixed(2)} m : élan ${t.de}/${t.sb}, saut ${t.dj}/${t.sj} : ${t.ok?'passé':'raté'}`).join('\n'));
    }
   }
   /* incident : un 20 naturel pendant l'épreuve */
   let forfeit=false,abandon=false,light=false,incident=null;
   if(had20){const di=await roll({k:'incident',label:'Incident',idx});let txt;
    if(di<=10)txt='rien';else if(di<=13){txt='crampe (fatigue +1, −1 au premier jet de l’épreuve suivante)';st.fat+=1;st.first=-1;}else if(di<=16){txt='mauvais appui (−1 au premier jet de l’épreuve suivante)';st.first=-1;}else if(di<=19){const kk2=DATA.TRIO[id][(di-1)%3];CH[kk2]=Math.max(1,CH[kk2]-1);txt=`douleur (−1 en ${kk2} jusqu’à la fin de la compétition)`;}
    else{const r2=await roll({k:'incident2',label:'Relance',idx});if(r2>=16){txt=`blessure possible : relance ${r2}, blessure et abandon`;abandon=true;}else{txt=`blessure possible : relance ${r2}, blessure légère : le résultat de l’épreuve est conservé, fatigue +2 et −1 au premier jet de l’épreuve suivante`;st.fat+=2;st.first=-1;light=true;}}
    incident={d:di,txt,light};if(ctx.emit)await ctx.emit({k:'note',t:'Incident : '+txt+'.'});L.push(`Un 20 naturel est sorti pendant l’épreuve : incident d20=${di} : ${txt}.`);}
   const nativeCm=(id==='hj'||id==='pv')?Math.round(native*100):(DATA.CMUNIT&&DATA.CMUNIT.includes(id)?Math.round(native*100):native);
   const perf=forfeit?null:native;const pts=(perf&&!forfeit)?ptsOf(id,sex,native):0;ctx.total+=pts;
   res.push({id,head,lines:L,detail,perf,pts,cap,apt,pc,forfeit,abandon,incident});
   if(abandon)st.stopped=true;
  }
  return res[res.length-1];
 }
 async function playCompetition(ctx){newState(ctx);const n=DATA.EV[ctx.cat].length;for(let i=0;i<n;i++)await playEvent(ctx,i);return {res:ctx.res,total:ctx.total,R:Math.round((ctx.CH.men+ctx.CH.tac)/2)};}
 return {aptOf,levelOf,capOf,baseOf,rankOf,lookupRace,newState,playEvent,playCompetition,kind};
}
const api={create,AP,kind,cl};
if(typeof module!=='undefined')module.exports=api;else root.PaperEngine=api;
})(typeof window!=='undefined'?window:this);
