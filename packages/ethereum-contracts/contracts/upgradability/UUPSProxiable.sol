// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.13;

import { UUPSUtils } from "./UUPSUtils.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title UUPS (Universal Upgradeable Proxy Standard) Proxiable contract.
 */
abstract contract UUPSProxiable is Initializable {
    
    /// UUPSProxiable: not upgradable
    error NotUpgradeable();

    /// UUPSProxiable: not compatible logic
    error NonCompatibleLogic();

    /// UUPSProxiable: proxy loop
    error ProxyLoop();

    /**
     * @dev Get current implementation code address.
     */
    function getCodeAddress() public view returns (address codeAddress)
    {
        return UUPSUtils.implementation();
    }

    function updateCode(address newAddress) external virtual;

    /**
     * @dev Proxiable UUID marker function, this would help to avoid wrong logic
     *      contract to be used for upgrading.
     *
     * NOTE: The semantics of the UUID deviates from the actual UUPS standard,
     *       where it is equivalent of _IMPLEMENTATION_SLOT.
     */
    function proxiableUUID() public view virtual returns (bytes32);

    /**
     * @dev Update code address function.
     *      It is internal, so the derived contract could setup its own permission logic.
     */
    function _updateCodeAddress(address newAddress) internal
    {
        // require UUPSProxy.initializeProxy first
        if (UUPSUtils.implementation() == address(0)) revert NotUpgradeable();
        if (proxiableUUID() != UUPSProxiable(newAddress).proxiableUUID()) revert NonCompatibleLogic();
        if (address(this) == newAddress) revert ProxyLoop();
        UUPSUtils.setImplementation(newAddress);
        emit CodeUpdated(proxiableUUID(), newAddress);
    }

    event CodeUpdated(bytes32 uuid, address codeAddress);

}
