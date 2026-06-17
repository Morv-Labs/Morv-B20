import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ethers } from 'ethers';
import { B20_VARIANT, MAX_SUPPLY_CAP, POLICY_SCOPES } from '../lib/constants.js';
import { loadConfig, requireSigner } from '../lib/config.js';
import {
  buildRoleGrantInitCalls,
  encodeAssetCreateParams,
  encodeStablecoinCreateParams,
  encodeUpdatePolicy,
  encodeUpdateSupplyCap,
  parseSalt,
  parseSupplyCapInput,
} from '../lib/encoding.js';
import { banner, linkTx, success, fail } from '../lib/display.js';
import {
  getFactory,
  getPolicyRegistry,
  getProvider,
  getSigner,
  parseB20Created,
} from '../lib/contracts.js';

const SCOPE_CHOICES = Object.keys(POLICY_SCOPES);

export async function runDeploy() {
  banner();
  const cfg = loadConfig();
  const network = requireSigner(cfg);

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'variant',
      message: 'Token variant:',
      choices: [
        { name: 'Asset (6–18 decimals)', value: 'asset' },
        { name: 'Stablecoin (6 decimals, currency code)', value: 'stablecoin' },
      ],
    },
    { type: 'input', name: 'name', message: 'Token name:', validate: (v) => !!v.trim() || 'Required' },
    { type: 'input', name: 'symbol', message: 'Token symbol:', validate: (v) => !!v.trim() || 'Required' },
    {
      type: 'input',
      name: 'decimals',
      message: 'Decimals (6–18):',
      default: '18',
      when: (a) => a.variant === 'asset',
      validate: (v) => {
        const n = Number(v);
        return (n >= 6 && n <= 18 && Number.isInteger(n)) || 'Must be integer 6–18';
      },
    },
    {
      type: 'input',
      name: 'currency',
      message: 'Currency code (e.g. USD):',
      when: (a) => a.variant === 'stablecoin',
      validate: (v) => /^[A-Z]+$/.test(v) || 'Uppercase A–Z only',
    },
    {
      type: 'input',
      name: 'initialAdmin',
      message: 'Initial admin (blank = admin-less):',
      default: '',
    },
    {
      type: 'input',
      name: 'supplyCap',
      message: 'Supply cap in token units (blank = no cap):',
      default: '',
    },
    {
      type: 'input',
      name: 'minter',
      message: 'Grant MINT_ROLE to (blank = skip):',
      default: '',
    },
    {
      type: 'confirm',
      name: 'configurePolicies',
      message: 'Set custom policy IDs at deploy (via initCalls)?',
      default: false,
    },
    {
      type: 'input',
      name: 'salt',
      message: 'Deployment salt (text or 0x hex bytes32):',
      default: `morv-b20-${Date.now()}`,
    },
  ]);

  let policyAnswers = {};
  if (answers.configurePolicies) {
    policyAnswers = await inquirer.prompt(
      SCOPE_CHOICES.map((scope) => ({
        type: 'input',
        name: scope,
        message: `${scope} policy ID (0 = ALWAYS_ALLOW):`,
        default: '0',
        validate: (v) => /^\d+$/.test(v) || 'Must be uint64',
      })),
    );
  }

  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = getSigner(cfg.privateKey, provider);
  const factory = getFactory(signer);
  const registry = getPolicyRegistry(provider);

  const variant = answers.variant === 'asset' ? B20_VARIANT.ASSET : B20_VARIANT.STABLECOIN;
  const decimals = answers.variant === 'asset' ? Number(answers.decimals) : 6;
  const initialAdmin = answers.initialAdmin.trim()
    ? ethers.getAddress(answers.initialAdmin.trim())
    : ethers.ZeroAddress;
  const salt = parseSalt(answers.salt);

  const params =
    answers.variant === 'asset'
      ? encodeAssetCreateParams(answers.name.trim(), answers.symbol.trim(), initialAdmin, decimals)
      : encodeStablecoinCreateParams(
          answers.name.trim(),
          answers.symbol.trim(),
          initialAdmin,
          answers.currency.trim(),
        );

  const initCalls = [];

  const cap = parseSupplyCapInput(answers.supplyCap, decimals);
  if (cap !== MAX_SUPPLY_CAP) {
    initCalls.push(encodeUpdateSupplyCap(cap));
  }

  if (answers.minter.trim()) {
    initCalls.push(...buildRoleGrantInitCalls({ MINT_ROLE: ethers.getAddress(answers.minter.trim()) }));
  }

  if (answers.configurePolicies) {
    for (const scope of SCOPE_CHOICES) {
      const pid = BigInt(policyAnswers[scope]);
      if (pid === 0n) continue;
      const exists = await registry.policyExists(pid);
      if (!exists) {
        fail(`Policy ${pid} does not exist. Create it first with \`b20 policy create\`.`);
        return;
      }
      initCalls.push(encodeUpdatePolicy(scope, pid));
    }
  }

  const deployer = await signer.getAddress();
  const spinner = ora('Predicting address…').start();

  try {
    const predicted = await factory.getB20Address(variant, deployer, salt);
    spinner.succeed(`Predicted address: ${chalk.cyan(predicted)}`);
  } catch (err) {
    spinner.fail(`Address prediction failed: ${err.message}`);
    fail('B20 factory unreachable. Run `b20 status` to check Beryl activation.');
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Deploy on ${network.name} with ${initCalls.length} init call(s)?`,
      default: false,
    },
  ]);
  if (!confirm) {
    console.log(chalk.gray('\nAborted.\n'));
    return;
  }

  const spinner2 = ora('Sending createB20 transaction…').start();
  try {
    const tx = await factory.createB20(variant, salt, params, initCalls);
    spinner2.text = `Waiting for ${tx.hash}…`;
    const receipt = await tx.wait();
    const token = parseB20Created(receipt, factory);

    spinner2.succeed('Token deployed');
    success(`Token: ${chalk.cyan(token || 'see B20Created event')}`);
    console.log(chalk.gray(`  Tx: ${linkTx(receipt.hash, network.chainId)}\n`));
  } catch (err) {
    spinner2.fail(err.shortMessage || err.message);
    fail('Deploy failed. Ensure Beryl is active and your account has ETH for gas.');
  }
}
