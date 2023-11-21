// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract TeamDistributor is Initializable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct TeamMember {
        address member;
        uint256 share;
    }

    TeamMember[] private teamMembers;

    address public DAO;
    uint256 private totalShares;

    mapping(IERC20Upgradeable => uint256) public paidOut;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _dao,
        address _dev,
        address _teamMember1,
        address _teamMember2,
        address _teamMember3,
        address _teamMember4,
        address _teamMember5
    ) public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, _dao);

        DAO = _dao;
        teamMembers.push(TeamMember({member: _dev, share: 3}));
        teamMembers.push(TeamMember({member: _teamMember1, share: 1}));
        teamMembers.push(TeamMember({member: _teamMember2, share: 1}));
        teamMembers.push(TeamMember({member: _teamMember3, share: 1}));
        teamMembers.push(TeamMember({member: _teamMember4, share: 1}));
        teamMembers.push(TeamMember({member: _teamMember5, share: 1}));

        totalShares = 8;
    }

    function withdraw(IERC20Upgradeable _token) public onlyRole(OPERATOR_ROLE) {
        uint256 _balance = _token.balanceOf(address(this));

        for (uint i = 0; i < teamMembers.length; i++) {
            address member = teamMembers[i].member;
            uint256 share = (teamMembers[i].share * _balance) / totalShares;
            safeRewardTransfer(_token, member, share);
        }
        paidOut[_token] += _balance;
    }

    function changeTeamMember(
        uint256 _slot,
        address _newMember,
        uint256 _newShare
    ) public onlyRole(OPERATOR_ROLE) {
        teamMembers[_slot] = TeamMember({member: _newMember, share: _newShare});
    }

    function changeTotalShares(uint256 _newTotal)
        public
        onlyRole(OPERATOR_ROLE)
    {
        totalShares = _newTotal;
    }

    // Safe stars transfer function, just in case if rounding error causes pool to not have enough stars.
    function safeRewardTransfer(
        IERC20Upgradeable _token,
        address _to,
        uint256 _amount
    ) internal {
        uint256 _balance = _token.balanceOf(address(this));
        if (_balance > 0) {
            if (_amount > _balance) {
                _token.safeTransfer(_to, _balance);
            } else {
                _token.safeTransfer(_to, _amount);
            }
        }
    }
}
