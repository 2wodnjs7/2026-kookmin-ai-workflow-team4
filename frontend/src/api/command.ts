import api from '@/api/axios';
import type {
  ActionItem,
  CreateMeetingRequest,
  Meeting,
  SearchMeetingsRequest,
  SearchMeetingsResponse,
  UpdateActionItemRequest,
} from '@/api/types';

export async function getMeetings(): Promise<Meeting[]> {
  const { data } = await api.get<Meeting[]>('/meetings');
  return data;
}

export async function createMeeting(body: CreateMeetingRequest): Promise<Meeting> {
  const { data } = await api.post<Meeting>('/meetings', body);
  return data;
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data } = await api.get<Meeting>(`/meetings/${id}`);
  return data;
}

export async function getActionItems(): Promise<ActionItem[]> {
  const { data } = await api.get<ActionItem[]>('/actions');
  return data;
}

export async function updateActionItem(
  id: string,
  body: UpdateActionItemRequest,
): Promise<ActionItem> {
  const { data } = await api.patch<ActionItem>(`/actions/${id}`, body);
  return data;
}

export async function searchMeetings(
  body: SearchMeetingsRequest,
): Promise<SearchMeetingsResponse> {
  const { data } = await api.post<SearchMeetingsResponse>('/search', body);
  return data;
}
