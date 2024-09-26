// Test expected behavior from the `AirnodeLogic` abstract contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deriveEndpointId } from "@api3/airnode-admin";
import { getBytesSelector } from "../../../scripts/utils"
import { matchEvent } from "../../helpers/utils";
import { AirnodeSetupFixture } from "../../helpers/types";

export async function shouldBehaveLikeAirnodeLogic (
    fixtureSetup: any
) {
    it("setRequestParameters", async() => {
        const { airnodeLogic, eventsLib, 
            mock, sponsor, derived }: AirnodeSetupFixture = await loadFixture(fixtureSetup);

        const receiptRequestParam = await (await airnodeLogic.setRequestParameters(
            mock.address,
            sponsor.address,
            derived.address
        )).wait();

        await matchEvent(
            receiptRequestParam,
            "SetRequestParameters",
            eventsLib,
            [
                mock.address,
                sponsor.address,
                derived.address
            ],
            airnodeLogic.address
        );
        expect(await airnodeLogic.airnode())
            .to.equal(mock.address);
    });

    it("addNewEndpoint", async() => {
        const { airnodeLogic, eventsLib }: AirnodeSetupFixture = 
            await loadFixture(fixtureSetup);

        const testId = await deriveEndpointId("airnodeLogic", "testFunction");
        const testFunction = "testFunction(address,uint256)";
        const testSelector = getBytesSelector(testFunction);

        const txAddEndpoint = await (await airnodeLogic.addNewEndpoint(
            testId,
            testFunction
        )).wait();

        await matchEvent(
            txAddEndpoint,
            "SetAirnodeEndpoint",
            eventsLib,
            [0,
            testId,
            testFunction,
            testSelector]
        );

        const firstEndpoint = await airnodeLogic.endpointsIds(0);
        expect(firstEndpoint[0]).to.equal(testId);
        expect(firstEndpoint[1]).to.equal(testSelector);
    });
}
