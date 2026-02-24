"use client";

import React from "react";

type Broker = "Vantage" | "XM";

type Props = {
  motion: any;
  activeBroker: Broker;
  onSwitch: (broker: Broker) => void;
};

export default function BrokerSelector({ motion, activeBroker, onSwitch }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}
    >
      {(["Vantage", "XM"] as const).map((partner) => {
        const isActive = activeBroker === partner;
        return (
          <motion.button
            key={partner}
            onClick={() => onSwitch(partner)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="cursor-target"
            style={{
              position: "relative",
              padding: "7px 18px",
              borderRadius: 9999,
              fontWeight: 500,
              fontSize: 13,
              zIndex: 20,
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease",
              color: isActive ? "#fff" : "rgba(0,0,0,0.5)",
              backgroundColor: isActive ? "#000" : "rgba(0,0,0,0.04)",
              boxShadow: isActive ? "0 4px 16px -4px rgba(0,0,0,0.25)" : "none",
            }}
          >
            {partner}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
