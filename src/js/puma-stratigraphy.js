// Regional PUMA/MOSYS codes interpreted for Estonia. These are broad model
// packages, not site-scale lithological logs; descriptions follow the EGT
// stratigraphic column and Estonian-Latvian hydrostratigraphic correlation.
export const PUMA_STRATIGRAPHY={
 Q:{age:'Quaternary',name:'Quaternary deposits',rock:'Sand, gravel, till, clay and peat; the model resolves hydraulic sublayers through cell conductivity.',lithology:'mixed',hydraulics:'variable'},
 Q2:{age:'Quaternary',name:'Quaternary sublayer 2',rock:'Mixed glacial and post-glacial sediment; locally sand/gravel or low-permeability till/clay.',lithology:'mixed',hydraulics:'variable'},
 Q3:{age:'Quaternary',name:'Quaternary sublayer 3',rock:'Mixed glacial sediment; model sublayer rather than a formal stratigraphic unit.',lithology:'mixed',hydraulics:'variable'},
 Q4:{age:'Quaternary',name:'Quaternary sublayer 4',rock:'Mixed basal glacial sediment; model sublayer rather than a formal stratigraphic unit.',lithology:'mixed',hydraulics:'variable'},
 PgNg:{age:'Palaeogene–Neogene',name:'Palaeogene–Neogene package',rock:'Regional Baltic model package, normally absent from the Estonian bedrock succession.',lithology:'mixed',hydraulics:'variable'},
 K:{age:'Cretaceous',name:'Cretaceous package',rock:'Regional Baltic model package, normally absent from Estonia.',lithology:'mixed',hydraulics:'variable'},
 J:{age:'Jurassic',name:'Jurassic aquifer package',rock:'Predominantly clastic regional package, normally absent from Estonia.',lithology:'aquifer',hydraulics:'aquifer'},
 'J*':{age:'Jurassic',name:'Jurassic aquitard package',rock:'Fine-grained part of the regional Jurassic package; normally absent from Estonia.',lithology:'clay',hydraulics:'aquitard'},
 T:{age:'Triassic',name:'Triassic package',rock:'Predominantly clastic regional package, normally absent from Estonia.',lithology:'aquifer',hydraulics:'aquifer'},
 P2:{age:'Permian',name:'Middle Permian aquifer package',rock:'Regional carbonate/evaporite package, normally absent from Estonia.',lithology:'carbonate',hydraulics:'variable'},
 'P2*':{age:'Permian',name:'Middle Permian aquitard package',rock:'Low-permeability part of the regional Permian package; normally absent from Estonia.',lithology:'clay',hydraulics:'aquitard'},
 C:{age:'Carboniferous',name:'Carboniferous aquifer package',rock:'Regional carbonate and clastic package, normally absent from Estonia.',lithology:'mixed',hydraulics:'variable'},
 'C*':{age:'Carboniferous',name:'Carboniferous aquitard package',rock:'Low-permeability part of the regional Carboniferous package; normally absent from Estonia.',lithology:'clay',hydraulics:'aquitard'},
 D3insk:{age:'Upper Devonian',name:'Joniškis regional package',rock:'Regional carbonate-dominated package south of Estonia.',lithology:'carbonate',hydraulics:'variable'},
 D3stel:{age:'Upper Devonian',name:'Stipinai–Eleja regional package',rock:'Dolostone and marl regional package; only marginal to Estonia.',lithology:'carbonate',hydraulics:'variable'},
 D3ogkt:{age:'Upper Devonian',name:'Ogre–Katleši package',rock:'Sandstone with marl interbeds.',lithology:'aquifer',hydraulics:'variable'},
 'D3ogkt*':{age:'Upper Devonian',name:'Ogre–Katleši aquitard',rock:'Marl- and clay-rich confining part of the Ogre–Katleši package.',lithology:'clay',hydraulics:'aquitard'},
 D3dg:{age:'Upper Devonian',name:'Daugava Formation',rock:'Dolostone with limestone, marl, clay and locally gypsum.',lithology:'carbonate',hydraulics:'variable'},
 D3slp:{age:'Upper Devonian',name:'Salaspils Formation',rock:'Marl, gypsum and dolostone; a mixed carbonate–evaporite interval.',lithology:'mixed',hydraulics:'variable'},
 D3pl:{age:'Upper Devonian',name:'Pļaviņas Formation',rock:'Dolostone with limestone and marl; groundwater is commonly fracture- and karst-controlled.',lithology:'carbonate',hydraulics:'variable'},
 'D3pl*':{age:'Upper Devonian',name:'Pļaviņas aquitard',rock:'Clay- and marl-rich confining part of the Pļaviņas package.',lithology:'clay',hydraulics:'aquitard'},
 D3am:{age:'Middle–Upper Devonian',name:'Amata Formation',rock:'Fine sandstone and siltstone with clay interbeds.',lithology:'aquifer',hydraulics:'variable'},
 'D3am*':{age:'Middle–Upper Devonian',name:'Amata aquitard',rock:'Marl, clay and clayey siltstone in the upper confining part of the Amata Formation.',lithology:'clay',hydraulics:'aquitard'},
 D3gl:{age:'Middle Devonian',name:'Gauja Formation (model code D3gl)',rock:'Sandstone and siltstone with clay interbeds; the Estonian index is commonly D2gj.',lithology:'aquifer',hydraulics:'variable'},
 'D3gl*':{age:'Middle Devonian',name:'Gauja aquitard',rock:'Clay- and siltstone-rich confining interbeds within the regional Gauja package.',lithology:'clay',hydraulics:'aquitard'},
 D2br:{age:'Middle Devonian',name:'Burtnieki Formation',rock:'Sandstone and siltstone with clay interbeds.',lithology:'aquifer',hydraulics:'variable'},
 'D2br*':{age:'Middle Devonian',name:'Burtnieki aquitard',rock:'Clay- and siltstone-rich confining part of the Burtnieki package.',lithology:'clay',hydraulics:'aquitard'},
 D2ar:{age:'Middle Devonian',name:'Aruküla Formation',rock:'Sandstone and siltstone with clay interbeds.',lithology:'aquifer',hydraulics:'variable'},
 D2nr:{age:'Middle Devonian',name:'Narva regional aquitard',rock:'Marl, clay, siltstone and dolomitic marl; a major regional confining unit.',lithology:'clay',hydraulics:'aquitard'},
 'D1gr-D2zpr':{age:'Lower–Middle Devonian',name:'Gargždai–Pärnu regional package',rock:'Predominantly sandstone and siltstone, with local marl and clay intervals.',lithology:'aquifer',hydraulics:'variable'},
 S4pr:{age:'Silurian · Přídolí',name:'Přídolí package',rock:'Limestone and dolostone with marl; permeability in Estonia is fracture-, contact- and karst-controlled.',lithology:'carbonate',hydraulics:'variable'},
 S3ld:{age:'Silurian · Ludlow',name:'Ludlow package',rock:'Limestone, dolostone and marl; locally clay-rich.',lithology:'carbonate',hydraulics:'variable'},
 S2vn:{age:'Silurian · Wenlock',name:'Wenlock package',rock:'Limestone and dolostone with marl, including locally biohermal carbonate.',lithology:'carbonate',hydraulics:'variable'},
 S1ln:{age:'Silurian · Llandovery',name:'Llandovery package',rock:'Limestone, dolostone and marl; groundwater occurs mainly in fractures and bed contacts.',lithology:'carbonate',hydraulics:'variable'},
 O3:{age:'Upper Ordovician',name:'Upper Ordovician package',rock:'Predominantly limestone with marl and locally argillaceous or dolomitised intervals.',lithology:'carbonate',hydraulics:'variable'},
 O2:{age:'Middle Ordovician',name:'Middle Ordovician package',rock:'Predominantly limestone, including argillaceous, kerogenous and locally biohermal limestone.',lithology:'carbonate',hydraulics:'variable'},
 O1:{age:'Lower Ordovician',name:'Lower Ordovician package',rock:'Mixed basal sandstone, graptolitic argillite, clay, glauconitic sandstone and limestone; not a single rock type.',lithology:'mixed',hydraulics:'variable'},
 Cmtr:{age:'Cambrian',name:'Cambrian terrigenous aquifer package',rock:'Fine- to medium-grained sandstone and silty sandstone; a broad model package rather than one Estonian formation.',lithology:'aquifer',hydraulics:'variable'},
 Cmln:{age:'Lower Cambrian',name:'Lontova–Lükati aquitard',rock:'Predominantly clay and clayey siltstone with thin sandstone interbeds.',lithology:'clay',hydraulics:'aquitard'},
 V2vr:{age:'Ediacaran',name:'Voronka Formation aquifer',rock:'Quartzose sandstone and siltstone.',lithology:'aquifer',hydraulics:'variable'},
 V2kt:{age:'Ediacaran',name:'Kotlin Formation aquitard',rock:'Clay and clayey siltstone separating the Voronka and Gdov aquifers in eastern Estonia.',lithology:'clay',hydraulics:'aquitard'},
 V2gd:{age:'Ediacaran',name:'Gdov Formation aquifer',rock:'Mixed-grained sandstone and siltstone, locally gravelly, directly above crystalline basement.',lithology:'aquifer',hydraulics:'variable'}
};

export const PUMA_STRATIGRAPHY_SOURCES=[
 {label:'EGT stratigraphic column (2023)',url:'https://www.egt.ee/media/1115/download'},
 {label:'Estonia–Latvia hydrostratigraphic correlation',url:'https://www.egt.ee/sites/default/files/documents/2023-02/Output%201%20Assessment%20of%20the%20resources%20of%20transboundary%20groundwater%20reservoirs%20for%20the%202%20pilot%20areas.pdf'},
 {label:'Baltic Artesian Basin model paper',url:'https://dspace.lu.lv/dspace/bitstream/handle/7/28295/Virbulis_10.1007_s10040_013_0970_7.pdf?sequence=1'}
];

export function describePumaUnit(code,kh){
 const unit=PUMA_STRATIGRAPHY[code]??{age:'Unresolved',name:code,rock:'No Estonia-specific lithological correlation has been assigned.',lithology:'other',hydraulics:'aquitard'};
 const permeable=Number.isFinite(kh)&&kh>=.01;
 const aquiferCandidate=unit.hydraulics==='aquitard'?false:unit.hydraulics==='aquifer'?true:permeable;
 return {...unit,aquiferCandidate,hydroRole:aquiferCandidate?'Modelled permeable interval':'Aquitard / low-permeability interval'};
}
