// Node 22+, local static server, and a disposable Chrome --remote-debugging-port=9229.
// Does not submit RSVP or contact production. Uses the actual app movement/update loop.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const endpoint=process.env.CDP_URL||'http://127.0.0.1:9229';
const url=process.env.TEST_URL||'http://127.0.0.1:8765';
const pages=await(await fetch(endpoint+'/json')).json();
const page=pages.find(p=>p.type==='page');
assert(page,'Start a disposable Chrome debugging session first');
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let serial=0;const pending=new Map(),errors=[];
socket.onmessage=({data})=>{
  const message=JSON.parse(data);
  if(message.id){pending.get(message.id)?.(message);pending.delete(message.id);}
  else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);
};
function send(method,params={}){
  return new Promise((resolve,reject)=>{
    const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out'));},15000);
    pending.set(id,m=>{clearTimeout(timer);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);});
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(expression){
  for(let i=0;i<100;i++){
    if(await evaluate(expression))return;
    await new Promise(r=>setTimeout(r,150));
  }
  throw new Error('Timed out: '+expression);
}
async function capture(name){
  await evaluate('Journey.updateCamera(1);renderer.render(scene,camera)');
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync('/tmp/wedding-'+name+'.png',Buffer.from(shot.data,'base64'));
}
try{
  await send('Runtime.enable');await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  await until('typeof Journey!=="undefined" && Journey.ready');
  assert(await evaluate("getComputedStyle(document.querySelector('#hud .tl')).display==='none'"),'small invitation header hidden behind cover');
  await evaluate("(async()=>{document.querySelector('#btnOpen').click();await new Promise(r=>setTimeout(r,750));while(dlg.open){dlg.typing=false;advance();}welcomeDone=true;Journey.activate('mall',{x:0,z:68});window.testStep=n=>{for(let i=0;i<n;i++)update(.05)}})()");
  assert(await evaluate("getComputedStyle(document.querySelector('#hud .tl')).display!=='none'"),'small invitation header restored after cover');
  await capture('mall-desktop');
  const journey=await evaluate(`(()=>{
    testStep(20);Journey.go({x:101,z:37.3});testStep(650);
    const approach=Math.hypot(player.g.position.x-101,player.g.position.z-37.3)<.5;
    Journey.go({x:101,z:32.4});testStep(150);
    const entry=Journey.active==='lobby';Journey.go({x:-13.8,z:0});testStep(200);
    const corridor=player.g.position.x<-13;
    const closed=Journey.findPath({x:-18.5,z:0}).length===0;
    INTER.find(i=>i.key==='lobby-lift-call').run();testStep(20);
    Journey.go({x:-18.5,z:0});testStep(70);
    const cabin=Journey.zones.lobby.elevator.contains(player.g.position);
    setPhoneMode(true);testStep(2);
    const actionWithPhone=!document.querySelector('#btnA').hidden;
    INTER.find(i=>i.key==='lobby-lift-ride').run();
    const old=player.g.position.clone();keys.w=true;testStep(25);
    const locked=Journey.locked&&old.distanceTo(player.g.position)<.001;
    Journey.ride();testStep(90);
    const upstairs=Journey.active==='ballroom'&&!Journey.locked;
    Journey.go({x:28,z:-2});testStep(110);
    const reception=INTER.some(i=>i.key==='floor9-reception');
    const deskSolid=!Journey.lineClear({x:28,z:-2},{x:32,z:-2});
    Journey.go({x:17,z:-2});testStep(110);const ballroom=inside;
    Journey.go({x:28,z:-2});testStep(110);
    Journey.go({x:-2.15,z:12});testStep(240);
    const altarRoute=Math.hypot(player.g.position.x+2.15,player.g.position.z-12)<.6;
    const threeTables=SEATPOS.length===15;
    Journey.go({x:28,z:-2});testStep(220);
    Journey.go({x:28,z:-17});testStep(110);const straightOutdoor=Journey.isOutdoor(player.g.position)&&!inside;
    const automaticDoor=Journey.zones.ballroom.terraceDoor.isOpen;
    Journey.go({x:-8,z:-18});testStep(250);
    const leftOutdoor=player.g.position.x<-7.5&&Journey.isOutdoor(player.g.position);
    const outdoorStalls=INTER.filter(i=>i.key.startsWith('terrace-stall-')).length===3;
    Journey.go({x:28,z:14.5});testStep(380);Journey.ride();testStep(110);
    const down=Journey.active==='lobby'&&!Journey.locked;
    Journey.go({x:0,z:8});testStep(220);Journey.go({x:0,z:10});testStep(80);
    return {approach,entry,corridor,closed,cabin,actionWithPhone,locked,upstairs,reception,deskSolid,ballroom,altarRoute,threeTables,automaticDoor,straightOutdoor,leftOutdoor,outdoorStalls,down,outside:Journey.active==='mall'};
  })()`);
  for(const [key,value] of Object.entries(journey))assert.equal(value,true,key);
  console.log('PASS round trip, collision, lift lock, phone action',journey);
  await evaluate("Journey.activate('lobby',{x:0,z:4});Journey.update(.1)");
  await capture('lobby-desktop');
  await evaluate("Journey.activate('ballroom',{x:28,z:6});Journey.update(.1)");
  await capture('floor9-reception-desktop');
  await evaluate("Journey.activate('ballroom',{x:10,z:-18});Journey.update(.1)");
  await capture('terrace-desktop');
  const terraceBounds=await evaluate(`(()=>{
    const root=Journey.zones.ballroom.scene;
    const main=new THREE.Box3().setFromObject(root.getObjectByName('Sky Terrace main floor'));
    const canopy=new THREE.Box3().setFromObject(root.getObjectByName('Sky Terrace canopy'));
    const spur=new THREE.Box3().setFromObject(root.getObjectByName('Sky Terrace entry spur'));
    const near=(v,n)=>Math.abs(v-n)<.01;
    return {floor:near(main.min.x,BLD.x0)&&near(main.max.x,34),
      canopy:near(canopy.min.x,BLD.x0)&&near(canopy.max.x,34),
      spur:near(spur.min.x,BLD.x1)&&near(spur.max.x,34),
      boundary:Journey.findPath({x:-15,z:-18}).length===0};
  })()`);
  for(const [key,value] of Object.entries(terraceBounds))assert.equal(value,true,'terrace '+key);
  console.log('PASS terrace floor and canopy align with complete facade, with no left overhang',terraceBounds);
  const altar=await evaluate(`(()=>{
    Journey.activate('ballroom',{x:-2.15,z:2});Journey.updateCamera(1);
    player.g.position.z=12;
    const before=camera.position.clone();Journey.updateCamera(1/60);
    const smooth=camera.position.distanceTo(before)<1;
    for(let i=0;i<140;i++)Journey.updateCamera(.05);
    const front=camera.position.z<player.g.position.z&&Math.abs(Journey.cameraRig.yaw-Math.PI)<.01;
    const coupleFront=couple.groom.g.position.z===16&&couple.bride.g.position.z===16&&
      Math.abs((couple.groom.g.position.x+couple.bride.g.position.x)/2+2.15)<.01;
    const pane=scene.getObjectByName('Ballroom panoramic terrace glazing');
    const glass=new THREE.Box3().setFromObject(pane);
    const halfGlass=glass.min.x===5&&glass.max.x===22&&!!scene.getObjectByName('Ballroom solid left wall');
    const buffet=INTER.some(i=>i.key==='buffet'&&i.x<5);
    const wall=new THREE.Box3().setFromObject(scene.getObjectByName('Bridal rear wall'));
    const rearWall=Math.abs(wall.min.x+12)<.01&&Math.abs(wall.max.x-22)<.01&&wall.max.y>=7;
    const shiftedTables=Math.abs(SEATPOS.reduce((sum,s)=>sum+s.x,0)/SEATPOS.length-18.3)<.01;
    walkTo=null;Journey.route=[];const z=player.g.position.z;keys.w=true;update(.05);keys.w=false;
    const controls=player.g.position.z>z;
    return {smooth,front,coupleFront,halfGlass,buffet,rearWall,shiftedTables,controls};
  })()`);
  for(const [key,value] of Object.entries(altar))assert.equal(value,true,'altar '+key);
  console.log('PASS frontal altar, half glazing, buffet, smooth orbit and camera-relative controls',altar);
  await capture('altar-desktop');
  const tableCamera=await evaluate(`(()=>{
    Journey.activate('ballroom',{x:18.3,z:16});
    for(let i=0;i<100;i++)Journey.updateCamera(.05);
    return camera.position.z<BLD.z1-1&&Journey.cameraRig.yaw>Math.PI&&Journey.cameraRig.yaw<Math.PI+.5;
  })()`);
  assert.equal(tableCamera,true,'table view avoids rear wall');
  await capture('tables-desktop');
  console.log('PASS camera clears rear-wall blind spot at banquet tables');
  const vip=await evaluate(`(()=>{
    const walls=scene.children.filter(o=>o.name==='VIP partition');
    const buffet=COLB.some(b=>Math.abs(b.x-21.12)<.01&&b.hd>7);
    Journey.activate('ballroom',{x:10,z:10.5});
    const opening=Journey.findPath({x:15.1,z:10.5}).length>0;
    const solid=COLB.some(b=>Math.abs(b.x-13.4)<.01&&b.z<8&&b.hd>2);
    return {walls:walls.length===2,buffet,opening,solid};
  })()`);
  for(const [key,value] of Object.entries(vip))assert.equal(value,true,'VIP '+key);
  console.log('PASS VIP partition, right-side buffet and central access',vip);
  await evaluate("Journey.activate('ballroom',{x:-2.15,z:-1.2});Journey.updateCamera(1)");
  await capture('aisle-corner');
  const smooth=await evaluate(`(()=>{
    Journey.activate('ballroom',{x:20,z:-14.12});Journey.updateCamera(1);
    const before=camera.position.clone(),fov=camera.fov;
    player.g.position.z=-14.35;Journey.updateCamera(1/60);
    const terrace=camera.position.distanceTo(before)<.2&&Math.abs(camera.fov-fov)<.2;
    Journey.activate('ballroom',{x:22.3,z:-2});Journey.updateCamera(1);
    const doorBefore=camera.position.clone();player.g.position.x=21.8;Journey.updateCamera(1/60);
    return terrace&&camera.position.distanceTo(doorBefore)<.2;
  })()`);
  assert(smooth,'continuous camera across terrace and ballroom doors');
  console.log('PASS smooth camera transitions at terrace and ballroom doors');
  // Prevent beforeunload's current-layout save from overwriting this legacy fixture.
  await evaluate("store.set('journeyPos3',{version:3,zone:'ballroom',x:0,z:14.5});Journey.ready=false");
  await send('Page.reload',{ignoreCache:true});await until('typeof Journey!=="undefined"&&Journey.ready');
  assert(await evaluate("Journey.active==='ballroom'&&Math.abs(player.g.position.x-28)<.1&&Math.abs(player.g.position.z-9.8)<.1"),'old floor9 save migration');
  await evaluate("store.set('journeyPos3',{version:6,zone:'ballroom',x:-18,z:-18});Journey.ready=false");
  await send('Page.reload',{ignoreCache:true});await until('typeof Journey!=="undefined"&&Journey.ready');
  assert(await evaluate("Journey.active==='ballroom'&&Math.abs(player.g.position.x-28)<.1&&Math.abs(player.g.position.z-9.8)<.1"),'old terrace save migration');
  await evaluate("document.querySelector('#btnOpen').click();welcomeDone=true;window.testStep=n=>{for(let i=0;i<n;i++)update(.05)}");
  console.log('PASS previous floor-9 layout save migrates to new lift landing');
  // Saving during a ride must keep the pre-ride safe point, not a sealed cabin.
  await evaluate("Journey.activate('lobby',{x:-18.5,z:0});Journey.zones.lobby.elevator.open();testStep(20);Journey.ride();testStep(20)");
  await send('Page.reload',{ignoreCache:true});
  await until('typeof Journey!=="undefined"&&Journey.ready');
  assert(await evaluate("Journey.active==='lobby'&&!Journey.locked&&Math.abs(player.g.position.x+13.8)<.1"),'safe reload');
  console.log('PASS refresh during lift returns to safe lobby point');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await send('Page.reload',{ignoreCache:true});await until('typeof Journey!=="undefined"&&Journey.ready');
  await evaluate("(async()=>{document.querySelector('#btnOpen').click();await new Promise(r=>setTimeout(r,750));while(dlg.open){dlg.typing=false;advance();}welcomeDone=true;Journey.activate('mall',{x:0,z:68});resize();Journey.updateCamera(1)})()");
  assert(await evaluate('camera.aspect<1&&renderer.getSize(new THREE.Vector2()).x===390'),'mobile canvas');
  await capture('mall-mobile');
  await evaluate("Journey.activate('lobby',{x:-13,z:0});Journey.update(.1)");
  await capture('lift-mobile');
  await evaluate("Journey.activate('ballroom',{x:28,z:5});Journey.update(.1)");
  await capture('floor9-reception-mobile');
  await evaluate("Journey.activate('ballroom',{x:10,z:-18});Journey.update(.1)");
  await capture('terrace-mobile');
  await evaluate("Journey.activate('ballroom',{x:28,z:-13});Journey.update(.1)");
  await capture('terrace-entry-mobile');
  await evaluate("Journey.activate('ballroom',{x:-2.15,z:12});for(let i=0;i<100;i++)Journey.updateCamera(.05)");
  await capture('altar-mobile');
  console.log('PASS mobile render and touch device loading');
  // Exercise real loader failure and retry, not a mocked ready flag.
  await send('Network.setBlockedURLs',{urls:['*central_park_2_soho_full.glb*']});
  await send('Page.reload',{ignoreCache:true});
  await until("typeof Journey!=='undefined'&&!Journey.loading&&!document.querySelector('#worldRetry').hidden");
  assert(await evaluate("!Journey.ready&&document.querySelector('#btnOpen').disabled"),'failed-load guard');
  await send('Network.setBlockedURLs',{urls:[]});
  await evaluate("document.querySelector('#worldRetry').click()");
  await until('Journey.ready');
  console.log('PASS network failure and retry');
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS no uncaught JavaScript exceptions');
}finally{
  await send('Network.setBlockedURLs',{urls:[]}).catch(()=>{});
  socket.close();
}
