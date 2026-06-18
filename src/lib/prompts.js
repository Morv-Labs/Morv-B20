import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { PAUSABLE_FEATURES, POLICY_SCOPES, ROLES } from './constants.js';
import { getSessionToken, setSessionToken } from './session.js';
import { parseMemo } from './encoding.js';

export async function promptTokenAddress(message = 'Token address:') {
  const current = getSessionToken();
  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message,
      default: current || '',
      validate: (v) => ethers.isAddress(v) || 'Invalid address',
    },
  ]);
  setSessionToken(ethers.getAddress(token));
  return ethers.getAddress(token);
}

export async function promptAmount(message = 'Amount:') {
  const { amount } = await inquirer.prompt([
    { type: 'input', name: 'amount', message, validate: (v) => !!v.trim() || 'Required' },
  ]);
  return amount.trim();
}

export async function promptAddress(message) {
  const { addr } = await inquirer.prompt([
    {
      type: 'input',
      name: 'addr',
      message,
      validate: (v) => ethers.isAddress(v) || 'Invalid address',
    },
  ]);
  return ethers.getAddress(addr);
}

export async function promptMemo(optional = true) {
  const { memo } = await inquirer.prompt([
    {
      type: 'input',
      name: 'memo',
      message: optional ? 'Memo (optional, text or 0x hex):' : 'Memo:',
      default: '',
    },
  ]);
  return parseMemo(memo);
}

export async function promptFeatures(message) {
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message,
      choices: PAUSABLE_FEATURES.map((name, i) => ({ name, value: i })),
      validate: (v) => v.length > 0 || 'Pick at least one feature',
    },
  ]);
  return features;
}

export async function promptRole() {
  const { role } = await inquirer.prompt([
    {
      type: 'list',
      name: 'role',
      message: 'Role:',
      choices: Object.keys(ROLES),
    },
  ]);
  return role;
}

export async function promptPolicyScope() {
  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Policy scope:',
      choices: Object.keys(POLICY_SCOPES),
    },
  ]);
  return scope;
}

export async function promptPolicyId(defaultVal = '0') {
  const { policyId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'policyId',
      message: 'Policy ID:',
      default: defaultVal,
      validate: (v) => /^\d+$/.test(v) || 'Must be uint64',
    },
  ]);
  return policyId;
}
