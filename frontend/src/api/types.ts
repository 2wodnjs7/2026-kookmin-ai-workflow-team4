export interface MeetingMinutes {
  agenda: string[];
  discussion: string;
  decisions: string[];
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  minutes: MeetingMinutes | null;
  createdAt: string;
  actionItemCount?: number;
}

export interface Meeting extends MeetingListItem {
  rawText: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignee: string | null;
  dueDate: string | null;
  status: 'todo' | 'done';
  createdAt: string;
}

export interface ActionMeetingContext {
  id: string;
  title: string;
  date: string;
}

export interface ActionItemWithMeeting extends ActionItem {
  meeting: ActionMeetingContext;
}

export interface PaginatedMeetingsResponse {
  meetings: MeetingListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedActionsResponse {
  actions: ActionItemWithMeeting[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchMeetingsResponse extends PaginatedMeetingsResponse {
  query: string;
}

export interface CreateMeetingRequest {
  rawText: string;
  title?: string;
  date?: string;
  attendees?: string[];
}

export interface UpdateActionItemRequest {
  status?: 'todo' | 'done';
  content?: string;
  assignee?: string | null;
  dueDate?: string | null;
}

export interface GenerateActionsRequest {
  meetingId: string;
  mode?: 'one' | 'all';
}

export interface GenerateActionsResponse {
  actions: ActionItem[];
  generated: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
