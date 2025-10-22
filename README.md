# OldBoi Banner - Subscriber Counter

A real-time subscriber counter that aggregates supporters from multiple platforms: Twitch, Patreon, Monobank, and YouTube. The application continuously fetches subscriber counts and generates an HTML widget that can be embedded in OBS or other streaming software.

## Features

- Aggregates subscriber counts from:
  - Twitch subscribers
  - Patreon active patrons
  - Monobank subscribers
  - YouTube channel sponsors (multiple channels)
- Generates `widget.html` for OBS browser source integration
- Terminal logging with detailed progress information

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn package manager

## Installation (Windows)

### 1. Download the Project

Download the ZIP file from GitHub:
1. Navigate to the repository page
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to your desired location (e.g., `C:\Users\YourName\oldboi_banner`)

### 2. Open Terminal and Navigate to Project Directory

Open Command Prompt or PowerShell and navigate to the extracted folder:

```cmd
cd C:\Users\YourName\oldboi_banner
```

### 3. Install Dependencies

Run the following command to install all required packages:

```cmd
npm install
```

This will install all dependencies and automatically install Playwright browsers needed for YouTube login.

## Configuration

### Required Tokens

Create a `.env` file in the project root directory with the following tokens:

```env
# Twitch Configuration
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_ACCESS_TOKEN=your_twitch_access_token
TWITCH_BROADCASTER_ID=your_twitch_broadcaster_id

# Patreon Configuration
PATREON_TOKEN=your_patreon_access_token
PATREON_CAMPAIGN_ID=your_patreon_campaign_id
```

### How to Obtain Tokens

#### Twitch Tokens
1. **Client ID & Access Token:**
   - Go to https://dev.twitch.tv/console
   - Register a new application
   - Copy the Client ID
   - Generate an OAuth token with the `channel:read:subscriptions` scope

2. **Broadcaster ID:**
   - Use the Twitch API or online tools to find your channel's broadcaster ID
   - Or use: `https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/`

#### Patreon Token
1. Go to https://www.patreon.com/portal/registration/register-clients
2. Create a new client
3. Generate an access token with the `campaigns` and `campaigns.members` scopes
4. Find your campaign ID in your Patreon dashboard URL

### Example .env File

```env
TWITCH_CLIENT_ID=abc123def456ghi789
TWITCH_ACCESS_TOKEN=jkl012mno345pqr678
TWITCH_BROADCASTER_ID=123456789
PATREON_TOKEN=stu901vwx234yz567
PATREON_CAMPAIGN_ID=8901234
```

## Running the Application

### Start the Application

From the project directory, run:

```cmd
npm start
```

### Important: Watch the Terminal During Startup

**CRITICAL:** Keep an eye on the terminal output throughout the startup process. The application will display important messages and instructions.

### YouTube Login Flow

When starting the application for the first time, you will need to log in to YouTube accounts manually:

1. **Browser Window Opens Automatically**
   - A Microsoft Edge browser window will open automatically for each YouTube channel
   - **Check the terminal** to see which account you need to log in to (e.g., "Launching browser for account: oldboi")

2. **Log In to the Correct Account**
   - The terminal will tell you which account to use
   - Navigate to YouTube and sign in with the appropriate Google account
   - Once logged in, navigate to YouTube Studio (https://studio.youtube.com)

3. **Wait for Confirmation**
   - The terminal will display: "Waiting for studio.youtube.com (timeout: 10 minutes)..."
   - Once you access YouTube Studio, the terminal will show: "Studio page detected! Saving storage state..."
   - The browser will close automatically after saving your session

4. **Repeat for Each Channel**
   - If you have multiple YouTube channels configured, the process will repeat
   - **Watch the terminal** to see which account to log in to next

5. **Session Saved**
   - Your login session is saved to `*_state.json` files
   - You won't need to log in again unless these files are deleted or the session expires

### During Operation

Once fully initialized, the application will:
- Fetch subscriber counts every 60 seconds
- Display detailed logs in the terminal for each platform
- Show total subscriber count
- Update `widget.html` automatically with the latest count

Example terminal output:
```
============================================================
Fetching at 22.10.2025, 14:30:45
============================================================
Twitch subs: 150 (234ms)
Patreon patrons: 75 (567ms)
Monobank patrons: 32 (123ms)
YouTube oldplay sponsors: 48 (1234ms)
YouTube oldboi sponsors: 92 (1456ms)
============================================================
Total subscribers: 397
Total iteration time: 1789ms
============================================================
Widget updated: widget.html (counter: 397)
```

## Using the Widget in OBS

1. In OBS Studio, add a new "Browser Source"
2. Check "Local file" and browse to `widget.html` in your project directory
3. Set width and height as desired
4. The counter will update automatically every minute

## Notes

- The application runs continuously and must be kept running for the widget to update
- Internet connection is required
- API rate limits may apply depending on your platform subscription level
- **Always monitor the terminal** for errors, warnings, and important instructions

## Project Structure

- `index.ts` - Main application entry point
- `config.ts` - Environment variable configuration
- `twitch.ts` - Twitch subscriber fetching
- `patreon.ts` - Patreon patron fetching
- `monobank.ts` - Monobank subscriber fetching
- `youtube.ts` - YouTube sponsor fetching with authentication
- `logger.ts` - Logging utility
- `widget.template` - HTML template for the counter widget
- `widget.html` - Generated HTML widget (created automatically)
