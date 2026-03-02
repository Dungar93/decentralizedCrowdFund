async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const MedTrustFundEscrow =
    await ethers.getContractFactory("MedTrustFundEscrow");
  const contract = await MedTrustFundEscrow.deploy(
    "0xPatientAddressHere",
    "0xHospitalAddressHere",
    ["Diagnosis & Admission", "Surgery Completed", "Discharge"],
    [
      ethers.parseEther("0.5"),
      ethers.parseEther("1"),
      ethers.parseEther("0.5"),
    ],
  );

  await contract.waitForDeployment();
  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch(console.error);
