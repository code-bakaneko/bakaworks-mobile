-- Atomic gold award. `gold = gold + n` must happen in one statement: a
-- read-then-write from the app would lose increments if two lessons finish
-- at once.
--
-- SECURITY DEFINER is required because profiles has no update policy by
-- design (a user who could write their own balance could mint currency).
-- EXECUTE is revoked from anon and authenticated, so this is reachable only
-- with the secret key from a server action — never from the browser.

create function public.award_gold(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'award amount must be positive';
  end if;

  update public.profiles
  set gold = gold + p_amount
  where id = p_user_id
  returning gold into new_balance;

  return new_balance;
end;
$$;

revoke execute on function public.award_gold(uuid, integer) from public, anon, authenticated;

-- Same hardening for the signup trigger function, which the security advisor
-- flagged as callable over the REST API by anon. It only ever runs as a
-- trigger, so nobody needs EXECUTE on it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
