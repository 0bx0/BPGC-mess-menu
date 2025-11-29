# BPGC Mess Menu

A Progressive Web App (PWA) to view the mess menu for BITS Pilani Goa Campus (BPGC).

## Features

- **Daily Menu Display**: Automatically shows the current day's menu.
- **Navigation**: Easily browse menus for previous and next days.
- **Offline Access**: Works offline thanks to PWA capabilities.
- **Auto-Updates**: Automatically checks for and applies updates.
- **Installable**: Can be installed as a native-like app on your device.

## Usage

1. Open the [web app](https://messmenu.bpgc.in)
2. The current day's menu will be displayed.
3. Use the arrow buttons to navigate between days.
4. Click "Update" if a notification appears for a new version.

## Development

### Prerequisites

- Python 3.x (for deployment script)
- A local web server (e.g., Live Server) for testing PWA features.

### Project Structure

- `index.html`: Main entry point.
- `style.css`: Styling for the application.
- `script.js`: Core logic for fetching and displaying the menu.
- `mess.csv`: Data source for the menu.
- `service-worker.js`: Handles caching and offline functionality.
- `deploy.py`: Automation script for deploying updates (ignored by git).

### Deployment

This project uses a custom `deploy.py` script to handle version bumping and git operations.

> **Note for Maintainers**: Please refer to `MAINTAINER_GUIDE.txt` (local only) for detailed deployment instructions.

## Credits

Developed with absolutely no love by Debraj Ghosh.
