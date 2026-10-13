/* Central Park 2 / SOHO approach. Coordinates remain in the GLB's native space. */
(function () {
  "use strict";

  async function create(ctx) {
    const T = ctx.THREE;
    const scene = ctx.scene;
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;
    const boxes = [], circles = [], interactions = [], picks = [];
    const couple = ctx.couple || "Aji & Vania";
    const date = ctx.date || "10 Juli 2027";
    const model = await new Promise((resolve, reject) => {
      new T.GLTFLoader().load(
        "assets/central_park_2_soho_full.glb",
        gltf => resolve(gltf.scene),
        event => { if (ctx.onProgress) ctx.onProgress(event.loaded, event.total); },
        reject,
      );
    });
    model.name = "Central Park 2 & SOHO";
    const repaired = new Set();
    const replace = /^(soho_lobby_dark_entry_recess|soho_lobby_door_glass|soho_glass_door_stiles|soho_door_lower_glass_geometric_film|soho_door_handles)__/;
    model.traverse(object => {
      if (/SpawnMarker_HIDE_AFTER_SETUP|navigation_waypoint_markings/.test(object.name)) object.visible = false;
      if (replace.test(object.name)) object.visible = false;
      if (mobile && /^(led_horizontal_mesh|led_vertical_mesh|soho_cobble_vertical_joints)__/.test(object.name)) object.visible = false;
      if (!object.isMesh) return;
      // The mesh groups contain many disconnected objects. Do not use their
      // aggregate bounding boxes as gameplay colliders.
      object.castShadow = /^(main_podium|canopy_wide_roof|soho_complex_podium_mass|soho_canopy_drop_ceiling_slab|soho_canopy_front_supports|planter_raised_stone)__/.test(object.name);
      object.receiveShadow = /ground|plaza|sidewalk|road_surface|apron|footpath|living_wall/.test(object.name);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (repaired.has(material)) return;
        repaired.add(material);
        // Textured materials were exported with byte-valued (1,1,1,1), which
        // became 1/255 in glTF. Keep alpha maps/blending, repair only that bug.
        if (material.map && Math.max(material.color.r, material.color.g, material.color.b) < 0.005) {
          material.color.setRGB(1, 1, 1);
          if (material.opacity < 0.005) material.opacity = 1;
        }
        // Exporter palette is sRGB, whereas glTF factors are required to be linear.
        if (!material.map) material.color.convertSRGBToLinear();
        if (material.emissive) material.emissive.convertSRGBToLinear();
        material.envMapIntensity = 0.45;
        if (material.map) material.map.anisotropy = Math.min(4,ctx.renderer.capabilities.getMaxAnisotropy());
        if (material.name === "SOHO_Canopy_Glass") {
          material.transparent = true;
          material.opacity = 0.28;
          material.depthWrite = false;
        } else if (material.transparent) {
          material.depthWrite = false;
          material.alphaTest = 0.015;
        }
        if (material.map && /Signage|Identifier|Logo/.test(material.name)) {
          material.emissiveMap = material.map;
          material.emissive.setRGB(0.25, 0.25, 0.25);
        }
        material.needsUpdate = true;
      });
    });
    scene.add(model);

    // Small procedural environment: reflections without another network asset.
    const skyCanvas=document.createElement('canvas');skyCanvas.width=256;skyCanvas.height=128;
    const skyContext=skyCanvas.getContext('2d'),gradient=skyContext.createLinearGradient(0,0,0,128);
    gradient.addColorStop(0,'#578ba9');gradient.addColorStop(.48,'#b8d9e4');
    gradient.addColorStop(.52,'#d6bd93');gradient.addColorStop(1,'#40515b');
    skyContext.fillStyle=gradient;skyContext.fillRect(0,0,256,128);
    const skyTexture=new T.CanvasTexture(skyCanvas);skyTexture.encoding=T.sRGBEncoding;
    const pmrem=new T.PMREMGenerator(ctx.renderer),environment=pmrem.fromEquirectangular(skyTexture);
    scene.parent.environment=environment.texture;skyTexture.dispose();pmrem.dispose();

    const materials = {
      gold: new T.MeshStandardMaterial({ color: 0xb89453, roughness: 0.36, metalness: 0.55 }),
      dark: new T.MeshStandardMaterial({ color: 0x24363a, roughness: 0.72 }),
      metal: new T.MeshStandardMaterial({ color: 0xaab9bd, roughness: 0.28, metalness: 0.58 }),
      cream: new T.MeshStandardMaterial({ color: 0xf0e7d4, roughness: 0.85, emissive: 0x21190d }),
      glass: new T.MeshStandardMaterial({ color: 0xaad7df, roughness: 0.13, metalness: 0.16, transparent: true, opacity: 0.38, depthWrite: false }),
      glow: new T.MeshBasicMaterial({ color: 0xffe5ae }),
    };
    function box(w, h, d, x, y, z, material, parent = scene) {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function blocker(x, z, hw, hd) {
      const b = { x, z, hw, hd };
      boxes.push(b);
      return b;
    }
    function canvasTexture(draw, width = 1024, height = 640) {
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      draw(canvas.getContext("2d"), width, height);
      const texture = new T.CanvasTexture(canvas);
      texture.encoding = T.sRGBEncoding;
      texture.anisotropy = 4;
      return texture;
    }
    function sign(x, z, rotation, destination, key) {
      const group = new T.Group();
      group.position.set(x, 0.1, z); group.rotation.y = rotation;
      scene.add(group);
      box(5.8, 3.75, 0.18, 0, 3.3, 0, materials.gold, group);
      box(4.8, 0.16, 1.45, 0, 0.1, 0, materials.dark, group);
      [-2.25, 2.25].forEach(px => box(0.13, 2.25, 0.16, px, 1.25, 0, materials.gold, group));
      const texture = canvasTexture((c, w, h) => {
        c.fillStyle = "#203c3a"; c.fillRect(0, 0, w, h);
        c.strokeStyle = "#c9ac71"; c.lineWidth = 3; c.strokeRect(22, 22, w - 44, h - 44);
        c.textAlign = "center";
        c.fillStyle = "#d9c397"; c.font = "500 27px sans-serif";
        c.fillText("THE WEDDING OF", w / 2, 100);
        c.fillStyle = "#fff7e6"; c.font = "bold 79px Georgia, serif";
        c.fillText(couple, w / 2, 215, w - 90);
        c.fillStyle = "#dfd4bb"; c.font = "30px sans-serif";
        c.fillText(date, w / 2, 281, w - 90);
        c.strokeStyle = "#c9ac71"; c.beginPath(); c.moveTo(170, 325); c.lineTo(w - 170, 325); c.stroke();
        c.fillStyle = "#fff7e6"; c.font = "bold 42px sans-serif";
        c.fillText(destination, w / 2, 414, w - 65);
        c.fillStyle = "#dfc488"; c.font = "bold 34px sans-serif";
        c.fillText("BALLROOM · LANTAI 9", w / 2, 492);
        c.fillStyle = "#d9dace"; c.font = "25px sans-serif";
        c.fillText("Selamat datang, tamu terkasih", w / 2, 558);
      });
      const face = new T.Mesh(new T.PlaneGeometry(5.57, 3.5), new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }));
      face.position.set(0, 3.3, 0.101); group.add(face);
      face.userData.inter = key; picks.push(face);
      // Collider follows the physical board orientation, not its text plane.
      if (Math.abs(Math.sin(rotation)) > 0.5) blocker(x, z, 0.65, 2.85);
      else blocker(x, z, 2.85, 0.65);
      interactions.push({ key, x, z, approach:{x,z:z+3}, reach: 7, label: "Petunjuk wedding", run: () => ctx.say("Wedding " + couple + " ada di ballroom lantai 9. Masuk melalui pintu di samping logo SOHO, temui resepsionis, lalu belok kiri menuju lift.") });
    }
    sign(5, 64.9, 0, "SEBERANGI ZEBRA CROSS →", "mall-wedding-welcome");
    sign(24, 48.5, 0, "ENTRANCE SOHO →", "mall-wedding-east");
    sign(78, 47.6, 0, "ENTRANCE SOHO ↗", "mall-wedding-soho");
    sign(94.4, 37.8, 0, "MASUK DI SINI →", "mall-wedding-door");

    // Flat, restrained wayfinding arrows on the pedestrian strip.
    const arrowTexture = canvasTexture((c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "#d8b66e";
      c.beginPath(); c.moveTo(w * 0.1, h * 0.35); c.lineTo(w * 0.62, h * 0.35);
      c.lineTo(w * 0.62, h * 0.1); c.lineTo(w * 0.94, h * 0.5);
      c.lineTo(w * 0.62, h * 0.9); c.lineTo(w * 0.62, h * 0.65);
      c.lineTo(w * 0.1, h * 0.65); c.closePath(); c.fill();
    }, 256, 128);
    const arrowMaterial = new T.MeshBasicMaterial({ map: arrowTexture, transparent: true, opacity: 0.85, depthWrite: false });
    [[14, 50.8, 0], [37, 50.8, 0], [63, 50.8, 0], [87, 50.8, 0], [101, 45, Math.PI / 2], [101, 38, Math.PI / 2]].forEach(([x, z, angle]) => {
      const arrow = new T.Mesh(new T.PlaneGeometry(2.7, 1.35), arrowMaterial);
      arrow.rotation.set(-Math.PI / 2, 0, angle);
      arrow.position.set(x, 0.115, z); scene.add(arrow);
    });

    // Replace the monolithic entrance glazing with fixed side windows and a
    // narrow sliding door. The mural, living walls and SOHO lettering remain.
    const doorX = 101, doorZ = 32.04, doorHalf = 2.6;
    const opening = new T.Group(); opening.name = "SOHO automatic entrance"; scene.add(opening);
    [-1, 1].forEach(side => {
      const fixedX = doorX + side * 7.72;
      box(10.2, 6.38, 0.15, fixedX, 3.55, doorZ, materials.glass, opening);
      box(10.2, 1.65, 0.06, fixedX, 1.6, doorZ + 0.1, materials.cream, opening);
      for (let i = 0; i < 4; i++) box(0.09, 6.45, 0.18, doorX + side * (doorHalf + i * 3.4), 3.5, doorZ + 0.1, materials.metal, opening);
    });
    box(5.55, 0.18, 0.36, doorX, 6.78, doorZ, materials.metal, opening);
    box(5.7, 0.07, 1.4, doorX, 0.09, doorZ + 0.3, materials.cream, opening);
    box(5.4, 0.07, 0.16, doorX, 6.65, doorZ + 0.24, materials.glow, opening);
    // Small illuminated vestibule behind the working leaves; travel happens
    // before reaching the solid podium wall of the source model.
    box(5.25, 6.3, 0.08, doorX, 3.35, 30.0, materials.cream, opening);
    box(5.25, 0.08, 2.7, doorX, 0.1, 31.35, materials.cream, opening);
    [-1, 1].forEach(side => box(0.12, 6.3, 2.1, doorX + side * 2.64, 3.35, 31.05, materials.gold, opening));
    const leaves = [-1, 1].map(side => {
      const group = new T.Group();
      group.position.set(doorX + side * 1.3, 0, doorZ + 0.12);
      opening.add(group);
      box(2.55, 6.32, 0.11, 0, 3.52, 0, materials.glass, group);
      [-1.27, 1.27].forEach(x => box(0.08, 6.4, 0.14, x, 3.52, 0.025, materials.metal, group));
      box(2.56, 0.09, 0.14, 0, 0.33, 0.03, materials.metal, group);
      box(2.56, 0.09, 0.14, 0, 6.72, 0.03, materials.metal, group);
      box(0.07, 1.0, 0.14, -side * 0.97, 3.1, 0.16, materials.metal, group);
      box(2.5, 0.18, 0.04, 0, 2.55, 0.09, materials.cream, group);
      return { side, group };
    });

    // Explicit building perimeter and source-model street furniture.
    // The curved mall front is approximated with short axis-aligned strips.
    for (let x = -60; x <= 60; x += 4) {
      const front = 23.2 + 9.4 * (1 - Math.pow(x / 65, 2)) + 1.8;
      blocker(x, (front - 34) / 2, 2.02, (front + 34) / 2);
    }
    blocker(67.8, 18.1, 5.2, 17.5);
    blocker((72 + doorX - doorHalf) / 2, 31.5, (doorX - doorHalf - 72) / 2, 0.63);
    blocker((doorX + doorHalf + 148) / 2, 31.5, (148 - doorX - doorHalf) / 2, 0.63);
    const doorCollider = blocker(doorX, doorZ, doorHalf, 0.2);
    doorCollider.enabled = true;
    [-54.5, 52.5].forEach(x => [41, 47.8, 67.1].forEach(z => blocker(x, z, 5.5, 1.7)));
    [[-60, 44], [-43, 48], [46, 48], [61, 44], [-59, 67], [60, 67]].forEach(([x, z]) => circles.push({ x, z, r: 0.4 }));
    [-36, -23, 18, 33].forEach(x => circles.push({ x, z: 23.2 + 9.4 * (1 - Math.pow(x / 65, 2)) + 9, r: 0.7 }));
    [-56, -38, 38, 56].forEach(x => [39, 48.5].forEach(z => circles.push({ x, z, r: 0.15 })));
    [72, 130].forEach(x => circles.push({ x, z: 52.8, r: 0.45 }));
    [74, 85.7, 116.8, 128.2].forEach(x => circles.push({ x, z: 45.6, r: 0.42 }));
    blocker(88.7, 41.25, 0.7, 0.42);
    blocker(119.4, 42.5, 0.85, 0.575);

    // Shop windows, planted seating and passers-by give the approach a mall scale.
    // Decorations stay off the navigation spine and share their low-poly geometry.
    const foliage = new T.MeshStandardMaterial({color:new T.Color('#36734d').convertSRGBToLinear(),roughness:.9});
    const terracotta = new T.MeshStandardMaterial({color:new T.Color('#a55f43').convertSRGBToLinear(),roughness:.85});
    const leafGeometry = new T.IcosahedronGeometry(1,1);
    const leavesInstanced = new T.InstancedMesh(leafGeometry,foliage,24);
    const dummy = new T.Object3D();let leafIndex=0;
    [[-14,66],[18,66],[34,44],[68,55],[111,54],[139,48]].forEach(([x,z])=>{
      box(2.8,.7,1.5,x,.4,z,terracotta);blocker(x,z,1.4,.75);
      for(let i=0;i<4;i++){
        dummy.position.set(x-.95+i*.64,1.15+(i%2)*.2,z);dummy.scale.set(.7,.8,.65);
        dummy.updateMatrix();leavesInstanced.setMatrixAt(leafIndex++,dummy.matrix);
      }
      box(3,.18,.7,x,.85,z+1.6,materials.dark);blocker(x,z+1.6,1.5,.35);
      [-1,1].forEach(s=>box(.12,.7,.55,x+s*1.1,.4,z+1.6,materials.metal));
    });
    leavesInstanced.castShadow=true;scene.add(leavesInstanced);
    const shopColors=['#235857','#a84c50','#ab7138','#305b83'];
    const shopTitles=['BOTANICA','STUDIO / 02','THE COFFEE BAR','CITY SELECT'];
    [-40,-23,22,39].forEach((x,i)=>{
      const z=23.2+9.4*(1-Math.pow(x/65,2))+2.05;
      const map=canvasTexture((c,w,h)=>{
        c.fillStyle=shopColors[i];c.fillRect(0,0,w,h);
        c.fillStyle='#eacb8e';c.fillRect(0,h*.14,w,4);
        c.textAlign='center';c.fillStyle='#fff2d1';c.font='bold 51px sans-serif';c.fillText(shopTitles[i],w/2,h*.3,w*.88);
        c.font='23px sans-serif';c.fillText('DISCOVER SOMETHING SPECIAL',w/2,h*.43);
        for(let j=0;j<5;j++){c.fillStyle=j%2?'#dbad76':'#d5ddd0';c.fillRect(w*(.12+j*.16),h*.57,w*.09,h*.24);}
        c.fillStyle='#172f35';c.fillRect(0,h*.88,w,h*.12);
      });
      const panel=new T.Mesh(new T.PlaneGeometry(11,4.5),new T.MeshBasicMaterial({map,toneMapped:false}));
      panel.position.set(x,3.3,z);scene.add(panel);
    });
    // Subtle LED shimmer is a local shader, not an expensive full-screen bloom pass.
    const ledTime={value:0};
    const campaign=canvasTexture((c,w,h)=>{
      const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#103f52');g.addColorStop(1,'#327875');
      c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<5;i++){
        c.strokeStyle=i%2?'#d2a665':'#57a6a0';c.lineWidth=12;
        c.beginPath();c.arc(w*.84,h*.55,100+i*48,0,Math.PI*2);c.stroke();
      }
      c.fillStyle='#efc997';c.font='28px sans-serif';c.fillText('CENTRAL PARK 2 / SOHO',w*.06,h*.22);
      c.fillStyle='#fff3de';c.font='bold 80px Georgia';c.fillText('Meet. Shop.',w*.06,h*.45);
      c.fillText('Celebrate.',w*.06,h*.62);
      c.fillStyle='#e6c692';c.font='29px sans-serif';c.fillText(couple+' · '+date,w*.06,h*.83,w*.8);
    },1024,512);
    model.traverse(o=>{
      if(!o.isMesh||o.material?.name!=='Curved_Media_LED')return;
      o.material.map=campaign;o.material.color.setRGB(1,1,1);
      o.material.emissiveMap=campaign;o.material.emissive.setRGB(.25,.25,.25);
      o.material.needsUpdate=true;
      o.material.onBeforeCompile=shader=>{
        shader.uniforms.mallTime=ledTime;
        shader.fragmentShader='uniform float mallTime;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',
          'gl_FragColor.rgb *= 0.97 + 0.03 * sin(gl_FragCoord.y * 0.7 + mallTime);\n#include <dithering_fragment>');
      };
      o.material.customProgramCacheKey=()=> 'mall-led-v1';
    });
    const shoppers=[];
    if(ctx.makeChibi){
      const outfits=[0xa34c49,0x287c7b,0x536fa6,0xc99842,0x796190,0x426950];
      const paths=[[[-10,46],[-31,46]],[[13,44],[30,44]],[[70,58],[89,58]],[[113,47],[125,47]],[[27,70],[40,70]],[[83,69],[109,69]]];
      paths.slice(0,mobile?4:6).forEach((points,i)=>{
        const npc=ctx.makeChibi({skin:0xdca77e,hair:0x342a26,long:i%2===0,shirt:outfits[i],sleeve:outfits[i],pants:0x263e55,shoes:0x29282b});
        scene.add(npc.g);npc.g.scale.setScalar(1.03);shoppers.push({npc,points,phase:i*1.7});
      });
    }
    let elapsed=0,openness = 0, crossed = false;
    return {
      boxes, circles, interactions, picks,
      walkAreas: [
        { x0: -65, x1: 69, z0: 35.6, z1: 73, y: 0.09 },
        { x0: 63, x1: 148, z0: 35.6, z1: 78, y: 0.09 },
        { x0: 73.1, x1: 147, z0: 32.3, z1: 42.5, y: 0.1 },
        { x0: 98.5, x1: 103.5, z0: 31.7, z1: 36, y: 0.18 },
      ],
      navNodes: [
        { x: 0, z: 68 }, { x: 0, z: 60 }, { x: 0, z: 50.8 },
        { x: 20, z: 50.8 }, { x: 44, z: 50.8 }, { x: 62, z: 50.8 },
        { x: 72, z: 49.9 }, { x: 82, z: 50.8 }, { x: 101, z: 50.8 },
        { x: 101, z: 43.5 }, { x: 101, z: 37.3 }, { x: 101, z: 32.4 },
        { x: 46, z: 44.3 }, { x: 59, z: 44.3 }, { x: 65, z: 46.3 },
        { x: 101, z: 65 }, { x: 123, z: 56 }, { x: 124, z: 40 },
      ],
      spawn: { x: 0, z: 68 },
      bounds: { x0: -65, x1: 148, z0: 31.7, z1: 78 },
      update(dt, playerPos, canTravel) {
        elapsed+=dt;ledTime.value=elapsed;
        shoppers.forEach(({npc,points,phase})=>{
          const t=(elapsed*.075+phase)%2,u=t<1?t:2-t;
          npc.g.position.set(points[0][0]+(points[1][0]-points[0][0])*u,.09,points[0][1]);
          npc.g.rotation.y=t<1?Math.PI/2:-Math.PI/2;
          if(points[1][0]<points[0][0])npc.g.rotation.y*=-1;
          if(ctx.animChibi)ctx.animChibi(npc,true,dt,elapsed);
        });
        const near = Math.abs(playerPos.x - doorX) < 6.5 && Math.abs(playerPos.z - doorZ) < 7;
        openness += ((near ? 1 : 0) - openness) * Math.min(1, dt * 5.5);
        leaves.forEach(leaf => { leaf.group.position.x = doorX + leaf.side * (1.3 + 2.7 * openness); });
        doorCollider.enabled = openness < 0.8;
        // Reset on re-entry from the lobby, where the player is placed at z36.5.
        if (playerPos.z > 35) crossed = false;
        if (!crossed && canTravel && openness > 0.8 && Math.abs(playerPos.x - doorX) < 2.05 && playerPos.z < 32.85) {
          crossed = true;
          ctx.onEnter();
        }
      },
    };
  }

  window.WeddingMall = { create };
})();
