# v1.5.5 — Project closed, reset fixes

v1.5.4 was published without these changes (same code as v1.5.3); this is
the release that contains them.

weekly-schedule-card is no longer developed. Its successor is
[Schedule Creator](https://github.com/arozoire/schedule_creator), which imports
a weekly-schedule-card backup. See the notice at the top of the README and the
[migration guide](https://github.com/arozoire/schedule_creator/blob/main/docs/migrating-from-weekly-schedule-card.md).

## Changes

- **RESET looked broken**: the RESET button stays disabled until the reset
  report is downloaded, the confirmation is ticked and `RESET` is typed, but
  nothing said so. Disabled buttons now look disabled and a line under the
  button says what is still missing.
- A schedule disabled in the Home Assistant entity registry no longer blocks the
  whole reset: it is listed for removal by hand in Scheduler.
- Unassigned Scheduler schedules (for example ones lost from a profile) are
  still kept by default, but can now be ticked one by one to delete them too.
- New option for uninstalling: also delete the card storage helpers
  (`input_text.wsc_store_*`, `input_text.wsc_qt_store_*`). An open card
  recreates empty ones, so remove the card from the dashboards afterwards.
- Changing a choice requires downloading the report again, so the report always
  lists exactly what is deleted.

## Safety

- Reset still never calls target-device domains.
- Nothing outside the listed and ticked objects is deleted.
