-- Add next_followup_at column to leads.
-- Auto-set to 7 business days after the most recent outreach_log entry,
-- unless next_followup_manual_override = true (manual override).

alter table leads
  add column next_followup_at timestamptz,
  add column next_followup_manual_override boolean not null default false;

create index idx_leads_next_followup on leads(next_followup_at) where next_followup_at is not null;

-- Add N business days (Mon–Fri) to a timestamp.
create or replace function add_business_days(start_ts timestamptz, n int)
returns timestamptz language plpgsql immutable as $$
declare
  result timestamptz := start_ts;
  added int := 0;
begin
  while added < n loop
    result := result + interval '1 day';
    if extract(dow from result) not in (0, 6) then
      added := added + 1;
    end if;
  end loop;
  return result;
end;
$$;

-- Trigger: when a new outreach_log row is inserted, bump the lead's
-- next_followup_at to 7 business days out, unless override is set.
create or replace function update_next_followup_from_outreach()
returns trigger language plpgsql as $$
begin
  -- Skip rows that aren't real outreach yet (scheduled future sends, cancellations).
  if NEW.status in ('scheduled', 'cancelled') then
    return NEW;
  end if;

  update leads
  set next_followup_at = add_business_days(coalesce(NEW.sent_at, NEW.created_at), 7)
  where id = NEW.lead_id
    and coalesce(next_followup_manual_override, false) = false;
  return NEW;
end;
$$;

drop trigger if exists trg_update_next_followup on outreach_log;
create trigger trg_update_next_followup
after insert on outreach_log
for each row
execute function update_next_followup_from_outreach();

-- Backfill: for every lead that has at least one outreach_log entry,
-- set next_followup_at based on the most recent log's timestamp.
update leads l
set next_followup_at = add_business_days(latest.ts, 7)
from (
  select lead_id, max(coalesce(sent_at, created_at)) as ts
  from outreach_log
  where status not in ('scheduled', 'cancelled')
  group by lead_id
) latest
where l.id = latest.lead_id
  and l.next_followup_manual_override = false;
