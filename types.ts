
export interface User {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  stats?: {
    articles: number;
    questions: number;
    answers: number;
    likes: number;
  };
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  author: User;
  date: string;
  tags: string[];
  category: string;
  views: number;
  likes: number;
  comments: number;
  imageUrl?: string;
  isTop?: boolean;
  isOfficial?: boolean;
  isNew?: boolean;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  duration: string;
  category: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: 'pdf' | 'ppt' | 'word' | 'excel' | 'zip';
  size: string;
  downloads: number;
  category: string;
  uploader: string;
  uploadDate: string;
  tags?: string[];
  description?: string; // For preview
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  isCompleted: boolean;
  type: 'checkin' | 'read' | 'download' | 'learn';
}

export interface PointTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  date: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  stepsCount: number;
  level: 'Beginner' | 'Advanced' | 'Expert';
}

export interface VoteOption {
  id: string;
  label: string;
  count: number;
  }
  
  export interface Activity {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'Upcoming' | 'Ongoing' | 'Ended';
  participants: number;
  image: string;
  isQuarterly?: boolean;
  description?: string;
  isRegistered?: boolean;
  hasVoting?: boolean;
  voteTitle?: string;
  voteOptions?: VoteOption[];
  userVotedOptionId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  tags?: string[];
  isHot?: boolean;
  isNew?: boolean;
}

// AI Lab Interfaces
export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'Writing' | 'Image' | 'Data' | 'Office';
  url: string;
  isInternal?: boolean;
}

export interface AINews {
  id: string;
  title: string;
  summary: string;
  date: string;
  tag: string;
  imageUrl?: string;
}

export interface AIPrompt {
  id: string;
  title: string;
  scenario: string;
  content: string;
  copyCount: number;
  tags: string[];
}

export enum NavTab {
  HOME = 'HOME',
  ACTIVITY = 'ACTIVITY',
  TRAINING = 'TRAINING',
  AI_LAB = 'AI_LAB',
  ARTICLES = 'ARTICLES',
  MOMENTS = 'MOMENTS',
  MALL = 'MALL',
  ADMIN = 'ADMIN'
}
