# causeim.github.io

Personal site of **Jaeho Noh** — robotics research on a Coaxial Spherical Parallel Mechanism for life-sized robots.

Live at **https://causeim.github.io**.

## Structure

```
.
├── index.html          # Home / About
├── projects.html       # Coaxial SPM project page
├── publications.html   # Papers
└── assets/
    ├── css/style.css
    ├── js/main.js
    └── images/         # CAD renders, plots, photos
```

Plain static HTML/CSS/JS — no build step. Just open `index.html` in a browser to preview locally, or push to GitHub and let GitHub Pages serve it.

## Updating

- Add a new paper → edit `publications.html`, copy an existing `<article class="card pub">` block.
- Update the project → edit `projects.html`.
- Replace a photo → drop a new file at `assets/images/<name>.jpg` with the same filename.

## License

Content © Jaeho Noh. Site code is plain HTML/CSS — feel free to borrow the layout if you find it useful.
