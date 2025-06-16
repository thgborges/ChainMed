// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AggregatorV3Interface} from "lib/chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ChainlinkClient} from "lib/chainlink/contracts/src/v0.8/operatorforwarder/ChainlinkClient.sol";
import {ConfirmedOwner} from "lib/chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {Chainlink} from "lib/chainlink/contracts/src/v0.8/operatorforwarder/Chainlink.sol";

contract TuringRX is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;
    error OnlyDoctorCanRegister();
    error OnlyPatientCanRegister();
    error DoctorAlreadyRegistered();
    error CRMAlreadyRegistered();
    error NotRgisteredPatient();
    error CPFNotRegistered();
    error PatientIsRegistered();
    error PrescriptionDoesNotExist();
    error OnlyPatientCanShareTheirSubscription();
    error CanOnlyShareWithRegisteredDoctors();
    error NotAuthorizedToViewThisPrescription();
    error DoctorNotRegistered();
    error PatientNotRegistered();
    error DPSDoesNotExist();
    error OnlyThePatientCanShareTheirDPS();
    error InvalidRecipient();
    error NotAuthorizedToViewThisDPS();

    struct Doctor {
        string name;
        string crm;
        string specialty;
        bool isRegistered;
    }

    struct Patient {
        string name;
        string cpf;
        bool isRegistered;
    }

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

    struct SharedPrescription {
        uint256 prescriptionId;
        address sharedWith;
        uint256 timestamp;
    }

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

    struct SharedDPS {
        uint256 dpsId;
        address sharedWith; // i.e doctors and insurers
        uint256 timestamp;
    }

    mapping(address => Doctor) public s_doctors;
    mapping(address => Patient) public s_patients;
    mapping(string => bool) public s_usedCRMs;
    mapping(string => bool) public s_usedCPFs;
    mapping(uint256 => Prescription) public s_prescriptions;
    mapping(uint256 => SharedPrescription[]) public s_prescriptionShares;
    mapping(uint256 => DPS) public s_dpsRecords;
    mapping(uint256 => SharedDPS[]) public s_dpsShares;
    mapping(address => uint256[]) public s_patientsDps;
    mapping(bytes32 => uint256) public s_requestToDps;

    uint256 private s_prescriptionCounter = 0;
    uint256 private s_dpsCounter = 0;
    // Chainlink variables
    address private s_oracle;
    bytes32 private s_jobId;
    uint256 private s_fee;

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

    modifier onlyDoctor() {
        if (!s_doctors[msg.sender].isRegistered) revert OnlyDoctorCanRegister();
        _;
    }

    modifier onlyPatient() {
        if (!s_patients[msg.sender].isRegistered)
            revert OnlyPatientCanRegister();
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
        if (!s_doctors[msg.sender].isRegistered)
            revert DoctorAlreadyRegistered();
        if (!s_usedCRMs[_crm]) revert CRMAlreadyRegistered();

        s_doctors[msg.sender] = Doctor(_name, _crm, _specialty, true);
        s_usedCRMs[_crm] = true;

        emit DoctorRegistered(msg.sender, _name, _crm);
    }

    // Register a new patient
    function registerPatient(string memory _name, string memory _cpf) external {
        if (!s_patients[msg.sender].isRegistered) revert NotRgisteredPatient();

        if (!s_usedCPFs[_cpf]) revert CPFNotRegistered();

        s_patients[msg.sender] = Patient(_name, _cpf, true);
        s_usedCPFs[_cpf] = true;

        emit PatientRegistered(msg.sender, _name, _cpf);
    }

    // Create a new prescription
    function createPrescription(
        address _patientAddress,
        string memory _medication,
        string memory _dosage,
        string memory _instructions
    ) external onlyDoctor {
        if (s_patients[_patientAddress].isRegistered)
            revert PatientIsRegistered();

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
        if (!prescription.isValid) revert PrescriptionDoesNotExist();
        if (prescription.patient != msg.sender)
            revert OnlyPatientCanShareTheirSubscription();
        if (!s_doctors[_doctorAddress].isRegistered)
            revert CanOnlyShareWithRegisteredDoctors();

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
        if (!prescription.isValid) revert PrescriptionDoesNotExist();
        if (
            msg.sender != prescription.doctor ||
            msg.sender != prescription.patient ||
            !_isSharedWith(_prescriptionId, msg.sender)
        ) revert NotAuthorizedToViewThisPrescription();

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
            revert DoctorNotRegistered();
        return s_doctors[_doctorAddress];
    }

    // Get patient details
    function getPatientDetails(
        address _patientAddress
    ) external view returns (Patient memory) {
        if (!s_patients[_patientAddress].isRegistered)
            revert PatientNotRegistered();
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
        if (!dps.isValid) revert DPSDoesNotExist();
        if (dps.patient != msg.sender) revert OnlyThePatientCanShareTheirDPS();
        if (
            !s_doctors[_insurerOrDoctor].isRegistered ||
            !s_patients[_insurerOrDoctor].isRegistered
        ) revert InvalidRecipient();

        s_dpsShares[_dpsId].push(
            SharedDPS(_dpsId, _insurerOrDoctor, block.timestamp)
        );
        emit DPSShared(_dpsId, _insurerOrDoctor);
    }

    function getDPS(uint256 _dpsId) external view returns (DPS memory) {
        DPS memory dps = s_dpsRecords[_dpsId];
        if (!dps.isValid) revert DPSDoesNotExist();
        if (msg.sender != dps.patient || !_isDPSSharedWith(_dpsId, msg.sender))
            revert NotAuthorizedToViewThisDPS();
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
