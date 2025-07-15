import { BrowserProvider, Contract } from "ethers";
import contractABI from "./LendingContract.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const getContract = async () => {
  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return null;
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []); // 🟢 This avoids ENS error

  const signer = await provider.getSigner(); // ENS fails if MetaMask isn't connected
  return new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
};
