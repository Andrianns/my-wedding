/* Playable SOHO reception and the ninth-floor ballroom foyer. Three.js r128. */
(function () {
  "use strict";

  const COLORS = {
    cream: 0xc8b89c,
    stone: 0x8b9491,
    white: 0xfffcf4,
    gold: 0xc9a45a,
    brass: 0x96733c,
    wood: 0x644839,
    dark: 0x363a40,
    rose: 0x944354,
    leaf: 0x477447,
  };

  function builder(ctx) {
    const T = ctx.THREE;
    const root = new T.Group();
    ctx.scene.add(root);
    const boxes = [], circles = [], interactions = [], picks = [];
    const materials = new Map();
    const name = typeof ctx.couple === "string" ? ctx.couple : "Aji & Vania";
    function material(color) {
      if (!materials.has(color)) {
        materials.set(color, new T.MeshStandardMaterial({ color:new T.Color(color).convertSRGBToLinear(), roughness:.72, metalness:color===COLORS.gold||color===COLORS.brass?.45:0 }));
      }
      return materials.get(color);
    }
    function block(w, h, d, color, x, y, z) {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material(color));
      mesh.position.set(x, y, z);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      root.add(mesh);
      return mesh;
    }
    function collider(x, z, hw, hd) {
      const box = { x, z, hw, hd };
      boxes.push(box);
      return box;
    }
    function wall(x, z, w, d, h) {
      block(w, h, d, COLORS.cream, x, h / 2, z);
      block(w + 0.015, 0.11, d + 0.015, COLORS.brass, x, 0.12, z);
      if (h > 1.1) block(w + 0.02, 0.07, d + 0.02, COLORS.gold, x, h - 0.14, z);
      collider(x, z, w / 2, d / 2);
    }
    function floor(x, z, w, d, color) {
      return block(w, 0.1, d, color || COLORS.stone, x, -0.055, z);
    }
    function label(lines, x, y, z, w, h, options) {
      options = options || {};
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = Math.max(256, Math.round(1024 * h / w));
      const c = canvas.getContext("2d");
      c.fillStyle = options.bg || "#fff9ed";
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.strokeStyle = options.border || "#c9a45a";
      c.lineWidth = 8;
      c.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
      c.textAlign = "center";
      c.textBaseline = "middle";
      const lineHeight = canvas.height / (lines.length + 0.65);
      lines.forEach((line, i) => {
        c.fillStyle = options.color || "#533b2b";
        const size = Math.min(100, lineHeight * (i === 0 ? 0.57 : 0.48));
        c.font = (i === 0 ? "600 " : "500 ") + Math.floor(size) + "px Georgia, serif";
        c.fillText(line, canvas.width / 2, lineHeight * (i + 0.8), canvas.width - 90);
      });
      const texture = new T.CanvasTexture(canvas);
      texture.encoding = T.sRGBEncoding;
      const mesh = new T.Mesh(
        new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }),
      );
      mesh.position.set(x, y, z);
      mesh.rotation.y = options.rotation || 0;
      root.add(mesh);
      return mesh;
    }
    function plant(x, z, scale) {
      scale = scale || 1;
      const pot = new T.Mesh(new T.CylinderGeometry(0.43 * scale, 0.3 * scale, 0.65 * scale, 8), material(COLORS.white));
      pot.position.set(x, 0.325 * scale, z);
      root.add(pot);
      block(0.09 * scale, 1.3 * scale, 0.09 * scale, COLORS.wood, x, 1.15 * scale, z);
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const leaf = new T.Mesh(new T.SphereGeometry(0.42 * scale, 6, 4), material(COLORS.leaf));
        leaf.scale.set(0.7, 1.4, 0.38);
        leaf.position.set(x + Math.cos(angle) * 0.24 * scale, (1.45 + (i % 2) * 0.26) * scale, z + Math.sin(angle) * 0.24 * scale);
        leaf.rotation.z = Math.cos(angle) * 0.45;
        leaf.rotation.y = -angle;
        root.add(leaf);
      }
      circles.push({ x, z, r: 0.45 * scale });
    }
    function interaction(item, x, y, z, w, h, d) {
      interactions.push(item);
      const proxy = new T.Mesh(
        new T.BoxGeometry(w || 1.1, h || 1.8, d || 0.8),
        new T.MeshBasicMaterial({ visible: false }),
      );
      proxy.position.set(x, y, z);
      proxy.userData.inter = item.key;
      root.add(proxy);
      picks.push(proxy);
      return item;
    }
    return { T, root, name, boxes, circles, interactions, picks, material, block, collider, wall, floor, label, plant, interaction };
  }

  function elevator(ctx, b, config) {
    const { T, block, collider, label, interaction } = b;
    // All lift geometry is defined in coordinates facing the doorway: u is left/right,
    // v increases into the cabin. The lobby cabin faces east; the foyer cabin faces north.
    const transform = (u, v) => config.side === "west"
      ? { x: config.x - v, z: config.z + u }
      : { x: config.x + u, z: config.z + v };
    const cuboid = (u, y, v, w, h, d, color) => {
      const p = transform(u, v);
      return config.side === "west"
        ? block(d, h, w, color, p.x, y, p.z)
        : block(w, h, d, color, p.x, y, p.z);
    };
    cuboid(0, -0.002, 2.5, 5, 0.1, 5, 0xb7ada0);
    cuboid(0, 0.035, 2.6, 3.5, 0.04, 3.2, 0x8e6961);
    const cabinRoof=cuboid(0,3.36,2.5,5,.14,5,0xd2c8bd);
    cabinRoof.name='Lift ceiling';cabinRoof.visible=false;
    // Low camera-side walls keep the character visible from the game's overhead view.
    if (config.side === "west") {
      b.wall(config.x - 2.5, config.z - 2.5, 5.25, 0.22, 3.1);
      b.wall(config.x - 2.5, config.z + 2.5, 5.25, 0.22, 0.72);
      b.wall(config.x - 5, config.z, 0.22, 5.2, 3.1);
    } else {
      b.wall(config.x - 2.5, config.z + 2.5, 0.22, 5.2, 3.1);
      b.wall(config.x + 2.5, config.z + 2.5, 0.22, 5.2, 3.1);
      b.wall(config.x, config.z + 5, 5.2, 0.22, 0.72);
    }
    // Narrow fixed jambs leave a 3.6-unit clear opening.
    for (const sign of [-1, 1]) {
      cuboid(sign * 2.2, 1.55, 0, 0.6, 3.1, 0.25, COLORS.brass);
      const p = transform(sign * 2.2, 0);
      collider(p.x, p.z, config.side === "west" ? 0.15 : 0.3, config.side === "west" ? 0.3 : 0.15);
      cuboid(sign * 1.83, 1.45, -0.05, 0.09, 2.9, 0.14, COLORS.gold);
    }
    cuboid(0, 3, 0, 4.9, 0.25, 0.34, COLORS.brass);
    const leaves = [-1, 1].map((sign) => {
      const mesh = cuboid(sign * 0.9, 1.43, 0.035, 1.78, 2.84, 0.12, 0x9b9690);
      return { sign, mesh };
    });
    const doorBox = collider(config.x, config.z, config.side === "west" ? 0.16 : 1.82, config.side === "west" ? 1.82 : 0.16);
    doorBox.enabled = true;
    const displayAt = transform(0, -0.21);
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 512;
    screenCanvas.height = 128;
    const screenContext = screenCanvas.getContext("2d");
    const screenTexture = new T.CanvasTexture(screenCanvas);
    screenTexture.encoding = T.sRGBEncoding;
    const display = new T.Mesh(new T.PlaneGeometry(2.2, 0.55), new T.MeshBasicMaterial({ map: screenTexture, side: T.DoubleSide }));
    display.position.set(displayAt.x, 3.5, displayAt.z);
    display.rotation.y = config.side === "west" ? Math.PI / 2 : Math.PI;
    b.root.add(display);
    // A second screen faces the follow camera on the ninth floor.
    if (config.side !== "west") {
      const rearDisplay = display.clone();
      rearDisplay.rotation.y = 0;
      rearDisplay.position.z += 0.44;
      b.root.add(rearDisplay);
    }
    function setFloor(text) {
      screenContext.fillStyle = "#242b2b";
      screenContext.fillRect(0, 0, 512, 128);
      screenContext.fillStyle = "#f9e6a6";
      screenContext.font = "bold 49px Arial, sans-serif";
      screenContext.textAlign = "center";
      screenContext.textBaseline = "middle";
      screenContext.fillText(String(text), 256, 66, 480);
      screenTexture.needsUpdate = true;
    }
    setFloor(config.floor);
    const callPoint = transform(1.05, -1.8);
    const callPanel = transform(2.64, -0.28);
    cuboid(2.64, 1.18, -0.18, 0.34, 0.62, 0.15, COLORS.dark);
    cuboid(2.64, 1.18, -0.28, 0.16, 0.16, 0.03, COLORS.gold);
    const ridePoint = transform(0.7, 2.6);
    const ridePanel = transform(1.25, 3.5);
    const buttonBoard = label([config.button], ridePanel.x, 1.8, ridePanel.z, 1.7, 0.65, { bg: "#272e31", color: "#f9e6a6" });
    // These panels deliberately face the camera, keeping their destination readable.
    buttonBoard.rotation.y = 0;
    const cabinSpawn = transform(0, 2.5);
    const safeSpawn = transform(0, -2.2);
    let amount = 0, target = 0, pp = safeSpawn, canTravel = true;
    function contains(point) {
      if (!point) return false;
      return config.side === "west"
        ? point.x < config.x - 0.5 && point.x > config.x - 4.8 && Math.abs(point.z - config.z) < 2.2
        : point.z > config.z + 0.5 && point.z < config.z + 4.8 && Math.abs(point.x - config.x) < 2.2;
    }
    const api = {
      open() { target = 1; },
      close() { target = 0; doorBox.enabled = true; },
      setFloor,
      cabinSpawn,
      safeSpawn,
      contains,
      get isOpen() { return amount > 0.88; },
      update(dt, playerPosition, travelAllowed) {
        pp = playerPosition;
        canTravel = travelAllowed;
        amount = target > amount ? Math.min(target, amount + dt / 0.65) : Math.max(target, amount - dt / 0.65);
        for (const leaf of leaves) {
          const p = transform(leaf.sign * (0.9 + amount * 1.84), 0.035);
          leaf.mesh.position.x = p.x;
          leaf.mesh.position.z = p.z;
        }
        doorBox.enabled = amount < 0.88;
      },
    };
    interaction({
      key: config.key + "-call", x: callPoint.x, z: callPoint.z, reach: 3.15,
      label: "Panggil lift", enabled: () => canTravel && !contains(pp),
      run() { if (canTravel && !contains(pp)) api.open(); },
    }, callPanel.x, 1.2, callPanel.z, 1.15, 1.7, 1.1);
    interaction({
      key: config.key + "-ride", x: ridePoint.x, z: ridePoint.z, reach: 3.2,
      label: config.button, enabled: () => canTravel && contains(pp) && api.isOpen,
      run() { if (canTravel && contains(pp) && api.isOpen && ctx.onRide) ctx.onRide(); },
    }, ridePanel.x, 1.75, ridePanel.z, 1.8, 1.25, 0.9);
    return api;
  }

  function createLobby(ctx) {
    const b = builder(ctx);
    const { T, block, label, plant, collider } = b;
    b.root.name = "SOHO reception and left-turn lift corridor";
    // The ground-level lobby sits on a continuous paved podium, not in open sky.
    block(88,.32,72,0x6f6a68,-5,-.27,0).name='SOHO ground podium';
    for(const x of [-32,26])for(const z of [-23,19]){
      block(8,10,10,0x5b6166,x,4.7,z);
      for(let row=0;row<3;row++)for(let col=0;col<3;col++)
        block(.5,.65,.035,(row+col)%3?0xa7a29a:0xe9bd82,x-2+col*2,2+row*2.2,z+5.03);
    }
    const lobbyRoof=new T.Group();lobbyRoof.name='Lobby ceiling';lobbyRoof.visible=false;b.root.add(lobbyRoof);
    const roofMat=new T.MeshStandardMaterial({color:0xd7c6b5,roughness:.85,side:T.DoubleSide});
    const roofPanel=(w,d,x,y,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,.16,d),roofMat);mesh.position.set(x,y,z);lobbyRoof.add(mesh);};
    roofPanel(16.4,16.4,0,4.24,2);roofPanel(13.2,5.4,-14.3,3.74,0);
    for(const [x,z] of [[0,5],[0,-2],[-11,0]]){
      const lamp=new T.PointLight(0xffca91,.85,10);lamp.position.set(x,3.42,z);b.root.add(lamp);
      lobbyRoof.add(block(.75,.035,.75,0xffe3b6,x,4.08,z));
    }
    b.floor(0, 2, 16, 16, 0x77736f);
    b.floor(-12, 0, 8, 5, 0x77736f);
    // Marble joints and a runner make the left turn legible before reaching the desk.
    for (let x = -6; x <= 6; x += 2) block(0.012, 0.012, 15.8, 0xc0b9ae, x, 0.002, 2);
    for (let z = -4; z <= 8; z += 2) block(15.8, 0.012, 0.012, 0xc0b9ae, 0, 0.002, z);
    block(3, 0.024, 8.4, 0xac7b79, 0, 0.026, 4.3);
    block(11.8, 0.024, 2.3, 0xac7b79, -8.3, 0.026, 0);
    b.wall(0, -6, 16, 0.28, 4.1);
    // Teal feature wall, timber fins and framed artwork break up the stone palette.
    block(8.3,3.65,.07,0x235d58,0,2.05,-5.8);
    for(let x=-7.5;x<7.6;x+=.42){
      if(Math.abs(x)<4.3)continue;
      block(.12,3.6,.1,0x805a3c,x,2,-5.78);
    }
    label(['SOHO / GALLERY','A place to meet'],7.82,2.55,3.2,3.1,1.65,{rotation:-Math.PI/2,bg:'#315d6c',color:'#f6d195'});
    b.wall(8, 2, 0.28, 16, 4.1);
    b.wall(-8, -4.25, 0.28, 3.5, 4.1);
    b.wall(-8, 6.25, 0.28, 7.5, 0.72);
    b.wall(-12, -2.5, 8, 0.25, 3.5);
    b.wall(-12, 2.5, 8, 0.25, 0.62);
    b.wall(-5.1, 10, 5.8, 0.26, 0.7);
    b.wall(5.1, 10, 5.8, 0.26, 0.7);
    block(0.18, 3.4, 0.2, COLORS.brass, -2.18, 1.7, 9.95);
    block(0.18, 3.4, 0.2, COLORS.brass, 2.18, 1.7, 9.95);
    block(4.55, 0.15, 0.24, COLORS.brass, 0, 3.4, 9.95);
    label(["SOHO", "LOBBY RECEPTION"], 0, 3.1, -5.69, 5.4, 1.3,{bg:'#164942',color:'#ffe3ac'});
    label([b.name, "Wedding · Ballroom Lantai 9"], 0, 1.28, -1.89, 4.7, 0.85, { bg: "#684c3b", color: "#fff2d6" });
    // Reception counter sits ahead of the entrance and leaves both sides walkable.
    block(5.7, 1.3, 1.6, COLORS.wood, 0, 0.65, -2.75);
    block(5.95, 0.15, 1.78, COLORS.white, 0, 1.37, -2.75);
    block(5.6, 0.06, 0.07, COLORS.gold, 0, 0.18, -1.91);
    collider(0, -2.75, 2.96, 0.88);
    block(0.75, 0.44, 0.07, COLORS.dark, -1.3, 1.68, -2.83).rotation.x = -0.1;
    block(0.45, 0.03, 0.22, COLORS.dark, -1.3, 1.47, -2.65);
    const receptionist = ctx.makeChibi ? ctx.makeChibi({ skin: 0xe7b795, hair: 0x302723, long: true, shirt: 0x6e3542, sleeve: 0x6e3542, pants: 0x30333b, front: 0xf5e8cf, shoes: 0x292b2e }) : null;
    if (receptionist) receptionist.g.position.set(0.6, 0.05, -4.05);
    b.interaction({
      key: "receptionist", x: 0.6, z: -0.65, reach: 3.2, label: "Sapa resepsionis",
      run() { if (ctx.say) ctx.say("Resepsionis SOHO", ["Selamat datang di pernikahan " + b.name + ".", "Belok kiri, lalu naik lift ke ballroom lantai 9."]); },
    }, 0.6, 1.3, -3.9, 1.5, 2.7, 1.4);
    label(["← LIFT BALLROOM", "LANTAI 9 · " + b.name], -5.25, 2.25, -5.69, 4.3, 1.25);
    label(["← LIFT", "Ballroom · Lantai 9"], -11.3, 2.5, -2.32, 4.5, 1.1);
    // A floor arrow reinforces the turn without taking over the walking controls.
    const arrow = new T.Shape();
    arrow.moveTo(-0.9, 0); arrow.lineTo(-0.05, 0.65); arrow.lineTo(-0.05, 0.23); arrow.lineTo(1, 0.23);
    arrow.lineTo(1, -0.23); arrow.lineTo(-0.05, -0.23); arrow.lineTo(-0.05, -0.65); arrow.closePath();
    const floorArrow = new T.Mesh(new T.ShapeGeometry(arrow), new T.MeshBasicMaterial({ color: 0xf6e4bf, side: T.DoubleSide }));
    floorArrow.rotation.x = -Math.PI / 2;
    floorArrow.position.set(-4.6, 0.05, 0);
    b.root.add(floorArrow);
    plant(-6.75, -4.65, 1.1);
    plant(6.7, -4.5, 1.1);
    plant(6.9, 8.6, 0.9);
    // Waiting seats occupy the right edge rather than the entrance-to-lift route.
    for (const z of [1, 5.5]) {
      block(1.7, 0.45, 2.5, COLORS.rose, 6.35, 0.35, z);
      block(0.25, 0.75, 2.5, COLORS.rose, 7.1, 0.7, z);
      block(1.7, 0.45, 0.18, COLORS.wood, 6.35, 0.72, z - 1.2);
      block(1.7, 0.45, 0.18, COLORS.wood, 6.35, 0.72, z + 1.2);
      collider(6.35, z, 0.9, 1.3);
    }
    const lift = elevator(ctx, b, { key: "lobby-lift", side: "west", x: -16, z: 0, floor: "LOBBY", button: "9 · Ballroom" });
    let exitPending = false, elapsed = 0;
    return {
      boxes: b.boxes, circles: b.circles, interactions: b.interactions, picks: b.picks,
      walkAreas: [{ x0: -8, x1: 8, z0: -6, z1: 10.4, y: 0 }, { x0: -21, x1: -7.9, z0: -2.5, z1: 2.5, y: 0 }],
      navNodes: [{ x: 0, z: 8 }, { x: 0, z: 4 }, { x: 0, z: 0 }, { x: -5, z: 0 }, { x: -9, z: 0 }, { x: -13.8, z: 0 }, { x: -15.1, z: 0 }, { x: -18.5, z: 0 }],
      spawn: { x: 0, z: 8 }, bounds: { x0: -21, x1: 8, z0: -6, z1: 10.4 }, elevator: lift,
      update(dt, pp, canTravel) {
        elapsed += dt;
        lift.update(dt, pp, canTravel);
        if (receptionist) {
          receptionist.body.position.y = Math.sin(elapsed * 2) * 0.015;
          receptionist.head.rotation.y = Math.sin(elapsed * 0.4) * 0.08;
        }
        if (pp.z < 8.8) exitPending = false;
        if (canTravel && !exitPending && pp.z > 9.55 && Math.abs(pp.x) < 1.85) {
          exitPending = true;
          if (ctx.onExit) ctx.onExit();
        }
      },
    };
  }

  function createFoyer(ctx) {
    const b = builder(ctx);
    const { T, block, label, plant } = b;
    b.root.name = "Ninth-floor wedding foyer";
    // A building body below floor nine and a low-detail skyline give TPP an exterior context.
    block(46,18,36,0x7b7776,11,-9,3).name='Ninth-floor building body';
    const skyline=[[47,-26,12,25],[61,-11,10,31],[50,12,14,23],[70,30,13,34],
      [-27,-42,15,22],[1,-51,13,30],[31,-47,17,27]];
    for(const [x,z,w,h] of skyline){
      block(w,h,w*.73,0x53616b,x,-18+h/2,z);
      for(let row=0;row<5;row++)for(let col=0;col<3;col++){
        const lit=(row*7+col*3+Math.round(x))%4!==0;
        block(.75,.48,.025,lit?0xd7b797:0x8ba0ae,
          x-w*.33+col*w*.33,-15+row*(h-4)/5,z+w*.365+.02);
      }
    }
    const foyerRoof=new T.Group();foyerRoof.name='Foyer ceiling';foyerRoof.visible=false;b.root.add(foyerRoof);
    const foyerRoofMat=new T.MeshStandardMaterial({color:0xded6cd,roughness:.82,side:T.DoubleSide});
    const foyerPanel=new T.Mesh(new T.BoxGeometry(12,.16,24),foyerRoofMat);
    foyerPanel.position.set(28,4.12,0);foyerRoof.add(foyerPanel);
    for(const z of [-9,-3,3,9]){
      const light=new T.PointLight(0xffdbaf,.55,7);light.position.set(28,3.55,z);b.root.add(light);
      foyerRoof.add(block(.55,.035,.55,0xffe6bd,28,4.02,z));
    }
    // Guests face -Z on leaving the lift: reception +X, ballroom -X, terrace straight ahead.
    b.floor(28,0,12,24,0xc9c6be);
    for(let x=22;x<=34;x+=2)block(.018,.012,24,0x939995,x,.006,0);
    for(let z=-12;z<=12;z+=2)block(12,.012,.018,0x939995,28,.006,z);
    block(2.7,.025,21,0xa77873,28,.026,.5);
    block(7.3,.025,2.6,0xa77873,25.3,.027,-2);
    // Low camera-side walls are cutaways; colliders still enclose the real corridor.
    b.wall(34,0,.24,24,1.05);
    b.wall(34,-6,.24,12,3.85);
    // Glazed right-hand wall beyond the reception desk opens to the city view.
    const cityGlass=new T.Mesh(new T.BoxGeometry(.07,2.8,11.6),
      new T.MeshPhongMaterial({color:0x9eb2bd,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));
    cityGlass.position.set(34,2.45,6.1);b.root.add(cityGlass);
    for(const z of [1.1,4,7,10.9])block(.09,2.9,.07,0x8e999f,34,2.45,z);
    block(.1,.09,11.6,0x8e999f,34,3.88,6.1);
    b.wall(22,7,.24,10,.85);
    b.wall(24.1,12,4.2,.24,.75);b.wall(31.9,12,4.2,.24,.75);
    b.wall(24,-12,4,.24,3.8);b.wall(32,-12,4,.24,3.8);
    block(4.2,.18,.25,COLORS.brass,28,3.85,-12);
    // Automatic sliding glass doors; nearby guests trigger a damped opening.
    const glass=new b.T.MeshPhongMaterial({color:0xa4c6cb,transparent:true,opacity:.25,depthWrite:false,side:b.T.DoubleSide});
    const terraceLeaves=[-1,1].map(side=>{
      const group=new b.T.Group();group.position.set(28+side,0,-11.78);b.root.add(group);
      const leaf=new b.T.Mesh(new b.T.BoxGeometry(1.95,3.45,.06),glass);leaf.position.y=1.75;group.add(leaf);
      for(const dx of [-.96,.96]){
        const frame=new b.T.Mesh(new b.T.BoxGeometry(.055,3.5,.08),b.material(0x9faeaf));frame.position.set(dx,1.75,.05);group.add(frame);
      }
      const handle=new b.T.Mesh(new b.T.BoxGeometry(.06,.8,.12),b.material(COLORS.brass));handle.position.set(-side*.7,1.8,.1);group.add(handle);
      return {side,group};
    });
    const terraceDoorCollider=b.collider(28,-11.78,2,.12);terraceDoorCollider.automatic=true;
    let terraceOpening=0;
    label(['LANTAI 9',b.name,'← BALLROOM'],24.4,3.35,1,3.5,1.5,{bg:'#583f32',color:'#ffedc4'});
    // White drapes/florals frame the side-facing ballroom doorway, not the old front entrance.
    for(const z of [-4.65,.65]){
      block(.25,4.6,.38,0xf5ead7,22.45,2.3,z);
      plant(23.15,z,0.8);
      const bouquet=new b.T.Mesh(new b.T.IcosahedronGeometry(.43,1),b.material(0xe4b9b9));
      bouquet.position.set(23.15,1.6,z);b.root.add(bouquet);
    }
    block(.3,.45,5.5,0xf5ead7,22.45,4.35,-2);
    // Ivory, fabric-draped reception counter faces the ballroom door.
    block(1.35,1.12,5.8,0xede6df,32,.56,-2);
    block(1.55,.12,6,0xfffbf3,32,1.18,-2);
    block(.06,.08,5.65,0xaaa9a5,31.3,.22,-2);
    b.collider(32,-2,.8,3);
    label(['PENERIMAAN TAMU',b.name],31.28,.82,-2,4.8,.7,{rotation:-Math.PI/2,bg:'#f8f4ef',border:'#aeb2b2',color:'#65535e'});
    label(['PENERIMAAN TAMU','Ballroom di sebelah kiri'],33.3,3.45,-2,4.55,.76,{rotation:-Math.PI/2,bg:'#f8f4ef',border:'#aeb2b2',color:'#65535e'});
    // Guest book and flower arrangements. Greeting does not require an RSVP submission.
    block(.6,.04,.85,0x6c534a,31.8,1.27,-2.1);
    block(.53,.015,.75,0xfff8e9,31.8,1.3,-2.1);
    for(let z=-4.8;z<.9;z+=.27)block(.07,.82,.038,z%2?0xfffaf4:0xf0e9e3,31.27,.57,z);
    // Curving foliage and small five-petal blossoms echo the ballroom procession.
    const floristPoints=[];
    const archPoints=[];
    for(let i=0;i<=34;i++){
      const t=i/34,z=-5.38+t*6.76,y=4.1+.38*Math.sin(Math.PI*t);
      archPoints.push(new b.T.Vector3(33.37,y,z));
      floristPoints.push([33.35,y,z]);
    }
    const arch=new b.T.Mesh(new b.T.TubeGeometry(new b.T.CatmullRomCurve3(archPoints),48,.045,6,false),b.material(0x557654));
    b.root.add(arch);
    for(const z of [-5.38,1.38]){
      block(.055,3.4,.055,0x9fa9a8,33.37,2.43,z);
      for(let i=0;i<13;i++)floristPoints.push([33.32,1.05+i*.25,z]);
    }
    for(let i=0;i<24;i++)floristPoints.push([31.14,1.2+Math.sin(i*1.9)*.06,-4.8+i*.24]);
    for(const z of [-5.35,1.35])for(let i=0;i<10;i++){
      const a=i*2.399;
      floristPoints.push([31.58+Math.cos(a)*.3,.22+(i%3)*.1,z+Math.sin(a)*.33]);
    }
    const bloomColors=[0xfffcf5,0xe9a9bc,0xb985aa,0x916d9e];
    const petalBuckets=bloomColors.map(()=>[]),leaves=[];
    const pose=new b.T.Object3D();
    floristPoints.forEach(([x,y,z],i)=>{
      for(let j=0;j<5;j++){
        const a=j*Math.PI*2/5;
        pose.position.set(x-.055,y+Math.cos(a)*.125,z+Math.sin(a)*.125);
        pose.rotation.set(a,0,0);pose.scale.set(.52,1.32,.68);pose.updateMatrix();
        petalBuckets[(i+j)%bloomColors.length].push(pose.matrix.clone());
      }
      for(let j=0;j<2;j++){
        pose.position.set(x+(j?.03:-.02),y-.16,z+(j?.16:-.16));
        pose.rotation.set(i*.7,0,j?.5:-.5);pose.scale.set(.55,1.7,.48);pose.updateMatrix();
        leaves.push(pose.matrix.clone());
      }
    });
    const petalGeo=new b.T.IcosahedronGeometry(.12,0);
    petalBuckets.forEach((bucket,i)=>{
      const flowers=new b.T.InstancedMesh(petalGeo,b.material(bloomColors[i]),bucket.length);
      bucket.forEach((matrix,j)=>flowers.setMatrixAt(j,matrix));
      flowers.instanceMatrix.needsUpdate=true;b.root.add(flowers);
    });
    const greenery=new b.T.InstancedMesh(new b.T.IcosahedronGeometry(.13,0),b.material(0x607d5e),leaves.length);
    leaves.forEach((matrix,i)=>greenery.setMatrixAt(i,matrix));
    greenery.instanceMatrix.needsUpdate=true;b.root.add(greenery);
    for(const z of [-5.35,1.35])b.circles.push({x:31.5,z,r:.55});
    const host=ctx.makeChibi?.({skin:0xe2b18a,hair:0x352722,long:true,shirt:0x6d394e,sleeve:0x6d394e,pants:0x3b343b,shoes:0x26272b});
    if(host){host.g.position.set(33.15,0,-2);host.g.rotation.y=-Math.PI/2;}
    b.interaction({key:'floor9-reception',x:30,z:-2,reach:2.7,label:'Sapa penerima tamu',run(){
      ctx.say('Penerima Tamu — Lantai 9',['Selamat datang di pernikahan '+b.name+'.','Pintu ballroom ada di sebelah kiri, tepat di seberang meja kami.','Untuk outdoor, lanjut lurus melalui pintu Sky Terrace, lalu belok kiri. Stall makanan berada di sisi kanan teras.']);
    }},32,1.4,-2,1.6,2.4,5.8);
    plant(32,8,1);plant(24,8,.85);
    const lift = elevator(ctx, b, { key: "floor9-lift", side: "north", x: 28, z: 12, floor: "9 · BALLROOM", button: "Turun ke Lobby" });
    let elapsed=0;
    return {
      boxes: b.boxes, circles: b.circles, interactions: b.interactions, picks: b.picks,
      walkAreas: [{x0:22,x1:34,z0:-12,z1:12,y:0},{x0:25.5,x1:30.5,z0:12,z1:17,y:0}],
      navNodes: [{x:28,z:14.5},{x:28,z:9.8},{x:28,z:4},{x:28,z:-2},{x:24,z:-2},{x:30,z:-2},{x:28,z:-9},{x:28,z:-13}],
      spawn: lift.safeSpawn, bounds: { x0:22,x1:34,z0:-12,z1:17 }, elevator: lift,
      terraceDoor:{get isOpen(){return terraceOpening>.84;},collider:terraceDoorCollider},
      update(dt, pp, canTravel) {
        elapsed+=dt;lift.update(dt,pp,canTravel);if(host)ctx.animChibi(host,false,dt,elapsed);
        const near=Math.abs(pp.x-28)<5&&Math.abs(pp.z+11.78)<6.5;
        terraceOpening+=((near?1:0)-terraceOpening)*(1-Math.exp(-4.5*dt));
        terraceLeaves.forEach(({side,group})=>group.position.x=28+side*(1+2.05*terraceOpening));
        terraceDoorCollider.enabled=terraceOpening<.84;
      },
    };
  }

  function createTerrace(ctx){
    const b=builder(ctx),{T,block,collider,label}=b;
    b.root.name='Sky Terrace — parallel to ballroom';
    const x0=ctx.terraceBounds?.x0??-12,x1=ctx.terraceBounds?.x1??34;
    const width=x1-x0,mid=(x0+x1)/2;
    // The main deck spans the complete ballroom + foyer facade. Only its old left overhang is trimmed.
    b.floor(mid,-29,width,14,0xaeb1ad).name='Sky Terrace main floor';
    b.floor(28,-21,12,2,0xaeb1ad).name='Sky Terrace entry spur';
    for(let x=x0;x<=x1;x+=2)block(.018,.012,14,0x858c8b,x,.009,-29);
    for(let z=-36;z<=-22;z+=2)block(width,.012,.018,0x858c8b,mid,.009,z);
    for(let x=22;x<=34;x+=2)block(.018,.012,2,0x858c8b,x,.009,-21);
    for(let z=-22;z<=-20;z+=2)block(12,.012,.018,0x858c8b,28,.009,z);
    // Tall continuous planter, palm row, and low green parapet match the supplied model.
    block(width-1.5,1.05,2.1,0x8d9490,mid,.525,-34.8);collider(mid,-34.8,(width-1.5)/2,1.05);
    block(width-1.3,.14,2.3,0xb2b8b0,mid,1.1,-34.8);
    block(width-1.8,.06,1.9,0x786e59,mid,1.2,-34.8);
    block(width,1.15,.2,0x739975,mid,1.55,-35.9);collider(mid,-35.9,width/2,.15);
    for(let x=x0+4;x<=x1-2;x+=8){
      const trunk=new T.Mesh(new T.CylinderGeometry(.15,.22,3.2,7),b.material(0xa88d66));trunk.position.set(x,2.75,-34.8);b.root.add(trunk);
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4;
        const leaf=new T.Mesh(new T.SphereGeometry(1,6,4),b.material(i%2?0x5b9363:0x76a981));
        leaf.scale.set(.28,.09,1.45);leaf.position.set(x+Math.sin(angle)*.95,4.25,-34.8+Math.cos(angle)*.95);
        leaf.rotation.set(.22,angle,0);b.root.add(leaf);
      }
    }
    for(let x=x0+2;x<=x1-2;x+=2.5){
      const shrub=new T.Mesh(new T.IcosahedronGeometry(.55,1),b.material(0x649367));
      shrub.position.set(x,1.6,-34.7);b.root.add(shrub);
    }
    // Arched canopy: translucent cutaway membrane keeps navigation visible from above.
    const roofGeometry=new T.PlaneGeometry(width,14,Math.max(8,Math.round(width/4)),12),pos=roofGeometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i)+mid,z=pos.getY(i)-29,t=(z+36)/14;
      pos.setXYZ(i,x,5.4+Math.sin(t*Math.PI)*1.6,z);
    }
    roofGeometry.computeVertexNormals();
    const membrane=new T.Mesh(roofGeometry,new T.MeshPhongMaterial({color:0xf3f5ef,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide}));
    membrane.name='Sky Terrace canopy';
    b.root.add(membrane);
    for(let x=x0+1;x<=x1-1;x+=5.3){
      const points=[];
      for(let i=0;i<=16;i++){const t=i/16;points.push(new T.Vector3(x,5.4+Math.sin(t*Math.PI)*1.6,-36+t*14));}
      const rib=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.065,6,false),b.material(0x7f9599));b.root.add(rib);
    }
    for(const z of [-35.8,-29,-22.2])block(width,.09,.09,0xa8b4b5,mid,5.4+Math.sin((z+36)/14*Math.PI)*1.6,z);
    for(const x of [x0+1,mid,x1-1])for(const z of [-35.8,-22.4]){
      block(.14,5.4,.14,0xa7b0ad,x,2.7,z);collider(x,z,.12,.12);
    }
    b.wall(x1,-28,.24,16,1.05);b.wall(x0,-29,.24,14,1.05);
    // Steps and a closed service gate at the far end; no dining tables or blue chairs.
    for(let i=0;i<4;i++)block(3.4,.08+i*.06,.6,0xadb1ac,x0+2.6,(.08+i*.06)/2,-30-i*.62);
    block(3.5,1.5,.1,0x657773,x0+2.6,1.3,-32.5);collider(x0+2.6,-32.5,1.8,.15);
    const vendors=[];
    const stalls=ctx.food?.stalls||[{name:'Sate Ayam'},{name:'Bakso'},{name:'Es Puter'}];
    // Walking west after the left turn: north (-Z) is the right-hand side.
    const stallXs=[x0+5,mid-4,x1-13];
    stallXs.forEach((x,i)=>{
      const z=-31.3,item=stalls[i%stalls.length],accent=[0x96564d,0x48675a,0x526779][i];
      block(5,1.2,1.65,0xd9cfb9,x,.6,z);block(5.3,.15,1.9,0x73513b,x,1.28,z);
      block(5,.7,.06,accent,x,.75,z+.86);collider(x,z,2.7,1.05);
      for(const side of [-1,1])block(.12,3.1,.12,0x98784f,x+side*2.45,1.55,z-.7);
      block(5.5,.18,2.4,accent,x,3.15,z);label([item.name],x,2.85,z+1.22,4.8,.62,{bg:'#f3e6cb',color:'#3c443e'});
      for(const dx of [-1.3,0,1.3]){
        const tray=new T.Mesh(new T.CylinderGeometry(.4,.35,.18,12),b.material(0xb4b9ad));tray.position.set(x+dx,1.47,z);b.root.add(tray);
      }
      const npc=ctx.makeChibi?.({skin:0xd8a67e,hair:0x342722,shirt:accent,sleeve:accent,pants:0x31363b,front:0xf2e6ca,shoes:0x262629});
      if(npc){b.root.add(npc.g);npc.g.position.set(x,0,z-1.35);vendors.push(npc);}
      b.interaction({key:'terrace-stall-'+i,x,z:z+2.25,reach:2.5,label:'Ambil '+item.name,run(){ctx.say(item.vendor||'Stall Outdoor',[item.line||('Silakan menikmati '+item.name+' di Sky Terrace.'),'Selamat menikmati wedding '+b.name+'!']);}},x,1.5,z,5.3,3,2);
    });
    // Move the entire terrace eight units nearer; transform gameplay coordinates too.
    b.root.position.z=8;
    for(const item of [...b.boxes,...b.circles,...b.interactions])item.z+=8;
    let elapsed=0;
    return {boxes:b.boxes,circles:b.circles,interactions:b.interactions,picks:b.picks,
      walkAreas:[{x0:x0+.2,x1:x1-.2,z0:-27.8,z1:-14.3,y:0},{x0:22.2,x1:x1-.2,z0:-14.3,z1:-12,y:0}],
      navNodes:[{x:28,z:-13},{x:28,z:-18},{x:21,z:-18},{x:10,z:-18},{x:0,z:-18},{x:x0+4,z:-18},{x:x0+3,z:-20},...stallXs.map(x=>({x,z:-21.05}))],
      update(dt){elapsed+=dt;vendors.forEach(npc=>ctx.animChibi(npc,false,dt,elapsed));}
    };
  }

  window.WeddingLobby = { createLobby, createFoyer, createTerrace };
})();
