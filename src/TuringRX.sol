// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ChainlinkClient} from "@chainlink/contracts/src/v0.8/operatorforwarder/ChainlinkClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {Chainlink} from "@chainlink/contracts/src/v0.8/operatorforwarder/Chainlink.sol";

contract TuringRX is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    //////////////
    /// ERRORS ///
    //////////////
    /// @notice Thrown when a non-doctor attempts to register as a doctor.
    error TuringRX__OnlyDoctorCanRegister();

    /// @notice Thrown when a non-patient attempts to register as a patient.
    error TuringRX__OnlyPatientCanRegister();

    /// @notice Thrown when a doctor attempts to register more than once/has already registered.
    error TuringRX__DoctorAlreadyRegistered();

    /// @notice Thrown when a CRM (Conselho Regional de Medicina) number is already registered.
    error TuringRX__CRMAlreadyRegistered();

    /// @notice Thrown when a patient attempts to register more than once/patient has already registered.
    error TuringRX__PatientIsAlreadyRegistered();

    /// @notice Thrown when attempting to access a non-existent prescription.
    error TuringRX__PrescriptionDoesNotExist();

    /// @notice Thrown when a non-patient attempts to share prescription.
    error TuringRX__OnlyPatientCanShareTheirSubscription();

    /// @notice Thrown when attempting to share a prescription with an unregistered doctor.
    error TuringRX__CanOnlyShareWithRegisteredDoctors();

    /// @notice Thrown when non-authorized(i.e !patient, !doctor, !sharewithInsurer) user wants to view prescription.
    error TuringRX__NotAuthorizedToViewThisPrescription();

    /// @notice Thrown when doctor is not registered.
    error TuringRX__DoctorNotRegistered();

    /// @notice Thrown when patient is not registered.
    error TuringRX__PatientNotRegistered();

    /// @notice Thrown when the Personal health declaration (DPS) does not exist
    error TuringRX__DPSDoesNotExist();

    /// @notice Thrown when Only the patient can share their Personal health declaration
    error TuringRX__OnlyThePatientCanShareTheirDPS();

    /// @notice Thrown when not authorized paties wants to access DPS
    error TuringRX__InvalidRecipient();

    /// @notice Thrown when not authorized users wants to view personal health declaration
    error TuringRX__NotAuthorizedToViewThisDPS();

    /// @notice Thrown when InsurerAlreadyRegistered
    error TuringRX__InsurerAlreadyRegistered();

    /// @notice Thrown when CNPJAlreadyRegistered
    error TuringRX__CNPJAlreadyRegistered();

    /// @notice Thrown when patient has already registered
    error TuringRX__PatientAlreadyRegistered();

    /// @notice Thrown when CPF is already registered
    error TuringRX__CPFAlreadyRegistered();

    ////////////////////
    /// CUSTOM TYPES ///
    ////////////////////
    ///@notice Struct to track info about doctors
    struct Doctor {
        string name;
        string crm;
        string specialty;
        bool isRegistered;
    }

    Doctor public s_doctor = Doctor("", "", "", true);

    ///@notice Struct to track info about patient
    struct Patient {
        string name;
        string cpf;
        bool isRegistered;
    }

    Patient public s_patient = Patient("", "", true);

    ///@notice Struct to track info about prescription
    struct Prescription {
        uint256 id;
        address doctor;
        address patient;
        string medication;
        string dosage;
        string instructions;
        uint256 timestamp;
        bool isValid;
    }

    Prescription public s_prescription =
        Prescription(0, address(0), address(0), "", "", "", 0, true);

    ///@notice Struct to track info about SharedPrescrition
    struct SharedPrescription {
        uint256 prescriptionId;
        address sharedWith;
        uint256 timestamp;
    }

    SharedPrescription public s_shareprescription =
        SharedPrescription(0, address(0), 0);

    ///@notice Struct to track info about Personal Health declaration (DPS)
    struct DPS {
        uint256 id;
        address patient;
        bytes32 dpsHash; // Encrypted Hash
        string ipfsCID;
        uint256 timestamp;
        bool isValid;
        bool isValidated;
        bool sharedWithInsurer;
    }

    DPS public s_dps =
        DPS(0, address(0), bytes32(0), "", 0, true, false, false);

    /// @notice Struct to track info about Shared Personal Health declaration (DPS)
    struct SharedDPS {
        uint256 dpsId;
        address sharedWith; // i.e doctors and insurers
        uint256 timestamp;
    }

    SharedDPS public sharedDPS = SharedDPS(0, address(0), 0);

    /// @notice Struct to track the info of Insurers
    struct Insurers {
        string name;
        string cnpj;
        bool isRegistered;
    }

    Insurers public insurers = Insurers("", "", true);

    /// @notice Mapping to store each doctor's details associated with their addresses
    mapping(address => Doctor) public s_doctors;
    /// @notice Mapping to store each patient's details associated with their addresses
    mapping(address => Patient) public s_patients;
    /// @notice Mapping to track registered CRM to ensure their uniqueness and maps string to bool indicating their registration status
    mapping(string => bool) public s_registeredCRMs;
    /// @notice Mapping to track registered CPFs to ensure their uniqueness and maps string to bool indicating their registration status
    mapping(string => bool) public s_registeredCPFs;
    /// @notice Mapping to store each prescription associated with an ID.
    mapping(uint256 => Prescription) public s_prescriptions;
    /// @notice Maps an array of sharedprescription to an ID to keep track of shared prescription records for access control
    mapping(uint256 => SharedPrescription[]) public s_prescriptionShares;
    /// @notice Mapping to store DPS details with a unique ID
    mapping(uint256 => DPS) public s_dpsRecords;
    /// @notice Maps an array of sharedDPS to an ID to keep track of shared DPS records for access control
    mapping(uint256 => SharedDPS[]) public s_dpsShares;
    /// @notice Maps a patient’s Ethereum address to an array of DPS IDs, tracking all DPS records associated with a patient.
    mapping(address => uint256[]) public s_patientsDps;
    /// @notice Maps a request hash (bytes32) to a DPS ID, linking data requests to their corresponding DPS records.
    mapping(bytes32 => uint256) public s_requestToDps;
    /// @notice Mapping to store each insurer details with their associated addresses
    mapping(address => Insurers) public s_insurers;
    /// @notice Mapping to track registered cnpj to ensure uniqueness and maps string to bool indicating their registration status
    mapping(string => bool) public s_registeredCNPJ;

    ///////////////////////
    /// STATE VARIABLES ///
    ///////////////////////
    uint256 private s_prescriptionCounter = 0;
    uint256 private s_dpsCounter = 0;
    // Chainlink variables
    address private s_oracle;
    bytes32 private s_jobId;
    uint256 private s_fee;

    //////////////
    /// EVENTS ///
    //////////////
    event DoctorRegistered(
        address indexed doctorAddress,
        string name,
        string crm
    );
    event PatientRegistered(
        address indexed patientAddress,
        string name,
        string cpf
    );
    event PrescriptionCreated(
        uint256 indexed prescriptionId,
        address indexed doctor,
        address indexed patient
    );
    event PrescriptionShared(
        uint256 indexed prescriptionId,
        address indexed sharedWith
    );
    event DPSCreated(
        uint256 indexed dpsId,
        address indexed patient,
        bytes32 dpsHash,
        string ipfsCID
    );
    event DPSShared(uint256 indexed dpsId, address indexed shareWith);
    event DPSValidated(uint256 indexed dpsId, bool isValidated);
    event InsurerRegistered(
        address indexed insurer,
        string indexed name,
        string cnpj
    );

    modifier onlyDoctor() {
        if (!s_doctors[msg.sender].isRegistered)
            revert TuringRX__OnlyDoctorCanRegister();
        _;
    }

    modifier onlyPatient() {
        if (!s_patients[msg.sender].isRegistered)
            revert TuringRX__OnlyPatientCanRegister();
        _;
    }

    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) ConfirmedOwner(msg.sender) {
        _setChainlinkToken(_link);
        s_oracle = _oracle;
        s_jobId = _jobId;
        s_fee = _fee;
    }

    // Register a new doctor
    function registerDoctor(
        string memory _name,
        string memory _crm,
        string memory _specialty
    ) external {
        if (s_doctors[msg.sender].isRegistered)
            revert TuringRX__DoctorAlreadyRegistered();
        if (s_registeredCRMs[_crm]) revert TuringRX__CRMAlreadyRegistered();

        s_doctors[msg.sender] = Doctor(_name, _crm, _specialty, true);
        s_registeredCRMs[_crm] = true;

        emit DoctorRegistered(msg.sender, _name, _crm);
    }

    // Register a new patient
    function registerPatient(string memory _name, string memory _cpf) external {
        if (s_patients[msg.sender].isRegistered)
            revert TuringRX__PatientAlreadyRegistered();

        if (s_registeredCPFs[_cpf]) revert TuringRX__CPFAlreadyRegistered();

        s_patients[msg.sender] = Patient(_name, _cpf, true);
        s_registeredCPFs[_cpf] = true;

        emit PatientRegistered(msg.sender, _name, _cpf);
    }

    // Register insurers
    function registerInsurers(
        string memory _name,
        string memory _cnpj
    ) external {
        if (s_insurers[msg.sender].isRegistered)
            revert TuringRX__InsurerAlreadyRegistered();

        if (s_registeredCNPJ[_cnpj]) revert TuringRX__CNPJAlreadyRegistered();

        s_insurers[msg.sender] = Insurers(_name, _cnpj, true);
        s_registeredCNPJ[_cnpj] = true;

        emit InsurerRegistered(msg.sender, _name, _cnpj);
    }

    // Create a new prescription
    function createPrescription(
        address _patientAddress,
        string memory _medication,
        string memory _dosage,
        string memory _instructions
    ) external onlyDoctor {
        uint256 prescriptionId = s_prescriptionCounter++;
        s_prescriptions[prescriptionId] = Prescription(
            prescriptionId,
            msg.sender,
            _patientAddress,
            _medication,
            _dosage,
            _instructions,
            block.timestamp,
            true
        );

        emit PrescriptionCreated(prescriptionId, msg.sender, _patientAddress);
    }

    // Share a prescription with another doctor
    function sharePrescription(
        uint256 _prescriptionId,
        address _doctorAddress
    ) external {
        Prescription memory prescription = s_prescriptions[_prescriptionId];
        if (!prescription.isValid) revert TuringRX__PrescriptionDoesNotExist();
        if (prescription.patient != msg.sender)
            revert TuringRX__OnlyPatientCanShareTheirSubscription();
        if (!s_doctors[_doctorAddress].isRegistered)
            revert TuringRX__CanOnlyShareWithRegisteredDoctors();

        s_prescriptionShares[_prescriptionId].push(
            SharedPrescription(_prescriptionId, _doctorAddress, block.timestamp)
        );

        emit PrescriptionShared(_prescriptionId, _doctorAddress);
    }

    // Get prescription details
    function getPrescription(
        uint256 _prescriptionId
    ) external view returns (Prescription memory) {
        Prescription memory prescription = s_prescriptions[_prescriptionId];
        if (!prescription.isValid) revert TuringRX__PrescriptionDoesNotExist();
        if (
            msg.sender != prescription.doctor ||
            msg.sender != prescription.patient ||
            !_isSharedWith(_prescriptionId, msg.sender)
        ) revert TuringRX__NotAuthorizedToViewThisPrescription();

        return prescription;
    }

    // Check if prescription is shared with an address
    function _isSharedWith(
        uint256 _prescriptionId,
        address _address
    ) internal view returns (bool) {
        SharedPrescription[] memory shares = s_prescriptionShares[
            _prescriptionId
        ];
        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _address) {
                return true;
            }
        }
        return false;
    }

    // Get doctor details
    function getDoctorDetails(
        address _doctorAddress
    ) external view returns (Doctor memory) {
        if (!s_doctors[_doctorAddress].isRegistered)
            revert TuringRX__DoctorNotRegistered();
        return s_doctors[_doctorAddress];
    }

    // Get patient details
    function getPatientDetails(
        address _patientAddress
    ) external view returns (Patient memory) {
        if (!s_patients[_patientAddress].isRegistered)
            revert TuringRX__PatientNotRegistered();
        return s_patients[_patientAddress];
    }

    // Check if an address is registered as a doctor
    function isDoctor(address _address) external view returns (bool) {
        return s_doctors[_address].isRegistered;
    }

    // Check if an address is registered as a patient
    function isPatient(address _address) external view returns (bool) {
        return s_patients[_address].isRegistered;
    }

    function submitDPS(
        bytes32 _dpsHash,
        string memory _ipfsCID
    ) external onlyPatient {
        uint256 dpsId = s_dpsCounter++;
        s_dpsRecords[dpsId] = DPS(
            dpsId,
            msg.sender,
            _dpsHash,
            _ipfsCID,
            block.timestamp,
            false, // set to false until validated
            false,
            false
        );
        _requestDPSValidation(dpsId);
        s_patientsDps[msg.sender].push(dpsId);
        emit DPSCreated(dpsId, msg.sender, _dpsHash, _ipfsCID);
    }

    function _requestDPSValidation(
        uint256 _dpsId
    ) internal returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            s_jobId,
            address(this),
            this.fulfillDPSValidation.selector
        );

        // validate the patient's age from an external API
        string memory cpf = s_patients[msg.sender].cpf;
        req._add(
            "get",
            string(
                abi.encodePacked("https://api.jumio.com/validate-age?cpf=", cpf)
            )
        );
        req._add("path", "age-valid");
        req._addInt("dpsId", int256(_dpsId));

        requestId = _sendChainlinkRequestTo(s_oracle, req, s_fee);
        s_requestToDps[requestId] = _dpsId;
        return requestId;
    }

    function fulfillDPSValidation(
        bytes32 _requestId,
        bool _isValid
    ) public recordChainlinkFulfillment(_requestId) {
        uint256 dpsId = s_requestToDps[_requestId];
        s_dpsRecords[dpsId].isValidated = _isValid;
        if (_isValid == true) {
            s_dpsRecords[dpsId].isValid = true; // Only sets to true if validated.
        }
        emit DPSValidated(dpsId, _isValid);
    }

    function grantAccess(
        uint256 _dpsId,
        address _insurerOrDoctor
    ) external onlyPatient {
        DPS memory dps = s_dpsRecords[_dpsId];
        if (!dps.isValid) revert TuringRX__DPSDoesNotExist();
        if (dps.patient != msg.sender)
            revert TuringRX__OnlyThePatientCanShareTheirDPS();
        if (
            !s_doctors[_insurerOrDoctor].isRegistered ||
            !s_insurers[_insurerOrDoctor].isRegistered
        ) revert TuringRX__InvalidRecipient();

        s_dpsShares[_dpsId].push(
            SharedDPS(_dpsId, _insurerOrDoctor, block.timestamp)
        );
        emit DPSShared(_dpsId, _insurerOrDoctor);
    }

    function getDPS(uint256 _dpsId) external view returns (DPS memory) {
        DPS memory dps = s_dpsRecords[_dpsId];
        if (!dps.isValid) revert TuringRX__DPSDoesNotExist();
        if (msg.sender != dps.patient || !_isDPSSharedWith(_dpsId, msg.sender))
            revert TuringRX__NotAuthorizedToViewThisDPS();
        return dps;
    }

    function _isDPSSharedWith(
        uint256 _dpsId,
        address _address
    ) internal view returns (bool) {
        SharedDPS[] memory shares = s_dpsShares[_dpsId];
        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _address) {
                return true;
            }
        }
        return false;
    }
}
