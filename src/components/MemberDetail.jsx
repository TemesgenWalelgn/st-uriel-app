// src/components/MemberDetail.jsx

import React, { useState } from 'react';
import { 
    X, User, Phone, Mail, Calendar, Edit, Trash2, Home, Cross, 
    Briefcase, Flag, ScrollText, FileText 
} from 'lucide-react';

const MemberDetail = ({ member, onClose, onEdit, onDelete }) => {

    // ✅ NEW: Modal state for image preview
    const [previewImage, setPreviewImage] = useState(null);

    // ✅ NEW: Fullscreen image modal
    const ImageModal = ({ url, onClose }) => {
        if (!url) return null;
        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                onClick={onClose}
            >
                <img 
                    src={url} 
                    alt="Full Size Preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                />
            </div>
        );
    };

    // ✅ Format date safely
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return 'Invalid Date';
        }
    };

    // ✅ Format service month
    const formatServiceMonth = (monthValue) => {
        if (!monthValue || typeof monthValue !== 'string') return 'Not Set';
        const match = monthValue.match(/\s-\s(.*?)$/);
        return match ? match[1] : monthValue;
    };

    const handleEditClick = () => {
        onClose();
        onEdit(member);
    };

    const handleDeleteClick = () => {
        onClose();
        onDelete(member);
    };

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{value || 'N/A'}</p>
            </div>
        </div>
    );

    // ✅ UPDATED ImageDisplayCard — now supports onClick fullscreen preview
    const ImageDisplayCard = ({ title, url, fallbackText, isCircular = false }) => {
        const fallbackSrc =
            'https://via.placeholder.com/200?text=' + fallbackText.replace(/\s/g, '+');

        return (
            <div className="flex flex-col items-center p-4 border border-indigo-200 rounded-xl bg-indigo-50/50 shadow-md">
                <h4 className="text-sm font-semibold text-indigo-700 mb-3">{title}</h4>

                <div
                    className={`w-32 h-32 overflow-hidden bg-gray-200 flex items-center justify-center ${
                        isCircular ? 'rounded-full' : 'rounded-lg'
                    }`}
                >
                    <img
                        src={url || fallbackSrc}
                        alt={title}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                        onClick={() => url && setPreviewImage(url)} // ✅ Open preview only if URL exists
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackSrc;
                        }}
                    />
                </div>

                {!url && <p className="text-xs text-red-500 mt-2">No file uploaded.</p>}
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full">

            {/* ✅ Image preview modal */}
            {previewImage && (
                <ImageModal 
                    url={previewImage} 
                    onClose={() => setPreviewImage(null)} 
                />
            )}

            <div className="flex justify-between items-start border-b pb-4 mb-6">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 mr-3 text-indigo-600"/>
                    <span className="truncate">{member.fullName}</span>
                </h2>

                <div className="flex space-x-2">
                    <button 
                        onClick={handleEditClick}
                        className="p-2 sm:p-3 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
                        title="Edit Member"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleDeleteClick}
                        className="p-2 sm:p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                        title="Delete Member"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 sm:p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ✅ Member ID */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-indigo-600 mb-3 flex items-center">
                    <ScrollText className="w-6 h-6 mr-2" /> Member ID (መ.ቁ)
                </h3>
                <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm max-w-xs">
                    <span className="text-gray-800 font-semibold text-2xl">{member.memberid || 'N/A'}</span>
                </div>
            </div>

            {/* ✅ Documentation */}
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2"/> Documentation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 border border-gray-100 rounded-xl bg-gray-50">
                
                <div className="md:col-span-1 flex justify-center">
                    <ImageDisplayCard 
                        title="Member Photo (የአባሉ ፎቶ)"
                        url={member.photoURL}
                        fallbackText="No Member Photo"
                    />
                </div>

                <div className="md:col-span-1 flex flex-col justify-center space-y-3">
                    <DetailItem icon={Calendar} label="Membership Date" value={formatDate(member.membershipDate)} />
                    <DetailItem icon={Flag} label="Assigned Service Month" value={formatServiceMonth(member.serviceMonth)} />

                    <div className="p-3 bg-indigo-100 rounded-lg shadow-inner flex flex-col items-center">
                        <p className="text-xs font-semibold text-indigo-600 uppercase">Current Status</p>
                        <span className={`mt-1 px-3 py-1 text-sm font-bold rounded-full 
                            ${member.status === 'Active' ? 'bg-teal-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {member.status}
                        </span>
                    </div>
                </div>

                <div className="md:col-span-1 flex justify-center">
                    <ImageDisplayCard 
                        title="ID Document (መታወቂያ)"
                        url={member.idPhotoURL}
                        fallbackText="No ID Document"
                    />
                </div>
            </div>

            {/* ✅ Personal Info */}
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2"/> Personal & Contact Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"> 
                <DetailItem icon={Phone} label="Primary Phone" value={member.phone} />
                <DetailItem icon={Mail} label="Email Address" value={member.email} />
                <DetailItem icon={Calendar} label="Date of Birth" value={formatDate(member.dateOfBirth)} />
                <DetailItem icon={Home} label="Region/City" value={member.addressRegion} />
                <DetailItem icon={Home} label="Address Details" value={member.addressDetails} />
                <DetailItem icon={ScrollText} label="Gender" value={member.gender} />
            </div>

            {/* ✅ Employment */}
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2"/> Employment & Skills
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <DetailItem icon={Briefcase} label="Job/Student Status" value={member.jobStatus} />
                <DetailItem icon={Briefcase} label="Employer/School" value={member.employerName} />
                {member.servedBefore && (
                    <DetailItem icon={Briefcase} label="Previous Service Location" value={member.previousServiceLocation} />
                )}
                <DetailItem icon={ScrollText} label="Amharic Skill" value={member.languageSkills?.amharic} />
                <DetailItem icon={ScrollText} label="Oromo Skill" value={member.languageSkills?.oromo} />
                <DetailItem icon={ScrollText} label="English Skill" value={member.languageSkills?.english} />
            </div>

            {/* ✅ Church Details */}
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                <Cross className="w-5 h-5 mr-2"/> Church Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <DetailItem icon={Cross} label="Clergy Rank" value={member.clergyRank} />
                <DetailItem icon={Calendar} label="Clergy Date" value={formatDate(member.clergyDate)} />
                <DetailItem icon={Home} label="Clergy Church" value={member.clergyChurch} />
                <DetailItem icon={User} label="Baptismal Name" value={member.baptismalName} />
                <DetailItem icon={Home} label="Baptism Church" value={member.baptismChurch} />
                <DetailItem icon={Calendar} label="Baptism Date" value={formatDate(member.baptismDate)} />
            </div>

            {/* ✅ Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                        <Phone className="w-5 h-5 mr-2"/> Emergency Contact
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem icon={User} label="Contact Name" value={member.emergencyContact?.name} />
                        <DetailItem icon={Phone} label="Contact Phone" value={member.emergencyContact?.phone} />
                        <DetailItem icon={Home} label="Contact Address" value={member.emergencyContact?.address} />
                    </div>
                </div>

                {/* ✅ Notes */}
                <div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                        <ScrollText className="w-5 h-5 mr-2"/> Notes
                    </h3>

                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border h-full min-h-[150px] break-words">
                        {member.notes || 'No additional notes provided.'}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default MemberDetail;
