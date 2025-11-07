// src/components/Dashboard.jsx
import React from 'react';
import { LayoutDashboard, Users, Check, BarChart3 } from 'lucide-react';

const Card = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border-l-4" style={{ borderColor: color }}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
                <p className="text-3xl font-bold" style={{ color: color }}>{value}</p>
            </div>
            <Icon className="w-8 h-8 opacity-40" style={{ color: color }}/>
        </div>
    </div>
);

const Dashboard = ({ totalMembers, activeMembers, inactiveMembers }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-indigo-700 flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-3"/> Association Dashboard
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Total Members" value={totalMembers} icon={Users} color="#4f46e5" />
                <Card title="Active Members" value={activeMembers} icon={Check} color="#10b981" />
                <Card title="Inactive Members" value={inactiveMembers} icon={BarChart3} color="#f59e0b" />
            </div>
            
            <div className='bg-white p-6 rounded-xl shadow-lg'>
                <h3 className="text-xl font-bold text-gray-700 mb-3">Welcome, Admin!</h3>
                <p className="text-gray-600">Use the sidebar to manage member registrations, view the full member list, or organize service assignments by month.</p>
            </div>
        </div>
    );
};

export default Dashboard;