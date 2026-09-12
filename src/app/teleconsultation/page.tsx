"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  MessageSquare,
  FileSignature,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Pill,
  ShieldCheck,
  Maximize2,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Activity,
  Stethoscope,
  HeartPulse,
  Eye,
  Trash2,
  Printer,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  History,
  X,
  ExternalLink,
  Info,
  BadgeAlert,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { RTC_CONFIG, SignalMessage } from "@/lib/webrtc";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";

function TeleconsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role, isPatient } = useAuth();
  const isDoctor = role === "DOCTOR" || (user as any)?.role === "DOCTOR";

  // Consultation Room & Role State
  const aptParam = searchParams.get("appointment") || searchParams.get("appointmentId");
  const initialRoom = searchParams.get("room") || searchParams.get("session") || aptParam || "APT-2026-104";
  const initialRole =
    (searchParams.get("role") || (isPatient ? "patient" : "doctor")).toLowerCase() === "patient"
      ? "Patient"
      : "Doctor";

  const [roomId, setRoomId] = useState(initialRoom);
  const [currentRole, setCurrentRole] = useState<"Doctor" | "Patient">(initialRole);
  const [sessionData, setSessionData] = useState<any>(null);
  const [clinicalHistory, setClinicalHistory] = useState<any>({
    previousPrescriptions: [],
    previousLabOrders: [],
    previousRadiologyOrders: [],
    previousAdmissions: [],
    previousAppointments: [],
  });

  // Lifecycle state: "waiting-room" | "in-call" | "completed"
  const [lifecycleState, setLifecycleState] = useState<"waiting-room" | "in-call" | "completed">("waiting-room");
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<"overview" | "notes" | "rx" | "chat" | "cds" | "records">("rx");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "waiting" | "connected" | "reconnecting" | "disconnected" | "failed"
  >("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Peer Information
  const [patientInfo, setPatientInfo] = useState<any>({
    name: currentRole === "Patient" ? user?.name || "Virendra Malhotra" : "Virendra Malhotra",
    age: 62,
    gender: "Male",
    bloodGroup: "AB+",
    allergies: ["Aspirin", "Penicillin"],
    medicalHistory: ["Coronary Artery Disease (Post PTCA 2021)", "Hypertension Stage 1"],
    phone: "+91 98445-56677",
    email: "v.malhotra@yahoo.co.in",
    abhaNumber: "91-1122-3344-5566",
  });

  const [doctorInfo, setDoctorInfo] = useState<any>({
    name: currentRole === "Doctor" ? user?.name || "Dr. Sarah Jenkins" : "Dr. Sarah Jenkins",
    specialization: "Senior Interventional Cardiologist",
    department: "Cardiology",
    qualification: "MBBS, MD (Medicine), DM (Cardiology), FESC",
    mciNumber: "MCI-CARD-9921",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
  });

  // Video and Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const myUserIdRef = useRef<string>(`user-${Math.random().toString(36).substring(2, 9)}`);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);

  // In-Call Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: "1", sender: "Doctor", senderRole: "Doctor", time: "10:00 AM", text: "Welcome to MediPulse Encrypted Video Teleconsultation." },
    { id: "2", sender: "Doctor", senderRole: "Doctor", time: "10:01 AM", text: "Good morning! Can you describe your current symptoms?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Structured Doctor Notes State
  const [doctorNotes, setDoctorNotes] = useState({
    chiefComplaint: "Mild exertional chest tightness and shortness of breath on climbing 2 flights of stairs.",
    historyOfPresentIllness: "Symptoms started 3 days ago. No radiating pain to jaw or left arm. Taking prescribed anti-hypertensives regularly.",
    symptoms: "Exertional dyspnea, mild retrosternal discomfort, fatigue.",
    clinicalObservations: "Patient alert, oriented, speaking in full sentences. No visible respiratory distress over video. Peripheral capillary refill normal.",
    assessment: "Stable Angina Pectoris / Exertional Ischemia vs. Non-cardiac atypical pain in post-PTCA patient.",
    diagnosis: "Coronary Artery Disease - Exertional Angina (Class II)",
    treatmentPlan: "Titrate nitrate therapy, add sublingual SOS, schedule resting 12-lead ECG and 2D Echocardiography. Low-salt cardiac diet.",
    additionalNotes: "Advised immediate ER visit if pain persists > 10 mins or radiates to arm/jaw.",
  });
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Multi-Drug E-Prescription State
  const [medicines, setMedicines] = useState<any[]>([
    {
      medicineName: "Sorbitrate 5mg",
      genericName: "Isosorbide Dinitrate",
      strength: "5mg",
      dosage: "1 Tab",
      route: "Sublingual",
      frequency: "SOS",
      duration: "30 Days",
      quantity: "15 Tabs",
      instructions: "Place under tongue on sudden chest tightness. Max 3 tabs in 15 mins.",
    },
    {
      medicineName: "Atorvastatin 40mg",
      genericName: "Atorvastatin Calcium",
      strength: "40mg",
      dosage: "1 Tab",
      route: "Oral",
      frequency: "0-0-1",
      duration: "30 Days",
      quantity: "30 Tabs",
      instructions: "Take at bedtime with water.",
    },
    {
      medicineName: "Metoprolol Succinate 25mg",
      genericName: "Metoprolol Succinate ER",
      strength: "25mg",
      dosage: "1 Tab",
      route: "Oral",
      frequency: "1-0-0",
      duration: "30 Days",
      quantity: "30 Tabs",
      instructions: "Take in the morning after breakfast.",
    },
  ]);

  // New Drug Form inside Tab
  const [medForm, setMedForm] = useState({
    medicineName: "",
    genericName: "",
    strength: "",
    dosage: "1 Tab",
    route: "Oral",
    frequency: "1-0-1",
    duration: "14 Days",
    quantity: "28 Tabs",
    instructions: "After food",
  });
  const [labAdviceList, setLabAdviceList] = useState<string[]>([
    "12-Lead Resting ECG",
    "Comprehensive Lipid Profile",
    "Serum Creatinine & Electrolytes",
  ]);
  const [newLabTest, setNewLabTest] = useState("");
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );

  // Clinical Decision Support (CDS) State
  const [cdsResults, setCdsResults] = useState<any>(null);
  const [isLoadingCds, setIsLoadingCds] = useState(false);

  // Modals
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [signedPrescriptionData, setSignedPrescriptionData] = useState<any>(null);
  const [allPastSessions, setAllPastSessions] = useState<any[]>([]);

  // 1. Fetch or Initialize Session
  const initSession = async () => {
    try {
      const res = await fetch("/api/teleconsultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          appointmentId: aptParam || (sessionData?.appointment?.appointmentId),
          role: currentRole,
          participantName: user?.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSessionData(data.session);
        if (data.session.patient) {
          setPatientInfo(data.session.patient);
        }
        if (data.session.doctor) {
          setDoctorInfo(data.session.doctor);
        }
        if (data.session.doctorNotes?.diagnosis) {
          setDoctorNotes((prev) => ({ ...prev, ...data.session.doctorNotes }));
        }
        if (data.session.chatMessages?.length) {
          setChatMessages(data.session.chatMessages);
        }
        if (data.session.prescriptionSummary?.isDigitallySigned) {
          setSignedPrescriptionData(data.session.prescriptionSummary);
        }

        // Fetch detailed clinical context
        fetchSessionDetails(data.session._id);
      }
    } catch (e) {
      console.error("Failed to init teleconsultation session:", e);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/teleconsultation/${id}`);
      if (res.ok) {
        const d = await res.json();
        if (d.clinicalHistory) {
          setClinicalHistory(d.clinicalHistory);
        }
      }
    } catch (e) {
      console.error("Failed to fetch session history:", e);
    }
  };

  const fetchAllSessions = async () => {
    try {
      const res = await fetch("/api/teleconsultation");
      if (res.ok) {
        const d = await res.json();
        setAllPastSessions(d.sessions || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    initSession();
    fetchAllSessions();
  }, [roomId, currentRole]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (lifecycleState === "in-call") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lifecycleState]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // WebRTC Signal Helper
  const sendSignal = async (type: string, data?: any) => {
    try {
      await fetch("/api/teleconsultation/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: roomId,
          sender: myUserIdRef.current,
          senderRole: currentRole,
          type,
          data,
        }),
      });
    } catch (e) {
      console.error("Failed to send WebRTC signal:", e);
    }
  };

  // Initialize Media Devices & Audio Meter
  const startMediaPreview = async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      localStreamRef.current = stream;
      setHasCameraPermission(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Audio Level Meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          audioAnalyserRef.current = analyser;
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (audioAnalyserRef.current) {
              audioAnalyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            }
            if (localStreamRef.current) {
              requestAnimationFrame(updateAudioLevel);
            }
          };
          updateAudioLevel();
        }
      } catch (e) {}

      return stream;
    } catch (err: any) {
      console.warn("Media device warning:", err);
      setHasCameraPermission(false);
      return null;
    }
  };

  useEffect(() => {
    startMediaPreview();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // WebRTC PeerConnection Setup
  const createPeerConnection = (stream: MediaStream) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setHasRemoteStream(true);
        setConnectionStatus("connected");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      switch (pc.connectionState) {
        case "connected":
          setConnectionStatus("connected");
          toast.success("Encrypted HD video stream connected!");
          break;
        case "connecting":
          setConnectionStatus("connecting");
          break;
        case "disconnected":
          setConnectionStatus("reconnecting");
          break;
        case "failed":
          setConnectionStatus("failed");
          break;
      }
    };

    return pc;
  };

  // Start Real-Time WebRTC Call
  const joinLiveCall = async () => {
    try {
      setLifecycleState("in-call");
      setConnectionStatus("connecting");

      let stream = localStreamRef.current;
      if (!stream) {
        stream = await startMediaPreview();
      }

      if (!stream) {
        toast.error("Camera/Microphone not available. Joining audio/chat only mode.");
      }

      const pc = createPeerConnection(stream || new MediaStream());

      // Connect SSE Signaling
      const sseUrl = `/api/teleconsultation/signal?room=${encodeURIComponent(
        roomId
      )}&sender=${encodeURIComponent(myUserIdRef.current)}&role=${currentRole}&stream=true`;

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = async (event) => {
        try {
          const msg: SignalMessage = JSON.parse(event.data);
          if (msg.sender === myUserIdRef.current) return;

          switch (msg.type) {
            case "peer-joined":
              toast.info(`${msg.senderRole} joined the teleconsultation room!`);
              if (currentRole === "Doctor" && pcRef.current) {
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);
                sendSignal("offer", offer);
              }
              break;

            case "offer":
              if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                sendSignal("answer", answer);

                // Drain pending ICE
                while (pendingCandidatesRef.current.length > 0) {
                  const cand = pendingCandidatesRef.current.shift();
                  if (cand) await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                }
              }
              break;

            case "answer":
              if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
                while (pendingCandidatesRef.current.length > 0) {
                  const cand = pendingCandidatesRef.current.shift();
                  if (cand) await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                }
              }
              break;

            case "ice-candidate":
              if (pcRef.current && pcRef.current.remoteDescription) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
              } else {
                pendingCandidatesRef.current.push(msg.data);
              }
              break;

            case "chat":
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `chat-${Date.now()}`,
                  sender: msg.senderRole,
                  senderRole: msg.senderRole,
                  text: msg.data.text,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
              if (activeSideTab !== "chat") {
                setUnreadChatCount((prev) => prev + 1);
              }
              break;

            case "peer-left":
              toast.warning(`${msg.senderRole} left the call`);
              setHasRemoteStream(false);
              setConnectionStatus("waiting");
              break;
          }
        } catch (e) {
          console.error("Signal parse error:", e);
        }
      };

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus("reconnecting");
          // Resilient auto-reconnect after transient SSE drop
          setTimeout(() => {
            if (lifecycleState === "in-call" && (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED)) {
              try {
                const retrySource = new EventSource(sseUrl);
                eventSourceRef.current = retrySource;
                retrySource.onmessage = eventSource.onmessage;
                retrySource.onerror = eventSource.onerror;
              } catch (reErr) {
                console.warn("SSE reconnect attempt:", reErr);
              }
            }
          }, 2000);
        }
      };

      // Notify Room
      sendSignal("join", { role: currentRole });

      // Update Database Session status
      if (sessionData?._id) {
        fetch(`/api/teleconsultation/${sessionData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionStatus: "In Consultation",
            connectionStatus: "Connected",
          }),
        });
      }
    } catch (err) {
      console.error("Join call error:", err);
      toast.error("Could not initialize call connection");
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
        toast.info(videoTrack.enabled ? "Camera enabled" : "Camera muted");
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        toast.info(audioTrack.enabled ? "Microphone active" : "Microphone muted");
      }
    }
  };

  // Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current && pcRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
      setIsScreenSharing(false);
      toast.info("Screen sharing ended");
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && pcRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (sender && videoTrack) sender.replaceTrack(videoTrack);
          }
        };

        setIsScreenSharing(true);
        toast.success("Sharing screen with patient");
      } catch (err) {
        toast.error("Screen share permission denied");
      }
    }
  };

  // Send In-Call Chat Message
  const sendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: `chat-${Date.now()}`,
      sender: currentRole,
      senderRole: currentRole,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    sendSignal("chat", { text: inputMessage.trim() });

    // Also persist into session DB
    if (sessionData?._id) {
      fetch(`/api/teleconsultation/${sessionData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newChatMessage: newMsg }),
      });
    }

    setInputMessage("");
  };

  // Save Doctor Notes
  const handleSaveNotes = async () => {
    if (!sessionData?._id) {
      toast.error("Session not initialized");
      return;
    }
    try {
      setIsSavingNotes(true);
      const res = await fetch(`/api/teleconsultation/${sessionData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorNotes }),
      });
      if (res.ok) {
        toast.success("Clinical Doctor Notes saved to patient record!");
      }
    } catch {
      toast.error("Failed to save clinical notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add Medicine to E-Prescription
  const handleAddMedicine = () => {
    if (!medForm.medicineName.trim()) {
      toast.error("Medicine Name is required");
      return;
    }

    // Allergy check
    const isAllergic = patientInfo.allergies?.some((alg: string) =>
      medForm.medicineName.toLowerCase().includes(alg.toLowerCase())
    );

    if (isAllergic) {
      toast.warning(
        `Allergy Alert: Patient is known to be allergic to compounds matching "${medForm.medicineName}"!`
      );
    }

    setMedicines((prev) => [...prev, { ...medForm }]);
    setMedForm({
      medicineName: "",
      genericName: "",
      strength: "",
      dosage: "1 Tab",
      route: "Oral",
      frequency: "1-0-1",
      duration: "14 Days",
      quantity: "28 Tabs",
      instructions: "After food",
    });
    toast.success("Medicine added to prescription list!");
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
    toast.info("Medicine removed");
  };

  // Add Lab Advice
  const handleAddLabAdvice = () => {
    if (!newLabTest.trim()) return;
    setLabAdviceList((prev) => [...prev, newLabTest.trim()]);
    setNewLabTest("");
  };

  // Run Clinical Decision Support (CDS)
  const runClinicalDecisionSupport = async () => {
    try {
      setIsLoadingCds(true);
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: doctorNotes.symptoms || doctorNotes.chiefComplaint,
          patientName: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          vitals: "BP: 128/82, HR: 74 bpm, SpO2: 99%",
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setCdsResults(data.analysis);
        toast.success("Clinical Decision Support considerations updated!");
      }
    } catch {
      toast.error("Failed to run Clinical Decision Support");
    } finally {
      setIsLoadingCds(false);
    }
  };

  // Finalize & Electronically Authorize Prescription
  const handleSignPrescription = async () => {
    if (!sessionData?._id) return;
    try {
      const rxPayload = {
        medicines,
        labAdvice: labAdviceList,
        followUpDate,
        diagnosis: doctorNotes.diagnosis,
        clinicalNotes: doctorNotes.treatmentPlan,
        signedBy: doctorInfo.name,
        mciNumber: doctorInfo.mciNumber,
      };

      const res = await fetch(`/api/teleconsultation/${sessionData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuePrescription: rxPayload,
          followUpDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSignedPrescriptionData(data.session.prescriptionSummary);
        setIsSignModalOpen(false);
        toast.success("Prescription Electronically Authorized & Issued!");
        setIsPrintModalOpen(true);
      }
    } catch {
      toast.error("Failed to authorize prescription");
    }
  };

  // End Call Workflow
  const handleEndCall = async () => {
    if (sessionData?._id) {
      await fetch(`/api/teleconsultation/${sessionData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionStatus: "Completed",
          connectionStatus: "Disconnected",
          durationSeconds: callDuration,
          doctorNotes,
        }),
      });
    }

    sendSignal("leave");

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLifecycleState("completed");
    setIsEndCallModalOpen(false);
    toast.success("Teleconsultation Session Completed!");
  };

  // Leave Session Temporarily
  const handleLeaveSession = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLifecycleState("waiting-room");
    toast.info("Left active session. You can re-join anytime.");
  };

  return (
    <div className="space-y-6">
      {/* Top Telemedicine Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-300 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>WEBRTC ENCRYPTED TELEMEDICINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Virtual Teleconsultation & Video Clinic
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl">
              HD video consultations, real-time in-call chat, integrated clinical decision support, and instant digitally-authorized e-prescriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shadow-sm"
            >
              <History className="h-4 w-4 text-teal-400" />
              <span>Consultation History</span>
            </button>

            {lifecycleState === "in-call" && (
              <button
                onClick={() => setIsEndCallModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-lg shadow-rose-600/30"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. WAITING ROOM VIEW */}
      {lifecycleState === "waiting-room" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Device Pre-Check & Camera Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-brand-600" />
                <span>Device & Camera Pre-Call Check</span>
              </h2>

              {/* Video Preview Box */}
              <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover transform scale-x-[-1] ${
                    isCamOn ? "block" : "hidden"
                  }`}
                />
                {!isCamOn && (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
                      <VideoOff className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-xs font-semibold">Camera is currently turned off</p>
                  </div>
                )}

                {/* Device Check Overlay Controls */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMic}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md ${
                      isMicOn
                        ? "bg-slate-800/90 text-white hover:bg-slate-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md ${
                      isCamOn
                        ? "bg-slate-800/90 text-white hover:bg-slate-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Audio Test Bar */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Microphone Audio Level
                    </p>
                    <p className="text-[10px] text-slate-500">Speak to test your input sensitivity</p>
                  </div>
                </div>

                <div className="w-32 sm:w-48 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                    style={{ width: `${isMicOn ? audioLevel : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Details & Join Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Room: {roomId}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Waiting Room Active
                </span>
              </div>

              {/* Counterparty Profile */}
              {currentRole === "Doctor" ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Patient Details
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-lg">
                      {patientInfo.name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {patientInfo.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {patientInfo.age} yrs • {patientInfo.gender} • Blood: {patientInfo.bloodGroup}
                      </p>
                      {patientInfo.allergies?.length > 0 && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                          Allergies: {patientInfo.allergies.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Consulting Doctor
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={doctorInfo.photo}
                      alt={doctorInfo.name}
                      className="h-12 w-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {doctorInfo.name}
                      </h3>
                      <p className="text-xs text-brand-600 font-semibold">{doctorInfo.specialization}</p>
                      <p className="text-[10px] text-slate-400">Reg: {doctorInfo.mciNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Agenda */}
              <div className="space-y-3 text-xs mb-6">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Scheduled Date:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {sessionData?.scheduledDate || formatDate(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Time Window:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {sessionData?.scheduledTime || "10:00 AM - 10:30 AM"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Chief Reason:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                    {doctorNotes.chiefComplaint}
                  </span>
                </div>
              </div>

              {/* Join Consultation CTA */}
              <button
                onClick={joinLiveCall}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-brand-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-600/30 hover:opacity-95 transition"
              >
                <Video className="h-5 w-5" />
                <span>{currentRole === "Doctor" ? "Start Video Consultation" : "Join Consultation Room"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE CONSULTATION SPLIT WORKSTATION */}
      {lifecycleState === "in-call" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Video Stage & Controls */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Video Canvas Box */}
            <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${hasRemoteStream ? "block" : "hidden"}`}
              />

              {/* Remote Stream Fallback / Waiting state */}
              {!hasRemoteStream && (
                <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
                    <User className="h-10 w-10 text-slate-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {currentRole === "Doctor" ? patientInfo.name : doctorInfo.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Waiting for participant to connect video stream...
                    </p>
                  </div>
                </div>
              )}

              {/* Local PiP (Picture in Picture) */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover transform scale-x-[-1] ${
                    isCamOn ? "block" : "hidden"
                  }`}
                />
                {!isCamOn && (
                  <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500 text-[10px] font-bold">
                    Camera Off
                  </div>
                )}
                <div className="absolute top-1.5 left-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  You ({currentRole})
                </div>
              </div>

              {/* Top Video Status Banner */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-slate-800">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span>LIVE CONSULTATION: {currentRole === "Doctor" ? patientInfo.name : doctorInfo.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-slate-950/80 backdrop-blur-md px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 border border-slate-800">
                    REC: {formatDuration(callDuration)}
                  </span>
                  <span
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      connectionStatus === "connected"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom In-Call Control Toolbar */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-white shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all shadow-sm ${
                    isMicOn
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                  title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all shadow-sm ${
                    isCamOn
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                  title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                  {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all shadow-sm ${
                    isScreenSharing
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                  title="Share Screen"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveSideTab("chat");
                    setUnreadChatCount(0);
                  }}
                  className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                    activeSideTab === "chat"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                      {unreadChatCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLeaveSession}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Leave
                </button>

                <button
                  onClick={() => setIsEndCallModalOpen(true)}
                  className="rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Tab Clinical Side Workstation */}
          <div className="lg:col-span-5 rounded-3xl bg-white shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-hidden flex flex-col min-h-[620px]">
            {/* Tab Navigation Header */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto custom-scrollbar p-2 bg-slate-50/50 dark:bg-slate-800/50 gap-1">
              {[
                { id: "rx", label: "e-Prescription", icon: Pill },
                { id: "notes", label: "Doctor Notes", icon: FileText },
                { id: "overview", label: "Patient 360", icon: User },
                { id: "chat", label: "Live Chat", icon: MessageSquare, badge: unreadChatCount },
                { id: "cds", label: "AI Co-Pilot", icon: Sparkles },
                { id: "records", label: "History", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSideTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSideTab(tab.id as any);
                      if (tab.id === "chat") setUnreadChatCount(0);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge ? (
                      <span className="rounded-full bg-rose-500 px-1.5 text-[9px] text-white">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="flex-1 p-5 overflow-y-auto max-h-[580px] custom-scrollbar">
              {/* TAB 1: PATIENT OVERVIEW */}
              {activeSideTab === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {patientInfo.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {patientInfo.age} yrs • {patientInfo.gender} • Blood Group: {patientInfo.bloodGroup}
                      </p>
                    </div>
                    <Link
                      href={`/patients/${sessionData?.patient?._id || ""}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                    >
                      <span>Full 360 EHR</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Allergy Alert */}
                  {patientInfo.allergies?.length > 0 && (
                    <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200/60 dark:bg-rose-950/50 dark:border-rose-900">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                        <BadgeAlert className="h-4 w-4" />
                        <span>Known Critical Drug Allergies</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {patientInfo.allergies.map((alg: string) => (
                          <span
                            key={alg}
                            className="rounded-lg bg-rose-100 text-rose-800 px-2 py-0.5 text-xs font-semibold dark:bg-rose-900 dark:text-rose-200"
                          >
                            ⚠️ {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Medical History
                    </h4>
                    <div className="space-y-1.5">
                      {patientInfo.medicalHistory?.map((hist: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                          <span>{hist}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCTOR NOTES */}
              {activeSideTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Clinical Consultation Notes
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Structured EMR notes linked to patient medical record
                      </p>
                    </div>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
                    >
                      {isSavingNotes ? "Saving..." : "Save Notes"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chief Complaint
                    </label>
                    <input
                      type="text"
                      value={doctorNotes.chiefComplaint}
                      onChange={(e) =>
                        setDoctorNotes({ ...doctorNotes, chiefComplaint: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      History of Present Illness (HPI)
                    </label>
                    <textarea
                      rows={2}
                      value={doctorNotes.historyOfPresentIllness}
                      onChange={(e) =>
                        setDoctorNotes({ ...doctorNotes, historyOfPresentIllness: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Provisional Diagnosis & Assessment
                    </label>
                    <input
                      type="text"
                      value={doctorNotes.diagnosis}
                      onChange={(e) =>
                        setDoctorNotes({ ...doctorNotes, diagnosis: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Treatment Plan & Advice
                    </label>
                    <textarea
                      rows={3}
                      value={doctorNotes.treatmentPlan}
                      onChange={(e) =>
                        setDoctorNotes({ ...doctorNotes, treatmentPlan: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: E-PRESCRIPTION BUILDER */}
              {activeSideTab === "rx" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Prescribed Medication Regimen
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {medicines.length} medicines scheduled
                      </p>
                    </div>

                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:opacity-95"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      <span>Review & Sign</span>
                    </button>
                  </div>

                  {/* Active Medicines List */}
                  <div className="space-y-2">
                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {med.medicineName}
                            </span>
                            <span className="rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 px-1.5 py-0.2 text-[10px] font-bold">
                              {med.frequency}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {med.dosage} • {med.duration} • {med.instructions}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMedicine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Medicine Mini-Form */}
                  <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-brand-600" />
                      <span>Add Medicine to Prescription</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Drug Name (e.g. Atorvastatin)"
                        value={medForm.medicineName}
                        onChange={(e) => setMedForm({ ...medForm, medicineName: e.target.value })}
                        className="col-span-2 rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (1 Tab / 5ml)"
                        value={medForm.dosage}
                        onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                        className="rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (1-0-1 / SOS)"
                        value={medForm.frequency}
                        onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                        className="rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Duration (30 Days)"
                        value={medForm.duration}
                        onChange={(e) => setMedForm({ ...medForm, duration: e.target.value })}
                        className="rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (After food)"
                        value={medForm.instructions}
                        onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                        className="rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleAddMedicine}
                      className="w-full rounded-xl bg-brand-600 py-2 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm"
                    >
                      + Add Medicine
                    </button>
                  </div>

                  {/* Lab Advice */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recommended Diagnostic Investigations
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. 2D Echocardiography, HbA1c"
                        value={newLabTest}
                        onChange={(e) => setNewLabTest(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <button
                        onClick={handleAddLabAdvice}
                        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {labAdviceList.map((lab, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-800 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800 dark:text-slate-300"
                        >
                          <span>{lab}</span>
                          <button
                            onClick={() =>
                              setLabAdviceList((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE IN-CALL CHAT */}
              {activeSideTab === "chat" && (
                <div className="flex flex-col h-[520px]">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.senderRole === currentRole;
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                            {msg.senderRole} • {msg.time || "Just now"}
                          </span>
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-xs max-w-[85%] ${
                              isMe
                                ? "bg-brand-600 text-white rounded-br-sm"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={sendChatMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Type a message to participant..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 p-2 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-brand-600 px-3.5 py-2 text-white hover:bg-brand-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: CLINICAL DECISION SUPPORT */}
              {activeSideTab === "cds" && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-amber-50 p-3 border border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-900">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-tight">
                        <strong>Clinical Disclaimer:</strong> Clinical Decision Support is assistive only and does NOT replace the doctor's clinical judgment.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={runClinicalDecisionSupport}
                    disabled={isLoadingCds}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isLoadingCds ? "Analyzing Clinical Data..." : "Run AI Clinical Decision Analysis"}</span>
                  </button>

                  {cdsResults && (
                    <div className="space-y-3">
                      {/* Differential Diagnosis */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                          Differential Considerations
                        </h4>
                        <div className="space-y-2">
                          {cdsResults.differentialDiagnosis?.map((diff: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {diff.condition}
                                </span>
                                <span className="rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5">
                                  {diff.probability}% match
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">{diff.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Red Flag Warnings */}
                      {cdsResults.redFlagWarnings?.length > 0 && (
                        <div className="rounded-2xl bg-rose-50 p-3 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                            🚩 Red-Flag Symptoms to Watch
                          </p>
                          <ul className="list-disc pl-4 text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
                            {cdsResults.redFlagWarnings.map((rf: string, i: number) => (
                              <li key={i}>{rf}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: PREVIOUS RECORDS */}
              {activeSideTab === "records" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Diagnostic & Clinical History
                  </h4>

                  {clinicalHistory.previousPrescriptions?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500">Previous Prescriptions</p>
                      {clinicalHistory.previousPrescriptions.map((p: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex justify-between">
                            <span className="font-bold">{p.prescriptionId}</span>
                            <span className="text-slate-400">{p.date}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">
                            Diagnosis: {p.diagnosis}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No prior prescription records found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETED STATE VIEW */}
      {lifecycleState === "completed" && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 max-w-2xl mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Teleconsultation Session Completed
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Session Duration: {formatDuration(callDuration)} • Room: {roomId}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">Attending Doctor:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{doctorInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{patientInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">E-Prescription Status:</span>
              <span className="font-bold text-emerald-600">
                {signedPrescriptionData ? "Authorized & Signed" : "Completed"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            {signedPrescriptionData && (
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Prescription</span>
              </button>
            )}
            <Link
              href={isPatient ? "/patient/prescriptions" : "/appointments"}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & SIGN PRESCRIPTION */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Review & Electronically Authorize Prescription"
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between border-b pb-2 dark:border-slate-700">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  MediPulse Hospital E-Prescription
                </p>
                <p className="text-[11px] text-slate-500">
                  Attending Doctor: {doctorInfo.name} ({doctorInfo.specialization})
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Date: {new Date().toISOString().split("T")[0]}
                </p>
                <p className="text-[10px] text-slate-400">Reg: {doctorInfo.mciNumber}</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient: {patientInfo.name} ({patientInfo.age}y / {patientInfo.gender})
              </p>
              <p className="text-slate-500">Diagnosis: {doctorNotes.diagnosis}</p>
            </div>

            {/* Medicines List */}
            <div className="space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Prescribed Medicines
              </p>
              {medicines.map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-bold">{m.medicineName}</span>
                  <span>
                    {m.dosage} • {m.frequency} • {m.duration} ({m.instructions})
                  </span>
                </div>
              ))}
            </div>

            {labAdviceList.length > 0 && (
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Lab Advice:</strong> {labAdviceList.join(", ")}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-teal-50 p-3.5 border border-teal-200/60 dark:bg-teal-950/40 dark:border-teal-900">
            <p className="text-teal-900 dark:text-teal-300 font-bold">
              Doctor Electronic Authorization
            </p>
            <p className="text-[11px] text-teal-800 dark:text-teal-400 mt-0.5">
              By clicking "Authorize & Sign", you authenticate that you have conducted this clinical teleconsultation and verified the prescription under registration {doctorInfo.mciNumber}.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsSignModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSignPrescription}
              className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20"
            >
              Authorize & Sign Prescription
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: PRINTABLE PRESCRIPTION */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Hospital E-Prescription"
        maxWidth="3xl"
      >
        <div className="space-y-4 p-4 text-xs font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:p-0">
          {/* Hospital Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-brand-600 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-brand-600">
                MEDIPULSE HOSPITAL & MEDICAL INSTITUTE
              </h2>
              <p className="text-[10px] text-slate-500">
                NABH & ABDM Integrated Healthcare Complex • New Delhi
              </p>
              <p className="text-[10px] text-slate-500">24x7 Hotline: +91 1800-911-0000</p>
            </div>
            <div className="text-right">
              <span className="rounded-lg bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                TELEMEDICINE RX
              </span>
              <p className="font-mono text-[10px] text-slate-500 mt-1">
                ID: {signedPrescriptionData?.prescriptionId || "RX-2026-001"}
              </p>
            </div>
          </div>

          {/* Doctor & Patient Row */}
          <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-sm">{doctorInfo.name}</p>
              <p className="text-slate-500">{doctorInfo.qualification}</p>
              <p className="text-slate-500">{doctorInfo.specialization}</p>
              <p className="text-slate-500">MCI Reg: {doctorInfo.mciNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">{patientInfo.name}</p>
              <p className="text-slate-500">
                Age / Gender: {patientInfo.age} Y / {patientInfo.gender}
              </p>
              <p className="text-slate-500">ABHA: {patientInfo.abhaNumber || "N/A"}</p>
              <p className="text-slate-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Clinical Findings */}
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Provisional Diagnosis: {doctorNotes.diagnosis}
            </p>
          </div>

          {/* Rx Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5">Medicine Name</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medicines.map((m, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-bold">{m.medicineName}</td>
                    <td className="p-2.5">{m.dosage}</td>
                    <td className="p-2.5">{m.frequency}</td>
                    <td className="p-2.5">{m.duration}</td>
                    <td className="p-2.5 text-slate-500">{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advice & Followup */}
          {labAdviceList.length > 0 && (
            <p className="text-xs">
              <strong>Investigations Ordered:</strong> {labAdviceList.join(", ")}
            </p>
          )}

          <p className="text-xs">
            <strong>Next Follow-up Consultation:</strong> {followUpDate}
          </p>

          {/* Electronic Authorization Badge */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <div>
                <p className="font-bold text-[11px] text-slate-900 dark:text-white">
                  Doctor Verified / Electronically Authorized Prescription
                </p>
                <p className="text-[10px] text-slate-400">
                  Signed by {doctorInfo.name} ({doctorInfo.mciNumber}) on{" "}
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">STATUS: AUTHORIZED</span>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print Prescription</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: END CALL CONFIRMATION */}
      <Modal
        isOpen={isEndCallModalOpen}
        onClose={() => setIsEndCallModalOpen(false)}
        title="End Consultation Session"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to end this teleconsultation session? Clinical notes and the prescription summary will be finalized and saved into the patient's medical records.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEndCallModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEndCall}
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              End Session & Finalize
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CONSULTATION HISTORY */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Teleconsultation History & Records"
        maxWidth="4xl"
      >
        <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto custom-scrollbar">
          {allPastSessions.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No previous sessions found.</p>
          ) : (
            <div className="space-y-2">
              {allPastSessions.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {s.sessionId}
                      </span>
                      <span className="rounded-md bg-brand-100 text-brand-800 text-[10px] font-bold px-1.5 py-0.2">
                        {s.sessionStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient: {s.patient?.name || "Patient"} • Doctor: {s.doctor?.name || "Doctor"} • Room: {s.roomId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {s.scheduledDate || formatDate(s.createdAt)}
                    </p>
                    <Link
                      href={`/teleconsultation?room=${s.roomId}`}
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Open Room →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function TeleconsultationPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading Telemedicine Room..." />}>
      <TeleconsultationContent />
    </Suspense>
  );
}
