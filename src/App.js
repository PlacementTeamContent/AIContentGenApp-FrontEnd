import { Route, Routes, BrowserRouter } from "react-router-dom";

import LoginForm from "./components/LoginForm/login";
import Home from "./components/HomePage/home";
import CodeAnalysis from "./components/CodeAnalysis/codeAnalysis";
import CodingReplication from "./components/CodingReplication/codingReplication";
import Theoretical from "./components/Theoretical/theoretical";
import TheoreticalCodeSnippet from "./components/TheoreticalCodeSnippet/TheoreticalCodeSnippet";
import ContextCoding from "./components/ContextCoding/contextCoding";

import ContentLoop from "./components/ContentLoop/ContentLoop";
import './App.css'; // Import your main CSS file
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
</style>

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/" element={<Home />} />
                <Route path="/CodeAnalysis" element={<CodeAnalysis />} />
                <Route path='/CodingReplication' element={<ContentLoop />} />
                <Route path="/Theoretical" element={<Theoretical />} />
                <Route path="/TheoreticalCodeSnippetMCQS" element={<TheoreticalCodeSnippet/>} />
                <Route path="/ContextCoding" element ={<ContextCoding/>}/>
                <Route path="*" element={<ContentLoop />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

