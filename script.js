const series={Mg:5,Zn:4,H:3,Cu:2,Ag:1};
const metals={Ag:{name:'銀板',color:'silver'},Mg:{name:'マグネシウム板',color:'magnesium'},Zn:{name:'亜鉛板',color:'zinc'},Cu:{name:'銅板',color:'copper'}};
const solutions={
  ag:{name:'硝酸銀水溶液',ion:'Ag⁺',target:'Ag',spectator:'NO₃⁻',color:['#dce8e7cc','#b9d1d0b5']},
  mg:{name:'硫酸マグネシウム水溶液',ion:'Mg²⁺',target:'Mg',spectator:'SO₄²⁻',color:['#dce8e7cc','#b9d1d0b5']},
  zn:{name:'硫酸亜鉛水溶液',ion:'Zn²⁺',target:'Zn',spectator:'SO₄²⁻',color:['#dce8e7cc','#b9d1d0b5']},
  cu:{name:'硫酸銅水溶液',ion:'Cu²⁺',target:'Cu',spectator:'SO₄²⁻',color:['#8fd7dbcc','#46aeb9b5']},
  hcl:{name:'塩酸',ion:'H⁺',target:'H',spectator:'Cl⁻',color:['#d4e6e3cc','#9fcac5b5']}
};
let selectedSolution='cu',selectedMetal='Zn',timers=[],relations=new Set(),experimentLog=new Map(),answerOrder=[],pendingExperiment=null,activeRun=null;
const $=s=>document.querySelector(s);
const substances=['Mg','Zn','H','Cu','Ag'];
function relationClosure(){const reach=Object.fromEntries(substances.map(a=>[a,Object.fromEntries(substances.map(b=>[b,false]))]));relations.forEach(r=>{const [a,b]=r.split('>');reach[a][b]=true;});substances.forEach(k=>substances.forEach(i=>substances.forEach(j=>{if(reach[i][k]&&reach[k][j])reach[i][j]=true;})));return reach;}
function updateInquiry(){
  const reach=relationClosure();let known=0;for(let i=0;i<substances.length;i++)for(let j=i+1;j<substances.length;j++)if(reach[substances[i]][substances[j]]||reach[substances[j]][substances[i]])known++;
  $('#evidenceBar').style.width=`${known*10}%`;$('#evidenceText').textContent=`大小関係 ${known} / 10`;
  $('#records').innerHTML=experimentLog.size?[...experimentLog.values()].map(x=>`<p><b>${x.pair}</b><br>${x.result}　→　${x.relation}</p>`).join(''):'<p>まだ実験結果がありません。</p>';
  $('#answerSlots').textContent=Array.from({length:5},(_,i)=>answerOrder[i]||'？').join(' ＞ ');
  $('#answerChoices').innerHTML=substances.map(x=>`<button data-answer="${x}" ${answerOrder.includes(x)?'disabled':''}>${x}</button>`).join('');
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(answerOrder.length<5){answerOrder.push(b.dataset.answer);updateInquiry();}});
  return known;
}
function recordExperiment(s,r){const key=`${selectedMetal}-${s.target}`;if(experimentLog.has(key))return;let relation;if(selectedMetal===s.target)relation='同じ物質なので大小は決められない';else{const greater=r.react?selectedMetal:s.target,less=r.react?s.target:selectedMetal;relations.add(`${greater}>${less}`);relation=`${greater} ＞ ${less}`;}experimentLog.set(key,{pair:`${metals[selectedMetal].name} × ${s.name}`,result:r.react?'反応した':'反応しなかった',relation});const known=updateInquiry();if(known===10)$('#answerMessage').textContent='必要な大小関係がそろいました。5つを順番に選んで答えましょう。';}
function askComparison(s,r){
  pendingExperiment={s,r,metal:selectedMetal};const quiz=$('#comparisonQuiz');quiz.className='comparison-quiz';
  $('#comparisonQuestion').textContent=`${selectedMetal} と ${s.target} のイオン化傾向は？`;
  $('#comparisonChoices').innerHTML=`<button data-compare="greater">${selectedMetal} ＞ ${s.target}</button><button data-compare="less">${selectedMetal} ＜ ${s.target}</button><button data-compare="equal">${selectedMetal} ＝ ${s.target}</button>`;
  $('#comparisonFeedback').textContent='実験で起きた変化を根拠に選びましょう。';
  document.querySelectorAll('[data-compare]').forEach(button=>button.onclick=()=>checkComparison(button.dataset.compare));
  setTimeout(()=>quiz.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}
function checkComparison(choice){if(!pendingExperiment)return;const {s,r,metal}=pendingExperiment;const correct=metal===s.target?'equal':r.react?'greater':'less';const quiz=$('#comparisonQuiz');if(choice!==correct){quiz.className='comparison-quiz wrong';$('#comparisonFeedback').textContent='もう一度考えよう。金属板からイオンが出たかを確認してください。';return;}selectedMetal=metal;quiz.className='comparison-quiz correct';$('#comparisonFeedback').textContent='正解。この結果を実験ノートに記録しました。';document.querySelectorAll('[data-compare]').forEach(b=>b.disabled=true);recordExperiment(s,r);pendingExperiment=null;}
function equationFor(m,s){
  if(series[m]<=series[s.target])return {react:false,equation:'反応しない',detail:`${metals[m].name.replace('板','')}は${s.ion}よりイオンになりにくい`};
  if(s.target==='H')return {react:true,equation:`${m} + 2HCl → ${m}Cl₂ + H₂`,detail:`${m}が${m}²⁺になり、水素が発生する`};
  if(s.target==='Ag')return {react:true,equation:`${m} + 2AgNO₃ → ${m}(NO₃)₂ + 2Ag`,detail:`${m}がイオンになり、Agが析出する`};
  return {react:true,equation:`${m} + ${s.target}SO₄ → ${m}SO₄ + ${s.target}`,detail:`${m}がイオンになり、${s.target}が析出する`};
}
function buildChoices(){
  $('#solutionChoices').innerHTML=Object.entries(solutions).map(([k,v])=>`<button class="choice ${k===selectedSolution?'selected':''}" data-solution="${k}">${v.name}</button>`).join('');
  $('#metalChoices').innerHTML=Object.entries(metals).map(([k,v])=>`<button class="choice ${k===selectedMetal?'selected':''}" data-metal="${k}">${k}<br><small>${v.name}</small></button>`).join('');
  document.querySelectorAll('[data-solution]').forEach(b=>b.onclick=()=>{selectedSolution=b.dataset.solution;resetView();});
  document.querySelectorAll('[data-metal]').forEach(b=>b.onclick=()=>{selectedMetal=b.dataset.metal;resetView();});
}
function makeParticles(){const gasLayer=$('#gasLayer');if(gasLayer)gasLayer.remove();const s=solutions[selectedSolution],remaining=activeRun?activeRun.remaining:4,produced=activeRun?activeRun.cycles:0;const cp=[[18,46],[48,78],[80,60],[70,84]],ap=[[32,62],[64,47],[24,82],[84,76]],pp=[[52,55],[40,84],[76,70],[58,86]];let html=cp.slice(0,remaining).map((p,i)=>`<span class="particle ${s.target==='H'?'acid':'cation'}" style="left:${p[0]}%;top:${p[1]}%;--t:${4+i%3}s">${s.ion}</span>`).join('');html+=ap.map((p,i)=>`<span class="particle spectator" style="left:${p[0]}%;top:${p[1]}%;--t:${5+i%3}s">${s.spectator}</span>`).join('');html+=pp.slice(0,produced).map((p,i)=>`<span class="particle product-ion" style="left:${p[0]}%;top:${p[1]}%;--t:${5+i%2}s">${selectedMetal}²⁺</span>`).join('');$('#particles').innerHTML=html;$('#legend').innerHTML=`<span>残っている${s.ion}：${remaining}個</span><span>生じた${selectedMetal}²⁺：${produced}個</span>`;updateLiquidColor();}
// Keep the existing solution particles and their animation progress intact.
// Each generated ion moves smoothly toward a separate region of the liquid.
function productIonMotion(width,height,radius,index,time){
  // Extra clearance also keeps particles away from the rounded bottom corners.
  const margin=radius+20;
  const left=Math.min(margin,width/2),right=Math.max(left,width-margin);
  const top=Math.min(height*.15+radius+10,height/2+height*.15);
  const bottom=Math.max(top,height-margin);
  const slots=[[.12,.18],[.88,.18],[.12,.82],[.88,.82]];
  const [u,v]=slots[index%slots.length];
  const amplitude=Math.min(6,(right-left)*.04,(bottom-top)*.04);
  return {left,right,top,bottom,
    x:left+(right-left)*u+Math.sin(time*.65+index*1.7)*amplitude,
    y:top+(bottom-top)*v+Math.sin(time*.51+index*2.1)*amplitude};
}
function disperseProductIon(ion,container,x,y,index){
  let last=null,elapsed=0;
  function move(now){
    if(!ion.isConnected)return;
    const dt=last===null?0:Math.min((now-last)/1000,.05);
    last=now;elapsed+=dt;
    const bounds=container.getBoundingClientRect();
    const radius=Math.max(ion.offsetWidth,ion.offsetHeight)/2;
    const target=productIonMotion(bounds.width,bounds.height,radius,index,elapsed);
    const blend=1-Math.exp(-dt*1.5);
    x=Math.min(target.right,Math.max(target.left,x+(target.x-x)*blend));
    y=Math.min(target.bottom,Math.max(target.top,y+(target.y-y)*blend));
    ion.style.left=`${x}px`;
    ion.style.top=`${y}px`;
    requestAnimationFrame(move);
  }
  move(performance.now());
}
function finishParticleTransfer(){
  const s=solutions[selectedSolution];
  const ion=$('#products .sequence-ion');
  if(ion){
    const rect=ion.getBoundingClientRect();
    const container=$('#particles');
    const bounds=container.getBoundingClientRect();
    ion.className='particle product-ion';
    ion.style.animation='none';
    container.appendChild(ion);
    disperseProductIon(ion,container,rect.left+rect.width/2-bounds.left,rect.top+rect.height/2-bounds.top,activeRun.cycles-1);
  }
  $('#legend').innerHTML=`<span>残っている${s.ion}：${activeRun.remaining}個</span><span>生じた${selectedMetal}²⁺：${activeRun.cycles}個</span>`;
  updateLiquidColor();
}
function updateLiquidColor(){const s=solutions[selectedSolution],liquid=$('#liquid');let blue=0;if(!activeRun)blue=s.target==='Cu'?1:0;else if(s.target==='Cu')blue=activeRun.remaining/4;else if(s.target==='Ag'&&selectedMetal==='Cu')blue=activeRun.cycles/2;const colorless=[190,218,214],copperBlue=[67,169,181],mix=colorless.map((v,i)=>Math.round(v+(copperBlue[i]-v)*blue));liquid.style.background='';liquid.style.backgroundColor=`rgba(${mix.join(',')},.78)`;}
function depositMarkup(newFrom=Infinity){if(!activeRun||activeRun.target==='H')return '';const spots=[[28,54],[41,54],[28,72],[41,72],[28,88],[41,88]];return Array.from({length:activeRun.deposited},(_,i)=>{const [x,y]=spots[i%spots.length];return `<span class="formed-atom static-deposit${i>=newFrom?' new-deposit':''}" style="left:${x}%;top:${y}%">${activeRun.target}</span>`;}).join('');}
function releaseHydrogen(){
  const stage=$('#stage');
  let layer=$('#gasLayer');
  if(!layer){
    layer=document.createElement('div');
    layer.id='gasLayer';
    stage.appendChild(layer);
  }
  const receivers=[...document.querySelectorAll('#products .receiving-ion')];
  if(!receivers.length)return;
  const bounds=layer.getBoundingClientRect();
  const centers=receivers.map(ion=>{const r=ion.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  const x=centers.reduce((sum,p)=>sum+p.x,0)/centers.length-bounds.left;
  const y=centers.reduce((sum,p)=>sum+p.y,0)/centers.length-bounds.top;
  const bubble=document.createElement('span');
  bubble.className='hydrogen-bubble escaping-hydrogen';
  bubble.textContent='H₂';
  bubble.style.left=`${x}px`;
  bubble.style.top=`${y}px`;
  bubble.addEventListener('animationend',()=>bubble.remove(),{once:true});
  layer.appendChild(bubble);
}
function receiverMarkup(s,cost){
  const spots=[[28,54],[41,54],[28,72],[41,72],[28,88],[41,88]];
  const start=s.target==='H'?activeRun.cycles*2:activeRun.deposited;
  const bounds=$('#products').getBoundingClientRect();
  // Transfer existing solution particles instead of showing a second copy.
  const ions=[...document.querySelectorAll('#particles .cation, #particles .acid')].slice(-cost);
  return ions.map((ion,i)=>{
    const rect=ion.getBoundingClientRect();
    const sx=(rect.left+rect.width/2-bounds.left)/bounds.width*100;
    const sy=(rect.top+rect.height/2-bounds.top)/bounds.height*100;
    const [x,y]=spots[(start+i)%spots.length];
    ion.remove();
    return `<span class="receiving-ion receiver-${i?'two':'one'}${s.target==='H'?' acid-receiver':''}" style="left:${sx}%;top:${sy}%;--start-x:${sx}%;--start-y:${sy}%;--end-x:${x}%;--end-y:${y}%"><i class="ion-face">${s.ion}</i><i class="atom-face">${s.target}</i></span>`;
  }).join('');
}
function paintPlate(){const p=$('#metalPlate');const colors={Ag:'linear-gradient(100deg,#aeb6b8,#fafafa 45%,#929a9d)',Mg:'linear-gradient(100deg,#a5adb0,#eef1ef 45%,#858e91)',Zn:'linear-gradient(100deg,#8b9699,#e2e5e2 45%,#778184)',Cu:'linear-gradient(100deg,#a9512d,#e69a6d 45%,#8f4325)'};p.style.background=colors[selectedMetal];$('#metalSymbol').textContent=selectedMetal;$('#metalName').textContent=metals[selectedMetal].name;}
function resetView(){timers.forEach(clearTimeout);timers=[];activeRun=null;pendingExperiment=null;$('#comparisonQuiz').className='comparison-quiz hidden';buildChoices();paintPlate();makeParticles();$('#products').innerHTML='';$('#products').className='';$('#metalTool').className='metal-tool';$('#metalTool').style.left='';$('#metalTool').style.top='';$('#resultBadge').className='result-badge hidden';const s=solutions[selectedSolution];$('#solutionName').textContent=s.name;$('#equation').innerHTML='<small>化学反応式</small><b>実験後に表示されます</b><span>まず、反応が起こるか予想しましょう</span>';$('#message').textContent='「水溶液に入れる」ボタンを押して観察しましょう。';$('#explanation').textContent=`${metals[selectedMetal].name}と${s.name}の組み合わせです。反応するか予想してから実験しましょう。`;updateInquiry();}
function showEquation(title,equation,detail){$('#equation').innerHTML=`<small>${title}</small><b>${equation}</b><span>${detail}</span>`;}
function start(){
  timers.forEach(clearTimeout);timers=[];
  const s=solutions[selectedSolution],r=equationFor(selectedMetal,s),badge=$('#resultBadge');
  activeRun={remaining:4,cycles:0,deposited:0,target:s.target};pendingExperiment=null;makeParticles();
  $('#products').innerHTML='';$('#products').className='';badge.className='result-badge hidden';
  $('#metalTool').style.left='';$('#metalTool').style.top='';
  $('#metalTool').className='metal-tool auto-moving';timers.push(setTimeout(()=>{$('#metalTool').className='metal-tool placed';},1450));
  $('#message').textContent=`${metals[selectedMetal].name}を水溶液に入れます。`;
  showEquation('金属板を入れる','反応するだろうか？','結果から大小関係を考えよう');
  timers.push(setTimeout(()=>{
    badge.classList.remove('hidden');
    if(!r.react){badge.classList.add('no');badge.textContent='変化なし';showEquation('観察結果','変化なし','電子の受け渡しは起こらなかった');$('#message').textContent='金属板にも水溶液にも、目立った変化はありません。';$('#explanation').textContent='この「反応しなかった」という結果から、2つのイオン化傾向を比べてください。';askComparison(s,r);return;}
    runReactionCycle(s,r,badge);
  },1850));
}
function runReactionCycle(s,r,badge){
  const cost=(s.target==='Ag'||s.target==='H')?2:1;
  if(activeRun.remaining<cost){$('#products').innerHTML=depositMarkup();badge.textContent='反応できるイオンがなくなった';showEquation('反応全体',r.equation,r.detail);$('#message').textContent=`${s.ion}がなくなったため、反応が止まりました。`;$('#explanation').textContent='すべての変化を根拠に、2つのイオン化傾向を比べてください。';askComparison(s,r);return;}
  const cycleNumber=activeRun.cycles+1;badge.textContent=`反応 ${cycleNumber}回目：電子を出す`;
  showEquation('金属板：電子を出す',`${selectedMetal} → ${selectedMetal}²⁺ + 2e⁻`,'金属原子1個から電子が2個出る');
  $('#message').textContent=`${selectedMetal}原子が${selectedMetal}²⁺になり、電子を2個出しました。`;
  $('#products').className='';$('#products').innerHTML=depositMarkup()+`<span class="sequence-ion">${selectedMetal}²⁺</span><span class="sequence-electron e1">e⁻</span><span class="sequence-electron e2">e⁻</span><span class="sequence-caption">${cycleNumber}回目：電子を2個出す</span>`;
  timers.push(setTimeout(()=>{badge.textContent=`反応 ${cycleNumber}回目：電子を受け取る`;const reduction=s.target==='Ag'?'2Ag⁺ + 2e⁻ → 2Ag':s.target==='H'?'2H⁺ + 2e⁻ → H₂':`${s.target}²⁺ + 2e⁻ → ${s.target}`;showEquation('水溶液中の陽イオン：電子を受け取る',reduction,`${s.ion}が電子を受け取る`);$('#message').textContent=cost===2?`2個の${s.ion}が電子を1個ずつ受け取ります。`:`${s.ion}が電子を2個受け取ります。`;$('#products').classList.add('transfer');$('#products').querySelectorAll('.sequence-caption').forEach(el=>el.remove());const receivers=receiverMarkup(s,cost);$('#products').insertAdjacentHTML('beforeend',receivers+`<span class="sequence-caption">電子を受け取り、${s.ion}から${s.target}へ変化</span>`);},1250));
  timers.push(setTimeout(()=>{activeRun.remaining-=cost;activeRun.cycles++;activeRun.deposited+=s.target==='Ag'?2:s.target==='H'?0:1;finishParticleTransfer();if(s.target==='H')releaseHydrogen();badge.textContent=s.target==='H'?`反応 ${cycleNumber}回目：H₂発生`:`反応 ${cycleNumber}回目：${s.target}析出`;$('#products').className='';if(s.target==='H')$('#products').innerHTML='<span class="sequence-caption">H原子2個が結び付き、H₂が1個発生</span>';else $('#products').innerHTML=depositMarkup()+`<span class="sequence-caption">${s.target}が析出　${s.ion}は残り${activeRun.remaining}個</span>`;$('#message').textContent=s.target==='H'?`2個のH原子が結び付き、H₂が1個発生しました。H⁺は残り${activeRun.remaining}個です。`:`${s.target}が析出しました。${s.ion}は残り${activeRun.remaining}個です。`;},3100));
  timers.push(setTimeout(()=>runReactionCycle(s,r,badge),4250));
}
function clearAnswer(){answerOrder=[];$('#answerMessage').textContent='';updateInquiry();}
function checkAnswer(){const known=updateInquiry();if(known<10){$('#answerMessage').textContent='まだ大小関係を確定できません。別の組み合わせも実験しましょう。';return;}if(answerOrder.length<5){$('#answerMessage').textContent='5つすべてを順番に選びましょう。';return;}$('#answerMessage').textContent=answerOrder.join('>')==='Mg>Zn>H>Cu>Ag'?'正解！ 実験結果からイオン化傾向を確定できました。':'実験記録と「反応した／しなかった」をもう一度比べてみよう。';}
function resetAll(){relations=new Set();experimentLog=new Map();answerOrder=[];$('#answerMessage').textContent='';resetView();}
$('#startButton').onclick=start;$('#resetButton').onclick=resetAll;$('#checkAnswer').onclick=checkAnswer;$('#clearAnswer').onclick=clearAnswer;resetAll();
