import { MessagingConnection } from '@easy-rtc/react';
import React, { useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Connection } from './connection';

function App() {
  const [connections, setConnections] = useState<MessagingConnection[]>(() => [
    new MessagingConnection({ minification: true }),
  ]);

  return (
    <React.Fragment>
      {connections.map((connection, index) => (
        <Connection connection={connection} key={index} />
      ))}
      <div style={{ backgroundColor: '#e8fbe8', margin: 8, padding: 8 }}>
        <button
          type="button"
          onClick={() => {
            setConnections([...connections, new MessagingConnection({ minification: true })]);
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
