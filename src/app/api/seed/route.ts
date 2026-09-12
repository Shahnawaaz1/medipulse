import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/models/User";
import { Doctor } from "@/models/Doctor";
import { Patient } from "@/models/Patient";
import { Department } from "@/models/Department";
import { Bed } from "@/models/Bed";
import { Admission } from "@/models/Admission";
import { Medicine } from "@/models/Medicine";
import { LabTest } from "@/models/LabTest";
import { LabOrder } from "@/models/LabOrder";
import { Appointment } from "@/models/Appointment";
import { OpdRecord } from "@/models/OpdRecord";
import { Prescription } from "@/models/Prescription";
import { RadiologyOrder } from "@/models/RadiologyOrder";
import { Invoice } from "@/models/Invoice";
import { Staff } from "@/models/Staff";
import { Inventory } from "@/models/Inventory";
import { Notification } from "@/models/Notification";
import { HospitalSetting } from "@/models/HospitalSetting";
import EmergencyCase from "@/models/EmergencyCase";
import IcuRecord from "@/models/IcuRecord";
import OperationTheatre from "@/models/OperationTheatre";
import NursingCare from "@/models/NursingCare";
import DischargeSummary from "@/models/DischargeSummary";
import PurchaseOrder from "@/models/PurchaseOrder";
import AuditLog from "@/models/AuditLog";
import TeleconsultationSession from "@/models/TeleconsultationSession";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await connectToDatabase();

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Department.deleteMany({}),
      Bed.deleteMany({}),
      Admission.deleteMany({}),
      Medicine.deleteMany({}),
      LabTest.deleteMany({}),
      LabOrder.deleteMany({}),
      Appointment.deleteMany({}),
      OpdRecord.deleteMany({}),
      Prescription.deleteMany({}),
      RadiologyOrder.deleteMany({}),
      Invoice.deleteMany({}),
      Staff.deleteMany({}),
      Inventory.deleteMany({}),
      Notification.deleteMany({}),
      HospitalSetting.deleteMany({}),
      EmergencyCase.deleteMany({}),
      IcuRecord.deleteMany({}),
      OperationTheatre.deleteMany({}),
      NursingCare.deleteMany({}),
      DischargeSummary.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      AuditLog.deleteMany({}),
      TeleconsultationSession.deleteMany({}),
    ]);

    // Hospital Settings
    await HospitalSetting.create({
      hospitalName: "MediPulse Hospital & Medical Institute",
      tagline: "World-Class Compassionate Healthcare & Research",
      email: "info@medipulsehospital.com",
      phone: "+1 (800) 456-7890",
      emergencyHotline: "+1 (800) 911-0000",
      address: "742 Healthcare Avenue, Medical District",
      city: "Metropolis",
      state: "NY",
      zipCode: "10001",
      taxId: "TX-MED-883921",
      currencySymbol: "$",
      timezone: "America/New_York",
    });

    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.insertMany([
      { name: "Dr. Alexander Wright", email: "admin@hospital.com", password: hashedPassword, role: "SUPER_ADMIN", employeeId: "STF-ADMIN-01", phone: "+1 555-0100", department: "Administration", status: "active", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80" },
      { name: "Dr. Sarah Jenkins", email: "doctor@hospital.com", password: hashedPassword, role: "DOCTOR", employeeId: "DOC-2026-001", phone: "+1 555-0101", department: "Cardiology", status: "active", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80" },
      { name: "Emma Davis", email: "receptionist@hospital.com", password: hashedPassword, role: "RECEPTIONIST", employeeId: "STF-102", phone: "+1 555-0102", department: "Front Desk", status: "active", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
      { name: "Nurse Clara Oswald", email: "nurse@hospital.com", password: hashedPassword, role: "NURSE", employeeId: "STF-103", phone: "+1 555-0103", department: "Inpatient Ward", status: "active", avatar: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80" },
      { name: "Marcus Vance", email: "pharmacist@hospital.com", password: hashedPassword, role: "PHARMACIST", employeeId: "STF-104", phone: "+1 555-0104", department: "Pharmacy", status: "active", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80" },
      { name: "David Chen", email: "lab@hospital.com", password: hashedPassword, role: "LAB_TECHNICIAN", employeeId: "STF-105", phone: "+1 555-0105", department: "Laboratory", status: "active", avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80" },
      { name: "Arthur Pendelton", email: "billing@hospital.com", password: hashedPassword, role: "ACCOUNTANT", employeeId: "STF-106", phone: "+1 555-0106", department: "Finance & Accounts", status: "active", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
      { name: "Elena Rostova", email: "radiology@hospital.com", password: hashedPassword, role: "RADIOLOGY_TECHNICIAN", employeeId: "STF-107", phone: "+1 555-0108", department: "Radiology & Imaging", status: "active", avatar: "https://images.unsplash.com/photo-1594824813580-b2b93e506941?w=150&auto=format&fit=crop&q=80" },
      { name: "John Miller", email: "patient@hospital.com", password: hashedPassword, role: "PATIENT", patientId: "PAT-8001", phone: "+1 555-0107", department: "Patient", status: "active", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    ]);

    await Department.insertMany([
      { name: "Cardiology", code: "CARD", description: "Heart and cardiovascular care", headDoctor: "Dr. Sarah Jenkins", floor: "3rd Floor", totalDoctors: 3 },
      { name: "Neurology", code: "NEUR", description: "Brain and nervous system", headDoctor: "Dr. Robert Sterling", floor: "4th Floor", totalDoctors: 2 },
      { name: "Orthopedics", code: "ORTH", description: "Bones, joints, and spine", headDoctor: "Dr. Ethan Miller", floor: "2nd Floor", totalDoctors: 2 },
      { name: "Pediatrics", code: "PEDI", description: "Child health care", headDoctor: "Dr. Emily Taylor", floor: "1st Floor", totalDoctors: 2 },
      { name: "General Medicine", code: "GMED", description: "Primary diagnosis & general health", headDoctor: "Dr. James Wilson", floor: "1st Floor", totalDoctors: 4 },
      { name: "Emergency Medicine", code: "EMER", description: "24/7 Level-1 trauma", headDoctor: "Dr. Michael Hayes", floor: "Ground Floor", totalDoctors: 5 },
      { name: "Gynecology & Obstetrics", code: "GYOB", description: "Women's health & maternity", headDoctor: "Dr. Lisa Martinez", floor: "3rd Floor", totalDoctors: 2 },
      { name: "Radiology & Imaging", code: "RADI", description: "Diagnostic imaging", headDoctor: "Dr. Kevin Scott", floor: "Basement 1", totalDoctors: 2 },
    ]);

    const createdDocs = await Doctor.insertMany([
      { doctorId: "DOC-1001", name: "Dr. Sarah Jenkins", email: "sjenkins@hospital.com", phone: "+1 555-2011", department: "Cardiology", specialization: "Interventional Cardiology", qualification: "MD, FACC", experienceYears: 14, consultationFee: 120, roomNumber: "Room 301", availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], workingHours: { start: "09:00 AM", end: "04:00 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80" },
      { doctorId: "DOC-1002", name: "Dr. Robert Sterling", email: "rsterling@hospital.com", phone: "+1 555-2012", department: "Neurology", specialization: "Neuro-Oncology", qualification: "MD, PhD", experienceYears: 18, consultationFee: 150, roomNumber: "Room 402", availableDays: ["Monday", "Wednesday", "Friday"], workingHours: { start: "10:00 AM", end: "05:00 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80" },
      { doctorId: "DOC-1003", name: "Dr. Ethan Miller", email: "emiller@hospital.com", phone: "+1 555-2013", department: "Orthopedics", specialization: "Joint Replacement", qualification: "MS Ortho", experienceYears: 11, consultationFee: 100, roomNumber: "Room 205", availableDays: ["Tuesday", "Thursday", "Saturday"], workingHours: { start: "08:30 AM", end: "03:30 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80" },
      { doctorId: "DOC-1004", name: "Dr. Emily Taylor", email: "etaylor@hospital.com", phone: "+1 555-2014", department: "Pediatrics", specialization: "Pediatric Critical Care", qualification: "MD Pediatrics", experienceYears: 9, consultationFee: 90, roomNumber: "Room 108", availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], workingHours: { start: "09:00 AM", end: "02:00 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1594824813598-a6f9587e9545?w=150&auto=format&fit=crop&q=80" },
      { doctorId: "DOC-1005", name: "Dr. James Wilson", email: "jwilson@hospital.com", phone: "+1 555-2015", department: "General Medicine", specialization: "Internal Medicine", qualification: "MD Internal Med", experienceYears: 16, consultationFee: 80, roomNumber: "Room 102", availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], workingHours: { start: "08:00 AM", end: "04:00 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80" },
      { doctorId: "DOC-1006", name: "Dr. Lisa Martinez", email: "lmartinez@hospital.com", phone: "+1 555-2016", department: "Gynecology & Obstetrics", specialization: "High-Risk Pregnancy", qualification: "MS OB-GYN", experienceYears: 12, consultationFee: 110, roomNumber: "Room 312", availableDays: ["Monday", "Wednesday", "Thursday", "Friday"], workingHours: { start: "09:30 AM", end: "04:30 PM" }, status: "Active", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80" },
    ]);

    const createdPats = await Patient.insertMany([
      { patientId: "PAT-8001", name: "Eleanor Bennett", gender: "Female", dob: "1988-04-12", age: 38, phone: "+1 555-8801", email: "eleanor.bennett@example.com", bloodGroup: "O+", address: "42 Willow Street", city: "Metropolis", emergencyContact: { name: "Mark Bennett", relationship: "Spouse", phone: "+1 555-8802" }, allergies: ["Penicillin", "Sulfa drugs"], medicalHistory: ["Hypertension (2019)", "Mild Asthma"], status: "Active" },
      { patientId: "PAT-8002", name: "Arthur Pendelton", gender: "Male", dob: "1965-11-23", age: 60, phone: "+1 555-8803", email: "arthur.p@example.com", bloodGroup: "A+", address: "108 Oakridge Boulevard", city: "Metropolis", emergencyContact: { name: "Helen Pendelton", relationship: "Wife", phone: "+1 555-8804" }, allergies: ["Aspirin"], medicalHistory: ["Type 2 Diabetes Mellitus", "Coronary Artery Stent (2021)"], status: "Inpatient" },
      { patientId: "PAT-8003", name: "Sophia Rodriguez", gender: "Female", dob: "1994-08-15", age: 32, phone: "+1 555-8805", email: "sophia.rodriguez@example.com", bloodGroup: "B+", address: "712 Sunset Avenue", city: "Metropolis", emergencyContact: { name: "Carlos Rodriguez", relationship: "Brother", phone: "+1 555-8806" }, allergies: ["Peanuts", "Latex"], medicalHistory: ["Migraines", "Iron deficiency anemia"], status: "Outpatient" },
      { patientId: "PAT-8004", name: "Lucas Vance", gender: "Male", dob: "2015-06-05", age: 11, phone: "+1 555-8807", email: "vance.family@example.com", bloodGroup: "AB+", address: "319 Pine Court", city: "Metropolis", emergencyContact: { name: "Hannah Vance", relationship: "Mother", phone: "+1 555-8808" }, allergies: [], medicalHistory: ["Seasonal Allergies"], status: "Active" },
      { patientId: "PAT-8005", name: "David Kim", gender: "Male", dob: "1980-01-30", age: 46, phone: "+1 555-8809", email: "david.kim@example.com", bloodGroup: "O-", address: "55 Harbor Drive", city: "Metropolis", emergencyContact: { name: "Grace Kim", relationship: "Sister", phone: "+1 555-8810" }, allergies: ["Iodine Contrast"], medicalHistory: ["Herniated Disc L4-L5", "Sciatica"], status: "Inpatient" },
      { patientId: "PAT-8006", name: "Maya Patel", gender: "Female", dob: "1991-03-19", age: 35, phone: "+1 555-8811", email: "maya.patel@example.com", bloodGroup: "A-", address: "940 High Street", city: "Metropolis", emergencyContact: { name: "Dev Patel", relationship: "Spouse", phone: "+1 555-8812" }, allergies: ["Amoxicillin"], medicalHistory: ["Gestational Diabetes (Past)", "Hypothyroidism"], status: "Active" },
    ]);

    const createdBeds = await Bed.insertMany([
      { bedNumber: "ICU-01", ward: "Intensive Care Unit (ICU)", roomNumber: "ICU Pod A", type: "ICU", dailyRate: 450, status: "Occupied", patientName: "Arthur Pendelton" },
      { bedNumber: "ICU-02", ward: "Intensive Care Unit (ICU)", roomNumber: "ICU Pod A", type: "ICU", dailyRate: 450, status: "Available" },
      { bedNumber: "ICU-03", ward: "Intensive Care Unit (ICU)", roomNumber: "ICU Pod B", type: "ICU", dailyRate: 450, status: "Maintenance" },
      { bedNumber: "GEN-101", ward: "General Ward (Male)", roomNumber: "Room 101", type: "General", dailyRate: 90, status: "Occupied", patientName: "David Kim" },
      { bedNumber: "GEN-102", ward: "General Ward (Male)", roomNumber: "Room 101", type: "General", dailyRate: 90, status: "Available" },
      { bedNumber: "GEN-103", ward: "General Ward (Male)", roomNumber: "Room 102", type: "General", dailyRate: 90, status: "Available" },
      { bedNumber: "GEN-201", ward: "General Ward (Female)", roomNumber: "Room 201", type: "General", dailyRate: 90, status: "Available" },
      { bedNumber: "GEN-202", ward: "General Ward (Female)", roomNumber: "Room 201", type: "General", dailyRate: 90, status: "Reserved" },
      { bedNumber: "DEL-301", ward: "Deluxe Suite Wing", roomNumber: "Suite 301", type: "Deluxe", dailyRate: 300, status: "Available" },
      { bedNumber: "DEL-302", ward: "Deluxe Suite Wing", roomNumber: "Suite 302", type: "Deluxe", dailyRate: 300, status: "Available" },
      { bedNumber: "EME-01", ward: "Emergency Trauma Wing", roomNumber: "Bay 1", type: "Emergency", dailyRate: 200, status: "Available" },
      { bedNumber: "EME-02", ward: "Emergency Trauma Wing", roomNumber: "Bay 2", type: "Emergency", dailyRate: 200, status: "Occupied", patientName: "Emergency Patient" },
    ]);

    const createdAdmissions = await Admission.insertMany([
      { admissionId: "ADM-9001", patient: createdPats[1]._id, doctor: createdDocs[0]._id, department: "Cardiology", ward: "Intensive Care Unit (ICU)", roomNumber: "ICU Pod A", bed: createdBeds[0]._id, admissionDate: "2026-09-08", admissionReason: "Post-cardiac catheterization monitoring & acute chest pain", treatmentPlan: "Continuous cardiac telemetry, IV Heparin.", vitalsLog: [{ date: "2026-09-11 06:00 AM", bp: "128/82", pulse: "74 bpm", temp: "98.4 °F", spo2: "98%", recordedBy: "Nurse Clara" }], status: "Admitted" },
      { admissionId: "ADM-9002", patient: createdPats[4]._id, doctor: createdDocs[2]._id, department: "Orthopedics", ward: "General Ward (Male)", roomNumber: "Room 101", bed: createdBeds[3]._id, admissionDate: "2026-09-09", admissionReason: "Severe lumbar radiculopathy", treatmentPlan: "Physiotherapy, analgesics.", vitalsLog: [{ date: "2026-09-10 09:00 AM", bp: "120/80", pulse: "72 bpm", temp: "98.6 °F", spo2: "99%", recordedBy: "Nurse Clara" }], status: "Admitted" },
    ]);

    await Medicine.insertMany([
      { name: "Amoxicillin & Clavulanate 625mg", genericName: "Amoxicillin / Clavulanic Acid", category: "Tablet", manufacturer: "GSK", batchNumber: "AMX-9482", stockQuantity: 450, minThreshold: 50, purchasePrice: 4.5, sellingPrice: 9.0, expiryDate: "2027-10-31", locationRack: "Rack A-01", status: "In Stock" },
      { name: "Atorvastatin 20mg", genericName: "Atorvastatin Calcium", category: "Tablet", manufacturer: "Pfizer", batchNumber: "ATV-1120", stockQuantity: 320, minThreshold: 40, purchasePrice: 3.2, sellingPrice: 7.5, expiryDate: "2027-06-15", locationRack: "Rack A-04", status: "In Stock" },
      { name: "Metformin 500mg ER", genericName: "Metformin Hydrochloride", category: "Tablet", manufacturer: "Merck", batchNumber: "MET-5541", stockQuantity: 600, minThreshold: 60, purchasePrice: 1.8, sellingPrice: 4.5, expiryDate: "2028-01-20", locationRack: "Rack B-02", status: "In Stock" },
      { name: "Paracetamol 650mg", genericName: "Acetaminophen", category: "Tablet", manufacturer: "Abbott", batchNumber: "PCM-8832", stockQuantity: 1200, minThreshold: 100, purchasePrice: 0.5, sellingPrice: 1.5, expiryDate: "2027-12-31", locationRack: "Rack C-01", status: "In Stock" },
      { name: "Pantoprazole 40mg", genericName: "Pantoprazole Sodium", category: "Tablet", manufacturer: "Sun Pharma", batchNumber: "PAN-3391", stockQuantity: 500, minThreshold: 50, purchasePrice: 2.0, sellingPrice: 5.0, expiryDate: "2027-08-10", locationRack: "Rack B-05", status: "In Stock" },
      { name: "Ceftriaxone 1g Injection", genericName: "Ceftriaxone", category: "Injection", manufacturer: "Roche", batchNumber: "CEF-7721", stockQuantity: 85, minThreshold: 20, purchasePrice: 6.0, sellingPrice: 15.0, expiryDate: "2026-12-31", locationRack: "Cold Storage 1", status: "In Stock" },
      { name: "Salbutamol Inhaler 100mcg", genericName: "Albuterol Sulfate", category: "Inhaler", manufacturer: "Cipla", batchNumber: "SAL-4402", stockQuantity: 8, minThreshold: 15, purchasePrice: 8.0, sellingPrice: 18.0, expiryDate: "2026-11-30", locationRack: "Rack D-01", status: "Low Stock" },
      { name: "Cough Relief Expectorant 100ml", genericName: "Guaifenesin", category: "Syrup", manufacturer: "J&J", batchNumber: "SYR-2299", stockQuantity: 140, minThreshold: 25, purchasePrice: 3.5, sellingPrice: 7.5, expiryDate: "2027-04-18", locationRack: "Rack S-02", status: "In Stock" },
    ]);

    const createdTests = await LabTest.insertMany([
      { testCode: "LAB-CBC", name: "Complete Blood Count (CBC)", category: "Hematology", price: 35, sampleType: "Whole Blood", turnaroundTime: "4 Hours", referenceRanges: [{ parameter: "Hemoglobin", unit: "g/dL", normalMale: "13.5 - 17.5", normalFemale: "12.0 - 15.5" }, { parameter: "WBC", unit: "10^3/uL", normalMale: "4.5 - 11.0", normalFemale: "4.5 - 11.0" }], description: "Screening test for blood disorders." },
      { testCode: "LAB-LIPID", name: "Comprehensive Lipid Panel", category: "Biochemistry", price: 45, sampleType: "Serum", turnaroundTime: "6 Hours", referenceRanges: [{ parameter: "Cholesterol", unit: "mg/dL", normalMale: "< 200", normalFemale: "< 200" }, { parameter: "Triglycerides", unit: "mg/dL", normalMale: "< 150", normalFemale: "< 150" }], description: "Lipid risk assessment." },
      { testCode: "LAB-HBA1C", name: "Glycated Hemoglobin (HbA1c)", category: "Biochemistry", price: 30, sampleType: "Whole Blood", turnaroundTime: "4 Hours", referenceRanges: [{ parameter: "HbA1c", unit: "%", normalMale: "4.0 - 5.6", normalFemale: "4.0 - 5.6" }], description: "3-month glucose monitoring." },
      { testCode: "LAB-LFT", name: "Liver Function Panel (LFT)", category: "Biochemistry", price: 50, sampleType: "Serum", turnaroundTime: "6 Hours", referenceRanges: [{ parameter: "SGOT", unit: "U/L", normalMale: "10 - 40", normalFemale: "9 - 32" }, { parameter: "SGPT", unit: "U/L", normalMale: "10 - 45", normalFemale: "7 - 35" }], description: "Liver health." },
    ]);

    const today = new Date().toISOString().split("T")[0];
    await Appointment.insertMany([
      { appointmentId: "APT-2026-001", patient: createdPats[0]._id, doctor: createdDocs[0]._id, department: "Cardiology", appointmentDate: today, timeSlot: "09:30 AM - 10:00 AM", type: "Routine Checkup", status: "Confirmed", reason: "Quarterly hypertension evaluation", vitals: { bp: "126/82", pulse: "74 bpm", temperature: "98.6 °F", spo2: "99%", weight: "64 kg", height: "165 cm" } },
      { appointmentId: "APT-2026-002", patient: createdPats[2]._id, doctor: createdDocs[4]._id, department: "General Medicine", appointmentDate: today, timeSlot: "10:30 AM - 11:00 AM", type: "General", status: "In Consultation", reason: "Persistent fatigue and headache", vitals: { bp: "115/75", pulse: "80 bpm", temperature: "99.1 °F", spo2: "98%", weight: "58 kg", height: "162 cm" } },
      { appointmentId: "APT-2026-003", patient: createdPats[3]._id, doctor: createdDocs[3]._id, department: "Pediatrics", appointmentDate: today, timeSlot: "11:30 AM - 12:00 PM", type: "General", status: "Scheduled", reason: "Mild fever and sore throat" },
      { appointmentId: "APT-2026-004", patient: createdPats[5]._id, doctor: createdDocs[5]._id, department: "Gynecology & Obstetrics", appointmentDate: today, timeSlot: "02:00 PM - 02:30 PM", type: "Routine Checkup", status: "Scheduled", reason: "Prenatal checkup 24 weeks" },
    ]);

    await OpdRecord.insertMany([
      { tokenNumber: 101, patient: createdPats[0]._id, doctor: createdDocs[0]._id, department: "Cardiology", date: today, vitals: { bp: "126/82", pulse: "74 bpm", temperature: "98.6 °F", spo2: "99%", weight: "64 kg", height: "165 cm" }, symptoms: "Mild palpitations", diagnosis: "Controlled Essential Hypertension", status: "Completed" },
      { tokenNumber: 102, patient: createdPats[2]._id, doctor: createdDocs[4]._id, department: "General Medicine", date: today, vitals: { bp: "115/75", pulse: "80 bpm", temperature: "99.1 °F", spo2: "98%", weight: "58 kg", height: "162 cm" }, symptoms: "Fatigue, fever", diagnosis: "Viral Upper Respiratory Infection", status: "In Consultation" },
      { tokenNumber: 103, patient: createdPats[3]._id, doctor: createdDocs[3]._id, department: "Pediatrics", date: today, vitals: { bp: "105/70", pulse: "92 bpm", temperature: "99.8 °F", spo2: "99%", weight: "32 kg", height: "135 cm" }, symptoms: "Sore throat", status: "Waiting" },
    ]);

    await Prescription.insertMany([
      { prescriptionId: "RX-4001", patient: createdPats[0]._id, doctor: createdDocs[0]._id, date: today, diagnosis: "Primary Hypertension & Hyperlipidemia", clinicalNotes: "Low-sodium diet advised.", medicines: [{ medicineName: "Atorvastatin 20mg", dosage: "20mg", frequency: "0-0-1", duration: "30 Days", instructions: "Bedtime" }, { medicineName: "Pantoprazole 40mg", dosage: "40mg", frequency: "1-0-0", duration: "14 Days", instructions: "Before food" }], labAdvice: ["Lipid Panel"], followUpDate: "2026-10-15", status: "Active" },
    ]);

    await LabOrder.insertMany([
      { orderId: "LBO-3001", patient: createdPats[0]._id, doctor: createdDocs[0]._id, tests: [{ test: createdTests[1]._id, name: "Comprehensive Lipid Panel", price: 45, results: [{ parameter: "Total Cholesterol", value: "188", unit: "mg/dL", referenceRange: "< 200", flag: "Normal" }, { parameter: "LDL Cholesterol", value: "106", unit: "mg/dL", referenceRange: "< 100", flag: "High" }] }], orderDate: today, status: "Completed", clinicalFindings: "Mild LDL elevation." },
      { orderId: "LBO-3002", patient: createdPats[2]._id, doctor: createdDocs[4]._id, tests: [{ test: createdTests[0]._id, name: "Complete Blood Count (CBC)", price: 35 }], orderDate: today, status: "Sample Collected" },
    ]);

    await RadiologyOrder.insertMany([
      { orderId: "RAD-5001", patient: createdPats[4]._id, doctor: createdDocs[2]._id, modality: "MRI", bodyPart: "Lumbar Spine", clinicalNotes: "Rule out L4-L5 herniation", orderDate: today, status: "Report Generated", radiologistReport: "L4-L5 disc protrusion.", impression: "Mild L5 radicular irritation.", price: 280 },
      { orderId: "RAD-5002", patient: createdPats[1]._id, doctor: createdDocs[0]._id, modality: "X-Ray", bodyPart: "Chest PA View", clinicalNotes: "Post-op chest check", orderDate: today, status: "Scheduled", price: 65 },
    ]);

    await Invoice.insertMany([
      { invoiceNumber: "INV-2026-101", patient: createdPats[0]._id, doctor: createdDocs[0]._id, items: [{ description: "Cardiology Consultation", category: "Consultation", quantity: 1, unitPrice: 120, total: 120 }, { description: "Lipid Panel", category: "Laboratory", quantity: 1, unitPrice: 45, total: 45 }], subtotal: 165, discount: 0, tax: 8.25, totalAmount: 173.25, paidAmount: 173.25, balanceAmount: 0, paymentStatus: "Paid", paymentMethod: "Credit Card", invoiceDate: today, dueDate: today },
      { invoiceNumber: "INV-2026-102", patient: createdPats[1]._id, doctor: createdDocs[0]._id, items: [{ description: "ICU Bed Charges (3 Days)", category: "Room Charges", quantity: 3, unitPrice: 450, total: 1350 }, { description: "Nursing & Monitoring", category: "Nursing", quantity: 3, unitPrice: 100, total: 300 }], subtotal: 1650, discount: 50, tax: 80, totalAmount: 1680, paidAmount: 1000, balanceAmount: 680, paymentStatus: "Partially Paid", paymentMethod: "Insurance", invoiceDate: today, dueDate: today },
    ]);

    await Staff.insertMany([
      { staffId: "STF-ADMIN-01", name: "Dr. Alexander Wright", email: "admin@hospital.com", phone: "+1 555-0100", role: "SUPER_ADMIN", department: "Administration", designation: "Medical Superintendent", joiningDate: "2018-01-15", salary: 220000, status: "Active" },
      { staffId: "DOC-2026-001", name: "Dr. Sarah Jenkins", email: "doctor@hospital.com", phone: "+1 555-0101", role: "DOCTOR", department: "Cardiology", designation: "Senior Interventional Cardiologist", joiningDate: "2019-03-01", salary: 180000, status: "Active" },
      { staffId: "STF-102", name: "Emma Davis", email: "receptionist@hospital.com", phone: "+1 555-0102", role: "RECEPTIONIST", department: "Front Desk", designation: "Front Desk Officer", joiningDate: "2021-06-15", salary: 45000, status: "Active" },
      { staffId: "STF-103", name: "Nurse Clara Oswald", email: "nurse@hospital.com", phone: "+1 555-0103", role: "NURSE", department: "Inpatient Ward", designation: "Senior Charge Nurse", joiningDate: "2020-09-10", salary: 65000, status: "Active" },
      { staffId: "STF-104", name: "Marcus Vance", email: "pharmacist@hospital.com", phone: "+1 555-0104", role: "PHARMACIST", department: "Pharmacy", designation: "Chief Pharmacist", joiningDate: "2019-11-20", salary: 75000, status: "Active" },
      { staffId: "STF-105", name: "David Chen", email: "lab@hospital.com", phone: "+1 555-0105", role: "LAB_TECHNICIAN", department: "Laboratory", designation: "Lead Pathology Tech", joiningDate: "2021-02-14", salary: 58000, status: "Active" },
      { staffId: "STF-106", name: "Arthur Pendelton", email: "billing@hospital.com", phone: "+1 555-0106", role: "ACCOUNTANT", department: "Finance & Accounts", designation: "Senior Accountant", joiningDate: "2018-08-01", salary: 85000, status: "Active" },
      { staffId: "STF-107", name: "Elena Rostova", email: "radiology@hospital.com", phone: "+1 555-0108", role: "RADIOLOGY_TECHNICIAN", department: "Radiology & Imaging", designation: "Lead Imaging Tech", joiningDate: "2020-04-12", salary: 62000, status: "Active" },
    ]);

    await Inventory.insertMany([
      { itemCode: "INV-SURG-01", name: "Sterile Surgical Gloves", category: "Surgical", quantity: 850, minThreshold: 150, unit: "Pairs", unitPrice: 1.2, supplier: "MedSupply Global", lastRestocked: today, status: "In Stock" },
      { itemCode: "INV-EQP-01", name: "Digital Pulse Oximeters", category: "Equipment", quantity: 14, minThreshold: 20, unit: "Units", unitPrice: 35.0, supplier: "BioTech", lastRestocked: today, status: "Low Stock" },
    ]);

    await Notification.insertMany([
      { title: "New Appointment Booked", message: "Sophia Rodriguez scheduled an appointment with Dr. James Wilson.", type: "info", link: "/appointments", read: false, createdAt: new Date().toISOString() },
      { title: "Lab Report Ready", message: "Lipid Panel report completed for Eleanor Bennett.", type: "success", link: "/laboratory", read: false, createdAt: new Date().toISOString() },
      { title: "Low Stock Alert", message: "Salbutamol Inhaler is running low on stock.", type: "warning", link: "/pharmacy", read: false, createdAt: new Date().toISOString() },
    ]);

    // Emergency Cases
    await EmergencyCase.insertMany([
      {
        emergencyId: "EMG-2026-001",
        patient: createdPats[1]._id,
        triageLevel: "Red (Resuscitation)",
        chiefComplaint: "Acute crushing retrosternal chest pain, diaphoresis, radiating to left jaw",
        vitalsOnArrival: { bpSystolic: 170, bpDiastolic: 105, heartRate: 112, respiratoryRate: 24, spo2: 92, temperature: 98.8, gcs: 15 },
        assignedDoctor: createdDocs[0]._id,
        primaryNurse: "Nurse Clara Oswald",
        status: "Under Treatment",
        triageScore: 1,
        arrivalMode: "Ambulance",
        initialTreatmentNotes: "12-lead ECG showed STEMI in anterior leads. Sublingual NTG & loading Aspirin 325mg + Ticagrelor 180mg administered. Transferred to Cath Lab.",
        disposition: "Admit to ICU",
        arrivedAt: new Date(Date.now() - 3600000),
      },
      {
        emergencyId: "EMG-2026-002",
        patient: createdPats[3]._id,
        triageLevel: "Yellow (Urgent)",
        chiefComplaint: "Suspected radius fracture right forearm after fall from playground swing",
        vitalsOnArrival: { bpSystolic: 110, bpDiastolic: 70, heartRate: 98, respiratoryRate: 20, spo2: 99, temperature: 99.1, gcs: 15 },
        assignedDoctor: createdDocs[2]._id,
        primaryNurse: "Nurse Clara Oswald",
        status: "Triage Completed",
        triageScore: 3,
        arrivalMode: "Walk-in",
        initialTreatmentNotes: "Upper extremity immobilized with slab. Analgesia given. Sent to X-ray.",
        disposition: "Admit to Ward",
        arrivedAt: new Date(Date.now() - 7200000),
      }
    ]);

    // ICU Record
    await IcuRecord.insertMany([
      {
        icuId: "ICU-REC-101",
        admission: createdAdmissions[0]._id,
        patient: createdPats[1]._id,
        bed: createdBeds[0]._id,
        unit: "CCU",
        ventilatorStatus: "High Flow Nasal Cannula",
        ventilatorSettings: { mode: "HFNC", fio2: "45%", peep: "N/A", tidalVolume: "N/A", pip: "N/A" },
        telemetryVitals: [
          { timestamp: new Date(Date.now() - 1800000), heartRate: 78, bpSystolic: 126, bpDiastolic: 82, spo2: 98, temperature: 98.4, respiratoryRate: 16, cpcOrGcs: 15 },
          { timestamp: new Date(), heartRate: 74, bpSystolic: 124, bpDiastolic: 80, spo2: 99, temperature: 98.5, respiratoryRate: 16, cpcOrGcs: 15 },
        ],
        inotropesAndInfusions: [
          { drug: "IV Heparin", dosage: "1000 IU/hr", rate: "2.0 mL/hr", startedAt: new Date(Date.now() - 86400000) },
          { drug: "IV Nitroglycerin", dosage: "10 mcg/min", rate: "0.5 mL/hr", startedAt: new Date(Date.now() - 43200000) }
        ],
        criticalAlerts: [
          { timestamp: new Date(Date.now() - 7200000), alertType: "Desaturation", severity: "High", resolved: true }
        ],
        attendingIntensivist: createdDocs[0]._id,
        assignedNurse: "Nurse Clara Oswald",
        dailyNotes: "Post-PCI Day 2. Patient alert and pain free. ECG sinus rhythm. Step down planned for tomorrow.",
        status: "Active",
        admittedAt: new Date(Date.now() - 172800000),
      }
    ]);

    // Operation Theatres
    await OperationTheatre.insertMany([
      {
        surgeryId: "OT-2026-001",
        patient: createdPats[4]._id,
        admission: createdAdmissions[1]._id,
        theatreRoom: "OT Room 1 (Modular Cardiac / Neuro)",
        surgeryType: "Elective",
        procedureName: "L4-L5 Micro-endoscopic Lumbar Discectomy",
        leadSurgeon: createdDocs[1]._id,
        anesthesiologist: createdDocs[0]._id,
        scrubNurse: "Nurse Clara Oswald",
        circulatingNurse: "Nurse Sarah M.",
        scheduledStart: new Date(Date.now() + 86400000),
        scheduledEnd: new Date(Date.now() + 97200000),
        preOpChecklist: {
          npoVerified: true,
          consentSigned: true,
          siteMarked: true,
          bloodArranged: true,
          pacClearance: true,
        },
        safetyChecklist: {
          signOutDone: false,
          timeOutDone: false,
          spongeAndNeedleCountCorrect: false,
        },
        status: "Scheduled",
      },
      {
        surgeryId: "OT-2026-002",
        patient: createdPats[1]._id,
        admission: createdAdmissions[0]._id,
        theatreRoom: "OT Room 2 (Orthopedic & Trauma)",
        surgeryType: "Emergency",
        procedureName: "Primary Percutaneous Coronary Intervention (PCI)",
        leadSurgeon: createdDocs[0]._id,
        anesthesiologist: createdDocs[1]._id,
        scrubNurse: "Nurse Clara Oswald",
        scheduledStart: new Date(Date.now() - 86400000),
        scheduledEnd: new Date(Date.now() - 79200000),
        actualStart: new Date(Date.now() - 86400000),
        actualEnd: new Date(Date.now() - 80000000),
        preOpChecklist: {
          npoVerified: true,
          consentSigned: true,
          siteMarked: true,
          bloodArranged: true,
          pacClearance: true,
        },
        safetyChecklist: {
          signOutDone: true,
          timeOutDone: true,
          spongeAndNeedleCountCorrect: true,
        },
        postOpNotes: "Successful DES placement in LAD. TIMI-3 flow restored. Patient shifted to CCU hemodynamically stable.",
        status: "Completed",
      }
    ]);

    // Nursing Care Records
    await NursingCare.insertMany([
      {
        careId: "NRC-2026-001",
        admission: createdAdmissions[0]._id,
        patient: createdPats[1]._id,
        nurse: "Nurse Clara Oswald",
        shift: "Morning",
        date: new Date(),
        vitals: { bp: "124/80", pulse: "72 bpm", temp: "98.5 F", spo2: "99%", rr: "16" },
        medicationAdministration: [
          { drugName: "Atorvastatin 40mg", dose: "40mg", route: "Oral", scheduledTime: "08:00 AM", givenTime: "08:05 AM", status: "Given", administeredBy: "Nurse Clara Oswald" },
          { drugName: "IV Heparin", dose: "1000 IU/hr", route: "IV Infusion", scheduledTime: "09:00 AM", givenTime: "09:00 AM", status: "Given", administeredBy: "Nurse Clara Oswald" }
        ],
        intakeOutput: {
          oralIntakeMl: 600,
          ivFluidMl: 1000,
          urineOutputMl: 1350,
          drainOutputMl: 0,
          balanceMl: 250,
        },
        nursingNotes: "Patient resting comfortably. Surgical site dressing clean and dry without hematoma. Peripheral pulses palpable bilateral lower extremities.",
        shiftHandover: "Post-PCI day 2. Blood work drawn for cardiac enzymes. Telemetry continuous.",
      }
    ]);

    // Discharge Summary
    await DischargeSummary.insertMany([
      {
        dischargeId: "DIS-2026-001",
        admission: createdAdmissions[0]._id,
        patient: createdPats[1]._id,
        attendingDoctor: createdDocs[0]._id,
        admissionDate: new Date(Date.now() - 432000000),
        dischargeDate: new Date(),
        dischargeType: "Regular",
        finalDiagnosis: "Acute Coronary Syndrome - Anterior Wall STEMI s/p Primary PCI to LAD with DES",
        hospitalCourseSummary: "60-year-old male admitted with acute retrosternal chest pain. Emergency coronary angiogram revealed 95% proximal LAD stenosis. Primary PCI successfully performed with 3.0x24mm Everolimus-eluting stent. Post-op telemetry uneventful. Echocardiogram shows preserved LVEF 52%.",
        conditionAtDischarge: "Hemodynamically stable, ambulating independently, asymptomatic.",
        dischargeMedications: [
          { medicineName: "Tab Aspirin 75mg", dosage: "75mg", frequency: "1-0-0", duration: "Lifetime", instructions: "After breakfast" },
          { medicineName: "Tab Ticagrelor 90mg", dosage: "90mg", frequency: "1-0-1", duration: "1 Year", instructions: "Twice daily" },
          { medicineName: "Tab Atorvastatin 40mg", dosage: "40mg", frequency: "0-0-1", duration: "6 Months", instructions: "Bedtime" },
          { medicineName: "Tab Metoprolol 25mg", dosage: "25mg", frequency: "1-0-0", duration: "Ongoing", instructions: "Morning" }
        ],
        followUpInstructions: "Follow up in Cardiology OPD with Dr. Sarah Jenkins after 10 days. Repeat lipid profile and 2D Echo after 4 weeks. Report to Emergency immediately if chest pain or shortness of breath occurs.",
        dietaryAdvice: "Strict low-salt, low-fat cardiac diet. High fiber and green leafy vegetables.",
        activityRestrictions: "No heavy weight lifting (>5kg) for 3 weeks. Gentle 20 min morning walk encouraged.",
        emergencyWarningSigns: ["Recurrent chest tightness or pain", "Severe breathlessness or sweating", "Dizziness or fainting"],
        preparedBy: "Dr. Sarah Jenkins",
        status: "Draft",
      }
    ]);

    // Purchase Orders (Procurement)
    await PurchaseOrder.insertMany([
      {
        poNumber: "PO-2026-001",
        vendorName: "MedSupply Global Technologies Ltd.",
        vendorContact: { email: "orders@medsupplyglobal.com", phone: "+1 800-441-2900", address: "500 Logistics Way, Industrial Park" },
        items: [
          { itemName: "Sterile Surgical Gloves (Size 7.5)", category: "Surgical", quantity: 500, unitPrice: 1.20, totalAmount: 600, unit: "Pairs" },
          { itemName: "N95 Medical Respirator Masks", category: "Consumables", quantity: 1000, unitPrice: 0.85, totalAmount: 850, unit: "Pcs" }
        ],
        totalCost: 1450,
        expectedDeliveryDate: new Date(Date.now() + 432000000),
        status: "Approved",
        requestedBy: "Marcus Vance",
        approvedBy: "Dr. Alexander Wright",
        paymentStatus: "Pending",
        notes: "High priority monthly consumables replenishment."
      },
      {
        poNumber: "PO-2026-002",
        vendorName: "BioTech Diagnostic Instruments",
        vendorContact: { email: "support@biotechdiag.com", phone: "+1 800-332-9900", address: "120 Innovation Drive, Silicon Valley" },
        items: [
          { itemName: "Digital Pulse Oximeters Pro", category: "Equipment", quantity: 20, unitPrice: 35.00, totalAmount: 700, unit: "Units" }
        ],
        totalCost: 700,
        expectedDeliveryDate: new Date(Date.now() - 86400000),
        status: "Goods Received",
        requestedBy: "David Chen",
        approvedBy: "Dr. Alexander Wright",
        paymentStatus: "Paid",
        notes: "Received in good condition. Stock auto-incremented in inventory."
      }
    ]);

    // Audit Logs
    await AuditLog.insertMany([
      {
        action: "TRIAGE",
        entity: "EmergencyCase",
        entityId: "EMG-2026-001",
        userEmail: "doctor@hospital.com",
        userName: "Dr. Sarah Jenkins",
        userRole: "DOCTOR",
        details: "Triage assigned Level Red (Resuscitation) for STEMI patient Arthur Pendelton",
        ipAddress: "192.168.1.45",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hospital-EMR-Terminal/2026",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        action: "ADMIT",
        entity: "Admission",
        entityId: "ADM-9001",
        userEmail: "admin@hospital.com",
        userName: "Dr. Alexander Wright",
        userRole: "SUPER_ADMIN",
        details: "Admitted patient Arthur Pendelton to CCU Bed ICU-01",
        ipAddress: "192.168.1.10",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hospital-EMR-Terminal/2026",
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        action: "SURGERY_SCHEDULE",
        entity: "OperationTheatre",
        entityId: "OT-2026-001",
        userEmail: "doctor@hospital.com",
        userName: "Dr. Sarah Jenkins",
        userRole: "DOCTOR",
        details: "Scheduled L4-L5 Micro-endoscopic Lumbar Discectomy in OT Room 1",
        ipAddress: "192.168.1.45",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hospital-EMR-Terminal/2026",
        timestamp: new Date(Date.now() - 14400000),
      }
    ]);

    // Teleconsultation Session
    await TeleconsultationSession.insertMany([
      {
        sessionId: "TELE-2026-0001",
        roomId: "APT-2026-104",
        patient: createdPats[4]._id,
        doctor: createdDocs[0]._id,
        scheduledDate: today,
        scheduledTime: "02:00 PM - 02:20 PM",
        sessionStatus: "Waiting Room",
        connectionStatus: "Connected",
        doctorNotes: {
          chiefComplaint: "Follow-up evaluation on post-stent cardiac rehabilitation",
          symptoms: "Mild exertional fatigue",
          diagnosis: "Post-PTCA Recovery, CAD Class 1",
          treatmentPlan: "Continue antiplatelets, low salt diet, 30 min morning walk",
        },
        chatMessages: [
          {
            id: "msg-1",
            sender: "System",
            senderRole: "System",
            text: "Encrypted teleconsultation room initialized (APT-2026-104). End-to-end HIPAA compliant session active.",
            timestamp: new Date(),
          }
        ],
      }
    ]);

    return NextResponse.json({ success: true, message: "Database re-seeded successfully with rich demo records across all enterprise modules!" });
  } catch (error: any) {
    console.error("Seed API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

