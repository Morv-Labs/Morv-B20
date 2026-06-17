import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { ethers } from 'ethers';
import { FEATURES, PAUSABLE_FEATURES, ROLES, B20_VARIANT } from '../lib/constants.js';
import { loadConfig, requireRpc } from '../lib/config.js';
import { decodeB20Address } from '../lib/address.js';
import {
  banner,
  formatPolicyId,
  formatSupplyCapSync,
  fail,
} from '../lib/display.js';
import {
  getActivationRegistry,
  getFactory,
  getPolicyRegistry,
  getProvider,
  getSigner,
  getTokenContract,
} from '../lib/contracts.js';

const ROLE_LIST = [
  'DEFAULT_ADMIN_ROLE',
  'MINT_ROLE',
  'BURN_ROLE',
  'BURN_BLOCKED_ROLE',
  'PAUSE_ROLE',
  'UNPAUSE_ROLE',
  'METADATA_ROLE',
  'OPERATOR_ROLE',
];

export async function runInspect(tokenAddress, opts) {
  banner();
  const cfg = loadConfig();
  const network = requireRpc(cfg);

  const decoded = decodeB20Address(tokenAddress);
  const spinner = ora(`Inspecting ${tokenAddress} on ${network.name}…`).start();

  try {
    const provider = getProvider(network.rpcUrl, network.chainId);
    const factory = getFactory(provider);
    const registry = getPolicyRegistry(provider);

    const [isB20, initialized] = await Promise.all([
      factory.isB20(tokenAddress),
      factory.isB20Initialized(tokenAddress),
    ]);

    if (!isB20) {
      spinner.warn('Address does not match B20 prefix — showing best-effort read');
    } else {
      spinner.text = `B20 ${decoded.variantName} · ${initialized ? 'initialized' : 'not initialized'}…`;
    }

    const token = getTokenContract(tokenAddress, provider);

    const [
      name,
      symbol,
      decimals,
      totalSupply,
      supplyCap,
      senderScope,
      receiverScope,
      executorScope,
      mintScope,
    ] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply(),
      token.supplyCap(),
      token.TRANSFER_SENDER_POLICY(),
      token.TRANSFER_RECEIVER_POLICY(),
      token.TRANSFER_EXECUTOR_POLICY(),
      token.MINT_RECEIVER_POLICY(),
    ]);

    const scopeEntries = [
      ['TRANSFER_SENDER', senderScope],
      ['TRANSFER_RECEIVER', receiverScope],
      ['TRANSFER_EXECUTOR', executorScope],
      ['MINT_RECEIVER', mintScope],
    ];

    const policyIds = await Promise.all(
      scopeEntries.map(([, scope]) => token.policyId(scope)),
    );

    const paused = [];
    for (let i = 0; i < PAUSABLE_FEATURES.length; i++) {
      if (await token.isPaused(i)) paused.push(PAUSABLE_FEATURES[i]);
    }

    spinner.succeed('Token loaded');

    const table = new Table({ style: { head: ['cyan'] }, head: ['Field', 'Value'] });
    table.push(
      ['Address', chalk.cyan(tokenAddress)],
      ['Variant', chalk.cyan(decoded.variantName)],
      ['Initialized', initialized ? chalk.green('yes') : chalk.yellow('no')],
      ['Name', name],
      ['Symbol', symbol],
      ['Decimals', String(decimals)],
      ['Total Supply', ethers.formatUnits(totalSupply, decimals)],
      ['Supply Cap', formatSupplyCapSync(supplyCap, decimals)],
      ['Paused', paused.length ? chalk.red(paused.join(', ')) : chalk.green('none')],
    );

    if (decoded.variant === B20_VARIANT.ASSET) {
      const multiplier = await token.multiplier();
      table.push(['Multiplier (WAD)', ethers.formatEther(multiplier)]);
    }
    if (decoded.variant === B20_VARIANT.STABLECOIN) {
      const currency = await token.currency();
      table.push(['Currency', currency]);
    }

    table.push([{ colSpan: 2, content: chalk.cyan('Policy Scopes') }]);
    for (let i = 0; i < scopeEntries.length; i++) {
      const [label, id] = [scopeEntries[i][0], policyIds[i]];
      let extra = '';
      if (id !== 0n) {
        const exists = await registry.policyExists(id);
        extra = exists ? '' : chalk.yellow(' ⚠ not created');
      }
      table.push([label, formatPolicyId(id) + extra]);
    }

    const holder = opts.account || (cfg.privateKey ? await getSigner(cfg.privateKey, provider).getAddress() : null);
    if (holder) {
      table.push([{ colSpan: 2, content: chalk.cyan(`Roles · ${holder}`) }]);
      for (const roleName of ROLE_LIST) {
        if (roleName === 'OPERATOR_ROLE' && decoded.variant !== B20_VARIANT.ASSET) continue;
        const role = ROLES[roleName];
        const has = await token.hasRole(role, holder);
        table.push([roleName, has ? chalk.green('✔ held') : chalk.gray('—')]);
      }
    }

    console.log('\n' + table.toString() + '\n');
  } catch (err) {
    spinner.fail(err.message);
    fail('Inspect failed. Is Beryl live on this network? Run `b20 status`.');
  }
}
