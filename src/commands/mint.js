import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, requireSigner } from '../lib/config.js';
import { parseAmount } from '../lib/encoding.js';
import { banner, linkTx, fail } from '../lib/display.js';
import { getProvider, getSigner, getTokenContract } from '../lib/contracts.js';

export async function runMint(tokenAddress, to, amountRaw) {
  banner();
  const cfg = loadConfig();
  const network = requireSigner(cfg);

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const token = getTokenContract(tokenAddress, signer);

  const spinner = ora('Preparing mint…').start();
  try {
    const decimals = await token.decimals();
    const amount = parseAmount(amountRaw, decimals);
    spinner.text = 'Sending mint transaction…';
    const tx = await token.mint(to, amount);
    const receipt = await tx.wait();
    spinner.succeed(`Minted ${amountRaw} to ${to}`);
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner.fail(err.shortMessage || err.message);
    fail('Mint failed. Caller needs MINT_ROLE and recipient must pass MINT_RECEIVER_POLICY.');
  }
}
