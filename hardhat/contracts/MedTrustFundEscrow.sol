// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MedTrustFundEscrow {
    address public immutable owner;
    address public immutable patient;
    address public immutable hospital;

    struct Milestone {
        string description;
        uint256 amount;
        bool confirmed;
        uint256 releasedAt;
    }

    Milestone[] public milestones;
    uint256 public totalDonated;
    bool public isActive = true;

    event Donated(address donor, uint256 amount);
    event MilestoneConfirmed(uint256 index);
    event FundsReleased(uint256 index, uint256 amount);
    event Refunded(address donor, uint256 amount);

    constructor(
        address _patient,
        address _hospital,
        string[] memory _descriptions,
        uint256[] memory _amounts
    ) {
        owner = msg.sender;
        patient = _patient;
        hospital = _hospital;

        require(_descriptions.length == _amounts.length, "Mismatch");
        for (uint i = 0; i < _descriptions.length; i++) {
            milestones.push(Milestone(_descriptions[i], _amounts[i], false, 0));
        }
    }

    function donate() external payable {
        require(isActive, "Campaign closed");
        totalDonated += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    function confirmMilestone(uint256 index) external {
        require(msg.sender == hospital, "Only hospital");
        require(index < milestones.length, "Invalid index");
        require(!milestones[index].confirmed, "Already confirmed");
        milestones[index].confirmed = true;
        emit MilestoneConfirmed(index);
    }

    function releaseMilestone(uint256 index) external {
        require(msg.sender == owner || msg.sender == patient, "Not authorized");
        require(index < milestones.length, "Invalid index");
        Milestone storage m = milestones[index];
        require(m.confirmed, "Not confirmed");
        require(m.releasedAt == 0, "Already released");

        require(address(this).balance >= m.amount, "Insufficient balance");
        payable(patient).transfer(m.amount);
        m.releasedAt = block.timestamp;
        emit FundsReleased(index, m.amount);
    }

    function refund(address payable donor, uint256 amount) external {
        require(msg.sender == owner, "Not authorized");
        require(address(this).balance >= amount, "Insufficient balance");
        require(totalDonated >= amount, "Cannot refund more than total donated");

        totalDonated -= amount;
        donor.transfer(amount);
        emit Refunded(donor, amount);
    }

    function getMilestones() external view returns (Milestone[] memory) {
        return milestones;
    }
}