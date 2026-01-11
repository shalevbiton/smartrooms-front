
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  personalId: string;
  password: string;
  name: string;
  base: string;
  jobTitle?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  customBackground?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  imageUrl: string;

  locationType: 'PRISON' | 'YAMAR';
  isAvailable: boolean;
  isRecorded: boolean;
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  title: string; // Investigator Name
  investigatorId: string;
  secondInvestigatorId: string;
  interrogatedName: string;
  offenses: string;
  type?: 'TESTIMONY' | 'INVESTIGATION';
  description: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  isRecorded?: boolean;
  checkoutVideoUrl?: string;
  phoneNumber?: string;
}
