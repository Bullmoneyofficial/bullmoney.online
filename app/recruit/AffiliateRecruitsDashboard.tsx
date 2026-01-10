"use client";

import React from "react";
import { motion } from "framer-motion";

interface Recruit {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: string;
}

export interface AffiliateRecruitsDashboardProps {
  recruits?: Recruit[];
  onBack?: () => void;
}

export const AffiliateRecruitsDashboard = ({
  recruits = [],
  onBack,
}: AffiliateRecruitsDashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <h2 className="text-3xl font-bold text-white mb-6">Your Recruits</h2>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Recruits</p>
            <p className="text-3xl font-bold text-white">{recruits.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-500">
              {recruits.filter((r) => r.status === "active").length}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-500">
              {recruits.filter((r) => r.status === "pending").length}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-white py-3 px-4">Name</th>
                <th className="text-left text-white py-3 px-4">Email</th>
                <th className="text-left text-white py-3 px-4">Join Date</th>
                <th className="text-left text-white py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recruits.map((recruit) => (
                <tr key={recruit.id} className="border-b border-gray-800">
                  <td className="text-white py-3 px-4">{recruit.name}</td>
                  <td className="text-gray-400 py-3 px-4">{recruit.email}</td>
                  <td className="text-white py-3 px-4">{recruit.joinDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        recruit.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {recruit.status}
                    </span>
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

export default AffiliateRecruitsDashboard;
