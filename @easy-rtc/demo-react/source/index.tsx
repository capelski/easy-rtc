import React, { useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Connection } from './connection';

function App() {
  // Simple way to render multiple Connection components
  const [connections, setConnections] = useState<number[]>([1]);

  return (
    <React.Fragment>
      {connections.map((value) => (
        <Connection key={value} />
      ))}
      <div style={{ backgroundColor: '#e8fbe8', margin: 8, padding: 8 }}>
        <button
          type="button"
          onClick={() => {
            setConnections([...connections, connections.length + 1]);
          }}
        >
          Add connection
        </button>
      </div>
    </React.Fragment>
  );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
