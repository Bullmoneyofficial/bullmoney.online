"use client";
import React, { useState } from "react";
import { MultiStepLoader } from "../Mainpage/MultiStepLoader"; // Import the MultiStepLoader
import { IconSquareRoundedX } from "@tabler/icons-react";

// Define an array of steps to display
const loadingStates = [
  { text: "Buying a condo" },
  { text: "Travelling in a flight" },
  { text: "Meeting Tyler Durden" },
  { text: "He makes soap" },
  { text: "We go to a bar" },
  { text: "Start a fight" },
  { text: "We like it" },
  { text: "Welcome to F**** C***" },
];

export function MultiStepLoaderDemo() {
  const [loading, setLoading] = useState(false); // Track loading state

  return (
    <div className="w-full h-[60vh] flex items-center justify-center relative">
      {/* Core Loader Modal */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={2000} // Each step duration
      />

      {/* Trigger Button to start loading */}
      <button
        onClick={() => setLoading(true)}
        className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-black mx-auto text-sm md:text-base transition font-medium duration-200 h-10 rounded-lg px-8 flex items-center justify-center"
        style={{
          boxShadow: "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
        }}
      >
        Click to load
      </button>

      {/* Close Button */}
      {loading && (
        <button
          onClick={() => setLoading(false)} // Stop the loading when clicked
          className="fixed top-4 right-4 text-black dark:text-white z-[120]"
        >
          <IconSquareRoundedX className="h-10 w-10" />
        </button>
      )}
    </div>
  );
}
