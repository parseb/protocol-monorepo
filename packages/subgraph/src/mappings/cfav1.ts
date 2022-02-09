import { BigInt } from "@graphprotocol/graph-ts";
import { FlowUpdated } from "../../generated/ConstantFlowAgreementV1/IConstantFlowAgreementV1";
import {
    FlowUpdatedEvent,
    StreamPeriod,
    Stream,
    StreamRevision,
} from "../../generated/schema";
import {
    createEventID,
    BIG_INT_ZERO,
    tokenHasValidHost,
    getStreamPeriodID,
} from "../utils";
import {getOrInitStreamRevision} from "../mappingHelpers";
import { getHostAddress } from "../addresses";
import { ISuperToken as SuperToken } from "../../generated/templates/SuperToken/ISuperToken";

enum FlowActionType {
    create,
    update,
    terminate,
}

function createFlowUpdatedEntity(
    event: FlowUpdated
): FlowUpdatedEvent {
    let ev = new FlowUpdatedEvent(createEventID("FlowUpdated", event));
    let superTokenContract = SuperToken.bind(event.params.token);
    let newBalance = superTokenContract.realtimeBalanceOfNow(event.params.token);
    ev.transactionHash = event.transaction.hash;
    ev.name = "FlowUpdated";
    ev.addresses = [
        event.params.token,
        event.params.sender,
        event.params.receiver,
    ];
    ev.timestamp = event.block.timestamp;
    ev.blockNumber = event.block.number;
    ev.token = event.params.token;
    ev.sender = event.params.sender;
    ev.receiver = event.params.receiver;
    ev.flowRate = event.params.flowRate;
    ev.totalSenderFlowRate = event.params.totalSenderFlowRate;
    ev.totalReceiverFlowRate = event.params.totalReceiverFlowRate;
    ev.userData = event.params.userData;
    ev.exploiter = event.transaction.from;
    ev.isExploiter = newBalance.value0.ge(BIG_INT_ZERO) && (event.transaction.from.toHex() != event.params.sender.toHex());
    ev.save();
    return ev;
}

function getFlowActionType(
    oldFlowRate: BigInt,
    newFlowRate: BigInt
): FlowActionType {
    return oldFlowRate.equals(BIG_INT_ZERO)
        ? FlowActionType.create
        : newFlowRate.equals(BIG_INT_ZERO)
        ? FlowActionType.terminate
        : FlowActionType.update;
}

function handleStreamPeriodUpdate(
    eventEntity: FlowUpdatedEvent,
    previousFlowRate: BigInt,
    stream: Stream
): void {
    let streamRevision = getOrInitStreamRevision(
        eventEntity.sender.toHex(),
        eventEntity.receiver.toHex(),
        eventEntity.token.toHex()
    );
    let flowActionType = getFlowActionType(
        previousFlowRate,
        eventEntity.flowRate
    );
    let previousStreamPeriod = StreamPeriod.load(
        getStreamPeriodID(stream.id, streamRevision.periodRevisionIndex)
    );
    switch (flowActionType) {
        case FlowActionType.create:
            startStreamPeriod(eventEntity, streamRevision, stream.id);
            break;
        case FlowActionType.update:
            if (!previousStreamPeriod) {
                throw Error(
                    "Previous StreamPeriod not found for flow update action"
                );
            }
            endStreamPeriod(
                previousStreamPeriod as StreamPeriod,
                eventEntity,
                streamRevision,
                previousFlowRate
            );
            startStreamPeriod(eventEntity, streamRevision, stream.id);
            break;
        case FlowActionType.terminate:
            if (!previousStreamPeriod) {
                throw Error(
                    "Previous StreamPeriod not found for flow terminate action"
                );
            }
            endStreamPeriod(
                previousStreamPeriod as StreamPeriod,
                eventEntity,
                streamRevision,
                previousFlowRate
            );
            break;
        default:
            throw "Unrecognized FlowActionType";
    }
}

function incrementPeriodRevisionIndex(streamRevision: StreamRevision): void {
    streamRevision.periodRevisionIndex = streamRevision.periodRevisionIndex + 1;
    streamRevision.save();
}

function startStreamPeriod(
    event: FlowUpdatedEvent,
    streamRevision: StreamRevision,
    streamId: string
): void {
    let streamPeriod = new StreamPeriod(
        getStreamPeriodID(streamId, streamRevision.periodRevisionIndex)
    );
    streamPeriod.sender = event.sender.toHex();
    streamPeriod.receiver = event.receiver.toHex();
    streamPeriod.token = event.token.toHex();
    streamPeriod.flowRate = event.flowRate;
    streamPeriod.startedAtTimestamp = event.timestamp;
    streamPeriod.startedAtBlockNumber = event.blockNumber;
    streamPeriod.startedAtEvent = event.id;
    streamPeriod.stream = streamId;
    streamPeriod.save();
}

function endStreamPeriod(
    existingStreamPeriod: StreamPeriod,
    event: FlowUpdatedEvent,
    streamRevision: StreamRevision,
    flowRateBeforeUpdate: BigInt
): void {
    let streamStopTime = event.timestamp;
    existingStreamPeriod.stoppedAtTimestamp = streamStopTime;
    existingStreamPeriod.stoppedAtBlockNumber = event.blockNumber;
    existingStreamPeriod.stoppedAtEvent = event.id;
    existingStreamPeriod.totalAmountStreamed = flowRateBeforeUpdate.times(
        streamStopTime.minus(existingStreamPeriod.startedAtTimestamp)
    );
    existingStreamPeriod.save();
    incrementPeriodRevisionIndex(streamRevision);
}

export function handleStreamUpdated(event: FlowUpdated): void {
    let tokenAddress = event.params.token;
    let hostAddress = getHostAddress();

    let hasValidHost = tokenHasValidHost(hostAddress, tokenAddress);
    if (!hasValidHost) {
        return;
    }
    createFlowUpdatedEntity(event);
}
