from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import NotificationPreference
from models.subscription import Subscription
from models.user import User
from repository.notification import NotificationRepository

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
SUBSCRIPTION_REMINDER_DAYS = 3
BUDGET_THRESHOLD = 0.80

# Notification type constants
TYPE_GROUP_EXPENSE_ADDED = "group_expense_added"
TYPE_SETTLEMENT_CREATED = "settlement_created"
TYPE_GROUP_INVITE = "group_invite"
TYPE_SUBSCRIPTION_REMINDER = "subscription_reminder"
TYPE_BUDGET_ALERT = "budget_alert"

_PREF_FIELD = {
    TYPE_GROUP_EXPENSE_ADDED: "group_expense_added",
    TYPE_SETTLEMENT_CREATED: "settlement_created",
    TYPE_GROUP_INVITE: "group_invite",
    TYPE_SUBSCRIPTION_REMINDER: "subscription_reminders",
    TYPE_BUDGET_ALERT: "budget_alerts",
}


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = NotificationRepository(db)

    # ── Device registration ───────────────────────────────────────────────────

    async def register_device(
        self,
        user_id: str,
        token: str,
        platform: str,
        device_name: Optional[str] = None,
    ) -> None:
        await self.repo.upsert_device_token(user_id, token, platform, device_name)

    # ── Preferences ───────────────────────────────────────────────────────────

    async def get_preferences(self, user_id: str) -> NotificationPreference:
        return await self.repo.get_or_create_preferences(user_id)

    async def update_preferences(self, user_id: str, **kwargs) -> NotificationPreference:
        pref = await self.repo.get_or_create_preferences(user_id)
        return await self.repo.update_preferences(pref, **kwargs)

    # ── Core send logic ───────────────────────────────────────────────────────

    async def _send_push(self, tokens: list[str], title: str, body: str, data: dict) -> None:
        if not tokens:
            return
        messages = [
            {"to": token, "title": title, "body": body, "data": data, "sound": "default"}
            for token in tokens
        ]
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(EXPO_PUSH_URL, json=messages)
                resp.raise_for_status()
        except Exception as exc:
            logger.warning("Expo push failed: %s", exc)

    async def _notify(
        self,
        user_id: str,
        type: str,
        title: str,
        body: str,
        data: dict,
        entity_id: Optional[str] = None,
    ) -> None:
        # 1. Load user — check master switch
        user = await self.db.get(User, user_id)
        if not user or not user.notifications_enabled:
            return

        # 2. Check per-type preference
        pref = await self.repo.get_or_create_preferences(user_id)
        pref_field = _PREF_FIELD.get(type)
        if pref_field and not getattr(pref, pref_field, True):
            return

        # 3. Deduplication — skip if same entity_id was notified in the past 24 h
        if entity_id:
            since = datetime.now(timezone.utc) - timedelta(hours=24)
            recent = await self.repo.find_recent_notification(user_id, type, entity_id, since)
            if recent:
                return

        # 4. Get active device tokens
        device_tokens = await self.repo.get_active_tokens_for_user(user_id)
        push_tokens = [dt.token for dt in device_tokens]

        # 5. Send push
        await self._send_push(push_tokens, title, body, data)

        # 6. Log notification
        await self.repo.log_notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data=data,
            entity_id=entity_id,
        )

    # ── Trigger methods ───────────────────────────────────────────────────────

    async def notify_group_expense_added(
        self,
        group_id: str,
        group_name: str,
        expense_id: str,
        expense_title: str,
        expense_amount: float,
        currency: str,
        payer_name: str,
        payer_id: str,
        member_ids: list[str],
    ) -> None:
        title = f"New expense in {group_name}"
        body = f"{payer_name} added '{expense_title}' — {currency} {expense_amount:,.0f}"
        data = {"screen": "group", "groupId": group_id}
        entity_id = f"group_expense_{expense_id}"

        for member_id in member_ids:
            if member_id == payer_id:
                continue
            await self._notify(
                user_id=member_id,
                type=TYPE_GROUP_EXPENSE_ADDED,
                title=title,
                body=body,
                data=data,
                entity_id=entity_id,
            )

    async def notify_settlement_created(
        self,
        group_id: str,
        group_name: str,
        settlement_id: str,
        payee_id: str,
        payer_name: str,
        amount: float,
        currency: str,
    ) -> None:
        title = "You received a payment"
        body = f"{payer_name} paid you {currency} {amount:,.0f} in {group_name}"
        data = {"screen": "group", "groupId": group_id}
        await self._notify(
            user_id=payee_id,
            type=TYPE_SETTLEMENT_CREATED,
            title=title,
            body=body,
            data=data,
            entity_id=f"settlement_{settlement_id}",
        )

    async def notify_group_joined(
        self,
        group_id: str,
        group_name: str,
        new_member_name: str,
        new_member_id: str,
        existing_member_ids: list[str],
    ) -> None:
        title = f"New member in {group_name}"
        body = f"{new_member_name} joined the group"
        data = {"screen": "group", "groupId": group_id}

        for member_id in existing_member_ids:
            if member_id == new_member_id:
                continue
            await self._notify(
                user_id=member_id,
                type=TYPE_GROUP_INVITE,
                title=title,
                body=body,
                data=data,
                entity_id=f"group_join_{group_id}_{new_member_id}",
            )

    async def notify_budget_alert(
        self,
        user_id: str,
        spent: float,
        budget: float,
        currency: str,
    ) -> None:
        percent = int((spent / budget) * 100)
        title = "Budget Alert"
        body = f"You've used {percent}% of your monthly budget ({currency} {spent:,.0f} of {currency} {budget:,.0f})"
        data = {"screen": "reports"}
        today = date.today()
        entity_id = f"budget_{user_id}_{today.year}_{today.month}"
        await self._notify(
            user_id=user_id,
            type=TYPE_BUDGET_ALERT,
            title=title,
            body=body,
            data=data,
            entity_id=entity_id,
        )

    # ── Scheduled job ─────────────────────────────────────────────────────────

    async def check_subscription_reminders(self) -> None:
        target_date = date.today() + timedelta(days=SUBSCRIPTION_REMINDER_DAYS)
        result = await self.db.execute(
            select(Subscription)
            .join(User, User.id == Subscription.user_id)
            .where(
                Subscription.is_active == True,  # noqa: E712
                Subscription.next_renewal == target_date,
                User.is_active == True,  # noqa: E712
            )
        )
        subs = result.scalars().all()

        for sub in subs:
            user = await self.db.get(User, sub.user_id)
            if not user:
                continue
            title = "Subscription Renewal Reminder"
            body = f"{sub.name} renews in {SUBSCRIPTION_REMINDER_DAYS} days — {user.currency} {sub.amount:,.0f}"
            data = {"screen": "subscription", "subscriptionId": sub.id}
            entity_id = f"sub_{sub.id}_{target_date.isoformat()}"
            await self._notify(
                user_id=sub.user_id,
                type=TYPE_SUBSCRIPTION_REMINDER,
                title=title,
                body=body,
                data=data,
                entity_id=entity_id,
            )

        logger.info("Subscription reminder check done. Processed %d subscriptions.", len(subs))
