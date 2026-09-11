export type StandardRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "RECEPTIONIST"
  | "PHARMACIST"
  | "ACCOUNTANT"
  | "LAB_TECHNICIAN"
  | "RADIOLOGY_TECHNICIAN"
  | "PATIENT";

export type UserRole =
  | StandardRole
  | "super_admin"
  | "hospital_admin"
  | "admin"
  | "doctor"
  | "receptionist"
  | "nurse"
  | "pharmacist"
  | "lab_technician"
  | "radiology_technician"
  | "accountant"
  | "patient";

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  patientId?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  status: "active" | "inactive" | "suspended" | "Active" | "Inactive" | "Suspended";
  digitalSignature?: string;
  mciRegistrationNumber?: string;
  qualification?: string;
  bio?: string;
  createdAt?: string;
}

export interface IPatient {
  _id?: string;
  patientId: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  age: number;
  phone: string;
  email?: string;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  address: string;
  city: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
  abhaNumber?: string;
  abhaAddress?: string;
  status: "Active" | "Discharged" | "Outpatient" | "Inpatient";
  createdAt?: string;
  updatedAt?: string;
}

export interface IDoctor {
  _id?: string;
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  emergencyFee?: number;
  teleconsultationFee?: number;
  roomNumber: string;
  mciNumber?: string;
  digitalSignature?: string;
  bio?: string;
  slotDurationMinutes?: number;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  status: "Active" | "On Leave" | "Inactive";
  photo?: string;
  rating?: number;
  totalReviews?: number;
}

export interface IDepartment {
  _id?: string;
  name: string;
  code: string;
  description: string;
  headDoctor?: string;
  floor: string;
  icon?: string;
  services?: string[];
  totalBeds?: number;
  occupiedBeds?: number;
  status: "Active" | "Inactive";
  totalDoctors?: number;
}

export interface IAppointment {
  _id?: string;
  appointmentId: string;
  patient: IPatient | string;
  doctor: IDoctor | string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  type: "General" | "Follow-up" | "Emergency" | "Routine Checkup" | "Teleconsultation";
  status: "Scheduled" | "Confirmed" | "Checked In" | "In Consultation" | "Completed" | "Cancelled" | "No Show";
  reason: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    spo2?: string;
    weight?: string;
    height?: string;
  };
  meetingUrl?: string;
  clinicalNotes?: string;
  createdAt?: string;
}

export interface IOpdRecord {
  _id?: string;
  tokenNumber: number;
  patient: IPatient | string;
  doctor: IDoctor | string;
  department: string;
  date: string;
  vitals: {
    bp: string;
    pulse: string;
    temperature: string;
    spo2: string;
    weight: string;
    height: string;
  };
  symptoms: string;
  diagnosis?: string;
  status: "Waiting" | "In Consultation" | "Completed" | "Referred";
  createdAt?: string;
}

export interface IBed {
  _id?: string;
  bedNumber: string;
  ward: string;
  roomNumber: string;
  type: "General" | "ICU" | "Semi-Private" | "Deluxe" | "Emergency";
  dailyRate: number;
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
  currentAdmission?: string;
  patientName?: string;
}

export interface IAdmission {
  _id?: string;
  admissionId: string;
  patient: IPatient | string;
  doctor: IDoctor | string;
  department: string;
  ward: string;
  roomNumber: string;
  bed: IBed | string;
  admissionDate: string;
  dischargeDate?: string;
  admissionReason: string;
  treatmentPlan?: string;
  vitalsLog?: Array<{
    date: string;
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
    recordedBy: string;
  }>;
  status: "Admitted" | "Under Treatment" | "Ready for Discharge" | "Discharged";
  dischargeSummary?: string;
}

export interface IPrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IPrescription {
  _id?: string;
  prescriptionId: string;
  patient: IPatient | string;
  doctor: IDoctor | string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  clinicalNotes?: string;
  medicines: IPrescriptionItem[];
  labAdvice?: string[];
  followUpDate?: string;
  digitalSignature?: string;
  status: "Active" | "Dispensed" | "Completed";
  createdAt?: string;
}

export interface IMedicine {
  _id?: string;
  name: string;
  genericName: string;
  category: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Ointment" | "Drops" | "Inhaler";
  manufacturer: string;
  batchNumber: string;
  stockQuantity: number;
  minThreshold: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  locationRack: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Expired";
}

export interface ILabTest {
  _id?: string;
  testCode: string;
  name: string;
  category: "Hematology" | "Biochemistry" | "Microbiology" | "Immunology" | "Pathology" | "Urine";
  price: number;
  sampleType: string;
  turnaroundTime: string;
  referenceRanges: Array<{
    parameter: string;
    unit: string;
    normalMale: string;
    normalFemale: string;
  }>;
  description: string;
  status: "Active" | "Inactive";
}

export interface ILabOrder {
  _id?: string;
  orderId: string;
  patient: IPatient | string;
  doctor: IDoctor | string;
  tests: Array<{
    test: ILabTest | string;
    name: string;
    price: number;
    results?: Array<{
      parameter: string;
      value: string;
      unit: string;
      referenceRange: string;
      flag?: "Normal" | "High" | "Low" | "Abnormal";
    }>;
  }>;
  orderDate: string;
  status: "Ordered" | "Sample Collected" | "Processing" | "Completed" | "Cancelled";
  clinicalFindings?: string;
  technicianNotes?: string;
  completedAt?: string;
}

export interface IRadiologyOrder {
  _id?: string;
  orderId: string;
  patient: IPatient | string;
  doctor: IDoctor | string;
  modality: "X-Ray" | "CT Scan" | "MRI" | "Ultrasound" | "Mammography";
  bodyPart: string;
  clinicalNotes: string;
  orderDate: string;
  status: "Ordered" | "Scheduled" | "In Progress" | "Completed" | "Report Generated";
  radiologistReport?: string;
  impression?: string;
  price: number;
}

export interface IInvoiceItem {
  description: string;
  category: "Consultation" | "Pharmacy" | "Laboratory" | "Radiology" | "Room Charges" | "Procedure" | "Nursing" | "Package" | "Other";
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice {
  _id?: string;
  invoiceNumber: string;
  patient: IPatient | string;
  doctor?: IDoctor | string;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: "Paid" | "Partially Paid" | "Pending" | "Cancelled";
  paymentMethod?: "Cash" | "Credit Card" | "Debit Card" | "UPI" | "Bank Transfer" | "Insurance" | "ABHA Pay";
  insuranceClaimId?: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
}

export interface IStaff {
  _id?: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: "Active" | "On Leave" | "Terminated";
}

export interface IInventoryItem {
  _id?: string;
  itemCode: string;
  name: string;
  category: "Surgical" | "Equipment" | "Consumables" | "Diagnostic Supplies" | "Sanitation";
  quantity: number;
  minThreshold: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  lastRestocked: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface INotification {
  _id?: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  link?: string;
  read: boolean;
  createdAt: string;
}

// ----------------- ABHA / ABDM SYSTEM -----------------
export interface IAbhaCard {
  _id?: string;
  abhaNumber: string; // 14-digit: 12-3456-7890-1234
  abhaAddress: string; // username@abdm
  fullName: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  mobile: string;
  aadhaarLast4: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  patientId?: string;
  photoUrl?: string;
  qrData?: string;
  verificationStatus: "Verified" | "Pending" | "Failed";
  careContexts?: Array<{
    contextType: "OPD Visit" | "Prescription" | "Diagnostic Report" | "Discharge Summary";
    referenceId: string;
    title: string;
    linkedDate: string;
  }>;
  consentRequests?: Array<{
    requestId: string;
    requesterName: string;
    purpose: string;
    grantedFrom: string;
    grantedTo: string;
    status: "Granted" | "Requested" | "Revoked" | "Expired";
  }>;
  createdAt?: string;
}

// ----------------- AI CLINICAL CO-PILOT -----------------
export interface IAiConsultation {
  _id?: string;
  patientId?: string;
  patientName?: string;
  age?: number;
  gender?: string;
  symptoms: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    spo2?: string;
    sugar?: string;
  };
  differentialDiagnosis: Array<{
    condition: string;
    probability: number;
    icd10Code: string;
    explanation: string;
    urgencyLevel: "Low" | "Moderate" | "High" | "Emergency";
  }>;
  recommendedTests: string[];
  suggestedPrescription: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    rational: string;
  }>;
  drugInteractions?: string[];
  redFlagWarnings: string[];
  lifestyleAdvice: string[];
  soapNotes?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  createdAt?: string;
}

// ----------------- HEALTH PACKAGES -----------------
export interface IHealthPackage {
  _id?: string;
  packageCode: string;
  name: string;
  category: "Preventive" | "Cardiac" | "Maternity" | "Senior Citizen" | "Executive" | "Diabetes" | "Women Health";
  price: number;
  originalPrice: number;
  description: string;
  features: string[];
  includedTests: string[];
  includedConsultations: string[];
  durationDays: number;
  popular?: boolean;
  status: "Active" | "Inactive";
}

// ----------------- TPA & INSURANCE CLAIMS -----------------
export interface IInsuranceClaim {
  _id?: string;
  claimId: string;
  patient: IPatient | string;
  tpaCompany: string;
  policyNumber: string;
  policyHolderName: string;
  hospitalizationType: "Cashless" | "Reimbursement";
  claimedAmount: number;
  approvedAmount?: number;
  admissionId?: string;
  treatmentName: string;
  status: "Draft" | "Submitted" | "Under Query" | "Approved" | "Settled" | "Rejected";
  queryDetails?: string;
  claimDate: string;
  settledDate?: string;
  documents?: string[];
}

// ----------------- PATIENT REFERRAL -----------------
export interface IReferral {
  _id?: string;
  referralId: string;
  patient: IPatient | string;
  referringDoctor: IDoctor | string;
  destinationHospital: string;
  destinationDepartment: string;
  destinationSpecialist?: string;
  diagnosis: string;
  reasonForReferral: string;
  clinicalSummary?: string;
  priority: "Normal" | "Urgent" | "Emergency";
  status: "Pending" | "Sent" | "Accepted" | "Rejected" | "Completed" | "Cancelled";
  referralDate: string;
  notes?: string;
  createdBy?: string;
  transportRequired?: boolean;
  accompanyingNurse?: string;
  createdAt?: string;
  updatedAt?: string;
}
