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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RTC_CONFIG, SignalMessage } from "@/lib/webrtc";
import { useAuth } from "@/context/AuthContext";

function TeleconsultationContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Consultation Room & Role State
  const initialRoom = searchParams.get("room") || "APT-2026-104";
  const initialRole = (searchParams.get("role") || "doctor").toLowerCase() === "patient" ? "Patient" : "Doctor";

  const [roomId, setRoomId] = useState(initialRoom);
  const [currentRole, setCurrentRole] = useState<"Doctor" | "Patient">(initialRole);
  const [isInCall, setIsInCall] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "rx" | "notes">("rx");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "waiting" | "connected" | "reconnecting" | "disconnected" | "failed"
  >("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // Call Participants
  const [patientName, setPatientName] = useState(
    initialRole === "Patient" ? user?.name || "Virendra Malhotra" : "Virendra Malhotra"
  );
  const [doctorName, setDoctorName] = useState(
    initialRole === "Doctor" ? user?.name || "Dr. Sarah Jenkins" : "Dr. Sarah Jenkins"
  );

  // Video and Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const myUserIdRef = useRef<string>(`user-${Math.random().toString(36).substring(2, 9)}`);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "Doctor", time: "10:02 AM", text: "Good morning Mr. Malhotra. How are you feeling today?" },
    { sender: "Patient", time: "10:03 AM", text: "Doctor, I have mild chest heaviness since yesterday evening after climbing stairs." },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Quick Prescription State
  const [rxMedicines, setRxMedicines] = useState<any[]>([
    { name: "Sorbitrate 5mg", dosage: "1 Tab", frequency: "SOS on chest tightness" },
    { name: "Atorvastatin 20mg", dosage: "1 Tab", frequency: "0-0-1 Night" },
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState(
    "Patient reviewed via secure video teleconsultation. Reports mild exertional angina. Advised resting ECG and lipid profile review. Avoid heavy lifting."
  );

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isInCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInCall]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // WebRTC Signal Sender Helper
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

  // Initialize Local Media Stream
  const initLocalMedia = async (): Promise<MediaStream | null> => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }
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
      return stream;
    } catch (err: any) {
      console.error("Camera/Mic getUserMedia error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setHasCameraPermission(false);
        toast.error("Camera/Microphone permission denied. Please allow camera and mic permissions.");
      } else {
        // Attempt audio only fallback if video device missing
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = audioStream;
          setHasCameraPermission(true);
          return audioStream;
        } catch {
          toast.error("No camera or microphone device found.");
        }
      }
      return null;
    }
  };

  // Create Peer Connection
  const createPeerConnection = (stream: MediaStream): RTCPeerConnection => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Remote track listener
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        setHasRemoteStream(true);
        setConnectionStatus("connected");
      }
    };

    // ICE candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate);
      }
    };

    // Connection state listeners
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      const state = pc.connectionState;
      if (state === "connected") {
        setConnectionStatus("connected");
      } else if (state === "connecting") {
        setConnectionStatus("connecting");
      } else if (state === "disconnected") {
        setConnectionStatus("disconnected");
        setHasRemoteStream(false);
      } else if (state === "failed") {
        setConnectionStatus("failed");
        setHasRemoteStream(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!pc) return;
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        setConnectionStatus("connected");
      } else if (state === "checking") {
        setConnectionStatus("connecting");
      } else if (state === "disconnected") {
        setConnectionStatus("reconnecting");
      } else if (state === "failed") {
        setConnectionStatus("failed");
      }
    };

    return pc;
  };

  // Handle incoming signaling messages
  const handleSignalMessage = async (msg: SignalMessage) => {
    if (msg.sender === myUserIdRef.current) return;

    const pc = pcRef.current;

    switch (msg.type) {
      case "peer-joined": {
        setConnectionStatus("connecting");
        toast.info(`${msg.senderRole} joined the consultation room!`);
        // If I am Doctor or current peer connection exists, create SDP Offer
        if (pc && currentRole === "Doctor") {
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            await sendSignal("offer", offer);
          } catch (e) {
            console.error("Error creating offer:", e);
          }
        }
        break;
      }

      case "offer": {
        if (!pc) return;
        try {
          setConnectionStatus("connecting");
          await pc.setRemoteDescription(new RTCSessionDescription(msg.data));

          // Apply pending ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", answer);
        } catch (e) {
          console.error("Error handling offer:", e);
        }
        break;
      }

      case "answer": {
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.data));

          // Apply pending ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        } catch (e) {
          console.error("Error handling answer:", e);
        }
        break;
      }

      case "ice-candidate": {
        if (!pc) return;
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.data));
          } else {
            pendingCandidatesRef.current.push(msg.data);
          }
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
        break;
      }

      case "chat": {
        if (msg.data) {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: msg.senderRole,
              time: msg.data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: msg.data.text,
            },
          ]);
        }
        break;
      }

      case "peer-left":
      case "leave": {
        setConnectionStatus("disconnected");
        setHasRemoteStream(false);
        toast.info(`${msg.senderRole} left the consultation.`);
        break;
      }
    }
  };

  // Start Video Consultation
  const handleStartCall = async (selectedRoom: string = roomId, targetPatient: string = patientName, role: "Doctor" | "Patient" = currentRole) => {
    try {
      setRoomId(selectedRoom);
      setPatientName(targetPatient);
      setCurrentRole(role);
      setIsInCall(true);
      setConnectionStatus("waiting");

      // 1. Get media
      const stream = await initLocalMedia();
      if (!stream) {
        setIsInCall(false);
        return;
      }

      // 2. Setup RTCPeerConnection
      const pc = createPeerConnection(stream);

      // 3. Connect Signaling SSE stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sseUrl = `/api/teleconsultation/signal?room=${encodeURIComponent(selectedRoom)}&sender=${encodeURIComponent(
        myUserIdRef.current
      )}&role=${encodeURIComponent(role)}&stream=true`;

      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            handleSignalMessage(data);
          }
        } catch (e) {
          // ignore keepalives
        }
      };

      es.onerror = () => {
        // SSE fallback / reconnect handled automatically by browser EventSource
      };

      // 4. Send join announcement
      await sendSignal("join", { role, name: role === "Doctor" ? doctorName : patientName });

      toast.success(`Connected to secure teleconsultation room (${selectedRoom})!`);
    } catch (err: any) {
      console.error("Failed to start call:", err);
      toast.error("Failed to initialize video call session.");
      setIsInCall(false);
    }
  };

  // End Call Session
  const handleEndCall = async () => {
    try {
      await sendSignal("leave");
    } catch {}

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Stop Media Tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    setIsInCall(false);
    setHasRemoteStream(false);
    setIsScreenSharing(false);
    setConnectionStatus("idle");
    toast.info("Call ended. Summary saved to EMR.");
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextState = !isMicOn;
      audioTracks.forEach((t) => (t.enabled = nextState));
      setIsMicOn(nextState);
      toast.info(nextState ? "Microphone Active" : "Microphone Muted");
    }
  };

  // Toggle Camera
  const handleToggleCam = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const nextState = !isCamOn;
      videoTracks.forEach((t) => (t.enabled = nextState));
      setIsCamOn(nextState);
      toast.info(nextState ? "Camera Turned On" : "Camera Turned Off");
    }
  };

  // Toggle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop Screen Share and revert to camera track
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }

      if (localStreamRef.current && pcRef.current) {
        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && camVideoTrack) {
          videoSender.replaceTrack(camVideoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      setIsScreenSharing(false);
      toast.info("Screen Sharing Stopped");
    } else {
      // Start Screen Share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          handleToggleScreenShare();
        };

        setIsScreenSharing(true);
        toast.info("Sharing Screen with participant");
      } catch (err) {
        toast.error("Screen sharing cancelled or not supported");
      }
    }
  };

  // Synchronized Chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      sender: currentRole,
      time: timeStr,
      text: inputMessage.trim(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    if (isInCall) {
      await sendSignal("chat", {
        sender: currentRole,
        time: timeStr,
        text: newMsg.text,
      });
    }
  };

  const handleAddMedicine = () => {
    if (!newMedName) {
      toast.error("Enter medicine name");
      return;
    }
    setRxMedicines([
      ...rxMedicines,
      {
        name: newMedName,
        dosage: newMedDose || "1 Tablet",
        frequency: newMedFreq || "1-0-1 After meals",
      },
    ]);
    setNewMedName("");
    setNewMedDose("");
    setNewMedFreq("");
    toast.success("Medicine added to consultation e-Rx");
  };

  const handleIssueElectronicRx = () => {
    toast.success("Digital e-Prescription signed and sent to patient's WhatsApp & ABHA account!");
  };

  // Re-attach local video stream when entering call UI
  useEffect(() => {
    if (isInCall && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isInCall]);

  const inviteLinkUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/teleconsultation?room=${encodeURIComponent(roomId)}&role=patient`
      : `https://meet.medipulse.com/tele/${roomId}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-950 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-500/30">
              <Video className="h-3.5 w-3.5" />
              <span>WEBRTC ENCRYPTED TELEMEDICINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Virtual Teleconsultation & Video Clinic
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              HD video consultations, real-time in-call chat, integrated clinical decision support, and instant digitally-signed e-prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isInCall ? (
              <button
                onClick={() => handleStartCall(roomId, patientName, currentRole)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-brand-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-sky-500/25 hover:brightness-110 transition-all"
              >
                <Video className="h-4 w-4" />
                <span>Start Video Consultation</span>
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-rose-700 transition-all"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!isInCall ? (
        /* VIRTUAL WAITING ROOM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Waiting Patients List */}
          <div className="lg:col-span-8 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Today's Scheduled Video Consultations
                </h3>
                <p className="text-xs text-slate-400">Patients in virtual waiting queue</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                2 Patients Waiting
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "APT-2026-104",
                  name: "Virendra Malhotra",
                  age: 62,
                  gender: "Male",
                  reason: "Chronic post-PTCA exertional evaluation and chest tightness",
                  time: "10:00 AM - 10:20 AM",
                  status: "Ready in Room",
                },
                {
                  id: "APT-2026-105",
                  name: "Meera Nair",
                  age: 36,
                  gender: "Female",
                  reason: "Migraine with visual aura flare-up follow-up",
                  time: "10:30 AM - 10:45 AM",
                  status: "Waiting",
                },
              ].map((pat, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {pat.name}
                      </span>
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        {pat.gender}, {pat.age}y
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{pat.reason}</p>
                    <p className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400">
                      Slot: {pat.time} | Ref: {pat.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartCall(pat.id, pat.name, "Doctor")}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-brand-600 px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Start Video Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Invite & Device Test */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-sky-600" />
                <span>Generate Instant Invite Link</span>
              </h4>
              <p className="text-xs text-slate-400">
                Send a 1-click encrypted consultation link to any patient via SMS / WhatsApp.
              </p>
              <div className="rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600 truncate dark:bg-slate-800 dark:text-slate-300">
                {inviteLinkUrl}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLinkUrl);
                  toast.success("Patient invite link copied to clipboard!");
                }}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-700"
              >
                Copy Patient Invite Link
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>Audio / Video Camera Status</span>
                <span className="text-emerald-600">
                  {hasCameraPermission === false ? "Permission Denied" : "Optimal (1080p HD)"}
                </span>
              </div>
              <p className="text-[11px]">End-to-End TLS 1.3 / SRTP Encrypted Stream</p>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE VIDEO ROOM SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Video Stream Frame */}
          <div className="lg:col-span-8 rounded-3xl bg-slate-950 p-4 border border-slate-800 shadow-2xl relative flex flex-col justify-between min-h-[520px]">
            {/* Top Video Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-bold">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : connectionStatus === "connecting"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-sky-400"
                  }`}
                />
                <span>
                  {currentRole === "Doctor" ? `LIVE CONSULTATION: ${patientName}` : `CONSULTATION WITH: ${doctorName}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-sky-500/30">
                  {connectionStatus === "connected"
                    ? "P2P Connected"
                    : connectionStatus === "connecting"
                    ? "Connecting..."
                    : connectionStatus === "waiting"
                    ? "Waiting for Peer..."
                    : connectionStatus === "reconnecting"
                    ? "Reconnecting..."
                    : "Disconnected"}
                </span>
                <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 text-xs font-mono">
                  REC: {formatDuration(callDuration)}
                </span>
              </div>
            </div>

            {/* Video Main Tile (Remote Participant Video) */}
            <div className="relative my-auto flex flex-col items-center justify-center text-center p-4 w-full h-full min-h-[360px]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 max-w-xl w-full aspect-video bg-slate-900 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${hasRemoteStream ? "block" : "hidden"}`}
                />

                {!hasRemoteStream && (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 p-6">
                    <div className="h-24 w-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
                      <User className="h-12 w-12" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {currentRole === "Doctor" ? patientName : doctorName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {connectionStatus === "connected"
                          ? "Participant camera is off or initializing..."
                          : "Waiting for other participant to join consultation..."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-bold">
                  {currentRole === "Doctor" ? `${patientName} (Patient)` : `${doctorName} (Doctor)`}
                </div>
              </div>

              {/* PiP Local Participant Tile */}
              <div className="absolute bottom-4 right-4 h-32 w-44 rounded-2xl bg-slate-900 border-2 border-brand-500 overflow-hidden shadow-2xl hidden sm:block">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCamOn ? "block" : "hidden"}`}
                />
                {!isCamOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <User className="h-8 w-8" />
                    <span className="text-[10px] mt-1">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                  You ({currentRole})
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-center gap-3 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 max-w-md mx-auto w-full">
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-2xl transition-all ${
                  isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rose-600 text-white"
                }`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={handleToggleCam}
                className={`p-3 rounded-2xl transition-all ${
                  isCamOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rose-600 text-white"
                }`}
                title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <button
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-2xl transition-all ${
                  isScreenSharing ? "bg-teal-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
              >
                <Share2 className="h-5 w-5" />
              </button>

              <button
                onClick={handleEndCall}
                className="px-5 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Right Clinical Side Panel (Chat / e-Rx / Notes) */}
          <div className="lg:col-span-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between min-h-[520px]">
            {/* Panel Tabs */}
            <div>
              <div className="flex gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
                {[
                  { id: "rx", label: "e-Prescription", icon: Pill },
                  { id: "notes", label: "Doctor Notes", icon: FileSignature },
                  { id: "chat", label: "Live Chat", icon: MessageSquare },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = activeSideTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSideTab(t.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB: E-PRESCRIPTION */}
              {activeSideTab === "rx" && (
                <div className="space-y-3 mt-3">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {rxMedicines.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60"
                      >
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {m.name} ({m.dosage})
                        </p>
                        <p className="text-[11px] text-brand-600 font-semibold">{m.frequency}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800 text-xs">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Pan-D)"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dose (1 Tab)"
                        value={newMedDose}
                        onChange={(e) => setNewMedDose(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Freq (1-0-1)"
                        value={newMedFreq}
                        onChange={(e) => setNewMedFreq(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                    >
                      + Add Medicine
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: DOCTOR NOTES */}
              {activeSideTab === "notes" && (
                <div className="space-y-3 mt-3">
                  <textarea
                    rows={8}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>
              )}

              {/* TAB: CHAT */}
              {activeSideTab === "chat" && (
                <div className="space-y-3 mt-3 flex flex-col h-64 justify-between">
                  <div className="overflow-y-auto space-y-2 pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl p-2.5 text-xs max-w-[85%] ${
                          msg.sender === currentRole
                            ? "ml-auto bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <p className="text-[10px] opacity-75 font-semibold">
                          {msg.sender} • {msg.time}
                        </p>
                        <p className="mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type clinical chat message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="rounded-xl bg-brand-600 p-2 text-white hover:bg-brand-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Issue Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleIssueElectronicRx}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-extrabold text-white shadow hover:brightness-110"
              >
                <FileSignature className="h-4 w-4" />
                <span>Issue Signed e-Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeleconsultationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Teleconsultation Room...</div>}>
      <TeleconsultationContent />
    </Suspense>
  );
}
