export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  createdAt: string;
  isOnboarded: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  profileImage?: string;
  createdAt: string;
  isOnboarded: boolean;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  specialInstructions?: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  petId: string;
  serviceId: string;
  sitterId?: string;
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  pet?: Pet;
  service?: Service;
  user?: User;
  sitter?: Sitter;
}

export interface Sitter {
  id: string;
  name: string;
  email?: string;
  phone: string;
  experience: number;
  rating: number;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
