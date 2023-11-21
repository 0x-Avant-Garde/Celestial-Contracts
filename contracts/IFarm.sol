// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IFarm {
    function fund(uint256 amount) external;

    function pendingShare(uint256 pid, address user)
        external
        view
        returns (uint256);

    function deposit(uint256 pid, uint256 amount) external;

    function withdraw(uint256 pid, uint256 amount) external;

    function setNFT(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _newBoostAmount
    ) external;

    function depositNFT(
        address _user,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount
    ) external;

    function withdrawNFT(
        address _user,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount
    ) external;

    // View State Variables

    function totalRecycled() external view returns (uint256);

    function percentAllocatedToDao() external view returns (uint256);

    function percentAllocatedToTeam() external view returns (uint256);

    function nftDepositedAmount(
        address tokenAddress,
        uint256 tokenId,
        address user
    ) external view returns (uint256);

    function totalUserBoost(address user) external view returns (uint256);

    function starsPerSecond() external view returns (uint256);

    function poolEndTime() external view returns (uint256);
}
