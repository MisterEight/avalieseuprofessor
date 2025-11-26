import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme && scheme.toLowerCase() === "bearer" && token) return token;
  return null;
}

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: "Token ausente" });
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalido" });
  }
}

export function requireAdmin(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: "Token ausente" });
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a admin" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalido" });
  }
}
