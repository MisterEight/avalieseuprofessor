import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import professoresRouter from "./routes/professores.js";
import avaliacoesRouter from "./routes/avaliacoes.js";
import adminRouter from "./routes/admin.js";
import instituicoesRouter from "./routes/instituicoes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(authRouter);
app.use("/professores", professoresRouter);
app.use(avaliacoesRouter);
app.use(adminRouter);
app.use(instituicoesRouter);

app.get("/", (_req, res) => {
  res.json({ message: "API Avalie Seu Professor" });
});

const port = env.port;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
