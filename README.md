- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project
- **AI Receipt Scanning**: Instantly extract items, prices, and store names from receipts using Google Gemini AI.
- **Eco-Scoring**: Automatically analyze the environmental impact of your purchases with sustainable shopping tips.
- **Smart Dashboard**:
    - **Spending vs. Budget**: Real-time line charts comparing actual spending against a linear "Ideal Budget".
    - **Daily AI Insights**: Receive automated daily analysis of spending patterns and financial advice.
    - **Budget Progress**: Real-time tracking of net income, savings goals, and proportional budget usage.
- **Interactive UI**:
    - **Fluid Background**: A smooth, interactive shape follows the cursor for a modern aesthetic.
    - **Themes**: Support for System, Light, Dark, and Custom Gradient backgrounds.
    - **Micro-interactions**: Animated number counters and smooth layout transitions.
- **Secure Profile**: Encrypted storage of personal Gemini API keys and profile settings in Supabase.

## Demo
## Tech Stack

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).
- **Framework**: Next.js 15 (App Router)
- **Backend/Auth**: Supabase (PostgreSQL, Storage, Auth)
- **AI**: Google Gemini Pro (via Vercel AI SDK)
- **Styling**: Tailwind CSS + Shadcn UI
- **Visualization**: Recharts
- **Animations**: Framer Motion / CSS Transitions

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Update your `.env.local` with Supabase credentials:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
[!NOTE]

This example uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, which refers to Supabase's new publishable key format.

Both legacy anon keys and new publishable keys can be used with this variable name during the transition period. Supabase's dashboard may show NEXT_PUBLIC_SUPABASE_ANON_KEY; its value can be used in this example.

See the full announcement for more information.

Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY can be found in your Supabase project's API settings
-5. You can now run the Next.js local development server:
+3. Start the development server: bash npm run dev
The starter kit should now be running on localhost:3000.
-6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete components.json and re-install shadcn/ui
-> Check out the docs for Local Development to also run Supabase locally.
-## Feedback and issues
-Please file feedback and issues over on the Supabase GitHub org.
-## More Supabase examples
-- Next.js Subscription Payments Starter -- Cookie-based Auth and the Next.js 13 App Router (free course) -- Supabase Auth and the Next.js App Router +4. AI Key Configuration: Once signed in, go to the Settings page and enter your Google Gemini API key to enable scanning and analysis features.