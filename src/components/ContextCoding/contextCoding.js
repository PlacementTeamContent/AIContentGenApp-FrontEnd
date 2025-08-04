import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '../Navbar/navbar';
import { authFetch } from "../../utils/authFetch";
import { useAuthGuard } from "../../utils/useAuthGuard";
import './contextCoding.css';

const ContextEditor = () => {
  useAuthGuard();
  const [context, setContext] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [subtopic, setsubtopic] = useState('');
  const [contexts, setContexts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvResponse, setcsvResponse] = useState("");

  console.log(contexts);

  const handleAddContext = () => {
    if (!context || !difficulty || !subtopic) return alert('Fill all fields');

    if (editId) {
      setContexts((prev) =>
        prev.map((item) =>
          item.id === editId
            ? { ...item, context, difficulty, subtopic }
            : item
        )
      );
      setEditId(null);
    } else {
      const newEntry = {
        id: uuidv4(),
        context,
        difficulty,
        subtopic,
      };
      setContexts([...contexts, newEntry]);
    }

    setContext('');
    setDifficulty('');
    setsubtopic('');
  };

  const handleEdit = (id) => {
    const item = contexts.find((item) => item.id === id);
    setContext(item.context);
    setDifficulty(item.difficulty);
    setsubtopic(item.subtopic);
    setEditId(id);
  };

  const handleDelete = (id) => {
    setContexts(contexts.filter((item) => item.id !== id));
  };

  const sendContexts = async () => {
    const contextsToSend = contexts.map(({ id, ...rest }) => rest);
    console.log("Sending contexts:", contextsToSend);

    const apiUrl = 'https://ravik00111110.pythonanywhere.com/api/content-gen/curate/';

    setLoading(true);

    try {
      const response = await authFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contexts: contextsToSend
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send data. Server responded with: ${errorText}`);
      }

      const data = await response.json();
      console.log(data)
      setcsvResponse(data.csv_content); 

    } catch (error) {
      console.error('Error sending data:', error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!csvResponse) return;

    const byteCharacters = atob(csvResponse);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const byteArray = new Uint8Array(1024);
      for (let i = 0; i < 1024 && offset + i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(offset + i);
      }
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'generated-coding-content.csv';
    link.click();
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="input-section">
          <textarea
            placeholder="Write down question context..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <input
            placeholder="Select difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
          <input
            placeholder="Select Sub Topic"
            value={subtopic}
            onChange={(e) => setsubtopic(e.target.value)}
          />
          <button onClick={handleAddContext}>
            {editId ? 'Save Changes' : 'Add Context'}
          </button>
        </div>

        <div className="context-list">
          <div className="right-top-cont">
            {contexts.map((item) => (
              <div key={item.id} className="context-card">
                <div>
                  <strong>{item.context.slice(0, 40)}...</strong>
                  <div>
                    {item.difficulty.toUpperCase()} &nbsp; {item.subtopic.toUpperCase()}
                  </div>
                </div>
                <div className="actions">
                  <button onClick={() => handleEdit(item.id)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="delete">✕</button>
                </div>
              </div>
            ))}
          </div>

          <button className="generate-button" onClick={sendContexts}>
            {loading ? 'Generating content...' : 'Generate For These Contexts'}
          </button>
        </div>
      </div>

      <div className="button-cont">
        <button className="download-button" onClick={downloadCsv}>
          Download CSV
        </button>
      </div>
    </>
  );
};

export default ContextEditor;
