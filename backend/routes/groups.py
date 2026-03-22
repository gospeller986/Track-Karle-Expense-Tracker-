from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repository.group import GroupRepository
from routes.auth import get_current_user
from schemas.group import (
    CreateGroupPayload,
    FriendListResponse,
    FriendResponse,
    GroupInviteResponse,
    GroupListResponse,
    GroupMemberEmbed,
    GroupResponse,
    JoinGroupPayload,
    UpdateGroupPayload,
)
from models.user import User

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_invite_link(base_url: str, token: str) -> str:
    """Returns an http(s) URL that redirects to the deep link.
    Works in all messaging apps and camera apps (unlike exptracker:// custom scheme)."""
    return f"{base_url.rstrip('/')}/join/{token}"


def _group_to_response(group, your_balance: float = 0.0, total_expenses: float = 0.0) -> GroupResponse:
    members = [
        GroupMemberEmbed(
            id=gm.user.id,
            name=gm.user.name,
            avatar_url=gm.user.avatar_url,
        )
        for gm in group.members
    ]
    return GroupResponse(
        id=group.id,
        name=group.name,
        icon=group.icon,
        description=group.description,
        created_by=group.created_by,
        member_count=len(members),
        your_balance=your_balance,
        total_expenses=total_expenses,
        members=members,
        created_at=group.created_at,
    )


# ── Group CRUD ────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED, response_model=GroupResponse, response_model_by_alias=True)
async def create_group(
    payload: CreateGroupPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    group = await repo.create(
        user_id=current_user.id,
        name=payload.name,
        icon=payload.icon,
        description=payload.description,
    )
    await db.commit()
    return _group_to_response(group)


@router.get("", response_model=GroupListResponse, response_model_by_alias=True)
async def list_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    groups = await repo.list_for_user(current_user.id)
    items = []
    for g in groups:
        bal, total = await repo.compute_balance(g.id, current_user.id)
        items.append(_group_to_response(g, bal, total))
    return GroupListResponse(data=items)


@router.get("/{group_id}", response_model=GroupResponse, response_model_by_alias=True)
async def get_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    group = await repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not await repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    bal, total = await repo.compute_balance(group_id, current_user.id)
    return _group_to_response(group, bal, total)


@router.put("/{group_id}", response_model=GroupResponse, response_model_by_alias=True)
async def update_group(
    group_id: str,
    payload: UpdateGroupPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    if not await repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    group = await repo.update(group_id, **payload.model_dump(exclude_none=True))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    await db.commit()
    bal, total = await repo.compute_balance(group_id, current_user.id)
    return _group_to_response(group, bal, total)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    group = await repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group creator can delete it")
    await repo.delete(group_id)
    await db.commit()


# ── Invite ────────────────────────────────────────────────────────────────────

@router.post("/{group_id}/generate-invite", response_model=GroupInviteResponse, response_model_by_alias=True)
async def generate_invite(
    group_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    group = await repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not await repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    token = await repo.generate_invite_token(group_id)
    await db.commit()
    return GroupInviteResponse(
        invite_token=token,
        invite_link=_build_invite_link(str(request.base_url), token),
        group_id=group_id,
        group_name=group.name,
    )


@router.post("/join", response_model=GroupResponse, response_model_by_alias=True)
async def join_group(
    payload: JoinGroupPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    group = await repo.get_by_invite_token(payload.token)
    if not group:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link")
    already = await repo.is_member(group.id, current_user.id)
    if already:
        # Already a member — just return the group
        bal, total = await repo.compute_balance(group.id, current_user.id)
        return _group_to_response(group, bal, total)
    existing_member_ids = [gm.user.id for gm in group.members]
    new_member_name = current_user.name  # capture before commit expires it
    await repo.add_member(group.id, current_user.id)
    await db.commit()
    # Reload with new member included
    group = await repo.get_by_id(group.id)  # type: ignore[assignment]

    # Notify existing members that someone joined
    from services.notification import NotificationService
    svc = NotificationService(db)
    await svc.notify_group_joined(
        group_id=group.id,
        group_name=group.name,
        new_member_name=new_member_name,
        new_member_id=current_user.id,
        existing_member_ids=existing_member_ids,
    )
    await db.commit()

    return _group_to_response(group)


# ── Friends ───────────────────────────────────────────────────────────────────

@router.get("/friends/list", response_model=FriendListResponse, response_model_by_alias=True)
async def list_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = GroupRepository(db)
    rows = await repo.get_friends(current_user.id)
    friends = [
        FriendResponse(
            id=user.id,
            name=user.name,
            avatar_url=user.avatar_url,
            net_balance=0.0,    # cross-group balance computed when group expenses are built
            shared_groups=count,
        )
        for user, count in rows
    ]
    return FriendListResponse(data=friends)
