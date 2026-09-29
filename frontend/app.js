const ASSETS = [
  {id:"subA",name:"Substation A",type:"power",lat:13.081,lon:80.292,exposure:82,vulnerability:71,dependency:94,desc:"High dependency criticality; multiple downstream facilities rely on this node."},
  {id:"subB",name:"Substation B",type:"power",lat:13.065,lon:80.305,exposure:68,vulnerability:55,dependency:76,desc:"Regional power node serving transport and community facilities."},
  {id:"bridgeA",name:"Bridge A",type:"road",lat:13.092,lon:80.277,exposure:89,vulnerability:63,dependency:81,desc:"Low-lying transport connection with high rainfall exposure."},
  {id:"roadC",name:"Road C",type:"road",lat:13.072,lon:80.276,exposure:84,vulnerability:59,dependency:72,desc:"Emergency access corridor connecting hospital and shelter zones."},
  {id:"roadD",name:"Road D",type:"road",lat:13.058,lon:80.286,exposure:73,vulnerability:48,dependency:61,desc:"Secondary transport corridor."},
  {id:"hospB",name:"Hospital B",type:"health",lat:13.077,lon:80.312,exposure:61,vulnerability:65,dependency:92,desc:"Critical healthcare facility with high continuity-of-service requirements."},
  {id:"hospC",name:"PHC C",type:"health",lat:13.053,lon:80.316,exposure:57,vulnerability:58,dependency:66,desc:"Primary health facility serving nearby communities."},
  {id:"shelterD",name:"Shelter D",type:"shelter",lat:13.098,lon:80.315,exposure:70,vulnerability:42,dependency:73,desc:"Emergency shelter with road and power dependencies."},
  {id:"shelterE",name:"Shelter E",type:"shelter",lat:13.045,lon:80.298,exposure:64,vulnerability:39,dependency:59,desc:"Secondary emergency shelter."}
];

const LINKS = [
  ["subA","hospB"],["subA","shelterD"],["subA","hospC"],["subB","roadD"],
  ["bridgeA","roadC"],["roadC","hospB"],["roadC","shelterD"],["roadD","hospC"],
  ["hospB","shelterD"],["subB","hospC"],["bridgeA","shelterD"],["subA","roadC"]
];

const typeLabel={power:"POWER",road:"ROAD / BRIDGE",health:"HEALTHCARE",shelter:"SHELTER"};
const typeColor={power:"#ffb454",road:"#ff6377",health:"#42d8ff",shelter:"#36e0a1"};
let selected = ASSETS[0], failed = new Set(), map, markers = {}, cycloneLine, hazardCircle;

function risk(a){ return Math.round((a.exposure*a.vulnerability*a.dependency)/10000); }
function asset(id){return ASSETS.find(a=>a.id===id)}
function dependents(start){
  const visited=new Set([start]), q=[start];
  while(q.length){
    const cur=q.shift();
    LINKS.filter(x=>x[0]===cur).forEach(x=>{
      if(!visited.has(x[1])){visited.add(x[1]);q.push(x[1])}
    });
  }
  visited.delete(start);
  return [...visited].map(asset).filter(Boolean);
}

function showToast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2800);
}

function selectAsset(a){
  selected=a;
  document.getElementById("selectedName").textContent=a.name;
  document.getElementById("selectedType").textContent=typeLabel[a.type];
  document.getElementById("selectedType").style.color=typeColor[a.type];
  document.getElementById("selectedScore").textContent=risk(a);
  document.getElementById("selectedExposure").textContent=a.exposure;
  document.getElementById("selectedVulnerability").textContent=a.vulnerability;
  document.getElementById("selectedDependency").textContent=a.dependency;
  document.getElementById("selectedDescription").textContent=a.desc;
  if(map) map.flyTo([a.lat,a.lon],13.5,{duration:.5});
}

function markerIcon(a){
  return L.divIcon({className:"custom-marker",html:`<div style="width:18px;height:18px;border-radius:50%;background:${typeColor[a.type]};border:3px solid #081421;box-shadow:0 0 0 2px ${typeColor[a.type]}66"></div>`,iconSize:[18,18],iconAnchor:[9,9]});
}

function initMap(){
  map=L.map("map",{zoomControl:true}).setView([13.07,80.295],12.7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);
  ASSETS.forEach(a=>{
    const m=L.marker([a.lat,a.lon],{icon:markerIcon(a)}).addTo(map);
    m.bindPopup(`<b>${a.name}</b><br>${typeLabel[a.type]}<br>Prototype risk: <b>${risk(a)}</b><br><button onclick="window.pickAsset('${a.id}')" style="margin-top:6px">Inspect asset</button>`);
    m.on("click",()=>selectAsset(a)); markers[a.id]=m;
  });
}

window.pickAsset=id=>selectAsset(asset(id));

function drawHazard(){
  if(cycloneLine) map.removeLayer(cycloneLine);
  if(hazardCircle) map.removeLayer(hazardCircle);
  const pts=[[13.20,80.48],[13.16,80.41],[13.11,80.35],[13.07,80.30],[13.01,80.25]];
  cycloneLine=L.polyline(pts,{color:"#42d8ff",weight:4,dashArray:"8 8"}).addTo(map);
  cycloneLine.bindTooltip("SIMULATED CYCLONE TRACK",{sticky:true});
  hazardCircle=L.circle([13.075,80.30],{radius:10500,color:"#ff6377",fillColor:"#ff6377",fillOpacity:.08,weight:1,dashArray:"6 6"}).addTo(map);
}

function simulateFailure(){
  failed=new Set([selected.id,...dependents(selected.id).map(a=>a.id)]);
  renderCascade();
  renderGraph();
  updateMetrics();
  showToast(`${selected.name} failure simulated. ${failed.size-1} downstream assets affected.`);
  document.getElementById("scenarioStatus").textContent=`Failure simulated: ${selected.name} → ${failed.size-1} downstream assets in the dependency chain.`;
  openModal();
}

function renderCascade(){
  const list=document.getElementById("cascadeList");
  const deps=dependents(selected.id);
  document.getElementById("impactCount").textContent=`${deps.length} assets`;
  if(!deps.length){list.innerHTML='<div class="empty-state">No downstream dependency is defined for this node.</div>';return}
  const chain=[selected,...deps];
  list.innerHTML=chain.map((a,i)=>`
    <div class="cascade-item">
      <div class="cascade-node" style="border-color:${typeColor[a.type]}">${i===0?"!":"↓"}</div>
      <div class="cascade-content">
        <strong>${a.name}</strong>
        <small>${i===0?"SOURCE FAILURE":"Downstream impact"} · ${typeLabel[a.type]} · risk ${risk(a)}</small>
      </div>
    </div>`).join("");
}

function updateMetrics(){
  const impacted=failed.size?failed.size-1:0;
  const cascade=Math.min(99,Math.round(impacted*9+failed.size*4));
  document.getElementById("cascadeMetric").textContent=failed.size?cascade:"—";
  document.getElementById("cascadeLabel").textContent=failed.size?"impact index":"run scenario";
  document.getElementById("cascadeMeter").style.width=(failed.size?cascade:0)+"%";
}

function renderGraph(){
  const el=document.getElementById("graphCanvas");
  const w=el.clientWidth||1000,h=590;
  const positions={subA:[130,110],subB:[130,330],bridgeA:[350,90],roadC:[350,260],roadD:[350,460],hospB:[590,150],hospC:[590,390],shelterD:[820,150],shelterE:[820,390]};
  let svg=`<svg class="graph-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
  LINKS.forEach(([a,b])=>{
    const p=positions[a],q=positions[b]; if(!p||!q)return;
    const bad=failed.has(a)||failed.has(b);
    svg+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="graph-link ${bad?"failed":""}"/>`;
  });
  Object.entries(positions).forEach(([id,p])=>{
    const a=asset(id),bad=failed.has(id);
    svg+=`<g class="graph-node" onclick="window.pickAsset('${id}')">
      <circle cx="${p[0]}" cy="${p[1]}" r="${bad?27:23}" fill="${bad?"#5a1826":typeColor[a.type]}" opacity="${bad?.95:.88}"/>
      <circle cx="${p[0]}" cy="${p[1]}" r="12" fill="#07111f"/>
      <text x="${p[0]}" y="${p[1]+4}">${a.name.split(" ")[0].slice(0,3).toUpperCase()}</text>
      <text x="${p[0]}" y="${p[1]+43}" style="font-size:10px;fill:#8ea3b8">${a.name}</text>
    </g>`;
  });
  svg+=`</svg>`; el.innerHTML=svg;
}

function populatePriority(){
  const ranked=[...ASSETS].sort((a,b)=>{
    const scoreA=risk(a)+a.dependency*.35,scoreB=risk(b)+b.dependency*.35;
    return scoreB-scoreA;
  });
  document.getElementById("priorityTable").innerHTML=ranked.slice(0,7).map((a,i)=>{
    const r=risk(a);
    const action=a.type==="power"?"Inspect / protect power continuity":a.type==="road"?"Inspect / clear emergency corridor":a.type==="health"?"Protect backup power & access":"Verify accessibility & supplies";
    return `<tr>
      <td><span class="priority-pill">P${i+1}</span></td>
      <td><b>${a.name}</b></td>
      <td>${typeLabel[a.type]}</td>
      <td>${a.exposure}</td><td>${a.dependency}</td>
      <td class="${r>=60?"risk-high":"risk-med"}"><b>${r}</b></td>
      <td>${action}</td>
    </tr>`;
  }).join("");
}

function openModal(){
  const deps=dependents(selected.id);
  document.getElementById("modalTitle").textContent=`${selected.name} Failure Analysis`;
  document.getElementById("modalText").textContent=`The prototype dependency graph identifies ${deps.length} downstream assets connected to ${selected.name}. These are simulation results for demonstration and should be validated before operational use.`;
  document.getElementById("modalStats").innerHTML=`
    <div class="modal-stat"><small>DIRECT FAILURE</small><b>1</b></div>
    <div class="modal-stat"><small>DOWNSTREAM</small><b>${deps.length}</b></div>
    <div class="modal-stat"><small>RISK</small><b>${risk(selected)}</b></div>`;
  document.getElementById("modal").classList.remove("hidden");
}

function runScenario(){
  drawHazard();
  document.getElementById("hazardMetric").textContent="78";
  document.getElementById("hazardMeter").style.width="78%";
  document.getElementById("scenarioStatus").textContent="Cyclone scenario active. Hazard layer and simulated track displayed.";
  showToast("Cyclone scenario activated.");
}

function reset(){
  failed.clear(); selected=ASSETS[0]; selectAsset(selected); renderCascade(); renderGraph(); updateMetrics();
  document.getElementById("hazardMetric").textContent="68";document.getElementById("hazardMeter").style.width="68%";
  document.getElementById("scenarioStatus").textContent="Scenario ready. Select an asset to inspect its dependencies.";
  if(cycloneLine)map.removeLayer(cycloneLine); if(hazardCircle)map.removeLayer(hazardCircle);
}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");document.getElementById(btn.dataset.tab).classList.add("active");
  if(btn.dataset.tab==="network"){setTimeout(renderGraph,80)}
}));

document.getElementById("runScenario").onclick=runScenario;
document.getElementById("resetScenario").onclick=reset;
document.getElementById("simulateBtn").onclick=simulateFailure;
document.getElementById("graphReset").onclick=()=>{failed.clear();renderGraph();renderCascade();updateMetrics();showToast("Failure state cleared.")};
document.getElementById("refreshPriority").onclick=()=>{populatePriority();showToast("Priority analysis refreshed.")};
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")e.currentTarget.classList.add("hidden")};
document.getElementById("modalContinue").onclick=()=>{
  document.getElementById("modal").classList.add("hidden");
  document.querySelector('[data-tab="priority"]').click();
};

window.addEventListener("resize",()=>{if(document.getElementById("network").classList.contains("active"))renderGraph()});
initMap(); populatePriority(); selectAsset(ASSETS[0]); renderCascade(); renderGraph(); updateMetrics();
