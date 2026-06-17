import chalk from 'chalk';
import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { NETWORKS } from '../lib/constants.js';
import { loadConfig, saveConfig, CONFIG_PATH } from '../lib/config.js';
import { banner, success } from '../lib/display.js';

export async function runConfig() {
  banner();
  const cfg = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'network',
      message: 'Network:',
      choices: [
        { name: 'Base Mainnet (Beryl)', value: 'mainnet' },
        { name: 'Base Sepolia', value: 'sepolia' },
        { name: 'Custom RPC', value: 'custom' },
      ],
      default: cfg.network || 'mainnet',
    },
    {
      type: 'input',
      name: 'rpcUrl',
      message: 'Custom RPC URL:',
      when: (a) => a.network === 'custom',
      default: cfg.rpcUrl || NETWORKS.mainnet.rpcUrl,
      validate: (v) => (v.startsWith('http') ? true : 'Must be an http(s) URL'),
    },
    {
      type: 'password',
      name: 'privateKey',
      message: 'Private key (stored locally, never transmitted):',
      mask: '*',
      default: cfg.privateKey || '',
    },
  ]);

  const next = { ...cfg };
  if (answers.network === 'custom') {
    next.network = 'custom';
    next.rpcUrl = answers.rpcUrl;
    delete next.chainId;
  } else {
    next.network = answers.network;
    next.rpcUrl = NETWORKS[answers.network].rpcUrl;
    next.chainId = NETWORKS[answers.network].chainId;
  }
  if (answers.privateKey) next.privateKey = answers.privateKey;

  saveConfig(next);
  success(`Config saved to ${CONFIG_PATH}`);
  console.log(chalk.gray(`  Network: ${next.network} → ${next.rpcUrl}\n`));
}
