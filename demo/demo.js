import Web3 from "web3";
import withHypermask from "./hypermask";
// import withHypermask from 'hypermask'

let query = {};
decodeURIComponent(location.search.slice(1))
    .split("&")
    .forEach(part => {
        query[part.split("=")[0]] = part.split("=")[1];
    });

let infuraProvider = new Web3.providers.HttpProvider(
    {
        mainnet: "https://mainnet.infura.io/CSnm7OOmCo4sNe6u3dIp",
        ropsten: "https://ropsten.infura.io/CSnm7OOmCo4sNe6u3dIp",
        rinkeby: "https://rinkeby.infura.io/CSnm7OOmCo4sNe6u3dIp",
        kovan: "https://kovan.infura.io/CSnm7OOmCo4sNe6u3dIp"
    }[query.chain || "ropsten"]
);

console.log("Query");
console.log(JSON.stringify(query, null, 2));

// let infuraProvider = new Web3.providers.HttpProvider("https://mainnet.infura.io/CSnm7OOmCo4sNe6u3dIp");
global.web3 = new Web3(
    withHypermask(
        infuraProvider,
        (query.local ? "http://localhost:41139/" : "https://hypermask.io/app") +
            (query.embed ? "?embed=" + query.embed : "")
    )
);

const ABI = [
    {
        constant: false,
        inputs: [
            { name: "x", type: "int32[]" },
            { name: "y", type: "int32[]" },
            { name: "value", type: "bytes1[]" }
        ],
        name: "WriteMulti",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "x", type: "int32" },
            { name: "y", type: "int32" },
            { name: "value", type: "bytes1" }
        ],
        name: "Write",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "tile_x", type: "int32" },
            { indexed: true, name: "tile_y", type: "int32" },
            { indexed: false, name: "x", type: "int32" },
            { indexed: false, name: "y", type: "int32" },
            { indexed: false, name: "value", type: "bytes1" }
        ],
        name: "PixelChange",
        type: "event"
    }
];
const ADDR = "0xbbc69cc6a8b97dd886acbd0c7d44be70bb24896c";

const EtherWorld = new web3.eth.Contract(ABI, ADDR, {});

function write_multi(xs, ys, chars) {
    return new Promise(async (resolve, reject) => {
        EtherWorld.methods
            .WriteMulti(xs, ys, chars)
            .send({
                from: (await web3.eth.getAccounts())[0],
                gasPrice: web3.utils.toWei(
                    (await (await fetch(
                        "https://ethgasstation.info/json/ethgasAPI.json"
                    )).json()).safeLow.toString(),
                    "gwei"
                )
            })
            .on("transactionHash", function(hash) {
                console.log("tx hash", hash);
                resolve(hash);
            })
            .on("receipt", function(receipt) {
                console.log("reciept", receipt);
            })
            .on("confirmation", function(confirmationNumber, receipt) {
                console.log("confirmed", confirmationNumber, receipt);
            })
            .on("error", function(err) {
                console.error(err);
                reject(err);
            });
    });
}

async function write_text_at_location(location, char) {
    const [x, y] = location;

    let result = await write_multi(
        [x],
        [y],
        ["0x" + (256 + char.charCodeAt(0)).toString(16).slice(-2)]
    );
    return result;
}

global.write_text_at_location = write_text_at_location;

import sigUtil from "eth-sig-util";
function signMsg(msgParams, from) {
    web3.currentProvider.sendAsync(
        {
            method: "eth_signTypedData",
            params: [msgParams, from],
            from: from
        },
        function(err, result) {
            if (err) return console.error(err);
            if (result.error) {
                return console.error(result.error.message);
            }
            const recovered = sigUtil.recoverTypedSignature({
                data: msgParams,
                sig: result.result
            });
            if (recovered.toLowerCase() === from.toLowerCase()) {
                console.log("Recovered signer: ", recovered, from);
            } else {
                console.log("Failed to verify signer, got: ", recovered, from);
            }
        }
    );
}

global.signMsg = signMsg;

function verifySig(data, sig) {
    var message = ethUtil.toBuffer(data);
    var msgHash = ethUtil.hashPersonalMessage(message);
    // Get the address of whoever signed this message
    var signature = ethUtil.toBuffer(sig);
    var sigParams = ethUtil.fromRpcSig(signature);
    var publicKey = ethUtil.ecrecover(
        msgHash,
        sigParams.v,
        sigParams.r,
        sigParams.s
    );
    var sender = ethUtil.publicToAddress(publicKey);
    var addr = ethUtil.bufferToHex(sender);
    // return owner === addr;
    return addr;
}

async function personalSignTest() {
    var data = web3.utils.toHex(
        "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America. \n\n\nWe the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America. We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America."
    );
    web3.currentProvider.sendAsync(
        {
            id: 1,
            method: "personal_sign",
            params: [data, await web3.eth.getCoinbase()]
        },
        function(err, result) {
            console.log(err, result);
        }
    );
}

document.getElementById("personal_sign").onclick = personalSignTest;

document.getElementById("sign_typed").onclick = async function() {
    const typedData = [
        {
            type: "string",
            name: "message",
            value: "Hi, Alice!"
        },
        {
            type: "uint",
            name: "value",
            value: 42
        }
    ];
    // const signature = await web3.eth.signTypedData(typedData);
    signMsg(typedData, await web3.eth.getCoinbase());
};

web3.eth
    .getGasPrice()
    .then(
        result =>
            (document.getElementById("gasPrice").innerText = web3.utils.fromWei(
                result,
                "Gwei"
            ))
    );

// console.log(web3)

document.getElementById("listAccounts").onclick = async function() {
    let accounts = await web3.eth.getAccounts();

    for (let i in accounts) {
        let address = accounts[i];
        accounts[i] = {
            address: address,
            balance: web3.utils.fromWei(await web3.eth.getBalance(address))
        };
    }

    document.getElementById("accounts").innerText = JSON.stringify(
        accounts,
        null,
        "  "
    );
};

document.getElementById("setPixel").onclick = async function() {
    write_text_at_location([4, 4], "#");
};

document.getElementById("sendMoney").onclick = async function() {
    let accounts = await web3.eth.getAccounts();
    console.log(accounts);
    web3.eth
        .sendTransaction({
            from: accounts[0],
            to: "0x8B4867203bb8e2e742E8C4Bed883faE5099C3665",
            value: web3.utils.toWei("0.3", "ether")
        })
        .on("transactionHash", e => console.log("tx hash", e))
        .on("receipt", e => console.log("receipt", e))
        .on("confirmation", e => console.log("confirmation", e))
        .on("error", e => console.error("error", e));
};
