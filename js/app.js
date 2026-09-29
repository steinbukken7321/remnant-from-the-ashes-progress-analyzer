const D = window.DATA, ZONAS = ['Ward13','Earth','Rhom','Corsus','Yaesha','Reisum'];
const NOME_Z = {Earth:'Terra',Ward13:'Ward 13',Rhom:'Rhom',Corsus:'Corsus',Yaesha:'Yaesha',Reisum:'Reisum'};
const TIPO_PT = {'World Boss':'Chefe de mundo','Miniboss':'Miniboss','Side Dungeon':'Masmorra','Siege':'Cerco','Item Drop':'Drop de item','Point of Interest':'Ponto de interesse','Loot Beetle':'Besouro do loot','Home':'Base'};
const CH_PROFILE = '/Game/Characters/Player/Base/Character_Master_Player.Character_Master_Player_C';
const $ = id => document.getElementById(id), sp = s => s.replace(/([a-z])([A-Z])/g,'$1 $2');
let profileTxt = null, saveTxt = null, saveNum = null, chars = [], estado = {};

// ---------- nomes/tipos de item (igual ao World Analyzer) ----------
function itemInfo(k){
  let n = k.slice(k.lastIndexOf('/')+1), t = 'Outro';
  if(k.includes('/Weapons/')) t = 'Arma';
  if(k.includes('/Armor/')||k.includes('TwistedMask')){ t='Armadura'; if(k.includes('TwistedMask')) n='TwistedMask (Head)'; else {const p=n.split('_'); n=(p[2]||n)+' ('+(p[1]||'')+')';} }
  else n = sp(n.replace(/(Weapon|Root|Wasteland|Swamp|Pan|Atoll|Mod|Trinket|Trait|Quest|Emote|Rural|Snow)_/g,''));
  if(k.includes('/Trinkets/')||k.includes('BrabusPocketWatch')) t='Anel/Amuleto';
  if(k.includes('/Mods/')) t='Mod'; if(k.includes('/Traits/')) t='Traço'; if(k.includes('/Emotes/')) t='Emote';
  return {n,t};
}
// ---------- leitura do profile (inventário) ----------
function personagens(txt){
  const partes = txt.split(CH_PROFILE).filter(x=>x!==''), out = [];
  const rx = [/\/Items\/Weapons(\/[a-zA-Z0-9_]+)+\/[a-zA-Z0-9_]+/g,/\/Items\/Armor\/([a-zA-Z0-9_]+\/)?[a-zA-Z0-9_]+/g,/\/Items\/Trinkets\/(BandsOfCastorAndPollux\/)?[a-zA-Z0-9_]+/g,/\/Items\/Mods\/[a-zA-Z0-9_]+/g,/\/Items\/Traits\/[a-zA-Z0-9_]+/g,/\/Items\/QuestItems(\/[a-zA-Z0-9_]+)+\/[a-zA-Z0-9_]+/g,/\/Quests\/[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,/\/Player\/Emotes\/Emote_[a-zA-Z0-9]+/g];
  for(let i=1;i<partes.length;i++){
    const m = partes[i-1].match(/\/Game\/_Core\/Archetypes\/([a-zA-Z_]+)/);
    const inv = partes[i].substring(0, partes[i].indexOf('Character_Master_Player_C'));
    let itens = []; rx.forEach(r => { const x = inv.match(r); if(x) itens = itens.concat(x); });
    out.push({arq: m ? m[1].split('_')[1] : 'Sem arquétipo', inv: new Set(itens)});
  }
  return out;
}
// ---------- leitura do save (mundo sorteado) ----------
function zonaDe(l){ if(/World_City|Quest_Church|World_Rural/.test(l)) return 'Earth'; if(l.includes('World_Wasteland')) return 'Rhom'; if(l.includes('World_Jungle')) return 'Yaesha'; if(l.includes('World_Swamp')) return 'Corsus'; if(l.includes('World_Snow')||l.includes('Campaign_Clementine')) return 'Reisum'; return null; }
function tipoDe(l){
  if(l.includes('SmallD')) return 'Side Dungeon'; if(l.includes('Quest_Boss')) return 'World Boss';
  if(l.includes('Siege')||l.includes('Quest_Church')) return 'Siege'; if(l.includes('Mini')) return 'Miniboss';
  if(l.includes('Quest_Event')) return l.includes('Nexus') ? 'Siege' : l.includes('Sketterling') ? 'Loot Beetle' : 'Item Drop';
  if(/OverworldPOI|OverWorldPOI|OverworlPOI/.test(l)) return 'Point of Interest'; return null;
}
function processaEventos(texto, modo){
  const lista = [], vistos = new Set(); let ult = null, principal = 'Fairview', sub = null;
  const add = (key, zona, tipo, loc) => lista.push({key, zona, tipo, loc, nome: sp(D.events[key]||key)});
  (texto.match(/(?:\/[a-zA-Z0-9_]+){3}\/(([a-zA-Z0-9]+_[a-zA-Z0-9]+_[a-zA-Z0-9_]+)|Quest_Church)/g)||[]).forEach(l => {
    const ultimo = ult; let nomeEv = null; ult = null;
    if(sub==="TheRavager'sHaunt"||sub==='TheTempestCourt') sub = null;
    const zona = zonaDe(l), tipo = tipoDe(l), p = l.split('/')[4].split('_');
    if(l.includes('Overworld_Zone')||l.includes('_Overworld_')){ principal = D.main[p[1]+' '+p[2]+' '+p[3]] || null; return; }
    if(l.includes('Quest_Church')){ principal='Chapel Station'; nomeEv='RootMother'; sub='ChurchOfTheHarbinger'; }
    else if(tipo){
      nomeEv = p[2];
      if(l.includes('OverworldPOI')) sub = null; else if(!l.includes('Quest_Event')) sub = D.sub[nomeEv]||null;
      if(principal==='Chapel Station'){ if(l.includes('Quest_Boss')) principal='Westcourt'; else sub = null; }
    }
    if(modo==='adv') principal = null;
    ult = nomeEv;
    if(nomeEv!==ultimo && zona && tipo && nomeEv){
      const id = zona+'|'+tipo+'|'+nomeEv; if(vistos.has(id)) return; vistos.add(id);
      const loc = [NOME_Z[zona], principal&&sp(principal), sub&&sp(sub)].filter(Boolean).join(' › ');
      add(nomeEv, zona, tipo, loc);
      if(nomeEv==='Cryptolith'&&zona==='Rhom') add('SoulLink','Rhom','Item Drop',NOME_Z[zona]);
      else if(nomeEv==='BrainBug') add('Sketterling',zona,'Loot Beetle',loc);
      else if(nomeEv==='BarnSiege') add('WardPrime','Earth','Quest Event','Terra › Ward Prime');
    }
  });
  if(modo==='camp'){
    add('Ward13','Ward13','Home','Ward 13'); add('FoundersHideout','Earth','Point of Interest','Terra › Fairview');
    add('UndyingKing','Rhom','World Boss','Rhom › Undying Throne'); add('IskalQueen','Corsus','Point of Interest','Corsus › The Mist Fen');
    add('SlaveRevolt','Yaesha','Siege','Yaesha › Shrine of the Immortals'); add('Ward17','Ward13','World Boss','Ward 13 › Ward 17 (The Dreamer)');
  }
  return lista;
}
function mundoDoSave(t){
  const r = {camp:[], adv:[]}; let ini, fim;
  let f = '/Game/Campaign_Main/Quest_Campaign_Main.Quest_Campaign_Main_C', s = '/Game/Campaign_Main/Quest_Campaign_City.Quest_Campaign_City';
  if(t.indexOf(s)!==-1 && t.indexOf(f)!==-1){ let c = t.substring(0,t.indexOf(f)); c = c.substring(c.lastIndexOf(s)); r.camp = processaEventos(c,'camp'); }
  else { f='/Game/Campaign_Clementine/Quest_Campaign_Clementine.Quest_Campaign_Clementine_C'; s='/Game/World_Rural/Templates/Template_Rural_Overworld_0';
    if(t.indexOf(s)!==-1 && t.indexOf(f)!==-1){ let c = t.substring(0,t.indexOf(f)); c = c.substring(c.lastIndexOf(s)); r.camp = processaEventos(c,'camp'); r.camp.push({key:'Ward17Root',zona:'Ward13',tipo:'World Boss',loc:'Ward 13 › Ward 17 (Root Dimension)',nome:'Harsgaard'}); } }
  if(t.includes('Quest_AdventureMode_')){
    const z = ['City','Wasteland','Swamp','Jungle','Snow'].filter(x=>t.includes('Quest_AdventureMode_'+x+'_C')).pop();
    if(z){ const fimS = `/Game/World_${z}/Quests/Quest_AdventureMode/Quest_AdventureMode_${z}.Quest_AdventureMode_${z}_C`, iniS = `/Game/World_${z}/Quests/Quest_AdventureMode/Quest_AdventureMode_${z}_0`;
      let a = t.substring(0, t.indexOf(fimS)+fimS.length); a = a.substring(a.lastIndexOf(iniS)+iniS.length); r.adv = processaEventos(a,'adv'); }
  }
  return r;
}
// ---------- interface ----------
const lerArq = f => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsText(f,'ISO-8859-1'); });
async function receber(files){
  const msg = [];
  for(const f of files){
    const nm = f.name.toLowerCase(), m = nm.match(/save_(\d)/);
    if(m){ saveTxt = await lerArq(f); saveNum = +m[1]; msg.push('Mundo: '+f.name); }
    else if(nm.includes('profile')){ profileTxt = await lerArq(f); chars = personagens(profileTxt); msg.push('Inventário: '+f.name+' ('+chars.length+' personagem(ns))'); }
    else msg.push('<span class="e">Ignorado: '+f.name+' (esperado profile.* ou save_N.*)</span>');
  }
  if(!profileTxt) msg.push('Falta o <b>profile.sav</b> (inventário).'); if(!saveTxt) msg.push('Falta o <b>save_N.sav</b> (mundo).');
  $('status').innerHTML = msg.join('<br>');
  if(profileTxt && saveTxt) iniciar();
}
function iniciar(){
  estado.mundo = mundoDoSave(saveTxt);
  $('selChar').innerHTML = chars.map((c,i)=>`<option value="${i}">#${i} · ${c.arq} (${c.inv.size} itens)</option>`).join('');
  if(chars[saveNum]) $('selChar').value = saveNum;
  if(!estado.mundo.camp.length && estado.mundo.adv.length) $('selModo').value = 'adv';
  if(!estado.mundo.camp.length && !estado.mundo.adv.length) $('status').innerHTML += '<br><span class="e">Nenhum evento encontrado: o mundo só é gravado depois de viajar até ele pelo cristal vermelho (ou você está no tutorial).</span>';
  estado.aba = 'resumo'; $('envio').hidden = true; $('painel').hidden = false; desenhar();
}
function calcula(ev, inv){ const itens = (D.items[ev.key]||[]).map(i => ({k:i.k, nota:i.n, m:i.m, d:i.d, ...itemInfo(i.k), tem: inv.has(i.k)})); return {...ev, itens, falta: itens.filter(i=>!i.tem).length}; }
function atual(){ const inv = chars[+$('selChar').value]?.inv || new Set(); return estado.mundo[$('selModo').value].map(e => calcula(e, inv)); }
function pct(evs){ const t = evs.reduce((s,e)=>s+e.itens.length,0), c = evs.reduce((s,e)=>s+e.itens.filter(i=>i.tem).length,0); return {t, c, p: t ? Math.round(100*c/t) : 0}; }
const CRAFT = i => (i.t==='Mod' || (i.k.includes('/Weapons/Boss/') && !/Harpoon|Riven/i.test(i.k)));
function cartao(e, so){
  if(so && !e.falta) return '';
  const inf = (window.INFO||{})[e.key] || {}, ti = (window.TIPO_INFO||{})[e.tipo] || '';
  const its = e.itens.map(i => `<div class="it ${i.tem?'ok':'no'}"><div class="itn">${i.n} <span class="tag">${i.t}</span>${i.m?`<span class="tag">${i.m}</span>`:''}${i.d?`<span class="tag">DLC ${i.d}</span>`:''}${!i.tem&&CRAFT(i)?'<span class="tag craft">⚒ craftar na McCabe</span>':''}${i.nota?`<div class="nota">${i.nota}</div>`:''}</div><span class="mk">${i.tem?'✔':'✘'}</span></div>`).join('') || '<div class="nota">Sem drop cadastrado para este evento.</div>';
  const bloco = (t, x, c) => x ? `<p class="${c||''}"><b>${t}</b> ${x}</p>` : '';
  const det = bloco('O que é:', inf.d || ti) + bloco('Como encontrar:', inf.ach) + bloco('Como lutar:', inf.luta) + bloco('⚠ Escolhas que se excluem:', inf.alt, 'alt') + bloco('⚒ Craft:', inf.craft || (e.itens.some(CRAFT) ? 'Este chefe/evento dá um material; leve-o à McCabe (Ward 13) para craftar o item.' : ''), 'cr');
  return `<details class="ev ${e.falta?'':'ok'}"><summary><h3>${e.nome}<span class="tag">${TIPO_PT[e.tipo]||e.tipo}</span></h3><div class="loc">${e.loc}</div>${its}</summary><div class="info">${det||'<p class="nota">Sem informações adicionais cadastradas ainda.</p>'}</div></details>`;
}
function desenhar(){
  const evs = atual(), so = $('soFalta').checked, tot = pct(evs);
  const abas = [['resumo','Resumo'], ...ZONAS.filter(z=>evs.some(e=>e.zona===z)).map(z=>[z,NOME_Z[z]])];
  $('abas').innerHTML = abas.map(([k,n]) => `<button class="${estado.aba===k?'on':''}" data-k="${k}">${n}</button>`).join('');
  $('abas').querySelectorAll('button').forEach(b => b.onclick = () => { estado.aba = b.dataset.k; desenhar(); });
  const ch = chars[+$('selChar').value];
  $('resumo').innerHTML = `<div class="stat"><span>Personagem</span><b>${ch?ch.arq:'-'}</b></div><div class="stat"><span>Itens no inventário</span><b>${ch?ch.inv.size:0}</b></div><div class="stat"><span>Modo</span><b>${$('selModo').value==='camp'?'Campanha':'Aventura'}</b></div>` +
    `<p class="prog">Progresso de itens do seu mundo<br><b>${tot.c}/${tot.t}</b> (${tot.p}%)</p><div class="barra"><i style="width:${tot.p}%"></i></div>`;
  $('mundos').innerHTML = ZONAS.filter(z=>evs.some(e=>e.zona===z)).map(z => { const ze = evs.filter(e=>e.zona===z), p = pct(ze); return `<div class="mw ${estado.aba===z?'on':''}" data-k="${z}"><b>${NOME_Z[z]}</b><span>${ze.length} eventos · ${p.c}/${p.t}</span><div class="barra"><i style="width:${p.p}%"></i></div></div>`; }).join('') || '<p class="nota">Nenhum mundo gerado.</p>';
  $('mundos').querySelectorAll('.mw').forEach(m => m.onclick = () => { estado.aba = m.dataset.k; desenhar(); });
  let h = '';
  if(estado.aba==='resumo'){ const f = evs.filter(e=>e.falta); h = `<h2 class="sec">O que ainda falta fazer (${f.length} eventos)</h2>` + (f.map(e=>cartao(e,false)).join('') || '<div class="card">Nada pendente nos mundos já gerados. 🎉</div>'); }
  else { const ze = evs.filter(e=>e.zona===estado.aba); h = ze.map(e=>cartao(e,so)).join('') || `<div class="card">${NOME_Z[estado.aba]} ainda não foi gerado neste save (ou não há nada a mostrar).</div>`;
}
  $('conteudo').innerHTML = h;
}
$('arq').onchange = e => receber(e.target.files);
const dz = $('drop'); ['dragover','dragenter'].forEach(x => dz.addEventListener(x, e => { e.preventDefault(); dz.classList.add('on'); }));
['dragleave','drop'].forEach(x => dz.addEventListener(x, e => { e.preventDefault(); dz.classList.remove('on'); })); dz.addEventListener('drop', e => receber(e.dataTransfer.files));
['selChar','selModo','soFalta'].forEach(i => $(i).onchange = desenhar);
$('btnTroca').onclick = () => { $('envio').hidden = false; $('painel').hidden = true; $('arq').value = ''; };
