// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MedTrustFundEscrow.sol";

/**
 * @title MedTrustFundFactory
 * @notice Factory contract that deploys child MedTrustFundEscrow contracts.
 *         Reduces gas costs for the admin and centralises contract tracking.
 */
contract MedTrustFundFactory {
    address public immutable owner;

    struct CampaignRecord {
        address escrowAddress;
        address patient;
        address hospital;
        uint256 deployedAt;
        bool active;
    }

    CampaignRecord[] public campaigns;

    event CampaignDeployed(
        uint256 indexed campaignIndex,
        address indexed escrowAddress,
        address indexed patient,
        address hospital
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only factory owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deploy a new MedTrustFundEscrow child contract.
     * @param patient         Patient wallet address (funds recipient)
     * @param hospital        Hospital wallet address (milestone confirmer)
     * @param descriptions    Milestone description strings
     * @param amounts         Milestone amounts in wei
     * @return escrowAddress  Address of the deployed escrow contract
     */
    function deployCampaign(
        address patient,
        address hospital,
        string[] calldata descriptions,
        uint256[] calldata amounts
    ) external onlyOwner returns (address escrowAddress) {
        require(patient != address(0), "Invalid patient address");
        require(hospital != address(0), "Invalid hospital address");
        require(descriptions.length > 0, "No milestones");
        require(descriptions.length == amounts.length, "Length mismatch");

        MedTrustFundEscrow escrow = new MedTrustFundEscrow(
            patient,
            hospital,
            descriptions,
            amounts
        );

        escrowAddress = address(escrow);

        campaigns.push(CampaignRecord({
            escrowAddress: escrowAddress,
            patient: patient,
            hospital: hospital,
            deployedAt: block.timestamp,
            active: true
        }));

        emit CampaignDeployed(campaigns.length - 1, escrowAddress, patient, hospital);
    }

    /**
     * @notice Get total number of campaigns deployed via this factory.
     */
    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /**
     * @notice Get all campaign records.
     */
    function getAllCampaigns() external view returns (CampaignRecord[] memory) {
        return campaigns;
    }
}
