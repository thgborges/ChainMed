import { ethers } from "ethers";
import { toast } from "@/components/ui/sonner";

// Endereço do contrato na rede Sepolia
export const CONTRACT_ADDRESS = "0xD78f5D898Fb070D798edCC6Ca6d386aF9c1c90d3";

// ABI do contrato ChainMed
export const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "doctorAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "crm",
				"type": "string"
			}
		],
		"name": "DoctorRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "patientAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "cpf",
				"type": "string"
			}
		],
		"name": "PatientRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "prescriptionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			}
		],
		"name": "PrescriptionCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "prescriptionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sharedWith",
				"type": "address"
			}
		],
		"name": "PrescriptionShared",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_patientAddress",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_medication",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_dosage",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_instructions",
				"type": "string"
			}
		],
		"name": "createPrescription",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "doctors",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "crm",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "specialty",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_doctorAddress",
				"type": "address"
			}
		],
		"name": "getDoctorDetails",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "crm",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "specialty",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "isRegistered",
						"type": "bool"
					}
				],
				"internalType": "struct ChainMed.Doctor",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_patientAddress",
				"type": "address"
			}
		],
		"name": "getPatientDetails",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "cpf",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "isRegistered",
						"type": "bool"
					}
				],
				"internalType": "struct ChainMed.Patient",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_prescriptionId",
				"type": "uint256"
			}
		],
		"name": "getPrescription",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "doctor",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "patient",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "medication",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "dosage",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "instructions",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isValid",
						"type": "bool"
					}
				],
				"internalType": "struct ChainMed.Prescription",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "isDoctor",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "isPatient",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "patients",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "cpf",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "prescriptionShares",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "prescriptionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "sharedWith",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "prescriptions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "medication",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "dosage",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "instructions",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_crm",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_specialty",
				"type": "string"
			}
		],
		"name": "registerDoctor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_cpf",
				"type": "string"
			}
		],
		"name": "registerPatient",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_prescriptionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_doctorAddress",
				"type": "address"
			}
		],
		"name": "sharePrescription",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usedCPFs",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usedCRMs",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export interface Web3Account {
  address: string;
  balance: string;
}

export interface Doctor {
  address: string;
  name: string;
  crm: string;
  specialty: string;
  isRegistered: boolean;
}

export interface Patient {
  address: string;
  name: string;
  cpf: string;
  isRegistered: boolean;
}

export interface Prescription {
  id: number;
  doctor: string;
  patient: string;
  medication: string;
  dosage: string;
  instructions: string;
  timestamp: number;
  isValid: boolean;
}

export interface PrescriptionShare {
  prescriptionId: number;
  sharedWith: string;
  timestamp: number;
}

// Função para obter o contrato
export const getContract = () => {
  if (!isMetaMaskInstalled()) {
    toast.error("Por favor, instale a MetaMask para usar este aplicativo");
    return null;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Connect to MetaMask
export const connectWallet = async (): Promise<Web3Account | null> => {
  if (!isMetaMaskInstalled()) {
    toast.error("Por favor, instale a MetaMask para usar este aplicativo");
    window.open("https://metamask.io/download/", "_blank");
    return null;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Check if the connected network is Sepolia (chainId 0xaa36a7)
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0xaa36a7') {
      // Request to switch to Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      } catch (switchError: any) {
        // This error code means that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://rpc.sepolia.org'],
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'SEP',
                    decimals: 18
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                },
              ],
            });
          } catch (addError) {
            toast.error("Não foi possível adicionar a rede Sepolia");
            return null;
          }
        } else {
          toast.error("Não foi possível mudar para a rede Sepolia");
          return null;
        }
      }
    }

    // Get account balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });

    // Return the first account and its balance
    return {
      address: accounts[0],
      balance: parseInt(balance, 16).toString(),
    };
  } catch (error) {
    console.error("Error connecting to MetaMask", error);
    toast.error("Erro ao conectar com a MetaMask");
    return null;
  }
};

// Verificar se o endereço é de um médico registrado
export const checkIsDoctor = async (address: string): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    return await contract.isDoctor(address);
  } catch (error) {
    console.error("Erro ao verificar se é médico:", error);
    return false;
  }
};

// Verificar se o endereço é de um paciente registrado
export const checkIsPatient = async (address: string): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    return await contract.isPatient(address);
  } catch (error) {
    console.error("Erro ao verificar se é paciente:", error);
    return false;
  }
};

// Verificar o tipo de usuário (médico, paciente ou não registrado)
export const checkUserType = async (address: string): Promise<'doctor' | 'patient' | null> => {
  try {
    const isDoctor = await checkIsDoctor(address);
    if (isDoctor) return 'doctor';
    
    const isPatient = await checkIsPatient(address);
    if (isPatient) return 'patient';
    
    return null;
  } catch (error) {
    console.error("Erro ao verificar tipo de usuário:", error);
    return null;
  }
};

// Registrar um novo médico
export const registerDoctor = async (
  name: string,
  crm: string,
  specialty: string
): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    const tx = await contract.registerDoctor(name, crm, specialty);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar médico:", error);
    toast.error("Erro ao registrar médico no contrato");
    return false;
  }
};

// Registrar um novo paciente
export const registerPatient = async (
  name: string,
  cpf: string
): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    const tx = await contract.registerPatient(name, cpf);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar paciente:", error);
    toast.error("Erro ao registrar paciente no contrato");
    return false;
  }
};

// Obter detalhes de um médico
export const getDoctorDetails = async (address: string): Promise<Doctor | null> => {
  try {
    const contract = getContract();
    if (!contract) return null;
    
    const doctor = await contract.getDoctorDetails(address);
    return {
      address,
      name: doctor[0],
      crm: doctor[1],
      specialty: doctor[2],
      isRegistered: doctor[3]
    };
  } catch (error) {
    console.error("Erro ao obter detalhes do médico:", error);
    return null;
  }
};

// Obter detalhes de um paciente
export const getPatientDetails = async (address: string): Promise<Patient | null> => {
  try {
    const contract = getContract();
    if (!contract) return null;
    
    const patient = await contract.getPatientDetails(address);
    return {
      address,
      name: patient[0],
      cpf: patient[1],
      isRegistered: patient[2]
    };
  } catch (error) {
    console.error("Erro ao obter detalhes do paciente:", error);
    return null;
  }
};

// Buscar médico por CRM
export const findDoctorByCRM = async (crm: string): Promise<Doctor | null> => {
  try {
    // Não há uma função direta no contrato para buscar por CRM
    // Precisamos implementar uma solução alternativa
    
    // Verificar se o CRM está no formato correto
    if (!crm || crm.trim() === '') {
      return null;
    }
    
    // Buscar todos os médicos registrados
    const doctors = await getAllDoctors();
    
    // Encontrar o médico com o CRM correspondente
    const doctor = doctors.find(doc => doc.crm.toLowerCase() === crm.toLowerCase());
    
    return doctor || null;
  } catch (error) {
    console.error("Erro ao buscar médico por CRM:", error);
    return null;
  }
};

// Criar uma nova prescrição
export const createPrescription = async (
  patientAddress: string,
  medication: string,
  dosage: string,
  instructions: string
): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    const tx = await contract.createPrescription(
      patientAddress,
      medication,
      dosage,
      instructions
    );
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Erro ao criar prescrição:", error);
    toast.error("Erro ao criar prescrição no contrato");
    return false;
  }
};

// Compartilhar uma prescrição com um médico
export const sharePrescription = async (
  prescriptionId: number,
  doctorAddress: string
): Promise<boolean> => {
  try {
    const contract = getContract();
    if (!contract) return false;
    
    const tx = await contract.sharePrescription(prescriptionId, doctorAddress);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Erro ao compartilhar prescrição:", error);
    toast.error("Erro ao compartilhar prescrição no contrato");
    return false;
	
  }
};

// Obter detalhes de uma prescrição
export const getPrescription = async (id: number): Promise<Prescription | null> => {
  try {
    const contract = getContract();
    if (!contract) return null;
    
    const prescription = await contract.getPrescription(id);
    return {
      id: prescription[0].toNumber(),
      doctor: prescription[1],
      patient: prescription[2],
      medication: prescription[3],
      dosage: prescription[4],
      instructions: prescription[5],
      timestamp: prescription[6].toNumber(),
      isValid: prescription[7]
    };
  } catch (error) {
    console.error("Erro ao obter prescrição:", error);
    return null;
  }
};

// Obter todas as prescrições de um paciente
export const getPatientPrescriptions = async (patientAddress: string): Promise<Prescription[]> => {
  try {
    const contract = getContract();
    if (!contract) return [];
    
    // Não há uma função direta no contrato para buscar prescrições por paciente
    // Precisamos implementar uma solução alternativa
    
    // Buscar eventos de criação de prescrição para o paciente
    const filter = contract.filters.PrescriptionCreated(null, null, patientAddress);
    const events = await contract.queryFilter(filter);
    
    // Obter detalhes de cada prescrição
    const prescriptions: Prescription[] = [];
    for (const event of events) {
      const prescriptionId = event.args?.prescriptionId.toNumber();
      const prescription = await getPrescription(prescriptionId);
      if (prescription && prescription.isValid) {
        prescriptions.push(prescription);
      }
    }
    
    return prescriptions;
  } catch (error) {
    console.error("Erro ao obter prescrições do paciente:", error);
    return [];
  }
};

// Obter todas as prescrições criadas por um médico
export const getDoctorPrescriptions = async (doctorAddress: string): Promise<Prescription[]> => {
  try {
    const contract = getContract();
    if (!contract) return [];
    
    // Buscar eventos de criação de prescrição pelo médico
    const filter = contract.filters.PrescriptionCreated(null, doctorAddress);
    const events = await contract.queryFilter(filter);
    
    // Obter detalhes de cada prescrição
    const prescriptions: Prescription[] = [];
    for (const event of events) {
      const prescriptionId = event.args?.prescriptionId.toNumber();
      const prescription = await getPrescription(prescriptionId);
      if (prescription && prescription.isValid) {
        prescriptions.push(prescription);
      }
    }
    
    return prescriptions;
  } catch (error) {
    console.error("Erro ao obter prescrições do médico:", error);
    return [];
  }
};

// Obter todas as prescrições compartilhadas com um médico
export const getSharedPrescriptions = async (doctorAddress: string): Promise<Prescription[]> => {
  try {
    const contract = getContract();
    if (!contract) return [];
    
    // Buscar eventos de compartilhamento de prescrição com o médico
    const filter = contract.filters.PrescriptionShared(null, doctorAddress);
    const events = await contract.queryFilter(filter);
    
    // Obter detalhes de cada prescrição compartilhada
    const prescriptions: Prescription[] = [];
    for (const event of events) {
      const prescriptionId = event.args?.prescriptionId.toNumber();
      const prescription = await getPrescription(prescriptionId);
      if (prescription && prescription.isValid) {
        prescriptions.push(prescription);
      }
    }
    
    return prescriptions;
  } catch (error) {
    console.error("Erro ao obter prescrições compartilhadas:", error);
    return [];
  }
};

// Gerar QR Code para uma prescrição
export const generatePrescriptionQRCode = async (prescriptionId: number): Promise<string> => {
  try {
    const prescription = await getPrescription(prescriptionId);
    if (!prescription) {
      throw new Error("Prescrição não encontrada");
    }
    
    // Obter detalhes do médico e paciente
    const doctor = await getDoctorDetails(prescription.doctor);
    const patient = await getPatientDetails(prescription.patient);
    
    if (!doctor || !patient) {
      throw new Error("Detalhes do médico ou paciente não encontrados");
    }
    
    // Criar objeto com dados da prescrição para o QR Code
    const qrData = {
      id: prescription.id,
      patient: {
        name: patient.name,
        cpf: patient.cpf
      },
      doctor: {
        name: doctor.name,
        crm: doctor.crm,
        specialty: doctor.specialty
      },
      medication: prescription.medication,
      dosage: prescription.dosage,
      instructions: prescription.instructions,
      date: new Date(prescription.timestamp * 1000).toISOString(),
      valid: prescription.isValid
    };
    
    // Retornar string JSON para o QR Code
    return JSON.stringify(qrData);
  } catch (error) {
    console.error("Erro ao gerar QR Code:", error);
    throw error;
  }
};

// Obter todos os médicos registrados
export const getAllDoctors = async (): Promise<Doctor[]> => {
  try {
    const contract = getContract();
    if (!contract) return [];
    
    // Buscar eventos de registro de médicos
    const filter = contract.filters.DoctorRegistered();
    const events = await contract.queryFilter(filter);
    
    // Obter detalhes de cada médico
    const doctors: Doctor[] = [];
    for (const event of events) {
      const doctorAddress = event.args?.doctorAddress;
      const doctor = await getDoctorDetails(doctorAddress);
      if (doctor && doctor.isRegistered) {
        doctors.push(doctor);
      }
    }
    
    return doctors;
  } catch (error) {
    console.error("Erro ao obter todos os médicos:", error);
    return [];
  }
};

// Obter todos os pacientes registrados
export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    const contract = getContract();
    if (!contract) return [];
    
    // Buscar eventos de registro de pacientes
    const filter = contract.filters.PatientRegistered();
    const events = await contract.queryFilter(filter);
    
    // Obter detalhes de cada paciente
    const patients: Patient[] = [];
    for (const event of events) {
      const patientAddress = event.args?.patientAddress;
      const patient = await getPatientDetails(patientAddress);
      if (patient && patient.isRegistered) {
        patients.push(patient);
      }
    }
    
    return patients;
  } catch (error) {
    console.error("Erro ao obter todos os pacientes:", error);
    return [];
  }
};
