import { useState } from 'react';
import './App.css';

function App() {
  const [pledged, setPledged] = useState(0);
  const goal = 1000;
  const progress = Math.min((pledged / goal) * 100, 100);

  const handlePledge = () => {
    // In a real app, this would trigger a Soroban smart contract interaction
    setPledged((prev) => prev + 500);
    alert('Mock Pledge successful! In production, this interacts with Soroban smart contracts.');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>PledgeLock</h1>
        <p className="subtitle">Trustless, All-Or-Nothing Crowdfunding</p>
        <button className="connect-wallet">Connect Freighter</button>
      </header>

      <main className="main-content">
        <section className="campaign-card">
          <div className="campaign-image-placeholder">
            <span className="image-text">Lagos Flooded Clinic Rebuild</span>
          </div>
          
          <div className="campaign-details">
            <h2>Rebuild the Lagos Community Clinic</h2>
            <p className="organizer">By: Blessing A. (Unbanked Organizer)</p>
            <p className="description">
              Our clinic was destroyed in the recent floods. We need capital to rebuild, but lack 
              a Western bank account. Pledge XLM via Soroban smart contracts. If we reach our goal 
              by Friday, funds are disbursed. If not, 100% is refunded to donors automatically.
            </p>

            <div className="progress-section">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="stats">
                <span className="raised">{pledged} XLM Raised</span>
                <span className="goal">Goal: {goal} XLM</span>
              </div>
            </div>

            <div className="action-section">
              <button className="pledge-button" onClick={handlePledge}>
                Pledge 500 XLM
              </button>
              <p className="guarantee-text">
                🔒 mathematically guaranteed 100% refund if goal is missed.
              </p>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <h3>Borderless</h3>
            <p>Native XLM allows instant sub-cent global transfers.</p>
          </div>
          <div className="feature">
            <h3>Trustless Escrow</h3>
            <p>Smart contracts lock funds until the deadline. No intermediaries.</p>
          </div>
          <div className="feature">
            <h3>Zero Extractive Fees</h3>
            <p>100% of capital goes to the organizer or back to donors.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
