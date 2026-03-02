export interface User {
  id: string;
  role: "patient" | "hospital" | "admin";
  address?: string;
  email?: string;
}

export interface Milestone {
  id: number;
  description: string;
  amount: string; // in ETH
  confirmed: boolean;
  released: boolean;
  releaseTx?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  patientAddress: string;
  hospitalAddress: string;
  riskScore: number;
  status: "pending" | "active" | "completed" | "rejected";
  contractAddress: string;
  raised: string;
  goal: string;
  createdAt: string;
  documentsHash?: string;
  milestones: Milestone[];
}
