/* Shared journey state. Classic script: integrates with the existing invitation. */
window.Journey = (() => {
  const J = { active:'mall', zones:{}, ready:false, route:[], state:null, cooldown:0,
    viewMode:'tpp',viewUnlocked:false,viewTutorial:false,fpYaw:Math.PI,fpPitch:-.07 };
  Object.defineProperty(J, 'locked', { get:() => !!J.state });
  const el = id => document.getElementById(id);
  const enabled = item => item.enabled !== false && (typeof item.enabled !== 'function' || item.enabled());
  J.enabled = enabled;
  const contains = (p,a) => p.x >= a.x0 && p.x <= a.x1 && p.z >= a.z0 && p.z <= a.z1;
  const zone = () => J.zones[J.active];
  J.isOutdoor = p => J.active==='ballroom' && (p.z < -14.25 || (p.x > 23.2 && p.z < -12));
  const validFloor = (p,z=zone()) => z.walkAreas.some(a => contains(p,a));
  function blocked(p,z=zone(),r=.44) {
    return z.boxes.some(b => enabled(b) && Math.abs(p.x-b.x)<b.hw+r && Math.abs(p.z-b.z)<b.hd+r) ||
      z.circles.some(c => enabled(c) && Math.hypot(p.x-c.x,p.z-c.z)<c.r+r);
  }
  function project(p,z=zone()) {
    if (validFloor(p,z)) return {x:p.x,z:p.z};
    let nearest=null, distance=Infinity;
    for (const a of z.walkAreas) {
      const q={x:clamp(p.x,a.x0+.03,a.x1-.03),z:clamp(p.z,a.z0+.03,a.z1-.03)};
      const d=Math.hypot(q.x-p.x,q.z-p.z);
      if (d<distance) {distance=d; nearest=q;}
    }
    return nearest || z.spawn;
  }
  J.floorAt = p => {
    const areas=zone()?.walkAreas.filter(a => contains(p,a)) || [];
    return areas.length ? Math.max(...areas.map(a=>a.y||0)) : 0;
  };
  J.constrain = p => {if (!zone()) return; const q=project(p); p.x=q.x; p.z=q.z; p.y=J.floorAt(p);};
  function segmentBox(a,b,box,r) {
    let low=0,high=1;
    for (const [axis,half] of [['x',box.hw+r],['z',box.hd+r]]) {
      const d=b[axis]-a[axis], min=box[axis]-half, max=box[axis]+half;
      if (Math.abs(d)<1e-8) {if (a[axis]<min || a[axis]>max) return false;}
      else {let t0=(min-a[axis])/d,t1=(max-a[axis])/d;if(t0>t1)[t0,t1]=[t1,t0];low=Math.max(low,t0);high=Math.min(high,t1);if(low>high)return false;}
    }
    return high>=0 && low<=1;
  }
  J.lineClear = (a,b) => {
    const z=zone(), dx=b.x-a.x,dz=b.z-a.z, length=Math.hypot(dx,dz);
    // Automatic doors are traversable in the route graph; physical collision stays
    // enabled until their leaves have actually opened near the approaching guest.
    if(z.boxes.some(box=>enabled(box)&&!box.automatic&&segmentBox(a,b,box,.47)))return false;
    for(const c of z.circles){
      if(!enabled(c))continue;
      const t=clamp(((c.x-a.x)*dx+(c.z-a.z)*dz)/(length*length||1),0,1);
      if(Math.hypot(a.x+dx*t-c.x,a.z+dz*t-c.z)<c.r+.47)return false;
    }
    const count=Math.max(1,Math.ceil(length/.65));
    for(let i=0;i<=count;i++)if(!validFloor({x:a.x+dx*i/count,z:a.z+dz*i/count},z))return false;
    return true;
  };
  J.findPath = destination => {
    const start={x:player.g.position.x,z:player.g.position.z}, end=project(destination);
    if(blocked(end))return [];
    if(J.lineClear(start,end))return [end];
    const points=[start,end,...zone().navNodes.filter(p=>validFloor(p)&&!blocked(p))];
    const distance=points.map(()=>Infinity), prev=points.map(()=>-1), used=new Set();distance[0]=0;
    for(let n=0;n<points.length;n++){
      let u=-1;for(let i=0;i<points.length;i++)if(!used.has(i)&&(u<0||distance[i]<distance[u]))u=i;
      if(u<0||!isFinite(distance[u]))break;if(u===1)break;used.add(u);
      for(let v=1;v<points.length;v++){
        if(used.has(v)||!J.lineClear(points[u],points[v]))continue;
        const d=distance[u]+Math.hypot(points[u].x-points[v].x,points[u].z-points[v].z);
        if(d<distance[v]){distance[v]=d;prev[v]=u;}
      }
    }
    if(!isFinite(distance[1]))return [];
    const path=[];for(let at=1;at>0;at=prev[at]){path.unshift(points[at]);if(prev[at]<0)return [];}
    return path;
  };
  J.clearPath = () => {J.route=[];walkTo=null;if(marker)marker.visible=false;};
  function nextWaypoint(){
    const next=J.route.shift();
    if(next){walkTo=next;showMarker(next);}
  }
  J.go = (destination,inter=null) => {
    if(J.viewTutorial)return;
    const path=J.findPath(destination);J.clearPath();
    if(!path.length){toast('Jalur tertutup. Dekati pintu atau panggil lift terlebih dahulu.');return;}
    J.route=path.map((p,i)=>({...p,inter:i===path.length-1?inter:null}));nextWaypoint();
  };
  J.advancePath = () => {
    if(J.route.length && walkTo && Math.hypot(walkTo.x-player.g.position.x,walkTo.z-player.g.position.z)<.4)nextWaypoint();
  };
  function addSpec(target,spec){
    for(const key of ['boxes','circles','interactions','picks','walkAreas','navNodes'])target[key].push(...(spec[key]||[]));
    target.elevator=spec.elevator;target.terraceDoor=spec.terraceDoor;target.update=spec.update;
  }
  function createScene(id){
    const s=new THREE.Scene();
    const backdrop=id==='mall'?0x34445f:id==='lobby'?0x675a58:0x687285;
    s.background=new THREE.Color(backdrop);
    s.fog=new THREE.Fog(backdrop,id==='mall'?230:65,id==='mall'?620:140);
    const h=new THREE.HemisphereLight(id==='mall'?0xa49bb6:0xffdcba,0x65503d,id==='mall'?.48:.5);s.add(h);
    const light=new THREE.DirectionalLight(id==='mall'?0xffb687:0xffd9aa,id==='mall'?.67:.62);
    light.position.set(id==='mall'?20:4,id==='mall'?100:20,id==='mall'?80:16);s.add(light);
    if(id==='mall'){
      light.castShadow=true;light.shadow.mapSize.set(1024,1024);
      Object.assign(light.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:180});
      light.shadow.bias=-.0003;light.shadow.normalBias=.12;s.add(light.target);
    }
    return {id,scene:s,sun:light,hemi:h,boxes:[],circles:[],interactions:[],picks:[],walkAreas:[],navNodes:[]};
  }
  function bindActive(id){
    const z=J.zones[id];J.active=id;scene=z.scene;sun=z.sun;hemi=z.hemi;
    COLB=z.boxes;COLC=z.circles;INTER=z.interactions;PICK=z.picks;
  }
  J.setViewMode = mode => {
    J.viewMode=mode==='fpp'?'fpp':'tpp';
    if(J.viewMode==='fpp')J.fpYaw=player.face;
    else if(player)player.face=J.fpYaw;
    if(player)player.g.visible=J.viewMode!=='fpp';
    for(const z of Object.values(J.zones)){
      for(const name of ['Ballroom ceiling','Foyer ceiling','Lobby ceiling','Lift ceiling']){
        const roof=z.scene.getObjectByName(name);
        if(roof)roof.visible=J.viewMode==='fpp';
      }
    }
    const button=el('btnView');
    if(button){
      button.hidden=!J.viewUnlocked;
      button.textContent=J.viewMode==='fpp'?'↗ TPP':'◎ FPP';
      button.setAttribute('aria-label',J.viewMode==='fpp'?'Beralih ke sudut pandang orang ketiga':'Beralih ke sudut pandang orang pertama');
      button.setAttribute('aria-pressed',String(J.viewMode==='fpp'));
    }
    J.cameraSnap=true;
    if(J.ready)store.set('viewMode',J.viewMode);
  };
  J.toggleView = () => {
    if(!J.viewUnlocked||J.locked)return;
    J.clearPath();J.setViewMode(J.viewMode==='fpp'?'tpp':'fpp');
    if(J.viewTutorial){
      J.viewTutorial=false;store.set('viewHelpSeen',true);
      el('viewTutorial').hidden=true;el('btnView').classList.remove('view-pulse');
      refreshBusy();
    }
    J.save();
  };
  J.activate = (id,position,heading=Math.PI) => {
    bindActive(id);const z=zone();J.clearPath();
    for(const obj of [player.g,marker,arrow,confetti.mesh])scene.add(obj);
    const p=position||z.spawn;player.g.position.set(p.x,0,p.z);J.constrain(player.g.position);
    player.face=heading;player.g.rotation.y=heading;confetti.mesh.count=0;confetti.life=0;
    inside=false;insideK=id==='ballroom'?1:0;nearest=null;lastNearKey='#';
    Object.keys(keys).forEach(k=>keys[k]=false);joy.x=joy.y=0;el('knob').style.transform='';
    camTarget.set(player.g.position.x,0,player.g.position.z);
    camera.far=id==='mall'?1100:200;camera.near=.15;camera.updateProjectionMatrix();
    renderer.outputEncoding=id==='ballroom'?THREE.LinearEncoding:THREE.sRGBEncoding;
    // r128: outputEncoding is the final gamma conversion; no duplicate gamma pass.
    renderer.toneMapping=id==='ballroom'?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=id==='mall'?.76:id==='lobby'?.88:1;
    J.cooldown=.9;J.cameraSnap=true;
    if(id==='ballroom'&&!J.viewUnlocked){J.viewUnlocked=true;J.setViewMode(store.get('viewMode','tpp'));}
    else J.setViewMode(id==='mall'?'tpp':J.viewMode);
  };
  J.portal = (target,position,heading=Math.PI) => {
    if(J.locked||!J.ready)return;
    J.clearPath();J.state={kind:'portal',time:0,target,position,heading,switched:false};
    el('journeyCurtain').style.opacity='1';refreshBusy();
  };
  J.ride = () => {
    const lift=zone().elevator;if(J.locked||!lift?.contains(player.g.position))return;
    J.save();J.clearPath();lift.close();
    J.state={kind:'lift',time:0,source:J.active,target:J.active==='lobby'?'ballroom':'lobby',switched:false};
    el('journeyRide').hidden=false;el('journeyRide').textContent='Pintu lift menutup…';refreshBusy();
  };
  J.save = () => {
    if(!J.ready||!player||J.locked)return;
    const lift=zone().elevator;
    let p=lift?.contains(player.g.position)?lift.safeSpawn:player.g.position;
    if(J.active==='ballroom'&&Math.abs(p.x-28)<2.5&&Math.abs(p.z+11.78)<1)p={x:28,z:-9.5};
    store.set('journeyPos3',{version:8,zone:J.active,x:+p.x.toFixed(2),z:+p.z.toFixed(2)});
  };
  function restore(){
    const saved=store.get('journeyPos3',null), z=saved&&J.zones[saved.zone];
    // Floor 9 moved: old saved floor-9 coordinates return to the new lift landing.
    if([3,4,5].includes(saved?.version)&&saved.zone==='ballroom'){J.activate('ballroom',J.zones.ballroom.elevator.safeSpawn);return;}
    if([6,7].includes(saved?.version)&&saved.zone==='ballroom'&&(!validFloor(saved,z)||blocked(saved,z))){J.activate('ballroom',J.zones.ballroom.elevator.safeSpawn);return;}
    if([3,4,5,6,7,8].includes(saved?.version)&&z&&Number.isFinite(saved.x)&&Number.isFinite(saved.z)&&validFloor(saved,z)&&!blocked(saved,z)){
      const p=z.elevator?.contains(saved)?z.elevator.safeSpawn:saved;J.activate(saved.zone,p);
    }else J.activate('mall',{x:0,z:68});
  }
  function setupUI(){
    const style=document.createElement('style');style.textContent=`
      #worldLoadStatus{font-size:12px;margin:0;color:#70563c;max-width:310px}#worldRetry{font-size:13px}
      #journeyGuide{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:3;padding:8px 16px;background:#fff6e5ed;border:2px solid #9c8054;border-radius:20px;max-width:42vw;text-align:center;color:#58402d;font:800 13px var(--f-body,sans-serif);pointer-events:none}
      #journeyCurtain{position:fixed;inset:0;background:#18242e;z-index:12;pointer-events:none;opacity:0;transition:opacity .24s ease}
      #journeyRide{position:fixed;z-index:13;left:50%;top:22%;transform:translateX(-50%);background:#182c3eee;color:#ffe2a5;border:2px solid #c8a257;padding:18px 28px;border-radius:16px;text-align:center;font-size:20px;font-weight:800}
      #btnView{min-width:78px;height:53px;padding:5px 9px;border:3px solid #593c2a;border-radius:17px;background:#e8e4df;color:#3f4353;font:800 17px var(--f-body,sans-serif);cursor:pointer;box-shadow:0 4px 0 #593c2a}
      #btnView[hidden],#viewTutorial[hidden]{display:none!important}
      #btnView.view-pulse{animation:viewPulse 1.1s ease-in-out infinite}
      @keyframes viewPulse{0%,100%{box-shadow:0 4px 0 #593c2a,0 0 0 0 #f4cf7caa}50%{box-shadow:0 4px 0 #593c2a,0 0 0 11px #f4cf7c22}}
      #viewTutorial{position:fixed;right:112px;bottom:calc(155px + env(safe-area-inset-bottom,0px));z-index:7;max-width:270px;padding:12px 16px;background:#fff6e9;color:#553f31;border:3px solid #9c8054;border-radius:16px;box-shadow:0 8px 22px #22172244;font:800 14px var(--f-body,sans-serif);pointer-events:none}
      @media(max-width:600px){#journeyGuide{top:126px;max-width:90vw;width:max-content;font-size:11px;padding:6px 10px}#journeyRide{top:30%;font-size:17px;min-width:240px}.act:has(#btnPhone:not([hidden])) #btnA{width:52px;height:52px;font-size:22px}#viewTutorial{right:105px;bottom:calc(140px + env(safe-area-inset-bottom,0px));max-width:190px;font-size:12px}}
      @media(prefers-reduced-motion:reduce){#journeyCurtain{transition:none}}
    `;document.head.append(style);
    for(const id of ['journeyGuide','journeyCurtain','journeyRide']){const d=document.createElement('div');d.id=id;if(id!=='journeyCurtain'){d.setAttribute('role','status');d.setAttribute('aria-live','polite');}document.body.append(d);}
    el('journeyGuide').hidden=true;el('journeyRide').hidden=true;
    const modeButton=document.createElement('button');modeButton.id='btnView';modeButton.type='button';modeButton.hidden=true;
    el('btnPhone').parentElement.insertBefore(modeButton,el('btnPhone'));
    modeButton.addEventListener('click',J.toggleView);
    const hint=document.createElement('div');hint.id='viewTutorial';hint.setAttribute('role','status');
    hint.textContent='Mode FPP aktif. Coba tombol TPP di atas HP untuk melihat seluruh ruangan; setelah itu kamu bebas memilih mode dan lanjut berjalan.';
    hint.hidden=true;document.body.append(hint);
    el('btnOpen').disabled=true;el('worldRetry').onclick=()=>J.loadMall();
  }
  J.init = () => {
    setupUI();
    const ballroom={id:'ballroom',scene,sun,hemi,boxes:COLB,circles:COLC,interactions:INTER,picks:PICK,
      spawn:{x:28,z:9.8},walkAreas:[{x0:-11.65,x1:21.65,z0:-13.65,z1:21.65,y:.025},{x0:21.2,x1:23.6,z0:-4.25,z1:.25,y:.025},...terraceSpec.walkAreas],
      navNodes:[{x:20,z:-2},{x:17,z:-2},{x:24,z:-2},{x:8,z:-2},{x:-2.15,z:-2},{x:-2.15,z:4},{x:-2.15,z:9},{x:-2.15,z:12},{x:5,z:5},{x:5,z:12},{x:5,z:19},{x:19,z:3},{x:19,z:9},{x:19,z:15},{x:19,z:20},{x:10,z:3},{x:10,z:10},{x:10,z:18},{x:4,z:-8},{x:-3.5,z:-9.6},{x:18,z:-8},{x:-2.15,z:2},...terraceSpec.navNodes]};
    const base={THREE,couple:COUPLE,makeChibi,animChibi,say,terraceBounds:{x0:BLD.x0,x1:34}};
    addSpec(ballroom,WeddingLobby.createFoyer({...base,scene,onRide:()=>J.ride()}));
    const updateFoyer=ballroom.update;
    ballroom.update=(dt,p,allowed)=>{updateFoyer(dt,p,allowed);terraceSpec.update(dt);};
    J.zones.ballroom=ballroom;
    const lobby=createScene('lobby');J.zones.lobby=lobby;scene=lobby.scene;
    const lobbySpec=WeddingLobby.createLobby({...base,scene,onExit:()=>J.portal('mall',{x:101,z:36.5},0),onRide:()=>J.ride()});
    addSpec(lobby,lobbySpec);lobby.spawn=lobbySpec.spawn;lobby.bounds=lobbySpec.bounds;
    const mall=createScene('mall');mall.spawn={x:0,z:68};mall.walkAreas=[{x0:-70,x1:150,z0:32,z1:80,y:.09}];J.zones.mall=mall;
    scene=mall.scene;buildAnimals();dog.g.position.set(1.6,.09,69.5);
    J.activate('mall',mall.spawn);J.loadMall();
  };
  J.loadMall = async () => {
    if(J.loading)return;J.loading=true;J.ready=false;el('worldRetry').hidden=true;el('btnOpen').disabled=true;
    el('worldLoadStatus').textContent='Memuat Central Park 2 & SOHO…';
    const mall=J.zones.mall,root=new THREE.Group();mall.scene.add(root);
    try{
      const spec=await WeddingMall.create({THREE,scene:root,renderer,makeChibi,animChibi,couple:COUPLE,date:W.dateShort,onEnter:()=>J.portal('lobby',{x:0,z:8}),
        say:text=>say('Petunjuk Wedding',Array.isArray(text)?text:[text]),
        onProgress:(n,total)=>{el('worldLoadStatus').textContent=total?'Memuat mall… '+Math.round(n/total*100)+'%':'Memuat mall… '+(n/1048576).toFixed(1)+' MB';}});
      Object.assign(mall,spec);mall.scene=root.parent;
      mall.interactions.push({key:'dog',pos:()=>dog.g.position,reach:1.6,label:'Elus Kopi',run:petDog});
      J.ready=true;J.loading=false;restore();
      el('worldLoadStatus').textContent='Siap · SOHO → resepsionis → lift → lantai 9';el('btnOpen').disabled=false;refreshBusy();
    }catch(error){
      mall.scene.remove(root);root.traverse(o=>{if(o.geometry)o.geometry.dispose();});J.loading=false;
      el('worldLoadStatus').textContent='Model mall belum berhasil dimuat. Periksa koneksi, lalu coba lagi.';el('worldRetry').hidden=false;
      console.error('Mall loading failed',error);
    }
  };
  J.update = dt => {
    J.cooldown=Math.max(0,J.cooldown-dt);
    zone()?.update?.(dt,player.g.position,started&&!busy()&&!J.viewTutorial&&J.cooldown===0);
    if(J.active==='mall'&&J.ready){
      const pp=player.g.position, dp=dog.g.position;
      const sunlight=zone().sun;
      sunlight.position.set(pp.x-22,70,pp.z+35);sunlight.target.position.set(pp.x,0,pp.z-8);
      const target=pp.z<39&&pp.x>90?{x:96,z:38.5}:{x:pp.x-1.4,z:pp.z+1.4};
      const dx=target.x-dp.x,dz=target.z-dp.z,d=Math.hypot(dx,dz),moving=d>.8;
      if(moving){const step=Math.min(d,dt*8);dp.x+=dx/d*step;dp.z+=dz/d*step;dog.face=lerpAng(dog.face,Math.atan2(dx,dz),Math.min(1,dt*8));}
      collide(dp,.35);dog.g.rotation.y=dog.face;dog.phase+=dt*(moving?14:0);
      dog.legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(dog.phase+(i%2?0:Math.PI))*.6:0);dog.tail.rotation.y=Math.sin(T*10)*.6;
      if(dog.hop>0){dog.hop=Math.max(0,dog.hop-dt*1.4);dog.body.position.y=Math.abs(Math.sin(dog.hop*Math.PI*3))*.35;}else dog.body.position.y=0;
    }
    const s=J.state;if(!s)return;s.time+=dt;
    if(s.kind==='portal'){
      if(s.time>.26&&!s.switched){s.switched=true;J.activate(s.target,s.position,s.heading);el('journeyCurtain').style.opacity='0';}
      if(s.time>.58){J.state=null;J.save();refreshBusy();}
    }else{
      const goingUp=s.target==='ballroom';
      if(s.time>.7&&s.time<3.7){
        const t=clamp((s.time-.7)/3,0,1),floor=goingUp?Math.floor(t*9):9-Math.floor(t*9);
        zone().elevator.setFloor(floor===0?'Lobby':String(floor));
        el('journeyRide').textContent=(goingUp?'↑ Menuju lantai 9':'↓ Menuju Lobby')+' · '+(floor||'Lobby');
      }
      if(s.time>3.6)el('journeyCurtain').style.opacity=s.switched?'0':'1';
      if(s.time>3.9&&!s.switched){
        const dest=J.zones[s.target];dest.elevator.close();dest.update?.(1,dest.elevator.cabinSpawn,false);
        J.activate(s.target,dest.elevator.cabinSpawn,goingUp?Math.PI:Math.PI/2);s.switched=true;
        if(goingUp){J.viewUnlocked=true;J.setViewMode('fpp');}
        dest.elevator.setFloor(goingUp?'9':'Lobby');dest.elevator.open();el('journeyCurtain').style.opacity='0';
        el('journeyRide').textContent=goingUp?'Lantai 9 · Ballroom':'Lobby SOHO';
      }
      if(s.time>4.75){
        J.state=null;el('journeyRide').hidden=true;
        if(goingUp&&!store.get('viewHelpSeen',false)){
          J.viewTutorial=true;J.clearPath();el('viewTutorial').hidden=false;
          el('btnView').classList.add('view-pulse');
        }
        J.save();refreshBusy();
      }
    }
  };
  J.updateGuide = () => {
    const p=player.g.position;let target=null,label='';
    if(J.active==='mall'){
      label='Ikuti papan wedding → SOHO · Lantai 9';
      target=p.x<8&&p.z>53?{x:0,z:51}:p.x<65?{x:65,z:50.8}:p.x<95?{x:101,z:44}:{x:101,z:32.4};
    }else if(J.active==='lobby'){
      label=zone().elevator.contains(p)?'Pilih 9 · Ballroom':'Resepsionis → belok kiri → lift lantai 9';
      target=p.x>-7?{x:-8,z:0}:zone().elevator.isOpen?zone().elevator.cabinSpawn:zone().elevator.safeSpawn;
    }else{
      const outdoor=J.isOutdoor(p);
      label=outdoor?'Sky Terrace · Stall makanan di kanan':'Lantai 9 · ← Ballroom · Outdoor lurus ↑';
      if(!inside&&!outdoor)target=p.z>1?{x:28,z:-2}:{x:20,z:-2};
      if(outdoor&&p.x>23)target={x:18,z:-18};
    }
    el('journeyGuide').hidden=!started||!J.ready||inside;
    if(el('journeyGuide').textContent!==label)el('journeyGuide').textContent=label;
    arrow.visible=!!target&&started&&!busy()&&!J.viewTutorial&&Math.hypot(p.x-target.x,p.z-target.z)>1.5;
    if(arrow.visible){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);arrow.position.set(p.x+dx/d*1.3,p.y+.09,p.z+dz/d*1.3);arrow.rotation.y=Math.atan2(-dx,-dz);arrow.material.opacity=.7+Math.sin(T*4)*.15;}
  };
  J.updateCamera = dt => {
    const p=player.g.position,portrait=innerHeight>innerWidth;
    if(!started){
      if(J.active==='mall'){camera.position.set(157,92,166);camera.lookAt(53,28,19);}
      else if(J.active==='ballroom'){camera.position.set(0,30,30);camera.lookAt(0,0,-10);}
      else{camera.position.set(-4,22,22);camera.lookAt(-6,0,0);}
      camera.fov=portrait?64:51;camera.updateProjectionMatrix();return;
    }
    if(J.viewMode==='fpp'){
      const eye=new THREE.Vector3(p.x,p.y+1.6,p.z);
      camera.position.lerp(eye,J.cameraSnap?1:1-Math.exp(-7*dt));
      J.cameraSnap=false;
      camera.lookAt(eye.x+Math.sin(J.fpYaw)*8,eye.y+Math.sin(J.fpPitch)*8,
        eye.z+Math.cos(J.fpYaw)*8);
      camera.fov=portrait?73:66;camera.updateProjectionMatrix();
      camTarget.set(p.x,0,p.z);
      return;
    }
    const nearDoor=J.active==='ballroom'&&(
      (Math.abs(p.x-BLD.x1)<5&&Math.abs(p.z-BLD.entranceZ)<7)||
      (Math.abs(p.z-BLD.z0)<5&&p.x>11));
    const k=J.cameraSnap?1:1-Math.exp(-(nearDoor?2.7:4)*dt);
    camTarget.x+=(p.x-camTarget.x)*k;camTarget.z+=(p.z-camTarget.z)*k;
    let height,distance,lookY=1.1,ahead=0,yaw=0,focus=0,altarAim=0,fov=portrait?48:43;
    if(J.active==='mall'){height=portrait?16:11;distance=portrait?30:23;lookY=4;ahead=8;fov=portrait?55:48;}
    else if(J.active==='lobby'){height=portrait?16:14;distance=portrait?13:12;}
    else{
      height=portrait?19:13;distance=portrait?23:18;fov=portrait?46:43;
      if(p.x>22&&!J.isOutdoor(p)){height=portrait?18:12;distance=portrait?22:17;fov=50;ahead=3;}
      // The solid half-wall needs an outdoor-side view after the left turn.
      if(J.isOutdoor(p)){
        height=portrait?17:11;distance=portrait?21:16;fov=portrait?52:48;lookY=1.6;
        yaw=-Math.PI*(1-THREE.MathUtils.smoothstep(p.x,18,28));
      }
      // Orbit away from the full rear wall before it hides guests or tables.
      // Keep the altar framing and the table-side framing on the same smooth track.
      if(!J.isOutdoor(p)&&p.x<21.5){
        const altarFocus=THREE.MathUtils.smoothstep(p.z,3,10)*(1-THREE.MathUtils.smoothstep(p.x,0,8));
        const wallRisk=THREE.MathUtils.smoothstep(p.z+distance,BLD.z1-6,BLD.z1-1);
        altarAim=altarFocus;
        focus=Math.max(altarFocus,wallRisk);
        yaw=Math.PI*focus+.38*wallRisk*THREE.MathUtils.smoothstep(p.x,10,18);
        height-=focus*3;distance-=focus*3;
      }
    }
    const desired={height,distance,lookY,ahead,fov,yaw,focus,altarAim};
    if(J.cameraSnap||!J.cameraRig)J.cameraRig={...desired};
    const smoothing=1-Math.exp(-(nearDoor?1.25:1.9)*dt);
    for(const key of Object.keys(desired))J.cameraRig[key]+=(desired[key]-J.cameraRig[key])*smoothing;
    const rig=J.cameraRig;
    const want=new THREE.Vector3(camTarget.x+Math.sin(rig.yaw)*rig.distance*zoom,rig.height*zoom+p.y,camTarget.z+Math.cos(rig.yaw)*rig.distance*zoom);
    if(J.active==='ballroom'&&!J.isOutdoor(p)&&p.x<21.5)
      want.z=Math.min(want.z,BLD.z1-1.15);
    camera.position.lerp(want,J.cameraSnap?1:1-Math.exp(-(nearDoor?2:3)*dt));J.cameraSnap=false;
    if(J.active==='ballroom'&&!J.isOutdoor(p)&&p.x<21.5)
      camera.position.z=Math.min(camera.position.z,BLD.z1-1.15);
    camera.lookAt(THREE.MathUtils.lerp(camTarget.x,-2.15,rig.altarAim*.55),rig.lookY+p.y,THREE.MathUtils.lerp(camTarget.z-rig.ahead,16,rig.altarAim*.55));camera.fov=rig.fov;camera.updateProjectionMatrix();
  };
  return J;
})();
