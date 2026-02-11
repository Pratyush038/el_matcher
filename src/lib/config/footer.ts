export type FooterConfig = {
  brand: {
    title: string;
    description: string;
  };
  sections: {
    title: string;
    links: { label: string; href: string }[];
  }[];
  copyright: string;
};

export const footerConfig: FooterConfig = {
  brand: {
    title: "EL Matcher",
    description: "Team matchmaking platform for RVCE students.",
  },
  sections: [],
  copyright: `\u00A9 ${new Date().getFullYear()} EL Matcher. All rights reserved.`,
};

export default footerConfig;
