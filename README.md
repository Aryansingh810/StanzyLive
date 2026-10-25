# StanzyLive

StanzyLive is a cross-platform property discovery and listing app built with Expo and React Native. It helps signed-in members browse homes for sale or rent, search and filter listings, save properties, and contact the administrator. Administrators can also add and manage listings.

## Features

- Browse featured and recommended property listings.
- Switch between all listings, properties for sale, and properties for rent.
- Search listings by title or city; filter by property type, bedrooms, and price range.
- View property details, including price, location, room counts, area, and categorized photos.
- Open listing photos in an image viewer and view a map when valid coordinates are available.
- Save properties and return to them from the Saved screen.
- Contact the administrator by phone or WhatsApp, including from a property listing.
- View sold listings and manage profile information, including a profile photo.
- Sign in and create an account with Clerk.
- Use role-specific navigation and listing controls for members and administrators.

## Roles and permissions

| Capability | Member | Administrator |
| --- | :---: | :---: |
| Browse, search, and filter listings | Yes | Yes |
| View listing details and contact the administrator | Yes | Yes |
| Save and view saved properties | Yes | Yes |
| View sold properties and manage own profile | Yes | Yes |
| Add a property listing | — | Yes |
| Mark a property as sold | — | Yes |
| Delete a property listing | — | Yes |

The app reads the `is_admin` value from the user's Supabase profile to determine administrator-specific navigation and controls. Hiding controls in the app is not a security boundary: configure Supabase Row Level Security (RLS) policies and storage policies to enforce access on the backend.

## How it works

1. A user creates an account or signs in.
2. The Home screen presents available featured and recommended listings.
3. The user browses, searches, or applies filters to find properties.
4. Opening a listing shows its details, photos, and available location information. The user can save the listing or contact the administrator.
5. Administrators can use the Add Property screen to create listings and can mark or delete listings from the property detail view.

## Technology

- **App:** Expo SDK 54, React Native, TypeScript, and Expo Router
- **Authentication:** Clerk for Expo
- **Data and file storage:** Supabase
- **Client state:** Zustand
- **Styling:** NativeWind and Tailwind CSS
- **Platform configuration:** Android, iOS, and web targets are configured in the Expo project

## Getting started

### Prerequisites

- Node.js and npm
- A Clerk project and a Supabase project configured for this app
- For native Android or iOS runs, the relevant platform development tools and a device or emulator

### Install

```bash
git clone <your-repository-url>
cd StanzyLive
npm install
```

### Configure environment variables

Create a `.env` file in the project root and provide values for the following variables:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_or_publishable_key
EXPO_PUBLIC_ADMIN_PHONE=your_admin_phone_number
```

Use the appropriate values from your own Clerk and Supabase projects. `EXPO_PUBLIC_ADMIN_PHONE` should be the administrator's phone number in international format; the app removes non-digit characters when constructing contact links.

> **Important:** Variables prefixed with `EXPO_PUBLIC_` are included in the client app and are not secret. Never put a Supabase service-role key or other privileged credential in the app or commit credentials to Git. Protect data with appropriately configured Supabase RLS and Storage policies.

### Backend configuration

The application code expects Supabase tables named `users`, `properties`, and `saved_properties`, and a Storage bucket named `property-images`. The app reads and writes user profile fields, property listings, and saved-property relationships, and uploads listing and profile images to the bucket.

Configure your Supabase schema, authentication integration, and access policies to match the fields and operations used by the app. Database migrations or schema setup instructions are not included in this repository.

### Run the app

```bash
npm run start
```

Use the Expo CLI prompts to select a target. The following project scripts are also available:

```bash
npm run android  # Run the native Android app
npm run ios      # Run the native iOS app
npm run web      # Start the web app
npm run lint     # Run Expo lint checks
```

The Android and iOS scripts use `expo run` and may require native tooling and a development build.

## Project structure

```text
app/          Expo Router routes, screens, and layouts
components/   Shared interface components
hooks/        Authentication, Supabase, and saved-property hooks
lib/          Supabase setup and shared utilities
store/        Zustand stores for user and search-filter state
types/        Shared TypeScript types
assets/       App images and other static assets
```

## Scalability and future development

The app separates screens, reusable components, hooks, backend access, and client-side state, which provides a foundation for extending the user experience. Supabase centralizes listing and profile data, while Expo and React Native provide configured targets for mobile and web.

For larger datasets or production use, consider adding database migrations, pagination for listing queries, indexes for commonly filtered fields, monitoring, automated tests, and verified RLS and Storage policies. These are deployment and backend improvements to plan and validate; this README does not imply they are already implemented.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and follow the existing project conventions.
3. Run `npm run lint` before opening a pull request.
4. Describe the change and include screenshots for visible UI updates where useful.
