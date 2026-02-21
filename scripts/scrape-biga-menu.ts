/**
 * Scrape Biga Pizzeria menu from https://bigapizzeria.it/menu/
 * Output: data/menu.json (normalized categories + products)
 * Run: npx tsx scripts/scrape-biga-menu.ts
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const MENU_URL = "https://bigapizzeria.it/menu/";
const OUT_PATH = path.join(process.cwd(), "data", "menu.json");

type Product = { name: string; description?: string; priceEur: number };
type Category = { name: string; sortOrder: number; products: Product[] };

function parsePrice(text: string): number | null {
  // Match 1-2 digits, optional comma/dot, optional decimals (e.g. 6, 7,5, 10.5)
  const m = text.replace(/\s/g, "").match(/(\d+)[,.]?(\d{1,2})?$/);
  if (!m) return null;
  const whole = parseInt(m[1], 10);
  const dec = m[2] ? parseInt(m[2].padEnd(2, "0").slice(0, 2), 10) : 0;
  return whole + dec / 100;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(MENU_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

  // Get all text content structured by headings
  const sections = await page.evaluate(() => {
    const root = document.body;
    const out: { tag: string; text: string }[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "div"].includes(tag)) {
          const t = el.textContent?.trim();
          if (t && t.length > 0 && t.length < 2000) out.push({ tag, text: t });
        }
        el.childNodes.forEach(walk);
      }
    };
    walk(root);
    return out;
  });

  await browser.close();

  // Parse into categories and products
  const categories: Category[] = [];
  let currentCategory: Category | null = null;
  let sortOrder = 0;
  const macroNames = new Set([
    "le focacce", "i fritti", "le pizze", "le bevande", "la novità", "i dolci",
    "pizza del mese", "lA novità", "I DOLCI", "contemporanee", "classiche"
  ]);

  for (let i = 0; i < sections.length; i++) {
    const { tag, text } = sections[i];
    const lower = text.toLowerCase().trim();

    if (tag === "h2" || (tag === "h3" && macroNames.has(lower))) {
      if (currentCategory && currentCategory.products.length > 0) {
        categories.push(currentCategory);
      }
      currentCategory = { name: text.trim(), sortOrder: sortOrder++, products: [] };
      continue;
    }

    if (tag === "h4" && currentCategory) {
      // Product line: often "name" then next node has description + price, or "name \n price"
      const price = parsePrice(text);
      let name = text.replace(/\d+[,.]?\d{0,2}\s*$/g, "").trim();
      let description: string | undefined;
      if (price !== null) {
        if (name.length > 80) {
          const lastSpace = name.lastIndexOf(" ", 80);
          description = name.slice(lastSpace + 1);
          name = name.slice(0, lastSpace);
        }
        currentCategory.products.push({
          name: name || text.slice(0, 80),
          description: description || undefined,
          priceEur: price,
        });
      } else {
        // Might be product name only; check next segment for price
        const next = sections[i + 1];
        if (next) {
          const nextPrice = parsePrice(next.text);
          if (nextPrice !== null) {
            currentCategory.products.push({
              name: text.trim().slice(0, 120),
              description: next.text.length > 100 ? next.text : undefined,
              priceEur: nextPrice,
            });
            i++;
          }
        }
      }
      continue;
    }

    // Try to detect product lines in paragraphs (e.g. "Alla Norma 4")
    if ((tag === "p" || tag === "li" || tag === "div") && currentCategory && text.length < 200) {
      const price = parsePrice(text);
      if (price !== null && price > 0 && price < 200) {
        const name = text.replace(/\d+[,.]?\d{0,2}\s*$/g, "").trim();
        if (name.length >= 2) {
          currentCategory.products.push({
            name: name.slice(0, 120),
            priceEur: price,
          });
        }
      }
    }
  }

  if (currentCategory && currentCategory.products.length > 0) {
    categories.push(currentCategory);
  }

  // Dedupe by product name within same category
  const seen = new Set<string>();
  for (const cat of categories) {
    cat.products = cat.products.filter((p) => {
      const key = `${cat.name}:${p.name}:${p.priceEur}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const result = {
    restaurant: { name: "Biga Pizzeria", slug: "biga-villanova" },
    categories: categories.filter((c) => c.products.length > 0),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), "utf8");
  console.log("Wrote", OUT_PATH, "- categories:", result.categories.length, "products:", result.categories.reduce((s, c) => s + c.products.length, 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
