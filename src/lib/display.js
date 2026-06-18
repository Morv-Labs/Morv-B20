import chalk from 'chalk';
import { ethers } from 'ethers';
import { ALWAYS_ALLOW, ALWAYS_BLOCK } from './constants.js';

export function banner() {
  console.log(chalk.bold.cyan('\n  ██████╗ ██████╗  ██████╗'));
  console.log(chalk.bold.cyan('  ██╔══██╗╚════██╗██╔═████╗'));
  console.log(chalk.bold.cyan('  ██████╔╝ █████╔╝██║██╔██║'));
  console.log(chalk.bold.cyan('  ██╔══██╗██╔═══╝ ████╔╝██║'));
  console.log(chalk.bold.cyan('  ██████╔╝███████╗╚██████╔╝'));
  console.log(chalk.bold.cyan('  ╚═════╝ ╚══════╝ ╚═════╝ '));
  console.log(chalk.gray('  morv-b20 · Base Native Token CLI (Beryl)\n'));
}

export function formatPolicyId(policyId) {
  const id = BigInt(policyId);
  if (id === ALWAYS_ALLOW) return chalk.green('0 (ALWAYS_ALLOW)');
  if (id === ALWAYS_BLOCK) return chalk.red(`${id} (ALWAYS_BLOCK)`);
  const typeByte = Number(id >> 56n);
  const typeLabel = typeByte === 0 ? 'BLOCKLIST' : typeByte === 1 ? 'ALLOWLIST' : `TYPE_${typeByte}`;
  return `${id} (${typeLabel})`;
}

export function formatSupplyCapSync(cap, decimals) {
  const max = (2n ** 128n) - 1n;
  if (BigInt(cap) === max) return chalk.gray('∞ (no cap)');
  return ethers.formatUnits(cap, decimals);
}

export function fail(message) {
  console.log(chalk.red(`\n✖ ${message}`));
  process.exitCode = 1;
}

export function success(message) {
  console.log(chalk.green(`\n✔ ${message}`));
}

export function linkTx(hash, chainId) {
  const base = chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';
  return `${base}/tx/${hash}`;
}
