# Munch Club Deployment Guide

## Option 1: Vercel (Recommended)

Vercel is the easiest deployment platform for Next.js applications with minimal configuration required.

### Steps:

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Visit [Vercel](https://vercel.com/) and sign up/login
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure environment variables:
   - Add all your Firebase environment variables from `.env.local`
   - Make sure to add `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
6. Click "Deploy"
7. Vercel will automatically build and deploy your application

### Benefits:

- Built by the creators of Next.js
- Automatic HTTPS
- Preview deployments for PRs
- Free tier available
- Seamless integration with Next.js features

## Option 2: Firebase Hosting

Since you're already using Firebase for authentication and database, Firebase Hosting is a natural choice.

### Steps:

1. Install Firebase CLI globally:

   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```
   firebase login
   ```

3. Initialize Firebase in your project:

   ```
   firebase init
   ```

   - Select "Hosting"
   - Select your Firebase project
   - Specify "out" as your public directory
   - Configure as a single-page app: "Yes"

4. Add build and export commands to `package.json`:

   ```json
   "scripts": {
     "build": "next build",
     "export": "next export",
     "deploy": "npm run build && npm run export && firebase deploy --only hosting"
   }
   ```

5. Update your `next.config.mjs` to support static export:

   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: "export",
   };

   export default nextConfig;
   ```

6. Deploy to Firebase:
   ```
   npm run deploy
   ```

## Option 3: Netlify

Netlify offers a user-friendly deployment experience similar to Vercel.

### Steps:

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Visit [Netlify](https://netlify.com/) and sign up/login
3. Click "New site from Git"
4. Connect to your repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add all your Firebase environment variables
7. Click "Deploy site"

## Custom Domain Setup

After deploying with any of the options above:

1. Purchase a domain from Namecheap, GoDaddy, or similar provider
2. In your deployment platform (Vercel/Firebase/Netlify), navigate to the domains section
3. Add your custom domain
4. Follow the provided instructions to update DNS settings at your domain registrar
5. Wait for DNS propagation (up to 48 hours)

Your Munch Club application should now be live at your custom domain!
