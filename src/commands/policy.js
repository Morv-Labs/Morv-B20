import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ethers } from 'ethers';
import { POLICY_SCOPES } from '../lib/constants.js';
import { loadConfig, requireSigner, requireRpc } from '../lib/config.js';
import { banner, formatPolicyId, linkTx, success, fail } from '../lib/display.js';
import { getPolicyRegistry, getProvider, getSigner, getTokenContract, parsePolicyCreated } from '../lib/contracts.js';

export async function runPolicyCreate() {
  banner();
  const cfg = loadConfig();
  const network = requireSigner(cfg);

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'policyType',
      message: 'Policy type:',
      choices: [
        { name: 'BLOCKLIST — default allow, block listed', value: 0 },
        { name: 'ALLOWLIST — default deny, allow listed', value: 1 },
      ],
    },
    {
      type: 'input',
      name: 'admin',
      message: 'Policy admin address:',
      validate: (v) => ethers.isAddress(v) || 'Invalid address',
    },
  ]);

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const registry = getPolicyRegistry(signer);

  const spinner = ora('Creating policy…').start();
  try {
    const tx = await registry.createPolicy(answers.admin, answers.policyType);
    spinner.text = `Waiting for ${tx.hash}…`;
    const receipt = await tx.wait();
    const policyId = parsePolicyCreated(receipt, registry);

    spinner.succeed('Policy created');
    success(`Policy ID: ${chalk.cyan(policyId?.toString() ?? 'see PolicyCreated event')}`);
    console.log(chalk.gray(`  Type: ${answers.policyType === 0 ? 'BLOCKLIST' : 'ALLOWLIST'}`));
    console.log(chalk.gray(`  Admin: ${answers.admin}`));
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner.fail(err.shortMessage || err.message);
    fail('Policy creation failed. Is PolicyRegistry activated? Run `b20 status`.');
  }
}

export async function runPolicyCheck(policyId, account) {
  const cfg = loadConfig();
  const network = requireRpc(cfg);
  const spinner = ora('Checking authorization…').start();

  try {
    const provider = getProvider(network.rpcUrl, network.chainId);
    const registry = getPolicyRegistry(provider);
    const [authorized, exists] = await Promise.all([
      registry.isAuthorized(policyId, account),
      registry.policyExists(policyId),
    ]);

    spinner.stop();
    const label = formatPolicyId(policyId);
    if (!exists && BigInt(policyId) !== 0n) {
      console.log(chalk.yellow(`\n⚠ Policy ${label} does not exist — empty-set semantics apply.`));
    }
    if (authorized) {
      console.log(chalk.green(`\n✔ ${account} is AUTHORIZED under policy ${label}\n`));
    } else {
      console.log(chalk.red(`\n✖ ${account} is DENIED under policy ${label}\n`));
    }
  } catch (err) {
    spinner.fail(err.message);
    fail('Policy check failed.');
  }
}

export async function runPolicyAdd(policyId, accounts, opts) {
  const cfg = loadConfig();
  const network = requireSigner(cfg);
  const list = accounts.split(',').map((a) => a.trim()).filter(Boolean);

  if (!list.length) {
    fail('Provide at least one account (comma-separated).');
    return;
  }

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const registry = getPolicyRegistry(signer);

  const spinner = ora('Updating policy membership…').start();
  try {
    let tx;
    if (opts.allowlist) {
      tx = await registry.updateAllowlist(policyId, opts.remove ? false : true, list);
    } else {
      tx = await registry.updateBlocklist(policyId, opts.remove ? false : true, list);
    }
    const receipt = await tx.wait();
    spinner.succeed('Policy updated');
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner.fail(err.shortMessage || err.message);
    fail('Policy update failed.');
  }
}

export async function runPolicyAttach(tokenAddress, scope, policyId) {
  const cfg = loadConfig();
  const network = requireSigner(cfg);

  if (!POLICY_SCOPES[scope]) {
    fail(`Unknown scope "${scope}". Use: ${Object.keys(POLICY_SCOPES).join(', ')}`);
    return;
  }

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const registry = getPolicyRegistry(provider);
  const token = getTokenContract(tokenAddress, signer);

  const pid = BigInt(policyId);
  if (pid !== 0n) {
    const exists = await registry.policyExists(pid);
    if (!exists) {
      fail(`Policy ${policyId} does not exist. Create it first or use 0 (ALWAYS_ALLOW).`);
      return;
    }
  }

  const spinner = ora(`Attaching policy ${policyId} to ${scope}…`).start();
  try {
    const tx = await token.updatePolicy(POLICY_SCOPES[scope], pid);
    const receipt = await tx.wait();
    spinner.succeed('Policy attached');
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner.fail(err.shortMessage || err.message);
    fail('updatePolicy failed. Caller needs DEFAULT_ADMIN_ROLE.');
  }
}
