/** @see base/base-std interfaces — full surface for morv-b20 CLI */

export const IB20_FACTORY_ABI = [
  'function createB20(uint8 variant, bytes32 salt, bytes params, bytes[] initCalls) payable returns (address token)',
  'function getB20Address(uint8 variant, address sender, bytes32 salt) view returns (address)',
  'function isB20(address token) view returns (bool)',
  'function isB20Initialized(address token) view returns (bool)',
  'event B20Created(address indexed token, uint8 indexed variant, string name, string symbol, uint8 decimals, bytes variantEventParams)',
];

export const IB20_CORE_ABI = [
  // ERC-20
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  // Memos
  'function transferWithMemo(address to, uint256 amount, bytes32 memo) returns (bool)',
  'function transferFromWithMemo(address from, address to, uint256 amount, bytes32 memo) returns (bool)',
  // Mint / burn
  'function mint(address to, uint256 amount)',
  'function mintWithMemo(address to, uint256 amount, bytes32 memo)',
  'function burn(uint256 amount)',
  'function burnWithMemo(uint256 amount, bytes32 memo)',
  'function burnBlocked(address from, uint256 amount)',
  // Roles
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
  'function renounceRole(bytes32 role, address callerConfirmation)',
  'function renounceLastAdmin()',
  'function setRoleAdmin(bytes32 role, bytes32 newAdminRole)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function MINT_ROLE() view returns (bytes32)',
  'function BURN_ROLE() view returns (bytes32)',
  'function BURN_BLOCKED_ROLE() view returns (bytes32)',
  'function PAUSE_ROLE() view returns (bytes32)',
  'function UNPAUSE_ROLE() view returns (bytes32)',
  'function METADATA_ROLE() view returns (bytes32)',
  // Pause
  'function isPaused(uint8 feature) view returns (bool)',
  'function pausedFeatures() view returns (uint8[])',
  'function pause(uint8[] features)',
  'function unpause(uint8[] features)',
  // Policy
  'function policyId(bytes32 policyScope) view returns (uint64)',
  'function updatePolicy(bytes32 policyScope, uint64 newPolicyId)',
  'function TRANSFER_SENDER_POLICY() view returns (bytes32)',
  'function TRANSFER_RECEIVER_POLICY() view returns (bytes32)',
  'function TRANSFER_EXECUTOR_POLICY() view returns (bytes32)',
  'function MINT_RECEIVER_POLICY() view returns (bytes32)',
  // Supply cap
  'function supplyCap() view returns (uint256)',
  'function updateSupplyCap(uint256 newSupplyCap)',
  // Metadata
  'function updateName(string newName)',
  'function updateSymbol(string newSymbol)',
  'function contractURI() view returns (string)',
  'function updateContractURI(string newURI)',
  // Permit (EIP-2612)
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function nonces(address owner) view returns (uint256)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)',
];

export const IB20_ASSET_EXT_ABI = [
  'function OPERATOR_ROLE() view returns (bytes32)',
  'function WAD_PRECISION() view returns (uint256)',
  'function multiplier() view returns (uint256)',
  'function scaledBalanceOf(address account) view returns (uint256)',
  'function toScaledBalance(uint256 rawBalance) view returns (uint256)',
  'function toRawBalance(uint256 scaledBalance) view returns (uint256)',
  'function updateMultiplier(uint256 newMultiplier)',
  'function batchMint(address[] recipients, uint256[] amounts)',
  'function extraMetadata(string key) view returns (string)',
  'function updateExtraMetadata(string key, string value)',
  'function isAnnouncementIdUsed(string id) view returns (bool)',
  'function announce(bytes[] internalCalls, string id, string description, string uri)',
];

export const IB20_STABLECOIN_EXT_ABI = [
  'function currency() view returns (string)',
];

export const IB20_ABI = [...IB20_CORE_ABI];
export const IB20_ASSET_ABI = [...IB20_CORE_ABI, ...IB20_ASSET_EXT_ABI];
export const IB20_STABLECOIN_ABI = [...IB20_CORE_ABI, ...IB20_STABLECOIN_EXT_ABI];

export const POLICY_REGISTRY_ABI = [
  'function createPolicy(address admin, uint8 policyType) returns (uint64 newPolicyId)',
  'function createPolicyWithAccounts(address admin, uint8 policyType, address[] accounts) returns (uint64 newPolicyId)',
  'function stageUpdateAdmin(uint64 policyId, address newAdmin)',
  'function finalizeUpdateAdmin(uint64 policyId)',
  'function renounceAdmin(uint64 policyId)',
  'function updateBlocklist(uint64 policyId, bool blocked, address[] accounts)',
  'function updateAllowlist(uint64 policyId, bool allowed, address[] accounts)',
  'function isAuthorized(uint64 policyId, address account) view returns (bool)',
  'function policyExists(uint64 policyId) view returns (bool)',
  'function policyAdmin(uint64 policyId) view returns (address)',
  'function pendingPolicyAdmin(uint64 policyId) view returns (address)',
  'event PolicyCreated(uint64 indexed policyId, address indexed creator, uint8 policyType)',
];

export const ACTIVATION_REGISTRY_ABI = [
  'function isActivated(bytes32 feature) view returns (bool)',
  'function admin() view returns (address)',
];
