
  export const zones: {[key: string]: {fill: string; label: string}} = {
    'R-1': {fill: '#FFFFBE', label: 'Residential: 1 Family'},
    'R-2': {fill: '#FFFF00', label: 'Residential: 1-2 Family'},
    'R-3': {fill: '#E6E600', label: 'Residential: 1-3 Family'},
    'R-4': {fill: '#e4a024', label: 'Residential: Low-Rise Multi-Family'},
    'R-5': {fill: '#FF8C00', label: 'Residential: Mid-Rise Multi-Family'},
    'R-6': {fill: '#f37520', label: 'Residential: High-Rise Multi-Family'},
    'C-1': {fill: '#FFBEBE', label: 'Commercial: Neighborhood'},
    'C-2': {fill: '#FF7F7F', label: 'Commercial: Community'},
    'C-3': {fill: '#A80000', label: 'Commercial: Regional'},
    'I-1': {fill: '#E8BEFF', label: 'Industrial: Light'},
    'I-2': {fill: '#DF73FF', label: 'Industrial: Medium'},
    'I-3': {fill: '#8400A8', label: 'Industrial: Heavy'},
    'MX-1': {fill: '#BEFFE8', label: 'Mixed-Use: Low Intensity'},
    'MX-2': {fill: '#00E6A9', label: 'Mixed-Use: Medium Intensity'},
    'MX-3': {fill: '#00A884', label: 'Mixed-Use: High Intensity'},
    'INST': {fill: '#73B2FF', label: 'Institutional'},
    'PARK': {fill: '#98E600', label: 'Parks & Open Space'},
    'CEM': {fill: '#70A800', label: 'Cemeteries'},
    'RDV': {fill: '#E1E1E1', label: 'Redevelopment Zone'},
    'EWR': {fill: '#B2B2B2', label: 'Airport & Airport Support'},
    'PORT': {fill: '#686868', label: 'Port Related Industrial'},
    Other: {fill: '#000000', label: 'Not Available'}
  };
  export const landUses: {[key: string]: {fill: string; label: string}} = {
    1: {fill: 'rgba(204,204,204)', label: 'Vacant Property'},
    2: {fill: 'rgba(255,235,175)', label: 'Residential: < 4 Units'},
    '4A': {fill: 'rgba(255,127,127)', label: 'Commercial'},
    '4B': {fill: 'rgba(170,102,205)', label: 'Industrial'},
    '4C': {fill: 'rgba(230,152,0)', label: 'Apartments'},
    '5A': {fill: 'rgba(78,78,78)', label: 'Railroad: Class I/II'},
    '5B': {fill: 'rgba(78,78,78)', label: 'Railroad: Class I/II'},
    '5A/B': {fill: 'rgba(78,78,78)', label: 'Railroad: Class I/II'},
    '15A': {fill: 'rgba(190,210,255)', label: 'Exempt: Public/Other School Property'},
    '15B': {fill: 'rgba(190,210,255)', label: 'Exempt: Public/Other School Property'},
    '15A/B': {fill: 'rgba(190,210,255)', label: 'Exempt: Public/Other School Property'},
    '15C': {fill: 'rgba(158,170,215)', label: 'Exempt: Public Property'},
    '15D': {fill: 'rgba(122,142,245)', label: 'Exempt: Church & Charitable Property'},
    '15E': {fill: 'rgba(163,255,115)', label: 'Exempt: Cemeteries & Graveyards'},
    '15F': {fill: 'rgba(102,119,205)', label: 'Exempt: Other'},
    Other: {fill: 'rgba(0,0,0,0.2)', label: 'Unclassed Properties'}
};
export type BSIconOptions =
  'arrow-down-up' |
  'arrow-left-square-fill' |
  'check-square-fill' |
  'exclamation-triangle-fill' |
  'fullscreen' |
  'fullscreen-exit' |
  'funnel-fill' |
  'geo-alt-fill' |
  'house' |
  'layers' |
  'list' |
  'info-circle-fill' |
  'map-fill' |
  'rulers' |
  'search' |
  'settings' |
  'sort-alpha-down' |
  'x' |
  'zoom-in' |
  'zoom-out'
;
export const svgPath: {[key: string]: string} = {
  'arrow-down-up': `
    <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
  `,
  'arrow-left-square-fill': `
    <path d="M16 14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12zm-4.5-6.5H5.707l2.147-2.146a.5.5 0 1 0-.708-.708l-3 3a.5.5 0 0 0 0 .708l3 3a.5.5 0 0 0 .708-.708L5.707 8.5H11.5a.5.5 0 0 0 0-1z"/>
    `,
  'check-square-fill': `
    <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm10.03 4.97a.75.75 0 0 1 .011 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.75.75 0 0 1 1.08-.022z"/>
    `,
  'exclamation-triangle-fill': `
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    `,
  'fullscreen': `
    <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
    `,
  'fullscreen-exit': `
    <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
    `,
  'funnel-fill': `
    <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
    `,
  'geo-alt-fill': `
    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
    `,
  'house': `
    <path fill-rule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
    <path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
    `,
  'info-circle-fill':  `
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
    `,
  'layers': `
    <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882l-7.5-4zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0l3.515-1.874zM8 9.433 1.562 6 8 2.567 14.438 6 8 9.433z"/>
    `,
  'list': `
    <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    `,
  'map-fill': `
    <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.598-.49L10.5.99 5.598.01a.5.5 0 0 0-.196 0l-5 1A.5.5 0 0 0 0 1.5v14a.5.5 0 0 0 .598.49l4.902-.98 4.902.98a.502.502 0 0 0 .196 0l5-1A.5.5 0 0 0 16 14.5V.5zM5 14.09V1.11l.5-.1.5.1v12.98l-.402-.08a.498.498 0 0 0-.196 0L5 14.09zm5 .8V1.91l.402.08a.5.5 0 0 0 .196 0L11 1.91v12.98l-.5.1-.5-.1z"/>
    `,
  'rulers': `
    <path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5v-1H2v-1h4v-1H4v-1h2v-1H2v-1h4V9H4V8h2V7H2V6h4V2h1v4h1V4h1v2h1V2h1v4h1V4h1v2h1V2h1v4h1V1a1 1 0 0 0-1-1H1z"/>
    `,
  'sort-alpha-down': `
    <path fill-rule="evenodd" d="M10.082 5.629 9.664 7H8.598l1.789-5.332h1.234L13.402 7h-1.12l-.419-1.371h-1.781zm1.57-.785L11 2.687h-.047l-.652 2.157h1.351z"/>
    <path d="M12.96 14H9.028v-.691l2.579-3.72v-.054H9.098v-.867h3.785v.691l-2.567 3.72v.054h2.645V14zM4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z"/>
    `,
  'search': `
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    `,
  'settings': `
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
  `,
  'x': `
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  `,
  'zoom-in': `
    <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
    `,
  'zoom-out': `
    <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
    `
};


// Ramps of up to 10, from https://developers.arcgis.com/javascript/latest/visualization/symbols-color-ramps/esri-color-ramps/
export const generalColorRamps = {
  // ArcGIS Beaded Pastel
  basic: ["#e65154", "#26b6ff", "#67e6d1", "#cd76d6", "#ffca8c", "#fff2b3", "#ff8cd9", "#d99d5b", "#c8f2a9", "#d4b8ff"],
  // ArcGIS High Light
  bright: ["#f22f00", "#ffff80", "#26ffff", "#a040ff", "#d99800", "#c0ff73", "#ffdd00", "#ff4dc4", "#5ff500", "#0040ff"],
  // ArcGIS Chamois
  subdued: ["#7db3ab", "#dbe6d1", "#d6a394", "#c8e0e3", "#b5d6f2", "#f2f1c2", "#bf7872", "#d1c79d", "#9093c7", "#e3a3dd"],
  // ArcGIS Falling Leaves
  dark: ["#3e756d", "#d9d78c", "#b86b53", "#73241f", "#b0bfa2", "#5c98ca", "#86afb3", "#ad9d63", "#44498b", "#9c5596"],
  // ArcGIS Low Satch
  light: ["#9f8eed", "#e0c9af", "#b8f5e7", "#e0ccff", "#ffe3d6", "#e8add4", "#bac29c", "#7dbdfa", "#fff6cc", "#e88b9b"]
};

export const propFields: {[group: string]: Array<{alias: string; field: string;}>} = {
  'ID': [
    {alias: 'Block-Lot', field: 'LOT_BLOCK_LOT'},
    {alias: 'Primary Parcel', field: 'MOD4_BLOCK_LOT'},
    {alias: 'Legal Address', field: 'PROPLOC'},
    {alias: 'Related Lots', field: 'ADDLOTS'}
  ],
  'Designations': [
    {alias: 'Zoning Designation', field: 'ZONING'},
    {alias: 'Redevelopment Plan', field: 'RDV_PLAN'},
    {alias: 'Redevelopment Zoning', field: 'RDV_CODE'},
    {alias: 'Historic District', field: 'HIST_DIST'},
    {alias: 'Historic Landmark', field: 'HIST_PROP'},
    {alias: 'Opportunity Zone', field: 'OPPO_ZONE'},
    {alias: 'Within UEZ', field: 'IN_UEZ'},
    {alias: 'Property Use', field: 'PROPCLASS'},
    {alias: 'Bldg. Description', field: 'BUILDDESC'},
    {alias: 'Land Description', field: 'LANDDESC'},
    {alias: 'Acreage', field: 'ACREAGE'},
    {alias: 'Ward', field: 'CITYWARD'},
    {alias: 'Commercial Type', field: 'CLASS4TYPE'}
  ],
  'Tax Info': [
    {alias: 'Owner Name', field: 'OWNERSNAME'},
    {alias: 'Tax Map Page', field: 'TAXMAP'},
    {alias: 'Assessment - Land', field: 'LANDVALUE'},
    {alias: 'Assessment - Improvements', field: 'IMPRVALUE'},
    {alias: 'Assessment - Total', field: 'NETVALUE'},
    {alias: 'Last Year Tax', field: 'LSTYRTAX'},
    {alias: 'Old Block No.', field: 'OLDBLOCKNO'},
    {alias: 'Old Lot No.', field: 'OLDLOTNO'},
    {alias: 'Old Qual Code', field: 'OLDQUALCODE'}
  ]
};
