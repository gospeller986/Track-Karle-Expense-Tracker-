# Release Notes

---

## v0.5.0 — Historical Browsing, Auth Improvements & Chart Fixes

### New Features

**Month Picker — Browse Past Months**
- Home screen, Expenses tab, and Reports screen now have a month picker (‹ Month Year ›) to browse any past month's data.
- Right arrow is disabled at the current month to prevent navigating into the future.

**Cumulative Savings**
- Balance card on the home screen now shows a "Carried from Previous Months" figure — the net balance (income − expenses) accumulated across all months before the selected one.

**Change Password**
- New dedicated Change Password screen accessible from the Profile page.
- Requires current password verification before setting a new one.

**Forgot Password / Reset Password — Email Delivery**
- Password reset tokens are now delivered via email (Gmail SMTP) instead of being printed to the server console.
- Forgot Password and Reset Password screens are fully functional end-to-end.

**Show/Hide Password on Sign In**
- Eye icon toggle on the password field in the Sign In screen.

### Improvements

**Spending Trend Chart**
- All bars in the spending trend chart now use green shades instead of blending into the background.
- Amount spent is displayed above every non-zero bar.
- The 6-month window now ends at the selected month, so historical views always center on the correct period.

**Stale Data Prevention**
- Switching months now immediately clears old data and shows loading skeletons instead of briefly flashing the previous month's numbers.

**Auth Screen Polish**
- "Password Updated" success state uses a green Ionicons checkmark instead of an emoji.
- Removed dev-mode / server-console copy references from UI text.
- "Go to Sign In" and "Enter Reset Token" buttons are now full-width and centered.

### Bug Fixes

- Fixed reports showing all zeros when viewing a month other than the current one.
- Fixed spending trend showing no bar for the selected month when browsing historical months.
- Fixed stale expense data persisting briefly when switching between months on the Expenses tab.

---

## Earlier Releases

| Version | Highlights |
|---------|-----------|
| v0.4.x  | Onboarding flow |
| v0.3.x  | Custom categories, category management |
| v0.2.x  | Light mode, heatmap, home page improvements |
| v0.1.x  | Reports, group expenses, subscription tracking, initial release |
