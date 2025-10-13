# Devendra Hamal - Portfolio Website

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS, showcasing software development projects and skills.

## 🚀 Features

- **Modern Design**: Clean, professional design with dark theme and subtle animations
- **Responsive**: Fully responsive design that works on all devices
- **SEO Optimized**: Comprehensive SEO optimization targeting "best software developer in Nepal"
- **JSON-Based Projects**: Dynamic project loading from JSON configuration
- **GitHub Integration**: Ready for GitHub API integration for live repository data
- **Performance**: Optimized for speed with Next.js 15 and React 19
- **Accessibility**: Built with accessibility best practices

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.14
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: shadcn/ui
- **Deployment**: Vercel (ready)

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout with SEO metadata
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── hero-section.tsx   # Landing section with intro
│   ├── about-section.tsx  # About and skills section
│   ├── projects-section.tsx # Portfolio projects showcase
│   ├── tech-stack-section.tsx # Technology stack display
│   ├── contact-section.tsx # Contact information and form
│   └── ui/               # Reusable UI components (shadcn/ui)
├── data/                 # Project data and configuration
│   └── projects.json     # Project portfolio data
├── lib/                  # Utility functions
│   ├── utils.ts          # General utilities and environment helpers
│   └── github.ts         # GitHub API integration utilities
├── public/               # Static assets
│   ├── *.webp           # Project images
│   ├── robots.txt       # SEO robots configuration
│   ├── sitemap.xml      # Site structure for search engines
│   └── manifest.json    # PWA manifest
└── styles/              # Additional styling
    └── globals.css      # Legacy global styles
```

## 🎨 Projects System

### JSON Configuration

Projects are now managed through `data/projects.json`, making it easy to add, edit, or remove projects without touching the code. Each project includes:

- **Basic Info**: Title, description, dates, status
- **Technical Details**: Technologies used, GitHub links, demo URLs
- **Categorization**: Category tags for filtering
- **Highlights**: Key features and achievements
- **SEO Data**: Structured information for search engines

### Dynamic Loading

The projects section supports:
- Category-based filtering
- Featured project highlighting
- Responsive grid layout with hover effects
- GitHub integration ready

### GitHub Integration

The `lib/github.ts` utility provides functions to:
- Fetch repositories from GitHub API
- Process repository data into project format
- Extract technologies and topics
- Generate project categories automatically

## 🌐 SEO Optimization

Comprehensive SEO targeting the Nepal software development market:

- **Meta Tags**: 100+ relevant keywords and descriptions
- **Structured Data**: JSON-LD schema for Person, Organization, and Service
- **Technical SEO**: Robots.txt, sitemap.xml, canonical URLs
- **Local SEO**: Nepal-focused content and geographic targeting
- **Performance**: Optimized Core Web Vitals

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Devendra000/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```env
   NEXT_PUBLIC_URL=https://devendrahamal.com.np
   NEXT_PUBLIC_GITHUB_URL=https://github.com/Devendra000
   NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/in/devendra-hamal
   NEXT_PUBLIC_EMAIL=contact@devendrahamal.com.np
   GITHUB_TOKEN=your_github_token_for_api_access
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Build for production**
   ```bash
   pnpm build
   ```

## 📝 Adding New Projects

### Method 1: JSON Configuration (Recommended)

Edit `data/projects.json` and add your project:

```json
{
  "id": 7,
  "title": "Your New Project",
  "description": "Brief description of your project",
  "longDescription": "Detailed description with more context",
  "tech": ["React", "Node.js", "MongoDB"],
  "image": "your-project.webp",
  "github": "https://github.com/Devendra000/your-project",
  "demo": "https://your-project-demo.com",
  "featured": true,
  "status": "completed",
  "startDate": "2024-01-01",
  "endDate": "2024-03-01",
  "category": "Full Stack",
  "highlights": [
    "Key feature 1",
    "Key feature 2",
    "Key feature 3"
  ]
}
```

### Method 2: GitHub API Integration

Modify the projects section to use the GitHub utility:

```typescript
import { loadGitHubProjects } from '@/lib/github'

// In your component
useEffect(() => {
  loadGitHubProjects('Devendra000').then(({ projects }) => {
    setProjects(projects)
  })
}, [])
```

## 🎯 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Other Platforms

The project is compatible with:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway
- Render

## 🔧 Customization

### Colors and Theme

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --primary: your-primary-color;
  --primary-foreground: your-text-color;
  /* ... other variables */
}
```

### Content

- **Personal Info**: Update `components/hero-section.tsx` and `components/about-section.tsx`
- **Contact Details**: Modify `components/contact-section.tsx`
- **Projects**: Use `data/projects.json` or GitHub integration
- **Skills**: Update `components/tech-stack-section.tsx`

## 📊 Performance

- **Lighthouse Score**: 95+ in all categories
- **Core Web Vitals**: Optimized for performance
- **Bundle Size**: Minimized with tree shaking
- **Images**: Optimized with Next.js Image component

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

- **Email**: contact@devendrahamal.com.np
- **LinkedIn**: [Devendra Hamal](https://linkedin.com/in/devendra-hamal)
- **GitHub**: [Devendra000](https://github.com/Devendra000)
- **Website**: [devendrahamal.com.np](https://devendrahamal.com.np)

---

**Devendra Hamal** - *Top Software Developer in Nepal* 🇳🇵