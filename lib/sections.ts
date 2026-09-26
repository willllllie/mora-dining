export const sectionSlugs = [
  "supper",
  "sample-menus",
  "how-we-work",
  "about",
  "contact",
] as const;

export type SectionSlug = (typeof sectionSlugs)[number];

export type Section = {
  slug: SectionSlug;
  title: string;
  navigationTitle: string;
  shape: "Jelly" | "Pitcher" | "Chair" | "Cup" | "Table";
  image: string;
  imagePosition: string;
  desktop: {
    left: string;
    top: string;
    width: string;
    rotation: string;
    labelLeft: string;
    labelTop: string;
  };
  mobile: {
    left: string;
    top: string;
    width: string;
    rotation: string;
  };
};

export const sections: Section[] = [
  {
    slug: "supper",
    title: "Supper Supper Supper",
    navigationTitle: "Supper Supper Supper",
    shape: "Jelly",
    image: "/images/img_1.webp",
    imagePosition: "50% 50%",
    desktop: {
      left: "10.5%",
      top: "42.25%",
      width: "20.75%",
      rotation: "-5.87deg",
      labelLeft: "58%",
      labelTop: "7%",
    },
    mobile: {
      left: "4%",
      top: "45.8%",
      width: "89%",
      rotation: "64.75deg",
    },
  },
  {
    slug: "sample-menus",
    title: "Sample Menus",
    navigationTitle: "Sample Menus",
    shape: "Pitcher",
    image: "/images/img_2.webp",
    imagePosition: "50% 48%",
    desktop: {
      left: "21.59%",
      top: "13.35%",
      width: "24.06%",
      rotation: "-5.48deg",
      labelLeft: "-19%",
      labelTop: "93%",
    },
    mobile: {
      left: "7.1%",
      top: "32.5%",
      width: "85.8%",
      rotation: "0deg",
    },
  },
  {
    slug: "how-we-work",
    title: "Offering",
    navigationTitle: "Offering",
    shape: "Chair",
    image: "/images/img_3.webp",
    imagePosition: "47% 52%",
    desktop: {
      left: "33.76%",
      top: "18.14%",
      width: "26.85%",
      rotation: "9.7deg",
      labelLeft: "-17%",
      labelTop: "25%",
    },
    mobile: {
      left: "0%",
      top: "8.1%",
      width: "90.8%",
      rotation: "-1.19deg",
    },
  },
  {
    slug: "about",
    title: "About",
    navigationTitle: "About",
    shape: "Cup",
    image: "/images/img_4.webp",
    imagePosition: "51% 46%",
    desktop: {
      left: "59.21%",
      top: "10.08%",
      width: "10.63%",
      rotation: "-7.75deg",
      labelLeft: "-116%",
      labelTop: "49%",
    },
    mobile: {
      left: "21%",
      top: "64.2%",
      width: "58%",
      rotation: "39.98deg",
    },
  },
  {
    slug: "contact",
    title: "Contact Us",
    navigationTitle: "Contact Us",
    shape: "Table",
    image: "/images/img_5.webp",
    imagePosition: "50% 50%",
    desktop: {
      left: "58.65%",
      top: "43.07%",
      width: "35.89%",
      rotation: "0deg",
      labelLeft: "7%",
      labelTop: "-3%",
    },
    mobile: {
      left: "-6%",
      top: "86%",
      width: "112%",
      rotation: "-43.81deg",
    },
  },
];

export function isSectionSlug(value: string): value is SectionSlug {
  return sectionSlugs.includes(value as SectionSlug);
}

export function getSection(slug: string) {
  return sections.find((section) => section.slug === slug);
}
