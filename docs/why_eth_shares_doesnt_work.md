There is something that I forgot for a moment and had to put some thinking into.


As I'm implementing an ERC-6909 Native Vault, the LPs receive
shares proportionally to the percentage of eth they provide, 
and they withdraw proportionally. 


If at some point the [ETH, Token] pool is even partially unbalanced,
which means, there are `Token`, with the current configuration, 
LP's burning shares to withdraw will only receive their proportion of
`ETH`, not considering the `Token`. 

For example, if the [ETH, Token] pool is 1% eth and 99% token,

the shares system only accounts for that 1% eth, so withdrawing LPs
would loose 99% of their value, in constrant to waiting for the pool
to get rebalanced.

This should be patched.

Possible solutions:

1. Enforcing rebalancing before `deposit` and `withdraw`, so that
the LP position is conformed 100% by eth at that points.

2. Reworking the shares system so that `deposit` and `withdraw` takes 
`shares` as a parameter, so that the liquidity must be added and removed
in the same ratio as there is currently. 

In this current MVP version, I will just simulate that this is even not an issue, and my LP's will deposit and withdraw when most of the liquidity
is positioned as `eth`. OR, they will attempt a rebalancing before adding
or removing.