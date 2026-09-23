import * as fs from 'fs';

const OPERATOR_URL = "http://localhost:3001";
const WALLET_ID = 1;

(async () => {
  const json = fs.readFileSync("resolverQuery.json").toString();

  const rawResponse = await fetch(
    `${OPERATOR_URL}/api/wallet/${WALLET_ID}/resolveWithWallet`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: json
    }
  );
  const content = await rawResponse.json();
  const outputJson = JSON.stringify(content, null, 2);

  console.log(outputJson);
  fs.writeFileSync("resolved.json", outputJson);
})();
