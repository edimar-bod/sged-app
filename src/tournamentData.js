// Initial tournament data for migration
export const EQUIPOS_A = [
  "Dorado Citty",
  "CASAGRANDE",
  "ATLETICO CHIVAO",
  "GALACTICOS FC",
  "El Dorado 1970",
];

export const EQUIPOS_B = [
  "SAN JOSE",
  "ALASKA FC",
  "PARURUAKA",
  "ESEQUIBO FC",
  "SANTA RITA",
  "CERVECEROS",
];

export const JORNADA_2_PARTIDOS = [
  {
    id: "j2-1",
    grupo: "A",
    local: "Dorado Citty",
    visitante: "CASAGRANDE",
    cancha: "Estadio El Dorado",
    dia: "VIE.",
    fecha: "31-05-24",
    hora: "21:00",
  },
  {
    id: "j2-2",
    grupo: "A",
    local: "ATLETICO CHIVAO",
    visitante: "GALACTICOS FC",
    cancha: "Estadio El Dorado",
    dia: "DOM.",
    fecha: "02-06-24",
    hora: "21:00",
  },
  {
    id: "j2-4",
    grupo: "B",
    local: "SAN JOSE",
    visitante: "ALASKA FC",
    cancha: "Estadio El Dorado",
    dia: "SAB.",
    fecha: "01-06-24",
    hora: "20:00",
  },
  {
    id: "j2-5",
    grupo: "B",
    local: "PARURUAKA",
    visitante: "ESEQUIBO FC",
    cancha: "Estadio El Dorado",
    dia: "DOM.",
    fecha: "02-06-24",
    hora: "17:00",
  },
  {
    id: "j2-6",
    grupo: "B",
    local: "SANTA RITA",
    visitante: "CERVECEROS",
    cancha: "Estadio El Dorado",
    dia: "SAB.",
    fecha: "01-06-24",
    hora: "16:00",
  },
  {
    id: "j2-7",
    grupo: "C",
    local: "MINESUR",
    visitante: "ROSCIO ACTIVA",
    cancha: "Estadio El Dorado",
    dia: "SAB.",
    fecha: "01-06-24",
    hora: "18:00",
  },
  {
    id: "j2-8",
    grupo: "C",
    local: "MOTOS AVA TUMEREMO",
    visitante: "EL PLACER",
    cancha: "Estadio El Dorado",
    dia: "VIE.",
    fecha: "31-05-24",
    hora: "17:00",
  },
  {
    id: "j2-9",
    grupo: "C",
    local: "ATLETIC YURUAN",
    visitante: "VAPOR",
    cancha: "Estadio El Dorado",
    dia: "DOM.",
    fecha: "02-06-24",
    hora: "19:00",
  },
];

export const CALENDARIO_A = [
  {
    jornada: 1,
    partidos: [
      { local: "Dorado Citty", visitante: "CASAGRANDE" },
      { local: "ATLETICO CHIVAO", visitante: "GALACTICOS FC" },
      { local: "El Dorado 1970", visitante: "DESCANSO" },
    ],
  },
  {
    jornada: 2,
    partidos: [
      { local: "Dorado Citty", visitante: "GALACTICOS FC" },
      { local: "CASAGRANDE", visitante: "El Dorado 1970" },
      { local: "DESCANSO", visitante: "ATLETICO CHIVAO" },
    ],
  },
  {
    jornada: 3,
    partidos: [
      { local: "ATLETICO CHIVAO", visitante: "CASAGRANDE" },
      { local: "El Dorado 1970", visitante: "Dorado Citty" },
      { local: "DESCANSO", visitante: "GALACTICOS FC" },
    ],
  },
];

export const CALENDARIO_B = [
  {
    jornada: 1,
    partidos: [
      { local: "SAN JOSE", visitante: "ALASKA FC" },
      { local: "PARURUAKA", visitante: "ESEQUIBO FC" },
      { local: "SANTA RITA", visitante: "CERVECEROS" },
    ],
  },
  {
    jornada: 2,
    partidos: [
      { local: "ALASKA FC", visitante: "PARURUAKA" },
      { local: "ESEQUIBO FC", visitante: "SANTA RITA" },
      { local: "CERVECEROS", visitante: "SAN JOSE" },
    ],
  },
  {
    jornada: 3,
    partidos: [
      { local: "SAN JOSE", visitante: "PARURUAKA" },
      { local: "SANTA RITA", visitante: "ALASKA FC" },
      { local: "CERVECEROS", visitante: "ESEQUIBO FC" },
    ],
  },
];
