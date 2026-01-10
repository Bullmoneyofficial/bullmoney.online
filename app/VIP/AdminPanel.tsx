"use client";

import React from "react";
import { motion } from "framer-motion";

export interface AdminPanelProps {
  onLogout?: () => void;
  editing?: any;
  clearEditing?: () => void;
}

export const AdminPanel = ({ onLogout, editing, clearEditing }: AdminPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-lg p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-bold mb-2">Users</h3>
          <p className="text-gray-400">Manage users</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-bold mb-2">Products</h3>
          <p className="text-gray-400">Manage products</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-bold mb-2">Orders</h3>
          <p className="text-gray-400">View orders</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
