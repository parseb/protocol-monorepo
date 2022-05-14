### Brownie version frnedly tag for @superfluid-finance/protocol-monorepo
##### packages/ethereum-contracts only

#### Install

`brownie pm install parseb/protocol-monorepo@brownie-v1.2.2`

#### Remapping

if you are following: [Using Superfluid at the Smart Contract Level
](https://docs.superfluid.finance/superfluid/protocol-developers/solidity-examples/interacting-with-superfluid-smart-contracts) you can use the following import to avoid remapping. If you're following another guide, remappings are your best bet, just be aware of the need to cover extra (missing) `ethereum-contracts` dir.
<br>

```
import { ISuperfluid }from "parseb/protocol-monorepo@brownie-v1.2.2/contracts/interfaces/superfluid/ISuperfluid.sol"; //"@superfluid-finance/ethereum-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import { IConstantFlowAgreementV1 } from "parseb/protocol-monorepo@brownie-v1.2.2/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import { IInstantDistributionAgreementV1 } from "parseb/protocol-monorepo@brownie-v1.2.2/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";
```
