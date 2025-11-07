import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc,
    where, 
    serverTimestamp,
    getDoc, // Required for fetchUserRole
} from "firebase/firestore";

import { db, auth } from "./firebaseConfig"; 

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- AUTHENTICATION & AUTHORIZATION ---

export const fetchUserRole = async (userId) => {
    const roleDocRef = doc(db, 'artifacts', appId, 'users', userId, 'roles', 'userRole');
    
    try {
        const docSnap = await getDoc(roleDocRef);
        if (docSnap.exists() && docSnap.data().role) {
            return docSnap.data().role; 
        } else {
            return 'member';
        }
    } catch (e) {
        console.error('Error fetching user role:', e);
        return 'member';
    }
};
/**
 * 🔢 Generate Sequential ID Example:
 * UR0001, UR0002, UR0003...
 */
export const generateSequentialMemberId = async () => {
    const seqRef = doc(
        db,
        "artifacts",
        "st-uriel-portal",
        "system",
        "memberIdSequence"
    );

    const snap = await getDoc(seqRef);

    let current = 0;
    if (snap.exists() && typeof snap.data().current === "number") {
        current = snap.data().current;
    }

    const next = current + 1;

    await updateDoc(seqRef, { current: next }).catch(async () => {
        await setDoc(seqRef, { current: next });
    });

    const newId = "UR" + String(next).padStart(4, "0");

    return newId;  // ✅ MUST RETURN
};


// --- READ Operation (UPDATED PATH) ---

/**
 * ✅ Updated to use:
 * artifacts/st-uriel-portal/users/3YmRLH2eXafZXuCKIcJlgh3b0Ra2/members
 */
export const subscribeToAllMembers = (userId, callback, errorHandler) => {
    
    const membersRef = collection(
        db,
        'artifacts',
        'st-uriel-portal',
        'users',
        '3YmRLH2eXafZXuCKIcJlgh3b0Ra2',
        'members'
    );

    // NOTE: userId filtering not required anymore but we leave structure unchanged
    const q = query(membersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });

        members.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        callback(members);
    }, errorHandler);

    return unsubscribe;
};


// --- Helper for CRUD Operations ---

/**
 * ✅ UPDATED path helper (correct Firestore tree)
 */
const getMemberDocRef = (memberId) => {
    return doc(
        db,
        'artifacts',
        'st-uriel-portal',
        'users',
        '3YmRLH2eXafZXuCKIcJlgh3b0Ra2',
        'members',
        memberId
    );
};


// --- CRUD Operations ---

/**
 * ✅ Add new member to the correct path
 */
export const addMember = (userId, memberData) => {
    const membersRef = collection(
        db,
        'artifacts',
        'st-uriel-portal',
        'users',
        '3YmRLH2eXafZXuCKIcJlgh3b0Ra2',
        'members'
    );

    return addDoc(membersRef, { 
        ...memberData, 
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};


/**
 * ✅ Update member in the correct path
 */
export const updateMember = (memberId, updatedData) => {
    const memberDocRef = getMemberDocRef(memberId);
    return updateDoc(memberDocRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
    });
};


/**
 * ✅ Delete member (already correct)
 */
export const deleteMember = (memberId) => {
    const memberDocRef = doc(
        db,
        'artifacts',
        'st-uriel-portal',
        'users',
        '3YmRLH2eXafZXuCKIcJlgh3b0Ra2',
        'members',
        memberId
    );

    return deleteDoc(memberDocRef);
};
