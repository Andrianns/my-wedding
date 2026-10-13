"""Build extended Central Park 2 + SOHO Podomoro City pedestrian game scene.
Original procedural geometry, photo-derived architectural approximation only.
"""
import sys, os, math, random, io
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
import trimesh
sys.path.insert(0,'/mnt/data')
import central_park_2_generator as base
m=base.mod
M=base.M
mat=base.mat
R=random.Random(18)

M['soho_frame']=mat('SOHO_Deep_Graphite','#30353e',.58,.39)
M['soho_frame_light']=mat('SOHO_Brushed_Metal','#9da5ab',.74,.27)
M['soho_mirror']=mat('SOHO_Mirrored_Band','#8f9695',.82,.12)
M['soho_glass']=mat('SOHO_Lobby_Glass','#37616b',.44,.13)
M['soho_roofglass']=mat('SOHO_Canopy_Glass','#9fc5d5',.21,.10,alpha=True)
M['soho_plantdark']=mat('SOHO_Vertical_Living_Wall','#193b2d',.0,.97)
M['soho_maroon']=mat('SOHO_Living_Wall_Magenta','#653047',.01,.91)
M['soho_white']=mat('SOHO_Ivory_Panels','#e7e8e6',.13,.42)
M['soho_tile']=mat('SOHO_Entrance_Granite','#888f91',.26,.24)
M['soho_tile_dark']=mat('SOHO_Plaza_Cobblestone','#777d7e',.0,.93)
M['soho_polished']=mat('SOHO_Lobby_Floor','#bbc7c4',.36,.21)
M['soho_redmat']=mat('SOHO_Welcome_Mat','#843a44',.0,.97)
M['soho_arrowblue']=mat('SOHO_Blue_Sign','#0e6ec7',.16,.4)
M['soho_shadow']=mat('SOHO_Dark_Shadow','#1a2c2e',.05,.7)
M['soho_accent']=mat('SOHO_Cyan_Illuminated','#22b2ef',.04,.3,emissive=(.02,.25,.8))
M['soho_reflect']=mat('SOHO_Chrome_Reflective','#d2dce1',.75,.16)

# Generate hand-painted-looking plant surface: micro foliage and magenta ribbon.
def green_wall(w=1024,h=1024,band=0.28):
    im=Image.new('RGB',(w,h),(21,47,30));d=ImageDraw.Draw(im,'RGBA')
    centers=[]
    for j in range(12000):
        x=R.randrange(w); y=R.randrange(h)
        stripx=int(w*(band+0.035*math.sin(y/130)+0.014*math.cos(y/53)))
        maroon=abs(x-stripx)<w*.096
        if maroon:
            rgb=R.choice([(74,25,51),(91,28,60),(111,34,64),(66,22,43),(126,37,74)])
        else:
            rgb=R.choice([(19,54,27),(34,76,37),(25,62,35),(50,94,49),(65,113,54),(19,41,24),(58,83,39)])
        rx=R.randrange(3,10); ry=R.randrange(2,9)
        d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=(*rgb,R.randrange(165,250)))
    for y in range(0,h,26):
        d.line((0,y,w,y+R.randint(-8,8)), fill=(1,11,8,23), width=1)
    return im.filter(ImageFilter.GaussianBlur(.45))
M['soho_green_left']=mat('SOHO_Green_Wall_Left','#ffffff',0,.92,texture=green_wall(1024,1024,.25))
M['soho_green_right']=mat('SOHO_Green_Wall_Right','#ffffff',0,.92,texture=green_wall(1024,1024,.82))

def triangle_panel():
    im=Image.new('RGB',(1300,360),(239,238,234));d=ImageDraw.Draw(im)
    for row in range(7):
        for col in range(43):
            if R.random()<.19: continue
            cx=col*31+ R.randrange(-5,6);cy=row*53+R.randrange(-11,11)
            radius=R.randrange(5,15)
            a=R.choice([0,math.pi/3,math.pi*2/3,math.pi])
            vertices=[(cx+math.cos(a+k*math.tau/3)*radius,cy+math.sin(a+k*math.tau/3)*radius) for k in range(3)]
            d.polygon(vertices, fill=R.choice([(26,29,30),(17,20,23),(43,47,51)]))
    return im
M['soho_triangles']=mat('SOHO_Triangle_Geometric_Mural','#ffffff',.0,.75,texture=triangle_panel())

def text_image(txt, fg=(44,173,239,255), w=1000,h=300):
    im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    for px in range(200,15,-1):
        font=ImageFont.truetype(fontfile,px)
        b=d.textbbox((0,0),txt,font=font)
        if b[2]-b[0]<w*.9 and b[3]-b[1]<h*.80:break
    b=d.textbbox((0,0),txt,font=font);tw=b[2]-b[0];th=b[3]-b[1]
    xy=((w-tw)/2-b[0],(h-th)/2-b[1])
    d.text((xy[0]+4,xy[1]+3),txt,font=font,fill=(0,4,4,150))
    d.text(xy,txt,font=font,fill=fg)
    return im
M['soho_logo']=mat('SOHO_Electric_Blue_Logo','#ffffff',0,.75,emissive=(.04,.28,.68),texture=text_image('SOHO'),alpha=True)
M['soho_signpost']=mat('SOHO_Directional_Sign_Texture','#ffffff',0,.8,texture=text_image('TO  NEO SOHO  →',w=1000,h=380),alpha=True)
M['soho_gate_label']=mat('SOHO_Entrance_Label','#ffffff',0,.75,emissive=(.05,.16,.33),texture=text_image('SOHO PODOMORO CITY',w=1300,h=220),alpha=True)

# Side-podium sits to the right of the mall in the game coordinate system.
# Relative distance and compass alignment are artistic approximations, not georeferenced.
# Entrance axis x~103, z~35 ; visitor approaches from positive z.
# x 68..132, z -21..30, height 32 m, strip connectors to existing mall.
m.box('soho_complex_podium_mass__soho_frame',99.4,17.0,-1,64,34,61)
m.box('soho_complex_roof__soho_frame_light',99.4,34.3,-1,66,1.1,63)
# Office podium high window bands, front side beyond canopy
for y in [15.9,20.3,24.7,29.1]:
    m.box('soho_high_horizontal_bands__soho_frame_light',99.5,y,30.05,65,.36,.25)
for x in np.arange(69.2,131.2,4.8):
    m.box('soho_high_vertical_frames__soho_frame_light',float(x),24.1,30.13,.24,19.0,.34)
for x in np.arange(69,132,4.85):
    for yy in [17.7,22.1,26.5,30.9]:
        m.box('soho_high_glass_bays__soho_glass',float(x)+1.8,yy,30.20,4.2,3.5,.12)
m.box('soho_upper_eave__soho_white',99.4,33.9,30.4,67,.95,1.7)
# A setback suggests shared pedestrian access between two masses
m.box('soho_mall_connection_dark__soho_shadow',68.4,8.0,25.5,9,16,18)
for yy in [3.2,6.8,10.4]:
    m.box('soho_mall_connection_window__soho_glass',68.5,yy,35.0,8.6,2.65,.18)

# Entrance (built from the provided user's photograph)
# central glass doors with dark reflective mirror head panel
m.box('soho_lobby_dark_entry_recess__soho_shadow',101,4.4,31.4,26.2,8.8,.45)
m.box('soho_lobby_mirrored_headband__soho_mirror',101,8.02,31.65,25.6,1.26,.16)
m.box('soho_lobby_door_glass__soho_glass',101,3.56,31.76,25.6,6.4,.16)
for x in np.arange(88.1,114,3.1):
    m.box('soho_glass_door_stiles__soho_reflect',float(x),3.55,31.96,.095,6.4,.18)
m.box('soho_door_lower_glass_geometric_film__soho_triangles',101,1.55,32.02,25.6,1.85,.07)
m.box('soho_door_glass_toprail__soho_reflect',101,6.75,32.03,25.6,.14,.19)
for x in [99.2,102.5]:
    m.box('soho_door_handles__soho_reflect',x,3.15,32.12,.1,1.1,.11)
m.box('soho_door_bottom_tread__soho_reflect',101,.13,32.36,26.2,.18,1.05)
m.box('soho_red_welcome_mat__soho_redmat',101,.034,35.3,12.2,.05,2.15)
# busy black triangle panel above whole central door: iconic user photo
m.box('soho_triangle_slab_white__soho_white',101,10.1,31.25,27.1,5.1,.65)
m.quad('soho_triangle_pattern_front__soho_triangles', (87.5,7.55,31.76),(114.5,7.55,31.76),(114.5,12.58,31.76),(87.5,12.58,31.76),uv=[(0,1),(1,1),(1,0),(0,0)])
m.box('soho_triangle_cornice__soho_frame_light',101,12.85,31.80,28.0,.32,.7)
# photo: left and right monumental living wall, magenta plant feature running down
m.box('soho_left_planter_wall_base__soho_plantdark',79.8,6.7,31.36,15.9,12.8,1.12)
m.quad('soho_left_living_wall_photo_texture__soho_green_left',(71.9,.48,32.06),(87.6,.48,32.06),(87.6,12.94,32.06),(71.9,12.94,32.06),uv=[(0,1),(1,1),(1,0),(0,0)])
m.box('soho_right_planter_wall_base__soho_plantdark',122.0,6.7,31.36,16.4,12.8,1.12)
m.quad('soho_right_living_wall_photo_texture__soho_green_right',(114.4,.48,32.07),(129.95,.48,32.07),(129.95,12.94,32.07),(114.4,12.94,32.07),uv=[(0,1),(1,1),(1,0),(0,0)])
# left SOHO logo, cyan fluorescent on the greenery
m.quad('soho_wall_big_blue_logo__soho_logo',(76.5,3.8,32.14),(86.5,3.8,32.14),(86.5,6.6,32.14),(76.5,6.6,32.14),uv=[(0,1),(1,1),(1,0),(0,0)])
# R sided glazed foyer of adjacent commercial area
m.box('soho_far_right_glazed_store__soho_glass',138.3,6.8,30.8,16.7,13.4,.26)
for x in [130.2,134,138,142,146.5]:
    m.box('soho_storefront_vertical_mullions__soho_frame',x,6.9,31.05,.21,13.6,.28)
m.box('soho_storefront_sill__soho_reflect',138.3,.35,31.1,17,.28,.45)
# polished apron and pavers beneath canopy, larger forecourt immediately in front
m.box('soho_entry_granite_apron__soho_polished',101,.025,36.65,60,.12,11.7)
m.box('soho_entry_reflective_strip__soho_tile',101,.038,42.6,61,.10,1.0)
m.box('soho_side_cobblestone_plaza__soho_tile_dark',107,-.10,60.9,90,.17,38.5)
m.box('soho_access_footpath_link__soho_tile',69.5,.01,43.8,18,.13,17)
# horizontal brick courses in forecourt
for z in np.arange(43.0,81.0,0.86):
    m.box('soho_cobble_courses__soho_frame',107,-.002,float(z),90,.005,.023)
for ix,x in enumerate(np.arange(64,152,1.7)):
    start=R.choice([43.2,43.6,44.0])
    for z in np.arange(start,81.1,1.73):
        # tiny joints rather than expensive individual paved bricks
        m.box('soho_cobble_vertical_joints__soho_frame',float(x),-.001,float(z),.022,.006,.83)
# old mall sidewalk/road fades into this plaza with curb
m.box('soho_entry_curb__soho_white',104,.09,51.5,72,.2,.28)
# steel and glass canopy (photo has large grid with exposed diagonal rafters)
# 2 thin horizontal dark framing fascia bands, a wide glass roof 70..133 x 32..54
m.box('soho_canopy_rear_edge__soho_frame',100.7,13.9,32.55,64,.58,.43)
m.box('soho_canopy_front_edge__soho_frame',100.7,13.90,53.9,64,.58,.53)
for x in [68.6,132.8]:m.box('soho_canopy_side_edge__soho_frame',x,13.92,43.4,.53,.64,22)
for x in np.arange(70.0,133.1,6.2):
    m.box('soho_canopy_steel_front_to_back__soho_frame',float(x),13.80,43.35,.23,.41,22.3)
for z in [35.85,39.5,43.15,46.8,50.45]:
    m.box('soho_canopy_steel_crossmembers__soho_frame',100.8,13.88,z,64,.29,.24)
# roof clear panes slightly beneath structural crossmembers, full transparency
for x in np.arange(69.4,130.7,6.2):
    for z in np.arange(33.7,52.0,3.66):
        m.box('soho_canopy_glass_panels__soho_roofglass',float(x)+3.02,13.71,float(z)+1.80,5.80,.075,3.25)
# aluminum fascia below first roof edge, like photo's dark gray tiled slab
m.box('soho_canopy_drop_ceiling_slab__soho_frame',100.7,12.94,35.2,65,.8,4.3)
for xx in np.arange(70,132,2.8):
    m.box('soho_soffit_tile_joints__soho_frame_light',float(xx),12.53,35.2,.026,.025,4.0)
for z in [33.65,36.2]:
    m.box('soho_soffit_long_joints__soho_frame_light',100.6,12.53,z,64,.027,.018)
for x in [83.5,98.7,113.6,128]:
    m.box('soho_recessed_downlights__light',x,12.48,36.5,.35,.07,.35)
# Arched structural braces and outer tapered support columns
for x in [72.0,130.0]:
    m.tube('soho_canopy_front_supports__soho_frame_light',(x,.15,52.8),(x,13.7,52.8),.30,9)
for x in [71.9,129.9]:
    m.tube('soho_canopy_diagonal_braces__soho_frame',(x,8.5,52.8),(x,13.7,46.8),.21,7)
# bollards white with subtle triangles on white stone; locations from photo
for x in [74,85.7,116.8,128.2]:
    m.tube('soho_concrete_bollards_white__soho_white',(x,.12,45.6),(x,1.92,45.6),.39,10)
    m.box('soho_bollards_darker_base__soho_frame_light',x,.15,45.6,.68,.13,.68)
    for j in range(5):
        a=j*math.tau/5
        # visible black decorative perforations
        m.box('soho_bollard_triangle_slots__soho_frame',x+math.cos(a)*.4,.8+R.uniform(-.4,.55),45.6+math.sin(a)*.4,.12,.085,.1)
# Blue vertical sign, orange/white information column to either side of SOHO doorway
m.box('soho_left_information_terminal__soho_white',88.7,2.7,41.25,1.4,4.5,.84)
m.box('soho_left_digital_screen__soho_arrowblue',88.7,3.05,41.75,1.09,2.65,.06)
m.box('soho_right_direction_sign_base__soho_white',119.4,2.25,42.5,1.7,3.8,1.15)
m.box('soho_right_direction_sign_blue__soho_arrowblue',119.4,2.77,43.12,1.55,2.6,.10)
# Distinct lower-height retail strip to visually join with original mall site on side
m.box('soho_connection_awning__soho_white',67,7.5,35.2,16,.45,7.0)
for x in np.arange(60,75,3.5):
    m.box('soho_connection_glass_bays__glassblue',float(x),4.1,35.3,3.25,6.5,.22)

# Marker at SOHO spawn location (can be hidden with the same convention as original)
for i in range(36):
    a=i*math.tau/36;b=(i+1)*math.tau/36
    m.quad('SOHO_SpawnMarker_HIDE_AFTER_SETUP__soho_accent',
        (107+1.6*math.cos(a),.085,70+1.6*math.sin(a)),
        (107+1.6*math.cos(b),.085,70+1.6*math.sin(b)),
        (107+1.28*math.cos(b),.087,70+1.28*math.sin(b)),
        (107+1.28*math.cos(a),.087,70+1.28*math.sin(a)))
# permanent floor guides, made intentionally less eye catching
for (x,z) in [(107,49.5),(101,38),(101,33.8)]:
    for i in range(20):
        a=i*math.tau/20;b=(i+1)*math.tau/20
        m.quad('soho_navigation_waypoint_markings__soho_accent',
            (x+1.1*math.cos(a),.095,z+1.1*math.sin(a)),
            (x+1.1*math.cos(b),.095,z+1.1*math.sin(b)),
            (x+.93*math.cos(b),.097,z+.93*math.sin(b)),
            (x+.93*math.cos(a),.097,z+.93*math.sin(a)))

# Mesh-level raised details. These are intentionally actual GLB geometry rather than only flat photo textures,
# so the foliage and recognizable entrance mural remain visible in basic renderers.
for row in range(8):
    yy=7.85+row*.60
    for col in range(51):
        if R.random()<.25: continue
        xx=88.0+col*.512+R.uniform(-.13,.13)
        ry=R.uniform(.07,.25);rx=R.uniform(.10,.30)
        if xx+rx>114.3: continue
        orient=R.choice([-1,1]);v0=(xx-rx,yy-ry,31.91);v1=(xx+rx,yy-ry,31.91);v2=(xx+orient*.09,yy+ry,31.91)
        m.get('soho_triangle_mural_real_perforations__soho_frame').tri(v0,v1,v2)
# Sculpted plant texture with dense leaves, burgundy wavy accents.
for wall,xlow,xhigh in [('left',71.9,87.6),('right',114.4,129.95)]:
    for _ in range(4800):
        xx=R.uniform(xlow,xhigh);yy=R.uniform(.6,12.8)
        frac=(xx-xlow)/(xhigh-xlow)
        center=(.26 + .045*math.sin(yy/1.62)) if wall=='left' else (.82 + .048*math.sin(yy/1.65))
        is_burgundy=abs(frac-center)<.090
        suffix='soho_maroon' if is_burgundy else R.choice(['green','green2','soho_plantdark'])
        if yy>12.4:continue
        dz=32.10+R.uniform(.03,.23)
        rx=R.uniform(.055,.20);ry=R.uniform(.055,.17)
        flip=R.uniform(-.65,.65)
        m.get('soho_lush_plant_leaflets__'+suffix).tri((xx-rx,yy-ry,dz),(xx+rx,yy-ry*.3,dz),(xx+rx*.25+flip*.05,yy+ry,dz+.03))
# Font is converted into a shallow glowing pixel-shaped physical mesh.
logo=text_image('SOHO',(255,255,255,255),w=600,h=190).resize((145,46))
mask=np.asarray(logo.getchannel('A'))
x0,x1=76.8,86.15;y0,y1=4.02,6.28
hpx,wpx=mask.shape
for j in range(hpx):
    for i in range(wpx):
        if mask[j,i]<190:continue
        x=x0+(x1-x0)*i/wpx; y=y1-(y1-y0)*j/hpx
        dx=(x1-x0)/wpx*1.05;dy=(y1-y0)/hpx*1.04
        m.quad('soho_blue_sign_physical_letters__soho_accent',
              (x,y,32.39),(x+dx,y,32.39),(x+dx,y-dy,32.39),(x,y-dy,32.39))
# Vertical mullion breaks, a chrome ribbon below white mural, and entrance step
for x in np.arange(87.7,114.5,3.05):
    m.box('soho_mirrored_entrance_stainless_frames__soho_reflect',float(x),6.9,32.01,.10,1.65,.11)
m.box('soho_door_glass_threshold__soho_white',101,.1,34.35,26.3,.17,.28)
# cross-plaza guidance elements (not part of collision)
for x,z in [(105,63),(101,53)]:
    m.box('soho_guidance_path_silver_trim__soho_reflect',x,.01,z,5.5,.02,.06)

# Save both complete and isolated section (GLB only, embedded textures)
from trimesh.visual import TextureVisuals
full=m.mesh(True)
full.export('/mnt/data/central_park_2_soho_full.glb',file_type='glb')

# Soho-only scene: choose named elements and left transition pieces; no previous mall geometry
soho=trimesh.Scene()
for name, mesh in full.geometry.items():
    if name.startswith(('soho_','SOHO_')):
        soho.add_geometry(mesh,node_name=name,geom_name=name)
soho.export('/mnt/data/soho_podomoro_entrance.glb',file_type='glb')

for p in ['/mnt/data/central_park_2_soho_full.glb','/mnt/data/soho_podomoro_entrance.glb']:
    sc=trimesh.load(p,force='scene')
    print(os.path.basename(p),'MB=',round(os.path.getsize(p)/1048576,2),'mesh nodes=',len(sc.geometry),'bounds=',np.round(sc.bounds,1).tolist())
