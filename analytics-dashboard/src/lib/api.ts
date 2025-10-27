// In Docker, use empty string to make requests relative (goes through Vite proxy)
// Locally, use localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL === 'http://api:3000' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

export interface BrandAnalytics {
  brandId: string;
  brandName: string;
  totalTasks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  avgEngagementRate: number;
  totalEngagement: number;
  totalSales: number;
  conversionRate: number;
  salesPerTask: number;
}

export interface PlatformAnalytics {
  platform: string;
  totalTasks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  avgEngagementRate: number;
  totalEngagement: number;
}

export interface BrandPlatformAnalytics {
  brandId: string;
  brandName: string;
  platform: string;
  totalTasks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  avgEngagementRate: number;
  totalEngagement: number;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  userEmail: string | null;
  totalTasks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  influenceScore: number;
  totalSales: number;
  totalPrograms: number;
  conversionRate: number;
}

export interface ProgramAnalytics {
  programId: string;
  brandId: string | null;
  brandName: string;
  totalTasks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalSales: number;
  totalAdvocates: number;
  salesPerTask: number;
  salesPerAdvocate: number;
}

export interface PerformanceOverTime {
  date: string;
  engagement: number;
  reach: number;
  tasks: number;
  sales: number;
}

export interface PlatformBreakdown {
  platform: string;
  totalTasks: number;
  totalEngagement: number;
  totalReach: number;
  avgEngagementRate: number;
}

export interface ProgramParticipation {
  programId: string;
  programName: string | null;
  brandName: string | null;
  tasksCompleted: number;
  salesAttributed: number;
  totalTasks: number;
  totalEngagement: number;
  totalReach: number;
}

export interface TaskHistoryItem {
  taskId: string;
  platform: string;
  submittedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  brandName: string;
  programName: string;
}

export interface UserDetailAnalytics {
  user: UserAnalytics;
  performanceOverTime: PerformanceOverTime[];
  platformBreakdown: PlatformBreakdown[];
  programParticipation: ProgramParticipation[];
  taskHistory: TaskHistoryItem[];
}

export async function fetchBrandAnalytics(): Promise<BrandAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/brands`);
  if (!response.ok) {
    throw new Error('Failed to fetch brand analytics');
  }
  return response.json();
}

export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/platforms`);
  if (!response.ok) {
    throw new Error('Failed to fetch platform analytics');
  }
  return response.json();
}

export async function fetchBrandPlatformAnalytics(): Promise<BrandPlatformAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/brands-platforms`);
  if (!response.ok) {
    throw new Error('Failed to fetch brand-platform analytics');
  }
  return response.json();
}

export async function fetchUserAnalytics(): Promise<UserAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch user analytics');
  }
  return response.json();
}

export async function fetchProgramAnalytics(): Promise<ProgramAnalytics[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/programs`);
  if (!response.ok) {
    throw new Error('Failed to fetch program analytics');
  }
  return response.json();
}

export async function fetchUserDetailAnalytics(userId: string): Promise<UserDetailAnalytics> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user detail analytics');
  }
  return response.json();
}
