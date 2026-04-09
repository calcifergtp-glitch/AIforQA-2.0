# AI for Pharmaceutical QA

Educational content on integrating AI with pharmaceutical quality assurance and regulatory compliance (21 CFR Part 11, GxP, GMP).

## Repository Structure

```
AIforQA-2.0/
├── index.html              — Homepage
├── admin.html              — Admin dashboard (article upload)
├── pages/
│   ├── about.html
│   ├── best-of.html        — All articles listing page
│   ├── privacy-policy.html
│   ├── disclaimer.html
│   ├── terms-and-conditions.html
│   ├── cookie-policy.html
│   └── affiliate-disclosure.html
├── articles/               — Standalone article HTML pages
│   └── {slug}.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── script.js       — Site-wide helpers (toast notifications)
│   │   ├── load-articles.js — Article listing + homepage widget
│   │   └── github-api.js   — GitHub API integration (for admin)
│   ├── bg.svg
│   └── border.svg
├── data/
│   └── posts.json          — Article metadata manifest
└── .github/
    └── workflows/
        └── deploy.yml      — Auto-deploy to GitHub Pages on push to main
```

## Admin Dashboard

Visit `/admin.html` to publish new articles. You will need a GitHub Personal Access Token with `repo` and `workflow` scopes.

- Create a token at: GitHub → Settings → Developer settings → Personal access tokens
- Only the repository owner (`calcifergtp-glitch`) can publish articles.
- Articles are committed directly to the `articles/` directory via the GitHub API.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via the GitHub Actions workflow (`.github/workflows/deploy.yml`).

## License

See [LICENSE](LICENSE) in the repository.
