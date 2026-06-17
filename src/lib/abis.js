export const IB20_FACTORY_ABI = [
  'function createB20(uint8 variant, bytes32 salt, bytes params, bytes[] initCalls) payable returns (address token)',
  'function getB20Address(uint8 variant, address sender, bytes32 salt) view returns (address)',
  'function isB20(address token) view returns (bool)',
  'function isB20Initialized(address token) view returns (bool)',
  'event B20Created(address indexed token, uint8 indexed variant, string name, string symbol, uint8 decimals, bytes variantEventParams)',
];

export const IB20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function supplyCap() view returns (uint256)',
  'function isPaused(uint8 feature) view returns (bool)',
  'function pausedFeatures() view returns (uint8[])',
  'function policyId(bytes32 policyScope) view returns (uint64)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function MINT_ROLE() view returns (bytes32)',
  'function BURN_ROLE() view returns (bytes32)',
  'function BURN_BLOCKED_ROLE() view returns (bytes32)',
  'function PAUSE_ROLE() view returns (bytes32)',
  'function UNPAUSE_ROLE() view returns (bytes32)',
  'function METADATA_ROLE() view returns (bytes32)',
  'function TRANSFER_SENDER_POLICY() view returns (bytes32)',
  'function TRANSFER_RECEIVER_POLICY() view returns (bytes32)',
  'function TRANSFER_EXECUTOR_POLICY() view returns (bytes32)',
  'function MINT_RECEIVER_POLICY() view returns (bytes32)',
  'function mint(address to, uint256 amount)',
  'function grantRole(bytes32 role, address account)',
  'function updatePolicy(bytes32 policyScope, uint64 newPolicyId)',
  'function updateSupplyCap(uint256 newSupplyCap)',
  'function contractURI() view returns (string)',
];

export const IB20_ASSET_ABI = [
  ...IB20_ABI,
  'function multiplier() view returns (uint256)',
  'function scaledBalanceOf(address account) view returns (uint256)',
  'function OPERATOR_ROLE() view returns (bytes32)',
];

export const IB20_STABLECOIN_ABI = [
  ...IB20_ABI,
  'function currency() view returns (string)',
];

export const POLICY_REGISTRY_ABI = [
  'function createPolicy(address admin, uint8 policyType) returns (uint64 newPolicyId)',
  'function createPolicyWithAccounts(address admin, uint8 policyType, address[] accounts) returns (uint64 newPolicyId)',
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
