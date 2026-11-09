-- =============================================================================
-- Promote an existing Better Auth user to Studio Administrator
-- Step 1: Register an account via /sign-up on your site.
-- Step 2: Run the SQL below in your Neon SQL Editor (replace the email).
-- =============================================================================

update "user"
set role = 'admin',
    is_active = true,
    "updatedAt" = now()
where lower(email) = lower('admin@wurainteriors.com');
