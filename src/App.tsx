import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ref, getDatabase } from 'firebase/database';
import { useList } from 'react-firebase-hooks/database';
import { initializeApp } from 'firebase/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';

const firebaseConfig = {
  databaseURL: "https://testproj-jeffdt-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  return (
    <div>
      <DatabaseList />
    </div>
  );
}

const slots = [0, 1, 2, 3, 4];

const DatabaseList = () => {
  const [snapshots, loading, error] = useList(ref(database, 'games/test/grid'));

  return (
    <div className="box">
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span>}
      {!loading && snapshots && (
        <Container fluid>

          {slots.map((r) => (
            <Row>
              {slots.map((c) => (
                <Col>
                  {/* Set the background color if it is revealed */}
                  {JSON.stringify(snapshots[r * 5 + c]) + `${r}/${c}`}
                </Col>
              ))}

            </Row>
          ))}

        </Container>
      )}
    </div>
  );
};

export default App;
