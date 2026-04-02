import type { RequestHandler } from "express";

const BEARER_PREFIX = "Bearer ";

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const expectedToken = process.env.ADMIN_API_TOKEN?.trim();

  if (!expectedToken) {
    res.status(503).json({ error: "ADMIN_API_TOKEN is not configured" });
    return;
  }

  const authorization = req.header("authorization");
  const providedToken = authorization?.startsWith(BEARER_PREFIX)
    ? authorization.slice(BEARER_PREFIX.length).trim()
    : null;

  if (!providedToken || providedToken !== expectedToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
