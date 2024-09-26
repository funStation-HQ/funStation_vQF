// A set of interfaces that mimicks the actual implementation on Solidity,
// and enable an easy consumption in the tests.

// Enum representation of RaffleStatus at library `DataTypes`.
export const RaffleStatus = {
    Uninitialized: 0,
    Canceled: 1,
    Open: 2,
    Close: 3,
    Finish: 4
}

// Enum representation of TokenType at library `DataTypes`.
export const TokenType = {
    Native: 0,
    ERC20: 1,
    ERC721: 2,
    ERC1155: 3,
    dApi: 4
}

// Enum representation of CancelationReason at library `DataTypes`.
export const CancelationReason = {
    ForcedCancelation: 0,
    CreatorDecision: 1
}

// Enum representation of RaffleType at library `DataTypes`.
export const RaffleType = {
    Traditional: 0,
    Yolo: 1
}
