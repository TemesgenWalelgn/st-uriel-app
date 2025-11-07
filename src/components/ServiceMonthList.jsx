// src/components/ServiceMonthList.jsx

import React, { useState, useMemo } from 'react';
import { Clock, Calendar, ChevronUp, ChevronDown, User, Loader2 } from 'lucide-react'; // 🔑 UPDATE: Import Loader2 for loading state

const MONTHS = [
    "1 - September (መስከረም) ዝክር አባላት", "2 - October (ጥቅምት) ዝክር አባላት", "3 - November (ኅዳር) ዝክር አባላት", 
    "4 - December (ታኅሣሥ) ዝክር አባላት", "5 - January (ጥር) ዝክር አባላት", "6 - February (የካቲት) ዝክር አባላት", 
    "7 - March (መጋቢት) ዝክር አባላት", "8 - April (ሚያዝያ) ዝክር አባላት", "9 - May (ግንቦት) ዝክር አባላት", 
    "10 - June (ሰኔ) ዝክር አባላት", "11 - July (ሐምሌ) ዝክር አባላት", "12 - August (ነሐሴ) ዝክር አባላት"
];

// 🔑 NEW: Skeleton loading state component for better UX
const MonthListSkeleton = () => (
    <div className="space-y-3 p-4 bg-white shadow-xl rounded-xl animate-pulse">
        {[...Array(4)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg h-14">
                <div className="h-4 bg-gray-300 rounded w-40"></div>
                <div className="h-6 bg-indigo-200 rounded-full w-20"></div>
            </div>
        ))}
    </div>
);

const ServiceMonthList = ({ members }) => {
    const [openMonth, setOpenMonth] = useState(null);

    // 🔑 NEW: Handle null or undefined members prop as a loading state
    if (members === undefined || members === null) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-indigo-700 flex items-center mb-6">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin"/> Loading Service Month Assignments...
                </h2>
                <MonthListSkeleton />
            </div>
        );
    }

    // Group members by serviceMonth (1-12)
    const membersByMonth = useMemo(() => {
        // 🔑 FIX/IMPROVEMENT: Ensure we only process if it is a valid array
        const memberArray = Array.isArray(members) ? members : [];
        
        return memberArray.reduce((acc, member) => {
            // 🔑 IMPROVEMENT: Use '0' (or null) for members without a month, but filter them out later 
            // The list should only display valid months (1-12).
            const monthKey = member.serviceMonth && parseInt(member.serviceMonth) >= 1 && parseInt(member.serviceMonth) <= 12
                ? member.serviceMonth
                : null; // Null key means no valid service month set
                
            if (monthKey) {
                if (!acc[monthKey]) {
                    acc[monthKey] = [];
                }
                acc[monthKey].push(member);
            }
            return acc;
        }, {});
    }, [members]);
    
    // Sort keys numerically
    const sortedMonthKeys = Object.keys(membersByMonth).sort((a, b) => parseInt(a) - parseInt(b));

    const getMonthName = (key) => MONTHS[parseInt(key) - 1] || `Month ${key}`;

    const toggleMonth = (monthKey) => {
        setOpenMonth(openMonth === monthKey ? null : monthKey);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-indigo-700 flex items-center mb-6">
                <Clock className="w-6 h-6 mr-3"/> Service Month Assignments
            </h2>

            <div className="space-y-3">
                {sortedMonthKeys.map(monthKey => {
                    const monthMembers = membersByMonth[monthKey];
                    const isOpen = openMonth === monthKey;
                    const monthName = getMonthName(monthKey);

                    return (
                        <div key={monthKey} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                            <button 
                                onClick={() => toggleMonth(monthKey)}
                                className={`w-full flex items-center justify-between p-4 font-semibold text-lg transition duration-300 
                                    ${isOpen ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-100 hover:bg-indigo-100'}`} 
                                // 🔑 UPDATE: Improved color scheme for open state
                            >
                                <span className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-3"/>
                                    {monthName}
                                </span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${isOpen ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {monthMembers.length} Members
                                </span>
                                {isOpen ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                            </button>
                            
                            {/* 🔑 UPDATE: Use transition/max-height for smoother accordion animation */}
                            <div
                                className={`transition-all duration-300 ease-in-out ${
                                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                } overflow-hidden`}
                            >
                                <div className="p-4 border-t border-gray-200">
                                    <ul className="space-y-2">
                                        {monthMembers.map(member => (
                                            <li key={member.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm text-gray-800">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                                                        {member.photoURL ? (
                                                            <img src={member.photoURL} alt={member.fullName} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-500"/>
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{member.fullName}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                    member.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                                }`}>
                                                    {member.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Check using the filtered array size */}
                {Object.keys(membersByMonth).length === 0 && Array.isArray(members) && (
                    <div className="text-center p-8 bg-white rounded-xl shadow-lg text-gray-500 italic">
                        No members have been assigned to a service month yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceMonthList;