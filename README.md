# Screenshot Automation for hijri-dates.pages.dev

This project automates the process of capturing, optimizing, and versioning screenshots of the [hijri-dates.pages.dev](https://hijri-dates.pages.dev/) website using GitHub Actions, Puppeteer, and Sharp. It is designed to periodically take screenshots of specific UI elements, optimize them for size and quality, and maintain a history of these images in the repository.

## Features

- **Automated Screenshot Capture:**
  - Uses Puppeteer to open the target website and capture a screenshot of the combined area of the year, month, and calendar UI elements.
  - Screenshots are taken at a fixed viewport size and device scale for consistency.

- **Image Optimization:**
  - Uses Sharp to resize screenshots to 360x376 pixels and compress them to keep file size under 70KB (with adjustable quality).
  - Ensures screenshots are web-friendly and storage-efficient.

- **Versioned and Latest Screenshots:**
  - Each screenshot is saved with a timestamped filename (e.g., `calendar-2025-05-09T01-17-43-616Z.jpg`).
  - The most recent screenshot is also saved as `latest.jpg` for easy reference.

- **Automated GitHub Workflow:**
  - Scheduled to run every 10 hours, at midnight, and at noon UTC, as well as on manual trigger.
  - Commits and pushes new screenshots to the repository if there are changes.

- **Production Deployment (Optional):**
  - Includes a separate workflow for deploying tagged releases to a remote server via SSH (see `deploy.yml`).

## Repository Structure

```
.github/
  workflows/
    screenshot.yml      # GitHub Actions workflow for screenshot automation
    deploy.yml          # (Optional) Workflow for production deployment
  scripts/
    screenshot.js       # Node.js script for capturing and optimizing screenshots
screenshots/
  calendar-<timestamp>.jpg  # Timestamped screenshots
  latest.jpg                # Most recent screenshot
logo.png                    # (Optional) Project logo
```

## How It Works

### 1. Scheduled Workflow
- The workflow defined in `.github/workflows/screenshot.yml` runs on a schedule (every 10 hours, at 00:00 and 12:00 UTC) or can be triggered manually.
- It checks out the `screenshots` branch, sets up Node.js, installs dependencies (`puppeteer` and `sharp`), and runs the screenshot script.
- If new screenshots are generated, it commits and pushes them to the repository.

### 2. Screenshot Script
- The script (`.github/scripts/screenshot.js`) launches a headless Chromium browser using Puppeteer.
- It navigates to the target website and waits for the page to load.
- It selects the `.year-row`, `.month-row`, and `.calendar` elements, calculates their combined bounding box, and captures a screenshot of that area.
- The screenshot is resized to 360x376 pixels and compressed to keep the file size under 70KB.
- The script saves the screenshot with a timestamp and updates `latest.jpg`.

### 3. Image Optimization
- The script uses Sharp to resize and compress the image, reducing quality incrementally if needed to stay under the size limit.

### 4. Version Control
- The workflow adds and commits any new or updated screenshots to the repository, ensuring a versioned history.

### 5. Deployment (Optional)
- The `deploy.yml` workflow can deploy tagged releases to a remote server using SSH and a deployment script. This is intended for production environments and is triggered by tags matching `prod-v*`.

## Requirements

- Node.js 18 (managed by the workflow)
- GitHub Actions runners (no local setup required for automation)
- For local development or testing:
  - Install dependencies: `npm install puppeteer sharp`

## Customization

- **Target Website:**
  - Change the URL in `.github/scripts/screenshot.js` if you want to capture a different site. (Currently set to [https://hijri-dates.pages.dev/](https://hijri-dates.pages.dev/))
- **Screenshot Area:**
  - Adjust the selectors or bounding box logic in the script to capture different elements.
- **Image Size/Quality:**
  - Modify the `resize` and `quality` parameters in the script to suit your needs.
- **Workflow Schedule:**
  - Edit the `cron` expressions in `.github/workflows/screenshot.yml` to change the capture frequency.

## Troubleshooting

- **Missing Elements:**
  - If the script fails with "Required elements not found", check that the selectors in the script match the current website structure.
- **Large Images:**
  - If images exceed the size limit, the script will reduce quality until the target is met or a minimum quality threshold is reached.
- **Workflow Failures:**
  - Check the Actions tab in GitHub for logs and error messages.

## License

This project is provided as-is for automation and archival purposes. Please review the website's terms of service before automating screenshot capture.

---

**Maintainer:** @mjj
