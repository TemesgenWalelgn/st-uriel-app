// src/components/ConfirmationModal.jsx
import React from 'react';

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

export default ConfirmationModal;