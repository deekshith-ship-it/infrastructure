import { createClient } from "@libsql/client";
import fs from "fs";
import crypto from "crypto";

// Manual .env loading
try {
    const envFile = fs.readFileSync(".env", "utf8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value) process.env[key.trim()] = value.trim();
    });
} catch (e) {
    console.warn("No .env file found, using process.env");
}

const client = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

const uuidv4 = () => crypto.randomUUID();

const domains = [
    { name: "akengineers.org", status: "expire", service: "email", seats: 2, money: 1711.00, startDate: "2025-10-03", endDate: "2025-11-03", provider: "Squarespace" },
    { name: "anandkcontractor.com", status: "active", service: "domain", seats: 0, money: 855.50, startDate: "2026-01-17", endDate: "2026-02-17", provider: "Squarespace" },
    { name: "byraveshwaraelectricals.com", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-02-13", endDate: "2026-03-13", provider: "Squarespace" },
    { name: "kalabhairaveshwara.com", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-01-17", endDate: "2026-02-17", provider: "Squarespace" },
    { name: "slrelectricals.co.in", status: "active", service: "domain", seats: 1, money: 855.50, startDate: "2026-02-03", endDate: "2026-03-03", provider: "Squarespace" },
    { name: "srivinayakaa.com", status: "active", service: "domain", seats: 2, money: 1711.00, startDate: "2026-02-10", endDate: "2026-03-11", provider: "Squarespace" },
    { name: "thebarcon.org", status: "active", service: "domain", money: 1014.80, startDate: "2025-09-13", endDate: "2025-09-13", provider: "Squarespace" },
    { name: "thedarshini.com", status: "active", service: "domain", provider: "Squarespace" },
    { name: "thestonefactor.com", status: "active", service: "domain", money: 1014.80, startDate: "2025-09-13", endDate: "2026-09-02", provider: "Squarespace" },
    { name: "unhive.in", status: "active", service: "domain", money: 1656.00, startDate: "2025-12-29", endDate: "2026-12-15", provider: "Squarespace" },
    { name: "jayasrienterprises.com", status: "active", service: "domain", money: 1221.3, startDate: "2024-04-18", endDate: "2026-04-18", provider: "receller" },
    { name: "karlecampaigns.com", status: "active", service: "domain", money: 1221.3, startDate: "2022-02-18", endDate: "2026-02-18", provider: "receller" },
    { name: "sqeservices.in", status: "active", service: "domain", money: 1221.3, startDate: "2021-12-21", endDate: "2026-12-26", provider: "receller" },
    { name: "nagelectricals.com", status: "active", service: "domain", money: 1221.3, startDate: "2021-05-24", endDate: "2026-05-24", provider: "receller" },
    { name: "gurupunvaanii.com", status: "active", service: "domain", money: 1221.3, startDate: "2019-07-04", endDate: "2026-07-04", provider: "receller" },
    { name: "housingtrades.com", status: "active", service: "domain", money: 1221.3, startDate: "2018-08-27", endDate: "2028-08-27", provider: "receller" },
    { name: "nandiassociates.in", status: "active", service: "domain", money: 1221.3, startDate: "2018-06-04", endDate: "2026-06-04", provider: "receller" },
    { name: "ashasgroup.in", status: "active", service: "domain", money: 899.00, startDate: "2025-01-02", endDate: "2027-01-02", provider: "GoDaddy" },
    { name: "assetzlms.com", status: "active", service: "domain", money: 1599.00, startDate: "2025-04-21", endDate: "2026-04-21", provider: "GoDaddy" },
    { name: "digitalhues.online", status: "active", service: "domain", money: 4999.09, startDate: "2024-10-03", endDate: "2026-10-04", provider: "GoDaddy" },
    { name: "khoshasystems.com", status: "active", service: "domain", money: 1599.00, startDate: "2025-01-29", endDate: "2026-01-26", provider: "GoDaddy" },
    { name: "mi1k.co", status: "active", service: "domain", money: 3699.00, startDate: "2025-07-04", endDate: "2026-07-04", provider: "GoDaddy" },
    { name: "mileonavicario.org", status: "active", service: "domain", money: 1599.00, startDate: "2025-04-01", endDate: "2026-04-01", provider: "GoDaddy" },
    { name: "omnify.solutions", status: "active", service: "domain", money: 4362.73, startDate: "2025-06-03", endDate: "2026-06-03", provider: "GoDaddy" },
];

const servers = [
    { name: "GoDaddy NS 43", hostname: "ns43.domaincontrol.com", ip: "34.102.136.180", type: "smtp", status: "online", port: 587 },
    { name: "NSOne DNS 1", hostname: "dns1.p02.nsone.net", ip: "198.51.44.2", type: "smtp", status: "online", port: 587 },
    { name: "GoDaddy NS 73", hostname: "ns73.domaincontrol.com", ip: "34.102.136.180", type: "smtp", status: "online", port: 587 },
    { name: "GoDaddy NS 59", hostname: "ns59.domaincontrol.com", ip: "34.102.136.180", type: "smtp", status: "online", port: 587 },
    { name: "GoDaddy NS 13", hostname: "ns13.domaincontrol.com", ip: "34.102.136.180", type: "smtp", status: "online", port: 587 },
    { name: "GoDaddy NS 37", hostname: "ns37.domaincontrol.com", ip: "34.102.136.180", type: "smtp", status: "online", port: 587 },
];

const emails = [
    { address: "info@anandkcontractor.com", status: "active", quota: 5120, used: 120 },
    { address: "contact@byraveshwaraelectricals.com", status: "active", quota: 5120, used: 450 },
    { address: "admin@kalabhairaveshwara.com", status: "active", quota: 10240, used: 2100 },
    { address: "sales@slrelectricals.co.in", status: "active", quota: 5120, used: 800 },
    { address: "support@srivinayakaa.com", status: "active", quota: 5120, used: 55 },
];

async function run() {
    try {
        console.log("Cleaning existing data...");
        await client.execute("DELETE FROM emails");
        await client.execute("DELETE FROM domains");
        await client.execute("DELETE FROM servers");

        console.log("Importing domains...");
        const domainMap = new Map();
        for (const d of domains) {
            const id = uuidv4();
            await client.execute({
                sql: `INSERT INTO domains (id, name, status, service, seats, money, start_date, end_date, provider) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [id, d.name, d.status, d.service, d.seats || 0, d.money || 0, d.startDate || "", d.endDate || "", d.provider]
            });
            domainMap.set(d.name, id);
        }

        console.log("Importing servers...");
        for (const s of servers) {
            await client.execute({
                sql: `INSERT INTO servers (id, name, hostname, ip, status, type, port) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [uuidv4(), s.name, s.hostname, s.ip, s.status, s.type, s.port]
            });
        }

        console.log("Importing emails...");
        for (const e of emails) {
            const domainName = e.address.split("@")[1];
            const domainId = domainMap.get(domainName);
            if (domainId) {
                await client.execute({
                    sql: `INSERT INTO emails (id, address, domain_id, status, quota, used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    args: [uuidv4(), e.address, domainId, e.status, e.quota, e.used, new Date().toISOString()]
                });
            }
        }

        console.log("Data import successful!");
    } catch (err) {
        console.error("Critical Failure:", err);
    } finally {
        process.exit(0);
    }
}

run();
