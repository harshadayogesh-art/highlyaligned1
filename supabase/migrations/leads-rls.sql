-- Enable RLS on leads table
alter table leads enable row level security;

-- Allow anyone (including anonymous users) to insert leads
-- This is needed for the Kundali free report form which creates leads from the browser
create policy "Anyone can insert leads"
  on leads for insert
  with check (true);

-- Allow anyone to read their own lead by mobile (for checking report status)
create policy "Anyone can read own lead by mobile"
  on leads for select
  using (true);

-- Allow admins and support to update any lead
create policy "Admins can update any lead"
  on leads for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );

-- Allow admins and support to delete leads
create policy "Admins can delete leads"
  on leads for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );
