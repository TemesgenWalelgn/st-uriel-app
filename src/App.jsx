import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, deleteDoc } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { List, Clipboard, User, X, Plus, Calendar, Edit, Trash2, Phone, Mail, UserCheck, Check, Loader, BarChart3, Users, Briefcase, Camera, FileText, LayoutDashboard, Menu, ChevronDown, ChevronUp, Clock, MapPin } from 'lucide-react';

// --- CLOUDINARY CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = 'dmp2grjb1';
const CLOUDINARY_UPLOAD_PRESET = 'members';
const CLOUDINARY_ASSET_FOLDER = 'urail/members';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// --- FALLBACK CONFIGURATION (Used if environment variable is missing) ---
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyCblSjCK6nrL2uYK89c3GSLq2gNdfaGUpg",
  authDomain: "st-uriel-youth-portal.firebaseapp.com",
  projectId: "st-uriel-youth-portal",
  messagingSenderId: "31098781825",
  appId: "1:31098781825:web:90772139016b4f0122cd80",
  measurementId: "G-B315BV2XCW"
};

// --- Global Variable Handling ---
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const INITIAL_AUTH_TOKEN = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const FIREBASE_CONFIG = (typeof __firebase_config !== 'undefined' && __firebase_config) 
    ? JSON.parse(__firebase_config) 
    : FALLBACK_CONFIG;


// --- Firebase Initialization and Instances ---
let dbInstance = null;
let authInstance = null;
let appInstance = null;

const initFirebase = () => {
    if (dbInstance && authInstance && appInstance) return { db: dbInstance, auth: authInstance, app: appInstance };

    if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.projectId) {
        throw new Error("Final Firebase configuration object is invalid.");
    }

    appInstance = initializeApp(FIREBASE_CONFIG);
    // getAnalytics(appInstance); // Disabled for brevity
    
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    
    return { db: dbInstance, auth: authInstance, app: appInstance };
};


// --- Constants ---
const MONTHS = [
    "1 - September (መስከረም)", "2 - October (ጥቅምት)", "3 - November (ህዳር)",
    "4 - december (ታህሳስ)", "5 - january (ጥር)", "6 - February (የካቲት)",
    "7 - March (መጋቢት)", "8 - April (ሚያዝያ)", "9 - Mat (ግንቦት)",
    "10 - June (ሰኔ)", "11 - July (ሀምሌ)", "12 - August (ነሀሴ)"
];

const GENDER_OPTIONS = ['ወንድ', 'ሴት'];
const JOB_STATUS_OPTIONS = ['Employed', 'Student', 'Unemployed', 'Self-Employed'];
const SKILL_LEVELS = ['Poor', 'Fair', 'Good', 'Excellent'];

// Helper to format dates for input fields (YYYY-MM-DD)
const formatDate = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    // Handle Firebase Timestamp objects
    if (typeof date === 'object' && date !== null && typeof date.toDate === 'function') {
        return date.toDate().toISOString().split('T')[0];
    }
    return date; // Return as is if already a string
};

// --- Member Form Component (Handles Create and Edit) ---
const MemberForm = ({ db, userId, memberToEdit, onComplete }) => {
    const defaultFormState = useMemo(() => ({
        fullName: '',
        dateOfBirth: '',
        addressRegion: '',
        addressDetails: '',
        phone: '',
        email: '',
        gender: 'Male',
        jobStatus: 'Employed',
        employerName: '',
        baptismalName: '',
        baptismChurch: '',
        baptismDate: '',
        clergyRank: '',
        clergyDate: '',
        clergyChurch: '',
        serviceMonth: '1', // Default to 1
        languageSkills: { amharic: 'Poor', oromo: 'Poor', english: 'Poor' },
        servedBefore: false,
        previousServiceLocation: '',
        membershipDate: formatDate(new Date()),
        status: 'Active',
        emergencyContact: {
            name: '',
            address: '',
            phone: '',
        },
        notes: '',
        photoURL: '',
        idPhotoURL: '',
    }), []);

    const [formData, setFormData] = useState(defaultFormState);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [idPhotoFile, setIdPhotoFile] = useState(null);

    useEffect(() => {
        if (memberToEdit) {
            setFormData(prev => ({
                ...defaultFormState, 
                ...memberToEdit,
                dateOfBirth: formatDate(memberToEdit.dateOfBirth),
                baptismDate: formatDate(memberToEdit.baptismDate),
                clergyDate: formatDate(memberToEdit.clergyDate),
                membershipDate: formatDate(memberToEdit.membershipDate),
                languageSkills: memberToEdit.languageSkills || defaultFormState.languageSkills,
                emergencyContact: memberToEdit.emergencyContact || defaultFormState.emergencyContact,
                serviceMonth: memberToEdit.serviceMonth.toString(), // Ensure serviceMonth is a string for the select field
            }));
            setPhotoFile(null);
            setIdPhotoFile(null);
        } else {
            setFormData(defaultFormState);
            setPhotoFile(null);
            setIdPhotoFile(null);
        }
    }, [memberToEdit, defaultFormState]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setError(null);
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);
    
    const handleFileChange = useCallback((e, fileType) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPEG, PNG).');
            return;
        }

        setError(null);
        if (fileType === 'photo') {
            setPhotoFile(file);
        } else if (fileType === 'idPhoto') {
            setIdPhotoFile(file);
        }
    }, []);

    const handleEmergencyChange = useCallback((e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData(prev => ({
            ...prev,
            emergencyContact: {
                ...prev.emergencyContact,
                [name]: value,
            },
        }));
    }, []);

    const handleLanguageChange = useCallback((lang, level) => {
        setError(null);
        setFormData(prev => ({
            ...prev,
            languageSkills: {
                ...prev.languageSkills,
                [lang]: level,
            }
        }));
    }, []);
    
    const uploadFile = useCallback(async (file) => {
        
        if (!file || CLOUDINARY_CLOUD_NAME === '' || CLOUDINARY_UPLOAD_PRESET === '') {
            throw new Error("Cloudinary configuration is missing.");
        }
        
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        data.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        data.append('folder', CLOUDINARY_ASSET_FOLDER); 
        data.append('tags', `user-${userId}`);

        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: data,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary Error Response:", errorData);
            throw new Error(errorData.error.message || `Cloudinary upload failed with status ${response.status}`);
        }

        const result = await response.json();
        return result.secure_url;
    }, [userId]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.fullName || !formData.phone || !formData.dateOfBirth || !formData.addressRegion || !formData.addressDetails || !formData.clergyRank || !formData.membershipDate || !formData.emergencyContact.name || !formData.emergencyContact.phone) {
            setError("Please fill in ALL required fields (marked with * and in the Emergency Contact section).");
            return;
        }

        if ((!memberToEdit && !photoFile) || (!memberToEdit && !idPhotoFile)) {
             setError("Please upload both the Member Photo and the ID Document for new registration.");
             return;
        }

        setIsSaving(true);
        setUploadingImages(true);

        let dataToSave = { ...formData };
        
        try {
            const uploadPromises = [];
            
            if (photoFile) {
                uploadPromises.push(uploadFile(photoFile).then(url => dataToSave.photoURL = url));
            }

            if (idPhotoFile) {
                uploadPromises.push(uploadFile(idPhotoFile).then(url => dataToSave.idPhotoURL = url));
            }

            await Promise.all(uploadPromises);

            setUploadingImages(false);
            
            const collectionPath = `artifacts/${APP_ID}/users/${userId}/members`;

            if (memberToEdit && memberToEdit.id) {
                const memberDocRef = doc(db, collectionPath, memberToEdit.id);
                dataToSave = { ...dataToSave, lastUpdated: Date.now() };
                await setDoc(memberDocRef, dataToSave, { merge: true });
                onComplete('success', 'Member details updated successfully!');
            } else {
                const membersRef = collection(db, collectionPath);
                await addDoc(membersRef, { 
                    ...dataToSave,
                    createdAt: Date.now(),
                });
                onComplete('success', 'New member registered successfully!');
            }
            setFormData(defaultFormState);
            setPhotoFile(null);
            setIdPhotoFile(null);

        } catch (err) {
            console.error("Submission/Upload Error:", err);
            setError(`Failed to process form. Image Upload or Data Save Failed: ${err.message}`);
            onComplete('error', `Failed to process form. Image Upload or Data Save Failed: ${err.message}`);
        } finally {
            setIsSaving(false);
            setUploadingImages(false);
        }
    };
    
    // --- Render Logic ---
    const formTitle = memberToEdit ? "Edit Member Details" : "Register New Member";
    const submitButtonText = memberToEdit ? "Save Changes" : "Register Member";

    const InputField = ({ label, name, value, type = 'text', onChange, placeholder = '', required = false, isFull = false }) => (
        <div className={`mb-3 ${isFull ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                required={required}
                value={value || ''}
                onChange={onChange}
                className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150"
                placeholder={placeholder}
            />
        </div>
    );

    const SelectField = ({ label, name, value, onChange, options, isFull = false }) => (
        <div className={`mb-3 ${isFull ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <select
                name={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white transition duration-150"
            >
                {options.map((option, index) => (
                    // Handle MONTHS array which uses index+1 as value, and other arrays which use option as value
                    <option key={index + 1 > 12 ? option : `${index + 1}`} value={index + 1 > 12 ? option : `${index + 1}`}>{option}</option>
                ))}
            </select>
        </div>
    );
    
    const getPreviewUrl = (file, url) => {
        if (file) {
            return URL.createObjectURL(file);
        }
        if (url && !url.includes('YOUR_CLOUD_NAME_HERE')) return url; 
        return null;
    };

    const memberPhotoPreview = getPreviewUrl(photoFile, formData.photoURL);
    const idPhotoPreview = getPreviewUrl(idPhotoFile, formData.idPhotoURL);
    

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-5">
            <h2 className="text-xl font-bold text-indigo-700 border-b pb-2 mb-4">{formTitle}</h2>
            
            {/* Error Display */}
            {(error || uploadingImages) && (
                <div className={`p-3 rounded-md font-medium text-xs flex items-center ${error ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {error ? <X className="w-4 h-4 mr-2"/> : <Loader className="w-4 h-4 mr-2 animate-spin"/>} 
                    {error || (uploadingImages ? "Uploading images securely via Cloudinary... please wait." : "")}
                </div>
            )}
            
            {/* --- IMAGE UPLOAD SECTION (Mandatory Fields) --- */}
            <section className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-300 pb-1 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-indigo-500" /> Member Photos & ID (ግዴታ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Member Photo Upload */}
                    <div className="flex flex-col items-center p-3 border border-gray-300 rounded-lg bg-white">
                        <label className="block text-sm font-medium text-gray-700 mb-2 items-center">
                            <User className="w-4 h-4 mr-1"/> Member Photo (የአባሉ ፎቶ) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="w-32 h-32 mb-3 bg-gray-200 rounded-full overflow-hidden border-4 border-indigo-400 flex items-center justify-center">
                            {memberPhotoPreview ? (
                                <img 
                                    src={memberPhotoPreview} 
                                    alt="Member Preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/cccccc/333333?text=?"}}
                                />
                            ) : (
                                <Camera className="w-8 h-8 text-gray-500"/>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            required={!memberToEdit}
                            onChange={(e) => handleFileChange(e, 'photo')}
                            className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                         {memberToEdit && <p className="text-[10px] mt-1 text-gray-500">Only upload a new file to replace the existing photo.</p>}
                    </div>

                    {/* ID Document Upload */}
                    <div className="flex flex-col items-center p-3 border border-gray-300 rounded-lg bg-white">
                        <label className="block text-sm font-medium text-gray-700 mb-2 items-center text-center">
                            <FileText className="w-4 h-4 mr-1"/> ID Document (መታወቂያ) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="w-32 h-32 mb-3 bg-gray-200 rounded-lg overflow-hidden border-4 border-indigo-400 flex items-center justify-center">
                            {idPhotoPreview ? (
                                <img 
                                    src={idPhotoPreview} 
                                    alt="ID Preview" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/cccccc/333333?text=?"}}
                                />
                            ) : (
                                <FileText className="w-8 h-8 text-gray-500"/>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            required={!memberToEdit}
                            onChange={(e) => handleFileChange(e, 'idPhoto')}
                            className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                         {memberToEdit && <p className="text-[10px] mt-1 text-gray-500">Only upload a new file to replace the existing ID document.</p>}
                    </div>
                </div>
            </section>
            {/* --- END IMAGE UPLOAD SECTION --- */}


            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-500" /> Personal Information (የግል መረጃ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label="Full Name (ሙሉ ስም)" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleChange} 
                        required={true}
                        placeholder="First Name, Father's Name, Grandfather's Name"
                    />
                    <InputField 
                        label="Phone (ስልክ)" 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required={true}
                        placeholder="+251..."
                    />
                    <InputField 
                        label="Email (ኢሜል)" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="example@domain.com"
                    />
                    <InputField 
                        label="Date of Birth (የትውልድ ቀን)" 
                        name="dateOfBirth" 
                        type="date" 
                        value={formData.dateOfBirth} 
                        onChange={handleChange} 
                        required={true}
                    />
                    <SelectField
                        label="Gender (ፆታ)"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        options={GENDER_OPTIONS}
                    />
                    <InputField 
                        label="Address - Region/City (ክልል/ከተማ)" 
                        name="addressRegion" 
                        value={formData.addressRegion} 
                        onChange={handleChange} 
                        placeholder="Harar "
                        
                    />
                    <InputField 
                        label="Address - Detailed (ወረዳ - ቀበሌ - የቤት.ቁ)" 
                        name="addressDetails" 
                        value={formData.addressDetails} 
                        onChange={handleChange} 
                        isFull={true}
                        placeholder="Woreda, Kebele, House Number"
                    />
                </div>
            </section>
            
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-indigo-500" /> Employment & Skills (ሥራ እና ችሎታ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        label="Job/Student Status (የስራ/ተማሪ ሁኔታ)"
                        name="jobStatus"
                        value={formData.jobStatus}
                        onChange={handleChange}
                        options={JOB_STATUS_OPTIONS}
                    />
                    <InputField 
                        label="Employer/School Name (ቀጣሪ/ትምህርት ቤት)" 
                        name="employerName" 
                        value={formData.employerName} 
                        onChange={handleChange} 
                        placeholder="Company Name or University"
                    />
                    
                    {/* Language Skills */}
                    <div className="md:col-span-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Language Skills (ቋንቋ ችሎታ - Speak/Write)</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['amharic', 'oromo', 'english'].map(lang => (
                                <div key={lang}>
                                    <span className="text-xs font-semibold capitalize text-indigo-700">{lang}</span>
                                    <select
                                        name={`lang-${lang}`}
                                        value={formData.languageSkills[lang]}
                                        onChange={(e) => handleLanguageChange(lang, e.target.value)}
                                        className="w-full p-1.5 text-sm text-gray-900 border border-gray-300 rounded-md"
                                    >
                                        {SKILL_LEVELS.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Previous Service */}
                    <div className="md:col-span-2 flex items-center space-x-4 p-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                name="servedBefore"
                                checked={formData.servedBefore}
                                onChange={handleChange}
                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span>Served in other churches/associations before?</span>
                        </label>
                        {formData.servedBefore && (
                            <InputField
                                label="Previous Service Location"
                                name="previousServiceLocation"
                                value={formData.previousServiceLocation}
                                onChange={handleChange}
                                placeholder="Church Name and City"
                            />
                        )}
                    </div>

                </div>
            </section>
            
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-indigo-500" /> Church Information (ቤተክርስቲያን መረጃ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Baptismal Name (የክርስትና ስም)" name="baptismalName" value={formData.baptismalName} onChange={handleChange} placeholder="የክርስትና ስም"/>
                    <InputField label="Baptism Church (የክርስትና ቤ/ክ)" name="baptismChurch" value={formData.baptismChurch} onChange={handleChange} placeholder="Church Name"/>
                    <InputField label="Baptism Date (የክርስትና ቀን)" name="baptismDate" type="date" value={formData.baptismDate} onChange={handleChange} />
                    
                    <InputField label="Clergy Rank (የክህነት ማዕረግ)" name="clergyRank" value={formData.clergyRank} onChange={handleChange} placeholder="E.g., Deacon, Sub-Deacon" required={true}/>
                    <InputField label="Clergy Date (ማዕረግ የተቀበለበት ዘመን)" name="clergyDate" type="date" value={formData.clergyDate} onChange={handleChange} />
                    <InputField label="Clergy Church (ማዕረግ የተቀበለበት ቤ/ክ)" name="clergyChurch" value={formData.clergyChurch} onChange={handleChange} placeholder="Church Name"/>
                </div>
            </section>
            
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Membership Details (የአባልነት ዝርዝሮች)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField
                        label="Assigned Service Month (አገልግሎት ወር)"
                        name="serviceMonth"
                        value={formData.serviceMonth}
                        onChange={handleChange}
                        options={MONTHS}
                    />
                    <InputField label="Membership Date (አባል የሆነበት ቀን)" name="membershipDate" type="date" value={formData.membershipDate} onChange={handleChange} required={true}/>
                    <SelectField label="Status (ሁኔታ)" name="status" value={formData.status} onChange={handleChange} options={['Active', 'Inactive', 'Suspended']}/>
                </div>
            </section>
            
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-indigo-500" /> Emergency Contact (አደጋ ጊዜ የሚጠራ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Name" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyChange} placeholder="Contact Full Name" />
                    <InputField label="Phone" name="phone" type="tel" value={formData.emergencyContact.phone} onChange={handleEmergencyChange} placeholder="+251..."/>
                    <InputField label="Address" name="address" value={formData.emergencyContact.address} onChange={handleEmergencyChange} placeholder="Contact Address"/>
                </div>
            </section>
            
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-indigo-100 pb-1 flex items-center">
                    <Clipboard className="w-4 h-4 mr-2 text-indigo-500" /> Notes (ማስታወሻዎች)
                </h3>
                <div className="col-span-1 md:col-span-3">
                    <textarea 
                        name="notes" 
                        value={formData.notes} 
                        onChange={handleChange} 
                        rows="3"
                        className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150"
                        placeholder="Add any additional notes about the member here."
                    />
                </div>
            </section>
            
            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSaving || uploadingImages}
                className={`w-full py-2.5 px-6 rounded-lg font-bold transition duration-300 flex items-center justify-center shadow-lg text-sm
                    ${(isSaving || uploadingImages) ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`
                }
            >
                {(isSaving || uploadingImages) ? (
                    <Loader className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4 mr-3" />
                )}
                {(isSaving || uploadingImages) ? "Processing..." : submitButtonText}
            </button>
        </form>
    );
};

// --- Member List Component (No major changes here, only using member photo URL for display) ---

const MemberList = ({ members, onEdit, onDelete, onAdd }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMonth, setFilterMonth] = useState('All');
    const [sortKey, setSortKey] = useState('fullName');
    const [sortDirection, setSortDirection] = useState('asc');

    const filteredAndSortedMembers = useMemo(() => {
        let filtered = members;
        
        // 1. Filter by Search Term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(member => 
                member.fullName.toLowerCase().includes(lowerSearch) ||
                (member.phone && member.phone.includes(lowerSearch)) ||
                (member.email && member.email.toLowerCase().includes(lowerSearch))
            );
        }

        // 2. Filter by Status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(member => member.status === filterStatus);
        }

        // 3. Filter by Month
        if (filterMonth !== 'All') {
            // ServiceMonth is stored as a stringified number ('1', '12')
            filtered = filtered.filter(member => member.serviceMonth.toString() === filterMonth);
        }

        // 4. Sort
        filtered.sort((a, b) => {
            const aValue = a[sortKey] || '';
            const bValue = b[sortKey] || '';

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [members, searchTerm, filterStatus, filterMonth, sortKey, sortDirection]);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ keyName }) => {
        if (sortKey !== keyName) return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gray-400"><path d="m18 15-6-6-6 6"/></svg>;
        if (sortDirection === 'asc') return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-indigo-500"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-indigo-500"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>;
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-3"/> All Members ({filteredAndSortedMembers.length} Found)
            </h2>
            
            <div className="flex justify-end mb-4">
                <button 
                    onClick={onAdd} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300 flex items-center text-sm"
                >
                    <Plus className="w-4 h-4 mr-2"/> Register New
                </button>
            </div>


            {/* Filters and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5 p-3 bg-gray-50 rounded-lg border">
                <input
                    type="text"
                    placeholder="Search by Name, Phone, or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="col-span-full sm:col-span-1 lg:col-span-2 p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                >
                    <option value="All">All Statuses</option>
                    {['Active', 'Inactive', 'Suspended'].map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="p-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                >
                    <option value="All">All Service Months</option>
                    {MONTHS.map((month, index) => (
                        <option key={index + 1} value={`${index + 1}`}>{month}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="bg-indigo-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('fullName')}>
                                <div className="flex items-center">Name <SortIcon keyName="fullName" /></div>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('serviceMonth')}>
                                <div className="flex items-center">Service Month <SortIcon keyName="serviceMonth" /></div>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                                <div className="flex items-center">Status <SortIcon keyName="status" /></div>
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedMembers.length > 0 ? (
                            filteredAndSortedMembers.map(member => (
                                <tr key={member.id} className="hover:bg-indigo-50 transition duration-150">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                            {member.photoURL ? (
                                                <img 
                                                    src={member.photoURL} 
                                                    alt={member.fullName} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/cccccc/333333?text=?"}}
                                                />
                                            ) : (
                                                <User className="w-4 h-4 text-gray-500"/>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {member.fullName}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {member.phone}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 font-medium">
                                        {MONTHS[parseInt(member.serviceMonth) - 1]?.split(' - ')[1] || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            member.status === 'Active' ? 'bg-green-100 text-green-800' :
                                            member.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button 
                                            onClick={() => onEdit(member)} 
                                            className="text-indigo-600 hover:text-indigo-900 transition duration-150 p-1 rounded-full hover:bg-indigo-100"
                                            title="Edit Member"
                                        >
                                            <Edit className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => onDelete(member)} 
                                            className="text-red-600 hover:text-red-900 transition duration-150 p-1 rounded-full hover:bg-red-100"
                                            title="Delete Member"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </td>
                                
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 italic text-sm">
                                    No members found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isVisible, title, message, onConfirm, onCancel }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 p-5">
                <h2 className="text-lg font-bold text-red-600 mb-3">{title}</h2>
                <p className="text-gray-700 text-sm mb-5">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- New Component: Dashboard ---
const Dashboard = ({ totalMembers, activeMembers, inactiveMembers }) => {
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

// --- New Component: Service Month List ---
const ServiceMonthList = ({ members }) => {
    const [openMonth, setOpenMonth] = useState(null);

    // Group members by serviceMonth (1-12)
    const membersByMonth = useMemo(() => {
        return members.reduce((acc, member) => {
            // Firestore stores serviceMonth as a stringified number ('1' to '12')
            const monthKey = member.serviceMonth || '1'; 
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(member);
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
                                    ${isOpen ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                <span className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-3"/>
                                    {monthName}
                                </span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${isOpen ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {monthMembers.length} Members
                                </span>
                                {isOpen ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                            </button>
                            
                            {isOpen && (
                                <div className="p-4 border-t border-gray-200">
                                    <ul className="space-y-2">
                                        {monthMembers.map(member => (
                                            <li key={member.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm text-gray-800">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
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
                            )}
                        </div>
                    );
                })}

                {sortedMonthKeys.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-xl shadow-lg text-gray-500 italic">
                        No members have been registered yet.
                    </div>
                )}
            </div>
        </div>
    );
};

// --- New Component: Sidebar Navigation ---
const Sidebar = ({ activeView, setActiveView, userId }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { id: 'Dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'Members', name: 'Members', icon: Users },
        { id: 'ServiceMonthList', name: 'Service Month List', icon: Calendar },
    ];

    const NavButton = ({ item }) => {
        const isActive = activeView === item.id;
        return (
            <button
                onClick={() => { setActiveView(item.id); setIsMobileOpen(false); }}
                className={`w-full flex items-center p-3 rounded-lg transition duration-200 text-left font-semibold text-sm
                    ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`
                }
            >
                <item.icon className="w-5 h-5 mr-3"/>
                {item.name}
            </button>
        );
    };

    return (
        <>
            {/* Mobile Header/Toggle (Fixed to top of viewport) */}
            <header className="md:hidden flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-40">
                <h1 className="text-lg font-extrabold text-indigo-700">Uriel Portal</h1>
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                >
                    <Menu className="w-6 h-6"/>
                </button>
            </header>

            {/* Sidebar (Desktop & Mobile Overlay) */}
            <div className={`
                fixed inset-y-0 left-0 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                transition-transform duration-300 ease-in-out 
                w-64 bg-indigo-800 p-5 flex flex-col justify-between z-50 shadow-2xl
                // Desktop classes make it relative and permanent
                md:relative md:translate-x-0 md:shrink-0 md:h-full
            `}>
                
                {/* Close Button for Mobile */}
                <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 md:hidden text-white p-2 rounded-full bg-indigo-900 hover:bg-indigo-700"
                >
                    <X className="w-5 h-5"/>
                </button>

                <div>
                    {/* Logo/Title */}
                    <div className="text-center mb-8 pt-4">
                        <h2 className="text-2xl font-black text-white">St. Uriel Admin</h2>
                        <p className="text-indigo-400 text-xs mt-1">Youth Management</p>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-2">
                        {navItems.map(item => <NavButton key={item.id} item={item} />)}
                    </nav>
                </div>
                
                {/* Admin Footer */}
                <div className="mt-8 pt-4 border-t border-indigo-700">
                    <div className="flex items-center space-x-3 p-3 bg-indigo-700 rounded-lg">
                         <UserCheck className="w-6 h-6 text-white"/>
                        <div className='min-w-0'>
                            <p className="text-xs font-semibold text-white leading-tight">Admin Profile</p>
                            <p className="text-[10px] text-indigo-300 font-mono truncate" title={userId}>
                                ID: {userId.substring(0, 8)}...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


// --- Main Application Component ---
const App = () => {
    const [db, setDb] = useState(null);
    const [authApp, setAuthApp] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [members, setMembers] = useState([]);
    
    // UI State for Navigation and Members View
    const [activeView, setActiveView] = useState('Dashboard'); 
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);


    const handleFormResult = useCallback((type, message) => {
        if (type === 'success') {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(''), 5000);
            setIsFormVisible(false); // Close the form on success
            setMemberToEdit(null); // Clear editing state
            setActiveView('Members'); // Navigate back to the member list
        } else {
            // Error is handled inside the form component
        }
    }, []);

    const handleEdit = (member) => {
        setMemberToEdit(member);
        setIsFormVisible(true);
    };
    
    const handleAdd = () => {
        setMemberToEdit(null); // Ensure we are creating new
        setIsFormVisible(true);
    };
    
    // Reset view when navigating out of the form
    useEffect(() => {
        if (activeView !== 'Members') {
            setIsFormVisible(false);
            setMemberToEdit(null);
        }
    }, [activeView]);

    const handleDelete = (member) => {
        setMemberToDelete(member);
        setIsDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!memberToDelete || !db || !userId) return;

        setIsDeleteModalVisible(false);
        setSuccessMessage('Deleting member...');

        const collectionPath = `artifacts/${APP_ID}/users/${userId}/members`;
        const memberDocRef = doc(db, collectionPath, memberToDelete.id);

        try {
            await deleteDoc(memberDocRef);
            handleFormResult('success', `${memberToDelete.fullName} has been successfully removed.`);
        } catch (err) {
            console.error("Delete Error:", err);
            handleFormResult('error', `Failed to delete ${memberToDelete.fullName}: ${err.message}`);
        } finally {
            setMemberToDelete(null);
        }
    };

    // 1. Initialization and Authentication
    useEffect(() => {
        try {
            const { db, auth, app } = initFirebase();
            setDb(db);
            setAuthApp(app);

            const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setLoading(false);
                } else {
                    try {
                        if (INITIAL_AUTH_TOKEN) {
                            await signInWithCustomToken(auth, INITIAL_AUTH_TOKEN);
                        } else {
                            await signInAnonymously(auth);
                        }
                    } catch (e) {
                        setError(`Authentication Failed: ${e.message}`);
                        setLoading(false);
                    }
                }
            });

            return () => unsubscribeAuth();
        } catch (e) {
            setError(`Initialization Error: ${e.message}`);
            setLoading(false);
        }
    }, []);

    // 2. Realtime Data Listener
    useEffect(() => {
        if (!db || !userId) return;

        const collectionPath = `artifacts/${APP_ID}/users/${userId}/members`;
        const membersRef = collection(db, collectionPath);
        
        const q = query(membersRef);
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const memberList = [];
            snapshot.forEach((doc) => {
                memberList.push({ id: doc.id, ...doc.data() });
            });
            
            memberList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setMembers(memberList);
        }, (err) => {
            console.error("Firestore error:", err);
            setError(`Firestore Fetch Error: ${err.message}. Check your security rules.`);
        });

        return () => unsubscribeSnapshot();
    }, [db, userId]);

    const activeMembers = useMemo(() => members.filter(m => m.status === 'Active').length, [members]);
    const inactiveMembers = useMemo(() => members.filter(m => m.status === 'Inactive').length, [members]);


    const renderContentView = () => {
        switch (activeView) {
            case 'Dashboard':
                return <Dashboard totalMembers={members.length} activeMembers={activeMembers} inactiveMembers={inactiveMembers} />;
            case 'Members':
                if (isFormVisible) {
                    return (
                        <>
                            <div className="flex justify-end mb-4">
                                <button 
                                    onClick={() => { setIsFormVisible(false); setMemberToEdit(null); }} 
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-200 font-semibold py-2.5 px-3 rounded-lg shadow-md transition duration-300 flex items-center justify-center text-sm"
                                >
                                    <X className="w-4 h-4 mr-2"/> Close Form
                                </button>
                            </div>
                            <MemberForm 
                                db={db} 
                                userId={userId} 
                                memberToEdit={memberToEdit} 
                                onComplete={handleFormResult}
                            />
                        </>
                    );
                }
                return (
                    <MemberList 
                        members={members} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onAdd={handleAdd}
                    />
                );
            case 'ServiceMonthList':
                return <ServiceMonthList members={members} />;
            default:
                return <Dashboard totalMembers={members.length} activeMembers={activeMembers} inactiveMembers={inactiveMembers} />;
        }
    };
    
    // --- Loading State ---
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader className="w-6 h-6 animate-spin text-indigo-500"/>
                <p className="ml-3 text-base font-medium text-gray-700">Connecting to St. Uriel Database...</p>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="p-6 max-w-md mx-auto bg-red-50 border border-red-300 rounded-lg shadow-xl mt-12">
                <X className="w-7 h-7 text-red-600 mx-auto mb-3"/>
                <h1 className="text-xl font-bold text-red-800 text-center mb-3">Application Error</h1>
                <p className="text-sm text-red-700 font-mono break-all">{error}</p>
                <p className="mt-4 text-xs text-red-500">Authenticated as: <span className="font-mono text-[10px] break-all">{userId || 'N/A'}</span></p>
            </div>
        );
    }
    
    // --- Main Content ---
    return (
        // KEY FIX: h-screen and flex ensure the entire container uses 100% of the viewport height and manages its own overflow.
        <div className="h-screen flex bg-gray-100">

            {/* Sidebar */}
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                userId={userId}
            />

            {/* KEY FIX: overflow-y-auto ensures only the main content scrolls, while the flex-1 makes it take up remaining space. Removed md:ml-0. */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-6">

                {/* Success Message Alert */}
                {successMessage && (
                    <div className="fixed top-4 right-4 z-50 p-3 bg-green-100 text-green-800 rounded-lg flex items-center shadow-md border border-green-300 text-sm">
                        <Check className="w-5 h-5 mr-2 text-green-600"/>
                        <span className="font-medium">{successMessage}</span>
                    </div>
                )}
                
                {/* Main Content View */}
                <div className="max-w-6xl mx-auto py-4">
                    {renderContentView()}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal 
                isVisible={isDeleteModalVisible}
                title="Confirm Deletion"
                message={`Are you sure you want to permanently delete the member: ${memberToDelete?.fullName || 'this member'}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
            />
        </div>
    );
};

export default App;
