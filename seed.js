import { createClient } from "@libsql/client";

const client = createClient({
    url: "libsql://infrastructure-deekshith-ship-it.aws-ap-south-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzIwMzEwMTQsImlkIjoiMDE5Yzk1NDYtMTgwMS03NGU0LWFhN2QtNjgzNjE2MmM5YTBhIiwicmlkIjoiNjk3MWM5YjEtZDQ5MS00MjRhLTkxMjMtOGViNjEyODA2MTU1In0.45i8ja-YP9ZZ9QInMVfetxsovlL1E3NDl6dXoZM3vDa3oH4MJk-lTelZF6HXC5piS8XZqCBiFA7hFPA15vFPBQ",
});

const data = [
    { name: "akengineers.org", status: "expire", service: "email", seats: 2, money: 1711.00, startDate: "2025-10-03", endDate: "2025-11-03", provider: "Squarespace" },
    { name: "anandkcontractor.com", status: "active", service: "domain", seats: 0, money: 855.50, startDate: "2026-01-17", endDate: "2026-02-17", provider: "Squarespace" },
    { name: "anandkcontractor.com", status: "active", service: "email", seats: 1, contactEmail: "@anandkcontractor.com", provider: "Squarespace" },
    { name: "byraveshwaraelectricals.com", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-02-13", endDate: "2026-03-13", provider: "Squarespace" },
    { name: "byraveshwaraelectricals.com", status: "active", service: "email", seats: 1, contactEmail: "@byraveshwaraelectricals.com", provider: "Squarespace" },
    { name: "kalabhairaveshwara.com", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-01-17", endDate: "2026-02-17", provider: "Squarespace" },
    { name: "kalabhairaveshwara.com", status: "active", service: "email", seats: 1, contactEmail: "@anandkcontractor.com", provider: "Squarespace" },
    { name: "slrelectricals.co.in", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-02-03", endDate: "2026-03-03", provider: "Squarespace" },
    { name: "slrelectricals.co.in", status: "active", service: "email", seats: 1, contactEmail: "@slrelectricals.co.in", provider: "Squarespace" },
    { name: "srivinayakaa.com", status: "active", service: "domain", seats: 2, money: 1711.00, startDate: "2026-02-10", endDate: "2026-03-11", provider: "Squarespace" },
    { name: "srivinayakaa.com", status: "active", service: "email", seats: 0, contactEmail: "@srivinayakaa.com", provider: "Squarespace" },
    { name: "thebarcon.org", status: "active", service: "domain", money: 1014.80, startDate: "2025-09-13", endDate: "2025-09-13", provider: "Squarespace" },
    { name: "thedarshini.com", status: "active", service: "domain", provider: "Squarespace" },
    { name: "thestonefactor.com", status: "active", service: "domain", money: 1014.80, startDate: "2025-09-13", endDate: "2026-09-02", provider: "Squarespace" },
    { name: "unhive.in", status: "active", service: "domain", money: 1656.00, startDate: "2025-12-29", endDate: "2026-12-15", provider: "Squarespace" },
    { name: "jayasrienterprises.com", status: "active", service: "domain", money: 1221.3, startDate: "2024-04-18", endDate: "2026-04-18", provider: "receller" },
    { name: "karlecampaigns.com", status: "active", service: "cloud", money: 1221.3, startDate: "2022-02-18", endDate: "2026-02-18", provider: "receller" },
    { name: "sqservices.in", status: "active", service: "domain", money: 1221.3, startDate: "2021-12-21", endDate: "2026-12-21", provider: "receller" },
    { name: "nagelectricals.com", status: "active", service: "domain", money: 1221.3, startDate: "2021-05-24", endDate: "2026-05-24", provider: "receller" },
    { name: "gurupunvaanii.com", status: "active", service: "domain", money: 1221.3, startDate: "2019-07-04", endDate: "2026-07-04", provider: "receller" },
];

async function seed() {
    try {
        // Ensure table exists (simplified schema from useData.ts)
        await client.execute(`CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      service TEXT NOT NULL DEFAULT 'domain',
      seats INTEGER NOT NULL DEFAULT 0,
      phone TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      money REAL DEFAULT 0,
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      provider TEXT NOT NULL DEFAULT '',
      server TEXT DEFAULT '',
      inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        for (const item of data) {
            const id = crypto.randomUUID();
            await client.execute({
                sql: `INSERT INTO domains (id, name, status, service, seats, phone, contact_email, money, start_date, end_date, provider) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    id,
                    item.name,
                    item.status.toLowerCase() === "active" ? "active" : "expire",
                    item.service.toLowerCase(),
                    item.seats || 0,
                    item.phone || "",
                    item.contactEmail || "",
                    item.money || 0,
                    item.startDate || "",
                    item.endDate || "",
                    item.provider || ""
                ]
            });
            console.log(`Inserted: ${item.name} (${item.service})`);
        }
        console.log("Seeding completed successfully.");
    } catch (error) {
        console.error("Error seeding data:", error);
    } finally {
        process.exit(0);
    }
}

seed();
