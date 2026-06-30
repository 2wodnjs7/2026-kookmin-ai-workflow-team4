export type MeetingStatus = 'draft' | 'completed';

export interface MeetingMinutes {
  agenda: string[];
  summary: string;
  decisions: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  rawText: string;
  minutes: MeetingMinutes | null;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignee: string;
  dueDate: string | null;
  status: 'todo' | 'done';
  createdAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  date: string;
  attendees: string[];
  rawText: string;
}

export interface SearchMeetingsRequest {
  query: string;
}

export interface SearchMeetingsResponse {
  meetings: Meeting[];
}

export interface UpdateActionItemRequest {
  status?: 'todo' | 'done';
  assignee?: string;
  dueDate?: string | null;
}
