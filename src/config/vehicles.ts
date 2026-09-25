import type { VehicleBrand } from "@/types/content";

const core = [
  "preventive-maintenance",
  "oil-change",
  "brake-service",
  "car-diagnostics",
  "battery-service",
  "air-conditioning",
  "tire-wheel-service",
  "pre-purchase-inspection",
];

export const vehicleBrands: VehicleBrand[] = [
  {
    id: "toyota",
    name: "Toyota",
    logo: "T",
    models: [
      { name: "Vios", years: "2013–present", services: core },
      { name: "Corolla / Altis", years: "2014–present", services: core },
      { name: "Innova", years: "2016–present", services: core },
      { name: "Fortuner", years: "2016–present", services: core },
      { name: "Hilux", years: "2015–present", services: core },
      { name: "Raize", years: "2022–present", services: core },
    ],
  },
  {
    id: "honda",
    name: "Honda",
    logo: "H",
    models: [
      { name: "City", years: "2014–present", services: core },
      { name: "Civic", years: "2016–present", services: core },
      { name: "BR-V", years: "2017–present", services: core },
      { name: "CR-V", years: "2017–present", services: core },
      { name: "HR-V", years: "2015–present", services: core },
    ],
  },
  {
    id: "mitsubishi",
    name: "Mitsubishi",
    logo: "M",
    models: [
      { name: "Mirage", years: "2014–present", services: core },
      { name: "Xpander", years: "2018–present", services: core },
      { name: "Montero Sport", years: "2016–present", services: core },
      { name: "Strada", years: "2015–present", services: core },
    ],
  },
  {
    id: "nissan",
    name: "Nissan",
    logo: "N",
    models: [
      { name: "Almera", years: "2013–present", services: core },
      { name: "Navara", years: "2015–present", services: core },
      { name: "Terra", years: "2018–present", services: core },
      { name: "Livina", years: "2019–present", services: core },
    ],
  },
  {
    id: "hyundai",
    name: "Hyundai",
    logo: "HY",
    models: [
      { name: "Accent", years: "2014–present", services: core },
      { name: "Stargazer", years: "2022–present", services: core },
      { name: "Tucson", years: "2016–present", services: core },
      { name: "Santa Fe", years: "2018–present", services: core },
    ],
  },
  {
    id: "kia",
    name: "Kia",
    logo: "K",
    models: [
      { name: "Soluto", years: "2019–present", services: core },
      { name: "Seltos", years: "2020–present", services: core },
      { name: "Carnival", years: "2021–present", services: core },
      { name: "Sportage", years: "2016–present", services: core },
    ],
  },
  {
    id: "suzuki",
    name: "Suzuki",
    logo: "S",
    models: [
      { name: "Ertiga", years: "2018–present", services: core },
      { name: "Swift", years: "2017–present", services: core },
      { name: "Jimny", years: "2019–present", services: core },
      { name: "Xl6", years: "2020–present", services: core },
    ],
  },
  {
    id: "ford",
    name: "Ford",
    logo: "F",
    models: [
      { name: "Ranger", years: "2015–present", services: core },
      { name: "Everest", years: "2016–present", services: core },
      { name: "Territory", years: "2021–present", services: core },
      { name: "Explorer", years: "2018–present", services: core },
    ],
  },
  {
    id: "mazda",
    name: "Mazda",
    logo: "MZ",
    models: [
      { name: "Mazda3", years: "2014–present", services: core },
      { name: "CX-5", years: "2017–present", services: core },
      { name: "CX-30", years: "2020–present", services: core },
      { name: "BT-50", years: "2021–present", services: core },
    ],
  },
  {
    id: "isuzu",
    name: "Isuzu",
    logo: "IS",
    models: [
      { name: "D-Max", years: "2013–present", services: core },
      { name: "mu-X", years: "2014–present", services: core },
    ],
  },
  {
    id: "bmw",
    name: "BMW",
    logo: "B",
    models: [
      { name: "3 Series", years: "2012–present", services: core },
      { name: "5 Series", years: "2011–present", services: core },
      { name: "X1", years: "2016–present", services: core },
      { name: "X3", years: "2015–present", services: core },
    ],
  },
  {
    id: "mercedes-benz",
    name: "Mercedes-Benz",
    logo: "MB",
    models: [
      { name: "C-Class", years: "2015–present", services: core },
      { name: "E-Class", years: "2014–present", services: core },
      { name: "GLC", years: "2016–present", services: core },
      { name: "A-Class", years: "2019–present", services: core },
    ],
  },
  {
    id: "audi",
    name: "Audi",
    logo: "A",
    models: [
      { name: "A4", years: "2016–present", services: core },
      { name: "Q3", years: "2019–present", services: core },
      { name: "Q5", years: "2017–present", services: core },
    ],
  },
  {
    id: "volkswagen",
    name: "Volkswagen",
    logo: "VW",
    models: [
      { name: "Polo", years: "2018–present", services: core },
      { name: "Tiguan", years: "2017–present", services: core },
      { name: "Lavida", years: "2019–present", services: core },
    ],
  },
  {
    id: "geely",
    name: "Geely",
    logo: "G",
    models: [
      { name: "Coolray", years: "2020–present", services: core },
      { name: "Okavango", years: "2021–present", services: core },
      { name: "Emgrand", years: "2022–present", services: core },
    ],
  },
  {
    id: "chery",
    name: "Chery",
    logo: "CH",
    models: [
      { name: "Tiggo 7 Pro", years: "2021–present", services: core },
      { name: "Tiggo 8 Pro", years: "2022–present", services: core },
    ],
  },
  {
    id: "mg",
    name: "MG",
    logo: "MG",
    models: [
      { name: "ZS", years: "2019–present", services: core },
      { name: "HS", years: "2020–present", services: core },
      { name: "5", years: "2021–present", services: core },
    ],
  },
  {
    id: "subaru",
    name: "Subaru",
    logo: "SB",
    models: [
      { name: "Forester", years: "2014–present", services: core },
      { name: "XV / Crosstrek", years: "2018–present", services: core },
      { name: "Outback", years: "2015–present", services: core },
    ],
  },
];
