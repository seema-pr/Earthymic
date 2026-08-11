export type ProductCategory = "hair" | "skin" | "wellness";

export type Product = {
  id: string;
  name: string;
  label: string;
  category: ProductCategory;
  price: number;
  description: string;
  image: string;
};

export const products: Product[] = [
  {
    id: "amla-powder",
    name: "Amla Powder",
    label: "AMLA",
    category: "wellness",
    price: 243,
    description:
      "Traditional amla powder for everyday natural routines.",
    image: "/assets/products/amla.png",
  },
  {
    id: "ashwagandha-powder",
    name: "Ashwagandha Powder",
    label: "ASHWAGANDHA",
    category: "wellness",
    price: 249,
    description:
      "Traditional botanical powder for wellness routines.",
    image: "/assets/products/ashwagandha.png",
  },
  {
    id: "bhringraj-powder",
    name: "Bhringraj Powder",
    label: "BHRINGRAJ",
    category: "hair",
    price: 229,
    description:
      "A classic botanical for traditional hair-care routines.",
    image: "/assets/products/bhringraj.png",
  },
  {
    id: "hibiscus-flower",
    name: "Hibiscus Flower",
    label: "HIBISCUS",
    category: "skin",
    price: 219,
    description:
      "Dried hibiscus botanical for traditional beauty routines.",
    image: "/assets/products/hibiscus.png",
  },
  {
    id: "rosemary-leaves",
    name: "Rosemary Leaves",
    label: "ROSEMARY",
    category: "hair",
    price: 199,
    description:
      "Aromatic rosemary leaves for herbal routines.",
    image: "/assets/products/rosemary.png",
  },
  {
    id: "shikakai-powder",
    name: "Shikakai Powder",
    label: "SHIKAKAI",
    category: "hair",
    price: 189,
    description:
      "Traditional botanical powder for natural hair cleansing.",
    image: "/assets/products/shikakai.png",
  },
  {
    id: "reetha-whole",
    name: "Reetha Whole",
    label: "REETHA",
    category: "hair",
    price: 199,
    description:
      "Soapnut fruit traditionally used as a natural cleanser.",
    image: "/assets/products/reetha.png",
  },
  {
    id: "tulsi-leaves",
    name: "Tulsi Leaves",
    label: "TULSI",
    category: "wellness",
    price: 189,
    description:
      "Freshly dried tulsi leaves for everyday herbal routines.",
    image: "/assets/products/tulsi.png",
  },
  {
    id: "brahmi-powder",
    name: "Brahmi Powder",
    label: "BRAHMI",
    category: "wellness",
    price: 219,
    description:
      "Traditional brahmi powder for natural routines.",
    image: "/assets/products/brahmi.png",
  },
  {
    id: "multani-mitti-powder",
    name: "Multani Mitti Powder",
    label: "MULTANI MITTI",
    category: "skin",
    price: 179,
    description:
      "Traditional mineral-rich earth powder for natural care.",
    image: "/assets/products/multani.png",
  },
];