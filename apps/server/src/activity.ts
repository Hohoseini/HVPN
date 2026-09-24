import { db } from "./db.js";

export function logActivity(actor: string, action: string, detail = ""): void {
  db.prepare("INSERT INTO activity (ts, actor, action, detail) VALUES (?, ?, ?, ?)").run(
    Date.now(),
    actor,
    action,
    detail,
  );
}

export function listActivity(limit = 200): unknown[] {
  return db.prepare("SELECT * FROM activity ORDER BY ts DESC LIMIT ?").all(limit);
}

export function clearActivity(): void {
  db.exec("DELETE FROM activity");
}
