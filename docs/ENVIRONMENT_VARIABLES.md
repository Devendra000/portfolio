# Environment Variables Configuration

This portfolio uses environment variables to make URLs and configuration dynamic and easily customizable for different deployment environments.

## Required Environment Variables

### NEXT_PUBLIC_URL
- **Purpose**: Base URL for the application, used for constructing asset URLs
- **Development**: `http://localhost:3000`
- **Production**: Your deployed domain (e.g., `https://your-portfolio.vercel.app`)

## Optional Environment Variables

### Social Media URLs
These variables allow you to customize your social media links without hardcoding them:

- `NEXT_PUBLIC_GITHUB_URL` - Your GitHub profile URL
- `NEXT_PUBLIC_LINKEDIN_URL` - Your LinkedIn profile URL  
- `NEXT_PUBLIC_EMAIL` - Your contact email address

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values:
   ```env
   NEXT_PUBLIC_URL=https://your-portfolio.com
   NEXT_PUBLIC_GITHUB_URL=https://github.com/yourusername
   NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/in/your-profile
   NEXT_PUBLIC_EMAIL=your.email@example.com
   ```

3. **Restart your development server** to load the new environment variables

## How It Works

### Asset URLs
Images and other assets are now dynamically constructed using the `getAssetUrl()` function:

```tsx
// Before: hardcoded path
<img src="/my-image.png" />

// After: dynamic URL
<img src={getAssetUrl("my-image.png")} />
```

### Social Links
Social media URLs are retrieved using the `getSocialUrls()` function with fallbacks:

```tsx
const socialUrls = getSocialUrls()
// Uses environment variables or falls back to defaults
<a href={socialUrls.github}>GitHub</a>
```

## Deployment

When deploying to platforms like Vercel, Netlify, or other hosting services:

1. Set the `NEXT_PUBLIC_URL` to your production domain
2. Optionally set other social media variables
3. The application will automatically use these values

## Benefits

- **Environment-specific configuration**: Different URLs for development/production
- **Easy deployment**: No need to modify code for different environments
- **Maintainability**: Centralized configuration management
- **Security**: Sensitive information can be kept in environment variables
- **Flexibility**: Easy to update URLs without code changes