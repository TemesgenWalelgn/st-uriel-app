// src/components/MemberList.jsx
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebase/firebaseConfig'; // make sure your Firebase app is exported from firebaseConfig.js
import React, { useState, useMemo, useEffect } from 'react'; // 🔑 UPDATE: Import useState and useMemo
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

// 🔑 UPDATE: Destructure props. Also, consider adding 'onSearch' prop if search was meant to be lifted up.
const MemberList = ({ onEdit, onDelete, onAdd, onViewDetails }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const db = getFirestore(app);
                const membersCollection = collection(db, 
                  'artifacts/st-uriel-portal/users/3YmRLH2eXafZXuCKIcJlgh3b0Ra2/members'
                );
                const snapshot = await getDocs(membersCollection);
                const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMembers(membersData);
            } catch (error) {
                console.error("Error fetching members: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);


    // 🛡️ Safety check: Ensure members is an array before using it.
    const memberArray = Array.isArray(members) ? members : [];

    // 🔑 NEW HELPER: Handle search input change
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };
// 🔑 Helper: Format Service Month
const formatServiceMonth = (monthValue) => {
    if (!monthValue) return 'Not Set';
    const match = monthValue.match(/\s-\s(.*?)$/);
    return match ? match[1] : monthValue;
};
    // 🔑 NEW/UPDATE: Use useMemo for efficient filtering
    const filteredMembers = useMemo(() => {
        if (!searchTerm) {
            return memberArray;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return memberArray.filter(member => 
            member.fullName?.toLowerCase().includes(lowerCaseSearch) ||
            member.phone?.toLowerCase().includes(lowerCaseSearch) ||
            member.clergyRank?.toLowerCase().includes(lowerCaseSearch) ||
            member.status?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [memberArray, searchTerm]); // Recalculate only when members or searchTerm changes

    // Use filteredMembers for rendering the table rows
    const membersToDisplay = filteredMembers;

    return (
        <div className="w-full"> 
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Registered Members</h1>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    
                    {/* Search input with implemented functionality */}
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search members..."
                            // 🔑 UPDATE: Bind value and onChange
                            value={searchTerm}
                            onChange={handleSearch} 
                            className="w-full sm:w-64 p-2 pl-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-sm"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>

                    <button 
                        onClick={onAdd}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 flex items-center justify-center text-sm w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2"/> Add New Member
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Full Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Clergy Rank
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Service Month
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* 🔑 UPDATE: Use membersToDisplay (which is filteredMembers) */}
                            {membersToDisplay.length === 0 ? ( 
                                <tr>
                                    {/* 🔑 UPDATE: Change message based on search results */}
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 italic">
                                        {searchTerm 
                                            ? `No members found matching "${searchTerm}".` 
                                            : `No members registered yet. Click "Add New Member" to get started.`
                                        }
                                    </td>
                                </tr>
                            ) : (
                                membersToDisplay.map((member) => ( 
                                    <tr 
                                        key={member.id} 
                                        className="hover:bg-indigo-50/50 cursor-pointer transition duration-150"
                                        onClick={() => onViewDetails(member)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {member.memberid}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {member.fullName}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${member.status === 'Active' 
                                                    ? 'bg-teal-100 text-teal-800' 
                                                    : 'bg-gray-200 text-gray-700'}`
                                                }>
                                                {member.status}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.phone || 'N/A'}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.clergyRank || 'N/A'}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {formatServiceMonth(member.serviceMonth)}
                                        </td>
                                        
                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => onEdit(member)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition"
                                                    title="Edit Member"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(member)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition"
                                                    title="Delete Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 🔑 NEW: Display total count of members being shown */}
            <div className="mt-4 text-sm text-gray-600">
                Displaying **{membersToDisplay.length}** of **{memberArray.length}** total members.
            </div>
        </div>
    );
};

export default MemberList;