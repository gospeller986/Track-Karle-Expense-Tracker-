export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  createdBy: string;
  memberCount: number;
  yourBalance: number;
  totalExpenses: number;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupListResponse {
  data: Group[];
}

export interface GroupInvite {
  inviteToken: string;
  inviteLink: string;
  groupId: string;
  groupName: string;
}

export interface Friend {
  id: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  netBalance: number;
  sharedGroups: number;
}

export interface FriendListResponse {
  data: Friend[];
}

export interface CreateGroupPayload {
  name: string;
  icon?: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  icon?: string;
  description?: string;
}
