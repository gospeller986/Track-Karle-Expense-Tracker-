import { apiFetch } from './api';
import type {
  Group, GroupListResponse, GroupInvite,
  FriendListResponse,
  CreateGroupPayload, UpdateGroupPayload,
} from '@/interfaces/group';

export async function listGroups(): Promise<GroupListResponse> {
  return apiFetch<GroupListResponse>('/groups', { auth: true });
}

export async function getGroup(id: string): Promise<Group> {
  return apiFetch<Group>(`/groups/${id}`, { auth: true });
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  return apiFetch<Group>('/groups', {
    auth: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGroup(id: string, payload: UpdateGroupPayload): Promise<Group> {
  return apiFetch<Group>(`/groups/${id}`, {
    auth: true,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(id: string): Promise<void> {
  return apiFetch<void>(`/groups/${id}`, { auth: true, method: 'DELETE' });
}

export async function generateInvite(groupId: string): Promise<GroupInvite> {
  return apiFetch<GroupInvite>(`/groups/${groupId}/generate-invite`, {
    auth: true,
    method: 'POST',
  });
}

export async function joinGroup(token: string): Promise<Group> {
  return apiFetch<Group>('/groups/join', {
    auth: true,
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function listFriends(): Promise<FriendListResponse> {
  return apiFetch<FriendListResponse>('/groups/friends/list', { auth: true });
}
