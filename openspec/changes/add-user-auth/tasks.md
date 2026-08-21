## 1. Supabase project setup

- [x] 1.1 Create a Supabase project and note its project URL and anon key; verify by successfully loading the project's API settings page
- [x] 1.2 Add `@supabase/supabase-js`, `expo-secure-store`, and `react-native-url-polyfill` to `package.json` and verify `npm install` completes without errors
- [x] 1.3 Store the Supabase URL and anon key as Expo public env vars (e.g. `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and verify they are readable via `process.env` in a debug log at app startup

## 2. Supabase client and session storage

- [x] 2.1 Implement a Supabase client module using `expo-secure-store` as the `auth.storage` adapter (per design.md), with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`; verify by importing the client with no runtime errors
- [x] 2.2 Create the `profiles` table in Supabase (id, email, display_name) and a Row Level Security policy restricting each row to its own user; verify by attempting to read another user's row from the SQL editor and confirming it is denied

## 3. Auth state provider

- [x] 3.1 Implement an auth context/provider at the app root that subscribes to `supabase.auth.onAuthStateChange` and exposes `{ user, session, isLoading }`; verify by logging state transitions during a manual login/logout
- [x] 3.2 On successful registration, insert a corresponding row into `profiles` with the chosen display name; verify by checking the `profiles` table after registering a test account

## 4. Registration

- [x] 4.1 Build the registration screen (email, password, display name) and wire it to `supabase.auth.signUp`; verify the "Successful registration" scenario from specs/user-auth/spec.md ends in an authenticated session
- [x] 4.2 Surface duplicate-email, weak-password, and invalid-email-format errors from Supabase as user-facing messages; verify each of the three rejection scenarios in specs/user-auth/spec.md produces the expected message without creating an account

## 5. Login

- [x] 5.1 Build the login screen (email, password) and wire it to `supabase.auth.signInWithPassword`; verify the "Successful login" scenario authenticates and navigates past the login screen
- [x] 5.2 Surface a generic invalid-credentials error without revealing whether the email exists; verify the "Invalid credentials rejected" scenario shows only the generic message

## 6. Session persistence and logout

- [x] 6.1 Verify the "Session survives app restart" scenario manually: log in, force-quit the app, relaunch, and confirm the session is restored without a login prompt
- [x] 6.2 Add a logout action calling `supabase.auth.signOut` and clearing local auth state; verify the "Successful logout" scenario ends the session and returns the user to the login screen

## 7. Route gating

- [x] 7.1 Add a root layout redirect in `expo-router`: unauthenticated users are redirected to login, authenticated users are redirected away from login/register; verify by attempting to reach a protected route while logged out and while logged in
