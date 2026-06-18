import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { FEATURES, PRECOMPILES } from '../lib/constants.js';
import { loadConfig, requireRpc, resolveNetwork } from '../lib/config.js';
import { getActivationRegistry, getFactory, getProvider } from '../lib/contracts.js';

async function safeCall(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    return { ok: false, error: err.shortMessage || err.message };
  }
}

export async function fetchStatus(cfg = loadConfig()) {
  const network = requireRpc(cfg);
  const provider = getProvider(network.rpcUrl, network.chainId);
  const activation = getActivationRegistry(provider);
  const factory = getFactory(provider);

  const [assetOn, stableOn, policyOn, factoryAddr] = await Promise.all([
    safeCall(() => activation.isActivated(FEATURES.B20_ASSET)),
    safeCall(() => activation.isActivated(FEATURES.B20_STABLECOIN)),
    safeCall(() => activation.isActivated(FEATURES.POLICY_REGISTRY)),
    safeCall(() =>
      factory.getB20Address(0, '0x0000000000000000000000000000000000000001', `0x${'00'.repeat(32)}`),
    ),
  ]);

  const berylLive =
    factoryAddr.ok &&
    ((assetOn.ok && assetOn.value) || (stableOn.ok && stableOn.value));

  return {
    network,
    factoryReachable: factoryAddr.ok,
    berylLive,
    assetOn,
    stableOn,
    policyOn,
    predictedAddress: factoryAddr.ok ? factoryAddr.value : null,
  };
}

export function printStatus(status) {
  const table = new Table({ style: { head: ['cyan'] }, head: ['Check', 'Status'] });
  const cell = (result, yes = 'active', no = 'not active') => {
    if (!result.ok) return chalk.yellow(`unavailable`);
    if (typeof result.value === 'boolean') {
      return result.value ? chalk.green(yes) : chalk.red(no);
    }
    return chalk.green('reachable');
  };

  table.push(
    ['Network', `${status.network.name} (${status.network.chainId})`],
    ['RPC', status.network.rpcUrl],
    ['B20 Factory', PRECOMPILES.B20_FACTORY],
    ['Factory', status.factoryReachable ? chalk.green('reachable') : chalk.red('not reachable')],
    ['B20 Asset', cell(status.assetOn)],
    ['B20 Stablecoin', cell(status.stableOn)],
    ['Policy Registry', cell(status.policyOn)],
    ['Beryl live', status.berylLive ? chalk.green('yes') : chalk.red('no')],
  );

  console.log('\n' + table.toString() + '\n');
}

export async function runStatus() {
  const { banner } = await import('../lib/display.js');
  banner();
  const spinner = ora('Checking Beryl…').start();
  const status = await fetchStatus();
  spinner.succeed('Status check complete');
  printStatus(status);
  if (!status.berylLive) {
    console.log(chalk.yellow('Beryl/B20 precompiles are not live on this network yet.\n'));
  } else {
    console.log(chalk.green('B20 is ready to use.\n'));
  }
  return status;
}
