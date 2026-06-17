#!/usr/bin/env node

import { Command } from 'commander';
import { runConfig } from '../src/commands/config.js';
import { runInspect } from '../src/commands/inspect.js';
import { runDeploy } from '../src/commands/deploy.js';
import { runBalance } from '../src/commands/balance.js';
import { runAddressDecode } from '../src/commands/address-decode.js';
import {
  runPolicyCreate,
  runPolicyCheck,
  runPolicyAdd,
  runPolicyAttach,
} from '../src/commands/policy.js';
import { runMint } from '../src/commands/mint.js';
import { runRoleGrant, runRoleCheck } from '../src/commands/role.js';
import { runStatus } from '../src/commands/status.js';

const program = new Command();

program
  .name('b20')
  .description('morv-b20 — CLI for Base B20 Native Token Standard (Beryl upgrade)')
  .version('1.0.0');

program
  .command('config')
  .description('Configure network RPC and private key (~/.morv-b20rc.json)')
  .action(runConfig);

program
  .command('status')
  .description('Check Beryl activation and B20 precompile availability')
  .action(runStatus);

program
  .command('inspect <tokenAddress>')
  .description('Full token summary: supply, policies, pause state, roles')
  .option('-a, --account <address>', 'Show roles held by this address')
  .action(runInspect);

program
  .command('deploy')
  .description('Interactive wizard to deploy Asset or Stablecoin via IB20Factory')
  .action(runDeploy);

program
  .command('balance <tokenAddress> <walletAddress>')
  .description('Get formatted token balance')
  .action(runBalance);

program
  .command('address-decode <tokenAddress>')
  .description('Decode B20 variant byte from address (offline, no RPC)')
  .action(runAddressDecode);

program
  .command('mint <tokenAddress> <to> <amount>')
  .description('Mint tokens (requires MINT_ROLE)')
  .action(runMint);

const policy = program.command('policy').description('PolicyRegistry operations');

policy
  .command('create')
  .description('Create a BLOCKLIST or ALLOWLIST policy')
  .action(runPolicyCreate);

policy
  .command('check <policyId> <account>')
  .description('Check isAuthorized for an account')
  .action(runPolicyCheck);

policy
  .command('add <policyId> <accounts>')
  .description('Add accounts to policy (comma-separated). Default: blocklist add')
  .option('--allowlist', 'Target an ALLOWLIST policy')
  .option('--remove', 'Remove instead of add')
  .action(runPolicyAdd);

policy
  .command('attach <tokenAddress> <scope> <policyId>')
  .description('updatePolicy — bind a scope to a policy ID (admin only)')
  .action(runPolicyAttach);

const role = program.command('role').description('AccessControl operations');

role
  .command('grant <tokenAddress> <roleName> <account>')
  .description('Grant a role (e.g. MINT_ROLE)')
  .action(runRoleGrant);

role
  .command('check <tokenAddress> <roleName> <account>')
  .description('Check if an account holds a role')
  .action(runRoleCheck);

program.parse();
