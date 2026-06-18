import chalk from 'chalk';
import ora from 'ora';
import { linkTx } from './display.js';

export async function runTransaction(label, txFactory, network, { quiet = false } = {}) {
  const spinner = quiet ? null : ora(`${label}…`).start();
  try {
    const tx = await txFactory();
    if (spinner) spinner.text = `Waiting for ${tx.hash}…`;
    const receipt = await tx.wait();
    if (spinner) spinner.succeed(label);
    if (!quiet) {
      console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
    }
    return receipt;
  } catch (err) {
    if (spinner) spinner.fail(err.shortMessage || err.message);
    throw err;
  }
}
