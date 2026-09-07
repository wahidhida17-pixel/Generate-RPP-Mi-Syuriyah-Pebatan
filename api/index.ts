import app from "../serverApp.ts";

// Middleware to normalize incoming Vercel serverless request URLs
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  next();
});

export default app;
