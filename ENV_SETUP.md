# Frontend Environment Variables

Create a `.env` file in the `rooms-front` directory with the following variables:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

**Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the frontend.

The frontend no longer needs Supabase credentials - all database operations are handled by the backend API.

