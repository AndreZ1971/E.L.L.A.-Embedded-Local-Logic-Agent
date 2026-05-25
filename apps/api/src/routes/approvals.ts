import { Router } from "express";
import { resolveApproval } from "../services/approvals.js";

export const approvalsRouter = Router();

approvalsRouter.post("/:id/confirm", (req, res) => {
  const found = resolveApproval(req.params.id, true);
  res.json({ ok: found });
});

approvalsRouter.post("/:id/deny", (req, res) => {
  const found = resolveApproval(req.params.id, false);
  res.json({ ok: found });
});
