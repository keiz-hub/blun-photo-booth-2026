# BLUNians Photo Booth

A responsive step-by-step web photo booth for Bonifacio Luz Natividad Educational Foundation, Inc.

## Flow

1. Landing Page: WELCOME BLUNIANS!
2. Pick a Template with live preview
3. Choose capture mode and capture photos
4. Add date/time or custom text watermark, download, and share

## Updates in v6

- Fixed required photo count per template:
  - Campus Solo = 1 photo
  - Campus Duo = 2 photos
  - Retro Film = 3 photos
  - Classic templates = 4 photos
- Extra thumbnail slots are hidden when not needed.
- Added Manual Capture and Timer Capture mode.
- Simplified watermarking to one default style for date/time and custom text only.

## BLUN Drive Upload Button

The successful download modal includes an "Upload to BLUN Drive" button.

To make it work, open `script.js` and replace:

`PASTE_YOUR_GOOGLE_DRIVE_OR_GOOGLE_FORM_UPLOAD_LINK_HERE`

with your actual public Google Drive folder link or, preferably, a Google Form with file upload enabled.

Note: A static website cannot automatically upload a user's downloaded image directly to Google Drive without a backend service, Google Apps Script, or Google API authentication. The current button safely opens your upload link and shows the consent message.


## Updates in v7

- Header title/logo is no longer clickable.
- Capture preview is hidden while taking photos.
- After the required photos are completed, a preview appears with Retake and Next buttons.

## Updates in v8

- Removed unnecessary download-page customization:
  - Background
  - Border
  - Text Color
  - Strip Label
- Capture preview is now a centered modal for better accessibility.
- Timer capture now continues automatically until all required photos for the selected template are captured.


## Updates in v9

- Removed the 404-style expiry page and date-based access restriction.
- The site is now accessible normally until you manually add an event-ended page later.
