export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export type SignalType =
  | "join"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "chat"
  | "leave"
  | "ready"
  | "peer-joined"
  | "peer-left";

export interface SignalMessage {
  id: string;
  room: string;
  sender: string;
  senderRole: "Doctor" | "Patient" | string;
  type: SignalType;
  data?: any;
  timestamp: number;
}
