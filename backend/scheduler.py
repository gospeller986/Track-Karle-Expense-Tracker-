from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _run_subscription_reminders() -> None:
    from database import AsyncSessionLocal
    from services.notification import NotificationService

    async with AsyncSessionLocal() as session:
        try:
            service = NotificationService(session)
            await service.check_subscription_reminders()
            await session.commit()
        except Exception as exc:
            logger.error("Subscription reminder job failed: %s", exc)
            await session.rollback()


def start_scheduler() -> None:
    scheduler.add_job(
        _run_subscription_reminders,
        CronTrigger(hour=9, minute=0),
        id="subscription_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — subscription reminders run daily at 09:00.")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
