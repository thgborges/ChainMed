// validate-age.js

// Args[0] should be the CPF passed into the Chainlink request
const cpf = args[0];

const response = await Functions.makkHttpRequest({
    url: `https://chainlink.orakl.network/api/age?cpf=%{cpf}`,
});

if (!response || response.error) {
    throw Error("API request failed or returned error.");
}

// Returns a boolean (true if age is valid, false otherwise)
return Functions.encodeBoolean(response.data.age_valid);