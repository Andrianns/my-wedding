"""Original, procedural, game-ready architectural approximation of Central Park Mall 2 (ex Neo SOHO), Jakarta.
Uses street-photo proportions; NOT a CAD survey / Google Maps 3D extraction.
Coordinates: GLTF Y-up, meters approximately; +Z faces road/front.
Dependencies: numpy, trimesh, pillow.
"""
from __future__ import annotations
import math, random, os, io
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import trimesh
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

OUT=Path('/mnt/data')
R=random.Random(27)

def mat(name,hexcode,metallic=0,rough=.75,emissive=None,texture=None,alpha=False):
    h=hexcode.lstrip('#')
    rgb=[int(h[k:k+2],16)/255 for k in (0,2,4)]
    kw=dict(name=name,baseColorFactor=(*rgb,1),metallicFactor=metallic,roughnessFactor=rough, doubleSided=True)
    if emissive: kw['emissiveFactor']=tuple(emissive)
    if texture is not None:
        kw['baseColorTexture']=texture
        kw['baseColorFactor']=(1,1,1,1)
    if alpha: kw['alphaMode']='BLEND'
    return PBRMaterial(**kw)

M={
'core': mat('Facade_Dark_Charcoal','#303946',.25,.64),
'core_mid': mat('Facade_Steel_Gray','#5b6571',.36,.57),
'cladding': mat('Facade_Champagne_Gray','#9ea8b3',.27,.56),
'dark': mat('Mullion_Black_Steel','#202936',.62,.37),
'glass': mat('Reflective_Glass_Teal','#397b92',.62,.18),
'glassblue': mat('Reflective_Glass_DeepBlue','#23587e',.54,.19),
'glasslight': mat('Glass_Illuminated','#7cc0c9',.13,.24,emissive=(.07,.14,.15)),
'bluepanel': mat('Blue_Glass_Vertical','#164767',.48,.25),
'silver': mat('Aluminum_Bright','#d1dbe1',.7,.22),
'silvergray': mat('Aluminum_Mid','#7e94a6',.62,.3),
'light': mat('Warm_Lighting','#ffebb7',.1,.55,emissive=(1,.7,.25)),
'white': mat('Canopy_Pearl_White','#edf2ee',.19,.63),
'roof': mat('Roof_Concrete','#596474',.15,.92),
'road': mat('Asphalt','#464c54',.0,.96),
'walk': mat('Plaza_Light_Stone','#b8afa4',.0,.96),
'walk2': mat('Plaza_Stone_Alt','#d3c9bb',.0,.9),
'curb': mat('Kerb_Stone','#e3ded3',.0,.91),
'green': mat('Landscape_Leaf','#306344',.0,.93),
'green2': mat('Landscape_Leaf_Light','#528458',.0,.93),
'palm': mat('Palm_Trunk','#846e58',.0,.94),
'palmleaf': mat('Palm_Fronds','#376d43',.0,.9),
'palmleaf2': mat('Palm_Fronds_Light','#539b58',.0,.9),
'yellow': mat('Wayfinding_Gold','#ffd36c',.16,.43,emissive=(.42,.28,.04)),
'paint': mat('Road_Markings','#e2ded3',.0,.93),
'pink': mat('Accent_Magenta','#b64a74',.2,.5),
'wood': mat('Wood_Planter','#806b57',.04,.8),
}

# LED screen artwork is generated, not copied from the web.
def led_texture():
    w,h=1536,960
    im=Image.new('RGB',(w,h),(152,181,198)); p=im.load()
    for y in range(h):
        for x in range(w):
            u=x/w; v=y/h
            soft = 0.55+0.45*math.cos((u-.55)*3.1)
            glow=math.exp(-(((u-.62)/.21)**2+((v-.55)/.39)**2)*1.5)
            r=int(149+25*soft+25*glow); g=int(175+22*soft-30*glow); b=int(189+19*soft+12*glow)
            p[x,y]=(min(r,255),min(g,255),min(b,255))
    d=ImageDraw.Draw(im,'RGBA')
    for i in range(19):
        cx=R.randrange(w);cy=R.randrange(h);rad=R.randrange(30,180)
        c=R.choice([(43,110,201,46),(252,71,100,42),(90,180,201,56),(240,248,250,55)])
        d.ellipse((cx-rad,cy-rad,cx+rad,cy+rad),fill=c)
    # translucent front panel pixelation is a defining feature of Neo Soho
    cell=15
    for xx in range(0,w,cell):
        for yy in range(0,h,cell):
            d.rectangle((xx,yy,xx+cell-2,yy+cell-2),outline=(232,245,251,67),width=1)
            if R.random()<.065:
                d.rectangle((xx+3,yy+2,xx+cell-4,yy+cell-5),fill=(239,247,250,R.randrange(22,92)))
    # LED animation sampled in still image: three flowing bands
    for row in range(20):
        t=row/20
        y=int(h*(.28+.08*math.sin(t*9)))
        d.arc((40,y-90,w-10,y+250),10,164,fill=(240,248,255,37),width=4)
    return im

M['led']=mat('Curved_Media_LED', '#ffffff',.0,.34,emissive=(.25,.27,.29),texture=led_texture())

def label_image(label,w=1536,h=260,fg=(249,251,252,255),shadow=True):
    img=Image.new('RGBA',(w,h),(0,0,0,0))
    d=ImageDraw.Draw(img)
    fontfile='/usr/share/fonts/truetype/lato/Lato-Heavy.ttf'
    if not os.path.isfile(fontfile):fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    for size in range(175,40,-1):
        f=ImageFont.truetype(fontfile,size)
        bb=d.textbbox((0,0),label,font=f,stroke_width=0)
        if bb[2]-bb[0] < w-80 and bb[3]-bb[1] < h-40: break
    tw,th=d.textbbox((0,0),label,font=f)[2:]
    x=(w-tw)/2; y=(h-th)/2-8
    if shadow: d.text((x+4,y+5),label,font=f,fill=(0,0,0,110),stroke_width=2,stroke_fill=(0,0,0,68))
    d.text((x,y),label,font=f,fill=fg)
    return img

M['sign']=mat('Central_Park_2_Signage','#ffffff',.0,.8,emissive=(.24,.22,.25),texture=label_image('Central Park 2'),alpha=True)
M['entrance_label']=mat('Entrance_Identifier','#ffffff',.0,.8,emissive=(.28,.28,.2),texture=label_image('MAIN ENTRANCE',1200,220),alpha=True)
M['skywalk_label']=mat('Skywalk_Identifier','#ffffff',.0,.8,emissive=(.2,.24,.25),texture=label_image('ECO SKYWALK',1200,220),alpha=True)

class Geom:
    def __init__(self): self.v=[];self.f=[];self.uv=[]
    def quad(self,a,b,c,d,uv=None):
        st=len(self.v);self.v+=list(map(tuple,(a,b,c,d)))
        self.f.extend(((st,st+1,st+2),(st,st+2,st+3)))
        self.uv+=uv if uv else [(0,0)]*4
    def tri(self,a,b,c):
        st=len(self.v); self.v+=list(map(tuple,(a,b,c))); self.f.append((st,st+1,st+2));self.uv += [(0,0)]*3
    def box(self,x,y,z,w,h,d):
        x0,x1=x-w/2,x+w/2;y0,y1=y-h/2,y+h/2;z0,z1=z-d/2,z+d/2
        A=(x0,y0,z0);B=(x1,y0,z0);C=(x1,y1,z0);D=(x0,y1,z0)
        E=(x0,y0,z1);F=(x1,y0,z1);G=(x1,y1,z1);H=(x0,y1,z1)
        for q in ((E,F,G,H),(B,A,D,C),(A,E,H,D),(F,B,C,G),(D,H,G,C),(A,B,F,E)):
            self.quad(*q)
    def ring_prism(self,poly,y0,y1):
        # poly in x,z
        for (x,z),(xx,zz) in zip(poly,poly[1:]+poly[:1]):
            self.quad((x,y0,z),(xx,y0,zz),(xx,y1,zz),(x,y1,z))
        for k in range(1,len(poly)-1):
            self.tri((poly[0][0],y1,poly[0][1]),(poly[k][0],y1,poly[k][1]),(poly[k+1][0],y1,poly[k+1][1]))
            self.tri((poly[0][0],y0,poly[0][1]),(poly[k+1][0],y0,poly[k+1][1]),(poly[k][0],y0,poly[k][1]))
    def tube(self,a,b,r,segments=7):
        # cylinder along a->b, oriented arbitrary
        av=np.array(a,float);bv=np.array(b,float);dif=bv-av;leng=np.linalg.norm(dif)
        if leng<.0001:return
        axis=dif/leng
        t=np.cross(axis,[0,0,1] if abs(axis[2])<.9 else [0,1,0]);t/=np.linalg.norm(t)
        s=np.cross(axis,t)
        bot=[];top=[]
        for k in range(segments):
            p=math.cos(k*math.tau/segments)*t+math.sin(k*math.tau/segments)*s
            bot.append(tuple(av+p*r));top.append(tuple(bv+p*r))
        for k in range(segments): self.quad(bot[k],bot[(k+1)%segments],top[(k+1)%segments],top[k])
        for k in range(1,segments-1):
            self.tri(bot[0],bot[k+1],bot[k]);self.tri(top[0],top[k],top[k+1])

class Model:
    def __init__(self):self.groups=defaultdict(Geom)
    def get(self,group):return self.groups[group]
    def box(self,g,x,y,z,w,h,d): self.get(g).box(x,y,z,w,h,d)
    def quad(self,g,*p,uv=None):self.get(g).quad(*p,uv=uv)
    def tube(self,g,a,b,r,segments=7):self.get(g).tube(a,b,r,segments)
    def poly(self,g,p,y0,y1):self.get(g).ring_prism(p,y0,y1)
    def mesh(self, include_tower):
        scene=trimesh.Scene(base_frame='World')
        count=0
        for key,g in self.groups.items():
            if not include_tower and key.startswith('tower_'):continue
            if not g.f:continue
            material_key=key.rsplit('__',1)[-1]
            mesh=trimesh.Trimesh(vertices=np.asarray(g.v),faces=np.asarray(g.f),process=False,validate=False)
            mesh.visual=TextureVisuals(uv=np.asarray(g.uv),material=M[material_key])
            scene.add_geometry(mesh,node_name=key,geom_name=key)
            count+=1
        return scene

mod=Model()

def fz(x):return 23.2 + 9.4*(1-(x/65)**2)

def curved_panel(grp,x0,x1,y0,y1,offset=0,steps=None,texcoord=True):
    n=steps or max(3,round((x1-x0)/2))
    for i in range(n):
        x=x0+(x1-x0)*i/n;xx=x0+(x1-x0)*(i+1)/n
        u0=i/n;u1=(i+1)/n
        mod.quad(grp,(x,y0,fz(x)+offset),(xx,y0,fz(xx)+offset),(xx,y1,fz(xx)+offset),(x,y1,fz(x)+offset),uv=[(u0,0),(u1,0),(u1,1),(u0,1)] if texcoord else None)

def curved_line(grp,x0,x1,y,r=.18,offset=.2,count=70):
    for i in range(count):
        x=x0+(x1-x0)*i/count
        xx=x0+(x1-x0)*(i+1)/count
        mod.tube(grp,(x,y,fz(x)+offset),(xx,y,fz(xx)+offset),r,6)

def vertical_line(grp,x,y0,y1,r=.12,offset=.3):
    mod.tube(grp,(x,y0,fz(x)+offset),(x,y1,fz(x)+offset),r,6)

# base massing (right at floor elevation) - round front profile and rectangular rear footprint
outline=[(-62,-32),(62,-32),(62,23.4)]
for x in np.linspace(62,-62,65):outline.append((float(x),fz(x)))
outline.append((-62,-32))
mod.poly('main_podium__core',outline[:-1],0,43)
mod.box('podium_roof_slab__roof',0,43.3,-3,125,1.2,61)
mod.poly('front_lower_glass_mass__glass',[(x,fz(x)+.15) for x in np.linspace(-60,60,52)]+[(60,19),(-60,19)],0,8.2)

# left side entrance facade: deep blue vertical glazing + aluminum outlines
curved_panel('large_blue_facade__bluepanel',-60,-5,11,27,.46,45)
for y in [11,15.0,19,23,27]:curved_line('blue_facade_horizontal_frames__silvergray',-60,-4,y,.12,.9)
for x in np.arange(-59,0,4.8):vertical_line('blue_facade_vertical_frames__silver',float(x),11,27,.085,.97)
# horizontal louvres on upper left / entire cladding panel
curved_panel('dark_cladding_upper__core_mid',-62,7,27.5,43.2,.35)
for y in np.arange(28,43.2,1.13):curved_line('upper_facade_silver_ribs__silvergray',-62,8,float(y),.13,.85)
# left vertical wave accent + quarter rounded gray fin
for x in [-61,-52,-43]:
    vertical_line('facade_tall_wing_fins__cladding',x,9,42,.34,1.12)

# curved media wall on prominent right-hand elevation
curved_panel('giant_led_wall__led',8.5,61,11.5,40.1,.95,90)
curved_line('media_wall_upper_trim__silver',8,62,40.45,.42,1.55)
curved_line('media_wall_lower_trim__silver',8,62,11.3,.35,1.40)
for x in [8.4,61]:vertical_line('media_wall_border__silver',x,11.35,40.6,.38,1.55)
# LED glass texture slightly offset with fine grid lines
for y in np.arange(12,40,.93):curved_line('led_horizontal_mesh__silvergray',8.5,61,float(y),.027,1.64,100)
for x in np.arange(9.2,62,1.5):vertical_line('led_vertical_mesh__silvergray',float(x),11.5,40.1,.019,1.64)
# right far edge posts
for x in [56.8,58.0,59.2]: vertical_line('right_facade_vertical_pipes__silvergray',x,0,42,.17,.65)

# low-level curtain glass with mullions and lit vestibule
curved_panel('retail_ground_curtain_glass__glasslight',-61,61,.4,8.4,1.1,80)
for x in np.arange(-60,61,3.3):vertical_line('retail_ground_vertical_frames__silver',float(x),.5,8.5,.10,1.62)
for y in [0.6,4.1,8.35]:curved_line('retail_ground_horiz_frames__silver',-61,61,y,.16,1.63)
# entrance deep inset black / gold framed door at front center
mod.box('main_entrance_recess__dark',-7,3.2,fz(-7)+1.45,20,5.8,.9)
mod.box('main_entrance_lobby_glass__glassblue',-7,3.1,fz(-7)+2.25,19,5.6,.22)
for x in [-16,-12,-7,-2,2]:mod.box('entrance_glass_frames__silver',x,3.2,fz(-7)+2.36,.13,5.7,.2)
mod.box('entrance_header__silver',-7,6.15,fz(-7)+2.32,20,.36,.45)
for x in [-12.5,-1.5]:mod.box('entrance_handles__silver',x,2.6,fz(-7)+2.58,.12,1.15,.12)
# signage as actual in-GLB curved alpha texture over facade, no dependency on external fonts at runtime
curved_panel('brand_signage_upper__sign',-58,-8,32.1,37.1,1.45,50)
curved_panel('main_entrance_sign__entrance_label',-23,8,8.4,10.65,1.63,35)

# large swooping elliptical drop-off canopy: curved, supported with columns, roof-edge band
# white crescent-like geometry tapers toward the wings, spans entrance approach
xs=np.linspace(-43,39,90)
edgeback=[(float(x),fz(float(x))+1.25) for x in xs]
edgefront=[(float(x), fz(float(x))+10.5 + 4.0*(1-(float(x)/48.0)**2)) for x in xs]
roof_poly=edgeback+edgefront[::-1]
mod.poly('canopy_wide_roof__white',roof_poly,7.65,8.17)
for i in range(89):
    a=edgefront[i];b=edgefront[i+1]
    mod.tube('canopy_edge_bright__silver',(a[0],7.79,a[1]),(b[0],7.79,b[1]),.36)
    mod.tube('canopy_warm_strip__light',(a[0],7.59,a[1]),(b[0],7.59,b[1]),.08)
# concentric underside lines in soffit
for k in [.20,.48,.77]:
    for i in range(89):
        a=np.array(edgeback[i])*(1-k)+np.array(edgefront[i])*k
        b=np.array(edgeback[i+1])*(1-k)+np.array(edgefront[i+1])*k
        mod.tube('canopy_underside_seams__silvergray',(a[0],7.6,a[1]),(b[0],7.6,b[1]),.044,5)
for x in [-36,-23,18,33]:
    z=fz(x)+9
    mod.tube('canopy_support_pillars__silver', (x,.25,z),(x,7.7,z),.34,12)
    mod.box('canopy_column_foot__cladding',x,.15,z,1.35,.30,1.35)

# side and back facades rhythm + silver horizontal window strips
for y in np.arange(7,43,5):
    mod.box('side_left_grey_streaks__silvergray',-62.1,y,-3.8,.25,.27,52)
    mod.box('side_right_grey_streaks__silvergray',62.1,y,-3.8,.25,.27,52)
for z in np.arange(-31,21,3.6):
    for y in [8,15,22,29,36]:
        mod.box('side_blue_windows__glassblue',-62.16,y,z,.22,2.9,2.15)
        mod.box('side_blue_windows__glassblue',62.16,y,z,.22,2.9,2.15)

# arched glazed connector stub for Eco Skywalk (distinct separate architectural component)
mod.box('skywalk_tunnel_floor__silvergray',-72,17.9,1.0,28,1.4,8.6)
mod.box('skywalk_tunnel_glazing__glasslight',-72,21.1,1.0,28,5.6,8.1)
mod.box('skywalk_roof__white',-72,24.4,1.0,29,.5,9)
for x in np.arange(-85,-58,3.7):
    mod.tube('skywalk_arc_ribs__silver',(float(x),17.7,-3.3),(float(x),24.4,-3.3),.19)
    mod.tube('skywalk_arc_ribs__silver',(float(x),17.7,5.3),(float(x),24.4,5.3),.19)
mod.box('skywalk_glass_side_panels__glass',-72,21.1,-3.13,28,5.3,.13)
mod.box('skywalk_glass_side_panels__glass',-72,21.1,5.13,28,5.3,.13)

# surrounding game-scale surfaces: Y=0 flat, front faces +Z
mod.box('foundation_under_mall__roof',0,-.52,-3,127,1.0,67)
mod.box('plaza_ground__walk',0,-.17,48.5,143,.32,53)
mod.box('road_surface__road',0,-.08,57.7,143,.19,13.1)
mod.box('far_spawn_sidewalk__walk2',0,-.06,69.1,143,.20,10.1)
for z in [50.7,64.4]:mod.box('curb_road_edges__curb',0,.06,z,144,.19,.28)
for x in np.arange(-66,70,8):mod.box('paver_grid_direction1__curb',float(x),.014,44.1,.045,.020,11)
for z in np.arange(38.5,50.0,2.7):mod.box('paver_grid_direction2__curb',0,.015,float(z),134,.018,.05)
# pedestrian zebra crossings
for z in np.arange(52.0,63.3,1.45):
    for x in [-6.1,-3.35,-.6,2.15,4.9]:
        mod.box('zebra_crossing__paint',x,.035,float(z),1.75,.022,.9)
# lane arrows / double yellow median road dashed strips
for x in np.arange(-70,72,10):
    mod.box('road_paint_lane_dashes__paint',float(x),.039,57.6,3.8,.02,.12)
# landscaping beds
for x in [-54.5,52.5]:
    for z in [41,47.8,67.1]:
        mod.box('planter_raised_stone__wood',x,.50,z,11,1,3.4)
        mod.box('planter_greenery__green',x,1.09,z,10.4,.28,2.9)
        for j in range(12):
            sx=x-4.4+j*.8
            mod.box('planter_shrubs__green2',sx,1.3,z+R.uniform(-.65,.65),.6,.6,.73)

# palms in road-side planters, multiple expressive low poly crossed fronds
def palm(x,z,h=8):
    lean=R.uniform(-.6,.6)
    mod.tube('palm_trees_trunks__palm',(x,1.1,z),(x+lean,h,z),.23,8)
    for k in range(11):
        a=k*math.tau/11 + (x%2)*.1
        r=2.2+R.uniform(.45,1.55)
        tip=(x+lean+math.cos(a)*r,h-.95-R.random()*.7,z+math.sin(a)*r)
        mid=(x+lean+math.cos(a)*r*.42,h+1,z+math.sin(a)*r*.42)
        mod.tube('palm_trees_fronds__palmleaf' if k%2 else 'palm_trees_fronds2__palmleaf2',(x+lean,h,z),mid,.10,5)
        mod.tube('palm_trees_fronds__palmleaf' if k%2 else 'palm_trees_fronds2__palmleaf2',mid,tip,.08,5)
        # Wedge leaves for silhouette
        tx,tz=-math.sin(a),math.cos(a)
        off=.58
        mod.get('palm_frond_plates__palmleaf' if k%2 else 'palm_frond_plates2__palmleaf2').tri((x+lean,h,z),(mid[0]+tx*off,mid[1]-.08,mid[2]+tz*off),tip)
        mod.get('palm_frond_plates__palmleaf' if k%2 else 'palm_frond_plates2__palmleaf2').tri((x+lean,h,z),tip,(mid[0]-tx*off,mid[1]-.08,mid[2]-tz*off))
for x,z in [(-60,44),(-43,48),(46,48),(61,44),(-59,67),(60,67)]:palm(x,z,R.uniform(8,12))
# small architectural lights
for x in [-56,-38,38,56]:
    for z in [39,48.5]:
        mod.tube('pedestrian_path_lamps__dark',(x,.2,z),(x,3.2,z),.08,6)
        mod.box('pedestrian_lamp_emitters__light',x,3.22,z,.53,.16,.55)
# a distinct spawn marker disk, intentionally named so game code can hide it
for i in range(24):
    a=i*math.tau/24;b=(i+1)*math.tau/24
    mod.get('SpawnMarker_HIDE_AFTER_SETUP__yellow').quad((math.cos(a)*1.30,.065,68+math.sin(a)*1.30),(math.cos(b)*1.30,.065,68+math.sin(b)*1.30),(math.cos(b)*1.02,.067,68+math.sin(b)*1.02),(math.cos(a)*1.02,.067,68+math.sin(a)*1.02))

# ---- optional attached towers, grouped by prefix for two exported variants ----
# Tower 1: high-rise SOHO residence, gray glass with white square grid
mod.box('tower_residence_base__core_mid',-27.0,89.3,-9.2,34.5,91.5,29)
for y in np.arange(44,136,3.05):
    for x in np.arange(-43,-9,2.65):
        if x+2.4>=-9:continue
        shade='glassblue' if R.random()<.62 else 'glass'
        mod.box('tower_residence_windows__'+shade,float(x)+1, float(y)+1.25,5.40,1.95,2.48,.14)
        mod.box('tower_residence_windows_rear__'+shade,float(x)+1,float(y)+1.25,-23.82,1.95,2.48,.14)
    mod.box('tower_residence_floorbands__silvergray',-27, float(y),5.54,34.3,.16,.25)
for x in np.arange(-43,-10,2.7):
    mod.box('tower_residence_vertical_grid__cladding',float(x),89,-0, .26,91, .22)
    mod.box('tower_residence_vertical_grid_rear__cladding',float(x),89,-23.6,.26,91,.22)
mod.box('tower_residence_crown__cladding',-27,136.5,-9.0,35,2.3,29)
for x in np.arange(-41,-10,2.6): mod.box('tower_residence_roof_fins__silver',float(x),140.2,-8.9,.33,5.5,24.4)
# tower 2: dark blue glass curtainwall office tower with blue linear stripes
mod.box('tower_office_volume__bluepanel',35.4,101,-14.8,36.0,113.2,29.5)
# long corner silver vertical fins
for x in [18.3,21.0,27.5,34.5,41.5,48.9,52.7]:
    mod.box('tower_office_aluminum_mullions__silvergray',x,101.0,.18,.29,113.7,.25)
for y in np.arange(45,158.3,2.35):
    mod.box('tower_office_horizontal_mullions__silvergray',35.4,float(y),.22,36.6,.11,.21)
    mod.box('tower_office_rear_mullions__silvergray',35.4,float(y),-29.7,36.6,.11,.22)
    for x in np.arange(19,52,4.7):
        if R.random()<.20:
            mod.box('tower_office_lit_windows__glasslight',float(x),float(y)+1.04,.34,2.1,1.85,.14)
# twin rooftop mechanical silhouettes
mod.box('tower_office_crown__core',35.4,159.1,-14.8,37.2,4.3,30.4)
mod.box('tower_office_rooftop_plate__silvergray',35.4,161.3,-14.8,39,.38,32)
for x in [24,46]:mod.box('tower_office_antenna__silvergray',x,165.7,-13,.37,9,.37)

# Rooftop of mall: pavilion volumes can be used as collision/perch places
for x,z in [(-48,-16),(-8,-22),(8,-15),(55,-20)]:
    mod.box('rooftop_hvac_buildings__core_mid',x,46.2,z,12,5.4,9)
    mod.box('rooftop_hvac_roofplates__silvergray',x,49.2,z,12.5,.45,9.5)
for x in np.arange(-58,60,7):
    mod.box('roof_guardrail_posts__silver',float(x),45.1,28.2,.12,2.6,.13)
mod.box('roof_guardrail_top__silver',0,46.46,28.1,120,.10,.11)

def export(scene,p):
    scene.export(p,file_type='glb')
    print(f'{p.name}: {p.stat().st_size/1024/1024:.2f} MB, geometries={len(scene.geometry)}, bounds={np.round(scene.bounds,1).tolist()}')

if __name__=='__main__':
    export(mod.mesh(False),OUT/'central_park_2_mall.glb')
    export(mod.mesh(True),OUT/'central_park_2_full_complex.glb')
