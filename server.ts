import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    custom_service TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'revenue' or 'expense'
    client_id INTEGER,
    description TEXT NOT NULL,
    category TEXT, -- for expenses
    amount REAL NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' or 'paid'
    recurrence TEXT DEFAULT 'single', -- 'single', 'monthly', 'yearly'
    parent_id INTEGER, -- for recurring instances
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Clients
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, service_type, custom_service, observations } = req.body;
    const info = db.prepare(
      "INSERT INTO clients (name, service_type, custom_service, observations) VALUES (?, ?, ?, ?)"
    ).run(name, service_type, custom_service, observations);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
      const all = db.prepare(`
        SELECT t.*, c.name as client_name 
        FROM transactions t 
        LEFT JOIN clients c ON t.client_id = c.id 
        ORDER BY t.due_date DESC
      `).all();
      return res.json(all);
    }

    // Filter by month/year
    const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
    const transactions = db.prepare(`
      SELECT t.*, c.name as client_name 
      FROM transactions t 
      LEFT JOIN clients c ON t.client_id = c.id 
      WHERE t.due_date LIKE ?
      ORDER BY t.due_date ASC
    `).all(`${datePrefix}%`);
    
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, client_id, description, category, amount, due_date, status, recurrence } = req.body;
    const info = db.prepare(`
      INSERT INTO transactions (type, client_id, description, category, amount, due_date, status, recurrence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(type, client_id, description, category, amount, due_date, status, recurrence);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/transactions/:id", (req, res) => {
    const { status, amount, description, due_date } = req.body;
    const fields = [];
    const values = [];
    if (status) { fields.push("status = ?"); values.push(status); }
    if (amount !== undefined) { fields.push("amount = ?"); values.push(amount); }
    if (description) { fields.push("description = ?"); values.push(description); }
    if (due_date) { fields.push("due_date = ?"); values.push(due_date); }
    
    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
    
    values.push(req.params.id);
    db.prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Duplicate transaction
  app.post("/api/transactions/:id/duplicate", (req, res) => {
    const original = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!original) return res.status(404).json({ error: "Not found" });
    
    const { id, ...data } = original;
    const info = db.prepare(`
      INSERT INTO transactions (type, client_id, description, category, amount, due_date, status, recurrence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.type, data.client_id, data.description, data.category, data.amount, data.due_date, 'pending', data.recurrence);
    
    res.json({ id: info.lastInsertRowid });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
