import chalk from 'chalk';
import { ethers } from 'ethers';
import { ROLES } from '../lib/constants.js';
import { loadConfig, requireRpc } from '../lib/config.js';
import { banner, fail } from '../lib/display.js';
import { getProvider, getTokenContract } from '../lib/contracts.js';
import { opGrantRole, opRevokeRole, handleOpError } from './token-ops.js';

export async function runRoleGrant(tokenAddress, roleName, account) {
  banner();
  try {
    await opGrantRole(tokenAddress, roleName, ethers.getAddress(account));
  } catch (err) {
    handleOpError(err);
  }
}

export async function runRoleRevoke(tokenAddress, roleName, account) {
  banner();
  try {
    await opRevokeRole(tokenAddress, roleName, ethers.getAddress(account));
  } catch (err) {
    handleOpError(err);
  }
}

export async function runRoleCheck(tokenAddress, roleName, account) {
  const cfg = loadConfig();
  const network = requireRpc(cfg);
  const role = ROLES[roleName];
  if (!role) return fail(`Unknown role "${roleName}".`);

  const provider = getProvider(network.rpcUrl, network.chainId);
  const token = getTokenContract(tokenAddress, provider);
  const has = await token.hasRole(role, account);

  if (has) console.log(chalk.green(`\n✔ ${account} holds ${roleName}\n`));
  else console.log(chalk.gray(`\n✖ ${account} does not hold ${roleName}\n`));
}
