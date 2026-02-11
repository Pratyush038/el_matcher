export type HeaderConfig = {
  brand: {
    title: string;
    icon: string;
  };
  navigationLinks: {
    label: string;
    href: string;
  }[];
};

const headerConfig: HeaderConfig = {
  brand: {
    title: "EL Matcher",
    icon: "/icon.svg",
  },
  navigationLinks: [
    { label: "Home", href: "/" },
    { label: "Sign In", href: "/signin" },
    { label: "Register", href: "/register" },
  ],
};

export default headerConfig;
