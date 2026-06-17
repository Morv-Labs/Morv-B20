import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { FEATURES, NETWORKS, PRECOMPILES } from '../lib/constants.js';
import { loadConfig, requireRpc } from '../lib/config.js';
import { banner } from '../lib/display.js';
import { getActivationRegistry, getFactory, getProvider } from '../lib/contracts.js';

async function safeCall(label, fn) {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err.shortMessage || err.message };
  }
}

export async function runStatus() {
  banner();
  const cfg = loadConfig();
  const network = requireRpc(cfg);
  const spinner = ora(`Checking Beryl on ${network.name}…`).start();

  const provider = getProvider(network.rpcUrl, network.chainId);
  const activation = getActivationRegistry(provider);
  const factory = getFactory(provider);

  const assetOn = await safeCall('asset', () => activation.isActivated(FEATURES.B20_ASSET));
  const stableOn = await safeCall('stable', () => activation.isActivated(FEATURES.B20_STABLECOIN));
  const policyOn = await safeCall('policy', () => activation.isActivated(FEATURES.POLICY_REGISTRY));
  const factoryAddr = await safeCall('factory', () =>
    factory.getB20Address(0, '0x0000000000000000000000000000000000000001', `0x${'00'.repeat(32)}`),
  );

  spinner.succeed('Status check complete');

  const table = new Table({ style: { head: ['cyan'] }, head: ['Check', 'Status'] });
  const cell = (result, yes = 'active', no = 'not active') => {
    if (!result.ok) return chalk.yellow(`unavailable (${result.error})`);
    if (typeof result.value === 'boolean') {
      return result.value ? chalk.green(yes) : chalk.red(no);
    }
    return chalk.green(String(result.value));
  };

  table.push(
    ['Network', `${network.name} (${network.chainId})`],
    ['RPC', network.rpcUrl],
    ['B20 Factory', PRECOMPILES.B20_FACTORY],
    ['Factory getB20Address', factoryAddr.ok ? chalk.green('reachable') : chalk.red('not reachable')],
    ['B20 Asset feature', cell(assetOn)],
    ['B20 Stablecoin feature', cell(stableOn)],
    ['Policy Registry feature', cell(policyOn)],
  );

  console.log('\n' + table.toString());

  const berylLive =
    factoryAddr.ok &&
    ((assetOn.ok && assetOn.value) || (stableOn.ok && stableOn.value));

  if (!berylLive) {
    console.log(
      chalk.yellow(
        '\nBeryl/B20 precompiles are not responding on this network yet.\n' +
          'The CLI is wired to official base-std addresses — run `b20 status` again after the Beryl hardfork.\n',
      ),
    );
  } else {
    console.log(chalk.green('\nB20 is live. Deploy with `b20 deploy`.\n'));
  }
}
