import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { loadConfig, requireRpc, requireSigner } from '../lib/config.js';
import { banner, linkTx, fail } from '../lib/display.js';
import { getProvider, getSigner, getTokenContract } from '../lib/contracts.js';
import { ROLES } from '../lib/constants.js';

export async function runRoleGrant(tokenAddress, roleName, account) {
  banner();
  const cfg = loadConfig();
  const network = requireSigner(cfg);

  const role = ROLES[roleName];
  if (!role) {
    fail(`Unknown role "${roleName}". Use: ${Object.keys(ROLES).join(', ')}`);
    return;
  }

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const token = getTokenContract(tokenAddress, signer);

  const spinner = ora(`Granting ${roleName} to ${account}…`).start();
  try {
    const tx = await token.grantRole(role, ethers.getAddress(account));
    const receipt = await tx.wait();
    spinner.succeed(`${roleName} granted`);
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner.fail(err.shortMessage || err.message);
    fail('grantRole failed. Caller needs admin role for this role.');
  }
}

export async function runRoleCheck(tokenAddress, roleName, account) {
  const cfg = loadConfig();
  const network = requireRpc(cfg);

  const role = ROLES[roleName];
  if (!role) {
    fail(`Unknown role "${roleName}".`);
    return;
  }

  const provider = getProvider(network.rpcUrl, network.chainId);
  const token = getTokenContract(tokenAddress, provider);
  const has = await token.hasRole(role, account);

  if (has) {
    console.log(chalk.green(`\n✔ ${account} holds ${roleName}\n`));
  } else {
    console.log(chalk.gray(`\n✖ ${account} does not hold ${roleName}\n`));
  }
}
