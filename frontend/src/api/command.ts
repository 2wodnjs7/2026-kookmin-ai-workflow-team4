import api from '@/api/axios';
import type {
  CreateMeetingRequest,
  GenerateActionsRequest,
  GenerateActionsResponse,
  Meeting,
  PaginatedActionsResponse,
  PaginatedMeetingsResponse,
  SearchMeetingsResponse,
  UpdateActionItemRequest,
  ActionItem,
} from '@/api/types';

export async function getMeetings(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedMeetingsResponse> {
  const { data } = await api.get<PaginatedMeetingsResponse>('/api/meetings', { params });
  return data;
}

export async function createMeeting(body: CreateMeetingRequest): Promise<Meeting> {
  const { data } = await api.post<Meeting>('/api/meetings', body);
  return data;
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data } = await api.get<Meeting>(`/api/meetings/${id}`);
  return data;
}

export async function getActionItems(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedActionsResponse> {
  const { data } = await api.get<PaginatedActionsResponse>('/api/actions', { params });
  return data;
}

export async function updateActionItem(
  id: string,
  body: UpdateActionItemRequest,
): Promise<ActionItem> {
  const { data } = await api.patch<ActionItem>(`/api/actions/${id}`, body);
  return data;
}

export async function generateActions(
  body: GenerateActionsRequest,
): Promise<GenerateActionsResponse> {
  const { data } = await api.post<GenerateActionsResponse>('/api/actions/generate', {
    meetingId: body.meetingId,
    mode: body.mode ?? 'all',
  });
  return data;
}

export async function searchMeetings(params: {
  q: string;
  limit?: number;
  offset?: number;
}): Promise<SearchMeetingsResponse> {
  const { data } = await api.get<SearchMeetingsResponse>('/api/search', { params });
  return data;
}
