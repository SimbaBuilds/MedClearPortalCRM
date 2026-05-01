-- Single-row app_settings table for tunable global config.
-- Currently stores the follow-up cadence used by the next_followup trigger.

create table app_settings (
  id boolean primary key default true check (id = true), -- enforces single row
  followup_business_days int not null default 7 check (followup_business_days between 1 and 60),
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (true);

-- Updated trigger: read cadence from app_settings instead of hardcoded 7.
create or replace function update_next_followup_from_outreach()
returns trigger language plpgsql as $$
declare
  days int;
begin
  if NEW.status in ('scheduled', 'cancelled') then
    return NEW;
  end if;

  select followup_business_days into days from app_settings where id = true;
  days := coalesce(days, 7);

  update leads
  set next_followup_at = add_business_days(coalesce(NEW.sent_at, NEW.created_at), days)
  where id = NEW.lead_id
    and coalesce(next_followup_manual_override, false) = false;
  return NEW;
end;
$$;
