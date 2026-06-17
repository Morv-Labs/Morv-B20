import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { loadConfig, requireRpc } from '../lib/config.js';
import { fail } from '../lib/display.js';
import { getProvider, getTokenContract } from '../lib/contracts.js';

export async function runBalance(tokenAddress, walletAddress) {
  const cfg = loadConfig();
  const network = requireRpc(cfg);
  const spinner = ora('Fetching balance…').start();

  try {
    const provider = getProvider(network.rpcUrl, network.chainId);
    const token = getTokenContract(tokenAddress, provider);
    const [bal, dec, sym] = await Promise.all([
      token.balanceOf(walletAddress),
      token.decimals(),
      token.symbol(),
    ]);
    spinner.succeed(
      `Balance: ${chalk.bold.white(ethers.formatUnits(bal, dec))} ${chalk.cyan(sym)}`,
    );
  } catch (err) {
    spinner.fail(err.message);
    fail('Balance lookup failed.');
  }
}
