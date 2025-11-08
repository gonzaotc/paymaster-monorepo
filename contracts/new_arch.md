Universal Paymaster
ERC6909TotalSupply

// returns how many shares a particular DEPOSITOR has of a particular [ETH:Token] pool.
function balanceOf(address owner, uint256 id) public view virtual override returns (uint256) 

// returns how many shares there are of a particular [ETH:Token] pool.    
mapping(uint256 id => uint256) private _totalSupplies;

ERC6909NativeVault is ERC6909TotalSupply    

// allows a DEPOSITOR to deposit ETH for a particular ID token.    function deposit(uint256 assets, address receiver, uint256 id)
    
// returns the total amount of ETH for a particular ID token.    function totalAssets(uint256 id) public view virtual returns (uint256) 

- DEPOSITORS: Deposit ETH for a specific Token, and receives ERC-6909 shares for that token. 

- USERS: Sends userOperations that pre-pays tokens and spends ETH, only if there is enough deposit for that given token.

- REBALANCERS: Anyone that buys the accumulated tokens for eth at a discount price. 

      Fees are charged to end users for:       - Paying the Oracle (if needed)      - Paying the depositors for their exposure to the token (larger fees depending on the token risk)
      - Paying the rebalancers a profit for their work, and making rebalancing appealing. 

functions:
- deposit: depositors deposit ETH for a specific token and receive ERC-6909 shares for the eth pool. 
- withdraw: depositors withdraw their eth, burning their shares. 
- validatePaymasterUserOp: queries the token pricecalculates fee takes the prepayment from the user
- postOp: returns excess to the user 
- rebalance: buys tokens for eth at discount price. 
