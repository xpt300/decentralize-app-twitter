import React, { Fragment, useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'
import moment from 'moment';

export default function App() {
  const [inputFocus, setInputFocus] = useState(false)
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);

  const contractABI = abi.abi;

  const contractAddress = "0x183361c097b7F086996f0aaCACBF4265BD82dD4F";

  const checkIfWalletIsConnected = async () => {

    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        getAllWaves()
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

    /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 })
        setMessage("")
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
}

const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);


                /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  console.log(currentAccount)

  return (
    <div className="mainContainer">

      <div className="dataContainer">

      {!currentAccount ? 
          <button className="waveButton" onClick={connectWallet}>
            Connecter votre Wallet
          </button>
          : <div className='connected'>Vous êtes connectés</div>
        }
        <div className="header">
          Envoyer un message sur le réseau Rinkeby
        </div>

        <div className="bio">
         Envoyer un message publique à <a href="https://github.com/xpt300" className="link">Maxime</a>. Ceci est une app de test pour apprendre à créer un "smart contract".
        </div>

         <textarea rows="4"
         className="textArea"
         placeholder="Ton message"
         onFocus={() => setInputFocus(true)}
         onBlur={() => setInputFocus(false)}
         style={{borderColor: inputFocus && message.length > 280 ? '#F32013' : inputFocus ? '#63b3ed' : 'white'}}
          value={message}
          onChange={(message) => setMessage(message.target.value)}
        />
        <div className="boxLength">
          <p className="length"><span style={{color: message.length <= 280 ? "white" : "#F32013"}}>{message.length}</span> / 280</p>
        </div>

        <button className={message.length > 280 || message.length === 0 ? "disabledSendButton" : "sendButton"} onClick={wave} disabled={message.length > 280 || message.length === 0}>
          Send
        </button>

            <div className="table" style={{ marginTop: "16px", padding: "8px" }}>
              <div className="tableHeading">WALLET</div>
              <div className="tableHeading">MESSAGE</div>
              <div className="tableHeading">DATE</div>
        {allWaves.map((wave, index) => {
          return (
            <Fragment key={index}>
                <div className="tableMessage">{wave.address.slice(0, 4)}...{wave.address.substr(wave.address.length - 2)}</div>
                <div className="tableMessage">{wave.message}</div>
                <div className="tableMessage">{moment(wave.timestamp.toString()).format('MM/DD/YYYY, HH:mm:ss')}</div>
            </Fragment>
          )
        })}
    </div>
      </div>
    </div>
  );
}
