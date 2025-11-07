import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './firebase/firebaseConfig.js';
import { subscribeToAllMembers, deleteMember } from './firebase/firestoreService';

import { Loader, X, Check, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import ServiceMonthList from './components/ServiceMonthList';
import ConfirmationModal from './components/ConfirmationModal';
import MemberDetail from './components/MemberDetail';

const App = () => {
  // --- Local Login State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- App State ---
  const [members, setMembers] = useState([]);
  const [activeView, setActiveView] = useState('Dashboard');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberToView, setMemberToView] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // --- Simple Local Login ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123') {
      setIsLoggedIn(true);
      setError(null);
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // --- Firestore Data Subscription ---
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);

    const unsubscribe = subscribeToAllMembers(
      null, // remove 'userId' dependency
      (data) => {
        setMembers(data);
        setLoading(false);
      },
      (err) => {
        setError(`Firestore Error: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn]);

  // --- Member Handlers ---
  const handleFormResult = useCallback((type, message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
    setIsFormVisible(false);
    setMemberToEdit(null);
  }, []);

  const handleEdit = (member) => {
    setMemberToEdit(member);
    setIsFormVisible(true);
  };

  const handleAdd = () => {
    setMemberToEdit(null);
    setIsFormVisible(true);
  };

  const handleViewDetails = (member) => {
    setMemberToView(member);
    setIsFormVisible(false);
    setMemberToEdit(null);
  };

  const handleDelete = (member) => {
    setMemberToDelete(member);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMember(memberToDelete.id);
      setSuccessMessage(`${memberToDelete.fullName} deleted`);
    } catch (err) {
      console.error(err);
      setSuccessMessage(`Failed to delete: ${memberToDelete.fullName}`);
    } finally {
      setIsDeleteModalVisible(false);
      setMemberToDelete(null);
    }
  };

  // --- Member Counts ---
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'Active').length,
    [members]
  );

  const inactiveMembers = useMemo(
    () => members.filter((m) => m.status === 'Inactive').length,
    [members]
  );

  // --- Render Main Content ---
  const renderContentView = () => {
    switch (activeView) {
      case 'Dashboard':
        return (
          <Dashboard
            totalMembers={members.length}
            activeMembers={activeMembers}
            inactiveMembers={inactiveMembers}
          />
        );
      case 'Members':
        if (memberToView) {
          return (
            <MemberDetail
              member={memberToView}
              onClose={() => setMemberToView(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          );
        }
        if (isFormVisible) {
          return (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsFormVisible(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-100 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center justify-center text-sm"
                >
                  <X className="w-4 h-4 mr-2" /> Close Form
                </button>
              </div>
              <MemberForm
                db={db}
                userId="3YmRLH2eXafZXuCKIcJlgh3b0Ra2"
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
            onViewDetails={handleViewDetails}
          />
        );
      case 'ServiceMonthList':
        return <ServiceMonthList members={members} />;
      default:
        return (
          <Dashboard
            totalMembers={members.length}
            activeMembers={activeMembers}
            inactiveMembers={inactiveMembers}
          />
        );
    }
  };

  // --- Login Page ---
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-xl rounded-lg p-8 w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            St. Uriel Admin Login
          </h2>
          {error && (
            <div className="text-red-500 text-sm mb-3 text-center">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-3 border rounded-md text-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded-md text-black"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // --- Loading / Error ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="ml-3 text-base font-medium text-gray-700">
          Loading members...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-red-50 border border-red-300 rounded-lg shadow-xl mt-12">
        <X className="w-7 h-7 text-red-600 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-red-800 text-center mb-3">
          Application Error
        </h1>
        <p className="text-sm text-red-700 font-mono break-all">{error}</p>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        userId={null} // no auth
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto w-full p-3 pt-6 md:p-6">
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 p-3 bg-green-100 text-green-800 rounded-lg flex items-center shadow-md border border-green-300 text-sm">
            <Check className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="w-full flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </button>
        </div>

        <div className="w-full mx-auto py-4">{renderContentView()}</div>
      </main>

      <ConfirmationModal
        isVisible={isDeleteModalVisible}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete ${memberToDelete?.fullName || 'this member'}?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
      />
    </div>
  );
};

export default App;
