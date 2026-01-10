"use client";

import React from "react";
import { motion } from "framer-motion";

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  referrals: number;
  earnings: number;
}

interface AffiliateAdminProps {
  affiliates?: AffiliateData[];
}

export const AffiliateAdminDashboard = ({
  affiliates = [],
}: AffiliateAdminProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <h2 className="text-3xl font-bold text-white mb-6">
        Affiliate Admin Dashboard
      </h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-white py-3 px-4">Name</th>
                <th className="text-left text-white py-3 px-4">Email</th>
                <th className="text-left text-white py-3 px-4">Referrals</th>
                <th className="text-left text-white py-3 px-4">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="border-b border-gray-800">
                  <td className="text-white py-3 px-4">{affiliate.name}</td>
                  <td className="text-gray-400 py-3 px-4">{affiliate.email}</td>
                  <td className="text-white py-3 px-4">{affiliate.referrals}</td>
                  <td className="text-green-500 py-3 px-4">
                    ${affiliate.earnings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AffiliateAdminDashboard;
