// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.13;

import "../interfaces/ux/IRelayRecipient.sol";

/**
 * @title Base relay recipient contract
 * @author Superfluid
 * @dev A base contract to be inherited by any contract that want to receive relayed transactions
 *      A subclass must use "_msgSender()" instead of "msg.sender"
 *      MODIFIED FROM: https://github.com/opengsn/forwarder/blob/master/contracts/BaseRelayRecipient.sol
 */
abstract contract BaseRelayRecipient is IRelayRecipient {

    error NotTrustedForwarder();

    /**
     * @dev Check if the forwarder is trusted
     */
    function isTrustedForwarder(address forwarder) public view virtual override returns(bool);

    /**
     * @dev Return the transaction signer of this call
     *
     * if the call came through our trusted forwarder, return the original sender.
     * otherwise, return `msg.sender`.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _getTransactionSigner() internal virtual view returns (address payable ret) {
        if(msg.data.length < 24 || !isTrustedForwarder(msg.sender)) revert NotTrustedForwarder();
        // At this point we know that the sender is a trusted forwarder,
        // so we trust that the last bytes of msg.data are the verified sender address.
        // extract sender address from the end of msg.data
        assembly {
            ret := shr(96,calldataload(sub(calldatasize(),20)))
        }
    }

}
