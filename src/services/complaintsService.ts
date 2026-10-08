import {
  ComplaintRecord,
  ComplaintCategory,
  ComplaintScope,
  ComplaintStatus,
  ComplaintUrgency,
  CATEGORY_CONFIG
} from '../types/complaints';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';

const STORAGE_KEY = 'nss_college_complaints_register_v1';
const FIRESTORE_COLLECTION = 'complaints';

const SEED_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'grv-seed-01',
    ticketNumber: 'GRV-2026-1049',
    title: 'Suspicious gathering & intimidation near South Boundary Wall',
    description:
      'Group of senior individuals repeatedly stopping first-year students after 4:30 PM near the south gate bicycle stand. Requesting urgent surveillance camera review and patrol.',
    category: 'ANTI_RAGGING',
    scope: 'CAMPUS_WIDE',
    locationOnCampus: 'South Gate Cycle Stand & Campus Boundary',
    incidentDate: '2026-09-28',
    urgency: 'HIGH',
    isAnonymous: true,
    complainantRole: 'ANONYMOUS',
    status: 'UNDER_INVESTIGATION',
    assignedOfficer: 'Anti-Ragging Squad Convener & Principal Office',
    actionNotes: [
      {
        id: 'note-01',
        timestamp: '2026-09-29T10:30:00Z',
        author: 'Dr. C. Sunilkumar',
        role: 'College Principal',
        note: 'Security supervisor instructed to deploy evening guard shift at South Gate. CCTV DVR footage from Cam #4 secured for anti-ragging squad review.'
      }
    ],
    submittedAt: '2026-09-28T16:45:00Z',
    updatedAt: '2026-09-29T10:30:00Z'
  },
  {
    id: 'grv-seed-02',
    ticketNumber: 'GRV-2026-2184',
    title: 'Substance abuse reporting behind Old Canteen shed',
    description:
      'Discarded banned tobacco sachets and suspected substance use noticed behind the dry leaves compost pit near the old canteen during lunch intervals.',
    category: 'ANTI_DRUG',
    scope: 'CAMPUS_WIDE',
    locationOnCampus: 'Rear of Canteen & Compost Yard',
    incidentDate: '2026-09-25',
    urgency: 'HIGH',
    isAnonymous: true,
    complainantRole: 'ANONYMOUS',
    status: 'ACTION_TAKEN',
    assignedOfficer: 'Vimukthi / Anti-Drug Cell Committee',
    actionNotes: [
      {
        id: 'note-02',
        timestamp: '2026-09-26T11:00:00Z',
        author: 'Principal Office',
        role: 'College Principal',
        note: 'Disciplinary Committee and Vimukthi squad conducted unannounced inspection. High-mast floodlight sanctioned for dark corridor behind canteen.'
      }
    ],
    submittedAt: '2026-09-25T13:20:00Z',
    updatedAt: '2026-09-26T11:00:00Z'
  },
  {
    id: 'grv-seed-03',
    ticketNumber: 'GRV-2026-3401',
    title: 'Water filter malfunction & broken window pane in Science Block Floor 2',
    description:
      'The UV drinking water cooler on the second floor of the Science Block is leaking continuously, causing slippery corridors. Two window glasses in Hall 14 are also cracked after recent rain.',
    category: 'INFRASTRUCTURE',
    scope: 'CAMPUS_WIDE',
    locationOnCampus: 'Science Block, 2nd Floor Corridor',
    incidentDate: '2026-09-30',
    urgency: 'MEDIUM',
    isAnonymous: false,
    complainantName: 'Kavya S. Nair',
    complainantRole: 'STUDENT',
    complainantAdmissionNo: '2024PH018',
    complainantPhone: '+91 94470 12345',
    status: 'UNDER_INVESTIGATION',
    assignedOfficer: 'Campus Maintenance Supervisor',
    actionNotes: [
      {
        id: 'note-03',
        timestamp: '2026-10-01T09:15:00Z',
        author: 'Super Administrator',
        role: 'Estate & Infrastructure',
        note: 'Plumbing contractor notified. Water cooler cartridge replacement and window glazing scheduled for Saturday.'
      }
    ],
    submittedAt: '2026-09-30T11:00:00Z',
    updatedAt: '2026-10-01T09:15:00Z'
  },
  {
    id: 'grv-seed-04',
    ticketNumber: 'GRV-2026-4512',
    title: 'Physics Optics Darkroom Spectrometer sodium lamp replacement',
    description:
      'In the general Physics Optics Lab, sodium vapour lamp on Spectrometer Table 3 is flickering severely, causing inaccurate angle measurements in refractive index experiments.',
    category: 'DEPT_LAB_EQUIPMENT',
    scope: 'DEPARTMENT_WISE',
    departmentId: 'dept-phy',
    departmentName: 'Department of Physics',
    locationOnCampus: 'Physics Optics Darkroom (Table 3)',
    incidentDate: '2026-09-29',
    urgency: 'MEDIUM',
    isAnonymous: false,
    complainantName: 'Adarsh P. V.',
    complainantRole: 'STUDENT',
    complainantAdmissionNo: '2024PH012',
    status: 'SUBMITTED',
    actionNotes: [],
    submittedAt: '2026-09-29T14:30:00Z',
    updatedAt: '2026-09-29T14:30:00Z'
  },
  {
    id: 'grv-seed-05',
    ticketNumber: 'GRV-2026-5623',
    title: 'Economics Department Seminar Room audio projector connection',
    description:
      'The HDMI cable and ceiling audio system in the Department of Economics seminar room cuts off intermittently during student presentation seminars.',
    category: 'DEPT_FACILITY_OTHER',
    scope: 'DEPARTMENT_WISE',
    departmentId: 'dept-eco',
    departmentName: 'Department of Economics',
    locationOnCampus: 'Economics Seminar Hall',
    incidentDate: '2026-09-27',
    urgency: 'LOW',
    isAnonymous: false,
    complainantName: 'Meera Unnikrishnan',
    complainantRole: 'STUDENT',
    complainantAdmissionNo: '2024EC045',
    status: 'RESOLVED',
    resolutionSummary: 'Audio-visual technician replaced the HDMI extender and verified clean 1080p projection.',
    resolvedAt: '2026-09-28T16:00:00Z',
    resolvedBy: 'HOD, Department of Economics',
    actionNotes: [
      {
        id: 'note-05',
        timestamp: '2026-09-28T15:30:00Z',
        author: 'Dr. S. Radhakrishnan',
        role: 'Economics HOD',
        note: 'New high-speed HDMI gold-plated cable installed. Tested with 3 laptops.'
      }
    ],
    submittedAt: '2026-09-27T10:15:00Z',
    updatedAt: '2026-09-28T16:00:00Z'
  },
  {
    id: 'grv-seed-06',
    ticketNumber: 'GRV-2026-6734',
    title: 'Computer Lab 2 compiler environment for FYUGP Data Structures',
    description:
      'GCC compiler versions across systems 12 to 24 in Computer Science Lab 2 need standardization for modern C++20 practical modules.',
    category: 'DEPT_LAB_EQUIPMENT',
    scope: 'DEPARTMENT_WISE',
    departmentId: 'dept-cs',
    departmentName: 'Department of Computer Science',
    locationOnCampus: 'Computer Lab 2',
    incidentDate: '2026-09-28',
    urgency: 'MEDIUM',
    isAnonymous: false,
    complainantName: 'Ananya S. Nair',
    complainantRole: 'STUDENT',
    complainantAdmissionNo: 'ADM-2026-101',
    status: 'UNDER_INVESTIGATION',
    actionNotes: [
      {
        id: 'note-06',
        timestamp: '2026-09-30T11:20:00Z',
        author: 'HOD Computer Science',
        role: 'HOD Computer Science',
        note: 'Lab system admin instructed to push uniform Ubuntu image with GCC 13.2 across all terminal nodes.'
      }
    ],
    submittedAt: '2026-09-28T15:00:00Z',
    updatedAt: '2026-09-30T11:20:00Z'
  }
];

type ComplaintListener = (records: ComplaintRecord[]) => void;
const listeners = new Set<ComplaintListener>();

let hasInitializedFirebaseSync = false;

function notifyListeners(records: ComplaintRecord[]) {
  listeners.forEach((listener) => {
    try {
      listener(records);
    } catch (e) {
      console.error('Error invoking complaints listener:', e);
    }
  });
}

export const complaintsService = {
  /**
   * Synchronous retrieval from local cache for instant UI response
   */
  getAllComplaints(): ComplaintRecord[] {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      }
      return SEED_COMPLAINTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_COMPLAINTS;
    }
  },

  /**
   * Initializes real-time Firestore sync and seeds remote database if empty
   */
  initFirebaseSync(): () => void {
    if (typeof window === 'undefined' || hasInitializedFirebaseSync) {
      return () => {};
    }
    hasInitializedFirebaseSync = true;

    const complaintsCol = collection(db, FIRESTORE_COLLECTION);
    const q = query(complaintsCol, orderBy('submittedAt', 'desc'));

    // Set up real-time listener with proper error handling
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteRecords: ComplaintRecord[] = [];
          snapshot.forEach((docSnap) => {
            remoteRecords.push(docSnap.data() as ComplaintRecord);
          });

          // Save to local cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteRecords));
          notifyListeners(remoteRecords);
        } else {
          // If Firestore collection is empty, seed initial records to Firebase
          this.seedInitialToFirestore();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, FIRESTORE_COLLECTION);
      }
    );

    return unsubscribe;
  },

  /**
   * Seeds baseline records into Firestore
   */
  async seedInitialToFirestore(): Promise<void> {
    const local = this.getAllComplaints();
    const recordsToSeed = local.length > 0 ? local : SEED_COMPLAINTS;

    for (const record of recordsToSeed) {
      try {
        const ref = doc(db, FIRESTORE_COLLECTION, record.id);
        await setDoc(ref, record);
      } catch (error) {
        console.warn('Initial seeding error for complaint:', record.id, error);
      }
    }
  },

  /**
   * Subscribe component to live complaints data changes
   */
  subscribe(listener: ComplaintListener): () => void {
    listeners.add(listener);
    // Provide current state immediately
    listener(this.getAllComplaints());
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * STRICT ACCESS FILTERING:
   * - PRINCIPAL & SUPER_ADMIN: Can access ALL complaints (Statutory Anti-Ragging, Anti-Drug, Infrastructure, and Department-wise)
   * - HOD: Can ONLY access Department-Wise complaints for their specific department! (Statutory Anti-Ragging, Anti-Drug, and Infrastructure are STRICTLY HIDDEN)
   * - STUDENT: Can ONLY access their own submitted complaints
   */
  getComplaintsForRole(
    role: string,
    departmentId?: string,
    studentIdentifier?: string
  ): ComplaintRecord[] {
    const all = this.getAllComplaints();

    // STRICT ACCESS CONTROL:
    // Only PRINCIPAL and SUPER_ADMIN have campus-wide access to Anti-Ragging, Anti-Drug, Infrastructure, and all complaints
    if (role === 'SUPER_ADMIN' || role === 'PRINCIPAL') {
      return all;
    }

    // HOD can ONLY see department-wise complaints for their designated department
    // Anti-Ragging, Anti-Drug, and Campus Infrastructure are STRICTLY RESTRICTED and hidden from HODs
    if (role === 'HOD') {
      const activeDept = departmentId || 'dept-phy';
      return all.filter((c) => {
        return c.scope === 'DEPARTMENT_WISE' && c.departmentId === activeDept;
      });
    }

    if (role === 'STUDENT' && studentIdentifier) {
      const clean = studentIdentifier.trim().toUpperCase();
      return all.filter(
        (c) =>
          c.complainantAdmissionNo?.trim().toUpperCase() === clean ||
          c.complainantName?.trim().toUpperCase() === clean
      );
    }

    return [];
  },

  getComplaintByTicketNumber(ticketNumber: string): ComplaintRecord | undefined {
    if (!ticketNumber) return undefined;
    const clean = ticketNumber.trim().toUpperCase();
    const all = this.getAllComplaints();
    return all.find((c) => c.ticketNumber.trim().toUpperCase() === clean);
  },

  /**
   * Async lookup querying Firestore directly if not present in local cache
   */
  async findComplaintByTicketAsync(ticketNumber: string): Promise<ComplaintRecord | undefined> {
    if (!ticketNumber) return undefined;
    const clean = ticketNumber.trim().toUpperCase();
    const local = this.getComplaintByTicketNumber(clean);
    if (local) return local;

    try {
      const col = collection(db, FIRESTORE_COLLECTION);
      const q = query(col, where('ticketNumber', '==', clean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const item = snap.docs[0].data() as ComplaintRecord;
        return item;
      }
    } catch (e) {
      console.warn('Firestore lookup error:', e);
    }
    return undefined;
  },

  /**
   * Submits a complaint both to Firebase Firestore and local persistent cache
   */
  async submitComplaint(data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    departmentId?: string;
    departmentName?: string;
    locationOnCampus?: string;
    incidentDate?: string;
    urgency: ComplaintUrgency;
    isAnonymous: boolean;
    complainantName?: string;
    complainantRole?: 'STUDENT' | 'FACULTY' | 'PARENT' | 'VISITOR' | 'ANONYMOUS';
    complainantAdmissionNo?: string;
    complainantPhone?: string;
    complainantEmail?: string;
  }): Promise<{ success: boolean; complaint: ComplaintRecord }> {
    const meta = CATEGORY_CONFIG[data.category];
    const scope: ComplaintScope = meta ? meta.scope : 'CAMPUS_WIDE';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `GRV-2026-${randomSuffix}`;

    const newRecord: ComplaintRecord = {
      id: `grv-${Date.now()}-${randomSuffix}`,
      ticketNumber,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      scope,
      departmentId: scope === 'DEPARTMENT_WISE' ? data.departmentId : undefined,
      departmentName: scope === 'DEPARTMENT_WISE' ? data.departmentName : undefined,
      locationOnCampus: data.locationOnCampus?.trim() || undefined,
      incidentDate: data.incidentDate || new Date().toISOString().slice(0, 10),
      urgency: data.urgency,
      isAnonymous: data.isAnonymous,
      complainantName: data.isAnonymous ? undefined : data.complainantName?.trim(),
      complainantRole: data.isAnonymous ? 'ANONYMOUS' : data.complainantRole || 'STUDENT',
      complainantAdmissionNo: data.isAnonymous ? undefined : data.complainantAdmissionNo?.trim(),
      complainantPhone: data.isAnonymous ? undefined : data.complainantPhone?.trim(),
      complainantEmail: data.isAnonymous ? undefined : data.complainantEmail?.trim(),
      status: 'SUBMITTED',
      actionNotes: [],
      assignedOfficer:
        scope === 'DEPARTMENT_WISE'
          ? `Department of ${data.departmentName || 'Academic Subject'}`
          : data.category === 'ANTI_RAGGING'
          ? 'Anti-Ragging Squad & Grievance Desk'
          : data.category === 'ANTI_DRUG'
          ? 'Vimukthi Anti-Drug Vigilance Cell'
          : 'Campus Infrastructure & Works Cell',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately store in local cache
    const existing = this.getAllComplaints();
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);

    // 2. Persist to Firebase Firestore
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, newRecord.id);
      await setDoc(docRef, newRecord);
    } catch (error) {
      console.warn('Error saving to Firebase Firestore, stored locally:', error);
      handleFirestoreError(error, OperationType.CREATE, `${FIRESTORE_COLLECTION}/${newRecord.id}`);
    }

    return { success: true, complaint: newRecord };
  },

  /**
   * Updates complaint status / action notes in Firebase Firestore & local storage
   */
  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    author: string,
    role: string,
    actionNoteText?: string,
    resolutionSummary?: string
  ): Promise<{ success: boolean; complaint?: ComplaintRecord }> {
    const list = this.getAllComplaints();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return { success: false };

    const target = list[index];
    const now = new Date().toISOString();

    const notes = [...target.actionNotes];
    if (actionNoteText && actionNoteText.trim()) {
      notes.push({
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        author,
        role,
        note: actionNoteText.trim()
      });
    }

    const updated: ComplaintRecord = {
      ...target,
      status: newStatus,
      actionNotes: notes,
      resolutionSummary: resolutionSummary ? resolutionSummary.trim() : target.resolutionSummary,
      resolvedAt: newStatus === 'RESOLVED' ? now : target.resolvedAt,
      resolvedBy: newStatus === 'RESOLVED' ? `${author} (${role})` : target.resolvedBy,
      updatedAt: now
    };

    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyListeners(list);

    // Persist update to Firebase Firestore
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, updated.id);
      await setDoc(docRef, updated);
    } catch (error) {
      console.warn('Error updating complaint in Firebase Firestore:', error);
      handleFirestoreError(error, OperationType.UPDATE, `${FIRESTORE_COLLECTION}/${updated.id}`);
    }

    return { success: true, complaint: updated };
  },

  exportToCsv(list: ComplaintRecord[], filenamePrefix = 'nss_grievance_register'): void {
    const headers = [
      'Sl No',
      'Ticket Number',
      'Category',
      'Scope',
      'Department',
      'Urgency',
      'Status',
      'Title',
      'Description',
      'Campus Location',
      'Incident Date',
      'Complainant Type',
      'Complainant Name',
      'Admission / ID',
      'Submitted Date',
      'Resolved Date',
      'Resolution Summary'
    ];

    const rows = list.map((item, idx) => [
      idx + 1,
      `"${item.ticketNumber}"`,
      `"${CATEGORY_CONFIG[item.category]?.label || item.category}"`,
      `"${item.scope}"`,
      `"${item.departmentName || 'Campus-Wide / Statutory'}"`,
      `"${item.urgency}"`,
      `"${item.status}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${(item.locationOnCampus || '').replace(/"/g, '""')}"`,
      `"${item.incidentDate || ''}"`,
      `"${item.isAnonymous ? 'ANONYMOUS' : item.complainantRole || 'STUDENT'}"`,
      `"${item.isAnonymous ? 'ANONYMOUS (PROTECTED)' : (item.complainantName || '').replace(/"/g, '""')}"`,
      `"${item.isAnonymous ? '-' : item.complainantAdmissionNo || ''}"`,
      `"${new Date(item.submittedAt).toLocaleDateString('en-IN')}"`,
      `"${item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString('en-IN') : ''}"`,
      `"${(item.resolutionSummary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Initialize Firebase Sync automatically in browser environment
if (typeof window !== 'undefined') {
  complaintsService.initFirebaseSync();
}
