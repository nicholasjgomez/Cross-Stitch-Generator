# Cross-Stitch Pattern Generator

This AI-powered web application instantly transforms any image into a simple, beautiful silhouette cross-stitch pattern, ready for you to stitch. Upload an image, customize the pattern, and download the final result as a PDF with AI-generated instructions or as a scalable vector graphic (SVG).

*Note: A real screenshot should be added here after deployment.*

## ✨ Features

-   **Instant AI Conversion**: Upload any photo, and the AI will generate a clean silhouette pattern in seconds.
-   **Full Customization**: Adjust stitch count, silhouette detail, fill shapes (circle/square), outline thickness, and thread colors.
-   **PDF & SVG Export**: Download your pattern as a high-quality PDF, complete with AI-generated stitching instructions, or as an SVG for further editing.
-   **Save Your Work**: Keep your favorite patterns safe in your personal gallery (using browser local storage) to access them anytime.
-   **Responsive Design**: Works beautifully on both desktop and mobile devices.

## 🛠️ Tech Stack

-   **Framework**: React (with Vite)
-   **Language**: TypeScript
-   **AI**: Google Gemini API (`gemini-2.5-flash`)
-   **Styling**: Tailwind CSS
-   **PDF Generation**: jsPDF

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, or pnpm
-   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cross-stitch-pattern-generator.git
    cd cross-stitch-pattern-generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Google Gemini API key:
    ```
    API_KEY=your_gemini_api_key_here
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.

## 🌐 Deployment to Vercel

This project is configured for easy deployment to Vercel.

1.  **Push to GitHub:**
    Create a new repository on GitHub and push your local code to it.

2.  **Import Project on Vercel:**
    -   Sign up or log in to your [Vercel](https://vercel.com) account.
    -   Click "Add New..." -> "Project".
    -   Import the GitHub repository you just created.
    -   Vercel will automatically detect that it's a Vite project and configure the build settings.

3.  **Configure Environment Variable:**
    -   In the project settings on Vercel, navigate to the "Environment Variables" section.
    -   Add a new variable with the key `API_KEY` and paste your Google Gemini API key as the value.
    -   Ensure the variable is available for all environments (Production, Preview, Development).

4.  **Deploy:**
    Click the "Deploy" button. Vercel will build and deploy your application. You'll be provided with a public URL for your live site.
