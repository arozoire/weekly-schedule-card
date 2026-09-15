# Maintenance, backup and restore

The editing card exposes an administrator-only **Groups → Maintenance** view.
Every operation starts with a fresh Home Assistant inventory; opening a preview
does not write anything.

## Portable WSC backup

**Save configuration** reads the shared profile store and the full Scheduler
configuration through Scheduler's WebSocket API. This is important because the
ordinary `switch.schedule_*` state can expose only a reduced action summary.
The JSON contains:

- profiles, groups and schedule links;
- complete configurations for every linked parent/legacy child schedule;
- generated WSC automation configurations with verified IDs and descriptions;
- referenced WSC runtime helper values.

It does not contain device states, currently running Quick Timers, dashboard
YAML, unrelated Scheduler entries or unrelated Home Assistant objects. It is a
WSC configuration backup, not a complete Home Assistant backup. Keep it private
and import only a file you trust: schedule and automation configuration is
executable after the restored profile is activated.

## Safe restore

Restore is blocked unless WSC profile data is empty and no generated WSC
schedule, automation, runtime helper or Quick Timer remains. The file is limited
to 2 MiB and must match the supported versioned schema and WSC namespaces.

Scheduler generates new IDs. WSC therefore creates each imported schedule with
the fixed future date `2099-12-31`, immediately switches the schedule off, applies
the original configuration, and remaps every profile link, helper reference and
automation reference to the new ID. Runtime profile command/active helpers are
cleared. Conditional occurrence metadata and snapshot chunks are also initialized
empty rather than reusing a stale in-progress occurrence. The final profile store
always has `activeProfiles: []`.

The imported controllers are ready for a later manual profile activation, but
cannot act while their schedules and profiles are inactive. Restore never calls
a climate, light, fan, cover, valve, lock, switch target, input_boolean,
humidifier or water_heater service. If a step fails, WSC attempts to roll back
every schedule, automation and helper created by that attempt.

## Orphan cleanup

Cleanup protects all schedules, controller IDs and helpers referenced by current
profiles or Quick Timers. A deletion candidate must also carry a WSC marker,
namespace and/or generated description that establishes ownership. Automation
references must point only to missing schedules or schedules in the same deletion
plan. Objects with missing references, changed configuration, an unrecognized
description or any other ambiguity are listed but preserved.

Before deletion, every automation, schedule and helper is read again and compared
with the preview. Cleanup stops generated automations before removing them and
never invokes target-device, restore or end-of-slot actions. It is idempotent: if
an interruption leaves some candidates behind, reopen the preview and run it
again.

## Full reset

Full reset requires downloading its inventory report, checking the acknowledgement
and typing the exact, case-sensitive word `RESET`. The report helps audit what was
selected but is not the portable backup described above. Reset has its own
persisted retry plan so a browser or Home Assistant interruption cannot silently
resume ordinary card writes over a partial deletion.
