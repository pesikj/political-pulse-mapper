# Political Pulse Mapper

An interactive visualization tool that maps political parties across different countries on a two-dimensional political compass. The application analyzes party positions based on economic freedom and personal freedom dimensions, providing insights into the political landscape.

## Live Demo

Check out the live application: [https://political-pulse-mapper.vercel.app/](https://political-pulse-mapper.vercel.app/)

## Running the Project

### Prerequisites

- Node.js and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- PostgreSQL database (you'll need a `DATABASE_URL` connection string)

### Installation and Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd political-pulse-mapper

# Install dependencies
npm install

# Create a .env file and add your database connection string
echo "DATABASE_URL=your_postgresql_connection_string" > .env

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```
