// src/components/MemberForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"; 
import { UserPlus, Save, Loader, X, Camera, FileText, PhoneCall, ScrollText, CalendarCheck, CheckSquare, ChevronDown } from 'lucide-react';
// 🛑 FIX: Remove APP_ID import as it's no longer used in the flat collection path.

// --- CLOUDINARY CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = 'dmp2grjb1';
const CLOUDINARY_UPLOAD_PRESET = 'members';
const CLOUDINARY_ASSET_FOLDER = 'urail/members';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// --- END CLOUDINARY CONFIGURATION ---

// --- Constants ---
const MONTHS = [
    "1 - September (መስከረም)", "2 - October (ጥቅምት)", "3 - November (ኅዳር)", 
    "4 - December (ታኅሣሥ)", "5 - January (ጥር)", "6 - February (የካቲት)", 
    "7 - March (መጋቢት)", "8 - April (ሚያዝያ)", "9 - May (ግንቦት)", 
    "10 - June (ሰኔ)", "11 - July (ሐምሌ)", "12 - August (ነሐሴ)"
];

const LANGUAGE_LEVELS = ['Poor', 'Fair', 'Good', 'Excellent'];

const initialFormData = {
    // Personal Info
    memberid: '',
    fullName: '',
    phone: '+251',
    email: '',
    dateOfBirth: '',
    gender: 'ወንድ',
    addressRegion: 'Harar',
    addressDetails: '',

    // Photos & ID
    photoURL: '', 
    idPhotoURL: '',
    
    // Employment & Skills
    jobStatus: 'Employed',
    employerName: '',
    languageSkills: { amharic: 'Poor', oromo: 'Poor', english: 'Poor' },
    servedBefore: false,
    previousServiceLocation: '',

    // Church Information
    baptismalName: '',
    baptismChurch: '',
    baptismDate: '',
    clergyRank: '', 
    clergyDate: '',
    clergyChurch: '',

    // Membership Details
    serviceMonth: MONTHS[0], 
    membershipDate: new Date().toISOString().substring(0, 10),
    status: 'Active',

    // Emergency Contact
    emergencyContact: {
        name: '',
        phone: '+251',
        address: ''
    },

    // Notes
    notes: '',
};

// --- Helper Functions ---

/**
 * Converts Firestore Timestamp or Date object/string to an ISO date string (YYYY-MM-DD) 
 * for use in <input type="date"/>.
 */
const dateToISOString = (timestamp) => {
    if (!timestamp) return '';
    try {
        let date;
        if (typeof timestamp?.toDate === 'function') {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}/)) {
             // Handle existing YYYY-MM-DD strings directly
            return timestamp;
        }
        
        return date instanceof Date && !isNaN(date) ? date.toISOString().substring(0, 10) : '';

    } catch (e) {
        console.error("Error converting timestamp to date string:", e);
        return '';
    }
};

// --- Helper Components ---

const InputField = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '', className = '' }) => (
    <div className={`flex flex-col ${className}`}>
        <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">{label}{required && <span className='text-red-500'>*</span>}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150"
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, className = '' }) => (
    <div className={`flex flex-col ${className}`}>
        <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">{label}{required && <span className='text-red-500'>*</span>}</label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full appearance-none p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition duration-150 pr-8"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    </div>
);

// --- File Upload Card Component (CLOUDINARY LOGIC) ---
const FileUploadCard = ({ title, icon: Icon, required, fieldName, formData, setFormData, isEditing }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    
    const currentUrl = formData[fieldName];

    useEffect(() => {
        if (!currentUrl && !isEditing) {
            setFile(null);
        }
    }, [currentUrl, isEditing]);


    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setUploading(true);
        setUploadError(null);

        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        uploadData.append('folder', CLOUDINARY_ASSET_FOLDER);

        try {
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: uploadData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Cloudinary upload failed.');
            }

            const data = await response.json();
            const secureUrl = data.secure_url;
            
            setFormData(prev => ({ 
                ...prev, 
                [fieldName]: secureUrl 
            }));

        } catch (err) {
            setUploadError(`Upload failed: ${err.message}.`);
            setFormData(prev => ({ ...prev, [fieldName]: '' })); 
            setFile(null);
        } finally {
            setUploading(false);
        }
    };

    // Helper variable to determine the source for the preview
    const previewSource = file ? URL.createObjectURL(file) : (currentUrl || null);
    
    const fileName = file ? file.name : (currentUrl ? `Uploaded: ${fieldName}` : 'No file chosen');
    const isUploaded = !!currentUrl;

    return (
        <div className="flex flex-col items-center p-4 border border-gray-300 rounded-xl bg-gray-50 shadow-sm">
            <Icon className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="text-sm font-semibold text-gray-800 text-center">
                {title} {required && <span className='text-red-500'>*</span>}
            </p>
            
            <div className="w-24 h-24 my-3 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {/* Image Preview Logic */}
                {previewSource ? (
                    <img src={previewSource} alt="Preview" className="w-full h-full object-cover"/>
                ) : (
                    <Camera className="w-8 h-8 text-gray-500"/>
                )}
            </div>

            {uploadError && (
                <p className="text-xs text-red-600 text-center mb-1">{uploadError}</p>
            )}

            <input
                type="file"
                id={fieldName}
                className="hidden"
                required={required && !isUploaded && !uploading}
                onChange={handleFileChange}
                accept="image/*" 
            />
            <label 
                htmlFor={fieldName} 
                className={`text-sm font-semibold py-1 px-3 rounded-lg cursor-pointer transition duration-150 ${
                    uploading ? 'bg-indigo-300 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {uploading ? <Loader className="w-4 h-4 animate-spin"/> : 'Choose File'}
            </label>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-full">
                {isUploaded ? `URL set` : fileName}
            </p>
        </div>
    );
};


// --- Main Member Form Component ---

const MemberForm = ({ db, userId, memberToEdit, onComplete }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = !!memberToEdit;
    const title = isEditMode ? `Edit Member: ${memberToEdit?.fullName || 'Loading...'}` : 'Register New Member';

    useEffect(() => {
        if (memberToEdit) {
            // Use the helper function to correctly handle Firebase Timestamps to Date strings
            setFormData({
                ...initialFormData,
                ...memberToEdit,
                // Dates: Convert Timestamp/ms to YYYY-MM-DD for input[type=date]
                dateOfBirth: dateToISOString(memberToEdit.dateOfBirth),
                baptismDate: dateToISOString(memberToEdit.baptismDate),
                clergyDate: dateToISOString(memberToEdit.clergyDate),
                membershipDate: dateToISOString(memberToEdit.membershipDate),
                
                // Nested Objects: Ensure deep merge for emergencyContact and languageSkills
                emergencyContact: memberToEdit.emergencyContact || initialFormData.emergencyContact,
                languageSkills: memberToEdit.languageSkills || initialFormData.languageSkills,
                
                // Ensure serviceMonth is loaded as the correct string
                serviceMonth: memberToEdit.serviceMonth || initialFormData.serviceMonth,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [memberToEdit]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            if (name.startsWith('languageSkills.')) {
                const lang = name.split('.')[1];
                return { 
                    ...prev, 
                    languageSkills: { ...prev.languageSkills, [lang]: value } 
                };
            }
            if (name.startsWith('emergencyContact.')) {
                const field = name.split('.')[1];
                return { 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, [field]: value } 
                };
            }
            if (type === 'checkbox') {
                return { ...prev, [name]: checked };
            }
            return { ...prev, [name]: value };
        });
    }, []);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!db || !userId) {
            setError('Database connection error. Please refresh.');
            setLoading(false);
            onComplete('error', 'Database connection error.');
            return;
        }

        //collection path to the new top-level collection
        const userMembersCollection = collection(db, 'artifacts', 'st-uriel-portal', 'users', '3YmRLH2eXafZXuCKIcJlgh3b0Ra2', 'members');

        
        // Prepare data for Firestore
        const dataToSave = {
            ...formData,
            // Convert YYYY-MM-DD string to Firestore Date object (Time is midnight UTC)
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
            baptismDate: formData.baptismDate ? new Date(formData.baptismDate) : null,
            clergyDate: formData.clergyDate ? new Date(formData.clergyDate) : null,
            membershipDate: formData.membershipDate ? new Date(formData.membershipDate) : null,
            
            // serviceMonth is saved as the full string
            serviceMonth: formData.serviceMonth, 
            
            // 🔑 CRITICAL: Add or update the userId in the document for filtering and security rules
            userId: userId, 

            updatedAt: serverTimestamp(),
        };

        try {
            if (isEditMode) {
                // Update existing member
                // The memberToEdit object 
                const memberDocRef = doc(db, 'artifacts', 'st-uriel-portal', 'users', '3YmRLH2eXafZXuCKIcJlgh3b0Ra2', 'members', memberToEdit.id);
                // NOTE: We don't need to pass memberToEdit.userId here, as it's already in dataToSave for security rule check
                await updateDoc(memberDocRef, dataToSave); 
                onComplete('success', `${formData.fullName} details updated successfully.`);
            } else {
                // Add new member
                // The userId is included in dataToSave
                await addDoc(userMembersCollection, {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                });
                // Reset form data for new entry after success (optional, but good UX)
                setFormData(initialFormData); 
                onComplete('success', `${formData.fullName} has been registered successfully.`);
            }
        } catch (err) {
            console.error("Firestore operation failed:", err);
            setError(`Error: ${err.message}`);
            onComplete('error', `Operation failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        // 🔑 FIX: Use max-w-full to ensure it respects the phone's screen width 
        <div className="w-full max-w-full sm:max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-indigo-700 mb-8">{title}</h2>

            {error && (
                <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center">
                    <X className="w-4 h-4 mr-2"/> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* --- 1. Member Photos & ID --- */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><Camera className="w-5 h-5 mr-3"/> Member Photos & ID (የሰነድ ማስረጃ)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-indigo-200 rounded-xl">
                        <FileUploadCard 
                            title="Member Photo (የአባሉ ፎቶ)" 
                            icon={Camera} 
                            required={false}
                            fieldName="photoURL" 
                            formData={formData}
                            setFormData={setFormData}
                            isEditing={isEditMode}
                        />
                        <FileUploadCard 
                            title="ID Document (መታወቂያ)" 
                            icon={FileText} 
                            required={false}
                            fieldName="idPhotoURL" 
                            formData={formData}
                            setFormData={setFormData}
                            isEditing={isEditMode}
                        />
                    </div>
                </div>

                {/* --- 2. Personal Information --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><UserPlus className="w-5 h-5 mr-3"/> Personal Information (የግል መረጃ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="ID Number (መ.ቁ)" name="memberid" value={formData.memberid} onChange={handleChange} required placeholder="UR000" />
                        <InputField label="Full Name (ሙሉ ስም ከነ አያት)" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="First Name, Father's Name, Grandfather's Name" />
                        <InputField label="Phone (ስልክ)" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+251" type="tel" />
                        <InputField label="Email (ኢሜይል)" name="email" value={formData.email} onChange={handleChange} placeholder="example@domain.com" type="email" />
                        <InputField label="Date of Birth (የትውልድ ቀን)" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required type="date" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField 
                            label="Gender (ፆታ)" 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'ወንድ', label: 'ወንድ' },
                                { value: 'ሴት', label: 'ሴት' },
                            ]}
                        />
                        <InputField 
                            label="Address - Region/City (ክልል/ከተማ)" 
                            name="addressRegion" 
                            value={formData.addressRegion} 
                            onChange={handleChange} 
                            required 
                            placeholder="Harar"
                            className="sm:col-span-2"
                        />
                        <InputField 
                            label="Address - Details (ወረዳ - ቀበሌ - የቤት ቁ)" 
                            name="addressDetails" 
                            value={formData.addressDetails} 
                            onChange={handleChange} 
                            required 
                            placeholder="Woreda - Kebele - House No."
                            className="sm:col-span-3"
                        />
                    </div>
                </div>

                {/* --- 3. Employment & Skills --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><ScrollText className="w-5 h-5 mr-3"/> Employment & Skills (ሥራ እና ችሎታ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField 
                            label="Job/Student Status (የስራ/ተማሪ ሁኔታ)" 
                            name="jobStatus" 
                            value={formData.jobStatus} 
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'Employed', label: 'Employed' },
                                { value: 'Unemployed', label: 'Unemployed' },
                                { value: 'Student', label: 'Student' },
                            ]}
                        />
                        <InputField label="Employer/School Name (ቀጣሪ/ትምህርት ቤት ስም)" name="employerName" value={formData.employerName} onChange={handleChange} placeholder="Company Name or University" />
                    </div>

                    <div className="p-4 border border-indigo-200 rounded-xl space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Language Skills (የቋንቋ ችሎታ - Speak/Write)</p>
                        <div className="grid grid-cols-3 gap-4">
                            {['amharic', 'oromo', 'english'].map(lang => (
                                <SelectField 
                                    key={lang}
                                    label={lang.charAt(0).toUpperCase() + lang.slice(1)} 
                                    name={`languageSkills.${lang}`} 
                                    value={formData.languageSkills[lang]} 
                                    onChange={handleChange}
                                    options={LANGUAGE_LEVELS.map(level => ({ value: level, label: level }))}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center pt-2">
                        <input
                            id="servedBefore"
                            name="servedBefore"
                            type="checkbox"
                            checked={formData.servedBefore}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="servedBefore" className="ml-2 text-sm font-medium text-gray-900">
                            Served in other churches/associations before? (ከዚህ በፊት ሌላ ቦታ ላይ አገልግለህ ታውቃለህ?)
                        </label>
                    </div>
                    {formData.servedBefore && (
                        <InputField 
                            label="Previous Service Location (ያገለገልህበት ቦታ ስም)" 
                            name="previousServiceLocation" 
                            value={formData.previousServiceLocation} 
                            onChange={handleChange} 
                            placeholder="Name of previous church or association"
                        />
                    )}
                </div>

                {/* --- 4. Church Information --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><CalendarCheck className="w-5 h-5 mr-3"/> Church Information (ቤተክርስትያን መረጃ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label="Baptismal Name (ስመ ክርስትና)" name="baptismalName" value={formData.baptismalName} onChange={handleChange} placeholder="የክርስትናዎ ስም" />
                        <InputField label="Baptism Church (ክርስትና ቤተ ክርስትያን)" name="baptismChurch" value={formData.baptismChurch} onChange={handleChange} placeholder="Church Name" />
                        <InputField label="Baptism Date (ክርስትና ቀን)" name="baptismDate" value={formData.baptismDate} onChange={handleChange} type="date" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField
                            label="Clergy Rank (የክህነት ማዕረግ)"
                            name="clergyRank"
                            value={formData.clergyRank}
                            onChange={handleChange}
                            options={[
                                { value: 'የለም', label: 'የለም (None)' },
                                { value: 'ዲቁና', label: 'ዲቁና (Deacon)' },
                                { value: 'ክህነት', label: 'ክህነት (Priest)' }
                                
                            ]}
                        />
                        <InputField label="Clergy Date (ክህነት የተቀበለበት ዘመን)" name="clergyDate" value={formData.clergyDate} onChange={handleChange} type="date" />
                        <InputField label="Clergy Church (ክህነት የሰጠበት ቤተክርስትያን)" name="clergyChurch" value={formData.clergyChurch} onChange={handleChange} placeholder="Church Name" />
                    </div>
                </div>

                {/* --- 5. Membership Details --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><CheckSquare className="w-5 h-5 mr-3"/> Membership Details (የአባልነት ዝርዝር)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField 
                            label="Assigned Service Month (አገልግሎት ወር)" 
                            name="serviceMonth" 
                            value={formData.serviceMonth} 
                            onChange={handleChange}
                            required
                            options={MONTHS.map((month) => ({ value: month, label: month }))} // Using the full month string as value
                        />
                        <InputField label="Membership Date (የአባልነት ቀን)" name="membershipDate" value={formData.membershipDate} onChange={handleChange} required type="date" />
                        <SelectField 
                            label="Status (ሁኔታ)" 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Inactive', label: 'Inactive' },
                            ]}
                        />
                    </div>
                </div>

                {/* --- 6. Emergency Contact --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><PhoneCall className="w-5 h-5 mr-3"/> Emergency Contact (አደጋ ጊዜ ተጠሪ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label="Name" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} required placeholder="Contact Full Name" />
                        <InputField label="Phone" name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} required placeholder="+251..." type="tel" />
                        <InputField label="Address" name="emergencyContact.address" value={formData.emergencyContact.address} onChange={handleChange} placeholder="Contact Address" />
                    </div>
                </div>

                {/* --- 7. Notes --- */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center"><ScrollText className="w-5 h-5 mr-3"/> Notes (ማስታወሻ)</h3>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Add any additional notes about the member here."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150"
                    ></textarea>
                </div>


                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-semibold rounded-lg shadow-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:bg-indigo-400"
                    >
                        {loading ? (
                            <Loader className="w-6 h-6 mr-3 animate-spin"/>
                        ) : isEditMode ? (
                            <Save className="w-6 h-6 mr-3"/>
                        ) : (
                            <UserPlus className="w-6 h-6 mr-3"/>
                        )}
                        {isEditMode ? 'Save Changes' : 'Register Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MemberForm;
