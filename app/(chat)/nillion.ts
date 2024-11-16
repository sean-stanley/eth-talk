const APP_ID = '38b3e7a9-2be3-4ea6-ba36-ade068661b4a';
const USER_SEED = 'manjik_bangkok'; // generates a deterministic nillion user id; use any string
const API_BASE = 'https://nillion-storage-apis-v0.onrender.com';


export const setToNillion = async (secretName: string, secretValue: string) => {
    // 2. Store first secret (number)
    console.log('\nStoring secret...');
    const storeResult1 = await fetch(`${API_BASE}/api/apps/${APP_ID}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: {
                nillion_seed: USER_SEED,
                secret_value: secretValue,
                secret_name: secretName,
            },
            permissions: {
                retrieve: [],
                update: [],
                delete: [],
                compute: {},
            },
        }),
    }).then((res) => res.json());
    console.log('First secret stored at:', storeResult1);
    return storeResult1;
}

//1a6d2498-9e4b-494a-9438-0fd65ae7cdf2
//my_secret_number
export const getFromNillion = async (storeId: string, secretName: string) => {
    console.log('\nRetrieving secrets...');
    const secret = await fetch(
        `${API_BASE}/api/secret/retrieve/${storeId}?retrieve_as_nillion_user_seed=${USER_SEED}&secret_name=${secretName}`
    ).then((res) => res.json());

    return secret;

}
