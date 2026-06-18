import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { ethers } from 'ethers';
import { loadConfig, CONFIG_PATH, resolveNetwork } from '../lib/config.js';
import { banner } from '../lib/display.js';
import { setSessionToken, getSessionToken } from '../lib/session.js';
import { fetchStatus, printStatus } from './status.js';
import { runConfig } from './config.js';
import { runDeploy } from './deploy.js';
import { runInspect } from './inspect.js';
import { runBalance } from './balance.js';
import { runPolicyCreate, runPolicyCheck } from './policy.js';
import { runRoleCheck } from './role.js';
import {
  promptAmount,
  promptAddress,
  promptMemo,
  promptFeatures,
  promptRole,
  promptPolicyScope,
  promptPolicyId,
} from '../lib/prompts.js';
import {
  opMint,
  opMintWithMemo,
  opTransfer,
  opTransferWithMemo,
  opBurn,
  opBurnWithMemo,
  opBurnBlocked,
  opPause,
  opUnpause,
  opApprove,
  opPermit,
  opGrantRole,
  opRevokeRole,
  opUpdateSupplyCap,
  opUpdatePolicy,
  opUpdateName,
  opUpdateSymbol,
  opUpdateContractURI,
  opBatchMint,
  opUpdateMultiplier,
  opRenounceLastAdmin,
  handleOpError,
} from './token-ops.js';
import { getProvider, getSigner } from '../lib/contracts.js';
import { decodeB20Address } from '../lib/address.js';
import { B20_VARIANT } from '../lib/constants.js';

function step(n, title) {
  console.log(chalk.cyan(`\n── Step ${n}: ${title} ──\n`));
}

async function askYes(message, defaultVal = false) {
  const { yes } = await inquirer.prompt([
    { type: 'confirm', name: 'yes', message, default: defaultVal },
  ]);
  return yes;
}

function printSessionBar(session) {
  const net = resolveNetwork(session.config);
  const tokenLabel = session.token
    ? `${session.token.slice(0, 10)}… (${decodeB20Address(session.token).variantName})`
    : chalk.gray('not set');
  const beryl = session.status?.berylLive ? chalk.green('live') : chalk.red('not live');

  console.log(chalk.gray('─'.repeat(56)));
  console.log(
    chalk.gray(`  ${net.name} · Beryl ${beryl} · Token ${tokenLabel} · Wallet ${session.wallet?.slice(0, 10) ?? '—'}…`),
  );
  console.log(chalk.gray('─'.repeat(56)));
}

async function stepConfig(session) {
  step(1, 'Configuration');
  let cfg = loadConfig();

  if (!cfg.rpcUrl || !cfg.privateKey) {
    console.log(chalk.yellow('No configuration found — starting setup.\n'));
    await runConfig({ embedded: true });
    cfg = loadConfig();
  } else {
    const network = resolveNetwork(cfg);
    let wallet = '—';
    try {
      wallet = await getSigner(cfg.privateKey, getProvider(network.rpcUrl, network.chainId)).getAddress();
    } catch {
      /* ignore */
    }
    console.log(chalk.gray(`  File: ${CONFIG_PATH}`));
    console.log(chalk.gray(`  Network: ${network.name}`));
    console.log(chalk.gray(`  RPC: ${network.rpcUrl}`));
    console.log(chalk.gray(`  Wallet: ${wallet}\n`));

    if (await askYes('Update configuration?', false)) {
      await runConfig({ embedded: true });
      cfg = loadConfig();
    }
  }

  session.config = cfg;
  try {
    const network = resolveNetwork(cfg);
    session.wallet = await getSigner(cfg.privateKey, getProvider(network.rpcUrl, network.chainId)).getAddress();
  } catch {
    session.wallet = null;
  }
}

async function stepStatusAuto(session) {
  step(2, 'Network status');
  const status = await fetchStatus(session.config);
  printStatus(status);
  session.status = status;

  if (!status.berylLive) {
    console.log(
      chalk.yellow(
        'Beryl/B20 is not live yet. View operations work now; write operations need an active hardfork.\n',
      ),
    );
  }
}

function needToken(session) {
  if (!session.token) {
    console.log(chalk.yellow('\n  Set a token address first (Token → Set token address).\n'));
    return false;
  }
  return true;
}

async function setTokenAddress(session) {
  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'B20 token address:',
      default: getSessionToken() || session.token || '',
      validate: (v) => (v.trim() === '' ? 'Required' : ethers.isAddress(v) || 'Invalid address'),
    },
  ]);
  session.token = ethers.getAddress(token);
  setSessionToken(session.token);
  const decoded = decodeB20Address(session.token);
  console.log(chalk.green(`\n  Active token: ${session.token} (${decoded.variantName})\n`));
}

function showDecodeAddress(address) {
  const decoded = decodeB20Address(address);
  const table = new Table({ style: { head: ['cyan'] }, head: ['Field', 'Value'] });
  table.push(
    ['Address', decoded.address],
    ['B20 Prefix', decoded.isB20Prefix ? chalk.green(decoded.prefix) : chalk.yellow(decoded.prefix)],
    ['Variant', `${decoded.variantByte} → ${chalk.cyan(decoded.variantName)}`],
    ['Salt excerpt', decoded.saltExcerpt],
  );
  console.log('\n' + table.toString() + '\n');
}

async function confirmWrite(session, label) {
  if (!session.status?.berylLive) {
    console.log(chalk.red('\n  ✖ Beryl is not live — this transaction would fail.\n'));
    return false;
  }
  return askYes(`Send transaction: ${label}?`, false);
}

async function runWriteOp(session, label, fn) {
  if (!(await confirmWrite(session, label))) {
    console.log(chalk.gray('  → cancelled\n'));
    return;
  }
  console.log(chalk.cyan(`\n→ ${label}…`));
  try {
    await fn();
    console.log(chalk.green(`  ✔ ${label}\n`));
  } catch (e) {
    handleOpError(e);
  }
}

const VIEW_CATEGORIES = {
  Network: [
    { value: 'refresh-status', name: 'Refresh network status' },
  ],
  Token: [
    { value: 'set-token', name: 'Set token address (view only)' },
    { value: 'decode-address', name: 'Decode B20 address (offline)' },
    { value: 'inspect', name: 'Inspect token' },
    { value: 'balance', name: 'Check wallet balance' },
  ],
  Policy: [{ value: 'policy-check', name: 'Check policy authorization' }],
  Roles: [{ value: 'role-check', name: 'Check role on token' }],
};

const WRITE_CATEGORIES = {
  Token: [
    { value: 'deploy', name: 'Deploy new B20 token' },
    { value: 'set-token', name: 'Set active token address' },
  ],
  Policy: [
    { value: 'policy-create', name: 'Create policy (registry)' },
    { value: 'attach-policy', name: 'Attach policy to token' },
  ],
  Roles: [
    { value: 'grant-role', name: 'Grant role' },
    { value: 'revoke-role', name: 'Revoke role' },
  ],
  Transfers: [
    { value: 'mint', name: 'Mint' },
    { value: 'transfer', name: 'Transfer' },
    { value: 'approve', name: 'Approve' },
    { value: 'permit', name: 'Permit (EIP-2612)' },
    { value: 'burn', name: 'Burn' },
    { value: 'burn-blocked', name: 'Burn blocked (freeze-seize)' },
    { value: 'batch-mint', name: 'Batch mint (Asset only)' },
  ],
  Admin: [
    { value: 'pause', name: 'Pause features' },
    { value: 'unpause', name: 'Unpause features' },
    { value: 'supply-cap', name: 'Update supply cap' },
    { value: 'metadata', name: 'Update metadata (name / symbol / URI)' },
    { value: 'multiplier', name: 'Update multiplier (Asset only)' },
    { value: 'renounce-admin', name: 'Renounce last admin' },
  ],
};

async function pickAction(category, actions) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${category}:`,
      choices: [
        ...actions,
        new inquirer.Separator(),
        { name: chalk.green('← Back to categories'), value: '__back__' },
      ],
      pageSize: 20,
    },
  ]);
  return action;
}

async function executeViewAction(session, action) {
  switch (action) {
    case 'refresh-status': {
      console.log(chalk.cyan('\n  Refreshing status…\n'));
      session.status = await fetchStatus(session.config);
      printStatus(session.status);
      break;
    }
    case 'set-token':
      await setTokenAddress(session);
      break;
    case 'decode-address': {
      const addr = await promptAddress('B20 address to decode:');
      showDecodeAddress(addr);
      break;
    }
    case 'inspect':
      if (!needToken(session)) break;
      await runInspect(session.token, { quiet: true });
      break;
    case 'balance':
      if (!needToken(session)) break;
      await runBalance(session.token, await promptAddress('Wallet:'));
      break;
    case 'policy-check':
      await runPolicyCheck(await promptPolicyId(), await promptAddress('Account:'));
      break;
    case 'role-check':
      if (!needToken(session)) break;
      await runRoleCheck(session.token, await promptRole(), await promptAddress('Account:'));
      break;
    default:
      console.log(chalk.yellow(`  Unknown action: ${action}\n`));
  }
}

async function executeWriteAction(session, action) {
  switch (action) {
    case 'deploy': {
      const result = await runDeploy({ embedded: true });
      if (result.ok && result.token) {
        session.token = ethers.getAddress(result.token);
        setSessionToken(session.token);
        console.log(chalk.green(`  Token set to ${session.token}\n`));
      }
      break;
    }
    case 'set-token':
      await setTokenAddress(session);
      break;
    case 'policy-create':
      await runPolicyCreate({ embedded: true });
      break;
    case 'attach-policy': {
      if (!needToken(session)) break;
      const scope = await promptPolicyScope();
      const policyId = await promptPolicyId();
      await runWriteOp(session, 'Attach policy', () =>
        opUpdatePolicy(session.token, scope, policyId, { quiet: true }),
      );
      break;
    }
    case 'grant-role': {
      if (!needToken(session)) break;
      const role = await promptRole();
      const account = await promptAddress('Grant to:');
      await runWriteOp(session, `Grant ${role}`, () =>
        opGrantRole(session.token, role, account, { quiet: true }),
      );
      break;
    }
    case 'revoke-role': {
      if (!needToken(session)) break;
      const role = await promptRole();
      const account = await promptAddress('Revoke from:');
      await runWriteOp(session, `Revoke ${role}`, () =>
        opRevokeRole(session.token, role, account, { quiet: true }),
      );
      break;
    }
    case 'mint': {
      if (!needToken(session)) break;
      const to = await promptAddress('Mint to:');
      const amount = await promptAmount();
      const memo = (await askYes('Include memo?', false)) ? await promptMemo() : null;
      await runWriteOp(session, 'Mint', () =>
        memo
          ? opMintWithMemo(session.token, to, amount, memo, { quiet: true })
          : opMint(session.token, to, amount, { quiet: true }),
      );
      break;
    }
    case 'transfer': {
      if (!needToken(session)) break;
      const to = await promptAddress('Transfer to:');
      const amount = await promptAmount();
      const memo = (await askYes('Include memo?', false)) ? await promptMemo() : null;
      await runWriteOp(session, 'Transfer', () =>
        memo
          ? opTransferWithMemo(session.token, to, amount, memo, { quiet: true })
          : opTransfer(session.token, to, amount, { quiet: true }),
      );
      break;
    }
    case 'approve': {
      if (!needToken(session)) break;
      const spender = await promptAddress('Spender:');
      const amount = await promptAmount();
      await runWriteOp(session, 'Approve', () =>
        opApprove(session.token, spender, amount, { quiet: true }),
      );
      break;
    }
    case 'permit': {
      if (!needToken(session)) break;
      const spender = await promptAddress('Spender:');
      const amount = await promptAmount();
      const { hours } = await inquirer.prompt([
        { type: 'input', name: 'hours', message: 'Valid for (hours):', default: '1' },
      ]);
      const deadline = Math.floor(Date.now() / 1000) + Number(hours) * 3600;
      await runWriteOp(session, 'Permit', () =>
        opPermit(session.token, spender, amount, deadline, { quiet: true }),
      );
      break;
    }
    case 'burn': {
      if (!needToken(session)) break;
      const amount = await promptAmount('Burn amount:');
      const memo = (await askYes('Include memo?', false)) ? await promptMemo() : null;
      await runWriteOp(session, 'Burn', () =>
        memo
          ? opBurnWithMemo(session.token, amount, memo, { quiet: true })
          : opBurn(session.token, amount, { quiet: true }),
      );
      break;
    }
    case 'burn-blocked': {
      if (!needToken(session)) break;
      const from = await promptAddress('Blocked account:');
      const amount = await promptAmount();
      await runWriteOp(session, 'Burn blocked', () =>
        opBurnBlocked(session.token, from, amount, { quiet: true }),
      );
      break;
    }
    case 'batch-mint': {
      if (!needToken(session)) break;
      if (decodeB20Address(session.token).variant !== B20_VARIANT.ASSET) {
        console.log(chalk.yellow('\n  Asset variant only.\n'));
        break;
      }
      const { lines } = await inquirer.prompt([
        { type: 'input', name: 'lines', message: 'Pairs addr:amount (comma-separated):' },
      ]);
      const recipients = [];
      const amounts = [];
      for (const part of lines.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [addr, amt] = part.split(':');
        recipients.push(ethers.getAddress(addr.trim()));
        amounts.push(amt.trim());
      }
      await runWriteOp(session, 'Batch mint', () =>
        opBatchMint(session.token, recipients, amounts, { quiet: true }),
      );
      break;
    }
    case 'pause': {
      if (!needToken(session)) break;
      const features = await promptFeatures('Pause features:');
      await runWriteOp(session, 'Pause', () => opPause(session.token, features, { quiet: true }));
      break;
    }
    case 'unpause': {
      if (!needToken(session)) break;
      const features = await promptFeatures('Unpause features:');
      await runWriteOp(session, 'Unpause', () => opUnpause(session.token, features, { quiet: true }));
      break;
    }
    case 'supply-cap': {
      if (!needToken(session)) break;
      const { cap } = await inquirer.prompt([
        { type: 'input', name: 'cap', message: 'Cap (blank = unlimited):', default: '' },
      ]);
      await runWriteOp(session, 'Update supply cap', () =>
        opUpdateSupplyCap(session.token, cap, { quiet: true }),
      );
      break;
    }
    case 'metadata': {
      if (!needToken(session)) break;
      const { field } = await inquirer.prompt([
        { type: 'list', name: 'field', choices: ['name', 'symbol', 'contractURI'] },
      ]);
      const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: `New ${field}:` }]);
      const label = `Update ${field}`;
      await runWriteOp(session, label, () => {
        if (field === 'name') return opUpdateName(session.token, value, { quiet: true });
        if (field === 'symbol') return opUpdateSymbol(session.token, value, { quiet: true });
        return opUpdateContractURI(session.token, value, { quiet: true });
      });
      break;
    }
    case 'multiplier': {
      if (!needToken(session)) break;
      if (decodeB20Address(session.token).variant !== B20_VARIANT.ASSET) {
        console.log(chalk.yellow('\n  Asset variant only.\n'));
        break;
      }
      const { wad } = await inquirer.prompt([
        { type: 'input', name: 'wad', message: 'Multiplier WAD (e.g. 1.0):', default: '1.0' },
      ]);
      await runWriteOp(session, 'Update multiplier', () =>
        opUpdateMultiplier(session.token, wad, { quiet: true }),
      );
      break;
    }
    case 'renounce-admin': {
      if (!needToken(session)) break;
      const { ok } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ok',
          message: chalk.red('Permanently renounce DEFAULT_ADMIN? Cannot be undone.'),
          default: false,
        },
      ]);
      if (!ok) break;
      await runWriteOp(session, 'Renounce admin', () =>
        opRenounceLastAdmin(session.token, { quiet: true }),
      );
      break;
    }
    default:
      console.log(chalk.yellow(`  Unknown action: ${action}\n`));
  }
}

async function runPhaseMenu(session, phaseLabel, categories, executeFn, exitChoices = []) {
  let done = false;

  while (!done) {
    console.log();
    printSessionBar(session);
    console.log(chalk.cyan(`\n  ${phaseLabel}\n`));

    const topChoices = [
      ...Object.keys(categories).map((name) => ({ name, value: `cat:${name}` })),
      new inquirer.Separator(),
      ...exitChoices,
    ];

    const { pick } = await inquirer.prompt([
      {
        type: 'list',
        name: 'pick',
        message: 'Main menu:',
        choices: topChoices,
        pageSize: 20,
      },
    ]);

    if (pick.startsWith('cat:')) {
      const categoryName = pick.slice(4);
      let inCategory = true;
      while (inCategory) {
        const action = await pickAction(categoryName, categories[categoryName]);
        if (action === '__back__') {
          inCategory = false;
        } else {
          await executeFn(session, action);
        }
      }
    } else {
      done = true;
      return pick;
    }
  }
}

async function phaseView(session) {
  step(3, 'View (read-only)');
  console.log(
    chalk.gray(
      'Explore network and token data first. No transactions in this phase.\n' +
        'Set a token address under Token → Set token address before inspect / balance.\n',
    ),
  );

  const exit = await runPhaseMenu(session, 'VIEW', VIEW_CATEGORIES, executeViewAction, [
    { name: chalk.yellow('Done with viewing → Write phase'), value: '__write__' },
    { name: chalk.gray('Exit session'), value: '__exit__' },
  ]);

  return exit;
}

async function phaseWrite(session) {
  step(4, 'Write (transactions)');
  console.log(
    chalk.gray(
      'On-chain operations. Each action asks for confirmation before sending a transaction.\n',
    ),
  );

  if (!session.status?.berylLive) {
    console.log(chalk.yellow('  Warning: Beryl is not live — writes will be blocked.\n'));
  }

  await runPhaseMenu(session, 'WRITE', WRITE_CATEGORIES, executeWriteAction, [
    { name: chalk.gray('Exit session'), value: '__exit__' },
  ]);
}

export async function runGuided() {
  banner();
  console.log(chalk.gray('Guided session · config → status → view → write\n'));

  const session = { config: null, status: null, token: null, wallet: null };

  await stepConfig(session);
  await stepStatusAuto(session);

  const viewExit = await phaseView(session);
  if (viewExit === '__exit__') {
    console.log(chalk.green('\nSession ended.\n'));
    return;
  }

  await phaseWrite(session);

  console.log(chalk.green('Session complete.\n'));
  console.log(chalk.gray('Direct commands: morv-b20 status | morv-b20 deploy | morv-b20 --help\n'));
}
