import React from "react";
import { FloatingDock } from "@/components/Mainpage/FloatingDock"; // Ensure the correct import
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";

// Define the type for the link items to ensure consistent structure
type LinkItem = {
  title: string;
  icon: JSX.Element;
  href: string;
};

interface FloatingDockComponentProps {
  links: LinkItem[]; // Accepts links as props
  mobileClassName?: string; // Optional prop for mobile styling
}

const FloatingDockComponent: React.FC<FloatingDockComponentProps> = ({
  links,
  mobileClassName = "translate-y-20", // Default class if not provided
}) => {
  return (
    <div className="flex items-center justify-center h-[35rem] w-full">
      <FloatingDock mobileClassName={mobileClassName} items={links} />
    </div>
  );
};

// Example usage of the component with predefined links
export const FloatingDockDemo: React.FC = () => {
  const links: LinkItem[] = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Products",
      icon: (
        <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Components",
      icon: (
        <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Aceternity UI",
      icon: (
        <img
          src="https://assets.aceternity.com/logo-dark.png"
          width={20}
          height={20}
          alt="Aceternity Logo"
        />
      ),
      href: "#",
    },
    {
      title: "Changelog",
      icon: (
        <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];

  return <FloatingDockComponent links={links} />;
};

export default FloatingDockComponent;
