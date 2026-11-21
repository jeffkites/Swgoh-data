// Public area references, kept separate from weather-station coordinates.
// These points identify places covered by a review, not verified kite launches.
// OpenStreetMap / Nominatim references checked 21 November 2026; ODbL 1.0.
// Each position links to its public source feature for attribution and review.
export const MAP_REGIONS = [
  {id:'lake', label:'Lake Mac & Newcastle', stationIds:['nobbys','marks','swansea','cooranbong'], bounds:[[-33.13,151.43],[-32.89,151.83]]},
  {id:'nelson', label:'Nelson Bay', stationIds:['nelson','williamtown'], bounds:[[-32.82,151.80],[-32.65,152.23]]},
  {id:'central', label:'Central Coast', stationIds:['norah'], bounds:[[-33.37,151.46],[-33.25,151.60]]}
];

export const NELSON_SOURCE = {
  id:'eco-jordan-nelson', author:'Jordan Jensen', publisher:'Escape Eco Adventures',
  title:'Kitesurfing in Nelson Bay', date:'23 July 2021', kind:'Original instructor review',
  url:'https://www.escapeecoadventures.com.au/post/kitesurfing-in-nelson-bay'
};

export const LOCAL_NOMINATION_SOURCE = {
  id:'jeff-nomination',author:'Jeff',publisher:'Hunter Wind',title:'Local site nomination',
  date:'21 November 2026',kind:'Location awaiting local review',
  url:'https://jeffkites.github.io/wind/?spot=mawsons-wall-spoons'
};
export const LOCAL_NOMINATIONS = [{
  id:'mawsons-wall-spoons',name:'Mawsons Wall / Spoons · Spoon Rocks',
  aliases:['Mawson’s Wall','Mawsons breakwall','Spoons','Spoon Rocks','Spoon Bay'],
  sourceId:LOCAL_NOMINATION_SOURCE.id,nomination:true,wind:null,water:null,level:null,
  summary:'Jeff nominated this area south of Caves Beach. Wind directions, kite access and launch details are awaiting local review.',
  access:null,hazards:[],stationIds:['swansea'],mapsQuery:'Spoon Rocks Caves Beach NSW',
  references:[{title:'Caves Beach Ocean Swim · 2022 event',author:'Surf Life Saving NSW',date:'24 April 2022',kind:'Location reference, not a kite launch guide',url:'https://www.surflifesaving.com.au/event/caves-beach-ocean-swim/'}]
}];

// Link to the original reviews; do not invent or copy new launch instructions.
export const NELSON_REVIEWS = [
  {id:'jimmys-beach',name:"Jimmy's Beach",mapsQuery:'Jimmys Beach Hawks Nest NSW'},
  {id:'bennetts-beach',name:"Bennett's / Waynderrabah Beach",mapsQuery:'Bennetts Beach Hawks Nest NSW'},
  {id:'bagnalls-beach',name:"Bagnall's Beach / Conroy Park",mapsQuery:'Bagnalls Beach Port Stephens NSW'},
  {id:'birubi-beach',name:'Birubi Beach',mapsQuery:'Birubi Beach Anna Bay NSW'},
  {id:'fingal-bay',name:'Fingal Bay / Fingal Spit',mapsQuery:'Fingal Beach Port Stephens NSW'}
].map(spot=>({...spot,sourceId:NELSON_SOURCE.id,externalReview:true,wind:null,water:null,level:null,
  summary:'Open Jordan’s original review for this site’s wind directions, access and hazards.',
  access:null,hazards:[],stationIds:['nelson']}));

export const SPOT_LOCATIONS = [
  {
    "guideId": "nobbys-beach",
    "name": "Nobbys Beach",
    "region": "lake",
    "lat": -32.9215,
    "lon": 151.7953,
    "sourceUrl": "https://www.openstreetmap.org/way/7487200",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "merewether-dixon-bar",
    "name": "Merewether / Dixon / Bar Beach",
    "region": "lake",
    "lat": -32.945,
    "lon": 151.762,
    "sourceUrl": "https://www.openstreetmap.org/way/7481317",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "redhead-blacksmiths",
    "name": "Redhead–Blacksmiths Beach",
    "region": "lake",
    "lat": -33.0152,
    "lon": 151.719,
    "sourceUrl": "https://www.openstreetmap.org/node/12904004015",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "salts-bay",
    "name": "Salts Bay",
    "region": "lake",
    "lat": -33.09,
    "lon": 151.6567,
    "sourceUrl": "https://www.openstreetmap.org/node/10012545559",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "belmont-south-squids",
    "name": "Squids / Squid’s Ink · Belmont South",
    "region": "lake",
    "lat": -33.0494,
    "lon": 151.6491,
    "sourceUrl": "https://www.openstreetmap.org/node/9710153916",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "swansea-coop",
    "name": "Swansea Co-op",
    "region": "lake",
    "lat": -33.0804,
    "lon": 151.6332,
    "sourceUrl": "https://www.openstreetmap.org/way/173207240",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "stockton",
    "name": "Stockton Beach",
    "region": "lake",
    "lat": -32.9154,
    "lon": 151.7914,
    "sourceUrl": "https://www.openstreetmap.org/way/54677190",
    "positionNote": "Southern end of mapped beach; area reference only"
  },
  {
    "guideId": "caves-beach",
    "name": "Caves Beach",
    "region": "lake",
    "lat": -33.1104,
    "lon": 151.6477,
    "sourceUrl": "https://www.openstreetmap.org/node/12904009334",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "warners-bay",
    "name": "Warners Bay",
    "region": "lake",
    "lat": -32.9778,
    "lon": 151.6396,
    "sourceUrl": "https://www.openstreetmap.org/node/367838911",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "valentine",
    "name": "Valentine",
    "region": "lake",
    "lat": -33.015,
    "lon": 151.6344,
    "sourceUrl": "https://www.openstreetmap.org/relation/5993816",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "marmong-point",
    "name": "Marmong Point",
    "region": "lake",
    "lat": -32.9754,
    "lon": 151.6207,
    "sourceUrl": "https://www.openstreetmap.org/node/54431162",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "bolton-point",
    "name": "Bolton Point",
    "region": "lake",
    "lat": -33.0017,
    "lon": 151.6065,
    "sourceUrl": "https://www.openstreetmap.org/node/54429583",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "the-entrance",
    "name": "The Entrance",
    "region": "central",
    "lat": -33.3441,
    "lon": 151.496,
    "sourceUrl": "https://www.openstreetmap.org/relation/6037074",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "jimmys-beach",
    "name": "Jimmy's Beach",
    "region": "nelson",
    "lat": -32.6782,
    "lon": 152.1778,
    "sourceUrl": "https://www.openstreetmap.org/way/31482751",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "bennetts-beach",
    "name": "Bennett's / Waynderrabah Beach",
    "region": "nelson",
    "lat": -32.6947,
    "lon": 152.192,
    "sourceUrl": "https://www.openstreetmap.org/relation/6158652",
    "positionNote": "Southern end of mapped beach; area reference only"
  },
  {
    "guideId": "bagnalls-beach",
    "name": "Bagnall's Beach / Conroy Park",
    "region": "nelson",
    "lat": -32.7187,
    "lon": 152.122,
    "sourceUrl": "https://www.openstreetmap.org/way/438224551",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "birubi-beach",
    "name": "Birubi Beach",
    "region": "nelson",
    "lat": -32.7833,
    "lon": 152.0755,
    "sourceUrl": "https://www.openstreetmap.org/way/159266746",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId": "fingal-bay",
    "name": "Fingal Bay / Fingal Spit",
    "region": "nelson",
    "lat": -32.7464,
    "lon": 152.1803,
    "sourceUrl": "https://www.openstreetmap.org/node/3020492143",
    "positionNote": "Approximate place reference; not a verified launch location"
  },
  {
    "guideId":"mawsons-wall-spoons","name":"Mawsons Wall / Spoons · Spoon Rocks","region":"lake",
    "lat":-33.1207,"lon":151.6540,
    "sourceUrl":"https://www.geonames.org/2148784/spoon-rocks.html",
    "positionNote":"Spoon Rocks feature reference from GeoNames, CC BY 4.0. Approximate area only; kite launch unverified."
  }
];
