// src/components/Sidebar.jsx

import React, { useState } from 'react';
import { LayoutDashboard, Users, Calendar, Menu, X, UserCheck, LogOut } from 'lucide-react';

const navItems = [
    { id: 'Dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'Members', name: 'Members', icon: Users },
    { id: 'ServiceMonthList', name: 'Service Month List', icon: Calendar },
];

const NavButton = ({ item, activeView, setActiveView, setIsMobileOpen }) => {
    const isActive = activeView === item.id;
    return (
        <button
            onClick={() => { setActiveView(item.id); setIsMobileOpen(false); }}
            className={`w-full flex items-center p-3 rounded-lg transition duration-200 text-left text-sm 
                ${isActive 
                    ? 'bg-indigo-700 text-white shadow-md font-bold' 
                    : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white font-medium'}`
            }
        >
            <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-cyan-300' : ''}`}/>
            {item.name}
        </button>
    );
};

// --- Updated Sidebar Signature to include onLogout ---
const Sidebar = ({ activeView, setActiveView, userId, onLogout }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* 🔑 FIX 1: FLOATING MENU BUTTON (Replaces the header) */}
            {/* This fixed button is hidden on desktop (md:hidden) and provides the mobile toggle. */}
            {!isMobileOpen && (
                <button
                    onClick={() => setIsMobileOpen(true)}
                    // Position: Fixed top-4 left-4, z-index 50 to float above all content
                    className="fixed top-4 left-4 md:hidden p-3 rounded-full bg-indigo-600 text-white shadow-lg z-50 hover:bg-indigo-700 transition"
                    title="Open Menu"
                >
                    <Menu className="w-6 h-6"/>
                </button>
            )}
            
            {/* 🔑 FIX 2: Mobile Overlay (Dims background when sidebar is open) */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" 
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                transition-transform duration-300 ease-in-out 
                w-64 bg-indigo-800 p-5 flex flex-col justify-between z-50 shadow-2xl
                md:relative md:translate-x-0 md:h-full md:flex-col md:shrink-0
            `}>
                
                <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 md:hidden text-white p-2 rounded-full bg-indigo-900 hover:bg-indigo-700"
                    title="Close Sidebar"
                >
                    <X className="w-5 h-5"/>
                </button>

                <div>
                    <div className="text-center mb-8 pt-4">
                        <h2 className="text-2xl font-black text-white">St. Uriel Admin</h2>
                        <p className="text-indigo-400 text-xs mt-1">Youth Management</p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <NavButton 
                                key={item.id} 
                                item={item} 
                                activeView={activeView} 
                                setActiveView={setActiveView} 
                                setIsMobileOpen={setIsMobileOpen}
                            />
                        ))}
                    </nav>
                </div>
                
                <div className="mt-8 pt-4 border-t border-indigo-700">
                    <div className="flex items-center space-x-3 p-3 bg-indigo-700 rounded-lg">
                        <UserCheck className="w-6 h-6 text-white"/>
                        <div className='min-w-0'>
                            <p className="text-xs font-semibold text-white leading-tight">Admin Profile</p>
                            {/* NOTE: Truncating the userId is acceptable here for display purposes. */}
                            <p className="text-[10px] text-indigo-300 font-mono truncate" title={userId}>
                                ID: {userId ? userId.substring(0, 8) : 'N/A'}...
                            </p>
                        </div>
                    </div>
                    {/* --- CRITICAL FIX: Added onClick handler for Logout --- */}
                    <button 
                        onClick={onLogout} 
                        className="w-full mt-2 flex items-center p-3 rounded-lg transition duration-200 text-left text-sm font-medium text-indigo-200 hover:bg-red-700/50 hover:text-white"
                    >
                        <LogOut className="w-5 h-5 mr-3 text-red-300"/>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;