// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract TuringRX is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    /////////////////
    // ERROR CODES //
    /////////////////
    error TuringRX__OnlyPatientCanRegister();
    error TuringRX__PatientAlreadyRegistered();
    error TuringRX__CPFAlreadyRegistered();
    error TuringRX__InvalidRequestID();
    error TuringRX__DPSDoesNotExist();
    error TuringRX__NotAuthorizedToViewThisDPS();

    /////////////////////
    // DATA STRUCTURES //
    /////////////////////
    struct Patient {
        string name;
        string cpf;
        bool isRegistered;
    }

    struct DPS {
        uint256 id;
        address patient;
        bytes32 dpsHash;
        string ipfsCID;
        uint256 timestamp;
        bool isValid;
        bool isValidated;
        bool sharedWithInsurer;
    }

    struct SharedDPS {
        uint256 dpsId;
        address sharedWith;
        uint256 timestamp;
    }

    //////////////////
    // STATE VARS //
    //////////////////
    uint256 public s_dpsCounter;
    uint64 public i_subscriptionId;
    bytes32 public i_donId;

    mapping(address => Patient) public s_patients;
    mapping(string => bool) public s_registeredCPFs;
    mapping(uint256 => DPS) public s_dpsRecords;
    mapping(uint256 => SharedDPS[]) public s_dpsShares;
    mapping(address => uint256[]) public s_patientsDps;
    mapping(bytes32 => uint256) public s_requestToDps;

    //////////////////
    // EVENTS //
    //////////////////
    event PatientRegistered(address indexed patient, string name, string cpf);
    event DPSCreated(
        uint256 indexed dpsId,
        address indexed patient,
        bytes32 dpsHash,
        string ipfsCID
    );
    event DPSValidated(uint256 indexed dpsId, bool isValidated);
    event DPSShared(uint256 indexed dpsId, address indexed shareWith);

    ///////////////
    // MODIFIERS //
    ///////////////
    modifier onlyPatient() {
        if (!s_patients[msg.sender].isRegistered)
            revert TuringRX__OnlyPatientCanRegister();
        _;
    }

    ////////////////////
    // INITIALIZATION //
    ////////////////////
    constructor(
        address router,
        uint64 subscriptionId,
        bytes32 donId
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        i_subscriptionId = subscriptionId;
        i_donId = donId;
    }

    /////////////////////
    // REGISTER PATIENT //
    /////////////////////
    function registerPatient(string memory _name, string memory _cpf) external {
        if (s_patients[msg.sender].isRegistered)
            revert TuringRX__PatientAlreadyRegistered();
        if (s_registeredCPFs[_cpf]) revert TuringRX__CPFAlreadyRegistered();

        s_patients[msg.sender] = Patient(_name, _cpf, true);
        s_registeredCPFs[_cpf] = true;

        emit PatientRegistered(msg.sender, _name, _cpf);
    }

    ////////////////////
    // SUBMIT DPS //
    ////////////////////
    function submitDPS(
        bytes32 _dpsHash,
        string memory _ipfsCID
    ) external onlyPatient returns (bytes32 requestId) {
        // Step 1: Store the DPS record
        uint256 dpsId = s_dpsCounter++;
        s_dpsRecords[dpsId] = DPS({
            id: dpsId,
            patient: msg.sender,
            dpsHash: _dpsHash,
            ipfsCID: _ipfsCID,
            timestamp: block.timestamp,
            isValid: false,
            isValidated: false,
            sharedWithInsurer: false
        });
        s_patientsDps[msg.sender].push(dpsId);
        emit DPSCreated(dpsId, msg.sender, _dpsHash, _ipfsCID);

        // Step 2: Build the Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(
            string(
                abi.encodePacked(
                    "const cpf = args[0];",
                    "const response = await Functions.makeHttpRequest({",
                    "url: `https://chainlink.orakl.network/api/age?cpf=${cpf}`",
                    "});",
                    "if (!response || response.error) throw Error('API Error');",
                    "return Functions.encodeBoolean(response.data.age_valid);"
                )
            )
        );

        string[] memory args = new string[](1);
        args[0] = s_patients[msg.sender].cpf;
        req.setArgs(args);

        // Step 3: Send the request
        requestId = _sendRequest(
            req.encodeCBOR(),
            i_subscriptionId,
            40000, // callbackGasLimit
            i_donId
        );
        s_requestToDps[requestId] = dpsId;
        return requestId;
    }

    /////////////////////////
    // FULFILL CHAINLINK CALLBACK //
    /////////////////////////
    function _fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory /* err */
    ) internal override {
        uint256 dpsId = s_requestToDps[requestId];
        if (dpsId >= s_dpsCounter) revert TuringRX__InvalidRequestID();

        bool isValid = abi.decode(response, (bool));
        s_dpsRecords[dpsId].isValidated = true;
        s_dpsRecords[dpsId].isValid = isValid;

        emit DPSValidated(dpsId, isValid);
    }

    ////////////////////
    // ACCESS & VIEW //
    ////////////////////
    function getDPS(uint256 _dpsId) external view returns (DPS memory) {
        DPS memory dps = s_dpsRecords[_dpsId];
        if (!dps.isValid) revert TuringRX__DPSDoesNotExist();
        if (
            msg.sender != dps.patient && !_isDPSSharedWith(_dpsId, msg.sender)
        ) {
            revert TuringRX__NotAuthorizedToViewThisDPS();
        }
        return dps;
    }

    function grantAccess(
        uint256 _dpsId,
        address _recipient
    ) external onlyPatient {
        DPS memory dps = s_dpsRecords[_dpsId];
        if (!dps.isValid) revert TuringRX__DPSDoesNotExist();

        s_dpsShares[_dpsId].push(
            SharedDPS({
                dpsId: _dpsId,
                sharedWith: _recipient,
                timestamp: block.timestamp
            })
        );

        emit DPSShared(_dpsId, _recipient);
    }

    function _isDPSSharedWith(
        uint256 _dpsId,
        address _addr
    ) internal view returns (bool) {
        SharedDPS[] memory shares = s_dpsShares[_dpsId];
        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _addr) return true;
        }
        return false;
    }
}
