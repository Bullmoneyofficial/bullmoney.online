"use client";
import Image from "next/image";
import Link from "next/link";


export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4  text-black px-2 py-1  relative z-20"
    >
      <Image
        src="/ONcc2l601.svg"
        alt="logo"
        width={40}
        height={40}
      />
      <span className="font-bold text-2xl text-black dark:text-white">
        Bull Money
      </span>
    </Link>
  );
};
