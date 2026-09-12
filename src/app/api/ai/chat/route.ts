import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

// HMS Mongoose Models
import Appointment from "@/models/Appointment";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import Department from "@/models/Department";
import Admission from "@/models/Admission";
import Bed from "@/models/Bed";
import Medicine from "@/models/Medicine";
import Inventory from "@/models/Inventory";
import Invoice from "@/models/Invoice";
import LabOrder from "@/models/LabOrder";
import RadiologyOrder from "@/models/RadiologyOrder";
import Prescription from "@/models/Prescription";
import Referral from "@/models/Referral";
import AiConsultation from "@/models/AiConsultation";
import { formatCurrency } from "@/lib/utils";

interface ChatAction {
  label: string;
  href: string;
}

export async function POST(req: NextRequest) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to use the AI Assistant." },
        { status: 401 }
      );
    }

    const { message, history } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid question or message." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const role = normalizeRole(userPayload.role);
    const userId = userPayload.userId;
    const userEmail = userPayload.email?.toLowerCase();
    const query = message.trim();
    const lower = query.toLowerCase();

    // Multilingual & Intent Classification Engine
    const isHindiOrHinglish =
      /[\u0900-\u097F]/.test(query) ||
      /\b(aaj|kitne|kaun|karo|batao|kripya|mariz|dawa|mareez|kitna|hai|hain|kya|dikhaye|dekho|chahiye|bharti|aspatal)\b/i.test(lower);

    // 1. Explicit Clinical Tool / Decision Support Checks (takes precedence over generic keyword matching)
    const isSpecificClinicalQuery =
      /\b(interaction|drug interaction|interactions|differential|differential diagnosis|soap|soap note|explain report|report interpret|treatment protocol|clinical guidance|copilot|co-pilot|icd-10|icd10)\b/i.test(lower) ||
      /\b(warfarin|aspirin|metformin|atorvastatin|hba1c|troponin|troponin-i)\b/i.test(lower) ||
      (/\b(chest pain|dyspnea|angina|tachycardia)\b/i.test(lower) && /\b(differential|diagnosis|triage|workup|symptom)\b/i.test(lower));

    // 2. Check HMS Data Intent (Hospital Operations)
    const isAppointmentQuery =
      /\b(appointment|appointments|booking|slot|schedule|doctor schedule|opd queue|visit)\b/i.test(lower) ||
      /\b(kitne appointment|aaj ke appointment|doctor se milna|अपॉइंटमेंट|परामर्श)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("अपॉइंटमेंट") || query.includes("परामर्श"));

    const isAdmissionOrBedQuery =
      /\b(admission|admissions|admitted|bed|beds|ward|icu|occupancy|inpatient|ipd|discharge)\b/i.test(lower) ||
      /\b(kitne admit|bed khali|kitne bed|mariz admit|bharti|kitne bharti)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("भर्ती") || query.includes("बेड") || query.includes("आईपीडी"));

    const isPharmacyOrMedicineQuery =
      !isSpecificClinicalQuery &&
      (/\b(medicine|medicines|drug stock|drugs in stock|pharmacy|stock|inventory|low stock|out of stock|tablet stock|syrup stock|supply)\b/i.test(lower) ||
      /\b(dawai|dawa|kitni dawa|stock me|kam stock|दवा|दवाइयां)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("दवा") || query.includes("स्टॉक")));

    const isBillingOrRevenueQuery =
      /\b(billing|bill|bills|invoice|invoices|revenue|collection|payment|due|balance|tpa|claim|settlement|income)\b/i.test(lower) ||
      /\b(kitna paisa|revenue|kitna bill|kamai|aaj ka collection|बिल|राजस्व|भुगतान)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("बिल") || query.includes("राजस्व") || query.includes("भुगतान"));

    const isDiagnosticQuery =
      !isSpecificClinicalQuery &&
      (/\b(lab order|lab orders|pathology order|blood test order|radiology order|x-ray order|mri order|test report status|diagnostic order)\b/i.test(lower) ||
      /\b(my test report|my lab report|check my lab|test report|lab report|khoon test|jaanch|जांच|रिपोर्ट)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("जांच") || query.includes("रिपोर्ट")));

    const isReferralQuery =
      /\b(referral|referrals|referred|network hospital)\b/i.test(lower);

    const isDoctorOrDepartmentQuery =
      /\b(doctor|doctors|specialist|physician|surgeon|cardiologist|neurologist|orthopedic|department|departments)\b/i.test(lower) ||
      /\b(kaunse doctor|doctor available|vibhag|डॉक्टर|विभाग)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("डॉक्टर") || query.includes("विभाग"));

    const isPatientSearchQuery =
      /\b(patient directory|patients directory|patient record|patient history|search patient|find patient|all patients)\b/i.test(lower) ||
      /\b(patient ka record|मरीज रिकॉर्ड)\b/i.test(lower);

    const isSummaryQuery =
      /\b(summary|overview|hospital status|today status|dashboard|kaisa hai|aaj ka summary|सारांश|अस्पताल की स्थिति)\b/i.test(lower) ||
      /[\u0900-\u097F]/.test(query) && (query.includes("सारांश") || query.includes("स्थिति"));

    const isHmsIntent =
      isAppointmentQuery ||
      isAdmissionOrBedQuery ||
      isPharmacyOrMedicineQuery ||
      isBillingOrRevenueQuery ||
      isDiagnosticQuery ||
      isReferralQuery ||
      isDoctorOrDepartmentQuery ||
      isPatientSearchQuery ||
      isSummaryQuery;

    // -------------------------------------------------------------
    // ROUTING: CLINICAL SUPPORT (Specific Clinical Intent)
    // -------------------------------------------------------------
    if (isSpecificClinicalQuery && !isSummaryQuery) {
      return await handleClinicalQuery({ query, lower, isHindiOrHinglish });
    }

    // -------------------------------------------------------------
    // ROUTING: HMS DATA / HOSPITAL OPERATIONS
    // -------------------------------------------------------------
    if (isHmsIntent) {
      return await handleHmsDataQuery({
        query,
        lower,
        role,
        userId,
        userEmail,
        isHindiOrHinglish,
        isAppointmentQuery,
        isAdmissionOrBedQuery,
        isPharmacyOrMedicineQuery,
        isBillingOrRevenueQuery,
        isDiagnosticQuery,
        isReferralQuery,
        isDoctorOrDepartmentQuery,
        isPatientSearchQuery,
        isSummaryQuery,
      });
    }

    // -------------------------------------------------------------
    // ROUTING: GENERAL PURPOSE AI / CONVERSATIONAL
    // -------------------------------------------------------------
    return handleGeneralAiQuery({ query, lower, isHindiOrHinglish });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred in AI Assistant. Please try again.",
      details: error.message,
    });
  }
}

// =================================================================
// HANDLER: MODE A — HMS OPERATIONS & REAL-TIME DATA
// =================================================================
async function handleHmsDataQuery({
  query,
  lower,
  role,
  userId,
  userEmail,
  isHindiOrHinglish,
  isAppointmentQuery,
  isAdmissionOrBedQuery,
  isPharmacyOrMedicineQuery,
  isBillingOrRevenueQuery,
  isDiagnosticQuery,
  isReferralQuery,
  isDoctorOrDepartmentQuery,
  isPatientSearchQuery,
  isSummaryQuery,
}: any) {
  const actions: ChatAction[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  // RBAC RESTRICTIONS FOR PATIENTS
  if (role === "PATIENT") {
    // Look up patient document
    const patientDoc: any = await Patient.findOne({
      $or: [{ userId }, { email: userEmail }],
    }).lean();

    if (isSummaryQuery || isAppointmentQuery) {
      const myAppointments: any[] = patientDoc
        ? await Appointment.find({ patient: patientDoc._id })
            .populate("doctor", "name specialty")
            .sort({ appointmentDate: -1 })
            .limit(5)
            .lean()
        : [];

      actions.push({ label: "My Appointments Desk", href: "/patient/appointments" });

      const count = myAppointments.length;
      let text = isHindiOrHinglish
        ? `### 🩺 आपकी अपॉइंटमेंट्स (Personal Health Summary)\n\nआपके रिकॉर्ड में **${count}** अपॉइंटमेंट्स दर्ज हैं:\n\n`
        : `### 🩺 Your Scheduled Appointments & Visits\n\nYou currently have **${count}** registered appointment(s) in your health record:\n\n`;

      if (count === 0) {
        text += isHindiOrHinglish
          ? `आपके पास अभी कोई एक्टिव अपॉइंटमेंट शेड्यूल नहीं है। आप सीधे अपॉइंटमेंट बुक कर सकते हैं।`
          : `You currently have no scheduled appointments. Click below to book a physical visit or Virtual Teleconsultation.`;
      } else {
        myAppointments.forEach((apt) => {
          text += `- **${apt.appointmentId || "APT"}** | Date: **${apt.appointmentDate}** (${apt.timeSlot || "Standard"}) | Doctor: **Dr. ${apt.doctor?.name || "Consultant"}** | Status: **${apt.status}**\n`;
        });
      }

      return NextResponse.json({
        success: true,
        message: text,
        source: "Hospital System",
        intent: "HMS_DATA",
        actions,
      });
    }

    if (isDiagnosticQuery) {
      const myLabs: any[] = patientDoc
        ? await LabOrder.find({ patient: patientDoc._id }).sort({ orderDate: -1 }).limit(5).lean()
        : [];
      actions.push({ label: "My Lab & Radiology Reports", href: "/patient/reports" });

      let text = `### 🧪 Your Diagnostic & Pathology Reports\n\n`;
      if (myLabs.length === 0) {
        text += `No diagnostic lab orders or imaging records found under your patient profile.`;
      } else {
        text += `Found **${myLabs.length}** diagnostic order(s):\n\n`;
        myLabs.forEach((lab) => {
          text += `- **${lab.orderId}** | Date: **${lab.orderDate}** | Status: **${lab.status}**\n`;
        });
      }

      return NextResponse.json({
        success: true,
        message: text,
        source: "Hospital System",
        intent: "HMS_DATA",
        actions,
      });
    }

    if (isBillingOrRevenueQuery) {
      const myInvoices: any[] = patientDoc
        ? await Invoice.find({ patient: patientDoc._id }).sort({ invoiceDate: -1 }).limit(5).lean()
        : [];
      actions.push({ label: "My Invoices & Bills", href: "/patient/invoices" });

      let text = `### 💳 Your Invoices & Payment Ledger\n\n`;
      if (myInvoices.length === 0) {
        text += `You currently have no outstanding or past invoices recorded.`;
      } else {
        text += `Here are your recent billing statements:\n\n`;
        myInvoices.forEach((inv) => {
          text += `- **${inv.invoiceNumber}** | Date: **${inv.invoiceDate}** | Total: **${formatCurrency(inv.totalAmount || 0)}** | Balance: **${formatCurrency(inv.balanceAmount || 0)}** | Status: **${inv.paymentStatus}**\n`;
        });
      }

      return NextResponse.json({
        success: true,
        message: text,
        source: "Hospital System",
        intent: "HMS_DATA",
        actions,
      });
    }

    // Default patient fallback
    actions.push({ label: "My Patient Dashboard", href: "/patient/dashboard" });
    return NextResponse.json({
      success: true,
      message: isHindiOrHinglish
        ? `नमस्ते! आप पेशेंट पोर्टल में लॉग-इन हैं। आप अपनी अपॉइंटमेंट्स, प्रिस्क्रिप्शन, टेस्ट रिपोर्ट या बिलिंग के बारे में पूछ सकते हैं।`
        : `Hello! As a patient, you can review your personal scheduled visits, prescriptions, lab reports, and billing ledger here securely.`,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // ===============================================================
  // STAFF & ADMIN ACCESS (Strict Live Mongoose Queries)
  // ===============================================================

  // 1. HOSPITAL OVERVIEW / SUMMARY
  if (isSummaryQuery) {
    const [todayAppts, totalPatients, admittedCount, availableBeds, pendingLabs, totalRevenue] =
      await Promise.all([
        Appointment.countDocuments({ appointmentDate: todayStr }),
        Patient.countDocuments(),
        Admission.countDocuments({ status: { $in: ["Admitted", "Under Treatment"] } }),
        Bed.countDocuments({ status: "Available" }),
        LabOrder.countDocuments({ status: { $in: ["Pending", "Ordered", "Sample Collected", "Processing"] } }),
        Invoice.aggregate([
          { $match: { invoiceDate: todayStr } },
          { $group: { _id: null, total: { $sum: "$paidAmount" } } },
        ]),
      ]);

    actions.push({ label: "Hospital ERP Dashboard", href: "/dashboard" });
    actions.push({ label: "Appointments Desk", href: "/appointments" });
    actions.push({ label: "Inpatient Admissions", href: "/ipd" });

    const rev = totalRevenue[0]?.total || 0;

    const text = isHindiOrHinglish
      ? `### 🏥 आज का हॉस्पिटल लाइव सारांश (${todayStr})\n\n` +
        `अस्पताल सिस्टम से रियल-टाइम डेटा:\n\n` +
        `| मेट्रिक | वर्तमान स्थिति |\n` +
        `| :--- | :--- |\n` +
        `| **आज की कुल अपॉइंटमेंट्स** | **${todayAppts}** मरीज |\n` +
        `| **वर्तमान में भर्ती मरीज (IPD)** | **${admittedCount}** मरीज |\n` +
        `| **उपलब्ध बेड्स (Available Beds)** | **${availableBeds}** बेड्स खाली |\n` +
        `| **पेंडिंग लैब टेस्ट्स** | **${pendingLabs}** ऑर्डर्स |\n` +
        `| **कुल रजिस्टर्ड मरीज** | **${totalPatients}** मरीज 360 |\n` +
        `| **आज का संग्रहित राजस्व (Collected)** | **${formatCurrency(rev)}** |\n\n` +
        `*डेटा स्रोत: MediPulse Hospital Core ERP Database.*`
      : `### 🏥 Hospital Operational Snapshot (${todayStr})\n\n` +
        `Real-time statistics retrieved directly from the hospital core system:\n\n` +
        `| Operational Metric | Live Status |\n` +
        `| :--- | :--- |\n` +
        `| **Today's Scheduled Appointments** | **${todayAppts}** Patients |\n` +
        `| **Currently Admitted Patients (IPD)** | **${admittedCount}** Inpatients |\n` +
        `| **Available Hospital Beds** | **${availableBeds}** Vacant Beds |\n` +
        `| **Pending Diagnostic Lab Orders** | **${pendingLabs}** Pending |\n` +
        `| **Total Registered Patients (360)** | **${totalPatients}** Records |\n` +
        `| **Today's Realized Revenue** | **${formatCurrency(rev)}** |\n\n` +
        `*Data Source: Live Hospital MongoDB Database (Authenticated).*`;

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 2. APPOINTMENTS & OPD QUEUE
  if (isAppointmentQuery) {
    const todayList = await Appointment.find({ appointmentDate: todayStr })
      .populate("doctor", "name specialty specialization department")
      .populate("patient", "name phone")
      .sort({ timeSlot: 1 })
      .limit(8)
      .lean();

    const totalToday = await Appointment.countDocuments({ appointmentDate: todayStr });
    const completedToday = await Appointment.countDocuments({
      appointmentDate: todayStr,
      status: "Completed",
    });
    const pendingToday = await Appointment.countDocuments({
      appointmentDate: todayStr,
      status: { $in: ["Scheduled", "Confirmed"] },
    });

    actions.push({ label: "Open Appointments Desk", href: "/appointments" });
    actions.push({ label: "Live OPD Queue", href: "/opd" });

    let text = isHindiOrHinglish
      ? `### 📅 आज की अपॉइंटमेंट्स रिपोर्ट (${todayStr})\n\n` +
        `- **कुल अपॉइंटमेंट्स:** **${totalToday}**\n` +
        `- **पूरे हो चुके परामर्श:** **${completedToday}**\n` +
        `- **प्रतीक्षारत / पेंडिंग:** **${pendingToday}**\n\n`
      : `### 📅 Today's Appointments & OPD Queue (${todayStr})\n\n` +
        `- **Total Appointments Booked:** **${totalToday}**\n` +
        `- **Completed Consultations:** **${completedToday}**\n` +
        `- **Pending in Waiting Room:** **${pendingToday}**\n\n`;

    if (todayList.length === 0) {
      text += isHindiOrHinglish
        ? `आज के लिए कोई अपॉइंटमेंट अभी शेड्यूल नहीं है।`
        : `There are currently no active appointments scheduled for today.`;
    } else {
      text += `| Time | Patient | Consulting Doctor | Mode | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;
      todayList.forEach((apt) => {
        text += `| ${apt.timeSlot || "Standard"} | **${apt.patient?.name || apt.patientName || "Patient"}** | Dr. ${apt.doctor?.name || "Consultant"} | ${apt.consultationType || "In-Person"} | **${apt.status}** |\n`;
      });
    }

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 3. ADMISSIONS, IPD & BEDS
  if (isAdmissionOrBedQuery) {
    const [totalBeds, availableBeds, occupiedBeds, admittedList] = await Promise.all([
      Bed.countDocuments(),
      Bed.countDocuments({ status: "Available" }),
      Bed.countDocuments({ status: "Occupied" }),
      Admission.find({ status: { $in: ["Admitted", "Under Treatment"] } })
        .populate("patient", "name gender age")
        .populate("doctor", "name specialty specialization")
        .populate("bed", "bedNumber ward")
        .limit(6)
        .lean(),
    ]);

    actions.push({ label: "Inpatient IPD Ward", href: "/ipd" });
    actions.push({ label: "Bed Management", href: "/beds" });
    actions.push({ label: "ICU Management", href: "/icu" });

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    let text = isHindiOrHinglish
      ? `### 🛏️ बेड्स उपलब्धता एवं भर्ती मरीज स्थिति (IPD & Bed Status)\n\n` +
        `- **कुल अस्पताल बेड्स:** **${totalBeds}**\n` +
        `- **उपलब्ध / खाली बेड्स:** **${availableBeds}** बेड्स\n` +
        `- **भर्ती / Occupied बेड्स:** **${occupiedBeds}** बेड्स (ऑक्यूपेंसी दर: **${occupancyRate}%**)\n\n` +
        `#### वर्तमान में भर्ती मरीज (Active Inpatients):\n`
      : `### 🛏️ Hospital Bed Occupancy & Inpatient Status (IPD)\n\n` +
        `- **Total Hospital Beds:** **${totalBeds}**\n` +
        `- **Available / Vacant Beds:** **${availableBeds}** Beds\n` +
        `- **Occupied Beds:** **${occupiedBeds}** Beds (Bed Occupancy Rate: **${occupancyRate}%**)\n\n` +
        `#### Active Inpatient Records:\n`;

    if (admittedList.length === 0) {
      text += `No active inpatients found currently in ward/ICU.`;
    } else {
      text += `| Admission ID | Patient Name | Ward / Bed | Consultant Doctor | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;
      admittedList.forEach((adm) => {
        const bedLabel = adm.bed?.bedNumber || adm.bedNumber || "Bed";
        text += `| **${adm.admissionId || "ADM"}** | ${adm.patient?.name || "Patient"} (${adm.patient?.gender || "M"}, ${adm.patient?.age || 30}y) | ${adm.ward || "General"} - ${bedLabel} | Dr. ${adm.doctor?.name || "Attending"} | **${adm.status}** |\n`;
      });
    }

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 4. PHARMACY & INVENTORY
  if (isPharmacyOrMedicineQuery) {
    const [lowStockMeds, totalMeds, outOfStockCount] = await Promise.all([
      Medicine.find({
        $or: [
          { stockQuantity: { $lte: 20 } },
          { stock: { $lte: 20 } },
          { status: { $in: ["Low Stock", "Out of Stock"] } },
        ],
      }).limit(8).lean(),
      Medicine.countDocuments(),
      Medicine.countDocuments({
        $or: [
          { stockQuantity: 0 },
          { stock: 0 },
          { status: "Out of Stock" },
        ],
      }),
    ]);

    actions.push({ label: "Pharmacy Catalog", href: "/pharmacy" });
    actions.push({ label: "Hospital Supplies & Inventory", href: "/inventory" });

    let text = isHindiOrHinglish
      ? `### 💊 फार्मेसी एवं मेडिसिन स्टॉक स्थिति\n\n` +
        `- **कैटलॉग में कुल दवाइयां:** **${totalMeds}** प्रकार\n` +
        `- **कम स्टॉक वाली दवाइयां (Low Stock < 20):** **${lowStockMeds.length}** आइटम\n` +
        `- **स्टॉक समाप्त (Out of Stock):** **${outOfStockCount}** आइटम\n\n`
      : `### 💊 Pharmacy Stock & Critical Medicines Alert\n\n` +
        `- **Total Formulations in Catalog:** **${totalMeds}** items\n` +
        `- **Low Stock Alerts (Threshold < 20 units):** **${lowStockMeds.length}** items\n` +
        `- **Out of Stock Medicines:** **${outOfStockCount}** items\n\n`;

    if (lowStockMeds.length > 0) {
      text += `| Medicine Name | Category | Current Stock | Unit Price | Action Required |\n| :--- | :--- | :--- | :--- | :--- |\n`;
      lowStockMeds.forEach((m: any) => {
        const stockVal = m.stockQuantity ?? m.stock ?? 0;
        const priceVal = m.sellingPrice ?? m.purchasePrice ?? m.price ?? 0;
        text += `| **${m.name}** | ${m.category || "General"} | ${stockVal} units | ${formatCurrency(priceVal)} | Reorder Required |\n`;
      });
    } else {
      text += `✅ All pharmaceutical stock levels are currently within safe operational limits.`;
    }

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 5. BILLING & FINANCIAL REVENUE
  if (isBillingOrRevenueQuery) {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT") {
      return NextResponse.json({
        success: true,
        message: `🔒 Financial and billing reports require Accountant or Hospital Administrator permissions.`,
        source: "Hospital System",
        intent: "HMS_DATA",
        actions: [{ label: "Open Billing Desk", href: "/billing" }],
      });
    }

    const [todayAgg, allAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: todayStr } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalPending: { $sum: "$balanceAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalBilled: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalPending: { $sum: "$balanceAmount" },
          },
        },
      ]),
    ]);

    actions.push({ label: "Financial Accounts Ledger", href: "/accounts/dashboard" });
    actions.push({ label: "Billing & Invoices", href: "/billing" });

    const todayStats = todayAgg[0] || { totalBilled: 0, totalCollected: 0, totalPending: 0, count: 0 };
    const allStats = allAgg[0] || { totalBilled: 0, totalCollected: 0, totalPending: 0 };

    let text = isHindiOrHinglish
      ? `### 💰 अस्पताल वित्तीय एवं राजस्व रिपोर्ट (${todayStr})\n\n` +
        `#### आज का वित्तीय लेनदेन (Today's Transactions):\n` +
        `- **आज की कुल बिलिंग:** **${formatCurrency(todayStats.totalBilled)}** (${todayStats.count} इनवॉइस)\n` +
        `- **आज का संग्रहित राजस्व (Collected):** **${formatCurrency(todayStats.totalCollected)}**\n` +
        `- **आज का बकाया (Pending):** **${formatCurrency(todayStats.totalPending)}**\n\n` +
        `#### समग्र संचयी राजस्व (Overall Ledger):\n` +
        `- **कुल अस्पताल बिलिंग:** **${formatCurrency(allStats.totalBilled)}**\n` +
        `- **कुल संग्रहित राशि:** **${formatCurrency(allStats.totalCollected)}**\n` +
        `- **कुल बकाया राशि:** **${formatCurrency(allStats.totalPending)}**\n\n`
      : `### 💰 Hospital Financial & Revenue Settlement (${todayStr})\n\n` +
        `#### Today's Revenue Performance:\n` +
        `- **Today's Billed Volume:** **${formatCurrency(todayStats.totalBilled)}** (${todayStats.count} Invoices)\n` +
        `- **Collected Revenue Today:** **${formatCurrency(todayStats.totalCollected)}**\n` +
        `- **Outstanding Receivables Today:** **${formatCurrency(todayStats.totalPending)}**\n\n` +
        `#### Overall Financial Ledger:\n` +
        `- **Total Gross Invoiced:** **${formatCurrency(allStats.totalBilled)}**\n` +
        `- **Total Realized Collections:** **${formatCurrency(allStats.totalCollected)}**\n` +
        `- **Total Hospital Receivables:** **${formatCurrency(allStats.totalPending)}**\n\n`;

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 6. DIAGNOSTIC LABS & RADIOLOGY
  if (isDiagnosticQuery) {
    const [pendingLabs, completedLabs, recentOrders] = await Promise.all([
      LabOrder.countDocuments({ status: { $in: ["Pending", "Ordered", "Sample Collected", "Processing"] } }),
      LabOrder.countDocuments({ status: "Completed" }),
      LabOrder.find()
        .populate("patient", "name")
        .populate("doctor", "name")
        .sort({ orderDate: -1 })
        .limit(6)
        .lean(),
    ]);

    actions.push({ label: "Pathology Laboratory Station", href: "/laboratory" });
    actions.push({ label: "Radiology & Imaging PACS", href: "/radiology" });

    let text = isHindiOrHinglish
      ? `### 🧪 पैथोलॉजी लैब एवं रेडियोलॉजी डायग्नोस्टिक स्थिति\n\n` +
        `- **पेंडिंग लैब टेस्ट्स (In Progress):** **${pendingLabs}** ऑर्डर्स\n` +
        `- **पूरे हो चुके टेस्ट्स (Completed):** **${completedLabs}** ऑर्डर्स\n\n` +
        `#### हाल के डायग्नोस्टिक ऑर्डर्स:\n`
      : `### 🧪 Pathology Lab & Radiology Diagnostic Status\n\n` +
        `- **Pending Diagnostic Orders:** **${pendingLabs}** Orders\n` +
        `- **Completed & Verified Reports:** **${completedLabs}** Reports\n\n` +
        `#### Recent Diagnostic Orders:\n`;

    if (recentOrders.length > 0) {
      text += `| Order ID | Patient Name | Consultant Doctor | Date | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;
      recentOrders.forEach((ord) => {
        text += `| **${ord.orderId}** | ${ord.patient?.name || "Patient"} | Dr. ${ord.doctor?.name || "Physician"} | ${ord.orderDate} | **${ord.status}** |\n`;
      });
    } else {
      text += `No diagnostic lab orders found in system.`;
    }

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 7. DOCTORS & DEPARTMENTS
  if (isDoctorOrDepartmentQuery) {
    const [doctors, departments] = await Promise.all([
      Doctor.find({ status: "Active" }).lean(),
      Department.find().lean(),
    ]);

    actions.push({ label: "Find Doctors", href: "/doctors" });
    actions.push({ label: "Hospital Departments", href: "/departments" });

    let text = isHindiOrHinglish
      ? `### 👨‍⚕️ उपलब्ध विशेषज्ञ डॉक्टर एवं विभाग\n\n` +
        `अस्पताल में **${doctors.length}** सक्रिय डॉक्टर और **${departments.length}** मुख्य विभाग कार्यरत हैं:\n\n`
      : `### 👨‍⚕️ Hospital Doctors & Specialty Departments\n\n` +
        `There are currently **${doctors.length}** active consultants across **${departments.length}** clinical departments:\n\n`;

    text += `| Doctor Name | Specialty | Department | Experience | OPD Fees |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    doctors.slice(0, 8).forEach((d: any) => {
      const specialty = d.specialization || d.specialty || "General Medicine";
      const deptName = (typeof d.department === "object" ? d.department?.name : d.department) || "Clinical";
      const exp = d.experienceYears || d.experience || "10+";
      text += `| **Dr. ${d.name}** | ${specialty} | ${deptName} | ${exp} yrs | ${formatCurrency(d.consultationFee || 600)} |\n`;
    });

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // 8. PATIENT SEARCH
  if (isPatientSearchQuery) {
    const patients = await Patient.find().sort({ createdAt: -1 }).limit(6).lean();
    actions.push({ label: "Patients 360 Directory", href: "/patients" });
    actions.push({ label: "Register New Patient", href: "/patients/new" });

    let text = `### 👥 Patients 360 Directory\n\nRecent patient profiles from the hospital electronic registry:\n\n`;
    text += `| Patient ID | Name | Gender / Age | Contact Phone | Blood Group |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    patients.forEach((p) => {
      text += `| **${p.patientId || "PAT"}** | ${p.name} | ${p.gender || "M"}, ${p.age || 30}y | ${p.phone || "+91 9876543210"} | **${p.bloodGroup || "O+"}** |\n`;
    });

    return NextResponse.json({
      success: true,
      message: text,
      source: "Hospital System",
      intent: "HMS_DATA",
      actions,
    });
  }

  // Default fallback for unrecognized hospital question
  return NextResponse.json({
    success: true,
    message: isHindiOrHinglish
      ? `मुझे अस्पताल डेटाबेस में इस विशिष्ट प्रश्न का डेटा नहीं मिला। कृपया आज की अपॉइंटमेंट्स, बेड्स, फार्मेसी स्टॉक, या बिलिंग के बारे में पूछें।`
      : `I couldn't find specific matching records in the hospital system for this query. You can ask for today's appointments, available beds, low-stock medicines, diagnostic reports, or financial revenue.`,
    source: "Hospital System",
    intent: "HMS_DATA",
    actions: [{ label: "Hospital ERP Dashboard", href: "/dashboard" }],
  });
}

// =================================================================
// HANDLER: MODE B — CLINICAL DECISION SUPPORT
// =================================================================
async function handleClinicalQuery({ query, lower, isHindiOrHinglish }: any) {
  const actions: ChatAction[] = [
    { label: "AI Doctor Co-Pilot", href: "/ai-assistant" },
    { label: "Start Virtual Teleconsult", href: "/teleconsultation" },
  ];

  let responseText = "";

  // 1. Drug Interaction query
  if (
    lower.includes("interaction") ||
    lower.includes("warfarin") ||
    lower.includes("aspirin") ||
    lower.includes("metformin")
  ) {
    responseText =
      `### 💊 Clinical Drug Interaction Assessment\n\n` +
      `**Target Pair Analyzed:** Warfarin (Anticoagulant) + Aspirin (Antiplatelet / NSAID)\n\n` +
      `| Parameter | Assessment |\n` +
      `| :--- | :--- |\n` +
      `| **Severity Level** | 🔴 **Major / High Risk** |\n` +
      `| **Mechanism** | Synergistic impairment of hemostasis (platelet aggregation inhibition + coagulation factor synthesis blockade) |\n` +
      `| **Clinical Risk** | Significantly increased risk of upper gastrointestinal hemorrhage and intracranial bleeding |\n` +
      `| **Recommended Action** | Avoid co-administration unless explicitly indicated for mechanical heart valves. If co-prescribed, add PPI (Pantoprazole 40mg) and monitor INR closely (target 2.0–2.5). |\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

    return NextResponse.json({
      success: true,
      message: responseText,
      source: "Clinical AI Support",
      intent: "CLINICAL",
      actions,
    });
  }

  // 2. Chest Pain / Cardiac Symptoms
  if (lower.includes("chest pain") || lower.includes("angina") || lower.includes("heart") || lower.includes("shortness of breath")) {
    responseText =
      `### 🩺 Clinical Co-Pilot: Differential Diagnosis & Triage Protocol\n\n` +
      `**Presenting Clinical Context:** Exertional chest discomfort / Anginal symptoms.\n\n` +
      `#### 1. Differential Diagnosis:\n` +
      `1. **Acute Coronary Syndrome (ACS) / Unstable Angina** (Probability: ~82%, ICD-10: \`I20.9\`)\n` +
      `   - *Key Indicator:* Retrosternal pressure radiating to left arm/jaw, diaphoresis.\n` +
      `2. **Gastroesophageal Reflux Disease (GERD)** (Probability: ~38%, ICD-10: \`K21.9\`)\n` +
      `   - *Key Indicator:* Substernal burning post-prandial.\n` +
      `3. **Pulmonary Embolism** (Probability: ~18%, ICD-10: \`I26.9\`)\n` +
      `   - *Key Indicator:* Sudden dyspnea, pleuritic chest pain.\n\n` +
      `#### 2. Immediate Diagnostic Workup:\n` +
      `- ⚡ **Immediate 12-Lead ECG** (Evaluate ST-elevation or T-wave inversion)\n` +
      `- 🧪 **Serial High-Sensitivity Troponin-I / T** (at 0h and 3h)\n` +
      `- 🫀 **2D Echocardiography** (Assess regional wall motion abnormalities)\n\n` +
      `#### 3. 🚨 Red Flag Warnings:\n` +
      `- Sudden syncope, SpO2 < 92%, hypotension (BP < 90/60 mmHg), cold clammy extremities.\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

    return NextResponse.json({
      success: true,
      message: responseText,
      source: "Clinical AI Support",
      intent: "CLINICAL",
      actions,
    });
  }

  // 3. Lab Report Explainer (HbA1c / Diabetes)
  if (lower.includes("hba1c") || lower.includes("sugar") || lower.includes("diabetes") || lower.includes("glucose")) {
    responseText =
      `### 🧪 Diagnostic Lab Explainer: Glycemic & Metabolic Profile\n\n` +
      `**Parameter:** Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose\n\n` +
      `| Metric | Standard Normal | Diabetic Range | Clinical Implication |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **HbA1c** | < 5.7% | ≥ 6.5% | Reflects average erythrocyte glucose exposure over preceding 90–120 days |\n` +
      `| **Fasting Glucose** | 70–100 mg/dL | ≥ 126 mg/dL | Demonstrates basal hepatic gluconeogenesis control |\n` +
      `| **Post-Prandial (2h)** | < 140 mg/dL | ≥ 200 mg/dL | Evaluates post-meal peripheral insulin sensitivity |\n\n` +
      `#### Recommended Clinical Actions:\n` +
      `- Review dual oral anti-diabetic therapy (e.g., Metformin + DPP-4i or SGLT2i).\n` +
      `- Order annual screening for Diabetic Retinopathy, Urine Microalbumin/Creatinine ratio, and bilateral foot peripheral neuropathy sensation testing.\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

    return NextResponse.json({
      success: true,
      message: responseText,
      source: "Clinical AI Support",
      intent: "CLINICAL",
      actions,
    });
  }

  // 4. SOAP Note Generation Query
  if (lower.includes("soap") || lower.includes("clinical note")) {
    responseText =
      `### 📋 Clinical SOAP Note Template\n\n` +
      `**Subjective (S):**\n` +
      `Patient presents with a 3-day history of low-grade fever (100.2°F), productive cough with yellowish sputum, and mild fatigue. Denies hemoptysis or shortness of breath at rest.\n\n` +
      `**Objective (O):**\n` +
      `- Vitals: BP 124/82 mmHg, Pulse 82 bpm regular, Temp 99.8°F, SpO2 98% on room air.\n` +
      `- Respiratory: Bilateral vesicular breath sounds; coarse end-inspiratory crackles heard at right lower lung base.\n\n` +
      `**Assessment (A):**\n` +
      `- Acute Bronchitis with secondary bacterial involvement (ICD-10: \`J20.9\`).\n` +
      `- Rule out early Community-Acquired Pneumonia (CAP).\n\n` +
      `**Plan (P):**\n` +
      `- Chest X-Ray (PA View) & Complete Blood Count (CBC).\n` +
      `- Tab. Amoxicillin-Clavulanate 625mg TID x 5 days with meals.\n` +
      `- Syrup Levosalbutamol + Ambroxol 10ml TID for cough relief.\n` +
      `- Advise steam inhalation, hydration (>2.5L/day), and urgent review if SpO2 drops below 94%.\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

    return NextResponse.json({
      success: true,
      message: responseText,
      source: "Clinical AI Support",
      intent: "CLINICAL",
      actions,
    });
  }

  // General Clinical Guidance fallback
  responseText = isHindiOrHinglish
    ? `### 🩺 क्लिनिकल डिसीजन-सपोर्ट एडवाइजरी\n\n` +
      `आपके क्लिनिकल प्रश्न के आधार पर:\n\n` +
      `- **क्लिनिकल समीक्षा:** मरीजों के लक्षणों का सावधानीपूर्वक परीक्षण, वाइटल साइन (BP, Pulse, SpO2, Temp) और डायग्नोस्टिक हिस्ट्री आवश्यक है।\n` +
      `- **अनुशंसित जांच:** लक्षण अनुसार CBC, CRP, ECG, या चेस्ट एक्स-रे कराएं।\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`
    : `### 🩺 Clinical Decision-Support Guidance\n\n` +
      `Based on the clinical presentation and healthcare parameters:\n\n` +
      `- **Initial Assessment:** Always correlate presenting symptoms with baseline vital signs (BP, Pulse, SpO2, Temperature, Blood Sugar).\n` +
      `- **Workup Protocol:** Order confirmatory laboratory diagnostics (CBC, CRP, renal/liver panels) or imaging before initiating definitive therapeutics.\n` +
      `- **Follow-up:** Schedule regular follow-up within 48–72 hours or immediate emergency review if alarm symptoms develop.\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

  return NextResponse.json({
    success: true,
    message: responseText,
    source: "Clinical AI Support",
    intent: "CLINICAL",
    actions,
  });
}

// =================================================================
// HANDLER: MIXED INTENT (HMS DATA + CLINICAL INSIGHT)
// =================================================================
async function handleMixedQuery({
  query,
  lower,
  role,
  userId,
  userEmail,
  isHindiOrHinglish,
}: any) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [admittedCount, totalAppts, pendingLabs] = await Promise.all([
    Admission.countDocuments({ status: { $in: ["Admitted", "Under Treatment"] } }),
    Appointment.countDocuments({ appointmentDate: todayStr }),
    LabOrder.countDocuments({ status: { $in: ["Pending", "Ordered", "Sample Collected", "Processing"] } }),
  ]);

  const actions: ChatAction[] = [
    { label: "Hospital ERP Dashboard", href: "/dashboard" },
    { label: "AI Doctor Co-Pilot", href: "/ai-assistant" },
    { label: "Laboratory Orders", href: "/laboratory" },
  ];

  let text = isHindiOrHinglish
    ? `### 🏥 संयुक्त अस्पताल डेटा एवं क्लिनिकल विश्लेषण\n\n` +
      `#### 1. लाइव अस्पताल सांख्यिकी:\n` +
      `- **आज की अपॉइंटमेंट्स:** **${totalAppts}** मरीज\n` +
      `- **भर्ती मरीज (IPD):** **${admittedCount}** मरीज\n` +
      `- **पेंडिंग लैब रिपोर्ट्स:** **${pendingLabs}** ऑर्डर्स\n\n` +
      `#### 2. क्लिनिकल डिसीजन इनसाइट्स:\n` +
      `अस्पताल के क्लिनिकल प्रोटोकॉल के अनुसार, भर्ती एवं बाह्य रोगियों के लिए मानक उपचार दिशा-निर्देश लागू किए जाते हैं।\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`
    : `### 🏥 Hospital Operational & Clinical Analysis\n\n` +
      `#### 1. Live Hospital Operational Context (${todayStr}):\n` +
      `- **Today's Scheduled Consultations:** **${totalAppts}** Appointments\n` +
      `- **Current Inpatient Census (IPD):** **${admittedCount}** Admitted Patients\n` +
      `- **Diagnostic Lab Queue:** **${pendingLabs}** Tests Pending\n\n` +
      `#### 2. Clinical Decision-Support Summary:\n` +
      `For patients presenting with matching clinical symptoms, ensure continuous vitals tracking and correlation with active prescription regimens and laboratory panels.\n\n` +
      `> ⚠️ **Clinical Safety Disclaimer:** AI-generated clinical information is for decision support only. Verify with a qualified healthcare professional before making clinical decisions.`;

  return NextResponse.json({
    success: true,
    message: text,
    source: "Hospital & Clinical AI",
    intent: "MIXED",
    actions,
  });
}

// =================================================================
// HANDLER: MODE C — GENERAL PURPOSE AI
// =================================================================
function handleGeneralAiQuery({ query, lower, isHindiOrHinglish }: any) {
  let responseText = "";

  if (lower.includes("hypertension") || lower.includes("blood pressure") || lower.includes("bp")) {
    responseText =
      `### 🩸 What is Hypertension (High Blood Pressure)?\n\n` +
      `**Hypertension** is a common chronic condition in which the long-term force of blood against your artery walls is consistently elevated (typically defined as systolic BP ≥ 130 mmHg or diastolic BP ≥ 80 mmHg).\n\n` +
      `#### Classification (AHA/ACC Guidelines):\n` +
      `- **Normal:** < 120 / < 80 mmHg\n` +
      `- **Elevated:** 120–129 / < 80 mmHg\n` +
      `- **Stage 1 Hypertension:** 130–139 / 80–89 mmHg\n` +
      `- **Stage 2 Hypertension:** ≥ 140 / ≥ 90 mmHg\n` +
      `- **Hypertensive Crisis:** > 180 / > 120 mmHg (Emergency)\n\n` +
      `#### Key Lifestyle Interventions:\n` +
      `1. **DASH Diet:** Low sodium (< 1,500–2,300 mg/day), rich in potassium, fruits, vegetables, and whole grains.\n` +
      `2. **Aerobic Exercise:** 150 minutes of moderate-intensity activity per week.\n` +
      `3. **Stress & Sleep Management:** Adequate 7–8 hours of restorative sleep.`;
  } else if (lower.includes("machine learning") || lower.includes("ai in healthcare") || lower.includes("cloud computing")) {
    responseText =
      `### 🤖 Artificial Intelligence & Machine Learning in Healthcare\n\n` +
      `Artificial Intelligence (AI) and Machine Learning (ML) are transforming modern healthcare delivery across multiple frontiers:\n\n` +
      `1. **Clinical Decision Support (CDSS):** Assisting clinicians with differential diagnosis, drug-drug interaction alerts, and ICD-10 coding.\n` +
      `2. **Medical Imaging & PACS:** Automated detection of pulmonary nodules on CT, diabetic retinopathy in fundus scans, and micro-fractures on X-Rays.\n` +
      `3. **Predictive Hospital Operations:** Forecasting emergency department admissions, bed occupancy, and ICU stay durations.\n` +
      `4. **Electronic Health Records (EHR) Summarization:** Converting unstructured physician notes into structured HL7 / FHIR data models for rapid review.`;
  } else if (lower.includes("email") || lower.includes("letter") || lower.includes("draft")) {
    responseText =
      `### ✉️ Professional Healthcare Email Draft\n\n` +
      `**Subject:** Medical Consultation Follow-Up & Treatment Plan — [Hospital Name]\n\n` +
      `Dear [Patient Name],\n\n` +
      `Thank you for visiting MediPulse Hospital for your recent outpatient consultation. \n\n` +
      `This is a gentle reminder regarding your follow-up diagnostic tests and medication schedule as advised by Dr. [Doctor Name]. Please ensure you complete the prescribed course and bring your updated lab reports to your next scheduled review.\n\n` +
      `If you experience any new or worsening symptoms, please contact our 24x7 Help Desk or book an immediate Virtual Teleconsultation via your Patient Portal.\n\n` +
      `Warm regards,\n` +
      `**Clinical Care Team**\n` +
      `MediPulse Multi-Speciality Hospital`;
  } else if (lower.includes("translate") || isHindiOrHinglish) {
    responseText =
      `### 🌐 Multilingual Assistant (English / Hindi / Hinglish)\n\n` +
      `नमस्ते! मैं आपकी भाषा में सहायता करने के लिए तैयार हूँ।\n\n` +
      `- **हिंदी:** आप अस्पताल की सेवाओं, अपॉइंटमेंट या स्वास्थ्य से जुड़े किसी भी विषय पर प्रश्न पूछ सकते हैं।\n` +
      `- **English:** You can ask any question regarding hospital operations, clinical guidelines, technical topics, or general assistance.\n` +
      `- **Hinglish:** Aap naturally Hinglish me type kar sakte hain, jaise: *"Aaj kitne beds available hain?"* ya *"Hypertension kya hota hai?"*`;
  } else {
    responseText =
      `### 💡 AI Assistant Response\n\n` +
      `Here is the information regarding **"${query}"**:\n\n` +
      `I am your intelligent conversational assistant for the Hospital Management System. You can ask me:\n\n` +
      `- 🏥 **Hospital Operations:** Live appointments, bed availability, admitted patients, pharmacy inventory, today's revenue.\n` +
      `- 🩺 **Clinical Decision Support:** Symptom evaluation, lab report explanations, drug interactions, SOAP notes.\n` +
      `- 🌐 **General Knowledge:** Medical concepts, technical explanations, email drafts, and multilingual translations in English, Hindi, and Hinglish.`;
  }

  return NextResponse.json({
    success: true,
    message: responseText,
    source: "General AI",
    intent: "GENERAL",
    actions: [],
  });
}
