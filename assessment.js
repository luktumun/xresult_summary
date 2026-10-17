const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = __dirname;
const page = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`PASS ${message}`);
}

async function main() {
  const requiredClasses = [
    "card",
    "card__images",
    "card__title",
    "card__time",
    "card__creator",
    "attribution",
  ];
  for (const className of requiredClasses) {
    check(page.includes(`class="${className}"`), `.${className} is present`);
  }

  check(page.includes("Equilibrium #3429"), "NFT title is correct");
  check(
    page.includes("Our Equilibrium collection promotes balance and calm."),
    "NFT description is correct"
  );
  check(page.includes("0.041 ETH"), "Ethereum value is correct");
  check(page.includes("3 days left."), "sale countdown is correct");
  check(page.includes("Creation of"), "creator attribution is present");
  check(
    /class="card__creator-image"\s+src="([^"]+)"/.test(page),
    "creator image has a source"
  );

  const creatorImage = page.match(
    /class="card__creator-image"\s+src="([^"]+)"/
  )[1];
  check(
    fs.existsSync(path.join(root, creatorImage.replace(/^\.\//, ""))),
    "creator image asset exists"
  );

  const footer = page.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)[1];
  const footerLinks = [...footer.matchAll(/<a\b([^>]*)>/g)].map(
    ([, attributes]) => attributes
  );
  check(
    footerLinks[0].includes('href="https://www.crio.do"') &&
      footerLinks[0].includes('target="_blank"'),
    "first footer link opens Crio in a new tab"
  );
  check(
    /href="https:\/\/github\.com\/[^"]+"\s+target="_blank"/.test(
      footerLinks[footerLinks.length - 1]
    ),
    "last footer link opens GitHub in a new tab"
  );
  check(
    /body\s*\{[^}]*font-family:\s*"Outfit",\s*sans-serif/s.test(styles),
    "body uses Outfit, sans-serif"
  );
  check(
    !/\.card\s*\{[^}]*visibility:\s*hidden|\.card\s*\{[^}]*display:\s*none/s.test(
      styles
    ),
    "main card is not hidden by its styles"
  );

  const server = http.createServer((request, response) => {
    const requestedPath = new URL(request.url, "http://localhost").pathname;
    const relativePath = requestedPath === "/" ? "index.html" : requestedPath.slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== path.join(root, "index.html")) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200);
      response.end(content);
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    check(response.status === 200, "page loads over HTTP");
    const loadedPage = await response.text();
    check(loadedPage.includes("<main class=\"card\">"), "loaded page contains the card");

    for (const assetPath of [
      "/styles.css",
      `/${creatorImage.replace(/^\.\//, "")}`,
      "/assets/equilibrium.svg",
    ]) {
      const assetResponse = await fetch(
        `http://127.0.0.1:${address.port}${assetPath}`
      );
      check(assetResponse.status === 200, `${assetPath} loads over HTTP`);
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
