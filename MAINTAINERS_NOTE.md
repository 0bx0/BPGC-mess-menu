# Maintainer's Note: How to Push Updates Properly

To ensure that users receive the latest version of the application (including changes to `index.html`, `style.css`, `script.js`, or `mess.csv`), you **MUST** update the service worker cache version.

## Steps to Update:

1.  **Make your changes** to the code or data files.
2.  **Open `service-worker.js`**.
3.  **Locate the `CACHE_NAME` constant** at the top of the file.
    ```javascript
    const CACHE_NAME = 'mess-menu-v11';
    ```
4.  **Increment the version number**. For example, change `v11` to `v12`.
    ```javascript
    const CACHE_NAME = 'mess-menu-v12';
    ```
5.  **Commit and Push** your changes to GitHub.

## Why is this necessary?

The application uses a Service Worker to cache files for offline access. The browser will only install a new service worker (and thus fetch new files) if the `service-worker.js` file itself has changed by at least one byte. Changing the version string ensures this happens and invalidates the old cache, prompting the "New update available" notification for users.
