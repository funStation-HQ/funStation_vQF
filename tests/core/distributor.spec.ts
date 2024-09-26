import { distributorSetup } from "../helpers/fixtures";
import { shouldBehaveLikeDistributor } from "./distributor.behavior";

describe("Distributor Tests", () => {
    describe("Behavior test", async () => {
        await shouldBehaveLikeDistributor(
            distributorSetup
        );
    });
});
