"use client";
import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-3 items-center text-sm mr-4 text-black px-2 py-1 relative z-20"
    >
      <Image
        src="/ONcc2l601.svg"
        alt="BullMoney Logo"
        width={100}
        height={100}
        className="object-contain"
      />

    </Link>
  );
};